/**
 * @fileoverview
 * Entry point: draws a lit square sheet of paper on a transparent canvas,
 * and folds it towards the fold that the buttons choose.
 */

import {
  MathUtils,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { distanceToFitSphere } from "./camera/fit.js";
import { stepFold } from "./fold/animation.js";
import {
  createCreasePattern,
  PAPER_SIZE_METERS,
} from "./paper/crease-pattern.js";
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
const pattern = createCreasePattern(PAPER_SIZE_METERS);

// Every crease passes through the centre, so folding never moves the paper
// outside the sphere that holds it flat.
const paperRadiusMeters = pattern.sizeMeters * Math.SQRT1_2;

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
const paper = createPaper(pattern);

// The paper starts flat, and stays there until a button sets a target.
const foldState = { angleRadians: 0, creaseId: null };
const foldTarget = { angleRadians: 0, creaseId: null };

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

// A press mid-fold changes only the target, so the motion carries on from
// the current angle.
connectFoldButtons((target) => Object.assign(foldTarget, target));

// Avoid a large jump in the fold when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  if (stepFold(timer.getDelta(), foldState, foldTarget)) {
    paper.setFold(foldState);
  }
  renderer.render(scene, camera);
});
