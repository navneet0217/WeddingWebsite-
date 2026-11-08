import { useState } from 'react'
import Image from './Image.jsx'

export default function Stage({ id, background, label, className = '', children }) {
  const [ratio, setRatio] = useState('0.55815')
  const style = { '--ar': ratio }
  return (
    <section id={id} className={`page-section ${className}`.trim()} style={style} aria-label={label}>
      <div id={`${id}Stage`} className="stage" style={style}>
        {background && (
          <Image
            {...background}
            className="stage-bg"
            loading={id === 'hero' ? 'eager' : 'lazy'}
            fetchPriority={id === 'hero' ? 'high' : undefined}
            decoding="async"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget
              setRatio((naturalWidth / naturalHeight).toFixed(5))
            }}
          />
        )}
        {children}
      </div>
    </section>
  )
}
