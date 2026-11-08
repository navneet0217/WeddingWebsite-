import { test, expect } from '@playwright/test'
import { normalizeForComparison, positionSection, sectionIds, snapshotTime, viewports } from '../../scripts/viewports.mjs'
import { data, openInvitation, replaceData, trackFailures } from './helpers.js'
import reference from '../fixtures/reference-content.json' with { type: 'json' }

const referenceData = {
  ...data,
  couple: reference.couple,
  wedding: reference.wedding,
  events: {
    ...data.events,
    items: data.events.items.map((event, index) => ({ ...event, ...reference.events[index] })),
  },
  footer: { ...data.footer, message: reference.footerMessage },
}

for (const viewport of viewports) {
  test(`matches the reference at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.clock.setFixedTime(new Date(snapshotTime))
    await replaceData(page, referenceData)
    const failures = trackFailures(page)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => {
      const video = document.querySelector('video')
      return video.readyState >= 2 && !video.seeking
    })
    await page.mouse.move(0, 0)
    await expect(page).toHaveScreenshot(`${viewport.width}-opening.png`, {
      animations: 'disabled', maxDiffPixelRatio: 0.005, threshold: 0.2,
    })
    await openInvitation(page, { navigate: false })
    for (const id of sectionIds) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.locator(`#${id} img`).evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      )
    }
    await page.mouse.move(0, 0)
    await positionSection(page, 'countdown')
    await expect(page.locator('#scratchWrapper')).toHaveScreenshot(`${viewport.width}-scratch-foil.png`, {
      animations: 'disabled', maxDiffPixelRatio: 0.005, threshold: 0.2,
    })
    await normalizeForComparison(page)
    for (const id of sectionIds) {
      await positionSection(page, id)
      await expect(page.locator(`#${id}`)).toHaveScreenshot(`${viewport.width}-${id}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.005,
        threshold: 0.2,
      })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(failures).toEqual([])
  })
}
