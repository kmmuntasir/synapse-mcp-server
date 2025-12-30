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
import { validateReadOptions } from './utils/validation.js';
import { extractMatches } from './utils/search.js';
import { GitHubSearchThrottler } from './github/GitHubSearchThrottler.js';
import { GitHubCache, CachedContent, CachedCommitDate } from './github/GitHubCache.js';
import { joinPath, removeBasePath } from './github/GitHubPathUtils.js';

const searchThrottler = new GitHubSearchThrottler();

export class GitHubProvider implements KBProvider {
    private octokit: Octokit;
    private owner: string;
    private repo: string;
    private basePath: string;
    private cache: GitHubCache;

    constructor(owner: string, repo: string, token: string, basePath: string = '') {
        this.owner = owner;
        this.repo = repo;
        this.octokit = new Octokit({ auth: token });
        this.basePath = basePath.replace(/^\/+|\/+$/g, '');
        this.cache = new GitHubCache();
    }

    async list(path: string = ''): Promise<FileSystemEntry[]> {
        const fullPath = joinPath(this.basePath, path);
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
                path: removeBasePath(item.path, this.basePath),
            }));
        } catch (error) {
            console.error(`GitHub list error (${this.owner}/${this.repo} @ ${fullPath}):`, error);
            throw error;
        }
    }

    async read(path: string, options?: ReadOptions): Promise<ReadResult> {
        validateReadOptions(options);
        const fullPath = joinPath(this.basePath, path);
        
        try {
            // Check cache first to avoid redundant API calls
            let content: string;
            let fileSize: number;
            
            const cached = this.cache.getContent(fullPath);
            
            if (cached) {
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
                // Cache content for future use
                this.cache.setContent(fullPath, content);
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
        const cached = this.cache.getContent(path);
        
        if (cached) {
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
        this.cache.setContent(path, content);

        return content;
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
                // Remove basePath from returned path for consistency
                let relativePath = removeBasePath(item.path, this.basePath);

                try {
                    // Fetch file content to calculate line numbers
                    const content = await this.getFileContent(item.path);
                    const matches = extractMatches(content, query);

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
        const fullPath = joinPath(this.basePath, path);
        try {
            // Check cache first to avoid redundant API calls
            let content: string;
            let fileSize: number;
            
            const cached = this.cache.getContent(fullPath);
            
            if (cached) {
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

                // Cache content for future use
                this.cache.setContent(fullPath, content);
            }

            const extension = fullPath.split('.').pop() || '';
            let lineCount: number | undefined;

            // Count lines for small files (using already-fetched content)
            if (fileSize < STREAMING_THRESHOLD) {
                lineCount = content.split(/\r?\n/).length;
            }

            // Get last modified date from latest commit (with caching)
            let lastModified = new Date();
            try {
                // Check cache first
                const cachedCommit = this.cache.getCommitDate(fullPath);
                
                if (cachedCommit) {
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
                    // Cache commit date
                    this.cache.setCommitDate(fullPath, lastModified);
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
