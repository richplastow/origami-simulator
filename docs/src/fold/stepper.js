/**
 * @fileoverview
 * Moves the sequence position through a design's folds, one fold at a time,
 * towards a target.
 */

export const FOLD_SECONDS = 0.7; // one fold, folding
export const UNFOLD_SECONDS = 0.35; // one fold, unfolding: twice as fast

/** #### Advances the sequence state one frame towards the target
 * - The position moves linearly in time; the pose eases each fold.
 * - The target is read only at a whole position, so a fold in progress
 *   always finishes first. Time left over at a whole position carries on
 *   into the next fold, so the total time does not depend on the frame
 *   rate.
 * - A target `designId` of null means flat, keeping the sheet showing.
 *   Neither `designId` is read or changed: the target's `position` alone
 *   sets the direction.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param state The sequence state: `designId`; and, mutated, `direction`,
 *   1 while folding, −1 while unfolding and 0 at rest, and `position`, from
 *   0 (flat) to the design's fold count.
 * @param target The target: `designId`, or null for flat, and `position`.
 * @returns True if `position` changed.
 */
export const stepSequence = (deltaSeconds, state, target) => {
  const startPosition = state.position;

  // Timer resets with performance.now() but updates with the frame's
  // timestamp, which marks the end of the previous frame, so its delta can
  // dip below zero when a hidden tab becomes visible again.
  let remainingSeconds = Math.max(deltaSeconds, 0);

  while (true) {
    if (Number.isInteger(state.position) || state.direction === 0) {
      state.direction = Math.sign(target.position - state.position);
    }
    if (state.direction === 0 || remainingSeconds <= 0) break;

    const secondsPerFold = state.direction > 0 ? FOLD_SECONDS : UNFOLD_SECONDS;
    const nextWhole =
      state.direction > 0
        ? Math.floor(state.position) + 1
        : Math.ceil(state.position) - 1;
    const foldsLeft = Math.abs(nextWhole - state.position);
    const foldsInTime = remainingSeconds / secondsPerFold;

    if (foldsInTime < foldsLeft) {
      state.position += state.direction * foldsInTime;
      break;
    }
    state.position = nextWhole;
    remainingSeconds -= foldsLeft * secondsPerFold;
  }

  return state.position !== startPosition;
};
