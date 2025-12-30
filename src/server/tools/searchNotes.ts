import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KBProvider } from '../../providers/interfaces.js';

/**
 * Registers the search_notes tool
 */
export function registerSearchNotesTool(server: McpServer, provider: KBProvider): void {
    server.tool(
        'search_notes',
        'Search for a keyword or phrase across all markdown files. For GitHub files, fetches full content to calculate accurate line numbers and caches it for 3 minutes.',
        {
            query: z.string().describe('The search query or keyword'),
        },
        async ({ query }) => {
            try {
                const results = await provider.search(query);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
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
