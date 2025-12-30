/**
 * Joins a relative path with the base path
 */
export function joinPath(basePath: string, path: string): string {
    if (!basePath) return path;
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    return normalizedPath ? `${basePath}/${normalizedPath}` : basePath;
}

/**
 * Removes base path from a full path to get relative path
 */
export function removeBasePath(fullPath: string, basePath: string): string {
    if (basePath && fullPath.startsWith(basePath)) {
        return fullPath.slice(basePath.length).replace(/^\/+/, '');
    }
    return fullPath;
}
