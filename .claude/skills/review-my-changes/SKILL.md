---
name: review-my-changes
description: Review the user's own uncommitted (or branch) changes against the project's specs and conventions. Reports issues in Japanese without editing any files. Use when the user says "修正しました" / "確認してください" / "レビューして" about code they wrote themselves.
---

Review the user's self-written changes with a fixed procedure so no review dimension is skipped. **Never edit or create files — report findings only** (the user implements everything themselves).

## Steps

1. **Determine the review scope**
   - `git status` + `git diff` for uncommitted changes. If everything is committed, use `git diff <base>...HEAD` (base = `develop` for `feature/*`, see [dev-workflow.md](../../../docs/architecture/decisions/dev-workflow.md)).
   - If the user pointed at specific files or a specific concern, narrow to that — but still run step 4 checks on the touched packages.

2. **Map changed files to their governing docs** and read the relevant ones:
   - `apps/web/features/**`, `apps/web/app/**` → [frontend-conventions.md](../../../docs/architecture/decisions/frontend-conventions.md) + the form/component rules in `.claude/CLAUDE.md`
   - `apps/web/server/**`, `app/api/**` → [api-conventions.md](../../../docs/architecture/decisions/api-conventions.md), [security.md](../../../docs/architecture/decisions/security.md)
   - `packages/db/src/schema/**` → [database.md](../../../docs/architecture/database.md)
   - `*.test.ts(x)` → [testing-strategy.md](../../../docs/architecture/decisions/testing-strategy.md)
   - Any feature work → the in-progress spec `docs/specs/features/<feature>.md` and task list `docs/tasks/features/<feature>.md`

3. **Check the diff against those docs**, in this order:
   - **Spec conformance**: does the behavior match the feature spec (fields, validation, screen transitions, API contract)?
   - **Convention violations**: DAL pattern (no DB access in UI), Route/Form component separation, `mutate` + callbacks (not `mutateAsync`), Select `field.value ?? ''`, `z.enum` with string values, code-value conversion in `onSubmit`, `types/` placement rules
   - **Cross-cutting concerns**: does error handling / auth / logging integrate with the existing shared mechanisms instead of duplicating them?

4. **Run mechanical checks** on the affected packages:
   - `bun run lint` and `bun run check-types` (workspace-level `turbo` versions are fine)
   - `bun run test` only if test files or logic under test changed

5. **Report in Japanese**, grouped by severity:
   - 🔴 仕様・規約違反（修正必須） — cite the doc and line
   - 🟡 改善提案（実務上の推奨） — include the best-practice rationale with sources when available
   - ✅ 問題なしと確認した観点 — list what was checked so coverage is explicit
   - If a finding implies a docs/CLAUDE.md update, add one line saying so (the user triggers `/update-docs`).

## Notes

- Reference locations as `file:line` so they are clickable.
- Do not restate the whole diff back; only discuss findings.
- Task-list checkboxes (`docs/tasks/`) that this change completes: point them out, do not edit them.
