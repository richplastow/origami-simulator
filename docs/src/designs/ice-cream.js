/**
 * @fileoverview
 * An ice-cream cone, after Fumiaki Shingu's diagram "Soft cream2" at
 * Origami Club, https://en.origami-club.com/easy/food/soft-cream2/index.html,
 * as four folds and two turn-overs, from a square that starts as a white
 * diamond.
 */

import { sheetSize } from "./sheet.js";
import { createFold, TURN_OVER } from "./steps.js";

const ASPECT = 1; // a square sheet

// The ice cream's peak folds back up along a line this fraction of the way
// down the folded corner, from the top fold's line towards its point. The
// diagram gives no landmark; open to retuning by eye.
const PLEAT_FRACTION = 1 / 3;

const ROLL_RADIANS = Math.PI / 4; // an eighth of a turn: a diamond

const { widthMeters } = sheetSize(ASPECT);

// From the diamond's centre to each corner, in metres.
const HALF_DIAGONAL = widthMeters * Math.SQRT1_2;

// As the viewer sees the diamond: each lower edge folds in to the centre
// line along the line that halves the right angle at the bottom corner.
// That line meets the upper edge (2 − √2) half-diagonals out and
// (√2 − 1) up, the height at which the side corners land on the centre
// line.
const BOTTOM = [0, -HALF_DIAGONAL];
const MEET_Y = HALF_DIAGONAL * (Math.SQRT2 - 1);
const EDGE_LEFT = [-HALF_DIAGONAL * (2 - Math.SQRT2), MEET_Y];
const EDGE_RIGHT = [HALF_DIAGONAL * (2 - Math.SQRT2), MEET_Y];

// Turned over, the top corner folds down to where the side corners meet,
// on the line halfway between; its point then folds back up, on a line
// part-way down the folded corner.
const TOP_FOLD_Y = (HALF_DIAGONAL + MEET_Y) / 2;
const PLEAT_Y = TOP_FOLD_Y - PLEAT_FRACTION * (TOP_FOLD_Y - MEET_Y);

/** #### The ice-cream cone: a square sheet, as a white diamond, and six steps
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts white side up, rolled an eighth of a turn to stand on its
 *   corner. Steps 0 and 1 fold the right, then the left, lower edge in to
 *   the centre line; step 2 turns the paper over; step 3 folds the top
 *   corner down; step 4 folds that corner's point back up, as the peak;
 *   step 5 turns the paper over again, to show a coloured cone topped
 *   with white.
 * - Frozen: copy it rather than change it.
 */
export const ICE_CREAM = Object.freeze({
  aspect: ASPECT,
  id: "ice-cream",
  start: Object.freeze({ rollRadians: ROLL_RADIANS, side: "back" }),
  steps: Object.freeze([
    createFold(EDGE_RIGHT, "all", BOTTOM, "valley"),
    createFold(BOTTOM, "all", EDGE_LEFT, "valley"),
    TURN_OVER,
    createFold(
      [-HALF_DIAGONAL, TOP_FOLD_Y],
      "all",
      [HALF_DIAGONAL, TOP_FOLD_Y],
      "valley",
    ),
    createFold(
      [HALF_DIAGONAL, PLEAT_Y],
      { movedBy: 3 },
      [-HALF_DIAGONAL, PLEAT_Y],
      "valley",
    ),
    TURN_OVER,
  ]),
});
