#!/usr/bin/env node

/**
 * Manual test script for Synapse MCP Server
 * This script connects to the local server, lists tools, and executes a specific tool call.
 * It pipes server logs (stderr) directly to the console so you can debug.
 * 
 * Usage: node scripts/test_manual.js
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function ask(question) {
    return (await rl.question(question)).trim();
}

async function main() {
    console.log('--- Synapse MCP Interactive Tester ---');

    const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/index.js'],
        stderr: 'inherit'
    });

    const client = new Client({
        name: 'cli-tester',
        version: '1.0.0',
    }, {
        capabilities: {}
    });

    try {
        console.log('Connecting to server...');
        await client.connect(transport);
        console.log('Connected!\n');

        while (true) {
            console.log('\n--- Main Menu ---');
            const { tools } = await client.listTools();

            tools.forEach((tool, index) => {
                console.log(`${index + 1}. ${tool.name} - ${tool.description?.split('\n')[0]}`);
            });
            console.log('0. Exit');

            const choice = await ask('\nSelect a tool (number) or 0 to exit: ');

            if (choice === '0') break;

            const toolIndex = parseInt(choice) - 1;
            if (isNaN(toolIndex) || toolIndex < 0 || toolIndex >= tools.length) {
                console.log('Invalid selection.');
                continue;
            }

            const tool = tools[toolIndex];

            while (true) {
                console.log(`\n--- Tool Details: ${tool.name} ---`);
                console.log(`Description: ${tool.description}`);
                console.log(`Parameters Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);

                const execute = await ask('\nWould you like to call this tool? (y/n) [n]: ');
                if (execute.toLowerCase() !== 'y') break;

                // Dynamic parameter collection
                const args = {};
                const schema = tool.inputSchema;

                if (schema && schema.properties) {
                    console.log('\nEnter parameter values:');
                    for (const [propName, propDetails] of Object.entries(schema.properties)) {
                        const isRequired = schema.required?.includes(propName);
                        const desc = propDetails.description || '';
                        const promptMsg = `${propName}${isRequired ? '*' : ''} (${desc}): `;

                        let val = await ask(promptMsg);

                        if (val === '' && !isRequired) {
                            continue;
                        }

                        // Basic type casting
                        if (propDetails.type === 'number' || propDetails.type === 'integer') {
                            val = Number(val);
                        } else if (propDetails.type === 'boolean') {
                            val = val.toLowerCase() === 'true' || val === '1';
                        }

                        args[propName] = val;
                    }
                }

                console.log('\nCalling tool with arguments:', JSON.stringify(args, null, 2));

                try {
                    const result = await client.callTool({
                        name: tool.name,
                        arguments: args
                    });
                    console.log('\n--- Result ---');
                    console.log(JSON.stringify(result, null, 2));
                } catch (err) {
                    console.error('\n!!! Tool Execution Error !!!');
                    console.error(err.message || err);
                }

                const again = await ask('\nRun this tool again? (y/n) [n]: ');
                if (again.toLowerCase() !== 'y') break;
            }
        }
    } catch (error) {
        console.error('\n!!! System Error !!!');
        console.error(error);
    } finally {
        console.log('\nClosing connection...');
        await client.close();
        rl.close();
        process.exit(0);
    }
}

main();
