export default function Toast({ message }) {
  return (
    <div
      id="toastNotification"
      className={`toast-notification${message ? ' active' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  )
}
