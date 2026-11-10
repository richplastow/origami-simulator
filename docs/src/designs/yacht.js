/**
 * @fileoverview
 * A yacht, after Fumiaki Shingu's diagram at Origami Club,
 * https://en.origami-club.com/easy/vehicle/yacht/index.html, as three
 * folds from a square that starts white side up.
 */

import { sheetSize } from "./sheet.js";
import { createFold } from "./steps.js";

const ASPECT = 1; // a square sheet

// The hull's fold meets the right edge this fraction of the side above the
// bottom right corner. The diagram gives no landmark, so it is read off
// the drawing; open to retuning by eye.
const HULL_RISE_FRACTION = 0.11;

// Halving the 45° angle at the top corner turns the sail's line 22.5° from
// the upright edge.
const SAIL_LINE_RADIANS = Math.PI / 8;

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// As the viewer sees the white side: the diagonal runs from the bottom left
// corner to the top right; the sail's line runs from the top corner to the
// bottom edge; the upright edge's bottom corner lands on the diagonal, one
// side's length from the top corner; and the hull's line runs from the
// right edge to there.
const BOTTOM_LEFT = [-HALF_WIDTH, -HALF_HEIGHT];
const HULL_RIGHT = [
  HALF_WIDTH,
  -HALF_HEIGHT + HULL_RISE_FRACTION * heightMeters,
];
const SAIL_CORNER = [
  HALF_WIDTH - widthMeters * Math.SQRT1_2,
  HALF_HEIGHT - heightMeters * Math.SQRT1_2,
];
const SAIL_FOOT = [
  HALF_WIDTH - heightMeters * Math.tan(SAIL_LINE_RADIANS),
  -HALF_HEIGHT,
];
const TOP_RIGHT = [HALF_WIDTH, HALF_HEIGHT];

/** #### The yacht: a square sheet, white side up, and the three folds
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts white side up, not rolled. Step 0 folds the top left corner
 *   down to the bottom right, along the diagonal; step 1 folds the top
 *   layer's upright edge over to the diagonal, as a white sail; step 2
 *   folds the bottom up as the hull.
 * - Frozen: copy it rather than change it.
 */
export const YACHT = Object.freeze({
  aspect: ASPECT,
  id: "yacht",
  start: Object.freeze({ rollRadians: 0, side: "back" }),
  steps: Object.freeze([
    createFold(BOTTOM_LEFT, "all", TOP_RIGHT, "valley"),
    createFold(TOP_RIGHT, { movedBy: 0 }, SAIL_FOOT, "valley"),
    createFold(HULL_RIGHT, "all", SAIL_CORNER, "valley"),
  ]),
});
