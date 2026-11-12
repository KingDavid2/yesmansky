import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ringRadii, ringBands } from './rings.ts'

const round = (rs: Array<{ inner: number, outer: number }>) =>
  rs.map(r => ({ inner: +r.inner.toFixed(6), outer: +r.outer.toFixed(6) }))

test('first gap measured from planet surface, next from previous ring', () => {
  assert.deepEqual(
    round(ringRadii([
      { width: 0.3, gap: 0.2, angle: 0, color: '#c8a878' },
      { width: 0.2, gap: 0.1, angle: 20, color: '#a08060' }
    ])),
    [{ inner: 1.2, outer: 1.5 }, { inner: 1.6, outer: 1.8 }]
  )
})

test('no rings → empty', () => {
  assert.deepEqual(ringRadii([]), [])
})

test('ringBands: values in [0,1], deterministic per seed', () => {
  const bands = ringBands(3, 256)
  assert.equal(bands.length, 256)
  for (const { brightness, alpha } of bands) {
    assert.ok(brightness >= 0 && brightness <= 1)
    assert.ok(alpha >= 0 && alpha <= 1)
  }
  assert.deepEqual(ringBands(3, 256), bands)
  assert.notDeepEqual(ringBands(4, 256), bands)
})

test('ringBands: not flat — brightness and alpha vary across radius', () => {
  const bands = ringBands(1, 256)
  const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs)
  assert.ok(spread(bands.map(b => b.brightness)) > 0.3)
  assert.ok(spread(bands.map(b => b.alpha)) > 0.3)
})
