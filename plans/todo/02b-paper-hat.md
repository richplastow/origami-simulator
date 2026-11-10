---
title: Fold the paper hat on a stretching sheet
description: Adds the newspaper hat on an A4-shaped sheet of the square's area, folding front or back layers only, and switches designs by way of a flat sheet that stretches between shapes.
type: plan
---

## Context

- Delivers the second design, the newspaper hat, from a "Paper Hat"
  button, and the switch between designs: the paper unfolds, the flat
  sheet stretches from one shape to the other, and the new design folds.
  Still no fold lines are drawn.
- Depends on [Plan 02a](02a-paper-dart.md), which builds the fold engine
  (`docs/src/fold/engine.js`), the pose maths (`docs/src/fold/pose.js`),
  the stepper (`docs/src/fold/stepper.js`), the sheet sizes
  (`docs/src/designs/sheet.js`) and the dart (`PAPER_DART`). This plan
  adds data and behaviour to each.
- Implements the research in
  [02-simple-folds-research.md](02-simple-folds-research.md), which serves
  Plans 02a to 02c and stays in `plans/todo/` until the last of them is
  done: its [Scope](02-simple-folds-research.md#scope),
  [The paper hat](02-simple-folds-research.md#the-paper-hat),
  [Stretchy paper](02-simple-folds-research.md#stretchy-paper) and
  [Presentation](02-simple-folds-research.md#presentation). The design
  follows the
  [Utrecht University hat](https://webspace.science.uu.nl/~bodla101/d.origami/traditional/hat.html).
- Feeds [Plan 02c](02c-printed-fold-lines.md), whose fades sit between
  the phases this plan adds.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10.

## Definitions

The terms of [Plan 02a](02a-paper-dart.md#definitions) apply. Two more:

- **Front layer, back layer**: after the hat's first fold, which folds the
  sheet in half, the half that stayed put lies in front and the half that
  moved lies behind. A later fold can move one of them alone.
- **Stretch**: the flat, blank sheet changing from one design's shape to
  the other's, width and height easing together. It happens only while
  the paper is flat.

## Decisions

1. **The hat's sheet**: `PAPER_HAT` in `docs/src/designs/paper-hat.js`,
   with `aspect` `Math.SQRT1_2`, A4's shape, so `sheetSize()` gives
   0.126134 × 0.178381 m (126.1 × 178.4 mm) at the square's area, per
   [Scope](02-simple-folds-research.md#scope). The brim is 26.1 mm.
2. **The hat's folds**, in the shape of
   [Plan 02a's Decision 2](02a-paper-dart.md#decisions), all to π with
   `turns: "moving-side"`, computed on 2026-11-10 from the research's
   lines (`w` = 126.134 mm):

   | Fold | From (mm)          | To (mm)            | Type     | Layers           |
   | ---- | ------------------ | ------------------ | -------- | ---------------- |
   | 1    | (-63.067, 0)       | (63.067, 0)        | mountain | all              |
   | 2    | (-63.067, -63.067) | (0, 0)             | valley   | all              |
   | 3    | (0, 0)             | (63.067, -63.067)  | valley   | all              |
   | 4    | (63.067, -63.067)  | (-63.067, -63.067) | valley   | `{ heldBy: 0 }`  |
   | 5    | (63.067, -63.067)  | (-63.067, -63.067) | mountain | `{ movedBy: 0 }` |

   Fold 1 sends the top half behind; folds 2 and 3 bring the corners
   forward to the centre; fold 4 turns the front layer's strip up, fold 5
   the back layer's. The layer selector is Plan 02a's: `heldBy: 0` is the
   front layer and `movedBy: 0` the back.
3. **The paper slides to stay centred**, per
   [Presentation](02-simple-folds-research.md#presentation):
   `cutSheet()` adds `centres` to the sheet, the centre of each stage's
   bounding box in the folded plane, and `writePaperPositions()` shifts
   the paper by minus a centre that moves from one stage's to the next
   with the fold's eased progress. A fold with `turns: "both-sides"`, or
   one that stops short of π, keeps the centre it starts with. The rule
   holds for every design, so the dart now drifts 6.4 mm left and about
   4.5 mm up during its third fold, and back to centre sideways during
   its fourth (computed 2026-11-10). The hat's centres, in metres, stage
   by stage:

   ```json
   [
     [0, 0],
     [0, -0.044595],
     [0, -0.044595],
     [0, -0.044595],
     [0, -0.044595],
     [0, -0.031534]
   ]
   ```

   Plan 02a's Step 2 Agent QA 1 and 2 stop holding once the dart slides;
   this plan's Step 2 checks replace them.

4. **Camera**: `main.js` places it by the larger of the two designs'
   `maxPaperRadius()`. The hat's slide during its first fold lifts the
   sheet's top corners outward, to 116.3 mm from the centre at zero
   thickness, against the dart's 106.1 mm (sampled at 256 poses per fold
   on 2026-11-10). The camera therefore sits about 10% further back than
   in Plan 02a, and the dart looks about 9% smaller. It still never moves
   once placed.
5. **Stepper state**: the state gains the design the sheet is stretching
   from and the stretch's progress, from 0 to 1. The research's
   [Stretchy paper](02-simple-folds-research.md#stretchy-paper) sketches
   the sheet's width and height instead, but the two designs' aspects and
   the progress already give them, so storing them would duplicate.

   ```json
   {
     "designId": "paper-hat",
     "direction": 0,
     "position": 0,
     "stretchFromId": "paper-dart",
     "stretchProgress": 0.5
   }
   ```

   At load: `{ designId: "paper-dart", direction: 0, position: 0,
   stretchFromId: "paper-dart", stretchProgress: 1 }`, the square.
   `stepSequence(deltaSeconds, designs, state, target)` takes the designs
   keyed by `id`. At position 0, a target on another design takes effect:
   `stretchFromId` takes the old id, `designId` the new, and
   `stretchProgress` restarts at 0, or is 1 at once when the two aspects
   match. Folding starts once it reaches 1. The target is read only when
   a fold or the stretch has finished, per
   [Scope](02-simple-folds-research.md#scope). A `null` target keeps the
   sheet showing ("Flat"). It returns true when `position`, `designId` or
   `stretchProgress` changed. Plan 02a's stepper checks need the new
   argument and fields to run again.
6. **Stretch**: `STRETCH_SECONDS = 0.4` in `stepper.js`, eased with
   Plan 02a's smoothstep, per
   [Stretchy paper](02-simple-folds-research.md#stretchy-paper).
   `writeStretchScale(designs, scale, state)` in `designs/sheet.js` writes
   `scale.x` and `scale.y`, each the eased mix of the two sheets' widths
   (or heights) divided by the incoming sheet's, and allocates nothing.
   `main.js` passes it the `scale` of a group inside `paper.group`, which
   holds the meshes, so a later plan can spin `paper.group` by dragging.
7. **Swapping the sheet**: `main.js` cuts both sheets at load. When the
   stepper's `designId` changes, `paper.setSheet(sheet)` builds the new
   geometry, gives it to both meshes, and disposes of the old geometry
   once: the meshes share it, and disposing it frees every attribute, as
   [Plan 01's quality check](../done/01-fold-sheet-in-half.md#audit)
   found. Materials stay. The swap allocates, once per switch, at rest.
8. **Buttons**: "Paper Hat" (`data-fold="paper-hat"`) after "Paper Dart",
   targeting `PAPER_HAT.folds.length`. "Flat" unfolds whichever design
   shows and keeps its sheet, per
   [Stretchy paper](02-simple-folds-research.md#stretchy-paper).
9. **Performance**: a switch rebuilds one small geometry (26 vertices for
   the hat) at rest; the per-frame path adds one scale write. Manual QA 10
   records frame times over a switch against Plan 02a's baseline, and
   Manual QA 9 reads `renderer.info` for leaks.

## Steps

### Step 1: The hat's fold list [P]

- Adds `docs/src/designs/paper-hat.js`: `PAPER_HAT` (Decisions 1, 2).
- It should cut the hat's 126.1 × 178.4 mm sheet into 8 faces and 10
  triangles, 6 layers deep, with 8 bridging strips, keeping its area
  (Agent QA 1, 2).
- It should fold the front and back layers' strips separately
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_HAT); console.log(s.faces.length, s.faces.reduce((n, f) => n + f.polygon.length - 2, 0), Math.max(...s.faces.map((f) => f.layers[5])), s.bridges.length);'`
   Expect: `8 10 6 8`
2. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_HAT); const a = s.faces.reduce((n, { polygon: p }) => n + p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0) / 2, 0); console.log((a * 1e6).toFixed(1), s.widthMeters.toFixed(4), s.heightMeters.toFixed(4));'`
   Expect: `22500.0 0.1261 0.1784`
3. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_HAT); console.log(PAPER_HAT.folds.map((_, j) => s.faces.filter((f) => f.movedBy.includes(j)).length).join(","));'`
   Expect: `4,2,2,1,1`

### Step 2: The paper slides to stay centred

- Changes `docs/src/fold/engine.js` (stage `centres`) and
  `docs/src/fold/pose.js` (the shift) (Decision 3).
- It should keep the hat centred as it folds: after the first fold and at
  the end (Agent QA 1; Manual QA 2).
- It should leave the dart's fold in half and wings where they started
  (Agent QA 2).
- It should report each design's largest radius with the slide
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_HAT); const p = new Float32Array(78); const mm = (n) => (Math.round(n * 1e4) / 10 + 0).toFixed(1); for (const at of [1, 5]) { writePaperPositions(p, at, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); console.log([0, 1].flatMap((k) => [Math.min(...c(k)), Math.max(...c(k))]).map(mm).join(" ")); }'`
   Expect: `-63.1 63.1 -44.6 44.6`, then `-63.1 63.1 -31.5 31.5`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_DART); const p = new Float32Array(150); writePaperPositions(p, 7, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); console.log([0, 1, 2].flatMap((k) => [Math.min(...c(k)), Math.max(...c(k))]).map((n) => (n * 1000).toFixed(1)).join(" "));'`
   Expect: each value within 2 mm of `-31.7 31.7 -83.6 79.6 -32.5 0.0`
   (zero thickness, computed 2026-11-10)
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log([PAPER_DART, PAPER_HAT].map((d) => maxPaperRadius(cutSheet(d)).toFixed(4)).join(" "));'`
   Expect: the dart's from `0.1061` to `0.1077`, the hat's from `0.1162`
   to `0.1168` (zero thickness gives 0.10609 and 0.11625)

### Step 3: Switching designs by way of a stretching flat sheet

- Changes `docs/src/fold/stepper.js` (Decision 5, `STRETCH_SECONDS`) and
  `docs/src/designs/sheet.js` (`writeStretchScale()`, Decision 6).
- It should unfold, stretch for 0.4 s, then fold the new design, carrying
  time over between phases (Agent QA 1).
- It should keep the hat's sheet when "Flat" is pressed (Agent QA 2).
- It should let a press during a stretch take effect when it finishes
  (Agent QA 3).
- It should skip the stretch between two designs of the same shape
  (Agent QA 4) _(inferred from the research)_.
- It should ease the sheet's scale from the old shape to the new
  (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-dart", direction: 0, position: 7, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: "paper-hat", position: 5 }; stepSequence(2.65, d, s, t); const log = [s.designId, s.position, s.stretchFromId, s.stretchProgress.toFixed(4)]; stepSequence(0.4, d, s, t); console.log(...log, "|", s.position.toFixed(4), s.direction, s.stretchProgress);'`
   Expect: `paper-hat 0 paper-dart 0.5000 | 0.2857 1 1`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-hat", direction: 0, position: 5, stretchFromId: "paper-dart", stretchProgress: 1 }; stepSequence(5, d, s, { designId: null, position: 0 }); console.log(s.designId, s.position, s.direction, s.stretchProgress);'`
   Expect: `paper-hat 0 0 1`
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-hat", direction: 0, position: 0, stretchFromId: "paper-dart", stretchProgress: 0.5 }; const t = { designId: "paper-dart", position: 7 }; stepSequence(0.1, d, s, t); const log = [s.designId, s.stretchProgress.toFixed(4)]; stepSequence(0.2, d, s, t); console.log(...log, "|", s.designId, s.stretchFromId, s.stretchProgress.toFixed(4));'`
   Expect: `paper-hat 0.7500 | paper-dart paper-hat 0.2500`
4. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { a: { aspect: 1, id: "a" }, b: { aspect: 1, id: "b" } }; const s = { designId: "a", direction: 0, position: 0, stretchFromId: "a", stretchProgress: 1 }; stepSequence(0.35, d, s, { designId: "b", position: 1 }); console.log(s.designId, s.stretchProgress, s.position.toFixed(4));' && grep -c "new [A-Z]" docs/src/fold/stepper.js`
   Expect: `b 1 0.5000`, then `0`
5. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { writeStretchScale } from "./docs/src/designs/sheet.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const scale = { x: 0, y: 0 }; for (const p of [0.25, 0.5, 1]) { writeStretchScale(d, scale, { designId: "paper-hat", direction: 0, position: 0, stretchFromId: "paper-dart", stretchProgress: p }); console.log(scale.x.toFixed(4), scale.y.toFixed(4)); }'`
   Expect: `1.1596 0.8658`, then `1.0946 0.9204`, then `1.0000 1.0000`

### Step 4: The hat in the scene, and switching between designs

- Changes `docs/src/scene/paper.js`: an inner group holds the meshes, and
  `setSheet(sheet)` swaps and disposes the geometry (Decisions 6, 7).
- Changes `docs/src/main.js`: cuts both sheets, places the camera by both
  radii (Decision 4), passes the designs to `stepSequence()`, calls
  `setSheet()` when `designId` changes and `writeStretchScale()` while
  stretching.
- Changes `docs/src/ui/fold-buttons.js` and `docs/index.html`: the
  "Paper Hat" button (Decision 8).
- It should stretch the square into the tall sheet, then fold the hat,
  sliding up to end centred (Manual QA 2).
- It should show no flicker, slit or crack in the hat (Manual QA 3).
- It should unfold to the current sheet on "Flat", and switch designs by
  way of the flat sheet (Manual QA 4 to 7).
- It should free the old sheet's geometry at each swap (Manual QA 9).

**Agent QA**

1. Do: `grep -o 'data-fold="[a-z-]*"' docs/index.html | tr '\n' ' '`
   Expect: `data-fold="flat" data-fold="paper-dart" data-fold="paper-hat" `
2. Do: `grep -c "dispose()" docs/src/scene/paper.js`
   Expect: `1` or more
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/` and every file under `docs/src/`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in the
browser "Paper Hat" stretches the square into the tall sheet and folds the
hat, and the buttons switch between the two designs by way of the flat
sheet, with a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the page after loading.
   - **Expect:** the plain red square of Plan 02a, a little smaller;
     "Flat", "Paper Dart" and "Paper Hat" buttons along the bottom. The
     console shows no errors or warnings.
2. **Do:** click "Paper Hat" and watch until it stops, about 4 s.
   - **Expect:** the square narrows and grows taller, smoothly, in under
     half a second; then five eased folds: the top half folds away behind,
     the two top corners fold towards you to the centre, the front strip
     folds up over them, and the back strip folds up behind. The paper
     slides upwards as it folds, ending centred: a red triangle with an
     off-white brim along its bottom.
   - **Why:** catches a reversed fold, a wrong layer, and a missing slide.
3. **Do:** zoom the page to 200% (Cmd and +) and look along the hat's
   edges and brim; then reset zoom (Cmd and 0).
   - **Expect:** no flickering stripes, slits or hairline cracks.
4. **Do:** click "Flat".
   - **Expect:** the hat unfolds in about 2 s to a plain red tall sheet,
     which stays tall.
5. **Do:** click "Paper Dart".
   - **Expect:** the tall sheet widens back to the square, then folds the
     dart as in Plan 02a.
6. **Do:** with the dart finished, click "Paper Hat".
   - **Expect:** the dart unfolds fully, the flat square stretches to the
     tall sheet, and the hat folds: about 6.5 s, with no jump between
     phases.
7. **Do:** click "Flat", wait, then click "Paper Dart" and, at once,
   "Paper Hat".
   - **Expect:** the sheet finishes stretching to the square first, then
     stretches back to the tall sheet and folds the hat. Nothing jumps.
8. **Do:** while the paper switches designs, drag the window narrow and
   tall, then wide and short; then repeat step 6 in device mode on a
   phone such as iPhone 12 Pro (390 × 844).
   - **Expect:** the whole paper stays in view at every stage, never cut
     off, stretched or blurred; the three buttons are visible.
9. **Do:** in Sources, open `src/main.js` and set a breakpoint on the
   line that calls `renderer.render(scene, camera)`. When it pauses, type
   `renderer.info.memory.geometries` in the console and note it; remove
   the breakpoint and resume. Switch designs three times (steps 5 and 6),
   then set the breakpoint again and read the count.
   - **Expect:** the same count both times.
   - **Why:** a geometry not disposed at the swap leaks GPU memory.
10. **Do:** in the Performance panel, record step 6, and stop when the hat
    is finished.
    - **Expect:** steady frames, with no long task at the moment the sheet
      swaps. Note the typical frame time for `/done-plan` to record in the
      `done` Audit entry, against Plan 02a's baseline.

**Looks wrong, but isn't:**

- The square looks a little smaller than in Plan 02a: the camera now
  frames the hat's slide too.
- During the dart's third fold, the paper drifts slightly left and up,
  and its fourth brings it back sideways: the slide keeps the folded shape
  centred.
- No fold lines show on the paper: they arrive with Plan 02c.

## Audit

- **2026-11-10T01:02:55Z** — **drafted**: the hat on a 126.1 × 178.4 mm
  sheet with front- and back-layer brim folds, the slide that keeps a
  design centred, and switching designs by way of a 0.4 s stretch;
  agent proposed the stepper's stretch fields in place of a stored width
  and height, `writeStretchScale()`, the camera's radius over both
  designs, and the slide's bounding-box centre.
