/**
 * @fileoverview
 * The scene's lights: a key light behind the viewer's right shoulder, which
 * casts the paper's shadows on itself, and an ambient fill.
 */

import { AmbientLight, DirectionalLight } from "three";

const AMBIENT_LIGHT_INTENSITY = 1; // fills faces turned from the key light
const DIRECTIONAL_LIGHT_INTENSITY = 2.5;
const LIGHT_COLOR = 0xffffff; // white
const LIGHT_POSITION = [0.5, 1, 1]; // metres: right, above, camera's side

// The depth beneath a caster, measured along the light, within which nothing
// is shadowed. It exceeds the depth along the light of the thickest stack of
// layers lying flat, the folded dart's 8 layers, 0.7 mm, so folded paper at
// rest casts no shadow on itself; a flap casts none until lifted this far.
const SHADOW_BIAS_METERS = 0.002;
const SHADOW_MAP_SIZE_PX = 2048; // per side; a texel is about 0.11 mm of paper

/** #### Creates the ambient fill and the directional key light
 * - The directional light shines at its default target, at the origin.
 * - The directional light casts shadows. Its orthographic shadow camera is
 *   fitted once to the sphere that holds the paper: the light, its target
 *   and the sphere never move, so it is never refitted.
 * - The shadow's bias is SHADOW_BIAS_METERS as a share of the shadow
 *   camera's depth range, since Three.js adds it to a depth from 0 at
 *   `near` to 1 at `far`, spread evenly by an orthographic camera.
 * @param radiusMeters The radius of the sphere at the origin that holds the
 *   paper over every design's fold sequence, in metres.
 * @returns The lights, to add to the scene.
 */
export const createLights = (radiusMeters) => {
  const directional = new DirectionalLight(
    LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY,
  );
  directional.position.set(...LIGHT_POSITION);
  directional.castShadow = true;

  // The shadow camera sits at the light and looks at its target, at the
  // origin, so the sphere lies this far along its line of sight.
  const distanceMeters = Math.hypot(...LIGHT_POSITION);
  const shadowCamera = directional.shadow.camera;
  shadowCamera.left = -radiusMeters;
  shadowCamera.right = radiusMeters;
  shadowCamera.top = radiusMeters;
  shadowCamera.bottom = -radiusMeters;
  shadowCamera.near = distanceMeters - radiusMeters;
  shadowCamera.far = distanceMeters + radiusMeters;
  shadowCamera.updateProjectionMatrix();

  directional.shadow.mapSize.set(SHADOW_MAP_SIZE_PX, SHADOW_MAP_SIZE_PX);
  const depthRangeMeters = shadowCamera.far - shadowCamera.near;
  directional.shadow.bias = -SHADOW_BIAS_METERS / depthRangeMeters;

  return [new AmbientLight(LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY), directional];
};
