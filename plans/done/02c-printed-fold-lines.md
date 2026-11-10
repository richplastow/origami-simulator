---
title: Print fold lines on the paper
description: Prints each design's crease pattern on the red side as dashed valley and dash-dot-dot mountain lines that fade in before folding and out once flat, behind a "Fold lines" checkbox.
type: plan
---

## Context

- Delivers printed fold lines: each design's crease pattern, black on the
  red side, as on a sheet from a kit. The lines fade in before a design
  folds and fade out once the paper lies flat again, so flat paper at
  rest is blank. A "Fold lines" checkbox, ticked at load, switches them
  off and on.
- Depends on [Plan 02b](02b-paper-hat.md), and through it on
  [Plan 02a](02a-paper-dart.md): it extends `cutSheet()` in
  `docs/src/fold/engine.js`, `stepSequence()` in
  `docs/src/fold/stepper.js` with its stretch phase, and `createPaper()`
  in `docs/src/scene/paper.js` with `setSheet()`.
- Implements [Printed fold lines](02-simple-folds-research.md#printed-fold-lines)
  in [02-simple-folds-research.md](02-simple-folds-research.md), which
  serves Plans 02a to 02c and stays in `plans/todo/` until this plan is
  done. Line styles follow the
  [Yoshizawa–Randlett system](https://en.wikipedia.org/wiki/Yoshizawa%E2%80%93Randlett_system);
  dashes are drawn with
  [`setLineDash()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash).
- Plans 03 onwards, presentation polish, follow; the colour plan must keep
  black lines readable on its paper colours, per the research.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10.

## Definitions

The terms of [Plan 02a](02a-paper-dart.md#definitions) and
[Plan 02b](02b-paper-hat.md#definitions) apply. Two more:

- **Crease pattern**: every line along which a design folds, drawn on the
  flat sheet, each marked valley or mountain as seen from the front.
- **Face up, face down**: a face lies face up when its front (red) side
  faces the viewer in the folded paper, and face down when a placement
  has turned it over. A fold that is a valley on a face-up layer is a
  mountain on a face-down one, seen from the sheet's front.

## Decisions

1. **The crease pattern comes from the engine**: `cutSheet()` adds
   `creaseLines` to the sheet. For each fold, each face it splits gives
   one line where the fold line crosses that face, in sheet coordinates,
   typed as the fold is, or the opposite when the face lies face down (the
   placement it has before the fold, `placements.at(-1)`, has a negative
   `a × d − b × c`), per
   [Printed fold lines](02-simple-folds-research.md#printed-fold-lines).
   A fold through several layers therefore prints both kinds of line.
   `from` and `to` are the line's two ends, in no set order. The dart's
   first line:

   ```json
   { "from": [-0.075, 0], "to": [0, 0.075], "type": "valley" }
   ```

   Lines are not merged: in neither design do two lines of one type meet
   end to end on one straight line (prototype, 2026-11-10).
2. **Expected patterns** (recomputed 2026-11-10 against the current
   engine, with Decision 1's rule): the dart prints 15 lines, 9 valley
   (1,109.8 mm) and 6 mountain (648.6 mm); the hat prints 7, 4 valley
   (430.6 mm) and 3 mountain (304.5 mm). Both patterns are
   mirror-symmetric left to right, types included. The research's dart
   figures (8 valley, 7 mountain, and a mountain line down the middle)
   predate [Plan 02a](02a-paper-dart.md)'s fold 5 becoming a
   valley: the fold in half now prints one valley line down the middle.
3. **Drawing**, as
   [Printed fold lines](02-simple-folds-research.md#printed-fold-lines)
   sets out: each design's lines are drawn once into a 2D canvas and
   shown through a third mesh that shares the paper's geometry.
   - A `uv` attribute holds each vertex's sheet coordinates scaled to 0..1
     (`u = x / width + 0.5`, `v = y / height + 0.5`), set when the sheet is
     built. Bridging strips reuse the faces' vertices, so a strip carries
     its crease's UVs and shows the line along it.
   - The mesh uses a
     [MeshBasicMaterial](https://github.com/mrdoob/three.js/blob/r187/src/materials/MeshBasicMaterial.js)
     with `side: FrontSide`, `transparent: true` and `map` a
     [CanvasTexture](https://github.com/mrdoob/three.js/blob/r187/src/textures/CanvasTexture.js)
     whose `colorSpace` is `SRGBColorSpace`, as a colour texture needs
     under Three.js's colour management (the default is `NoColorSpace`).
     CanvasTexture's constructor takes no colour space, so it is set as a
     property after construction. Being unlit, black stays black.
   - CanvasTexture keeps
     [Texture](https://github.com/mrdoob/three.js/blob/r187/src/textures/Texture.js)'s
     default `flipY = true`, which uploads the canvas's top row at
     `v = 1`. The canvas is therefore drawn as the sheet's front is seen,
     top edge at its top row: a sheet point `(x, y)` lands at canvas pixel
     `((x / width + 0.5) × canvas.width, (0.5 − y / height) ×
     canvas.height)`. Drawn the other way up, the hat's lines land
     upside down.
   - It draws over the front mesh because a
     [Material](https://github.com/mrdoob/three.js/blob/r187/src/materials/Material.js)'s
     `depthFunc` defaults to `LessEqualDepth`, and
     [WebGLRenderer](https://github.com/mrdoob/three.js/blob/r187/src/renderers/WebGLRenderer.js)
     draws transparent objects after opaque ones. `polygonOffset` is
     there should the two ever fight.
   - Each face carries its own part of every line, with no pose maths;
     lines on a face-down flap face away and are culled, so lines drop
     out of view as the design folds.
   - [LineDashedMaterial](https://github.com/mrdoob/three.js/blob/r187/src/materials/LineDashedMaterial.js)
     cannot draw dash-dot-dot: it takes one `dashSize` and one `gapSize`.
4. **Canvas size**: `FOLD_LINE_TEXTURE_PX = 2048` along the sheet's longer
   side, and the shorter side by its aspect, so texels stay square: 2,048
   square for the dart, 1,448 × 2,048 for the hat, about 11.5 pixels per
   millimetre on the hat (derived). When the design changes, while the
   lines are invisible, the canvas is resized and redrawn, and the old
   texture is disposed of and replaced: r187's
   [WebGLTextures](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgl/WebGLTextures.js)
   allocates a texture's storage only on its first upload, so a resized
   canvas cannot reuse it.
5. **Line style**: `FOLD_LINE_COLOR = 0x000000`, black, per the research.
   A valley line is dashed, `[dash, gap]`; a mountain line is
   dash-dot-dot, `[dash, gap, dot, gap, dot, gap]`, both through
   `setLineDash()`, with butt caps. Widths and lengths, in millimetres on
   the sheet: `FOLD_LINE_WIDTH_MM = 0.5`, `FOLD_LINE_DASH_MM = 3`,
   `FOLD_LINE_GAP_MM = 1.5` and `FOLD_LINE_DOT_MM = 0.5`, open to tuning
   by eye at Manual QA 2 and 3. Each is scaled to canvas pixels by the
   canvas's pixels per millimetre.
6. **Fades**: `FADE_OUT_SECONDS = 0.3` and `FADE_IN_SECONDS = 0.6`, per
   [Printed fold lines](02-simple-folds-research.md#printed-fold-lines),
   eased with smoothstep() from `docs/src/fold/easing.js`. The material's
   `opacity` is the eased
   visibility, and the mesh is hidden while it is 0, so flat paper at rest
   draws no lines at all.
7. **Stepper state**: the state gains `linesVisibility`, from 0 to 1, and
   `linesFade`, 1 while fading in, −1 while fading out and 0 otherwise;
   the target gains `linesOn`, the checkbox. One phase runs at a time.

   ```json
   {
     "designId": "paper-dart",
     "direction": 0,
     "linesFade": 1,
     "linesVisibility": 0.5,
     "position": 0,
     "stretchFromId": "paper-dart",
     "stretchProgress": 1
   }
   ```

   ```json
   { "designId": "paper-dart", "linesOn": true, "position": 7 }
   ```

   - At position 0, before folding a design, the lines fade towards
     `linesOn`: in, if on, or out, should they still show while off.
   - At position 0, before a switch or when "Flat" is the target, they
     fade out, if showing, before the stretch.
   - At rest at any other position, they fade towards `linesOn`.
   - The target, `linesOn` included, is read only when a fold, a fade or
     a stretch finishes. With the lines off, no fade time is spent.
   - `stepSequence()` returns true when `linesVisibility` changes too.
   - With the lines off, the stepper behaves as Plan 02b's does: its
     stepper checks, given the new fields, still pass (Step 2's Agent
     QA 6).

   The dart then takes 5.5 s from flat and 2.75 s back; a switch from the
   dart to the hat takes 7.25 s, per the research's
   [timings](02-simple-folds-research.md#printed-fold-lines).
8. **Checkbox**:
   `<label><input type="checkbox" checked data-fold-lines /> Fold lines</label>`
   after the buttons, in the button bar, in `docs/index.html`;
   `connectFoldLinesToggle(onChange)` in
   `docs/src/ui/fold-lines-toggle.js` passes its state on, once at
   connection, since a browser may restore a checkbox's state on reload,
   and at every change, and `main.js` copies it into the target.
9. **Performance**: each switch redraws a canvas of up to 2,048 × 2,048
   and uploads it with mipmaps, about 22 MB (derived), while the sheet is
   blank; each frame of a fade writes one opacity. Manual QA 9 measures
   the switch against the live site, which shows Plan 02b until this work
   is pushed, and Manual QA 8 reads `renderer.info.memory.textures`.

## Steps

### Step 1: The crease pattern from the engine [P]

- Changes `docs/src/fold/engine.js`: `cutSheet()` adds `creaseLines`
  (Decisions 1, 2).
- It should print the dart's 15 lines and the hat's 7, with the expected
  counts and lengths of each type (Agent QA 1).
- It should give mirror-symmetric patterns, types included (Agent QA 2).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; for (const d of [PAPER_DART, PAPER_HAT]) { const l = cutSheet(d).creaseLines; const of = (t) => l.filter((x) => x.type === t); const mm = (xs) => (xs.reduce((n, { from: a, to: b }) => n + Math.hypot(b[0] - a[0], b[1] - a[1]), 0) * 1000).toFixed(1); console.log(l.length, of("valley").length, mm(of("valley")), of("mountain").length, mm(of("mountain"))); }'`
   Expect: `15 9 1109.8 6 648.6`, then `7 4 430.6 3 304.5`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; const near = (p, q) => Math.hypot(p[0] + q[0], p[1] - q[1]) < 1e-6; console.log([PAPER_DART, PAPER_HAT].map((d) => { const l = cutSheet(d).creaseLines; return l.every((a) => l.some((b) => b.type === a.type && ((near(a.from, b.from) && near(a.to, b.to)) || (near(a.from, b.to) && near(a.to, b.from))))); }).join(" "));'`
   Expect: `true true`

### Step 2: Fades in the sequence [P]

- Changes `docs/src/fold/stepper.js`: the lines' phases (Decisions 6, 7).
- It should fade the lines in over 0.6 s before folding, and spend no
  time on them when they are off (Agent QA 1, 2).
- It should unfold, fade out, stretch, fade in and fold, in that order,
  on a switch (Agent QA 3).
- It should fade the lines out over 0.3 s once "Flat" has unfolded the
  paper (Agent QA 4).
- It should fade the lines where the paper rests when the checkbox
  changes, after any fade in progress (Agent QA 5).
- It should keep Plan 02b's switch and "Flat" behaviour with the lines
  off (Agent QA 6).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: "paper-dart", linesOn: true, position: 7 }; stepSequence(0.3, d, s, t); const log = [s.linesVisibility.toFixed(4), s.position]; stepSequence(0.65, d, s, t); console.log(...log, "|", s.linesVisibility, s.position.toFixed(4));'`
   Expect: `0.5000 0 | 1 0.5000`
2. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 0, position: 0, stretchFromId: "paper-dart", stretchProgress: 1 }; stepSequence(0.35, d, s, { designId: "paper-dart", linesOn: false, position: 7 }); console.log(s.linesVisibility, s.position.toFixed(4));'`
   Expect: `0 0.5000`
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 1, position: 7, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: "paper-hat", linesOn: true, position: 5 }; const log = []; for (const dt of [2.6, 0.45, 0.3, 0.6, 3.2]) { stepSequence(dt, d, s, t); log.push([s.designId, s.position.toFixed(2), s.linesVisibility.toFixed(2), s.stretchProgress.toFixed(2)].join(" ")); } console.log(log.join(" | "));'`
   Expect: `paper-dart 0.00 0.50 1.00 | paper-hat 0.00 0.00 0.75 | paper-hat 0.00 0.33 1.00 | paper-hat 0.29 1.00 1.00 | paper-hat 4.86 1.00 1.00`
4. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 1, position: 7, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: null, linesOn: true, position: 0 }; stepSequence(2.6, d, s, t); const log = [s.position, s.linesVisibility.toFixed(4)]; stepSequence(1, d, s, t); console.log(...log, "|", s.linesVisibility, s.designId);'`
   Expect: `0 0.5000 | 0 paper-dart`
5. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 1, position: 7, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: "paper-dart", linesOn: false, position: 7 }; const log = []; stepSequence(0.15, d, s, t); log.push(s.linesVisibility.toFixed(4)); t.linesOn = true; stepSequence(0.15, d, s, t); log.push(s.linesVisibility.toFixed(4)); stepSequence(0.3, d, s, t); log.push(s.linesVisibility.toFixed(4), s.position); console.log(log.join(" "));' && grep -c "new [A-Z]" docs/src/fold/stepper.js`
   Expect: `0.5000 0.0000 0.5000 7`, then `0`
6. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { stepSequence } from "./docs/src/fold/stepper.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const s = { designId: "paper-dart", direction: 0, linesFade: 0, linesVisibility: 0, position: 7, stretchFromId: "paper-dart", stretchProgress: 1 }; const t = { designId: "paper-hat", linesOn: false, position: 5 }; stepSequence(2.65, d, s, t); const log = [s.designId, s.position, s.stretchFromId, s.stretchProgress.toFixed(4)]; stepSequence(0.4, d, s, t); log.push("|", s.position.toFixed(4), s.direction, s.stretchProgress, "|"); stepSequence(5, d, s, { designId: null, linesOn: false, position: 0 }); console.log(...log, s.designId, s.position, s.direction, s.linesVisibility);'`
   Expect: `paper-hat 0 paper-dart 0.5000 | 0.2857 1 1 | paper-hat 0 0 0`
   (Plan 02b's Step 3 Agent QA 1, then "Flat" from mid-fold)

### Step 3: Lines on the paper, and the checkbox

- Adds `docs/src/scene/fold-lines.js`: `drawFoldLines(canvas, sheet)`,
  which sizes the canvas and draws the sheet's `creaseLines`
  (Decisions 4, 5).
- Changes `docs/src/scene/paper.js`: the `uv` attribute, the third mesh,
  `setLinesVisibility()`, and in `setSheet()` the canvas redrawn and the
  texture replaced (Decisions 3, 4, 6).
- Adds `docs/src/ui/fold-lines-toggle.js`; changes `docs/index.html`,
  `docs/styles/main.css` (the label in the button bar) and
  `docs/src/main.js` (Decision 8).
- It should fade the design's lines in on the red side before it folds:
  dashed valleys, dash-dot-dot mountains (Manual QA 2).
- It should hide lines on faces turned away, so they drop out of view as
  the design folds (Manual QA 3).
- It should leave flat paper at rest blank (Manual QA 1, 4, 5).
- It should switch the lines off and on from a keyboard-reachable
  checkbox, with no fade time while off (Manual QA 6, 7).
- It should draw sharp, steady lines without flicker on the paper
  (Manual QA 3).
- It should free the old texture at each switch (Manual QA 8).

**Agent QA**

1. Do: `grep -c '<input type="checkbox" checked' docs/index.html`
   Expect: `1`
2. Do: `grep -n "SRGBColorSpace\|setLineDash\|dispose()" docs/src/scene/fold-lines.js docs/src/scene/paper.js`
   Expect: at least one `SRGBColorSpace`, one `setLineDash` and one
   texture `dispose()`
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, every file under `docs/src/` and
   `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser each design's fold lines fade in on the red side before it
folds and out once it is flat, switchable from the "Fold lines"
checkbox, with a clean console, and with Decision 5's line sizes kept or
retuned by eye at Manual QA 2 and 3.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the page after loading.
   - **Expect:** the plain red square with no lines; the three buttons and
     a ticked "Fold lines" checkbox along the bottom. The console shows no
     errors or warnings.
2. **Do:** click "Paper Dart" and watch the first second closely.
   - **Expect:** black lines fade in over about 0.6 s, all meeting at
     the middle of the top edge: dashed lines for valleys, dash-dot-dot
     lines for mountains, mirror-symmetric left to right, with a dashed
     valley line straight down the middle. Only then does the first fold
     start; the dart takes about 5.5 s.
3. **Do:** watch the dart fold, then zoom to 200% (Cmd and +) on the
   finished dart, and reset zoom (Cmd and 0).
   - **Expect:** each fold closes along a printed line. Lines vanish as
     flaps turn their off-white backs to you; none show on the off-white
     side. Lines stay sharp and steady, with no flicker against the red.
   - **Why:** z-fighting between the line mesh and the paper, and lines
     leaking onto the back.
4. **Do:** click "Flat".
   - **Expect:** the dart unfolds, then the lines fade out quickly, about
     a third of a second, leaving the plain red square.
5. **Do:** click "Paper Dart", wait for it to finish, then click "Paper
   Hat".
   - **Expect:** the dart unfolds; the lines fade out; the blank square
     stretches to the tall sheet; the hat's lines fade in (a horizontal
     mountain line across the middle, diagonals and two horizontal valley
     lines); the hat folds. About 7.25 s in all; the paper is never seen
     flat with the wrong design's lines.
6. **Do:** press Tab until the checkbox has a visible focus ring, press
   Space to untick it while the hat is folded, then Space again.
   - **Expect:** the lines fade out where the paper is, then back in.
7. **Do:** untick "Fold lines", click "Flat", then "Paper Dart". Once the
   dart has folded, press Cmd+R (a normal reload, not a hard one) and
   click "Paper Dart" again.
   - **Expect:** the hat's lines fade out at once; after that, no lines
     at any point, and no pause once the hat is flat beyond the sheet's
     stretch: the dart folds in about 5 s. After the reload, lines fade
     in before the dart folds only if the checkbox shows ticked,
     whichever state the browser restored.
   - **Why:** a browser can restore a checkbox's state on reload without
     firing its `change` event.
8. **Do:** with the lines on, click "Paper Dart" and let it finish. In
   Sources, set a breakpoint on the line of `src/main.js` that calls
   `renderer.render(scene, camera)`; when it pauses, read
   `renderer.info.memory.textures` in the console, then remove the
   breakpoint and resume. Switch designs three times ("Paper Hat",
   "Paper Dart", "Paper Hat"), letting each finish, then read it again
   the same way.
   - **Expect:** the same count both times, 1 (derived: the line
     texture is the scene's only texture). Read before any lines have
     shown, it is 0, since a hidden mesh's texture is not uploaded.
   - **Why:** a texture not disposed at each switch leaks about 22 MB of
     GPU memory.
9. **Do:** in the Performance panel, record step 5 with the lines on.
   Then open the live site, `https://richplastow.com/origami-simulator/`,
   which shows Plan 02b, without lines, until this work is pushed, and
   record the same switch there.
   - **Expect:** steady frames; any long task sits while the sheet is
     blank, not during a fold; frame times close to the live site's.
     Note the frame time and the longest task on both, for `/done-plan`
     to record.
10. **Do:** in device mode, choose a phone such as iPhone 12 Pro
    (390 × 844), reload, and run step 5.
    - **Expect:** the lines are legible, and the buttons and checkbox are
      visible and work.

**Looks wrong, but isn't:**

- A fold leaves half a mountain line's width showing along its folded
  edge, and closes over a valley line, whether the layer started face up
  or face down: the line lies along the crease, half on each face.
- A crease's bridging strip shows the line's colour along the fold.
- Unticking "Fold lines" mid-fold leaves the lines showing until the
  design finishes folding, and only then fades them out: per Decision 7,
  the lines fade only at rest or at position 0.

## Audit

- **2026-11-10T01:02:55Z** — **drafted**: each design's crease pattern
  from the engine, printed through a canvas texture on a third mesh, with
  0.3 s and 0.6 s fades in the sequence and a "Fold lines" checkbox;
  agent adopted the research's canvas-texture proposal and proposed the
  texture's replacement at each switch, the square-texel canvas, the
  eased fades, the stepper's fields and the checkbox module; line width
  and dash lengths left `_TBD_`.
- **2026-11-10T10:33:05Z** — **reviewed**: no major issues; orchestrator
  rulings folded in: Decision 5's sizes (0.5, 3, 1.5 and 0.5 mm, ruled
  by the Lead Developer at 10:25 UTC, tunable at Manual QA) and Done
  when; the dart's pattern now 15 lines, 9 valley (1,109.8 mm) and 6
  mountain (648.6 mm), after Plan 02a's fold 5 became a valley, and the
  hat's 7 / 4 / 3, both mirror-symmetric, all recomputed on the current
  engine in a scratch script; smoothstep() from `fold/easing.js`; Manual
  QA 9 and Decision 9 measured against the live site, Plan 02b having
  no baseline. Minor fixes: Decision 1 names the placement before the
  fold and leaves the ends unordered; Decision 3 states r187's
  `flipY = true` and the canvas drawn top edge up, and that
  `colorSpace` is set after construction; Decision 7 fades towards
  `linesOn` at position 0, and Step 2 gains Agent QA 6 (Plan 02b's
  checks with the lines off); Manual QA 2, 5, 7 and 8 corrected (0.6 s,
  7.25 s, the untick's fade-out, a first texture reading of 1 after the
  lines show, not 0 at load); provenance dropped from Decision 3. Step 2
  figures and Decision 7 timings (5.5, 2.75, 7.25 s) checked on a
  scratch stepper; Three.js APIs rechecked against r187 source.
- **2026-11-10T10:39:37Z** — **implemented**: Steps 1 to 3 done.
  `engine.js` adds `creaseLines` (crossingSegment(), pointBetween(),
  oppositeType()); `stepper.js` adds the fade phase and
  `FADE_IN_SECONDS`, `FADE_OUT_SECONDS`; new `scene/fold-lines.js` and
  `ui/fold-lines-toggle.js`; `paper.js` adds the `uv` attribute, the
  third mesh, setLinesVisibility() and the texture swap in setSheet();
  `index.html`, `main.css` and `main.js` add the checkbox. Step 1 Agent
  QA 1 and 2, Step 2 Agent QA 1 to 6 and Step 3 Agent QA 1 and 2 pass,
  each failing first where it could. Decision 8's HTML gains the
  `data-fold-lines` hook, and the toggle passes its state once at
  connection; `polygonOffset` is left off, as Decision 3 holds it in
  reserve. Manual QA unchanged.
- **2026-11-10T10:39:37Z** — **verified**: agent checks pass: 6 changed
  modules parse; no line over 80 columns bar the favicon's `data:` URL;
  `/`, `styles/main.css` and all 14 modules under `src/` served with
  200; vendored checksums match; browser not run.
- **2026-11-10T10:46:30Z** — **quality-checked**: Fixed: none at fix
  tier. First-run polish: `engine.js` applyFold() no longer shadows the
  reflection's `a` and `b` when testing a placement's determinant;
  `fold-lines-toggle.js` doc comment reworded ("once on connection").
  Manual QA 7 gains a normal reload, proving the toggle's state passed at
  connection; "Looks wrong, but isn't" gains the mid-fold untick, which
  per Decision 7 fades only at rest. Deferred: texture anisotropy, should
  Manual QA 3 show lines blurring at grazing angles (not in the
  Decisions); `polygonOffset`, held in reserve by Decision 3 until
  Manual QA 3 shows z-fighting; the crossing test duplicated in
  clipPolygon() and crossingSegment(), small and clear. Verified fine:
  every Agent QA block re-run and passing; stepper edge cases (untick
  mid-fade-in, mid-fold and mid-stretch, "Flat" mid-fade-in, lines off
  but showing at a switch, a switch mid-fold) settle identically at
  1/60, 1/7 and 0.5 s steps; mutants caught: determinant sign, no
  reversal, placement after the fold, dropped corner ends, a line per
  moving face, "Flat" keeping lines, one fade time, no fade at rest,
  checkbox ignored; the return ignoring `linesVisibility` is caught only
  by Manual QA 2 and 6; equivalent mutants: `direction` left non-zero
  while fading (internal only) and `state.position === 0` in
  `isLeaving` (implied by the enclosing test). Three.js sweep: geometry
  and texture disposed in setSheet(), map swapped before the old
  texture's dispose(), each CanvasTexture its own Source, so r187's
  `info.memory.textures` stays at 1; a map swap needs no program change
  (r187 keys programs on `HAS_MAP`); `flipY`, `colorSpace` default and
  CanvasTexture's `needsUpdate` checked in r187 source; the per-frame
  path allocates nothing; resize untouched; canvas mapping and sizes
  (2,048 square, 1,448 × 2,048) derived. Agent checks pass on the Lead
  Developer's server on 1111; browser not run.
- **2026-11-10T10:53:04Z** — **done**: each design's crease pattern
  printed on the red side, fading in before folding and out once flat,
  behind a "Fold lines" checkbox; Manual QA passed (Lead Developer,
  2026-11-10); research file `02-simple-folds-research.md` moved to
  `plans/done/` with this plan.
