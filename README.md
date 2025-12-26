# Synapse-MCP

**Synapse-MCP** is a "Hybrid Universal Knowledge Base" server for AI agents. It provides a unified interface to search and retrieve information from multiple local directories (e.g., Obsidian vaults or Markdown folders).

## Configuration

Synapse-MCP is run directly via `npx`. Configuration is strictly handled via the `NOTES_ROOT` environment variable.

### Note on Path Separators
When providing multiple directories, use the appropriate separator for your OS:
- **Windows**: Semicolon (`;`) → `C:/path1;D:/path2`
- **Linux/macOS**: Colon (`:`) → `/home/user/path1:/home/user/path2`

---

### GitHub Integration (Remote)
You can also mount GitHub repositories as part of your knowledge base.

- **`GITHUB_TOKEN`**: (Mandatory) A Personal Access Token (classic or fine-grained) with `repo` scope.
- **`GITHUB_REPOS`**: A comma-separated list of `owner/repo` or `owner/repo/path/to/subdir`.
    - To search/access an entire repository: `owner/repo`
    - To restrict access to a specific folder: `owner/repo/docs`

**Note**: GitHub repositories are mounted under a virtual `github/` directory (e.g., `github/owner/repo/docs`). You can mount either a whole repository or a specific subdirectory to restrict the AI agent's access to only relevant context. The GitHub Search API is limited to 30 requests per minute; Synapse-MCP handles this internally with automatic throttling.

---

### 1. Cursor
1. Go to **Settings** > **General** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Set the following:
   - **Name**: `synapse-mcp`
   - **Type**: `command`
   - **Command**: `npx -y @kmmuntasir/synapse-mcp-server`
   - **Environment Variables**: `NOTES_ROOT=...`, `GITHUB_TOKEN=your_token`, `GITHUB_REPOS=owner/repo/docs`

### 2. Roo Code (VS Code)
Add this to your `cline_mcp_settings.json`:
```json
"mcpServers": {
  "synapse-mcp": {
    "command": "npx",
    "args": ["-y", "@kmmuntasir/synapse-mcp-server"],
    "env": {
      "NOTES_ROOT": "/home/user/notes1:/home/user/notes2",
      "GITHUB_TOKEN": "your_token",
      "GITHUB_REPOS": "owner/repo/docs"
    }
  }
}
```

### 3. Kilo Code
1. Open **Kilo Settings** > **MCP Configuration**.
2. Add a new server:
   - **Command**: `npx`
   - **Arguments**: `-y`, `@kmmuntasir/synapse-mcp-server`
   - **Env Variables**: `NOTES_ROOT=...`, `GITHUB_TOKEN=...`, `GITHUB_REPOS=...`

### 4. Claude Code (CLI)
Run the following command to add the server:
```bash
claude mcp add npx -y @kmmuntasir/synapse-mcp-server --env NOTES_ROOT="..." --env GITHUB_TOKEN="..." --env GITHUB_REPOS="owner/repo/docs"
```

### 5. Gemini CLI
Add the following to your MCP configuration file (usually `~/.config/gemini-mcp/config.json`):
```json
"mcpServers": {
  "synapse-mcp": {
    "command": "npx",
    "args": ["-y", "@kmmuntasir/synapse-mcp-server"],
    "env": {
      "NOTES_ROOT": "/home/user/notes",
      "GITHUB_TOKEN": "your_token",
      "GITHUB_REPOS": "owner/repo/docs"
    }
  }
}
```

---

## Troubleshooting Connection Issues (Kilo Code / Roo Code)
Some users (especially in VS Code via Kilo Code or Roo Code) might experience connection timeouts or errors when running Synapse-MCP directly via `npx`. If the server fails to connect, follow these steps to use a local build:

1. **Clone & Build**:
   ```bash
   git clone https://github.com/kmmuntasir/synapse-mcp-server.git
   cd synapse-mcp-server
   npm install
   npm run build
   ```
2. **Update MCP Configuration**:
   Instead of using `npx`, point your configuration directly to the local `dist/index.js` file.
   - **Command**: `node`
   - **Arguments**: `/absolute/path/to/synapse-mcp-server/dist/index.js`
   - **Environment Variables**: (Keep your `NOTES_ROOT`, etc.)

    So the final MCP config will look like this:
    ```json
    {
      "mcpServers": {
        "synapse-mcp": {
          "command": "node",
          "args": ["/absolute/path/to/synapse-mcp-server/dist/index.js"],
          "env": {
            "NOTES_ROOT": "/home/user/notes",
            "GITHUB_TOKEN": "your_token",
            "GITHUB_REPOS": "owner/repo/docs"
          }
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
