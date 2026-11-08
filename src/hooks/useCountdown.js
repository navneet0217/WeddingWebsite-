import { useEffect, useState } from 'react'
import { getCountdown } from '../utils/countdown.js'

export function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  return getCountdown(target, now)
}
