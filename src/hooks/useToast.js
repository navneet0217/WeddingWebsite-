import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const timer = useRef(null)
  const notify = useCallback((text) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(''), 3500)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { message, notify }
}
