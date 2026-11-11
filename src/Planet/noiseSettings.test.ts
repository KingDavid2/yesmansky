import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildNoiseSettings } from './noiseSettings.ts'

const base = { landMassSize: 80, roughness: 1, seaLevel: 25, coastDetail: 0 }

test('base layer only when roughness and coast detail are low', () => {
  const layers = buildNoiseSettings(base)
  assert.equal(layers.length, 1)
  assert.equal(layers[0].min, 0.25)
})

test('roughness adds layers in front, as before', () => {
  assert.equal(buildNoiseSettings({ ...base, roughness: 3 }).length, 3)
})

test('coast detail appends a high-frequency layer scaled by level', () => {
  const low = buildNoiseSettings({ ...base, coastDetail: 1 })
  const high = buildNoiseSettings({ ...base, coastDetail: 3 })
  const baseLayer = low[0]
  const detail = low[low.length - 1]
  assert.equal(low.length, 2)
  assert.ok(detail.roughness > baseLayer.roughness * 4, 'detail must be much higher frequency')
  assert.ok(high[high.length - 1].strength > detail.strength)
})

test('first layer keeps sea level threshold with detail enabled', () => {
  const layers = buildNoiseSettings({ ...base, roughness: 3, coastDetail: 2 })
  assert.equal(layers[0].min, 0.25)
})

test('no water ignores sea level so terrain is not clamped flat', () => {
  const layers = buildNoiseSettings({ ...base, roughness: 3, coastDetail: 1, water: false })
  layers.forEach((l) => assert.equal(l.min, 0))
})
