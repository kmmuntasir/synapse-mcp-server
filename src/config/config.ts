import { LocalFileSystemProvider } from '../providers/LocalFileSystemProvider.js';
import { GitHubProvider } from '../providers/GitHubProvider.js';
import { AggregatorProvider } from '../providers/AggregatorProvider.js';
import path from 'path';
import { readFileSync } from 'fs';
import 'dotenv/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppConfig {
    notesRoots: string[];
    githubToken?: string;
    githubRepos: string[];
}

/**
 * Loads and returns the application configuration
 */
export function loadConfig(): AppConfig {
    // Initialize providers
    const cliRoots = process.argv.slice(2);
    const envRoots = process.env.NOTES_ROOT ? process.env.NOTES_ROOT.split(',') : [];
    const notesRoots = cliRoots.length > 0 ? cliRoots : (envRoots.length > 0 ? envRoots : [process.cwd()]);

    // GitHub Integration
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepos = process.env.GITHUB_REPOS ? process.env.GITHUB_REPOS.split(',').map(r => r.trim()) : [];

    return {
        notesRoots,
        githubToken,
        githubRepos,
    };
}

/**
 * Initializes and returns the aggregator provider with all mounted resources
 */
export function initializeProviders(config: AppConfig): AggregatorProvider {
    const localProvider = new LocalFileSystemProvider(config.notesRoots);
    const aggregator = new AggregatorProvider(localProvider);

    // Mount GitHub repositories if configured
    if (config.githubRepos.length > 0) {
        if (!config.githubToken) {
            console.error('Error: GITHUB_REPOS configured but GITHUB_TOKEN is missing. GitHub integration disabled.');
            process.exit(1);
        }

        console.error('GitHub Integration active for repositories:');
        for (const repoStr of config.githubRepos) {
            // Handle format: "owner/repo" or "owner/repo/subpath"
            const slashParts = repoStr.split('/');
            if (slashParts.length >= 2) {
                const owner = slashParts[0];
                const repo = slashParts[1];
                const basePath = slashParts.slice(2).join('/');

                const mountPath = `github/${owner}/${repo}${basePath ? '/' + basePath : ''}`;
                console.error(`  - ${owner}/${repo}${basePath ? ' (path: ' + basePath + ')' : ''} (mounted at ${mountPath})`);

                const ghProvider = new GitHubProvider(owner, repo, config.githubToken, basePath);
                aggregator.mount(mountPath, ghProvider);
            } else {
                console.error(`Warning: Invalid GitHub repository format: ${repoStr}. Expected format: owner/repo or owner/repo/subpath`);
            }
        }
        console.error('WARNING: GitHub Search API is limited to 30 requests per minute. Internal throttling is active.');
    }

    return aggregator;
}

/**
 * Gets the project version from VERSION file
 */
export function getVersion(): string {
    const versionPath = path.join(__dirname, '..', '..', 'VERSION');
    let version = 'unknown';
    try {
        version = readFileSync(versionPath, 'utf8').trim();
    } catch (error) {
        console.error('Warning: Could not read VERSION file:', error);
    }
    return version;
}
