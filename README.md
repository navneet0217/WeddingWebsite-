# Wedding invitation

A static React + Vite invitation with the supplied artwork, opening video, scratch-card date reveal, countdown, and background music.

## Run

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

## Customize

Edit [src/data/wedding.json](src/data/wedding.json). Names, family messages, dates, events, venues, hashtag, sharing metadata, and media paths all come from this file.

- The invitation is personalized for **Rahul Singh Chundawat and Sakshi Sisodiya**.
- The wedding date/time (**20 December 2026, 7:00 PM IST**) and Haldi date/time (**18 December 2026, 11:00 AM**) are **sample values from the supplied brief, not confirmed bookings**.
- Venue details and the Lagan date are marked **to be confirmed**. Parent names were not supplied, so the invitation uses family blessings instead.
- Set `wedding.dateTime` with an explicit timezone. Update `wedding.displayDate` and the event dates/times alongside it.
- Set `wedding.websiteUrl` after deployment, or leave it empty to share the current site's address.
- Add an event's `mapUrl` to display its location link. Empty optional times, addresses, and links stay hidden.
- Replace media under [public/assets](public/assets) and update the corresponding JSON paths. Preserve the fonts' included OFL licenses.
- Music starts after the opening video; browsers that block playback show a prompt to use the music button. `music.enabled`, `autoplay`, `loop`, `volume`, and `source` are configurable.

## Validate

```sh
npm test
npm run lint
npm run test:e2e
npm run build
```

Browser tests verify the personalized content at all ten requested widths (320-1920px), touch/keyboard scratching, music, sharing, and failure handling. They do not require downloaded reference screenshots.

On Windows the browser tests use Microsoft Edge. On other platforms, install Chromium with `npx playwright install chromium` if Playwright reports that it is missing. `PLAYWRIGHT_CHANNEL` can override the browser channel.

For an optional fresh comparison against the live reference:

```sh
npm run test:visual
```

This regenerates the ignored `inspection/` folder and compares 70 screenshots using isolated reference content from [tests/fixtures/reference-content.json](tests/fixtures/reference-content.json). Reference identities are never bundled into the application. `inspection/`, `test-results/`, and `dist/` are generated output and can be removed after validation.

## Deploy to Netlify

[netlify.toml](netlify.toml) sets the build command to `npm run build` and the publish directory to `dist`. No backend or database is required. The site uses section anchors rather than client-side routes, so no SPA rewrite is needed.

`npm run build` validates the JSON and all configured local asset paths before building. Page title and share-preview metadata are generated from the same JSON.
