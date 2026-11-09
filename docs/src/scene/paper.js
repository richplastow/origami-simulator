/**
 * @fileoverview
 * The paper sheet: a two-tone, flat-shaded mesh with faint crease lines.
 */

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
} from "three";
import { writeFoldedPositions } from "../fold/kinematics.js";

const CREASE_LINE_COLOR = 0x000000; // black, faded by its opacity
const CREASE_LINE_OPACITY = 0.2; // faintly darkens both sides
const FLAT = { angleRadians: 0, creaseId: null };
const PAPER_BACK_COLOR = 0xf4f1ea; // off-white
const PAPER_FRONT_COLOR = 0xd9342b; // origami red

// Push the paper just behind the crease lines that lie on it.
const PAPER_POLYGON_OFFSET_FACTOR = 1;
const PAPER_POLYGON_OFFSET_UNITS = 1;

/** #### Creates the paper sheet, flat, from a crease pattern
 * - The front and back meshes and the crease lines share one position
 *   attribute, so the lines always follow the paper.
 * - Bounding spheres are computed once, flat: folding never moves a point
 *   further from the centre.
 * @param pattern The crease pattern that createCreasePattern() returns.
 * @returns The `group` to add to the scene, and setFold(), which reshapes
 *   the paper to a fold state.
 */
export const createPaper = (pattern) => {
  const pointCount = pattern.points.length;
  const positions = new Float32Array(3 * pointCount);
  writeFoldedPositions(FLAT, pattern, positions);
  const positionAttribute = new BufferAttribute(positions, 3).setUsage(
    DynamicDrawUsage,
  );

  // Lambert's vertex shader reads `normal`, though flat shading ignores it.
  const normals = new Float32Array(3 * pointCount);
  for (let i = 0; i < pointCount; i++) normals[3 * i + 2] = 1;

  const paperGeometry = new BufferGeometry()
    .setAttribute("position", positionAttribute)
    .setAttribute("normal", new BufferAttribute(normals, 3))
    .setIndex(pattern.triangles.flat());
  paperGeometry.computeBoundingSphere();

  // Each crease is drawn as two segments, centre to each end.
  const lineGeometry = new BufferGeometry()
    .setAttribute("position", positionAttribute)
    .setIndex(pattern.creases.flatMap(({ from, to }) => [0, from, 0, to]));
  lineGeometry.computeBoundingSphere();

  const group = new Group();
  group.add(
    new Mesh(paperGeometry, createPaperMaterial(PAPER_FRONT_COLOR, FrontSide)),
    new Mesh(paperGeometry, createPaperMaterial(PAPER_BACK_COLOR, BackSide)),
    new LineSegments(
      lineGeometry,
      new LineBasicMaterial({
        color: CREASE_LINE_COLOR,
        opacity: CREASE_LINE_OPACITY,
        transparent: true,
      }),
    ),
  );

  /** #### Reshapes the paper to a fold state
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param foldState The fold: `angleRadians`, and `creaseId`, null when
   *   flat.
   */
  const setFold = (foldState) => {
    writeFoldedPositions(foldState, pattern, positions);
    positionAttribute.needsUpdate = true;
  };

  return { group, setFold };
};

/** #### Creates a matte, flat-shaded material for one side of the paper
 * - Flat shading derives each normal from screen-space derivatives, so it
 *   faces the camera whichever side is showing.
 * @param color The side's colour, as a hex number.
 * @param side FrontSide or BackSide.
 * @returns The material.
 */
const createPaperMaterial = (color, side) =>
  new MeshLambertMaterial({
    color,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: PAPER_POLYGON_OFFSET_FACTOR,
    polygonOffsetUnits: PAPER_POLYGON_OFFSET_UNITS,
    side,
  });
