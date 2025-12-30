import { createReadStream } from 'fs';
import readline from 'readline';
import { STREAM_BUFFER_SIZE, MAX_REQUESTED_LINES, MAX_MCP_RESPONSE_SIZE } from '../../config/constants.js';

export interface ReadStreamingResult {
    content: string;
    totalLines?: number;
}

/**
 * Reads file content using streaming to avoid loading entire file into memory
 */
export class FileStreamReader {
    /**
     * Reads partial content from a file using streaming
     */
    static async readPartialStreaming(
        absolutePath: string,
        startLine: number = 1,
        endLine?: number,
        maxResponseSize?: number,
        countAllLines: boolean = false
    ): Promise<ReadStreamingResult> {
        const maxSize = maxResponseSize || MAX_MCP_RESPONSE_SIZE;
        const result: string[] = [];
        let lineCount = 0;
        let currentSize = 0;
        let responseSize = 0;
        let totalLines: number | undefined;
        let streamError: Error | null = null;

        const fileStream = createReadStream(absolutePath, {
            encoding: 'utf8',
            highWaterMark: STREAM_BUFFER_SIZE
        });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        // Handle stream errors and propagate them
        fileStream.on('error', (error) => {
            console.error(`File stream error: ${error.message}`);
            streamError = error;
            rl.close();
        });

        try {
            for await (const line of rl) {
                // Check if a stream error occurred
                if (streamError) {
                    throw streamError;
                }
                
                lineCount++;
                
                // Count total lines if requested
                if (countAllLines) {
                    totalLines = lineCount;
                }
                
                // Check if we've reached start line
                if (lineCount < startLine) {
                    continue;
                }

                // Check if we've exceeded end line
                if (endLine !== undefined && lineCount > endLine) {
                    break;
                }

                // Calculate the size of this line (including newline)
                const lineSize = Buffer.byteLength(line + '\n', 'utf8');
                
                // Check if adding this line would exceed response size limit
                if (responseSize + lineSize > maxSize) {
                    console.error(
                        `Response size limit (${maxSize / 1024 / 1024}MB) reached at line ${lineCount}. ` +
                        `Current size: ${(responseSize / 1024 / 1024).toFixed(2)}MB, ` +
                        `Next line would add: ${(lineSize / 1024).toFixed(2)}KB`
                    );
                    break;
                }

                result.push(line);
                responseSize += lineSize;
                currentSize += lineSize;

                // Safety check: prevent runaway reads
                if (lineCount > MAX_REQUESTED_LINES) {
                    console.error(`Maximum line limit (${MAX_REQUESTED_LINES}) reached`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error reading file ${absolutePath}:`, error);
            throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            rl.close();
            fileStream.destroy();
        }

        return { content: result.join('\n'), totalLines };
    }

    /**
     * Counts lines in a file using streaming to avoid loading entire file into memory
     */
    static async countLinesStreaming(absolutePath: string): Promise<number> {
        const fileStream = createReadStream(absolutePath, {
            encoding: 'utf8',
            highWaterMark: STREAM_BUFFER_SIZE
        });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let lineCount = 0;

        try {
            for await (const _line of rl) {
                lineCount++;
            }
        } catch (error) {
            console.error(`Error counting lines in ${absolutePath}:`, error);
            throw error;
        } finally {
            rl.close();
            fileStream.destroy();
        }

        return lineCount;
    }
}
