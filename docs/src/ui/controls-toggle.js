/** #### Hides and shows the toolbar on Escape, for a presentation mode
 * - Toggles a `data-hidden` attribute on the `.controls` element, which
 *   the CSS fades out and back in, and which the mouse passes through
 *   while hidden. The controls stay within keyboard reach, so the arrow
 *   keys still step through the designs and colours.
 * - Ignores a held key's repeats, so holding Escape toggles once.
 * - On hiding, moves focus to the checked design if focus is outside the
 *   toolbar, so the arrow keys step through the designs at once, without
 *   a Tab first.
 * - Throws at once if the page has no `.controls`, and on hiding if no
 *   design is checked.
 */
export const connectControlsToggle = () => {
  const controls = document.querySelector(".controls");
  if (controls === null) {
    throw new Error("No toolbar: .controls");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat) return;

    const isHidden = controls.toggleAttribute("data-hidden");
    if (!isHidden || controls.contains(document.activeElement)) return;

    const checked = controls.querySelector('input[name="design"]:checked');
    if (checked === null) {
      throw new Error('No checked design: input[name="design"]:checked');
    }
    checked.focus();
  });
};
