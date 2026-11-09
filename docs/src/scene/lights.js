/**
 * @fileoverview
 * The scene's lights: a key light behind the viewer's right shoulder, and
 * an ambient fill.
 */

import { AmbientLight, DirectionalLight } from "three";

const AMBIENT_LIGHT_INTENSITY = 1; // fills faces turned from the key light
const DIRECTIONAL_LIGHT_INTENSITY = 2.5;
const LIGHT_COLOR = 0xffffff; // white
const LIGHT_POSITION = [0.5, 1, 1]; // metres: right, above, camera's side

/** #### Creates the ambient fill and the directional key light
 * - The directional light shines at its default target, at the origin.
 * - No shadows.
 * @returns The lights, to add to the scene.
 */
export const createLights = () => {
  const directional = new DirectionalLight(
    LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY,
  );
  directional.position.set(...LIGHT_POSITION);

  return [new AmbientLight(LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY), directional];
};
