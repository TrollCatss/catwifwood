# Dragonspire — game flow (mobile, ad-supported)

The browser build is for team testing only. The product is an Android (later iOS) app monetized by ads
plus a one-time Remove Ads purchase.

## The loop

1. **Puzzle round** (block game). Earns, for the next phase:
   - **Gold** — to buy and upgrade things on the build screen.
   - **Fire / wood / iron** — fire is the dragon's fuel in battle; wood and iron are materials for gear.
   - **Free units** — clear a line containing a unit and it joins your army. Merge units on the board first
     (archer -> longbowman -> fire archer, etc.) to bank a stronger one.
2. **Ad #1 (interstitial)** when the round ends. Skipped for players who bought Remove Ads.
   Lighter in the first few rounds, ramping up later.
3. **Build screen.** Spend gold/wood/iron on:
   - army units, defenses (walls), offensive siege (catapults, trebuchets, bolt throwers);
   - dragon: buy, upgrade (armor, fire, wings, health), evolve.
   Then **place units on the battlefield** and tap **Ready**.
4. **Ad #2 (short)** after Ready, before the war. Also removed by Remove Ads.
5. **War.** Top-down 2D. You are the dragon. Your fuel is the fire earned in the puzzle.
   Tap a unit or group to move it, tap a target to order an attack, or leave them to fight on their own.
6. **Result:** gold, loot, trophies. Back to the puzzle.

## Opponents
- **AI armies** (single-player ladder) — ships first.
- **Other players, asynchronous.** You fight a saved snapshot of their base and army while they are offline,
  Clash-of-Clans style. No live connection, no matchmaking latency. Needs a small backend (stores
  snapshots, trophies, leaderboards). Live PvP is out of scope.

## Monetization rules
- Interstitial after each puzzle round and a shorter one before each war. Remove Ads removes both.
- Rewarded ads stay optional even with Remove Ads: revive, double the round's rewards, extra spin.
- Daily spin wheel: cosmetics and boosters only. No real-money prizes anywhere.

## Hard rules (unchanged)
2D only. Original names and art, nothing from any show or film. Generic gear names.
