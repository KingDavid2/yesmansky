import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { cubeMapPosition } from './cubeMap.ts'

test('face centers map to cube axes', () => {
  const N = 1200 // divisible by 4 and 3 so tile centers land on pixels
  const near = (tx: number, ty: number, expected: number[]) => {
    const p = cubeMapPosition(tx * 300 + 150, ty * 400 + 200, N, N)
    expected.forEach((e, i) => assert.ok(Math.abs(p[i] - e) < 1, `tile ${tx},${ty}: ${p} vs ${expected}`))
  }
  near(2, 1, [127.5, 127.5, 255])
  near(3, 1, [255, 127.5, 127.5])
  near(1, 0, [127.5, 0, 127.5])
})

test('unused cross tiles return null', () => {
  assert.equal(cubeMapPosition(10, 10, 1024, 1024), null)
})

test('positions are continuous, not 8-bit quantized', () => {
  const a = cubeMapPosition(1300, 1000, 2048, 2048)
  const b = cubeMapPosition(1301, 1000, 2048, 2048)
  const dx = Math.abs(a[0] - b[0])
  assert.ok(dx > 0 && dx < 1, `neighbor delta ${dx} should be sub-integer`)
})

test('matches planetObjectSpaceNormal.png within 8-bit rounding', () => {
  const img = decodeRgbPng('public/textures/planetObjectSpaceNormal.png')
  let checked = 0
  for (let y = 0; y < img.h; y += 7) {
    for (let x = 0; x < img.w; x += 7) {
      const p = cubeMapPosition(x, y, img.w, img.h)
      if (!p) continue
      const o = (y * img.w + x) * 3
      for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(p[i] - img.data[o + i]) <= 1, `pixel ${x},${y} channel ${i}`)
      }
      checked++
    }
  }
  assert.ok(checked > 40000)
})

/** Minimal PNG decoder: 8-bit RGB, non-interlaced (enough for the normal map asset) */
function decodeRgbPng(path: string) {
  const buf = readFileSync(path)
  let off = 8, w = 0, h = 0
  const idat: Buffer[] = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const chunk = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') { w = chunk.readUInt32BE(0); h = chunk.readUInt32BE(4) }
    if (type === 'IDAT') idat.push(chunk)
    off += 12 + len
  }
  const stride = w * 3
  const raw = inflateSync(Buffer.concat(idat))
  const data = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    for (let x = 0; x < stride; x++) {
      const a = x >= 3 ? data[y * stride + x - 3] : 0
      const b = y ? data[(y - 1) * stride + x] : 0
      const c = x >= 3 && y ? data[(y - 1) * stride + x - 3] : 0
      let v = raw[src + x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      data[y * stride + x] = v & 255
    }
  }
  return { w, h, data }
}
