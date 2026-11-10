/** #### Passes the "Fold lines" checkbox's state on, now and on every change
 * - Passes it once on connection, since a browser may restore a
 *   checkbox's state on reload, whatever the page's `checked` attribute
 *   says.
 * - Throws at once if the page has no `input[data-fold-lines]`.
 * @param onChange Called with true if the checkbox is ticked.
 */
export const connectFoldLinesToggle = (onChange) => {
  const checkbox = document.querySelector("input[data-fold-lines]");
  if (checkbox === null) {
    throw new Error("No fold-lines checkbox: input[data-fold-lines]");
  }

  onChange(checkbox.checked);
  checkbox.addEventListener("change", () => onChange(checkbox.checked));
};
