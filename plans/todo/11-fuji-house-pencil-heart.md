---
title: Fold Mount Fuji, a house, a pencil and a heart
description: Adds four designs behind new buttons, two from the square and two from the first half-square sheets, using only the steps, starts and layer choices the engine already has.
type: plan
---

## Context

- Delivers four more designs, each a file in `docs/src/designs/`, a line
  in `DESIGNS` and a button: Mount Fuji and a house from the square, and
  a pencil and a heart from a half square, the first 1:2 sheets in the
  app. It changes no engine, pose or scene code.
- Takes designs 8, 16, 21 and 22 from the shortlist in
  [07-design-research.md](./07-design-research.md#the-shortlist), under
  its [Ruling 4](./07-design-research.md#ruling-4-every-sheet-keeps-the-same-area-so-14-strips-wait),
  which admits 1:2 sheets, and its
  [Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end),
  one button per design.
- Depends on [Plan 09](../done/09-turn-the-paper-over.md): `steps`, the
  turn-over, the view frame, createFold() and `DESIGNS`. Depends on
  [Plan 10](../done/10-start-the-sheet-turned.md): `start`, which three of
  the four need to begin white side up. The remaining designs follow in
  later plans.
- The sources, read on 2026-11-10, step photos and diagram included:
  - [Origami-Instructions.com: Mount Fuji](http://www.origami-instructions.com/origami-mount-fuji.html)
  - [Origami Club: house](https://en.origami-club.com/nature/house1/index.html),
    Fumiaki Shingu's diagram, as far as its step 4
  - [Origami-Instructions.com: simple heart](http://www.origami-instructions.com/simple-origami-heart.html),
    a design by Francis Ow
  - [Red Ted Art: easy origami pencil](https://www.redtedart.com/easy-origami-pencil/),
    for its photos of the finished pencil only: its steps are in a
    video, which was not watched
- Figures marked "prototype" were run on 2026-11-10 in a throwaway Node
  script, kept outside the repo, which built each design with
  createFold() and `TURN_OVER` and cut it with the engine as Plan 10
  leaves it. In all four, no face is under 87 mm², no two overlapping
  faces share a layer at any stage, and, at 59 positions in each step,
  no edge passes through another face further than 0.06 mm from that
  face's own edge, the dart's figure by the same test. The real files
  are written afresh, to [CLAUDE.md](../../CLAUDE.md)'s standards.

## Decisions

1. **No engine work.** Every fold is a valley or a mountain through
   `"all"` layers, or through `{ movedBy }` one earlier fold. A fold
   through `"all"` moves everything to the left of its whole line, not
   only what lies beside the part drawn, which is why the heart's four
   inner folds name a flap (Decision 6).
2. **Each design follows its source's own instructions for the back.**
   Mount Fuji and the heart turn over where their sources flip the
   paper. The house folds its sides and corners backward, as mountain
   folds, as its diagram says. The pencil, whose sequence is written
   here, turns over, so that its side and corner folds are made towards
   the viewer.
3. **Mount Fuji**, design 8, from the square, coloured side up.
   - The top edge folds down as the snow: `SNOW_FRACTION = 1 / 8` of
     the side, 18.75 mm. The source says 8 to 10 mm, "more for lots of
     snow"; its own photo shows about 19 mm. Open to retuning at
     Manual QA 11.
   - Turn over. The bottom edge folds up to the top, halving what is
     left. Each top corner folds down, right then left, through both
     halves, along a line from the folded packet's bottom corner at
     45°. Turn over.
   - This folds the middle before the corners. The source creases the
     middle, folds the corners of one half, then re-creases the middle
     so that the other half is a stand. Pressed flat, that half would
     show as two white corners beside the slopes, the same white as the
     snow. Folded first, it hides behind the mountain.
   - In metres:

     ```json
     {
       "aspect": 1,
       "id": "mount-fuji",
       "steps": [
         {
           "from": [-0.075, 0.05625],
           "kind": "fold",
           "layers": "all",
           "targetRadians": 3.141592653589793,
           "to": [0.075, 0.05625],
           "turns": "moving-side",
           "type": "valley"
         },
         { "kind": "turn-over" },
         {
           "from": [0.075, -0.009375],
           "kind": "fold",
           "layers": "all",
           "targetRadians": 3.141592653589793,
           "to": [-0.075, -0.009375],
           "turns": "moving-side",
           "type": "valley"
         },
         {
           "from": [0.009375, 0.05625],
           "kind": "fold",
           "layers": "all",
           "targetRadians": 3.141592653589793,
           "to": [0.075, -0.009375],
           "turns": "moving-side",
           "type": "valley"
         },
         {
           "from": [-0.075, -0.009375],
           "kind": "fold",
           "layers": "all",
           "targetRadians": 3.141592653589793,
           "to": [-0.009375, 0.05625],
           "turns": "moving-side",
           "type": "valley"
         },
         { "kind": "turn-over" }
       ]
     }
     ```

   - Prototype: 4 folds in 6 steps, 9 faces, and 8 crease lines, which
     from the front are 5 valley and 3 mountain. The finished mountain
     is 150.0 mm wide and 65.6 mm tall, flat-topped: about 4,840 mm² of
     colour under a white cap of about 700 mm². It reaches 106.29 mm
     from the origin.
4. **The house**, design 16, from the square, white side up: `start`
   is `{ "rollRadians": 0, "side": "back" }`. It stops at the diagram's
   step 4, the roof. Steps 5 to 8 make a door with a squash fold, which
   is not a simple fold.

   | Step | From (mm)     | To (mm)       | Layers | Type     |
   | ---- | ------------- | ------------- | ------ | -------- |
   | 0    | −75.0, 37.5   | 75.0, 37.5    | all    | valley   |
   | 1    | 37.5, 37.5    | 37.5, −75.0   | all    | mountain |
   | 2    | −37.5, −75.0  | −37.5, 37.5   | all    | mountain |
   | 3    | 0.0, 37.5     | 37.5, 0.0     | all    | mountain |
   | 4    | −37.5, 0.0    | 0.0, 37.5     | all    | mountain |

   - Step 0 folds the top edge down to the middle, as a coloured band.
     Steps 1 and 2 fold the right quarter back, then the left. Steps 3
     and 4 fold the top corners back, right then left, from the middle
     of the top to the band's lower corners.
   - Prototype: 5 folds in 5 steps, 14 faces, and 13 crease lines,
     which from the front are 6 valley and 7 mountain. The finished
     house is 75.0 mm wide and 112.5 mm tall: a roof of about
     1,400 mm² in colour over white walls 75.0 mm square. It reaches
     106.72 mm from the origin.
5. **The pencil**, to the look of design 22, from a half square stood
   upright, 106.07 mm by 212.13 mm, white side up: `aspect` is 0.5 and
   `start` is `{ "rollRadians": 0, "side": "back" }`.
   - The sequence is this app's own, worked out to give the pencil in
     Red Ted Art's photos: a body in colour, a white point and a
     coloured tip. Design 22's own steps are unread. Design 9's are
     read, but need a 1:4 strip, which Ruling 4 sets aside, and fold
     the point off-centre through uneven layers.
   - `POINT_HALF_ANGLE_RADIANS = Math.PI / 6`: each side of the point
     slopes 30° from upright. It is the sharpest point whose flaps stay
     hidden: each corner's top edge then lies exactly along the other
     slope. The photos show about 24°.
   - `TIP_FRACTION = 0.4`: the coloured tip's share of the point's
     height, read off the photos. Open to retuning at Manual QA 11.
   - From those: the point is 45.93 mm tall, on a base a quarter of
     the sheet's width either side of the middle; the tip is 18.37 mm;
     and the body is 73.92 mm, half of what the tip and the point
     leave, so that the bottom edge folds up to exactly where the
     point begins.

   | Step | From (mm)      | To (mm)        | Layers | Type      |
   | ---- | -------------- | -------------- | ------ | --------- |
   | 0    | −53.03, 87.69  | 53.03, 87.69   | all    | valley    |
   | 1    | 53.03, −32.15  | −53.03, −32.15 | all    | valley    |
   | 2    |                |                |        | turn-over |
   | 3    | 26.52, 87.69   | 26.52, −32.15  | all    | valley    |
   | 4    | −26.52, −32.15 | −26.52, 87.69  | all    | valley    |
   | 5    | 0.00, 87.69    | 26.52, 41.77   | all    | valley    |
   | 6    | −26.52, 41.77  | 0.00, 87.69    | all    | valley    |
   | 7    |                |                |        | turn-over |

   - Step 0 folds the top edge down as the tip's colour; step 1 folds
     the bottom edge up as the body. After the turn-over, steps 3 and 4
     fold the sides in to the middle, right then left, and steps 5 and
     6 fold the top corners in, right then left.
   - Prototype: 6 folds in 8 steps, 17 faces, and 16 crease lines,
     which from the front are 6 valley and 10 mountain. The finished
     pencil is 53.0 mm wide and 119.8 mm tall, point up: about
     4,120 mm² of colour and 1,020 mm² of white. It reaches 118.84 mm
     from the origin.
6. **The heart**, design 21, from a half square on its side, 212.13 mm
   by 106.07 mm, white side up: `aspect` is 2 and `start` is
   `{ "rollRadians": 0, "side": "back" }`.
   - The bottom strip is a quarter of the sheet's height, 26.52 mm:
     the source folds "about 19 mm" of its 75 mm.
   - `LOBE_FLAT_FRACTION = 1 / 2`: each lobe's peak folds down half
     its height, read off the source's photo. Open to retuning at
     Manual QA 11.

   | Step | From (mm)      | To (mm)         | Layers    | Type      |
   | ---- | -------------- | --------------- | --------- | --------- |
   | 0    | 106.07, −26.52 | −106.07, −26.52 | all       | valley    |
   | 1    | 79.55, 53.03   | 0.00, −26.52    | all       | valley    |
   | 2    | 0.00, −26.52   | −79.55, 53.03   | all       | valley    |
   | 3    |                |                 |           | turn-over |
   | 4    | 53.03, 79.55   | 53.03, 26.52    | all       | valley    |
   | 5    | −53.03, 26.52  | −53.03, 79.55   | all       | valley    |
   | 6    | 26.52, 79.55   | 53.03, 53.03    | all       | valley    |
   | 7    | 0.00, 53.03    | 26.52, 79.55    | movedBy 2 | valley    |
   | 8    | −26.52, 79.55  | 0.00, 53.03     | movedBy 1 | valley    |
   | 9    | −53.03, 53.03  | −26.52, 79.55   | all       | valley    |
   | 10   | 0.00, 66.29    | 53.03, 66.29    | movedBy 2 | valley    |
   | 11   | −53.03, 66.29  | 0.00, 66.29     | movedBy 1 | valley    |
   | 12   |                |                 |           | turn-over |

   - Step 0 folds the strip up. Steps 1 and 2 fold each half of the
     bottom edge up to the centre line, right then left, as two flaps
     that stand 26.52 mm above the top edge. After the turn-over,
     steps 4 and 5 fold each side in to the strip's edge. Steps 6 to 9
     fold the four top corners down, from right to left, leaving two
     peaks. Steps 10 and 11 fold each peak's tip down, right then
     left.
   - Steps 7, 8, 10 and 11 move only the layers of one flap: the one
     that step 2 moved is on the right once the paper has turned over.
     Each of their lines, carried on, crosses the other lobe; steps 7
     and 8 written as `"all"` fail in the prototype with
     `Step 9 of design "heart" moves nothing`.
   - Prototype: 11 folds in 13 steps, 32 faces, and 31 crease lines,
     which from the front are 16 valley and 15 mountain. The finished
     heart is 106.1 mm wide and 92.8 mm tall, 6,700 mm² in the paper's
     colour with no white. It reaches 118.88 mm from the origin.
7. **Every line comes from a landmark.** Each file builds its points
   from sheetSize() and the constants above, as
   `docs/src/designs/yacht.js` does. The tables' figures, rounded to
   0.01 mm, are for checking, never for copying.
8. **Files, names and buttons**, in this order after "Ice Cream", as
   `DESIGNS` lists them:

   | File            | Export       | `id`         | Button       |
   | --------------- | ------------ | ------------ | ------------ |
   | `mount-fuji.js` | `MOUNT_FUJI` | `mount-fuji` | "Mount Fuji" |
   | `house.js`      | `HOUSE`      | `house`      | "House"      |
   | `pencil.js`     | `PENCIL`     | `pencil`     | "Pencil"     |
   | `heart.js`      | `HEART`      | `heart`      | "Heart"      |

   Each button's `data-fold` is its `id`. Each file's `@fileoverview`
   credits its source; the pencil's says that its sequence is this
   app's own, after the look of the pencil at Red Ted Art, which
   credits Mari Ono's _Origami for Children_.
9. **The camera steps back by 2.2%.** It frames the furthest any
   design reaches (`paperRadiusMeters` in `docs/src/main.js`): the
   hat's 116.21 mm until now, the heart's 118.88 mm with this plan. A
   flat 1:2 sheet alone reaches 118.59 mm. Every design draws 2.2%
   smaller, which Ruling 4 accepts.
10. **Fold lines on a 1:2 sheet are coarser.** drawFoldLines() gives
    the sheet's longer side 2,048 px, so a 1:2 sheet has 9.7 px to the
    millimetre against the square's 13.7 and the hat's 11.5. Judged by
    eye at Manual QA 9; no change is made unless it fails there.
11. **Performance**: nothing is added to any per-frame path. The heart
    has 32 faces and 120 vertices against the dart's 16 and 50, so its
    frames write more positions; cutting the four sheets at load took
    about 12 ms in the prototype. Nothing new to measure beyond the
    optional Manual QA 13.

## Steps

### Step 1: Mount Fuji and the house [P]

- Adds `docs/src/designs/mount-fuji.js` and `docs/src/designs/house.js`
  (Decisions 3, 4, 7).
- It should cut Mount Fuji into the prototype's sheet (Agent QA 1).
- It should cut the house into the prototype's sheet (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { HOUSE } from "./docs/src/designs/house.js"; import { MOUNT_FUJI } from "./docs/src/designs/mount-fuji.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; for (const design of [MOUNT_FUJI, HOUSE]) { const sheet = cutSheet(design); const count = (type) => sheet.creaseLines.filter((line) => line.type === type).length; const [x, y] = sheet.centres.at(-1); console.log(design.id, sheet.steps.length, sheet.folds.length, sheet.faces.length, count("valley"), count("mountain"), maxPaperRadius(sheet).toFixed(5), Math.abs(x) < 1e-9, (y * 1000).toFixed(2)); }'`
   Expect: `mount-fuji 6 4 9 5 3 0.10629 true 23.44`, then
   `house 5 5 14 6 7 0.10672 true -18.75` (steps, folds, faces, valley
   lines, mountain lines, reach in metres, centred left to right, last
   centre's height in mm; prototype)
2. Do: `node --check docs/src/designs/mount-fuji.js && node --check docs/src/designs/house.js`
   Expect: prints nothing.

### Step 2: The pencil and the heart [P]

- Adds `docs/src/designs/pencil.js` and `docs/src/designs/heart.js`
  (Decisions 5, 6, 7).
- It should cut the pencil into the prototype's sheet (Agent QA 1).
- It should cut the heart into the prototype's sheet, its inner folds
  moving one flap each (Agent QA 1, 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { HEART } from "./docs/src/designs/heart.js"; import { PENCIL } from "./docs/src/designs/pencil.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; for (const design of [PENCIL, HEART]) { const sheet = cutSheet(design); const count = (type) => sheet.creaseLines.filter((line) => line.type === type).length; const [x, y] = sheet.centres.at(-1); console.log(design.id, design.aspect, sheet.steps.length, sheet.folds.length, sheet.faces.length, count("valley"), count("mountain"), maxPaperRadius(sheet).toFixed(5), Math.abs(x) < 1e-9, (y * 1000).toFixed(2)); }'`
   Expect: `pencil 0.5 8 6 17 6 10 0.11884 true 27.77`, then
   `heart 2 13 11 32 16 15 0.11888 true 19.89` (as Step 1's, with the
   `aspect` after the id; prototype)
2. Do: `node --input-type=module -e 'import { HEART } from "./docs/src/designs/heart.js"; console.log(HEART.steps.map((step) => (step.kind === "fold" ? (step.layers.movedBy ?? "a") : "t")).join(" "));'`
   Expect: `a a a t a a a 2 1 a 2 1 t`
3. Do: `node --check docs/src/designs/pencil.js && node --check docs/src/designs/heart.js`
   Expect: prints nothing.

### Step 3: The list, and the buttons

- Changes `docs/src/designs/list.js`: the four join `DESIGNS`
  (Decision 8).
- Changes `docs/index.html`: the four buttons (Decision 8).
- It should list the nine designs in button order (Agent QA 1).
- It should set the camera by the heart's reach (Agent QA 1).
- It should fold Mount Fuji from the coloured square, ending as a
  coloured mountain with a white cap (Manual QA 1, 2).
- It should fold the house as its diagram does as far as the roof
  (Manual QA 3, 4).
- It should fold a pencil with a coloured body, a white point and a
  coloured tip (Manual QA 5).
- It should fold the heart as its source does (Manual QA 6, 7).
- It should stretch the sheet between the square, the upright half
  square and the half square on its side, with its corners square
  throughout (Manual QA 8).
- It should print legible fold lines on both sides of a 1:2 sheet
  (Manual QA 9).
- It should leave the five earlier designs as they were, but for their
  size (Manual QA 10).

**Agent QA**

1. Do: `node --input-type=module -e 'import { DESIGNS } from "./docs/src/designs/list.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { maxPaperRadius } from "./docs/src/fold/pose.js"; console.log(DESIGNS.map((design) => design.id).join()); console.log(Math.max(...DESIGNS.map((design) => maxPaperRadius(cutSheet(design)))).toFixed(5));'`
   Expect: `paper-dart,paper-hat,watermelon,yacht,ice-cream,mount-fuji,house,pencil,heart`,
   then `0.11888` (`0.11621` before)
2. Do: `grep -c 'data-fold=' docs/index.html`
   Expect: `10` (`6` before)
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/` and every file under `docs/src/`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser "Mount Fuji", "House", "Pencil" and "Heart" each fold to
the shape their sources show, with a clean console, and with the values
of Decisions 3, 5 and 6 kept or retuned at Manual QA 11.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R). Keep the four sources in
[Context](#context) open beside it.

1. **Do:** click "Mount Fuji" and watch.
   - **Expect:** on the coloured square, the top edge folds down as a
     narrow white strip. The paper turns over. The bottom half folds up
     over the white, in the paper's colour. The top right corner folds
     down and in, then the top left, each showing an upright white band.
     The paper turns over.
   - **Expect:** it ends as a wide, flat-topped mountain in the paper's
     colour with a white cap, and nothing showing beside its slopes.
     The console shows no errors or warnings.
2. **Do:** compare the finished mountain with the last photo on the
   Mount Fuji page.
   - **Expect:** the same shape and colours. The steps differ in order
     (Decision 3).
3. **Do:** click "House" and watch.
   - **Expect:** the flat sheet stretches to a square, if it was not
     one, and turns white side up. The top edge folds down to the
     middle, as a coloured band. The right side swings back out of
     sight, then the left, leaving the sheet half as wide. The top
     right corner swings back, then the top left.
   - **Expect:** it ends as a white square with a coloured triangular
     roof. Dragging to look behind shows the folded sides and corners.
4. **Do:** compare each stage with steps 2 to 4 of the house's diagram.
   - **Expect:** the same shapes in the same order.
5. **Do:** click "Pencil" and watch, then compare the result with the
   photos on the pencil page.
   - **Expect:** the sheet stretches to a tall half square, white side
     up. The top edge folds down as a short coloured strip, and the
     bottom edge folds up as a tall coloured panel. The paper turns
     over. The right side folds in to the middle, then the left. The
     top right corner folds in along a steep line, then the top left.
     The paper turns over.
   - **Expect:** it ends as a pencil, point up: a coloured body, a
     white point above it, and a coloured tip. The body meets the
     point with no gap and no overlap.
6. **Do:** click "Heart" and watch.
   - **Expect:** the sheet stretches to a wide half square, white side
     up. The bottom edge folds up as a coloured strip. The right half
     of the bottom edge folds up to the centre line, then the left,
     leaving two coloured flaps that meet down the middle. The paper
     turns over.
   - **Expect:** each side folds in, right then left. The four top
     corners fold down one at a time, from right to left, leaving two
     peaks, and each peak's tip folds down. No fold moves the other
     half of the heart. The paper turns over.
   - **Expect:** it ends as a heart in the paper's colour, with a seam
     down its middle and no white.
7. **Do:** compare each stage with the photos on the heart's page.
   - **Expect:** the same shapes in the same order.
8. **Do:** click "Heart", let it finish, then "Pencil", then
   "Mount Fuji", then "Heart".
   - **Expect:** each time the design unfolds to its flat sheet, which
     changes shape in one motion, wide to tall, tall to square, square
     to wide, its corners square throughout, and turns over when the
     next design starts on the other side.
9. **Do:** with "Fold lines" ticked, click "Pencil", then "Flat", and
   look closely at the lines on both sides; untick and tick the box.
   - **Expect:** dashes as sharp as the square's, to the eye, on the
     white side in the paper's colour and on the coloured side in
     black. They fade out and in with the box.
   - **Why:** a 1:2 sheet has fewer pixels to the millimetre
     (Decision 10).
10. **Do:** click "Paper Dart", "Paper Hat", "Watermelon", "Yacht" and
    "Ice Cream" in turn, letting each finish.
    - **Expect:** each folds as before, a little smaller on the page.
11. **Do:** judge the mountain's snow, the pencil's tip and point, and
    the heart's lobes against their sources.
    - **Expect:** shapes that suit. Note the values, for `/done-plan`
      to record.
12. **Do:** press Tab until "Heart" has the focus ring, and press
    Enter.
    - **Expect:** the same sequence as a click.

### Optional, for a later pass

13. **Do:** in the Performance panel, record "Paper Hat" then "Heart",
    while dragging.
    - **Expect:** steady frames. Note the frame times, for `/done-plan`
      to record.

**Looks wrong, but isn't:**

- Mount Fuji's steps are not in its source's order, and its source
  ends with a mountain that stands up (Decision 3).
- The house has no door, and its sides and corners fold away behind
  the paper rather than towards the viewer (Decisions 2, 4).
- The pencil's steps are not Red Ted Art's, and the finished pencil is
  small, 53 mm by 120 mm (Decision 5).
- The heart is one colour, and its back shows every flap.
- Each stage's folded shape stays centred, so the paper slides a
  little as it folds, as the hat's does.
- Every design is 2.2% smaller than before (Decision 9).
- The row of buttons grows with each design, and is tidied once the
  designs are in
  ([Ruling 5](./07-design-research.md#ruling-5-one-button-per-design-tidied-at-the-end)).

## Audit

- **2026-11-10T22:25:20Z** — **drafted**: four designs with their
  buttons and no engine work, Mount Fuji and the house from the
  square, the pencil and the heart from 1:2 sheets; the Lead Developer
  chose designs 8 and 16, and asked for one pencil and one heart,
  preferring the 1:2 sheet and above all an easy one; agent chose the
  heart, design 21, and for the pencil proposed a sequence of its own
  to the look of design 22, whose steps are in an unwatched video,
  over design 9's 1:4 strip; agent proposed folding Mount Fuji's
  middle before its corners, the house's backward folds kept as
  mountain folds, `SNOW_FRACTION` 1 / 8, `POINT_HALF_ANGLE_RADIANS`
  π / 6, `TIP_FRACTION` 0.4, the heart's strip at a quarter and
  `LOBE_FLAT_FRACTION` 1 / 2, the ids, exports and button labels, and
  one plan for all four; figures from a prototype against the engine
  as Plan 10's uncommitted implementation leaves it, the Agent QA
  commands run on the prototype's designs in place of the files; no
  browser.
