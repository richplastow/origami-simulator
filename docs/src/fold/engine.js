/**
 * @fileoverview
 * Cuts a design's sheet into the faces its folds make, once, at load.
 */

import { sheetSize, startOf } from "../designs/sheet.js";

const IDENTITY_PLACEMENT = Object.freeze([1, 0, 0, 1, 0, 0]);

// Slivers left by rounding, smaller than a 10 µm square, are not paper:
// neither a piece of a cut nor an overlap of two faces.
const MIN_AREA_SQUARE_METERS = 1e-10;

// A point this close to a line lies on it, and two points this close to
// each other are one point.
const TOLERANCE_METERS = 1e-9;

/** #### Cuts a design's sheet into faces by running each of its folds once
 * - Reads the design's steps first, turning each fold from the view frame,
 *   as the viewer sees the paper at that step, from its starting pose and
 *   the turn-overs before it, into the front's terms, as readSteps() sets
 *   out. A turn-over folds nothing, so leaves the faces as they are.
 * - Each fold splits the faces it selects along its line, reflects the
 *   pieces to the line's left across it, and stacks them, in reverse
 *   order, above every face for a valley or below every face for a
 *   mountain.
 * - Each face holds its `polygon` in sheet coordinates, anticlockwise from
 *   the front, in metres; `movedBy`, the indices in `folds` of the folds
 *   that moved it; and, per stage from 0 (flat) to the fold count, its
 *   `placements`, `[a, b, c, d, tx, ty]` for `x' = a·x + c·y + tx`,
 *   `y' = b·x + d·y + ty`, into the folded plane as seen from the front,
 *   and its `layers`, counted from 1 at the back.
 * - Each stage's centre, `[x, y]` in metres in the folded plane as seen
 *   from the front, is the centre of the faces' bounding box as the viewer
 *   sees them in the starting pose, turned back into the folded plane, so
 *   the paper can slide to stay centred on screen. A fold that turns both
 *   sides, or stops short of 180°, keeps the centre it starts with, so its
 *   stage repeats the one before.
 * - Each bridge is a quad of vertex indices, `[a0, a1, b0, b1]`, joining
 *   an edge that two faces share, where `a0` and `b0` are the same sheet
 *   point. Vertices are counted face by face, around each polygon.
 * - Each crease line is where a fold's line crosses one face it splits,
 *   in sheet coordinates: `from` and `to`, `[x, y]` in metres, in no set
 *   order, and `type`, as seen from the sheet's front: the fold's type in
 *   the front's terms, or the opposite when the face lies face down before
 *   the fold. Lines are not merged, so a fold through several layers gives
 *   several.
 * - Throws, naming the design, before any fold runs, when its `start` has
 *   a `side` other than `"front"` or `"back"`, or a `rollRadians` that is
 *   not a finite number, as startFrame() sets out.
 * - Throws, naming the design and a step by its index in `steps`, before
 *   any fold runs, when a step's `kind` is unknown and when a fold's
 *   `layers` name a step that is not a fold; and, as the folds run, when a
 *   fold moves nothing and when a fold that stops short of 180° is
 *   followed by a fold that moves its faces. Throws, naming the design,
 *   when the final faces leave a T-junction.
 * - Pure maths, with no DOM or GPU access.
 * @param design The design: `aspect`; `id`; an optional `start`, its
 *   starting pose, as startOf() reads it; and `steps`, each a fold, in the
 *   view frame, or a turn-over.
 * @returns The sheet: `bridges`; `centres`, one per stage from 0 (flat) to
 *   the fold count; `creaseLines`; `designId`; `faces`; `folds`, in the
 *   front's terms, whose `layers` name a fold by its index in `folds`;
 *   `heightMeters`; `steps`, one per step of the design, each with
 *   `foldsBefore`, the folds done before it, `kind`, and
 *   `turnOversBefore`, the turn-overs done before it; and `widthMeters`.
 */
export const cutSheet = (design) => {
  const { id } = design;
  const frame = startFrame(design);
  const { folds, stepIndices, steps } = readSteps(design, frame);
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
  const creaseLines = [];
  const sequence = { folds, id, stepIndices };
  folds.forEach((_fold, foldIndex) => {
    const result = applyFold(faces, foldIndex, sequence);
    faces = result.faces;
    creaseLines.push(...result.creaseLines);
  });

  const layers = stackLayers(faces, folds.length);
  if (hasTJunction(faces)) {
    throw new Error(`Design "${id}" leaves a T-junction`);
  }

  return {
    bridges: findBridges(faces),
    centres: stageCentres(faces, folds, frame),
    creaseLines,
    designId: id,
    faces: faces.map(({ movedBy, placements, polygon }, i) => ({
      layers: layers[i],
      movedBy,
      placements,
      polygon,
    })),
    folds,
    heightMeters,
    steps,
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
 * - Every face the fold splits gives one crease line, typed as seen from
 *   the sheet's front.
 * - Its errors name a fold by its step's index in the design's `steps`.
 * @param faces The faces before the fold, each with `ranks`.
 * @param foldIndex The fold's index in `folds`.
 * @param sequence The design's `folds`, in the front's terms; its `id`;
 *   and `stepIndices`, each fold's index in the design's `steps`.
 * @returns The `faces` after the fold, and the `creaseLines` it makes.
 */
const applyFold = (faces, foldIndex, sequence) => {
  const { folds, id, stepIndices } = sequence;
  const fold = folds[foldIndex];
  const [px, py] = fold.from;
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const ux = (fold.to[0] - px) / length;
  const uy = (fold.to[1] - py) / length;

  // Reflecting across the line maps `v` to `p + (2uuᵀ − I)(v − p)`.
  const a = ux * ux - uy * uy;
  const b = 2 * ux * uy;
  const reflection = [a, b, b, -a, px - a * px - b * py, py - b * px + a * py];

  const creaseLines = [];
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

    // A face turned over by its placement, whose determinant is then
    // negative, shows the fold reversed.
    if (left !== null && right !== null) {
      const [from, to] = crossingSegment(face.polygon, sides);
      const isFaceDown =
        placement[0] * placement[3] - placement[1] * placement[2] < 0;
      creaseLines.push({
        from,
        to,
        type: isFaceDown ? oppositeType(fold.type) : fold.type,
      });
    }
  }

  if (moving.length === 0) {
    throw new Error(
      `Step ${stepIndices[foldIndex]} of design "${id}" moves nothing`,
    );
  }
  for (const { movedBy } of moving) {
    const earlier = movedBy.find((j) => stopsShort(folds[j]));
    if (earlier !== undefined) {
      throw new Error(
        `Step ${stepIndices[earlier]} of design "${id}" stops short, ` +
          `but step ${stepIndices[foldIndex]} moves its faces`,
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

  const nextFaces = [
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

  return { creaseLines, faces: nextFaces };
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
      piece.push(pointBetween(point, polygon[j], s, t));
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

/** #### Finds where a line crosses a convex polygon it splits
 * - Takes the corners on the line and the points where edges cross it, as
 *   clipPolygon() finds them.
 * @param polygon The polygon's corners, `[x, y]`.
 * @param sides Each corner's signed distance from the line, in metres.
 * @returns The crossing's two ends, `[x, y]`.
 */
const crossingSegment = (polygon, sides) => {
  const ends = [];
  polygon.forEach((point, i) => {
    const j = (i + 1) % polygon.length;
    const s = sides[i];
    const t = sides[j];
    if (Math.abs(s) <= TOLERANCE_METERS) ends.push(point);
    if (
      (s > TOLERANCE_METERS && t < -TOLERANCE_METERS) ||
      (s < -TOLERANCE_METERS && t > TOLERANCE_METERS)
    ) {
      ends.push(pointBetween(point, polygon[j], s, t));
    }
  });

  return ends;
};

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

/** #### Turns a point from the view frame into the folded plane's front terms
 * - Undoes, in reverse order, the moves that give the view frame: each
 *   turn-over's mirror, left to right; the roll; and the start's mirror,
 *   if the back is towards the viewer.
 * - With no roll, the arithmetic is exact, so a point seen from the front
 *   comes back as written.
 * @param frame The starting pose's view frame, from startFrame().
 * @param point The point as the viewer sees it, `[x, y]` in metres.
 * @param turnOvers The number of turn-overs done before it.
 * @returns The point in the folded plane, seen from the front, `[x, y]`
 *   in metres, frozen.
 */
const fromViewFrame = (frame, [x, y], turnOvers) => {
  const { cos, isBack, sin } = frame;
  const seenX = turnOvers % 2 === 0 ? x : -x;
  const unrolledX = seenX * cos + y * sin;
  const unrolledY = y * cos - seenX * sin;

  return Object.freeze([isBack ? -unrolledX : unrolledX, unrolledY]);
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

/** #### Returns the other fold type
 * @param type `"mountain"` or `"valley"`.
 * @returns `"valley"` for `"mountain"`, and `"mountain"` for `"valley"`.
 */
const oppositeType = (type) => (type === "valley" ? "mountain" : "valley");

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

/** #### Finds where an edge crosses a line, from its ends' distances
 * @param point The edge's start, `[x, y]`.
 * @param next The edge's end, `[x, y]`.
 * @param s The start's signed distance from the line, in metres.
 * @param t The end's signed distance from the line, in metres.
 * @returns The crossing, `[x, y]`.
 */
const pointBetween = (point, next, s, t) => {
  const k = s / (s - t);

  return [
    point[0] + k * (next[0] - point[0]),
    point[1] + k * (next[1] - point[1]),
  ];
};

/** #### Reads a design's steps into its folds, in the front's terms
 * - Checks every step before any fold runs: its `kind`, and, for a fold
 *   that selects its layers, that its `layers` name a fold.
 * - The view frame at a fold is the starting pose's, mirrored left to
 *   right by each turn-over before it. A fold's ends come back through the
 *   same moves in reverse, as fromViewFrame() sets out: the turn-overs'
 *   mirror undone, then the roll, then the start's mirror, if the back is
 *   towards the viewer.
 * - A fold is seen from the back when the start's side and the turn-overs
 *   before it, together, mirror the front an odd number of times. Its ends
 *   are then swapped, so the same side lies to its line's left, and its
 *   type is made the opposite, since towards the viewer is then away from
 *   the front.
 * - Each fold's `layers` turn from naming a step to naming a fold, by its
 *   index in `folds`.
 * @param design The design: `id` and `steps`.
 * @param frame The starting pose's view frame, from startFrame().
 * @returns `folds`, frozen, in the front's terms; `stepIndices`, each
 *   fold's index in the design's `steps`; and `steps`, frozen, one per
 *   step, each with `foldsBefore`, `kind` and `turnOversBefore`.
 */
const readSteps = (design, frame) => {
  const { id } = design;
  const foldIndices = []; // per step, its index in `folds`, if a fold
  const stepIndices = [];
  const steps = [];
  let turnOvers = 0;
  design.steps.forEach(({ kind }, stepIndex) => {
    if (kind !== "fold" && kind !== "turn-over") {
      throw new Error(
        `Step ${stepIndex} of design "${id}" has unknown kind "${kind}"`,
      );
    }

    steps.push(
      Object.freeze({
        foldsBefore: stepIndices.length,
        kind,
        turnOversBefore: turnOvers,
      }),
    );
    if (kind === "turn-over") {
      turnOvers++;
    } else {
      foldIndices[stepIndex] = stepIndices.length;
      stepIndices.push(stepIndex);
    }
  });

  const folds = stepIndices.map((stepIndex) => {
    const fold = design.steps[stepIndex];
    const layers = toFoldLayers(design, fold.layers, foldIndices, stepIndex);
    const { turnOversBefore } = steps[stepIndex];
    const from = fromViewFrame(frame, fold.from, turnOversBefore);
    const to = fromViewFrame(frame, fold.to, turnOversBefore);
    const mirrors = turnOversBefore + (frame.isBack ? 1 : 0);
    if (mirrors % 2 === 0) return Object.freeze({ ...fold, from, layers, to });

    return Object.freeze({
      ...fold,
      from: to,
      layers,
      to: from,
      type: oppositeType(fold.type),
    });
  });

  return {
    folds: Object.freeze(folds),
    stepIndices,
    steps: Object.freeze(steps),
  };
};

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
 * - The centre of the faces' bounding box as the viewer sees them in the
 *   starting pose, turned back into the folded plane, except after a fold
 *   that turns both sides or stops short of 180°, which keeps the stage
 *   before's: such a fold leaves the paper in a plane that the bounding
 *   box does not describe.
 * - A turn-over mirrors the view about its upright axis, through the
 *   origin, so it moves the box's centre exactly as it moves the paper.
 * @param faces The final faces, each with `placements`.
 * @param folds The design's folds.
 * @param frame The starting pose's view frame, from startFrame().
 * @returns Per stage, from 0 (flat) to the fold count, `[x, y]` in metres
 *   in the folded plane, as seen from the front.
 */
const stageCentres = (faces, folds, frame) => {
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
        const [x, y] = toViewFrame(frame, place(placements[stage], point));
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    const centre = [(minX + maxX) / 2, (minY + maxY) / 2];
    centres.push(fromViewFrame(frame, centre, 0));
  }

  return centres;
};

/** #### Returns the starting pose's view frame, for turning points into it
 * - A point of the folded plane, seen from the front, is mirrored left to
 *   right if the back is towards the viewer, then rolled anticlockwise, to
 *   give what the viewer sees before any turn-over.
 * - Throws, naming the design, if its start has a `side` other than
 *   `"front"` or `"back"`, or a `rollRadians` that is not a finite number.
 *   Every design is cut at load, so writeStartPose() and sharesSheet(),
 *   which read the start on the per-frame path, never meet one.
 * @param design The design, with an optional `start`, as startOf() reads
 *   it: `rollRadians` and `side`.
 * @returns The frame: the roll's `cos` and `sin`, and `isBack`, true if
 *   the back is towards the viewer.
 */
const startFrame = (design) => {
  const { rollRadians, side } = startOf(design);
  if (side !== "front" && side !== "back") {
    throw new Error(`Design "${design.id}" starts with unknown side "${side}"`);
  }
  if (!Number.isFinite(rollRadians)) {
    throw new Error(
      `Design "${design.id}" starts with a roll of ${rollRadians} radians`,
    );
  }

  return {
    cos: Math.cos(rollRadians),
    isBack: side === "back",
    sin: Math.sin(rollRadians),
  };
};

/** #### Turns a fold's layer selection from naming a step to naming a fold
 * - Throws, naming the design and both steps, if the step named is not a
 *   fold. Leaves a selection it does not know as it is, for selectsFace()
 *   to throw on.
 * @param design The design: `id` and `steps`.
 * @param layers `"all"`, `{ heldBy }` or `{ movedBy }`, a step index.
 * @param foldIndices Per step, its index in `folds`, if a fold.
 * @param stepIndex The index in `steps` of the fold that selects.
 * @returns `"all"`, or a frozen `{ heldBy }` or `{ movedBy }`, a fold
 *   index.
 */
const toFoldLayers = (design, layers, foldIndices, stepIndex) => {
  if (layers === "all") return layers;

  // Checked in the order selectsFace() reads them.
  const key =
    layers.movedBy !== undefined
      ? "movedBy"
      : layers.heldBy !== undefined
        ? "heldBy"
        : null;
  if (key === null) return layers;

  const named = layers[key];
  if (design.steps[named]?.kind !== "fold") {
    throw new Error(
      `Step ${stepIndex} of design "${design.id}" names step ${named}, ` +
        "which is not a fold",
    );
  }

  return Object.freeze({ [key]: foldIndices[named] });
};

/** #### Turns a point of the folded plane into the starting pose's view frame
 * - Mirrors it left to right if the back is towards the viewer, then rolls
 *   it, as startFrame() sets out; turn-overs are left out.
 * @param frame The starting pose's view frame, from startFrame().
 * @param point The point in the folded plane, seen from the front, `[x, y]`
 *   in metres.
 * @returns The point as the viewer sees it in the starting pose, `[x, y]`
 *   in metres.
 */
const toViewFrame = (frame, [x, y]) => {
  const { cos, isBack, sin } = frame;
  const seenX = isBack ? -x : x;

  return [seenX * cos - y * sin, seenX * sin + y * cos];
};
