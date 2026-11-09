/**
 * @fileoverview
 * Connects the page's fold buttons to the fold the paper should move to.
 */

import { MAX_FOLD_RADIANS } from "../fold/animation.js";

// Each button's `data-fold` value, mapped to its target fold.
const FOLD_TARGETS = {
  flat: Object.freeze({ angleRadians: 0, creaseId: null }),
  "mountain-horizontal": Object.freeze({
    angleRadians: -MAX_FOLD_RADIANS,
    creaseId: "horizontal",
  }),
  "valley-diagonal": Object.freeze({
    angleRadians: MAX_FOLD_RADIANS,
    creaseId: "diagonal-tl-br",
  }),
};

/** #### Passes a button's target fold on whenever that button is clicked
 * - Each target is frozen: copy it rather than change it.
 * - Throws at once if a button's `data-fold` names no known fold.
 * @param onTarget Called with the clicked button's target fold:
 *   `angleRadians` and `creaseId`.
 */
export const connectFoldButtons = (onTarget) => {
  for (const button of document.querySelectorAll("button[data-fold]")) {
    const target = FOLD_TARGETS[button.dataset.fold];
    if (target === undefined) {
      throw new Error(`Unknown data-fold value: "${button.dataset.fold}"`);
    }

    button.addEventListener("click", () => onTarget(target));
  }
};
