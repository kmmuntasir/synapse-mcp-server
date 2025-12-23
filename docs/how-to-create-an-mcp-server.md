Technical Specification: Data Search MCP Server
===============================================

1\. Objective
-------------

Create a Model Context Protocol (MCP) server that acts as a bridge between an AI agent and a specialized web service. The goal is to allow any MCP-compatible agent to perform semantic or keyword searches through a specific dataset via a standardized "Search" tool.

2\. Core Functionality
----------------------

-   **Server Name:** `data-search-mcp`

-   **Tool Name:** `search_dataset`

-   **Input:** A `query` string (the search term or question).

-   **Output:** A structured text response containing relevant data from the web service.

-   **Upstream API:** Communicates with a web service (e.g., `https://api.yourservice.com/search`).

* * * * *

3\. Implementation Options
--------------------------

### Option A: TypeScript (Standard SDK)

*Best for: Performance, strict type safety, and publishing to NPM.*

TypeScript

```
// index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "DataSearchServer",
  version: "1.0.0",
});

server.tool(
  "search_dataset",
  "Searches the internal dataset for information based on the query.",
  { query: z.string().describe("The search query or topic") },
  async ({ query }) => {
    try {
      const response = await fetch(`https://api.yourservice.com/search?q=${encodeURIComponent(query)}`);
      const data = await response.text();
      return { content: [{ type: "text", text: data }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

```

### Option B: Python (FastMCP)

*Best for: Rapid prototyping and Python-based data science environments.*

Python

```
# mcp_server.py
from fastmcp import FastMCP
import requests

mcp = FastMCP("DataSearchServer")

@mcp.tool()
async def search_dataset(query: str) -> str:
    """Searches the internal dataset for information based on the query."""
    url = f"https://api.yourservice.com/search?q={query}"
    try:
      r = requests.get(url)
      r.raise_for_status()
      return r.text
    except Exception as e:
      return f"Error: {str(e)}"

if __name__ == "__main__":
    mcp.run()

```

* * * * *

4\. Distribution Strategy (Team Portability)
--------------------------------------------

To ensure teammates can use this without manual setup or absolute paths, the server should be distributed via **NPM** using the `npx` pattern.

### Steps for the AI to follow:

1.  **Package Setup:** Create a `package.json` with a `bin` entry:

    JSON

    ```
    "bin": { "my-search-tool": "./dist/index.js" }

    ```

2.  **Shebang:** Ensure `index.ts` (or the compiled JS) starts with `#!/usr/bin/env node`.

3.  **Teammate Configuration:** Teammates simply add this to their `cline_mcp_settings.json`:

    JSON

    ```
    "mcpServers": {
      "shared-search": {
        "command": "npx",
        "args": ["-y", "@your-org/data-search-mcp"],
        "env": { "API_KEY": "..." }
      }
    }

    ```

* * * * *

5\. Deployment as a Remote Service (SSE/Streamable HTTP)
--------------------------------------------------------

If the team prefers a **zero-install centralized server**, the AI should implement the server using an HTTP transport (SSE or the 2025 "Streamable HTTP" standard).

-   **Architecture:** The server runs on a permanent host (AWS/Heroku).

-   **Connection:** Agents connect via URL instead of a local process.

    JSON

    ```
    "mcpServers": {
      "remote-search": {
        "url": "https://mcp.yourcompany.com/sse"
      }
    }

    ```

* * * * *

6\. MCP vs. Simple API (Context for the Agent)
----------------------------------------------

-   **Standardization:** MCP allows the agent to self-discover the tool's existence and schema without manual prompting.

-   **Reduced Context Bloat:** Only relevant search results are pulled into the LLM's prompt, rather than the agent having to "guess" how to hit a raw REST endpoint.

-   **Tool Use:** MCP enables "Function Calling" natively across different editors (Cursor, Roo Code, Claude Desktop) with a single implementation.


### Test with the Inspector

The best way to see if your tool is working is to use the official debugger:


```bash
npx @modelcontextprotocol/inspector npx tsx index.ts
```

This will open a web interface where you can click "List Tools" and actually run your search-my-dataset tool to see the results.

* * * * *

**Next Step for the AI Agent:**

> "Please initialize a new TypeScript MCP project using the `@modelcontextprotocol/sdk`. Set up the `search_dataset` tool to call my API, and configure the `package.json` so it can be executed via `npx` by my teammates."