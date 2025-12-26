import { Octokit } from 'octokit';
import { KBProvider, FileSystemEntry, SearchResult, ReadResult, ReadOptions, FileInfo } from './interfaces.js';
import {
    MAX_MCP_RESPONSE_SIZE,
    MAX_GITHUB_FILE_SIZE,
    DEFAULT_MAX_LINES,
    MAX_REQUESTED_LINES,
    STREAMING_THRESHOLD,
    GITHUB_CACHE_TTL
} from '../config/constants.js';

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
    private contentCache = new Map<string, { content: string; timestamp: number }>();
    private commitDateCache = new Map<string, { date: Date; timestamp: number }>();
    private readonly CACHE_TTL = GITHUB_CACHE_TTL;

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

    async read(path: string, options?: ReadOptions): Promise<ReadResult> {
        this.validateReadOptions(options);
        const fullPath = this.joinPath(path);
        
        try {
            // Check cache first to avoid redundant API calls
            let content: string;
            let fileSize: number;
            
            const cached = this.contentCache.get(fullPath);
            const now = Date.now();
            
            if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
                content = cached.content;
                fileSize = Buffer.byteLength(content, 'utf8');
            } else {
                // Single API call to get file metadata and content
                const { data } = await this.octokit.rest.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path: fullPath,
                    headers: {
                        accept: 'application/vnd.github.v3.raw',
                    },
                });

                fileSize = (data as any).size || 0;

                // Validate file size against GitHub limit
                if (fileSize > MAX_GITHUB_FILE_SIZE) {
                    throw new Error(
                        `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds GitHub API limit of ${MAX_GITHUB_FILE_SIZE / 1024 / 1024}MB`
                    );
                }

                content = data as unknown as string;
                // Cache the content for future use
                this.contentCache.set(fullPath, { content, timestamp: now });
            }
            const totalLines = content.split(/\r?\n/).length;

            // Always use pagination - default to DEFAULT_MAX_LINES if not specified
            const startLine = options?.startLine ?? 1;
            const maxLines = options?.maxLines ?? options?.endLine ?? DEFAULT_MAX_LINES;
            const actualEndLine = options?.endLine ?? (startLine + maxLines - 1);
            const maxSize = options?.maxResponseSize || MAX_MCP_RESPONSE_SIZE;

            // Slice content based on pagination parameters
            let resultContent = this.sliceContent(content, startLine, actualEndLine);

            // Validate response size
            const responseSize = Buffer.byteLength(resultContent, 'utf8');
            if (responseSize > maxSize) {
                throw new Error(
                    `Response size (${(responseSize / 1024 / 1024).toFixed(2)}MB) exceeds MCP transport limit of ${maxSize / 1024 / 1024}MB. ` +
                    `Try requesting fewer lines or a smaller line range.`
                );
            }

            return {
                content: resultContent,
                metadata: {
                    totalLines,
                    startLine,
                    endLine: actualEndLine,
                    isPartial: true, // Always partial now
                    fileSize,
                },
            };
        } catch (error) {
            console.error(`GitHub read error (${this.owner}/${this.repo} @ ${fullPath}):`, error);
            throw error;
        }
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

    private sliceContent(content: string, startLine: number = 1, endLine?: number): string {
        const lines = content.split(/\r?\n/);
        const start = Math.max(0, startLine - 1);
        const end = endLine !== undefined ? Math.min(lines.length, endLine) : lines.length;

        if (start >= lines.length) return '';
        return lines.slice(start, end).join('\n');
    }

    /**
     * Fetches file content with caching support
     */
    private async getFileContent(path: string): Promise<string> {
        const cached = this.contentCache.get(path);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached.content;
        }

        const { data } = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path,
            headers: {
                accept: 'application/vnd.github.v3.raw',
            },
        });

        const content = data as unknown as string;
        this.contentCache.set(path, { content, timestamp: now });

        return content;
    }

    /**
     * Extracts matches with line numbers from file content
     * Similar to LocalFileSystemProvider.extractMatches()
     */
    private extractMatchesWithLineNumbers(
        content: string,
        query: string,
        contextRows: number = 1
    ): Array<{ line: number; content: string }> {
        const lines = content.split(/\r?\n/);
        const matches: Array<{ line: number; content: string }> = [];
        const lowerQuery = query.toLowerCase();

        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(lowerQuery)) {
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

            // Process results with line number calculation
            const results: SearchResult[] = [];

            for (const item of data.items) {
                // Remove basePath from the returned path for consistency
                let relativePath = item.path;
                if (this.basePath && relativePath.startsWith(this.basePath)) {
                    relativePath = relativePath.slice(this.basePath.length).replace(/^\/+/, '');
                }

                try {
                    // Fetch file content to calculate line numbers
                    const content = await this.getFileContent(item.path);
                    const matches = this.extractMatchesWithLineNumbers(content, query);

                    results.push({
                        path: relativePath,
                        matches: matches.length > 0 ? matches : [{ line: -1, content: `Match found in ${relativePath}` }],
                    });
                } catch (fetchError) {
                    console.error(`Failed to fetch file content for ${item.path}:`, fetchError);
                    // Fallback to GitHub API fragment without line numbers
                    const matches: Array<{ line: number; content: string }> = [];
                    if (item.text_matches) {
                        item.text_matches.forEach((match: any) => {
                            matches.push({
                                line: -1,
                                content: match.fragment,
                            });
                        });
                    }
                    results.push({
                        path: relativePath,
                        matches: matches.length > 0 ? matches : [{ line: -1, content: `Match found in ${relativePath}` }],
                    });
                }
            }

            return results;
        } catch (error) {
            console.error(`GitHub search error (${this.owner}/${this.repo} @ path:${this.basePath}):`, error);
            return [];
        }
    }

    async getFileInfo(path: string): Promise<FileInfo> {
        const fullPath = this.joinPath(path);
        try {
            // Check cache first to avoid redundant API calls
            let content: string;
            let fileSize: number;
            
            const cached = this.contentCache.get(fullPath);
            const now = Date.now();
            
            if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
                content = cached.content;
                fileSize = Buffer.byteLength(content, 'utf8');
            } else {
                // Single API call to get raw content and metadata
                const { data } = await this.octokit.rest.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path: fullPath,
                    headers: {
                        accept: 'application/vnd.github.v3.raw',
                    },
                });

                content = data as unknown as string;
                fileSize = Buffer.byteLength(content, 'utf8');

                // Validate file size
                if (fileSize > MAX_GITHUB_FILE_SIZE) {
                    throw new Error(
                        `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds GitHub API limit of ${MAX_GITHUB_FILE_SIZE / 1024 / 1024}MB`
                    );
                }

                // Cache the content for future use
                this.contentCache.set(fullPath, { content, timestamp: now });
            }

            const extension = fullPath.split('.').pop() || '';
            let lineCount: number | undefined;

            // Count lines for small files (using the already-fetched content)
            if (fileSize < STREAMING_THRESHOLD) {
                lineCount = content.split(/\r?\n/).length;
            }

            // Get the last modified date from the latest commit (with caching)
            let lastModified = new Date();
            try {
                // Check cache first
                const cachedCommit = this.commitDateCache.get(fullPath);
                const now = Date.now();
                
                if (cachedCommit && (now - cachedCommit.timestamp) < this.CACHE_TTL) {
                    lastModified = cachedCommit.date;
                } else {
                    const { data: commitData } = await this.octokit.rest.repos.getCommit({
                        owner: this.owner,
                        repo: this.repo,
                        ref: 'HEAD',
                        path: fullPath,
                    });
                    lastModified = new Date(
                        commitData.commit.committer?.date ||
                        commitData.commit.author?.date ||
                        Date.now()
                    );
                    // Cache the commit date
                    this.commitDateCache.set(fullPath, { date: lastModified, timestamp: now });
                }
            } catch (commitError) {
                console.error(`Could not fetch commit date for ${fullPath}:`, commitError);
                // Fall back to current time if commit fetch fails
            }

            return {
                path,
                size: fileSize,
                lineCount,
                fileType: extension,
                lastModified,
            };
        } catch (error) {
            console.error(`GitHub getFileInfo error (${this.owner}/${this.repo} @ ${fullPath}):`, error);
            throw error;
        }
    }
}
