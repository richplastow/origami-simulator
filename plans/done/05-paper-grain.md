---
title: Give the paper a grain
description: Covers both sides of the paper with a subtle grain generated in code, which keeps its true size while the flat sheet stretches between designs.
type: plan
---

## Context

- Delivers the paper's grain: a fine, soft mottling on both sides,
  generated at load from seeded noise. There is no image file, so no
  asset and no licence to record.
- Implements the polish rulings in
  [Scope](./02-simple-folds-research.md#scope) of
  [02-simple-folds-research.md](./02-simple-folds-research.md),
  and settles the rule that its
  [Stretchy paper](./02-simple-folds-research.md#stretchy-paper)
  section asks for: whether the grain stretches with the sheet, or
  holds still.
- Depends on [Plan 02c](./02c-printed-fold-lines.md), whose `uv`
  attribute in `docs/src/scene/paper.js` holds each vertex's sheet
  coordinates, and on [Plan 02b](./02b-paper-hat.md)'s stretch.
  It follows [Plan 03](./03-spin-the-paper.md) and
  [Plan 04](./04-paper-colours.md): its Manual QA spins the paper and
  changes its colour.
- Feeds [Plan 06](./06-self-shadows.md).
- Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10:
  [DataTexture.js](https://github.com/mrdoob/three.js/blob/r187/src/textures/DataTexture.js),
  [Texture.js](https://github.com/mrdoob/three.js/blob/r187/src/textures/Texture.js),
  [`setUvTransform()`](https://github.com/mrdoob/three.js/blob/r187/src/math/Matrix3.js)
  and
  [WebGLMaterials.js](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgl/WebGLMaterials.js).

## Decisions

1. **The grain is a colour map, and nothing more**: one `DataTexture`
   is the `map` of both paper materials, so it multiplies each side's
   colour, whichever colour that is. No bump map and no normal map. The
   fold-line mesh keeps its own texture, and is untouched.
2. **The noise**: `createGrainPixels()` in `docs/src/scene/grain.js`,
   pure, returns the RGBA bytes of a square tile, `GRAIN_TEXTURE_PX` on
   a side.
   - Every pixel is grey and opaque, with the value
     `255 × (1 − GRAIN_STRENGTH × n)`, rounded to the nearest whole
     number, where `n`, from 0 to 1, is the mean of one layer of value
     noise for each entry of `GRAIN_CELLS_PX`: random values on a grid
     of cells that many texels wide, smoothly interpolated.
   - Each layer's grid wraps at the tile's edges, so the tile repeats
     with no seam. Each entry of `GRAIN_CELLS_PX` must therefore divide
     `GRAIN_TEXTURE_PX` exactly, retuned or not.
   - The random values come from a small seeded generator, such as
     mulberry32, with `GRAIN_SEED`, so every load shows the same grain
     and the checks below can be repeated.
   - The tuning values: `GRAIN_SEED = 1`; `GRAIN_STRENGTH = 0.15`;
     `GRAIN_TEXTURE_PX = 512`; `GRAIN_TILE_METERS = 0.128`, so a texel
     is 0.25 mm of paper; `GRAIN_CELLS_PX = [2, 4, 8]`, so the grain's
     features are 0.5, 1 and 2 mm across. All are open to tuning by eye
     at Manual QA 1. A prototype with these values took 10 ms and gave
     bytes from 217 to 254, with a mean of 236 (2026-11-10); the review
     reproduced those bytes, and Step 1's Agent QA 2 ratios, with
     mulberry32 seeded with 1.
3. **The texture**: `new DataTexture(pixels, GRAIN_TEXTURE_PX,
   GRAIN_TEXTURE_PX)`, whose format and type default to RGBA bytes. A
   DataTexture defaults to nearest-neighbour filtering with no mipmaps,
   which would shimmer as the paper turns, so `magFilter` is
   `LinearFilter`, `minFilter` is `LinearMipmapLinearFilter` and
   `generateMipmaps` is true. `wrapS` and `wrapT` are `RepeatWrapping`,
   and `needsUpdate` is set to true. Its `colorSpace` stays
   `NoColorSpace`: the grain is a multiplier, not a colour. It lives as
   long as the page, so it is never disposed of.
4. **The grain keeps its true size**: it does not stretch with the
   sheet. The texture's `center` is (0.5, 0.5), and its `repeat` on
   each axis is `grainRepeat(sizeMeters, stretchScale)`, pure, in
   `grain.js`: the sheet's size on that axis, times the stretch group's
   scale, divided by `GRAIN_TILE_METERS`.
   - The texture's transform is then
     `repeat × (uv − 0.5) + 0.5`, so the sheet's centre always shows
     the tile's centre, and a millimetre of grain is a millimetre of
     paper whatever the sheet's shape.
   - During a stretch the sheet's outline moves over grain that holds
     still. When a design's sheet is swapped in, the repeat is
     unchanged, so nothing jumps: from the dart to the hat it runs from
     1.1719 × 1.1719, through 1.0787 × 1.2827 halfway, to
     0.9854 × 1.3936 (computed 2026-11-10, with Decision 2's tile).
   - `paper.fitGrain()` sets the repeat from the sheet showing and the
     stretch scale, and allocates nothing. `createPaper()` and
     `setSheet()` call it, and `docs/src/main.js` calls it straight
     after its `writeStretchScale()` call, in the same frame: on the
     frame of a swap, `setSheet()` runs before the stretch scale is
     written, so only the later call leaves the repeat right before the
     render. A texture's matrix follows its `repeat` by itself, since
     `matrixAutoUpdate` defaults to true and the renderer refreshes each
     material's uniforms on every frame.
5. **Performance**: the tile is generated and uploaded once, at load,
   about 1.4 MB with its mipmaps (derived: 512 × 512 × 4 bytes, plus a
   third); a frame of a stretch writes two numbers; each pixel of
   paper costs one more texture lookup. The optional Manual QA 8
   measures it.

## Steps

### Step 1: The grain's maths [P]

- Adds `docs/src/scene/grain.js`: the constants of Decision 2,
  `createGrainPixels()` and `grainRepeat()` (Decisions 2, 4).
- It should give a tile of grey, opaque pixels, none darker than
  `GRAIN_STRENGTH` allows, and the same tile on every call
  (Agent QA 1).
- It should give a tile that repeats with no seam, and is not blank
  (Agent QA 2).
- It should give a repeat that is the same before and after a sheet is
  swapped in, and that follows the stretch (Agent QA 3).
- It should import nothing from Three.js, so Node can run it
  (Agent QA 4).
- It should give the bytes Decision 2 records, from every layer of
  noise, rounded (Agent QA 5).

**Agent QA**

1. Do: `node --input-type=module -e 'import { createGrainPixels, GRAIN_STRENGTH, GRAIN_TEXTURE_PX as n } from "./docs/src/scene/grain.js"; const p = createGrainPixels(); const q = createGrainPixels(); let grey = true, opaque = true, low = 255, same = true; for (let i = 0; i < p.length; i += 4) { grey &&= p[i] === p[i + 1] && p[i] === p[i + 2]; opaque &&= p[i + 3] === 255; low = Math.min(low, p[i]); } for (let i = 0; i < p.length; i++) same &&= p[i] === q[i]; console.log(p.length === 4 * n * n, grey, opaque, low >= Math.round(255 * (1 - GRAIN_STRENGTH)), same);'`
   Expect: `true true true true true`
2. Do: `node --input-type=module -e 'import { createGrainPixels, GRAIN_TEXTURE_PX as n } from "./docs/src/scene/grain.js"; const p = createGrainPixels(); const across = (a, b) => { let d = 0; for (let k = 0; k < n; k++) d += Math.abs(p[4 * (k * n + a)] - p[4 * (k * n + b)]); return d / n; }; const down = (a, b) => { let d = 0; for (let k = 0; k < n; k++) d += Math.abs(p[4 * (a * n + k)] - p[4 * (b * n + k)]); return d / n; }; const inner = (f) => { let d = 0; for (let a = 0; a < n - 1; a++) d += f(a, a + 1); return d / (n - 1); }; console.log(inner(across) > 0, across(0, n - 1) < 1.5 * inner(across), down(0, n - 1) < 1.5 * inner(down));'`
   Expect: `true true true` (the tile's first and last columns, and rows,
   differ no more than neighbours do: the prototype's ratios were 0.88
   and 0.86, against 2.83 and 2.50 for noise that does not wrap)
3. Do: `node --input-type=module -e 'import { PAPER_DART } from "./docs/src/designs/paper-dart.js"; import { PAPER_HAT } from "./docs/src/designs/paper-hat.js"; import { sheetSize, writeStretchScale } from "./docs/src/designs/sheet.js"; import { grainRepeat } from "./docs/src/scene/grain.js"; const d = { "paper-dart": PAPER_DART, "paper-hat": PAPER_HAT }; const rep = (id, scale) => { const s = sheetSize(d[id].aspect); return grainRepeat(s.widthMeters, scale.x).toFixed(4) + " " + grainRepeat(s.heightMeters, scale.y).toFixed(4); }; const scale = { x: 1, y: 1 }; const log = [rep("paper-dart", scale)]; for (const stretchProgress of [0, 0.5, 1]) { writeStretchScale(d, scale, { designId: "paper-hat", stretchFromId: "paper-dart", stretchProgress }); log.push(rep("paper-hat", scale)); } console.log(log.join(" | "));'`
   Expect: `1.1719 1.1719 | 1.1719 1.1719 | 1.0787 1.2827 | 0.9854 1.3936`
   (with Decision 2's `GRAIN_TILE_METERS`; should Manual QA 1 retune
   it, the first two pairs are still equal)
4. Do: `grep -c '"three"' docs/src/scene/grain.js`
   Expect: `0`
5. Do: `node --input-type=module -e 'import { createGrainPixels } from "./docs/src/scene/grain.js"; const p = createGrainPixels(); let low = 255, high = 0, sum = 0; for (let i = 0; i < p.length; i += 4) { low = Math.min(low, p[i]); high = Math.max(high, p[i]); sum += p[i]; } console.log(low, high, Math.round(sum / (p.length / 4)));'`
   Expect: `217 254 236` (the lowest and highest bytes and the mean, with
   Decision 2's tuning values: one layer alone gives `242 255 249`, and
   `Math.floor()` for `Math.round()` a mean of `235`; should Manual QA 1
   retune them, record the new figures here)

### Step 2: The grain on the paper

- Changes `docs/src/scene/paper.js`: the grain texture, as the `map` of
  the front and back materials, and `fitGrain()`, called at creation
  and in `setSheet()`, and returned beside the other setters, with
  `createPaper()`'s `@returns` naming it (Decisions 1, 3, 4).
- Changes `docs/src/main.js`: `paper.fitGrain()` after each
  `writeStretchScale()` (Decision 4).
- It should show a subtle grain on both sides of the paper, with no
  grid and no seam (Manual QA 1, 2).
- It should carry each face's grain with it as the paper folds
  (Manual QA 2).
- It should hold the grain still, with no jump and no smear, while the
  sheet is swapped and stretched (Manual QA 3).
- It should keep the grain steady, with no shimmer, as the paper spins
  (Manual QA 4).
- It should show the grain on every paper colour, and leave the fold
  lines sharp (Manual QA 5).
- It should add no file to `docs/assets/` (Agent QA 2).

**Agent QA**

1. Do: `for p in 'center.set(0.5, 0.5)' 'generateMipmaps = true' 'magFilter = LinearFilter' 'minFilter = LinearMipmapLinearFilter' 'texture.needsUpdate = true' 'wrapS = ' 'wrapT = '; do printf '%s: ' "$p"; grep -cF -- "$p" docs/src/scene/paper.js; done`
   Expect: a count of `1` or more on every line (each setting of
   Decisions 3 and 4 is present; one grep over all of them would also
   count the import lines, and a bare `needsUpdate = true` would also
   count the position attribute's)
2. Do: `git status --short docs/assets docs/vendor`
   Expect: prints nothing
3. Do: `grep -c 'fitGrain' docs/src/scene/paper.js docs/src/main.js`
   Expect: `1` or more for each file
4. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, every file under `docs/src/` and
   `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser both sides of the paper show a subtle grain that holds
still through a stretch, with a clean console, and with Decision 2's
tuning values kept or retuned by eye at Manual QA 1.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the flat sheet, then pinch out on the trackpad to
   magnify the page about threefold, look closely about a centimetre
   inside each edge, and pinch back in. Not Cmd and +: the camera
   re-fits the window, so browser zoom magnifies nothing.
   - **Expect:** unmagnified, a faint, even mottling that reads as
     paper, not as a pattern. Magnified, soft irregular specks from
     half a millimetre to two millimetres across, with no grid, and no
     straight line where the grain breaks. The console shows no errors
     or warnings.
   - **Why:** the tile's edges fall 11 mm inside the square's edges,
     where a tile that does not wrap would show a seam.
2. **Do:** click "Paper Dart" and watch it fold.
   - **Expect:** the off-white backs carry the same grain; each flap's
     grain rides with it, and none slides across a face.
3. **Do:** click "Paper Hat", and watch the blank sheet between the two
   designs.
   - **Expect:** the grain neither jumps as the stretch starts nor
     smears during it: it holds still at the sheet's centre while the
     outline changes shape round it.
   - **Why:** a repeat set for the new sheet alone makes the grain jump
     at the swap, coarser by about a fifth across and finer by about a
     sixth down.
4. **Do:** drag slowly to turn the folded hat through a full turn, and
   to both tilt limits.
   - **Expect:** the grain stays steady at every angle, glancing ones
     included, with no shimmer, crawling or moiré.
   - **Why:** a texture without mipmaps aliases as it shrinks.
5. **Do:** click each colour swatch, then "Flat" and "Paper Dart" with
   "Fold lines" ticked.
   - **Expect:** the grain shows on every colour; the fold lines are as
     black and as sharp as before.
6. **Do:** reload twice, looking at one corner of the sheet each time.
   - **Expect:** the same grain each time.

### Optional, for a later pass

7. **Do:** with the lines on, click "Paper Dart" and let it finish. In
   Sources, set a breakpoint on the line of `src/main.js` that calls
   `renderer.render(scene, camera)`; when it pauses, read
   `renderer.info.memory.textures` in the console, then remove the
   breakpoint and resume. Switch designs three times ("Paper Hat",
   "Paper Dart", "Paper Hat"), letting each finish, then read it again
   the same way.
   - **Expect:** 2 both times (derived: the grain and the fold lines).
8. **Do:** in the Performance panel, record a switch from the dart to
   the hat. Then open the live site,
   `https://richplastow.com/origami-simulator/`, which shows the
   previous plan's work until this is pushed, and record the same
   switch there.
   - **Expect:** frame times alike on both. Note them, for `/done-plan`
     to record.

**Looks wrong, but isn't:**

- The paper is a little darker than before: the grain only darkens, by
  up to `GRAIN_STRENGTH`.
- Stretchy paper's grain does not stretch (Decision 4).
- The grain repeats every 128 mm, less than the hat's sheet is tall.
  The repeat has no seam, and should not be findable by eye.

## Audit

- **2026-11-10T10:56:17Z** — **drafted**: a seeded, tileable value-noise
  grain as the `map` of both paper materials, its repeat following the
  sheet's size and stretch so that the grain holds still; agent
  proposed a colour map with no bump, the noise's recipe, the
  texture's filters and colour space, and the rule that the grain
  keeps its true size; the grain's strength, tile size, texture size
  and cell sizes left `_TBD_`.
- **2026-11-10T11:10:07Z** — **ruled**: the Lead Developer accepted the
  agent's suggested values and proposals ("go with the defaults"): a
  colour map with no bump, at strength 0.15, on a 512 px tile of
  128 mm with cells of 2, 4 and 8 px; and a grain that holds still at
  its true size while the sheet stretches.
- **2026-11-10T12:07:48Z** — **reviewed**: no Major finding; r187
  source confirms DataTexture's nearest, no-mipmap defaults, Texture's
  RGBA bytes and
  NoColorSpace, setUvTransform() as `repeat × (uv − centre) + centre`,
  Lambert's per-frame map transform and the texture count; a scratch
  run against the real `uv` and flat pose confirmed the grain holds
  still and Decision 4's repeats, 11 mm and 1.4 MB; fixed: rounding,
  `GRAIN_SEED = 1` and cells dividing the tile (Decision 2), the swap
  frame's call order (Decision 4), `fitGrain()` in `@returns`, a
  per-setting Agent QA grep, pinch rather than Cmd and + in Manual QA
  1, the jump's size in Manual QA 3, and the switches in Manual QA 7.
- **2026-11-10T12:11:37Z** — **implemented**: Step 1, new
  `docs/src/scene/grain.js` (Decision 2's constants, mulberry32 seeded
  with 1, `createGrainPixels()`, `grainRepeat()`; no `three` import);
  Step 2, `docs/src/scene/paper.js` (grain DataTexture as both sides'
  `map`, `fitGrain()` at creation, in `setSheet()` and returned;
  fileoverview and `@returns` updated) and `docs/src/main.js`
  (`paper.fitGrain()` after `writeStretchScale()`, same `if` block);
  r187 source rechecked; Step 1 Agent QA 1 to 4 pass (bytes 217 to 254,
  mean 236, wrap ratios 0.88 and 0.86, 8 ms); Step 2 Agent QA 1 to 3
  pass; Step 2 Agent QA 1's `needsUpdate = true` passed before the work,
  on the position attribute, so it now greps
  `texture.needsUpdate = true`; Manual QA walked, unchanged.
- **2026-11-10T12:11:37Z** — **verified**: agent checks pass: 19 modules
  parse, no long lines, `/`, `styles/main.css` and all 19 modules served
  200 (server started and stopped by the check), vendored checksums
  match; browser not run.
- **2026-11-10T12:15:57Z** — **quality-checked**: Fixed: a check gap,
  where mutants of `createGrainPixels()` using one layer of noise
  (bytes 242 to 255) or `Math.floor()` (mean 235) passed every Agent
  QA line, so Step 1 gained Agent QA 5 (`217 254 236`) and a matching
  bullet (plan); first-run polish, `grainRepeat()`’s doc comment says
  "as shown" for "on screen" (`grain.js`); Deferred: none; Verified
  fine: mutation tests of `grain.js` (wrap dropped on either axis,
  sign reversed, no layer mean, unseeded, stretch ignored or divided,
  one axis’s ease for both, blue channel 255 all caught; linear rather
  than smoothstep interpolation passes every Agent QA line as an
  equivalent mutant there, left to Manual QA 1’s "no grid"; restored,
  `shasum` matched); Three.js sweep: the grain texture and both paper
  materials live as long as the page, the lines texture and old
  geometry are still disposed of in `setSheet()`; the per-frame path
  through `fitGrain()` and grainRepeat() allocates nothing; the swap
  frame runs `setSheet()`, writeStretchScale(), then `fitGrain()`
  before `renderer.render()`; motion, resize and input untouched; r187
  source rechecked for DataTexture’s nearest, no-mipmap defaults,
  Texture’s `updateMatrix()` and defaults, `refreshTransformUniform()`
  for Lambert’s `map`, and `_currentMaterialId` reset after each
  render, so the map’s transform refreshes every frame; no shadows, so
  Manual QA 7’s count of 2 holds; `setSheet()`’s own `fitGrain()` call
  is kept as Decision 4 asks; Step 1 Agent QA 1 to 5 and Step 2 Agent
  QA 1 to 4 pass; Manual QA walked against the labels and maths,
  unchanged; agent checks pass (19 modules, no long lines, all served
  200 by a server started and stopped, checksums match); browser not
  run.
- **2026-11-10T12:20:56Z** — **done**: manual QA passed in the browser
  (the grain's look, its stillness through the stretch, no shimmer, every
  colour, sharp fold lines), with Decision 2's tuning values kept; the
  optional Manual QA 7 and 8 were skipped; moved to `plans/done/`.
