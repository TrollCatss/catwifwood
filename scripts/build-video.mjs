#!/usr/bin/env node
/**
 * Derives the wardrobe assets from the source clip.
 *
 *   node scripts/build-video.mjs [path-to-source.mp4]
 *
 * Produces:
 *   public/art/tail-wears.webm     primary source
 *   public/art/tail-wears.mp4      fallback source
 *   public/art/tail-wears-poster.jpg
 *   public/art/scenes/<name>.jpg   one still per scene, for the grid
 *
 * The clip morphs between scenes rather than cutting, so ffmpeg's scene
 * detection finds nothing to split on. Stills are sampled on a fixed interval
 * instead, tuned to land mid-scene rather than mid-morph.
 */
import { mkdir, readdir, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'

const SRC = process.argv[2] || join(process.cwd(), 'assets', 'raw', 'tail-wears.mp4')
const ART = join(process.cwd(), 'public', 'art')
const SCENES = join(ART, 'scenes')
const TMP = join(process.cwd(), 'assets', 'raw', 'scenes')

// Scene order in the clip. Rename here if the source is recut.
const NAMES = [
  'snow',
  'summit',
  'beach',
  'autumn',
  'city',
  'pool',
  'villa',
  'kitchen',
  'western',
]

const SAMPLE_FPS = 1.5 // ~one frame per scene across the six seconds
const WIDTH = 700 // it renders at max-w-2xl; encoding larger just wastes bytes

const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args])

await mkdir(SCENES, { recursive: true })
await mkdir(TMP, { recursive: true })

// WebM is listed first in the markup: some Chromium builds ship without the
// proprietary H.264 decoder and would otherwise fall back to the poster.
run(['-i', SRC, '-vf', `scale=${WIDTH}:-2`, '-c:v', 'libvpx-vp9', '-b:v', '0',
  '-crf', '42', '-row-mt', '1', '-an', '-y', join(ART, 'tail-wears.webm')])
console.log('✓ public/art/tail-wears.webm')

run(['-i', SRC, '-vf', `scale=${WIDTH}:-2`, '-c:v', 'libx264', '-crf', '30',
  '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
  '-y', join(ART, 'tail-wears.mp4')])
console.log('✓ public/art/tail-wears.mp4')

await rm(TMP, { recursive: true, force: true })
await mkdir(TMP, { recursive: true })
run(['-i', SRC, '-vf', `fps=${SAMPLE_FPS}`, '-q:v', '2', join(TMP, 's%02d.jpg')])

const frames = (await readdir(TMP)).filter((f) => f.endsWith('.jpg')).sort()
if (frames.length !== NAMES.length) {
  console.warn(
    `! sampled ${frames.length} frames but have ${NAMES.length} names; ` +
      'adjust SAMPLE_FPS or NAMES so they line up',
  )
}

for (let i = 0; i < Math.min(frames.length, NAMES.length); i++) {
  const out = join(SCENES, `${NAMES[i]}.jpg`)
  await sharp(join(TMP, frames[i]))
    .resize(760, 760, { fit: 'cover' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out)
  console.log(`✓ public/art/scenes/${NAMES[i]}.jpg`)
}

await sharp(join(TMP, frames[0]))
  .resize(WIDTH, WIDTH, { fit: 'cover' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(join(ART, 'tail-wears-poster.jpg'))
console.log('✓ public/art/tail-wears-poster.jpg')
