import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';
import path from 'path';
import { KBProvider, FileSystemEntry, SearchResult, ReadResult, FileInfo, ReadOptions } from './interfaces.js';
import { MAX_MCP_RESPONSE_SIZE, DEFAULT_MAX_LINES, MAX_REQUESTED_LINES, STREAMING_THRESHOLD, STREAM_BUFFER_SIZE } from '../config/constants.js';

export class LocalFileSystemProvider implements KBProvider {
    private rootPaths: string[];

    constructor(rootPaths: string | string[]) {
        const paths = Array.isArray(rootPaths) ? rootPaths : [rootPaths];
        this.rootPaths = paths.map(p => path.resolve(p));
    }

    private resolvePath(relativePath: string = ''): { absolutePath: string; rootPath: string } {
        // If relativePath is empty, we refer to the "unified root", which doesn't have a single absolute counterpart.
        // However, for single-file operations (read), we need to find which root contains the file.

        for (const root of this.rootPaths) {
            const resolved = path.resolve(root, relativePath);
            if (resolved.startsWith(root)) {
                // Double check if it exists if it's not a generic listing
                return { absolutePath: resolved, rootPath: root };
            }
        }
        throw new Error(`Access denied: Path ${relativePath} is outside all allowed root directories.`);
    }

    async list(relativePath: string = ''): Promise<FileSystemEntry[]> {
        const allEntries: FileSystemEntry[] = [];
        const seenPaths = new Set<string>();

        for (const root of this.rootPaths) {
            try {
                const absolutePath = path.resolve(root, relativePath);
                if (!absolutePath.startsWith(root)) continue;

                const stats = await fs.stat(absolutePath).catch(() => null);
                if (!stats || !stats.isDirectory()) continue;

                const entries = await fs.readdir(absolutePath, { withFileTypes: true });

                for (const entry of entries) {
                    const entryRelativePath = path.relative(root, path.join(absolutePath, entry.name)).replace(/\\/g, '/');
                    if (!seenPaths.has(entryRelativePath)) {
                        allEntries.push({
                            name: entry.name,
                            type: entry.isDirectory() ? 'directory' : 'file',
                            path: entryRelativePath,
                        });
                        seenPaths.add(entryRelativePath);
                    }
                }
            } catch (error) {
                // Skip roots that don't have this sub-directory
                continue;
            }
        }

        return allEntries;
    }

    async read(relativePath: string, options?: ReadOptions): Promise<ReadResult> {
        this.validateReadOptions(options);

        // Find the first root that actually contains this file
        for (const root of this.rootPaths) {
            const absolutePath = path.resolve(root, relativePath);
            if (!absolutePath.startsWith(root)) continue;

            const stats = await fs.stat(absolutePath).catch(() => null);
            if (!stats || !stats.isFile()) continue;

            const fileSize = stats.size;
            const maxSize = options?.maxResponseSize || MAX_MCP_RESPONSE_SIZE;

            // Always use pagination - default to DEFAULT_MAX_LINES if not specified
            const startLine = options?.startLine ?? 1;
            const maxLines = options?.maxLines ?? options?.endLine ?? DEFAULT_MAX_LINES;
            const actualEndLine = options?.endLine ?? (startLine + maxLines - 1);

            // Use streaming read for all files
            // Count total lines for small files during streaming to avoid double read
            const { content, totalLines } = await this.readPartialStreaming(
                absolutePath,
                startLine,
                actualEndLine,
                maxSize,
                fileSize < STREAMING_THRESHOLD
            );

            return {
                content,
                metadata: {
                    totalLines,
                    startLine,
                    endLine: actualEndLine,
                    isPartial: true, // Always partial now
                    fileSize,
                },
            };
        }

        throw new Error(`File not found: ${relativePath}`);
    }

    private validateReadOptions(options?: ReadOptions): void {
        if (!options) {
            return;
        }

        if (options.startLine !== undefined && options.startLine < 1) {
            throw new Error('startLine must be >= 1');
        }

        if (options.endLine !== undefined && options.endLine < 1) {
            throw new Error('endLine must be >= 1');
        }

        if (options.maxLines !== undefined && options.maxLines < 1) {
            throw new Error('maxLines must be >= 1');
        }

        if (options.endLine !== undefined && options.maxLines !== undefined) {
            throw new Error('Cannot specify both endLine and maxLines');
        }

        if (options.startLine !== undefined && options.endLine !== undefined && options.endLine < options.startLine) {
            throw new Error('endLine must be >= startLine');
        }

        // Enforce maximum requested lines
        const requestedLines = options.maxLines ?? (options.endLine && options.startLine
            ? options.endLine - options.startLine + 1
            : undefined);
        
        if (requestedLines !== undefined && requestedLines > MAX_REQUESTED_LINES) {
            throw new Error(`Cannot request more than ${MAX_REQUESTED_LINES} lines in a single read`);
        }

        // Validate maxResponseSize
        if (options.maxResponseSize !== undefined && options.maxResponseSize < 1024) {
            throw new Error('maxResponseSize must be at least 1KB');
        }
    }

    private async readPartialStreaming(
        absolutePath: string,
        startLine: number = 1,
        endLine?: number,
        maxResponseSize?: number,
        countAllLines: boolean = false
    ): Promise<{ content: string; totalLines?: number }> {
        const maxSize = maxResponseSize || MAX_MCP_RESPONSE_SIZE;
        const result: string[] = [];
        let lineCount = 0;
        let currentSize = 0;
        let responseSize = 0;
        let totalLines: number | undefined;
        let streamError: Error | null = null;

        const fileStream = createReadStream(absolutePath, {
            encoding: 'utf8',
            highWaterMark: STREAM_BUFFER_SIZE
        });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        // Handle stream errors and propagate them
        fileStream.on('error', (error) => {
            console.error(`File stream error: ${error.message}`);
            streamError = error;
            rl.close();
        });

        try {
            for await (const line of rl) {
                // Check if a stream error occurred
                if (streamError) {
                    throw streamError;
                }
                
                lineCount++;
                
                // Count total lines if requested
                if (countAllLines) {
                    totalLines = lineCount;
                }
                
                // Check if we've reached the start line
                if (lineCount < startLine) {
                    continue;
                }

                // Check if we've exceeded the end line
                if (endLine !== undefined && lineCount > endLine) {
                    break;
                }

                // Calculate the size of this line (including newline)
                const lineSize = Buffer.byteLength(line + '\n', 'utf8');
                
                // Check if adding this line would exceed the response size limit
                if (responseSize + lineSize > maxSize) {
                    console.error(
                        `Response size limit (${maxSize / 1024 / 1024}MB) reached at line ${lineCount}. ` +
                        `Current size: ${(responseSize / 1024 / 1024).toFixed(2)}MB, ` +
                        `Next line would add: ${(lineSize / 1024).toFixed(2)}KB`
                    );
                    break;
                }

                result.push(line);
                responseSize += lineSize;
                currentSize += lineSize;

                // Safety check: prevent runaway reads
                if (lineCount > MAX_REQUESTED_LINES) {
                    console.error(`Maximum line limit (${MAX_REQUESTED_LINES}) reached`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error reading file ${absolutePath}:`, error);
            throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            rl.close();
            fileStream.destroy();
        }

        return { content: result.join('\n'), totalLines };
    }

    async search(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();
        const seenFiles = new Set<string>();

        const walk = async (currentDir: string, root: string) => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

                if (entry.isDirectory()) {
                    await walk(fullPath, root);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    if (seenFiles.has(relativePath)) continue;

                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (content.toLowerCase().includes(lowerQuery)) {
                        const matches = this.extractMatches(content, lowerQuery);
                        results.push({
                            path: relativePath,
                            matches,
                        });
                        seenFiles.add(relativePath);
                    }
                }
            }
        };

        for (const root of this.rootPaths) {
            try {
                await walk(root, root);
            } catch (error) {
                console.error(`Error walking root ${root}:`, error);
            }
        }
        return results;
    }

    private extractMatches(content: string, query: string, contextRows: number = 1): Array<{ line: number; content: string }> {
        const lines = content.split(/\r?\n/);
        const matches: Array<{ line: number; content: string }> = [];

        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query)) {
                const start = Math.max(0, index - contextRows);
                const end = Math.min(lines.length, index + contextRows + 1);
                const snippet = lines.slice(start, end).join('\n');
                matches.push({
                    line: index + 1, // 1-based index
                    content: snippet,
                });
            }
        });

        return matches.slice(0, 5); // Limit to 5 matches per file
    }

    async getFileInfo(relativePath: string): Promise<FileInfo> {
        for (const root of this.rootPaths) {
            const absolutePath = path.resolve(root, relativePath);
            if (!absolutePath.startsWith(root)) continue;

            const stats = await fs.stat(absolutePath).catch(() => null);
            if (!stats || !stats.isFile()) continue;

            const extension = path.extname(absolutePath).slice(1);
            let lineCount: number | undefined;

            // Count lines for text files only (with size limit)
            // Use streaming to avoid reading the entire file into memory
            if (stats.size < STREAMING_THRESHOLD) {
                lineCount = await this.countLinesStreaming(absolutePath);
            }

            return {
                path: relativePath,
                size: stats.size,
                lineCount,
                fileType: extension,
                lastModified: stats.mtime,
            };
        }

        throw new Error(`File not found: ${relativePath}`);
    }

    /**
     * Counts lines in a file using streaming to avoid loading entire file into memory
     */
    private async countLinesStreaming(absolutePath: string): Promise<number> {
        const fileStream = createReadStream(absolutePath, {
            encoding: 'utf8',
            highWaterMark: STREAM_BUFFER_SIZE
        });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let lineCount = 0;

        try {
            for await (const _line of rl) {
                lineCount++;
            }
        } catch (error) {
            console.error(`Error counting lines in ${absolutePath}:`, error);
            throw error;
        } finally {
            rl.close();
            fileStream.destroy();
        }

        return lineCount;
    }
}
