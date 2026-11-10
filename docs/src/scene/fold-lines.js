/**
 * @fileoverview
 * Draws a design's crease pattern into a 2D canvas, as printed on the front
 * of its sheet: dashed lines for valley folds, dash-dot-dot lines for
 * mountain folds, after the Yoshizawa–Randlett system.
 */

const FOLD_LINE_COLOR = 0x000000; // black
const FOLD_LINE_DASH_MM = 3; // a dash's length, on the sheet
const FOLD_LINE_DOT_MM = 0.5; // a mountain line's dot's length, on the sheet
const FOLD_LINE_GAP_MM = 1.5; // the gap after a dash or a dot, on the sheet
const FOLD_LINE_TEXTURE_PX = 2048; // the canvas, along the sheet's longer side
const FOLD_LINE_WIDTH_MM = 0.5; // on the sheet

/** #### Sizes a canvas to a sheet and draws the sheet's crease pattern on it
 * - The canvas is `FOLD_LINE_TEXTURE_PX` along the sheet's longer side and
 *   the shorter side by its aspect, so its pixels are square on the sheet.
 * - Draws the sheet's front as seen, top edge at the canvas's top row: a
 *   sheet point `(x, y)` lands at `((x / width + 0.5) × canvas.width,
 *   (0.5 − y / height) × canvas.height)`, which a texture's default
 *   `flipY` uploads at `u = x / width + 0.5`, `v = y / height + 0.5`.
 * - Resizing clears the canvas, so the old pattern never shows through.
 * - Allocates, so call it only when the design changes.
 * @param canvas The canvas to draw on, resized here.
 * @param sheet The sheet that cutSheet() returns, with its `creaseLines`.
 */
export const drawFoldLines = (canvas, sheet) => {
  const { creaseLines, heightMeters, widthMeters } = sheet;
  const longerMeters = Math.max(widthMeters, heightMeters);
  const pixelsPerMeter = FOLD_LINE_TEXTURE_PX / longerMeters;
  canvas.width = Math.round(pixelsPerMeter * widthMeters);
  canvas.height = Math.round(pixelsPerMeter * heightMeters);

  const pixelsPerMillimeter = pixelsPerMeter / 1000;
  const dash = FOLD_LINE_DASH_MM * pixelsPerMillimeter;
  const dot = FOLD_LINE_DOT_MM * pixelsPerMillimeter;
  const gap = FOLD_LINE_GAP_MM * pixelsPerMillimeter;
  const dashes = {
    mountain: [dash, gap, dot, gap, dot, gap],
    valley: [dash, gap],
  };

  const context = canvas.getContext("2d");
  context.lineCap = "butt";
  context.lineWidth = FOLD_LINE_WIDTH_MM * pixelsPerMillimeter;
  context.strokeStyle = `#${FOLD_LINE_COLOR.toString(16).padStart(6, "0")}`;

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
