import { createReadStream, copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The upstream dataset's geometry/ folder (repo root) is the single source of
// truth for the GeoJSON shapes. Instead of committing a second copy under
// public/, serve it at /data/geometry/ in dev and copy it into the build output.
const GEOMETRY_SRC = fileURLToPath(new URL('../geometry', import.meta.url))
const GEOMETRY_URL = '/data/geometry'

function geometryFromRepoRoot() {
  let outDir
  let logger

  return {
    name: 'geometry-from-repo-root',

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      logger = config.logger
    },

    configureServer(server) {
      server.middlewares.use(GEOMETRY_URL, (req, res, next) => {
        let name
        try {
          name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname.slice(1))
        } catch {
          return next()
        }
        // Only plain "<id>.geojson" file names; no subfolders or traversal.
        if (!name.endsWith('.geojson') || basename(name) !== name) return next()
        const file = join(GEOMETRY_SRC, name)
        if (!existsSync(file)) return next()
        res.setHeader('Content-Type', 'application/geo+json')
        createReadStream(file).pipe(res)
      })
    },

    writeBundle() {
      const dest = join(outDir, 'data', 'geometry')
      mkdirSync(dest, { recursive: true })
      let copied = 0
      for (const f of readdirSync(GEOMETRY_SRC)) {
        if (!f.endsWith('.geojson')) continue
        copyFileSync(join(GEOMETRY_SRC, f), join(dest, f))
        copied++
      }
      logger.info(`geometry: copied ${copied} GeoJSON files from ../geometry`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geometryFromRepoRoot()],
})
