# Refactoring Plan

**Date:** 2025-12-30 12:14:40 UTC

## Overview

This document outlines refactoring opportunities identified in the synapse-mcp-server codebase to improve maintainability, testability, and code organization.

---

## 1. Break Down `src/index.ts` (263 lines)

### Current Issues
- Mixes concerns: initialization, tool registration, and error handling
- Contains duplicate error handling patterns
- Hard to test individual components
- Tool registration logic is tightly coupled with initialization

### Proposed Structure

```
src/
├── index.ts (entry point - ~30 lines)
├── server/
│   ├── server.ts (MCP server initialization)
│   └── tools/ (tool definitions)
│       ├── listDirectory.ts
│       ├── searchNotes.ts
│       ├── readNote.ts
│       ├── getFileInfo.ts
│       └── listMountedResources.ts
├── config/
│   ├── constants.ts (existing)
│   └── config.ts (configuration loading)
└── utils/
    ├── responseHandler.ts (error handling & response formatting)
    └── validation.ts (input validation)
```

### Detailed Breakdown

#### 1.1 `src/server/server.ts` (~50 lines)
- MCP server initialization
- Version loading
- Server connection logic
- Export configured server instance

#### 1.2 Tool Modules (each ~30-40 lines)
Each tool in its own file:
- `src/server/tools/listDirectory.ts`
- `src/server/tools/searchNotes.ts`
- `src/server/tools/readNote.ts`
- `src/server/tools/getFileInfo.ts`
- `src/server/tools/listMountedResources.ts`

Benefits:
- Single Responsibility Principle
- Easier to test individual tools
- Clear separation of concerns

#### 1.3 `src/utils/responseHandler.ts` (~30 lines)
Extract common patterns:
```typescript
export function handleToolError(error: unknown): ToolResponse {
    return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
    };
}

export function handleToolSuccess(data: any): ToolResponse {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
}
```

#### 1.4 `src/utils/validation.ts` (~20 lines)
Move `validateResponseSize` function from index.ts here.

#### 1.5 `src/config/config.ts` (~40 lines)
Extract initialization logic:
- Load environment variables
- Parse CLI arguments
- Initialize providers
- Setup GitHub repositories

---

## 2. Extract Duplicate Code in Providers

### 2.1 Duplicate `validateReadOptions` Method

**Current State:**
- [`LocalFileSystemProvider.ts:108-146`](../src/providers/LocalFileSystemProvider.ts:108-146)
- [`GitHubProvider.ts:161-199`](../src/providers/GitHubProvider.ts:161-199)

**Proposed Solution:**
Create `src/providers/utils/validation.ts`:
```typescript
import { ReadOptions } from './interfaces.js';
import { MAX_REQUESTED_LINES } from '../../config/constants.js';

export function validateReadOptions(options?: ReadOptions): void {
    // Shared validation logic
}
```

### 2.2 Duplicate `extractMatches` Logic

**Current State:**
- [`LocalFileSystemProvider.ts:277-294`](../src/providers/LocalFileSystemProvider.ts:277-294)
- [`GitHubProvider.ts:240-262`](../src/providers/GitHubProvider.ts:240-262)

**Proposed Solution:**
Create `src/providers/utils/search.ts`:
```typescript
export function extractMatches(
    content: string,
    query: string,
    contextRows: number = 1
): Array<{ line: number; content: string }> {
    // Shared extraction logic
}
```

---

## 3. Improve `GitHubProvider` (413 lines)

### Current Issues
- Large class with multiple responsibilities
- Throttling logic embedded in class
- Cache management mixed with business logic

### Proposed Breakdown

```
src/providers/
├── GitHubProvider.ts (main class - ~200 lines)
├── github/
│   ├── GitHubSearchThrottler.ts (throttling logic)
│   ├── GitHubCache.ts (cache management)
│   └── GitHubPathUtils.ts (path manipulation)
```

#### 3.1 `src/providers/github/GitHubSearchThrottler.ts` (~35 lines)
Extract the throttling class currently at lines 15-34.

#### 3.2 `src/providers/github/GitHubCache.ts` (~50 lines)
Extract cache management:
```typescript
export class GitHubCache {
    private contentCache: Map<string, { content: string; timestamp: number }>;
    private commitDateCache: Map<string, { date: Date; timestamp: number }>;
    
    // Methods: get, set, clear, isExpired
}
```

#### 3.3 `src/providers/github/GitHubPathUtils.ts` (~20 lines)
Extract path manipulation utilities.

---

## 4. Improve `LocalFileSystemProvider` (354 lines)

### Current Issues
- Large class with multiple responsibilities
- Streaming logic could be extracted
- Search logic is complex

### Proposed Breakdown

```
src/providers/
├── LocalFileSystemProvider.ts (main class - ~200 lines)
└── local/
    ├── FileStreamReader.ts (streaming logic)
    ├── FileSystemWalker.ts (search/walk logic)
    └── PathResolver.ts (path resolution logic)
```

#### 4.1 `src/providers/local/FileStreamReader.ts` (~100 lines)
Extract streaming logic from lines 148-235 and 328-353.

#### 4.2 `src/providers/local/FileSystemWalker.ts` (~40 lines)
Extract search walk logic from lines 237-275.

#### 4.3 `src/providers/local/PathResolver.ts` (~30 lines)
Extract path resolution from lines 16-28.

---

## 5. Additional Optimizations

### 5.1 Extract Constants
- Move magic numbers to [`constants.ts`](../src/config/constants.ts:1-44)
- Consider adding environment-specific constants

### 5.2 Improve Error Handling
- Create custom error classes
- Standardize error messages
- Add error codes for better debugging

### 5.3 Add Type Safety
- Create stricter types for tool responses
- Use discriminated unions for better type inference

### 5.4 Documentation
- Add JSDoc comments to all public APIs
- Document complex algorithms
- Add usage examples

---

## Implementation Priority

### Phase 1: High Impact, Low Risk
1. Extract `src/utils/responseHandler.ts`
2. Extract `src/utils/validation.ts`
3. Create `src/providers/utils/validation.ts`
4. Create `src/providers/utils/search.ts`

### Phase 2: Moderate Impact, Moderate Risk
5. Break down `src/index.ts` into tool modules
6. Extract `src/config/config.ts`
7. Extract `src/providers/github/GitHubSearchThrottler.ts`

### Phase 3: Lower Impact, Higher Risk
8. Refactor `GitHubProvider` cache management
9. Refactor `LocalFileSystemProvider` streaming logic
10. Extract path utilities

---

## Benefits Summary

| Refactoring | Benefit | Risk Level |
|-------------|----------|------------|
| Break down index.ts | Better testability, clearer separation | Low |
| Extract duplicate validation | DRY, easier maintenance | Low |
| Extract duplicate search logic | DRY, consistent behavior | Low |
| Refactor GitHubProvider | Better separation of concerns | Medium |
| Refactor LocalFileSystemProvider | More modular, testable | Medium |

---

## Testing Strategy

1. **Unit Tests**: Test each extracted module independently
2. **Integration Tests**: Ensure providers still work correctly
3. **E2E Tests**: Verify MCP server functionality
4. **Regression Tests**: Ensure no breaking changes

---

## Notes

- All changes should maintain backward compatibility
- Follow existing code style (4-space indentation, single quotes)
- Use TypeScript strict mode
- Ensure all imports use `.js` extension for ESM
