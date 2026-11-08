export function getCountdown(target, now = Date.now()) {
  const targetTime = Date.parse(target)
  if (!Number.isFinite(targetTime) || !Number.isFinite(now)) {
    throw new Error('Countdown requires a valid wedding date and current time.')
  }
  const remaining = Math.max(0, targetTime - now)
  const seconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    expired: remaining === 0,
  }
}
