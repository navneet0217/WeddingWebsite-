import { Fragment } from 'react'
import Stage from './Stage.jsx'
import ScratchCard from './ScratchCard.jsx'
import { useCountdown } from '../hooks/useCountdown.js'

export default function Countdown({ config, wedding }) {
  const countdown = useCountdown(wedding.dateTime)
  const units = ['days', 'hours', 'minutes', 'seconds']
  return (
    <Stage id="countdown" background={config.background} label={config.title}>
      <div className="upper-arch-zone reveal stagger-1">
        <span className="small-caps-tag">{config.eyebrow}</span>
      </div>
      <div className="safe countdown-safe">
        <div className="scratch-section-header reveal stagger-1">
          <h2 className="section-title">{config.title}</h2>
          <p className="safe-caption">{config.description}</p>
        </div>
        <ScratchCard config={config} wedding={wedding} />
        <div className="countdown-container reveal stagger-3">
          <div className="countdown-label">{config.countdownLabel}</div>
          {!countdown.expired ? (
            <div className="countdown-grid" id="countdownGrid" role="timer" aria-label={config.countdownLabel}>
              {units.map((unit, index) => (
                <Fragment key={unit}>
                  {index > 0 && <span className="countdown-colon" aria-hidden="true">:</span>}
                  <div className="countdown-tile">
                    <span className="countdown-num" data-unit={unit}>{String(countdown[unit]).padStart(2, '0')}</span>
                    <span className="countdown-unit">{config.units[unit]}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          ) : <div className="countdown-celebration" role="status">{config.expiredMessage}</div>}
        </div>
      </div>
    </Stage>
  )
}
