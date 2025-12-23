---
trigger: glob
description: A Description
globs: *.js, *.ts
---

# Code Style Guide

1. **Formatting**:
   - Indentation: **4 spaces**.
   - Quotes: **Single quotes** ('') preferred.
   - Semicolons: **Always** use semicolons.
   - Line ending: LF.

2. **Naming Conventions**:
   - Variables/Functions: `camelCase`
   - Classes/Interfaces: `PascalCase`. Interfaces should describe behavior or data shape (e.g., `KBProvider`, `FileSystemEntry`).
   - Constants: `UPPER_SNAKE_CASE` or `camelCase` (depending on usage).

3. **TypeScript**:
   - Explicit types where helpful, but rely on type inference for obvious cases.
   - Avoid `any`.
   - Prefer `async/await`.