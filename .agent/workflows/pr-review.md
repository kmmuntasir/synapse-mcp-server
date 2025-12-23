---
description: Instruction for Local PR Review
---

## Instruction for Local PR Review

When the user requests a **local PR review** by comparing two branches:

1. **Run a complete diff**  
   Compare the source branch against the target branch and analyze the actual code changes, not just commit messages.

2. **Identify what the changes represent**  
   Determine whether each change is a feature addition, bug fix, refactor, cleanup, or a potential breaking change. Note missing tests, incomplete docs, or inconsistencies.

3. **Assess code quality and impact**  
   Evaluate correctness, readability, maintainability, architectural alignment, performance implications, and security considerations. Check whether tests adequately cover the changes.

4. **Provide a senior-level review summary**  
   Offer direct, actionable feedback: call out risks, highlight strengths, suggest improvements, and indicate whether the changes are ready to merge or need revisions.

5. **Aim for practical, high-value feedback**  
   The goal is to emulate a real PR review from an experienced engineer—clear, specific, and focused on what matters.