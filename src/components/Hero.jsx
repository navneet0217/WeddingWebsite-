import Stage from './Stage.jsx'
import Divider from './Divider.jsx'
import Icon from './Icon.jsx'
import Petals from './Petals.jsx'
import { useFitContent } from '../hooks/useFitContent.js'

export default function Hero({ config, couple, revealed }) {
  const { containerRef, contentRef } = useFitContent()
  return (
    <Stage id="hero" background={config.background} label={config.invitation} className={revealed ? 'hero-revealed' : ''}>
      <Petals active={revealed} />
      <div className="safe hero-safe" ref={containerRef}>
        <div className="hero-center-content" ref={contentRef}>
          <span className="sacred-shloka hero-shloka hero-line hero-line-1" lang="hi">{config.blessing}</span>
          <span className="hero-invite-tag hero-line hero-line-2">{config.invitation}</span>
          <div className="names-wrapper">
            <h1 id="hero-title" className="hero-names" tabIndex={-1}>
              <span className="groom-name hero-line hero-line-3">{couple.groom.name}</span>
              <span className="gold-ampersand hero-line hero-line-4">&amp;</span>
              <span className="bride-name hero-line hero-line-5">{couple.bride.name}</span>
            </h1>
          </div>
          <Divider className="hero-divider hero-line hero-line-6" />
          <p className="hero-invitation-text hero-line hero-line-7">{config.message}</p>
          <a href="#message" className="scroll-cue hero-line hero-line-8" aria-label={config.scrollAccessibleLabel}>
            <span className="scroll-cue-text">{config.scrollLabel}</span>
            <Icon name="down" className="scroll-arrow" />
          </a>
        </div>
      </div>
    </Stage>
  )
}
