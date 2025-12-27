# Release Note - v0.2.3

**Release Date:** December 28, 2025
**Previous Release:** v0.2.2 (December 27, 2025)
**Branch Comparison:** `v0.2.2` with `release/0.2.3`

## Overview
This feature release introduces a new **list mounted resources tool** that provides visibility into all mounted local directories and GitHub repositories. The release also enhances GitHub repository configuration with improved separator support and better error handling.

## Major Features
- **List Mounted Resources Tool**: New tool that returns a JSON array of all mounted resources, including local directories and GitHub repositories/paths, making it easier for AI agents to understand the available knowledge base structure.

## Enhancements
- **Flexible GitHub Repository Separators**: Enhanced [`GITHUB_REPOS`](src/index.ts:52) environment variable to support multiple separator types (comma, semicolon, colon) for better configuration flexibility.
- **Improved Repository Format Validation**: Added validation and warning messages for invalid GitHub repository formats to help users identify configuration issues early.
- **Enhanced Path Handling**: Improved parsing logic to better handle repository paths with subdirectories.

## Technical Improvements
- **New Tool Implementation**: Added [`list_mounted_resources`](src/index.ts:209) tool in [`src/index.ts`](src/index.ts:1) that:
  - Returns all mounted local directories as absolute paths
  - Returns all mounted GitHub repositories with their mount paths
  - Provides JSON-formatted output for easy parsing by AI agents
- **Regex-based Separator Parsing**: Updated GitHub repository parsing to use regex pattern `split(/[,;:]/)` for flexible separator support.
- **Error Handling**: Added warning messages for invalid repository formats to improve user experience during configuration.

## Documentation
- Updated [`.agent/workflows/release.md`](.agent/workflows/release.md:1) with release process improvements.

## Dependencies
- No new dependencies added in this release.

## Notes
- The `list_mounted_resources` tool requires no parameters and returns a simple JSON array, making it easy to use for discovery purposes.
- GitHub repository configuration now accepts `GITHUB_REPOS="owner/repo1;owner/repo2"` or `GITHUB_REPOS="owner/repo1:owner/repo2"` in addition to comma-separated format.
- Invalid repository formats now generate clear warning messages during server startup, helping users identify and fix configuration issues.

## Contributors
- @kmmuntasir
