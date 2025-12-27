# Release Note - v0.2.2

**Release Date:** December 27, 2025
**Previous Release:** v0.2.1 (December 26, 2025)
**Branch Comparison:** `v0.2.1` with `release/0.2.2`

## Overview
This feature release introduces **large file support** with intelligent pagination, enabling efficient reading of files exceeding 4MB. The release also implements comprehensive caching for GitHub operations and adds search line number support for precise code navigation.

## Major Features
- **Large File Support**: Implemented intelligent pagination system that allows reading files larger than 4MB by breaking them into manageable chunks with configurable line limits and response size limits.
- **Search Line Numbers**: Enhanced search functionality to return exact line numbers for matches, enabling precise navigation to specific code locations.

## Enhancements
- **Comprehensive GitHub Caching**: Implemented multi-level caching strategy for GitHub operations including file content, metadata, and search results, significantly reducing API calls and improving performance.
- **Enhanced Local File Provider**: Extended [`LocalFileSystemProvider`](src/providers/LocalFileSystemProvider.ts:1) with support for pagination, search line numbers, and improved file metadata handling.
- **Improved GitHub Provider**: Enhanced [`GitHubProvider`](src/providers/GitHubProvider.ts:1) with caching layer, pagination support, and accurate line number tracking for search results.

## Technical Improvements
- **Pagination System**: Implemented in [`src/providers/LocalFileSystemProvider.ts`](src/providers/LocalFileSystemProvider.ts:1) with configurable parameters:
  - Default: 100 lines per request
  - Maximum: 300 lines per request
  - Response size limit: 4MB
- **Caching Layer**: Added comprehensive caching in [`src/providers/GitHubProvider.ts`](src/providers/GitHubProvider.ts:1) with:
  - 3-minute TTL for file content
  - Separate caches for metadata and search results
  - Automatic cache invalidation strategy
- **Search Line Numbers**: Enhanced search operations to return precise line numbers using context-aware parsing in both local and GitHub providers.
- **Constants Configuration**: Centralized configuration in [`src/config/constants.ts`](src/config/constants.ts:1) for easy maintenance of pagination and caching settings.

## Documentation
- Updated [`README.md`](README.md:1) with large file support documentation and usage examples.
- Enhanced [`docs/development.md`](docs/development.md:1) with testing guidelines for large file scenarios.
- Added [`scripts/test-large-files.js`](scripts/test-large-files.js:1) for manual testing of large file operations.

## Dependencies
- No new dependencies added in this release.

## Notes
- Large file support is automatic - the server will paginate files exceeding the 4MB limit without requiring client configuration changes.
- GitHub caching significantly reduces API usage, making the server more efficient for repeated operations.
- Search line numbers are now accurate for both local files and GitHub repositories, enabling better navigation in AI agents.

## Contributors
- @kmmuntasir
