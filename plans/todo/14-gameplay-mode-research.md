---
title: Gameplay Mode research
description: The brief for Gameplay Mode, a game that teaches each design's folds, measured against the fold engine, with an outline of how it could be built on top of Basic Sandbox Mode.
type: research
---

## Context

- The [Basic Sandbox Mode research](./13-sandbox-mode-research.md) names
  the app's one mode today Presentation Mode, adds a radio group to
  choose the mode, and outlines Basic Sandbox Mode: free folding on a
  printed lattice, on an engine opened up to cut a sheet along any fold
  list, with Undo, Redo and Unfold, a line picked by pointing, and a
  choice of direction at every fold. This file brings together the brief
  for the third mode, Gameplay Mode, in which the player makes a design's
  folds as a game, measures it against the engine, and outlines how it
  could be built on top of the Sandbox.
- The first section, [The brief](#the-brief), is the Lead Developer's
  brain-dump of 2026-11-11, reorganised and reworded. The rest measures
  the brief against the engine and outlines how Gameplay Mode could be built.
  Nothing here is a plan: Gameplay Mode's plans come after the Sandbox's,
  and this file is their reference.
- Each claim below is one of four kinds, and says which:
  - **Code**: checked in this repo's source on 2026-11-11.
  - **Measured**: run on 2026-11-11, in Node 25.8.0 on the Lead
    Developer's Mac, by scripts that drive the repo's own engine through
    every ordering of each design's folds. The scripts are kept at the
    repo root as `tmp-gameplay-mode-graph.mjs`, `tmp-gameplay-mode-anchors.mjs`
    and `tmp-gameplay-mode-graph-loose.mjs`, which git ignores; each is run
    as `node <file>`, and the first takes `strict` or `printed`.
  - **Source**: read in the pinned Three.js release's unminified source,
    r187 on GitHub, or in a paper, linked where cited.
  - **Derived**: worked out, not prototyped and not seen in a browser.
- Terms the brief gives in title case keep it throughout: Presentation
  Mode, Gameplay Mode, Sandbox Mode, Fold Button, and the Undo, Redo, Unfold
  and Hint buttons.

## The brief

### Modes

- Presentation Mode stays the default.
- Gameplay Mode joins Presentation Mode and Sandbox Mode in the mode radio
  group that
  [Basic Sandbox Mode](./13-sandbox-mode-research.md#8-the-toolbar)
  adds.

### Entering Gameplay Mode

- In Gameplay Mode, clicking a design's radio animates the paper to the flat
  sheet with that design's lines showing, in that design's colour,
  stretched to its shape and turned about both its upright axis (which
  side faces the viewer) and the line of sight (its roll and lean) to the
  design's suggested start.

### Fold Buttons

- In Gameplay Mode, every fold line carries a circular overlay, its Fold
  Button. A Fold Button keeps the same size in screen pixels and faces the
  viewer at all times, whatever the paper's orientation.
- Fold Buttons can be hovered and clicked, and show `cursor: pointer` on
  hover.
- A Fold Button normally sits over the centre point of its fold line, with
  three exceptions:
  1. **Overlap.** Two Fold Buttons would overlap, which the paper dart may
     suffer. They must be moved apart somehow.
  2. **Ambiguity.** The centre point of one fold line lies on another fold
     line, so a button there would not say which line it folds. It must be
     moved somehow.
  3. **A fold that cannot be made**, because of the paper's shape or the
     folds already made. Whether this ever happens needed thought or
     research; see
     [the engine's answer](#what-cannot-be-folded-means-in-the-engine).
- Gameplay Mode is a fun, mildly challenging game, not a way to exercise every
  possible fold of a design's sheet. Fold Buttons hint at fun chances to
  fold, rather than exhaustively marking every fold the paper allows.

### The game

- Gameplay Mode gives a gamified way to learn each design. Shown a design's
  lines on a flat sheet, the player presses Fold Buttons to attempt folds,
  tries different sequences, and gradually learns an order that works.
- Some folds can be made in any order; a design need not force one strict
  sequence. The paper dart's two wings, for example, fold in either order.

### Undo, Redo and Unfold

- No fold gets its own "unfold" button on its folded edge: that is
  complex UI logic for little gain.
- Instead there is a simple linear undo/redo system: two buttons, Undo and
  Redo, plus the device's usual shortcuts: Ctrl+Z and Ctrl+Y, and on a Mac
  Cmd+Z and Cmd+Shift+Z. It resets on entering Gameplay Mode and on switching
  to another design.
- An Unfold button repeats Undo until Undo goes grey (disabled), returning
  the paper to the fully unfolded start. It is not a reset: points scored
  and lives lost in the current gameplay session are untouched. It is a fast
  way to start again when stuck.

### Dead ends and lives

- After one or more wrong Fold Buttons, the player may reach a point where
  no further valid fold is possible, so no Fold Button is available: a
  dead end. Perhaps a life is lost there, with a visual sign or a message.
- From a dead end, the player must Undo or Unfold to try another sequence.
- Perhaps a dead end once reached becomes unreachable for the rest of that
  design's gameplay session, by disabling the Fold Button that led to it.

### Hints

- Perhaps a hint system guides a player who is stuck. Hints might work like
  power-ups: at most five slots, earned as the player progresses, and
  spent by pressing a Hint button, which highlights the correct Fold Button
  to press next.

### The maze

- Gameplay Mode is close to a maze game. The choice of fold at each step is a
  choice of path; some choices lead to a dead end, from which the player
  must backtrack and try another sequence; and there may be several valid
  paths to the one goal.
- Internally, the folding process could be a decision tree or graph: each
  node is a state of the paper, and each edge a valid fold from one state
  to another. The graph lets the game track sequences, detect dead ends,
  carry custom rules such as special Fold Button positions, and give the
  right feedback. How big each design's graph gets was an open question:
  see [Measurements](#measurements).
- Dead ends already reached are blocked, so a route proven wrong cannot be
  re-explored by accident, and the Hint button points along the right path
  at a junction.

### Plain lines and a choice of direction

- The game might be more challenging if the lines were printed as plain
  straight lines, with no mountain or valley marking. Each fold line
  would then carry two Fold Buttons side by side, one for a mountain fold
  and one for a valley fold, and the player would choose the direction
  as well as the order.
- Basic Sandbox Mode already prints its patterns as plain lines and asks
  for a direction at every fold
  ([Picking a line](./13-sandbox-mode-research.md#3-picking-a-line-with-the-pointer)),
  so Gameplay Mode could reuse both.

### Designs in scope

- The house, ice-cream cone, paper hat and watermelon are left out:
  Gameplay Mode is unlikely ever to use them. The five designs the page
  offers, the pencil, Mount Fuji, the yacht, the paper dart and the
  heart, are in scope.

## Working assumptions

Agreed with the Lead Developer on 2026-11-11, while this file was being
written; each becomes a Decision in the plan that uses it.

1. **A Fold Button folds only along printed creases.** Of the three
   availability rules measured below, the "printed" rule is the working
   one: a fold is available when every crease it would make lies along a
   crease the design prints for that fold. See
   [Three availability rules](#three-availability-rules).
2. **Each design's traps are listed**, by fold, so the maze each design
   makes is known before it is built. See
   [The traps, design by design](#the-traps-design-by-design).

## What the code does today

All **Code**, checked on 2026-11-11. The
[Basic Sandbox Mode research](./13-sandbox-mode-research.md#what-the-code-does-today)
records the design format, the engine, the pose, the stepper and
`main.js` as they stand; one further fact matters to Gameplay Mode alone.

- Every design on the page turns over an even number of times: the
  pencil, Mount Fuji and the heart twice, the yacht and the dart never.
  So each finished model faces the viewer with its front side, as its
  flat sheet does after an even number of turns.

## Measurements

The scripts drive cutSheet() through synthetic designs: each design's
folds in the front's terms, in a chosen order, with no turn-overs and no
starting pose. A fold's `{ movedBy }` naming a fold not yet made selects
nothing, so the fold is unavailable; `{ heldBy }` naming one not yet made
selects every face. Two states are the same when they hold the same folds
and the same faces, each in the same place and on the same layer. The
goal is the design's own final state.

### Three availability rules

A fold is tried at a state only if the rule allows it:

- **Loose**: any fold the engine runs without throwing. The fold's line
  cuts whatever paper lies across it, printed crease or not.
- **Printed**: every crease the fold would make lies, end to end, along
  the creases the design prints for that fold, which may be several
  collinear pieces. The fold may make fewer creases than the design's (a
  flap it should cut is not there yet), never one anywhere else.
- **Strict**: the fold makes exactly the creases the design prints for it.

### Results

**Measured.** Fold counts leave out turn-overs. "Live" states can still
reach the goal; "doomed" cannot; a "dead end" is a state, not the goal,
with no available fold; a "trap" is an edge from a live state into a
doomed one; "orderings" counts the distinct fold orders that reach the
goal.

| Design | Folds | Rule | States | Live | Doomed | Dead ends | Traps | Orderings | Time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pencil | 6 | loose | 901 | 9 | 892 | 247 | | 4 | |
| | | printed | 161 | 9 | 152 | 39 | 9 | 4 | 189 ms |
| | | strict | 17 | 9 | 8 | 3 | 3 | 4 | 40 ms |
| Mount Fuji | 4 | loose | 51 | 7 | 44 | 15 | | 4 | |
| | | printed | 15 | 7 | 8 | 3 | 2 | 4 | 4 ms |
| | | strict | 7 | 7 | 0 | 0 | 0 | 4 | 2 ms |
| Yacht | 3 | loose | 9 | 4 | 5 | 2 | | 1 | |
| | | printed | 4 | 4 | 0 | 0 | 0 | 1 | 1 ms |
| | | strict | 4 | 4 | 0 | 0 | 0 | 1 | 1 ms |
| Paper dart | 7 | loose | 292 | 16 | 276 | 81 | | 22 | |
| | | printed | 116 | 16 | 100 | 39 | 23 | 22 | 74 ms |
| | | strict | 46 | 16 | 30 | 11 | 10 | 22 | 41 ms |
| Heart | 11 | loose | 23,342 | 65 | 23,277 | 1,567 | | 2,268 | ~85 s |
| | | printed | 65 | 65 | 0 | 0 | 0 | 2,268 | 195 ms |
| | | strict | 65 | 65 | 0 | 0 | 0 | 2,268 | 196 ms |

What the table says:

- **The live graph is tiny**: 4 to 65 states, whatever the rule, since
  the rule only changes which wrong turns exist. It is the same for all
  three rules because every ordering that reaches the goal folds only
  along printed creases, exactly.
- **Loose is not a game.** Almost every move is wrong, the heart's graph
  runs to 23,342 states, and enumerating it took about 85 seconds, far
  too slow to build at load. The time is the naive script's, which recuts
  the sheet from flat for every state; an incremental engine would be
  faster, but not a thousand times.
- **Strict is too kind** to Mount Fuji, whose two slopes can then never
  be folded before the middle, and to the pencil, whose sides can then
  never be folded before the tip and body. Printed keeps those traps, and
  the dart's "edge before corner" traps, which are exactly the mistakes a
  learner makes with real paper.
- **Under any rule, the yacht is a line and the heart is a free-for-all**:
  the yacht has one order, and the heart 2,268 orders with not one trap.
  As order puzzles, neither challenges anyone. The brief's
  [direction choice](#plain-lines-and-a-choice-of-direction) changes
  that: see [Direction as a second choice](#direction-as-a-second-choice).
- **Printed graphs build in under 200 ms per design**, even recut from
  flat at every state, so a browser can build them at load or on entering
  Gameplay Mode.
- **No ordering under any rule left a T-junction**, which cutSheet()
  throws on, so every reachable state can be bridged and rendered as the
  engine does today.
- **The widest reach** of any printed-rule state is 0.1223 m (the dart,
  mid-maze), 1% beyond the 0.1211 m the camera and bounding sphere are
  set from today. The plan that builds the graph should take the camera's
  radius from the graph's states, not the designs' sequences alone.
- **Layers matter to the goal.** Under the loose rule, 35 orderings reach
  the dart's final *shape* but only 22 reach its final *stacking*: the
  other 13 fold the sheet in half first, then both corners through two
  layers, and end with the flaps stacked as a mirror image. The printed
  rule rules those out on its own (the half fold first is a trap, since
  the corner fold then creases the other layer, where that crease is
  printed for the other corner's fold). Whether such a dart should count
  as finished is [open](#open-questions).

### The traps, design by design

**Measured**, under the printed rule. Folds are numbered by their index
in the sheet's `folds`, which skips turn-overs; the mapping to each
design's steps, and the names the design files give them, follow.

- **Pencil** (folds 0 to 5 are steps 0, 1, 3, 4, 5, 6: tip, body, right
  side, left side, right corner, left corner). The tip and body fold in
  either order; the sides then fold in either order; then the right
  corner, then the left. Nine traps: either side before both the tip and
  the body are in (2 or 3 from the flat sheet, or after 0 alone or 1
  alone), a corner before the other side (after 0, 1, 2 the right corner
  4; after 0, 1, 3 the left corner 5), and the left corner before the
  right (after 0, 1, 2, 3 the fold 5). Every one of its 39 dead ends
  arrives only once all six folds are made, when the model is nearly
  right but a flap lies over the wrong neighbour: the dead-end signal,
  "no Fold Button left", comes with the last fold, not before.
- **Mount Fuji** (folds 0 to 3 are steps 0, 2, 3, 4: snow, middle, right
  slope, left slope). The snow and the middle fold in either order; the
  slopes then fold in either order. Two traps: either slope straight
  after the snow, before the middle (after 0, the folds 2 or 3). As with
  the pencil, each dead end comes with the fourth fold.
- **Yacht** (folds 0 to 2 are its steps: diagonal, sail, hull). One
  order, no traps: the sail needs the diagonal, and before the sail is
  folded the hull's line would crease the sail's region of the top layer,
  where no hull line is printed, since the printed one on that paper is
  where it lies once the sail is folded over.
- **Paper dart** (folds 0 to 6 are its steps: left corner, right corner,
  left edge, right edge, half, near wing, far wing). The corners fold in
  either order, each edge once its corner is in, the half once all four
  are in, then the wings in either order. From the flat sheet, four of
  the six available folds are traps: either edge (2, 3), the half (4) and
  the far wing (6). The far wing first is a dead end on its own: it stops
  at 90°, and the engine refuses any later fold that would move its
  faces, which every other fold would. The dart has 23 traps and 39 dead
  ends, some two folds deep (right corner, then left edge), some seven.
  It is the best maze of the five.
- **Heart** (folds 0 to 10 are steps 0 to 2 and 4 to 11: strip, right
  flap, left flap, right side, left side, top-right corner, right-middle
  corner, left-middle corner, top-left corner, right tip, left tip). No
  traps: every available fold keeps the goal reachable, and 2,268 orders
  reach it. The strip comes first; the flaps, sides, corners and tips then
  interleave freely, each corner needing its flap and its side, each tip
  its two corners.

### Direction as a second choice

**Derived**, from how applyFold() works. With plain lines and a mountain
and a valley button per fold:

- A fold made the wrong way makes exactly the same creases as the right
  way, splits the same faces, and leaves their placements the same; only
  their layers and the turn's direction differ. So the printed rule
  cannot tell a wrong direction from a right one, and neither can any
  later fold's availability: the dead-end signal, "no Fold Button left",
  never fires for a direction mistake until the last fold is made and the
  result is not the goal.
- Every available fold at every live state gains a trap, its wrong
  direction, since the goal's stacking fixes each direction. The yacht
  becomes three decisions and the heart eleven, which is the challenge the
  brief hoped for. Out-degree doubles.
- A doomed state's subtree grows by a factor of two per remaining fold,
  so enumerating doomed states, as the measurements did, is out: the
  heart would run to tens of thousands. The outline below therefore
  builds only the live graph and judges any other state on the fly; see
  [the live graph](#2-the-live-graph-and-availability-on-the-fly).
- A design's fold direction is fixed in the front's terms, but the player
  sees the paper from either side, and a valley seen from the front is a
  mountain seen from the back. The pair of buttons is better labelled
  "towards me" and "away from me", as the Sandbox's pair is, than
  mountain and valley, with the type worked out from which side of the
  fold's face faces the camera.
- The Yoshizawa dashes that leave the paper could move onto the buttons,
  each button showing the pattern of the fold it makes.

### Fold Button anchors

**Measured**, under the printed rule, with each available fold's anchor
at the midpoint of the extent of its line's crossing of the faces it
selects, in the folded plane; see `tmp-gameplay-mode-anchors.mjs`.

- **Overlap.** The dart's two wing folds share one line, so from the half
  fold on, both are available and their anchors coincide (0 mm apart).
  On the flat dart, the half fold's anchor and the far wing's are 15 mm
  apart. Elsewhere the closest pair is 26.5 mm: the pencil's corners once
  its sides are in, and the heart's two middle corners.
- **How far is that on screen?** **Derived**, from
  [Millimetres on screen](./13-sandbox-mode-research.md#millimetres-on-screen):
  24 px buttons overlap at 15 mm on a 390 px-wide phone (22 px apart)
  and clear at 26.5 mm (39 px); on the desktop both clear. With a pair
  of buttons per fold, every anchor needs room for two.
- **Ambiguity.** In the heart, after the strip and one flap, the other
  flap's anchor lies exactly on the line of that lobe's middle-corner
  fold, which is also available; and once both corners of a lobe are in,
  a corner's anchor lies on its tip's level line. Nowhere else does an
  anchor lie on another available fold's line.
- **No anchor fell in a gap** between two crossing pieces of its line, so
  the midpoint of the extent is always on paper.

### What "cannot be folded" means in the engine

The brief's third exception asked whether a fold can ever be impossible.
In the engine it can, in two forms, and in reality in a third:

- **The fold moves nothing** (**Code**: applyFold() throws). Its line
  crosses none of the faces its layers select: a wing fold before the
  half fold, whose `{ movedBy }` names a fold not yet made; or a corner
  fold after the half fold, whose corner is no longer where the line is.
  The loose exploration met this 375 times in the dart and 21,868 in the
  heart (**Measured**).
- **The fold would move faces left standing** by an earlier fold that
  stops short of 180° (**Code**: applyFold() throws). Only the dart has
  such folds, its wings; the loose exploration met this 69 times there.
- **The paper would pass through itself.** The engine reflects and stacks
  faces and never checks that a flap's swing is clear of other layers, so
  a fold the printed rule allows may be one real paper could not make
  without tucking. No design in scope folds anything under a layer, and
  the printed rule forbids most such folds anyway, but this is a
  simplification Gameplay Mode inherits, not a check it makes.

Under the printed rule, a fold that cannot be made is simply not
available, so it has no Fold Button or a disabled one; the brief's third
exception needs no placement rule of its own. The theory behind the
question is Arkin, Bender, Demaine, Demaine, Mitchell, Sethia and
Skiena's
[When can you fold a map?](https://erikdemaine.org/papers/MapFolding/)
(**Source**: its abstract), which asks which crease patterns can be
folded by simple folds alone, exactly Pureland's constraint, and finds the
general question NP-hard. With at most eleven folds a design, Gameplay Mode
enumerates instead.

## An outline of the implementation

**Derived** throughout, unless marked. An exploration, not a plan: each
part names its options and a recommendation, for discussion.

### 1. Gameplay Mode folds the design's folds, in the front's terms

- The folds a player makes are the sheet's `folds`: the design's steps
  read into the front's terms, turn-overs dropped. The player turns the
  paper by dragging to see the back, so a turn-over step has nothing to
  do, and every design in scope ends facing the front anyway.
- Fold *i* keeps its line, layers, type and stop angle. Its `layers`
  name a fold by index, so "the near wing needs the half fold" falls out
  of the engine as it is: a fold whose `{ movedBy }` names a fold not yet
  made selects nothing and is unavailable.
- A design whose turn-over count is odd would finish showing its back;
  Gameplay Mode could end such a design with a turn-over flourish. None is in
  scope, so this waits.

### 2. The live graph, and availability on the fly

- **The live graph** is built per design, from the flat state, by
  expanding only the folds the printed rule allows and keeping only the
  states that can still reach the goal: at most 65 nodes and 145 edges
  for the heart (**Measured**). With a direction choice, the edges carry
  the right direction only. Building it costs under 200 ms per design
  with the naive recut (**Measured**), so it can be built at load, or on
  entering Gameplay Mode for a design.
- **Any other state is judged on the fly.** Availability at the current
  state is computed by trying each remaining fold against the current
  faces, under the printed rule: at most eleven cheap polygon clips.
  Liveness is a lookup: the state's key (its fold set and its faces, each
  with its place and layer) is in the live graph, or the state is doomed.
  So doomed subtrees are never enumerated, which the direction choice
  would otherwise make impossible.
- **Dead end** = not the goal, and no available fold that is not blocked.
  **Trap** = an edge from a live state to a state not in the live graph.
- Node ids are assigned by the builder, and edges and blocked edges name
  nodes by id, never by content, as
  [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks of anything
  that other things point at.

```json
{
  "designId": "paper-dart",
  "goalNodeId": 15,
  "nodes": [
    {
      "id": 0,
      "folds": [],
      "edges": [
        { "fold": 0, "direction": "valley", "to": 1 },
        { "fold": 1, "direction": "valley", "to": 2 }
      ]
    }
  ]
}
```

- This needs the engine as the Sandbox opens it up
  ([The sandbox sheet](./13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold)):
  applyFold() exported over a face list, and a sheet cut from any fold
  list, with cutSheet(design) kept as a thin wrapper. The live graph
  adds the printed rule and the anchors on top.
- The pure modules can be run by Node, as the measurement scripts are,
  so a plan's Agent QA can assert the table above: "the dart's live graph
  has 16 nodes and 22 orderings".

### 3. The gameplay sheet: one sheet cut along the player's path

- The paper in Gameplay Mode shows a **gameplay sheet**: the Sandbox's
  [sandbox sheet](./13-sandbox-mode-research.md#4-the-sandbox-sheet-undo-redo-and-unfold)
  with a design's folds in place of a lattice's, cut along the player's
  path, every fold pressed so far, in order, with the undone tail kept
  for Redo. Its printed `creaseLines` are the design's own full pattern,
  copied from the design's sheet, not the creases its path happens to
  make.
- Undo, Redo and Unfold, the recut and invisible swap on each press, the
  separable line redraw, and allocation on the press rather than per
  frame all work as they do for the sandbox sheet.
- Entering Gameplay Mode for a design sets the target to that design's
  gameplay sheet, empty path, position 0, lines on. The stepper's
  existing unfold, stretch, turn and fade bring the paper to the flat
  start in the design's colour and pose: nothing new to animate.

### 4. Where a gameplay sheet finishes

- The stepper walks a sheet, not a design, each sheet carrying its own
  `finishedPosition`, as
  [the Sandbox sets out](./13-sandbox-mode-research.md#5-the-stepper-walks-a-sheet-not-a-design).
  A gameplay sheet's is the goal's fold count when its path reaches the
  goal, and none otherwise. The lines then fade out at the goal, the
  "you did it" the finished model gives in Presentation Mode, and stay
  for a dead end.
- The camera radius comes from every sheet the page can show, which now
  includes every live-graph state; doomed states, 1% wider in the worst
  case measured, are covered by the 1.1 margin or by a small addition to
  the radius: a Decision for the plan.

### 5. Fold Buttons as DOM buttons over the canvas

- **Recommended: real `<button>`s**, as the Sandbox's direction pair is
  ([Picking a line](./13-sandbox-mode-research.md#3-picking-a-line-with-the-pointer)),
  one (or, with a direction choice, two) per available fold, positioned
  by projecting the fold's anchor to the screen each frame the paper
  moves, and written only on frames where something changed, as there.
  Alternatives: Three.js Sprites with
  `SpriteMaterial.sizeAttenuation` off (**Source**: r187
  `src/materials/SpriteMaterial.js` line 98) and a Raycaster for hover
  and clicks, which gives no semantics and more code; or the
  CSS2DRenderer addon, which does the same projection and would have to
  be vendored for one function.
- **The anchor** is the midpoint of the fold's crossing extent at the
  current state, on the uppermost crossed layer, as the measurements
  place it. It is posed through the same maths as the vertices, so
  pose.js should export a posePoint() beside writePaperPositions(); then
  the paper's world matrix and `Vector3.project(camera)` (**Source**:
  r187 `src/math/Vector3.js` line 499) carry it to the screen, as they
  carry the Sandbox's picked point.
- **During a step** (a fold, undo or unfold) the buttons fade out, and
  fade back in at the new rest state with the new available set. The
  anchors belong to rest states; buttons riding the paper mid-fold would
  show the old set.
- **Occlusion.** A DOM button draws over the paper even when its line
  lies on a layer the camera cannot see, such as the dart's far wing
  seen from above. The first version shows every available button; a
  later one might dim a button whose face points away from the camera.
- **On hover or focus, light the line**, as the Sandbox's pick does: the
  same two-vertex `Line` along the fold's crossing, written on hover,
  allocates nothing per frame and answers the brief's ambiguity
  exception more directly than moving the button. Worth prototyping.
- **Placement exceptions** are data, not geometry: a design may give a
  fold a `buttonAt`, its anchor's fraction along the crossing, default
  0.5. The dart's wings take 1/3 and 2/3; the heart's flaps and corners
  move off each other's lines. A Node check over the live graph reports
  any state where two anchors fall within a named distance, or one lies
  on another's line, so a new design cannot add an overlap unnoticed.
  With a direction choice, the two buttons of a fold sit either side of
  the anchor along the line, in screen space, a button's width apart.
- **Alternative to anchors: the Sandbox's pointer picking**, which needs
  no anchors and no placement exceptions, but shows no button on a line
  until the pointer finds it, where the brief gives every fold line a
  Fold Button of its own.
- **Size**: the swatches' 24 px minimum, larger on touch screens: a
  Decision for the plan.

### 6. The game layer

- A pure session module holds the gameplay state and its moves, so Node can
  run it: press, undo, redo, unfold, hint, and what each costs or earns.
  The DOM reads it; nothing in it touches the DOM or the GPU.

```json
{
  "designId": "paper-dart",
  "path": [0, 1, 2],
  "done": 2,
  "nodeId": 7,
  "live": true,
  "blocked": [{ "nodeId": 0, "fold": 4, "direction": "valley" }],
  "lives": 2,
  "points": 30,
  "hints": 1
}
```

- **Dead ends** cost a life and block the edge the player came in by.
  Blocking then propagates: a state whose every available edge is
  blocked is itself a dead end, so its incoming edge is blocked too, for
  no further life. Blocking never cuts the goal off, since a live state
  always keeps a live edge and no live edge is ever blocked.
- **Direction mistakes** need their own feedback, since a dead end never
  reveals them before the last fold. Options: report at once (a buzz, a
  life, the fold undone or left for the player to undo), or report at
  the end, highlighting the folds that went the wrong way. The first
  keeps the order puzzle a maze and the direction puzzle a quick check;
  it is [open](#open-questions).
- **Hints**: from a live state, pulse a Fold Button whose edge is in
  the live graph; from a doomed state, pulse Undo, perhaps saying how
  many folds back the wrong turn was. Five slots, earned per design
  finished or per run of correct folds: [open](#open-questions).
- **Points** are best awarded at the goal, from folds pressed against
  the minimum and lives kept, rather than per fold: a score that rises
  on every correct press would reveal correctness and spoil the maze.
  [Open](#open-questions).
- A session is per design: entering Gameplay Mode or choosing another design
  starts a new one, which clears the path, the undo history and the
  blocked edges; whether lives, points and hints carry across designs is
  [open](#open-questions).

### 7. The toolbar

- Gameplay Mode joins the mode radio group that the
  [Sandbox adds](./13-sandbox-mode-research.md#8-the-toolbar).
- In Gameplay Mode: the Fold lines checkbox is forced on and disabled, since
  the game needs the lines; the Flat radio is hidden or disabled, since
  it names no design; and a gameplay bar appears with Undo, Redo, Unfold and
  Hint buttons, the lives and the points. Undo, Redo and Unfold disable,
  and the shortcuts work, as in the sandbox bar; Hint disables with no
  hints.
- Switching back to Presentation Mode targets the current design's
  finished model: the paper unfolds along the gameplay sheet, swaps to the
  design's sheet flat, and folds up, all with the stepper as it is.
- The colour swatches work as before in every mode.
- Fold Button labels must not give the order away: "Fold 3" would, since
  fold indices follow the design's steps. A label by direction and
  position ("valley fold, upright line, left") or a per-design shuffle of
  the visible numbers: [open](#open-questions).

### 8. Likely plans

They follow the
[Sandbox's plans](./13-sandbox-mode-research.md#9-likely-plans), and
build on its engine work, sandbox sheet, stepper and toolbar. Each ends
in something the Lead Developer can QA in the browser; the seam between
each pair is where one could be accepted and the next rejected.

1. **The live graph is built**: the printed rule, anchors, the live
   graph and the on-the-fly judge, all pure, over the engine the Sandbox
   opened up, with Agent QA asserting the table above in Node. Visible
   proof: Presentation Mode and Sandbox Mode are unchanged, checksums
   and all.
2. **Gameplay Mode folds**: Gameplay Mode in the mode radios, the
   gameplay sheet, Fold Buttons projected over the canvas, pressing one
   folds, and Undo, Redo, Unfold and the shortcuts as in the Sandbox. No
   lives, points or hints yet. Visible proof: fold the yacht and the dart
   by hand, undo and redo them.
3. **The game**: dead ends, lives, blocking, hints, points, the gameplay bar
   and its messages. Visible proof: walk into a dart trap, lose a life,
   find the way out with a hint.
4. **Plain lines and a direction choice**, if ruled in: the plain
   printing and the direction pair come from the Sandbox, so this adds
   the button pairs at each anchor and the direction feedback. It could
   land before 3 if the direction choice is settled first.

## Open questions

For the Lead Developer, each to be settled before the plan that needs it
is drafted:

1. **Plain lines and a direction choice: in or out?** It is the only way
   the yacht and the heart become puzzles. The Sandbox already builds
   the plain printing and the direction pair, so the cost here is
   doubled Fold Buttons and direction feedback of its own. Needed before
   Plan 2 above, since it sets how many buttons a fold has.
2. **How is a direction mistake reported?** At once, or at the end: see
   [The game layer](#6-the-game-layer). Needed before Plan 3.
3. **Is a mirror-stacked dart finished?** The goal today matches layers
   as well as places; the loose exploration shows 13 extra orderings that
   reach the dart's shape with its flaps stacked the other way. The
   printed rule keeps them out, so the answer only matters if the rule
   is ever loosened. Needed before Plan 1 settles the goal test.
4. **Lives, points and hints**: how many lives, whether they and the
   points carry across designs, what earns a hint, and whether running
   out of lives ends the session. Needed before Plan 3.
5. **Fold Button labels** that do not reveal the order. Needed before
   Plan 2.
6. **The pencil's and Mount Fuji's dead ends arrive with the last fold**,
   when the model is nearly right. Is "no Fold Button left" enough of a
   signal there, or should the goal test's verdict ("not quite: a corner
   is under the wrong flap") be shown? Needed before Plan 3.

## Sources

- [When can you fold a map?](https://erikdemaine.org/papers/MapFolding/),
  Arkin, Bender, Demaine, Demaine, Mitchell, Sethia and Skiena,
  Computational Geometry 29:1 (2004); also
  [arXiv cs/0011026](https://arxiv.org/abs/cs/0011026). Only its abstract
  was read.
- Three.js r187 unminified source, read on 2026-11-11:
  [`src/math/Vector3.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/math/Vector3.js)
  (project(), line 499),
  [`src/core/Object3D.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/core/Object3D.js)
  (localToWorld(), line 670, which calls updateWorldMatrix() first), and
  [`src/materials/SpriteMaterial.js`](https://raw.githubusercontent.com/mrdoob/three.js/r187/src/materials/SpriteMaterial.js)
  (`sizeAttenuation`, line 98).
- [WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  the 24 px the swatches already follow.
- [Wikipedia: Pureland origami](https://en.wikipedia.org/wiki/Pureland_origami).

## Audit

- **2026-11-11T13:13:47Z** — **drafted**: the brief reorganised; three
  availability rules and every design's traps and anchors measured
  against the engine; an outline of the live graph, the gameplay sheet, DOM
  Fold Buttons and the game layer; six open questions.
