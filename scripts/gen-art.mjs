#!/usr/bin/env node
/**
 * Generates the site art via the Venice image API.
 *
 * Usage:  VENICE_API_KEY=... node scripts/gen-art.mjs [name ...]
 *
 * Output lands in assets/raw/. Run build-assets.mjs afterwards to process it
 * into public/art/. Both are committed, so this only needs re-running when the
 * art direction changes.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const KEY = process.env.VENICE_API_KEY
if (!KEY) {
  console.error('VENICE_API_KEY is not set. Export it and re-run; never commit it.')
  process.exit(1)
}

const ENDPOINT = 'https://api.venice.ai/api/v1/image/generate'
// Raw generator output. scripts/build-assets.mjs post-processes these into
// public/art/ (background removal), so this directory is never served directly.
const OUT_DIR = join(process.cwd(), 'assets', 'raw')

// Shared art direction so every asset reads as one set.
const LOOK =
  'pure clean white seamless studio background, soft even product lighting, ' +
  'crisp edges, high detail, centered composition, no text, no watermark, ' +
  'commercial product photography'

const ASSETS = [
  {
    name: 'tail-strap',
    aspect_ratio: '1:1',
    prompt:
      'A single thick plush dark grey and silver faux fur cat tail phone charm ' +
      'hanging vertically from a thin black nylon cord loop at the top, the fur ' +
      'tail capped by a polished chrome cylindrical ferrule where the cord ' +
      'meets it, a small blank black rectangular metal tag hanging beside it on ' +
      'a split ring, the tail thick and heavy and tapering into a smooth gentle ' +
      'banana curve that sweeps down and to the right, dense realistic plush ' +
      'fur texture with visible individual hairs. ' + LOOK,
  },
  {
    name: 'wood-block',
    aspect_ratio: '1:1',
    prompt:
      'A single solid rectangular block of polished dark walnut hardwood ' +
      'standing upright on end like a monolith, rich deep chocolate brown grain ' +
      'with visible growth rings, satin oiled finish catching a soft highlight ' +
      'along one edge, chamfered corners, heavy and dense and expensive looking, ' +
      'a small blank recessed brass plate inset near the base. ' + LOOK,
  },
  {
    name: 'pendant',
    aspect_ratio: '1:1',
    prompt:
      'A luxury pendant necklace: a small solid polished brushed silver cat tail ' +
      'sculpted in metal, curving upward in an elegant tapered arc, hanging from ' +
      'a fine delicate silver box chain, high end fine jewellery product shot, ' +
      'soft reflective metal highlights, no text. ' + LOOK,
  },
  {
    name: 'whitepaper',
    aspect_ratio: '1:1',
    prompt:
      'A premium cream linen hardcover notebook lying flat and closed, thick ' +
      'textured paper edges, a rounded shallow circular depression pressed into ' +
      'the middle of the front cover as though a heavy cat had slept on it, a few ' +
      'fine grey cat hairs resting on the cover, elegant minimal stationery, ' +
      'no text, no logo. ' + LOOK,
  },
  {
    name: 'plaque',
    aspect_ratio: '1:1',
    prompt:
      'An executive desk nameplate: a long polished dark walnut wooden base with ' +
      'a blank brushed gold brass plate mounted on its angled face, the kind of ' +
      'plaque on a chief executive desk, rich wood grain, luxurious, ' +
      'no text engraved. ' + LOOK,
  },
  {
    name: 'deskmat',
    aspect_ratio: '1:1',
    prompt:
      'A large premium charcoal grey felt desk mat laid flat and slightly ' +
      'rolled at one corner, neat stitched edging around the border, soft ' +
      'wool-like surface texture, minimal high end desk accessory, plain ' +
      'unprinted surface. ' + LOOK,
  },
  {
    name: 'coasters',
    aspect_ratio: '1:1',
    prompt:
      'A neat stack of four round dark walnut wooden coasters with one coaster ' +
      'resting beside the stack, rich hardwood grain, chamfered edges, satin ' +
      'finish, premium barware, plain unengraved surfaces. ' + LOOK,
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
