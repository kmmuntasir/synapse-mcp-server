---
trigger: always_on
---

# MCP Server Development Rules

1. **Stdio Transport Safety**:
   - NEVER use `console.log()` for logging. It interferes with the JSON-RPC communication on stdio.
   - ALWAYS use `console.error()` for logs and debugging information.

2. **Tool Definition**:
   - All tools must use `zod` for argument validation.
   - Tool descriptions should be verbose and helpful for the AI client.
   - Tool names should be snake_case (e.g., `read_note`, `list_directory`).

3. **Error Handling**:
   - Wrap all tool execution logic in `try-catch` blocks.
   - On error, return an object with `isError: true` and the error message in the content.
   - Do not crash the server on tool errors.

4. **Response Format**:
   - Always return `content` array as per MCP spec.
   - Text content should be `{ type: 'text', text: string }`.