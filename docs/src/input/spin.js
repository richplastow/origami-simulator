/**
 * @fileoverview
 * The paper's turntable spin: how far a drag turns it, and where the tilt
 * stops.
 */

// A drag of 393 CSS pixels, about a phone's width, turns half a turn.
export const SPIN_RADIANS_PER_PIXEL = 0.008;

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
