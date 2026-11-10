/**
 * @fileoverview
 * The paper's grain: a tile of seeded value noise that repeats with no seam,
 * and the repeat that keeps it at its true size on a stretching sheet.
 */

import { smoothstep } from "../fold/easing.js";

// The size of each layer's noise cell, in texels. Each must divide
// `GRAIN_TEXTURE_PX` exactly, so every layer's grid wraps at the tile's
// edges. At 0.25 mm per texel, the grain's features are 0.5, 1 and 2 mm
// across.
export const GRAIN_CELLS_PX = Object.freeze([2, 4, 8]);

// The seed of the noise's random values, so every load shows the same grain.
export const GRAIN_SEED = 1;

// The most the grain darkens the paper, as a fraction of its colour, from 0
// (no grain) to 1.
export const GRAIN_STRENGTH = 0.15;

export const GRAIN_TEXTURE_PX = 512; // the tile's width and height, in texels
export const GRAIN_TILE_METERS = 0.128; // the tile's side on the paper

/** #### Creates the RGBA bytes of a square tile of grey, opaque paper grain
 * - Each texel's grey is `255 × (1 − GRAIN_STRENGTH × n)`, rounded, where
 *   `n`, from 0 to 1, is the mean of one layer of value noise per entry of
 *   `GRAIN_CELLS_PX`: random values on a grid of cells that many texels
 *   wide, interpolated with smoothstep().
 * - Each layer's grid wraps at the tile's edges, so the tile repeats with no
 *   seam.
 * - Draws its random values from mulberry32, seeded with `GRAIN_SEED`, so
 *   every call returns the same tile.
 * - Pure maths, with no DOM or GPU access.
 * @returns `4 × GRAIN_TEXTURE_PX²` bytes, row by row.
 */
export const createGrainPixels = () => {
  const random = createMulberry32(GRAIN_SEED);
  const noise = new Float32Array(GRAIN_TEXTURE_PX * GRAIN_TEXTURE_PX);
  for (const cellPx of GRAIN_CELLS_PX) {
    addNoiseLayer(noise, cellPx, random);
  }

  const pixels = new Uint8Array(4 * noise.length);
  for (let i = 0; i < noise.length; i++) {
    const n = noise[i] / GRAIN_CELLS_PX.length;
    const grey = Math.round(255 * (1 - GRAIN_STRENGTH * n));
    pixels[4 * i] = grey;
    pixels[4 * i + 1] = grey;
    pixels[4 * i + 2] = grey;
    pixels[4 * i + 3] = 255;
  }

  return pixels;
};

/** #### Returns the grain's repeat on one axis, so it keeps its true size
 * - The sheet's size as shown, its size times the stretch, in tiles.
 * - Allocates nothing, so it is safe on the per-frame path.
 * - Pure maths, with no DOM or GPU access.
 * @param sizeMeters The sheet's size on this axis, in metres.
 * @param stretchScale The stretch group's scale on this axis.
 * @returns The texture's `repeat` on this axis, in tiles per sheet.
 */
export const grainRepeat = (sizeMeters, stretchScale) =>
  (sizeMeters * stretchScale) / GRAIN_TILE_METERS;

/** #### Adds one layer of wrapping value noise, from 0 to 1, to a tile
 * - Fills a grid of random values, one per cell corner, row by row, then
 *   interpolates them across each cell, eased, wrapping at the tile's edges.
 * @param noise The tile's running sum, one value per texel, row by row.
 * @param cellPx The cell's width and height, in texels.
 * @param random A function returning a random number from 0 to 1.
 */
const addNoiseLayer = (noise, cellPx, random) => {
  const gridSize = GRAIN_TEXTURE_PX / cellPx;
  const grid = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < grid.length; i++) grid[i] = random();

  for (let y = 0; y < GRAIN_TEXTURE_PX; y++) {
    const row0 = Math.floor(y / cellPx);
    const row1 = (row0 + 1) % gridSize;
    const ty = smoothstep((y % cellPx) / cellPx);
    for (let x = 0; x < GRAIN_TEXTURE_PX; x++) {
      const col0 = Math.floor(x / cellPx);
      const col1 = (col0 + 1) % gridSize;
      const tx = smoothstep((x % cellPx) / cellPx);
      const bottom = lerp(
        grid[row0 * gridSize + col0],
        grid[row0 * gridSize + col1],
        tx,
      );
      const top = lerp(
        grid[row1 * gridSize + col0],
        grid[row1 * gridSize + col1],
        tx,
      );
      noise[y * GRAIN_TEXTURE_PX + x] += lerp(bottom, top, ty);
    }
  }
};

/** #### Creates a mulberry32 generator, a small, fast seeded random source
 * - The algorithm is Tommy Ettinger's public-domain mulberry32.
 * @param seed The seed, a 32-bit integer.
 * @returns A function returning the next random number, from 0 to under 1.
 */
const createMulberry32 = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** #### Mixes linearly from one value to another
 * @param a The value at 0.
 * @param b The value at 1.
 * @param t From 0 to 1.
 * @returns The mixed value.
 */
const lerp = (a, b, t) => a + (b - a) * t;
