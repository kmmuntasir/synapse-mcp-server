Project Brief: synapse-mcp-server
1. Vision & Goals
Synapse-MCP is a "Hybrid Universal Knowledge Base" server. Unlike standard file-search tools, it aims to provide a unified interface for an AI to search across multiple disparate storage locations (Local, Cloud, and Network) without the AI needing to know the underlying technical implementation.

Primary Goal: Search a directory of .md files (Obsidian vaults or standard folders).

Secondary Goal: Extend search to remote sources (Dropbox, Google Drive, etc.) using a "Provider" architecture.

Vibe: Professional, modular, and fast.

2. Technical Roadmap
Milestone 1: Local Knowledge Base (The Foundation)
Implement a TypeScript-based MCP server using the @modelcontextprotocol/sdk.

Target: A local directory containing Markdown files.

Tools to Implement:

`list_vault_structure`: Recursively list files to give the AI a "map" of the knowledge base.

`search_markdown`: A keyword/regex search tool that scans file contents.

`read_note`: Returns the full content of a specific file.

Milestone 2: The "Provider" Abstraction
Refactor the logic into a Provider interface. This ensures that the AI's interaction with the tool remains identical whether the data is on a hard drive or in the cloud.

```
TypeScript

interface KBProvider {
  search(query: string): Promise<SearchResult[]>;
  read(path: string): Promise<string>;
  list(): Promise<string[]>;
}
```
Milestone 3: Remote Integration (Dropbox & Beyond)
Integrate the Dropbox SDK using a "CloudProvider" class.

Support authentication via an Access Token stored in a .env file.

Allow the AI to specify a source parameter (e.g., local vs dropbox) or search both simultaneously.

3. Project Structure (Initial)

```
Plaintext

synapse-mcp-server/
├── src/
│   ├── index.ts          # MCP Server Entry Point
│   ├── providers/
│   │   ├── base.ts       # KBProvider Interface
│   │   └── local.ts      # Local FS Implementation
│   └── utils/            # Markdown parsing & search helpers
├── .env                  # Configuration (Vault paths, API keys)
├── package.json
└── tsconfig.json
```
4. Instructions for the AI Agent
Initialize the Project: Use npm with @modelcontextprotocol/sdk and zod for argument validation.

Implementation Style: Use the Stdio transport for communication. Ensure all logs are sent to stderr so they don't interfere with the JSON-RPC messages on stdout.

Search Logic: For the search_markdown tool, implement a simple but robust content-matching system.

Error Handling: Provide descriptive error messages if a directory is missing or a file is unreadable.