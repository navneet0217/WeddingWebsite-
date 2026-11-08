import { useEffect, useRef } from 'react'

export function useFitContent({ allowSafeOverflow = false } = {}) {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    let active = true
    const fit = () => {
      if (!active) return
      let heightBoundary = container.clientHeight
      if (allowSafeOverflow) {
        const stage = container.closest('.stage').getBoundingClientRect()
        const safe = container.getBoundingClientRect()
        const center = safe.top + safe.height / 2
        heightBoundary = 2 * Math.min(center - stage.top, stage.bottom - center)
      }
      // The reference message intentionally extends beyond its safe box at 320px.
      const needsFitting = content.scrollHeight > heightBoundary ||
        content.scrollWidth > container.clientWidth
      const scale = needsFitting ? Math.min(1,
        container.clientHeight / Math.max(1, content.scrollHeight),
        container.clientWidth / Math.max(1, content.scrollWidth)) : 1
      content.style.transform = scale < 1 ? `scale(${scale})` : ''
    }
    const observer = new ResizeObserver(fit)
    observer.observe(container)
    observer.observe(content)
    document.fonts.ready.then(fit)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [allowSafeOverflow])
  return { containerRef, contentRef }
}
