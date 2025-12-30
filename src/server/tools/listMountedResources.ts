import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import path from 'path';

export interface ListMountedResourcesConfig {
    githubRepos: string[];
    notesRoots: string[];
}

/**
 * Registers the list_mounted_resources tool
 */
export function registerListMountedResourcesTool(server: McpServer, config: ListMountedResourcesConfig): void {
    server.tool(
        'list_mounted_resources',
        'List all mounted local directories and GitHub repositories/paths. Returns a JSON array of strings representing the mounted resources.',
        {},
        async () => {
            try {
                const mountedResources: string[] = [];
                
                // Add local directories
                for (const root of config.notesRoots) {
                    mountedResources.push(path.resolve(root));
                }
                
                // Add GitHub repositories
                for (const repoStr of config.githubRepos) {
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
}
