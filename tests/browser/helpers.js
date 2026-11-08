import { expect } from '@playwright/test'
import data from '../../src/data/wedding.json' with { type: 'json' }

export { data }

export async function openInvitation(page, { navigate = true } = {}) {
  if (navigate) await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await page.getByRole('button', { name: data.opening.accessibleLabel }).click()
  await expect(page.locator('#entranceOverlay')).toHaveCount(0, { timeout: 20000 })
  await expect(page.locator('#hero')).toHaveClass(/hero-revealed/)
}

export async function skipOpening(page) {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await page.getByRole('button', { name: data.opening.skipLabel }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#entranceOverlay')).toHaveCount(0)
}

export async function replaceData(page, modified) {
  await page.route(/\/src\/data\/wedding\.json(?:\?|$)/, (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `export default ${JSON.stringify(modified)};`,
  }))
}

export function trackFailures(page) {
  const failures = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
  })
  return failures
}
