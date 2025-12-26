/**
 * Size limits and configuration for large file support
 */

/**
 * Maximum response size that can be sent via MCP transport
 * Based on research: 4MB is a safe limit for stdio transport
 * Some implementations support up to 10MB, but 4MB is conservative
 */
export const MAX_MCP_RESPONSE_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * GitHub API hard limit for file size
 */
export const MAX_GITHUB_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Default number of lines to read if no pagination parameters are provided
 * This ensures pagination is always used
 */
export const DEFAULT_MAX_LINES = 100;

/**
 * Maximum number of lines that can be requested in a single read
 * Prevents excessive memory usage while still allowing reasonable requests
 */
export const MAX_REQUESTED_LINES = 300;

/**
 * Buffer size for streaming reads (in bytes)
 */
export const STREAM_BUFFER_SIZE = 8192; // 8KB

/**
 * File size threshold (in bytes) for using streaming vs. full read
 * Files larger than this will always use streaming
 */
export const STREAMING_THRESHOLD = 1024 * 1024; // 1MB

/**
 * Cache time-to-live (in milliseconds) for GitHub file content
 * Files are cached in memory to avoid redundant API calls
 */
export const GITHUB_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
