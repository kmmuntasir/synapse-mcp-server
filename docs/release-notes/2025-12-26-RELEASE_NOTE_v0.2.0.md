# Release Note - v0.2.0

**Release Date:** December 26, 2025
**Previous Release:** v0.1.2 (December 06, 2025)  
**Branch Comparison:** `v0.1.2` with `release/0.2.0`  

## Overview
This feature release introduces the **GitHub Integration**, allowing Synapse-MCP to act as a hybrid knowledge base by unifying local filesystem storage with remote GitHub repositories.

## Major Features
- **GitHub Integration (SYNAPSE-12)**: 
  - Ability to browse and read files from GitHub repositories using the same MCP tools.
  - Hybrid storage support: unified access to local notes and remote codebases.
  - Subdirectory restriction for enhanced security and focus.

## Enhancements
- **Multi-Root Support**: Improved handling of multiple directories within a single knowledge base instance.
- **Node 24 Compatibility**: Updated `devDependencies` including `typescript` and `@types/node` to ensure smooth operation on the latest Node.js LTS.

## Technical Improvements
- **Hybrid Provider Pattern**: Implemented a consistent provider interface for both filesystem and GitHub access.
- **Improved Error Handling**: More descriptive error messages for repository access and network issues.

## Documentation
- Updated architecture rules and MCP development guidelines.
- Archived legacy documentation to reduce clutter.

## Dependencies
- Added `octokit` for GitHub API interactions.
- Updated `typescript` to `^5.0.0`.

## Contributors
- @kmmuntasir
