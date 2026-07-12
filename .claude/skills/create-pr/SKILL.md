---
name: create-pr
description: Push the current branch and create a GitHub PR. Generates the PR body from commit history and diff; auto-selects the base branch from the project's branch conventions.
---

Run everything from pushing the current branch to `gh pr create`, but **always present the title and body to the user for approval before creating the PR**.

See [dev-workflow.md](../../../docs/architecture/decisions/dev-workflow.md) for the branch strategy background.

## Steps

1. **Preconditions**
   - Check `git status` for uncommitted changes. If changes that belong in the PR are uncommitted, prompt the user to commit and stop (unrelated work-in-progress files may remain; ask the user which is the case).
   - Determine the base branch from the current branch name:

     | Current branch        | Base      | Type                                             |
     | --------------------- | --------- | ------------------------------------------------ |
     | `feature/*`, `docs/*` | `develop` | Regular PR                                       |
     | `develop`             | `main`    | Release PR                                       |
     | `main`                | —         | Abort (tell the user to create a working branch) |

     For any other branch name, ask the user for the base.

2. **Gather information**
   - `git log <base>..HEAD --oneline` for the commit list
   - `git diff <base>...HEAD --stat` for the overall shape of the change
   - Only read individual file diffs when the intent is unclear.

3. **Generate title and body (in Japanese)**
   - Fill in the body following [.github/PULL_REQUEST_TEMPLATE.md](../../../.github/PULL_REQUEST_TEMPLATE.md) (概要 / 変更内容 / 確認方法 / 関連). Delete the HTML comments.
   - Title: same prefix convention as commits (`feat:`, `fix:`, `chore:`, ...) plus a Japanese summary.
   - In 関連, link the matching `docs/tasks/` or `docs/design/` files if any.
   - **Release PR**: title `Release: <date or summary>`; list the included merged PRs/commits in 変更内容.

4. **User approval**
   - Present base, title, and body; get approval. Apply requested edits and re-present.

5. **Push and create the PR**
   - After approval, push (use `git push -u origin <branch>` if no upstream is set).
   - `gh pr create --base <base> --title <title> --body <body>` (pass the body as a heredoc).
   - Report the PR URL.

## Notes

- claude-code-action reviews the PR automatically after creation (see [dev-workflow.md](../../../docs/architecture/decisions/dev-workflow.md)). The user handles the review comments.
- PRs touching only `docs/**`, `.claude/**`, `**.md` do not trigger CI (`paths-ignore`). Fine for PRs into develop, but a docs-only PR into main cannot satisfy the required status check — tell the user admin bypass will be needed.
- Never rewrite pushed commits (rebase / amend + force push) in this skill.
