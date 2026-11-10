/**
 * @fileoverview
 * The paper sheet: a two-tone, flat-shaded mesh, posed along its design's
 * fold sequence.
 */

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  FrontSide,
  Group,
  Mesh,
  MeshLambertMaterial,
  Sphere,
  Vector3,
} from "three";
import { writePaperPositions } from "../fold/pose.js";

const PAPER_BACK_COLOR = 0xf4f1ea; // off-white
const PAPER_FRONT_COLOR = 0xd9342b; // origami red

/** #### Creates the paper sheet, flat, from a cut sheet
 * - Each face has its own vertices and a fan of triangles; each bridging
 *   strip is two triangles joining the edges of two faces at a crease.
 * - The front and back meshes share one geometry, whose positions are
 *   rewritten in place as the paper folds.
 * - The bounding sphere is set once, to hold the paper over its whole fold
 *   sequence.
 * @param radiusMeters The largest distance from the origin that the paper
 *   reaches over its fold sequence, from maxPaperRadius(), in metres.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The `group` to add to the scene, and setSequencePosition(),
 *   which poses the paper along its fold sequence.
 */
export const createPaper = (radiusMeters, sheet) => {
  const vertexCount = sheet.faces.reduce(
    (count, { polygon }) => count + polygon.length,
    0,
  );
  const positions = new Float32Array(3 * vertexCount);
  writePaperPositions(positions, 0, sheet);
  const positionAttribute = new BufferAttribute(positions, 3).setUsage(
    DynamicDrawUsage,
  );

  // Lambert's vertex shader reads `normal`, though flat shading ignores it.
  const normals = new Float32Array(3 * vertexCount);
  for (let i = 0; i < vertexCount; i++) normals[3 * i + 2] = 1;

  const geometry = new BufferGeometry()
    .setAttribute("position", positionAttribute)
    .setAttribute("normal", new BufferAttribute(normals, 3))
    .setIndex(createTriangleIndices(sheet));
  geometry.boundingSphere = new Sphere(new Vector3(), radiusMeters);

  const group = new Group();
  group.add(
    new Mesh(geometry, createPaperMaterial(PAPER_FRONT_COLOR, FrontSide)),
    new Mesh(geometry, createPaperMaterial(PAPER_BACK_COLOR, BackSide)),
  );

  /** #### Poses the paper at a point in its fold sequence
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param sequencePosition From 0 (flat) to the design's fold count.
   */
  const setSequencePosition = (sequencePosition) => {
    writePaperPositions(positions, sequencePosition, sheet);
    positionAttribute.needsUpdate = true;
  };

  return { group, setSequencePosition };
};

/** #### Creates a matte, flat-shaded material for one side of the paper
 * - Flat shading derives each normal from screen-space derivatives, so it
 *   faces the camera whichever side is showing.
 * @param color The side's colour, as a hex number.
 * @param side FrontSide or BackSide.
 * @returns The material.
 */
const createPaperMaterial = (color, side) =>
  new MeshLambertMaterial({ color, flatShading: true, side });

/** #### Lists the vertex indices of every triangle of the paper
 * - Every triangle runs anticlockwise seen from the front of the paper, so
 *   the front material draws the front.
 * @param sheet The sheet that cutSheet() returns.
 * @returns Three indices per triangle.
 */
const createTriangleIndices = (sheet) => {
  const indices = [];
  let firstVertex = 0;
  for (const { polygon } of sheet.faces) {
    for (let i = 1; i < polygon.length - 1; i++) {
      indices.push(firstVertex, firstVertex + i, firstVertex + i + 1);
    }
    firstVertex += polygon.length;
  }

  // A strip lies between its two edges, so it runs from one face's edge,
  // backwards, to the other's.
  for (const [a0, a1, b0, b1] of sheet.bridges) {
    indices.push(a1, a0, b0, a1, b0, b1);
  }

  return indices;
};
