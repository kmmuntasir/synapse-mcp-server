import { MAX_MCP_RESPONSE_SIZE } from '../config/constants.js';

/**
 * Validates that the response content size does not exceed MCP transport limits
 */
export function validateResponseSize(content: string, maxSize: number = MAX_MCP_RESPONSE_SIZE): void {
    const size = Buffer.byteLength(content, 'utf8');
    if (size > maxSize) {
        throw new Error(
            `Response size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds MCP transport limit of ${maxSize / 1024 / 1024}MB`
        );
    }
}
