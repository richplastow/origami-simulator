/** #### Reports each drag on an element as the pointer's change in position
 * - Starts a drag on a press of the primary pointer's primary button, and
 *   captures that pointer, so the drag carries on over other elements and
 *   outside the window. Mouse, touch and pen share this one path; a second
 *   finger is not primary, and both its press and its moves are ignored.
 * - The pointer capture is the drag's only state: the browser releases it
 *   on `pointerup` and `pointercancel`, which ends the drag.
 * - Allocates nothing per move.
 * @param element The element whose drags to report.
 * @param onDrag Called on each move with the change since the last event,
 *   right and down, in CSS pixels.
 */
export const connectDrag = (element, onDrag) => {
  // The pointer's position at the last event of the drag, in CSS pixels.
  let lastClientX = 0;
  let lastClientY = 0;

  element.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;

    element.setPointerCapture(event.pointerId);
    lastClientX = event.clientX;
    lastClientY = event.clientY;
  });

  // A touch captures its pointer implicitly, a second finger's included, so
  // capture alone would let that finger's moves into the drag.
  element.addEventListener("pointermove", (event) => {
    if (!event.isPrimary || !element.hasPointerCapture(event.pointerId)) {
      return;
    }

    onDrag(event.clientX - lastClientX, event.clientY - lastClientY);
    lastClientX = event.clientX;
    lastClientY = event.clientY;
  });
};
