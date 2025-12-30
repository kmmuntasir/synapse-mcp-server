# Synapse-MCP

**Synapse-MCP** is a "Hybrid Universal Knowledge Base" server for AI agents. It provides a unified interface to search and retrieve information from multiple local directories (e.g., Obsidian vaults or Markdown folders).

## Configuration

Synapse-MCP is run directly via `npx`. Configuration is handled via environment variables. Multiple values are always separated by commas.

### GitHub Integration (Remote)
You can also mount GitHub repositories as part of your knowledge base.

- **`NOTES_ROOT`**: A comma-separated list of local directory paths (e.g., Obsidian vaults or Markdown folders).
- **`GITHUB_TOKEN`**: (Mandatory) A Personal Access Token (classic or fine-grained) with `repo` scope.
- **`GITHUB_REPOS`**: A comma-separated list of `owner/repo` or `owner/repo/path/to/subdir`.
    - To search/access an entire repository: `owner/repo`
    - To restrict access to a specific folder: `owner/repo/docs`

**Note**: GitHub repositories are mounted under a virtual `github/` directory (e.g., `github/owner/repo/docs`). You can mount either a whole repository or a specific subdirectory to restrict the AI agent's access to only relevant context. The GitHub Search API is limited to 30 requests per minute; Synapse-MCP handles this internally with automatic throttling.

---

## Limitations

### MCP Transport
- **Maximum response size: 4MB** (safe limit for stdio transport)
- All file reads are paginated by default (100 lines)
- Maximum 300 lines can be requested in a single read
- Use `maxLines` or `startLine`/`endLine` to control the amount of data returned
- Responses are streamed for memory efficiency

### GitHub Repositories
- **Maximum file size: 100MB** (GitHub API hard limit)
- Files larger than 100MB cannot be retrieved and will result in an error
- For files larger than 100MB, consider using Git LFS or alternative storage
- Line count is only provided for files smaller than 1MB

### Local Filesystem
- No hard limit on file size
- Uses streaming for efficient memory usage
- Only markdown files are supported
- Line count is only provided for files smaller than 1MB

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
      "NOTES_ROOT": "/home/user/notes1,/home/user/notes2",
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
      "NOTES_ROOT": "/home/user/notes1,/home/user/notes2",
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
            "NOTES_ROOT": "/home/user/notes1,/home/user/notes2",
            "GITHUB_TOKEN": "your_token",
            "GITHUB_REPOS": "owner/repo/docs"
          }
        }
      }
    }
    ```


---

## Tools Available

- **`list_directory`**: Recursively list all files in the allowed directory to understand the project structure. Returns both local files and any mounted GitHub repositories.

- **`search_notes`**: Search for a keyword or phrase across all markdown files. Searches both local files and GitHub repositories. For GitHub files, fetches full content to calculate accurate line numbers and caches it for 3 minutes.

- **`read_note`**: Read the content of a file. Always uses pagination with a default of 100 lines. Use `startLine`, `endLine`, or `maxLines` to control the range. Returns content with metadata including line numbers and file size. For GitHub files, uses cached content if available (3-minute TTL) to avoid redundant API calls.

- **`get_file_info`**: Get metadata about a file without reading its content. Returns file size, line count (for files < 1MB), file type, and last modified date. Use this to determine file size before reading. For GitHub files, uses cached content if available (3-minute TTL) to avoid redundant API calls.

## Resources
- [GitHub Repository](https://github.com/kmmuntasir/synapse-mcp-server)
- [Development & Source Installation](https://github.com/kmmuntasir/synapse-mcp-server/blob/main/docs/development.md)

## License
GPL 3.0
