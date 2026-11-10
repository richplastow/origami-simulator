/**
 * @fileoverview
 * The colours the paper's front can take, and the pure maths of the fade
 * from one to another.
 */

// Each colour's assigned id, which a swatch's `value` names, mapped to its
// colour as a hex number, in sRGB. Against the black fold lines, every one
// keeps WCAG's non-text contrast of at least 3:1, from 4.48 (red) to 11.51
// (yellow). As the back's fold lines, against its off-white,
// `PAPER_BACK_COLOR` in scene/paper.js, they measure lower, and are kept as
// they are: red 4.16:1, blue 3.04:1, pink 2.52:1, green 2.47:1 and yellow
// 1.62:1.
export const PAPER_COLORS = Object.freeze({
  red: 0xd9342b, // origami red, 4.48:1
  yellow: 0xf2b632, // 11.51:1
  green: 0x4fae5a, // 7.53:1
  blue: 0x3d8fd9, // 6.13:1
  pink: 0xe8739f, // 7.38:1
});

// The front's fade from one colour to another, as long as the fold lines'
// fade-out, `FADE_OUT_SECONDS` in fold/stepper.js.
export const PAPER_COLOR_FADE_SECONDS = 0.3;

/** #### Advances a colour fade one frame towards its end
 * - `progress` moves linearly in time, from 0 to 1 over
 *   `PAPER_COLOR_FADE_SECONDS`; the renderer eases it.
 * - Returns true on the step that reaches 1, so the last colour is written
 *   exactly, and false once there is nothing left to change.
 * - A negative delta counts as zero.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param deltaSeconds The time elapsed since the last frame, in seconds.
 * @param fade The fade's state, mutated: `progress`, from 0 (the start
 *   colour) to 1 (the end colour), linear in time.
 * @returns True if `progress` changed.
 */
export const stepColorFade = (deltaSeconds, fade) => {
  if (fade.progress >= 1) return false;

  const startProgress = fade.progress;
  fade.progress = Math.min(
    fade.progress + Math.max(deltaSeconds, 0) / PAPER_COLOR_FADE_SECONDS,
    1,
  );

  return fade.progress !== startProgress;
};
