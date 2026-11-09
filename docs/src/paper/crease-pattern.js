/**
 * @fileoverview
 * The square sheet's crease pattern, as plain data in paper coordinates.
 */

export const PAPER_SIZE_METERS = 0.15; // 15 cm, a common origami paper size

/** #### Creates a square's pattern of eight triangles and four creases
 * - Paper coordinates are `[x, y]` in metres, centred on the origin, with
 *   the front facing +Z.
 * - Point 0 is the centre; points 1 to 8 run anticlockwise from the right
 *   edge's midpoint, so each triangle lists its points anticlockwise as seen
 *   from the front.
 * - Each crease runs from one boundary point to another through the centre,
 *   and its `from` to `to` direction is its fold axis. Creases are listed
 *   A-Z by `id`; `tl`, `br`, `bl` and `tr` name the corners.
 * - Pure data, with no DOM or GPU access.
 * @param sizeMeters The length of the square's side, in metres.
 * @returns The pattern: `creases`, `points`, `sizeMeters` and `triangles`.
 */
export const createCreasePattern = (sizeMeters) => {
  const half = sizeMeters / 2;

  return {
    creases: [
      { from: 6, id: "diagonal-bl-tr", to: 2 },
      { from: 4, id: "diagonal-tl-br", to: 8 },
      { from: 5, id: "horizontal", to: 1 },
      { from: 7, id: "vertical", to: 3 },
    ],
    points: [
      [0, 0],
      [half, 0],
      [half, half],
      [0, half],
      [-half, half],
      [-half, 0],
      [-half, -half],
      [0, -half],
      [half, -half],
    ],
    sizeMeters,
    triangles: [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 5],
      [0, 5, 6],
      [0, 6, 7],
      [0, 7, 8],
      [0, 8, 1],
    ],
  };
};
