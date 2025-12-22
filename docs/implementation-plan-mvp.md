# Implementation Plan - Phase 1: Local Knowledge Base (MVP)

## 1. Project Initialization & Setup
**Objective:** Set up the TypeScript environment and dependencies.

- [ ] **Initialize Project**
    - `npm init -y`
    - Update `package.json` with metadata (name: `synapse-mcp-server`, version: `0.1.0`).
- [ ] **Install Dependencies**
    - **Runtime:**
        - `@modelcontextprotocol/sdk`: Core MCP functionality.
        - `zod`: Schema validation for tool arguments.
        - `dotenv`: Environment variable management.
    - **Dev:**
        - `typescript`: Language support.
        - `@types/node`: Type definitions.
        - `eslint` (optional): Code linting.
- [ ] **Configure TypeScript (`tsconfig.json`)**
    - Target: `ES2022` (or latest Node LTS compatible).
    - Module: `NodeNext`.
    - OutDir: `./dist`.
    - Strict mode: `true`.
- [ ] **Executable Setup**
    - Add `bin` entry in `package.json` pointing to `./dist/index.js`.
    - Ensure `src/index.ts` has the shebang `#!/usr/bin/env node`.

## 2. Core Architecture Implementation
**Objective:** Build the foundation for data access (Providers).

- [ ] **Define Interfaces (`src/providers/interfaces.ts`)**
    - Define `KBProvider` interface with `list`, `read`, and `search` methods.
    - Define `FileSystemEntry` and `SearchResult` types.
- [ ] **Implement Local Provider (`src/providers/LocalFileSystemProvider.ts`)**
    - **Constructor:** Accept a `rootPath` string. Validate it exists.
    - **`list(path?)`:**
        - Resolve path relative to `rootPath`.
        - Prevent browsing outside `rootPath` (security check).
        - Recursively list files if needed (or just top-level, depending on `list_vault_structure` design). Recommended: Recursive with `glob` or `fs.readdir` options to get a full map.
    - **`read(path)`:**
        - Read file content from disk.
    - **`search(query)`:**
        - Iterate through all `.md` files in `rootPath`.
        - Perform case-insensitive string match.
        - Return matching files with a snippet of context.

## 3. MCP Server & Tool Registration
**Objective:** Expose the provider functionality to the AI.

- [ ] **Server Entry Point (`src/index.ts`)**
    - Initialize `McpServer`.
    - Parse command line arguments or `.env` to get the `NOTES_ROOT` path. Defaults to current directory if not set.
    - Instantiate `LocalFileSystemProvider`.
- [ ] **Register Tool: `list_directory`**
    - **Description:** "Recursively list all files in the allowed directory to understand the project structure."
    - **Schema:** `{ path: z.string().optional() }`
    - **Handler:** Call `provider.list()`.
- [ ] **Register Tool: `search_notes`**
    - **Description:** "Search for a keyword or phrase across all markdown files."
    - **Schema:** `{ query: z.string() }`
    - **Handler:** Call `provider.search()`.
- [ ] **Register Tool: `read_note`**
    - **Description:** "Read the full content of a specific file."
    - **Schema:** `{ path: z.string() }`
    - **Handler:** Call `provider.read()`.
- [ ] **Start Server**
    - Connect `StdioServerTransport` to `process.stdin` and `process.stdout`.

## 4. Verification & Distribution
**Objective:** Ensure the server works as expected.

- [ ] **Build Step**
    - Run `npm run build` (tsc).
- [ ] **Manual Testing**
    - Configure an MCP client (e.g., in VS Code or Claude Desktop) to run the server pointing to a dummy notes folder.
    - Verify `list_directory` returns the file tree.
    - Verify `search_notes` finds a known string.
    - Verify `read_note` returns content.
- [ ] **Distribution Prep**
    - Verify `npx .` works in a different directory (simulating local install).

## 5. Directory Structure Target
```text
synapse-mcp-server/
├── dist/                 # Compiled JS
├── src/
│   ├── index.ts
│   └── providers/
│       ├── interfaces.ts
│       └── LocalFileSystemProvider.ts
├── package.json
├── tsconfig.json
└── README.md
```
