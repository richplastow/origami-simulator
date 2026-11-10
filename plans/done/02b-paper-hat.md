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
- Depends on [Plan 02a](./02a-paper-dart.md), which builds the fold engine
  (`docs/src/fold/engine.js`), the pose maths (`docs/src/fold/pose.js`),
  the stepper (`docs/src/fold/stepper.js`), the sheet sizes
  (`docs/src/designs/sheet.js`) and the dart (`PAPER_DART`). This plan
  adds data and behaviour to each.
- Implements the research in
  [02-simple-folds-research.md](../todo/02-simple-folds-research.md), which serves
  Plans 02a to 02c and stays in `plans/todo/` until the last of them is
  done: its [Scope](../todo/02-simple-folds-research.md#scope),
  [The paper hat](../todo/02-simple-folds-research.md#the-paper-hat),
  [Stretchy paper](../todo/02-simple-folds-research.md#stretchy-paper) and
  [Presentation](../todo/02-simple-folds-research.md#presentation). The design
  follows the
  [Utrecht University hat](https://webspace.science.uu.nl/~bodla101/d.origami/traditional/hat.html).
- Feeds [Plan 02c](../todo/02c-printed-fold-lines.md), whose fades sit between
  the phases this plan adds.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10.

## Definitions

The terms of [Plan 02a](./02a-paper-dart.md#definitions) apply. Two more:

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
   [Scope](../todo/02-simple-folds-research.md#scope). The brim is 26.1 mm.
2. **The hat's folds**, in the shape of
   [Plan 02a's Decision 2](./02a-paper-dart.md#decisions), all to π with
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

   Tested on 2026-11-10 in a throwaway script, with Plan 02a's thickness,
   stacking and bridges as `docs/src/fold/` builds them, at every 0.01 of
   the sequence: no two faces lie in one plane, and faces and strips pass
   through one another only in the first half of fold 4, by at most
   0.04 mm, as the front strip turns about the unraised line. That is the
   transient Plan 02a's quality check deferred; the dart reaches 0.075 mm
   by the same measure. Three pairs of bridging strips lie in one plane,
   as [Plan 02a's Decision 7](./02a-paper-dart.md#decisions) accepts:
   fold 2's front and back layers, fold 3's likewise, and the two halves
   of fold 1's crease, which folds 2 and 3 bring together on the centre
   line, edge-on to the camera.
3. **The paper slides to stay centred**, per
   [Presentation](../todo/02-simple-folds-research.md#presentation):
   `cutSheet()` adds `centres` to the sheet, one per stage: the centre of
   that stage's bounding box in the folded plane, except that a fold with
   `turns: "both-sides"`, or one that stops short of π, keeps the centre
   it starts with, so its stage repeats the one before.
   `writePaperPositions()` shifts the paper, after every turn, by minus a
   centre that moves from one stage's to the next with the fold's eased
   progress. The repeat matters: the dart's stage 5 lies in a folded plane
   that its fold in half reflected, with its bounding box centred 31.1 mm
   to the right, and easing towards that would jump the paper sideways
   as fold 6 starts. No design folds to π, turning its moving side, after
   a fold that turns both sides, and the rule is untested for one. The
   rule holds for every design, so the dart now drifts 6.4 mm left and
   about 4.5 mm up during its third fold, and back to centre sideways
   during its fourth (computed 2026-11-10): its centres are (0, 0) for
   stages 0 to 2, (6.43, −4.55) mm for stage 3, and (0, −4.55) mm from
   stage 4 on. The hat's centres, in metres, stage by stage:

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
   [Stretchy paper](../todo/02-simple-folds-research.md#stretchy-paper) sketches
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
   match. Folding starts once it reaches 1. While the target names another
   design, the stepper unfolds towards 0, whatever the target's
   `position`. The target is read only when
   a fold or the stretch has finished, per
   [Scope](../todo/02-simple-folds-research.md#scope). A `null` target keeps the
   sheet showing ("Flat"). It returns true when `position`, `designId` or
   `stretchProgress` changed. Plan 02a's stepper checks need the new
   argument and fields to run again.
6. **Stretch**: `STRETCH_SECONDS = 0.4` in `stepper.js`, eased with
   Plan 02a's smoothstep, per
   [Stretchy paper](../todo/02-simple-folds-research.md#stretchy-paper).
   smoothstep() moves from `pose.js`, which keeps using it, to its own
   module, `docs/src/fold/easing.js`, as a named export: importing it into
   `sheet.js` from `pose.js` would close an import cycle, since `pose.js`
   imports `engine.js`, which imports `sheet.js`.
   `writeStretchScale(designs, scale, state)` in `designs/sheet.js` writes
   `scale.x` and `scale.y`, each the eased mix of the two sheets' widths
   (or heights) divided by the incoming sheet's, and allocates nothing, so
   it works out each width and height without calling sheetSize(), whose
   result is a new object.
   `main.js` passes it the `scale` of a group inside `paper.group`, which
   holds the meshes, so a later plan can spin `paper.group` by dragging.
7. **Swapping the sheet**: `main.js` cuts both sheets at load. When the
   stepper's `designId` changes, `paper.setSheet(sheet)` builds the new
   geometry, posed flat and with the same bounding sphere, of the radius
   Decision 4 gives, hands it to both meshes, and disposes of the old
   geometry once: the meshes share it, and disposing it frees every
   attribute, as
   [Plan 01's quality check](./01-fold-sheet-in-half.md#audit)
   found. Materials stay. The swap allocates, once per switch, at rest.
8. **Buttons**: "Paper Hat" (`data-fold="paper-hat"`) after "Paper Dart",
   targeting `PAPER_HAT.folds.length`. "Flat" unfolds whichever design
   shows and keeps its sheet, per
   [Stretchy paper](../todo/02-simple-folds-research.md#stretchy-paper).
9. **Performance**: a switch rebuilds one small geometry (26 vertices for
   the hat) at rest; the per-frame path adds one scale write. Manual QA 10
   records frame times over a switch, the first baseline, since Plan 02a
   recorded none, and Manual QA 9 reads `renderer.info` for leaks.

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
  the end, with no jump as one fold ends and the next begins, for either
  design (Agent QA 1, 4; Manual QA 2).
- It should leave the dart's fold in half and wings where they started
  (Agent QA 2).
- It should report each design's largest radius with the slide
  (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_HAT); const p = new Float32Array(78); const mm = (n) => (Math.round(n * 1e4) / 10 + 0).toFixed(1); for (const at of [1, 5]) { writePaperPositions(p, at, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); console.log([0, 1].flatMap((k) => [Math.min(...c(k)), Math.max(...c(k))]).map(mm).join(" ")); }'`
   Expect: `-63.1 63.1 -44.6 44.6`, then `-63.1 63.1 -31.5 31.5`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_DART); const p = new Float32Array(150); writePaperPositions(p, 7, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); console.log([0, 1, 2].flatMap((k) => [Math.min(...c(k)), Math.max(...c(k))]).map((n) => (n * 1000).toFixed(1)).join(" "));'`
   Expect: each value within 2 mm of `-31.7 31.7 -83.6 79.6 0.0 32.5`
   (zero thickness, computed 2026-11-10: the wings open towards the
   camera, +Z). With thickness, a stand-in for the slide gave
   `-32.4 31.7 -83.6 79.6 -0.0 32.8` on 2026-11-10.
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log([PAPER_DART, PAPER_HAT].map((d) => maxPaperRadius(cutSheet(d)).toFixed(4)).join(" "));'`
   Expect: the dart's from `0.1061` to `0.1077`, the hat's from `0.1162`
   to `0.1168` (zero thickness gives 0.10609 and 0.11625)
4. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; for (const d of [PAPER_DART, PAPER_HAT]) { const s = cutSheet(d); const n = 3 * s.faces.reduce((t, { polygon }) => t + polygon.length, 0); const p = new Float64Array(n); const q = new Float64Array(n); let jump = 0; for (let k = 1; k < d.folds.length; k++) { writePaperPositions(p, k - 1e-9, s); writePaperPositions(q, k, s); for (let i = 0; i < n; i += 3) jump = Math.max(jump, Math.hypot(p[i] - q[i], p[i + 1] - q[i + 1], p[i + 2] - q[i + 2])); } console.log((jump * 1000).toFixed(4)); }'`;
   then [Plan 02a's Step 2](./02a-paper-dart.md#step-2-pose-with-thickness-and-the-cameras-radius)
   Agent QA 3, 5, 6 and 7, unchanged.
   Expect: `0.0000` twice (millimetres: the largest jump of any vertex
   across the end of a fold, dart then hat; easing towards the dart's
   uncarried stage-5 centre gave `31.0660`); then each of Plan 02a's
   lines gives its own `Expect:` (faces stay rigid, the pose allocates
   nothing, the wings' strips bend smoothly, no jump).

### Step 3: Switching designs by way of a stretching flat sheet

- Changes `docs/src/fold/stepper.js` (Decision 5, `STRETCH_SECONDS`) and
  `docs/src/designs/sheet.js` (`writeStretchScale()`, Decision 6).
- Adds `docs/src/fold/easing.js`, moving smoothstep() out of
  `docs/src/fold/pose.js`, which imports it from there (Decision 6).
- It should unfold fully, whatever the new design's target position,
  stretch for 0.4 s, then fold the new design, carrying time over between
  phases (Agent QA 1, 6).
- It should keep the hat's sheet when "Flat" is pressed (Agent QA 2).
- It should let a press during a stretch take effect when it finishes
  (Agent QA 3).
- It should skip the stretch between two designs of the same shape, per
  [Stretchy paper](../todo/02-simple-folds-research.md#stretchy-paper)
  (Agent QA 4).
- It should ease the sheet's scale from the old shape to the new,
  allocating nothing (Agent QA 5).
- It should keep Plan 02a's fold timings, carry-over, mid-fold presses
  and handling of a negative delta (Agent QA 7).

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
   Then: `sed -n '/export const writeStretchScale/,/^};/p' docs/src/designs/sheet.js | grep -v "export const writeStretchScale" | grep -cE "new [A-Z]|\[\]|\{\}|=>|\.\.\.|sheetSize\("`
   Expect: `1.1596 0.8658`, then `1.0946 0.9204`, then `1.0000 1.0000`;
   then `0` (no allocation, closure or spread, and no call to
   sheetSize())
6. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-dart", direction: 0, position: 3, stretchFromId: "paper-dart", stretchProgress: 1 }; console.log(stepSequence(0.175, d, s, { designId: "paper-hat", position: 5 }), s.position.toFixed(4), s.direction, s.designId);'`
   Expect: `true 2.5000 -1 paper-dart` (the dart unfolds first, though
   the hat's target position lies ahead of it; reading the target's
   position alone would give `3.2500 1`)
7. Do: [Plan 02a's Step 3](./02a-paper-dart.md#step-3-eased-sequence-stepper-p)
   Agent QA 1 to 5, each with `{ "paper-dart": PAPER_DART }` (imported
   from `./docs/src/designs/paper-dart.js`) passed as stepSequence()'s
   second argument, and `stretchFromId: "paper-dart", stretchProgress: 1`
   added to the state.
   Expect: each gives its own `Expect:`.

### Step 4: The hat in the scene, and switching between designs

- Changes `docs/src/scene/paper.js`: an inner group holds the meshes, and
  `setSheet(sheet)` swaps and disposes the geometry (Decisions 6, 7).
- Changes `docs/src/main.js`: cuts both sheets, places the camera by both
  radii (Decision 4), passes the designs to `stepSequence()`, calls
  `setSheet()` when `designId` changes, and calls `writeStretchScale()`
  whenever `stepSequence()` returns true, so the scale lands on exactly 1
  as the stretch ends.
- Changes `docs/src/ui/fold-buttons.js` and `docs/index.html`: the
  "Paper Hat" button (Decision 8).
- It should stretch the square into the tall sheet, then fold the hat,
  sliding up to end centred (Manual QA 2).
- It should show no flicker, slit or crack in the hat (Manual QA 3).
- It should unfold to the current sheet on "Flat", and switch designs by
  way of the flat sheet, keeping the paper in view (Manual QA 4 to 8).
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
     slides up as the top half folds away, and a little down as the back
     strip folds, ending centred: a red triangle with an off-white brim
     along its bottom.
   - **Why:** catches a reversed fold, a wrong layer, and a missing slide.
3. **Do:** pinch out on the trackpad to magnify the page, and look along
   the hat's edges, brim and centre line; then pinch back in. Not Cmd
   and +: the camera re-fits the window, so browser zoom magnifies
   nothing.
   - **Expect:** no slits or hairline cracks showing the page through the
     paper. Thin red and white stripes flickering along the corner folds'
     creases are known and accepted for now
     ([Plan 02a's Decision 7](./02a-paper-dart.md#decisions)): if
     they show, raise a backlog item in `plans/todo/backlog/`.
   - **Why:** z-fighting, T-junction cracks, missing or reversed bridging
     strips.
4. **Do:** click "Flat".
   - **Expect:** the hat unfolds in about 2 s to a plain red tall sheet,
     which stays tall.
5. **Do:** click "Paper Dart".
   - **Expect:** the tall sheet widens back to the square, then folds the
     dart as in Plan 02a, apart from the slight slide noted below.
6. **Do:** with the dart finished, click "Paper Hat".
   - **Expect:** the dart unfolds fully, the flat square stretches to the
     tall sheet, and the hat folds: about 6.5 s, with no jump between
     phases.
7. **Do:** click "Flat", wait, then click "Paper Dart" and, at once,
   "Paper Hat".
   - **Expect:** the sheet finishes stretching to the square first, then
     stretches back to the tall sheet and folds the hat. Nothing jumps.
     The console still shows no errors or warnings.
8. **Do:** while the paper switches designs, drag the window narrow and
   tall, then wide and short; then repeat step 6 in device mode on a
   phone such as iPhone 12 Pro (390 × 844).
   - **Expect:** the whole paper stays in view at every stage, never cut
     off, distorted by the window's shape or blurred; the three buttons
     are visible.
9. **Do:** in Sources, open `src/main.js` and set a breakpoint on the
   line that calls `renderer.render(scene, camera)`. When it pauses, type
   `renderer.info.memory.geometries` in the console and note it; remove
   the breakpoint and resume. Switch designs three times, clicking
   "Paper Dart", "Paper Hat" and "Paper Dart" in turn, each once the paper
   stops; then set the breakpoint again and read the count.
   - **Expect:** the same count both times.
   - **Why:** a geometry not disposed at the swap leaks GPU memory.
10. **Do:** with the dart finished, as step 9 leaves it, record step 6 in
    the Performance panel, and stop when the hat is finished.
    - **Expect:** steady frames, with no long task at the moment the sheet
      swaps. Note the typical frame time for `/done-plan` to record in the
      `done` Audit entry. Plan 02a recorded no baseline, so this becomes
      it.

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
- **2026-11-10T09:37:49Z** — **reviewed**: no major issues; hat folds
  tested in a throwaway script with Plan 02a's thickness, stacking and
  bridges (Decision 2 records the result); minor fixes: Decision 3's
  centres repeat after a fold that keeps its centre, since the dart's
  reflected stage 5 would jump 31 mm, and Step 2 gains Agent QA 4; Step 2
  Agent QA 2's z range now 0 to 32.5 mm, after Plan 02a's ruling that the
  dart's fold 5 is a valley; Decision 5 unfolds fully before a switch,
  with Step 3 Agent QA 6; Decision 6 moves smoothstep() to
  `fold/easing.js` to avoid an import cycle, and writeStretchScale()
  avoids sheetSize(); Decision 7's bounding sphere; Step 3 Agent QA 7
  reruns Plan 02a's stepper checks; Manual QA 3 uses pinch-zoom and
  accepts coplanar strips, per Plan 02a's rulings; Manual QA 2, 5, 8 and
  10 and Decision 9 reworded; Three.js APIs rechecked against r187.
- **2026-11-10T09:43:53Z** — **reviewed**: round 2; no major issues;
  round 1's fixes confirmed in throwaway scripts (both designs' centres,
  no jump at any fold's end, no new clash or coplanar surface under the
  revised centre rule, Step 1 to 3 Agent QA figures, Plan 02a's stepper
  checks with the new argument); minor fixes: Step 4 calls
  writeStretchScale() whenever the stepper reports a change, so the scale
  ends at 1; Step 4's switching criterion also cites Manual QA 8; Manual
  QA 7 rechecks the console; Manual QA 9 names its three switches, which
  leave the dart finished for Manual QA 10; Decision 7 rewrapped.
- **2026-11-10T09:52:52Z** — **implemented**: Steps 1 to 4; added
  `docs/src/designs/paper-hat.js` and `docs/src/fold/easing.js`; changed
  `engine.js` (stage `centres`), `pose.js` (the slide; smoothstep()
  imported), `stepper.js` (the stretch, `STRETCH_SECONDS`, the new
  argument), `sheet.js` (`writeStretchScale()`), `paper.js` (inner group
  exposed as `stretchScale`, setSheet()), `main.js`, `fold-buttons.js` and
  `index.html`; every Agent QA line passes, with Plan 02a's Step 2 Agent
  QA 3, 5, 6 and 7 and Step 3 Agent QA 1 to 5 rerun as Step 2 Agent QA 4
  and Step 3 Agent QA 7 say; every check failed first for the expected
  reason, except Step 3 Agent QA 5's grep, which prints `0` while the
  function is absent; Manual QA walked against the code, unchanged.
- **2026-11-10T09:53:30Z** — **verified**: agent checks pass: 12 modules
  parse, no line over 80 columns bar the favicon's `data:` URL, `/` and
  all 12 modules served with status 200, vendored checksums match;
  browser not run.
- **2026-11-10T10:04:31Z** — **quality-checked**: Fixed: `engine.js`
  helpers out of A-Z order (stageCentres() before stackLayers()), moved
  unchanged to the end of the file (report tier, first run); Deferred:
  createFold() in `paper-hat.js` duplicates the dart's, since
  `paper-dart.js` is outside this plan (share one, with the dart's
  options, in a later plan); the canvas's `aria-label` still says "A
  square sheet" while the hat's tall sheet shows (a wording ruling);
  `shownDesignId` in `main.js` repeats the design held in `paper.js`
  (harmless); Verified fine: every Agent QA line, with Plan 02a's Step 2
  Agent QA 3, 5 to 7 and Step 3 Agent QA 1 to 5 rerun; mutants caught (a
  linear slide, centres not carried after a both-sides or short fold, the
  slide's sign); mutants left to Manual QA 2 (hat fold types reversed, a
  stepper return that ignores the stretch); Three.js sweep: geometry
  disposed once at each swap, materials kept, no new resource, per-frame
  path allocates nothing, motion time-scaled, resize unchanged with the
  0.1162 m radius, Group, `scale`, `dispose()` and
  `info.memory.geometries` checked against r187; the swap frame shows the
  square through the scale, centred at (0, 0), with no new shader; Manual
  QA walked, unchanged; agent checks pass; browser not run.
- **2026-11-10T10:19:40Z** — **done**: the paper hat, the slide that keeps
  a design centred, and switching designs by way of a stretching flat
  sheet; Manual QA passed (Lead Developer, 2026-11-10) on desktop, with
  the phone viewport, the `renderer.info` geometry count and the
  frame-time recording (Manual QA 8 phone part, 9 and 10) skipped by the
  Lead Developer as out of scope at this stage; research file stays in
  `plans/todo/` until Plan 02c.
