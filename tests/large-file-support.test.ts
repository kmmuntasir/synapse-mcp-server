import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocalFileSystemProvider } from '../src/providers/LocalFileSystemProvider.js';
import { GitHubProvider } from '../src/providers/GitHubProvider.js';
import { 
    MAX_MCP_RESPONSE_SIZE, 
    DEFAULT_MAX_LINES, 
    MAX_REQUESTED_LINES,
    STREAMING_THRESHOLD 
} from '../src/config/constants.js';

describe('Large File Support', () => {
    describe('Constants', () => {
        it('should have reasonable size limits', () => {
            expect(MAX_MCP_RESPONSE_SIZE).toBe(4 * 1024 * 1024);
            expect(DEFAULT_MAX_LINES).toBe(100);
            expect(MAX_REQUESTED_LINES).toBe(300);
            expect(STREAMING_THRESHOLD).toBe(1024 * 1024);
        });
    });

    describe('LocalFileSystemProvider', () => {
        let provider: LocalFileSystemProvider;
        const testDir = './test-data';

        beforeEach(() => {
            provider = new LocalFileSystemProvider(testDir);
        });

        it('should use default pagination when no options provided', async () => {
            const result = await provider.read('small-file.md');
            expect(result.metadata.isPartial).toBe(true);
            expect(result.metadata.startLine).toBe(1);
            expect(result.metadata.endLine).toBe(100);
        });

        it('should respect custom pagination options', async () => {
            const result = await provider.read('small-file.md', { 
                startLine: 10, 
                maxLines: 50 
            });
            expect(result.metadata.startLine).toBe(10);
            expect(result.metadata.endLine).toBe(59);
        });

        it('should enforce MAX_REQUESTED_LINES', async () => {
            await expect(
                provider.read('small-file.md', { maxLines: MAX_REQUESTED_LINES + 1 })
            ).rejects.toThrow(`Cannot request more than ${MAX_REQUESTED_LINES} lines`);
        });

        it('should validate response size', async () => {
            // Test with a file that would exceed the limit
            await expect(
                provider.read('large-file.md', { maxResponseSize: 1024 })
            ).rejects.toThrow('exceeds MCP transport limit');
        });

        it('should only count lines for small files', async () => {
            const info = await provider.getFileInfo('small-file.md');
            expect(info.lineCount).toBeDefined();
            
            const largeInfo = await provider.getFileInfo('large-file.md');
            expect(largeInfo.lineCount).toBeUndefined();
        });
    });

    describe('GitHubProvider', () => {
        let provider: GitHubProvider;

        beforeEach(() => {
            provider = new GitHubProvider('owner', 'repo', 'test-token');
        });

        it('should use default pagination when no options provided', async () => {
            // Mock the octokit call
            const mockData = {
                size: 1024,
                toString: () => 'line1\nline2\nline3'
            };
            
            jest.spyOn(provider['octokit'].rest.repos, 'getContent')
                .mockResolvedValue({ data: mockData } as any);

            const result = await provider.read('file.md');
            expect(result.metadata.isPartial).toBe(true);
            expect(result.metadata.startLine).toBe(1);
            expect(result.metadata.endLine).toBe(DEFAULT_MAX_LINES);
        });

        it('should make only one API call', async () => {
            const mockData = {
                size: 1024,
                toString: () => 'line1\nline2\nline3'
            };
            
            const getContentSpy = jest.spyOn(provider['octokit'].rest.repos, 'getContent')
                .mockResolvedValue({ data: mockData } as any);

            await provider.read('file.md');
            
            expect(getContentSpy).toHaveBeenCalledTimes(1);
        });

        it('should validate file size against GitHub limit', async () => {
            const mockData = {
                size: 150 * 1024 * 1024, // 150MB
                toString: () => 'content'
            };
            
            jest.spyOn(provider['octokit'].rest.repos, 'getContent')
                .mockResolvedValue({ data: mockData } as any);

            await expect(provider.read('large-file.md')).rejects.toThrow('exceeds GitHub API limit');
        });

        it('should validate response size', async () => {
            const mockData = {
                size: 1024,
                toString: () => 'x'.repeat(5 * 1024 * 1024) // 5MB
            };
            
            jest.spyOn(provider['octokit'].rest.repos, 'getContent')
                .mockResolvedValue({ data: mockData } as any);

            await expect(provider.read('file.md')).rejects.toThrow('exceeds MCP transport limit');
        });
    });
});
