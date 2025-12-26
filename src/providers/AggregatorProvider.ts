import { KBProvider, FileSystemEntry, SearchResult, ReadResult, ReadOptions, FileInfo } from './interfaces.js';

export class AggregatorProvider implements KBProvider {
    private rootProvider: KBProvider;
    private mounts: Map<string, KBProvider> = new Map();

    constructor(rootProvider: KBProvider) {
        this.rootProvider = rootProvider;
    }

    /**
     * Mounts a provider at a specific virtual path.
     * @param prefix The virtual path prefix (e.g., 'github/owner/repo')
     * @param provider The provider instance
     */
    mount(prefix: string, provider: KBProvider) {
        // Ensure prefix doesn't have leading/trailing slashes for consistent matching
        const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
        this.mounts.set(normalizedPrefix, provider);
    }

    async list(path: string = ''): Promise<FileSystemEntry[]> {
        const normalizedPath = path.replace(/^\/+|\/+$/g, '');

        // 1. Check if the path exactly matches or starts with a mount prefix
        for (const [prefix, provider] of this.mounts.entries()) {
            if (normalizedPath === prefix) {
                // If listing the exact mount point, list its contents
                return await provider.list('');
            }
            if (normalizedPath.startsWith(prefix + '/')) {
                const subPath = normalizedPath.slice(prefix.length + 1);
                return await provider.list(subPath);
            }
        }

        // 2. Otherwise, it's a local path or a request for the unified root
        const entries = await this.rootProvider.list(path);

        // 3. If we are at the root (''), inject the top-level virtual directories for mounts
        if (normalizedPath === '') {
            const virtualDirs = new Set<string>();
            for (const prefix of this.mounts.keys()) {
                const firstPart = prefix.split('/')[0];
                virtualDirs.add(firstPart);
            }

            for (const vDir of virtualDirs) {
                // Only add if it doesn't collide with a real local file/folder
                if (!entries.some(e => e.name === vDir)) {
                    entries.push({
                        name: vDir,
                        type: 'directory',
                        path: vDir,
                    });
                }
            }
        } else {
            // Check if we are inside a partial mount path (e.g., listing 'github' when 'github/owner/repo' is mounted)
            const virtualDirs = new Set<string>();
            for (const prefix of this.mounts.keys()) {
                if (prefix.startsWith(normalizedPath + '/')) {
                    const remaining = prefix.slice(normalizedPath.length + 1);
                    const nextPart = remaining.split('/')[0];
                    virtualDirs.add(nextPart);
                }
            }

            for (const vDir of virtualDirs) {
                if (!entries.some(e => e.name === vDir)) {
                    entries.push({
                        name: vDir,
                        type: 'directory',
                        path: `${normalizedPath}/${vDir}`,
                    });
                }
            }
        }

        return entries;
    }

    async read(path: string, options?: ReadOptions): Promise<ReadResult> {
        const normalizedPath = path.replace(/^\/+|\/+$/g, '');

        for (const [prefix, provider] of this.mounts.entries()) {
            if (normalizedPath.startsWith(prefix + '/')) {
                const subPath = normalizedPath.slice(prefix.length + 1);
                return await provider.read(subPath, options);
            }
        }

        return await this.rootProvider.read(path, options);
    }

    async search(query: string): Promise<SearchResult[]> {
        const allResults: SearchResult[] = [];

        // Search root provider
        const rootResults = await this.rootProvider.search(query);
        allResults.push(...rootResults);

        // Search all mounted providers
        for (const [prefix, provider] of this.mounts.entries()) {
            try {
                const results = await provider.search(query);
                // Prefix the paths of results from mounted providers
                const prefixedResults = results.map(r => ({
                    ...r,
                    path: `${prefix}/${r.path.replace(/^\/+/, '')}`,
                }));
                allResults.push(...prefixedResults);
            } catch (error) {
                console.error(`Error searching provider at ${prefix}:`, error);
                // Continue to next provider on error
            }
        }

        return allResults;
    }

    async getFileInfo(path: string): Promise<FileInfo> {
        const normalizedPath = path.replace(/^\/+|\/+$/g, '');

        for (const [prefix, provider] of this.mounts.entries()) {
            if (normalizedPath.startsWith(prefix + '/')) {
                const subPath = normalizedPath.slice(prefix.length + 1);
                return await provider.getFileInfo(subPath);
            }
        }

        return await this.rootProvider.getFileInfo(path);
    }
}
