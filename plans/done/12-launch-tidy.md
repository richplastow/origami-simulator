---
title: Tidy the UI for launch as Pureland Simulator
description: Renames the app, trims and reorders the designs, turns the yacht and pencil, gives each design a colour, and adds keyboard design picking and a presentation mode.
type: plan
---

## Context

- The last plan before launch. It renames the app Pureland Simulator,
  drops the heading, keeps five of the nine designs in a new order,
  starts on a finished red pencil, turns the yacht level and the pencil
  to point down and left, gives each design its own paper colour, and
  makes the design picker work from the keyboard exactly as the colour
  swatches do, with Escape hiding the toolbar for a "presentation mode".
- Carries out the tidy that
  [Ruling 5](../todo/07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)
  of the design research left for the end, after
  [Plan 11](./11-fuji-house-pencil-heart.md) added the last
  designs. It changes no fold engine maths.
- Builds on the starting pose of
  [Plan 10](./10-start-the-sheet-turned.md), the turn-over of
  [Plan 09](./09-turn-the-paper-over.md), the spin of
  [Plan 03](./03-spin-the-paper.md) and the swatches of
  [Plan 04](./04-paper-colours.md).
- Browser behaviour it rests on:
  [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has),
  [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible),
  [`pointer-events`](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events),
  the [`dblclick`](https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event)
  event, the native
  [radio group](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio)'s
  keyboard behaviour, which MDN does not describe: in Blink's
  [RadioInputType](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/html/forms/radio_input_type.cc),
  an arrow key moves focus to the next or previous focusable radio of
  the group, wrapping at either end, and checks it by a simulated
  click; and the focus change that a `mousedown` default makes
  ([javascript.info](https://javascript.info/default-browser-action)).
- Figures marked "measured" were run on 2026-11-11 against the code as
  Plan 11 leaves it: every design's reach through cutSheet() and
  maxPaperRadius(), the yacht's hull slope from its constants, and WCAG
  contrast ratios.

## Decisions

1. **The name.** "Pureland Simulator" becomes the page's `<title>`, the
   README's heading, and `"name": "pureland-simulator"` in
   `package.json`. Nothing else in `package.json` changes: `homepage`,
   `bugs`, `repository`, and the README's two links keep their
   `pureland-simulator` URLs until the GitHub repository itself is
   renamed, which is outside this plan. The page has no heading at all:
   the `<h1>` and its CSS rule go.
2. **A design leans as a whole, by a new optional `leanRadians`.** The
   whole design, from its flat sheet to its finished model, is turned
   anticlockwise by `leanRadians`, as the viewer sees it, by a new
   `leanGroup` between the spin's `group` and `turnGroup` in
   `docs/src/scene/paper.js`.
   - Not the start's `rollRadians`: cutSheet() reads every fold line in
     the view frame, so rolling the start alone turns the sheet under
     fixed fold lines and makes a different model, as the ice-cream's
     diamond start does.
   - Outside `turnGroup`, so a turn-over flips the paper about the
     design's own upright axis, such as the pencil's length, rather than
     the screen's.
   - It eases with the stretch from the old design's lean to the new
     one's, as writeStartPose() eases the start, and counts in
     `sharesSheet()`, so a switch between designs that differ only in
     lean still turns. "Flat" keeps the current design's lean.
   - cutSheet() rejects a lean that is not a finite number at load, as
     it rejects a bad roll, so the per-frame path never meets one.
   - The camera does not move: a turn about the line of sight through
     the origin keeps the reach, 0.11888 m, the heart's (measured).
3. **The yacht leans by its hull's slope, 14.50°.** `leanRadians` is
   worked out from the yacht's own constants, the angle of the line from
   `HULL_RIGHT` to `SAIL_CORNER`, so the hull's bottom edge is exactly
   level and stays level if `HULL_RISE_FRACTION` is retuned. The line
   rises to the left, so the lean is positive, anticlockwise:
   `Math.atan2(SAIL_CORNER[1] - HULL_RIGHT[1], HULL_RIGHT[0] - SAIL_CORNER[0])`.
4. **The pencil leans by 135°**, `(3 * Math.PI) / 4`, as `LEAN_RADIANS`
   in `pencil.js`, named as its other constants are, so its point,
   upright in its own frame, points down and to the left.
5. **Each design names its paper colour, by a new optional `colorId`.**
   Choosing another design keeps the current colour until the paper is
   flat; as that design takes over the flat sheet, after the old lines
   fade out and before any stretch, turn or new lines, the front fades
   to its colour over `PAPER_COLOR_FADE_SECONDS` and its swatch takes
   the ring. Choosing the design the paper already holds, again or
   back from "Flat", fades to its colour at once. Of designs chosen in
   quick succession, only the one that takes over the flat sheet
   applies its colour. A swatch chosen afterwards still changes the
   colour, until the next design takes over; one chosen while the
   paper unfolds towards another design is overridden when it does
   (ruled after QA; see [Audit](#audit)). "Flat" has no colour and
   changes nothing.
   The four designs no longer loaded are left untouched: a design with
   no `colorId` leaves the colour as it is.

   ```json
   {
     "aspect": 0.5,
     "colorId": "red",
     "id": "pencil",
     "leanRadians": 2.356194490192345,
     "start": { "rollRadians": 0, "side": "back" },
     "steps": ["…the pencil’s eight steps, unchanged"]
   }
   ```

   | Design     | `colorId` | `leanRadians`     |
   | ---------- | --------- | ----------------- |
   | Pencil     | `red`     | 3π / 4 (135°)     |
   | Mount Fuji | `green`   | none (0)          |
   | Yacht      | `blue`    | hull slope 14.50° |
   | Paper Dart | `orange`  | none (0)          |
   | Heart      | `pink`    | none (0)          |

6. **The colours.** The id `yellow` becomes `orange`, `0xf07d1e`; `pink`
   keeps its id and becomes `0xd81b6a`, a vibrant magenta pulled towards
   red, close to rubine. Red, green and blue are unchanged. Both new
   values are open to retuning by eye. Against the black fold lines,
   orange measures 7.66:1 and pink 4.28:1, both above WCAG's 3:1
   non-text minimum; as the back's lines, against its off-white,
   2.43:1 and 4.34:1 (measured). The swatches, and `PAPER_COLORS`, run
   red, green, blue, orange, pink.
7. **The design picker becomes a native radio group.** Each design is an
   `<input type="radio" name="design">` inside its `<label>`, in a
   `role="radiogroup"` like the swatches', so Tab, the arrow keys and
   the wrap from last to first are the browser's own, identical to the
   swatches by construction, with no keyboard code to keep in step.
   - Each `<label>` is drawn as a plain, austere button: no fill, a thin
     border in the text colour, rounded corners and `cursor: pointer`.
     On hover its background fades to a faint tint of the text colour.
     It follows light and dark mode through `Canvas` and `CanvasText`,
     as the rest of the page does. The input inside is hidden but stays
     focusable. The values, as custom properties in
     `docs/styles/main.css`, are open to retuning by eye:

     | Custom property           | Value                                             |
     | ------------------------- | ------------------------------------------------- |
     | `--design-border-width`   | `1px`                                             |
     | `--design-hover-color`    | `color-mix(in srgb, CanvasText 10%, transparent)` |
     | `--design-hover-duration` | `0.15s`, the background's fade on hover           |
     | `--design-padding`        | `0.25rem 0.75rem`                                 |
     | `--design-radius`         | `0.375rem`                                        |

   - The current design's ring is the swatches' own:
     `.designs label:has(:checked)` takes the same box-shadow from the
     same custom properties, so the gap, width and colours match; its
     corners follow the button's rounding. The focus ring is the
     browser's, `outline: auto` on `.designs label:has(:focus-visible)`.
     Both selectors stay within `.designs`: the "Fold lines" label holds
     a checkbox, which is `:checked` while ticked.
   - `docs/src/ui/fold-buttons.js` becomes
     `docs/src/ui/design-radios.js`, since nothing in it is a button any
     more.
8. **A design is chosen on both `change` and `click`, idempotently.**
   `change` fires whenever a radio becomes checked, by click or arrow
   key; `click` also fires on the radio already checked, so clicking
   the current design re-applies its colour at once. An arrow key fires `click`
   as well as `change` in Blink and WebKit, whose radios check by a
   simulated click
   ([Blink](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/html/forms/radio_input_type.cc),
   [WebKit](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/RadioInputType.cpp));
   Firefox is not checked. So the handler does nothing a second time:
   the target is the same, and a colour already chosen starts no fade.
9. **Every load starts on the first design, the pencil, fully folded.**
   The first frame shows the finished pencil, with no animation and no
   fold lines, whatever the "Fold lines" checkbox says. Code checks the
   pencil's radio and the red swatch at load, whatever the browser
   restored on reload, so every load looks the same. The checkbox keeps
   its restored state, as now, and governs the lines while the paper
   folds and unfolds. A finished model at rest shows no fold lines, as
   flat paper leaving its design shows none: once a design finishes
   folding, its lines fade out over `FADE_OUT_SECONDS`. When another
   design or "Flat" is chosen, they first fade in over
   `FADE_IN_SECONDS` if the checkbox is ticked, then the paper unfolds
   showing them, and they fade out at flat. A design chosen during the
   last step finds the lines still showing, so the paper unfolds at
   once. Folding from flat fades them in first, as before (ruled after
   QA; see [Audit](#audit)).
10. **Escape toggles the toolbar.** A `data-hidden` attribute on
    `.controls` sets `opacity: 0` and `pointer-events: none`, fading
    over `--controls-fade-duration: 0.3s`, as long as the colour fade,
    `PAPER_COLOR_FADE_SECONDS`. Not `visibility`, `display` or `inert`,
    each of which would take the controls out of keyboard reach. A held
    key's repeats are ignored. On hiding, if focus is outside the
    toolbar, it moves to the checked design, so the arrow keys step
    through the designs at once, without a Tab first.
11. **A press on the canvas leaves focus where it was.** `connectDrag()`
    cancels the canvas's `mousedown` default, so a drag or double-click
    in presentation mode does not take focus from the design picker.
    Cancelling it also stops `:active` in Firefox, though not in Chrome
    ([Mozilla bug 771241](https://bugzilla.mozilla.org/show_bug.cgi?id=771241)),
    so the grabbing cursor moves to a `data-dragging` attribute, set on
    `pointerdown` and removed on `lostpointercapture`. Safari is not
    checked: if a canvas press there does take focus, Escape twice gets
    it back.
12. **A double-click on the canvas eases the spin back** to pitch and
    yaw 0, the view the page loads with, over
    `SPIN_RESET_SECONDS = 0.3` with smoothstep(), a fast ease-in-out.
    - The yaw is never wrapped while dragging, so the reset first takes
      its nearest equivalent within ±π, and never turns the paper more
      than half a turn on the way back.
    - Pure maths in `docs/src/input/spin.js`:
      `startSpinReset(reset, spin)` records where the reset starts, and
      `stepSpinReset(deltaSeconds, reset, spin)` advances it each frame
      by the time elapsed, allocating nothing, and returns true while
      the spin changes, as stepColorFade() does.
    - A drag cancels a reset in progress where it is, and a second
      double-click restarts it from where the spin is.
    - The design's lean and turn-overs are not part of the spin and are
      untouched.

    ```json
    {
      "fromPitchRadians": 0.5,
      "fromYawRadians": 0.7168146928204138,
      "progress": 0.5
    }
    ```

## Steps

### Step 1: The name, and no heading [P]

- Changes `docs/index.html` (`<title>`, the `<h1>` removed),
  `docs/styles/main.css` (the `h1` rule removed), `package.json`
  (`name`) and `README.md` (heading), per Decision 1.
- It should show no heading, and "Pureland Simulator" as the tab's title
  (Agent QA 1, 2; Manual QA 1).
- It should name the package `pureland-simulator` and change nothing
  else in `package.json` (Agent QA 2, 3).

**Agent QA**

1. Do: `grep -c "h1" docs/index.html docs/styles/main.css`
   Expect: `docs/index.html:0` and `docs/styles/main.css:0`, in either
   order.
2. Do: `cat docs/index.html package.json README.md | grep -o '<title>[^<]*\|"name": "[a-z-]*"\|^# .*'`
   Expect: `<title>Pureland Simulator`, `"name": "pureland-simulator"`,
   `# Pureland Simulator`, one per line.
3. Do: `git diff --stat package.json`
   Expect: `package.json | 2 +-`, then
   `1 file changed, 1 insertion(+), 1 deletion(-)`.

### Step 2: Orange and rubine, in the new order [P]

- Changes `docs/src/scene/paper-colors.js` (`yellow` becomes `orange`,
  new `pink`, the order, the contrast comment's figures) and the
  swatches in `docs/index.html` (order, `value="orange"`,
  `aria-label="Orange"`), per Decision 6.
- It should offer red, green, blue, orange and pink swatches, in that
  order, with the new orange and pink (Agent QA 1, 2, 3; Manual QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_COLORS } from "./docs/src/scene/paper-colors.js"; console.log(Object.entries(PAPER_COLORS).map(([id, color]) => id + ":" + color.toString(16)).join(" "));'`
   Expect: `red:d9342b green:4fae5a blue:3d8fd9 orange:f07d1e pink:d81b6a`
2. Do: `sed -n '/class="paper-colors"/,/<\/div>/p' docs/index.html | grep -o 'value="[a-z]*"' | tr '\n' ' '`
   Expect: `value="red" value="green" value="blue" value="orange" value="pink" `
3. Do: `grep -c -i yellow docs/src/scene/paper-colors.js docs/index.html`
   Expect: `docs/src/scene/paper-colors.js:0` and `docs/index.html:0`,
   in either order.

### Step 3: Five designs, their colours, and a finished pencil at load

- Changes `docs/src/designs/list.js` (order Pencil, Mount Fuji, Yacht,
  Paper Dart, Heart; the four other imports removed),
  `docs/src/designs/pencil.js`, `mount-fuji.js`, `yacht.js`,
  `paper-dart.js` and `heart.js` (`colorId`, Decision 5), the buttons in
  `docs/index.html` (order Pencil, Mount Fuji, Flat, Yacht, Paper Dart,
  Heart; four removed), and `docs/src/main.js` (Decision 9).
- Leaves `paper-hat.js`, `watermelon.js`, `ice-cream.js` and `house.js`
  in `docs/src/designs/`, unchanged and unloaded.
- In `main.js`, the block that writes the sequence state to the paper
  becomes one function, called once at load and on every change, so the
  first frame shows the state the page starts in.
- The sequence state starts at the first design's last step,
  `position: steps.length`, with `linesVisibility` 0 whatever the
  checkbox says; the target names the same design and position. The stepper then has nothing to do at load:
  left at today's target, `designId: null` and `position: 0`, it would
  unfold the pencil at once.
- It should load only the five designs, in the new order, with the
  camera's reach unchanged (Agent QA 1, 2, 3; Manual QA 1).
- It should open on the finished pencil, with no fold animation
  (Manual QA 1).
- It should fade the fold lines out at rest at a design's finished
  position, its step count, and fade them towards the checkbox before
  unfolding from it, in `docs/src/fold/stepper.js`'s stepSequence()
  (Agent QA 4, 5; Manual QA 1, 2, 11).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; console.log(DESIGNS.map((design) => design.id + ":" + design.colorId).join(" "));'`
   Expect: `pencil:red mount-fuji:green yacht:blue paper-dart:orange heart:pink`
2. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log(Math.max(...DESIGNS.map((design) => maxPaperRadius(cutSheet(design)))).toFixed(5));'`
   Expect: `0.11888` (the heart's, measured)
3. Do: `ls docs/src/designs/ | tr '\n' ' '; grep -l "paper-hat\|watermelon\|ice-cream\|house" docs/index.html docs/src/designs/list.js docs/src/main.js docs/src/ui/*.js`
   Expect: all nine design files still listed, with `list.js`,
   `sheet.js` and `steps.js`; then no file named by `grep`.
4. Do: `node --input-type=module -e 'import { FADE_OUT_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { DESIGNS } from "./docs/src/designs/list.js"; const designs = Object.fromEntries(DESIGNS.map((design) => [design.id, design])); const end = designs.pencil.steps.length; const state = { designId: "pencil", direction: 0, linesFade: 0, linesVisibility: 1, position: end, stretchFromId: "pencil", stretchProgress: 1 }; const target = { designId: "pencil", linesOn: true, position: end }; const out = []; for (const seconds of [FADE_OUT_SECONDS / 2, FADE_OUT_SECONDS / 2]) { stepSequence(seconds, designs, state, target); out.push(state.linesVisibility.toFixed(2)); } console.log(out.join(" "), state.position === end);'`
   Expect: `0.50 0.00 true` (the finished pencil's lines fade out over
   `FADE_OUT_SECONDS` with the checkbox ticked, the position
   unchanged; before the post-QA ruling, `1.00 1.00 true`)
5. Do: `node --input-type=module -e 'import { FADE_IN_SECONDS, UNFOLD_SECONDS, stepSequence } from "./docs/src/fold/stepper.js"; import { DESIGNS } from "./docs/src/designs/list.js"; const designs = Object.fromEntries(DESIGNS.map((design) => [design.id, design])); const end = designs.pencil.steps.length; const state = { designId: "pencil", direction: 0, linesFade: 0, linesVisibility: 0, position: end, stretchFromId: "pencil", stretchProgress: 1 }; const target = { designId: "mount-fuji", linesOn: true, position: designs["mount-fuji"].steps.length }; stepSequence(FADE_IN_SECONDS, designs, state, target); const out = [state.linesVisibility.toFixed(2), state.position === end]; stepSequence(UNFOLD_SECONDS / 2, designs, state, target); out.push(state.linesVisibility.toFixed(2), state.position < end); console.log(out.join(" "));'`
   Expect: `1.00 true 1.00 true` (from the finished pencil, with Mount
   Fuji chosen and the checkbox ticked, the lines fade in over
   `FADE_IN_SECONDS` with the pencil still finished, then it unfolds
   showing them; with the lines hidden while unfolding,
   `0.00 false 0.00 true`)

### Step 4: The yacht and the pencil lean

- Changes `docs/src/designs/sheet.js` (leanOf(), returning a design's
  `leanRadians` or 0, and writeLean(), easing it with the stretch),
  `docs/src/fold/engine.js` (cutSheet() rejects a bad lean),
  `docs/src/fold/stepper.js` (`sharesSheet()` compares leans),
  `docs/src/scene/paper.js` (`leanGroup`, returned as `leanRotation`,
  and the groups' doc comment), `docs/src/main.js` (writeLean() beside
  writeStartPose()), `docs/src/designs/yacht.js` and `pencil.js`
  (Decisions 2 to 4).
- It should show the finished yacht with its hull's bottom edge level,
  and the finished pencil pointing down and to the left (Agent QA 1;
  Manual QA 1, 3).
- It should ease the lean with the stretch between designs, and turn a
  design that differs from the last only in lean (Agent QA 2, 3;
  Manual QA 2).
- It should reject a lean that is not a finite number at load
  (Agent QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; console.log(DESIGNS.map((design) => design.id + ":" + (((design.leanRadians ?? 0) * 180) / Math.PI).toFixed(2)).join(" "));'`
   Expect: `pencil:135.00 mount-fuji:0.00 yacht:14.50 paper-dart:0.00 heart:0.00`
2. Do: `node --input-type=module -e 'import { writeLean } from "./docs/src/designs/sheet.js"; const designs = { a: { aspect: 1 }, b: { aspect: 1, leanRadians: 1 } }; const rotation = { z: 9 }; const out = []; for (const stretchProgress of [0, 0.25, 0.5, 1]) { writeLean(designs, rotation, { designId: "b", stretchFromId: "a", stretchProgress }); out.push(rotation.z); } console.log(out.join(" "));'`
   Expect: `0 0.15625 0.5 1` (smoothstep gives 0.15625 a quarter of the
   way, where a linear ease would give 0.25, and 0.5 at half way)
3. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const designs = { a: { aspect: 1, id: "a", steps: [] }, b: { aspect: 1, id: "b", leanRadians: 1, steps: [] } }; const state = { designId: "a", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "a", stretchProgress: 1 }; stepSequence(0.01, designs, state, { designId: "b", linesOn: false, position: 0 }); console.log(state.designId, state.stretchProgress.toFixed(3));'`
   Expect: `b 0.025` (0.01 s of `STRETCH_SECONDS`, 0.4 s)
4. Do: `node --input-type=module -e 'import { YACHT } from "./docs/src/designs/yacht.js"; import { cutSheet } from "./docs/src/fold/engine.js"; for (const leanRadians of [NaN, Infinity]) { try { cutSheet({ ...YACHT, leanRadians }); console.log("no throw"); } catch (error) { console.log(error.message); } }'`
   Expect: `Design "yacht" leans by NaN radians`, then
   `Design "yacht" leans by Infinity radians`
5. Do: `for f in docs/src/designs/sheet.js docs/src/fold/engine.js docs/src/fold/stepper.js docs/src/scene/paper.js docs/src/main.js docs/src/designs/yacht.js docs/src/designs/pencil.js; do node --check $f; done`
   Expect: prints nothing.

### Step 5: The design radio group, and each design's colour

- Changes the design buttons in `docs/index.html` to radios inside
  labels, in a `<div class="designs" role="radiogroup"
  aria-label="Design">`, `pencil` `checked`; styles them in
  `docs/styles/main.css`; replaces `docs/src/ui/fold-buttons.js` with
  `docs/src/ui/design-radios.js`; changes
  `docs/src/ui/color-swatches.js` and `docs/src/main.js` (Decisions 5,
  7 to 9), and the doc comment in `docs/src/designs/list.js`, which
  names `fold-buttons.js` and a `<button>`.
- connectColorSwatches() checks a given colour's swatch at connection,
  and returns a function that chooses a colour from code: it checks
  that swatch and starts the fade, unless that colour is already
  chosen.
- connectDesignRadios() checks the first design's radio at connection,
  throws at once if a radio's `value` names no design or a design's
  `colorId` names no colour, and passes each choice on with its target
  and `colorId`, null for "Flat".
- It should make the design picker one Tab stop, whose arrow keys step
  through and choose the designs, wrapping, as the swatches' do
  (Agent QA 1, 2; Manual QA 6).
- It should draw the designs as plain rounded buttons with a pointer
  cursor and a hover fade, ringing the current design as the current
  swatch is ringed (Manual QA 1, 6).
- It should fade to a chosen design's colour when it takes over the
  flat sheet, or at once when the paper already holds it, while a
  swatch still changes the colour in between (Manual QA 2 to 6).
- It should open on the pencil and red, whatever the browser restored
  (Manual QA 12).

**Agent QA**

1. Do: `sed -n '/class="designs"/,/<\/div>/p' docs/index.html | grep -o 'name="design"\|value="[a-z-]*"' | tr '\n' ' '`
   Expect: `name="design" value="pencil" name="design" value="mount-fuji" name="design" value="flat" name="design" value="yacht" name="design" value="paper-dart" name="design" value="heart" `
2. Do: `grep -c "<button" docs/index.html; grep -rn "fold-buttons\|data-fold=" docs/index.html docs/src`
   Expect: `0`, then nothing.
3. Do: `node --check docs/src/ui/design-radios.js && node --check docs/src/ui/color-swatches.js && node --check docs/src/main.js`
   Expect: prints nothing.

### Step 6: Presentation mode, focus and the spin reset

- Adds `docs/src/ui/controls-toggle.js` (Decision 10); changes
  `docs/src/input/drag.js` (Decision 11), `docs/styles/main.css` (the
  hidden state and its fade, the cursor on `[data-dragging]` in place of
  `:active`), `docs/src/input/spin.js` (`SPIN_RESET_SECONDS`,
  startSpinReset() and stepSpinReset()) and `docs/src/main.js` (the
  toggle connected; the double-click starting the reset, the drag
  cancelling it, and the frame loop stepping it, per Decision 12; the
  spin's comment no longer says only a reload resets it).
- It should fade the toolbar out and back in on Escape, ignoring a held
  key's repeats (Agent QA 2; Manual QA 7, 8).
- It should ignore the mouse over the hidden toolbar, while the keyboard
  still steps through the designs and colours (Manual QA 7).
- It should keep the grabbing cursor while dragging, and ease the spin
  back on a double-click, the short way round, leaving focus where it
  was (Agent QA 1, 2, 3, 4; Manual QA 9, 10).

**Agent QA**

1. Do: `grep -c ":active" docs/styles/main.css; grep -c "data-dragging\|dataset.dragging" docs/styles/main.css docs/src/input/drag.js`
   Expect: `0`, then a count of at least 1 for each file.
2. Do: `grep -c '"Escape"' docs/src/ui/controls-toggle.js; grep -c '"dblclick"' docs/src/main.js`
   Expect: `1`, then `1`.
3. Do: `node --input-type=module -e 'import { startSpinReset, stepSpinReset } from "./docs/src/input/spin.js"; const spin = { pitchRadians: 0.5, yawRadians: 7 }; const reset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 }; startSpinReset(reset, spin); for (const deltaSeconds of [0.075, 0.075, 0.15, 0.15]) { const changed = stepSpinReset(deltaSeconds, reset, spin); console.log(spin.pitchRadians.toFixed(3), spin.yawRadians.toFixed(3), changed); }'`
   Expect: `0.422 0.605 true`, `0.250 0.358 true`, `0.000 0.000 true`,
   `0.000 0.000 false` (the yaw of 7 rad starts from 7 − 2π, 0.717 rad;
   smoothstep leaves 0.84375 of it a quarter of the way, where a linear
   ease would leave 0.75, and half at half way)
4. Do: `node --input-type=module -e 'import { startSpinReset } from "./docs/src/input/spin.js"; const reset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 }; startSpinReset(reset, { pitchRadians: 0, yawRadians: 3.5 }); console.log(reset.fromYawRadians.toFixed(3), reset.progress);'`
   Expect: `-2.783 0` (3.5 − 2π: the short way back)
5. Do: `node --check docs/src/ui/controls-toggle.js && node --check docs/src/input/drag.js && node --check docs/src/input/spin.js && node --check docs/src/main.js`
   Expect: prints nothing.

## Done when

Every Agent QA block passes, the
[agent checks](../../CLAUDE.md#agent-checks) pass, and the page opens on
a finished red pencil pointing down and to the left, whose designs and
colours step on the arrow keys with the toolbar hidden by Escape.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`,
open `http://localhost:1111/` in desktop Chrome, open the dev tools
console, and hard-reload (Shift+Cmd+R). Do not touch the page before
step 1.

1. **Do:** look at the page and the tab.
   - **Expect:** no heading. The tab reads "Pureland Simulator". The
     paper is already a finished red pencil, its point down and to the
     left, with no fold lines although "Fold lines" is ticked, and
     nothing folds as the page appears.
   - **Expect:** the toolbar reads Pencil, Mount Fuji, Flat, Yacht,
     Paper Dart, Heart, then "Fold lines", then red, green, blue,
     orange and pink swatches. Pencil and the red swatch each carry
     the same ring. No Paper Hat, Watermelon, Ice Cream or House. The
     console shows no errors or warnings.
   - **Expect:** the designs are plain buttons with rounded corners and
     a thin border, no fill. Hovering one shows a pointer cursor and
     fades in a faint tint; moving off fades it out.
2. **Do:** click "Mount Fuji".
   - **Expect:** Mount Fuji takes the ring at once; the paper stays red
     and the red swatch keeps its ring. The pencil's fold lines fade
     in, it unfolds showing them, and they fade out once it is flat.
     Only then does the paper fade to green, the green swatch taking
     the ring, as the flat sheet stretches to a square and turns back
     upright. Mount Fuji's lines fade in, it folds with them showing,
     and they fade out once it is finished.
3. **Do:** click "Yacht".
   - **Expect:** blue. The finished yacht's bottom edge is level, the
     whole yacht turned slightly anticlockwise.
4. **Do:** click "Paper Dart", then "Heart".
   - **Expect:** a clear orange, not yellow, for the dart; a vibrant
     magenta-red, close to rubine, for the heart. Each colour fades in
     only once the paper lies flat.
5. **Do:** with the heart showing, click the blue swatch, then "Flat",
   then "Heart"; then click the green swatch, then "Heart" again.
   - **Expect:** blue fades in and stays through "Flat". "Heart" fades
     back to pink. Green fades in, and the second "Heart" fades back to
     pink without moving the paper. Every change is a fade.
6. **Do:** hard-reload, press Tab once, then Right five times, Right
   once more, then Left, Up and Down.
   - **Expect:** the first Tab rings Pencil with the browser's focus
     ring. Each arrow moves both rings and chooses the design: Mount
     Fuji, Flat, Yacht, Paper Dart, Heart, then back round to Pencil;
     Left wraps back to Heart, Up steps back to Paper Dart and Down on
     to Heart, as in the swatches. The colour changes only while the
     paper lies flat, to the design that takes it over, so designs
     passed over quickly never colour it; Flat leaves it alone, and it
     ends pink.
   - **Why:** catches a picker that moves focus without choosing, or
     takes one Tab stop per design.
7. **Do:** press Escape, hover over and click where "Yacht" was, then
   press Right.
   - **Expect:** the toolbar fades out. The pointer over it shows the
     grab cursor, and the click picks nothing (a drag there spins the
     paper). Right chooses the next design as before.
8. **Do:** press Escape, then hold Escape down for a second.
   - **Expect:** the toolbar fades back in, with the current design
     ringed. Holding Escape fades it out once, and it stays out while
     the key repeats, with no flicker.
9. **Do:** drag the paper well round and over, then double-click it.
   Then drag it round more than a full turn, double-click, and start
   dragging again before it settles.
   - **Expect:** a grabbing cursor while dragging. The first
     double-click eases the paper back, quickly and smoothly, to the
     view the page loads with; the pencil, if showing, still points
     down and to the left. After more than a full turn, it swings back
     the short way, never more than half a turn. The drag stops the
     ease where it is and takes over at once.
10. **Do:** hard-reload, press Escape without pressing Tab, press
    Right, then double-click the paper and press Right again.
    - **Expect:** the first Right folds Mount Fuji, so Escape put focus
      on the picker. After the double-click, Right still steps on, to
      Flat.
    - **Why:** catches a canvas press stealing focus in presentation
      mode.
11. **Do:** press Escape to show the toolbar, then Right, to Yacht.
    Once the yacht has folded, Tab to "Fold lines" and press Space, to
    untick it; Shift+Tab back to Yacht, press Left, to Flat, then
    Right, to Yacht. Once it has folded, Tab to "Fold lines", press
    Space, to tick it, and repeat Shift+Tab, Left, Right. Once it has
    folded, Tab twice and press Right.
    - **Expect:** the finished yacht never shows fold lines. Unticked,
      the yacht unfolds and folds again with no lines. Ticked, its
      lines fade in before it unfolds, show as it unfolds, fade out at
      flat, fade in again, show as it folds, and fade out once it is
      finished. The second Tab lands on the blue swatch, and Right
      chooses orange.
    - **Why:** the lines show only while the paper folds or unfolds,
      so the checkbox shows its effect only on the next fold.
12. **Do:** with Yacht and orange chosen, reload normally (Cmd+R, not
    hard).
    - **Expect:** a finished red pencil again, with no fold lines, and
      Pencil and red ringed, whatever the browser restored.
    - **Why:** Chrome restores no form state on a reload, so here this
      step shows the page's own `checked` attributes; Firefox does
      restore, so the Firefox check under "Optional, for a later pass"
      is the one that proves the code's forcing.
13. **Do:** click "Pencil", then "Flat".
    - **Expect:** "Pencil" changes nothing. On "Flat", the pencil's
      lines fade in, then it unfolds to a flat half sheet lying
      diagonally, turned 135°, as "Looks wrong, but isn’t" explains,
      and the lines fade out once it is flat.

### Looks wrong, but isn’t

- "Flat" keeps the current design's lean, so after the pencil or the
  yacht the flat sheet lies turned (Decision 2).
- The design buttons are plainer than the old native buttons, and their
  ring has rounded corners where the swatches' is square (Decision 7).
- A swatch chosen while the paper unfolds towards another design is
  replaced by that design's colour once the paper is flat (Decision 5).
- A finished model at rest shows no fold lines, even with "Fold lines"
  ticked: they show only while the paper folds or unfolds, so choosing
  another design fades them in for a moment before the unfold starts
  (Decision 9).

### Optional, for a later pass

- In Safari, repeat step 10: if a canvas press takes focus there,
  Escape twice should get it back (Decision 11). Expect two
  differences, shared by the designs and the swatches: Tab reaches a
  radio only with Option+Tab or the "Press Tab to highlight each item"
  setting (reported, not checked), and the arrow keys stop at either
  end rather than wrap, as WebKit's
  [RadioInputType](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/RadioInputType.cpp)
  stops.
- On a phone, a double tap should reset the spin, as a double-click
  does.
- In desktop Firefox, repeat step 12: Firefox restores the checked
  radios on a normal reload, as the page is parsed and before the module
  runs, so a finished red pencil with Pencil and red ringed shows that
  the code overrides what was restored.

## Audit

- **2026-11-11T00:12:53Z** — **drafted**: the launch tidy, in six
  steps, from the Lead Developer’s twelve items (no heading; the
  Pureland Simulator name, `package.json` `name` approved; the yacht
  and pencil turned; a finished pencil at load; four designs unloaded,
  files kept; the new design and swatch orders; each design’s colour;
  orange and rubine; keyboard design picking with a ring; double-click
  spin reset; Escape presentation mode); agent proposed a whole-design
  `leanRadians` in place of the start roll, which cutSheet() reads
  against view-frame fold lines; the yacht at its hull slope, 14.50°,
  over the 12° asked; native radios for the picker; choosing on both
  `change` and `click`; forcing the pencil and red at every load;
  Escape moving focus to the picker; cancelling the canvas’s
  `mousedown` default, with a `data-dragging` cursor; an instant spin
  reset; a 0.3 s toolbar fade; orange `0xf07d1e` and pink `0xd81b6a`;
  URLs kept until the repository is renamed; one plan, not two, at
  about 16 criteria and 13 Manual QA steps; figures measured on the
  code as Plan 11 leaves it; no browser.
- **2026-11-11T00:25:47Z** — **ruled**: the Lead Developer approved
  `leanRadians`, the yacht at 14.50°, orange `0xf07d1e` and pink
  `0xd81b6a`, and the native radio picker, and took every other default,
  with two changes: the design labels are plain, austere buttons with
  rounded corners, `cursor: pointer` and a hover transition, in place
  of system-coloured ones (Decision 7, agent proposed the custom
  property values); and the double-click reset is a fast ease-in-out,
  not instant (Decision 12, agent proposed 0.3 s with smoothstep(), the
  short way round, a drag cancelling it, and startSpinReset() and
  stepSpinReset() in `spin.js`); Step 6 gains two Agent QA lines, whose
  figures follow from smoothstep() and 7 − 2π and 3.5 − 2π.
- **2026-11-11T00:49:01Z** — **reviewed**: no Major finding; verified
  r187 `Group`, Euler `XYZ` and `matrixWorld` composition, the lean
  through the pose maths (yacht hull level at 14.5017°, pencil point
  down-left), reach 0.11888, contrast figures and the QA arithmetic;
  fixed: the start state and target named for Decision 9 (Step 3),
  startSpinReset(reset, spin) A-Z, `.designs`-scoped ring selectors,
  the yacht lean’s sign as an expression, the pencil’s `LEAN_RADIANS`,
  three wrong or empty citations (WebKit bug 312692, Mozilla bug
  1471857, an MDN anchor) replaced by Blink and WebKit sources, the
  `:active` claim narrowed to Firefox, `list.js`’s doc comment added to
  Step 5, Agent QA made order- and layout-proof (Steps 1, 2 and 5),
  criteria naming their Agent QA (Steps 2, 5, 6, one reworded for the
  grabbing cursor), and Manual QA 6, 8, 11, 12 and the Safari note.
- **2026-11-11T00:59:37Z** — **implemented**: Steps 1 to 6, one at a
  time, check-first (each Agent QA failed first for the expected reason,
  except Step 3 QA 2, the reach, which guards a figure that must not
  change); files: `README.md`, `package.json` (`name` only),
  `docs/index.html`, `docs/styles/main.css`, `paper-colors.js`,
  `list.js`, the five loaded design files, `sheet.js` (leanOf(),
  writeLean()), `engine.js` (lean check), `stepper.js` (sharesSheet()
  and docs), `paper.js` (`leanGroup`, `leanRotation`), `spin.js`
  (`SPIN_RESET_SECONDS`, startSpinReset(), stepSpinReset()), `drag.js`,
  `main.js` (writeSequenceState() at load and on change, writeSpin()),
  `color-swatches.js` (checks a given colour, returns chooseColor()),
  new `design-radios.js` and `controls-toggle.js`, `fold-buttons.js`
  deleted; the ring rule shared by both groups’ selectors; r187 Euler
  `XYZ` default and `matrixWorld` order rechecked; every Agent QA
  passes; Manual QA walked against the code and unchanged.
- **2026-11-11T00:59:37Z** — **verified**: agent checks pass: 17
  changed or new modules parse, no long lines bar the favicon’s `data:`
  URL and the canvas’s unchanged `aria-label` (line 27, over 80 before
  this plan), `/` and every changed file served 200, vendored checksums
  match; browser not run.
- **2026-11-11T07:18:31Z** — **quality-checked**: Fixed: none at fix
  tier; first-run polish of new code: `main.js` creates `paper` before
  connecting the swatches, so their callback no longer names a `const`
  declared later; `paper.js`’s groups doc comment reflowed; Agent QA
  strengthened where mutants slipped through: Step 4 QA 2 samples a
  quarter of the stretch (a linear lean passed), Step 4 QA 4 adds
  Infinity (an `isNaN` check passed), Step 6 QA 3 steps a quarter of the
  reset (a linear reset passed); Manual QA 12 gains a Why, and the
  optional pass a Firefox reload check. Deferred: in Chrome, a
  back/forward that misses the bfcache, or a session restore, restores
  the radios and checkbox in a task after parsing finishes, so after
  `main.js` has forced the pencil and red; the rings then show the
  restored choice over a red pencil until the next choice (Blink
  `FormController::ScheduleRestore()`, `DocumentLoader` restoring only
  on back/forward or restore); pre-existing for the swatches and
  checkbox, and a fix (a `<form autocomplete="off">` or a `pageshow`
  resync) touches Decision 9’s checkbox clause, so needs a ruling; the
  canvas `aria-label` on line 27 of `index.html`, over 80 columns before
  this plan, left whole, since a wrap puts a newline and indent into the
  accessible name; `--swatch-ring-*` now also rings the designs, a
  naming nit. Verified fine: every Agent QA block; the per-frame path
  (stepSpinReset(), writeSpin(), writeLean(), sharesSheet()) allocates
  nothing; motion scales with elapsed time; `leanGroup` holds no GPU
  resource; no new Three.js API beyond the r187 `Group` and Euler checked
  at review; arrow and click double-firing idempotent; no fade at
  connection (`.checked` set from code fires no `change`); Firefox
  restores form state at parse time, before the module; Blink’s arrow
  keys skip only radios that are not focusable, which `opacity` and
  `pointer-events` do not change; mutants on sharesSheet()’s lean and
  startSpinReset()’s wrap caught; agent checks pass; browser not run.
- **2026-11-11T07:33:42Z** — **ruled**: in manual QA, the Lead
  Developer ruled that with "Fold lines" ticked a fully folded design’s
  lines fade out, as they already do on flat paper, so the pencil at
  load shows none (Decision 9). The orchestrator read unfolding from the
  finished model as starting at once with the lines hidden, with no
  fade-in first, so switching designs is no slower; folding from flat
  still fades them in. The Lead Developer may overturn that reading in
  favour of a symmetric fade-in before unfolding, at `FADE_IN_SECONDS`,
  0.6 s, per switch.
- **2026-11-11T07:33:42Z** — **implemented**: the ruling, check-first
  (Step 3 Agent QA 4 and 5 failed first, printing `1.00 1.00 true` and
  `1 mount-fuji`); `stepper.js` stepSequence() fades the lines out at a
  design’s step count before anything else, with its doc comment;
  `main.js` starts `linesVisibility` at 0, with its start-state comment
  and file overview reworded; Decision 9 and Step 3 amended, one
  criterion and Agent QA 4 and 5 added; Manual QA 1, 2, 11 and 12 and
  “Looks wrong, but isn’t” updated; every Agent QA passes; browser not
  run.
- **2026-11-11T07:42:30Z** — **ruled**: the Lead Developer overturned
  the orchestrator’s reading on unfolding: with “Fold lines” ticked, a
  click on a design while the model is finished fades the lines in at
  once, so the unfold shows them down to flat. The finished model at
  rest, and so the pencil at load, still shows none (Decision 9).
- **2026-11-11T07:42:30Z** — **implemented**: check-first (the new
  Step 3 Agent QA 5 printed `0.00 false 0.00 true` against the previous
  logic); `stepper.js` fades the lines out only at rest at the finished
  position, and towards `linesOn` when the target leaves it, with its
  doc comment; `main.js` comments reworded; Decision 9, Step 3’s
  criterion, Agent QA 4’s note and Agent QA 5, Manual QA 2, 11 and 13
  and “Looks wrong, but isn’t” amended; every Agent QA passes; browser
  not run.
- **2026-11-11T08:05:07Z** — **ruled**: the Lead Developer ruled that
  choosing another design keeps the current colour until the paper is
  flat, then fades to the new design’s colour while its lines change
  over and its sheet stretches or turns (Decision 5). The orchestrator
  read this as: the colour, and its swatch’s ring, change as the new
  design takes over the flat sheet; choosing the design the paper
  already holds still applies its colour at once (Decision 8); a swatch
  chosen while the paper unfolds towards another design is overridden.
- **2026-11-11T08:05:07Z** — **implemented**: `main.js`’s radio callback
  chooses a colour only for the design the paper already holds, and
  writeSequenceState() chooses the new design’s colour where it swaps
  in its sheet, with comments and file overview reworded; Decisions 5
  and 8, Step 5’s colour criterion, Manual QA 2, 4 and 6 and “Looks
  wrong, but isn’t” amended; no Agent QA added, the logic being two
  guarded calls; every Agent QA passes; browser not run.
- **2026-11-11T08:10:20Z** — **done**: the launch tidy as Pureland
  Simulator, with the Lead Developer’s three mid-QA refinements (no
  lines on a finished model, lines shown while unfolding, the design’s
  colour fading in at flat); manual QA passed.
