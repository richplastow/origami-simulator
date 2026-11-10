/** #### Eases a linear progress, slow at both ends and fastest midway
 * - The curve of r187's MathUtils.smoothstep(), `p² × (3 − 2p)`, written
 *   here so that Node can run the fold modules without Three.js.
 * - Returns exactly 0 and 1 at the ends.
 * - Pure maths, with no DOM or GPU access.
 * @param progress The linear progress, clamped to 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
export const smoothstep = (progress) => {
  const p = Math.min(Math.max(progress, 0), 1);
  return p * p * (3 - 2 * p);
};
