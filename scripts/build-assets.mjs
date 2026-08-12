#!/usr/bin/env node
/**
 * Derives every brand asset from the one source logo.
 *
 *   node scripts/build-assets.mjs [path-to-logo]
 *
 * Produces:
 *   public/art/logo.png        full logo, white knocked out
 *   public/art/tail-cursor.png the tail alone, used as the mouse cursor
 *   app/icon.png               favicon (Next serves app/icon.png automatically)
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = process.argv[2] || join(process.cwd(), 'assets', 'logo-source.jpg')
const ART = join(process.cwd(), 'public', 'art')
const APP = join(process.cwd(), 'app')

/**
 * Knock out the studio background so the cat floats on any colour.
 *
 * Thresholding on brightness alone also eats the cat's own cream belly and
 * white paws, which are nearly as bright as the backdrop. The backdrop is
 * instead identified structurally: it is the bright region *connected to the
 * frame edge*. Flood filling inward from the border removes it and leaves
 * enclosed light fur intact.
 */
async function transparentize(input, { threshold = 238 } = {}) {
  const img = sharp(input).ensureAlpha()
  const { width, height } = await img.metadata()
  const raw = await img.raw().toBuffer()

  const bright = (p) =>
    raw[p] >= threshold && raw[p + 1] >= threshold && raw[p + 2] >= threshold

  const seen = new Uint8Array(width * height)
  const stack = []

  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1)
  }

  while (stack.length) {
    const px = stack.pop()
    if (seen[px]) continue
    const p = px * 4
    if (!bright(p)) continue

    seen[px] = 1
    raw[p + 3] = 0

    const x = px % width
    const y = (px / width) | 0
    if (x > 0) stack.push(px - 1)
    if (x < width - 1) stack.push(px + 1)
    if (y > 0) stack.push(px - width)
    if (y < height - 1) stack.push(px + width)
  }

  // Soften the boundary: an opaque pixel touching a removed one gets partial
  // alpha, so the silhouette doesn't come out with hard stair-stepped edges.
  const alpha = new Uint8Array(width * height)
  for (let px = 0; px < width * height; px++) alpha[px] = raw[px * 4 + 3]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const px = y * width + x
      if (alpha[px] === 0) continue
      if (
        alpha[px - 1] === 0 ||
        alpha[px + 1] === 0 ||
        alpha[px - width] === 0 ||
        alpha[px + width] === 0
      ) {
        raw[px * 4 + 3] = 150
      }
    }
  }

  return sharp(raw, { raw: { width, height, channels: 4 } }).png()
}

await mkdir(ART, { recursive: true })

const meta = await sharp(SRC).metadata()
const W = meta.width
const H = meta.height
console.log(`source ${W}x${H}`)

// 1. Full logo, background removed, trimmed to the cat.
await (await transparentize(SRC)).trim({ threshold: 1 }).toFile(join(ART, 'logo.png'))
console.log('✓ public/art/logo.png')

// 2. The tail, isolated. The tail is dark grey and everything it overlaps
//    (body, hind legs, backdrop) is cream-to-white, so keying on luminance
//    separates it far more cleanly than a rectangular crop can.
async function keepDark(input, cutoff) {
  const img = sharp(input).ensureAlpha()
  const { width, height } = await img.metadata()
  const raw = await img.raw().toBuffer()

  for (let i = 0; i < raw.length; i += 4) {
    const lum = 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]
    if (lum > cutoff) raw[i + 3] = 0
    else if (lum > cutoff - 22) raw[i + 3] = 140
  }

  return sharp(raw, { raw: { width, height, channels: 4 } }).png()
}

// Photo-keying the tail out of the logo leaves fur noise that reads as dirt
// at cursor size, so the cursor is drawn as a vector modelled on that tail.
// keepDark stays available for pulling the tail out at poster sizes.
void keepDark

await sharp(join(process.cwd(), 'assets', 'tail-cursor.svg'))
  .resize({ height: 48, fit: 'inside' })
  .png()
  .toFile(join(ART, 'tail-cursor.png'))
console.log('✓ public/art/tail-cursor.png')

// A larger one for the trailing cursor-follower on desktop.
await sharp(join(process.cwd(), 'assets', 'tail-cursor.svg'))
  .resize({ height: 96, fit: 'inside' })
  .png()
  .toFile(join(ART, 'tail-large.png'))
console.log('✓ public/art/tail-large.png')

// 3. Favicon: square crop around the cat, padded so it reads at 16px.
await (await transparentize(SRC))
  .trim({ threshold: 1 })
  .resize(448, 448, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({
    top: 32,
    bottom: 32,
    left: 32,
    right: 32,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(join(APP, 'icon.png'))
console.log('✓ app/icon.png')
