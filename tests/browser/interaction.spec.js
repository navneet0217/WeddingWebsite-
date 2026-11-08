import { test, expect } from '@playwright/test'
import { data, openInvitation, replaceData, skipOpening, trackFailures } from './helpers.js'
import { invitationMetadata } from '../../src/utils/content.js'

test.use({ viewport: { width: 390, height: 844 } })

test('opening video, dissolve, music, scrolling, pause/resume, and loop work together', async ({ page }) => {
  const failures = trackFailures(page)
  await page.goto('/')
  await expect(page.locator('body')).toHaveClass(/scroll-locked/)
  await expect(page.locator('main')).toHaveAttribute('inert', '')
  expect(await page.locator('video').evaluate((video) => video.paused)).toBe(true)
  expect(await page.locator('audio').evaluate((audio) => audio.paused)).toBe(true)
  await page.getByRole('button', { name: data.opening.accessibleLabel }).click()
  await expect.poll(() => page.locator('video').evaluate((video) => video.paused)).toBe(false)
  expect(await page.locator('audio').evaluate((audio) => audio.paused)).toBe(true)
  await expect(page.locator('#entranceOverlay')).toHaveClass(/dissolving/, { timeout: 10000 })
  expect(await page.locator('#entranceOverlay').evaluate((element) =>
    parseFloat(getComputedStyle(element).transitionDuration))).toBe(2)
  await expect(page.locator('#entranceOverlay')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveClass(/scroll-locked/)
  await expect(page.locator('main')).not.toHaveAttribute('inert', '')
  await expect(page.locator('#musicToggleBtn')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.music-disc-ring')).toHaveCSS('animation-name', 'discSpin')
  const playingTime = await page.locator('audio').evaluate((audio) => audio.currentTime)
  await page.locator('#footer').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('audio').evaluate((audio) => audio.currentTime)).toBeGreaterThan(playingTime)
  await page.getByRole('button', { name: data.music.pauseLabel }).click()
  await expect(page.locator('#musicToggleBtn')).toHaveAttribute('aria-pressed', 'false')
  expect(await page.locator('audio').evaluate((audio) => audio.paused)).toBe(true)
  await page.getByRole('button', { name: data.music.playLabel }).click()
  await expect(page.locator('#musicToggleBtn')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.locator('audio').evaluate((audio) => audio.loop)).toBe(true)
  await page.locator('audio').evaluate((audio) => { audio.currentTime = audio.duration - 0.15 })
  await expect.poll(() => page.locator('audio').evaluate((audio) => audio.currentTime)).toBeLessThan(2)
  await page.getByRole('link', { name: data.footer.backToTopLabel }).click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2)
  expect(failures).toEqual([])
})

test('scratch progress survives resize, reveals the date, and fires viewport confetti', async ({ page }) => {
  await skipOpening(page)
  const wrapper = page.locator('#scratchWrapper')
  const canvas = page.locator('#scratchCanvas')
  await wrapper.scrollIntoViewIfNeeded()
  await expect(wrapper).toHaveCSS('opacity', '1')
  const bounds = await canvas.boundingBox()
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await expect(wrapper).toHaveAttribute('data-revealed', 'false')
  const progress = () => canvas.evaluate((element) => {
    const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data
    let clear = 0
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] < 128) clear += 1
    return clear / (pixels.length / 4)
  })
  const initialProgress = await progress()
  expect(initialProgress).toBeGreaterThan(0)
  expect(initialProgress).toBeLessThan(0.45)
  await page.setViewportSize({ width: 430, height: 932 })
  await expect.poll(progress).toBeGreaterThan(initialProgress * 0.9)
  await wrapper.scrollIntoViewIfNeeded()
  const resized = await canvas.boundingBox()
  await page.evaluate(() => {
    window.confettiObserved = false
    const observer = new MutationObserver(() => {
      if (document.querySelector('body > .festive-confetti-canvas')) {
        window.confettiObserved = true
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true })
  })
  await page.mouse.move(resized.x + 10, resized.y + 10)
  await page.mouse.down()
  for (let row = 10; row < resized.height; row += 30) {
    await page.mouse.move(resized.x + resized.width - 10, resized.y + row, { steps: 12 })
    await page.mouse.move(resized.x + 10, resized.y + row + 15, { steps: 12 })
  }
  await page.mouse.up()
  await expect(wrapper).toHaveAttribute('data-revealed', 'true')
  await expect(canvas).toHaveCSS('opacity', '0')
  await expect(page.locator('#scratchRevealContent')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.locator('#scratchRevealContent')).toContainText(data.wedding.displayDate.toUpperCase())
  await expect.poll(() => page.evaluate(() => window.confettiObserved)).toBe(true)
  await expect(page.locator('.festive-confetti-canvas')).toHaveCount(0, { timeout: 8000 })
  await page.setViewportSize({ width: 320, height: 568 })
  await expect(wrapper).toHaveAttribute('data-revealed', 'true')
})

test('keyboard opening and date reveal honor reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator('#entrancePrompt')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#entranceOverlay')).toHaveCount(0)
  const scratch = page.locator('#scratchCanvas')
  await scratch.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#scratchWrapper')).toHaveAttribute('data-revealed', 'true')
  await expect(page.locator('#scratchRevealContent')).toBeFocused()
  await expect(page.locator('.festive-confetti-canvas')).toHaveCount(0)
  await expect(page.locator('.scroll-arrow')).toHaveCSS('animation-duration', '1e-05s')
})

test('JSON-only replacement supports a different couple, four events, and optional map links', async ({ page }) => {
  const changed = structuredClone(data)
  changed.opening.enabled = false
  changed.music.autoplay = false
  changed.couple.groom = {
    name: 'Amit Sharma', fullName: 'Amit Sharma',
    parents: 'With the blessings of the Sharma family',
  }
  changed.couple.bride = {
    name: 'Neha Rajput', fullName: 'Neha Rajput',
    parents: 'With the blessings of the Rajput family',
  }
  changed.wedding = {
    dateTime: '2026-12-20T19:00:00+05:30', displayDate: 'Sunday, 20 December 2026',
    city: 'Udaipur, Rajasthan', hashtag: '#AmitWedsNeha', websiteUrl: '',
  }
  changed.footer.message = 'With warm love and blessings from the Sharma and Rajput families.'
  changed.events.items = changed.events.items.map((event) => ({
    ...event,
    venue: 'Family Celebration Venue, Udaipur, Rajasthan',
    address: 'A longer venue address that must wrap without requiring any CSS changes',
    displayDate: '20 December 2026', time: '7:00 PM',
    mapUrl: 'https://maps.google.com/?q=Udaipur',
  }))
  changed.events.items.push({
    ...changed.events.items[0], id: 'reception', name: 'Reception',
    dayLabel: 'Day 4 - Reception', featured: false, highlightLabel: '',
  })
  await replaceData(page, changed)
  await page.setViewportSize({ width: 320, height: 568 })
  const failures = trackFailures(page)
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.groom-name')).toHaveText(changed.couple.groom.name)
  await expect(page.locator('.bride-name')).toHaveText(changed.couple.bride.name)
  await expect(page.locator('.message-person-name').first()).toHaveText(changed.couple.groom.fullName)
  await expect(page.locator('.footer-names')).toHaveText('Amit Sharma & Neha Rajput')
  await expect(page).toHaveTitle('Amit Sharma & Neha Rajput \u2014 Wedding Invitation')
  await expect(page.locator('.event-timeline-card')).toHaveCount(4)
  await expect(page.locator('.event-map').first()).toHaveAttribute('href', 'https://maps.google.com/?q=Udaipur')
  await expect(page.locator('.reveal-date-big')).toHaveText(changed.wedding.displayDate.toUpperCase())
  await expect(page.locator('body')).not.toContainText(/Rahul|Sakshi|Chundawat|Sisodiya/)
  for (const [outer, inner] of [
    ['.hero-safe', '.hero-center-content'],
    ['#messageStage', '.message-content'],
  ]) {
    await page.locator(inner).scrollIntoViewIfNeeded()
    await expect(page.locator(inner)).toHaveCSS('opacity', '1')
    const fits = await page.evaluate(([outer, inner]) => {
      const container = document.querySelector(outer).getBoundingClientRect()
      const content = document.querySelector(inner).getBoundingClientRect()
      return content.left >= container.left - 1 && content.right <= container.right + 1 &&
        content.top >= container.top - 1 && content.bottom <= container.bottom + 1
    }, [outer, inner])
    expect(fits, `${inner} should fit its stationery frame`).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(failures).toEqual([])
})

test('hashtag and invitation sharing copy the configured content, not the reference URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async (text) => { window.copiedText = text } },
    })
  })
  await skipOpening(page)
  await page.locator('#hashtagPill').click()
  expect(await page.evaluate(() => window.copiedText)).toBe(data.wedding.hashtag)
  await expect(page.locator('#toastNotification')).toContainText('copied!')
  await page.locator('#shareBtn').click()
  expect(await page.evaluate(() => window.copiedText)).toBe('http://127.0.0.1:5173/')
  await expect(page.locator('#toastNotification')).toHaveText(data.footer.linkCopied)
})

test('native sharing uses current JSON metadata and handles user cancellation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true, value: async (details) => {
        window.sharedInvitation = details
        throw new DOMException('User cancelled sharing', 'AbortError')
      },
    })
  })
  await skipOpening(page)
  await page.locator('#shareBtn').click()
  const metadata = invitationMetadata(data)
  expect(await page.evaluate(() => window.sharedInvitation)).toEqual({
    title: metadata.title,
    text: metadata.description,
    url: 'http://127.0.0.1:5173/',
  })
  await expect(page.locator('#toastNotification')).toHaveText('')
})

test('blocked clipboard reports failure instead of claiming the text was copied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError') } },
    })
    document.execCommand = () => false
  })
  await skipOpening(page)
  await page.locator('#hashtagPill').click()
  await expect(page.locator('#toastNotification')).toContainText('blocked copying')
  await expect(page.locator('#toastNotification')).not.toContainText('copied!')
})

test('unavailable video keeps a usable direct-open button and never traps scrolling', async ({ page }) => {
  await page.route('**/assets/video/entrance.mp4', (route) => route.fulfill({ status: 404, body: '' }))
  await page.goto('/')
  await expect(page.locator('.entrance-btn-label')).toHaveText(data.opening.fallbackLabel)
  await page.locator('#entrancePrompt').click()
  await expect(page.locator('#entranceOverlay')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveClass(/scroll-locked/)
  await expect(page.locator('#hero')).toHaveClass(/hero-revealed/)
})

test('blocked music autoplay stays paused and a later direct tap starts it', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play
    let blocked = false
    HTMLMediaElement.prototype.play = function () {
      if (this.tagName === 'AUDIO' && !blocked) {
        blocked = true
        return Promise.reject(new DOMException('Requires gesture', 'NotAllowedError'))
      }
      return original.call(this)
    }
  })
  await openInvitation(page)
  await expect(page.locator('#musicToggleBtn')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('#toastNotification')).toHaveText(data.music.blockedMessage)
  await page.getByRole('button', { name: data.music.playLabel }).click()
  await expect(page.locator('#musicToggleBtn')).toHaveAttribute('aria-pressed', 'true')
})

test('disabled media and an expired date are driven entirely by JSON', async ({ page }) => {
  const changed = structuredClone(data)
  changed.opening.enabled = false
  changed.opening.video = ''
  changed.music.enabled = false
  changed.music.source = ''
  changed.wedding.dateTime = '2020-12-20T19:00:00+05:30'
  await replaceData(page, changed)
  await page.goto('/')
  await expect(page.locator('#entranceOverlay')).toHaveCount(0)
  await expect(page.locator('audio')).toHaveCount(0)
  await expect(page.locator('#musicToggleBtn')).toHaveCount(0)
  await expect(page.locator('#countdownGrid')).toHaveCount(0)
  await expect(page.locator('.countdown-celebration')).toHaveText(changed.dateReveal.expiredMessage)
})

test.describe('touch input', () => {
  test.use({ hasTouch: true, deviceScaleFactor: 2 })

  test('high-DPI mobile touch gestures scratch and reveal the date', async ({ page, context }) => {
    await skipOpening(page)
    const wrapper = page.locator('#scratchWrapper')
    await wrapper.scrollIntoViewIfNeeded()
    await expect(wrapper).toHaveCSS('opacity', '1')
    const bounds = await page.locator('#scratchCanvas').boundingBox()
    const session = await context.newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x: bounds.x + 12, y: bounds.y + 12 }],
    })
    for (let row = 15; row < bounds.height - 15; row += 25) {
      for (let column = 15; column < bounds.width - 15; column += 15) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: bounds.x + column, y: bounds.y + row }],
        })
      }
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(wrapper).toHaveAttribute('data-revealed', 'true')
    await expect(page.locator('#scratchCanvas')).toHaveCSS('opacity', '0')
    await session.detach()
  })
})
