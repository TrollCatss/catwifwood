# Dragonspire

2D block-puzzle -> build -> dragon-battle game for Android. See the game brief for the full design.

**Status: the full loop is playable** (puzzle -> ad -> war camp -> deploy -> ad -> battle -> rewards -> puzzle). This browser build is for team testing; the product is the mobile app.

## Run

```bash
cd dragonspire
npm install
npm run dev     # phone-sized browser window recommended
npm test        # engine tests
npm run build   # tsc + production bundle in dist/
```

## Share a phone test build

```bash
npm run build && python3 tools/single-file.py dist /path/to/dragonspire.html
```
Produces one self-contained page (no external files) that can be published or sent to testers.

## Layout

- `src/engine.ts` — pure puzzle rules (8x8 grid, shapes, clears, combo, tray generation, resource harvest). No DOM.
- `src/view.ts` — canvas rendering, drag input, particles, shake, resource fly-to-HUD.
- `src/audio.ts` — synthesized sound effects (no asset files).
- `src/profile.ts` — saved player state (gold, resources, army, dragon levels, trophies), shop prices, dragon upgrades, ad ramp rule.
- `src/battleSim.ts` — battle rules, no DOM (unit stats, AI, dragon breath, towers, rewards). Tested in `battleSim.test.ts`.
- `src/battle.ts` — battle screen: deploy drag, tap controls, rendering.
- `src/main.ts` — screen flow, war camp UI, placeholder ads (where the real ad network plugs in).

## Rules as built

- Every piece is one resource: fire, wood or iron. Clearing a line harvests the blocks in it. Fire only comes from fire blocks.
- Combo: consecutive clearing placements raise the harvest multiplier (up to x2). The streak survives two quiet placements.
- The tray generator prefers a set of three pieces that can all be placed, so rounds end from play, not bad luck.

## Units and merging

- About one tray piece in six is made of unit blocks: archer, knight or catapult (tier 1).
- Two touching units of the same kind and tier merge into the next tier; the other block disappears (frees a cell). Order: line clears resolve first, then merges.
  Archer -> Longbowman -> Fire Archer; Footman -> Knight -> Champion; Catapult -> Trebuchet -> Fire Trebuchet.
- Clearing a line that contains a unit banks it into the army (`localStorage` key `dragonspire.army`), so merging up before clearing is worth more.

## Look

All art is drawn in code for now (stone board in a riveted wood frame, wood/iron/coal blocks, heraldic unit shields with tier rims, castle-at-dusk backdrop with a dragon flying past). Final art can replace it later.

## Next

Build screen (spend resources), then AI battle. Wrap with Capacitor for Android once the loop is fun. Decide the final name and run the trademark check first.
