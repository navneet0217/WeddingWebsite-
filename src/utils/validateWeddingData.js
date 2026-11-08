import { formatContent } from './content.js'

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

export function validateWeddingData(data) {
  if (!isObject(data)) throw new Error('Wedding configuration must be a JSON object.')
  const errors = []
  const get = (path) => path.split('.').reduce((value, key) => value?.[key], data)
  const text = (path, optional = false) => {
    const value = get(path)
    if (typeof value !== 'string' || (!optional && !value.trim())) {
      errors.push(`${path} must be ${optional ? 'a string' : 'a non-empty string'}.`)
    }
  }
  const boolean = (path) => {
    if (typeof get(path) !== 'boolean') errors.push(`${path} must be true or false.`)
  }
  const url = (path, optional = false, asset = false) => {
    text(path, optional)
    const value = get(path)
    if (typeof value !== 'string' || (optional && !value)) return
    if (asset && value.startsWith('/assets/') && !value.split('/').includes('..')) return
    try {
      const parsed = new URL(value)
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
    } catch {
      errors.push(`${path} must be ${asset ? 'a /assets/ path or ' : ''}an HTTP(S) URL.`)
    }
  }
  const image = (path) => {
    url(`${path}.src`, false, true)
    text(`${path}.alt`, true)
  }
  for (const person of ['groom', 'bride']) {
    for (const key of ['name', 'fullName', 'parents']) text(`couple.${person}.${key}`)
  }
  for (const path of [
    'site.title', 'site.description', 'wedding.dateTime', 'wedding.displayDate',
    'wedding.city', 'wedding.hashtag', 'opening.label', 'opening.accessibleLabel',
    'opening.dialogLabel', 'opening.skipLabel', 'opening.fallbackLabel',
    'hero.blessing', 'hero.invitation', 'hero.message', 'hero.scrollLabel',
    'hero.scrollAccessibleLabel', 'message.invitation', 'message.quote',
    'dateReveal.eyebrow', 'dateReveal.title', 'dateReveal.description',
    'dateReveal.foilLabel', 'dateReveal.foilSubtitle', 'dateReveal.accessibleLabel',
    'dateReveal.countdownLabel', 'dateReveal.expiredMessage',
    'events.title', 'events.description', 'events.mapLabel',
    'footer.blessing', 'footer.title', 'footer.message', 'footer.credit',
    'footer.shareLabel', 'footer.backToTopLabel', 'footer.copyHashtagLabel',
    'footer.hashtagCopied', 'footer.linkCopied',
    'music.playLabel', 'music.pauseLabel', 'music.playingMessage', 'music.pausedMessage',
    'music.blockedMessage', 'music.errorMessage',
  ]) text(path)
  for (const unit of ['days', 'hours', 'minutes', 'seconds']) text(`dateReveal.units.${unit}`)
  for (const path of ['opening.enabled', 'music.enabled', 'music.autoplay', 'music.loop']) boolean(path)
  for (const path of [
    'hero.background', 'message.background', 'message.illustration',
    'dateReveal.background', 'footer.background', 'events.divider', 'events.merger',
  ]) image(path)
  url('site.favicon', false, true)
  url('wedding.websiteUrl', true)
  url('opening.video', !data.opening?.enabled, true)
  url('music.source', !data.music?.enabled, true)
  if (!Number.isFinite(data.music?.volume) || data.music.volume < 0 || data.music.volume > 1) {
    errors.push('music.volume must be a number between 0 and 1.')
  }
  const dateTime = data.wedding?.dateTime
  const isoPattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
  const validDate = typeof dateTime === 'string' && isoPattern.test(dateTime) &&
    Number.isFinite(Date.parse(dateTime)) &&
    new Date(`${dateTime.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) === dateTime.slice(0, 10)
  if (!validDate) {
    errors.push('wedding.dateTime must be a valid ISO date-time with a timezone, such as 2026-12-20T19:00:00+05:30.')
  }
  if (!Array.isArray(data.message?.blessing) || !data.message.blessing.length ||
      data.message.blessing.some((line) => typeof line !== 'string' || !line.trim())) {
    errors.push('message.blessing must be a non-empty array of text lines.')
  }
  if (!Array.isArray(data.events?.items) || !data.events.items.length) {
    errors.push('events.items must contain at least one event.')
  } else {
    const ids = new Set()
    data.events.items.forEach((event, index) => {
      const path = `events.items.${index}`
      for (const key of ['id', 'name', 'dayLabel', 'displayDate', 'venue']) text(`${path}.${key}`)
      for (const key of ['time', 'address', 'highlightLabel']) text(`${path}.${key}`, true)
      boolean(`${path}.featured`)
      image(`${path}.image`)
      url(`${path}.mapUrl`, true)
      if (isObject(event)) {
        if (ids.has(event.id)) errors.push(`${path}.id must be unique.`)
        ids.add(event.id)
        if (event.featured && !event.highlightLabel?.trim()) {
          errors.push(`${path}.highlightLabel is required for a featured event.`)
        }
      }
    })
  }
  if (errors.length) throw new Error(`Invalid wedding configuration:\n${errors.join('\n')}`)
  for (const template of [
    data.site.title, data.site.description, data.footer.copyHashtagLabel, data.footer.hashtagCopied,
  ]) formatContent(template, data)
  return data
}

export function localAssetPaths(value) {
  if (typeof value === 'string') return value.startsWith('/assets/') ? [value] : []
  if (Array.isArray(value)) return value.flatMap(localAssetPaths)
  if (isObject(value)) return Object.values(value).flatMap(localAssetPaths)
  return []
}
