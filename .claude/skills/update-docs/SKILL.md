---
name: update-docs
description: Reflect specs, designs, and technical decisions settled in conversation into docs/, the root README.md, and CLAUDE.md.
---

Reflect specifications, designs, and technical decisions settled during the conversation into `docs/`, the root `README.md`, and `.claude/CLAUDE.md`. All documents are written in Japanese.

## Steps

1. **Identify what to update**
   - Review the conversation and list the settled specs / designs / decisions.
   - Identify the affected files (see [Target documents](#target-documents); the mapping table in `docs/README.md` also helps).
   - If Claude's own working rules or permissions changed, include `.claude/CLAUDE.md`.
   - If the set of in-progress features/tasks changed, also swap the `@docs/` import list in CLAUDE.md (see the "import の運用ルール" section there).

2. **Present the changes**
   - List the target files and planned updates as bullets.
   - Include paths and content for any new files.
   - Get the user's approval before executing.

3. **Execute**
   - Apply the updates after approval.
   - Split directories/files when a single file grows too long (e.g. theme-based files under `docs/architecture/decisions/`).
   - Overwrite or delete existing statements that contradict the new decision.
   - Never duplicate the same content across files; write details in one place and link from the others.

## Target documents

| File                                                        | Content                                                                                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root `README.md`                                            | Human-facing entry points (setup, command list, dev-flow diagram, tech stack, docs index). Update whenever these change                                         |
| `docs/README.md`                                            | Directory map, update-target mapping table                                                                                                                      |
| `docs/specs/product.md`                                     | Product-wide requirements                                                                                                                                       |
| `docs/specs/overview.md`                                    | Screen list, API overview, code values, validation rules                                                                                                        |
| `docs/specs/features/*.md`                                  | Per-feature detailed specs                                                                                                                                      |
| `docs/architecture/overview.md`                             | System layout, directory structure, screen layout decisions                                                                                                     |
| `docs/architecture/decisions/*.md`                          | Technical decisions & conventions, by theme (stack / api-conventions / frontend-conventions / security / testing-strategy / dev-workflow / design-docs-tooling) |
| `docs/architecture/database.md`, `schema.dbml`              | DB schema                                                                                                                                                       |
| `docs/design/`                                              | Screen mockups & screen design docs                                                                                                                             |
| `docs/tasks/features/*.md`, `docs/tasks/cross-cutting/*.md` | Implementation task progress                                                                                                                                    |
| `.claude/CLAUDE.md`                                         | Claude's working rules, style guides, list of imported `docs/` files                                                                                            |
