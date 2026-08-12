#!/usr/bin/env node
/**
 * Generates the site art via the Venice image API.
 *
 * Usage:  VENICE_API_KEY=... node scripts/gen-art.mjs [name ...]
 *
 * Output lands in public/art/. Generated assets are committed, so this only
 * needs re-running when the art direction changes.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const KEY = process.env.VENICE_API_KEY
if (!KEY) {
  console.error('VENICE_API_KEY is not set. Export it and re-run; never commit it.')
  process.exit(1)
}

const ENDPOINT = 'https://api.venice.ai/api/v1/image/generate'
const OUT_DIR = join(process.cwd(), 'public', 'art')

// Shared art direction so every asset reads as one set.
const LOOK =
  'pure clean white seamless studio background, soft even product lighting, ' +
  'crisp edges, high detail, centered composition, no text, no watermark, ' +
  'commercial product photography'

const ASSETS = [
  {
    name: 'hero-cat',
    aspect_ratio: '1:1',
    prompt:
      'A chubby silver tabby British Shorthair cat slouched back on its bottom ' +
      'with both hind legs splayed wide apart to the sides in a lazy human-like ' +
      'sit, front paws hanging forward, and its thick fluffy dark grey ringed ' +
      'tail rising straight up vertically from between the splayed hind legs, ' +
      'tail held stiff and proud and perfectly upright like a raised flagpole, ' +
      'pointing at the sky, round flat face, big amber-gold eyes staring deadpan ' +
      'straight into the camera with a smug unimpressed expression, cream and ' +
      'grey fur. ' + LOOK,
  },
  {
    name: 'hero-cat-alt',
    aspect_ratio: '1:1',
    prompt:
      'A fat grumpy grey and cream British Shorthair cat sitting slumped on its ' +
      'rump facing the camera, hind legs flopped open wide to either side, belly ' +
      'exposed, one thick bushy grey tail standing bolt upright dead center ' +
      'between its spread hind legs, rigid and vertical and unmissable, ' +
      'deadpan smug stare, flat squished face, comedic meme photo. ' + LOOK,
  },
  {
    name: 'tail-strap',
    aspect_ratio: '1:1',
    prompt:
      'A single fluffy dark grey and silver faux fur cat tail phone charm strap ' +
      'hanging from a black nylon loop cord with a polished silver metal clasp ' +
      'and a small black rectangular metal tag, tail curving in a soft banana ' +
      'shape, thick plush realistic fur texture. ' + LOOK,
  },
  {
    name: 'hoodie',
    aspect_ratio: '1:1',
    prompt:
      'A folded black premium heavyweight pullover hoodie laid flat, thick ' +
      'drawstrings, ribbed cuffs, a small blank green embroidered patch on the ' +
      'chest, streetwear quality cotton fleece texture. ' + LOOK,
  },
  {
    name: 'tshirt',
    aspect_ratio: '1:1',
    prompt:
      'A plain white heavyweight cotton t-shirt laid flat and neatly folded, ' +
      'crew neck, structured boxy streetwear cut, visible soft cotton weave ' +
      'texture, no print, no graphic. ' + LOOK,
  },
  {
    name: 'beanie',
    aspect_ratio: '1:1',
    prompt:
      'A dark charcoal grey ribbed knit beanie hat with two soft pointed cat ' +
      'ears knitted into the top, chunky wool cable knit texture, cuffed brim, ' +
      'sitting upright. ' + LOOK,
  },
  {
    name: 'keychain',
    aspect_ratio: '1:1',
    prompt:
      'A tiny miniature fluffy grey faux fur cat tail keychain charm attached to ' +
      'a polished silver split key ring with a small lobster clasp, short stubby ' +
      'plush tail, soft fur detail. ' + LOOK,
  },
  {
    name: 'gloves',
    aspect_ratio: '1:1',
    prompt:
      'A pair of sleek black tactical gloves laid flat side by side, palms and ' +
      'fingertips covered in a faceted crystalline diamond-cut texture that ' +
      'catches light with prismatic sparkle, matte black fabric back. ' + LOOK,
  },
]

async function generate(asset) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'seedream-v5-pro',
      prompt: asset.prompt,
      aspect_ratio: asset.aspect_ratio,
      format: 'png',
      safe_mode: false,
      return_binary: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`${asset.name}: HTTP ${res.status} ${await res.text()}`)
  }

  const body = await res.json()
  const b64 = body.images?.[0]
  if (!b64) throw new Error(`${asset.name}: no image in response`)

  const file = join(OUT_DIR, `${asset.name}.png`)
  await writeFile(file, Buffer.from(b64, 'base64'))
  console.log(`✓ ${asset.name}.png`)
}

const only = process.argv.slice(2)
const queue = only.length ? ASSETS.filter((a) => only.includes(a.name)) : ASSETS

await mkdir(OUT_DIR, { recursive: true })
for (const asset of queue) {
  try {
    await generate(asset)
  } catch (err) {
    console.error(`✗ ${err.message}`)
    process.exitCode = 1
  }
}
