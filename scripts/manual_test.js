#!/usr/bin/env node

/**
 * Manual test script for Synapse MCP Server
 * This script connects to the local server, lists tools, and executes a specific tool call.
 * It pipes server logs (stderr) directly to the console so you can debug.
 * 
 * Usage: node scripts/test_manual.js
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    console.log('Starting Synapse MCP Server...');

    // 1. Setup Transport (Stdio)
    // We use 'inherit' for stderr so that server logs (console.error) show up in this terminal.
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"],
        stderr: "inherit"
    });

    // 2. Setup Client
    const client = new Client({
        name: "manual-test-client",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    try {
        // 3. Connect
        console.log('Connecting...');
        await client.connect(transport);
        console.log('Connected!');

        // 4. List Tools (Optional, just to verify)
        console.log('\n--- Listing Tools ---');
        const tools = await client.listTools();
        console.log(`Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name).join(', '));

        // 5. Run Specific Tool
        // You can edit these values to test different tools/args
        const toolName = "search_notes";
        const args = { query: "maintained" };

        console.log(`\n--- Calling Tool: ${toolName} ---`);
        console.log('Arguments:', JSON.stringify(args));

        try {
            const result = await client.callTool({
                name: toolName,
                arguments: args
            });

            console.log('\n--- Result ---');
            console.log(JSON.stringify(result, null, 2));
        } catch (toolError) {
            console.error('\n--- Tool Execution Error ---');
            console.error(toolError);
        }

    } catch (error) {
        console.error('\n!!! Connection/System Error !!!', error);
    } finally {
        // 6. Cleanup
        console.log('\nClosing connection...');
        await client.close();
    }
}

main();
