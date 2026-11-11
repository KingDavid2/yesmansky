import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sharpenCoast, dryHeight, COAST_STEP } from './coastline.ts'

test('sea pixels stay untouched', () => {
  assert.equal(sharpenCoast(0), 0)
  assert.equal(sharpenCoast(1), 1)
})

test('first land pixel jumps to the coast step', () => {
  assert.ok(sharpenCoast(2) >= COAST_STEP)
})

test('peaks stay at max and order is preserved', () => {
  assert.equal(sharpenCoast(255), 255)
  for (let v = 2; v < 255; v++) {
    assert.ok(sharpenCoast(v + 1) >= sharpenCoast(v))
  }
})

test('dry basins below sea level keep their relief instead of going flat', () => {
  const floor = 64
  const deep = dryHeight(0, floor)
  const shallow = dryHeight(floor - 1, floor)
  assert.equal(deep, 0)
  assert.ok(shallow > deep && shallow < COAST_STEP, `basin ${shallow} must stay under the land step`)
  assert.equal(dryHeight(-40, floor), 0)
})

test('dry land above sea level matches the seas mapping', () => {
  const floor = 64
  assert.ok(dryHeight(floor + 2, floor) >= COAST_STEP)
  assert.equal(dryHeight(400, floor), 255)
})

test('dry height handles sea level 0 without NaN', () => {
  assert.equal(dryHeight(-10, 0), 0)
  assert.ok(dryHeight(10, 0) >= COAST_STEP)
})
