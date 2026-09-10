/**
 * Generate favicon assets from apps/web/src/app/icon.svg.
 *
 * Run: `node apps/web/scripts/generate-favicons.mjs`
 *
 * Outputs:
 *   - apps/web/src/app/favicon.ico  (16x16 + 32x32 + 48x48, multi-size ICO)
 *   - apps/web/src/app/apple-icon.png  (180x180, apple-touch-icon)
 *   - apps/web/public/og-icon.png  (32x32 raster fallback for crawlers that
 *     don't parse SVG, mirrors /icon.svg semantics)
 *
 * Why a script and not an inline import: Next.js App Router does not
 * support a multi-size `favicon.ico` out of `app/icon.svg` — it
 * serves the SVG with `rel="icon" type="image/svg+xml"`. Browsers
 * and crawlers that request `/favicon.ico` by default (and the
 * tab/bookmark UI on some platforms) still expect a raster ICO.
 *
 * Re-run the script when `icon.svg` changes. The script is
 * idempotent: it overwrites the three target files.
 *
 * Dependencies: `sharp` is already a transitive dep in the monorepo
 * (pulled in by Next.js image optimization). No new package added.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, "..")
const sourceSvg = resolve(webRoot, "src/app/icon.svg")

// `sharp` is a transitive dep of `next@16` in this monorepo (used by
// the image optimization runtime), but pnpm does not hoist it into
// `apps/web/node_modules`. Importing via the absolute `.pnpm` path
// sidesteps the resolution issue without adding a new dep. ESM
// dynamic imports need a file:// URL on Windows; the raw path
// throws ERR_UNSUPPORTED_ESM_URL_SCHEME.
const sharp = (
  await import(
    pathToFileURL(
      resolve(
        webRoot,
        "../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js",
      ),
    ).href
  )
).default

const targets = [
  {
    path: resolve(webRoot, "src/app/favicon.ico"),
    pipeline: buildIco,
  },
  {
    path: resolve(webRoot, "src/app/apple-icon.png"),
    pipeline: (svg) => svg.resize(180, 180).png().toBuffer(),
  },
  {
    path: resolve(webRoot, "public/og-icon.png"),
    pipeline: (svg) => svg.resize(32, 32).png().toBuffer(),
  },
]

const svgBuffer = readFileSync(sourceSvg)

for (const target of targets) {
  mkdirSync(dirname(target.path), { recursive: true })
  const instance = sharp(svgBuffer, { density: 384 })
  const output = await target.pipeline(instance)
  writeFileSync(target.path, output)
  console.log(`wrote ${target.path} (${output.length} bytes)`)
}

/**
 * Build a multi-size ICO from the source SVG.
 *
 * The ICO container embeds PNG payloads (Windows Vista+ supports
 * PNG-in-ICO). We render the SVG to PNG at each size, then prepend
 * the ICO directory.
 *
 * Layout:
 *   - 6 bytes: ICONDIR  (reserved, type=1, count)
 *   - N * 16 bytes: ICONDIRENTRY  (one per size)
 *   - N * payload: PNG bytes per size
 */
async function buildIco(svg) {
  const sizes = [16, 32, 48]
  const pngs = await Promise.all(
    sizes.map(async (size) => ({
      size,
      png: await svg.resize(size, size).png().toBuffer(),
    })),
  )

  const headerSize = 6
  const entrySize = 16
  const dirSize = headerSize + entrySize * pngs.length
  const offsets = []
  let cursor = dirSize
  for (const { png } of pngs) {
    offsets.push(cursor)
    cursor += png.length
  }
  const total = cursor
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type 1 = ICO
  view.setUint16(4, pngs.length, true)

  // ICONDIRENTRY[]
  pngs.forEach(({ size, png }, i) => {
    const offset = headerSize + entrySize * i
    // Width/height: 0 means 256 in ICO, anything else is the literal.
    const w = size === 256 ? 0 : size
    out[offset + 0] = w
    out[offset + 1] = w
    out[offset + 2] = 0 // color count
    out[offset + 3] = 0 // reserved
    view.setUint16(offset + 4, 1, true) // color planes
    view.setUint16(offset + 6, 32, true) // bits per pixel
    view.setUint32(offset + 8, png.length, true)
    view.setUint32(offset + 12, offsets[i], true)
  })

  // PNG payloads
  pngs.forEach(({ png }, i) => {
    out.set(png, offsets[i])
  })

  return out
}