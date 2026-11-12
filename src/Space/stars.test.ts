import { test } from 'node:test'
import assert from 'node:assert/strict'
import { starField, twinkle, nebulaBlobs, nebulaPixels, NEBULA_COLORS } from './stars.ts'

test('star field has count stars, all on the sphere radius', () => {
  const { positions, brightness, phase } = starField(200, 500, 1)
  assert.equal(positions.length, 600)
  assert.equal(brightness.length, 200)
  assert.equal(phase.length, 200)
  for (let i = 0; i < 200; i++) {
    const r = Math.hypot(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
    assert.ok(Math.abs(r - 500) < 1e-6, `${r}`)
    assert.ok(brightness[i] > 0 && brightness[i] <= 1)
  }
})

test('same seed → same field, different seed → different field', () => {
  assert.deepEqual(starField(50, 1, 7), starField(50, 1, 7))
  assert.notDeepEqual(starField(50, 1, 7).positions, starField(50, 1, 8).positions)
})

test('twinkle stays in [0, brightness] and changes over time', () => {
  const values = [0, 0.3, 1, 2.5, 10].map(t => twinkle(0.8, 1.2, t))
  for (const v of values) assert.ok(v >= 0 && v <= 0.8, `${v}`)
  assert.ok(new Set(values).size > 1)
})

test('nebula blobs: deterministic, in range, palette colors', () => {
  const blobs = nebulaBlobs(40, 3)
  assert.equal(blobs.length, 40)
  assert.deepEqual(nebulaBlobs(40, 3), blobs)
  assert.notDeepEqual(nebulaBlobs(40, 4), blobs)
  for (const b of blobs) {
    assert.ok(b.u >= 0 && b.u < 1 && b.v >= 0 && b.v < 1)
    assert.ok(b.radius >= 0.05 && b.radius <= 0.25)
    assert.ok(b.alpha >= 0.08 && b.alpha <= 0.25)
    assert.ok(NEBULA_COLORS.includes(b.color))
  }
})

test('nebula pixels: gaussian falloff, wraps across the u seam, opaque', () => {
  const W = 64, H = 32
  const px = (d: Uint8ClampedArray, x: number, y: number) => d[(y * W + x) * 4 + 2]
  const center = nebulaPixels([{ u: 0.5, v: 0.5, radius: 0.2, alpha: 1, color: '#0000ff' }], W, H)
  assert.ok(px(center, 32, 16) > px(center, 36, 16))
  assert.ok(px(center, 36, 16) > px(center, 40, 16))
  assert.equal(px(center, 0, 0), 0)
  for (let i = 3; i < center.length; i += 4) assert.equal(center[i], 255)
  const seam = nebulaPixels([{ u: 0, v: 0.5, radius: 0.2, alpha: 1, color: '#0000ff' }], W, H)
  assert.equal(px(seam, 0, 16), px(seam, W - 1, 16)); assert.ok(px(seam, 0, 16) > 0)
})
