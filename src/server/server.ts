import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerListDirectoryTool } from './tools/listDirectory.js';
import { registerSearchNotesTool } from './tools/searchNotes.js';
import { registerReadNoteTool } from './tools/readNote.js';
import { registerGetFileInfoTool } from './tools/getFileInfo.js';
import { registerListMountedResourcesTool } from './tools/listMountedResources.js';
import { getVersion } from '../config/config.js';
import { KBProvider } from '../providers/interfaces.js';
import path from 'path';

/**
 * Creates and configures MCP server instance
 */
export function createServer(provider: KBProvider, config: { githubRepos: string[]; notesRoots: string[] }): McpServer {
    const version = getVersion();

    const server = new McpServer({
        name: 'synapse-mcp-server',
        version: version,
    });

    // Register all tools
    registerListDirectoryTool(server, provider);
    registerSearchNotesTool(server, provider);
    registerReadNoteTool(server, provider);
    registerGetFileInfoTool(server, provider);
    registerListMountedResourcesTool(server, config);

    return server;
}

/**
 * Connects server to stdio transport
 */
export async function connectServer(server: McpServer): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Synapse-MCP server running on stdio');
}
