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
  [Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)
  of the design research left for the end, after
  [Plan 11](../done/11-fuji-house-pencil-heart.md) added the last
  designs. It changes no fold engine maths.
- Builds on the starting pose of
  [Plan 10](../done/10-start-the-sheet-turned.md), the turn-over of
  [Plan 09](../done/09-turn-the-paper-over.md), the spin of
  [Plan 03](../done/03-spin-the-paper.md) and the swatches of
  [Plan 04](../done/04-paper-colours.md).
- Browser behaviour it rests on:
  [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has),
  [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible),
  [`pointer-events`](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events),
  the [`dblclick`](https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event)
  event, the native
  [radio group's keyboard behaviour](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#selecting_a_radio_button),
  and the focus change that a `mousedown` default makes
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
   `origami-simulator` URLs until the GitHub repository itself is
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
   level and stays level if `HULL_RISE_FRACTION` is retuned.
4. **The pencil leans by 135°**, `3 * Math.PI / 4`, as
   `PENCIL_LEAN_RADIANS`, so its point, upright in its own frame, points
   down and to the left.
5. **Each design names its paper colour, by a new optional `colorId`.**
   Choosing a design fades the front to that colour, and checks its
   swatch; a swatch chosen afterwards still changes the colour, until
   the next design is chosen. "Flat" has no colour and changes nothing.
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

   - The current design's ring is the swatches' own: `label:has(:checked)`
     takes the same box-shadow from the same custom properties, so the
     gap, width and colours match; its corners follow the button's
     rounding. The focus ring is the browser's, `outline: auto` on
     `label:has(:focus-visible)`.
   - `docs/src/ui/fold-buttons.js` becomes
     `docs/src/ui/design-radios.js`, since nothing in it is a button any
     more.
8. **A design is chosen on both `change` and `click`, idempotently.**
   `change` fires whenever a radio becomes checked, by click or arrow
   key; `click` also fires on the radio already checked, so clicking
   the current design re-applies its colour. Browsers differ on whether
   an arrow key also fires `click`
   ([WebKit test](https://webkit.googlesource.com/WebKit/+/fc7763c8a32835e3040bdd5d293a939a1edf2502/LayoutTests/fast/forms/radio-group-keyboard-change-event.html),
   [Mozilla bug 1471857](https://bugzilla.mozilla.org/show_bug.cgi?id=1471857)),
   so the handler does nothing a second time: the target is the same,
   and a colour already chosen starts no fade.
9. **Every load starts on the first design, the pencil, fully folded.**
   The first frame shows the finished pencil, with no animation, its
   fold lines fully shown if the "Fold lines" checkbox is ticked. Code
   checks the pencil's radio and the red swatch at load, whatever the
   browser restored on reload, so every load looks the same. The
   checkbox keeps its restored state, as now.
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
    Cancelling it also stops `:active`, so the grabbing cursor moves to
    a `data-dragging` attribute, set on `pointerdown` and removed on
    `lostpointercapture`. A known gap:
    [WebKit bug 312692](https://bugs.webkit.org/show_bug.cgi?id=312692)
    says Safari ignores the cancel for focus, so there a canvas press
    may still lose focus; Escape twice gets it back.
12. **A double-click on the canvas eases the spin back** to pitch and
    yaw 0, the view the page loads with, over
    `SPIN_RESET_SECONDS = 0.3` with smoothstep(), a fast ease-in-out.
    - The yaw is never wrapped while dragging, so the reset first takes
      its nearest equivalent within ±π, and never turns the paper more
      than half a turn on the way back.
    - Pure maths in `docs/src/input/spin.js`: startSpinReset() records
      where the reset starts, and stepSpinReset() advances it each
      frame by the time elapsed, allocating nothing, and returns true
      while the spin changes.
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
   Expect: `docs/index.html:0`, then `docs/styles/main.css:0`.
2. Do: `grep -h -o '<title>[^<]*\|"name": "[a-z-]*"\|^# .*' docs/index.html package.json README.md`
   Expect: `<title>Pureland Simulator`, `"name": "pureland-simulator"`,
   `# Pureland Simulator`, one per line.
3. Do: `git diff --stat package.json`
   Expect: `1 file changed, 1 insertion(+), 1 deletion(-)`.

### Step 2: Orange and rubine, in the new order [P]

- Changes `docs/src/scene/paper-colors.js` (`yellow` becomes `orange`,
  new `pink`, the order, the contrast comment's figures) and the
  swatches in `docs/index.html` (order, `value="orange"`,
  `aria-label="Orange"`), per Decision 6.
- It should offer red, green, blue, orange and pink swatches, in that
  order, with the new orange and pink (Agent QA 1, 2; Manual QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_COLORS } from "./docs/src/scene/paper-colors.js"; console.log(Object.entries(PAPER_COLORS).map(([id, color]) => id + ":" + color.toString(16)).join(" "));'`
   Expect: `red:d9342b green:4fae5a blue:3d8fd9 orange:f07d1e pink:d81b6a`
2. Do: `grep -A1 'name="paper-color"' docs/index.html | grep -o 'value="[a-z]*"' | tr '\n' ' '`
   Expect: `value="red" value="green" value="blue" value="orange" value="pink" `
3. Do: `grep -c -i yellow docs/src/scene/paper-colors.js docs/index.html`
   Expect: `docs/src/scene/paper-colors.js:0`, then `docs/index.html:0`.

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
- It should load only the five designs, in the new order, with the
  camera's reach unchanged (Agent QA 1, 2, 3; Manual QA 1).
- It should open on the finished pencil, with no fold animation
  (Manual QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; console.log(DESIGNS.map((design) => design.id + ":" + design.colorId).join(" "));'`
   Expect: `pencil:red mount-fuji:green yacht:blue paper-dart:orange heart:pink`
2. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log(Math.max(...DESIGNS.map((design) => maxPaperRadius(cutSheet(design)))).toFixed(5));'`
   Expect: `0.11888` (the heart's, measured)
3. Do: `ls docs/src/designs/ | tr '\n' ' '; grep -l "paper-hat\|watermelon\|ice-cream\|house" docs/index.html docs/src/designs/list.js docs/src/main.js docs/src/ui/*.js`
   Expect: all nine design files still listed, with `list.js`,
   `sheet.js` and `steps.js`; then no file named by `grep`.

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
2. Do: `node --input-type=module -e 'import { writeLean } from "./docs/src/designs/sheet.js"; const designs = { a: { aspect: 1 }, b: { aspect: 1, leanRadians: 1 } }; const rotation = { z: 9 }; const out = []; for (const stretchProgress of [0, 0.5, 1]) { writeLean(designs, rotation, { designId: "b", stretchFromId: "a", stretchProgress }); out.push(rotation.z); } console.log(out.join(" "));'`
   Expect: `0 0.5 1` (smoothstep gives 0.5 at half way)
3. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const designs = { a: { aspect: 1, id: "a", steps: [] }, b: { aspect: 1, id: "b", leanRadians: 1, steps: [] } }; const state = { designId: "a", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "a", stretchProgress: 1 }; stepSequence(0.01, designs, state, { designId: "b", linesOn: false, position: 0 }); console.log(state.designId, state.stretchProgress.toFixed(3));'`
   Expect: `b 0.025` (0.01 s of `STRETCH_SECONDS`, 0.4 s)
4. Do: `node --input-type=module -e 'import { YACHT } from "./docs/src/designs/yacht.js"; import { cutSheet } from "./docs/src/fold/engine.js"; try { cutSheet({ ...YACHT, leanRadians: NaN }); console.log("no throw"); } catch (error) { console.log(error.message); }'`
   Expect: `Design "yacht" leans by NaN radians`
5. Do: `for f in docs/src/designs/sheet.js docs/src/fold/engine.js docs/src/fold/stepper.js docs/src/scene/paper.js docs/src/main.js docs/src/designs/yacht.js docs/src/designs/pencil.js; do node --check $f; done`
   Expect: prints nothing.

### Step 5: The design radio group, and each design's colour

- Changes the design buttons in `docs/index.html` to radios inside
  labels, in a `<div class="designs" role="radiogroup"
  aria-label="Design">`, `pencil` `checked`; styles them in
  `docs/styles/main.css`; replaces `docs/src/ui/fold-buttons.js` with
  `docs/src/ui/design-radios.js`; changes
  `docs/src/ui/color-swatches.js` and `docs/src/main.js` (Decisions 5,
  7 to 9).
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
  (Manual QA 6).
- It should draw the designs as plain rounded buttons with a pointer
  cursor and a hover fade, ringing the current design as the current
  swatch is ringed (Manual QA 1, 6).
- It should fade to a design's colour when it is chosen, even when it is
  already the current design, while a swatch still changes the colour
  in between (Manual QA 2 to 5).
- It should open on the pencil and red, whatever the browser restored
  (Manual QA 12).

**Agent QA**

1. Do: `grep -o 'name="design" value="[a-z-]*"' docs/index.html | tr '\n' ' '`
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
  key's repeats (Manual QA 7, 8).
- It should ignore the mouse over the hidden toolbar, while the keyboard
  still steps through the designs and colours (Manual QA 7).
- It should ease the spin back on a double-click, the short way round,
  leaving focus where it was (Agent QA 3, 4; Manual QA 9, 10).

**Agent QA**

1. Do: `grep -c ":active" docs/styles/main.css; grep -c "data-dragging\|dataset.dragging" docs/styles/main.css docs/src/input/drag.js`
   Expect: `0`, then a count of at least 1 for each file.
2. Do: `grep -c '"Escape"' docs/src/ui/controls-toggle.js; grep -c '"dblclick"' docs/src/main.js`
   Expect: `1`, then `1`.
3. Do: `node --input-type=module -e 'import { startSpinReset, stepSpinReset } from "./docs/src/input/spin.js"; const spin = { pitchRadians: 0.5, yawRadians: 7 }; const reset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 }; startSpinReset(spin, reset); for (let i = 0; i < 3; i++) { const changed = stepSpinReset(0.15, reset, spin); console.log(spin.pitchRadians.toFixed(3), spin.yawRadians.toFixed(3), changed); }'`
   Expect: `0.250 0.358 true`, `0.000 0.000 true`, `0.000 0.000 false`
   (the yaw of 7 rad starts from 7 − 2π, 0.717 rad; smoothstep gives
   half at half way)
4. Do: `node --input-type=module -e 'import { startSpinReset } from "./docs/src/input/spin.js"; const reset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 }; startSpinReset({ pitchRadians: 0, yawRadians: 3.5 }, reset); console.log(reset.fromYawRadians.toFixed(3), reset.progress);'`
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
     left, with fold lines, and nothing folds as the page appears.
   - **Expect:** the toolbar reads Pencil, Mount Fuji, Flat, Yacht,
     Paper Dart, Heart, then "Fold lines", then red, green, blue,
     orange and pink swatches. Pencil and the red swatch each carry
     the same ring. No Paper Hat, Watermelon, Ice Cream or House. The
     console shows no errors or warnings.
   - **Expect:** the designs are plain buttons with rounded corners and
     a thin border, no fill. Hovering one shows a pointer cursor and
     fades in a faint tint; moving off fades it out.
2. **Do:** click "Mount Fuji".
   - **Expect:** the paper fades to green as it starts to unfold, and
     the green swatch takes the ring. The flat sheet stretches to a
     square as it turns back upright, then folds into Mount Fuji.
     Mount Fuji takes the ring.
3. **Do:** click "Yacht".
   - **Expect:** blue. The finished yacht's bottom edge is level, the
     whole yacht turned slightly anticlockwise.
4. **Do:** click "Paper Dart", then "Heart".
   - **Expect:** a clear orange, not yellow, for the dart; a vibrant
     magenta-red, close to rubine, for the heart.
5. **Do:** with the heart showing, click the blue swatch, then "Flat",
   then "Heart"; then click the green swatch, then "Heart" again.
   - **Expect:** blue fades in and stays through "Flat". "Heart" fades
     back to pink. Green fades in, and the second "Heart" fades back to
     pink without moving the paper. Every change is a fade.
6. **Do:** hard-reload, press Tab once, then Right four times, Right
   once more, then Left, Up and Down.
   - **Expect:** the first Tab rings Pencil with the browser's focus
     ring. Each arrow moves both rings and chooses the design: Mount
     Fuji, Flat, Yacht, Paper Dart, Heart, then back round to Pencil;
     Left and Up step back, Down steps on, as in the swatches. The
     colour follows each design; Flat leaves it alone.
   - **Why:** catches a picker that moves focus without choosing, or
     takes one Tab stop per design.
7. **Do:** press Escape, hover over and click where "Yacht" was, then
   press Right.
   - **Expect:** the toolbar fades out. The pointer over it shows the
     grab cursor, and the click picks nothing (a drag there spins the
     paper). Right chooses the next design as before.
8. **Do:** press Escape, then hold Escape down for a second.
   - **Expect:** the toolbar fades back in, with the current design
     ringed; holding Escape toggles it once, not on every repeat.
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
11. **Do:** press Escape to show the toolbar, Tab to "Fold lines" and
    press Space twice; Tab once more and press Right.
    - **Expect:** the lines fade out and back in. The Tab after the
      checkbox lands on the swatches, and Right chooses the next colour.
12. **Do:** choose "Yacht" and the orange swatch, then reload normally
    (Cmd+R, not hard).
    - **Expect:** a finished red pencil again, with Pencil and red
      ringed, whatever the browser restored.
13. **Do:** click "Pencil", then "Flat".
    - **Expect:** the pencil unfolds to a flat half sheet lying
      diagonally, turned 135°, as "Looks wrong, but isn’t" explains.

### Looks wrong, but isn’t

- "Flat" keeps the current design's lean, so after the pencil or the
  yacht the flat sheet lies turned (Decision 2).
- The design buttons are plainer than the old native buttons, and their
  ring has rounded corners where the swatches' is square (Decision 7).

### Optional, for a later pass

- In Safari, repeat step 10: a canvas press may still take focus
  (Decision 11's WebKit bug), and Escape twice should get it back.
- On a phone, a double tap should reset the spin, as a double-click
  does.

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
