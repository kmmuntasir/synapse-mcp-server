import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KBProvider } from '../../providers/interfaces.js';

/**
 * Registers the get_file_info tool
 */
export function registerGetFileInfoTool(server: McpServer, provider: KBProvider): void {
    server.tool(
        'get_file_info',
        'Get metadata about a file without reading its content. ' +
        'Returns file size, line count (for files < 1MB), and other metadata. ' +
        'Use this to determine file size before reading. ' +
        'For GitHub files, uses cached content if available (3-minute TTL) to avoid redundant API calls.',
        {
            path: z.string().describe('Relative path to the file'),
        },
        async ({ path: relativePath }) => {
            try {
                const info = await provider.getFileInfo(relativePath);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(info, null, 2),
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
