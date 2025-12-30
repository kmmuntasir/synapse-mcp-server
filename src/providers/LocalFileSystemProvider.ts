import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';
import path from 'path';
import { KBProvider, FileSystemEntry, SearchResult, ReadResult, FileInfo, ReadOptions } from './interfaces.js';
import { MAX_MCP_RESPONSE_SIZE, DEFAULT_MAX_LINES, MAX_REQUESTED_LINES, STREAMING_THRESHOLD, STREAM_BUFFER_SIZE } from '../config/constants.js';
import { validateReadOptions } from './utils/validation.js';
import { extractMatches } from './utils/search.js';
import { PathResolver } from './local/PathResolver.js';
import { FileSystemWalker } from './local/FileSystemWalker.js';
import { FileStreamReader } from './local/FileStreamReader.js';

export class LocalFileSystemProvider implements KBProvider {
    private pathResolver: PathResolver;
    private fileWalker: FileSystemWalker;

    constructor(rootPaths: string | string[]) {
        this.pathResolver = new PathResolver(rootPaths);
        this.fileWalker = new FileSystemWalker(this.pathResolver.getRootPaths());
    }

    async list(relativePath: string = ''): Promise<FileSystemEntry[]> {
        const allEntries: FileSystemEntry[] = [];
        const seenPaths = new Set<string>();
        const rootPaths = this.pathResolver.getRootPaths();

        for (const root of rootPaths) {
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
        validateReadOptions(options);

        // Find the first root that actually contains this file
        const { absolutePath } = this.pathResolver.resolvePath(relativePath);
        const stats = await fs.stat(absolutePath).catch(() => null);
        
        if (!stats || !stats.isFile()) {
            throw new Error(`File not found: ${relativePath}`);
        }

        const fileSize = stats.size;
        const maxSize = options?.maxResponseSize || MAX_MCP_RESPONSE_SIZE;

        // Always use pagination - default to DEFAULT_MAX_LINES if not specified
        const startLine = options?.startLine ?? 1;
        const maxLines = options?.maxLines ?? options?.endLine ?? DEFAULT_MAX_LINES;
        const actualEndLine = options?.endLine ?? (startLine + maxLines - 1);

        // Use streaming read for all files
        // Count total lines for small files during streaming to avoid double read
        const { content, totalLines } = await FileStreamReader.readPartialStreaming(
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

    async search(query: string): Promise<SearchResult[]> {
        return this.fileWalker.search(query);
    }

    async getFileInfo(relativePath: string): Promise<FileInfo> {
        const { absolutePath } = this.pathResolver.resolvePath(relativePath);
        const stats = await fs.stat(absolutePath).catch(() => null);
        
        if (!stats || !stats.isFile()) {
            throw new Error(`File not found: ${relativePath}`);
        }

        const extension = path.extname(absolutePath).slice(1);
        let lineCount: number | undefined;

        // Count lines for text files only (with size limit)
        // Use streaming to avoid reading entire file into memory
        if (stats.size < STREAMING_THRESHOLD) {
            lineCount = await FileStreamReader.countLinesStreaming(absolutePath);
        }

        return {
            path: relativePath,
            size: stats.size,
            lineCount,
            fileType: extension,
            lastModified: stats.mtime,
        };
    }
}
