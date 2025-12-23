# Synapse-MCP

**Synapse-MCP** is a "Hybrid Universal Knowledge Base" server for AI agents. It provides a unified interface to search and retrieve information from multiple local directories (e.g., Obsidian vaults or Markdown folders).

## Quick Start (Npx)

Run Synapse-MCP directly using `npx` in your favorite AI tool (Cursor, Roo Code, etc.). 

### 1. Configuration in Cursor
1. Go to **Cursor Settings** > **General** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Configure it:
   - **Name**: `synapse-mcp`
   - **Type**: `command`
   - **Command**: `npx -y @kmmuntasir/synapse-mcp-server "C:/path/to/notes"`

### 2. Configuration in Roo Code
Add this to your `cline_mcp_settings.json`:
```json
"mcpServers": {
  "synapse-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "@kmmuntasir/synapse-mcp-server",
      "C:/notes1",
      "D:/notes2"
    ]
  }
}
```

### 3. Using Environment Variables
You can also set the notes paths via the `NOTES_ROOT` environment variable. 

**Note on Path Separators:**
- **Windows**: Use a semicolon (`;`) to separate multiple paths (e.g., `C:/notes1;D:/notes2`).
- **Linux/macOS**: Use a colon (`:`) to separate multiple paths (e.g., `/home/user/notes1:/home/user/notes2`).

```json
"synapse-mcp": {
  "command": "npx",
  "args": ["-y", "@kmmuntasir/synapse-mcp-server"],
  "env": {
    "NOTES_ROOT": "C:/notes1;D:/notes2"
  }
}
```

## Tools Available
- `list_directory`: Recursively list files to map the knowledge base.
- `search_notes`: Search for keywords across all markdown content.
- `read_note`: Retrieve the full content of a specific note.

## Resources
- [GitHub Repository](https://github.com/kmmuntasir/synapse-mcp-server)

## License
GPL 3.0
