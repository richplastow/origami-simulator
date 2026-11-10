/**
 * @fileoverview
 * Connects the page's fold buttons to the point in a fold sequence that the
 * paper should move to.
 */

import { PAPER_DART } from "../designs/paper-dart.js";

// Each button's `data-fold` value, mapped to its sequence target. A
// `designId` of null means flat, keeping the sheet showing.
const FOLD_TARGETS = {
  flat: Object.freeze({ designId: null, position: 0 }),
  "paper-dart": Object.freeze({
    designId: PAPER_DART.id,
    position: PAPER_DART.folds.length,
  }),
};

/** #### Passes a button's sequence target on whenever that button is clicked
 * - Each target is frozen: copy it rather than change it.
 * - Throws at once if a button's `data-fold` names no known target.
 * @param onTarget Called with the clicked button's target: `designId` and
 *   `position`.
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
