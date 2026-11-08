export const viewports = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

export const referenceUrl = 'https://vinaywedsarchanaweddinginvite.netlify.app/'
export const snapshotTime = '2026-11-08T12:00:00.000Z'
export const sectionIds = ['hero', 'message', 'countdown', 'events', 'footer']
export const browserChannel =
  process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined)

export async function normalizeForComparison(page) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    document.querySelector('audio')?.pause()
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('in-view'))
  })
  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; }
      html, body, .page-container { scroll-behavior: auto !important; }
      .stage-canvas, .scratch-canvas, .toast-notification { visibility: hidden !important; }
      .hero-line { opacity: 1 !important; filter: none !important; transform: none !important; }
      .reveal { opacity: 1 !important; }
    `,
  })
}

export async function positionSection(page, id) {
  await page.locator(`#${id}`).evaluate((element) =>
    element.scrollIntoView({ block: 'start', behavior: 'instant' }),
  )
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  ))
}
