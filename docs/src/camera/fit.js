/** #### Returns the camera distance at which a sphere fills the view
 * - The sphere fills the view's smaller dimension, width or height.
 * - The sphere is centred on the camera's line of sight, so anything inside
 *   it stays in view however it moves within the sphere, towards the camera
 *   included.
 * - Pure maths, with no DOM or GPU access.
 * @param aspect The view's width divided by its height.
 * @param fovDegrees The camera's vertical field of view, in degrees.
 * @param radius The sphere's radius, in metres.
 * @returns The distance from the camera to the sphere's centre, in metres.
 */
export const distanceToFitSphere = (aspect, fovDegrees, radius) => {
  const verticalHalfRadians = (fovDegrees * Math.PI) / 360;
  const horizontalHalfRadians = Math.atan(
    Math.tan(verticalHalfRadians) * aspect,
  );

  // The view's edge is tangent to the sphere at that half-angle.
  return (
    radius / Math.sin(Math.min(verticalHalfRadians, horizontalHalfRadians))
  );
};
