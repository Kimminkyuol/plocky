/**
 * Post-build script: copies Blockly files from src/plocky/ to dist/blockly/
 * Run automatically after `vite build` via package.json build script.
 */
import { cpSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')

const src = join(root, 'src', 'plocky')
const dest = join(root, 'dist', 'blockly')

if (!existsSync(src)) {
  console.error('src/plocky directory not found - skipping Blockly copy')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
mkdirSync(join(dest, 'msg'), { recursive: true })

const filesToCopy = [
  ['blockly_compressed.js', 'blockly_compressed.js'],
  ['blocks_compressed.js', 'blocks_compressed.js'],
  ['java_compressed.js', 'java_compressed.js'],
  [join('msg', 'messages.js'), join('msg', 'messages.js')],
]

for (const [from, to] of filesToCopy) {
  const srcFile = join(src, from)
  const destFile = join(dest, to)
  if (existsSync(srcFile)) {
    cpSync(srcFile, destFile)
    console.log(`  copied: ${from} -> dist/blockly/${to}`)
  } else {
    console.warn(`  warning: ${srcFile} not found, skipping`)
  }
}

console.log('Blockly files copied to dist/blockly/')
