# Release Note - v0.1.2

**Release Date:** December 23, 2025
**Previous Release:** None
**Branch Comparison:** None

## Overview

This is the initial official release of **Synapse-MCP**, a Hybrid Universal Knowledge Base MCP server. It provides a unified interface for AI agents to search and retrieve information from multiple local directories (e.g., Obsidian vaults or Markdown folders) as a single, cohesive knowledge base.

**Statistics:**
- Initial Release
- 15 files changed
- Core framework established

---

## 🎉 Major Features

### Multi-Root Knowledge Base Support
- **Unified Knowledge Source** - Intergrate multiple local directories (e.g., `C:/Notes;D:/Work`) into a single searchable interface.
  - **Cross-Platform Compatibility** - Intelligent path separator handling for Windows (`;`) and Linux/macOS (`:`).
  - **Environment-Driven Configuration** - Primary configuration via the `NOTES_ROOT` environment variable for seamless integration with Cursor, Roo Code, and more.
  - **CLI Flexibility** - Support for passing root directories as command-line arguments.

### Core MCP Toolset
- **Recursive Directory Listing** - `list_directory` tool for mapping the entire folder structure of the knowledge base.
- **Deep Content Search** - `search_notes` tool for high-speed keyword searches across all Markdown files, returning relevant context snippets.
- **Direct File Access** - `read_note` tool for retrieving full text content of specific files for detailed analysis.

---

## ✨ Enhancements

### Configuration & Deployment
- **Seamless Run via NPX** - Fully published and optimized for execution using `npx @kmmuntasir/synapse-mcp-server`.
- **Comprehensive Environment Support** - Pre-configured configurations for major AI agents (Cursor, Roo Code, Kilo Code, Claude Code, Gemini CLI).
- **Environment Variable Management** - Native support for `.env` files via `dotenv` for easy local development.

### Reliability & Performance
- **Unified Provider Abstraction** - Extensible architecture using a `KBProvider` interface, allowing for future specialized data sources.
- **Safe Stdio Transport** - All internal logging is routed to `stderr` to prevent interference with JSON-RPC communication on `stdio`.
- **Integrated Validation** - Robust argument validation using `zod` for all tool inputs.

---

## 🏗️ Technical Improvements

### Architecture
- **Provider Pattern Implementation** - Decoupled data access logic from the MCP server interface for better maintainability.
- **Robust Path Resolution** - Secure path handling to ensure all file operations stay within the defined root directories.

### Code Quality
- **TypeScript ESM Foundation** - Built with modern TypeScript and ESM for better performance and alignment with the Node.js ecosystem.
- **Standardized Error Handling** - Consistent error reporting across all tools to ensure a smooth user experience even when issues occur.

---

## 📚 Documentation

### Integration Guides
- **Multi-Platform Documentation** - Detailed setup instructions for Cursor, Roo Code, Kilo Code, Claude Code, and Gemini CLI.
- **Development & Source Installation** - Comprehensive guide for contributors to set up, build, and test the server locally.

### Project Standards
- **Architecture Rules** - Established clear guidelines for provider patterns, configuration, and MCP server development.
- **Code Style Guide** - Defined formatting and naming conventions for project-wide consistency.

---

## 📦 Dependencies

### Core Framework
- **@modelcontextprotocol/sdk** - The foundation for MCP server functionality.
- **zod** - Used for runtime type safety and schema validation.
- **dotenv** - Handles environment variable loading.

---

## 🚀 Breaking Changes
- N/A (Initial Release)

---

## 📝 Notes

### Getting Started
1. Set the `NOTES_ROOT` environment variable to your desired directories.
2. Add the server to your AI agent using the command `npx -y @kmmuntasir/synapse-mcp-server`.
3. Start interacting with your local knowledge base.

### Testing Checklist
- [x] Multi-root parsing and validation.
- [x] Recursive directory listing via `list_directory`.
- [x] Keyword search functionality via `search_notes`.
- [x] File content retrieval via `read_note`.
- [x] Stdio communication integrity.

---

## 👥 Contributors

This release establishes the foundation for a universal knowledge bridge between local files and AI agents.

---

**Generated:** December 23, 2025

