/** Spectral classes, hottest to coolest, with approximate visible colors. */
export const STAR_CLASSES = {
  O: { label: 'O — Blue', color: '#9bb0ff' },
  B: { label: 'B — Blue-white', color: '#aabfff' },
  A: { label: 'A — White', color: '#cad7ff' },
  F: { label: 'F — Yellow-white', color: '#f8f7ff' },
  G: { label: 'G — Yellow (Sun)', color: '#fff4e8' },
  K: { label: 'K — Orange', color: '#ffd2a1' },
  M: { label: 'M — Red', color: '#ffb070' }
}

export type StarClass = keyof typeof STAR_CLASSES

const BASE_SIZE = 8 // star diameter in scene units at 1 AU

/** Inverse-square light falloff (clamped) and apparent size shrinking with distance in AU. */
export function starLight(distance: number) {
  const intensity = Math.min(5, Math.max(0.1, 1 / distance ** 2))
  return { intensity, size: BASE_SIZE / distance }
}

export const SYSTEM_SCALE = 20 // scene units per AU in solar system view
const ORBIT_SPEED = 0.2 // rad/s at 1 AU

/** Star position in the planet's frame (planet stays at origin); Kepler: period ∝ distance^1.5. */
export function starOrbitPosition(distance: number, t: number) {
  const radius = SYSTEM_SCALE * distance
  const angle = t * ORBIT_SPEED / distance ** 1.5
  return { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius }
}
