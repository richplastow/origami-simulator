/**
 * @fileoverview
 * The paper sheet: a two-tone, flat-shaded mesh with a fine grain on both
 * sides, posed along its design's fold sequence, with its crease pattern
 * printed on both sides, whose front colour fades to another on request.
 */

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  FrontSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Sphere,
  Vector3,
} from "three";
import { smoothstep } from "../fold/easing.js";
import { writePaperPositions } from "../fold/pose.js";
import { drawFoldLines } from "./fold-lines.js";
import { createGrainPixels, GRAIN_TEXTURE_PX, grainRepeat } from "./grain.js";

const PAPER_BACK_COLOR = 0xf4f1ea; // off-white, whatever the front's colour

/** #### Creates the paper sheet, flat, from a cut sheet
 * - Each face has its own vertices and a fan of triangles; each bridging
 *   strip is two triangles joining the edges of two faces at a crease.
 * - The front, back and two fold-line meshes share one geometry, whose
 *   positions are rewritten in place as the paper folds.
 * - Each fold-line mesh shows the sheet's crease pattern on its side,
 *   drawn into a canvas of its own, through UVs that follow sheet
 *   coordinates, so each back line lies beneath its front line.
 *   Transparent, each draws after the opaque paper, at the depth of its
 *   side's mesh, which Material's default `depthFunc`, LessEqualDepth,
 *   lets it pass. Both start hidden, so their textures upload only once
 *   shown.
 * - The front's lines are black and unlit, a `map`. The back's are a
 *   coverage mask, the `alphaMap` of a lit material in the front's colour,
 *   so they take the front's colour and darken in shade with the paper.
 * - The front mesh alone casts shadows, the whole sheet both ways up, and
 *   the front, back and back-line meshes receive them, so the paper
 *   shadows itself. The front-line mesh neither casts nor receives: it is
 *   unlit, and its lines are black already.
 * - The bounding sphere is set once per geometry, to hold the paper over
 *   its whole fold sequence.
 * - The meshes sit in an inner group, whose scale stretches the flat sheet
 *   between two designs' shapes, so `group` stays free to turn.
 * - The front's colour fades from the one showing to another through two
 *   scratch colours, mixed in Three.js's working colour space, and the
 *   back's lines follow it; the back's colour never changes.
 * - One grain texture is the `map` of both sides, multiplying each side's
 *   colour. Its repeat follows the sheet's size and stretch, centred on the
 *   sheet's centre, so the grain keeps its true size and holds still while
 *   the sheet changes shape. It lives as long as the page, so it is never
 *   disposed of.
 * @param frontColor The front's colour at creation, as a hex number in
 *   sRGB.
 * @param radiusMeters The largest distance from the origin that the paper
 *   reaches over every design's fold sequence, from maxPaperRadius(), in
 *   metres.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The `group` to add to the scene; `stretchScale`, the inner
 *   group's `scale`, for writeStretchScale(); fitGrain(), which fits the
 *   grain to the sheet's size and stretch, to call after each
 *   writeStretchScale(); startFrontColorFade(), which sets the front's next
 *   colour, and setFrontColorFade(), which fades the front towards it;
 *   setLinesVisibility(), which fades both sides' fold lines;
 *   setSequencePosition(), which poses the paper along its fold sequence;
 *   and setSheet(), which swaps in another design's sheet.
 */
export const createPaper = (frontColor, radiusMeters, sheet) => {
  let shown = createSheetGeometry(radiusMeters, sheet);
  const frontLinesCanvas = document.createElement("canvas");
  drawFoldLines(frontLinesCanvas, sheet, "front");
  const frontLinesMaterial = new MeshBasicMaterial({
    map: createLinesTexture(frontLinesCanvas, SRGBColorSpace),
    opacity: 0,
    side: FrontSide,
    transparent: true,
  });
  const frontLinesMesh = new Mesh(shown.geometry, frontLinesMaterial);
  frontLinesMesh.visible = false;

  // The mask's green channel scales the opacity, so its white lines show in
  // the material's colour, and its black ground not at all.
  const backLinesCanvas = document.createElement("canvas");
  drawFoldLines(backLinesCanvas, sheet, "back");
  const backLinesMaterial = new MeshLambertMaterial({
    alphaMap: createLinesTexture(backLinesCanvas, NoColorSpace),
    color: frontColor,
    flatShading: true,
    opacity: 0,
    side: BackSide,
    transparent: true,
  });
  const backLinesMesh = new Mesh(shown.geometry, backLinesMaterial);
  backLinesMesh.receiveShadow = true;
  backLinesMesh.visible = false;

  const grainTexture = createGrainTexture();
  const frontMaterial = createPaperMaterial(
    frontColor,
    grainTexture,
    FrontSide,
  );
  const backMaterial = createPaperMaterial(
    PAPER_BACK_COLOR,
    grainTexture,
    BackSide,
  );

  // Left at null, a FrontSide material casts with its back faces only, so
  // draw the whole sheet into the shadow map, both ways up, from the front.
  frontMaterial.shadowSide = DoubleSide;
  const frontMesh = new Mesh(shown.geometry, frontMaterial);
  frontMesh.castShadow = true;
  frontMesh.receiveShadow = true;
  const backMesh = new Mesh(shown.geometry, backMaterial);
  backMesh.receiveShadow = true;
  const meshes = [frontMesh, backMesh, frontLinesMesh, backLinesMesh];
  const stretchGroup = new Group();
  stretchGroup.add(...meshes);
  const group = new Group();
  group.add(stretchGroup);

  // The front colour fade's start and end, created once and reused. Both
  // start as the front's colour, so a fade before the first start changes
  // nothing.
  const fadeFromColor = new Color(frontColor);
  const fadeToColor = new Color(frontColor);

  /** #### Fits the grain's repeat to the sheet showing and its stretch
   * - Sets each axis's repeat to the sheet's stretched size in tiles, so a
   *   millimetre of grain is a millimetre of paper whatever the sheet's
   *   shape, and a sheet swapped in shows the same grain as the one before.
   * - The texture's matrix follows its `repeat` by itself, as the renderer
   *   refreshes it on every frame.
   * - Allocates nothing, so it is safe on the per-frame path.
   */
  const fitGrain = () => {
    grainTexture.repeat.set(
      grainRepeat(shown.sheet.widthMeters, stretchGroup.scale.x),
      grainRepeat(shown.sheet.heightMeters, stretchGroup.scale.y),
    );
  };

  /** #### Mixes the front's colour, eased, from the fade's start to its end
   * - Copies the colour to the back's lines, so they fade in step.
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param progress From 0 (the start colour) to 1 (the end colour), linear
   *   in time.
   */
  const setFrontColorFade = (progress) => {
    frontMaterial.color.lerpColors(
      fadeFromColor,
      fadeToColor,
      smoothstep(progress),
    );
    backLinesMaterial.color.copy(frontMaterial.color);
  };

  /** #### Fades both sides' fold lines, eased, hiding them altogether at 0
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param visibility From 0 (hidden) to 1 (shown), linear in time.
   */
  const setLinesVisibility = (visibility) => {
    const opacity = smoothstep(visibility);
    frontLinesMaterial.opacity = opacity;
    backLinesMaterial.opacity = opacity;
    frontLinesMesh.visible = opacity > 0;
    backLinesMesh.visible = opacity > 0;
  };

  /** #### Poses the paper at a point in its fold sequence
   * - Allocates nothing, so it is safe on the per-frame path.
   * @param sequencePosition From 0 (flat) to the design's fold count.
   */
  const setSequencePosition = (sequencePosition) => {
    writePaperPositions(shown.positions, sequencePosition, shown.sheet);
    shown.positionAttribute.needsUpdate = true;
  };

  /** #### Swaps in another design's sheet, posed flat
   * - Gives every mesh the new geometry, then disposes of the old one,
   *   which frees its attributes on the GPU; the materials stay.
   * - Redraws both sides' fold-line canvases for the new sheet, gives each
   *   material a new texture of its canvas, the front's `map` and the
   *   back's `alphaMap`, and disposes of the old textures: a texture's
   *   storage is allocated on its first upload, so it cannot take a
   *   canvas of another size.
   * - Refits the grain to the new sheet, at the stretch scale written so
   *   far; call fitGrain() again once the new stretch scale is written.
   * - Allocates, so call it only when the design changes, at rest, with
   *   the fold lines hidden.
   * @param nextSheet The sheet that cutSheet() returns for the new design.
   */
  const setSheet = (nextSheet) => {
    const oldGeometry = shown.geometry;
    shown = createSheetGeometry(radiusMeters, nextSheet);
    for (const mesh of meshes) mesh.geometry = shown.geometry;
    oldGeometry.dispose();

    const oldFrontTexture = frontLinesMaterial.map;
    drawFoldLines(frontLinesCanvas, nextSheet, "front");
    frontLinesMaterial.map = createLinesTexture(
      frontLinesCanvas,
      SRGBColorSpace,
    );
    oldFrontTexture.dispose();

    const oldBackTexture = backLinesMaterial.alphaMap;
    drawFoldLines(backLinesCanvas, nextSheet, "back");
    backLinesMaterial.alphaMap = createLinesTexture(
      backLinesCanvas,
      NoColorSpace,
    );
    oldBackTexture.dispose();

    fitGrain();
  };

  /** #### Starts the front's fade from the colour showing to another
   * - The colour showing may be part-way through a fade, so a change
   *   mid-fade heads for the new colour from wherever the last one reached.
   * - Changes no colour itself: setFrontColorFade() then runs the fade from
   *   0 to 1.
   * - Allocates nothing.
   * @param color The colour to fade to, as a hex number in sRGB.
   */
  const startFrontColorFade = (color) => {
    fadeFromColor.copy(frontMaterial.color);
    fadeToColor.setHex(color);
  };

  fitGrain();

  return {
    fitGrain,
    group,
    setFrontColorFade,
    setLinesVisibility,
    setSequencePosition,
    setSheet,
    startFrontColorFade,
    stretchScale: stretchGroup.scale,
  };
};

/** #### Creates the grain texture, a seamless tile repeated across the paper
 * - DataTexture defaults to nearest filtering with no mipmaps, which would
 *   shimmer as the paper turns, so it filters linearly between mipmaps.
 * - Its colour space stays NoColorSpace: the grain multiplies a colour,
 *   and is not one itself.
 * - Its `center` is the tile's centre, so the transform is
 *   `repeat × (uv − 0.5) + 0.5` and the sheet's centre shows the tile's.
 * @returns The texture, set to upload on its first use.
 */
const createGrainTexture = () => {
  const texture = new DataTexture(
    createGrainPixels(),
    GRAIN_TEXTURE_PX,
    GRAIN_TEXTURE_PX,
  );
  texture.center.set(0.5, 0.5);
  texture.generateMipmaps = true;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
};

/** #### Creates a texture of a canvas holding fold lines
 * - CanvasTexture's constructor takes no colour space, so it is set after.
 * @param canvas The canvas, already drawn.
 * @param colorSpace SRGBColorSpace for the front's `map`, a colour, or
 *   NoColorSpace for the back's `alphaMap`, a coverage mask read linearly.
 * @returns The texture.
 */
const createLinesTexture = (canvas, colorSpace) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = colorSpace;

  return texture;
};

/** #### Creates a matte, flat-shaded material for one side of the paper
 * - Flat shading derives each normal from screen-space derivatives, so it
 *   faces the camera whichever side is showing.
 * @param color The side's colour, as a hex number.
 * @param map The grain texture, which multiplies the colour.
 * @param side FrontSide or BackSide.
 * @returns The material.
 */
const createPaperMaterial = (color, map, side) =>
  new MeshLambertMaterial({ color, flatShading: true, map, side });

/** #### Creates the geometry of a cut sheet, posed flat
 * - Its bounding sphere, at the origin, holds every design's fold sequence,
 *   so it is never recomputed.
 * - Its `uv` attribute holds each vertex's sheet coordinates scaled to 0
 *   to 1, `u = x / width + 0.5` and `v = y / height + 0.5`, so a bridging
 *   strip, which reuses its faces' vertices, carries its crease's UVs.
 * @param radiusMeters The bounding sphere's radius, in metres.
 * @param sheet The sheet that cutSheet() returns.
 * @returns The `geometry`, its `positionAttribute` and the `positions`
 *   array behind it, and the `sheet` it was made from.
 */
const createSheetGeometry = (radiusMeters, sheet) => {
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

  const uvs = new Float32Array(2 * vertexCount);
  let vertex = 0;
  for (const { polygon } of sheet.faces) {
    for (const [x, y] of polygon) {
      uvs[2 * vertex] = x / sheet.widthMeters + 0.5;
      uvs[2 * vertex + 1] = y / sheet.heightMeters + 0.5;
      vertex++;
    }
  }

  const geometry = new BufferGeometry()
    .setAttribute("position", positionAttribute)
    .setAttribute("normal", new BufferAttribute(normals, 3))
    .setAttribute("uv", new BufferAttribute(uvs, 2))
    .setIndex(createTriangleIndices(sheet));
  geometry.boundingSphere = new Sphere(new Vector3(), radiusMeters);

  return { geometry, positionAttribute, positions, sheet };
};

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
