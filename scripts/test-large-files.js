#!/usr/bin/env node

import { LocalFileSystemProvider } from '../dist/providers/LocalFileSystemProvider.js';
import { GitHubProvider } from '../dist/providers/GitHubProvider.js';
import { AggregatorProvider } from '../dist/providers/AggregatorProvider.js';

async function testLocalFileSystem() {
    console.log('\n=== Testing LocalFileSystemProvider ===\n');
    
    const provider = new LocalFileSystemProvider(process.argv[2] || process.cwd());
    
    // Test 1: Default pagination
    console.log('Test 1: Default pagination (should return 100 lines)');
    try {
        const result = await provider.read('package.json');
        console.log(`✓ Success: ${result.content.length} chars, lines ${result.metadata.startLine}-${result.metadata.endLine}`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 2: Custom pagination
    console.log('\nTest 2: Custom pagination (lines 1-10)');
    try {
        const result = await provider.read('package.json', { startLine: 1, endLine: 10 });
        console.log(`✓ Success: ${result.content.length} chars, lines ${result.metadata.startLine}-${result.metadata.endLine}`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 3: maxLines parameter
    console.log('\nTest 3: maxLines parameter (50 lines)');
    try {
        const result = await provider.read('package.json', { maxLines: 50 });
        console.log(`✓ Success: ${result.content.length} chars, lines ${result.metadata.startLine}-${result.metadata.endLine}`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 4: Get file info
    console.log('\nTest 4: Get file info');
    try {
        const info = await provider.getFileInfo('package.json');
        console.log(`✓ Success: ${info.size} bytes, ${info.lineCount} lines`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 5: Invalid parameters
    console.log('\nTest 5: Invalid parameters (maxLines > 300)');
    try {
        await provider.read('package.json', { maxLines: 500 });
        console.error('✗ Should have thrown an error');
    } catch (error) {
        console.log(`✓ Correctly rejected: ${error.message}`);
    }
}

async function testGitHubProvider() {
    console.log('\n=== Testing GitHubProvider ===\n');
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.log('Skipping GitHub tests (GITHUB_TOKEN not set)');
        return;
    }

    const provider = new GitHubProvider('kmmuntasir', 'synapse-mcp-server', token);
    
    // Test 1: Default pagination
    console.log('Test 1: Default pagination (should return 100 lines)');
    try {
        const result = await provider.read('README.md');
        console.log(`✓ Success: ${result.content.length} chars, lines ${result.metadata.startLine}-${result.metadata.endLine}`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 2: Custom pagination
    console.log('\nTest 2: Custom pagination (lines 1-10)');
    try {
        const result = await provider.read('README.md', { startLine: 1, endLine: 10 });
        console.log(`✓ Success: ${result.content.length} chars, lines ${result.metadata.startLine}-${result.metadata.endLine}`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }

    // Test 3: Get file info
    console.log('\nTest 3: Get file info');
    try {
        const info = await provider.getFileInfo('README.md');
        console.log(`✓ Success: ${info.size} bytes, ${info.lineCount} lines`);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
    }
}

async function main() {
    await testLocalFileSystem();
    await testGitHubProvider();
    console.log('\n=== Tests Complete ===\n');
}

main().catch(console.error);
