/**
 * @fileoverview
 * Entry point: draws a lit square sheet of paper on a transparent canvas,
 * and folds it into the paper dart, or back to flat, as the buttons choose.
 */

import {
  MathUtils,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { distanceToFitSphere } from "./camera/fit.js";
import { PAPER_DART } from "./designs/paper-dart.js";
import { cutSheet } from "./fold/engine.js";
import { maxPaperRadius } from "./fold/pose.js";
import { stepSequence } from "./fold/stepper.js";
import { createLights } from "./scene/lights.js";
import { createPaper } from "./scene/paper.js";
import { connectFoldButtons } from "./ui/fold-buttons.js";

// Raised above the horizontal XZ plane, turned from +Z towards +Y.
const CAMERA_ELEVATION_RADIANS = MathUtils.degToRad(20);
const CAMERA_FAR_METERS = 10;
const CAMERA_FOV_DEGREES = 30; // vertical; PerspectiveCamera takes degrees
const CAMERA_NEAR_METERS = 0.01;
const FRAME_MARGIN = 1.1; // leaves room around the paper for the buttons
const MAX_PIXEL_RATIO = 2; // caps GPU cost on high-density screens

const canvas = document.querySelector(".scene");
const sheet = cutSheet(PAPER_DART);

// The sphere that holds the paper over its whole fold sequence, so the
// camera never moves while the paper folds.
const paperRadiusMeters = maxPaperRadius(sheet);

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
const paper = createPaper(paperRadiusMeters, sheet);

// The paper starts flat, and stays there until a button sets a target.
const sequenceState = { designId: PAPER_DART.id, direction: 0, position: 0 };
const sequenceTarget = { designId: null, position: 0 };

scene.add(paper.group, ...createLights());

/** #### Matches the camera and drawing buffer to the canvas's CSS size
 * - The camera keeps its elevation and moves along its line of sight, so
 *   the paper's bounding sphere fills the view's smaller dimension.
 * @param width The canvas's width, in CSS pixels.
 * @param height The canvas's height, in CSS pixels.
 */
const resize = (width, height) => {
  if (width === 0 || height === 0) return; // hidden, nothing to fit

  camera.aspect = width / height;
  const distanceMeters =
    FRAME_MARGIN *
    distanceToFitSphere(camera.aspect, camera.fov, paperRadiusMeters);
  camera.position.set(
    0,
    distanceMeters * Math.sin(CAMERA_ELEVATION_RADIANS),
    distanceMeters * Math.cos(CAMERA_ELEVATION_RADIANS),
  );
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  // CSS sizes the canvas, so Three.js must not set its style.
  renderer.setSize(width, height, false);
};

resize(canvas.clientWidth, canvas.clientHeight);
new ResizeObserver(([entry]) => {
  resize(entry.contentRect.width, entry.contentRect.height);
}).observe(canvas);

// A press mid-fold changes only the target, which the stepper reads once
// the fold in progress finishes.
connectFoldButtons((target) => Object.assign(sequenceTarget, target));

// Avoid a large jump in the fold when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  if (stepSequence(timer.getDelta(), sequenceState, sequenceTarget)) {
    paper.setSequencePosition(sequenceState.position);
  }
  renderer.render(scene, camera);
});
