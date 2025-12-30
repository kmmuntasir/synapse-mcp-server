/**
 * Standardized tool response type for MCP server tools
 */
export interface ToolResponse {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    [key: string]: unknown;
}

/**
 * Handles tool errors and returns a standardized error response
 */
export function handleToolError(error: unknown): ToolResponse {
    return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
    };
}

/**
 * Handles successful tool responses and returns a standardized success response
 */
export function handleToolSuccess(data: unknown): ToolResponse {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
}
