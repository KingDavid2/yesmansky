import { test } from 'node:test'
import assert from 'node:assert/strict'
import { starField, twinkle } from './stars.ts'

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
