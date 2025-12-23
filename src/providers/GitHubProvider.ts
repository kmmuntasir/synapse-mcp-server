import { Octokit } from 'octokit';
import { KBProvider, FileSystemEntry, SearchResult } from './interfaces.js';

/**
 * A simple throttler for GitHub Search API (30 requests per minute).
 */
class GitHubSearchThrottler {
    private lastRequests: number[] = [];
    private readonly LIMIT = 30;
    private readonly WINDOW = 60 * 1000; // 1 minute

    async waitIfNecessary(): Promise<void> {
        const now = Date.now();
        this.lastRequests = this.lastRequests.filter(time => now - time < this.WINDOW);

        if (this.lastRequests.length >= this.LIMIT) {
            const oldest = this.lastRequests[0];
            const waitTime = this.WINDOW - (now - oldest) + 500; // Add small buffer
            console.error(`GitHub Search rate limit approaching. Waiting ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.waitIfNecessary(); // Re-check after waiting
        }

        this.lastRequests.push(Date.now());
    }
}

const searchThrottler = new GitHubSearchThrottler();

export class GitHubProvider implements KBProvider {
    private octokit: Octokit;
    private owner: string;
    private repo: string;
    private basePath: string;

    constructor(owner: string, repo: string, token: string, basePath: string = '') {
        this.owner = owner;
        this.repo = repo;
        this.octokit = new Octokit({ auth: token });
        this.basePath = basePath.replace(/^\/+|\/+$/g, '');
    }

    private joinPath(path: string): string {
        if (!this.basePath) return path;
        const normalizedPath = path.replace(/^\/+|\/+$/g, '');
        return normalizedPath ? `${this.basePath}/${normalizedPath}` : this.basePath;
    }

    async list(path: string = ''): Promise<FileSystemEntry[]> {
        const fullPath = this.joinPath(path);
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: fullPath,
            });

            if (!Array.isArray(data)) {
                return [];
            }

            return data.map(item => ({
                name: item.name,
                type: item.type === 'dir' ? 'directory' : 'file',
                path: item.path.startsWith(this.basePath)
                    ? item.path.slice(this.basePath.length).replace(/^\/+/, '')
                    : item.path,
            }));
        } catch (error) {
            console.error(`GitHub list error (${this.owner}/${this.repo} @ ${fullPath}):`, error);
            throw error;
        }
    }

    async read(path: string): Promise<string> {
        const fullPath = this.joinPath(path);
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: fullPath,
                headers: {
                    accept: 'application/vnd.github.v3.raw',
                },
            });

            return data as unknown as string;
        } catch (error) {
            console.error(`GitHub read error (${this.owner}/${this.repo} @ ${fullPath}):`, error);
            throw error;
        }
    }

    async search(query: string): Promise<SearchResult[]> {
        await searchThrottler.waitIfNecessary();

        try {
            // Include path qualifier if basePath is set
            let q = `${query} repo:${this.owner}/${this.repo} extension:md`;
            if (this.basePath) {
                q += ` path:${this.basePath}`;
            }

            const { data } = await this.octokit.rest.search.code({
                q,
                headers: {
                    accept: 'application/vnd.github.v3.text-match+json',
                },
            });

            return data.items.map((item: any) => {
                const matches: string[] = [];
                if (item.text_matches) {
                    item.text_matches.forEach((match: any) => {
                        matches.push(match.fragment);
                    });
                }

                // Remove basePath from the returned path for consistency
                let relativePath = item.path;
                if (this.basePath && relativePath.startsWith(this.basePath)) {
                    relativePath = relativePath.slice(this.basePath.length).replace(/^\/+/, '');
                }

                return {
                    path: relativePath,
                    matches: matches.length > 0 ? matches : [`Match found in ${relativePath}`],
                };
            });
        } catch (error) {
            console.error(`GitHub search error (${this.owner}/${this.repo} @ path:${this.basePath}):`, error);
            return [];
        }
    }
}
