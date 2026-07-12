---
name: commit
description: Generate a commit message from the staged changes, present it for user approval, then commit. Use when the user asks to commit staged work or says "コミットして".
---

Generate a commit message from the staged changes, but **always present the message to the user for approval before committing**.

## Steps

1. **Preconditions**
   - Abort if the current branch is `main` or `develop`; tell the user to create a working branch first (see [dev-workflow.md](../../../docs/architecture/decisions/dev-workflow.md)).
   - Run `git status` and `git diff --cached --stat`.
     - If nothing is staged but there are unstaged/untracked changes, show them and ask the user what to stage (propose a grouping if the changes clearly split into unrelated concerns). Stage only what the user approves — never `git add -A` on your own.
     - If there are no changes at all, report that and stop.
   - If staged and unstaged changes are mixed, commit only the staged ones; mention the leftovers so the user is aware.

2. **Understand the change**
   - `git diff --cached` to read the staged diff (use `--stat` first and read individual files only as needed for large diffs).
   - If the staged files span clearly unrelated concerns, point it out and suggest splitting into multiple commits before proceeding.

3. **Generate the commit message (in Japanese)**
   - Format: `<prefix>: <Japanese summary>` matching the existing history (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, ...).
   - One line is the default. Add a body (blank line + bullet points) only when the summary alone cannot convey the intent.
   - Describe the **why/intent**, not a file list.

4. **User approval**
   - Present the message (and the staged file list) and get approval. Apply requested edits and re-present.

5. **Commit**
   - After approval, run `git commit -m <message>` (heredoc if multi-line).
   - lefthook pre-commit hooks may run; if the hook fails, report the output and stop — do not use `--no-verify`.
   - Report the resulting commit hash and summary.

## Notes

- Never amend, rebase, or push in this skill. Use `/create-pr` for pushing and PR creation.
- Do not modify any files; this skill only stages (with approval) and commits.
