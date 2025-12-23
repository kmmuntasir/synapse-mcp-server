# Product Requirements Document: Synapse-MCP

## 1. Executive Summary
Synapse-MCP is a Model Context Protocol (MCP) server designed to act as a "Hybrid Universal Knowledge Base." It provides a unified interface for AI agents to search and retrieve information from disparate storage locations, starting with local file systems (e.g., Obsidian vaults) and extending to cloud providers (e.g., Dropbox, Google Drive).

## 2. Goals & Objectives
### 2.1 Primary Goal (MVP)
Enable an AI agent to index, list, search, and read Markdown files from a local directory via a standardized MCP toolset.

### 2.2 Secondary Goal (Scalability)
Establish a modular "Provider" architecture that allows seamless addition of remote storage backends without changing the client-facing API.

## 3. Functional Requirements

### 3.1 Core Tools (The "Client" Interface)
The server must expose the following MCP tools:

1.  **`list_directory`** (or `list_vault_structure`)
    *   **Input:** `path` (optional, relative to root)
    *   **Output:** List of files/folders in the target path.
    *   **Purpose:** Allows the AI to discover the structure of the knowledge base.

2.  **`search_notes`** (or `search_markdown`)
    *   **Input:** `query` (string)
    *   **Output:** List of matching file paths and relevant snippets.
    *   **Logic:** Keyword matching or regex search within file contents.
    *   **Purpose:** Content discovery.

3.  **`read_note`**
    *   **Input:** `path` (relative)
    *   **Output:** Full content of the file.
    *   **Purpose:** Deep reading of retrieved documents.

### 3.2 Provider Interface (Internal API)
To support future expansion, the logic must be encapsulated in a `KBProvider` interface:
```typescript
interface KBProvider {
  /**
   * Lists files and directories at the given path.
   * @param path Relative path to list (default root)
   */
  list(path?: string): Promise<FileSystemEntry[]>;
  
  /**
   * Searches for files containing the query string.
   * @param query Search term
   */
  search(query: string): Promise<SearchResult[]>;
  
  /**
   * Reads the content of a file.
   * @param path Relative path to the file
   */
  read(path: string): Promise<string>;
}

interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  path: string; // Relative path
}

interface SearchResult {
  path: string;
  matches: string[]; // Snippets of context
  score?: number;
}
```

## 4. Technical Architecture

### 4.1 Technology Stack
*   **Language:** TypeScript (Node.js)
*   **Framework:** `@modelcontextprotocol/sdk`
*   **Validation:** `zod`
*   **Communication:** Stdio transport (JSON-RPC 2.0 via standard input/output)

### 4.2 Project Structure
```text
synapse-mcp-server/
├── src/
│   ├── index.ts          # Main entry point and MCP server setup
│   ├── providers/        # Data source implementations
│   │   ├── interfaces.ts # KBProvider definitions
│   │   └── LocalFileSystemProvider.ts
│   └── utils/            # Shared helpers (search logic, text parsing)
├── docs/                 # Documentation
├── package.json
└── tsconfig.json
```

## 5. Roadmap

### Phase 1: Local Knowledge Base (MVP)
*   Initialize TypeScript project structure.
*   Implement `LocalFileSystemProvider`.
*   Connect tools `list_directory`, `search_notes`, `read_note` to the local provider.
*   **Deliverable:** Working MCP server that searches a local folder.

### Phase 2: Abstraction Refactor
*   Formalize the `KBProvider` interface.
*   Refactor `LocalFileSystemProvider` to strictly adhere to the interface.
*   Ensure the main server logic (`index.ts`) is agnostic of the underlying provider.

### Phase 3: Remote Integration
*   Implement `DropboxProvider` using Dropbox SDK. (maybe Google Drive and Github, too)
*   Add configuration handling (Access Tokens via `.env`).
*   Add ability to select or combine providers.

## 6. Constraints & Assumptions
*   **File Type:** MVP focuses on Markdown (`.md`) files.
*   **Environment:** User will run this locally; filesystem access is assumed for the specific root directory.
*   **Performance:** Simple string matching is sufficient for MVP search; vector search is out of scope for v1.
*   **Security:** Access is restricted to the specified root directory (sandbox).

## 7. User Stories
*   *As an AI*, I want to see the folder structure so I can understand how information is organized.
*   *As an AI*, I want to search for specific keywords across all notes so I can find relevant info without reading everything.
*   *As a User*, I want to point this server at my Obsidian vault so my AI assistant can answer questions based on my personal notes.
