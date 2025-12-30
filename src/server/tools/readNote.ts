import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KBProvider } from '../../providers/interfaces.js';

/**
 * Registers the read_note tool
 */
export function registerReadNoteTool(server: McpServer, provider: KBProvider): void {
    server.tool(
        'read_note',
        'Read the content of a file. Always uses pagination with a default of 100 lines. ' +
        'Use startLine, endLine, or maxLines to control the range. ' +
        'Note: GitHub repositories have a 100MB file size limit. ' +
        'MCP transport has a 4MB response size limit - large responses will be truncated. ' +
        'For GitHub files, uses cached content if available (3-minute TTL) to avoid redundant API calls.',
        {
            path: z.string().describe('Relative path to the file'),
            startLine: z.number().optional().describe('Start line number (1-indexed, default: 1)'),
            endLine: z.number().optional().describe('End line number (1-indexed)'),
            maxLines: z.number().optional().describe('Number of lines to read (default: 100, max: 300)'),
            maxResponseSize: z.number().optional().describe('Maximum response size in bytes (default: 4MB)'),
        },
        async ({ path: relativePath, startLine, endLine, maxLines, maxResponseSize }) => {
            try {
                const result = await provider.read(relativePath, {
                    startLine,
                    endLine,
                    maxLines,
                    maxResponseSize
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
