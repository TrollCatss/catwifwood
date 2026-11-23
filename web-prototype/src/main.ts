import { Sfx } from './audio';
import { View } from './view';
import { parseUnit, unitName, type UnitKind } from './engine';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sfx = new Sfx();
const title = $('title');
const over = $('over');

const view = new View($<HTMLCanvasElement>('c'), sfx, (g, best, isBest) => {
  $('finalScore').textContent = String(g.score);
  $('best').textContent = isBest ? 'New best!' : `Best ${best}`;
  $('hFire').textContent = `Fire ${g.harvest.fire}`;
  $('hWood').textContent = `Wood ${g.harvest.wood}`;
  $('hIron').textContent = `Iron ${g.harvest.iron}`;
  const units = Object.entries(g.army).sort((a, b) => parseUnit(b[0] as UnitKind)!.tier - parseUnit(a[0] as UnitKind)!.tier);
  $('army').textContent = units.length ? 'Recruited: ' + units.map(([k, n]) => `${n} ${unitName(k as UnitKind)}`).join(', ') : 'No units recruited. Clear lines with unit blocks in them.';
  // Interstitial ad hook goes here (lighter in the first few rounds, ramping up later).
  over.classList.add('show');
});

function start() {
  sfx.unlock();
  title.classList.remove('show');
  over.classList.remove('show');
  view.newRound();
}
$('play').addEventListener('click', start);
$('again').addEventListener('click', start);

// Test hook: lets automated checks drive the game without a touch device.
(window as any).__dragonspire = view;
