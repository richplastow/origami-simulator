/**
 * @fileoverview
 * Entry point: draws a slowly rotating triangle on a transparent canvas.
 */

import { PerspectiveCamera, Scene, Timer, WebGLRenderer } from "three";
import { distanceToFitCircle } from "./camera/fit.js";
import { createTriangle, TRIANGLE_RADIUS_METERS } from "./scene/triangle.js";

const CAMERA_FAR_METERS = 100;
const CAMERA_FOV_DEGREES = 50; // vertical; PerspectiveCamera takes degrees
const CAMERA_NEAR_METERS = 0.1;
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const MAX_PIXEL_RATIO = 2; // caps GPU cost on high-density screens
const ROTATION_RADIANS_PER_SECOND = 0.4;

const canvas = document.querySelector(".scene");

// An `alpha` canvas clears to transparent, so the page shows through.
const renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas });
const scene = new Scene();
const camera = new PerspectiveCamera(
  CAMERA_FOV_DEGREES,
  1, // replaced by the canvas's aspect before the first frame
  CAMERA_NEAR_METERS,
  CAMERA_FAR_METERS,
);
const timer = new Timer();
const triangle = createTriangle();

scene.add(triangle);

/** #### Matches the camera and drawing buffer to the canvas's CSS size
 * @param width The canvas's width, in CSS pixels.
 * @param height The canvas's height, in CSS pixels.
 */
const resize = (width, height) => {
  if (width === 0 || height === 0) return; // hidden, nothing to fit

  camera.aspect = width / height;
  camera.position.z = distanceToFitCircle(
    camera.aspect,
    camera.fov,
    TRIANGLE_RADIUS_METERS,
  );
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  // CSS sizes the canvas, so Three.js must not set its style.
  renderer.setSize(width, height, false);
};

/** #### Copies the triangle's colour from the canvas's CSS `color`
 * - main.css sets that colour with `light-dark()`, which the browser
 *   resolves to an `rgb()` value for the current colour scheme.
 */
const syncTriangleColor = () => {
  triangle.material.color.setStyle(getComputedStyle(canvas).color);
};

resize(canvas.clientWidth, canvas.clientHeight);
new ResizeObserver(([entry]) => {
  resize(entry.contentRect.width, entry.contentRect.height);
}).observe(canvas);

syncTriangleColor();
window
  .matchMedia(DARK_SCHEME_QUERY)
  .addEventListener("change", syncTriangleColor);

// Avoid a large jump in rotation when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  triangle.rotation.z += ROTATION_RADIANS_PER_SECOND * timer.getDelta();
  renderer.render(scene, camera);
});
