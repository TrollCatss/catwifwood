// The player's persistent state across the loop: puzzle -> build -> war -> puzzle.
import type { Game, UnitKind } from './engine';

export type DragonStat = 'armor' | 'fire' | 'wings' | 'health';
export type Purse = { gold: number; fire: number; wood: number; iron: number };

export interface Profile extends Purse {
  army: Record<string, number>; // UnitKind -> count
  dragon: Record<DragonStat, number>; // upgrade levels 0..MAX_DRAGON_LEVEL
  trophies: number;
  wins: number;
  rounds: number; // puzzle rounds finished, drives ad ramp-up
  removeAds: boolean;
  deploy: Record<string, { x: number; y: number }>; // unit family -> anchor in the deploy zone (0..1)
}

const KEY = 'dragonspire.profile.v1';

export const fresh = (): Profile => ({
  gold: 60, fire: 20, wood: 10, iron: 10,
  army: { 'knight:1': 5, 'archer:1': 4 },
  dragon: { armor: 0, fire: 0, wings: 0, health: 0 },
  trophies: 0, wins: 0, rounds: 0, removeAds: false,
  deploy: { knight: { x: 0.5, y: 0.2 }, archer: { x: 0.5, y: 0.55 }, catapult: { x: 0.5, y: 0.85 } },
});

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return fresh();
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/** Banks a finished puzzle round into the profile. */
export function bankRound(p: Profile, g: Game) {
  p.gold += g.gold;
  p.fire += g.harvest.fire;
  p.wood += g.harvest.wood;
  p.iron += g.harvest.iron;
  for (const [k, n] of Object.entries(g.army)) p.army[k] = (p.army[k] || 0) + n;
  p.rounds++;
}

// ---------- shop ----------
export interface Offer { kind: UnitKind; name: string; blurb: string; cost: Partial<Purse> }
export const SHOP: Offer[] = [
  { kind: 'knight:1', name: 'Footman', blurb: 'Sturdy front line.', cost: { gold: 15, iron: 3 } },
  { kind: 'archer:1', name: 'Archer', blurb: 'Shoots from range.', cost: { gold: 15, wood: 3 } },
  { kind: 'catapult:1', name: 'Catapult', blurb: 'Smashes towers from afar.', cost: { gold: 40, wood: 8, iron: 2 } },
];

export const MAX_DRAGON_LEVEL = 5;
export const DRAGON_UPGRADES: Record<DragonStat, { name: string; blurb: string; cost: (lvl: number) => Partial<Purse> }> = {
  armor: { name: 'Scale plating', blurb: 'Less damage from bolt throwers.', cost: (l) => ({ gold: 40 * (l + 1), iron: 6 * (l + 1) }) },
  fire: { name: 'Fiercer fire', blurb: 'Each breath burns harder.', cost: (l) => ({ gold: 50 * (l + 1) }) },
  wings: { name: 'Stronger wings', blurb: 'Fly faster across the field.', cost: (l) => ({ gold: 30 * (l + 1), wood: 5 * (l + 1) }) },
  health: { name: 'Thicker hide', blurb: 'More health before retreating.', cost: (l) => ({ gold: 40 * (l + 1), iron: 3 * (l + 1) }) },
};

export function dragonStage(p: Profile): { name: string; size: number } {
  const total = Object.values(p.dragon).reduce((a, b) => a + b, 0);
  if (total >= 12) return { name: 'Ancient Dragon', size: 1.5 };
  if (total >= 4) return { name: 'Fire Drake', size: 1.2 };
  return { name: 'Hatchling', size: 1 };
}

export const canAfford = (p: Purse, c: Partial<Purse>) =>
  (Object.keys(c) as (keyof Purse)[]).every((k) => p[k] >= (c[k] || 0));
export function pay(p: Purse, c: Partial<Purse>) {
  for (const k of Object.keys(c) as (keyof Purse)[]) p[k] -= c[k] || 0;
}
export const costText = (c: Partial<Purse>) =>
  (Object.keys(c) as (keyof Purse)[]).filter((k) => c[k]).map((k) => `${c[k]} ${k}`).join(' · ');

/** Interstitial after a puzzle round: none for the first two rounds, then every round. */
export const showsRoundAd = (p: Profile) => !p.removeAds && p.rounds > 2;
