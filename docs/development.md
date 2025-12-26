# Development & Installation Guide: Synapse-MCP

This document covers how to set up Synapse-MCP for local development or manual installation from source.

## Installation from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/kmmuntasir/synapse-mcp-server.git
   cd synapse-mcp-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Development

### Running with MCP Inspector
To test your changes locally using the MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Watching for Changes
To automatically recompile TypeScript during development:
```bash
npm run watch
```

### Local Execution
To run your local build manually:
```bash
node dist/index.js /path/to/your/notes
```

## Large File Support

### Pagination

All file reads use pagination by default to ensure efficient memory usage and compliance with MCP transport limits:

- **Default**: Returns 100 lines (lines 1-100)
- **Maximum**: Can request up to 300 lines in a single read
- **Response Size Limit**: 4MB (MCP transport limit)

### Usage Examples

```typescript
// Default pagination (1000 lines)
await provider.read('file.md');

// Custom line range
await provider.read('file.md', { startLine: 100, endLine: 200 });

// Number of lines
await provider.read('file.md', { maxLines: 500 });

// Get file info first to check size
const info = await provider.getFileInfo('file.md');
console.log(`File size: ${info.size} bytes`);
```

### Best Practices

1. **Check file size first**: Use `getFileInfo()` before reading large files
2. **Use pagination**: Always specify `maxLines` or `startLine`/`endLine` for predictable behavior
3. **Handle partial results**: All reads return `isPartial: true` in metadata
4. **Monitor response size**: The provider will throw an error if the response exceeds 4MB
