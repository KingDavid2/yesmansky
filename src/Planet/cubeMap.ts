type Vec3 = [number, number, number]

/**
 * Cube-cross layout (4x3 tiles) of planetObjectSpaceNormal.png.
 * Maps tile-local coords s (left→right) and t (top→bottom), both in [-1, 1],
 * to the unnormalized cube point for that face.
 */
const FACES: Record<string, (s: number, t: number) => Vec3> = {
  '1,0': (s, t) => [-t, -1, s],
  '0,1': (s, t) => [-s, t, -1],
  '1,1': (s, t) => [-1, t, s],
  '2,1': (s, t) => [s, t, 1],
  '3,1': (s, t) => [1, t, -s],
  '1,2': (s, t) => [t, 1, s],
}

/**
 * Fraction of each tile (per axis) reserved as border. Mesh UVs only span the
 * inner part; the border holds the neighbor face's terrain (gnomonic
 * extrapolation), so filtering, mipmaps and the bump Sobel never cross into
 * an unrelated tile. That mismatch was the visible seam between faces.
 */
export const CUBE_PAD = 1 / 32

/**
 * Exact sphere position of a texture pixel, in the same 0-255 units the
 * normal map encodes, but as floats. Reading the 8-bit PNG instead quantizes
 * positions to 256 steps, which caps terrain detail at a few pixels.
 * Returns null for pixels outside the six cube faces.
 * `pad` is the tile border fraction (see CUBE_PAD); 0 fills the whole tile.
 */
export const cubeMapPosition = (x: number, y: number, width: number, height: number, pad = 0): Vec3 | null => {
  const tileW = width / 4
  const tileH = height / 3
  const tx = Math.floor(x / tileW)
  const ty = Math.floor(y / tileH)
  const face = FACES[`${tx},${ty}`]
  if (!face) return null

  const s = (2 * (x - tx * tileW + 0.5 - pad * tileW)) / (tileW * (1 - 2 * pad)) - 1
  const t = (2 * (y - ty * tileH + 0.5 - pad * tileH)) / (tileH * (1 - 2 * pad)) - 1
  const [px, py, pz] = face(s, t)
  const scale = 127.5 / Math.hypot(px, py, pz)
  return [px * scale + 127.5, py * scale + 127.5, pz * scale + 127.5]
}
