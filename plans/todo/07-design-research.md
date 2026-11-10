---
title: More designs, turning the paper over and fold lines on both sides
description: Research and rulings for the designs after Plan 06, with a shortlist of 22 flat, simple-fold designs, what each needs from the fold engine, and the Lead Developer's rulings of 2026-11-10.
type: research
---

## Context

- Plans 01 to 06 are done and committed: the fold engine, the paper dart
  and the paper hat, printed fold lines, spinning, colours, grain and
  shadows. The next work is 8 to 10 more designs, one button each, as
  files in `docs/src/designs/`.
- This file is the reference for the plans that add them. It records what
  was found on the web, what the engine does today, what the new designs
  need from it, and what the Lead Developer has ruled. It follows
  [the research for Plans 02a to 02c](../done/02-simple-folds-research.md),
  whose rule stands: every design is made of simple folds, one at a time,
  in the Pureland style.
- Each claim below is one of five kinds, and says which:
  - **Diagram**: read step by step from the source's folding diagram on
    2026-11-10.
  - **Text**: read from the source page's step text only; its pictures
    were not seen.
  - **Photo**: the finished model was seen, but not its steps.
  - **Code**: checked in this repo's source on 2026-11-10.
  - **Derived**: worked out, not prototyped and not seen in a browser.
- Nothing here was prototyped. No design has been run through
  cutSheet(), so every "the engine can do this" is derived.
- The repo has no `adr/` folder yet. At the Lead Developer's direction,
  the decisions of 2026-11-10 are recorded here, in
  [Rulings](#rulings), in an ADR's shape: context, decision,
  consequences.

## Rulings

Settled by the Lead Developer on 2026-11-10. A plan that departs from one
needs a new ruling.

### Ruling 1: fold lines on both sides of every sheet

- **Context.** Fold lines are printed on the coloured side only, in
  black (code: `FOLD_LINE_COLOR` in `docs/src/scene/fold-lines.js`, drawn
  on a third mesh over the front in `docs/src/scene/paper.js`). A design
  that starts white side up, or turns over part-way, would show the
  viewer a side with no lines.
- **Decision.**
  - Every design's sheet carries its fold lines on both sides.
  - Each crease prints on the back directly beneath its line on the
    front, as the opposite kind: a mountain line on one side is a valley
    line on the other, since that is how the same crease looks from
    behind.
  - Lines on the white side take the colour the front currently has.
    When the user switches colour, they fade to the new colour with the
    paper.
- **Consequences.**
  - This supersedes "printed on the paper's coloured side" in
    [the earlier research's scope](../done/02-simple-folds-research.md#scope).
    Its other fold-line rules stand: the Yoshizawa–Randlett dashes, the
    fade in before folding and out once flat, and the "Fold lines"
    checkbox. The Lead Developer did not rule on those again.
  - The lines on the coloured side stay black. That was not ruled on,
    and is the reading taken here.
  - The back's pattern is the front's, mirrored left to right, with the
    two dash kinds swapped (derived).
  - The back's line colour can no longer be baked into a canvas as
    black is: it changes over the 0.3 s colour fade
    (`PAPER_COLOR_FADE_SECONDS`), so it should be a material's colour,
    not redrawn pixels (derived; how is a Decision for the plan).
  - Contrast (derived, WCAG's formula, against the back's off-white,
    `PAPER_BACK_COLOR`, `0xf4f1ea`): red 4.16:1, blue 3.04:1, pink
    2.52:1, green 2.47:1, yellow 1.62:1. Three of the five fall below
    the 3:1 that the front's black lines keep, and yellow lines will be
    faint. Judge it by eye in the plan's manual QA.

### Ruling 2: turning the paper over is an animated step

- **Context.** Most of the shortlisted diagrams turn the model over once
  or twice. The fold list has no such step (code: a design is `aspect`,
  `folds` and `id`; a fold is `from`, `layers`, `targetRadians`, `to`,
  `turns` and `type`). The alternative was to write those folds as
  mountain folds, which fold away behind the paper, out of sight.
- **Decision.** A turn-over is a step in a design's sequence, animated
  like a fold, so the viewer watches the paper turn and then sees the
  next folds made towards them. New engine work is accepted for it.
- **Consequences.**
  - The sequence becomes a list of steps of two kinds, folds and
    turn-overs. The stepper, the pose maths and maxPaperRadius() all
    walk that list, and unfolding plays turn-overs backwards.
  - A turn-over is the whole model turning half a turn. It must not
    fight the user's drag-to-spin, which turns the outer group (code:
    `paper.group.rotation` in `docs/src/main.js`).
  - With [Ruling 1](#ruling-1-fold-lines-on-both-sides-of-every-sheet),
    the side that comes round already carries its lines.
  - [Plan 09](./09-turn-the-paper-over.md#decisions) settles the
    engineering: the turn's axis and duration, and folds written as
    the viewer sees them, which cutSheet() turns into the front's
    terms.

### Ruling 3: a sheet's starting pose arrives with the stretch

- **Context.** Many diagrams start with the square on its corner, as a
  diamond, and many start white side up. Sheets are axis-aligned,
  coloured side to the camera (code). Switching designs already passes
  through the flat sheet, which stretches from the old shape to the new
  over 0.4 s (`STRETCH_SECONDS`).
- **Decision.** A design may start as a diamond, white side up, or
  both. The 45° turn and the turn-over happen at the same time as the
  stretch, while the sheet is flat.
- **Consequences.**
  - The turn must sit outside the stretch's scale, or a half-stretched
    sheet shears. The paper is two nested groups today, the outer for
    spin and the inner for the stretch (code: `group` and
    `stretchGroup` in `docs/src/scene/paper.js`); the starting pose
    needs a group between them (derived).
  - A turn-over about the vertical axis combined with a 45° turn is one
    half-turn about an axis tilted 22.5° from vertical (derived).
    [Plan 10](./10-start-the-sheet-turned.md#decisions) eases the two
    angles together instead, which looks much the same and needs no
    rule for which way round a half-turn goes.
  - Two squares have no stretch to ride on (code: the stretch is done
    at once when the two aspects match), so that phase must run
    whenever shape or starting pose changes.
  - The camera needs no change for a diamond. It frames a sphere around
    the paper (code: `paperRadiusMeters` in `docs/src/main.js`), and a
    turned square stays inside the same sphere.
  - "Flat" keeps the starting pose of the sheet showing, as it keeps
    its shape (derived from the existing rule).

### Ruling 4: every sheet keeps the same area, so 1:4 strips wait

- **Context.** Every sheet has the area of a 15 cm square (code:
  `SHEET_AREA_SQUARE_METERS`), and the camera is placed once, by the
  largest radius any design reaches. Run through the repo's own
  maxPaperRadius(), that is 11.62 cm today, set by the hat; the dart
  reaches 10.61 cm. A flat sheet's half-diagonal is 10.61 cm for the
  square, 10.92 cm for A4's shape, 11.86 cm for 1:2 and 15.46 cm for
  1:4 (derived from sheetSize()).
- **Decision.** The equal-area rule stays. Designs from a 1:4 strip,
  which means the pencil, design 9, are set aside and may come back
  later. Designs from a 1:2 sheet may join the shortlist, if the engine
  can handle them.
- **Consequences.**
  - A 1:4 strip would pull the camera back by about 33%, shrinking
    every other design. A 1:2 sheet pulls it back by about 2%, going by
    the flat sheet alone; its folding may reach a little further, as
    the hat's does.
  - The Lead Developer wants no further search for rectangular designs
    for now.

### Ruling 5: one button per design, tidied at the end

- **Decision.** Each new design gets its own button. The row of buttons
  will become cluttered; the Lead Developer will fix that at the end, so
  no plan before then redesigns it.
- **Consequences.** A design is added in four places today (code): its
  file in `docs/src/designs/`; `designs` and `sheets` in
  `docs/src/main.js`; `FOLD_TARGETS` in `docs/src/ui/fold-buttons.js`;
  and a `<button data-fold="…">` in `docs/index.html`. Ten more designs
  make the two hand-kept lists worth deriving from one list of designs
  (derived; raise it in the plan).

## What the engine does today

All code, checked on 2026-11-10.

- A design is a frozen `{ aspect, folds, id }`. `aspect` is the sheet's
  width over its height; sheetSize() gives it the standard area.
- A fold has a line, `from` → `to`, in metres in the folded plane; the
  side to its left, seen from the front, moves. `type` is `"mountain"`
  or `"valley"`, `targetRadians` is where it stops (180° pressed flat),
  and `turns` is `"moving-side"` or `"both-sides"`.
- `layers` chooses what a fold moves: `"all"`, every layer the line
  crosses; `{ movedBy: i }`, only layers that fold `i` moved; or
  `{ heldBy: i }`, only layers that fold `i` did not move. It names one
  earlier fold. It cannot say "the front layer" of a stack made by
  several folds (see selectsFace() in `docs/src/fold/engine.js`).
- cutSheet() cuts the sheet into faces from the fold list, and gives
  the crease lines to print.
- The sheet is a rectangle, axis-aligned, coloured side to the camera.
  There is no turn-over step and no starting pose.
- Fold lines are black, on the front only, on a 2,048 px canvas.

## What the designs need

Derived, in the order the work depends on it.

1. **Fold lines on both sides**
   ([Ruling 1](#ruling-1-fold-lines-on-both-sides-of-every-sheet)).
   Needs no new design, and can be checked on the dart and the hat by
   spinning them.
2. **A starting pose**
   ([Ruling 3](#ruling-3-a-sheets-starting-pose-arrives-with-the-stretch)).
   Of the 17 designs whose start is known, 13 start white side up and
   8 start as a diamond.
3. **A turn-over step**
   ([Ruling 2](#ruling-2-turning-the-paper-over-is-an-animated-step)).
   At least 12 of the 22 designs turn over at least once.
4. **Layer selection, perhaps.** The cicada's two collar folds and the
   penguin's flaps fold "the front layer" over flaps made by other
   folds. Whether `movedBy` and `heldBy` can name those layers is not
   known until each is run through cutSheet(). If not, `layers` needs a
   way to choose by position in the stack.
5. **Unreferenced folds.** Some folds have no landmark ("fold up a
   little"). Each needs a named constant, chosen by eye, as
   [CLAUDE.md](../../CLAUDE.md#engineering-discipline) asks of every
   tuning number.

Pre-creases ("fold and unfold") need nothing: the app prints the fold
lines instead, so they are left out of every count below.

## The shortlist

Twenty-two designs, numbered once; the numbers are how the Lead
Developer refers to them. The steps of designs 15 and 22 were not read.
Sources are in [Sources](#sources).

- **Sheet**: 1:1 is the square; 1:2 is half a square.
- **Start**: ◇ a diamond, □ square to the viewer; then the side facing
  the viewer.
- **Folds**: the creases the app would animate, counted from the
  source.
- **Turns**: turn-overs within the sequence.
- **Read**: the kind of claim, as in [Context](#context).

### A. Every step a simple fold, both colours showing

| #   | Design           | Sheet | Start    | Folds | Turns | Read    |
| --- | ---------------- | ----- | -------- | ----- | ----- | ------- |
| 1   | Rice ball        | 1:1   | ◇ white  | 7     | 0     | Diagram |
| 2   | Yacht            | 1:1   | □ white  | 3     | 0     | Diagram |
| 3   | Penguin          | 1:1   | ◇ colour | 7     | 2     | Diagram |
| 4   | Ice-cream cone   | 1:1   | ◇ white  | 4     | 2     | Diagram |
| 5   | Watermelon slice | 1:1   | □ colour | 3     | 2     | Diagram |
| 6   | Rocket           | 1:1   | □ white  | 7     | 2     | Diagram |
| 7   | Cicada           | 1:1   | ◇ white  | 9     | 0     | Diagram |
| 8   | Mount Fuji       | 1:1   | □ colour | 3     | 1     | Text    |
| 10  | Cat face         | 1:1   | ◇ white  | 9     | 2     | Text    |

- 1: white rice above a coloured wrap. Five of its seven folds go
  behind.
- 2: white sails, coloured hull. The finished yacht sits at a tilt.
- 3: coloured head and flippers, white belly.
- 4: white ice cream on a coloured cone. Origami Club calls it "Soft
  cream2".
- 5: coloured flesh, white rind.
- 6: coloured nose cone, white body and fins.
- 7: coloured body with a white V collar. Traditional; the page dates it
  to 1845, which was not checked.
- 8: white snow cap on a coloured mountain. The step text was read as
  far as step 5; the page is `http` only.
- 10: the two-colour version folds one layer behind, for a coloured face
  with white ears. Its fold count is approximate.

### B. Simple folds, but one colour or less certain

| #   | Design             | Sheet | Start    | Folds | Turns | Read    |
| --- | ------------------ | ----- | -------- | ----- | ----- | ------- |
| 11  | Fox face           | 1:1   | ◇ white  | 4     | 1     | Diagram |
| 12  | Mountains          | 1:1   | □ white  | 4     | 1     | Diagram |
| 13  | Heart              | 1:1   | □ white  | 14    | 3     | Text    |
| 14  | Pureland Fish      | 1:1   | □ white  | 4     | 2     | Diagram |
| 15  | Pureland Butterfly | ?     | ?        | ?     | ?     | Photo   |
| 21  | Simple heart       | 1:2   | ?        | 11    | 2     | Text    |
| 22  | Pencil, half sheet | 1:2   | ?        | ?     | ?     | Photo   |

- 11: traditional, one colour, the quickest animal.
- 12: one colour, two overlapping peaks. Its last step bends the model
  a little into 3D; leave it out.
- 13: the longest sequence here; its count is approximate, and its
  finished colours were not confirmed.
- 14: by Marc Kirschenbaum, published as Pureland. A line drawing,
  quite abstract.
- 15: by John Smith, who devised Pureland. The page's diagram link
  points at a different model, so its folds are unknown.
- 21: seven steps of plain folds by their text ("fold both sides to the
  centre", "make 4 folds on the diagonal", "fold down the tips"). The
  source cuts a square in two; here the sheet is simply 1:2.
- 22: the photo shows a coloured body, a white band and a coloured tip.
  Its steps are in a video, which was not watched, so whether the
  engine can fold it is not known. Read the video, or work the folds
  out, before planning it.

### C. Simple once one step is adapted

| #   | Design         | Sheet | Start    | Folds | Turns | Read    |
| --- | -------------- | ----- | -------- | ----- | ----- | ------- |
| 16  | House          | 1:1   | □ white  | 5     | 0     | Diagram |
| 17  | Samurai helmet | 1:1   | ?        | 10    | 0     | Text    |
| 18  | Santa hat      | 1:1   | □ colour | 8     | 2     | Text    |
| 19  | Panda face     | 1:1   | ◇ white  | 6     | 0     | Diagram |
| 20  | Whale          | 1:1   | ◇ white  | 5     | 0     | Diagram |

- 16: leave out the door, which needs a squash fold, and stop after the
  roof: coloured roof, white walls.
- 17: fold the last flap behind, where the source tucks it inside.
- 18: fold the two bottom corners behind, where the source tucks them
  inside: red hat, white band.
- 19: leave out the nose, which is tucked inside: coloured ears on a
  white face.
- 20: fold the tail up with a plain fold, where the source uses a hood
  fold.

### Set aside

- **9, the pencil from a 1:4 strip**: five plain folds by its step
  text, but held back by
  [Ruling 4](#ruling-4-every-sheet-keeps-the-same-area-so-14-strips-wait).
- **The traditional cup**: five folds, simple if left flat, not opened.
  A spare, in one colour.

### Ruled out

Each needs a fold that is not simple, by its own source:

- Swan: the neck is pulled up between the layers.
- Necktie: two squash folds and a tuck.
- Strawberry, shirt, mushroom: squash folds or pulled-out layers.
- Photo frame: squash folds on every corner.
- Tulip: an inside reverse fold, and a second sheet for the stem.
- The three-sail sailboat: opened out and tucked.
- The traditional penguin: an outside reverse fold for the head. Design
  3 is a different penguin.
- The two-fold sailboat from origami-fun.com: starts from a triangle,
  and sheets here are rectangles.
- The crane and the paper boat, as
  [the earlier research](../done/02-simple-folds-research.md#simple-folds)
  found.

### Crediting a design

Designs 1 to 6, 12, 16, 19 and 20 are Fumiaki Shingu's diagrams at
Origami Club; 14 and 15 are named designers' models; the rest are
traditional or uncredited. Each design file's `@fileoverview` names its
source, as `docs/src/designs/paper-dart.js` names Fold'N Fly.

## Open questions

For the Lead Developer:

1. **Which designs?** The Lead Developer is choosing 8 to 10, at least
   one of them from a 1:2 sheet. Proposed: 1 to 8, 10 and 16, which are
   ten flat designs on the square sheet, eight of them read from a
   diagram. Designs 21 and 22 are the 1:2 candidates, and less
   certain: 21's colours are unknown, and 22's steps are unread.

The first three plans are drafted, and take three of the designs with
them:

- [Plan 08](../done/08-fold-lines-both-sides.md): fold lines on both sides,
  checked on the dart and the hat.
- [Plan 09](./09-turn-the-paper-over.md): the turn-over step, proved by
  the watermelon, which turns over twice.
- [Plan 10](./10-start-the-sheet-turned.md): the starting pose, proved
  by the yacht, which starts white side up, and the ice-cream cone,
  which starts as a white diamond.

The remaining designs follow in later plans, a few to a plan, with
layer selection if the cicada or the penguin needs it. The three
drafted designs were run through the current engine in a prototype on
2026-11-10, and each cuts cleanly; the others have not been.

Engineering choices that no one has ruled on are marked "derived" or
"a Decision for the plan" above, and each becomes a Decision in the
plan that uses it.

## Sources

All fetched on 2026-11-10. Each design's page shows a picture of the
finished model, except design 14's, which is the diagram itself.

- 1: [Origami Club: rice ball](https://en.origami-club.com/easy/food/rice%20ball/index.html)
- 2: [Origami Club: yacht](https://en.origami-club.com/easy/vehicle/yacht/index.html)
- 3: [Origami Club: penguin](https://en.origami-club.com/easy/sea/penguin/index.html)
- 4: [Origami Club: soft cream2](https://en.origami-club.com/easy/food/soft-cream2/index.html)
- 5: [Origami Club: watermelon](https://en.origami-club.com/easy/food/watermelon2/index.html)
- 6: [Origami Club: rocket](https://en.origami-club.com/easy/vehicle/rocket/index.html)
- 7: [Origami Club: cicada](https://en.origami-club.com/traditional/cicada/index.html)
  and [origami.me: cicada](https://origami.me/cicada/)
- 8: [Origami-Instructions.com: Mount Fuji](http://www.origami-instructions.com/origami-mount-fuji.html)
- 9: [Origami-Instructions.com: pencil](http://www.origami-instructions.com/origami-pencil.html)
- 10: [origami.guide: easy cat face](https://origami.guide/easy-origami/easy-origami-cat-face/)
- 11: [Origami Club: fox face](https://en.origami-club.com/easy/animal-face/fox/index.html)
- 12: [Origami Club: mountains](https://en.origami-club.com/nature/mount/index.html)
- 13: [origami.me: heart](https://origami.me/heart)
- 14: [Marc Kirschenbaum: Pureland Fish](http://ftp.funet.fi/pub/misc/origami/rugcis.rug.nl/models/pureland/pfish.gif)
- 15: [Origami Resource Center: Pure and Pureland origami](https://origami-resource-center.com/pure-and-pureland/)
- 16: [Origami Club: house](https://en.origami-club.com/nature/house1/index.html)
- 17: [origami.me: samurai helmet](https://origami.me/samurai-helmet)
- 18: [origami.me: Santa hat](https://origami.me/santa-hat)
- 19: [Origami Club: panda face](https://en.origami-club.com/easy/animal-face/panda/index.html)
- 20: [Origami Club: whale](https://en.origami-club.com/easy/sea/whale/index.html)
- 21: [Origami-Instructions.com: simple heart](http://www.origami-instructions.com/simple-origami-heart.html)
- 22: [Red Ted Art: easy origami pencil](https://www.redtedart.com/easy-origami-pencil/)
- The cup: [origami.me: cup](https://origami.me/cup/)
- [Wikipedia: Pureland origami](https://en.wikipedia.org/wiki/Pureland_origami)

Notes on the sources:

- Origami-Instructions.com serves `http` only: its `https` address
  redirects back to `http`.
- Each Origami Club diagram is the page's `zu.html`, beside its
  `index.html`.
- Not opened, should rectangular designs be wanted later: Origami
  Club's [newspaper category](https://en.origami-club.com/newspaper/index.html)
  and the dollar-bill models at
  [FOLDS.NET](https://folds.net/tutorial/index.html).
