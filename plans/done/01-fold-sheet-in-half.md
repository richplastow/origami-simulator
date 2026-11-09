---
title: Fold a square sheet in half
description: Replaces the spinning triangle with a lit, two-tone square of paper that three buttons fold flat, in half along the horizontal crease, or along a diagonal.
type: plan
---

## Context

- Delivers the proof of concept for the folding mechanic: a square sheet
  cut by four creases into eight right triangles, folded rigidly in half
  along one crease at a time, animated, and lit so the fold reads clearly.
- Replaces all current app code, which only proved that Three.js runs on
  GitHub Pages: the spinning triangle, its CSS colour and its camera fit.
- First plan; no dependencies. Later plans build on it: finer crease
  patterns, several folds at once, better controls, paper colour choice,
  orbit controls, shadows, a proper phone layout, then preset models such
  as the crane. Those need a different fold model, to be settled in an ADR
  before the multi-fold plan.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-09, the release vendored per
  [CLAUDE.md](../../CLAUDE.md#threejs).

## Decisions

1. **Paper**: a 15 cm square (`PAPER_SIZE_METERS = 0.15`), a common
   [origami paper](https://en.wikipedia.org/wiki/Origami_paper) size of
   about 6 in. It lies flat in the XY plane, centred on the origin, its
   front facing +Z, towards the camera. Real size keeps later work, such
   as paper thickness, in true units.
2. **Crease pattern data**: plain data built by a pure function, in paper
   coordinates `[x, y]` in metres. Point 0 is the centre; points 1–8 run
   anticlockwise from the right edge's midpoint, so each triangle lists
   the centre and two neighbours anticlockwise as seen from the front.
   Each crease runs between two boundary points through the centre, and
   its `from` → `to` direction is its fold axis. Creases are listed A-Z
   by `id`; `tl`, `br`, `bl`, `tr` name the corners. The pattern also
   carries its `sizeMeters`.

   ```json
   {
     "creases": [
       { "from": 6, "id": "diagonal-bl-tr", "to": 2 },
       { "from": 4, "id": "diagonal-tl-br", "to": 8 },
       { "from": 5, "id": "horizontal", "to": 1 },
       { "from": 7, "id": "vertical", "to": 3 }
     ],
     "points": [
       [0, 0],
       [0.075, 0], [0.075, 0.075], [0, 0.075], [-0.075, 0.075],
       [-0.075, 0], [-0.075, -0.075], [0, -0.075], [0.075, -0.075]
     ],
     "sizeMeters": 0.15,
     "triangles": [
       [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5],
       [0, 5, 6], [0, 6, 7], [0, 7, 8], [0, 8, 1]
     ]
   }
   ```

3. **Fold state**: one crease and one signed angle. Positive is a valley
   fold and negative a mountain fold, both measured from the paper's front
   face, so the convention holds once orbit controls arrive. Flat is angle
   0 with no crease. The animation target has the same shape.

   ```json
   { "angleRadians": -3.106686, "creaseId": "horizontal" }
   ```

   ```json
   { "angleRadians": 0, "creaseId": null }
   ```

4. **Symmetric rigid fold**: the crease stays put and each side turns by
   half the angle about the crease axis, `from` → `to`. A point turns by
   `side × angle / 2`, where `side` is the sign of the Z component of
   `axis × point` (0 on the crease). A valley therefore brings both sides
   towards +Z. Every crease passes through the centre, so every point keeps
   its distance from the centre: the paper never leaves a sphere of radius
   half the diagonal (0.1061 m). The camera framing and the geometry's
   bounding sphere are therefore fixed for the whole plan.
5. **Fully folded is 178°** (`MAX_FOLD_RADIANS = 3.106686`), not 180°, so
   the two halves never lie in one plane and flicker (z-fighting), and the
   fold reads like paper with some thickness.
6. **Animation**: the fold angle moves towards the target at a constant
   speed, one full fold (0 to 178°) taking `FOLD_DURATION_SECONDS = 1`.
   When the target names a different crease, the paper unfolds to flat
   first, then folds the new crease; on reaching flat the state takes the
   target's crease in the same step, but time left over in that frame is
   dropped. A sheet already flat takes the target's crease at once and
   folds for the whole step. A button pressed mid-animation only changes
   the target, so the motion continues from the current angle, without a
   jump. The step reports whether the state changed, so positions are
   rewritten only while the paper moves. Motion scales with the frame's
   elapsed time (CLAUDE.md, [Three.js](../../CLAUDE.md#threejs)).
7. **Pure modules**: `paper/crease-pattern.js`, `fold/kinematics.js`,
   `fold/animation.js` and `camera/fit.js` import nothing bare, so Node
   runs them in Agent QA. Function arguments are A-Z:
   `createCreasePattern(sizeMeters)`,
   `writeFoldedPositions(foldState, pattern, positions)`, which writes
   into a `Float32Array` of 27 numbers, and
   `stepFold(deltaSeconds, state, target)`, which mutates `state`.
   `writeFoldedPositions()` and `stepFold()` allocate nothing per call, as
   the per-frame path must not.
8. **Geometry**: one indexed BufferGeometry (9 points, 8 triangles) whose
   position BufferAttribute uses `setUsage(DynamicDrawUsage)` and is
   rewritten in place, then flagged with `needsUpdate = true`. Two meshes
   share it: the front with `side: FrontSide`, the back with
   `side: BackSide`. A LineSegments for the crease lines has its own
   geometry and index (the four creases as eight centre-to-edge segments)
   but shares the same position attribute, so the lines always follow the
   paper. Bounding spheres are computed once, flat, and stay valid
   (Decision 4). A constant normal attribute of (0, 0, 1) is set once,
   because Lambert's vertex shader reads `normal`
   ([beginnormal_vertex](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/beginnormal_vertex.glsl.js));
   flat shading ignores it.
9. **Materials**: MeshLambertMaterial with `flatShading: true`, matte like
   paper, one even shade per triangle. Flat shading derives each normal
   from screen-space derivatives
   ([normal_fragment_begin](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js)),
   so it faces the camera whatever the winding, and both sides of the paper
   are lit by the light on the camera's side (inferred from that source;
   confirmed by Manual QA). The paper materials set `polygonOffset: true`,
   `polygonOffsetFactor: 1` and `polygonOffsetUnits: 1`, pushing the paper
   just behind the crease lines that lie on it. Crease lines use
   LineBasicMaterial, black, `transparent: true`, `opacity: 0.2`, so they
   darken both the red and the white side faintly.
10. **Colours** (starting values, tuned at Manual QA): front
    `PAPER_FRONT_COLOR = 0xd9342b` (origami red), back
    `PAPER_BACK_COLOR = 0xf4f1ea` (off-white), crease lines
    `CREASE_LINE_COLOR = 0x000000`. They are JavaScript constants in
    `scene/paper.js`, not CSS, and do not follow the colour scheme: they
    are a physical object's colours, which the lights already change, and a
    later plan adds colour choice. The page background still follows the
    colour scheme through `main.css`.
11. **Camera**: a PerspectiveCamera with a 30° vertical field of view
    (`CAMERA_FOV_DEGREES`, degrees as Three.js takes them), for a little
    perspective. It is raised 20° above the horizontal XZ plane, turned
    from the +Z axis towards +Y (`CAMERA_ELEVATION_RADIANS`, no sideways
    offset), looking at the origin, so the flat square appears
    as a trapezoid, wider at the top, and the folded paper never shrinks to
    a line. Its distance is
    `distanceToFitSphere(aspect, fovDegrees, radius)` for the half-diagonal
    times `FRAME_MARGIN = 1.1`, leaving room for the buttons. Near 0.01 m,
    far 10 m (`CAMERA_NEAR_METERS`, `CAMERA_FAR_METERS`), suited to a 15 cm
    sheet about half a metre away.
12. **Sphere fit**: `distanceToFitSphere()` replaces `distanceToFitCircle()`
    in `camera/fit.js`. It returns `radius / sin(halfFov)`, where
    `halfFov` is the smaller of the vertical and horizontal half-angles
    (horizontal = `atan(tan(verticalHalf) × aspect)`). A circle facing the
    camera fits at `radius / tan`, but folding moves paper towards the
    camera, so a sphere is the right bound.
13. **Lights** ("behind the user's right shoulder"): a DirectionalLight at
    `(0.5, 1, 1)` m (`LIGHT_POSITION`), to the right, above and on the
    camera's side, shining at its default target, an Object3D at the origin
    ([DirectionalLight.js](https://github.com/mrdoob/three.js/blob/r187/src/lights/DirectionalLight.js)),
    intensity 2.5. An AmbientLight of intensity 1 fills faces turned away
    from it, so they never go black. In r187 Lambert shading, a face's
    colour is its material colour × (2.5 × N·L + 1) / π
    ([BRDF_Lambert](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/common.glsl.js)),
    so flat paper shows at about 0.85 of its colour and a face turned to the
    light at about 1.1, in linear light before sRGB output. Starting
    values, tuned at Manual QA. No shadows.
14. **Buttons**: three `<button type="button">`s, centred along the bottom
    edge over the canvas: "Flat", "Mountain Horizontal" and "Valley
    Diagonal", each with a `data-fold` value (`flat`,
    `mountain-horizontal`, `valley-diagonal`) that `ui/fold-buttons.js`
    maps to a target (Decision 3). Button spacing and offset are CSS custom
    properties. Out of scope, because a later plan may replace the buttons:
    pressed-state markup, announcements, reduced-motion handling and a
    phone layout. The canvas keeps a static text alternative, as CLAUDE.md
    requires.
15. **Performance**: the per-frame cost while moving is one step, 27
    numbers written and a small buffer upload, so no optimisation is
    planned. Manual QA records a baseline frame time, since later plans
    multiply the vertex count.

## Steps

### Step 1: Crease pattern and fold kinematics [P]

- Adds `docs/src/paper/crease-pattern.js`: `createCreasePattern()` and
  `PAPER_SIZE_METERS` (Decisions 1, 2).
- Adds `docs/src/fold/kinematics.js`: `writeFoldedPositions()`
  (Decisions 3, 4, 7).
- It should describe the square as 9 points, 8 triangles and the four
  creases (Agent QA 1).
- It should fold a mountain along the horizontal crease with the top edge
  turning away from the camera (Agent QA 2).
- It should fold a valley along the top-left to bottom-right diagonal with
  the top-right corner turning towards the camera (Agent QA 3).
- It should keep every point's distance from the centre, at any crease and
  angle, and leave flat paper in the Z = 0 plane (Agent QA 4).
- It should name an unknown crease id in the error it throws (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createCreasePattern } from "./docs/src/paper/crease-pattern.js"; const p = createCreasePattern(0.15); console.log(p.points.length, p.triangles.length, p.creases.map((c) => c.id).join(","));'`
   Expect: `9 8 diagonal-bl-tr,diagonal-tl-br,horizontal,vertical`
2. Do: `node --input-type=module -e 'import { createCreasePattern } from "./docs/src/paper/crease-pattern.js"; import { writeFoldedPositions } from "./docs/src/fold/kinematics.js"; const p = createCreasePattern(0.15); const out = new Float32Array(27); writeFoldedPositions({ angleRadians: -3.106686, creaseId: "horizontal" }, p, out); console.log([...out.slice(9, 12)].map((n) => n.toFixed(3)).join(" "));'`
   Expect: `0.000 0.001 -0.075` (point 3, the top edge's midpoint)
3. Do: `node --input-type=module -e 'import { createCreasePattern } from "./docs/src/paper/crease-pattern.js"; import { writeFoldedPositions } from "./docs/src/fold/kinematics.js"; const p = createCreasePattern(0.15); const out = new Float32Array(27); writeFoldedPositions({ angleRadians: 3.106686, creaseId: "diagonal-tl-br" }, p, out); console.log([...out.slice(6, 9)].map((n) => n.toFixed(3)).join(" "));'`
   Expect: `0.001 0.001 0.106` (point 2, the top-right corner)
4. Do: `node --input-type=module -e 'import { createCreasePattern } from "./docs/src/paper/crease-pattern.js"; import { writeFoldedPositions } from "./docs/src/fold/kinematics.js"; const p = createCreasePattern(0.15); const out = new Float32Array(27); let ok = true; for (const c of p.creases) for (const a of [-3.106686, -1, 0.5, 3.106686]) { writeFoldedPositions({ angleRadians: a, creaseId: c.id }, p, out); p.points.forEach(([x, y], i) => { if (Math.abs(Math.hypot(out[3 * i], out[3 * i + 1], out[3 * i + 2]) - Math.hypot(x, y)) > 1e-6) ok = false; }); } writeFoldedPositions({ angleRadians: 0, creaseId: null }, p, out); console.log(ok, out.filter((n, i) => i % 3 === 2 && n !== 0).length);'`
   Expect: `true 0`
5. Do: `node --input-type=module -e 'import { createCreasePattern } from "./docs/src/paper/crease-pattern.js"; import { writeFoldedPositions } from "./docs/src/fold/kinematics.js"; try { writeFoldedPositions({ angleRadians: 1, creaseId: "nope" }, createCreasePattern(0.15), new Float32Array(27)); } catch (e) { console.log(e.message); }'`
   Expect: `Unknown crease id: "nope"`
6. Do: `grep -v "throw new" docs/src/fold/kinematics.js | grep -c "new [A-Z]"`
   Expect: `0` (nothing allocated per call, bar the error)

### Step 2: Fold animation [P]

- Adds `docs/src/fold/animation.js`: `stepFold()`, `MAX_FOLD_RADIANS` and
  `FOLD_DURATION_SECONDS` (Decisions 5, 6, 7).
- It should move the angle towards the target at a constant speed,
  178° per second (Agent QA 1).
- It should unfold to flat before folding a different crease, and report
  when the paper is at rest (Agent QA 2).
- It should return to flat with no crease when the target is flat
  (Agent QA 3).
- It should stay put given a zero or negative delta, never moving away from
  the target or past it (Agent QA 4).

**Agent QA**

1. Do: `node --input-type=module -e 'import { stepFold } from "./docs/src/fold/animation.js"; const s = { angleRadians: 0, creaseId: null }; const t = { angleRadians: -3.106686, creaseId: "horizontal" }; console.log(stepFold(0.25, s, t), s.creaseId, s.angleRadians.toFixed(4));'`
   Expect: `true horizontal -0.7767`
2. Do: `node --input-type=module -e 'import { stepFold } from "./docs/src/fold/animation.js"; const s = { angleRadians: -3.106686, creaseId: "horizontal" }; const t = { angleRadians: 3.106686, creaseId: "diagonal-tl-br" }; const log = [stepFold(0.25, s, t), s.creaseId, s.angleRadians.toFixed(4)]; stepFold(5, s, t); log.push(s.creaseId, s.angleRadians.toFixed(4)); stepFold(5, s, t); log.push(s.creaseId, s.angleRadians.toFixed(4), stepFold(0.25, s, t)); console.log(log.join(" "));'`
   Expect: `true horizontal -2.3300 diagonal-tl-br 0.0000 diagonal-tl-br 3.1067 false`
3. Do: `node --input-type=module -e 'import { stepFold } from "./docs/src/fold/animation.js"; const s = { angleRadians: 3.106686, creaseId: "diagonal-tl-br" }; console.log(stepFold(5, s, { angleRadians: 0, creaseId: null }), s.creaseId, s.angleRadians.toFixed(4));'`
   Expect: `true null 0.0000`
4. Do: `node --input-type=module -e 'import { stepFold } from "./docs/src/fold/animation.js"; const s = { angleRadians: 3.106686, creaseId: "diagonal-tl-br" }; const t = { angleRadians: 0, creaseId: null }; console.log(stepFold(-0.02, s, t), stepFold(0, s, t), s.creaseId, s.angleRadians.toFixed(4));'`
   Expect: `false false diagonal-tl-br 3.1067`
5. Do: `grep -c "new [A-Z]" docs/src/fold/animation.js`
   Expect: `0` (nothing allocated per call)

### Step 3: Sphere fit for the camera [P]

- Rewrites `docs/src/camera/fit.js`: `distanceToFitSphere()` replaces
  `distanceToFitCircle()` (Decision 12).
- It should return the distance at which a sphere fills the smaller of the
  view's width and height (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { distanceToFitSphere } from "./docs/src/camera/fit.js"; console.log([1, 2, 0.5].map((a) => distanceToFitSphere(a, 30, 1).toFixed(4)).join(" "));'`
   Expect: `3.8637 3.8637 7.5308`
2. Do: `grep -rn "distanceToFitCircle" docs/src`
   Expect: no output

### Step 4: Lit, two-tone paper in the scene

- Adds `docs/src/scene/paper.js`: `createPaper(pattern)` returns
  `{ group, setFold(foldState) }`, the group holding the front mesh, back
  mesh and crease lines (Decisions 8, 9, 10).
- Adds `docs/src/scene/lights.js`: `createLights()` (Decision 13).
- Rewrites `docs/src/main.js`: renderer, scene, camera placement and
  resize (Decision 11), the paper drawn flat; the rotation and colour-sync
  code goes.
- Deletes `docs/src/scene/triangle.js`.
- Changes `docs/styles/main.css`: removes `--triangle-color` and the
  canvas `color`, and their comments.
- Changes `docs/index.html`: the canvas's `aria-label` describes a square
  sheet of paper.
- It should show the flat sheet facing the viewer as a red trapezoid,
  wider at the top, with faint lines dividing it into eight triangles
  (Manual QA 1).
- It should keep the whole sheet in view, unstretched and sharp, as the
  window resizes (Manual QA 8).
- It should leave no trace of the triangle (Agent QA 2).

**Agent QA**

1. Do: `for f in $(find docs/src -name '*.js'); do node --check "$f"; done`
   Expect: no output
2. Do: `grep -rn "triangle-color\|createTriangle\|TRIANGLE_\|syncTriangleColor" docs`
   Expect: no output
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing every file under `docs/src/` and `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

### Step 5: Fold buttons and animation

- Changes `docs/index.html`: adds the three buttons after the canvas
  (Decision 14).
- Changes `docs/styles/main.css`: the button bar, fixed and centred along
  the bottom edge, painted over the canvas.
- Adds `docs/src/ui/fold-buttons.js`: `connectFoldButtons(onTarget)` maps
  each button's `data-fold` to a target and passes it on.
- Changes `docs/src/main.js`: holds the fold state and target; each frame
  calls `stepFold()` with the Timer's delta, the Timer staying connected
  to the document as now, and, only when it reports a change, `setFold()`.
- It should fold, over about a second, to each button's state from flat
  (Manual QA 2, 4) and back to flat (Manual QA 3).
- It should unfold to flat before folding a different crease
  (Manual QA 5).
- It should reverse smoothly from where it is when a button is pressed
  mid-animation (Manual QA 6).
- It should never flicker where layers meet or crease lines lie on the
  paper (Manual QA 7).
- It should keep the same speed whatever the frame rate, without jumping
  after the tab is hidden (Manual QA 10, 12) _(inferred from CLAUDE.md)_.

**Agent QA**

1. Do: `grep -c "<button type=\"button\" data-fold=" docs/index.html`
   Expect: `3`
2. Do: `node --check docs/src/ui/fold-buttons.js && node --check docs/src/main.js`
   Expect: no output
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md.
   Expect: every check passes.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in the
browser the three buttons fold the lit, two-tone sheet between flat, a
mountain fold along the horizontal crease and a valley fold along the
diagonal, with a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R). The system colour scheme is light unless a step
says otherwise.

1. **Do:** look at the page after loading.
   - **Expect:** a red square sheet, centred, seen from slightly above, so
     it looks like a trapezoid, wider at the top; faint lines divide it into
     eight triangles meeting at the centre; the "Origami Simulator" heading
     at the top left; "Flat", "Mountain Horizontal" and "Valley Diagonal"
     buttons centred along the bottom. The console shows no errors or
     warnings.
2. **Do:** click "Mountain Horizontal" and watch.
   - **Expect:** over about a second, the middle horizontal line stays put
     while the top and bottom edges swing away from you. Midway, the top
     half is brighter red than the bottom half. It ends as a narrow red band
     seen from above, the two halves almost closed.
3. **Do:** click "Flat".
   - **Expect:** over about a second, the sheet opens back to the view of
     step 1.
4. **Do:** click "Valley Diagonal".
   - **Expect:** the top-left to bottom-right line stays put while the
     top-right and bottom-left corners come towards you; the off-white back
     appears on the outside of the fold. It ends as a thin off-white wedge
     standing out towards you.
   - **Why:** catches a reversed mountain/valley sign or a wrong back
     colour.
5. **Do:** with the sheet still in the valley fold, click "Mountain
   Horizontal".
   - **Expect:** the diagonal fold opens fully flat (about a second), then
     the horizontal fold closes (about a second). The sheet never passes
     through itself or stretches.
6. **Do:** click "Flat", wait for it to finish, click "Valley Diagonal",
   then click "Flat" about half a second later.
   - **Expect:** the fold reverses from where it was, smoothly, with no jump.
7. **Do:** fold "Mountain Horizontal" fully and zoom the page to 200%
   (Cmd and +); then click "Flat" and look along the crease lines.
   - **Expect:** no flickering stripes where the two layers nearly meet, and
     the crease lines stay steady on the flat sheet. Reset zoom (Cmd and 0).
   - **Why:** z-fighting between near-coincident surfaces.
8. **Do:** while a fold is animating, drag the window narrow and tall, then
   wide and short.
   - **Expect:** the whole sheet stays in view in every state, never cut
     off, stretched or blurred.
9. **Do:** click the button for the state the sheet is already in.
   - **Expect:** nothing moves.
10. **Do:** with the sheet flat, click "Mountain Horizontal" and, within
    half a second, switch to another tab (Ctrl+Tab); wait five seconds,
    then come back.
    - **Expect:** the fold continues from where it was, without a jump.
11. **Do:** switch the system to dark mode.
    - **Expect:** the page background turns dark; the paper's colours do not
      change. The console stays clean.
12. **Do:** in dev tools, open the Performance panel, record while clicking
    "Mountain Horizontal" then "Flat", and stop after both finish. Note the
    frame times; on a high-refresh screen, also compare the fold's duration
    with a 60 Hz screen if one is available.
    - **Expect:** steady frames with no long tasks; each fold takes about a
      second on either screen. Note the typical frame time for `/done-plan`
      to record in the `done` Audit entry, as the baseline for later plans.
13. **Do:** in device mode, choose a phone such as iPhone 12 Pro
    (390 × 844), reload and tap each button.
    - **Expect:** the sheet and the three buttons are visible and each fold
      works; the console stays clean.

**Looks wrong, but isn't:**

- The folded diagonal looks thinner than the folded horizontal: the camera
  is raised but not moved sideways, by design.
- The buttons may crowd or overlap the sheet on a phone; a phone layout
  comes in a later plan.
- The paper keeps its colours in dark mode, by design.
- The buttons do not show which state is active.

## Audit

- **2026-11-09T19:28:15Z** — **drafted**: rigid half-folds of an
  eight-triangle square along the horizontal and one diagonal crease, with
  three buttons, two-tone Lambert paper and a directional light; agent
  proposed the colours, light values, camera distances, frame margin and
  data shapes.
- **2026-11-09T19:39:50Z** — **reviewed**: no major issues; every Agent QA
  value recomputed and every Three.js claim checked against r187 source;
  minor fixes: camera elevation reworded as 20° above the horizontal XZ
  plane, already-flat case added to Decision 6, `sizeMeters` named in
  Decision 2, Decision 7 names its two non-allocating functions, lighting
  ratios marked as linear light, Step 1 Agent QA 3 written out in full,
  allocation greps narrowed to `new [A-Z]`, Step 5 keeps the Timer
  connected, Manual QA 10 given exact timing.
- **2026-11-09T19:57:39Z** — **implemented**: Steps 1–5 done; added
  `paper/crease-pattern.js`, `fold/kinematics.js`, `fold/animation.js`,
  `scene/paper.js`, `scene/lights.js`, `ui/fold-buttons.js`; rewrote
  `camera/fit.js` and `main.js`; deleted `scene/triangle.js`; changed
  `index.html` and `main.css`. Every Agent QA block passes; each check that
  could fail first did, for the expected reason, except the two
  `grep -c "new [A-Z]"` checks, which cannot run before their file exists.
  Step 3 Agent QA 2 passed only after Step 4 rewrote `main.js`. Manual QA 1
  now also expects the existing "Origami Simulator" heading; the rest is
  unchanged.
- **2026-11-09T19:57:39Z** — **verified**: agent checks pass: 8 modules
  parse, no long lines bar the favicon `data:` URL, `/` and every file
  under `docs/src/` and `docs/styles/` served with status 200, vendored
  checksums match; a Node simulation of the frame loop takes 1.0 s per
  fold at 60 Hz and 144 Hz; browser not run (no headless-capable browser
  on the machine), so Manual QA and the frame-time baseline are still to
  do.
- **2026-11-09T20:15:03Z** — **quality-checked**: Fixed: `stepFold()`
  clamps a negative delta to zero (Timer resets with `performance.now()`
  but updates with the frame timestamp; before, -0.016 s from flat turned a
  mountain into a +0.05 rad valley, and unfolding from 178° overshot to
  180.8°), `fold/animation.js`, Step 2 Agent QA 4 added; `writeFoldedPositions()`
  throws `Unknown crease id: "<id>"` instead of an implicit TypeError,
  `fold/kinematics.js`, Step 1 Agent QA 5 added and its allocation grep
  skips `throw new`; Step 1's flat-plane bullet cited the allocation grep,
  now Agent QA 4; Manual QA 12 records the frame-time baseline via the
  `done` entry, since Audit is append-only. Deferred: `.fold-buttons` spans
  the full width and will catch pointer events once orbit controls land;
  disposing either paper geometry frees the shared position buffer
  (`WebGLGeometries.destroyGeometry()` removes every attribute), so dispose
  both together; resize misses a device-pixel-ratio change with no CSS size
  change (pre-existing pattern); an unknown crease id throws every frame,
  since r187 `WebGLAnimation` requests the next frame before the callback;
  a crease's `from`→`to` direction cannot change a fold's result (axis
  sign cancels). Verified fine: per-frame path from `setAnimationLoop()`
  through `Timer.update()`, `stepFold()`, `setFold()` and
  `writeFoldedPositions()` allocates nothing; motion scales with delta;
  zero delta, target reached, mid-fold press and on-crease points behave;
  shared position attribute (`needsUpdate`, `DynamicDrawUsage`, flat
  bounding spheres stay valid); nothing leaves the scene; resize and pixel
  ratio; every Three.js API checked against r187 source; no addons;
  `flex-wrap`, `Object.freeze` and the startup `data-fold` error kept;
  25 mutants, all non-equivalent ones caught, equivalent: axis direction
  (K5, K7, C1), flat shortcut, `<=` vs `<`, angle-only change report.
- **2026-11-09T22:35:46Z** — **done**: the lit two-tone sheet folds between
  flat, a horizontal mountain and a diagonal valley; the Lead Developer’s
  Manual QA passed; frame-time baseline not supplied.
