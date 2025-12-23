# Synapse-MCP

**Synapse-MCP** is a "Hybrid Universal Knowledge Base" server for AI agents. It provides a unified interface to search and retrieve information from multiple local directories (e.g., Obsidian vaults or Markdown folders).

## Configuration

Synapse-MCP is run directly via `npx`. Configuration is strictly handled via the `NOTES_ROOT` environment variable.

### Note on Path Separators
When providing multiple directories, use the appropriate separator for your OS:
- **Windows**: Semicolon (`;`) → `C:/path1;D:/path2`
- **Linux/macOS**: Colon (`:`) → `/home/user/path1:/home/user/path2`

---

### 1. Cursor
1. Go to **Settings** > **General** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Set the following:
   - **Name**: `synapse-mcp`
   - **Type**: `command`
   - **Command**: `npx -y @kmmuntasir/synapse-mcp-server`
   - **Environment Variables**: `NOTES_ROOT=/home/user/notes`

### 2. Roo Code (VS Code)
Add this to your `cline_mcp_settings.json`:
```json
"mcpServers": {
  "synapse-mcp": {
    "command": "npx",
    "args": ["-y", "@kmmuntasir/synapse-mcp-server"],
    "env": {
      "NOTES_ROOT": "/home/user/notes1:/home/user/notes2"
    }
  }
}
```

### 3. Kilo Code
1. Open **Kilo Settings** > **MCP Configuration**.
2. Add a new server:
   - **Command**: `npx`
   - **Arguments**: `-y`, `@kmmuntasir/synapse-mcp-server`
   - **Env Variables**: `NOTES_ROOT=/home/user/notes`

### 4. Claude Code (CLI)
Run the following command to add the server:
```bash
claude mcp add npx -y @kmmuntasir/synapse-mcp-server --env NOTES_ROOT="/home/user/notes"
```

### 5. Gemini CLI
Add the following to your MCP configuration file (usually `~/.config/gemini-mcp/config.json`):
```json
"mcpServers": {
  "synapse-mcp": {
    "command": "npx",
    "args": ["-y", "@kmmuntasir/synapse-mcp-server"],
    "env": {
      "NOTES_ROOT": "/home/user/notes"
    }
  }
}
```

---

## Tools Available
- `list_directory`: Recursively list files to map the knowledge base.
- `search_notes`: Search for keywords across all markdown content.
- `read_note`: Retrieve the full content of a specific note.

## Resources
- [GitHub Repository](https://github.com/kmmuntasir/synapse-mcp-server)
- [Development & Source Installation](https://github.com/kmmuntasir/synapse-mcp-server/blob/main/docs/development.md)

## License
GPL 3.0
