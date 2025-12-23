#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LocalFileSystemProvider } from './providers/LocalFileSystemProvider.js';
import path from 'path';
import 'dotenv/config';

const server = new McpServer({
    name: 'synapse-mcp-server',
    version: '0.1.0',
});

// Initialize provider
const notesRoot = process.argv[2] || process.env.NOTES_ROOT || process.cwd();
const provider = new LocalFileSystemProvider(notesRoot);

console.error(`Synapse-MCP starting with root: ${notesRoot}`);

// 1. Tool: list_directory
server.tool(
    'list_directory',
    'Recursively list all files in the allowed directory to understand the project structure.',
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

// 2. Tool: search_notes
server.tool(
    'search_notes',
    'Search for a keyword or phrase across all markdown files.',
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

// 3. Tool: read_note
server.tool(
    'read_note',
    'Read the full content of a specific file.',
    {
        path: z.string().describe('Relative path to the file'),
    },
    async ({ path: relativePath }) => {
        try {
            const content = await provider.read(relativePath);
            return {
                content: [
                    {
                        type: 'text',
                        text: content,
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Synapse-MCP server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error in Synapse-MCP:', error);
    process.exit(1);
});
