import { ReadOptions } from '../interfaces.js';
import { MAX_REQUESTED_LINES } from '../../config/constants.js';

/**
 * Validates read options parameters
 */
export function validateReadOptions(options?: ReadOptions): void {
    if (!options) {
        return;
    }

    if (options.startLine !== undefined && options.startLine < 1) {
        throw new Error('startLine must be >= 1');
    }

    if (options.endLine !== undefined && options.endLine < 1) {
        throw new Error('endLine must be >= 1');
    }

    if (options.maxLines !== undefined && options.maxLines < 1) {
        throw new Error('maxLines must be >= 1');
    }

    if (options.endLine !== undefined && options.maxLines !== undefined) {
        throw new Error('Cannot specify both endLine and maxLines');
    }

    if (options.startLine !== undefined && options.endLine !== undefined && options.endLine < options.startLine) {
        throw new Error('endLine must be >= startLine');
    }

    // Enforce maximum requested lines
    const requestedLines = options.maxLines ?? (options.endLine && options.startLine
        ? options.endLine - options.startLine + 1
        : undefined);
    
    if (requestedLines !== undefined && requestedLines > MAX_REQUESTED_LINES) {
        throw new Error(`Cannot request more than ${MAX_REQUESTED_LINES} lines in a single read`);
    }

    // Validate maxResponseSize
    if (options.maxResponseSize !== undefined && options.maxResponseSize < 1024) {
        throw new Error('maxResponseSize must be at least 1KB');
    }
}
