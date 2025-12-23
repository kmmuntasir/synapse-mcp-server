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