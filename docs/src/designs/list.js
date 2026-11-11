import { HEART } from "./heart.js";
import { MOUNT_FUJI } from "./mount-fuji.js";
import { PAPER_DART } from "./paper-dart.js";
import { PENCIL } from "./pencil.js";
import { YACHT } from "./yacht.js";

/** #### Every design the page offers, in the order of their radios
 * - `main.js` cuts each design's sheet from it, and starts with the first,
 *   finished, in its colour; `design-radios.js` builds each radio's target
 *   and colour from it. A new design is its file, a line here and an
 *   `<input type="radio" name="design">` in its `<label>` in `index.html`.
 * - Each design may name its paper colour as `colorId`, an id in
 *   `PAPER_COLORS`, which choosing it fades the front to; one that names
 *   none leaves the colour as it is.
 * - Design files not imported here are kept but not loaded.
 * - Frozen: copy it rather than change it.
 */
export const DESIGNS = Object.freeze([
  PENCIL,
  MOUNT_FUJI,
  YACHT,
  PAPER_DART,
  HEART,
]);
