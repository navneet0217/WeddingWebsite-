import { test, expect } from '@playwright/test'
import { sectionIds, viewports } from '../../scripts/viewports.mjs'
import { data, skipOpening, trackFailures } from './helpers.js'
import { coupleNames, invitationMetadata } from '../../src/utils/content.js'

for (const viewport of viewports) {
  test(`personalized invitation fits at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const failures = trackFailures(page)
    await skipOpening(page)
    await expect(page.locator('.groom-name')).toHaveText(data.couple.groom.name)
    await expect(page.locator('.bride-name')).toHaveText(data.couple.bride.name)
    await expect(page.locator('.message-person-name').first()).toHaveText(data.couple.groom.fullName)
    await expect(page.locator('.message-person-name').last()).toHaveText(data.couple.bride.fullName)
    await expect(page.locator('.footer-names')).toHaveText(coupleNames(data.couple))
    await expect(page.locator('.hashtag-text')).toHaveText(data.wedding.hashtag)
    await expect(page).toHaveTitle(invitationMetadata(data).title)
    await expect(page.locator('body')).not.toContainText(/Vinay|Archana|Yadav|Rewari|Lawan/)
    for (const [index, event] of data.events.items.entries()) {
      const card = page.locator('.event-timeline-card').nth(index)
      await expect(card).toContainText(event.name)
      await expect(card).toContainText(event.displayDate)
      await expect(card).toContainText(event.venue)
    }
    for (const id of sectionIds) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.locator(`#${id} img`).evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      )
    }
    for (const [containerSelector, contentSelector] of [
      ['.hero-safe', '.hero-center-content'],
      ['#messageStage', '.message-content'],
      ['#footerStage', '.footer-names'],
      ['#footerStage', '.hashtag-pill'],
    ]) {
      const fits = await page.evaluate(([containerSelector, contentSelector]) => {
        const container = document.querySelector(containerSelector).getBoundingClientRect()
        const content = document.querySelector(contentSelector).getBoundingClientRect()
        return content.left >= container.left - 1 && content.right <= container.right + 1 &&
          content.top >= container.top - 1 && content.bottom <= container.bottom + 1
      }, [containerSelector, contentSelector])
      expect(fits, `${contentSelector} fits at ${viewport.width}px`).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(failures).toEqual([])
  })
}
