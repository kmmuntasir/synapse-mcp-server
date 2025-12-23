import fs from 'fs/promises';
import path from 'path';
import { KBProvider, FileSystemEntry, SearchResult } from './interfaces.js';

export class LocalFileSystemProvider implements KBProvider {
    private rootPath: string;

    constructor(rootPath: string) {
        this.rootPath = path.resolve(rootPath);
    }

    private resolvePath(relativePath: string = ''): string {
        const resolved = path.resolve(this.rootPath, relativePath);
        if (!resolved.startsWith(this.rootPath)) {
            throw new Error(`Access denied: Path ${relativePath} is outside root directory.`);
        }
        return resolved;
    }

    async list(relativePath: string = ''): Promise<FileSystemEntry[]> {
        const absolutePath = this.resolvePath(relativePath);
        const entries = await fs.readdir(absolutePath, { withFileTypes: true });

        return entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.relative(this.rootPath, path.join(absolutePath, entry.name)).replace(/\\/g, '/'),
        }));
    }

    async read(relativePath: string): Promise<string> {
        const absolutePath = this.resolvePath(relativePath);
        const stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) {
            throw new Error(`Cannot read directory: ${relativePath}`);
        }
        return await fs.readFile(absolutePath, 'utf-8');
    }

    async search(query: string): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        const walk = async (currentDir: string) => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                const relativePath = path.relative(this.rootPath, fullPath).replace(/\\/g, '/');

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (content.toLowerCase().includes(lowerQuery)) {
                        const matches = this.extractMatches(content, lowerQuery);
                        results.push({
                            path: relativePath,
                            matches,
                        });
                    }
                }
            }
        };

        await walk(this.rootPath);
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
