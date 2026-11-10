---
title: Turn the paper over, and fold a watermelon slice
description: Adds an animated turn-over step to a design's sequence, with folds written as the viewer sees them, and proves it with a watermelon slice behind a new button.
type: plan
---

## Context

- Delivers the turn-over: a step in a design's sequence that turns the
  whole model over, animated like a fold, after which the next folds
  are made towards the viewer. A third design, the watermelon slice,
  proves it: it turns over twice.
- Implements
  [Ruling 2](./07-design-research.md#ruling-2-turning-the-paper-over-is-an-animated-step)
  and
  [Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)
  of [07-design-research.md](./07-design-research.md), whose shortlist
  holds the watermelon as design 5. At least 12 of its 22 designs turn
  over, so no more can be added without this.
- Depends on [Plan 08](../done/08-fold-lines-both-sides.md), so that the side
  which comes round carries its fold lines. It extends cutSheet() in
  `docs/src/fold/engine.js`, the pose in `docs/src/fold/pose.js`, and
  createPaper() in `docs/src/scene/paper.js`. It feeds
  [Plan 10](./10-start-the-sheet-turned.md), which adds a starting pose
  to the same view of the paper.
- The watermelon follows Fumiaki Shingu's diagram at
  [Origami Club](https://en.origami-club.com/easy/food/watermelon2/index.html),
  read on 2026-11-10.
- Figures marked "prototype" were run on 2026-11-10 in a throwaway Node
  script, kept outside the repo, which fed the current engine the
  watermelon's folds turned by hand into the front's terms. The real
  code is written afresh, to [CLAUDE.md](../../CLAUDE.md)'s standards.
- Three.js: `Object3D.rotation` and `Group` only, as `main.js` uses
  them now.

## Definitions

The terms of [Plan 02a](../done/02a-paper-dart.md#definitions) and
[Plan 02c](../done/02c-printed-fold-lines.md#definitions) apply. Three
more:

- **Step**: one move in a design's sequence, either a fold or a
  turn-over.
- **Turn-over**: turning the whole model half a turn about its upright
  axis, so that its other side faces the viewer. It folds nothing.
- **View frame**: coordinates as the viewer sees the paper at a step,
  in metres, from the sheet's centre as the folded plane places it, `x`
  to the viewer's right and `y` up. Before any turn-over it is the
  folded plane itself. Each turn-over mirrors it left to right.

## Decisions

1. **A design's sequence is `steps`**, which replaces `folds`. Each
   step has a `kind`: `"fold"`, with the fields a fold has today, or
   `"turn-over"`, with none. `heldBy` and `movedBy` name a step by its
   index in `steps`. The dart and the hat hold folds only, so their
   indices stand. The watermelon, in metres:

   ```json
   {
     "aspect": 1,
     "id": "watermelon",
     "steps": [
       {
         "from": [0.075, -0.05625],
         "kind": "fold",
         "layers": "all",
         "targetRadians": 3.141592653589793,
         "to": [-0.075, -0.05625],
         "turns": "moving-side",
         "type": "valley"
       },
       { "kind": "turn-over" },
       {
         "from": [0, 0.075],
         "kind": "fold",
         "layers": "all",
         "targetRadians": 3.141592653589793,
         "to": [0.075, -0.0375],
         "turns": "moving-side",
         "type": "valley"
       },
       {
         "from": [-0.075, -0.0375],
         "kind": "fold",
         "layers": "all",
         "targetRadians": 3.141592653589793,
         "to": [0, 0.075],
         "turns": "moving-side",
         "type": "valley"
       },
       { "kind": "turn-over" }
     ]
   }
   ```

2. **A fold is written in the view frame**: its line runs `from` → `to`
   as the viewer sees the paper at that step, the side to the line's
   left as the viewer sees it moves, and a valley comes towards the
   viewer. A design then reads as its diagram does, fold by fold. The
   dart and the hat never turn over, so nothing in them changes but the
   list's name and each step's `kind`.
3. **cutSheet() turns each fold into the front's terms**, then runs as
   it does now. A fold made while the viewer sees the back, after an
   odd number of turn-overs, has both ends' `x` negated, its ends
   swapped, and its type made the opposite; a fold seen from the front
   is used as written. `heldBy` and `movedBy` are turned from step
   indices into fold indices. The sheet keeps `folds`, now in the
   front's terms, and gains `steps`, one entry per step. The
   watermelon's:

   ```json
   [
     { "foldsBefore": 0, "kind": "fold", "turnOversBefore": 0 },
     { "foldsBefore": 1, "kind": "turn-over", "turnOversBefore": 0 },
     { "foldsBefore": 1, "kind": "fold", "turnOversBefore": 1 },
     { "foldsBefore": 2, "kind": "fold", "turnOversBefore": 1 },
     { "foldsBefore": 3, "kind": "turn-over", "turnOversBefore": 1 }
   ]
   ```

   Faces, layers, crease lines, bridges and stage centres are untouched:
   a turn-over changes none of them, and a face's `movedBy` still holds
   fold indices.
4. **Errors name the step**: cutSheet()'s messages give a step's index
   in `steps`, which is what a design's author counts, as in
   `Step 2 of design "watermelon" moves nothing`. Two more:
   `Step 0 of design "odd" has unknown kind "twist"`, and
   `Step 2 of design "odd" names step 1, which is not a fold`, for a
   `heldBy` or `movedBy` that names a turn-over.
5. **The sequence position counts steps**, from 0 (flat) to the step
   count. `docs/src/fold/pose.js` gains two pure functions that
   allocate nothing: `foldPositionAt(sequencePosition, sheet)`, the
   folds done, which stands still through a turn-over; and
   `viewTurnRadiansAt(sequencePosition, sheet)`, the model's turn about
   its upright axis. writePaperPositions() takes the sequence position
   and poses the folds by the first; maxPaperRadius() samples every
   step. `docs/src/fold/stepper.js` moves one step at a time as it
   moves one fold now, so only its comments change.
6. **A turn-over turns the model −π radians**, eased as a fold is, so
   its right edge swings towards the viewer, as a page turns. Every
   turn-over turns the same way, and unfolding plays each backwards.
   It takes a fold's time, `FOLD_SECONDS` forwards and `UNFOLD_SECONDS`
   back. Should Manual QA 3 find that wrong, a time of its own is a
   later change to the stepper.
7. **The turn sits between the spin and the stretch**:
   `group` (the spin) → `turnGroup` → `stretchGroup` → the meshes.
   setSequencePosition() sets `turnGroup.rotation.y`. The axis passes
   through the origin, where the slide already keeps the folded shape
   centred, and tilts with the paper when a drag has tilted it.
8. **Steps are made by shared makers**, in a new
   `docs/src/designs/steps.js`:
   `createFold(from, layers, to, type, options)`, with the dart's
   optional `targetRadians` and `turns`, and the frozen `TURN_OVER`.
   The dart's and the hat's own createFold() go.
9. **One list of designs**: a new `docs/src/designs/list.js` exports
   `DESIGNS`, a frozen array in button order: the dart, the hat, the
   watermelon. `main.js` builds `designs` and `sheets` from it and
   starts with its first; `fold-buttons.js` builds its targets from it.
   A new design is then its file, a line in the list and a
   `<button>` in `docs/index.html`. The list is data that two modules
   read, not a file of re-exports.
10. **The watermelon**, from the square, coloured side up, with no
    tuned number: every line sits on a landmark of the diagram.
    - The bottom eighth folds up, to the quarter line: a valley along
      `y = −56.25 mm`.
    - Turn over.
    - Each top corner folds in, right then left, along a line from the
      top edge's middle to the side edge at the quarter line.
    - Turn over.
    - Prototype: 3 folds in 5 steps, 4 faces, and 3 crease lines, which
      from the front are 1 valley and 2 mountain. The finished slice is
      150.0 mm wide and 131.3 mm tall: a coloured triangle of
      8,438 mm² above a white band of 2,813 mm². It reaches 106.29 mm
      from the origin, inside the hat's 116.21 mm, so the camera stays
      where it is.
    - Its file is `docs/src/designs/watermelon.js`, exporting
      `WATERMELON`, with the id `watermelon`. Its `@fileoverview`
      credits the diagram.
11. **The button** reads "Watermelon", with `data-fold="watermelon"`,
    after "Paper Hat".
12. **Performance**: each frame adds one look-up in `steps` and one
    rotation written, with no loop over vertices and no allocation, so
    there is nothing new to measure beyond the optional Manual QA 11.

## Steps

### Step 1: Steps in the engine and the pose

- Adds `docs/src/designs/steps.js` (Decision 8).
- Changes `docs/src/designs/paper-dart.js` and
  `docs/src/designs/paper-hat.js`: `steps` for `folds`, made by the
  shared makers (Decisions 1, 8).
- Changes `docs/src/fold/engine.js`: the view frame, the sheet's
  `steps`, and the errors (Decisions 2 to 4). Its doc comments say
  which frame each value is in.
- Changes `docs/src/fold/pose.js`: the two new functions,
  writePaperPositions() and maxPaperRadius() (Decision 5). The
  per-frame path still allocates nothing.
- Changes `docs/src/fold/stepper.js` and
  `docs/src/ui/fold-buttons.js`: comments, and `steps.length` for
  `folds.length`.
- It should fold the dart and the hat exactly as before (Agent QA 1).
- It should cut a design seen from behind, after a turn-over, into the
  same sheet as the design it mirrors (Agent QA 2).
- It should hold the folds still through a turn-over, and turn the
  model −π radians over it, eased (Agent QA 3).
- It should throw, naming the design and the step, for an unknown
  `kind` and for `layers` that name a turn-over (Agent QA 4; inferred).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius, writePaperPositions } from "./docs/src/fold/pose.js"; for (const design of [PAPER_DART, PAPER_HAT]) { const sheet = cutSheet(design); const p = new Float64Array(3 * sheet.faces.reduce((n, f) => n + f.polygon.length, 0)); let sum = 0; for (let s = 0; s <= 2 * design.steps.length; s++) { writePaperPositions(p, s / 2, sheet); for (const v of p) sum += Math.abs(v); } console.log(sum.toFixed(6), maxPaperRadius(sheet).toFixed(5), sheet.creaseLines.length); }'`
   Expect: `58.131592 0.10609 15`, then `21.650211 0.11621 7` (the sum
   of every coordinate's size over every half step, the radius and the
   crease lines; run against the current code on 2026-11-10, with
   `folds` for `steps`)
2. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { TURN_OVER } from "./docs/src/designs/steps.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const flip = ([x, y]) => [-x, y]; const other = (type) => (type === "valley" ? "mountain" : "valley"); const bump = (layers) => (layers === "all" ? layers : layers.heldBy === undefined ? { movedBy: layers.movedBy + 1 } : { heldBy: layers.heldBy + 1 }); const seen = { ...PAPER_HAT, steps: [TURN_OVER, ...PAPER_HAT.steps.map((step) => ({ ...step, from: flip(step.to), layers: bump(step.layers), to: flip(step.from), type: other(step.type) }))] }; const a = cutSheet(PAPER_HAT); const b = cutSheet(seen); console.log(JSON.stringify([a.faces, a.creaseLines, a.centres]) === JSON.stringify([b.faces, b.creaseLines, b.centres]), b.steps.length, b.folds.length);'`
   Expect: `true 6 5` (the hat, turned over first and then folded as
   seen from behind; prototype)
3. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { TURN_OVER } from "./docs/src/designs/steps.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { foldPositionAt, viewTurnRadiansAt } from "./docs/src/fold/pose.js"; const flip = ([x, y]) => [-x, y]; const other = (type) => (type === "valley" ? "mountain" : "valley"); const bump = (layers) => (layers === "all" ? layers : layers.heldBy === undefined ? { movedBy: layers.movedBy + 1 } : { heldBy: layers.heldBy + 1 }); const sheet = cutSheet({ ...PAPER_HAT, steps: [TURN_OVER, ...PAPER_HAT.steps.map((step) => ({ ...step, from: flip(step.to), layers: bump(step.layers), to: flip(step.from), type: other(step.type) }))] }); console.log([0, 0.5, 1, 1.5, 6].map((s) => foldPositionAt(s, sheet).toFixed(4) + " " + viewTurnRadiansAt(s, sheet).toFixed(4)).join(" | "));'`
   Expect: `0.0000 0.0000 | 0.0000 -1.5708 | 0.0000 -3.1416 | 0.5000 -3.1416 | 5.0000 -3.1416`
4. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { TURN_OVER } from "./docs/src/designs/steps.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const [first] = PAPER_HAT.steps; for (const steps of [[{ kind: "twist" }], [first, TURN_OVER, { ...first, layers: { movedBy: 1 } }]]) { try { cutSheet({ aspect: 1, id: "odd", steps }); } catch (error) { console.log(error.message); } }'`
   Expect: `Step 0 of design "odd" has unknown kind "twist"`, then
   `Step 2 of design "odd" names step 1, which is not a fold`

### Step 2: The watermelon, and the list of designs

- Adds `docs/src/designs/watermelon.js` (Decision 10) and
  `docs/src/designs/list.js` (Decision 9).
- It should cut the watermelon into the prototype's sheet (Agent QA 1).
- It should finish as a slice 150.0 mm wide and 131.3 mm tall, centred
  (Agent QA 1; Manual QA 1).
- It should list the designs in button order (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { WATERMELON } from "./docs/src/designs/watermelon.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius, writePaperPositions } from "./docs/src/fold/pose.js"; const sheet = cutSheet(WATERMELON); const p = new Float64Array(3 * sheet.faces.reduce((n, f) => n + f.polygon.length, 0)); writePaperPositions(p, WATERMELON.steps.length, sheet); const xs = p.filter((_v, i) => i % 3 === 0); const ys = p.filter((_v, i) => i % 3 === 1); const mm = (v) => (v * 1000).toFixed(1); const count = (type) => sheet.creaseLines.filter((line) => line.type === type).length; console.log(sheet.steps.length, sheet.folds.length, sheet.faces.length, count("valley"), count("mountain"), maxPaperRadius(sheet).toFixed(5), mm(Math.min(...xs)), mm(Math.max(...xs)), mm(Math.min(...ys)), mm(Math.max(...ys)));'`
   Expect: `5 3 4 1 2 0.10629 -75.0 75.0 -65.6 65.6` (prototype)
2. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; console.log(DESIGNS.map((design) => design.id).join(), Object.isFrozen(DESIGNS));'`
   Expect: `paper-dart,paper-hat,watermelon true`

### Step 3: The turn on the page, and the button

- Changes `docs/src/scene/paper.js`: `turnGroup`, and
  setSequencePosition() (Decision 7). Its doc comments name the three
  groups.
- Changes `docs/src/main.js` and `docs/src/ui/fold-buttons.js`: both
  read `DESIGNS` (Decision 9). `main.js`'s `@fileoverview` no longer
  names the designs one by one.
- Changes `docs/index.html`: the button (Decision 11).
- It should fold the watermelon as its diagram does: band, turn, two
  corners, turn (Manual QA 1, 2).
- It should turn the paper over smoothly, in a fold's time, about its
  own centre, with no jump before or after (Manual QA 3).
- It should show the fold lines of whichever side faces the viewer
  (Manual QA 1).
- It should unfold through the turn-overs, backwards (Manual QA 4).
- It should finish a turn-over under way before obeying a new button
  (Manual QA 5).
- It should keep the spin and the turn-over independent (Manual QA 6).
- It should leave the dart, the hat and every other control as they
  were (Manual QA 8, 9, 10).

**Agent QA**

1. Do: `grep -c 'data-fold=' docs/index.html`
   Expect: `4` (`3` before)
2. Do: `grep -c 'PAPER_DART\|PAPER_HAT' docs/src/main.js docs/src/ui/fold-buttons.js`
   Expect: `0` for each file
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/` and every file under `docs/src/`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser "Watermelon" folds a slice, turning the paper over twice on
the way, and "Flat" plays it all back, with a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R). Keep the
[diagram](https://en.origami-club.com/easy/food/watermelon2/index.html)
open beside it.

1. **Do:** click "Watermelon" and watch the whole sequence, about four
   seconds.
   - **Expect:** black lines fade in on the coloured square: plain
     dashes across it near the bottom, and two dash-dot-dot lines from
     the top edge's middle down to the sides.
   - **Expect:** the bottom eighth folds up towards you, as a white
     band. The paper turns over, its right edge swinging towards you,
     and shows its white back, with two lines of plain dashes in the
     paper's colour. The right corner folds in towards you, then the
     left over it, each showing the paper's colour. The paper turns
     over again, the same way.
   - **Expect:** it ends as a triangle in the paper's colour above a
     white band, centred. The console shows no errors or warnings.
2. **Do:** compare each stage with the diagram's steps 2 to 6.
   - **Expect:** the same shapes in the same order. The diagram's step
     1 is a crease, which the printed lines stand in for.
3. **Do:** click "Flat", then "Watermelon" again, and watch the two
   turn-overs closely.
   - **Expect:** each starts and stops gently, takes about as long as
     a fold, and turns the paper about its own centre. Nothing jumps
     as a turn-over begins or ends, and the shadows stay clean. Note
     whether the pace suits, for `/done-plan` to record.
4. **Do:** click "Flat" once the slice has finished.
   - **Expect:** everything plays backwards, twice as fast, turn-overs
     included, and ends as the flat square, coloured side towards you,
     blank once the lines have faded.
5. **Do:** click "Watermelon", and during the first turn-over click
   "Paper Dart".
   - **Expect:** the turn-over finishes; the paper turns back, unfolds
     and fades its lines; then the dart folds as it always has.
6. **Do:** click "Watermelon", and drag the paper about while it turns
   over.
   - **Expect:** the paper follows the pointer throughout, and the
     turn-over carries on within it. Drag the paper to a tilt first,
     and the turn-over turns about the paper's own tilted upright.
7. **Do:** untick "Fold lines" and click "Flat", then "Watermelon".
   - **Expect:** the same sequence, with no lines on either side.
8. **Do:** tick "Fold lines". Click "Paper Dart", then "Paper Hat",
   letting each finish.
   - **Expect:** both fold, switch and stretch exactly as before this
     plan.
9. **Do:** press Tab until "Watermelon" has the focus ring, and press
   Enter.
   - **Expect:** the same sequence as a click.
10. **Do:** click a colour swatch during a turn-over.
    - **Expect:** the paper, and the lines on its white side, fade to
      the new colour while it turns.

### Optional, for a later pass

11. **Do:** in the Performance panel, record "Watermelon" folding while
    dragging.
    - **Expect:** steady frames. Note the frame times, for `/done-plan`
      to record.

**Looks wrong, but isn't:**

- The paper slides down a little as the band folds up: each stage's
  folded shape stays centred, as the hat's does.
- The two corners' lines look dash-dot-dot from the front and plain
  from the back: the corners fold towards whoever sees the back.
- Each further design adds a button to the row. The row is tidied once
  the designs are in
  ([Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)).

## Audit

- **2026-11-10T14:26:45Z** — **drafted**: `steps` of folds and
  turn-overs, folds written in the view frame and turned into the
  front's terms by cutSheet(), the turn as a group between the spin
  and the stretch, shared step makers, one list of designs, and the
  watermelon with its button; the Lead Developer ruled the animated
  turn-over and accepted new engine work for it; agent proposed the
  view frame, `steps` replacing `folds`, errors that name the step, a
  turn of −π radians in a fold's time, `turnGroup`, the makers and the
  list, and the watermelon as the proof, with its lines read off the
  diagram; split from the starting pose, now Plan 10, by the seam test;
  figures from a prototype against the current engine.
