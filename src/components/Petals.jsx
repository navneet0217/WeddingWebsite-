import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

export default function Petals({ active }) {
  const canvasRef = useRef(null)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (!active || reducedMotion) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      console.warn('Canvas is unavailable; decorative petals are disabled.')
      return
    }
    let frame
    let visible = true
    let previousTime
    let width
    let height
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      width = bounds.width
      height = bounds.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 0.9 + 0.4,
      speedX: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      petal: Math.random() > 0.4,
      opacity: Math.random() * 0.5 + 0.35,
      sway: Math.random() * 2,
    }))
    const draw = (time) => {
      const step = previousTime ? Math.min((time - previousTime) / 16.667, 2) : 1
      previousTime = time
      context.clearRect(0, 0, width, height)
      for (const particle of particles) {
        particle.y += particle.speedY * step
        particle.x += (Math.sin(particle.y * 0.02 + particle.sway) * 0.6 + particle.speedX) * step
        particle.rotation += particle.rotationSpeed * step
        if (particle.y > height + 20) {
          particle.y = -15
          particle.x = Math.random() * width
        }
        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation * Math.PI / 180)
        context.globalAlpha = particle.opacity
        const size = particle.size
        context.beginPath()
        if (particle.petal) {
          context.fillStyle = '#D6457F'
          context.moveTo(0, 0)
          context.bezierCurveTo(-size, -size * 0.6, -size * 0.6, size, 0, size * 1.3)
          context.bezierCurveTo(size * 0.6, size, size, -size * 0.6, 0, 0)
        } else {
          context.fillStyle = '#D9B65A'
          context.moveTo(0, -size * 0.5)
          context.lineTo(size * 0.4, 0)
          context.lineTo(0, size * 0.5)
          context.lineTo(-size * 0.4, 0)
          context.closePath()
        }
        context.fill()
        context.restore()
      }
      frame = requestAnimationFrame(draw)
    }
    const updatePlayback = () => {
      cancelAnimationFrame(frame)
      previousTime = undefined
      if (visible && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      updatePlayback()
    })
    observer.observe(canvas)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', updatePlayback)
    updatePlayback()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', updatePlayback)
    }
  }, [active, reducedMotion])
  return <canvas id="petalCanvas" className="stage-canvas" ref={canvasRef} aria-hidden="true" />
}
