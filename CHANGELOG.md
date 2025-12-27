# Changelog

# [2025-12-27] v0.2.2

## Detailed Changelog
- Check `./docs/release-notes/2025-12-27-RELEASE_NOTE_v0.2.2.md`

## Added
- **Large File Support**: Intelligent pagination system for reading files exceeding 4MB with configurable line limits.
- **Search Line Numbers**: Enhanced search functionality returning exact line numbers for precise code navigation.

## Changed
- **GitHub Caching**: Implemented comprehensive caching strategy for file content, metadata, and search results.
- **Local File Provider**: Extended with pagination support and improved metadata handling.
- **GitHub Provider**: Enhanced with caching layer and accurate line number tracking.

# [2025-12-26] v0.2.1

## Detailed Changelog
- Check `./docs/release-notes/2025-12-26-RELEASE_NOTE_v0.2.1.md`

## Added
- **Dynamic Versioning**: Server now reads version from `VERSION` file at runtime.

## Changed
- **Documentation**: Added comprehensive troubleshooting guide for connection issues in VS Code-based agents.

# [2025-12-26] v0.2.0

## Detailed Changelog
- Check `./docs/release-notes/2025-12-26-RELEASE_NOTE_v0.2.0.md`

## Added
- **GitHub Integration**: Unify local notes with remote GitHub repositories.
- **Hybrid Storage**: Access remote files using standard MCP tools.

## Changed
- **Dependency Update**: Migrated to modern TypeScript and Node.js 24 compatibility.

# [2025-12-23] v0.1.2

## Detailed Changelog
- Check `./docs/release-notes/2025-12-23-RELEASE_NOTE_v0.1.2.md`

## Added
- **Multi-Root Support**: Ability to unify multiple local directories (e.g., Obsidian vaults) into a single knowledge base via `NOTES_ROOT`.
- **Core MCP Tools**: 
    - `list_directory`: Recursive mapping of the knowledge base structure.
    - `search_notes`: High-speed keyword search with context snippets.
    - `read_note`: Full-text retrieval for file analysis.
- **Cross-Platform Compatibility**: Intelligent path separator handling for Windows (`;`) and Linux/macOS (`:`).
- **Agent Integration Guides**: Documentation for setup with Cursor, Roo Code, Claude Code, and Gemini CLI.
- **Validation**: Strict input schema validation using `zod`.

## Changed
- **Provider Abstraction**: Implemented the `KBProvider` interface to decouple data access from the server logic.
- **Logging Strategy**: Redirected all internal logs to `stderr` to ensure uninterrupted JSON-RPC communication on `stdio`.
- **Deployment Method**: Optimized for execution via `npx @kmmuntasir/synapse-mcp-server`.

## Removed
- N/A (Initial Release)