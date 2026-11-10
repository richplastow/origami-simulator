/**
 * @fileoverview
 * The classic paper dart, Fold'N Fly's Basic Dart, as a list of seven folds.
 */

import { sheetSize } from "./sheet.js";

const ASPECT = 1; // a square sheet

// Each fold line leaves the apex, the midpoint of the top edge, at an angle
// from straight down, positive to the right.
const CORNER_LINE_RADIANS = Math.PI / 4; // 45°: top corners to the centre
const EDGE_LINE_RADIANS = Math.PI / 8; // 22.5°: slanted edges to the centre
const WING_LINE_RADIANS = Math.PI / 16; // 11.25°: wings to the body's edge

const FLAT_FOLD_RADIANS = Math.PI; // a fold pressed flat, 180°
const WING_FOLD_RADIANS = Math.PI / 2; // the wings stop at a right angle

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const APEX = [0, heightMeters / 2];

/** #### The paper dart: a square sheet and the seven folds that make it
 * - Each fold's line runs `from` → `to` in the folded plane, in metres, and
 *   the side to its left, seen from the front, moves.
 * - Folds 1 to 4 bring the top corners, then the slanted edges, to the
 *   centre line; fold 5 folds the sheet in half towards the viewer, both
 *   halves turning; folds 6 and 7 fold the near and far wings, the same
 *   line folded opposite ways by the two halves.
 * - Frozen: copy it rather than change it.
 */
export const PAPER_DART = Object.freeze({
  aspect: ASPECT,
  folds: Object.freeze([
    createFold(rimPoint(-CORNER_LINE_RADIANS), "all", APEX, "valley"),
    createFold(APEX, "all", rimPoint(CORNER_LINE_RADIANS), "valley"),
    createFold(rimPoint(-EDGE_LINE_RADIANS), "all", APEX, "valley"),
    createFold(APEX, "all", rimPoint(EDGE_LINE_RADIANS), "valley"),
    createFold(rimPoint(0), "all", APEX, "valley", { turns: "both-sides" }),
    createFold(
      APEX,
      Object.freeze({ movedBy: 4 }),
      rimPoint(WING_LINE_RADIANS),
      "valley",
      { targetRadians: WING_FOLD_RADIANS },
    ),
    createFold(
      APEX,
      Object.freeze({ heldBy: 4 }),
      rimPoint(WING_LINE_RADIANS),
      "mountain",
      { targetRadians: WING_FOLD_RADIANS },
    ),
  ]),
  id: "paper-dart",
});

/** #### Creates one frozen fold of the dart
 * @param from The fold line's start, `[x, y]` in metres.
 * @param layers `"all"`, `{ heldBy }` or `{ movedBy }`, a fold index.
 * @param to The fold line's end, `[x, y]` in metres.
 * @param type `"mountain"` or `"valley"`.
 * @param options Optional `targetRadians`, the finished angle in radians,
 *   180° by default, and `turns`, `"moving-side"` by default.
 * @returns The fold.
 */
function createFold(from, layers, to, type, options = {}) {
  const { targetRadians = FLAT_FOLD_RADIANS, turns = "moving-side" } = options;

  return Object.freeze({
    from: Object.freeze(from),
    layers,
    targetRadians,
    to: Object.freeze(to),
    turns,
    type,
  });
}

/** #### Returns where a line from the apex leaves the sheet
 * @param angleRadians The line's angle from straight down, positive to the
 *   right, in radians.
 * @returns The point, `[x, y]` in metres.
 */
function rimPoint(angleRadians) {
  const dx = Math.sin(angleRadians);
  const dy = -Math.cos(angleRadians);
  const distanceMeters = Math.min(
    widthMeters / 2 / Math.abs(dx), // to a side edge; Infinity straight down
    heightMeters / -dy, // to the bottom edge
  );

  return [APEX[0] + distanceMeters * dx, APEX[1] + distanceMeters * dy];
}
