export default function Divider({ className = '' }) {
  return (
    <div className={`gold-filigree-divider ${className}`.trim()} aria-hidden="true">
      <span className="divider-line" />
      <span className="divider-gem">&#10070;</span>
      <span className="divider-line" />
    </div>
  )
}
