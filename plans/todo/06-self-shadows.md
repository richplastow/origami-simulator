---
title: Let the paper shadow itself
description: Turns on shadow mapping so that lifted flaps and the dart's wings shadow the paper beneath them, with nothing drawn outside the paper.
type: plan
---

## Context

- Delivers the paper's shadows on itself: a flap in mid-fold shadows
  the sheet beneath it, and a spun dart's wings and keel shadow one
  another. Nothing casts a shadow behind the paper: the canvas stays
  transparent, and the scene holds only the paper.
- Implements the polish rulings in
  [Scope](../done/02-simple-folds-research.md#scope) of
  [02-simple-folds-research.md](../done/02-simple-folds-research.md).
- This is the riskiest of the polish plans, so it comes last. Folded
  layers lie 0.1 mm apart (`PAPER_THICKNESS_METERS`, in
  `docs/src/fold/pose.js`), closer than a shadow map can tell apart, so
  a bias switches shadows off between them, and shadows show only
  where paper is lifted. [Decision 7](#decisions) is the way out if
  the shadows cannot be made clean.
- Depends on [Plan 02c](../done/02c-printed-fold-lines.md) and on
  [Plan 03](../done/03-spin-the-paper.md), whose spin shows the shadows best.
  It follows [Plan 04](04-paper-colours.md) and
  [Plan 05](05-paper-grain.md), which it must leave as they are.
- Rests on Three.js's
  [shadows manual](https://threejs.org/manual/#en/shadows). Three.js
  APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10:
  [LightShadow.js](https://github.com/mrdoob/three.js/blob/r187/src/lights/LightShadow.js),
  [DirectionalLightShadow.js](https://github.com/mrdoob/three.js/blob/r187/src/lights/DirectionalLightShadow.js),
  [WebGLShadowMap.js](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgl/WebGLShadowMap.js),
  [shadowmap_pars_fragment](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl.js)
  and
  [shadowmap_vertex](https://github.com/mrdoob/three.js/blob/r187/src/renderers/shaders/ShaderChunk/shadowmap_vertex.glsl.js).

## Decisions

1. **Shadow mapping is switched on**: `renderer.shadowMap.enabled =
   true` in `docs/src/main.js`, before the first frame, and
   `castShadow = true` on the directional light in
   `docs/src/scene/lights.js`. The map's `type` stays at its default,
   `PCFShadowMap`. The ambient light is unchanged, so a shadowed
   surface keeps the ambient fill.
2. **The front mesh casts; the front and back meshes receive**: the
   front material's `shadowSide` is `DoubleSide`, so the whole sheet
   is drawn into the shadow map once, both ways up. Left at null, a
   `FrontSide` material would cast with its back faces only. The
   fold-line mesh neither casts nor receives: its material is unlit,
   and its lines are black already.
3. **The shadow camera is fitted once**, to the sphere that holds the
   paper: `createLights(radiusMeters)` takes `paperRadiusMeters` from
   `main.js`, 116.2 mm today, and sets the light's orthographic shadow
   camera to `left` and `bottom` of `−radius`, `right` and `top` of
   `radius`, `near` of `distance − radius` and `far` of
   `distance + radius`, where `distance` is the light's distance from
   the origin, 1.5 m; then calls `updateProjectionMatrix()`. The light,
   its target and the sphere never move, and a spin turns the paper
   inside the sphere, so the camera is never refitted. The default
   camera spans 10 m, which would leave the paper a dozen texels wide.
4. **The map's size**: `SHADOW_MAP_SIZE_PX = 2048`, so a texel is
   0.11 mm of the 232 mm the camera spans; open to retuning at Manual
   QA 8.
5. **The bias**: `SHADOW_BIAS_METERS = 0.002`, open to retuning at
   Manual QA 8. It is the depth beneath a caster, measured along the
   light's direction, within which nothing is shadowed.
   - `shadow.bias` is `−SHADOW_BIAS_METERS / (far − near)`, −0.0086
     with that value: r187 adds the bias to a fragment's normalised
     depth, which an orthographic camera spreads evenly from `near` to
     `far`.
   - It must exceed the deepest folded stack, the dart's 16 layers at
     1.6 mm, so that layers lying flat on one another cast nothing.
     The same margin keeps a face clear of speckle until it is turned
     about 85° from the light, where it is all but unlit (derived).
   - Its cost: a flap casts nothing until it has lifted by about that
     depth, and its shadow starts about that far from its hinge.
   - `shadow.normalBias` stays 0. It shifts a point along the
     geometry's `normal` attribute, which here is a placeholder: flat
     shading derives the true normal in the fragment shader.
6. **Three.js's other defaults stay**: the shadow's `radius` of 1, its
   `intensity` of 1, and `autoUpdate`, since the paper moves on every
   frame of a fold.
7. **The way out**: if Manual QA finds speckle, stripes or stray
   shadows that no value of Decisions 4 and 5 removes, the work is
   discarded uncommitted, and this plan moves to `plans/done/` as
   superseded. No switched-off shadow code is kept.
8. **Performance**: each frame draws the paper once more, into the
   shadow map, and each lit pixel of paper takes five shadow samples
   (r187's `PCFShadowMap`). The optional Manual QA 8 measures it.

## Steps

### Step 1: Shadows on

- Changes `docs/src/scene/lights.js`: `createLights(radiusMeters)`, the
  light's `castShadow`, its shadow camera, map size and bias, and the
  two new constants (Decisions 1, 3, 4, 5). Its doc comment's "No
  shadows" goes.
- Changes `docs/src/scene/paper.js`: `castShadow` and `shadowSide` on
  the front, `receiveShadow` on the front and back (Decision 2).
- Changes `docs/src/main.js`: `renderer.shadowMap.enabled`, and the
  radius passed to `createLights()` (Decisions 1, 3).
- It should leave a flat sheet evenly lit at every angle of spin, with
  no speckle, stripes or bands (Manual QA 1, 2).
- It should shadow the sheet beneath a flap while the flap is lifted,
  and no longer once it lies flat (Manual QA 3).
- It should shadow a spun dart's wings and keel where one hides the
  other from the light (Manual QA 4).
- It should cast no shadow between layers that lie flat on one another
  (Manual QA 4, 5).
- It should draw nothing outside the paper (Manual QA 6).
- It should leave the fold lines, the colours and the grain as they
  were (Manual QA 7).

**Agent QA**

1. Do: `grep -c 'shadowMap.enabled = true' docs/src/main.js`
   Expect: `1`
2. Do: `grep -c 'castShadow = true\|mapSize\|\.bias = \|updateProjectionMatrix()' docs/src/scene/lights.js`
   Expect: `4` or more
3. Do: `grep -c 'castShadow = true\|receiveShadow = true\|shadowSide' docs/src/scene/paper.js`
   Expect: `3` or more
4. Do: `grep -c 'ShadowMaterial\|drop-shadow' docs/src/main.js docs/src/scene/lights.js docs/src/scene/paper.js docs/styles/main.css`
   Expect: `0` for each file
5. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, every file under `docs/src/` and
   `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, and in
the browser lifted paper shadows the paper beneath it, flat paper shows
no artefact at any angle, and the console is clean, with the values of
Decisions 4 and 5 kept or retuned at Manual QA 8; or Decision 7's way
out is taken.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the flat sheet after loading, at 100% and at 300%
   zoom (Cmd and +, then Cmd and 0).
   - **Expect:** the sheet as it was before this plan: evenly lit,
     with its grain, and no speckle, stripes or bands. The console
     shows no errors or warnings.
   - **Why:** a bias too small lets the sheet shadow itself in a
     pattern of dots or stripes.
2. **Do:** drag slowly to turn the flat sheet through a full turn, and
   to both tilt limits, pausing where it is nearly edge-on.
   - **Expect:** the surface stays clean at every angle, front and
     back.
   - **Why:** speckle grows as a face turns away from the light.
3. **Do:** reload, click "Paper Dart", and watch each fold.
   - **Expect:** as a flap lifts, a shadow with a slightly soft edge
     falls on the sheet below it and a little to its left, and shrinks
     away as the flap comes down flat. The shadow follows the flap's
     outline, with no gaps or loose patches.
4. **Do:** look at the finished dart; then drag to see it side-on and
   from behind.
   - **Expect:** from the front, the layers lying flat on one another
     cast no shadow lines along their edges. Turned, the wings and the
     keel shadow each other where one hides the other from the light,
     which comes from the upper right, on the viewer's side.
5. **Do:** click "Paper Hat", let it finish, and turn it about.
   - **Expect:** shadows come and go with its flaps; the finished,
     flat-folded hat looks as it did before this plan.
6. **Do:** with a design folded and spun, look at the page round the
   paper.
   - **Expect:** no grey patch, edge or box anywhere outside the
     paper: the page shows through untouched.
7. **Do:** click each colour swatch, then untick and tick "Fold lines",
   with the dart folded and turned so that part of it is in shadow.
   - **Expect:** colours, grain and fold lines as before; the lines
     stay black and sharp in light and in shadow.
8. **Do:** if steps 1 to 5 showed speckle or stripes, raise
   `SHADOW_BIAS_METERS` in `docs/src/scene/lights.js` by 0.001, reload,
   and repeat them. If shadows start too far from their flaps, lower
   it by 0.0005, or raise `SHADOW_MAP_SIZE_PX` to 4096.
   - **Expect:** a pair of values that passes steps 1 to 5. Note them,
     for `/done-plan` to record. If none does, take Decision 7's way
     out.

### Optional, for a later pass

9. **Do:** in the Performance panel, record the dart folding while
   dragging. Then open the live site,
   `https://richplastow.com/origami-simulator/`, which shows the
   previous plan's work until this is pushed, and record the same
   there.
   - **Expect:** steady frames on both. Note the frame times, for
     `/done-plan` to record.

**Looks wrong, but isn't:**

- A flap's shadow starts a couple of millimetres from its hinge, and a
  flap lifted less than that casts none (Decision 5).
- Flat-folded paper casts no shadow on itself, however many layers.
- The paper casts no shadow on the page.
- A shadowed surface is dimmer, never black: the ambient light still
  reaches it.

## Audit

- **2026-11-10T10:56:17Z** — **drafted**: shadow mapping on the directional
  light, its shadow camera fitted once to the paper's sphere, the front
  mesh casting both ways up, and a bias, in metres, deeper than the
  folded stack; agent proposed the single caster with
  `shadowSide: DoubleSide`, the bias expressed in metres, `normalBias`
  left at 0, and discarding the work as the way out; the map's size
  and the bias left `_TBD_`.
- **2026-11-10T11:10:07Z** — **ruled**: the Lead Developer accepted the
  agent's suggested values and proposals ("go with the defaults"): a
  2,048 px shadow map, a 2 mm bias, and discarding the work, with no
  switched-off code kept, should no tuning give clean shadows.
