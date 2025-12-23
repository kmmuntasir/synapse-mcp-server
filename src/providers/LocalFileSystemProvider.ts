import fs from 'fs/promises';
import path from 'path';
import { KBProvider, FileSystemEntry, SearchResult } from './interfaces.js';

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

    async read(relativePath: string): Promise<string> {
        // Find the first root that actually contains this file
        for (const root of this.rootPaths) {
            const absolutePath = path.resolve(root, relativePath);
            if (!absolutePath.startsWith(root)) continue;

            try {
                const stats = await fs.stat(absolutePath);
                if (stats.isFile()) {
                    return await fs.readFile(absolutePath, 'utf-8');
                }
            } catch (error) {
                continue;
            }
        }
        throw new Error(`File not found: ${relativePath}`);
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

    private extractMatches(content: string, query: string, contextRows: number = 1): string[] {
        const lines = content.split(/\r?\n/);
        const matches: string[] = [];

        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query)) {
                const start = Math.max(0, index - contextRows);
                const end = Math.min(lines.length, index + contextRows + 1);
                const snippet = lines.slice(start, end).join('\n');
                matches.push(snippet);
            }
        });

        return matches.slice(0, 5); // Limit to 5 matches per file
    }
}
