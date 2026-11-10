---
title: Choose the paper's colour
description: Adds a row of colour swatches that fade the paper's coloured side to the chosen colour, each light enough to keep the black fold lines readable.
type: plan
---

## Context

- Delivers the colour choice: a row of swatches, each a plain square of
  colour. Choosing one fades the paper's coloured side quickly to that
  colour. The off-white back never changes, so the paper stays
  two-tone.
- Implements the polish rulings in
  [Scope](../done/02-simple-folds-research.md#scope) of
  [02-simple-folds-research.md](../done/02-simple-folds-research.md), and
  answers its warning under
  [Printed fold lines](../done/02-simple-folds-research.md#printed-fold-lines)
  that black lines will not show on a dark paper colour.
- Depends on [Plan 02c](../done/02c-printed-fold-lines.md), whose fold lines
  must stay readable and whose checkbox shares the control bar. It
  follows [Plan 03](03-spin-the-paper.md) but needs nothing from it.
- Feeds [Plan 05](05-paper-grain.md), whose grain multiplies whichever
  colour is showing.
- Rests on
  [radio inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio),
  [`appearance`](https://developer.mozilla.org/en-US/docs/Web/CSS/appearance)
  and WCAG's
  [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
  ratio of 3:1. Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10.

## Decisions

1. **The front only**: a swatch sets the colour of the paper's front,
   the side that carries the fold lines. `PAPER_BACK_COLOR` stays.
2. **The colours** live in `PAPER_COLORS`, in
   `docs/src/scene/paper-colors.js`, each under an assigned id: the
   five below, open to tuning by eye at Manual QA 3 and 4. Red is
   today's `PAPER_FRONT_COLOR`, which moves there from
   `docs/src/scene/paper.js`. Every colour's contrast against the black
   fold lines is at least 3:1; these five run from 4.48 to 11.51
   (computed 2026-11-10, by WCAG's relative luminance).

   | Id       | Name   | Hex        | Contrast with black |
   | -------- | ------ | ---------- | ------------------- |
   | `red`    | Red    | `0xd9342b` | 4.48                |
   | `yellow` | Yellow | `0xf2b632` | 11.51               |
   | `green`  | Green  | `0x4fae5a` | 7.53                |
   | `blue`   | Blue   | `0x3d8fd9` | 6.13                |
   | `pink`   | Pink   | `0xe8739f` | 7.38                |

3. **Swatches are radio inputs**: one colour of several is a radio
   group, so the chosen swatch is marked, and Tab and the arrow keys
   work, with no JavaScript. Each is styled with `appearance: none` as
   a plain square; the `:checked` one carries a ring in `CanvasText`.
   The group comes last in the control bar, in the table's order, with
   red checked:

   ```html
   <div class="paper-colors" role="radiogroup" aria-label="Paper colour">
     <input
       type="radio"
       name="paper-color"
       value="red"
       aria-label="Red"
       checked
     />
     <!-- … one input for each colour … -->
   </div>
   ```

4. **Each swatch takes its colour from `PAPER_COLORS`**:
   `connectColorSwatches(colors, onChange)` in
   `docs/src/ui/color-swatches.js` sets each input's `--swatch-color`
   custom property from the entry its `value` names, which the CSS
   paints as its background. It throws at once if an input names no
   known colour or none is checked, returns the checked input's id, and
   calls `onChange(id)` at every change. The page's HTML therefore
   holds ids only, and no colour is written twice.
5. **The fade**: `PAPER_COLOR_FADE_SECONDS = 0.3`, the length of the
   fold lines' fade-out, eased with smoothstep() from
   `docs/src/fold/easing.js`.
   - `stepColorFade(deltaSeconds, fade)`, pure, in `paper-colors.js`,
     advances `fade.progress` to 1 and returns true while it changes.

     ```json
     { "progress": 0.5 }
     ```

   - `createPaper()` takes the front's colour at creation. Its
     `startFrontColorFade(color)` notes the colour now showing as the
     fade's start and `color` as its end, in two scratch `Color`s;
     `setFrontColorFade(progress)` mixes them into the front material
     with
     [`Color.lerpColors()`](https://github.com/mrdoob/three.js/blob/r187/src/math/Color.js),
     and allocates nothing. Colours mix in Three.js's working colour
     space, as its default colour management has it.
6. **A colour change does not wait**: it starts at once, whatever the
   paper is doing, since it touches nothing in the fold sequence. A
   change during a fade starts again from the colour then showing. At
   load, the paper takes the checked swatch's colour with no fade,
   since a browser may restore a radio's state on reload.
7. **The control bar is renamed**: `.fold-buttons` becomes `.controls`
   in `docs/index.html` and `docs/styles/main.css`, with its custom
   properties (`--controls-gap`, `--controls-offset`), since it now
   holds more than fold buttons. The scripts find their elements by
   `data-` attribute and by `name`, so none changes for the rename.
8. **No performance step**: a fade writes one colour a frame for a
   third of a second, and nothing is rebuilt or uploaded.

## Steps

### Step 1: The colours and the fade's maths [P]

- Adds `docs/src/scene/paper-colors.js`: `PAPER_COLORS`,
  `PAPER_COLOR_FADE_SECONDS` and `stepColorFade()` (Decisions 2, 5).
- It should hold every colour of Decision 2, each with a contrast of at
  least 3:1 against black (Agent QA 1).
- It should run a fade from 0 to 1 in `PAPER_COLOR_FADE_SECONDS`, and
  report when nothing is left to change (Agent QA 2).
- It should import nothing, so Node can run it (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_COLORS } from "./docs/src/scene/paper-colors.js"; const lum = (hex) => { const [r, g, b] = [hex >> 16, (hex >> 8) & 255, hex & 255].map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }; const hexes = Object.values(PAPER_COLORS); console.log(hexes.length, hexes.every((hex) => (lum(hex) + 0.05) / 0.05 >= 3));'`
   Expect: `5 true` (the count is Decision 2's)
2. Do: `node --input-type=module -e 'import { PAPER_COLOR_FADE_SECONDS as t, stepColorFade } from "./docs/src/scene/paper-colors.js"; const f = { progress: 0 }; const log = [stepColorFade(t / 2, f), f.progress.toFixed(4)]; log.push(stepColorFade(t, f), f.progress, stepColorFade(t, f)); console.log(...log);'`
   Expect: `true 0.5000 true 1 false`
3. Do: `grep -c '^import' docs/src/scene/paper-colors.js`
   Expect: `0`

### Step 2: The swatches, and the paper's fade

- Adds `docs/src/ui/color-swatches.js`: `connectColorSwatches()`
  (Decision 4).
- Changes `docs/index.html` and `docs/styles/main.css`: the bar's new
  name, the swatch group and its styles (Decisions 3, 7). The
  stylesheet's opening comment, which names `src/scene/paper.js` as the
  home of the paper's colours, is corrected.
- Changes `docs/src/scene/paper.js`: `PAPER_FRONT_COLOR` goes;
  `createPaper()` takes the front's colour and gains
  `startFrontColorFade()` and `setFrontColorFade()` (Decision 5).
- Changes `docs/src/main.js`: the fade's state, the swatches'
  connection, and `stepColorFade()` in the frame loop (Decisions 5, 6).
- It should show one plain square for each colour, after the checkbox,
  the chosen one ringed (Manual QA 1).
- It should fade the paper's front to a chosen colour in about
  `PAPER_COLOR_FADE_SECONDS`, and leave the back off-white
  (Manual QA 2, 3).
- It should keep the black fold lines readable on every colour
  (Manual QA 4).
- It should change colour at once in mid-fold, and from the colour
  showing in mid-fade (Manual QA 4, 5).
- It should work from the keyboard, with a visible focus ring
  (Manual QA 6).
- It should load in the checked swatch's colour, with no fade
  (Manual QA 1, 7).
- It should show the swatches and the ring clearly in the light and the
  dark colour scheme (Manual QA 8).
- It should leave the fold buttons and the checkbox working in the
  renamed bar (Manual QA 9).

**Agent QA**

1. Do: `grep -c 'name="paper-color"' docs/index.html`
   Expect: `5` (one for each colour of Decision 2)
2. Do: `grep -c 'fold-buttons' docs/index.html docs/styles/main.css`
   Expect: `0` for each file
3. Do: `grep -c 'PAPER_FRONT_COLOR' docs/src/scene/paper.js docs/src/main.js`
   Expect: `0` for each file
4. Do: `grep -c 'lerpColors\|--swatch-color' docs/src/scene/paper.js docs/src/ui/color-swatches.js docs/styles/main.css`
   Expect: `1` or more for each file
5. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, every file under `docs/src/` and
   `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser each swatch fades the paper's front to its colour, with the
fold lines readable on all of them, a clean console, and Decision 2's
colours kept or retuned by eye at Manual QA 3 and 4.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the page after loading.
   - **Expect:** the red square, red from its first frame. Along the
     bottom, after the "Fold lines" checkbox, a row of plain squares of
     colour, one for each colour of Decision 2, the red one ringed. The
     console shows no errors or warnings.
2. **Do:** click the blue swatch.
   - **Expect:** the paper fades smoothly from red to blue in about a
     third of a second; the ring moves to the blue swatch.
3. **Do:** click "Paper Dart" and let it finish, then click each swatch
   in turn.
   - **Expect:** every red part of the dart takes each colour; every
     off-white part stays off-white.
4. **Do:** click "Flat", then "Paper Dart", and as soon as the fold
   lines have faded in, click through all the swatches while it folds.
   - **Expect:** each change starts at once and the folding never
     pauses. The black lines stay easy to read on every colour, dashes
     and dots alike.
5. **Do:** click two swatches as fast as possible, one after the other.
   - **Expect:** the colour heads for the second from wherever it had
     reached, with no flash of the first colour, of red or of white.
6. **Do:** press Tab until a swatch has a visible focus ring, then
   press the right and left arrow keys, then Tab.
   - **Expect:** focus lands on the chosen swatch; each arrow press
     moves the choice and the ring, and fades the paper; Tab leaves the
     group.
7. **Do:** choose green, then reload with Cmd+R.
   - **Expect:** the paper and the ringed swatch agree from the first
     frame, with no fade, whichever colour the browser restores.
8. **Do:** in the dev tools' Rendering tab, emulate
   `prefers-color-scheme: dark`, then `light`.
   - **Expect:** in both, every swatch and the ring round the chosen
     one stand out from the page.
9. **Do:** click "Paper Hat", "Flat", and untick and tick "Fold lines".
   - **Expect:** all work as before; the bar stays centred along the
     bottom.

### Optional, for a later pass

10. **Do:** in device mode, choose a phone such as iPhone 12 Pro
    (390 × 844), and reload.
    - **Expect:** the bar wraps onto further lines without hiding a
      control; every swatch is large enough to tap.

**Looks wrong, but isn't:**

- A swatch and the paper differ a little in shade: the paper is lit, a
  swatch is not.
- The back of the paper never changes colour.

## Audit

- **2026-11-10T10:56:17Z** — **drafted**: swatches that fade the paper's
  front between the colours of `PAPER_COLORS`, by a pure
  `stepColorFade()` and `Color.lerpColors()`; agent proposed radio
  inputs in place of buttons, the front only, the 3:1 contrast floor,
  swatches painted from `PAPER_COLORS`, a change that does not wait for
  the fold sequence, and the bar's renaming to `.controls`; the colours
  and the fade's length left `_TBD_`.
- **2026-11-10T11:10:07Z** — **ruled**: the Lead Developer accepted the
  agent's suggested values and proposals ("go with the defaults"): the
  five colours of Decision 2, a 0.3 s fade, radio inputs styled as
  plain squares, and the bar's renaming to `.controls`.
