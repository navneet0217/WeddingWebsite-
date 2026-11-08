import Icon from './Icon.jsx'

export default function Music({ config, audioRef, playing, onToggle, disabled }) {
  return (
    <>
      <audio id="bgMusicAudio" ref={audioRef} src={config.source} loop={config.loop} preload="auto" />
      <button
        id="musicToggleBtn"
        className={`floating-music-btn ${playing ? 'is-playing' : 'is-muted'}`}
        type="button"
        aria-label={playing ? config.pauseLabel : config.playLabel}
        aria-pressed={playing}
        disabled={disabled}
        onClick={() => void onToggle()}
      >
        <span className="music-disc-ring" aria-hidden="true" />
        <span className="music-icon-wrap" aria-hidden="true">
          {[1, 2, 3, 4].map((bar) => <span className={`eq-bar eq-bar-${bar}`} key={bar} />)}
          <Icon name="music" className="music-note-icon" size={19} />
        </span>
      </button>
    </>
  )
}
