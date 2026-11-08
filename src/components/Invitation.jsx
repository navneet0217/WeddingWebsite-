import Stage from './Stage.jsx'
import Image from './Image.jsx'
import Divider from './Divider.jsx'
import { useFitContent } from '../hooks/useFitContent.js'

export default function Invitation({ config, couple }) {
  const { containerRef, contentRef } = useFitContent({ allowSafeOverflow: true })
  return (
    <Stage id="message" background={config.background} label={config.invitation}>
      <div className="safe message-safe" ref={containerRef}>
        <div className="message-content reveal stagger-1" ref={contentRef}>
          <div className="message-ganesh-wrapper">
            <Image {...config.illustration} className="message-ganesh-img" loading="lazy" decoding="async" />
          </div>
          <div className="message-shloka-block" lang="hi">
            {config.blessing.map((line, index) => <p className="message-shloka-line" key={index}>{line}</p>)}
          </div>
          <p className="message-lead">{config.invitation}</p>
          <div className="couple-block">
            <h2 className="message-person-name">{couple.groom.fullName}</h2>
            <p className="message-person-lineage">{couple.groom.parents}</p>
          </div>
          <div className="message-connector">&amp;</div>
          <div className="couple-block">
            <h2 className="message-person-name">{couple.bride.fullName}</h2>
            <p className="message-person-lineage">{couple.bride.parents}</p>
          </div>
          <Divider className="mini message-divider" />
          <p className="message-closing-quote">{config.quote}</p>
        </div>
      </div>
    </Stage>
  )
}
