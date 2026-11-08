import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import {
  browserChannel,
  normalizeForComparison,
  positionSection,
  referenceUrl,
  sectionIds,
  snapshotTime,
  viewports,
} from './viewports.mjs'

const root = path.resolve('inspection')
const selectors = [
  'body', '.page-container', '.page-section', '.stage', '.stage-bg',
  '.entrance-overlay', '.entrance-video', '.entrance-prompt', '.entrance-btn-label',
  '.hero-safe', '.hero-shloka', '.hero-invite-tag', '.hero-names', '.gold-ampersand',
  '.hero-divider', '.hero-invitation-text', '.scroll-cue',
  '.message-safe', '.message-content', '.message-ganesh-img', '.message-shloka-line',
  '.message-lead', '.message-person-name', '.message-person-lineage', '.message-closing-quote',
  '.upper-arch-zone', '.countdown-safe', '.section-title', '.safe-caption',
  '.scratch-card-wrapper', '.scratch-canvas', '.reveal-date-big',
  '.countdown-label', '.countdown-grid', '.countdown-tile', '.countdown-num',
  '#eventsStage', '.events-safe', '.events-header', '.events-timeline-container',
  '.event-art-frame', '.event-art-img', '.event-day-pill', '.event-ceremony-title',
  '.event-datetime-badge', '.event-meta-box', '.meta-row', '.grand-crown-ribbon',
  '.event-floral-divider', '.event-divider-img', '.events-merger-divider',
  '#footerStage', '.footer-thank-you', '.footer-names', '.hashtag-pill',
  '.footer-blessing-text', '.footer-action-buttons', '.btn-footer-action',
  '.footer-credit', '.floating-music-btn',
]
const properties = [
  'display', 'position', 'width', 'height', 'min-height', 'max-height', 'max-width',
  'top', 'right', 'bottom', 'left', 'margin', 'padding', 'gap', 'overflow',
  'flex-direction', 'align-items', 'justify-content', 'container-type',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'text-align', 'color', 'background', 'background-image',
  'border', 'border-radius', 'box-shadow', 'object-fit', 'object-position',
  'opacity', 'z-index', 'transform', 'transition', 'animation',
]

for (const directory of [
  'dom', 'styles', 'network', 'assets', 'fonts',
  'screenshots/mobile', 'screenshots/desktop', 'screenshots/sections', 'screenshots/baselines',
]) {
  await mkdir(path.join(root, directory), { recursive: true })
}

const json = (file, value) =>
  writeFile(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`)
const browser = await chromium.launch({ channel: browserChannel, headless: true })
const resources = new Map()
const results = []

async function inspect(viewport) {
  const { width } = viewport
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Kolkata',
  })
  const page = await context.newPage()
  const messages = []
  const requests = []
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      messages.push({ type: message.type(), text: message.text() })
    }
  })
  page.on('pageerror', (error) => messages.push({ type: 'pageerror', text: error.message }))
  page.on('requestfailed', (request) => {
    requests.push({ url: request.url(), failure: request.failure()?.errorText })
  })
  page.on('response', (response) => {
    const request = response.request()
    const entry = {
      url: response.url(),
      type: request.resourceType(),
      status: response.status(),
      contentType: response.headers()['content-type'],
      contentLength: response.headers()['content-length'],
    }
    resources.set(entry.url, entry)
    requests.push(entry)
  })
  try {
    await page.clock.setFixedTime(new Date(snapshotTime))
    await page.goto(referenceUrl, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => {
      const video = document.querySelector('video')
      return video.readyState >= 2 && !video.seeking
    })
    const category = width <= 768 ? 'mobile' : 'desktop'
    const screenshot = (name, options = {}) => page.screenshot({
      path: path.join(root, 'screenshots', category, `${width}-${name}.png`),
      ...options,
    })
    await screenshot('opening')
    await page.mouse.move(0, 0)
    await page.screenshot({
      path: path.join(root, 'screenshots', 'baselines', `${width}-opening.png`),
      animations: 'disabled',
    })
    const initialMedia = await page.evaluate(() => ({
      video: {
        duration: document.querySelector('video').duration,
        paused: document.querySelector('video').paused,
        muted: document.querySelector('video').muted,
        width: document.querySelector('video').videoWidth,
        height: document.querySelector('video').videoHeight,
      },
      audio: {
        paused: document.querySelector('audio').paused,
        loop: document.querySelector('audio').loop,
        muted: document.querySelector('audio').muted,
      },
    }))
    await page.locator('#entrancePrompt').click()
    if ([390, 1440].includes(width)) {
      await page.waitForTimeout(1400)
      await screenshot('opening-playing')
      await page.waitForTimeout(3000)
      await screenshot('opening-dissolve')
    }
    await page.locator('#entranceOverlay').waitFor({ state: 'hidden', timeout: 20000 })
    await page.waitForTimeout(1400)
    await screenshot('hero')

    for (const id of sectionIds) {
      await positionSection(page, id)
      await page.waitForTimeout(1150)
      await page.locator(`#${id}`).screenshot({
        path: path.join(root, 'screenshots', 'sections', `${width}-${id}.png`),
      })
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await screenshot('full', { fullPage: true })

    const evidence = await page.evaluate(({ selectors, properties }) => {
      const bounds = (element) => {
        const rect = element.getBoundingClientRect()
        return { x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height }
      }
      const styles = Object.fromEntries(selectors.map((selector) => [
        selector,
        [...document.querySelectorAll(selector)].map((element) => ({
          bounds: bounds(element),
          styles: Object.fromEntries(properties.map((property) => [
            property, getComputedStyle(element).getPropertyValue(property),
          ])),
        })),
      ]))
      const body = document.body.cloneNode(true)
      body.querySelectorAll('script').forEach((script) => script.remove())
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_COMMENT)
      const comments = []
      while (walker.nextNode()) comments.push(walker.currentNode)
      comments.forEach((comment) => comment.remove())
      return {
        title: document.title,
        html: body.outerHTML,
        sections: [...document.querySelectorAll('section')].map((section) => ({
          id: section.id,
          bounds: bounds(section),
          stage: bounds(section.querySelector('.stage')),
          text: section.innerText,
        })),
        styles,
        images: [...document.images].filter((image) => image.getAttribute('src')).map((image) => ({
          url: image.currentSrc,
          alt: image.alt,
          width: image.naturalWidth,
          height: image.naturalHeight,
          loaded: image.complete && image.naturalWidth > 0,
        })),
        fonts: [...new Set([...document.querySelectorAll('body *')].map(
          (element) => getComputedStyle(element).fontFamily,
        ))],
        links: [...document.querySelectorAll('a')].map((link) => ({
          text: link.innerText, href: link.getAttribute('href'),
        })),
        musicAfterOpening: {
          paused: document.querySelector('audio').paused,
          loop: document.querySelector('audio').loop,
          volume: document.querySelector('audio').volume,
          source: document.querySelector('audio').currentSrc,
        },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      }
    }, { selectors, properties })
    await writeFile(path.join(root, 'dom', `${width}.html`), evidence.html)
    await json(`styles/${width}.json`, evidence.styles)
    await json(`network/${width}.json`, { requests, messages })
    await json(`assets/${width}.json`, evidence.images)
    await json(`fonts/${width}.json`, evidence.fonts)

    await page.mouse.move(0, 0)
    await positionSection(page, 'countdown')
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await page.locator('#scratchWrapper').screenshot({
      path: path.join(root, 'screenshots', 'baselines', `${width}-scratch-foil.png`),
      animations: 'disabled',
    })
    await normalizeForComparison(page)
    for (const id of sectionIds) {
      await positionSection(page, id)
      await page.locator(`#${id}`).screenshot({
        path: path.join(root, 'screenshots', 'baselines', `${width}-${id}.png`),
        animations: 'disabled',
      })
    }
    results.push({
      viewport, initialMedia, sections: evidence.sections, links: evidence.links,
      musicAfterOpening: evidence.musicAfterOpening,
      horizontalOverflow: evidence.horizontalOverflow, messages,
    })
    console.log(`Captured reference ${width}x${viewport.height}: opening, five sections, full page, baselines.`)
  } finally {
    await context.close()
  }
}

try {
  const queue = [...viewports]
  await Promise.all(Array.from({ length: 2 }, async () => {
    while (queue.length) await inspect(queue.shift())
  }))
  await json('report.json', {
    referenceUrl,
    inspectedAt: new Date().toISOString(),
    snapshotTime,
    timezone: 'Asia/Kolkata',
    sectionInventory: [
      { id: 'opening', purpose: '4.243-second, user-initiated video, 2-second bloom/dissolve into hero; scroll locked.' },
      { id: 'hero', purpose: 'Uncropped watercolor arch, gold script names, eight staggered lines, canvas petals/sparkles, scroll link.' },
      { id: 'message', purpose: 'Floating Ganesh artwork, Sanskrit blessing, family names and invitation on watercolor stationery.' },
      { id: 'countdown', purpose: 'Gold canvas scratch card, 45-percent reveal threshold, five confetti bursts, four-part live countdown.' },
      { id: 'events', purpose: 'Continuous three-event illustrated timeline, floral separators, highlighted main wedding ceremony.' },
      { id: 'footer', purpose: 'Blessing, thank-you, couple names, copyable hashtag, native-share/clipboard fallback, back-to-top.' },
    ],
    absentFromRenderedReference: ['couple photos', 'story', 'gallery', 'RSVP form', 'map links', 'navigation menu'],
    layout: {
      mobileBreakpoint: 768,
      portraitAspectRatio: 0.55815,
      mobile: 'Full-width, contiguous portrait stages; events and footer are content-height.',
      desktop: 'Portrait invitation centered inside full-viewport ivory letterboxing; not a wide desktop redesign.',
    },
    music: {
      file: 'Aaj-Sajeya.mp3',
      starts: 'When the entrance video finishes and dissolve begins.',
      loop: true,
      volume: 1,
      control: 'Fixed top-right 44px button, rotating dashed ring and animated equalizer while playing.',
      persistence: 'Continues while scrolling; no saved preference across page reloads.',
    },
    baselineNormalization: [
      'Date fixed at snapshotTime; timers still run.',
      'CSS transitions and animations disabled after all scroll reveals.',
      'Pointer parked outside content and instant scrolling settled before section captures.',
      'Scratch foil compared separately after font loading and a reference canvas redraw.',
      'Particle canvas, scratch foil, and transient toast hidden only in comparison baselines.',
      'Audio paused so the music icon is deterministic.',
    ],
    viewports: results.sort((a, b) => a.viewport.width - b.viewport.width),
  })
  await json('assets/inventory.json', [...resources.values()].sort((a, b) => a.url.localeCompare(b.url)))
  console.log(`Inspection complete: ${results.length} viewports; ${resources.size} network resources.`)
} finally {
  await browser.close()
}
