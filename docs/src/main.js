/**
 * @fileoverview
 * Entry point: draws a lit sheet of paper, which shadows itself, on a
 * transparent canvas, and folds it into the design a radio chooses, turning
 * it over where the design says, or back to flat, stretching the flat sheet
 * from one design's shape to the next's between them while turning it to
 * the next's starting pose and lean, with each design's fold lines printed
 * on it as it folds and unfolds while the "Fold lines" checkbox is ticked,
 * but faded out on the finished model at rest, fades its front to the
 * colour a swatch names, or a design names once it takes over the flat
 * sheet, and turns it like a turntable as a drag on the canvas moves,
 * easing it back on a double-click; Escape hides and shows the toolbar.
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
import {
  writeLean,
  writeStartPose,
  writeStretchScale,
} from "./designs/sheet.js";
import { cutSheet } from "./fold/engine.js";
import { maxPaperRadius } from "./fold/pose.js";
import { stepSequence } from "./fold/stepper.js";
import { connectDrag } from "./input/drag.js";
import { startSpinReset, stepSpinReset, turnSpin } from "./input/spin.js";
import { createLights } from "./scene/lights.js";
import { PAPER_COLORS, stepColorFade } from "./scene/paper-colors.js";
import { createPaper } from "./scene/paper.js";
import { connectColorSwatches } from "./ui/color-swatches.js";
import { connectControlsToggle } from "./ui/controls-toggle.js";
import { connectDesignRadios } from "./ui/design-radios.js";
import { connectFoldLinesToggle } from "./ui/fold-lines-toggle.js";

// Raised above the horizontal XZ plane, turned from +Z towards +Y.
const CAMERA_ELEVATION_RADIANS = MathUtils.degToRad(20);
const CAMERA_FAR_METERS = 10;
const CAMERA_FOV_DEGREES = 30; // vertical; PerspectiveCamera takes degrees
const CAMERA_NEAR_METERS = 0.01;
const FRAME_MARGIN = 1.1; // leaves room around the paper for the toolbar

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

// The paper starts as the first design, finished, and stays there until a
// design is chosen. A finished model at rest shows no fold lines, whatever
// the "Fold lines" checkbox says, so the lines start hidden. The target names
// that same point, so the stepper has nothing to do at load. The target's
// `linesOn` follows the checkbox, which a browser may restore on reload,
// and governs the lines while the paper folds and unfolds.
const sequenceTarget = {
  designId: firstDesign.id,
  linesOn: true, // replaced by the checkbox's state at connection
  position: firstDesign.steps.length,
};
connectFoldLinesToggle((linesOn) => {
  sequenceTarget.linesOn = linesOn;
});
const sequenceState = {
  designId: firstDesign.id,
  direction: 0,
  linesFade: 0,
  linesVisibility: 0,
  position: firstDesign.steps.length,
  stretchFromId: firstDesign.id,
  stretchProgress: 1,
};

// The paper takes the first design's colour from its first frame.
const paper = createPaper(
  PAPER_COLORS[firstDesign.colorId],
  paperRadiusMeters,
  sheets[sequenceState.designId],
);

// The front's colour fade, done at load, with the first design's swatch
// checked, whatever the browser restored on reload. A swatch's colour
// starts at once, whatever the fold sequence is doing, and a design's when
// it takes over the flat sheet, or at once if the paper already holds it;
// each fades from the colour then showing.
const colorFade = { progress: 1 };
const chooseColor = connectColorSwatches(
  firstDesign.colorId,
  PAPER_COLORS,
  (colorId) => {
    paper.startFrontColorFade(PAPER_COLORS[colorId]);
    colorFade.progress = 0;
  },
);

// The design whose sheet the paper's geometry holds.
let shownDesignId = sequenceState.designId;

// The paper's turntable spin, and its ease back to the view at load, which
// a double-click starts; done at load.
const spin = { pitchRadians: 0, yawRadians: 0 };
const spinReset = { fromPitchRadians: 0, fromYawRadians: 0, progress: 1 };

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

// A choice or a tick mid-step changes only the target, which the stepper
// reads once the step, fade or stretch in progress finishes. A design's
// target carries no `linesOn`, so Object.assign() keeps the checkbox's.
// Choosing the design the paper already holds re-applies its colour, if
// it names one; another design's colour waits until that design takes over
// the flat sheet, in writeSequenceState(). A choice can arrive twice, and
// does nothing the second time: the target is the same, and chooseColor()
// ignores the colour already chosen.
connectDesignRadios(PAPER_COLORS, ({ colorId, target }) => {
  Object.assign(sequenceTarget, target);
  if (colorId !== null && target.designId === sequenceState.designId) {
    chooseColor(colorId);
  }
});

// Escape hides and shows the toolbar, for a presentation mode.
connectControlsToggle();

/** #### Writes the spin to the paper's outermost group
 * - With the default order `XYZ`, the paper turns about its own vertical
 *   axis first and tilts towards the viewer second.
 * - Allocates nothing, so it is safe on the per-frame path.
 */
const writeSpin = () => {
  paper.group.rotation.set(spin.pitchRadians, spin.yawRadians, 0);
};

// A drag cancels a reset under way where it is, and takes over at once; a
// double-click starts a reset from where the spin is.
connectDrag(canvas, (deltaXPixels, deltaYPixels) => {
  spinReset.progress = 1;
  turnSpin(
    deltaXPixels,
    deltaYPixels,
    MAX_PITCH_RADIANS,
    MIN_PITCH_RADIANS,
    spin,
  );
  writeSpin();
});
canvas.addEventListener("dblclick", () => startSpinReset(spinReset, spin));

/** #### Writes the sequence state to the paper
 * - Swaps in the design's sheet, and chooses its colour if it names one,
 *   if the design has changed, which happens only at rest, with the paper
 *   flat and its lines hidden; then poses the paper, shows its lines, and
 *   writes the stretch, the start pose and the lean.
 * - Writes the scale, the pose and the lean on every change, so the scale
 *   ends on exactly 1, and the pose and the lean on exactly the design's.
 *   Refits the grain after the scale, in the same frame: setSheet() fits
 *   the grain to the scale written before.
 * - Allocates nothing unless the design has changed.
 */
const writeSequenceState = () => {
  if (sequenceState.designId !== shownDesignId) {
    shownDesignId = sequenceState.designId;
    paper.setSheet(sheets[shownDesignId]);
    const { colorId } = designs[shownDesignId];
    if (colorId !== undefined) chooseColor(colorId);
  }
  paper.setSequencePosition(sequenceState.position);
  paper.setLinesVisibility(sequenceState.linesVisibility);
  writeStretchScale(designs, paper.stretchScale, sequenceState);
  writeStartPose(designs, paper.startRotation, sequenceState);
  writeLean(designs, paper.leanRotation, sequenceState);
  paper.fitGrain();
};

// The first frame shows the state the page starts in, with no animation.
writeSequenceState();

// Avoid a large jump in the fold when a hidden tab becomes visible again.
timer.connect(document);

renderer.setAnimationLoop((timestampMs) => {
  timer.update(timestampMs);
  const deltaSeconds = timer.getDelta();
  if (stepSequence(deltaSeconds, designs, sequenceState, sequenceTarget)) {
    writeSequenceState();
  }

  // True on the step that reaches 1, so the fade ends on exactly its colour.
  if (stepColorFade(deltaSeconds, colorFade)) {
    paper.setFrontColorFade(colorFade.progress);
  }

  // True on the step that reaches 1, so the spin ends on exactly 0.
  if (stepSpinReset(deltaSeconds, spinReset, spin)) writeSpin();
  renderer.render(scene, camera);
});
