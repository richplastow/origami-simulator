/**
 * @fileoverview
 * Connects the page's fold buttons to the point in a design's sequence of
 * steps that the paper should move to.
 */

import { DESIGNS } from "../designs/list.js";

// Each button's `data-fold` value, mapped to its sequence target: "flat",
// whose `designId` of null means flat, keeping the sheet showing, and each
// design's `id`, whose target is its last step.
const FOLD_TARGETS = Object.freeze({
  flat: Object.freeze({ designId: null, position: 0 }),
  ...Object.fromEntries(
    DESIGNS.map(({ id, steps }) => [
      id,
      Object.freeze({ designId: id, position: steps.length }),
    ]),
  ),
});

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
