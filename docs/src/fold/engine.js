/**
 * @fileoverview
 * Cuts a design's sheet into the faces its folds make, once, at load.
 */

import { sheetSize } from "../designs/sheet.js";

const IDENTITY_PLACEMENT = Object.freeze([1, 0, 0, 1, 0, 0]);

// Slivers left by rounding, smaller than a 10 µm square, are not paper:
// neither a piece of a cut nor an overlap of two faces.
const MIN_AREA_SQUARE_METERS = 1e-10;

// A point this close to a line lies on it, and two points this close to
// each other are one point.
const TOLERANCE_METERS = 1e-9;

/** #### Cuts a design's sheet into faces by running each of its folds once
 * - Each fold splits the faces it selects along its line, reflects the
 *   pieces to the line's left across it, and stacks them, in reverse
 *   order, above every face for a valley or below every face for a
 *   mountain.
 * - Each face holds its `polygon` in sheet coordinates, anticlockwise from
 *   the front, in metres; `movedBy`, the indices of the folds that moved
 *   it; and, per stage from 0 (flat) to the fold count, its `placements`,
 *   `[a, b, c, d, tx, ty]` for `x' = a·x + c·y + tx`,
 *   `y' = b·x + d·y + ty`, and its `layers`, counted from 1 at the back.
 * - Each stage's centre, `[x, y]` in metres, is the centre of the faces'
 *   bounding box in the folded plane at that stage, so the paper can slide
 *   to stay centred. A fold that turns both sides, or stops short of 180°,
 *   keeps the centre it starts with, so its stage repeats the one before.
 * - Each bridge is a quad of vertex indices, `[a0, a1, b0, b1]`, joining
 *   an edge that two faces share, where `a0` and `b0` are the same sheet
 *   point. Vertices are counted face by face, around each polygon.
 * - Throws, naming the design, when a fold moves nothing, when a fold that
 *   stops short of 180° is followed by a fold that moves its faces, and
 *   when the final faces leave a T-junction.
 * - Pure maths, with no DOM or GPU access.
 * @param design The design: `aspect`, `folds` and `id`.
 * @returns The sheet: `bridges`, `centres`, one per stage from 0 (flat) to
 *   the fold count, `designId`, `faces`, `folds`, `heightMeters` and
 *   `widthMeters`.
 */
export const cutSheet = (design) => {
  const { folds, id } = design;
  const { heightMeters, widthMeters } = sheetSize(design.aspect);
  const halfWidth = widthMeters / 2;
  const halfHeight = heightMeters / 2;

  let faces = [
    {
      movedBy: [],
      placements: [IDENTITY_PLACEMENT],
      polygon: [
        [-halfWidth, -halfHeight],
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight],
      ],
      ranks: [0],
    },
  ];
  folds.forEach((fold, foldIndex) => {
    faces = applyFold(faces, foldIndex, design);
  });

  const layers = stackLayers(faces, folds.length);
  if (hasTJunction(faces)) {
    throw new Error(`Design "${id}" leaves a T-junction`);
  }

  return {
    bridges: findBridges(faces),
    centres: stageCentres(faces, folds),
    designId: id,
    faces: faces.map(({ movedBy, placements, polygon }, i) => ({
      layers: layers[i],
      movedBy,
      placements,
      polygon,
    })),
    folds,
    heightMeters,
    widthMeters,
  };
};

/** #### Returns true if a fold stops short of 180°, so is never pressed flat
 * @param fold One of a design's folds.
 * @returns True if the fold's `targetRadians` is under π.
 */
export const stopsShort = (fold) => fold.targetRadians < Math.PI;

/** #### Runs one fold over the faces, returning the faces it leaves
 * - Every face gains one placement and one rank, for the stage after it.
 * @param faces The faces before the fold, each with `ranks`.
 * @param foldIndex The fold's index in the design's `folds`.
 * @param design The design, for its folds and its `id`.
 * @returns The faces after the fold.
 */
const applyFold = (faces, foldIndex, design) => {
  const fold = design.folds[foldIndex];
  const [px, py] = fold.from;
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const ux = (fold.to[0] - px) / length;
  const uy = (fold.to[1] - py) / length;

  // Reflecting across the line maps `v` to `p + (2uuᵀ − I)(v − p)`.
  const a = ux * ux - uy * uy;
  const b = 2 * ux * uy;
  const reflection = [a, b, b, -a, px - a * px - b * py, py - b * px + a * py];

  const held = [];
  const moving = [];
  for (const face of faces) {
    const placement = face.placements.at(-1);
    if (!selectsFace(fold.layers, face)) {
      held.push(face);
      continue;
    }

    // Signed distance from the line, in the folded plane; left is positive.
    const sides = face.polygon.map((point) => {
      const [x, y] = place(placement, point);
      return ux * (y - py) - uy * (x - px);
    });
    const left = clipPolygon(face.polygon, sides, 1);
    const right = clipPolygon(face.polygon, sides, -1);
    if (left !== null) moving.push({ ...face, polygon: left });
    if (right !== null) held.push({ ...face, polygon: right });
  }

  if (moving.length === 0) {
    throw new Error(`Fold ${foldIndex} of design "${design.id}" moves nothing`);
  }
  for (const { movedBy } of moving) {
    const earlier = movedBy.find((j) => stopsShort(design.folds[j]));
    if (earlier !== undefined) {
      throw new Error(
        `Fold ${earlier} of design "${design.id}" stops short, ` +
          `but fold ${foldIndex} moves its faces`,
      );
    }
  }

  // Moving faces reverse their order, and stack above every face for a
  // valley or below every face for a mountain.
  const allRanks = faces.map(({ ranks }) => ranks.at(-1));
  const movingRanks = moving.map(({ ranks }) => ranks.at(-1));
  const rankSum =
    fold.type === "valley"
      ? Math.max(...allRanks) + 1 + Math.max(...movingRanks)
      : Math.min(...allRanks) - 1 + Math.min(...movingRanks);

  return [
    ...held.map((face) => ({
      ...face,
      placements: [...face.placements, face.placements.at(-1)],
      ranks: [...face.ranks, face.ranks.at(-1)],
    })),
    ...moving.map((face) => ({
      ...face,
      movedBy: [...face.movedBy, foldIndex],
      placements: [
        ...face.placements,
        compose(reflection, face.placements.at(-1)),
      ],
      ranks: [...face.ranks, rankSum - face.ranks.at(-1)],
    })),
  ];
};

/** #### Splits a convex polygon by a line, keeping one side
 * - Corners on the line belong to both sides.
 * @param polygon The polygon's corners, `[x, y]`.
 * @param sides Each corner's signed distance from the line, in metres.
 * @param keep 1 to keep the positive side, −1 the negative side.
 * @returns The kept piece, or null if it is too small to be paper.
 */
const clipPolygon = (polygon, sides, keep) => {
  const piece = [];
  polygon.forEach((point, i) => {
    const j = (i + 1) % polygon.length;
    const s = keep * sides[i];
    const t = keep * sides[j];
    if (s >= -TOLERANCE_METERS) piece.push(point);
    if (
      (s > TOLERANCE_METERS && t < -TOLERANCE_METERS) ||
      (s < -TOLERANCE_METERS && t > TOLERANCE_METERS)
    ) {
      const k = s / (s - t);
      const next = polygon[j];
      piece.push([
        point[0] + k * (next[0] - point[0]),
        point[1] + k * (next[1] - point[1]),
      ]);
    }
  });

  return piece.length > 2 &&
    Math.abs(signedArea(piece)) > MIN_AREA_SQUARE_METERS
    ? piece
    : null;
};

/** #### Composes two placements, `outer` applied after `inner`
 * @param outer The placement applied second.
 * @param inner The placement applied first.
 * @returns The composed placement.
 */
const compose = (outer, inner) => [
  outer[0] * inner[0] + outer[2] * inner[1],
  outer[1] * inner[0] + outer[3] * inner[1],
  outer[0] * inner[2] + outer[2] * inner[3],
  outer[1] * inner[2] + outer[3] * inner[3],
  outer[0] * inner[4] + outer[2] * inner[5] + outer[4],
  outer[1] * inner[4] + outer[3] * inner[5] + outer[5],
];

/** #### Finds every edge two faces share, as a bridging strip
 * @param faces The final faces.
 * @returns The strips, each `[a0, a1, b0, b1]`.
 */
const findBridges = (faces) => {
  const firstVertices = [];
  let vertexCount = 0;
  for (const { polygon } of faces) {
    firstVertices.push(vertexCount);
    vertexCount += polygon.length;
  }

  // Both polygons run anticlockwise, so a shared edge runs opposite ways.
  const bridges = [];
  faces.forEach(({ polygon: p }, i) => {
    for (let j = i + 1; j < faces.length; j++) {
      const q = faces[j].polygon;
      p.forEach((a0, m) => {
        const m1 = (m + 1) % p.length;
        q.forEach((b1, n) => {
          const n1 = (n + 1) % q.length;
          if (samePoint(a0, q[n1]) && samePoint(p[m1], b1)) {
            bridges.push([
              firstVertices[i] + m,
              firstVertices[i] + m1,
              firstVertices[j] + n1,
              firstVertices[j] + n,
            ]);
          }
        });
      });
    }
  });

  return bridges;
};

/** #### Returns true if any face's corner lies part-way along another's edge
 * @param faces The final faces.
 * @returns True if the faces leave a T-junction.
 */
const hasTJunction = (faces) =>
  faces.some(({ polygon: p }, i) =>
    faces.some(
      ({ polygon: q }, j) =>
        i !== j &&
        p.some((corner) =>
          q.some((start, n) =>
            liesInsideEdge(corner, start, q[(n + 1) % q.length]),
          ),
        ),
    ),
  );

/** #### Returns true if a point lies on an edge, but at neither end
 * @param point The point, `[x, y]`.
 * @param start The edge's start, `[x, y]`.
 * @param end The edge's end, `[x, y]`.
 * @returns True if the point lies part-way along the edge.
 */
const liesInsideEdge = (point, start, end) => {
  if (samePoint(point, start) || samePoint(point, end)) return false;

  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  const along =
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length;
  const across =
    (dx * (point[1] - start[1]) - dy * (point[0] - start[0])) / length;

  return Math.abs(across) < TOLERANCE_METERS && along > 0 && along < length;
};

/** #### Returns true if two convex polygons overlap by more than a sliver
 * - Clips the first by each edge of the second in turn.
 * @param first The first polygon, anticlockwise.
 * @param second The second polygon, anticlockwise.
 * @returns True if they overlap.
 */
const overlaps = (first, second) => {
  let piece = first;
  for (let i = 0; i < second.length && piece !== null; i++) {
    const [px, py] = second[i];
    const [qx, qy] = second[(i + 1) % second.length];
    const length = Math.hypot(qx - px, qy - py);
    const sides = piece.map(
      ([x, y]) => ((qx - px) * (y - py) - (qy - py) * (x - px)) / length,
    );
    piece = clipPolygon(piece, sides, 1);
  }

  return piece !== null;
};

/** #### Applies a placement to a point in sheet coordinates
 * @param placement The placement, `[a, b, c, d, tx, ty]`.
 * @param point The point, `[x, y]` in metres.
 * @returns The point in the folded plane, `[x, y]` in metres.
 */
const place = ([a, b, c, d, tx, ty], [x, y]) => [
  a * x + c * y + tx,
  b * x + d * y + ty,
];

/** #### Returns true if two points are one
 * @param first The first point, `[x, y]`.
 * @param second The second point, `[x, y]`.
 * @returns True if they lie within the tolerance of each other.
 */
const samePoint = (first, second) =>
  Math.hypot(first[0] - second[0], first[1] - second[1]) < TOLERANCE_METERS;

/** #### Returns true if a fold's layer selection takes in a face
 * - Throws on a selection it does not know.
 * @param layers `"all"`, `{ heldBy }` or `{ movedBy }`.
 * @param face The face, with `movedBy`.
 * @returns True if the fold takes part in moving the face.
 */
const selectsFace = (layers, face) => {
  if (layers === "all") return true;
  if (layers.movedBy !== undefined) {
    return face.movedBy.includes(layers.movedBy);
  }
  if (layers.heldBy !== undefined) return !face.movedBy.includes(layers.heldBy);

  throw new Error(`Unknown layer selection: ${JSON.stringify(layers)}`);
};

/** #### Returns a polygon's area, positive when it runs anticlockwise
 * @param polygon The polygon's corners, `[x, y]` in metres.
 * @returns The signed area, in square metres.
 */
const signedArea = (polygon) =>
  polygon.reduce((sum, [x, y], i) => {
    const [nextX, nextY] = polygon[(i + 1) % polygon.length];
    return sum + x * nextY - nextX * y;
  }, 0) / 2;

/** #### Finds each face's layer at each stage, from what lies beneath it
 * - At each stage, in rank order from the back, a face sits one layer
 *   above the highest face of lower rank that it overlaps.
 * @param faces The final faces, each with `placements` and `ranks`.
 * @param foldCount The design's number of folds.
 * @returns Per face, its layer at each stage, from 1.
 */
const stackLayers = (faces, foldCount) => {
  const layers = faces.map(() => []);
  for (let stage = 0; stage <= foldCount; stage++) {
    const placed = faces.map(({ placements, polygon }) => {
      const points = polygon.map((point) => place(placements[stage], point));
      return signedArea(points) < 0 ? points.reverse() : points;
    });
    const rankOf = (i) => faces[i].ranks[stage];
    const order = faces.map((_, i) => i).sort((i, j) => rankOf(i) - rankOf(j));

    order.forEach((i, position) => {
      let layer = 1;
      for (const j of order.slice(0, position)) {
        if (rankOf(j) < rankOf(i) && overlaps(placed[i], placed[j])) {
          layer = Math.max(layer, layers[j][stage] + 1);
        }
      }
      layers[i][stage] = layer;
    });
  }

  return layers;
};

/** #### Finds the centre the paper slides to at each stage
 * - The centre of the faces' bounding box in the folded plane, except
 *   after a fold that turns both sides or stops short of 180°, which keeps
 *   the stage before's: such a fold leaves the paper in a plane that the
 *   bounding box does not describe.
 * @param faces The final faces, each with `placements`.
 * @param folds The design's folds.
 * @returns Per stage, from 0 (flat) to the fold count, `[x, y]` in metres.
 */
const stageCentres = (faces, folds) => {
  const centres = [];
  for (let stage = 0; stage <= folds.length; stage++) {
    const fold = folds[stage - 1];
    if (stage > 0 && (fold.turns === "both-sides" || stopsShort(fold))) {
      centres.push(centres[stage - 1]);
      continue;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const { placements, polygon } of faces) {
      for (const point of polygon) {
        const [x, y] = place(placements[stage], point);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    centres.push(Object.freeze([(minX + maxX) / 2, (minY + maxY) / 2]));
  }

  return centres;
};
