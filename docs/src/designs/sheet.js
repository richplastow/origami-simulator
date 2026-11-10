/**
 * @fileoverview
 * The sheet a design folds from: its size, set by its shape, and its
 * starting pose, set by its roll and the side towards the viewer; and the
 * stretch and turn from one design's sheet to another's.
 */

import { smoothstep } from "../fold/easing.js";

/** #### The starting pose of a design that gives none: unrolled, front up
 * - `rollRadians`, in radians, anticlockwise as the viewer sees the
 *   sheet; `side`, `"front"` (coloured) or `"back"` (white), the side
 *   towards the viewer.
 * - Frozen, so every design that gives no `start` shares it.
 */
export const DEFAULT_START = Object.freeze({ rollRadians: 0, side: "front" });

// Every sheet has the area of a 15 cm square, a common origami paper size,
// so designs of different shapes appear at much the same size.
export const SHEET_AREA_SQUARE_METERS = 0.0225;

// The starting pose's turn about the sheet's upright axis, per side towards
// the viewer, in radians: the back turns as a turn-over does, its right
// edge swinging towards the viewer. These are the only two sides:
// cutSheet() rejects any other at load.
const SIDE_RADIANS = Object.freeze({ back: -Math.PI, front: 0 });

/** #### Returns the width and height of a sheet of the standard area
 * - Pure maths, with no DOM or GPU access.
 * @param aspect The sheet's width divided by its height.
 * @returns The sheet's `heightMeters` and `widthMeters`, in metres.
 */
export const sheetSize = (aspect) => {
  const heightMeters = Math.sqrt(SHEET_AREA_SQUARE_METERS / aspect);

  return { heightMeters, widthMeters: heightMeters * aspect };
};

/** #### Returns a design's starting pose, or the default if it gives none
 * - Allocates nothing, so it is safe on the per-frame path.
 * @param design The design, with an optional `start`.
 * @returns The design's `start`, or `DEFAULT_START`: `rollRadians`, in
 *   radians, and `side`, `"front"` or `"back"`.
 */
export const startOf = (design) => design.start ?? DEFAULT_START;

/** #### Writes the turn that takes the flat sheet from the old pose to the new
 * - Eases the side's turn, `y`, and the roll, `z`, together, from the old
 *   design's start to the new one's, by the stretch's eased progress, so a
 *   sheet that must both turn over and roll does both in one motion; both
 *   are exactly the new start's once the stretch is done.
 * - `y` is 0 for the front and −π for the back, so the sheet turns as a
 *   turn-over does; `z` is the roll, anticlockwise as the viewer sees it.
 *   Both are radians, for a rotation of order `ZYX`.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param designs The designs, keyed by `id`, each with an optional
 *   `start`.
 * @param rotation The object to write `y` and `z` to, such as a group's
 *   `rotation`.
 * @param state The sequence state: `designId`, `stretchFromId` and
 *   `stretchProgress`, from 0 to 1.
 */
export const writeStartPose = (designs, rotation, state) => {
  const from = startOf(designs[state.stretchFromId]);
  const to = startOf(designs[state.designId]);

  // Mixed as `from × (1 − p) + to × p`, which gives `to` exactly at p = 1.
  const p = smoothstep(state.stretchProgress);
  rotation.y = SIDE_RADIANS[from.side] * (1 - p) + SIDE_RADIANS[to.side] * p;
  rotation.z = from.rollRadians * (1 - p) + to.rollRadians * p;
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
