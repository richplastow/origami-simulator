/**
 * @fileoverview
 * Entry point: draws a lit sheet of paper, which shadows itself, on a
 * transparent canvas, and folds it into the design a button chooses, turning
 * it over where the design says, or back to flat, stretching the flat sheet
 * from one design's shape to the next's between them while turning it to
 * the next's starting pose, with each design's fold lines printed on it
 * while the "Fold lines" checkbox is ticked, fades its front to the colour
 * the swatches choose, and turns it like a turntable as a drag on the
 * canvas moves.
 */

import {
  MathUtils,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { distanceToFitSphere } from "./camera/fit.js";
import { DESIGNS } from "./designs/list.js";
import { writeStartPose, writeStretchScale } from "./designs/sheet.js";
import { cutSheet } from "./fold/engine.js";
import { maxPaperRadius } from "./fold/pose.js";
import { stepSequence } from "./fold/stepper.js";
import { connectDrag } from "./input/drag.js";
import { turnSpin } from "./input/spin.js";
import { createLights } from "./scene/lights.js";
import { PAPER_COLORS, stepColorFade } from "./scene/paper-colors.js";
import { createPaper } from "./scene/paper.js";
import { connectColorSwatches } from "./ui/color-swatches.js";
import { connectFoldButtons } from "./ui/fold-buttons.js";
import { connectFoldLinesToggle } from "./ui/fold-lines-toggle.js";

// Raised above the horizontal XZ plane, turned from +Z towards +Y.
const CAMERA_ELEVATION_RADIANS = MathUtils.degToRad(20);
const CAMERA_FAR_METERS = 10;
const CAMERA_FOV_DEGREES = 30; // vertical; PerspectiveCamera takes degrees
const CAMERA_NEAR_METERS = 0.01;
const FRAME_MARGIN = 1.1; // leaves room around the paper for the buttons

// The tilt stops where the view looks straight down or straight up the
// paper's vertical axis. Past either limit, a drag right would carry the
// paper's near surface left.
const MAX_PITCH_RADIANS = Math.PI / 2 - CAMERA_ELEVATION_RADIANS;
const MAX_PIXEL_RATIO = 2; // caps GPU cost on high-density screens
const MIN_PITCH_RADIANS = -(Math.PI / 2 + CAMERA_ELEVATION_RADIANS);

const canvas = document.querySelector(".scene");

// Every design, and its sheet cut once at load, keyed by the design's `id`.
const designs = Object.fromEntries(
  DESIGNS.map((design) => [design.id, design]),
);
const sheets = Object.fromEntries(
  DESIGNS.map((design) => [design.id, cutSheet(design)]),
);
const [firstDesign] = DESIGNS;

// The sphere that holds the paper over every design's whole fold sequence,
// so the camera never moves while the paper folds or switches designs.
const paperRadiusMeters = Math.max(
  ...Object.values(sheets).map((sheet) => maxPaperRadius(sheet)),
);

// An `alpha` canvas clears to transparent, so the page shows through.
const renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas });

// The paper shadows itself, and only itself: the scene holds nothing else.
renderer.shadowMap.enabled = true;

const scene = new Scene();
const camera = new PerspectiveCamera(
  CAMERA_FOV_DEGREES,
  1, // replaced by the canvas's aspect before the first frame
  CAMERA_NEAR_METERS,
  CAMERA_FAR_METERS,
);
const timer = new Timer();

// The paper starts as the first design's flat sheet, done stretching, with
// no fold lines showing, and stays there until a button sets a target.
const sequenceState = {
  designId: firstDesign.id,
  direction: 0,
  linesFade: 0,
  linesVisibility: 0,
  position: 0,
  stretchFromId: firstDesign.id,
  stretchProgress: 1,
};
const sequenceTarget = { designId: null, linesOn: true, position: 0 };

// The front's colour fade, done at load: the paper takes the checked
// swatch's colour from its first frame. A new choice starts at once,
// whatever the fold sequence is doing, from the colour then showing. The
// swatches connect first, since a browser may restore a radio's state on
// reload; their `change` events fire only after this module has run, so
// `paper` exists by then.
const colorFade = { progress: 1 };
const frontColorId = connectColorSwatches(PAPER_COLORS, (colorId) => {
  paper.startFrontColorFade(PAPER_COLORS[colorId]);
  colorFade.progress = 0;
});
const paper = createPaper(
  PAPER_COLORS[frontColorId],
  paperRadiusMeters,
  sheets[sequenceState.designId],
);

// The design whose sheet the paper's geometry holds.
let shownDesignId = sequenceState.designId;

// The paper's turntable spin, which only a reload resets.
const spin = { pitchRadians: 0, yawRadians: 0 };

scene.add(paper.group, ...createLights(paperRadiusMeters));

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

// A press or a tick mid-step changes only the target, which the stepper
// reads once the step, fade or stretch in progress finishes. A button's
// target carries no `linesOn`, so Object.assign() keeps the checkbox's.
connectFoldButtons((target) => Object.assign(sequenceTarget, target));
connectFoldLinesToggle((linesOn) => {
  sequenceTarget.linesOn = linesOn;
});

// With the default order `XYZ`, the paper turns about its own vertical
// axis first and tilts towards the viewer second.
connectDrag(canvas, (deltaXPixels, deltaYPixels) => {
  turnSpin(
    deltaXPixels,
    deltaYPixels,
    MAX_PITCH_RADIANS,
    MIN_PITCH_RADIANS,
    spin,
  );
  paper.group.rotation.set(spin.pitchRadians, spin.yawRadians, 0);
});

// Avoid a large jump in the fold when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  const deltaSeconds = timer.getDelta();
  if (stepSequence(deltaSeconds, designs, sequenceState, sequenceTarget)) {
    // The design changes only at rest, with the paper flat.
    if (sequenceState.designId !== shownDesignId) {
      shownDesignId = sequenceState.designId;
      paper.setSheet(sheets[shownDesignId]);
    }
    paper.setSequencePosition(sequenceState.position);
    paper.setLinesVisibility(sequenceState.linesVisibility);

    // Written on every change, so the scale ends on exactly 1 and the pose
    // on exactly the design's start. Refit the grain after the scale, in
    // this frame: setSheet() above fitted the grain to the scale written
    // before.
    writeStretchScale(designs, paper.stretchScale, sequenceState);
    writeStartPose(designs, paper.startRotation, sequenceState);
    paper.fitGrain();
  }

  // True on the step that reaches 1, so the fade ends on exactly its colour.
  if (stepColorFade(deltaSeconds, colorFade)) {
    paper.setFrontColorFade(colorFade.progress);
  }
  renderer.render(scene, camera);
});
