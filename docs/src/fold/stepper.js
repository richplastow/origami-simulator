/**
 * @fileoverview
 * Moves the sequence position through a design's folds, one fold at a time,
 * towards a target, by way of the flat sheet stretching when the target
 * names another design.
 */

export const FOLD_SECONDS = 0.7; // one fold, folding
export const STRETCH_SECONDS = 0.4; // the flat sheet, from one shape to another
export const UNFOLD_SECONDS = 0.35; // one fold, unfolding: twice as fast

/** #### Advances the sequence state one frame towards the target
 * - The position moves linearly in time; the pose eases each fold.
 * - The target is read only at a whole position with no stretch under way,
 *   so a fold or stretch in progress always finishes first. Time left over
 *   carries on into the next fold or stretch, so the total time does not
 *   depend on the frame rate.
 * - While the target names another design, the paper unfolds towards 0,
 *   whatever the target's `position`. At 0, the target's design takes
 *   over: `stretchFromId` takes the old `designId`, and `stretchProgress`
 *   runs from 0 to 1 in `STRETCH_SECONDS`, or is 1 at once when the two
 *   designs' aspects match. Folding starts once it reaches 1.
 * - A target `designId` of null means flat, keeping the sheet showing.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param designs The designs, keyed by `id`, each with its `aspect`.
 * @param state The sequence state, mutated: `designId`; `direction`, 1
 *   while folding, −1 while unfolding and 0 at rest or stretching;
 *   `position`, from 0 (flat) to the design's fold count; `stretchFromId`,
 *   the design whose sheet the stretch started from; and `stretchProgress`,
 *   from 0 to 1, linear in time.
 * @param target The target: `designId`, or null for flat, and `position`.
 * @returns True if `position`, `designId` or `stretchProgress` changed.
 */
export const stepSequence = (deltaSeconds, designs, state, target) => {
  const startDesignId = state.designId;
  const startPosition = state.position;
  const startStretchProgress = state.stretchProgress;

  // Timer resets with performance.now() but updates with the frame's
  // timestamp, which marks the end of the previous frame, so its delta can
  // dip below zero when a hidden tab becomes visible again.
  let remainingSeconds = Math.max(deltaSeconds, 0);

  while (true) {
    // The flat sheet finishes stretching before anything else happens.
    if (state.stretchProgress < 1) {
      if (remainingSeconds <= 0) break;
      const stretchSecondsLeft = (1 - state.stretchProgress) * STRETCH_SECONDS;
      if (remainingSeconds < stretchSecondsLeft) {
        state.stretchProgress += remainingSeconds / STRETCH_SECONDS;
        break;
      }
      state.stretchProgress = 1;
      remainingSeconds -= stretchSecondsLeft;
    }

    if (Number.isInteger(state.position) || state.direction === 0) {
      const isSwitching =
        target.designId !== null && target.designId !== state.designId;
      if (isSwitching && state.position === 0) {
        state.stretchFromId = state.designId;
        state.designId = target.designId;
        state.direction = 0;
        state.stretchProgress =
          designs[state.stretchFromId].aspect === designs[state.designId].aspect
            ? 1
            : 0;
        continue;
      }
      const targetPosition = isSwitching ? 0 : target.position;
      state.direction = Math.sign(targetPosition - state.position);
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

  return (
    state.position !== startPosition ||
    state.designId !== startDesignId ||
    state.stretchProgress !== startStretchProgress
  );
};
