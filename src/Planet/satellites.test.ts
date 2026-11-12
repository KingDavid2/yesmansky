import { test } from 'node:test'
import assert from 'node:assert/strict'
import { satellitePosition, irregularScale, satelliteSurface, satelliteCraters, type SatelliteOptions } from './satellites.ts'

const sat = (o: Partial<SatelliteOptions> = {}): SatelliteOptions => ({
  width: 0.2, gap: 1, angle: 0, color: '#aaaaaa', shape: 'regular', rotationSpeed: 1, translationSpeed: 1, ...o
})
const len = ({ x, y, z }: { x: number, y: number, z: number }) => Math.hypot(x, y, z)
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

test('orbit radius = planet radius + gap + satellite radius', () => {
  for (const t of [0, 1.3, 7]) close(len(satellitePosition(sat(), t)), 1 + 1 + 0.1)
})

test('angle 0 → orbit in XZ plane; angle 90 → orbit in XY plane', () => {
  for (const t of [0.4, 2, 5]) {
    close(satellitePosition(sat(), t).y, 0)
    close(satellitePosition(sat({ angle: 90 }), t).z, 0)
  }
})

test('moves along orbit only when translationSpeed > 0', () => {
  assert.notDeepEqual(satellitePosition(sat(), 0), satellitePosition(sat(), 1))
  assert.deepEqual(satellitePosition(sat({ translationSpeed: 0 }), 0), satellitePosition(sat({ translationSpeed: 0 }), 1))
})

test('irregularScale: deterministic, bounded, not constant', () => {
  const pts = Array.from({ length: 200 }, (_, i) => [Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3)])
  const vals = pts.map(([x, y, z]) => irregularScale(3, x, y, z))
  for (const v of vals) assert.ok(v >= 0.7 && v <= 1.3)
  assert.deepEqual(pts.map(([x, y, z]) => irregularScale(3, x, y, z)), vals)
  assert.ok(Math.max(...vals) - Math.min(...vals) > 0.1)
})

test('satelliteSurface: deterministic, bounded shade, varied texture', () => {
  const pts = Array.from({ length: 400 }, (_, i) => {
    const y = 1 - (i + 0.5) / 200, r = Math.sqrt(1 - y * y), a = i * 2.39996
    return [Math.cos(a) * r, y, Math.sin(a) * r]
  })
  const vals = pts.map(([x, y, z]) => satelliteSurface(5, x, y, z, false))
  assert.deepEqual(pts.map(([x, y, z]) => satelliteSurface(5, x, y, z, false)), vals)
  for (const { scale, shade } of vals) {
    assert.ok(scale > 0.6 && scale < 1.4)
    assert.ok(shade >= 0.3 && shade <= 1.3)
  }
  const shades = vals.map(v => v.shade)
  assert.ok(Math.max(...shades) - Math.min(...shades) > 0.2)
})

test('satelliteSurface: crater center is a dented, darker bowl', () => {
  const [c] = satelliteCraters(5)
  const [x, y, z] = c.dir
  const center = satelliteSurface(5, x, y, z, false)
  assert.ok(center.scale < 1, `center not dented: ${center.scale}`)
})
