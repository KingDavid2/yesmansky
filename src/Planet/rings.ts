import { makeNoise2D } from 'open-simplex-noise'

// Planet radius is 1 (PlanetMesh spherizes faces onto the unit sphere)
const PLANET_RADIUS = 1

// width/gap in planet radii, angle in degrees, color as '#rrggbb'
export type RingOptions = { width: number, gap: number, angle: number, color: string }

/** Stacks rings outward: first gap from planet surface, then from previous ring's outer edge. */
export function ringRadii(rings: RingOptions[]): Array<{ inner: number, outer: number }> {
  let edge = PLANET_RADIUS
  return rings.map(({ width, gap }) => {
    const inner = edge + gap
    edge = inner + width
    return { inner, outer: edge }
  })
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/**
 * Radial band profile, inner (i=0) to outer edge: fine ringlets in brightness
 * and density (alpha), with some near-empty gaps. Same seed → same bands.
 */
export function ringBands(seed: number, size: number): Array<{ brightness: number, alpha: number }> {
  const noise = makeNoise2D(seed)
  const octaves = (r: number, row: number) =>
    noise(r * 6, row) * 0.5 + noise(r * 24, row) * 0.3 + noise(r * 80, row) * 0.2
  return Array.from({ length: size }, (_, i) => {
    const r = i / size
    return {
      brightness: clamp01(0.7 + 0.5 * octaves(r, 0)),
      alpha: clamp01(0.55 + 0.9 * octaves(r, 10))
    }
  })
}
