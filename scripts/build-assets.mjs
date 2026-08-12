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

// keepDark stays available for pulling the tail out of the logo at poster
// sizes, where the fur detail survives.
void keepDark

// 3. Product shots come off the generator on a near-white studio sweep that
//    reads as a visible grey square against the page. Same edge flood fill,
//    with a lower cutoff since that sweep is dimmer than the logo's backdrop.
//    cutout:false for products that are themselves white. A white tee on a
//    white sweep has no boundary for the fill to stop at, so keying it erases
//    the garment and leaves only its shadows. Those ship as-is; being white on
//    white, the untouched backdrop is invisible against the page anyway.
const PRODUCTS = [
  { name: 'tail-strap', cutout: true },
  { name: 'hoodie', cutout: true },
  { name: 'tshirt', cutout: false },
  { name: 'beanie', cutout: true },
  { name: 'keychain', cutout: true },
  { name: 'gloves', cutout: true },
]

//    Raw generator output is kept in assets/raw/ and never written to, so this
//    stays repeatable and a bad key doesn't cost a regeneration.
const RAW = join(process.cwd(), 'assets', 'raw')

for (const { name, cutout } of PRODUCTS) {
  const src = join(RAW, `${name}.png`)
  const dest = join(ART, `${name}.png`)
  try {
    if (cutout) {
      const cut = await transparentize(src, { threshold: 228 })
      await cut.trim({ threshold: 1 }).toFile(dest)
      console.log(`✓ public/art/${name}.png (background removed)`)
    } else {
      await sharp(src).toFile(dest)
      console.log(`✓ public/art/${name}.png (kept as shot)`)
    }
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`)
  }
}

// 4. Mouse cursor: the fur off the strap, which is already cut out by the step
//    above. A drawn tail read as a microphone at this size — a straight
//    tapered cylinder is exactly that silhouette — so this uses the real fur.
//    The cord, chrome ferrule and tag are cropped off, and the whole thing is
//    turned so the narrow tip leads, giving the pointer something to aim with.
{
  const strap = join(ART, 'tail-strap.png')
  const { width, height } = await sharp(strap).metadata()

  // The cord, ferrule and tag all sit above the fur, and the tail sweeps out
  // to the right, so this crops by height only — narrowing it would clip the
  // tip off the curve.
  const top = Math.round(height * 0.5)
  const fur = await sharp(strap)
    .extract({ left: 0, top, width, height: height - top })
    .trim({ threshold: 1 })
    .toBuffer()

  await sharp(fur)
    .resize({ height: 46, fit: 'inside' })
    .png()
    .toFile(join(ART, 'tail-cursor.png'))
  console.log('✓ public/art/tail-cursor.png')

  await sharp(fur)
    .resize({ height: 96, fit: 'inside' })
    .png()
    .toFile(join(ART, 'tail-large.png'))
  console.log('✓ public/art/tail-large.png')
}

// 5. Favicon: square crop around the cat, padded so it reads at 16px.
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
