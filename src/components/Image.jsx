import { useState } from 'react'

export default function Image({ src, alt, onLoad, ...props }) {
  const [failed, setFailed] = useState(false)
  return (
    <>
      <img
        {...props}
        src={src}
        alt={alt}
        onLoad={(event) => {
          setFailed(false)
          onLoad?.(event)
        }}
        onError={() => {
          console.error(`Invitation image could not load: ${src}`)
          setFailed(true)
        }}
      />
      {failed && <span className="asset-error" role="alert">Image unavailable: {alt || src}</span>}
    </>
  )
}
