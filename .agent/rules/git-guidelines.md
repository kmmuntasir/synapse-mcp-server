---
trigger: model_decision
description: Ruleset that MUST be followed when executing ANY `git` command
---

# Git Guidelines

## Sacred Rule:
- NEVER run a `git` command without user's explicit approval.

## Project Slug:
- PROJECTSLUG is a shortened name for the project to be used as an abbreviation for several things, example: JIRA tickets.
- PROJECTSLUG can be found in the `./project-metadata.md` file.

## Branch Naming:  
- Format: type/PROJECTSLUG-TICKET_NUMBER-hyphenated-short-description  
- Example: `feature/ABCD-1234-add-login-feature`, `bugfix/ABCD-2345-invisible-border-issue`
- Exception: Release branches should be named like this: `release/1.2.3`, no description or ticket number, just the version number.
- Use imperative, hyphenated style for description.  
- Never assume ticket number. If missing, omit it.  

## Commit Messages:
- ALWAYS use single line commit message
- Format: PROJECTSLUG-TICKET_NUMBER: message  
- Example: `ABCD-1234: Add login validation middleware`
- Extract ticket number from branch name  
- If ticket is not identifiable, omit prefix and write message only.