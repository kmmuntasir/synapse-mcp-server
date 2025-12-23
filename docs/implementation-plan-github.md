# Implementation Plan - GitHub Integration

## Goal
Enable Synapse-MCP to access files from GitHub repositories (public and private) alongside local directories. This transforms the server from a purely local file explorer to a hybrid local/cloud knowledge base.

## User Review Required
> [!IMPORTANT]
- **Authentication**: Private repositories require a `GITHUB_TOKEN` environment variable.
- **Rate Limits**: Unauthenticated GitHub access is severely rate-limited. It is highly recommended to provide a token even for public repos.
- **Mounting Strategy**: To avoid naming collisions between local files and GitHub repositories, GitHub repositories will be mounted under a virtual directory structure: `github/{owner}/{repo}/`. Local files will remain at the root `/` (serving as the default).

## Proposed Changes

### Dependencies
- Add `octokit` (or `@octokit/rest`) to interact with GitHub API.

### New Components

#### [NEW] [GitHubProvider.ts](file:///d:/localhost/synapse-mcp-server/src/providers/GitHubProvider.ts)
- Implements `KBProvider`.
- **Constructor**: Accepts `owner`, `repo`, and authenticated `Octokit` instance.
- **`list(path)`**:
    - Maps to `octokit.rest.repos.getContent`.
    - Returns `FileSystemEntry[]`.
- **`read(path)`**:
    - Maps to `octokit.rest.repos.getContent`.
    - Decodes Base64 content.
- **`search(query)`**:
    - Maps to `octokit.rest.search.code`.
    - Query format: `{query} repo:{owner}/{repo}`.

#### [NEW] [AggregatorProvider.ts](file:///d:/localhost/synapse-mcp-server/src/providers/AggregatorProvider.ts)
- Implements `KBProvider`.
- Manages a map of `prefix -> provider`.
- **`list(path)`**:
    - Intercepts paths matching registered prefixes (e.g., `github/`).
    - Merges results from the root provider (local) and virtual mount points.
- **`read(path)`**:
    - Routes to the correct provider based on path prefix.
- **`search(query)`**:
    - Broadcasts search to all providers.
    - Prefixes results with the mount path (e.g., `github/owner/repo/readme.md`).

### Modified Files

#### [MODIFY] [index.ts](file:///d:/localhost/synapse-mcp-server/src/index.ts)
- Import `Octokit`.
- Parse `GITHUB_TOKEN` and `GITHUB_REPOS` (comma-separated `owner/repo`) from environment.
- Instantiate `GitHubProvider` for each repo.
- Instantiate `AggregatorProvider`.
    - Mount `LocalFileSystemProvider` at root `/`.
    - Mount each `GitHubProvider` at `github/{owner}/{repo}`.
- Update `provider` instance to be the `AggregatorProvider`.

## Verification Plan

### Automated Tests
- Since this relies on external API, we will manually verify using the MCP inspector or specific tool calls.

### Manual Verification
1.  **Environment Setup**:
    - Create a `.env` file with `GITHUB_TOKEN`.
    - Set `GITHUB_REPOS=kvist-lab/synapse-mcp-server` (or another test repo).
2.  **Verify Listing**:
    - Call `list_directory('github/kvist-lab/synapse-mcp-server')`.
    - Expect to see repository files.
3.  **Verify Reading**:
    - Call `read_note('github/kvist-lab/synapse-mcp-server/README.md')`.
    - Expect to see file content.
4.  **Verify Search**:
    - Call `search_notes('synapse')`.
    - Expect results from both local and GitHub sources (if properly seeded).

### Error Handling Check
- Test with invalid token (should gracefully fail or show empty).
- Test with non-existent repo.
