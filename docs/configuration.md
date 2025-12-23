# Configuration Guide: Synapse-MCP

You can set the root directory for your notes in two ways:

## 1. Using Environment Variables
This is the standard MCP way. Add a `NOTES_ROOT` variable to your client configuration.

**Example (Claude Desktop / Cursor):**
```json
"synapse-mcp": {
  "command": "node",
  "args": ["C:/path/to/synapse-mcp-server/dist/index.js"],
  "env": {
    "NOTES_ROOT": "C:/Users/YourName/Documents/MyNotes"
  }
}
```

## 2. Using Command-Line Arguments
Alternatively, you can pass the path as the first argument after the script.

**Example:**
```json
"synapse-mcp": {
  "command": "node",
  "args": [
    "C:/path/to/synapse-mcp-server/dist/index.js",
    "C:/Users/YourName/Documents/MyNotes"
  ]
}
```

## Priority Order
1.  **Command-line argument** (highest priority)
2.  **`NOTES_ROOT` environment variable**
3.  **Current working directory** (fallback)
