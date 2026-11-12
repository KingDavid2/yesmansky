import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STAR_CLASSES, SYSTEM_SCALE, starLight, starOrbitPosition, radialFalloff, flareStrength } from './star.ts'

test('spectral classes O..M each have a hex color', () => {
  assert.deepEqual(Object.keys(STAR_CLASSES), ['O', 'B', 'A', 'F', 'G', 'K', 'M'])
  for (const c of Object.values(STAR_CLASSES)) assert.match(c.color, /^#[0-9a-f]{6}$/)
})

test('at 1 AU intensity is 1', () => {
  assert.equal(starLight(1).intensity, 1)
})

test('closer star is brighter and bigger', () => {
  const near = starLight(0.5)
  const far = starLight(2)
  assert.ok(near.intensity > far.intensity)
  assert.ok(near.size > far.size)
})

test('intensity clamped to [0.1, 5]', () => {
  assert.equal(starLight(0.01).intensity, 5)
  assert.equal(starLight(100).intensity, 0.1)
})

test('star orbit radius is SYSTEM_SCALE * distance at any time', () => {
  for (const t of [0, 1.7, 42]) {
    const { x, y, z } = starOrbitPosition(2, t)
    assert.ok(Math.abs(Math.hypot(x, y, z) - SYSTEM_SCALE * 2) < 1e-9)
    assert.equal(y, 0)
  }
})

test('farther orbit sweeps a smaller angle in the same time', () => {
  const angle = (d: number) => Math.atan2(starOrbitPosition(d, 1).z, starOrbitPosition(d, 1).x)
  assert.ok(Math.abs(angle(4)) < Math.abs(angle(1)))
})

test('radial falloff is bright at center, black at corners, premultiplied', () => {
  const n = 64
  const px = radialFalloff(n)
  assert.equal(px.length, n * n * 4)
  const at = (x: number, y: number) => px[(y * n + x) * 4 + 3]
  assert.ok(at(n / 2, n / 2) > 240)
  assert.equal(at(0, 0), 0)
  assert.equal(at(n - 1, n - 1), 0)
  assert.equal(at(10, 20), at(n - 1 - 10, n - 1 - 20))
  const i = (n / 2 * n + 20) * 4
  assert.equal(px[i], px[i + 3])
})

test('flare strength fades with distance and is clamped', () => {
  assert.ok(flareStrength(0.5) > flareStrength(2))
  assert.equal(flareStrength(0.01), 1.5)
  assert.equal(flareStrength(100), 0.2)
})
