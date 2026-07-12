---
name: stitch-screen-mockup
description: Generate or edit screen mockups from feature specs using the Google Stitch MCP. Use for screens with no screenshot in docs/design/ yet, for regenerating finalized versions, or for design-change requests.
---

Generate/edit screen mockups with the Stitch MCP (`mcp__stitch__*`). The target screen name (e.g. `categories`) is expected in `ARGUMENTS`; ask the user if missing.

This skill owns generation/editing (write operations). **Writing the design doc from finished screenshots belongs to the [`screen-design-doc` skill](../screen-design-doc/SKILL.md)** (both skills explain the split of responsibilities).

## Prerequisites

- Read the feature spec (`docs/specs/features/{feature}.md`): fields to collect, business flows, screen transitions.
- [`docs/design/style-guide.md`](../../../docs/design/style-guide.md) is required reading (brand, color palette, terminology, spec conformance, diff-check results, known Stitch constraints, prompt checklist). Summarize its rules into the prompt.
- Check the Stitch project ID and design-system ID in the「全体状況」section of [`docs/design/README.md`](../../../docs/design/README.md) (`generate_screen_from_text` must always receive the `designSystem` parameter).
- Check [README.md「次にやること」](../../../docs/design/README.md#次にやること) for regeneration priority (color catalog → component catalog → individual screens → modals). If shared base parts are unsettled, build those before individual screens.

## Approval policy (updated 2026-06-23)

**The old "wait for an explicit 'go' in chat before running" step is abolished** (the user explicitly allowed auto-approval twice — mid-session on 2026-06-22 and in the 2026-06-23 rules review — making this the standard). `generate_screen_from_text`, `edit_screens`, and `generate_variants` may run without per-call approval once the prompt is assembled. Accordingly, the main `mcp__stitch__*` write tools and screenshot operations under `docs/design/screenshots/` (`curl`, `cp`, `mv`, `rm`, ...) are permanently auto-approved in `.claude/settings.json`.

Still required:

- **When rebuilding an existing finalized screen, state in chat what will change (the gist of the prompt) before running** (never silently overwrite a finalized version; approval is not awaited, but the explanation is never skipped).
- Generation/editing is exempt from CLAUDE.md's "no file changes unless explicitly requested" rule (the mockup is what the user asked for), but the impact must stay within the mockups and the screen design docs (`docs/design/*.md`) — implementation code must not be affected.
- **Do not retry immediately with identical conditions after a timeout** (see [Notes](#notes) and the [style-guide known constraints](../../../docs/design/style-guide.md#stitch運用上の既知の制約次回大規模生成時の参考)); rapid retries tend to each succeed separately in the background and only multiply duplicates.

Invoking the [`screen-design-doc` skill](../screen-design-doc/SKILL.md) in step 9 (turning the finished screen into a doc) is out of scope for approval and may also run without waiting.

## Steps

1. **Write the prompt**: satisfy the style-guide's prompt checklist (concrete logo appearance, exclude the notification icon, palette, consistency with shared parts — header / nav / FAB / **table rows / tabs / member chips** —, explicitly name out-of-scope features, field granularity such as regionCode, prevent known diff regressions, re-forbid previously flagged issues, **explicitly no left sidebar**). Keep `variantCount` at `1` (shorter generation time, less duplicate triage; raise it only to compare alternatives).
2. **Default state vs state pattern**: when a finalized base screen already exists and only its state changes (tab switch, radio toggle, applied filter), use `mcp__stitch__generate_variants` in step 4 instead of `generate_screen_from_text` (pass the base screen ID in `selectedScreenIds`; start from `variantOptions: {creativeRange: "REFINE", aspects: ["TEXT_CONTENT"]}`, adding `"LAYOUT"` when the column structure itself changes). Use `generate_screen_from_text` for brand-new screens with no base (see [style-guide 画面パターン・状態デザインの方針](../../../docs/design/style-guide.md#画面パターン状態デザインの方針2026-06-22決定)).
3. **When rebuilding a finalized screen, state the changes in one line in chat first** (see [Approval policy](#approval-policy-updated-2026-06-23); not needed for brand-new screens).
4. **Run `generate_screen_from_text` or `generate_variants`** (the former requires `designSystem`). Generation may keep running in the background after a timeout; do not immediately re-run with the same conditions. First check `list_screens` for a new title (pagination may hide entries; `get_screen` by ID is more reliable when the ID is known). **Back-to-back retries after a single timeout tend to each succeed separately in the background, only multiplying duplicates** (observed repeatedly on 2026-06-23 with sign-in/sign-up and the bulk-delete confirmation dialog). Wait 1–2 minutes, check `list_screens`, repeat that cycle 2–3 times; move to the next retry only if the screen still has not appeared.
5. **Verify the result**: fetch the screenshot and check for out-of-spec elements (known tendencies are in the [style-guide diff-check results](../../../docs/design/style-guide.md#現行スクリーンショットと仕様の差分チェック結果再生成前に必読)). In particular check for **left-sidebar contamination** and that **table rows / tabs match the finalized look of other screens**.
6. **Fix problems with `edit_screens`.** Stitch tends to fix only 1–2 points per instruction, so include the full constraint list every time instead of only the new points. **`edit_screens` can return a success response without actually updating the files — after every call, re-fetch with `get_screen` and confirm the `htmlCode.name` / `screenshot.name` file IDs changed. If they did not change, do not retry `edit_screens`; regenerate from scratch with `generate_screen_from_text` / `generate_variants`.**
7. **Once finalized, update the screen's row in `docs/design/README.md`** (Stitch Screen ID, status).
8. If the user asks to make finalized versions visually identifiable, instruct Stitch to add a marker such as a red frame.
9. **Once the finalized screenshot is saved to `docs/design/screenshots/`, run the [`screen-design-doc` skill](../screen-design-doc/SKILL.md) to create/update the design doc before generating the next screen.** One screen at a time: generate → verify → design doc → next screen (writing while the context is fresh is more accurate, and rework surfaces earlier).

## Notes

- Behavioral constraints of the Stitch MCP tools themselves (timeouts, `list_screens` pagination, `roundness` auto-reset, `edit_screens` reliability, left-sidebar contamination, ...) live in the [style-guide known-constraints section](../../../docs/design/style-guide.md#stitch運用上の既知の制約次回大規模生成時の参考) — not duplicated here.
- Generation/editing does not count as changing implementation files, so it is exempt from CLAUDE.md's "no file changes unless explicitly requested" rule (the mockup is the user's request). See the [Approval policy](#approval-policy-updated-2026-06-23).
- The `mcp__stitch__*` write tools and the `curl` / `cp` / `mv` / `ls` / `rm` commands targeting `docs/design/screenshots/` are permanently auto-approved in `.claude/settings.json` (decided 2026-06-22, made permanent on 2026-06-23).
