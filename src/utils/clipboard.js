export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      console.warn('Clipboard permission unavailable; trying browser copy.', error)
    }
  }
  const previousFocus = document.activeElement
  const input = document.createElement('textarea')
  input.value = text
  input.className = 'sr-only'
  input.setAttribute('readonly', '')
  document.body.append(input)
  try {
    input.select()
    if (!document.execCommand('copy')) {
      throw new Error('The browser did not allow copying to the clipboard.')
    }
  } finally {
    input.remove()
    previousFocus?.focus({ preventScroll: true })
  }
}
