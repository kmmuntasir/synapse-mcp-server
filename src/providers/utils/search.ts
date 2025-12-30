/**
 * Extracts matches with line numbers from file content
 */
export function extractMatches(
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
