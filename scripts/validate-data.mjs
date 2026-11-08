import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { localAssetPaths, validateWeddingData } from '../src/utils/validateWeddingData.js'

try {
  const data = JSON.parse(await readFile(new URL('../src/data/wedding.json', import.meta.url), 'utf8'))
  validateWeddingData(data)
  const assets = [...new Set(localAssetPaths(data))]
  const missing = []
  for (const asset of assets) {
    const file = path.resolve('public', `.${decodeURIComponent(asset)}`)
    if (!file.startsWith(`${path.resolve('public', 'assets')}${path.sep}`)) {
      throw new Error(`Asset path escapes public/assets: ${asset}`)
    }
    try {
      await access(file)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      missing.push(asset)
    }
  }
  if (missing.length) throw new Error(`Missing configured assets:\n${missing.join('\n')}`)
  console.log(`Wedding JSON is valid; all ${assets.length} configured local assets exist.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
