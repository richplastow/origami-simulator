/**
 * @fileoverview
 * The size of the sheet a design folds from, set by its shape alone.
 */

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
