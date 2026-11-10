/**
 * @fileoverview
 * Poses a cut sheet at a point in its fold sequence, with its layers held
 * apart by the paper's thickness.
 */

import { stopsShort } from "./engine.js";

// About one sheet of 80 gsm paper; tuned by eye.
export const PAPER_THICKNESS_METERS = 0.0001;

const SAMPLES_PER_FOLD = 32; // poses per fold that maxPaperRadius() measures

// Scratch for the vertex being posed, `[x, y, z]` in metres, reused so
// posing allocates nothing.
const point = new Float64Array(3);

/** #### Writes every vertex of a cut sheet, posed at a sequence position
 * - During a fold, a face the fold moves turns about the fold's line, by
 *   the fold's eased angle, towards +Z for a valley or −Z for a mountain.
 * - Each face shifts along its normal by the paper's thickness for each
 *   layer beneath it: a moved face's shift runs from its height before a
 *   fold to π to minus its height after, which lands it on top; a face the
 *   fold holds rises to its new height.
 * - A fold that stops short of π turns the faces it moves as one rigid
 *   block, about its line raised to the top of those faces for a valley,
 *   or lowered to their bottom for a mountain, so no layer swings into
 *   the faces it leaves behind. It presses nothing flat, so the faces it
 *   holds keep their height. Its faces keep that turn, and their shift
 *   before it, from then on.
 * - A fold whose `turns` is `"both-sides"` turns the whole paper back by
 *   half its angle, about its line, from then on, so the two sides share
 *   the turn.
 * - Vertices run face by face, around each face's polygon.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param positions An array of three numbers per vertex, in metres,
 *   overwritten.
 * @param sequencePosition From 0 (flat) to the fold count: whole folds
 *   done, plus the linear progress through the next.
 * @param sheet The sheet that cutSheet() returns.
 */
export const writePaperPositions = (positions, sequencePosition, sheet) => {
  const { faces, folds } = sheet;
  const foldIndex = Math.max(
    0,
    Math.min(Math.floor(sequencePosition), folds.length - 1),
  );
  const fold = folds[foldIndex];
  const progress = smoothstep(sequencePosition - foldIndex);
  const isFlatFold = !stopsShort(fold);
  const foldPivotLayers = isFlatFold ? 0 : pivotLayers(faces, fold, foldIndex);

  let vertex = 0;
  for (let f = 0; f < faces.length; f++) {
    const { layers, movedBy, placements, polygon } = faces[f];

    // A face that a fold which stops short moved, earlier, stays where
    // that fold put it.
    let restingFoldIndex = -1;
    for (let m = 0; m < movedBy.length; m++) {
      const j = movedBy[m];
      if (j < foldIndex && stopsShort(folds[j])) restingFoldIndex = j;
    }

    let pivot = 0; // the turn's line, in layers above the back
    let stage = foldIndex;
    let shiftLayers;
    let turnFold = fold;
    let turnRadians = 0;
    if (restingFoldIndex !== -1) {
      stage = restingFoldIndex;
      shiftLayers = layers[stage] - 1;
      turnFold = folds[stage];
      turnRadians = turnSign(turnFold) * turnFold.targetRadians;
      pivot = pivotLayers(faces, turnFold, stage);
    } else if (movedBy.includes(foldIndex)) {
      const before = layers[foldIndex] - 1;
      shiftLayers = isFlatFold
        ? lerp(before, 1 - layers[foldIndex + 1], progress)
        : before;
      turnRadians = turnSign(fold) * progress * fold.targetRadians;
      pivot = foldPivotLayers;
    } else {
      // A fold that stops short presses nothing flat, so lifts nothing.
      shiftLayers = isFlatFold
        ? lerp(layers[foldIndex] - 1, layers[foldIndex + 1] - 1, progress)
        : layers[foldIndex] - 1;
    }

    // Read by index: array destructuring would run an iterator.
    const placement = placements[stage];
    const a = placement[0];
    const b = placement[1];
    const c = placement[2];
    const d = placement[3];
    const tx = placement[4];
    const ty = placement[5];
    for (let i = 0; i < polygon.length; i++, vertex++) {
      const x = polygon[i][0];
      const y = polygon[i][1];
      point[0] = a * x + c * y + tx;
      point[1] = b * x + d * y + ty;
      point[2] = PAPER_THICKNESS_METERS * shiftLayers;
      if (turnRadians !== 0) {
        rotateAboutLine(turnRadians, turnFold, PAPER_THICKNESS_METERS * pivot);
      }

      // Folds that turn both sides turn the whole paper back by half.
      for (let j = 0; j <= foldIndex; j++) {
        if (folds[j].turns !== "both-sides") continue;
        const foldRadians =
          j < foldIndex
            ? folds[j].targetRadians
            : progress * folds[j].targetRadians;
        rotateAboutLine((-turnSign(folds[j]) * foldRadians) / 2, folds[j], 0);
      }

      positions[3 * vertex] = point[0];
      positions[3 * vertex + 1] = point[1];
      positions[3 * vertex + 2] = point[2];
    }
  }
};

/** #### Returns the largest distance any vertex reaches from the origin
 * - Samples every fold of the sequence, from flat to finished, so a
 *   sphere of this radius at the origin holds the paper throughout.
 * - Allocates, so call it once, at load.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The radius, in metres.
 */
export const maxPaperRadius = (sheet) => {
  const vertexCount = sheet.faces.reduce(
    (count, { polygon }) => count + polygon.length,
    0,
  );
  const positions = new Float64Array(3 * vertexCount);
  const sampleCount = SAMPLES_PER_FOLD * sheet.folds.length;

  let radiusMeters = 0;
  for (let sample = 0; sample <= sampleCount; sample++) {
    writePaperPositions(positions, sample / SAMPLES_PER_FOLD, sheet);
    for (let i = 0; i < positions.length; i += 3) {
      radiusMeters = Math.max(
        radiusMeters,
        Math.hypot(positions[i], positions[i + 1], positions[i + 2]),
      );
    }
  }

  return radiusMeters;
};

/** #### Returns the value a fraction of the way from one value to another
 * @param from The value at fraction 0.
 * @param to The value at fraction 1.
 * @param fraction From 0 to 1.
 * @returns The value between.
 */
const lerp = (from, to, fraction) => from + (to - from) * fraction;

/** #### Turns the scratch point about a fold's line, at a height above z = 0
 * - Rodrigues' rotation formula, right-handed about the line's `from` to
 *   `to` direction, so a positive angle turns the line's left side
 *   towards +Z.
 * @param angleRadians The angle to turn by, in radians.
 * @param fold The fold whose line to turn about.
 * @param heightMeters The line's height along Z, in metres.
 */
const rotateAboutLine = (angleRadians, fold, heightMeters) => {
  const px = fold.from[0];
  const py = fold.from[1];
  const length = Math.hypot(fold.to[0] - px, fold.to[1] - py);
  const ux = (fold.to[0] - px) / length;
  const uy = (fold.to[1] - py) / length;
  const vx = point[0] - px;
  const vy = point[1] - py;
  const vz = point[2] - heightMeters;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const along = (ux * vx + uy * vy) * (1 - cos); // `(u · v)(1 − cos)`

  point[0] = px + vx * cos + uy * vz * sin + ux * along;
  point[1] = py + vy * cos - ux * vz * sin + uy * along;
  point[2] = heightMeters + vz * cos + (ux * vy - uy * vx) * sin;
};

/** #### Returns the height a fold that stops short turns its faces about
 * - The highest of the faces the fold moves, at the stage before it, for a
 *   valley, or the lowest for a mountain, so the moving faces turn as one
 *   block and no layer swings into the faces the fold holds.
 * - Allocates nothing, so it is safe on the per-frame path.
 * @param faces The sheet's faces.
 * @param fold The fold.
 * @param foldIndex The fold's index in the sheet's `folds`.
 * @returns The height, in layers above the back of the stack.
 */
const pivotLayers = (faces, fold, foldIndex) => {
  const isValley = fold.type === "valley";
  let pivot = isValley ? -Infinity : Infinity;
  for (let f = 0; f < faces.length; f++) {
    if (!faces[f].movedBy.includes(foldIndex)) continue;
    const below = faces[f].layers[foldIndex] - 1;
    pivot = isValley ? Math.max(pivot, below) : Math.min(pivot, below);
  }

  return pivot;
};

/** #### Eases a linear progress, slow at both ends and fastest midway
 * - The curve of r187's MathUtils.smoothstep(), `p² × (3 − 2p)`, written
 *   here so that Node can run this module without Three.js.
 * @param progress The linear progress, clamped to 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
const smoothstep = (progress) => {
  const p = Math.min(Math.max(progress, 0), 1);
  return p * p * (3 - 2 * p);
};

/** #### Returns the direction a fold turns its moving side
 * @param fold The fold.
 * @returns 1 for a valley, towards +Z, or −1 for a mountain.
 */
const turnSign = (fold) => (fold.type === "valley" ? 1 : -1);
