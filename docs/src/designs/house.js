/**
 * @fileoverview
 * A house, after Fumiaki Shingu's diagram at Origami Club,
 * https://en.origami-club.com/nature/house1/index.html, as far as its
 * step 4, the roof: five folds from a square that starts white side up.
 */

import { sheetSize } from "./sheet.js";
import { createFold } from "./steps.js";

const ASPECT = 1; // a square sheet

const { heightMeters, widthMeters } = sheetSize(ASPECT);
const HALF_HEIGHT = heightMeters / 2;
const HALF_WIDTH = widthMeters / 2;

// The top edge folds down to the middle, along the line a quarter of the
// side below it; once folded, the band lies between that line and the
// middle.
const BAND_Y = HALF_HEIGHT / 2;

// Each side folds back along the upright line a quarter of the side in
// from it.
const QUARTER_X = HALF_WIDTH / 2;

// As the viewer sees the white side: each side's fold runs from the band's
// line down to the bottom edge; each corner's fold runs from the middle of
// the top to the band's lower corner on its side.
const BAND_LEFT = [-QUARTER_X, 0];
const BAND_RIGHT = [QUARTER_X, 0];
const TOP_MIDDLE = [0, BAND_Y];

/** #### The house: a square sheet, white side up, and the five folds
 * - Each fold's line runs `from` → `to` in the view frame, as the viewer
 *   sees the paper at that step, in metres, and the side to its left, as
 *   the viewer sees it, moves.
 * - Starts white side up, not rolled. Step 0 folds the top edge down to
 *   the middle, as a coloured band; steps 1 and 2 fold the right, then the
 *   left, quarter back; steps 3 and 4 fold the top right, then the top
 *   left, corner back, to leave a coloured roof over white walls.
 * - The sides and corners fold back, as mountain folds, as the diagram
 *   says. It stops at the roof: the diagram's door needs a squash fold.
 * - Frozen: copy it rather than change it.
 */
export const HOUSE = Object.freeze({
  aspect: ASPECT,
  id: "house",
  start: Object.freeze({ rollRadians: 0, side: "back" }),
  steps: Object.freeze([
    createFold([-HALF_WIDTH, BAND_Y], "all", [HALF_WIDTH, BAND_Y], "valley"),
    createFold(
      [QUARTER_X, BAND_Y],
      "all",
      [QUARTER_X, -HALF_HEIGHT],
      "mountain",
    ),
    createFold(
      [-QUARTER_X, -HALF_HEIGHT],
      "all",
      [-QUARTER_X, BAND_Y],
      "mountain",
    ),
    createFold(TOP_MIDDLE, "all", BAND_RIGHT, "mountain"),
    createFold(BAND_LEFT, "all", TOP_MIDDLE, "mountain"),
  ]),
});
