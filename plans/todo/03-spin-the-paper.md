---
title: Spin the paper by dragging
description: Lets a drag on the canvas turn the paper about its centre, as on a turntable, while the camera and the lights stay where they are.
type: plan
---

## Context

- Delivers the first of the presentation polish plans: a drag on the
  canvas spins the paper about its centre, left and right about the
  vertical axis and up and down as a tilt, so every side of a folded
  design can be seen. The camera and the lights never move.
- Implements the polish rulings in
  [Scope](../done/02-simple-folds-research.md#scope) of
  [02-simple-folds-research.md](../done/02-simple-folds-research.md): the spin
  runs through the app's own pointer handler, not OrbitControls, so no
  addon is vendored; the canvas stays transparent, and the scene holds
  only the paper. With nothing else in the scene, spinning the paper
  under fixed lights draws the same picture as orbiting the camera and
  the lights together.
- Depends on [Plan 02c](../done/02c-printed-fold-lines.md), and through it on
  [Plan 02a](../done/02a-paper-dart.md) and
  [Plan 02b](../done/02b-paper-hat.md): `createPaper()` in
  `docs/src/scene/paper.js` returns `group`, which holds the stretch
  group and is free to turn, and `docs/src/main.js` fits the camera to a
  sphere centred on the origin, so the paper stays in view at any angle.
- Feeds [Plan 04](04-paper-colours.md), [Plan 05](05-paper-grain.md) and
  [Plan 06](06-self-shadows.md), whose shadows show best on a spun dart.
- Rests on
  [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events),
  [`setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture),
  [`hasPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/hasPointerCapture),
  [`touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
  and
  [`user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select).
  Three.js APIs below were checked against the
  [r187 source](https://github.com/mrdoob/three.js/tree/r187/src) on
  2026-11-10.

## Decisions

1. **A turntable**: the spin is two angles. Yaw turns the paper about
   the scene's vertical Y axis; pitch tilts it about the X axis, which
   runs across the screen. `paper.group.rotation.set(pitchRadians,
   yawRadians, 0)` applies them: an Euler's default order is `XYZ`
   ([Euler.js](https://github.com/mrdoob/three.js/blob/r187/src/math/Euler.js)),
   whose matrix is Rx(pitch) · Ry(yaw)
   ([`makeRotationFromEuler()`](https://github.com/mrdoob/three.js/blob/r187/src/math/Matrix4.js)),
   so the paper turns about its own vertical axis first and tilts
   towards the viewer second. The spin's state:

   ```json
   { "pitchRadians": 0.4, "yawRadians": 0.8 }
   ```

2. **Drag to angle**: a drag of `dx` CSS pixels to the right adds
   `dx × SPIN_RADIANS_PER_PIXEL` to the yaw, and a drag of `dy` down adds
   `dy × SPIN_RADIANS_PER_PIXEL` to the pitch, so the paper's near
   surface follows the pointer. `SPIN_RADIANS_PER_PIXEL` is _TBD_
   (suggested 0.008: a drag of 393 px, about a phone's width, is half a
   turn), open to tuning by eye at Manual QA 2.
3. **Tilt limits**: the pitch is clamped where the view reaches straight
   above and straight below the paper. The camera is raised by
   `CAMERA_ELEVATION_RADIANS` (20°), so the pitch runs from
   `−(π/2 + elevation)` to `π/2 − elevation`, −110° to 70°, and
   `main.js` derives both from that constant. Past those limits a drag
   to the right would carry the near surface left. The yaw has no
   limit and is not wrapped: every angle is a valid turn.
4. **Maths apart from input**: `turnSpin(deltaXPixels, deltaYPixels,
   maxPitchRadians, minPitchRadians, spin)` in `docs/src/input/spin.js`
   imports nothing and writes `spin` in place, so Node can run it.
   `connectDrag(element, onDrag)` in `docs/src/input/drag.js` reports
   drags on an element as `onDrag(deltaXPixels, deltaYPixels)`.
5. **Pointer capture is the drag's only state**: on a `pointerdown` from
   the primary pointer's primary button (`isPrimary`, and `button` 0),
   `connectDrag()` captures the pointer and notes its `clientX` and
   `clientY`; on each `pointermove` for which
   `element.hasPointerCapture(event.pointerId)` holds, it reports the
   change since the last event. The browser releases the capture on
   `pointerup` and `pointercancel`, so the drag needs no flag and no
   listener for its end. A captured pointer keeps reporting when it
   passes over the buttons or leaves the window. Mouse, touch and pen
   share the one path; a second finger is not primary and is ignored,
   so there is no zoom and no pan.
6. **The canvas's CSS**, on `.scene` in `docs/styles/main.css`:
   `touch-action: none`, so a touch drag is not taken for scrolling or
   zooming; `user-select: none` with `-webkit-user-select: none`, which
   Safari still needs
   ([browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/user-select.json),
   checked 2026-11-10), so a drag does not select the page's title;
   `cursor: grab`, and `cursor: grabbing` while `:active`.
7. **Nothing else moves**: the camera, the lights and `resize()` are
   unchanged. Folding, stretching and the fold lines play inside the
   spun group. The spin survives "Flat" and a switch of design, and
   nothing resets it but a reload.
8. **Left out**: a glide after release, a gesture to reset the view,
   spinning from the keyboard, zoom and pan.
9. **The canvas's text alternative**: its `aria-label` in
   `docs/index.html`, "A square sheet of red origami paper, seen from
   slightly above", no longer describes a sheet that changes shape and
   turns. Its new wording is _TBD_ (suggested: "A sheet of origami
   paper, which folds into simple designs and turns when dragged").
10. **Performance**: a pointer move writes two numbers and one Euler,
    and allocates nothing; the frame loop already draws every frame.
    The optional Manual QA 11 measures it.

## Steps

### Step 1: The spin's maths [P]

- Adds `docs/src/input/spin.js`: `SPIN_RADIANS_PER_PIXEL` and
  `turnSpin()` (Decisions 1 to 4).
- It should add a drag's width to the yaw and its height to the pitch,
  scaled by `SPIN_RADIANS_PER_PIXEL` (Agent QA 1).
- It should stop the pitch at each limit, and leave the yaw unlimited
  (Agent QA 2).
- It should allocate nothing and import nothing (Agent QA 3).

**Agent QA**

1. Do: `node --input-type=module -e 'import { turnSpin } from "./docs/src/input/spin.js"; const s = { pitchRadians: 0, yawRadians: 0 }; turnSpin(100, 50, 1.2217, -1.9199, s); console.log(s.pitchRadians.toFixed(4), s.yawRadians.toFixed(4));'`
   Expect: `0.4000 0.8000` (with Decision 2's suggested 0.008; `100 ×`
   and `50 ×` the ruled value otherwise)
2. Do: `node --input-type=module -e 'import { turnSpin } from "./docs/src/input/spin.js"; const max = Math.PI / 2 - (20 * Math.PI) / 180; const min = -Math.PI / 2 - (20 * Math.PI) / 180; const s = { pitchRadians: 0, yawRadians: 0 }; turnSpin(1000, 1000, max, min, s); const top = s.pitchRadians.toFixed(4); turnSpin(0, -1000, max, min, s); console.log(top, s.pitchRadians.toFixed(4), s.yawRadians.toFixed(4));'`
   Expect: `1.2217 -1.9199 8.0000` (the yaw with the suggested 0.008)
3. Do: `grep -c 'new [A-Z]\|^import' docs/src/input/spin.js`
   Expect: `0`

### Step 2: Drags on the canvas

- Adds `docs/src/input/drag.js`: `connectDrag()` (Decision 5).
- Changes `docs/src/main.js`: the spin's state, the tilt limits derived
  from `CAMERA_ELEVATION_RADIANS`, and a `connectDrag()` on the canvas
  that calls `turnSpin()` and sets `paper.group.rotation`
  (Decisions 1, 3, 7).
- Changes `docs/styles/main.css` (Decision 6) and the canvas's
  `aria-label` in `docs/index.html` (Decision 9).
- It should turn the paper about its centre as the pointer drags, the
  near surface following the pointer (Manual QA 2).
- It should show the back of the paper evenly lit, with no fold lines
  on it (Manual QA 2).
- It should keep folding, unfolding and stretching inside the spun
  view, and keep the spin through "Flat" and a switch (Manual QA 3, 6).
- It should stop tilting at straight above and straight below, and hold
  no angle beyond the stop (Manual QA 4).
- It should keep a drag that passes over the buttons or leaves the
  window, press no button on the way, and select no text (Manual QA 5).
- It should keep the whole paper in view at every angle and window size
  (Manual QA 7).
- It should ignore every button but the primary one (Manual QA 8).
- It should show an open hand over the canvas and a closed hand while
  dragging (Manual QA 1, 2).
- It should leave the buttons and the checkbox working from the
  keyboard (Manual QA 9).
- It should spin under one finger without scrolling or zooming the
  page, and ignore a second finger (Manual QA 10).

**Agent QA**

1. Do: `grep -c 'setPointerCapture\|hasPointerCapture' docs/src/input/drag.js`
   Expect: `2` or more
2. Do: `grep -c 'touch-action: none\|user-select: none\|cursor: grab' docs/styles/main.css`
   Expect: `5` (`touch-action: none`, `user-select: none`,
   `-webkit-user-select: none`, `cursor: grab` and `cursor: grabbing`)
3. Do: `grep -c 'OrbitControls\|three/addons' docs/src/main.js docs/src/input/drag.js docs/src/input/spin.js`
   Expect: `0` for each file
4. Do: `grep -c 'seen from slightly above' docs/index.html`
   Expect: `0`
5. Do: the [Agent checks](../../CLAUDE.md#agent-checks) in CLAUDE.md,
   `curl`ing `/`, every file under `docs/src/` and
   `docs/styles/main.css`.
   Expect: every check passes; each file returns status 200.

## Done when

Every Agent QA block passes, the agent checks in CLAUDE.md pass, every
`_TBD_` in Decisions 2 and 9 has a value, and in the browser a drag on
the canvas turns the paper about its centre, flat or folded, with the
camera and lights unmoved and a clean console.

## Manual QA

**Preconditions:** from the repo root, run `npx serve docs -p 1111`, open
`http://localhost:1111/` in desktop Chrome, open the dev tools console, and
hard-reload (Shift+Cmd+R).

1. **Do:** look at the page after loading, then move the pointer over
   the paper.
   - **Expect:** the flat red square, as before; an open-hand cursor
     over the paper and the empty page around it. The console shows no
     errors or warnings.
2. **Do:** press on the paper, drag slowly right by about 100 px, and
   pause; then keep dragging right for another 300 px, and release.
   - **Expect:** a closed-hand cursor while pressed. The paper turns
     about its vertical axis, its surface following the pointer: after
     100 px it has turned about 45°, its right edge further away. At
     about 200 px it is edge-on; then its off-white back comes round,
     as evenly lit as the front was, with no fold lines on it.
   - **Why:** a wrong sign turns the paper against the drag; a wrong
     axis order makes it wobble.
3. **Do:** click "Paper Dart", and drag in slow circles while it folds.
   - **Expect:** the dart folds as before, inside the turning view; the
     fold lines turn with the paper. Nothing stutters or jumps.
4. **Do:** with the dart folded, drag down until the tilt stops, then a
   further 500 px, then drag up by 10 px. Repeat upwards.
   - **Expect:** the tilt stops dead once the view looks straight down
     on what was the sheet's top edge, and straight up at its bottom
     edge the other way. After the extra 500 px, the first pixels of
     the drag back tilt the dart at once, so the angle stopped where
     the picture did.
   - **Why:** a clamp on the picture alone leaves a dead zone on the
     way back.
5. **Do:** press on the paper, drag down across the buttons, out of the
   window and back in, then release over the paper.
   - **Expect:** the paper follows the pointer throughout, also while
     it is outside the window. No button highlights or fires; the
     page's title is never selected.
6. **Do:** with the dart spun to show its keel, click "Paper Hat", let
   it finish, then click "Flat".
   - **Expect:** the dart unfolds, the sheet stretches and the hat
     folds, all in the spun view; the view never snaps back to the
     front.
7. **Do:** resize the window, narrow then wide, while dragging the
   paper round.
   - **Expect:** the paper stays centred and whole at every angle; no
     corner is cut off, and nothing stretches or blurs.
8. **Do:** press the right mouse button on the paper and drag; dismiss
   the menu.
   - **Expect:** the paper does not turn.
9. **Do:** press Tab until each button and the checkbox has taken focus
   in turn, pressing Space on each.
   - **Expect:** the controls work as before, each with a visible focus
     ring.

### Optional, for a later pass

10. **Do:** in device mode, choose a phone such as iPhone 12 Pro
    (390 × 844), reload, and drag the paper with one "finger"; on a
    real phone, also put a second finger down and pinch.
    - **Expect:** the paper spins; the page neither scrolls nor zooms;
      the second finger does nothing.
11. **Do:** in the Performance panel, record five seconds of continuous
    dragging while the dart folds. Then record the dart folding with no
    drag.
    - **Expect:** frame times alike in both. Note both, for
      `/done-plan` to record.

**Looks wrong, but isn't:**

- A flat sheet seen edge-on vanishes, since the paper has no thickness.
  At either tilt limit a flat, unturned sheet is edge-on.
- A drag that starts on the title, on a button, or in the gaps of the
  button bar does not spin the paper: those elements lie over the
  canvas.
- The back of the paper is lit as brightly as the front: flat shading
  lights whichever side faces the viewer.
- A reload resets the spin.

## Audit

- **__DRAFTED_AT__** — **drafted**: a turntable spin of the paper's
  group, by pure `turnSpin()` maths and a pointer-capture drag handler,
  with the camera and lights fixed; agent proposed the tilt limits at
  straight above and below, pointer capture as the drag's only state,
  the `grab` cursors, `user-select: none` (not seen in a browser), and
  the list left out; `SPIN_RADIANS_PER_PIXEL` and the canvas's
  `aria-label` left `_TBD_`.
