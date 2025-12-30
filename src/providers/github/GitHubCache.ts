import { GITHUB_CACHE_TTL } from '../../config/constants.js';

export interface CachedContent {
    content: string;
    timestamp: number;
}

export interface CachedCommitDate {
    date: Date;
    timestamp: number;
}

/**
 * Manages caching for GitHub API responses
 */
export class GitHubCache {
    private contentCache: Map<string, CachedContent>;
    private commitDateCache: Map<string, CachedCommitDate>;
    private readonly CACHE_TTL = GITHUB_CACHE_TTL;

    constructor() {
        this.contentCache = new Map();
        this.commitDateCache = new Map();
    }

    /**
     * Gets cached content if available and not expired
     */
    getContent(path: string): CachedContent | undefined {
        const cached = this.contentCache.get(path);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached;
        }
        return undefined;
    }

    /**
     * Sets content in cache with current timestamp
     */
    setContent(path: string, content: string): void {
        this.contentCache.set(path, {
            content,
            timestamp: Date.now(),
        });
    }

    /**
     * Gets cached commit date if available and not expired
     */
    getCommitDate(path: string): CachedCommitDate | undefined {
        const cached = this.commitDateCache.get(path);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached;
        }
        return undefined;
    }

    /**
     * Sets commit date in cache with current timestamp
     */
    setCommitDate(path: string, date: Date): void {
        this.commitDateCache.set(path, {
            date,
            timestamp: Date.now(),
        });
    }

    /**
     * Clears all cached data
     */
    clear(): void {
        this.contentCache.clear();
        this.commitDateCache.clear();
    }

    /**
     * Checks if a cached entry is expired
     */
    isExpired(timestamp: number): boolean {
        const now = Date.now();
        return (now - timestamp) >= this.CACHE_TTL;
    }
}
