// Эволюции питомцев: 4 стихии × 6 стадий. Пороги уровня и загрузка GLB (с кешем).
import { webglOK } from './webgl.js';

export const PETS = {
  raccoon:  { id: 'raccoon',  label: 'Енот',     halo: [140, 200, 255],
    names: ['Снежок', 'Иней', 'Льдинка', 'Морозко', 'Вьюжка', 'Снежная Звёздочка'] },
  capybara: { id: 'capybara', label: 'Капибара', halo: [150, 210, 100],
    names: ['Росточек', 'Листик', 'Веточка', 'Бутончик', 'Цветик', 'Мандариновый Цвет'] },
  dragon:   { id: 'dragon',   label: 'Дракон',   halo: [255, 140, 50],
    names: ['Искорка', 'Уголёк', 'Огонёк', 'Пламенчик', 'Жарик', 'Солнечный Дракоша'] },
  goose:    { id: 'goose',    label: 'Гусь',     halo: [160, 190, 255],
    names: ['Ветерок', 'Облачко', 'Пёрышко', 'Бриз', 'Небесный', 'Облачный Ангел'] }
};
export const PET_ORDER = ['raccoon', 'capybara', 'dragon', 'goose'];

// Стадия по уровню питомца: 1–4, 5–9, 10–14, 15–19, 20–24, 25+.
export const STAGE_AT = [1, 5, 10, 15, 20, 25];
export const LEVEL_MIN = 1, LEVEL_MAX = 30;

export function stageOf(level) {
  const lv = Math.max(LEVEL_MIN, Math.floor(level) || 1);
  for (let i = STAGE_AT.length - 1; i >= 0; i--) if (lv >= STAGE_AT[i]) return i + 1;
  return 1;
}
export function firstLevelOf(stage) {
  return STAGE_AT[Math.max(0, Math.min(5, stage - 1))];
}
export function stageName(pet, stage) {
  const p = PETS[pet] || PETS.raccoon;
  return p.names[Math.max(0, Math.min(5, stage - 1))];
}
export function evoUrl(pet, stage) {
  const root = (document.documentElement.dataset.root || './').replace(/\/?$/, '/');
  return `${root}models/evo/${pet}/${pet}_stage_${stage}.glb`;
}

const cache = new Map();
const inflight = new Map();
let loader = null, loaderP = null;
function getLoader() {
  if (!webglOK()) return Promise.reject(new Error('WebGL unavailable'));
  if (loader) return Promise.resolve(loader);
  if (loaderP) return loaderP;
  loaderP = import('../lib/addons/loaders/GLTFLoader.js?v=tc11132310')
    .then(m => { loader = new m.GLTFLoader(); return loader; })
    .catch(err => { loaderP = null; throw err; });
  return loaderP;
}


function prep(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || !m.emissive) continue;
      const em = m.emissive.r + m.emissive.g + m.emissive.b;
      if (em <= 0) continue;
      const ring = /ring/i.test(m.name || '') || /ring/i.test(o.name || '');
      // KHR_materials_emissive_strength может уже выставить intensity; иначе чуть усиливаем.
      if (!(m.emissiveIntensity > 1)) m.emissiveIntensity = ring ? 1.7 : 1.2;
      if (ring) m.toneMapped = false;
    }
  });
  return root;
}

export function loadEvo(pet, stage) {
  const key = pet + ':' + stage;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);
  const p = getLoader().then(L => L.loadAsync(evoUrl(pet, stage))).then(g => {
    const root = prep(g.scene);
    cache.set(key, root);
    inflight.delete(key);
    return root;
  }).catch(err => { inflight.delete(key); throw err; });
  inflight.set(key, p);
  return p;
}

// Стадии нужно передавать явно: без списка ничего не качаем (раньше по умолчанию
// уходили все 6 стадий ~1 МиБ). На главной — только текущая и следующая.
export function nearbyEvoStages(stage) {
  const n = Math.max(1, Math.min(6, stage | 0));
  return n < 6 ? [n, n + 1] : [n];
}
export function preloadEvo(pet, stages) {
  if (!webglOK() || !Array.isArray(stages) || !stages.length) return Promise.resolve([]);
  return Promise.all(stages.map(s => loadEvo(pet, s).catch(() => null)));
}

export function scheduleNearbyPreload(pet, stage) {
  const stages = nearbyEvoStages(stage);
  const run = () => preloadEvo(pet, stages);
  const kick = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 200);
  };
  if (document.readyState === 'complete') kick();
  else addEventListener('load', kick, { once: true });
}
