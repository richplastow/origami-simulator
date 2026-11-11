/**
 * @fileoverview
 * The paper's turntable spin: how far a drag turns it, where the tilt
 * stops, and the ease back to the view the page loads with.
 */

import { smoothstep } from "../fold/easing.js";

const FULL_TURN_RADIANS = 2 * Math.PI;

// A drag of 393 CSS pixels, about a phone's width, turns half a turn.
export const SPIN_RADIANS_PER_PIXEL = 0.008;

// The ease back to pitch and yaw 0, fast enough not to keep the viewer
// waiting, in seconds.
export const SPIN_RESET_SECONDS = 0.3;

/** #### Starts easing a spin back to pitch and yaw 0, the view at load
 * - Records where the reset starts: the pitch as it is, and the yaw's
 *   nearest equivalent within ±π, since a drag never wraps it, so the way
 *   back is never more than half a turn. The spin itself is not changed:
 *   the first stepSpinReset() moves it from the equivalent.
 * - Restarts a reset under way from where the spin is.
 * - Pure maths: writes `reset` in place and allocates nothing.
 * @param reset The reset's state, mutated: `fromPitchRadians` and
 *   `fromYawRadians`, in radians, and `progress`, set to 0.
 * @param spin The spin, as `pitchRadians` and `yawRadians`.
 */
export const startSpinReset = (reset, spin) => {
  reset.fromPitchRadians = spin.pitchRadians;
  reset.fromYawRadians =
    spin.yawRadians -
    FULL_TURN_RADIANS * Math.round(spin.yawRadians / FULL_TURN_RADIANS);
  reset.progress = 0;
};

/** #### Advances a spin's reset one frame, easing the spin towards 0
 * - `progress` moves linearly in time, from 0 to 1 over
 *   `SPIN_RESET_SECONDS`; the pitch and yaw ease from where the reset
 *   started to 0 by smoothstep(), and are exactly 0 at 1.
 * - Returns true on the step that reaches 1, so the spin ends on exactly
 *   0, and false once there is nothing left to change, as stepColorFade()
 *   does. Set `progress` to 1 to cancel a reset where it is.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param reset The reset's state, mutated: `fromPitchRadians` and
 *   `fromYawRadians`, in radians, and `progress`, from 0 to 1, linear in
 *   time.
 * @param spin The spin to write, mutated: `pitchRadians` and
 *   `yawRadians`.
 * @returns True if the spin changed.
 */
export const stepSpinReset = (deltaSeconds, reset, spin) => {
  if (reset.progress >= 1) return false;

  const startProgress = reset.progress;
  reset.progress = Math.min(
    reset.progress + Math.max(deltaSeconds, 0) / SPIN_RESET_SECONDS,
    1,
  );

  // Mixed as `from × (1 − p)`, which gives exactly 0 at p = 1.
  const remaining = 1 - smoothstep(reset.progress);
  spin.pitchRadians = reset.fromPitchRadians * remaining;
  spin.yawRadians = reset.fromYawRadians * remaining;

  return reset.progress !== startProgress;
};

/** #### Turns a spin by a drag, clamping its pitch to the tilt limits
 * - A drag right adds to the yaw, and a drag down adds to the pitch, so
 *   the paper's near surface follows the pointer.
 * - Clamps the stored pitch, not only the picture, so a drag back from
 *   beyond a limit tilts at once.
 * - Leaves the yaw unlimited and unwrapped: every angle is a valid turn.
 * - Pure maths: writes `spin` in place and allocates nothing.
 * @param deltaXPixels The drag's change to the right, in CSS pixels.
 * @param deltaYPixels The drag's change downwards, in CSS pixels.
 * @param maxPitchRadians The highest pitch, in radians.
 * @param minPitchRadians The lowest pitch, in radians.
 * @param spin The spin to turn, as `pitchRadians` and `yawRadians`.
 */
export const turnSpin = (
  deltaXPixels,
  deltaYPixels,
  maxPitchRadians,
  minPitchRadians,
  spin,
) => {
  spin.pitchRadians = Math.min(
    maxPitchRadians,
    Math.max(
      minPitchRadians,
      spin.pitchRadians + deltaYPixels * SPIN_RADIANS_PER_PIXEL,
    ),
  );
  spin.yawRadians += deltaXPixels * SPIN_RADIANS_PER_PIXEL;
};
