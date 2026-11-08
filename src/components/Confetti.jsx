import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const colors = ['#B8923A', '#D9B65A', '#F5E2A8', '#D6457F', '#F08A74', '#F2A93B', '#6E9E73', '#F9D9C4', '#FFFFFF']
const bursts = [
  { delay: 0, x: 0.28, y: 0.65, count: 55, spread: 65, speed: 18, angle: -65 },
  { delay: 220, x: 0.72, y: 0.65, count: 55, spread: 65, speed: 18, angle: -115 },
  { delay: 440, x: 0.5, y: 0.45, count: 75, spread: 360, speed: 16, angle: 0 },
  { delay: 660, x: 0.15, y: 0.55, count: 50, spread: 75, speed: 17, angle: -55 },
  { delay: 880, x: 0.85, y: 0.55, count: 50, spread: 75, speed: 17, angle: -125 },
]

export default function Confetti({ onComplete }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      console.warn('Canvas is unavailable; celebratory confetti is disabled.')
      onComplete()
      return
    }
    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    context.scale(dpr, dpr)
    const particles = []
    let frame
    let previousTime
    const started = performance.now()
    const timers = bursts.map((burst) => window.setTimeout(() => {
      for (let index = 0; index < burst.count; index += 1) {
        const angle = (burst.angle - burst.spread / 2 + Math.random() * burst.spread) * Math.PI / 180
        const speed = burst.speed * (0.6 + Math.random() * 0.8)
        const circle = Math.random() < 0.35
        particles.push({
          x: width * burst.x, y: height * burst.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          gravity: 0.28 + Math.random() * 0.12,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1, fade: 0.007 + Math.random() * 0.008,
          rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 14,
          oscillation: Math.random() * Math.PI, oscillationSpeed: Math.random() * 0.1 + 0.05,
          shape: circle ? 'circle' : Math.random() < 0.3 ? 'sparkle' : 'ribbon',
        })
      }
    }, burst.delay))
    const draw = (time) => {
      const step = previousTime ? Math.min((time - previousTime) / 16.667, 2) : 1
      previousTime = time
      context.clearRect(0, 0, width, height)
      let active = 0
      for (const particle of particles) {
        if (particle.alpha <= 0) continue
        active += 1
        particle.vx *= 0.982 ** step
        particle.vy *= 0.982 ** step
        particle.vy += particle.gravity * step
        particle.x += (particle.vx + Math.sin(particle.oscillation) * 0.8) * step
        particle.y += particle.vy * step
        particle.oscillation += particle.oscillationSpeed * step
        particle.rotation += particle.rotationSpeed * step
        particle.alpha -= particle.fade * step
        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation * Math.PI / 180)
        context.globalAlpha = Math.max(0, particle.alpha)
        context.fillStyle = particle.color
        const size = particle.size
        if (particle.shape === 'circle') {
          context.beginPath()
          context.arc(0, 0, size / 2, 0, Math.PI * 2)
          context.fill()
        } else if (particle.shape === 'sparkle') {
          context.beginPath()
          context.moveTo(0, -size)
          context.quadraticCurveTo(0, 0, size, 0)
          context.quadraticCurveTo(0, 0, 0, size)
          context.quadraticCurveTo(0, 0, -size, 0)
          context.quadraticCurveTo(0, 0, 0, -size)
          context.fill()
        } else {
          context.fillRect(-size / 2, -size * 0.35, size, size * 0.7)
        }
        context.restore()
      }
      if ((active || time - started < 3500) && time - started < 6000) {
        frame = requestAnimationFrame(draw)
      } else onComplete()
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      timers.forEach(window.clearTimeout)
    }
  }, [onComplete])
  return createPortal(<canvas className="festive-confetti-canvas" ref={canvasRef} aria-hidden="true" />, document.body)
}
