---
title: Fold the paper dart
description: Cuts the sheet from a list of folds and folds the classic paper dart in seven eased 180° steps, with layers held apart by the paper's thickness.
type: plan
---

## Context

- Delivers the first design: the square sheet folds into Fold'N Fly's
  [Basic Dart](https://www.foldnfly.com/1.html) in seven simple folds made
  one after another, from two buttons, "Flat" and "Paper Dart". Plan 01's
  crease lines and its "Mountain Horizontal" and "Valley Diagonal" buttons
  go, and no fold lines are drawn.
- Builds on [Plan 01](../done/01-fold-sheet-in-half.md), whose one-crease
  fold model cannot make a sequence of folds. Replaces its crease pattern,
  kinematics and animation modules.
- Implements the research in
  [02-simple-folds-research.md](02-simple-folds-research.md), which serves
  Plans 02a to 02c and stays in `plans/todo/` until the last of them is
  done. Its [Scope](02-simple-folds-research.md#scope) holds the rulings
  this plan follows;
  [The paper dart](02-simple-folds-research.md#the-paper-dart),
  [Cutting the sheet from a fold list](02-simple-folds-research.md#cutting-the-sheet-from-a-fold-list),
  [Layer thickness](02-simple-folds-research.md#layer-thickness) and
  [Animation](02-simple-folds-research.md#animation) hold the evidence.
- Feeds [Plan 02b](02b-paper-hat.md), the paper hat and switching between
  designs, then [Plan 02c](02c-printed-fold-lines.md), printed fold lines.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10, the release vendored per [CLAUDE.md](../../CLAUDE.md#threejs).

## Definitions

- **Valley fold**: a fold that brings the moving part of the paper towards
  the viewer, over the front, so the crease sinks like a valley.
- **Mountain fold**: the opposite; the moving part goes away from the
  viewer, behind, so the crease rises like a ridge.
- **Simple fold**: one valley or mountain fold along one straight line,
  through every layer the line crosses or through some of them only, which
  leaves the paper flat again. The dart needs only simple folds.
- **Sheet coordinates**: a point's place on the flat, unfolded sheet, in
  metres, centred on the sheet, `x` to the right and `y` up, seen from the
  front (red) side.
- **Folded plane**: the plane the paper lies in once a fold is complete,
  with the same axes. Each fold's line is given in the folded plane as the
  paper lies after the folds before it.
- **Face**: a piece of the sheet that never bends: a convex polygon in
  sheet coordinates. Folding cuts the sheet into faces.
- **Isometry**: a move in the plane that keeps every distance: a rotation,
  a translation, a reflection, or several in turn. Each face has one per
  stage, its **placement**, taking it from sheet coordinates to the folded
  plane. A placement that includes an odd number of reflections turns the
  face over, back side up.
- **Stage**: the flat paper after `k` complete folds; stage 0 is the flat
  sheet and stage `n` the finished design.
- **Layer rank**: an order in which faces stack, from back to front. Ranks
  only order the faces; two faces with neighbouring ranks need not touch.
- **Layer**: a face's height in the stack, counted from 1 at the back:
  one more than the highest layer of any face it overlaps beneath it.
- **T-junction**: a corner of one face that lies part-way along an edge of
  another face. It can show as a hairline crack.
- **Bridging strip**: a narrow quadrilateral joining the two copies of an
  edge where two faces meet along a crease. Folded, the two faces sit at
  different heights; the strip fills the gap so the fold looks rounded.
- **Sequence position**: a real number from 0 (flat) to the design's fold
  count. Its whole part counts the folds done; its fraction is the
  progress through the next.
- **Easing**: a curve that starts and ends a motion slowly, fastest in the
  middle.

## Decisions

1. **Sheet size**: every sheet has the 15 cm square's area,
   `SHEET_AREA_SQUARE_METERS = 0.0225`, so a design states only its shape,
   `aspect` (width divided by height, as `PerspectiveCamera.aspect` is).
   `sheetSize(aspect)` returns `{ heightMeters, widthMeters }`. The dart's
   aspect is 1: 0.15 × 0.15 m, as in Plan 01. Both live in
   `docs/src/designs/sheet.js`; `PAPER_SIZE_METERS` goes.
2. **Design data**: a frozen object per design, built once by a pure
   module. Each fold's line runs `from` → `to` in the folded plane, in
   metres; the side to the left of that direction, seen from the front,
   moves. `targetRadians` is the fold's finished angle; `turns` says
   whether only the moving side turns (`"moving-side"`) or both sides turn
   by half (`"both-sides"`). Indices in data count from 0, so the dart's
   "fold 5" is index 4. The dart, with folds 2 to 4 and 7 left out:

   ```json
   {
     "aspect": 1,
     "folds": [
       {
         "from": [-0.075, 0],
         "layers": "all",
         "targetRadians": 3.141593,
         "to": [0, 0.075],
         "turns": "moving-side",
         "type": "valley"
       },
       {
         "from": [0, -0.075],
         "layers": "all",
         "targetRadians": 3.141593,
         "to": [0, 0.075],
         "turns": "both-sides",
         "type": "mountain"
       },
       {
         "from": [0, 0.075],
         "layers": { "heldBy": 4 },
         "targetRadians": 1.570796,
         "to": [0.029837, -0.075],
         "turns": "moving-side",
         "type": "valley"
       }
     ],
     "id": "paper-dart"
   }
   ```

   The seven lines, as computed on 2026-11-10 from the research's angles
   (every line leaves the apex `(0, 0.075)`):

   | Fold | From → to (mm)            | Type     | Layers           |
   | ---- | ------------------------- | -------- | ---------------- |
   | 1    | (-75, 0) → (0, 75)        | valley   | all              |
   | 2    | (0, 75) → (75, 0)         | valley   | all              |
   | 3    | (-62.132, -75) → (0, 75)  | valley   | all              |
   | 4    | (0, 75) → (62.132, -75)   | valley   | all              |
   | 5    | (0, -75) → (0, 75)        | mountain | all, both sides  |
   | 6    | (0, 75) → (29.837, -75)   | valley   | `{ heldBy: 4 }`  |
   | 7    | (0, 75) → (29.837, -75)   | mountain | `{ movedBy: 4 }` |

   Folds 1 to 5 finish at π; folds 6 and 7, the wings, at π/2, per
   [Layer thickness](02-simple-folds-research.md#layer-thickness).
3. **Layer selection**: `"all"`, `{ "heldBy": i }` (faces that fold `i`
   did not move) or `{ "movedBy": i }` (faces it moved). The wings are
   one line folded opposite ways by the two halves of fold 5. The
   research files "folds of the front or back layer only" under Plan 02b,
   but the dart's wings already need them; checked on 2026-11-10 in a
   throwaway script, this selector gives the research's figures for the
   dart and, in Plan 02b, the hat.
4. **Cutting the sheet**: `cutSheet(design)` in `docs/src/fold/engine.js`
   runs every fold once, at load, as
   [Cutting the sheet from a fold list](02-simple-folds-research.md#cutting-the-sheet-from-a-fold-list)
   sets out, and returns the sheet: its size, its folds, its final faces
   and its bridging strips. Nothing is cut while the paper moves. Each
   face holds its polygon (sheet coordinates, anticlockwise from the
   front), the folds that moved it, and per stage its placement
   `[a, b, c, d, tx, ty]` (`x' = a·x + c·y + tx`, `y' = b·x + d·y + ty`)
   and its layer. One real face of the dart, the tip of fold 2's flap:

   ```json
   {
     "layers": [1, 1, 2, 2, 2, 6, 6, 10],
     "movedBy": [1],
     "placements": [
       [1, 0, 0, 1, 0, 0],
       [1, 0, 0, 1, 0, 0],
       [0, -1, -1, 0, 0.075, 0.075],
       [0, -1, -1, 0, 0.075, 0.075],
       [0, -1, -1, 0, 0.075, 0.075],
       [0, -1, -1, 0, 0.075, 0.075],
       [0, -1, -1, 0, 0.075, 0.075],
       [0, -1, -1, 0, 0.075, 0.075]
     ],
     "polygon": [
       [0.075, 0.060082],
       [0.075, 0.075],
       [0, 0.075]
     ]
   }
   ```

   The sheet holds `bridges`, `designId`, `faces`, `folds`,
   `heightMeters` and `widthMeters`: 16 faces and 15 strips for the dart.

5. **Layers come from what lies beneath**: per stage, each face sits one
   layer above the highest face it overlaps, testing overlap by clipping
   one convex polygon with the other. Stacking by rank alone left the
   dart's flaps floating across 26 levels instead of 16
   ([research](02-simple-folds-research.md#cutting-the-sheet-from-a-fold-list)).
6. **Designs the engine refuses**: `cutSheet()` throws, naming the design,
   when a fold moves nothing (`Fold 2 of design "x" moves nothing`), when a
   fold that stops short of π is followed by a fold that moves its faces
   (`Fold 0 of design "x" stops short, but fold 1 moves its faces`), and
   when the final faces leave a T-junction
   (`Design "x" leaves a T-junction`). The pose maths below holds only
   without the second; a T-junction can crack open to the page behind the
   transparent canvas. Neither design has one (prototype, 2026-11-10).
7. **Bridging strips**: one per edge that two faces share in sheet
   coordinates, as a quad of the four vertex indices `[a0, a1, b0, b1]`,
   where `a0` and `b0` are the same sheet point on the two faces. Strips
   reuse the faces' own vertices, so they follow the paper with no extra
   positions. The dart has 15.
8. **Paper thickness**: `PAPER_THICKNESS_METERS = 0.0001` (0.1 mm), per
   [Scope](02-simple-folds-research.md#scope), tuned by eye at Manual QA.
   A face at layer `L` sits `(L − 1) × t` above the back of the stack.
9. **Pose** (derived in
   [Layer thickness](02-simple-folds-research.md#layer-thickness), not yet
   seen in a browser): `writePaperPositions(positions, sequencePosition,
   sheet)` in `docs/src/fold/pose.js` writes every vertex, face by face.
   - During fold `k`, with eased progress `e` and angle `θ = e × target`,
     take a face's layers `L₀` at stage `k` and `L₁` at stage `k + 1`. A
     face the fold moves turns by `θ` about the fold's line from its
     stage-`k` place (towards +Z for a valley, −Z for a mountain), then
     shifts along its turned normal by `t × lerp(L₀ − 1, −(L₁ − 1), e)`.
     A face it holds rises to `t × lerp(L₀ − 1, L₁ − 1, e)`.
   - A fold with `turns: "both-sides"` turns the whole paper back by `θ/2`
     about its line, from then on, so the two sides share the turn and
     the model stays centred: the dart's fold in half.
   - A fold that stops short leaves its faces where it put them, at their
     stage-`k` shift.
   - At a whole position whose folds all reach π, every face lies flat at
     its stage placement and layer height.
10. **Easing**: `smoothstep`, `e = p² × (3 − 2p)`, the curve of r187's
    [`MathUtils.smoothstep()`](https://github.com/mrdoob/three.js/blob/r187/src/math/MathUtils.js),
    written in `pose.js` because Node, which runs Agent QA, cannot import
    `three`.
11. **Sequence state**: the stepper's state and target, in place of
    Plan 01's crease and angle. `direction` is 1 while folding, −1 while
    unfolding and 0 at rest; a target's `designId` of `null` means flat,
    keeping the sheet showing.

    ```json
    { "designId": "paper-dart", "direction": 1, "position": 2.4 }
    ```

    ```json
    { "designId": "paper-dart", "position": 7 }
    ```

    `stepSequence(deltaSeconds, state, target)` in
    `docs/src/fold/stepper.js` moves the position linearly in time; the
    pose eases it. It reads the target only at a whole position, so a
    press mid-fold takes effect when that fold finishes, per
    [Animation](02-simple-folds-research.md#animation). Time left over at
    a whole position carries into the next fold in the same step, so the
    total time does not depend on the frame rate. A negative delta counts
    as zero, as Plan 01's Timer note requires. It returns true when
    `position` or `designId` changed, and allocates nothing. Plan 02b
    adds the switch between designs.
12. **Timings**: `FOLD_SECONDS = 0.7` per fold; `UNFOLD_SECONDS = 0.35`,
    twice as fast, per [Scope](02-simple-folds-research.md#scope). The
    dart folds in 4.9 s and unfolds in 2.45 s.
13. **Camera**: placed once at load and never moved, by the largest
    distance from the origin that any vertex reaches over the design's
    whole sequence, `maxPaperRadius(sheet)` in `pose.js`, which samples
    `SAMPLES_PER_FOLD = 32` poses per fold. Plan 02b takes the largest
    over both designs. `main.js` keeps Plan 01's elevation, field of view
    and `FRAME_MARGIN`. For the dart the radius is 0.1061 to 0.1077 m: a
    rigid turn about a line in the sheet's plane keeps each point between
    its start and end distances, so only thickness adds to the flat
    half-diagonal (derived; 256 samples per fold at zero thickness gave
    106.1 mm). The view therefore matches Plan 01's.
14. **Geometry**: `docs/src/scene/paper.js` builds one indexed
    BufferGeometry from the sheet: each face its own vertices (50 for the
    dart), a fan of triangles per face, and two triangles per bridging
    strip (144 indices for the dart). The position attribute uses
    `DynamicDrawUsage` and is rewritten in place; a constant normal of
    (0, 0, 1) stays, for Lambert's vertex shader. Its `boundingSphere` is
    set once to a
    [Sphere](https://github.com/mrdoob/three.js/blob/r187/src/math/Sphere.js)
    at the origin with the camera's radius. The front and back meshes and
    materials stay as Plan 01 has them, less their polygon offset, which
    only pushed the paper behind the crease lines that now go.
15. **Buttons**: "Flat" (`data-fold="flat"`) and "Paper Dart"
    (`data-fold="paper-dart"`), targeting position 0 and
    `PAPER_DART.folds.length`. The canvas's text alternative is unchanged:
    the page still loads with the red square.
16. **Performance**: each frame while the paper moves rewrites 50 vertices
    and uploads 600 bytes; nothing is optimised. Plan 01's frame-time
    baseline was never recorded, so Manual QA 10 records one.

## Steps

### Step 1: Fold engine and the dart's fold list [P]

- Adds `docs/src/designs/sheet.js` (Decision 1),
  `docs/src/designs/paper-dart.js` with `PAPER_DART` (Decisions 2, 3) and
  `docs/src/fold/engine.js` with `cutSheet()` (Decisions 4 to 7).
- It should cut the dart into 16 faces and 18 triangles, stacked 4 layers
  deep after four folds and 16 at the end, with 15 bridging strips
  (Agent QA 1).
- It should keep the sheet's area and size, and record which faces each
  fold moves (Agent QA 2, 3).
- It should refuse a design that leaves a T-junction, folds after a fold
  that stops short, or folds nothing, naming the design (Agent QA 4, 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_DART); console.log(s.faces.length, s.faces.reduce((n, f) => n + f.polygon.length - 2, 0), Math.max(...s.faces.map((f) => f.layers[4])), Math.max(...s.faces.map((f) => f.layers[7])), s.bridges.length);'`
   Expect: `16 18 4 16 15`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_DART); const a = s.faces.reduce((n, { polygon: p }) => n + p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0) / 2, 0); console.log((a * 1e6).toFixed(1), s.widthMeters, s.heightMeters);'`
   Expect: `22500.0 0.15 0.15` (positive: every polygon anticlockwise)
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const s = cutSheet(PAPER_DART); console.log(PAPER_DART.folds.map((_, j) => s.faces.filter((f) => f.movedBy.includes(j)).length).join(","));'`
   Expect: `4,4,4,4,8,4,4`
4. Do: `node --input-type=module -e 'import { cutSheet } from "./docs/src/fold/engine.js"; const f = (from, to, type, layers) => ({ from, layers, targetRadians: Math.PI, to, turns: "moving-side", type }); try { cutSheet({ aspect: 1, folds: [f([-0.075, 0], [0.075, 0], "mountain", "all"), f([0, -0.075], [0, 0], "valley", { heldBy: 0 })], id: "t-test" }); } catch (e) { console.log(e.message); }'`
   Expect: `Design "t-test" leaves a T-junction`
5. Do: `node --input-type=module -e 'import { cutSheet } from "./docs/src/fold/engine.js"; const f = (from, to, targetRadians) => ({ from, layers: "all", targetRadians, to, turns: "moving-side", type: "valley" }); for (const folds of [[f([0, -0.075], [0, 0.075], Math.PI / 2), f([0.075, 0], [-0.075, 0], Math.PI)], [f([0.075, 0.075], [0.075, -0.075], Math.PI)]]) { try { cutSheet({ aspect: 1, folds, id: "x" }); } catch (e) { console.log(e.message); } }'`
   Expect: `Fold 0 of design "x" stops short, but fold 1 moves its faces`, then
   `Fold 0 of design "x" moves nothing`

### Step 2: Pose with thickness, and the camera's radius

- Adds `docs/src/fold/pose.js`: `writePaperPositions()`,
  `maxPaperRadius()` and `PAPER_THICKNESS_METERS` (Decisions 8 to 10, 13).
- Depends on Step 1: it reads the sheet that `cutSheet()` returns.
- It should lay the paper flat at position 0, and at position 4 match the
  four-fold outline with layers 0.1 mm apart (Agent QA 1).
- It should end in the dart seen from above: wings spread to the sides,
  keel behind, nose up (Agent QA 2; Manual QA 2).
- It should keep every face rigid at every position (Agent QA 3).
- It should report the largest radius the dart reaches (Agent QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_DART); const p = new Float32Array(150); for (const at of [0, 4]) { writePaperPositions(p, at, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); const mm = (n) => (Math.round(n * 1e4) / 10 + 0).toFixed(1); console.log(mm(Math.min(...c(0))), mm(Math.max(...c(0))), mm(Math.min(...c(1))), mm(Math.max(...c(1))), "|", [...new Set(c(2).map(mm))].sort().join(" ")); }'`
   Expect: `-75.0 75.0 -75.0 75.0 | 0.0`, then
   `-62.1 62.1 -84.1 75.0 | 0.0 0.1 0.2 0.3`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_DART); const p = new Float32Array(150); writePaperPositions(p, 7, s); const c = (k) => [...p].filter((_, i) => i % 3 === k); console.log([0, 1, 2].flatMap((k) => [Math.min(...c(k)), Math.max(...c(k))]).map((n) => (n * 1000).toFixed(1)).join(" "));'`
   Expect: each value within 2 mm of `-31.7 31.7 -88.2 75.0 -32.5 0.0`
   (computed at zero thickness on 2026-11-10; thickness moves each by at
   most 1.5 mm)
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { writePaperPositions } from "./docs/src/fold/pose.js"; const s = cutSheet(PAPER_DART); const p = new Float32Array(150); let ok = true; for (let at = 0; at <= 7; at += 0.05) { writePaperPositions(p, at, s); let v = 0; for (const { polygon } of s.faces) { polygon.forEach(([x, y], i) => { const [u, w] = polygon[(i + 1) % polygon.length]; const j = v + ((i + 1) % polygon.length); const d = Math.hypot(p[3 * (v + i)] - p[3 * j], p[3 * (v + i) + 1] - p[3 * j + 1], p[3 * (v + i) + 2] - p[3 * j + 2]); if (Math.abs(d - Math.hypot(u - x, w - y)) > 1e-6) ok = false; }); v += polygon.length; } } console.log(ok);'`
   Expect: `true`
4. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log(maxPaperRadius(cutSheet(PAPER_DART)).toFixed(4));'`
   Expect: a value from `0.1061` to `0.1077`
5. Do: `sed -n '/export const writePaperPositions/,/^};/p' docs/src/fold/pose.js | grep -v "export const writePaperPositions" | grep -cE "new [A-Z]|\[\]|\{\}|=>|\.\.\."`
   Expect: `0` (no allocation, closure or spread inside it; scratch is
   created once at module level)

### Step 3: Eased sequence stepper [P]

- Adds `docs/src/fold/stepper.js`: `stepSequence()`, `FOLD_SECONDS` and
  `UNFOLD_SECONDS` (Decisions 11, 12).
- It should fold at 0.7 s and unfold at 0.35 s per fold, carrying time
  left over at a whole position into the next fold (Agent QA 1 to 3).
- It should take a new target only when the fold in progress finishes
  (Agent QA 4; Manual QA 5).
- It should stay put given a zero or negative delta, and allocate nothing
  (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const s = { designId: "paper-dart", direction: 0, position: 0 }; console.log(stepSequence(0.35, s, { designId: "paper-dart", position: 7 }), s.direction, s.position.toFixed(4));'`
   Expect: `true 1 0.5000`
2. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const s = { designId: "paper-dart", direction: 0, position: 0 }; const t = { designId: "paper-dart", position: 7 }; stepSequence(4.8, s, t); const log = [s.position.toFixed(4), s.direction]; stepSequence(0.2, s, t); console.log(...log, s.position.toFixed(4), s.direction);'`
   Expect: `6.8571 1 7.0000 0`
3. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const s = { designId: "paper-dart", direction: 0, position: 7 }; const t = { designId: null, position: 0 }; stepSequence(2.4, s, t); const log = [s.position.toFixed(4), s.direction]; stepSequence(0.1, s, t); console.log(...log, s.position.toFixed(4), s.direction, s.designId);'`
   Expect: `0.1429 -1 0.0000 0 paper-dart`
4. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const s = { designId: "paper-dart", direction: 1, position: 2.5 }; const t = { designId: null, position: 0 }; stepSequence(0.14, s, t); const log = [s.position.toFixed(4), s.direction]; stepSequence(0.385, s, t); console.log(...log, s.position.toFixed(4), s.direction);'`
   Expect: `2.7000 1 2.5000 -1`
5. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const s = { designId: "paper-dart", direction: 1, position: 2.5 }; const t = { designId: null, position: 0 }; console.log(stepSequence(-0.02, s, t), stepSequence(0, s, t), s.position);' && grep -c "new [A-Z]" docs/src/fold/stepper.js`
   Expect: `false false 2.5`, then `0`

### Step 4: The dart in the scene, and its buttons

- Rewrites `docs/src/scene/paper.js`: `createPaper(sheet)` returns
  `{ group, setSequencePosition(sequencePosition) }`; the crease
  LineSegments and the polygon offset go (Decision 14).
- Rewrites `docs/src/main.js`: builds the dart's sheet at load, places
  the camera by `maxPaperRadius()` (Decision 13), holds the sequence state
  and target, and each frame calls `stepSequence()` with the Timer's
  delta and, only when it reports a change, `setSequencePosition()`.
- Rewrites `docs/src/ui/fold-buttons.js` and changes `docs/index.html`:
  two buttons, "Flat" and "Paper Dart" (Decision 15).
- Deletes `docs/src/paper/crease-pattern.js`,
  `docs/src/fold/kinematics.js` and `docs/src/fold/animation.js`, and the
  empty `docs/src/paper/` folder.
- It should load a flat red square with no lines on it, and two buttons
  (Manual QA 1; Agent QA 1, 2).
- It should fold the dart in seven eased folds, one after another, ending
  in a true 180° fold in half and wings at 90° (Manual QA 2).
- It should show no flicker, slit or crack at creases or between layers,
  with each crease looking rounded (Manual QA 3).
- It should unfold to the flat square at twice the speed, and keep the
  whole paper in view at every stage and window size (Manual QA 4, 7, 9).
- It should keep the same speed whatever the frame rate, without jumping
  after the tab is hidden (Manual QA 8, 10) _(inferred from CLAUDE.md)_.

**Agent QA**

1. Do: `grep -c "<button type=\"button\" data-fold=" docs/index.html`
   Expect: `2`
2. Do: `grep -rn "createCreasePattern\|writeFoldedPositions\|stepFold\|MAX_FOLD_RADIANS\|PAPER_SIZE_METERS\|LineSegments\|mountain-horizontal\|valley-diagonal" docs/src docs/index.html; ls docs/src/paper`
   Expect: no matches, then `ls` reports that `docs/src/paper` does not
   exist
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/` and every file under `docs/src/`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in the
browser "Paper Dart" folds the square into the dart in seven eased folds
and "Flat" unfolds it, with a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R). The system colour scheme is light unless a step
says otherwise.

1. **Do:** look at the page after loading.
   - **Expect:** a plain red square, centred, seen from slightly above as
     a trapezoid, with no lines on it; "Flat" and "Paper Dart" buttons
     centred along the bottom. The console shows no errors or warnings.
2. **Do:** click "Paper Dart" and watch until it stops, about 5 s.
   - **Expect:** seven folds, one at a time, each starting slowly,
     speeding up and settling: the top-left then top-right corners fold
     towards you to the centre line, showing the off-white back; then the
     two slanted edges likewise; then the sheet folds in half away from
     you, both halves turning together; then one wing folds towards you
     and the other away. It ends as a dart seen from above: nose pointing
     up the screen, wings spread left and right, keel pointing away.
   - **Why:** catches a reversed valley or mountain, a wrong layer
     selection, and the stop-short wings.
3. **Do:** zoom the page to 200% (Cmd and +) and look along the dart's
   creases and the nose, where 16 layers meet; then reset zoom (Cmd and 0).
   - **Expect:** no flickering stripes, no slits or hairline cracks
     showing the page through the paper; each fold edge looks slightly
     rounded and closed. Note anything that looks too thick or too thin
     for `PAPER_THICKNESS_METERS` to be tuned.
   - **Why:** z-fighting, T-junction cracks, missing or reversed bridging
     strips.
4. **Do:** click "Flat".
   - **Expect:** the folds undo in reverse order, each eased, twice as
     fast, about 2.5 s in all, back to the plain red square of step 1.
5. **Do:** click "Paper Dart", then "Flat" about one second later.
   - **Expect:** the fold in progress (the second) finishes, then the
     paper unfolds; nothing jumps or reverses mid-fold. Repeat, pressing
     "Paper Dart" again while it unfolds: the unfolding fold finishes,
     then folding resumes.
6. **Do:** with the dart finished, click "Paper Dart" again.
   - **Expect:** nothing moves.
7. **Do:** while the dart folds, drag the window narrow and tall, then
   wide and short.
   - **Expect:** the whole paper stays in view at every stage, never cut
     off, stretched or blurred.
8. **Do:** with the paper flat, click "Paper Dart" and, within a second,
   switch to another tab (Ctrl+Tab); wait five seconds, then come back.
   - **Expect:** the folding continues from where it was, without a jump.
9. **Do:** in device mode, choose a phone such as iPhone 12 Pro
   (390 × 844), reload, and tap "Paper Dart" then "Flat".
   - **Expect:** the paper and both buttons are visible, and both work;
     the console stays clean.
10. **Do:** in dev tools, open the Performance panel, record while
    clicking "Paper Dart" and then "Flat", and stop after both finish.
    On a high-refresh screen, also time the fold against a 60 Hz screen if
    one is available.
    - **Expect:** steady frames with no long tasks; the dart takes about
      5 s on either screen. Note the typical frame time for `/done-plan`
      to record in the `done` Audit entry, as the baseline for later
      plans.
11. **Do:** switch the system to dark mode.
    - **Expect:** the page background turns dark; the paper's colours do
      not change. The console stays clean.

**Looks wrong, but isn't:**

- The wings stop at right angles to the body rather than flat: by design.
- The dart points up the screen, not into it.
- No fold lines show on the paper: they arrive with Plan 02c.
- The buttons do not show which state is active.

## Audit

- **2026-11-10T01:02:55Z** — **drafted**: fold engine cutting the sheet
  from a fold list, pose with 0.1 mm thickness and bridging strips, eased
  stepper, and the seven-fold dart from "Flat" and "Paper Dart"; agent
  proposed the layer selector, data shapes, refusal messages, stepper
  state, camera sampling, `SAMPLES_PER_FOLD` and the smoothstep easing.
