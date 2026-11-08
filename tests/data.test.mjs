import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { validateWeddingData, localAssetPaths } from '../src/utils/validateWeddingData.js'
import { coupleNames, formatContent, invitationMetadata, invitationUrl } from '../src/utils/content.js'

const data = JSON.parse(await readFile(new URL('../src/data/wedding.json', import.meta.url), 'utf8'))

test('supplied wedding configuration is valid and all media is data-driven', () => {
  assert.equal(validateWeddingData(data), data)
  assert.equal(new Set(localAssetPaths(data)).size, 13)
})

test('configured invitation uses Rahul and Sakshi without reference family details', () => {
  assert.equal(data.couple.groom.name, 'Rahul Singh Chundawat')
  assert.equal(data.couple.bride.name, 'Sakshi Sisodiya')
  assert.equal(data.wedding.hashtag, '#RahulWedsSakshi')
  assert.doesNotMatch(JSON.stringify(data), /\b(Vinay|Archana|Yadav|Rewari|Lawan)\b/)
})

test('replacement names update generated titles, sharing text, and hashtag text', () => {
  const changed = structuredClone(data)
  changed.couple.groom.name = 'Amit Sharma'
  changed.couple.bride.name = 'Neha Rajput'
  changed.wedding.hashtag = '#AmitWedsNeha'
  validateWeddingData(changed)
  assert.equal(coupleNames(changed.couple), 'Amit Sharma & Neha Rajput')
  assert.match(invitationMetadata(changed).title, /^Amit Sharma & Neha Rajput/)
  assert.equal(formatContent(changed.footer.hashtagCopied, changed), 'Hashtag #AmitWedsNeha copied!')
})

test('configuration errors are explicit, not silently replaced with defaults', () => {
  for (const [modify, message] of [
    [(copy) => { copy.wedding.dateTime = 'not-a-date' }, /wedding.dateTime/],
    [(copy) => { copy.wedding.dateTime = '2026-02-30T19:00:00+05:30' }, /wedding.dateTime/],
    [(copy) => { copy.wedding.dateTime = '2026-12-20T19:00:00' }, /timezone/],
    [(copy) => { copy.music.volume = 2 }, /music.volume/],
    [(copy) => { copy.couple.groom.name = '' }, /couple.groom.name/],
    [(copy) => { copy.events.items[1].id = copy.events.items[0].id }, /unique/],
    [(copy) => { copy.events.items = [] }, /at least one/],
    [(copy) => { copy.events.items[0].mapUrl = 'javascript:alert(1)' }, /HTTP\(S\)/],
    [(copy) => { copy.hero.background.src = '/assets/../private.webp' }, /assets/],
    [(copy) => { copy.site.title = '{unknown}' }, /Unknown content placeholder/],
  ]) {
    const changed = structuredClone(data)
    modify(changed)
    assert.throws(() => validateWeddingData(changed), message)
  }
})

test('music and the video can be disabled without fake placeholder assets', () => {
  const changed = structuredClone(data)
  changed.music.enabled = false
  changed.music.source = ''
  changed.opening.enabled = false
  changed.opening.video = ''
  assert.equal(validateWeddingData(changed), changed)
})

test('sharing uses the current deployment instead of the original site or hash', () => {
  assert.equal(invitationUrl('', 'https://example.test/invite/?preview=1#footer'), 'https://example.test/invite/')
  assert.equal(invitationUrl('https://wedding.test/?guest=family', 'https://example.test'), 'https://wedding.test/?guest=family')
})

test('components and utilities contain no hardcoded reference wedding identities', async () => {
  for (const directory of ['components', 'hooks', 'utils']) {
    const base = new URL(`../src/${directory}/`, import.meta.url)
    for (const name of await readdir(base)) {
      const source = await readFile(new URL(name, base), 'utf8')
      assert.doesNotMatch(source, /\b(Vinay|Archana|Yadav|Rewari|Rahul|Sakshi|Chundawat|Sisodiya)\b/, name)
    }
  }
})
