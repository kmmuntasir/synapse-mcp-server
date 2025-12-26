# Release Note - v0.2.1

**Release Date:** December 26, 2025
**Previous Release:** v0.2.0 (December 26, 2025)
**Branch Comparison:** `v0.2.0` with `release/0.2.1`

## Overview
This patch release introduces **dynamic versioning** and improves the user experience with enhanced troubleshooting documentation for common connection issues in VS Code-based AI agents.

## Major Features
- **Dynamic Versioning**: The server now reads version information dynamically from the [`VERSION`](VERSION:1) file at runtime, eliminating the need to hardcode version numbers in the source code.

## Enhancements
- **Enhanced Troubleshooting Guide**: Added comprehensive documentation in [`README.md`](README.md:84) addressing common connection timeout issues experienced by users running Synapse-MCP via `npx` in VS Code environments (Kilo Code, Roo Code). The guide provides step-by-step instructions for using a local build as a fallback solution.

## Technical Improvements
- **Runtime Version Loading**: Implemented dynamic version reading from the [`VERSION`](VERSION:1) file using Node.js `fs` module in [`src/index.ts`](src/index.ts:16-22), ensuring version consistency across the project.
- **Cleaned Up CI Configuration**: Removed the GitHub Actions publish workflow (`.github/workflows/publish.yml`) as it was no longer needed.

## Documentation
- Added detailed troubleshooting section covering:
  - Connection timeout symptoms
  - Local build and installation instructions
  - MCP configuration updates for local builds
  - Example configurations for different AI agents

## Dependencies
- No new dependencies added in this release.

## Notes
- Users experiencing connection issues with `npx` in VS Code-based agents should refer to the updated troubleshooting guide in the [`README.md`](README.md:84).
- The dynamic versioning system ensures that the server version displayed matches the [`VERSION`](VERSION:1) file content.

## Contributors
- @kmmuntasir
