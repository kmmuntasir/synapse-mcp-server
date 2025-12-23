---
description: How to create a new release for Synapse-MCP
---

# Release Process Workflow

Follow these steps to create a new official release of Synapse-MCP. Remember that these version numbers are examples, use the actual version numbers.

### 1. Version Detection & Branch Check
- Verify if the current branch follows the `release/x.y.z` pattern.
- If not, check the latest git tag (e.g., `v1.2.2`), suggest the next version (`v1.2.3`), and ask the user to confirm creating a new release branch: `git checkout -b release/1.2.3`.

### 2. Version Synchronization
- Update the version in `VERSION` file (no `v` prefix).
- Update the version in `package.json`.

// turbo
- Sync lockfile: `npm install`

### 3. Build & Verification
// turbo
- Verify build: `npm run build`

### 4. Feature & Change Analysis
- Compare the current branch with the latest release tag: `git log v1.2.2..HEAD`.
- Analyze commit messages and code changes since the last tag.

### 5. Release Note Generation
- Create a new comprehensive release note in `./docs/release-notes/` using the established format:
  - Header, Overview, Major Features, Enhancements, Technical Improvements, Documentation, Dependencies, Notes, Contributors.
  - Header Example:
```markdown
# Release Note - v1.2.3

**Release Date:** November 17, 2025
**Previous Release:** v1.2.2 (November 06, 2025)  
**Branch Comparison:** `v1.2.2` with `release/1.2.3`  
```


### 6. Changelog Update
- Prepend a summary of the release to `CHANGELOG.md`.
- Example changelog summary:
```markdown
# [2025-12-23] v0.1.2

## Detailed Changelog
- Check `./docs/release-notes/2025-12-23-RELEASE_NOTE_v0.1.2.md`

## Added
- **Multi-Root Support**: Ability to unify multiple local directories.
- **Validation**: Strict input schema validation using `zod`.

## Changed
- **Logging Strategy**: Redirected all internal logs to `stderr` to ensure uninterrupted JSON-RPC communication on `stdio`.

## Removed
- N/A (Initial Release)
```

### 7. Commit & Push
// turbo
- Run: `git add . && git commit -m "Add release notes for v1.2.3" && git push origin release/1.2.3`

### 8. Tagging & Publishing
// turbo
- Create and push tag: `git tag -a v1.2.3 -m "Release v1.2.3" && git push origin v1.2.3`
// turbo
- Create GitHub Release: `gh release create v1.2.3 --title "v1.2.3" --notes-file docs/release-notes/YYYY-MM-DD-RELEASE_NOTE_v1.2.3.md`