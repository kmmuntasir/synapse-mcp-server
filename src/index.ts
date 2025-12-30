#!/usr/bin/env node
import { loadConfig, initializeProviders, getVersion } from './config/config.js';
import { createServer, connectServer } from './server/server.js';

async function main() {
    const config = loadConfig();
    const provider = initializeProviders(config);
    const server = createServer(provider, config);
    
    console.error(`Synapse-MCP starting with local roots: ${config.notesRoots.join(', ')}`);
    await connectServer(server);
}

main().catch((error) => {
    console.error('Fatal error in Synapse-MCP:', error);
    process.exit(1);
});
