# Working Standards

## Scope

- Do what has been asked — nothing more, nothing less.
- Ask when ambiguous. Don't do more than requested.
- Verify work is complete: all instances updated, all deps added, duplicates eliminated.
- Never create files unless absolutely necessary. Always prefer editing an existing file.
- Never proactively create documentation files (`*.md`) or README files unless explicitly requested.

## Problem Solving

- Don't jump to quick fixes — understand the root cause first.
- Look at all related files, not just one.
- Search for existing implementations before creating new ones.
- Always read a file before editing it.
- When a solution fails, propose alternative approaches and ask the user how to proceed.

## Common Mistakes to Avoid

1. Over-engineering — adding unnecessary complexity, helpers, abstractions.
2. Wrong APIs — always verify API names exist before using (e.g. `useFlag` not `useFeatureFlag`).
3. Incomplete work — missing package.json deps, partial implementations, unchecked call sites.
4. Type assertions — use proper typing, never `as any`.
5. Skipping layers — calling Prisma from actions, or calling repos from hooks.
