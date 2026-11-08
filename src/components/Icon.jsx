export default function Icon({ name, size = 16, className }) {
  const chevron = name === 'down' || name === 'up'
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={name === 'music' ? 'currentColor' : 'none'}
      stroke={name === 'music' ? undefined : 'currentColor'}
      strokeWidth={name === 'music' ? undefined : 2}
      strokeLinecap={chevron ? 'round' : undefined}
      strokeLinejoin={chevron ? 'round' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {name === 'down' && <polyline points="6 9 12 15 18 9" />}
      {name === 'up' && <polyline points="18 15 12 9 6 15" />}
      {name === 'clock' && <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
      {name === 'location' && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}
      {name === 'share' && <>
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </>}
      {name === 'music' && <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />}
    </svg>
  )
}
