---
title: Simple folds, the paper dart and the paper hat
description: Research for the plans after Plan 01, on simple folds for the dart and hat, cutting the sheet from a fold list, layer thickness, stretchy paper and printed fold lines.
type: research
---

## Context

- Supports the plans that follow
  [Plan 01](01-fold-sheet-in-half.md), not yet drafted: several
  folds made one after another, two classic designs, eased motion, paper
  with thickness, sheets that change shape between designs, and printed
  fold lines.
- Each claim below is one of three kinds, and says which:
  - **Prototype**: run on 2026-11-09 and 2026-11-10 in throwaway Node
    scripts, kept outside the repo. Their figures are the expected values
    for the real modules' Agent QA. The real code is written afresh, to
    [CLAUDE.md](../../CLAUDE.md)'s standards.
  - **Source**: read from a web page, linked in [Sources](#sources).
  - **Derived**: worked out on paper, not yet seen in a browser.
- Three.js facts were checked against the r187 source on 2026-11-09.

## Scope

Settled on 2026-11-09 and 2026-11-10.

- The sheet is cut differently for each design, and folds are made in
  sequence.
- "Paper Dart" and "Paper Hat" buttons replace "Mountain Horizontal" and
  "Valley Diagonal". "Flat" stays.
- The dart folds from the 15 cm square. The hat folds from an A4-shaped
  sheet of the same area, 126.1 × 178.4 mm, so the camera never moves.
  The page loads with the square.
- Switching designs always passes through the flat sheet, and the sheet is
  swapped for the new design's sheet at that moment. Where the two sheets
  differ in shape, the flat sheet stretches or shrinks from one shape to
  the other over 0.4 s (see [Stretchy paper](#stretchy-paper)). "Flat"
  keeps the shape of the sheet showing.
- Every fold is a true 180°, with layers held apart by the paper's
  thickness, replacing Plan 01's 178° limit. Thickness starts at 0.1 mm,
  with bridged creases, and is tuned by eye.
- Each fold eases in and out (slow, fast, slow) over about 0.7 s, and
  unfolding runs twice as fast.
- A button pressed mid-fold takes effect when that fold finishes. A
  press during a fade or a stretch likewise waits for it to finish.
- Fold lines are printed on the paper's coloured side in the
  Yoshizawa–Randlett style: dashed for a valley fold, dash-dot-dot for a
  mountain fold, or dash-dot should that prove easier to draw. They fade
  in before a design folds and fade out once the paper is flat again, so
  the flat sheet at rest is blank (see
  [Printed fold lines](#printed-fold-lines)). They replace the crease
  lines that were to fade in as each fold started.
- A fold through several layers prints as both kinds of line: the true
  crease pattern, as seen from the coloured side.
- A "Fold lines" checkbox, ticked when the page loads, switches the
  printed lines off and on.
- The dart's final pose is the view from above: wings spread towards the
  camera, keel behind, with the fold in half symmetric.
- The hat slides as it folds, so that the folded shape stays centred.
- The canvas stays truly transparent, and the scene never holds a
  background or any object but the paper. A future project relies on
  both.
- The work is three plans. Plan 02a is the dart. Plan 02b is the hat,
  with switching between designs and stretchy paper. Plan 02c is the
  printed fold lines and their checkbox. Plans 02a and 02b show no fold
  lines at all.
- Plan 03 onwards is presentation polish, one plan each: spinning the
  model by dragging, through the app's own pointer handler and not
  OrbitControls; colour choice; paper grain; the paper's shadows on
  itself. Nothing casts a shadow behind the paper. More designs in the
  Pureland style follow (see [Simple folds](#simple-folds)).

## Simple folds

- A **simple fold** folds flat paper along one straight line, moving
  either every layer the line crosses or only some of them (the front or
  back layers), and leaves the paper flat again. The term comes from
  Arkin and others, "When Can You Fold a Map?", which names the
  all-layers and some-layers variants (source).
- Pureland origami is the craft tradition with the same rule: mountain
  and valley folds only, one at a time (source).
- The dart and the hat need only simple folds (source, and prototype).
- The crane cannot be made by simple folds (source, the same paper). The
  paper boat cannot either: see [The paper hat](#the-paper-hat). Both
  need many creases to move at once, which is a different mechanism and a
  question for the plan after the polish plan.

## The paper dart

- The design is Fold'N Fly's "Basic Dart" (source): crease the centre
  line, fold the two top corners to the centre, fold the two slanted edges
  to the centre, fold in half, fold each wing down to meet the bottom edge
  of the body. Seven folds stay; the centre crease is folded and unfolded,
  so it need not be animated.
- Sources use A4 or US letter. It also folds from a square (prototype).
- Sources disagree or stay silent on whether the fold in half puts the
  earlier flaps inside or outside. The choice is free.
- Every crease passes through the apex, the midpoint of the top edge.
  With the sheet centred on the origin, `w` wide and `h` high, the apex is
  `(0, h/2)`, and each fold line leaves it at an angle measured from
  straight down, positive to the right:

  ```json
  [
    { "angleDegrees": -45, "layers": "all", "type": "valley" },
    { "angleDegrees": 45, "layers": "all", "type": "valley" },
    { "angleDegrees": -22.5, "layers": "all", "type": "valley" },
    { "angleDegrees": 22.5, "layers": "all", "type": "valley" },
    { "angleDegrees": 0, "layers": "all", "type": "valley" },
    { "angleDegrees": 11.25, "layers": "front-half", "type": "valley" },
    { "angleDegrees": 11.25, "layers": "back-half", "type": "mountain" }
  ]
  ```

  Folds 1 to 4 move the outer side of their line. Fold 5 brings the left
  half in front of the right. The prototype folded it as a mountain,
  which left the dart seen from below, against [Scope](#scope); a valley
  was ruled on 2026-11-10, and
  [Plan 02a's Decision 2](02a-paper-dart.md#decisions) holds the fold
  list as built. Folds 6 and 7 are the wings: the same line, folded
  opposite ways by the two halves, the front half first.
- Prototype results, the same for a 150 mm square and for A4:
  - After four folds: 7 faces, 9 triangles, 4 layers at the deepest.
  - After all seven, wings folded fully flat: 16 faces, 18 triangles,
    16 layers at the nose. The apex's 180° is cut into sixteen wedges of
    11.25°, which all stack there.
  - The faces' areas sum to the sheet's area at every stage.
- Folded bounding boxes, in mm, as `x` range then `y` range (prototype):
  - Square, after four folds: -62.1 to 62.1, -84.1 to 75.0.
  - Square, final: 0 to 29.8, -92.3 to 75.0.
  - A4, after four folds: -105.0 to 105.0, -148.5 to 148.5.
  - A4, final: 0 to 59.1, -166.1 to 148.5.
- The folded paper pokes outside the sheet's outline (the `y` of -84.1
  and -166.1 above), but at zero thickness it never leaves the flat
  sheet's bounding sphere, Plan 01's rule: 106.1 mm at most over the
  dart's whole sequence on the square (prototype, 2026-11-10, 256 poses
  per fold). A turn about a line in the sheet's plane keeps each point
  between its start and end distances from the centre (derived). The
  hat's slide does break the rule (see [Presentation](#presentation)), so
  framing still needs the largest distance from the centre over each
  design's whole fold sequence.

## The paper hat

- The design is the newspaper hat, the first stage of the paper boat
  (source): fold in half, fold the two top corners to the centre, fold the
  front strip up, fold the back strip up. Five folds.
- **It needs a rectangle.** Every source starts from A4, US letter or
  newspaper; one says to trim a square to a rectangle. On a square, the
  corner folds use the whole height and leave no strip for the brim. The
  brim is half the height less half the width (prototype):

  | Sheet                        | Size (mm)     | Brim (mm) |
  | ---------------------------- | ------------- | --------- |
  | 15 cm square                 | 150 × 150     | 0         |
  | A4                           | 210 × 297     | 43.5      |
  | A5                           | 148 × 210     | 31.0      |
  | A4-shaped, the square's area | 126.1 × 178.4 | 26.1      |

- With the sheet upright, `w` wide and `h` tall, the fold lines in the
  folded paper's plane are (prototype):
  1. The line `y = 0`, mountain, all layers: the top half goes behind the
     bottom half, so the folded edge is at the top and the open edges at
     the bottom.
  2. From `(0, 0)` to `(-w/2, -w/2)`, valley, all layers: the left corner
     comes forward to the centre.
  3. From `(0, 0)` to `(w/2, -w/2)`, valley, all layers.
  4. The line `y = -w/2`, valley, front layer only: the front strip folds
     up over the corners.
  5. The same line, mountain, back layer only.
- Prototype results on all three rectangles: 8 faces, 10 triangles, 6
  layers at the deepest. The folded hat spans `-w/2` to `w/2` in `x` and
  `-w/2` to 0 in `y`: -105 to 105 mm and -105 to 0 mm on A4, -63.1 to
  63.1 mm and -63.1 to 0 mm on the 126.1 × 178.4 mm sheet.
- With the first fold a mountain, both outer faces show the front colour,
  the corner flaps show the front colour, and the brim shows the back
  colour (derived).
- **The boat is out of reach.** Three sources agree that the steps after
  the hat open it and flatten it a different way, twice, then pull it
  apart into a 3D shape. Those are not simple folds.

## Cutting the sheet from a fold list

A design is a short list of folds, like a printed diagram, and code works
out the pieces. No crease pattern is drawn by hand (prototype).

- **State**: a list of faces. Each face is a convex polygon in sheet
  coordinates, a 2D isometry taking it to its place in the folded plane,
  and a layer rank.
- **One fold**: given a line in the folded plane, a type, and which layers
  take part:
  1. For each face taking part, find which side of the line each corner
     lies on, in the folded plane, and split the polygon there. Splitting
     a convex polygon by a line gives two convex polygons.
  2. The pieces on the moving side have their isometry composed with a
     reflection across the line.
  3. Their layer order reverses, and they stack above everything for a
     valley, or below everything for a mountain.
- **At load**, run every fold of a design once. The faces that result are
  the design's sheet: each stays rigid for the whole sequence. Record, per
  fold, which final faces move and about which line. Nothing is cut while
  the animation runs.
- **Rendering**: each convex face is a fan of triangles. Faces need their
  own vertices, since the two faces at a crease sit at different heights
  (see [Layer thickness](#layer-thickness)); Plan 01's shared, indexed
  points do not survive.
- **Heights come from what lies beneath.** Stacking every moved piece
  above a global counter left flaps floating: the dart's 16 faces spanned
  26 levels. The fix is to place each face one layer above the highest
  face it overlaps, testing overlap by clipping one convex polygon with
  the other. That gave the true depths quoted above (prototype).
- **Neither design has a T-junction** (prototype): no corner of one face
  lies part-way along another face's edge, for the dart on the square or
  the hat on any of the three rectangles. A fold through some layers only
  could leave one in a later design. A T-junction can show as a hairline
  crack, and a transparent canvas lets the page show through it, so each
  design is worth checking for them at load.

## Layer thickness

- Folding to 180° with layers offset by thickness is sound, and better
  than the alternatives. Draw-order and polygon-offset tricks depend on
  which side the camera is on, so they break with orbit controls and
  shadows. Stopping short of 180°, as Plan 01 does, leaves later fold
  lines no longer straight.
- **Real thickness is about 0.1 mm**: 0.106 mm for an 80 gsm paper, and
  115 microns for one kami-style paper (source, from search summaries
  only). The Lead Developer's first guess was 0.2 to 0.3 mm.
- **The depth buffer copes** (derived, assuming a standard 24-bit
  buffer). Its step at the paper is about 0.0012 mm for Plan 01's camera
  (150 mm square, 0.45 m away, near plane 0.01 m) and about 0.0036 mm for
  A4 at 0.77 m. A 0.1 mm gap is 28 steps or more.
- **On screen**, an 800-pixel-high view shows about 3.3 pixels per mm for
  the square and 1.9 for A4, so one layer's gap is invisible and the
  dart's 16-layer nose is about 3 to 5 pixels thick.
- **A rigid stack lands correctly** (derived). For a stack `n` layers
  deep, with thickness `t`, rotating the moving side by 180° about the
  fold line raised to height `(n - ½) × t` puts moving layer `i` at height
  `(2n - 1 - i) × t`: on top of the stack, in reverse order.
- **The general pose** (derived): rotate the face about the fold line by
  the fold's angle, then offset it along its own normal by `t` times a
  value that moves from its height before the fold to minus its height
  after. Both ends are in the same order across the moving faces, so they
  never cross on the way.
- **Creases need a bridging strip.** The two sides of a crease end at
  different heights, up to the stack's depth: 1.6 mm at the dart's nose.
  A narrow strip joining the two edges makes the fold look rounded, like
  paper. Without it the fold shows as a slit.
- **Last folds may stop short of 180°**: the dart's wings finish at 90°.
  Only a fold whose faces no later fold moves can do so: the dart's near
  wing stops short before the far wing, which moves other layers, folds.

## Animation

- Plan 01's state, one crease and one angle, becomes a design and a
  position along its fold sequence: a real number from 0 (flat) to the
  number of folds. Unfolding runs the sequence backwards.
- A target on another design sends the position to 0, swaps the sheet,
  stretches it if the shapes differ (see
  [Stretchy paper](#stretchy-paper)), then runs the new sequence, as
  Plan 01 unfolds to flat before folding another crease.
- **Easing each fold makes flat the slowest moment, not the fastest.**
  The paper is at rest there, so fold lines jumping from one pattern to
  the other would be at their most visible. The old design's lines
  therefore fade out as soon as the paper lies flat, and the new design's
  fade in before it folds, which leaves the sheet blank for the swap and
  the stretch (see [Printed fold lines](#printed-fold-lines)).
- **Every fold starts and ends at rest**, since each eases in and out.
  Reversing mid-fold would flip the velocity at once, the abruptness the
  easing is there to remove. The rule, settled on 2026-11-10: a new
  target takes effect when the fold in progress finishes, at most 0.7 s
  later, where the paper is at rest anyway.
- r187's `MathUtils` has `smoothstep()`, `smootherstep()`, `damp()` and
  `lerp()`.
- Timings: about 0.7 s per fold, unfolding twice as fast, so the dart's
  seven folds take about 5 s. A switch from the dart to the hat takes
  6.35 s: 2.45 s to unfold, 0.4 s to stretch and 3.5 s to fold. Printed
  fold lines add 0.9 s (see [Printed fold lines](#printed-fold-lines)).

## Stretchy paper

Designs fold from sheets of different shapes: the dart from a square, the
hat from an A4-shaped rectangle, later designs perhaps from a letterbox.
When a switch of design changes the sheet's shape, the flat sheet
stretches or shrinks into the new shape before the new folds begin.

- **Paper stretches only while flat**: at position 0 of a sequence, never
  part-way through a fold.
- **It is cheap** (derived). With the fold lines faded out, the flat sheet
  is one blank rectangle, whichever design's pieces it is made of. The
  stretch is a change of that rectangle's width and height: a scale in
  the sheet's plane on the incoming design's flat mesh, easing to 1. No
  fold maths is involved, and flat faces keep their normals under such a
  scale, so the shading does not change.
- **State** (proposed): the stepper holds the sheet's current width and
  height beside the design and the position. A switch runs three phases
  in order: unfold to 0; swap to the incoming design's flat mesh, scaled
  to the outgoing sheet's size, and ease that size to the incoming
  sheet's; fold. The stretch's scale sits on the mesh, inside whatever
  group a later plan spins by dragging.
- **Sheet sizes** (settled on 2026-11-10): every sheet has the area of
  the 15 cm square, 22,500 mm², so a design states only its shape. The
  A4-shaped sheet is then 126.1 × 178.4 mm (prototype). The stretch reads
  as stretching, narrower as it grows taller, rather than as growing. The
  two sheets' half-diagonals, 106.1 and 109.2 mm, are close enough that
  one camera position frames both, so the camera never moves.
- **The alternative was real A4**, 210 × 297 mm, half-diagonal 181.9 mm.
  One camera position that fits it shows the dart's square at 58% of the
  size it could be, so the camera would have to ease back during the
  stretch.
- **The stretch has its own short phase** between unfolding and folding:
  0.4 s, eased (settled on 2026-11-10). It fills the moment when the
  paper would otherwise sit still. Two designs on the same shape of sheet
  skip it.
- **"Flat" keeps the current sheet** (settled on 2026-11-10): it unfolds
  the design showing and leaves its sheet as it is. The page loads with
  the square.
- **Paper grain**, in a later plan, needs a rule for the stretch: either
  the grain stretches with the sheet, or its texture repeat follows the
  sheet's size so that the grain holds still.

## Printed fold lines

Origami diagrams mark each fold with a line, in the Yoshizawa–Randlett
style: dashes for a valley fold, dashes and dots for a mountain fold, with
one or two dots to a dash depending on the author, and a thin line for a
crease already made (source). Here the lines are printed on the paper, as
on a sheet from a kit, and show where the design will fold.

Required on 2026-11-10:

- **Where**: on the coloured side only.
- **What**: black lines, dashed for a valley fold, dash-dot-dot or
  dash-dot for a mountain fold. An existing crease is not marked.
- **Flat paper at rest never shows lines.**
- **"Flat" pressed while a design is folded**: the paper unfolds, and as
  soon as it lies flat the lines fade out over 0.3 s.
- **A design pressed while the paper is flat**: the blank sheet first
  stretches, if its shape must change. The lines then fade in over
  0.6 s. Only then do the folds start.
- **A design pressed while another is folded**: the paper unfolds; the
  old design's lines fade out over 0.3 s; the blank sheet stretches, if
  it must; the new design's lines fade in over 0.6 s; the folds start.
- **A toggle**, optional, switches the printed lines off altogether. With
  them off, neither fade's time is spent.

What follows from that:

- **The coloured side is the front**: red, facing the camera while the
  sheet lies flat. The back is off-white (`PAPER_FRONT_COLOR` and
  `PAPER_BACK_COLOR` in `docs/src/scene/paper.js`, checked 2026-11-10).
- **Printed lines are a crease pattern**: fixed on the sheet, all of a
  design's lines at once. They replace the crease lines that were to fade
  in one at a time as each fold started, and Plan 01's `LineSegments`.
- **A fold through several layers prints as both kinds of line**
  (settled on 2026-11-10). Seen from the front of the sheet, such a fold
  is a valley on the layers lying face up and a mountain on the layers
  lying face down. The engine knows which is which: a face lies face down
  when its isometry is a reflection, and its line then takes the opposite
  type. A line's ends are where the fold line crosses the face, in sheet
  coordinates. The alternative gives every line the type of the fold as
  it is made, which prints a pattern that would not fold into the design.
- **The dart's sheet** prints 15 lines, all meeting at the nose: 8
  valley, 1,023 mm in all, and 7 mountain, 735 mm (prototype). Each of
  the first two folds is one valley line, and the fold in half is one
  mountain line down the middle. The third and fourth folds each print a
  valley and a mountain line, and each wing fold prints two of each.
- **The hat's sheet** prints 7 lines: 4 valley, 431 mm in all, and 3
  mountain, 304 mm (prototype). The fold in half is a mountain line
  across the middle. Each corner fold is a valley diagonal below it and a
  mountain diagonal above. Both brim folds are valley lines.
- Both patterns are mirror-symmetric left to right, types included
  (prototype).
- **Lines show only where the front shows** (derived). A flap that turns
  its back to the camera hides its own lines and covers those beneath
  it, so lines drop out of view as the design folds.
- **A line lies along a crease, half its width on each face** (derived).
  A valley fold closes over its own line. A mountain fold leaves half the
  line's width in view along the folded edge.
- **A mountain line is dash-dot-dot** (settled on 2026-11-10), with
  dash-dot allowed should it prove easier to draw. `setLineDash()`
  takes one list of alternating line and gap lengths (source, MDN, read
  2026-11-10), so either pattern is one list, and neither is the easier
  (derived, not seen in a browser).
- **Rendering** (proposed): draw each design's lines once into a 2D
  canvas with `setLineDash()`, and show that canvas through a third mesh
  that shares the paper's geometry: front side only, with a transparent
  `MeshBasicMaterial` whose `map` is a `CanvasTexture`. Each face then
  carries its own part of every line with no pose maths of its own, and a
  fade is the material's `opacity`.
  - It needs UVs equal to sheet coordinates, as the paper grain will.
  - r187 has `CanvasTexture`. A material's `depthFunc` defaults to
    `LessEqualDepth`, so a second mesh on the same geometry draws over
    the first, and `polygonOffset` is there if the two ever fight
    (checked in the vendored file on 2026-11-10, not in a browser).
  - `LineDashedMaterial` does not fit. It takes one `dashSize` and one
    `gapSize`, so it cannot draw dash-dot-dot (checked in the vendored
    file), and Three.js's documentation says WebGL draws lines one pixel
    wide on most platforms (from memory of that page, not re-read).
  - A 2,048-pixel canvas gives 11.5 pixels per millimetre on the hat's
    sheet, against about 6.6 device pixels per millimetre on an
    800-pixel-tall view at a pixel ratio of 2 (derived). It costs about
    22 MB of GPU memory with mipmaps (derived), so one texture is
    redrawn for the incoming design while the sheet is blank.
- **Black will not show on a dark paper colour.** The colour plan chooses
  its paper colours, or the line colour, with that in mind.
- **Timings**: the dart takes 5.5 s from flat, 0.6 s for the lines and
  4.9 s to fold, and 2.75 s back. A switch from the dart to the hat takes
  7.25 s: 2.45 s to unfold, 0.3 s, 0.4 s and 0.6 s on the flat sheet,
  then 3.5 s to fold.
- **Presses during a fade or a stretch** (settled on 2026-11-10): they
  take effect when it finishes, as for a fold.
- **The toggle** (settled on 2026-11-10): a checkbox labelled "Fold
  lines", ticked when the page loads. Changed while a design is folded,
  it fades the lines out or in where the paper is, over the same 0.3 s
  and 0.6 s.
- **Sizing** (settled on 2026-11-10): printed lines and their toggle
  come to about eight criteria, with a gate of their own. By the seam
  test they are a third plan, 02c, after the hat. Plans 02a and 02b show
  no fold lines at all, so 02a removes Plan 01's crease lines.

## Presentation

- Which side of a fold moves is a choice of view, not of geometry. Plan
  01 turns both sides by half the angle, so the crease stays put. Doing
  the same for the dart's fold in half keeps the model centred, and shows
  the dart from above: wings spread towards the camera, keel behind,
  flaps showing on top (derived).
- The hat's first fold leaves the model in the lower half of the sheet's
  area: the folded hat spans `-w/2` to 0 in `y`. Settled on 2026-11-10:
  the model slides as it folds, so that the folded shape stays centred on
  the origin. One rule that does it: the model's offset moves from the
  centre of the flat-folded shape before each fold to its centre after,
  in step with that fold's eased progress. The dart's last three folds
  leave the plane, and keep the centre they start with. The slide carries
  the hat's top corners outward during its first fold, to 116.3 mm from
  the centre against a flat half-diagonal of 109.2 mm (prototype,
  2026-11-10, zero thickness).
- Folded paper can leave the flat sheet's outline. Proposed, following
  from the sheet sizes above: the camera is placed once, by the largest
  radius the paper reaches over both designs' whole sequences, and stays
  there.
- The canvas clears to transparent (`alpha: true` in
  `docs/src/main.js`, checked 2026-11-09) and must stay so.

## What changes in the code

- `docs/src/paper/crease-pattern.js`, `docs/src/fold/kinematics.js` and
  `docs/src/fold/animation.js` are replaced: by the fold engine, the pose
  maths with thickness, and the sequence stepper.
- `docs/src/scene/paper.js` moves from 9 shared points to per-face
  vertices and bridging strips, loses Plan 01's crease lines, and must
  dispose of the old sheet's geometry when the sheet is swapped. The
  printed fold lines add UVs and a third mesh.
- `docs/src/main.js` places the camera by the largest radius the paper
  reaches, rather than by the flat square's.
- `docs/index.html` and `docs/src/ui/fold-buttons.js` take the new button
  names.
- The engine, the pose maths and the stepper stay pure, so Node can run
  them in Agent QA against the prototype's figures above.
- By the seam test, the work is Plans 02a and 02b (settled on
  2026-11-10): the dart first, with the engine, the pose maths with
  thickness and the eased stepper; then the hat, with folds of the front
  or back layer only, the switch between designs, and stretchy paper. The
  dart's wings already fold some layers only, so the engine's layer
  selection arrives with the dart.
  After 02a alone, the page has two buttons, "Flat" and "Paper Dart";
  "Paper Hat" arrives with 02b. Printed fold lines and their checkbox
  are a third plan, 02c, after the hat. Until then the paper shows no
  fold lines: 02a removes Plan 01's crease lines.

## Open questions

None for the Lead Developer. The questions of 2026-11-09 and 2026-11-10
are all answered, and their answers stand in [Scope](#scope) and
[Printed fold lines](#printed-fold-lines).

Three items above are still marked "proposed": the stepper's state, where
the camera is placed, and how the printed lines are drawn. They are
engineering choices that no one has ruled on, and each becomes a
Decision in the plan that uses it.

## Sources

- [Fold'N Fly: Basic Dart](https://www.foldnfly.com/1.html)
- [Art of Manliness: paper aeroplanes](https://www.artofmanliness.com/articles/how-to-make-the-worlds-best-paper-airplanes/)
- [Utrecht University: hat](https://webspace.science.uu.nl/~bodla101/d.origami/traditional/hat.html)
  and [boat](https://webspace.science.uu.nl/~bodla101/d.origami/traditional/boat.html)
- [Docs-as-code demo: hat](https://docs-as-code-demo.readthedocs.io/en/latest/21_folding_a_paper_hat.html)
  and [boat](https://docs-as-code-demo.readthedocs.io/en/latest/22_folding_a_paper_boat.html)
- [origami.guide: traditional boat](https://origami.guide/origami-vehicles/origami-boats/traditional-origami-boat/)
- [Wikipedia: Pureland origami](https://en.wikipedia.org/wiki/Pureland_origami)
- [Wikipedia: Yoshizawa–Randlett system](https://en.wikipedia.org/wiki/Yoshizawa%E2%80%93Randlett_system)
- [MDN: setLineDash()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash)
- [Arkin and others, "When Can You Fold a Map?"](https://arxiv.org/pdf/cs/0011026v2)
- [Canon: 80 gsm paper, 0.106 mm](https://ij.manual.canon/ij/webmanual/Manual/All/TM-355/EN/PIF/pif_4013_3rc.html)
- [OrigamiUSA: kami-style paper, 115 microns](https://origamiusa.org/node/3785)
