/** #### Returns the camera distance at which a circle fills the view
 * - The circle fills the view's smaller dimension, width or height.
 * - The circle is centred on the camera's line of sight and faces it, so
 *   anything inside the circle stays in view however it rotates in its plane.
 * - Pure maths, with no DOM or GPU access.
 * @param aspect The view's width divided by its height.
 * @param fovDegrees The camera's vertical field of view, in degrees.
 * @param radius The circle's radius, in metres.
 * @returns The distance from the camera to the circle's centre, in metres.
 */
export const distanceToFitCircle = (aspect, fovDegrees, radius) => {
  const halfFovTangent = Math.tan((fovDegrees * Math.PI) / 360);

  // In a portrait view the width is the smaller dimension, and it is the
  // height scaled by `aspect`.
  return radius / (halfFovTangent * Math.min(aspect, 1));
};
