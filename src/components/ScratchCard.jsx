import { useCallback, useEffect, useRef, useState } from 'react'
import Confetti from './Confetti.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { clearedFraction, revealThreshold } from '../utils/scratch.js'

export default function ScratchCard({ config, wedding }) {
  const canvasRef = useRef(null)
  const revealRef = useRef(null)
  const completed = useRef(false)
  const drawing = useRef(null)
  const lastPoint = useRef(null)
  const lastCheck = useRef(0)
  const touched = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const reducedMotion = useReducedMotion()
  const stopCelebrating = useCallback(() => setCelebrating(false), [])

  const reveal = () => {
    if (completed.current) return
    completed.current = true
    setRevealed(true)
    requestAnimationFrame(() => revealRef.current?.focus({ preventScroll: true }))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      console.warn('Scratch canvas is unavailable; click or press Enter to reveal the date.')
      return
    }
    let active = true
    let initialized = false
    const paint = () => {
      if (!active || completed.current) return
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      const dpr = window.devicePixelRatio || 1
      let previous
      if (initialized && touched.current) {
        previous = document.createElement('canvas')
        previous.width = canvas.width
        previous.height = canvas.height
        previous.getContext('2d').drawImage(canvas, 0, 0)
      }
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (previous) {
        context.drawImage(previous, 0, 0, width, height)
      } else {
        const gradient = context.createLinearGradient(0, 0, width, height)
        ;[
          [0, '#8C6A1F'], [0.25, '#D9B65A'], [0.5, '#FFF1CC'],
          [0.75, '#D9B65A'], [1, '#8C6A1F'],
        ].forEach(([stop, color]) => gradient.addColorStop(stop, color))
        context.fillStyle = gradient
        context.fillRect(0, 0, width, height)
        context.fillStyle = '#4A2E35'
        context.font = '600 13px "Cinzel", serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(config.foilLabel, width / 2, height / 2 - 8, width - 18)
        context.font = '500 10px "Montserrat", sans-serif'
        context.fillStyle = '#6E4E10'
        context.fillText(config.foilSubtitle, width / 2, height / 2 + 14, width - 18)
      }
      initialized = true
    }
    paint()
    const observer = new ResizeObserver(paint)
    observer.observe(canvas)
    document.fonts.ready.then(paint)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [config.foilLabel, config.foilSubtitle])

  useEffect(() => {
    if (!revealed || reducedMotion) return
    const timer = window.setTimeout(() => setCelebrating(true), 400)
    return () => window.clearTimeout(timer)
  }, [revealed, reducedMotion])

  const checkProgress = (force = false) => {
    if (completed.current) return
    const now = performance.now()
    if (!force && now - lastCheck.current < 75) return
    lastCheck.current = now
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      reveal()
      return
    }
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const step = Math.max(4, Math.floor(6 * (window.devicePixelRatio || 1)))
    if (clearedFraction(pixels, step) >= revealThreshold) reveal()
  }

  const scratch = (event) => {
    if (completed.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      reveal()
      return
    }
    const rect = canvas.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    context.globalCompositeOperation = 'destination-out'
    context.lineWidth = 52
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(lastPoint.current?.x ?? point.x, lastPoint.current?.y ?? point.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    context.beginPath()
    context.arc(point.x, point.y, 26, 0, Math.PI * 2)
    context.fill()
    touched.current = true
    lastPoint.current = point
    checkProgress()
  }

  const stop = (event) => {
    if (drawing.current !== event.pointerId) return
    drawing.current = null
    lastPoint.current = null
    checkProgress(true)
  }

  return (
    <>
      <div className="scratch-card-wrapper reveal stagger-2" id="scratchWrapper" data-revealed={revealed}>
        <div
          className="scratch-reveal-card"
          id="scratchRevealContent"
          ref={revealRef}
          aria-hidden={!revealed}
          tabIndex={-1}
          role="status"
        >
          <div className="reveal-date-big">{wedding.displayDate.toUpperCase()}</div>
          <div className="reveal-details"><span className="reveal-venue">{wedding.city}</span></div>
        </div>
        <canvas
          id="scratchCanvas"
          ref={canvasRef}
          className={`scratch-canvas${revealed ? ' is-revealed' : ''}`}
          role="button"
          tabIndex={revealed ? -1 : 0}
          aria-label={config.accessibleLabel}
          aria-hidden={revealed}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              reveal()
            }
          }}
          onPointerDown={(event) => {
            if (drawing.current !== null || completed.current) return
            drawing.current = event.pointerId
            lastPoint.current = null
            event.currentTarget.setPointerCapture(event.pointerId)
            scratch(event)
          }}
          onPointerMove={(event) => { if (drawing.current === event.pointerId) scratch(event) }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
        >
          {config.accessibleLabel}
        </canvas>
      </div>
      {celebrating && !reducedMotion && <Confetti onComplete={stopCelebrating} />}
    </>
  )
}
