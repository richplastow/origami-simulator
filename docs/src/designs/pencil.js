/**
 * @fileoverview
 * A pencil, as six folds and two turn-overs, from a half square stood
 * upright that starts white side up. The sequence is this app's own,
 * after the look of the pencil at Red Ted Art,
 * https://www.redtedart.com/easy-origami-pencil/, which credits Mari Ono's
 * Origami for Children.
 */

import { sheetSize } from "./sheet.js";
import { createFold, TURN_OVER } from "./steps.js";

const ASPECT = 1 / 2; // a half square, stood upright

// The whole pencil leans anticlockwise by 135°, so its point, upright in its
// own frame, points down and to the left. In radians.
const LEAN_RADIANS = (3 * Math.PI) / 4;

// Each side of the point slopes this far from upright: the sharpest point
// whose corner flaps stay hidden, since each corner's top edge then lies
// exactly along the other slope. The photos show about 24°.
const POINT_HALF_ANGLE_RADIANS = Math.PI / 6;

// The coloured tip's share of the point's height, read off the photos;
// open to retuning by eye. Keep it above 0 and under 1: cutSheet() throws
// at 0, where the fold moves nothing, and from 1 up the tip's colour
// covers the whole point.
const TIP_FRACTION = 0.4;

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// The sides fold in to the middle, along the upright lines a quarter of
// the sheet's width either side of it, which is then the point's base.
const QUARTER_X = widthMeters / 4;

// The point rises from that base to its slopes' meeting; the tip is its
// share of that; the body is half of what the tip and the point leave, so
// that the bottom edge, folded up, meets the point's base exactly.
const POINT_HEIGHT = QUARTER_X / Math.tan(POINT_HALF_ANGLE_RADIANS);
const TIP_HEIGHT = TIP_FRACTION * POINT_HEIGHT;
const BODY_HEIGHT = (heightMeters - TIP_HEIGHT - POINT_HEIGHT) / 2;

// As the viewer sees the paper: the tip's fold line, which is then the top
// edge; the body's fold line, which is then the bottom edge; and the
// point's base, on which the corners' folds end.
const TIP_Y = HALF_HEIGHT - TIP_HEIGHT;
const BODY_Y = -HALF_HEIGHT + BODY_HEIGHT;
const POINT_BASE_Y = TIP_Y - POINT_HEIGHT;

const APEX = [0, TIP_Y];

/** #### The pencil: an upright half square, white side up, and eight steps
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts white side up, not rolled, and leans by 135°, so the finished
 *   pencil points down and to the left. Step 0 folds the top edge down as
 *   the tip's colour; step 1 folds the bottom edge up as the body; step 2
 *   turns the paper over; steps 3 and 4 fold the right, then the left,
 *   side in to the middle; steps 5 and 6 fold the top right, then the top
 *   left, corner in, as the point; step 7 turns the paper over again, to
 *   show a coloured body, a white point and a coloured tip.
 * - Frozen: copy it rather than change it.
 */
export const PENCIL = Object.freeze({
  aspect: ASPECT,
  colorId: "red",
  id: "pencil",
  leanRadians: LEAN_RADIANS,
  start: Object.freeze({ rollRadians: 0, side: "back" }),
  steps: Object.freeze([
    createFold([-HALF_WIDTH, TIP_Y], "all", [HALF_WIDTH, TIP_Y], "valley"),
    createFold([HALF_WIDTH, BODY_Y], "all", [-HALF_WIDTH, BODY_Y], "valley"),
    TURN_OVER,
    createFold([QUARTER_X, TIP_Y], "all", [QUARTER_X, BODY_Y], "valley"),
    createFold([-QUARTER_X, BODY_Y], "all", [-QUARTER_X, TIP_Y], "valley"),
    createFold(APEX, "all", [QUARTER_X, POINT_BASE_Y], "valley"),
    createFold([-QUARTER_X, POINT_BASE_Y], "all", APEX, "valley"),
    TURN_OVER,
  ]),
});
