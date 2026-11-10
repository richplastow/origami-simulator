/** #### Paints the paper-colour swatches and passes the chosen one on
 * - Sets each `input[name="paper-color"]`'s `--swatch-color` custom
 *   property from the colour its `value` names, so the page's HTML holds
 *   ids only.
 * - Returns the checked swatch's id, since a browser may restore a radio's
 *   state on reload, whatever the page's `checked` attribute says.
 * - Throws at once if a swatch names no known colour, or none is checked.
 * @param colors Each colour's id mapped to its colour, as a hex number in
 *   sRGB, such as `PAPER_COLORS`.
 * @param onChange Called with the newly chosen swatch's id on every change.
 * @returns The id of the swatch checked now.
 */
export const connectColorSwatches = (colors, onChange) => {
  const swatches = document.querySelectorAll('input[name="paper-color"]');
  for (const swatch of swatches) {
    if (!Object.hasOwn(colors, swatch.value)) {
      throw new Error(`Unknown paper-color value: "${swatch.value}"`);
    }

    swatch.style.setProperty(
      "--swatch-color",
      `#${colors[swatch.value].toString(16).padStart(6, "0")}`,
    );

    // A radio fires `change` only when it becomes checked.
    swatch.addEventListener("change", () => onChange(swatch.value));
  }

  const checked = [...swatches].find((swatch) => swatch.checked);
  if (checked === undefined) {
    throw new Error('No checked swatch: input[name="paper-color"]:checked');
  }

  return checked.value;
};
