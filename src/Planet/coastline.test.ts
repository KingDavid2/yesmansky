import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sharpenCoast, COAST_STEP } from './coastline.ts'

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
