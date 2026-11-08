import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { invitationMetadata } from './src/utils/content.js'
import { validateWeddingData } from './src/utils/validateWeddingData.js'

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'json-invitation-metadata',
      transformIndexHtml(html) {
        const data = JSON.parse(readFileSync(new URL('./src/data/wedding.json', import.meta.url), 'utf8'))
        validateWeddingData(data)
        const metadata = invitationMetadata(data)
        return html
          .replaceAll('__INVITATION_TITLE__', escapeHtml(metadata.title))
          .replaceAll('__INVITATION_DESCRIPTION__', escapeHtml(metadata.description))
          .replaceAll('__INVITATION_IMAGE__', escapeHtml(metadata.image))
          .replaceAll('__INVITATION_ICON__', escapeHtml(data.site.favicon))
      },
    },
  ],
})
