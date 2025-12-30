import fs from 'fs/promises';
import path from 'path';
import { SearchResult } from '../interfaces.js';
import { extractMatches } from '../utils/search.js';

/**
 * Walks the filesystem and searches for matches in markdown files
 */
export class FileSystemWalker {
    private rootPaths: string[];

    constructor(rootPaths: string[]) {
        this.rootPaths = rootPaths;
    }

    /**
     * Searches for a query across all markdown files in root paths
     */
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
                        const matches = extractMatches(content, lowerQuery);
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
}
