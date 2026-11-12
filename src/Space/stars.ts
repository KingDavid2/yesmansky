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

export const NEBULA_COLORS = ['#2fae7a', '#2a5bd7', '#7b3fc4'] // green, blue, purple

/** Soft gas clouds in equirect UV space; v biased to the middle band to avoid pole stretching. */
export function nebulaBlobs(count: number, seed: number) {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, () => ({
    u: rand(),
    v: 0.5 + (rand() + rand() - 1) * 0.4,
    radius: 0.05 + 0.2 * rand(),
    alpha: 0.08 + 0.17 * rand(),
    color: NEBULA_COLORS[Math.floor(rand() * NEBULA_COLORS.length)],
  }))
}

type NebulaBlob = ReturnType<typeof nebulaBlobs>[number]

/**
 * Additive gaussian blobs into an RGBA equirect buffer (width × height), wrapping across the u seam.
 * Computed per pixel instead of canvas gradients: Chrome dithers gradients, which shows up as a grid once magnified.
 */
export function nebulaPixels(blobs: NebulaBlob[], width: number, height: number) {
  const rgb = new Float32Array(width * height * 3)
  for (const { u, v, radius, alpha, color } of blobs) {
    const [cr, cg, cb] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) * alpha)
    const r = radius * width, cx = u * width, cy = v * height
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(height, Math.ceil(cy + r)); y++) {
      for (let x = Math.floor(cx - r); x < Math.ceil(cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r
        if (d >= 1) continue
        const w = Math.exp(-((2.5 * d) ** 2))
        const i = (y * width + ((x % width) + width) % width) * 3
        rgb[i] += cr * w
        rgb[i + 1] += cg * w
        rgb[i + 2] += cb * w
      }
    }
  }
  const out = new Uint8ClampedArray(width * height * 4).fill(255)
  for (let p = 0; p < width * height; p++) out.set(rgb.subarray(p * 3, p * 3 + 3), p * 4)
  return out
}
