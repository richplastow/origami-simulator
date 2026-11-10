/**
 * @fileoverview
 * Makes the steps of a design's sequence: folds, and turn-overs.
 */

const FLAT_FOLD_RADIANS = Math.PI; // a fold pressed flat, 180°

/** #### A turn-over: the whole model turns half a turn about its upright axis
 * - Folds nothing; the folds after it are written as the viewer then sees
 *   the paper, its other side towards them.
 * - Frozen, so every design shares it.
 */
export const TURN_OVER = Object.freeze({ kind: "turn-over" });

/** #### Creates one frozen fold step, written in the view frame
 * - Its line runs `from` → `to` as the viewer sees the paper at this step,
 *   the side to the line's left, as the viewer sees it, moves, and a valley
 *   comes towards the viewer.
 * @param from The fold line's start, `[x, y]` in metres.
 * @param layers `"all"`, `{ heldBy }` or `{ movedBy }`, naming a fold by its
 *   index in the design's `steps`.
 * @param to The fold line's end, `[x, y]` in metres.
 * @param type `"mountain"` or `"valley"`.
 * @param options Optional `targetRadians`, the finished angle in radians,
 *   180° by default, and `turns`, `"moving-side"` by default.
 * @returns The fold step, of `kind` `"fold"`.
 */
export const createFold = (from, layers, to, type, options = {}) => {
  const { targetRadians = FLAT_FOLD_RADIANS, turns = "moving-side" } = options;

  // Object.freeze() returns a string, such as "all", unchanged.
  return Object.freeze({
    from: Object.freeze(from),
    kind: "fold",
    layers: Object.freeze(layers),
    targetRadians,
    to: Object.freeze(to),
    turns,
    type,
  });
};
