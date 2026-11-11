import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REAL_PALETTES, paletteGradient } from './realPalettes.ts'

test('every real palette has 5 valid RGB colors (sea → peak)', () => {
  for (const [name, { colors }] of Object.entries(REAL_PALETTES)) {
    assert.equal(colors.length, 5, name)
    colors.flat().forEach((c) => assert.ok(Number.isInteger(c) && c >= 0 && c <= 255, name))
  }
})

test('gradient spreads colors over the 0-255 height range in order', () => {
  const g = paletteGradient(REAL_PALETTES.earth.colors)
  assert.deepEqual(g.map((c) => c.a), [0, 62, 124, 187, 249])
  assert.deepEqual([g[0].r, g[0].g, g[0].b], REAL_PALETTES.earth.colors[0])
})

test('fewer colors (sea color dropped) still span the full height range', () => {
  const g = paletteGradient(REAL_PALETTES.earth.colors.slice(1))
  assert.deepEqual(g.map((c) => c.a), [0, 83, 166, 249])
})
