#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LocalFileSystemProvider } from './providers/LocalFileSystemProvider.js';
import { GitHubProvider } from './providers/GitHubProvider.js';
import { AggregatorProvider } from './providers/AggregatorProvider.js';
import path from 'path';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const githubRepos = process.env.GITHUB_REPOS ? process.env.GITHUB_REPOS.split(',').map(r => r.trim()) : [];

if (githubRepos.length > 0) {
    if (!githubToken) {
        console.error('Error: GITHUB_REPOS configured but GITHUB_TOKEN is missing. GitHub integration disabled.');
        process.exit(1);
    }

    console.error('GitHub Integration active for repositories:');
    for (const repoStr of githubRepos) {
        const parts = repoStr.split('/');
        if (parts.length >= 2) {
            const owner = parts[0];
            const repo = parts[1];
            const basePath = parts.slice(2).join('/');

            const mountPath = `github/${owner}/${repo}${basePath ? '/' + basePath : ''}`;
            console.error(`  - ${owner}/${repo}${basePath ? ' (path: ' + basePath + ')' : ''} (mounted at ${mountPath})`);

            const ghProvider = new GitHubProvider(owner, repo, githubToken, basePath);
            aggregator.mount(mountPath, ghProvider);
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
