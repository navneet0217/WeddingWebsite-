import { useCallback, useEffect, useRef, useState } from 'react'

export function useAudio(config, notify) {
  const audioRef = useRef(null)
  const requestId = useRef(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = config.volume
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => {
      console.error('Background music failed to load.', audio.error)
      notify(config.errorMessage)
      setPlaying(false)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    audio.addEventListener('error', onError)
    return () => {
      requestId.current += 1
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
    }
  }, [config.enabled, config.source, config.volume, config.errorMessage, notify])

  const play = useCallback(async () => {
    if (!config.enabled || !audioRef.current) return false
    const id = ++requestId.current
    try {
      await audioRef.current.play()
      return id === requestId.current
    } catch (error) {
      if (error.name === 'AbortError' || id !== requestId.current) return false
      if (error.name === 'NotAllowedError') {
        console.info('Music requires a direct user gesture.', error)
        notify(config.blockedMessage)
      } else {
        console.error('Background music could not play.', error)
        notify(config.errorMessage)
      }
      return false
    }
  }, [config.enabled, config.blockedMessage, config.errorMessage, notify])

  const toggle = useCallback(async () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      if (await play()) notify(config.playingMessage)
    } else {
      requestId.current += 1
      audioRef.current.pause()
      notify(config.pausedMessage)
    }
  }, [play, config.playingMessage, config.pausedMessage, notify])

  return { audioRef, playing, play, toggle }
}
