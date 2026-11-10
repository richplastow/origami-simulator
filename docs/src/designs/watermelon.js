/**
 * @fileoverview
 * A slice of watermelon, after Fumiaki Shingu's diagram at Origami Club,
 * https://en.origami-club.com/easy/food/watermelon2/index.html, as three
 * folds and two turn-overs.
 */

import { sheetSize } from "./sheet.js";
import { createFold, TURN_OVER } from "./steps.js";

const ASPECT = 1; // a square sheet

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// Every line sits on a landmark of the diagram: the bottom eighth folds up
// to the quarter line, then the top corners fold from the top edge's middle
// to where the quarter line meets the side edges.
const EIGHTH_Y = -HALF_HEIGHT + heightMeters / 8; // the bottom eighth's top
const QUARTER_Y = -HALF_HEIGHT + heightMeters / 4; // the bottom quarter's top
const EIGHTH_LEFT = [-HALF_WIDTH, EIGHTH_Y];
const EIGHTH_RIGHT = [HALF_WIDTH, EIGHTH_Y];
const QUARTER_LEFT = [-HALF_WIDTH, QUARTER_Y];
const QUARTER_RIGHT = [HALF_WIDTH, QUARTER_Y];
const TOP_MIDDLE = [0, HALF_HEIGHT];

/** #### The watermelon slice: a square sheet and the five steps that make it
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts coloured side up. Step 0 folds the bottom eighth up, towards
 *   the viewer, as the white band; step 1 turns the paper over; steps 2
 *   and 3 fold the right top corner in, then the left over it; step 4
 *   turns the paper over again, to show a coloured triangle above the
 *   band.
 * - Frozen: copy it rather than change it.
 */
export const WATERMELON = Object.freeze({
  aspect: ASPECT,
  id: "watermelon",
  steps: Object.freeze([
    createFold(EIGHTH_RIGHT, "all", EIGHTH_LEFT, "valley"),
    TURN_OVER,
    createFold(TOP_MIDDLE, "all", QUARTER_RIGHT, "valley"),
    createFold(QUARTER_LEFT, "all", TOP_MIDDLE, "valley"),
    TURN_OVER,
  ]),
});
