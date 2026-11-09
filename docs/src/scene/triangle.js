/**
 * @fileoverview
 * An equilateral triangle mesh, the placeholder content of the scene.
 */

import { CircleGeometry, Mesh, MeshBasicMaterial } from "three";

const APEX_ANGLE_RADIANS = Math.PI / 2; // first corner points straight up
const TRIANGLE_SEGMENTS = 3; // a circle of three segments is a triangle

export const TRIANGLE_RADIUS_METERS = 1; // centre to each corner

/** #### Creates an unlit equilateral triangle in the XY plane, facing +Z
 * - Its colour is left at the material's default, for the caller to set.
 * @returns The triangle mesh, centred on the origin.
 */
export const createTriangle = () =>
  new Mesh(
    new CircleGeometry(
      TRIANGLE_RADIUS_METERS,
      TRIANGLE_SEGMENTS,
      APEX_ANGLE_RADIANS,
    ),
    new MeshBasicMaterial(),
  );
