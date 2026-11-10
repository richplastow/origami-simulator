/**
 * @fileoverview
 * The newspaper hat, on an A4-shaped sheet, as a list of five folds.
 */

import { sheetSize } from "./sheet.js";
import { createFold } from "./steps.js";

const ASPECT = Math.SQRT1_2; // A4's shape, 1 : √2, upright

const { widthMeters } = sheetSize(ASPECT);
const HALF_WIDTH = widthMeters / 2;

// Once the sheet is folded in half, the top corners fold down to the
// centre, so their slanted edges meet the sides one half-width below it,
// at the top of the brim.
const BRIM_LEFT = [-HALF_WIDTH, -HALF_WIDTH];
const BRIM_RIGHT = [HALF_WIDTH, -HALF_WIDTH];
const CENTRE = [0, 0];
const MIDDLE_LEFT = [-HALF_WIDTH, 0];
const MIDDLE_RIGHT = [HALF_WIDTH, 0];

/** #### The paper hat: an A4-shaped sheet and the five folds that make it
 * - Each fold's line runs `from` → `to` in the folded plane, in metres, and
 *   the side to its left, seen from the front, moves. The hat never turns
 *   over, so the viewer always sees it from the front.
 * - Fold 1 folds the top half behind; folds 2 and 3 bring the top corners
 *   forward to the centre; fold 4 turns the front layer's strip up, and
 *   fold 5 the back layer's, the same line folded opposite ways.
 * - Frozen: copy it rather than change it.
 */
export const PAPER_HAT = Object.freeze({
  aspect: ASPECT,
  id: "paper-hat",
  steps: Object.freeze([
    createFold(MIDDLE_LEFT, "all", MIDDLE_RIGHT, "mountain"),
    createFold(BRIM_LEFT, "all", CENTRE, "valley"),
    createFold(CENTRE, "all", BRIM_RIGHT, "valley"),
    createFold(BRIM_RIGHT, { heldBy: 0 }, BRIM_LEFT, "valley"),
    createFold(BRIM_RIGHT, { movedBy: 0 }, BRIM_LEFT, "mountain"),
  ]),
});
