import { makeNoise3D } from 'open-simplex-noise'

// Planet radius is 1. width = satellite diameter, gap = planet surface → satellite surface,
// angle = orbit inclination in degrees (tilted around X, like rings), speeds are multipliers.
export type SatelliteOptions = {
  width: number,
  gap: number,
  angle: number,
  color: string,
  shape: 'regular' | 'irregular',
  rotationSpeed: number,
  translationSpeed: number
}

const ORBIT_BASE = 0.3 // rad/s at translationSpeed 1

/** Position on an inclined circular orbit at time t (seconds). */
export function satellitePosition(sat: SatelliteOptions, t: number): { x: number, y: number, z: number } {
  const r = 1 + sat.gap + sat.width / 2
  const a = t * sat.translationSpeed * ORBIT_BASE
  const tilt = sat.angle * Math.PI / 180
  const z = Math.sin(a) * r
  // circle in XZ, then rotate around X by tilt (same convention as Babylon rotation.x)
  return { x: Math.cos(a) * r, y: -z * Math.sin(tilt), z: z * Math.cos(tilt) }
}

const noises = new Map<number, (x: number, y: number, z: number) => number>()

/** Radial scale for a vertex on the unit sphere: lumpy potato, in [0.7, 1.3]. */
export function irregularScale(seed: number, x: number, y: number, z: number): number {
  if (!noises.has(seed)) noises.set(seed, makeNoise3D(seed))
  const noise = noises.get(seed)!
  const n = noise(x * 1.5, y * 1.5, z * 1.5) * 0.7 + noise(x * 4, y * 4, z * 4) * 0.3
  return Math.min(1.3, Math.max(0.7, 1 + 0.3 * n))
}

export type Crater = { dir: [number, number, number], radius: number }

const CRATER_COUNT = 60
const craterCache = new Map<number, Crater[]>()

// mulberry32: tiny seeded PRNG, enough for crater placement
const rng = (seed: number) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Crater centers (unit vectors) and angular radii; many small, few big. Same seed → same craters. */
export function satelliteCraters(seed: number): Crater[] {
  if (!craterCache.has(seed)) {
    const rand = rng(seed * 9973)
    craterCache.set(seed, Array.from({ length: CRATER_COUNT }, () => {
      const y = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - y * y)
      return { dir: [Math.cos(a) * r, y, Math.sin(a) * r], radius: 0.08 + 0.4 * rand() ** 3 }
    }))
  }
  return craterCache.get(seed)!
}

/**
 * Surface at unit-sphere point: radial scale (shape + crater bowls/rims) and
 * albedo shade (mottled noise, dark floors, bright rims).
 */
export function satelliteSurface(seed: number, x: number, y: number, z: number, irregular: boolean): { scale: number, shade: number } {
  let scale = irregular ? irregularScale(seed, x, y, z) : 1
  if (!noises.has(seed + 1000)) noises.set(seed + 1000, makeNoise3D(seed + 1000))
  const noise = noises.get(seed + 1000)!
  let shade = 0.85 + 0.15 * noise(x * 3, y * 3, z * 3) + 0.08 * noise(x * 12, y * 12, z * 12)
  for (const { dir, radius } of satelliteCraters(seed)) {
    const dot = Math.min(1, Math.max(-1, x * dir[0] + y * dir[1] + z * dir[2]))
    const d = Math.acos(dot) / radius
    if (d > 1.5) continue
    const depth = radius * 0.35
    if (d < 1) {
      scale -= depth * (1 - d * d)
      shade -= 0.3 * (1 - d)
    }
    const rim = Math.exp(-(((d - 1) / 0.2) ** 2))
    scale += depth * 0.35 * rim
    shade += 0.15 * rim
  }
  return { scale, shade: Math.min(1.3, Math.max(0.3, shade)) }
}
