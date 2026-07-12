---
name: screen-design-doc
description: Create or update a numbered screen design doc (docs/design/{screen}.md) from Stitch mockup screenshots. Use when a new screen needs a design doc, or to update one after a finalized screen was regenerated.
---

Create a screen design doc following `docs/design/_template.md` from a Stitch mockup. The target screen name (e.g. `categories`, `transactions`) is expected in `ARGUMENTS`; ask the user if missing. Design docs are written in Japanese.

**File naming / splitting policy (decided 2026-06-22)**: screens having two or more of list/create/edit/delete are split into `docs/design/{screen}-list.md`, `{screen}-create.md`, `{screen}-edit.md`, `{screen}-delete.md` (see the comment at the top of [\_template.md](../../../docs/design/_template.md)). Single screens with no CRUD concept (home, ai, landing, profile-setup, etc.) stay as one `{screen}.md`. The shared visual framework for Dialog/AlertDialog lives in [modals.md](../../../docs/design/modals.md); each CRUD file describes only screen-specific form fields and business logic.

This skill generalizes the procedure validated with the [categories-list.md prototype](../../../docs/design/categories/list.md); use it as a reference example (the categories files await regeneration and their content will change, but the format and section structure remain valid).

**Do not batch-generate multiple screens and write all design docs at the end.** As soon as the [`stitch-screen-mockup` skill](../stitch-screen-mockup/SKILL.md) has saved a finalized screenshot to `docs/design/screenshots/`, invoke this skill to finish the design doc before generating the next screen (user decision, 2026-06-22).

## Steps

### 1. Preconditions

- Check that `docs/design/screenshots/{screen}-pc.png` and `{screen}-sp.png` exist.
- **If the screen does not exist in Stitch yet (so no screenshot can be taken), first generate the mockup from the feature spec with the [`stitch-screen-mockup` skill](../stitch-screen-mockup/SKILL.md), then come back.** Generation/editing is that skill's responsibility; this skill only turns finished screens into docs.
- If the screen exists in Stitch but the screenshot is not saved locally: use the project ID from the「Stitchプロジェクト」section of `docs/design/README.md`, fetch the screenshot URL with Stitch MCP `get_screen`, and save it into `docs/design/screenshots/` with `curl`.
- Read the feature spec (`docs/specs/features/{feature}.md`) to understand the feature, API endpoints, and business flows the screen covers.
- **Include state-pattern screenshots** (tab switch, applied filter, one-off/recurring toggle, etc.). Besides the default state (PC/SP), any patterns saved as `{screen}-{device}-{state}.png` are also processed in steps 2–4 and reflected in the design doc (user decision, 2026-06-22).
- Invoking this skill is documentation work; it does not count as the generation/editing that needs approval on the `stitch-screen-mockup` side (see its [approval policy](../stitch-screen-mockup/SKILL.md#approval-policy-updated-2026-06-23)), so **no user approval is needed before running it** (user decision, 2026-06-22).

### 2. Identify parts

- Open both PC and SP screenshots with the Read tool and identify every major part (header elements, title, main components, buttons, navigation, FAB, ...).
- Watch for out-of-spec elements. Known tendencies (notification icon, header nav links, etc.) are listed in [style-guide.md](../../../docs/design/style-guide.md#現行スクリーンショットと仕様の差分チェック結果再生成前に必読) — check they have not recurred.
- Decide at this point which spec statement each part corresponds to (or that it has no spec = out of spec).
- **PC and SP parts may not map 1:1** (e.g. PC shows the logo, SP does not). Do not force shared numbers; number per device and show the mapping with separate "PC#" and "SP#" columns in the parts table.
- **Numbering state patterns**: always number the state-pattern images too (per the [source-image deletion policy](#delete-source-images-after-numbering-default), un-numbered images must not survive). Either continue the sequence from the default state or use a per-state scheme (e.g. A-1, A-2…) — both are acceptable (user decision, 2026-06-22). Continue the sequence when most parts are shared with the default; split per state when the layout differs substantially.

### 3. Draw number pins with Pillow

Choose coordinates by inspecting the screenshot. Check actual pixel size with `sips -g pixelWidth -g pixelHeight <path>` (read-only, allowlisted; Stitch images are often 2x their displayed size).

Draw with [`annotate_screenshot.py`](./annotate_screenshot.py) (bundled with this skill; restricted to reading/writing under `docs/design/screenshots/` and auto-approved).

```bash
python3 .claude/skills/screen-design-doc/annotate_screenshot.py \
  docs/design/screenshots/{screen}-pc.png \
  docs/design/screenshots/{screen}-pc-numbered.png \
  '[[x1,y1],[x2,y2],...]'

python3 .claude/skills/screen-design-doc/annotate_screenshot.py \
  docs/design/screenshots/{screen}-sp.png \
  docs/design/screenshots/{screen}-sp-numbered.png \
  '[[x1,y1],...]'
```

Pins are numbered from 1 in list order. Do not edit the script (arbitrary python execution is not auto-approved; only invoking this script is allowed in `.claude/settings.json`. Coordinate/path adjustments should suffice — ask the user if the script itself needs extending).

**Always loop: choose coordinates → draw → visually verify → adjust.** After drawing, open `*-numbered.png` with Read and confirm each pin sits near its intended element. Adjust and redraw when a pin is hard to read over text or clearly off target (slight text overlap is acceptable as long as it is identifiable).

#### Delete source images after numbering (default)

Once the `*-numbered.png` content is verified, delete the un-numbered source images (`docs/design/screenshots/{screen}-{device}.png` and un-numbered state-pattern images) right away. **This is the default per-screen step** — do not wait for all screens to be finished (user decision, 2026-06-22; only numbered screenshots are kept locally, see [design-docs-tooling.md](../../../docs/architecture/decisions/design-docs-tooling.md#画面設計書運用stitch)).

The original screen in Stitch (Screen ID) remains, so pins can be redone later by re-fetching the screenshot URL with `get_screen` and saving it again with `curl`.

### 4. Fill in `_template.md`

Copy `docs/design/_template.md` to `docs/design/{screen}.md` (or `{screen}-list.md` etc. per the splitting policy; see the comment at the top of [\_template.md](../../../docs/design/_template.md)) and fill in the sections (section names are Japanese in the template):

- **関連画面**: only the screens this one is reached from / leads to (the full transition map lives in `screen-flow.md`; do not duplicate it).
- **関連API**: copy from the feature spec's API endpoint table (link for details; only the mapping here).
- **採番済みスクリーンショット**: embed `*-numbered.png` and record the Stitch Screen ID. **When state patterns exist, include each pattern's numbered image and Screen ID alongside the default** (separate sections or extra table rows, whichever suits the screen).
- **パーツ一覧**: one number column when PC/SP share numbers, two columns otherwise (see step 2). Include out-of-spec parts and mark them as such.
- **状態一覧**: empty / error / loading states plus **state patterns (tab switch, filter applied, etc.)** — what changes per pattern and a link to its screenshot. If a state has no mockup representation, write「モックアップ上の表現はなし」and describe the expected behavior. If an empty state cannot occur (e.g. default data always exists), state why.
- **レスポンシブ差分**: skip simple layout-width differences; record only differing behavior or structure.
- **採用した方向性**: link each element to the spec statement it implements, in the form `[xxx.md](../specs/features/xxx.md#見出し)`.
- **既存実装との差分**: write「未実装のため差分なし。」when unimplemented.
- **仕様外要素**: a table keyed by part number (number → content → policy). Plain text is allowed, but tables read better later.
- **更新履歴**: creation date and changes.

### 5. Propagate updates

- When new out-of-spec elements/diffs are found, append them to the table in the [style-guide.md diff-check results](../../../docs/design/style-guide.md#現行スクリーンショットと仕様の差分チェック結果再生成前に必読) (to prevent recurrence at the next full regeneration).
- Update the screen's row in the [docs/design/README.md screen list](../../../docs/design/README.md#画面一覧) (link to the numbered screenshot, status column).

## Notes

- Fetching screenshots and generating images with Pillow are not implementation files, so they are exempt from CLAUDE.md's "no file changes unless explicitly requested" rule (the design doc itself is what the user asked for).
- Treat anything not written in `docs/specs/features/{feature}.md` as out of spec; never assume it "must be intended". Ask the user when in doubt.
