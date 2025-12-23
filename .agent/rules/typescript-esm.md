---
trigger: glob
globs: *.js, *.ts
---

# TypeScript & ESM Rules

1. **Import Extensions**:
   - All local imports MUST include the `.js` extension (e.g., `import { Foo } from './foo.js'`), even for TypeScript source files. This is required for Node.js ESM support.

2. **Type Safety**:
   - Avoid `any`. Define interfaces for all data structures.
   - Use `zod` schema inference where possible to keep types in sync with validation.

3. **Async/Await**:
   - Prefer `async/await` over raw Promises for readability.