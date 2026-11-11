---
title: Basic Sandbox Mode research
description: The brief for Basic Sandbox Mode, free folding on a printed lattice, and the case for building it before Gameplay Mode, measured against the fold engine on four lattices, with an outline of how it could be built and exported as a design.
type: research
---

## Context

- Plans 01 to 12 are done and committed, and the app is launched as
  Pureland Simulator at version 1.0.0. Today it has one mode, in which a
  design radio folds the paper to a finished model. This file names that
  mode Presentation Mode, and brings together the brief for a second,
  Basic Sandbox Mode, in which the player folds a printed pattern
  freely. It comes before a third, Gameplay Mode, a game that teaches each
  design's folds, whose research follows in
  [14](./14-gameplay-mode-research.md) and builds on this one.
- The first section, [The brief](#the-brief), records the brief. The rest
  makes the case for building the Sandbox first, measures it against the
  engine, and outlines how it could be built. Nothing here is a plan:
  the plans come later, and this file is their reference, as
  [the design research](../done/07-design-research.md) was for Plans 08
  to 12.
- Each claim below is one of four kinds, and says which:
  - **Code**: checked in this repo's source on 2026-11-11.
  - **Measured**: run on 2026-11-11, in Node 25.8.0 on the Lead
    Developer's Mac, by a script that drives the repo's own engine
    through random walks of folds on four printed patterns. It is kept at
    the repo root as `tmp-sandbox-mode-grid.mjs`, which git ignores, and
    runs as `node tmp-sandbox-mode-grid.mjs`.
  - **Source**: read in the pinned Three.js release's unminified source,
    r187 on GitHub, or on MDN or the W3C's site, linked where cited.
  - **Derived**: worked out, not prototyped and not seen in a browser.
- Terms the briefs give in title case keep it: Presentation Mode,
  Sandbox Mode, Gameplay Mode, Fold Button, and the Undo, Redo, Unfold and
  Export buttons.

## The brief

### Modes

- The app today works only in Presentation Mode, which stays the
  default. A new radio group chooses the mode.
- Sandbox Mode has designs of its own, regular geometric patterns of
  folds, for free experiment: no points, lives or hints, just folding.
  In full, it would also offer a way to save and share results, so
  players can show their creations and explore others'.
- Gameplay Mode is a game: shown a design's lines on a flat sheet, the
  player presses a Fold Button on a line to fold it, tries different
  orders, and learns one that works.

### A basic Sandbox Mode before Gameplay Mode

- A basic Sandbox Mode, without the saving, sharing or viewing of
  others' creations, is built before Gameplay Mode.
- The thought behind it: a basic Sandbox Mode is a subset of Gameplay Mode,
  so it is a step on the way, not a detour. It would be a fun and
  interesting feature on its own, even without saving and sharing. And
  it could be a handy workbench for finding better Gameplay Mode designs.

### Export as a design

- A Sandbox session's folds should be exportable as a design, as a dump
  of the fold list, which can then be fed back into the app as a
  Presentation Mode or Gameplay Mode design.

### Folds at 90° and other angles

- Sandbox Mode might also allow folds that stop at 90°, or at other
  angles, rather than always pressing flat. This is an interesting
  mathematical wrinkle to explore.

## Why Sandbox Mode comes first

- **It is the hard part of Gameplay Mode.** The parts of Gameplay Mode that are
  hard to get right in the browser, a sheet cut along the player's path,
  buttons projected over the canvas, a choice of fold direction, and
  Undo, Redo and Unfold, are exactly a basic Sandbox Mode. Gameplay Mode's
  live graph, availability rule, lives, hints and points are a layer on
  top, all pure maths that Node can check. Building the Sandbox first
  puts the risky visible work behind the first gate and leaves Gameplay Mode
  as rules over a working toy.
- **It builds what Gameplay Mode can reuse.** A Sandbox pattern is untyped,
  so the Sandbox prints plain lines and asks for a direction at every
  fold; Gameplay Mode can then offer the same choice for little more than
  its own buttons. Sandbox lines need no labels that hide an order,
  since there is no order to hide; Gameplay Mode's will.
- **The engine's fold model fits a regular pattern without change**,
  provided the pattern is closed under reflection in its own lines. A
  quarter grid with only its two centre diagonals is not;
  [the measurements](#measurements) say why, and which patterns do
  qualify.
- **Sandbox folds go through all layers**, since there is no earlier fold
  to name in a `{ movedBy }` or `{ heldBy }` selection. That limits the
  Sandbox as a design workbench: of the five designs on the page, only
  the pencil and Mount Fuji use all-layer folds throughout (**Code**).
  The yacht's sail, the dart's wings and the heart's corners and tips
  fold one flap only, and the dart's wings stop at 90°. A later Sandbox
  could add "top layer only" as a modifier; the first one should not.
- **A Sandbox session is already a design.** Its fold list, lines in the
  folded plane with a direction each, is what createFold() takes, with
  the start facing front and no turn-overs (**Code**). So "export this as
  a design" is a dump of that list, as the brief asks.
- **The plan order is**: the engine opens up; then Sandbox Mode; then
  Gameplay Mode as rules on top.

## What the code does today

All **Code**, checked on 2026-11-11.

- A design is a frozen `{ aspect, colorId, id, leanRadians?, start?,
  steps }`. Each step is a fold, written in the view frame, or a turn-over
  (`docs/src/designs/steps.js`).
- cutSheet() in `docs/src/fold/engine.js` reads the steps into `folds` in
  the front's terms, with turn-overs dropped and each fold's `layers`
  renamed to a fold index, then runs the folds in order. A fold is an
  infinite line in the folded plane, a side (its left moves), a layer
  selection (`"all"`, `{ movedBy }` or `{ heldBy }`, naming one earlier
  fold), a `type` and a `targetRadians`. applyFold(), not exported, splits
  the selected faces along the line, reflects the left pieces, and stacks
  them above everything for a valley or below for a mountain. It throws
  when a fold moves nothing, and when a fold would move faces that an
  earlier fold left standing short of 180°.
- A fold's `from` and `to` set its line and which side moves: the side to
  the line's left. Nothing about a fold says how much paper lies on each
  side.
- A fold whose `targetRadians` is under π "stops short": pose.js turns
  the faces it moves as one rigid block about its line and leaves them
  standing; applyFold() still reflects their placements in the folded
  plane, as if pressed flat, and throws if any later fold would move
  those faces. stageCentres() keeps the centre from the stage before.
- The sheet cutSheet() returns holds the final faces, each with a
  placement and a layer per stage, so one geometry serves every point in
  the sequence; plus `bridges`, `centres`, the `creaseLines` to print, and
  `steps`. The crease lines are made by the folds as they run: a fold
  through several layers prints several.
- writePaperPositions() in `docs/src/fold/pose.js` poses every vertex at
  a sequence position, allocating nothing, through a scratch point that
  each fold's turn, the both-sides turn and the stage centre's slide pass
  through in turn.
- stepSequence() in `docs/src/fold/stepper.js` moves `position` towards
  a target along one design's steps, unfolding to 0 and stretching the
  flat sheet to another design's shape and pose when the target names
  one. It reads `designs[state.designId].steps.length` as the finished
  position, where the fold lines fade out.
- drawFoldLines() draws one dash pattern per crease type, valley or
  mountain, and the back's lines as the opposite type. It has no untyped
  style.
- `main.js` cuts every design once at load, keeps the sheets by design
  id, sets the camera once from the widest reach of any design's sheet
  over its whole sequence, 0.1211 m (the pencil), and swaps sheets with
  paper.setSheet() only at rest, flat, with the lines hidden. Each
  geometry's bounding sphere has that radius.
- `distanceToFitSphere()` in `docs/src/camera/fit.js` is pure, so a
  camera that refits to a changing radius needs no new maths.
- Escape hides the toolbar, which `controls-toggle.js` and `main.css` call
  "a presentation mode". That name clashes with Presentation Mode, and
  should change to "hidden toolbar" when the mode radios land.

## Measurements

### Why the pattern must be closed under its own reflections

**Derived**, then **Measured**. The engine folds along a fixed line in
the folded plane. After a fold, the moved paper's printed lines lie
wherever the reflection put them. If every reflection of a pattern line
in another pattern line is itself a pattern line, then every printed line
on every layer always lies on a line the Sandbox can fold, and every
crease a fold makes lies on a printed line. If not, the paper shows
printed lines the Sandbox cannot fold, and folds that crease the paper
where nothing is printed.

- A square lattice of spacing `s` is closed: reflecting the line
  `x = m·s` in `x = k·s` gives `x = (2k − m)·s`, and horizontals are
  unchanged.
- The lattice with both diagonal families through every lattice point
  is closed too: reflecting `y = x + c` in `x = k·s` gives
  `y = −x + 2k·s + c`, a line of the other family through lattice
  points, and reflecting in a diagonal swaps the horizontal and vertical
  families and keeps each diagonal family.
- A quarter grid with only the two centre diagonals is not closed:
  reflecting a centre diagonal in `x = W/4` gives a diagonal through no
  lattice point. With only that sheet's eight printed lines foldable,
  random walks made a crease off the pattern in 494 of 2,013 states
  (**Measured**). Every pattern below is closed, and made 0.
- Closure also means the foldable lines are the whole lattice, not the
  lines printed on the flat sheet: a flap folded outwards carries
  printed lines beyond the sheet's original footprint, and they must be
  foldable too. So a pattern is a lattice, and a line is foldable
  wherever paper now crosses it.

### Which side moves

**Derived**, then **Measured**. A fold moves the side to its line's left,
so each lattice line could move either side. Moving the large side over
the small one gives the same object as moving the small side over the
large, turned over and shifted in the plane, so the choice is
presentational. It is not free of cost, though: with the side chosen by
the line's arbitrary orientation, random walks never ran out of folds,
the folded plane's footprint drifted 11 to 15 spacings from the origin,
and the mid-fold reach rose to 0.1856 m, half as much again as the
camera's 0.1211 m sphere. With **the smaller side moving**, the footprint
stays within 3 spacings and the reach within 0.1135 m, inside the sphere
as it is. Every figure below uses that rule.

### Millimetres on screen

**Derived**: the camera fits the 0.1211 m sphere, with its 1.1 margin,
to the view's smaller dimension, so a 390 px-wide phone shows about
1.5 px per millimetre and a 900 px-tall desktop window about 3.4.
Buttons of the swatches' 24 px, WCAG 2.2's minimum target, whose centres
lie 15 mm apart are 22 px apart on the phone, and overlap; on the
desktop they clear.

### Four patterns on a square sheet

**Measured**: 100 random walks per pattern, each up to 10 flat folds,
every fold a valley or a mountain through every layer along a lattice
line that paper crosses, the smaller side moving. "Foldable lines" counts
lattice lines that paper crosses; "exhausted" counts walks that found no
foldable line before their tenth fold; "refoldable" counts states where a
line already folded is foldable again, because a later fold brought paper
back across it; "crowded" counts states where two foldable lines'
midpoint anchors lie within 15 mm, the distance at which 24 px buttons
overlap on a phone (see [Millimetres on screen](#millimetres-on-screen)).

| Pattern | Printed on the sheet | Foldable lines, folds 0 to 3 | Exhausted | Max faces | Max vertices | Max reach | Refoldable | Crowded |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Half lattice: the two centre lines | 2 | 2.0, 1.0, 0 | 100 of 100, by fold 2 | 4 | 16 | 0.1112 m | 0 of 300 | 100 of 300 |
| Half lattice with diagonals: centre lines, both diagonals, and the four lines through the edges' midpoints | 8 | 8.0, 6.2, 4.7, 3.5 | 100 of 100, by fold 8 | 16 | 48 | 0.1135 m | 120 of 725 | 412 of 725 |
| Quarter lattice: lines at every quarter | 6 | 6.0, 4.7, 3.4, 2.3 | 100 of 100, by fold 6 | 16 | 64 | 0.1112 m | 51 of 623 | 220 of 623 |
| Quarter lattice with diagonals | 20 | 20.0, 17.3, 14.8, 12.8 | 12 of 100 | 64 | 192 | 0.1122 m | 308 of 1,094 | 1,038 of 1,094 |

What the table says:

- **Every reachable state renders as the engine does today.** No walk
  left a T-junction, which cutSheet() refuses, and no crease fell off the
  printed pattern.
- **The paper runs out of folds**, since every fold halves the smaller
  side and the lattice is finite on the paper: the half lattice is done
  in two folds, the quarter lattice in about five, the eight-line pattern
  in about seven. That is physics, not a defect, and Undo is the way
  back. The twenty-line pattern lasts, at the price of up to 64 faces and
  192 vertices, four times the heart's.
- **A line can become foldable again** once paper returns across it, in
  up to a quarter of states. The Sandbox must not treat a folded line as
  spent.
- **Buttons at line midpoints do not work for a Sandbox.** Two foldable
  lines' midpoints lie within 15 mm in a third to nineteen twentieths of
  states, because lattice lines meet at lattice points and symmetric
  crossings share midpoints. Crowding is the rule here, not an exception
  to place around, so the Sandbox needs another way to pick a line; see
  [Picking a line](#3-picking-a-line-with-the-pointer).
- **The camera can stay as it is** under the smaller-side rule: no
  reach exceeded the 0.1211 m sphere.

### A 90° fold in the engine as it stands

**Measured**, on the half lattice, at 55 random states 0 to 3 flat folds
deep: after one fold stopped at 90°, no fold of any kind was available
in any trial. Every lattice line crossing the paper crosses the standing
flap's reflected footprint too, and applyFold() refuses to move a
standing flap's faces. So with the engine as it is, a fold at any angle
short of flat is a **finishing fold**: it can be made at any time, from
any flat state, and ends the session but for Undo. The dart's wings are
exactly this case.

## An outline of the implementation

**Derived** throughout, unless marked. An exploration, not a plan: each
part names its options and a recommendation, for discussion.

### 1. A pattern is a lattice, and a fold is a lattice line through every layer

- A Sandbox pattern is data: the sheet's `aspect`, a lattice `spacing`
  as a fraction of the sheet's width, and whether the diagonals are
  printed. Its printed lines are the lattice lines that cross the flat
  sheet, drawn on both sides as today. Its foldable lines are every
  lattice line that paper crosses at the current state, found by
  clipping each face's placed polygon against the lines within the
  footprint's bounding box: tens of lines, cheap on a press.
- A fold is a lattice line, a direction, `"all"` layers and a target
  angle of π. Its `from` and `to` are oriented so the smaller side
  moves, by comparing the clipped areas on each side; equal areas take
  the line's own orientation.
- Ids are assigned, as
  [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks of anything
  that other things point at: a session names its lines by family and
  index, never by coordinates.

```json
{
  "id": "half-lattice-diagonals",
  "aspect": 1,
  "spacingFraction": 0.5,
  "diagonals": true,
  "colorId": "blue"
}
```

### 2. Which side moves

- **Recommended: the smaller side**, by area, as measured. The paper
  keeps still under the player's eye, the reach stays inside the camera's
  sphere, and the footprint stays near the origin.
- **Alternative: the side under the pointer moves.** More direct, since
  the player points at the part they want to fold, but it reopens the
  reach and drift the measurements closed, so the camera would have to
  refit to each state's reach, eased, and the lattice would need to be
  generated from the footprint rather than a fixed range. The pure
  function for the refit exists; the rest is new. An
  [open question](#open-questions).

### 3. Picking a line with the pointer

- Since midpoint buttons crowd, the Sandbox picks a line by pointing at
  it: the pointer's ray meets the paper's plane, the nearest foldable
  lattice line within a named distance lights up along its crossing
  extent, and a pair of buttons, "towards me" and "away from me", appears
  at the pointer, or at the tap point on a touch screen. A press folds;
  moving away clears the pick.
- The ray comes from `Raycaster.setFromCamera()` (**Source**: r187
  `src/core/Raycaster.js` line 119) and meets the plane through
  `Ray.intersectPlane()` (**Source**: r187 `src/math/Ray.js` line 395).
  With flat folds only, the paper lies in its local XY plane, slid by the
  stage centre; the hit point in that plane, plus the slide, is a point
  of the folded plane, which the lattice is defined in. No raycast
  against the mesh is needed.
- The lit line is a two-vertex `Line` along the crossing extent, written
  on each pick and allocating nothing per frame.
- **The two buttons are real `<button>`s** in a container over the
  canvas, which gives `cursor: pointer`, hover, focus rings, Tab and
  Enter, and `aria-label`s for free, as
  [CLAUDE.md](../../CLAUDE.md#standard-javascript-no-build) asks, and
  needs nothing vendored. They sit at the picked point, carried to the
  screen by the paper's `localToWorld()` (**Source**: r187
  `src/core/Object3D.js` line 670, which calls updateWorldMatrix()
  first) and `Vector3.project(camera)` (**Source**: r187
  `src/math/Vector3.js` line 499), which give normalised device
  coordinates; the canvas's CSS size gives pixels. Projecting after
  renderer.render() in the same frame uses the matrices that frame drew
  with.
- **Per-frame cost.** A DOM write allocates a string, which the
  per-frame rule forbids. Writes happen only on frames where the pose,
  spin, stretch or canvas size changed, which the stepper and the spin
  reset already report by returning true; at rest, nothing is written.
  During a fold, undo or unfold, the buttons fade out.
- Keyboard: the arrow keys cycle the foldable lines, Enter folds towards
  the viewer, Shift+Enter away, and Escape clears the pick before it
  hides the toolbar.
- The pick must not fight the drag that spins the paper: a press that
  moves is a drag, a press that does not is a pick, which the pointer
  capture already distinguishes.

### 4. The sandbox sheet, Undo, Redo and Unfold

- The paper in Sandbox Mode shows a **sandbox sheet**: the pattern's flat
  sheet cut along the session's path, every fold made so far, in order,
  with the undone tail kept for Redo. It has the same shape as any sheet,
  so paper.js and pose.js render it unchanged.
- The sequence position along the sandbox sheet is the number of folds
  done. **Undo** is the position less one, at `UNFOLD_SECONDS`; **Redo**
  is the position plus one, at `FOLD_SECONDS`; **Unfold** is position 0.
  All three are the stepper's existing moves. A fold at position *k*
  drops the undone tail, appends the fold, recuts the sandbox sheet,
  swaps it in with paper.setSheet() at rest, and sets the target to
  *k* + 1. The swap is invisible: the new sheet posed at *k* puts every
  vertex where the old one did, since both are cut along the same *k*
  folds, and only the new fold's creases subdivide it further.
- paper.setSheet() today also redraws both fold-line canvases and uploads
  two 2,048 px textures. On a sandbox sheet swap the printed pattern is
  unchanged, so the geometry swap and the line redraw should be
  separable: a Decision for the plan, with the cost measured.
- Allocation happens on the press, not per frame, as a design change
  does today. The old geometry is disposed of, as setSheet() does.
- The printed pattern is the lattice's lines on the flat sheet, untyped,
  so drawFoldLines() needs a plain style beside its two dash patterns.
- The engine work: applyFold() exported over a face list; a builder that
  turns a face list and a fold list into the sheet shape that paper.js
  and pose.js already consume, so a sheet can be cut from any fold list;
  and the crossing extent of a line over a face list. cutSheet(design)
  stays as a thin wrapper, so Presentation Mode changes nothing.

### 5. The stepper walks a sheet, not a design

- stepSequence() reads the finished position from
  `designs[state.designId].steps.length`, and `main.js` keys sheets by
  design id. A sandbox sheet belongs to no design, so the state should
  name a **sheet**, each sheet carrying its design's or pattern's id for
  the aspect, start pose and lean lookups, and its own
  `finishedPosition`: the step count for a design's sheet, and none for
  a sandbox sheet, whose lines therefore never fade out.

### 6. Export as a design

- The session's fold list, with each fold's oriented `from` and `to`,
  its type and its angle, is a design's `steps` in the view frame, since
  the sheet starts front up with no roll and never turns over. The
  Export button produces that list.
- **Recommended: JavaScript source**, not JSON, since designs are
  modules and their coordinates are named fractions of the sheet, as
  [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks of every
  tuning number. Lattice points are exact fractions, so the export can
  write `[W / 4, -H / 2]` rather than `[0.0375, -0.075]`, with the two
  constants from sheetSize() at the top, an `id` placeholder, the
  pattern's `aspect` and `colorId`, and a `createFold()` line per fold.
  The Lead Developer pastes it into a new file under `docs/src/designs/`
  and adds its line to the list and its radio to the page, as today.
- The text goes to the clipboard through `navigator.clipboard.writeText()`,
  which needs a secure context (**Source**:
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText));
  `localhost` and GitHub Pages over `https` both are. A `<dialog>`
  showing the text, selectable, is the fallback and the place to say
  what to do with it.
- A design exported this way folds every layer at every step, so it
  plays back in Presentation Mode as recorded, and in Gameplay Mode becomes a
  maze whose traps can be measured as the
  [Gameplay Mode research](./14-gameplay-mode-research.md) measures the page's
  five designs'.

### 7. Angles: finishing folds now, a fold tree later

- **Now, for free:** a finishing fold at any angle, since the engine
  already poses one and refuses what would follow it. An angle control
  in the sandbox bar, flat or a named angle, applies to the next fold;
  after a standing fold, every line greys out and only Undo remains.
  The export records the angle as `targetRadians`, which createFold()
  takes. Enough for "stand the wings up at the end".
- **Later, the wrinkle:** folds at an angle that the player keeps
  folding after. The engine's placements are 2D reflections in one
  folded plane, which is why a standing flap cannot be moved again: its
  placement no longer says where it is. The general model is a **fold
  tree**: each face a rigid body with a 3D pose, each fold a rotation
  about a hinge line in a face's plane by any angle up to π, carrying
  every face attached beyond the hinge; "all layers" then means the
  faces coplanar with the hinge face that cross the hinge line, and the
  stacking and thickness logic applies within each coplanar stack.
  Posing becomes "transform each face by its pose, interpolating the
  fold under way", simpler than today's writePaperPositions(); cutting
  becomes harder, since a line in one face's plane must be tested
  against faces in every plane. Folds would then be defined on the
  sheet, a line in sheet coordinates carried by a face, rather than in
  one folded plane, which the design format would have to express. The
  engine still would not check that paper passes through paper. This is
  a new engine, and needs its own research; the dart's wings are its
  special case, standing folds last.

### 8. The toolbar

- A mode radio group, Presentation Mode and Sandbox Mode, in the same
  style as the design radios, keyboard-driven as they are. Gameplay Mode is
  added by its own plan, or present and disabled until then: a Decision
  for the plan.
- In Sandbox Mode the design radios give way to pattern radios, the Fold
  lines checkbox is forced on and disabled, the swatches work as before,
  and a sandbox bar holds Undo, Redo, Unfold, the angle control and
  Export. Undo and Unfold disable at position 0, Redo with no undone
  tail.
- Shortcuts: Ctrl+Z or Cmd+Z undoes; Ctrl+Y, Ctrl+Shift+Z or Cmd+Shift+Z
  redoes, with `preventDefault()` so the browser's own undo stays out of
  it. The page has no text field to compete with.
- Switching to Presentation Mode unfolds the sandbox sheet, swaps to the
  current design's sheet flat and folds it up, all with the stepper as it
  is.

### 9. Likely plans

Each ends in something the Lead Developer can QA in the browser; the
seam between each pair is where one could be accepted and the next
rejected.

1. **The engine opens up, and a lattice is a sheet**: applyFold()
   exported, a sheet cut from any fold list, the crossing extent, the
   smaller-side rule, and lattice patterns as data, all pure, with Agent
   QA asserting the table above in Node. Visible proof: Presentation
   Mode is unchanged, checksums and all.
2. **Sandbox Mode folds**: the mode and pattern radios, the plain-line
   printing, the sandbox sheet and the stepper walking it, picking a
   line with the pointer, the direction pair, folding, Undo, Redo,
   Unfold and the shortcuts. Visible proof: fold the eight-line pattern
   into a blintz by hand, undo and redo it.
3. **Export as a design**: the source-text export, the clipboard and the
   dialog, and one exported design round-tripped into a file and a radio.
   Visible proof: a design folded in the Sandbox plays in Presentation
   Mode.
4. **Finishing folds at an angle**: the angle control, the grey-out, and
   the angle in the export. Small, and could join 3.
5. Then Gameplay Mode, as the [Gameplay Mode research](./14-gameplay-mode-research.md)
   outlines, on top of 1 and 2; and one day the fold tree, after its own
   research.

## Open questions

For the Lead Developer, each to be settled before the plan that needs it
is drafted:

1. **Which patterns first?** Recommended: the eight-line half lattice
   with diagonals, which lasts about seven folds and makes the classic
   blintz and kite shapes, and the six-line quarter lattice. The
   twenty-line pattern is crowded and heavy, and can wait for the fold
   tree, where its length is worth more. Needed before Plan 1.
2. **Which side moves?** The smaller side, as measured, or the side under
   the pointer, with a refitting camera: see
   [Which side moves](#2-which-side-moves). Needed before Plan 1.
3. **Plain lines in every mode?** Sandbox patterns are untyped, so the
   plain style is built regardless; whether Presentation Mode keeps its
   Yoshizawa dashes is a separate choice, tied to whether Gameplay Mode
   prints plain lines (its
   [first open question](./14-gameplay-mode-research.md#open-questions)).
   Needed before Plan 2.
4. **Export as source or as JSON?** Source is recommended above; JSON
   would need a loader and a place to keep files, which the repo's rules
   do not provide for. Needed before Plan 3.
5. **The angle control**: a fixed set (flat, 90°, 45°) or a slider, and
   whether it belongs in the first Sandbox plan or waits for Plan 4.
6. **Whether to research the fold tree now**, so that the Sandbox's
   fold model is chosen with it in view, or after Gameplay Mode. Its export
   format and its "all layers" rule both differ from the flat engine's.

## Sources

- Three.js r187 unminified source, read on 2026-11-11:
  [`src/core/Raycaster.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Raycaster.js)
  (setFromCamera(), line 119),
  [`src/math/Ray.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Ray.js)
  (intersectPlane(), line 395),
  [`src/math/Vector3.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Vector3.js)
  (project(), line 499) and
  [`src/core/Object3D.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Object3D.js)
  (localToWorld(), line 670, which calls updateWorldMatrix() first).
- [MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText),
  for the secure-context requirement.
- [WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  the 24 px the swatches already follow, behind the "crowded" column.

## Audit

- **2026-11-11T14:14:18Z** — **drafted**: the brief recorded and the
  case for building the Sandbox before Gameplay Mode made; four lattice
  patterns measured under the smaller-side rule, and a 90° fold under
  the engine as it stands; an outline of lattice patterns, pointer
  picking, the sandbox sheet, export as source and angles; six open
  questions.
