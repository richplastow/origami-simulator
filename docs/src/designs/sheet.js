/**
 * @fileoverview
 * The size of the sheet a design folds from, set by its shape alone, and
 * the stretch from one design's sheet to another's.
 */

import { smoothstep } from "../fold/easing.js";

// Every sheet has the area of a 15 cm square, a common origami paper size,
// so designs of different shapes appear at much the same size.
export const SHEET_AREA_SQUARE_METERS = 0.0225;

/** #### Returns the width and height of a sheet of the standard area
 * - Pure maths, with no DOM or GPU access.
 * @param aspect The sheet's width divided by its height.
 * @returns The sheet's `heightMeters` and `widthMeters`, in metres.
 */
export const sheetSize = (aspect) => {
  const heightMeters = Math.sqrt(SHEET_AREA_SQUARE_METERS / aspect);

  return { heightMeters, widthMeters: heightMeters * aspect };
};

/** #### Writes the scale that stretches the incoming sheet from the old shape
 * - Eases each of the width and height from the old sheet's to the new's,
 *   and divides by the new sheet's, so the new sheet, scaled, shows the
 *   stretch; both scales are exactly 1 once the stretch is done.
 * - Works out each size inline, as sheetSize() does, since sheetSize()
 *   returns a new object.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param designs The designs, keyed by `id`, each with its `aspect`.
 * @param scale The object to write `x` and `y` to, such as a group's
 *   `scale`.
 * @param state The sequence state: `designId`, `stretchFromId` and
 *   `stretchProgress`, from 0 to 1.
 */
export const writeStretchScale = (designs, scale, state) => {
  const fromAspect = designs[state.stretchFromId].aspect;
  const toAspect = designs[state.designId].aspect;
  const fromHeightMeters = Math.sqrt(SHEET_AREA_SQUARE_METERS / fromAspect);
  const toHeightMeters = Math.sqrt(SHEET_AREA_SQUARE_METERS / toAspect);
  const fromWidthMeters = fromHeightMeters * fromAspect;
  const toWidthMeters = toHeightMeters * toAspect;

  // Mixed as `from × (1 − p) + to × p`, which gives `to` exactly at p = 1.
  const p = smoothstep(state.stretchProgress);
  scale.x = (fromWidthMeters * (1 - p) + toWidthMeters * p) / toWidthMeters;
  scale.y = (fromHeightMeters * (1 - p) + toHeightMeters * p) / toHeightMeters;
};
