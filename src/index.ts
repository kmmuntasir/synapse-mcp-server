#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LocalFileSystemProvider } from './providers/LocalFileSystemProvider.js';
import { GitHubProvider } from './providers/GitHubProvider.js';
import { AggregatorProvider } from './providers/AggregatorProvider.js';
import { MAX_MCP_RESPONSE_SIZE } from './config/constants.js';
import path from 'path';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validates that the response content size does not exceed MCP transport limits
 */
function validateResponseSize(content: string, maxSize: number = MAX_MCP_RESPONSE_SIZE): void {
    const size = Buffer.byteLength(content, 'utf8');
    if (size > maxSize) {
        throw new Error(
            `Response size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds MCP transport limit of ${maxSize / 1024 / 1024}MB`
        );
    }
}

const versionPath = path.join(__dirname, '..', 'VERSION');
let version = 'unknown';
try {
    version = readFileSync(versionPath, 'utf8').trim();
} catch (error) {
    console.error('Warning: Could not read VERSION file:', error);
}

const server = new McpServer({
    name: 'synapse-mcp-server',
    version: version,
});

// Initialize providers
const cliRoots = process.argv.slice(2);
const envRoots = process.env.NOTES_ROOT ? process.env.NOTES_ROOT.split(path.delimiter) : [];
const notesRoots = cliRoots.length > 0 ? cliRoots : (envRoots.length > 0 ? envRoots : [process.cwd()]);

const localProvider = new LocalFileSystemProvider(notesRoots);
const aggregator = new AggregatorProvider(localProvider);

// GitHub Integration
const githubToken = process.env.GITHUB_TOKEN;
const githubRepos = process.env.GITHUB_REPOS ? process.env.GITHUB_REPOS.split(/[,;:]/).map(r => r.trim()) : [];

if (githubRepos.length > 0) {
    if (!githubToken) {
        console.error('Error: GITHUB_REPOS configured but GITHUB_TOKEN is missing. GitHub integration disabled.');
        process.exit(1);
    }

    console.error('GitHub Integration active for repositories:');
    for (const repoStr of githubRepos) {
        // Handle format: "owner/repo" or "owner/repo/subpath"
        const slashParts = repoStr.split('/');
        if (slashParts.length >= 2) {
            const owner = slashParts[0];
            const repo = slashParts[1];
            const basePath = slashParts.slice(2).join('/');

            const mountPath = `github/${owner}/${repo}${basePath ? '/' + basePath : ''}`;
            console.error(`  - ${owner}/${repo}${basePath ? ' (path: ' + basePath + ')' : ''} (mounted at ${mountPath})`);

            const ghProvider = new GitHubProvider(owner, repo, githubToken, basePath);
            aggregator.mount(mountPath, ghProvider);
        } else {
            console.error(`Warning: Invalid GitHub repository format: ${repoStr}. Expected format: owner/repo or owner/repo/subpath`);
        }
    }
    console.error('WARNING: GitHub Search API is limited to 30 requests per minute. Internal throttling is active.');
}

const provider = aggregator;

console.error(`Synapse-MCP starting with local roots: ${notesRoots.join(', ')}`);

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

// 3. Tool: read_note
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

// 4. Tool: get_file_info
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

// 5. Tool: list_mounted_resources
server.tool(
    'list_mounted_resources',
    'List all mounted local directories and GitHub repositories/paths. Returns a JSON array of strings representing the mounted resources.',
    {},
    async () => {
        try {
            const mountedResources: string[] = [];
            
            // Add local directories
            for (const root of notesRoots) {
                mountedResources.push(path.resolve(root));
            }
            
            // Add GitHub repositories
            for (const repoStr of githubRepos) {
                // Handle format: "owner/repo" or "owner/repo/subpath"
                const slashParts = repoStr.split('/');
                if (slashParts.length >= 2) {
                    const owner = slashParts[0];
                    const repo = slashParts[1];
                    const basePath = slashParts.slice(2).join('/');
                    
                    const mountPath = `github/${owner}/${repo}${basePath ? '/' + basePath : ''}`;
                    mountedResources.push(mountPath);
                }
            }
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(mountedResources, null, 2),
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
