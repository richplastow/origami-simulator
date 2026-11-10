/**
 * @fileoverview
 * Draws a design's crease pattern into a 2D canvas, as printed on either side
 * of its sheet: dashed lines for valley folds, dash-dot-dot lines for
 * mountain folds, after the Yoshizawa–Randlett system.
 */

const FOLD_LINE_BACK_COLOR = 0xffffff; // white, the back's coverage mask
const FOLD_LINE_BACK_FILL_COLOR = 0x000000; // black, the back's bare paper
const FOLD_LINE_DASH_MM = 3; // a dash's length, on the sheet
const FOLD_LINE_DOT_MM = 0.5; // a mountain line's dot's length, on the sheet
const FOLD_LINE_FRONT_COLOR = 0x000000; // black
const FOLD_LINE_GAP_MM = 1.5; // the gap after a dash or a dot, on the sheet
const FOLD_LINE_TEXTURE_PX = 2048; // the canvas, along the sheet's longer side
const FOLD_LINE_WIDTH_MM = 0.5; // on the sheet

/** #### Sizes a canvas to a sheet and draws one side's crease pattern on it
 * - The canvas is `FOLD_LINE_TEXTURE_PX` along the sheet's longer side and
 *   the shorter side by its aspect, so its pixels are square on the sheet.
 * - Draws either side at the same canvas coordinates, top edge at the
 *   canvas's top row: a sheet point `(x, y)` lands at `((x / width + 0.5) ×
 *   canvas.width, (0.5 − y / height) × canvas.height)`, which a texture's
 *   default `flipY` uploads at `u = x / width + 0.5`,
 *   `v = y / height + 0.5`. Both sides' meshes share those UVs, so each back
 *   line lies beneath its front line; seen from behind, the back's pattern
 *   looks mirrored left to right, without the canvas being mirrored.
 * - The front's lines are black on a clear canvas, each of its own kind.
 * - The back's lines are a coverage mask, white on a canvas filled black,
 *   each of the opposite kind, since a fold that goes away from the front
 *   comes towards the back. Opaque, the mask has no clear texels, whose
 *   black filtering would mix into a line's edges.
 * - Resizing clears the canvas, so the old pattern never shows through.
 * - Allocates, so call it only when the design changes.
 * @param canvas The canvas to draw on, resized here.
 * @param sheet The sheet that cutSheet() returns, with its `creaseLines`,
 *   each typed as seen from the front.
 * @param side `"front"` or `"back"`, the side of the sheet to draw.
 */
export const drawFoldLines = (canvas, sheet, side) => {
  const { creaseLines, heightMeters, widthMeters } = sheet;
  const longerMeters = Math.max(widthMeters, heightMeters);
  const pixelsPerMeter = FOLD_LINE_TEXTURE_PX / longerMeters;
  canvas.width = Math.round(pixelsPerMeter * widthMeters);
  canvas.height = Math.round(pixelsPerMeter * heightMeters);

  const pixelsPerMillimeter = pixelsPerMeter / 1000;
  const dash = FOLD_LINE_DASH_MM * pixelsPerMillimeter;
  const dot = FOLD_LINE_DOT_MM * pixelsPerMillimeter;
  const gap = FOLD_LINE_GAP_MM * pixelsPerMillimeter;
  const mountainDash = [dash, gap, dot, gap, dot, gap];
  const valleyDash = [dash, gap];
  const isBack = side === "back";
  const dashes = isBack
    ? { mountain: valleyDash, valley: mountainDash }
    : { mountain: mountainDash, valley: valleyDash };

  const context = canvas.getContext("2d");
  if (isBack) {
    context.fillStyle = toCssColor(FOLD_LINE_BACK_FILL_COLOR);
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.lineCap = "butt";
  context.lineWidth = FOLD_LINE_WIDTH_MM * pixelsPerMillimeter;
  context.strokeStyle = toCssColor(
    isBack ? FOLD_LINE_BACK_COLOR : FOLD_LINE_FRONT_COLOR,
  );

  const toCanvasX = (x) => (x / widthMeters + 0.5) * canvas.width;
  const toCanvasY = (y) => (0.5 - y / heightMeters) * canvas.height;
  for (const { from, to, type } of creaseLines) {
    context.setLineDash(dashes[type]);
    context.beginPath();
    context.moveTo(toCanvasX(from[0]), toCanvasY(from[1]));
    context.lineTo(toCanvasX(to[0]), toCanvasY(to[1]));
    context.stroke();
  }
};

/** #### Formats a colour as a CSS hex string, such as `#ffffff`
 * @param color The colour, as a hex number in sRGB.
 * @returns The CSS colour.
 */
const toCssColor = (color) => `#${color.toString(16).padStart(6, "0")}`;
