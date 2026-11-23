import { Sfx } from './audio';
import { View } from './view';
import { BattleView } from './battle';
import { rewards, type Battle } from './battleSim';
import { parseUnit, unitName, type UnitKind } from './engine';
import {
  DRAGON_UPGRADES, MAX_DRAGON_LEVEL, SHOP, bankRound, canAfford, costText, dragonStage, loadProfile, pay, saveProfile, showsRoundAd,
  type DragonStat, type Profile,
} from './profile';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const sfx = new Sfx();
const profile: Profile = loadProfile();
const save = () => saveProfile(profile);
const overlays = ['title', 'over', 'build', 'result', 'ad'];
function show(id: string | null) {
  for (const o of overlays) if (o !== 'ad') $(o).classList.toggle('show', o === id);
}

// ---------- ads (placeholders until the app build wires a real network) ----------
function showAd(seconds: number, done: () => void) {
  const ad = $('ad'), close = $('adClose'), count = $('adCount');
  ad.classList.add('show');
  close.style.display = 'none';
  let left = seconds;
  count.textContent = String(left);
  const tick = setInterval(() => {
    left--;
    count.textContent = String(Math.max(0, left));
    if (left <= 0) { clearInterval(tick); close.style.display = 'block'; }
  }, 1000);
  close.onclick = () => { ad.classList.remove('show'); done(); };
}

// ---------- puzzle ----------
let lastRound: View['game'] | null = null;
const puzzle = new View($<HTMLCanvasElement>('c'), sfx, (g, best, isBest) => {
  lastRound = g;
  bankRound(profile, g);
  save();
  $('finalScore').textContent = String(g.score);
  $('best').textContent = isBest ? 'New best!' : `Best ${best}`;
  $('hGold').textContent = `+${g.gold} gold`;
  $('hFire').textContent = `Fire ${g.harvest.fire}`;
  $('hWood').textContent = `Wood ${g.harvest.wood}`;
  $('hIron').textContent = `Iron ${g.harvest.iron}`;
  const units = Object.entries(g.army).sort((a, b) => parseUnit(b[0] as UnitKind)!.tier - parseUnit(a[0] as UnitKind)!.tier);
  $('army').textContent = units.length ? 'Recruited: ' + units.map(([k, n]) => `${n} ${unitName(k as UnitKind)}`).join(', ') : 'No recruits. Clear lines that hold soldier blocks to recruit them.';
  ($('double') as HTMLButtonElement).disabled = false;
  show('over');
});

function startPuzzle() {
  sfx.unlock();
  battle.close();
  $('readyBar').classList.remove('show');
  puzzle.active = true;
  show(null);
  puzzle.newRound();
}
$('play').onclick = startPuzzle;
$('double').onclick = () => {
  const g = lastRound;
  if (!g) return;
  showAd(5, () => {
    profile.gold += g.gold; profile.fire += g.harvest.fire; profile.wood += g.harvest.wood; profile.iron += g.harvest.iron;
    save();
    ($('double') as HTMLButtonElement).disabled = true;
    $('hGold').textContent = `+${g.gold * 2} gold`;
    $('hFire').textContent = `Fire ${g.harvest.fire * 2}`;
    $('hWood').textContent = `Wood ${g.harvest.wood * 2}`;
    $('hIron').textContent = `Iron ${g.harvest.iron * 2}`;
  });
};
$('toBuild').onclick = () => (showsRoundAd(profile) ? showAd(5, openBuild) : openBuild());
$('toBuildFromTitle').onclick = () => { sfx.unlock(); openBuild(); };

// ---------- build ----------
let tab: 'army' | 'dragon' = 'army';
function openBuild() {
  puzzle.active = false;
  battle.close();
  $('readyBar').classList.remove('show');
  show('build');
  renderBuild();
}
function shieldIcon(kind: UnitKind) {
  const c = document.createElement('canvas');
  c.width = 92; c.height = 92;
  puzzle.drawShield(c.getContext('2d')!, 0, 0, 92, kind);
  return c;
}
function card(title: string, sub: string, cost: string, btn: string, enabled: boolean, onClick: () => void, icon?: HTMLCanvasElement) {
  const el = document.createElement('div');
  el.className = 'card';
  if (icon) el.append(icon);
  const t = document.createElement('div');
  t.className = 't';
  t.innerHTML = `<b></b><small></small>${cost ? '<div class="cost"></div>' : ''}`;
  t.querySelector('b')!.textContent = title;
  t.querySelector('small')!.textContent = sub;
  if (cost) t.querySelector('.cost')!.textContent = cost;
  el.append(t);
  if (btn) {
    const b = document.createElement('button');
    b.className = 'small';
    b.textContent = btn;
    b.disabled = !enabled;
    b.onclick = onClick;
    el.append(b);
  }
  return el;
}
function sect(text: string) { const d = document.createElement('div'); d.className = 'sect'; d.textContent = text; return d; }

function renderBuild() {
  $('pGold').textContent = `${profile.gold} gold`;
  $('pFire').textContent = `${profile.fire} fire`;
  $('pWood').textContent = `${profile.wood} wood`;
  $('pIron').textContent = `${profile.iron} iron`;
  $('tabArmy').className = tab === 'army' ? '' : 'off';
  $('tabDragon').className = tab === 'dragon' ? '' : 'off';
  const shop = $('shop');
  shop.replaceChildren();

  if (tab === 'army') {
    shop.append(sect(`NEXT BATTLE: AI WARLORD ${profile.wins + 1} · TROPHIES ${profile.trophies}`));
    const owned = Object.entries(profile.army).filter(([, n]) => n > 0)
      .sort((a, b) => a[0].localeCompare(b[0]) || parseUnit(b[0] as UnitKind)!.tier - parseUnit(a[0] as UnitKind)!.tier);
    shop.append(sect('YOUR ARMY'));
    if (!owned.length) shop.append(card('No soldiers', 'Recruit below, or clear soldier blocks in the puzzle.', '', '', false, () => {}));
    for (const [k, n] of owned) {
      const tier = parseUnit(k as UnitKind)!.tier;
      shop.append(card(`${unitName(k as UnitKind)}  ×${n}`, tier === 3 ? 'Top tier.' : 'Merge two in the puzzle to upgrade.', '', '', false, () => {}, shieldIcon(k as UnitKind)));
    }
    shop.append(sect('RECRUIT'));
    for (const o of SHOP) {
      shop.append(card(o.name, o.blurb, costText(o.cost), 'Buy', canAfford(profile, o.cost), () => {
        pay(profile, o.cost);
        profile.army[o.kind] = (profile.army[o.kind] || 0) + 1;
        save(); sfx.drop(); renderBuild();
      }, shieldIcon(o.kind)));
    }
    shop.append(sect('DEFENSES'));
    shop.append(card('Walls and towers', 'Protect your base when other players raid you. Arrives with player raids.', '', 'Soon', false, () => {}));
    shop.append(card('Raid another player', 'Attack a real player’s saved base while they are offline. Needs the online update.', '', 'Soon', false, () => {}));
    shop.append(sect('SHOP'));
    shop.append(card(profile.removeAds ? 'Ads removed' : 'Remove Ads', 'One-time purchase. Rewarded ads stay optional. (Test build: free toggle.)', '', profile.removeAds ? 'Undo' : 'Buy', true, () => {
      profile.removeAds = !profile.removeAds; save(); renderBuild();
    }));
  } else {
    const st = dragonStage(profile);
    shop.append(sect(`YOUR DRAGON: ${st.name.toUpperCase()}`));
    shop.append(card(st.name, 'Upgrades grow your dragon: Hatchling, then Fire Drake (4 upgrades), then Ancient Dragon (12).', `Fire for battle: ${profile.fire} (4 per breath)`, '', false, () => {}));
    for (const k of Object.keys(DRAGON_UPGRADES) as DragonStat[]) {
      const u = DRAGON_UPGRADES[k], lvl = profile.dragon[k];
      const maxed = lvl >= MAX_DRAGON_LEVEL, cost = u.cost(lvl);
      shop.append(card(`${u.name}  ${'●'.repeat(lvl)}${'○'.repeat(MAX_DRAGON_LEVEL - lvl)}`, u.blurb, maxed ? 'Maxed' : costText(cost), maxed ? 'Max' : 'Upgrade', !maxed && canAfford(profile, cost), () => {
        pay(profile, cost); profile.dragon[k]++; save(); sfx.merge(Math.min(3, lvl + 1)); renderBuild();
      }));
    }
  }
}
$('tabArmy').onclick = () => { tab = 'army'; renderBuild(); };
$('tabDragon').onclick = () => { tab = 'dragon'; renderBuild(); };
$('backToPuzzle').onclick = startPuzzle;

// ---------- war ----------
const battle = new BattleView($<HTMLCanvasElement>('b'), sfx, puzzle, (b: Battle, level: number) => {
  const r = rewards(b.result!, level);
  profile.gold += r.gold;
  profile.trophies = Math.max(0, profile.trophies + r.trophies);
  if (b.result === 'win') profile.wins++;
  profile.army = b.survivors();
  profile.fire = Math.floor(b.dragon.fuel);
  save();
  const lost = Object.values(b.startArmy).reduce((a, n) => a + n, 0) - Object.values(profile.army).reduce((a, n) => a + n, 0);
  $('resTitle').textContent = b.result === 'win' ? 'Victory!' : 'Defeat';
  $('resBody').textContent = b.result === 'win'
    ? `The enemy keep has fallen. ${lost ? `${lost} soldiers fell in battle.` : 'Not one soldier lost.'}`
    : `Your army was driven back${lost ? ` and ${lost} soldiers fell` : ''}. Earn more in the puzzle and come back stronger.`;
  $('resGold').textContent = `+${r.gold} gold`;
  $('resTrophies').textContent = `${r.trophies > 0 ? '+' : ''}${r.trophies} trophies`;
  show('result');
});
$('toWar').onclick = () => {
  show(null);
  battle.open(profile);
  $('readyBar').classList.add('show');
};
$('deployBack').onclick = () => { save(); openBuild(); };
$('ready').onclick = () => {
  save();
  $('readyBar').classList.remove('show');
  const go = () => battle.startFight();
  if (profile.removeAds) go(); else showAd(3, go);
};
$('resNext').onclick = startPuzzle;
$('resCamp').onclick = openBuild;

// Test hooks: let automated checks drive the game without a touch device.
Object.assign(window as any, { __dragonspire: puzzle, __battle: battle, __profile: profile });
