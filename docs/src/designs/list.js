import { HEART } from "./heart.js";
import { HOUSE } from "./house.js";
import { ICE_CREAM } from "./ice-cream.js";
import { MOUNT_FUJI } from "./mount-fuji.js";
import { PAPER_DART } from "./paper-dart.js";
import { PAPER_HAT } from "./paper-hat.js";
import { PENCIL } from "./pencil.js";
import { WATERMELON } from "./watermelon.js";
import { YACHT } from "./yacht.js";

/** #### Every design, in the order of their buttons on the page
 * - `main.js` cuts each design's sheet from it, and starts with the first;
 *   `fold-buttons.js` builds each button's target from it. A new design is
 *   its file, a line here and a `<button>` in `index.html`.
 * - Frozen: copy it rather than change it.
 */
export const DESIGNS = Object.freeze([
  PAPER_DART,
  PAPER_HAT,
  WATERMELON,
  YACHT,
  ICE_CREAM,
  MOUNT_FUJI,
  HOUSE,
  PENCIL,
  HEART,
]);
