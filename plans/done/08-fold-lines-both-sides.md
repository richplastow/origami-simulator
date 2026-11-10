---
title: Print fold lines on both sides of the paper
description: Prints each design's crease pattern on the white side too, each crease as the opposite kind beneath its line on the front, in the front's colour and fading with it.
type: plan
---

## Context

- Delivers fold lines on the paper's white side: every crease printed
  directly beneath its line on the front, as the opposite kind, in the
  colour the front has, so that paper seen from behind, or turned over,
  shows where it folds.
- Implements
  [Ruling 1](../todo/07-design-research.md#ruling-1-fold-lines-on-both-sides-of-every-sheet)
  of [07-design-research.md](../todo/07-design-research.md).
- Depends on [Plan 02c](./02c-printed-fold-lines.md), whose lines,
  fades and checkbox it extends; on
  [Plan 04](./04-paper-colours.md), whose colour fade the new
  lines follow; and on [Plan 06](./06-self-shadows.md), whose
  shadows it must leave as they are. It feeds
  [Plan 09](./09-turn-the-paper-over.md), which turns the paper over.
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10:
  [map_fragment](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/map_fragment.glsl.js),
  [alphamap_fragment](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/alphamap_fragment.glsl.js)
  (`diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g`),
  [uv_vertex](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/uv_vertex.glsl.js)
  and
  [WebGLPrograms.js](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgl/WebGLPrograms.js)
  (channel 0 is `uv` for `map` and `alphaMap` alike),
  [Texture.js](https://github.com/mrdoob/three.js/blob/r187/src/textures/Texture.js)
  (`colorSpace` NoColorSpace, `flipY` true, `premultiplyAlpha` false,
  `channel` 0 by default),
  [meshlambert.glsl.js](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderLib/meshlambert.glsl.js),
  [MeshLambertMaterial.js](https://github.com/mrdoob/three.js/blob/r187/src/materials/MeshLambertMaterial.js),
  [Material.js](https://github.com/mrdoob/three.js/blob/r187/src/materials/Material.js)
  (`depthFunc` defaults to LessEqualDepth) and
  [WebGLRenderer.js](https://github.com/mrdoob/three.js/blob/r187/src/renderers/WebGLRenderer.js)
  (opaque objects render before transparent ones).

## Decisions

1. **One pattern, drawn for either side**:
   `drawFoldLines(canvas, sheet, side)` in
   `docs/src/scene/fold-lines.js`, where `side` is `"front"` or
   `"back"`. The back's lines are drawn at the same canvas coordinates
   as the front's, since both sides' meshes share one geometry and its
   UVs, and with the two dash patterns swapped: a valley line on the
   front is a mountain line on the back. The engine's `creaseLines`
   stay as they are, typed as seen from the front.
   - Seen from behind, this pattern appears mirrored left to right, as
     Ruling 1 says: the mirroring comes from looking at the sheet's
     other face, so the canvas itself is never mirrored.
   - Each back line lies directly beneath its front line on every face,
     turned over by the folds or not: both meshes draw the same
     triangles through the same UVs, so a texel lands on the same sheet
     point on either side.
2. **The back's lines are drawn white on opaque black**, a coverage
   mask that carries no colour of its own: the canvas is first filled
   with `FOLD_LINE_BACK_FILL_COLOR = 0x000000`, then its lines are
   stroked in `FOLD_LINE_BACK_COLOR = 0xffffff`. The front's stay black
   lines on a clear canvas, as today, under the new name
   `FOLD_LINE_FRONT_COLOR`.
   - A mask, not white lines on a clear canvas: a canvas uploads with
     its alpha not premultiplied (`Texture.premultiplyAlpha` is false),
     so a clear texel is black at zero alpha, and filtering and mipmaps
     would mix that black into a line's colour, darkening its edges and,
     minified, the whole line. An opaque canvas has no such texels.
3. **A fourth mesh shows them**, sharing the paper's geometry, with a
   canvas and a texture of its own:
   `MeshLambertMaterial({ alphaMap, color, flatShading: true,
   opacity: 0, side: BackSide, transparent: true })`. r187 multiplies
   the material's opacity by the `alphaMap`'s green channel and leaves
   its colour alone, so the mask's white lines come out as lines of the
   material's colour, and its black ground as nothing.
   - The `alphaMap` texture keeps CanvasTexture's default `colorSpace`,
     NoColorSpace, so coverage is read linearly; the front's `map` stays
     SRGBColorSpace. It reads the same `uv` channel through the same
     default `flipY` as the front's `map`, so the back's lines land
     where Decision 1 says.
   - It is lit and receives shadows, as the paper's back does, so a
     line in shade darkens with the paper round it. Unlit, a coloured
     line would stay bright in the shade. It casts no shadow.
   - It is drawn at the back mesh's own depth, kept from fighting it as
     the front's line mesh is kept from fighting the front: it joins
     `meshes` in the stretch group, so its vertices land exactly where
     the back mesh's do; `transparent: true` draws it after the opaque
     paper; and Material's default `depthFunc`, LessEqualDepth, passes
     a fragment at equal depth. No `polygonOffset` is used.
   - The front's line mesh stays as it is: unlit, since black is black
     in any light.
4. **The colour follows the front's**: the material is created with the
   front's colour, and setFrontColorFade() copies the front material's
   colour to it after mixing, so the lines fade in step with the paper
   and need no fade state of their own.
5. **Both sides' lines show and hide together**: setLinesVisibility()
   sets both materials' opacity and both meshes' `visible`.
   `docs/src/fold/stepper.js` and the "Fold lines" checkbox are
   untouched.
6. **setSheet() swaps both patterns**: it redraws both canvases, gives
   each material a new texture (the front's `map`, the back's
   `alphaMap`), and disposes of both old textures.
7. **Contrast is accepted as it falls**: against the back's off-white,
   the lines measure red 4.16:1, blue 3.04:1, pink 2.52:1, green 2.47:1
   and yellow 1.62:1 (WCAG's formula, computed 2026-11-10 from
   `PAPER_COLORS` and `PAPER_BACK_COLOR`, unlit). The palette does not
   change here. Manual QA 4 judges the faintest by eye.
8. **Performance**: one more 2,048 px texture, uploaded when the lines
   first show and at each switch of design, at rest; one more draw
   while the lines show; and one colour copied per frame of a colour
   fade. Nothing is added to the fold's per-frame path, so the only
   measurement is the optional Manual QA 11.

## Steps

### Step 1: Draw either side's pattern

- Changes `docs/src/scene/fold-lines.js`: the `side` parameter, the
  three colour constants, the back's black fill, and the
  `@fileoverview` and doc comment, which say "the front" today
  (Decisions 1, 2).
- It should draw the front as before: black, each line of its own kind,
  on a clear canvas (Agent QA 1).
- It should draw the back white on a canvas filled black, with every
  line of the opposite kind (Agent QA 1).
- It should draw both sides' lines at the same canvas coordinates
  (Agent QA 1).

**Agent QA**

1. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { cutSheet } from "./docs/src/fold/engine.js"; import { drawFoldLines } from "./docs/src/scene/fold-lines.js"; const draw = (design, side) => { const dashes = []; const fills = []; const points = []; const context = { beginPath() {}, fillRect() { fills.push(this.fillStyle); }, lineTo: (x, y) => points.push(x, y), moveTo: (x, y) => points.push(x, y), setLineDash: (dash) => dashes.push(dash.length), stroke() {} }; drawFoldLines({ getContext: () => context }, cutSheet(design), side); return { points: points.join(), text: [dashes.filter((n) => n === 2).length, dashes.filter((n) => n === 6).length, context.strokeStyle, fills.join("+") || "clear"].join(" ") }; }; for (const design of [PAPER_DART, PAPER_HAT]) { const front = draw(design, "front"); const back = draw(design, "back"); console.log(front.text, "|", back.text, "|", front.points === back.points); }'`
   Expect: `9 6 #000000 clear | 6 9 #ffffff #000000 | true`, then
   `4 3 #000000 clear | 3 4 #ffffff #000000 | true` (valley lines,
   mountain lines, line colour and fill, front then back, for the dart
   then the hat). Before the work it prints
   `9 6 #000000 clear | 9 6 #000000 clear | true`, then
   `4 3 #000000 clear | 4 3 #000000 clear | true`: the back as the
   front (both run 2026-11-10, the after line against a throwaway
   implementation)
2. Do: `node --check docs/src/scene/fold-lines.js`
   Expect: prints nothing.

### Step 2: The back's lines on the paper

- Changes `docs/src/scene/paper.js`: the back's canvas, texture,
  material and mesh; setFrontColorFade(), setLinesVisibility() and
  setSheet(); createLinesTexture(), which gains a `colorSpace`
  argument, SRGBColorSpace for the front's `map` and NoColorSpace for
  the back's `alphaMap`; and the `@fileoverview` and createPaper()'s
  doc comment (Decisions 3 to 6).
- Changes `docs/src/scene/paper-colors.js`: the comment on
  `PAPER_COLORS` gains the back lines' contrasts (Decision 7).
- It should show every crease on the white side, beneath its line on
  the front (Manual QA 1, 2, 7).
- It should print each as plain dashes where the fold comes towards
  whoever looks at that side, and dash-dot-dot where it goes away
  (Manual QA 1, 7).
- It should give the white side's lines the front's colour, at load and
  after every colour change, fading with the paper (Manual QA 3, 4).
- It should draw the white side's lines in one even colour to their
  edges, with no dark rim, even on a surface tilted steeply away
  (Manual QA 2).
- It should fade both sides' lines in and out together, and switch both
  with the checkbox (Manual QA 5, 6).
- It should darken a line in shade as it darkens the paper round it
  (Manual QA 8).
- It should swap both sides' patterns when the design changes, leaving
  no line of the old design (Agent QA 2; Manual QA 9).
- It should leave the front's lines, the colours, the grain and the
  shadows as they were (Manual QA 1, 10).

**Agent QA**

1. Do: `grep -c 'MeshLambertMaterial(' docs/src/scene/paper.js`
   Expect: `2` (the paper's sides and the back's lines; `1` before)
2. Do: `grep -c '\.dispose()' docs/src/scene/paper.js`
   Expect: `3` (the old geometry and each side's old texture; `2`
   before)
3. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, `/src/scene/fold-lines.js`, `/src/scene/paper.js` and
   `/src/scene/paper-colors.js`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser every white surface of a folding design carries that
design's creases in the paper's colour, fading as the colour changes,
with a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** click "Paper Dart" and watch the first three folds.
   - **Expect:** black lines fade in on the coloured front, as before.
     As each top corner turns over towards you, its white back shows
     lines in the paper's colour, of both kinds: plain dashes and
     dash-dot-dot. The third fold bends the left corner's flap towards
     you along one of its plain-dash lines. The console shows no errors
     or warnings.
2. **Do:** once the dart has finished, drag to turn it right round, and
   tilt it both ways.
   - **Expect:** every white surface carries lines in the paper's
     colour, and every coloured surface black lines. The lines are
     sharp, lie on the creases, and neither flicker nor swim as the
     dart turns. On white surfaces, the lines are one even colour to
     their edges, with no dark rim, even where a surface tilts steeply
     away.
   - **Why:** each line mesh is drawn at its paper mesh's own depth,
     which only matching vertices and the equal-depth test keep from
     fighting (Decision 3); and a mask of white lines on black keeps
     filtering from darkening them (Decision 2).
3. **Do:** click each colour swatch in turn, then two swatches in quick
   succession.
   - **Expect:** the white sides' lines fade to each new colour
     together with the coloured side, never ahead of it or behind. The
     black lines stay black.
4. **Do:** choose yellow, and look at a white surface.
   - **Expect:** the lines are there, though faint. Note whether they
     are plain enough, for `/done-plan` to record.
5. **Do:** untick "Fold lines", then tick it again.
   - **Expect:** the lines on both sides fade out together, and back in
     together.
6. **Do:** click "Flat", and drag to see both sides of the flat sheet.
   - **Expect:** the lines on both sides fade out as the sheet comes to
     rest, and both sides are blank.
7. **Do:** reload. Drag about half a turn, so that the white back faces
   you. Click "Paper Hat" and watch.
   - **Expect:** lines in the paper's colour fade in on the white back.
     The first fold brings the top half towards you, along a line of
     plain dashes across the middle, and leaves a coloured surface
     facing you, with black lines. The next two folds carry the corners
     away from you, along dash-dot-dot lines.
   - **Why:** proves each crease prints as the opposite kind on the
     back: from the front, the first fold goes away along a
     dash-dot-dot line.
8. **Do:** click "Paper Dart", let it finish, and turn it until a white
   surface lies partly in another part's shadow.
   - **Expect:** where the shadow falls, the lines darken with the
     paper. They do not stay bright.
9. **Do:** click "Paper Hat", let it finish, and turn it about.
   - **Expect:** only the hat's creases show, on both sides. No line
     crosses the paper where the hat has no fold.
   - **Why:** a texture not swapped would leave the dart's lines on the
     back.
10. **Do:** look over the paper as a whole, folded and flat.
    - **Expect:** grain, colours and shadows as before this plan.

### Optional, for a later pass

11. **Do:** in the Performance panel, record "Paper Dart" folding, then
    "Paper Hat".
    - **Expect:** steady frames, with no long frame at the switch of
      design. Note the frame times, for `/done-plan` to record.

**Looks wrong, but isn't:**

- Yellow lines on the white side are faint, and green and pink ones
  soft (Decision 7).
- The flat sheet at rest is blank on both sides: lines show only while
  a design is folding or folded.
- A line on the white side is a little darker or lighter than the
  coloured side in the same light: each side is lit by its own angle to
  the light.

## Audit

- **2026-11-10T14:26:45Z** — **drafted**: the crease pattern drawn for
  either side, the back's as white lines of the opposite kind on a
  fourth mesh whose material takes the front's colour; the Lead
  Developer ruled both sides, the opposite kind beneath each line, and
  the front's colour fading with it; agent proposed the lit Lambert
  material that receives shadows, the white canvas tinted by the
  material, accepting the measured contrasts, and reading the black
  front lines, the fades and the checkbox as unchanged; Step 1's
  figures run against the current code through a stub canvas.
- **2026-11-10T14:44:51Z** — **reviewed**: Minor fixed: Decision 1 says
  the mirroring Ruling 1 names is seen from behind, not drawn, and that
  each back line
  lies beneath its front line on every face; Decision 3 names the
  equal-depth mechanism the line meshes share; Manual QA 1 names both
  kinds on the flaps and the third fold; Context lists Material.js and
  WebGLRenderer.js. Major left open: Decision 3's white lines on a clear
  canvas as `map` darken at their edges and when minified, as filtering
  mixes in the clear texels' black; the fix changes Decisions 2 and 3.
- **2026-11-10T14:47:16Z** — **ruled**: by the orchestrator, by default,
  overturnable at QA: the back's lines are a mask, white on a canvas filled black
  (`FOLD_LINE_BACK_FILL_COLOR`), shown as the material's `alphaMap`
  in NoColorSpace rather than as its `map`; folded into Decisions 2,
  3 and 6, Steps 1 and 2, Step 1's Agent QA (re-run before and after)
  and Manual QA 2; `alphaMap`'s uv channel, `flipY` and colour
  space checked against the r187 source.
- **2026-11-10T14:50:54Z** — **implemented**: Steps 1 and 2;
  `docs/src/scene/fold-lines.js` (`side` argument, front, back and
  back-fill colour constants, the back's black fill and swapped dashes,
  a toCssColor() helper), `docs/src/scene/paper.js` (the back's
  lines canvas, `alphaMap` texture, Lambert material and mesh; both
  fades, the visibility switch and setSheet() cover both sides;
  createLinesTexture() takes a colour space; the front's line canvas,
  material and mesh renamed `frontLines…`) and
  `docs/src/scene/paper-colors.js` (comment only); Step 1 Agent QA failed
  as expected before and passes after, Step 2 Agent QA 1 and 2 went from
  `1` and `2` to `2` and `3`; Manual QA unchanged, walked against the
  labels in `docs/index.html`.
- **2026-11-10T14:52:30Z** — **verified**: agent checks pass: every
  module under `docs/src/` parses, no line over 80 columns in the changed
  files, `/` and the three changed files served with status 200, vendored
  checksums match those recorded; browser not run.
- **2026-11-10T14:55:25Z** — **quality-checked**: Fixed: none at fix
  tier; first-run polish of new code only, the `PAPER_COLORS` comment in
  `docs/src/scene/paper-colors.js` reworded from "they fall as they are"
  to "they measure lower, and are kept as they are" (figures recomputed,
  all five match). Deferred: Step 1 Agent QA's stub records no call
  order, so a black fill drawn after the strokes passes it (Manual QA 1
  catches it: no lines on white); an `alphaMap` in SRGBColorSpace only
  thins line edges, a near-equivalent mutant only Manual QA 2 might show;
  the back's lines carry no grain, invisible at 0.5 mm. Verified fine:
  resources (both line textures disposed of in setSheet(), Step 2 Agent QA
  2 counts 3; canvases, materials and grain live as long as the page);
  per-frame path (setFrontColorFade()'s Color.copy() and
  setLinesVisibility()'s four assignments allocate nothing); call order
  in `docs/src/main.js` (no fade at load, the material starts in the
  front's colour); depth (shared geometry in `meshes`, transparent,
  LessEqualDepth, the front lines' existing pattern); resize and input
  untouched; r187 APIs (alphamap_fragment reads `.g`, Lambert multiplies
  opacity before lighting, flat-shaded normals as the back mesh's,
  Texture defaults, `alphaMap` wants NoColorSpace); the orchestrator's
  mask ruling holds its stated reason; mutants caught by Step 1 Agent QA:
  back mirrored, dashes not swapped, white fill, black back strokes, side
  never matched; Manual QA labels match `docs/index.html`; agent checks
  pass; browser not run.
- **2026-11-10T15:04:18Z** — **done**: the Lead Developer reports Manual
  QA 1 to 10 passed in the browser, the yellow lines included, keeping the
  orchestrator’s `alphaMap` ruling; Manual QA 11 (optional) left for a
  later pass.
