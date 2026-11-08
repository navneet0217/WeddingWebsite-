import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearedFraction, revealThreshold } from '../src/utils/scratch.js'

function pixels(clearRows) {
  const data = new Uint8ClampedArray(100 * 100 * 4).fill(255)
  for (let pixel = 0; pixel < clearRows * 100; pixel += 1) data[pixel * 4 + 3] = 0
  return { data, width: 100, height: 100 }
}

test('scratch completion threshold is exactly 45 percent', () => {
  assert.equal(revealThreshold, 0.45)
  assert.ok(clearedFraction(pixels(44), 1) < revealThreshold)
  assert.equal(clearedFraction(pixels(45), 1), revealThreshold)
  assert.ok(clearedFraction(pixels(46), 1) > revealThreshold)
})

test('scratch sampling handles fully opaque and fully clear canvases', () => {
  assert.equal(clearedFraction(pixels(0)), 0)
  assert.equal(clearedFraction(pixels(100)), 1)
  assert.equal(clearedFraction({ data: [], width: 0, height: 0 }), 0)
})
