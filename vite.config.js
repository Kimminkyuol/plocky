import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, join } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-blockly-files',
      configureServer(server) {
        server.middlewares.use('/blockly', (req, res, next) => {
          const url = req.url.split('?')[0]
          const filePath = join(__dirname, 'src', 'plocky', url.slice(1))
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache')
            createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
      generateBundle() {
        // Blockly files are copied via vite-plugin-static-copy or manually
        // See scripts/copy-blockly.mjs for production build
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  assetsInclude: ['**/*.xml'],
  build: {
    outDir: 'dist',
    target: 'es2020'
  }
})
