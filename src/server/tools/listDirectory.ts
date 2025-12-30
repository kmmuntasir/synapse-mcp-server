import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KBProvider } from '../../providers/interfaces.js';

/**
 * Registers the list_directory tool
 */
export function registerListDirectoryTool(server: McpServer, provider: KBProvider): void {
    server.tool(
        'list_directory',
        'Recursively list all files in allowed directory to understand the project structure.',
        {
            path: z.string().optional().describe('Relative path to list (default: root)'),
        },
        async ({ path: relativePath }) => {
            try {
                const entries = await provider.list(relativePath);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(entries, null, 2),
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
