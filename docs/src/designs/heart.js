/**
 * @fileoverview
 * A heart, Francis Ow's design, after the instructions at
 * Origami-Instructions.com,
 * http://www.origami-instructions.com/simple-origami-heart.html, as eleven
 * folds and two turn-overs, from a half square on its side that starts
 * white side up.
 */

import { sheetSize } from "./sheet.js";
import { createFold, TURN_OVER } from "./steps.js";

const ASPECT = 2; // a half square, on its side

// The bottom strip's share of the sheet's height. The source folds about
// 19 mm of its 75 mm. Keep it above 0 and under 1/2: at either bound a
// fold moves nothing and cutSheet() throws, and past 1/2 the heart comes
// out lopsided.
const STRIP_FRACTION = 1 / 4;

// Each lobe's peak folds down this fraction of the way from the peak to
// the sheet's top edge, read off the source's photo; open to retuning by
// eye. Keep it above 0 and at most 1: cutSheet() throws at 0, where the
// fold moves nothing, and past 1.
const LOBE_FLAT_FRACTION = 1 / 2;

// The folds that made the two flaps, by index in `steps`, named by the lobe
// each flap lies under once the paper has turned over. Step 2 folds the
// left half of the bottom edge, as the viewer sees it before the
// turn-over, and the turn-over carries its flap to the right; step 1's
// flap goes from the right to the left.
const RIGHT_LOBE_FLAP_FOLD = 2;
const LEFT_LOBE_FLAP_FOLD = 1;

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// The strip's fold line, which is then the bottom edge; each half of that
// edge folds up to the centre line, along the line at 45° from its middle,
// which meets the top edge where the top edge is as far from the centre
// line as it is above the strip's line.
const STRIP_Y = -HALF_HEIGHT + STRIP_FRACTION * heightMeters;
const STRIP_MIDDLE = [0, STRIP_Y];
const HALF_FOLD_X = HALF_HEIGHT - STRIP_Y;

// Each flap's bottom corner lands on the centre line, half the sheet's
// width above the strip's line, as the flaps' top edge. It equals
// `HALF_FOLD_X` only while `STRIP_FRACTION` is 1/4.
const FLAP_TOP_Y = STRIP_Y + HALF_WIDTH;

// Turned over, each side folds in along the upright line a quarter of the
// sheet's width from the middle, from the flaps' top edge down to where it
// meets its half's fold.
const QUARTER_X = widthMeters / 4;
const SIDE_FOOT_Y = STRIP_Y + QUARTER_X;

// Each lobe's peak lies on the flaps' top edge, midway across the lobe;
// each top corner folds down along the line from a peak to the sheet's top
// edge at the lobe's side. Each peak's tip then folds down along a level
// line, part-way from the peak to the sheet's top edge.
const LEFT_PEAK = [-QUARTER_X / 2, FLAP_TOP_Y];
const RIGHT_PEAK = [QUARTER_X / 2, FLAP_TOP_Y];
const TOP_LEFT = [-QUARTER_X, HALF_HEIGHT];
const TOP_MIDDLE = [0, HALF_HEIGHT];
const TOP_RIGHT = [QUARTER_X, HALF_HEIGHT];
const LOBE_FLAT_Y =
  FLAP_TOP_Y - LOBE_FLAT_FRACTION * (FLAP_TOP_Y - HALF_HEIGHT);

/** #### The heart: a half square on its side, white side up, and 13 steps
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts white side up, not rolled. Step 0 folds the bottom strip up;
 *   steps 1 and 2 fold the right, then the left, half of the bottom edge
 *   up to the centre line, as two flaps; step 3 turns the paper over;
 *   steps 4 and 5 fold the right, then the left, side in; steps 6 to 9
 *   fold the four top corners down, from right to left; steps 10 and 11
 *   fold each peak's tip down, right then left; step 12 turns the paper
 *   over again, to show the heart.
 * - Steps 7, 8, 10 and 11 move only one flap's layers: each of their
 *   lines, carried on, crosses the other lobe.
 * - Frozen: copy it rather than change it.
 */
export const HEART = Object.freeze({
  aspect: ASPECT,
  id: "heart",
  start: Object.freeze({ rollRadians: 0, side: "back" }),
  steps: Object.freeze([
    createFold([HALF_WIDTH, STRIP_Y], "all", [-HALF_WIDTH, STRIP_Y], "valley"),
    createFold([HALF_FOLD_X, HALF_HEIGHT], "all", STRIP_MIDDLE, "valley"),
    createFold(STRIP_MIDDLE, "all", [-HALF_FOLD_X, HALF_HEIGHT], "valley"),
    TURN_OVER,
    createFold(
      [QUARTER_X, FLAP_TOP_Y],
      "all",
      [QUARTER_X, SIDE_FOOT_Y],
      "valley",
    ),
    createFold(
      [-QUARTER_X, SIDE_FOOT_Y],
      "all",
      [-QUARTER_X, FLAP_TOP_Y],
      "valley",
    ),
    createFold(RIGHT_PEAK, "all", TOP_RIGHT, "valley"),
    createFold(
      TOP_MIDDLE,
      { movedBy: RIGHT_LOBE_FLAP_FOLD },
      RIGHT_PEAK,
      "valley",
    ),
    createFold(
      LEFT_PEAK,
      { movedBy: LEFT_LOBE_FLAP_FOLD },
      TOP_MIDDLE,
      "valley",
    ),
    createFold(TOP_LEFT, "all", LEFT_PEAK, "valley"),
    createFold(
      [0, LOBE_FLAT_Y],
      { movedBy: RIGHT_LOBE_FLAP_FOLD },
      [QUARTER_X, LOBE_FLAT_Y],
      "valley",
    ),
    createFold(
      [-QUARTER_X, LOBE_FLAT_Y],
      { movedBy: LEFT_LOBE_FLAP_FOLD },
      [0, LOBE_FLAT_Y],
      "valley",
    ),
    TURN_OVER,
  ]),
});
