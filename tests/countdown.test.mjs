import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCountdown } from '../src/utils/countdown.js'

test('countdown respects the explicit wedding timezone at the reference instant', () => {
  assert.deepEqual(getCountdown('2026-11-26T00:00:00+05:30', Date.parse('2026-11-08T12:00:00Z')), {
    days: 17, hours: 6, minutes: 30, seconds: 0, expired: false,
  })
})

test('countdown rolls over seconds, minutes, hours, and days correctly', () => {
  const target = '2026-12-20T19:00:00+05:30'
  const end = Date.parse(target)
  for (const [seconds, values] of [
    [1, [0, 0, 0, 1]], [60, [0, 0, 1, 0]], [3600, [0, 1, 0, 0]],
    [86400, [1, 0, 0, 0]], [90061, [1, 1, 1, 1]],
  ]) {
    const result = getCountdown(target, end - seconds * 1000)
    assert.deepEqual([result.days, result.hours, result.minutes, result.seconds], values)
  }
})

test('expired countdown never produces negative values or stale digits', () => {
  const target = '2026-12-20T19:00:00+05:30'
  for (const now of [Date.parse(target), Date.parse(target) + 3600000]) {
    assert.deepEqual(getCountdown(target, now), { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
  }
  assert.throws(() => getCountdown('invalid', 0), /valid wedding date/)
})
