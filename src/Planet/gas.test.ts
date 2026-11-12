import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gasHeight } from './gas.ts'

const sample = (bands: number, warp = 0) =>
  Array.from({ length: 2001 }, (_, i) => gasHeight(i / 1000 - 1, warp, bands))

test('returns integer gradient indexes in [0, 255]', () => {
  for (const v of sample(10, 0.3)) assert.ok(Number.isInteger(v) && v >= 0 && v <= 255)
})

test('produces `bands` light bands from pole to pole', () => {
  for (const bands of [4, 10, 17]) {
    const values = sample(bands)
    let peaks = 0
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] === 255 && values[i - 1] < 255) peaks++
    }
    assert.equal(peaks, bands)
  }
})

test('warp shifts the bands', () => {
  assert.notEqual(gasHeight(0.1, 0, 10), gasHeight(0.1, 0.03, 10))
})
