export interface FileSystemEntry {
    name: string;
    type: 'file' | 'directory';
    path: string; // Relative path from root
}

export interface SearchResult {
    path: string;
    matches: string[]; // Content snippets
    score?: number;
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
     */
    read(path: string): Promise<string>;
}
