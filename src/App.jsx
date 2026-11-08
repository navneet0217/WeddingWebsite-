import { useCallback, useEffect, useRef, useState } from 'react'
import Opening from './components/Opening.jsx'
import Hero from './components/Hero.jsx'
import Invitation from './components/Invitation.jsx'
import Countdown from './components/Countdown.jsx'
import Events from './components/Events.jsx'
import Footer from './components/Footer.jsx'
import Music from './components/Music.jsx'
import Toast from './components/Toast.jsx'
import { useAudio } from './hooks/useAudio.js'
import { useReveal } from './hooks/useReveal.js'
import { useToast } from './hooks/useToast.js'
import { invitationMetadata } from './utils/content.js'

export default function App({ data }) {
  const [revealed, setRevealed] = useState(!data.opening.enabled)
  const [opening, setOpening] = useState(data.opening.enabled)
  const mainRef = useRef(null)
  const { message, notify } = useToast()
  const { audioRef, playing, play, toggle } = useAudio(data.music, notify)
  useReveal(mainRef)

  const reveal = useCallback(() => {
    setRevealed(true)
    if (data.music.autoplay) void play()
  }, [data.music.autoplay, play])

  const closeOpening = useCallback(() => {
    setOpening(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
    requestAnimationFrame(() => document.getElementById('hero-title')?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (!data.opening.enabled && data.music.autoplay) void play()
  }, [data.opening.enabled, data.music.autoplay, play])

  useEffect(() => {
    const metadata = invitationMetadata(data)
    document.title = metadata.title
    for (const [selector, value] of [
      ['meta[name="description"]', metadata.description],
      ['meta[property="og:title"]', metadata.title],
      ['meta[property="og:description"]', metadata.description],
      ['meta[property="og:image"]', metadata.image],
    ]) document.querySelector(selector)?.setAttribute('content', value)
    document.querySelector('link[rel="icon"]')?.setAttribute('href', data.site.favicon)
  }, [data])

  return (
    <>
      {opening && (
        <Opening config={data.opening} onReveal={reveal} onClosed={closeOpening} notify={notify} />
      )}
      <main id="pageContainer" className="page-container" ref={mainRef} inert={opening}>
        <Hero config={data.hero} couple={data.couple} revealed={revealed} />
        <Invitation config={data.message} couple={data.couple} />
        <Countdown config={data.dateReveal} wedding={data.wedding} />
        <Events config={data.events} />
        <Footer data={data} notify={notify} />
      </main>
      {data.music.enabled && (
        <Music config={data.music} audioRef={audioRef} playing={playing} onToggle={toggle} disabled={opening} />
      )}
      <Toast message={message} />
    </>
  )
}
