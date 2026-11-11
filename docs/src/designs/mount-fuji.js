/**
 * @fileoverview
 * Mount Fuji, after the instructions at Origami-Instructions.com,
 * http://www.origami-instructions.com/origami-mount-fuji.html, as four
 * folds and two turn-overs, from a square that starts coloured side up.
 */

import { sheetSize } from "./sheet.js";
import { createFold, TURN_OVER } from "./steps.js";

const ASPECT = 1; // a square sheet

// The top edge folds down this fraction of the side, as the snow. The
// source says 8 to 10 mm of a 15 cm square, more for lots of snow, and
// its photo shows about 19 mm; open to retuning by eye. Keep it above 0
// and under 1/3: cutSheet() throws at 0, where the fold moves nothing, and
// from 1/3 up the snow reaches the middle fold and covers the mountain.
const SNOW_FRACTION = 1 / 8;

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// The snow's fold line; once folded, the paper's top edge lies along it.
const SNOW_Y = HALF_HEIGHT - SNOW_FRACTION * heightMeters;

// Turned over, the bottom edge folds up to the top, along the line halfway
// between them, which is then the folded packet's bottom edge.
const MIDDLE_Y = (SNOW_Y - HALF_HEIGHT) / 2;
const PACKET_HEIGHT = SNOW_Y - MIDDLE_Y;

// Each top corner folds down along the line at 45° from the packet's
// bottom corner on its side, which meets the top edge one packet height in
// from that side.
const BOTTOM_LEFT = [-HALF_WIDTH, MIDDLE_Y];
const BOTTOM_RIGHT = [HALF_WIDTH, MIDDLE_Y];
const SLOPE_TOP_LEFT = [-HALF_WIDTH + PACKET_HEIGHT, SNOW_Y];
const SLOPE_TOP_RIGHT = [HALF_WIDTH - PACKET_HEIGHT, SNOW_Y];

/** #### Mount Fuji: a square sheet, coloured side up, and six steps
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts coloured side up, not rolled. Step 0 folds the top edge down as
 *   the snow; step 1 turns the paper over; step 2 folds the bottom edge up
 *   to the top; steps 3 and 4 fold the top right, then the top left,
 *   corner down through both halves, as the slopes; step 5 turns the paper
 *   over again, to show a coloured mountain with a white cap.
 * - Folds the middle before the corners, where the source folds the
 *   corners of one half first, so that the other half hides behind the
 *   mountain rather than showing white beside its slopes.
 * - Frozen: copy it rather than change it.
 */
export const MOUNT_FUJI = Object.freeze({
  aspect: ASPECT,
  colorId: "green",
  id: "mount-fuji",
  steps: Object.freeze([
    createFold([-HALF_WIDTH, SNOW_Y], "all", [HALF_WIDTH, SNOW_Y], "valley"),
    TURN_OVER,
    createFold(BOTTOM_RIGHT, "all", BOTTOM_LEFT, "valley"),
    createFold(SLOPE_TOP_RIGHT, "all", BOTTOM_RIGHT, "valley"),
    createFold(BOTTOM_LEFT, "all", SLOPE_TOP_LEFT, "valley"),
    TURN_OVER,
  ]),
});
