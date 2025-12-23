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
