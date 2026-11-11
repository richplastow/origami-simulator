/** #### Paints the paper-colour swatches, checks one, and passes each choice on
 * - Sets each `input[name="paper-color"]`'s `--swatch-color` custom
 *   property from the colour its `value` names, so the page's HTML holds
 *   ids only.
 * - Checks the given colour's swatch at connection, whatever the browser
 *   restored on reload, so every load starts on the same colour.
 * - Returns chooseColor(), which chooses a colour from code: it checks
 *   that colour's swatch and passes it on, unless it is already the
 *   chosen colour, so choosing it again starts no fade.
 * - Throws at once if a swatch names no known colour, or no swatch names
 *   the given colour.
 * @param colorId The id of the colour to check at connection.
 * @param colors Each colour's id mapped to its colour, as a hex number in
 *   sRGB, such as `PAPER_COLORS`.
 * @param onChange Called with the newly chosen colour's id on every change,
 *   by a swatch or by chooseColor().
 * @returns chooseColor(), which takes the id of a colour to choose.
 */
export const connectColorSwatches = (colorId, colors, onChange) => {
  const swatches = [...document.querySelectorAll('input[name="paper-color"]')];

  // The id of the colour chosen last, by a swatch or from code.
  let chosenId = colorId;
  for (const swatch of swatches) {
    if (!Object.hasOwn(colors, swatch.value)) {
      throw new Error(`Unknown paper-color value: "${swatch.value}"`);
    }

    swatch.style.setProperty(
      "--swatch-color",
      `#${colors[swatch.value].toString(16).padStart(6, "0")}`,
    );

    // A radio fires `change` only when it becomes checked.
    swatch.addEventListener("change", () => {
      chosenId = swatch.value;
      onChange(swatch.value);
    });
  }

  /** #### Returns the swatch whose `value` is the given id
   * - Throws if no swatch names that id.
   * @param id The colour's id.
   * @returns The swatch.
   */
  const swatchOf = (id) => {
    const swatch = swatches.find((candidate) => candidate.value === id);
    if (swatch === undefined) {
      throw new Error(`No swatch: input[name="paper-color"][value="${id}"]`);
    }
    return swatch;
  };

  swatchOf(colorId).checked = true;

  return (nextId) => {
    if (nextId === chosenId) return;

    swatchOf(nextId).checked = true;
    chosenId = nextId;
    onChange(nextId);
  };
};
