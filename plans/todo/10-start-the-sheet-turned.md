---
title: Start the sheet turned, and fold a yacht and an ice cream
description: Gives a design a starting pose, a roll and a side, which the flat sheet takes up while it stretches, and proves it with a yacht and an ice-cream cone behind new buttons.
type: plan
---

## Context

- Delivers the starting pose: a design may start with its sheet rolled,
  such as a square on its corner, and with either side towards the
  viewer. The flat sheet turns to that pose while it stretches from the
  last design's shape. Two designs prove it: the yacht, which starts
  white side up, and the ice-cream cone, which starts as a white
  diamond and turns over twice.
- Implements
  [Ruling 3](./07-design-research.md#ruling-3-a-sheets-starting-pose-arrives-with-the-stretch)
  of [07-design-research.md](./07-design-research.md), whose shortlist
  holds the yacht as design 2 and the cone as design 4. Of the 17
  designs whose start is known, 13 start white side up and 8 as a
  diamond.
- Depends on [Plan 09](./09-turn-the-paper-over.md): its view frame,
  its `steps`, its turn-over, its `DESIGNS` list and its `turnGroup`.
  It extends cutSheet() in `docs/src/fold/engine.js`, stepSequence() in
  `docs/src/fold/stepper.js`, `docs/src/designs/sheet.js` and
  createPaper() in `docs/src/scene/paper.js`. The remaining designs
  follow in later plans.
- The designs follow Fumiaki Shingu's diagrams at Origami Club, read on
  2026-11-10: the
  [yacht](https://en.origami-club.com/easy/vehicle/yacht/index.html)
  and the
  [ice cream](https://en.origami-club.com/easy/food/soft-cream2/index.html),
  which the site calls "Soft cream2".
- Figures marked "prototype" were run on 2026-11-10 in a throwaway Node
  script, kept outside the repo, which fed the current engine each
  design's folds turned by hand into the front's terms, and measured
  the stage centres as [Decision 3](#decisions) sets out. The real code
  is written afresh, to [CLAUDE.md](../../CLAUDE.md)'s standards.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10:
  [Euler.js](https://github.com/mrdoob/three.js/blob/r187/src/math/Euler.js)
  and
  [Matrix4.js](https://github.com/mrdoob/three.js/blob/r187/src/math/Matrix4.js),
  whose `makeRotationFromEuler()` builds order `ZYX` as a turn about
  `X`, then `Y`, then `Z`.

## Definitions

The terms of [Plan 09](./09-turn-the-paper-over.md#definitions) apply.
Two more:

- **Roll**: a turn of the flat sheet in its own plane, about the line
  of sight, anticlockwise as the viewer sees it, in radians. A square
  rolled by π/4 is a diamond.
- **Starting pose**: how a design's flat sheet faces the viewer before
  its first step: its roll, and which side is towards the viewer.

## Decisions

1. **A design may carry `start`**: `rollRadians`, and `side`, `"front"`
   (coloured) or `"back"` (white), the side towards the viewer. Left
   out, it is a roll of 0 and the front, exported from
   `docs/src/designs/sheet.js` as the frozen `DEFAULT_START`, beside
   `startOf(design)`, which returns a design's start or the default.
   The yacht, in metres:

   ```json
   {
     "aspect": 1,
     "id": "yacht",
     "start": { "rollRadians": 0, "side": "back" },
     "steps": [
       {
         "from": [-0.075, -0.075],
         "kind": "fold",
         "layers": "all",
         "targetRadians": 3.141592653589793,
         "to": [0.075, 0.075],
         "turns": "moving-side",
         "type": "valley"
       },
       {
         "from": [0.075, 0.075],
         "kind": "fold",
         "layers": { "movedBy": 0 },
         "targetRadians": 3.141592653589793,
         "to": [0.012868, -0.075],
         "turns": "moving-side",
         "type": "valley"
       },
       {
         "from": [0.075, -0.0585],
         "kind": "fold",
         "layers": "all",
         "targetRadians": 3.141592653589793,
         "to": [-0.031066, -0.031066],
         "turns": "moving-side",
         "type": "valley"
       }
     ]
   }
   ```

2. **The view frame starts from the starting pose**. A point of the
   folded plane is mirrored left to right if the back is towards the
   viewer, then rolled, to give what the viewer sees; each turn-over
   mirrors that again, as in
   [Plan 09](./09-turn-the-paper-over.md#decisions). cutSheet() takes
   each fold's ends back through the same steps in reverse, and swaps
   the ends and the type whenever the viewer sees the back. So a
   diamond's folds are written with its corners at the top, bottom,
   left and right, as its diagram draws them. After a turn-over a
   rolled sheet shows the opposite roll, which a square at π/4 hides.
3. **Stage centres are measured as the viewer sees the paper**: each
   stage's bounding box is taken in the starting pose's view frame,
   and its centre is turned back into the folded plane. With no roll
   this is the centre the engine finds now. With one, the box that
   matters is the one on screen: the cone's folded plane box never
   changes, though the cone itself ends 10.4 mm off centre.
4. **The starting pose is a group of its own**, between Plan 09's turn
   and the stretch: `group` (the spin) → `turnGroup` → `startGroup` →
   `stretchGroup` → the meshes. Its rotation has order `ZYX`, with `z`
   the roll and `y` the side: 0 for the front, −π for the back, the way
   a turn-over turns. Sitting outside the stretch's scale, it turns a
   part-stretched sheet without shearing it. createPaper() returns it
   as `startRotation`.
5. **The pose arrives with the stretch**:
   `writeStartPose(designs, rotation, state)` in
   `docs/src/designs/sheet.js`, beside writeStretchScale(), eases `y`
   and `z` from the old design's start to the new one's by the same
   eased `stretchProgress`, and writes exactly the new start at 1. The
   two angles ease together, so a sheet that must both turn over and
   roll does both in one motion. `main.js` calls it wherever it calls
   writeStretchScale().
6. **The stretch phase runs when the shape or the start differs**: on a
   switch, `stretchProgress` starts at 0 unless the two designs share
   their `aspect`, their roll and their side. It still takes
   `STRETCH_SECONDS`, 0.4 s, open to retuning at Manual QA 10: half a
   turn in that time is brisk.
7. **"Flat" keeps the pose showing**, as it keeps the shape: it changes
   no design, so nothing here need act.
8. **The yacht**, from the square, white side up, not rolled
   (Decision 1's example).
   - The top left corner folds down to the bottom right, along the
     diagonal.
   - The top layer's upright edge folds over to lie along the sloping
     edge: a line from the top corner that halves the angle there.
   - The bottom folds up, along a line from where that edge's corner
     landed to a point on the right edge. `HULL_RISE_FRACTION = 0.11`
     of the side, 16.5 mm, above the bottom right corner, read off the
     diagram, which gives no landmark; open to retuning at Manual QA
     11.
   - Prototype: 3 folds in 3 steps, 6 faces, and 5 crease lines, which
     from the front are 2 valley and 3 mountain. The finished yacht is
     131.2 mm wide and 133.5 mm tall: white sails of about 4,240 mm²
     above a coloured hull of about 4,170 mm². Its waterline slopes by
     14.5°. It reaches 106.95 mm from the origin.
   - Its file is `docs/src/designs/yacht.js`, exporting `YACHT`, with
     the id `yacht`.
9. **The ice-cream cone**, from the square as a diamond, white side
   up: `start` is `{ "rollRadians": 0.7853981633974483, "side": "back" }`.
   Heights are from the centre, on a diamond 212.1 mm tall.
   - Each lower edge folds in to the centre line, right then left: a
     line from the bottom corner that halves the angle there, meeting
     the upper edge 62.1 mm out and 43.9 mm up.
   - Turn over.
   - The top corner folds down to where the two folded corners meet,
     along the line 75.0 mm up.
   - The folded corner's point folds back up, moving only the layer
     that the fold before moved, along a line `PLEAT_FRACTION = 1 / 3`
     of the way down it, 64.6 mm up, so that it stands 10.4 mm above
     the top edge. The diagram gives no landmark; open to retuning at
     Manual QA 11.
   - Turn over.
   - Prototype: 4 folds in 6 steps, 5 faces, and 4 crease lines, which
     from the front are 1 valley and 3 mountain. The finished cone is
     124.3 mm wide and 191.4 mm tall: about 3,000 mm² of white ice
     cream above a coloured cone of 9,320 mm². Its last stage centre
     is (7.32, −7.32) mm in the folded plane. It reaches 108.32 mm from
     the origin, so the camera stays where the hat's 116.21 mm puts it.
   - Its file is `docs/src/designs/ice-cream.js`, exporting
     `ICE_CREAM`, with the id `ice-cream`.
10. **The buttons** read "Yacht" and "Ice Cream", with
    `data-fold="yacht"` and `data-fold="ice-cream"`, after
    "Watermelon", in that order, as `DESIGNS` lists them. Each design's
    `@fileoverview` credits its diagram.
11. **Performance**: two angles are written per frame of a stretch, and
    nothing is added to a fold's per-frame path, so there is nothing
    new to measure beyond the optional Manual QA 13.

## Steps

### Step 1: The starting pose in the engine

- Changes `docs/src/designs/sheet.js`: `DEFAULT_START` and startOf()
  (Decision 1).
- Changes `docs/src/fold/engine.js`: the view frame from the start, and
  the stage centres (Decisions 2, 3). Its doc comments say which frame
  each value is in.
- It should cut a design that starts white side up, written as seen,
  into the same sheet as the design it mirrors (Agent QA 1).
- It should place a rolled sheet's fold where the viewer sees it, and
  centre the stage as the viewer sees it (Agent QA 2).
- It should leave the dart, the hat and the watermelon exactly as they
  were (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const flip = ([x, y]) => [-x, y]; const other = (type) => (type === "valley" ? "mountain" : "valley"); const seen = { ...PAPER_HAT, start: { rollRadians: 0, side: "back" }, steps: PAPER_HAT.steps.map((step) => ({ ...step, from: flip(step.to), to: flip(step.from), type: other(step.type) })) }; const a = cutSheet(PAPER_HAT); const b = cutSheet(seen); console.log(JSON.stringify([a.faces, a.creaseLines, a.centres]) === JSON.stringify([b.faces, b.creaseLines, b.centres]));'`
   Expect: `true` (prototype)
2. Do: `node --input-type=module -e 'import { createFold } from "./docs/src/designs/steps.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const y = (0.075 * Math.SQRT2) / 2; const mm = (v) => (v * 1000).toFixed(2); for (const side of ["front", "back"]) { const sheet = cutSheet({ aspect: 1, id: "corner", start: { rollRadians: Math.PI / 4, side }, steps: [createFold([-0.2, y], "all", [0.2, y], "valley")] }); console.log(side, sheet.centres.at(-1).map(mm).join(" "), sheet.creaseLines[0].type); }'`
   Expect: `front -18.75 -18.75 valley`, then
   `back 18.75 -18.75 mountain` (a diamond's top corner folded down to
   its centre; prototype)
3. Do: [Plan 09's Step 1](./09-turn-the-paper-over.md#step-1-steps-in-the-engine-and-the-pose)
   Agent QA 1 and 2, and
   [its Step 2](./09-turn-the-paper-over.md#step-2-the-watermelon-and-the-list-of-designs)
   Agent QA 1, unchanged.
   Expect: each gives its own `Expect:`.

### Step 2: The pose with the stretch [P]

- Changes `docs/src/designs/sheet.js`: writeStartPose() (Decision 5).
- Changes `docs/src/fold/stepper.js`: when the stretch phase runs
  (Decision 6), and the comments that call it a change of shape alone.
- It should ease the side and the roll together from one design's
  start to another's, ending exactly on the new one (Agent QA 1).
- It should run the stretch phase between designs of one shape whose
  starts differ, and skip it between designs that share both
  (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { writeStartPose } from "./docs/src/designs/sheet.js"; const d = { a: { aspect: 1 }, b: { aspect: 1, start: { rollRadians: Math.PI / 4, side: "back" } }, c: { aspect: 1, start: { rollRadians: 0, side: "back" } } }; const pose = (stretchFromId, designId, stretchProgress) => { const r = { y: 9, z: 9 }; writeStartPose(d, r, { designId, stretchFromId, stretchProgress }); return r.y.toFixed(4) + " " + r.z.toFixed(4); }; console.log([pose("a", "b", 0), pose("a", "b", 0.5), pose("a", "b", 1), pose("c", "b", 0.5), pose("b", "a", 0.25)].join(" | "));'`
   Expect: `0.0000 0.0000 | -1.5708 0.3927 | -3.1416 0.7854 | -3.1416 0.3927 | -2.6507 0.6627`
2. Do: `node --input-type=module -e 'import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { a: { aspect: 1 }, b: { aspect: 1, start: { rollRadians: 0, side: "back" } }, c: { aspect: 1 }, e: { aspect: 0.5 } }; const run = (to, seconds) => { const s = { designId: "a", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "a", stretchProgress: 1 }; stepSequence(seconds, d, s, { designId: to, linesOn: false, position: 1 }); return [s.designId, s.stretchProgress.toFixed(4), s.position.toFixed(4)].join(" "); }; console.log([run("b", 0.2), run("b", 0.75), run("c", 0.35), run("e", 0.2)].join(" | "));'`
   Expect: `b 0.5000 0.0000 | b 1.0000 0.5000 | c 1.0000 0.5000 | e 0.5000 0.0000`
   (a start that differs stretches for 0.4 s, then folds; the same
   shape and start folds at once; a shape that differs stretches, as
   now)

### Step 3: The yacht and the ice-cream cone

- Adds `docs/src/designs/yacht.js` and `docs/src/designs/ice-cream.js`
  (Decisions 8, 9).
- Changes `docs/src/designs/list.js`: both join `DESIGNS`
  (Decision 10).
- It should cut the yacht into the prototype's sheet (Agent QA 1).
- It should cut the cone into the prototype's sheet, centred as the
  viewer sees it (Agent QA 1).
- It should list the five designs in button order (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { ICE_CREAM } from "./docs/src/designs/ice-cream.js"; import { YACHT } from "./docs/src/designs/yacht.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; const mm = (v) => (v * 1000).toFixed(2); for (const design of [YACHT, ICE_CREAM]) { const sheet = cutSheet(design); const count = (type) => sheet.creaseLines.filter((line) => line.type === type).length; console.log(sheet.steps.length, sheet.folds.length, sheet.faces.length, count("valley"), count("mountain"), maxPaperRadius(sheet).toFixed(5), sheet.centres.at(-1).map(mm).join(" ")); }'`
   Expect: `3 3 6 2 3 0.10695 -17.41 8.25`, then
   `6 4 5 1 3 0.10832 7.32 -7.32` (prototype)
2. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; console.log(DESIGNS.map((design) => design.id).join());'`
   Expect: `paper-dart,paper-hat,watermelon,yacht,ice-cream`

### Step 4: The pose on the page, and the buttons

- Changes `docs/src/scene/paper.js`: `startGroup` and `startRotation`
  (Decision 4). Its doc comments name the four groups.
- Changes `docs/src/main.js`: writeStartPose() beside
  writeStretchScale() (Decision 5).
- Changes `docs/index.html`: the two buttons (Decision 10).
- It should fold the yacht as its diagram does, from a sheet turned
  white side up (Manual QA 1, 2).
- It should keep a sheet's pose when it is laid flat (Manual QA 3).
- It should fold the cone as its diagram does, from a diamond
  (Manual QA 4, 5).
- It should change pose and shape in one motion, with the sheet's
  corners square throughout (Manual QA 6, 7).
- It should keep the spin independent of the pose (Manual QA 8).
- It should leave the dart, the hat and the watermelon as they were
  (Manual QA 9).

**Agent QA**

1. Do: `grep -c 'data-fold=' docs/index.html`
   Expect: `6` (`4` before)
2. Do: `grep -c 'writeStartPose(' docs/src/main.js`
   Expect: `1`
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/` and every file under `docs/src/`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser "Yacht" and "Ice Cream" each turn the flat sheet to their
starting pose and fold as their diagrams do, with a clean console, and
with the values of Decisions 6, 8 and 9 kept or retuned at Manual QA 10
and 11.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R). Keep the
[yacht's diagram](https://en.origami-club.com/easy/vehicle/yacht/index.html)
and the
[ice cream's](https://en.origami-club.com/easy/food/soft-cream2/index.html)
open beside it.

1. **Do:** click "Yacht" and watch.
   - **Expect:** the flat square turns over, its right edge swinging
     towards you, and shows its white side. Lines in the paper's
     colour fade in, a diagonal of plain dashes among them.
   - **Expect:** the top left corner folds down to the bottom right,
     making a triangle in the paper's colour. The top layer's upright
     edge folds over to the sloping edge, showing white. The bottom
     folds up as a coloured hull.
   - **Expect:** it ends as two white sails above a hull in the
     paper's colour. The console shows no errors or warnings.
2. **Do:** compare each stage with the yacht's diagram.
   - **Expect:** the same shapes in the same order.
3. **Do:** click "Flat", then drag to look behind the sheet.
   - **Expect:** the yacht unfolds to a square that still shows its
     white side to the front, with the paper's colour behind.
4. **Do:** drag the sheet back to face you, and click "Ice Cream".
   - **Expect:** the white square turns an eighth of a turn, to stand
     on its corner, without turning over. Lines fade in.
   - **Expect:** the two lower edges fold in to the middle, right then
     left; the paper turns over; the top corner folds down, white on
     colour; its point folds back up; the paper turns over again.
   - **Expect:** it ends as a cone in the paper's colour, point down,
     topped with white ice cream and a small white peak.
5. **Do:** compare each stage with the ice cream's diagram.
   - **Expect:** the same shapes in the same order.
6. **Do:** from the finished cone, click "Paper Dart".
   - **Expect:** the cone unfolds through both turn-overs to the white
     diamond. The diamond then turns square and turns over to its
     coloured side in a single motion, and the dart folds as it always
     has.
7. **Do:** click "Paper Hat", let it finish, then "Ice Cream", then
   "Paper Hat" again. Watch the flat sheet each time it changes.
   - **Expect:** the sheet stretches between the upright oblong and
     the square, rolls and turns over, all at once. Its corners stay
     right angles throughout: it never leans into a slanted shape.
   - **Why:** a turn applied inside the stretch would shear the sheet.
8. **Do:** click "Yacht", and drag the paper about while the flat
   sheet turns over.
   - **Expect:** the paper follows the pointer throughout, and the
     turn carries on within it.
9. **Do:** click "Paper Dart", "Watermelon" and "Paper Hat" in turn,
   letting each finish.
   - **Expect:** each folds as before this plan. From the dart to the
     watermelon, the sheet neither pauses nor turns before the lines
     fade in.
10. **Do:** click "Paper Dart" and "Yacht" by turns, and judge the pace
    of the flat sheet's turn. If it is too quick, raise
    `STRETCH_SECONDS` in `docs/src/fold/stepper.js` by 0.1, reload, and
    look again.
    - **Expect:** a pace that suits. Note the value, for `/done-plan`
      to record.
11. **Do:** judge the yacht's hull and the ice cream's peak against
    their diagrams. To change either, alter `HULL_RISE_FRACTION` in
    `docs/src/designs/yacht.js` or `PLEAT_FRACTION` in
    `docs/src/designs/ice-cream.js`, and reload.
    - **Expect:** shapes that suit. Note the values, for `/done-plan`
      to record.
12. **Do:** press Tab until "Ice Cream" has the focus ring, and press
    Enter.
    - **Expect:** the same sequence as a click.

### Optional, for a later pass

13. **Do:** in the Performance panel, record "Paper Hat" then
    "Ice Cream", while dragging.
    - **Expect:** steady frames. Note the frame times, for `/done-plan`
      to record.

**Looks wrong, but isn't:**

- The finished yacht sits at a tilt of about 15°, as its last fold
  leaves it. The diagram draws it levelled.
- As the cone's first edge folds in, the paper slides 22 mm to the
  right, and slides back as the second folds in: each stage's folded
  shape stays centred, as the hat's does.
- "Flat" after a white-side-up design leaves the white side showing
  (Decision 7).
- The row of buttons grows with each design, and is tidied once the
  designs are in
  ([Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)).

## Audit

- **2026-11-10T14:26:45Z** — **drafted**: an optional `start` of roll
  and side, the view frame and the stage centres taken from it, a
  group for it between the turn and the stretch, eased with the
  stretch, and the yacht and the ice-cream cone with their buttons;
  the Lead Developer ruled that the 45° turn and the turn-over happen
  with the stretch; agent proposed the `start` field, centres measured
  in the view frame, `startGroup` with order `ZYX`, the two angles
  eased together in place of a single rotation about a tilted axis,
  `STRETCH_SECONDS` kept at 0.4 s, the yacht's 0.11 and the cone's
  1 / 3 and its tip folded to the corners' meeting point, the button
  labels, and leaving the yacht tilted; split from the turn-over,
  Plan 09, by the seam test; figures from a prototype against the
  current engine.
