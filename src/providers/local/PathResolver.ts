import path from 'path';

/**
 * Resolves paths relative to root directories
 */
export class PathResolver {
    private rootPaths: string[];

    constructor(rootPaths: string | string[]) {
        const paths = Array.isArray(rootPaths) ? rootPaths : [rootPaths];
        this.rootPaths = paths.map(p => path.resolve(p));
    }

    /**
     * Resolves a relative path to an absolute path and returns the root path
     */
    resolvePath(relativePath: string = ''): { absolutePath: string; rootPath: string } {
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

    /**
     * Gets all root paths
     */
    getRootPaths(): string[] {
        return this.rootPaths;
    }
}
