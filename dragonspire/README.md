# Dragonspire

2D block-puzzle -> build -> dragon-battle game for Android. See the game brief for the full design.

**Status: build step 1 — the block puzzle.** Playable in a browser; the Android wrapper comes later.

## Run

```bash
cd dragonspire
npm install
npm run dev     # phone-sized browser window recommended
npm test        # engine tests
npm run build   # tsc + production bundle in dist/
```

## Layout

- `src/engine.ts` — pure puzzle rules (8x8 grid, shapes, clears, combo, tray generation, resource harvest). No DOM.
- `src/view.ts` — canvas rendering, drag input, particles, shake, resource fly-to-HUD.
- `src/audio.ts` — synthesized sound effects (no asset files).
- `src/main.ts` — title / round-over screens. Banked resources are saved to `localStorage` key `dragonspire.bank` for the future build screen. The interstitial-ad hook is marked there.

## Rules as built

- Every piece is one resource: fire, wood or iron. Clearing a line harvests the blocks in it. Fire only comes from fire blocks.
- Combo: consecutive clearing placements raise the harvest multiplier (up to x2). The streak survives two quiet placements.
- The tray generator prefers a set of three pieces that can all be placed, so rounds end from play, not bad luck.

## Next

Build screen (spend resources), then AI battle. Wrap with Capacitor for Android once the loop is fun. Decide the final name and run the trademark check first.
