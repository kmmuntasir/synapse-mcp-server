export interface FileSystemEntry {
    name: string;
    type: 'file' | 'directory';
    path: string; // Relative path from root
}

export interface SearchResult {
    path: string;
    matches: Array<{
        line: number; // 1-based index, or -1 if unknown (e.g., GitHub search results)
        content: string;
    }>;
    score?: number;
}

export interface ReadResult {
    content: string;
    metadata: {
        totalLines?: number;
        startLine?: number;
        endLine?: number;
        isPartial: boolean;
        fileSize?: number; // in bytes
    };
}

export interface ReadOptions {
    startLine?: number;
    endLine?: number;
    maxLines?: number; // Number of lines to read (mutually exclusive with endLine)
    
    // New: Force pagination even for small files
    forcePagination?: boolean;
    
    // New: Maximum response size in bytes (optional override)
    maxResponseSize?: number;
}

export interface FileInfo {
    path: string;
    size: number; // bytes
    lineCount?: number; // for text files
    fileType: string; // extension
    lastModified: Date;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    estimatedSize?: number;
}

export interface KBProvider {
    /**
     * Lists files and directories at the given path.
     * @param path Relative path to list (default root)
     */
    list(path?: string): Promise<FileSystemEntry[]>;

    /**
     * Searches for files containing the query string.
     * @param query Search term
     */
    search(query: string): Promise<SearchResult[]>;

    /**
     * Reads the content of a file.
     * @param path Relative path to the file
     * @param options Optional arguments for reading specific lines
     */
    read(path: string, options?: ReadOptions): Promise<ReadResult>;

    /**
     * Gets metadata about a file without reading its content.
     * @param path Relative path to the file
     */
    getFileInfo(path: string): Promise<FileInfo>;
}
