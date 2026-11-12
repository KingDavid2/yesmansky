import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STAR_CLASSES, starLight } from './star.ts'

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
