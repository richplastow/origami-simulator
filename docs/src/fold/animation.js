/**
 * @fileoverview
 * Moves the fold state towards a target fold at a constant speed.
 */

export const FOLD_DURATION_SECONDS = 1; // one full fold, flat to fully folded

// 178°, not 180°, so the two halves never lie in one plane and flicker.
export const MAX_FOLD_RADIANS = 3.106686;

const FOLD_RADIANS_PER_SECOND = MAX_FOLD_RADIANS / FOLD_DURATION_SECONDS;

/** #### Advances the fold state one frame towards the target fold
 * - The angle moves at a constant speed, scaled by the frame's elapsed time.
 * - When the target names a different crease, the paper unfolds to flat
 *   first, then takes the target's crease; time left over in that frame is
 *   dropped. A sheet already flat takes the target's crease at once and
 *   folds for the whole step.
 * - A negative delta counts as zero, so the fold never moves away from its
 *   goal or past it.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param state The fold state, `angleRadians` and `creaseId`, mutated.
 * @param target The target fold, in the same shape as `state`.
 * @returns True if `state` changed, so positions need rewriting.
 */
export const stepFold = (deltaSeconds, state, target) => {
  const startAngleRadians = state.angleRadians;
  const startCreaseId = state.creaseId;

  if (state.angleRadians === 0) state.creaseId = target.creaseId;

  const goalRadians =
    state.creaseId === target.creaseId ? target.angleRadians : 0;
  const remainingRadians = goalRadians - state.angleRadians;

  // Timer resets with performance.now() but updates with the frame's
  // timestamp, which marks the end of the previous frame, so its delta can
  // dip below zero when a hidden tab becomes visible again.
  const stepRadians = FOLD_RADIANS_PER_SECOND * Math.max(deltaSeconds, 0);

  if (Math.abs(remainingRadians) <= stepRadians) {
    state.angleRadians = goalRadians;
    if (goalRadians === 0) state.creaseId = target.creaseId;
  } else {
    state.angleRadians += Math.sign(remainingRadians) * stepRadians;
  }

  return (
    state.angleRadians !== startAngleRadians ||
    state.creaseId !== startCreaseId
  );
};
