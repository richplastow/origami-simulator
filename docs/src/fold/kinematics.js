/** #### Writes the paper's point positions for a symmetric rigid fold
 * - The crease stays put and each side turns by half the fold angle about
 *   the crease's `from` to `to` axis, so a valley (positive angle) brings
 *   both sides towards +Z and a mountain (negative) takes them towards -Z.
 * - Every crease passes through the centre, so every point keeps its
 *   distance from the centre.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Throws if `creaseId` names no crease in the pattern.
 * - Pure maths, with no DOM or GPU access.
 * @param foldState The fold: `angleRadians`, and `creaseId`, null when flat.
 * @param pattern The crease pattern that createCreasePattern() returns.
 * @param positions A Float32Array of three numbers per point, in metres,
 *   overwritten.
 */
export const writeFoldedPositions = (foldState, pattern, positions) => {
  const { points } = pattern;
  const { angleRadians, creaseId } = foldState;

  if (creaseId === null || angleRadians === 0) {
    for (let i = 0; i < points.length; i++) {
      positions[3 * i] = points[i][0];
      positions[3 * i + 1] = points[i][1];
      positions[3 * i + 2] = 0;
    }
    return;
  }

  // Search with a loop, since a find() callback would be a new closure on
  // every call.
  let crease;
  for (let i = 0; i < pattern.creases.length; i++) {
    if (pattern.creases[i].id === creaseId) crease = pattern.creases[i];
  }
  if (crease === undefined) {
    throw new Error(`Unknown crease id: "${creaseId}"`);
  }

  // The unit axis `k` lies in the paper's plane, so for a point `v` in that
  // plane, `k × v` has only a Z component. Rodrigues' rotation formula then
  // reduces to the terms below.
  const from = points[crease.from];
  const to = points[crease.to];
  const axisLength = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const kx = (to[0] - from[0]) / axisLength;
  const ky = (to[1] - from[1]) / axisLength;

  for (let i = 0; i < points.length; i++) {
    const x = points[i][0];
    const y = points[i][1];
    const crossZ = kx * y - ky * x; // Z of `k × v`; 0 on the crease
    const dot = kx * x + ky * y; // `k · v`
    const turnRadians = (Math.sign(crossZ) * angleRadians) / 2;
    const cos = Math.cos(turnRadians);
    const sin = Math.sin(turnRadians);

    positions[3 * i] = x * cos + kx * dot * (1 - cos);
    positions[3 * i + 1] = y * cos + ky * dot * (1 - cos);
    positions[3 * i + 2] = crossZ * sin;
  }
};
