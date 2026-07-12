---
name: whats-next
description: Report the current project position — what is done, what is in progress, and the recommended next task — by cross-checking docs/tasks/ against the actual code and git state. Use when the user asks "次は何をすれば良い？" / "どこまで進んでいる？" / "〜でしたっけ？".
---

Answer "where are we and what's next" with a fixed procedure instead of ad-hoc exploration. **Read-only: never edit files** (flag stale checkboxes; the user updates them via `/update-docs`).

## Steps

1. **Read the task sources**
   - [docs/tasks/README.md](../../../docs/tasks/README.md) for overall ordering
   - The in-progress feature task file(s) under `docs/tasks/features/` and `docs/tasks/cross-cutting/` (the ones imported in `.claude/CLAUDE.md`)

2. **Capture the working state**
   - `git branch --show-current`, `git status`, `git log develop..HEAD --oneline` (or main if no develop)
   - Open PRs if relevant: `gh pr list`

3. **Verify against reality, not just checkboxes.** For each task marked done or in progress, spot-check that the artifact actually exists in code (file, component, schema, config). Flag mismatches in both directions:
   - checked but artifact missing/incomplete
   - unchecked but already implemented (checkbox update leak)

4. **Report in Japanese** as a table:

   | 状態                            | タスク | 根拠（コード・コミット） |
   | ------------------------------- | ------ | ------------------------ |
   | ✅ 完了 / 🚧 進行中 / ⬜ 未着手 | ...    | file path or commit      |

   Then give **次の一手** — a single concrete recommendation (which task, which files to touch first, and any prerequisite like a migration or doc), plus alternatives only if the ordering is genuinely debatable.

5. **Flag doc drift**: if task checkboxes or CLAUDE.md imports are out of date, list them at the end as `/update-docs` candidates. Do not edit.
