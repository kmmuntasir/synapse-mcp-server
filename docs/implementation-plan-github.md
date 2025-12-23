# Implementation Plan - GitHub Integration

## Goal
Enable Synapse-MCP to access files from GitHub repositories (public and private) alongside local directories. This transforms the server from a purely local file explorer to a hybrid local/cloud knowledge base.

## User Review Required
> [!IMPORTANT]
> - **Authentication**: A `GITHUB_TOKEN` is **MANDATORY** for all GitHub integrations, including public repositories. This ensures better rate limits and access to private repos.
> - **Throttling**: To stay within GitHub's Search API limits (30 req/min), the server will implement internal queuing and wait logic. If the limit is reached, tools will wait and retry automatically before returning.
> - **Mounting Strategy**: GitHub repositories will be mounted under `github/{owner}/{repo}/`. Local files remain at the root `/`.

## Proposed Changes

### Dependencies
- Add `octokit` (or `@octokit/rest`) to interact with GitHub API.

### New Components

#### [NEW] [GitHubProvider.ts](file:///d:/localhost/synapse-mcp-server/src/providers/GitHubProvider.ts)
- Implements `KBProvider`.
- **Constructor**: Accepts `owner`, `repo`, and authenticated `Octokit` instance.
- **Internal Throttler**: Uses a central rate-limiter check before executing `search` or `list` operations.
- **`list(path)`**:
    - Maps to `octokit.rest.repos.getContent`.
    - Returns `FileSystemEntry[]`.
- **`read(path)`**:
    - Maps to `octokit.rest.repos.getContent`.
    - Decodes Base64 content.
- **`search(query)`**:
    - Maps to `octokit.rest.search.code`.
    - Query format: `{query} repo:{owner}/{repo}`.
    - **Note**: This is the primary subject of throttling since the Search API has stricter limits than the Core API.

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
- Validation: If `GITHUB_REPOS` is provided, ensure `GITHUB_TOKEN` is present; otherwise, exit with a clear error message.
- Parse `GITHUB_REPOS` (comma-separated `owner/repo`) from environment.
- Instantiate `GitHubProvider` for each repo.
- Instantiate `AggregatorProvider`.
- Print a warning log on startup about the 30 req/min GitHub Search limit.

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
