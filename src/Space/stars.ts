// mulberry32: tiny seeded PRNG
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stars spread uniformly on a sphere; brightness biased toward dim, phase for twinkle offset. */
export function starField(count: number, radius: number, seed: number) {
  const rand = mulberry32(seed)
  const positions: number[] = []
  const brightness: number[] = []
  const phase: number[] = []
  for (let i = 0; i < count; i++) {
    const y = rand() * 2 - 1
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(1 - y * y)
    positions.push(Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius)
    brightness.push(0.15 + 0.85 * rand() ** 3)
    phase.push(rand() * Math.PI * 2)
  }
  return { positions, brightness, phase }
}

const TWINKLE_SPEED = 2 // rad/s

export function twinkle(brightness: number, phase: number, t: number): number {
  return brightness * (0.6 + 0.4 * Math.sin(t * TWINKLE_SPEED + phase))
}
