import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

export default function Opening({ config, onReveal, onClosed, notify }) {
  const videoRef = useRef(null)
  const closing = useRef(false)
  const closeTimer = useRef(null)
  const [phase, setPhase] = useState('ready')
  const [videoFailed, setVideoFailed] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    if (location.hash) history.replaceState(null, '', location.pathname + location.search)
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.body.classList.add('scroll-locked')
    return () => {
      window.clearTimeout(closeTimer.current)
      document.body.classList.remove('scroll-locked')
      history.scrollRestoration = previousRestoration
    }
  }, [])

  const dissolve = useCallback(() => {
    if (closing.current) return
    closing.current = true
    videoRef.current?.pause()
    setPhase('dissolving')
    onReveal()
    closeTimer.current = window.setTimeout(onClosed, reducedMotion ? 0 : 2200)
  }, [onReveal, onClosed, reducedMotion])

  useEffect(() => {
    if (phase !== 'playing') return
    const duration = videoRef.current.duration
    const timeout = window.setTimeout(() => {
      console.error('The opening video stalled; opening the invitation directly.')
      notify('The opening video could not finish. Opening the invitation directly.')
      dissolve()
    }, (Number.isFinite(duration) ? duration + 8 : 18) * 1000)
    return () => window.clearTimeout(timeout)
  }, [phase, dissolve, notify])

  const start = async () => {
    if (phase !== 'ready' || closing.current) return
    if (videoFailed || reducedMotion) {
      dissolve()
      return
    }
    setPhase('playing')
    const video = videoRef.current
    try {
      video.muted = false
      await video.play()
    } catch (error) {
      if (closing.current || error.name === 'AbortError') return
      console.warn('Opening video playback with sound was blocked.', error)
      try {
        video.muted = true
        await video.play()
        notify('The opening video is playing without sound.')
      } catch (mutedError) {
        console.error('Opening video could not play.', mutedError)
        notify('The opening video is unavailable. Opening the invitation directly.')
        dissolve()
      }
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      dissolve()
    } else if (event.key === 'Tab') {
      const buttons = [...event.currentTarget.querySelectorAll('button:not([disabled])')]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      id="entranceOverlay"
      className={`entrance-overlay${phase === 'dissolving' ? ' dissolving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={config.dialogLabel}
      onClick={() => { if (phase === 'ready') void start() }}
      onKeyDown={onKeyDown}
    >
      <div className="entrance-video-container">
        <video
          ref={videoRef}
          id="entranceVideo"
          className="entrance-video"
          src={`${config.video}#t=0.001`}
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => { event.currentTarget.currentTime = 0.001 }}
          onEnded={dissolve}
          onError={() => {
            console.error('Opening video failed to load.', videoRef.current?.error)
            setVideoFailed(true)
            notify('The opening video is unavailable. You can still open the invitation.')
            if (phase === 'playing') dissolve()
          }}
        />
      </div>
      <button
        id="entrancePrompt"
        className={`entrance-prompt${phase !== 'ready' ? ' hidden' : ''}`}
        type="button"
        aria-label={config.accessibleLabel}
        disabled={phase !== 'ready'}
        onClick={(event) => { event.stopPropagation(); void start() }}
      >
        <span className="entrance-pill">
          <span className="entrance-pill-sparkle" aria-hidden="true">&#10022;</span>
          <span className="entrance-btn-label">{videoFailed ? config.fallbackLabel : config.label}</span>
          <span className="entrance-pill-sparkle" aria-hidden="true">&#10022;</span>
        </span>
      </button>
      <button
        className="entrance-skip keyboard-only"
        type="button"
        onClick={(event) => { event.stopPropagation(); dissolve() }}
      >
        {config.skipLabel}
      </button>
      <div className={`entrance-bloom${phase === 'dissolving' ? ' bloom-active' : ''}`} aria-hidden="true" />
    </div>
  )
}
