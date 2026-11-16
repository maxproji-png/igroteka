// «99 ночей» — симуляция мира (GDD v0.5). Чистый JS: без Three.js и DOM.
// Состояние — обычный сериализуемый объект (JSON), у всех сущностей есть id.
// Ввод приходит командами {t, pid, ...}. Этот же модуль сможет крутиться в комнате Colyseus на сервере:
// клиент шлёт команды, сервер вызывает step() и рассылает состояние/события (s.ev).
export const CFG = {
  DAY: 75, NIGHT: 45, COOP_DAY: 70, COOP_NIGHT: 50,     // соло / кооп (GDD v0.5, раздел 3)
  STAGE_LEN: 6, MVP_STAGES: 2, MVP_NIGHTS: 12, META: 99,
  MAP: 24,                                       // поле 48×48 м, играем в круге R=24
  OPEN: [0, 16, 24, 24], LIGHT: [0, 8, 12, 16],  // открытая зона и круг света по уровню костра
  FUEL_MAX: [0, 100, 130, 160], BURN: [0, 1, .85, .7], FUEL_STICK: 8,
  STACK: 5, CHEST_SLOTS: 24, BAG: 8,                 // v0.8 (баланс §9.4): общий сундук — 24 слота по 5
  FIRST_LIGHT: .5, RELIGHT_STICKS: 2,             // v0.8 (§9.1): первый розжиг → 50%; погасший костёр — 2 ветки = +16, без бонуса
  REVIVE_HOLD: 2.5,                               // v0.8 (§9.4): подъём союзника — удержание 2,5 с
  // v0.8 (баланс §10, заменяет §9.2; гипотеза, проверка — test/balance-sim.mjs): по группам ночей 1–3 / 4–9 / 10–12
  MIST_DMG: [1.5, 2.5, 3.5], MIST_MAX_BLOW: [8, 0, 20], MOTH_DMG: 1, CROW_STAY: 15, FOG10_BURN: 1.15,
  // §12 (v0.8.3): ветер 11–12, мотыльки 11/12 двумя волнами, урон клубочка 11–12; кооп — горение/мотыльки/клубочки за каждого игрока сверх первого
  WIND_BURN: 1.35, MOTHS11: 5, MOTHS12: 6, MIST_DMG_WIND: 4, COOP_BURN_K: [[1, 1.1, 1.2, 1.2], [1, 1.2, 1.4, 1.6], [1, 1.7, 1.6, 1.7]], COOP_MOTH: 1, COOP_MIST: 1,   // §14: множитель горения ночью по числу игроков (соло, 2, 3, 4) для ночей 1–3 / 4–9 / 10–12; §14.1 (v0.8.6): ночи 10–12 — двое ×1,7 (при ×1,6 медиана ночи 12 = 28 % > 25 %), четверо ×1,7
  BAG_BASKET: 12, BAG_BASKET2: 16,   // v0.8.3: с v0.8.0 эта пара случайно оказалась внутри комментария (MIST_MAX_BLOW: 0 — без лимита) → вместимость с корзинкой была NaN
  SPEED: 4.4, PLAYER_R: .38, GATHER_T: .25,   // §15 п.5: замах сбора, с (енот — /1,2)
  FIRE: { x: 0, z: 0 }, BENCH: { x: 3.6, z: -2.4 }, CHEST: { x: -3.6, z: -2.4 }, BED: { x: 0, z: 2.8 }, LAMP: { x: 0, z: -4.2 },
  FENCE_MAX: 6, TRAP_MAX: 3,
  UPG_MUL: [1, 1, 1.4, 1.8, 2.2],                // множитель апгрейдов костра/верстака по стартовому составу
};
// Карта этапов: 16 обычных по 6 ночей + финал 97–99. В MVP играбельны только 1 и 2.
export const STAGES = Array.from({ length: 17 }, (_, i) => i < 16 ? { id: i + 1, from: i * 6 + 1, to: i * 6 + 6 } : { id: 17, from: 97, to: 99, final: true });
export const stageOf = n => n >= 97 ? 17 : Math.ceil(n / 6);
// Наборы этапа (на каждого игрока стартового состава). firstEver — самый первый соло-старт: костёр надо разжечь.
export const KITS = {
  1: { chest: { stick: 8, stone: 4, berry: 3, cloth: 1 }, fireLv: 1, fuel: .5, bench: 1, open: false },
  2: { chest: { stick: 10, stone: 6, berry: 4, cloth: 2 }, fireLv: 3, fuel: .6, bench: 2, open: true },
};
export const RES = ['stick', 'stone', 'berry', 'cloth'];
// v0.8.1: роли по GDD §5 и таблице balance_1-12.md §11.4:
//  енот — сбор ×1,2 (gather), искорки над кустами с ягодами и пнями с лутом в 6 м (spot, клиент), во тьме силы ×1,2 (4,8/с);
//  капибара — силы у костра ×1,4 (11,2/с), клубочки в 4 м от неё катятся ×0,75 (calm/calmK), скорость ×0,88, дальше 14 м без двойных находок;
//  дракончик — костёр в 4 м горит ×0,9 (fireSave), огонёк раз в 10 с: отпугивает одну тень в 3,4 м или +50% заряда фонарика (ember), рюкзак −2;
//  гусь — гогочет за 5 с до того, как угроза дойдёт до костра (warn → событие honk), рывок-толчок 1,2 м, кулдаун толчка 0,55; Лось замечает его с 10 м (loud).
export const PETS = {
  raccoon:  { name: 'Енот',      gatherHits: 3, gather: 1.2, dark: 1.2, speed: 1,   bag: 0,  regen: 1,   pushCd: .8, fireSave: 1, spot: 6 },
  capybara: { name: 'Капибара',  gatherHits: 3, dark: 1,   speed: .88, bag: 0,  regen: 1.4, pushCd: .8, fireSave: 1, calm: 4, calmK: .75, farPoor: 14 },
  dragon:   { name: 'Дракончик', gatherHits: 3, dark: 1,   speed: 1,   bag: -2, regen: 1,   pushCd: .8, fireSave: .9, ember: { cd: 10, r: 3.4, charge: 50 } },
  goose:    { name: 'Гусь',      gatherHits: 3, dark: 1,   speed: 1.05, bag: 0, regen: 1,   pushCd: .55, fireSave: 1, warn: true, loud: 10, dash: 1.2 },   // v0.8 (GDD §5): рывок-толчок до 1,2 м
};
const pushR = p => 2.6;   // v0.8.1 (§11.4): у дракончика больше нет дальнего толчка — огонёк работает сам, раз в 10 с
const pushReach = p => pushR(p) + (PETS[p.pet].dash || 0);   // гусь дотягивается рывком     // дальность толчка (у дракончика — огонёк)
export const SLOT_COLORS = ['#ff6b7f', '#4f9dff', '#ffc83c', '#9b6bff'];   // v0.8: 4-й слот фиолетовый (зелёный терялся в листве)
// Рецепты GDD v0.5 (соло-стоимости). at: где крафтится; bench: нужный уровень верстака; upg: масштабируется в коопе.
export const RECIPES = [
  { id: 'pie',     name: 'Пирожок',            at: 'fire',  cost: { berry: 3 }, desc: '+70% сытости и немного сил' },
  { id: 'fire2',   name: 'Костёр · ур. 2',     at: 'fire',  upg: true, cost: { stick: 15, stone: 5 }, desc: 'Круг света 12 м, открывает больше леса', ok: s => s.fire.lv === 1, done: s => s.fire.lv >= 2 },
  { id: 'fire3',   name: 'Костёр · ур. 3',     at: 'fire',  upg: true, cost: { stick: 30, stone: 10, cloth: 3 }, desc: 'Свет 16 м, вся карта', ok: s => s.fire.lv === 2, done: s => s.fire.lv >= 3, need: s => s.fire.lv < 2 ? 'Нужен ур. 2' : '' },
  { id: 'flash',   name: 'Фонарик',            at: 'bench', bench: 1, cost: { stick: 4, stone: 3 }, desc: 'Луч отпугивает тени, заряд у костра', ok: (s, p) => !p.has.flash, done: (s, p) => p.has.flash },
  { id: 'basket',  name: 'Корзинка',           at: 'bench', bench: 1, cost: { stick: 5, cloth: 2 }, desc: 'Рюкзак 12 слотов', ok: (s, p) => !p.has.basket, done: (s, p) => p.has.basket },
  { id: 'fence',   name: 'Заборчик',           at: 'bench', bench: 1, cost: { stick: 6, stone: 2 }, desc: 'Сегмент перед тобой, задерживает мелких', ok: s => count(s, 'fence') < CFG.FENCE_MAX, place: true },
  { id: 'bench2',  name: 'Верстак · ур. 2',    at: 'bench', bench: 1, upg: true, cost: { stick: 10, stone: 8 }, desc: 'Открывает новые рецепты', ok: s => s.bench.lv === 1, done: s => s.bench.lv >= 2 },
  { id: 'lamp',    name: 'Большой фонарь',     at: 'bench', bench: 2, cost: { stick: 8, stone: 6, cloth: 2 }, desc: 'Стационарный свет, круг +2 м', ok: s => !count(s, 'lamp'), done: s => count(s, 'lamp') > 0 },
  { id: 'trap',    name: 'Сеточка-ловушка',    at: 'bench', bench: 2, cost: { stick: 2, cloth: 4 }, desc: 'Ненадолго ловит врага', ok: s => count(s, 'trap') < CFG.TRAP_MAX, place: true },
  { id: 'basket2', name: 'Улучшенная корзинка', at: 'bench', bench: 2, cost: { stick: 8, cloth: 4 }, desc: 'Рюкзак 16 слотов', ok: (s, p) => p.has.basket && !p.has.basket2, done: (s, p) => p.has.basket2, need: (s, p) => p.has.basket ? '' : 'Нужна корзинка' },
];
const count = (s, k) => s.builds.filter(b => b.k === k).length;

// ---------- утилиты ----------
export const rand = s => (s.rng = s.rng * 16807 % 2147483647) / 2147483647;
const rr = (s, a, b) => a + (b - a) * rand(s);
const hyp = Math.hypot, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b) => hyp(a.x - b.x, a.z - b.z);
const ev = (s, e) => s.ev.push(e);
const startN = s => s.startN || Math.max(1, Object.keys(s.players).length);   // сложность — по стартовому составу
export const dayLen = s => s.mode === 'coop' ? CFG.COOP_DAY : CFG.DAY;
export const nightLen = s => s.mode === 'coop' ? CFG.COOP_NIGHT : CFG.NIGHT;
export const stageNight = s => s.night - STAGES[s.stage - 1].from + 1;         // «3 / 6»
export const stageLen = s => STAGES[s.stage - 1].to - STAGES[s.stage - 1].from + 1;
export const fireMax = s => CFG.FUEL_MAX[s.fire.lv];
export const lightR = s => s.fire.fuel <= 0 ? 0 : CFG.LIGHT[s.fire.lv] * (.55 + .45 * Math.sqrt(s.fire.fuel / fireMax(s))) * (s.wx.fog > .5 ? .92 : 1) + (count(s, 'lamp') ? 2 : 0) - mothCover(s);
const mothCover = s => Math.min(3, s.enemies.filter(e => e.k === 'moth' && e.st === 'land' && !e.dead).length * .7);   // мотыльки «окутывают» пламя
export const openR = s => CFG.OPEN[s.fire.lv];
export const bagCap = p => (p.has.basket2 ? CFG.BAG_BASKET2 : p.has.basket ? CFG.BAG_BASKET : CFG.BAG) + PETS[p.pet].bag;
export const bagSlots = inv => RES.reduce((a, k) => a + Math.ceil((inv[k] || 0) / CFG.STACK), 0);
export const canAdd = (p, k, n) => bagSlots({ ...p.inv, [k]: (p.inv[k] || 0) + n }) <= bagCap(p);
export const have = (s, p, k) => (p.inv[k] || 0) + (s.chest[k] || 0);
export const chestFree = (s, k) => { let n = 0; while (bagSlots({ ...s.chest, [k]: (s.chest[k] || 0) + n + 1 }) <= CFG.CHEST_SLOTS) n++; return n; };
export const nightTier = n => n <= 3 ? 0 : n <= 9 ? 1 : 2;   // §10: 1–3 облегчены, 4–9 как v0.7.0, 10–12 сильнее
export const mistDmg = n => n >= 11 ? CFG.MIST_DMG_WIND : CFG.MIST_DMG[nightTier(n)];
export const mistMaxBlow = n => CFG.MIST_MAX_BLOW[nightTier(n)];
export const costOf = (s, r) => { if (!r.upg) return r.cost; const m = CFG.UPG_MUL[Math.min(4, startN(s))]; const c = {}; for (const [k, v] of Object.entries(r.cost)) c[k] = Math.ceil(v * m); return c; };
export const canPay = (s, p, cost) => Object.entries(cost).every(([k, v]) => have(s, p, k) >= v);
function pay(s, p, cost) { const fromChest = {}; for (const [k, v] of Object.entries(cost)) { const a = Math.min(p.inv[k] || 0, v); p.inv[k] -= a; if (v > a) { s.chest[k] -= v - a; fromChest[k] = v - a; } } return fromChest; }
const newId = s => s.nextId++;
// Погода и события ночи (MVP: 1–12). Лёгкий дождь — одна из ночей 7–9, ночь 10 — «Ночь густого тумана», с 11-й — туман, ветер, мотыльки.
export function weatherFor(s, n) {
  const w = { rain: false, fog: 0, wind: false, special: false, moths: 0, title: '' };
  if (n === s.rainNight) { w.rain = true; w.title = 'Лёгкий дождь'; }
  if (n === 10) { w.fog = 1; w.special = true; w.title = 'Ночь густого тумана'; }
  if (n >= 11 && n <= 12) { w.fog = .6; w.wind = true; w.moths = n === 11 ? CFG.MOTHS11 : CFG.MOTHS12;   /* v0.7: было 2 / 3 */ w.title = 'Туман, ветер и лунные мотыльки'; }
  return w;
}
// Расход топлива: база уровня × этап × погода × состав (×день)
export function burnRate(s) {
  const night = s.phase === 'night'; let b = CFG.BURN[s.fire.lv] * (s.stage >= 2 ? 1.1 : 1);
  if (night) { b *= CFG.COOP_BURN_K[nightTier(s.night)][Math.min(4, startN(s)) - 1];   /* §14: таблица по числу игроков */ if (s.wx.rain) b *= 1.3; if (s.wx.wind) b *= CFG.WIND_BURN; if (s.night === 10) b *= CFG.FOG10_BURN; } else b *= .5;   // §11.2: туман ночи 10 — горение ×1,15
  return b;
}

// ---------- создание мира ----------
// mode: 'solo' | 'coop'. nPlayers — стартовый состав (для числа точек лута: +35% за каждого сверх первого).
export function createState({ seed = 99, timeScale = 1, mode = 'solo', nPlayers = 1 } = {}) {
  const s = { v: 3, seed, rng: seed, nextId: 1, timeScale, mode, startN: nPlayers, stage: 1, night: 1, phase: 'day', t: 0, dawnFlag: false, result: null,
    rainNight: 7 + seed % 3, wx: weatherFor({ rainNight: 0 }, 0), coins: 0, nightsDone: 0,
    lobby: { stage: 1, fill: false },                  // для кооп-снимка: выбранный этап и галочка «Добрать случайных»
    fire: { fuel: 60, lv: 1 }, bench: { lv: 1 }, chest: { stick: 0, stone: 0, berry: 0, cloth: 0 },
    players: {}, nodes: [], builds: [], enemies: [], spawnQ: [], ev: [] };
  const loot = 1 + .35 * (nPlayers - 1);
  const free = (x, z, gap) => hyp(x, z) > 6.5 && s.nodes.every(n => hyp(n.x - x, n.z - z) > (n.r || .4) + gap);
  const spot = (r0, r1, gap) => { for (let k = 0; k < 400; k++) { const a = rand(s) * 6.283, r = Math.sqrt(rr(s, r0 * r0, r1 * r1)), x = Math.cos(a) * r, z = Math.sin(a) * r; if (free(x, z, gap)) return [x, z]; } return [rr(s, -20, 20), rr(s, -20, 20)]; };
  const add = (k, n, r0, r1, gap, extra = {}) => { for (let i = 0; i < n; i++) { const [x, z] = spot(r0, r1, gap); s.nodes.push({ id: newId(s), k, x: +x.toFixed(2), z: +z.toFixed(2), ry: +rr(s, 0, 6.28).toFixed(2), s: +rr(s, .85, 1.25).toFixed(2), alive: true, ...extra(i) }); } };
  add('rock', 10, 8, 23, 2.2, () => ({ r: .9 }));
  add('tree', 46, 8, 23.5, 1.5, () => ({ r: .32, hp: 3, back: 0, sub: rand(s) < .55 ? 0 : 1 }));
  add('bush', Math.round(16 * loot), 7, 22, 1.2, () => ({ r: .45, berry: true }));
  add('stump', Math.round(7 * loot), 9, 23, 1.4, () => ({ r: .35, loot: true, back: 0 }));
  add('branch', Math.round(30 * loot), 6.5, 22, .7, () => ({}));
  add('stone', Math.round(22 * loot), 7, 22, .7, () => ({}));
  return s;
}
// Старт этапа «с карты»: лагерь собирается из конфига этапа (набор главы), а не из прошлого захода.
export function beginStage(s, stage = 1, { firstEver = false } = {}) {
  const st = STAGES[stage - 1], kit = KITS[stage] || KITS[1], n = startN(s);
  s.stage = stage; s.night = st.from; s.phase = 'day'; s.t = 0; s.result = null; s.dawnFlag = false; s.lobby.stage = stage;
  s.fire.lv = kit.fireLv; s.fire.fuel = firstEver ? 0 : Math.round(CFG.FUEL_MAX[kit.fireLv] * kit.fuel); s.bench.lv = kit.bench;
  for (const k of RES) s.chest[k] = kit.chest[k] * n;
  s.firstLight = !!firstEver; s.wx = weatherFor(s, 0); markDirty(s);
  ev(s, { t: 'stageStart', stage, firstEver: !!firstEver });
}
// Соло: после победы этапа сразу идём в следующий открытый — лагерь, постройки и рюкзак остаются как есть.
export function continueNextStage(s) {
  if (!s.result || !s.result.win || s.stage >= CFG.MVP_STAGES) return false;
  s.result = null; s.stage += 1; s.night = STAGES[s.stage - 1].from; s.phase = 'day'; s.t = 0; s.dawnFlag = true; s.lobby.stage = s.stage;
  ev(s, { t: 'stageStart', stage: s.stage, carry: true }); return true;
}
export function addPlayer(s, id, pet = 'raccoon', name = '') {
  const slot = Object.keys(s.players).length + 1;
  s.players[id] = { id, pet, name: name || PETS[pet].name, slot, color: SLOT_COLORS[(slot - 1) % 4], x: SPAWN[(slot - 1) % 4][0], z: SPAWN[(slot - 1) % 4][1], face: Math.PI, vx: 0, vz: 0, in: { x: 0, z: 0 }, str: 100, hunger: 100,
    inv: { stick: 0, stone: 0, berry: 0, cloth: 0, pie: 0 }, has: { flash: false, basket: false, basket2: false }, flash: { on: false, charge: 100 },
    sleep: 0, rest: 0, cd: 0, swing: 0, scareCd: 0, pend: null };
  return s.players[id];
}
// v0.8 (QA1-10): стартовые точки по дуге за костром, между питомцами ≥ 1,6 м (слот 1 — как раньше, 0;4,2)
const SPAWN = [[0, 4.2], [-1.7, 3.9], [1.7, 3.9], [0, 5.9]];
export const serialize = s => JSON.stringify({ ...s, ev: [] });
export const deserialize = str => { const s = JSON.parse(str); s.ev = []; return s; };

// ---------- препятствия (кэш вне состояния, чтобы state оставался чистым JSON) ----------
const OBS = new WeakMap();
export function markDirty(s) { OBS.delete(s); }
function obstacles(s) {
  let o = OBS.get(s); if (o) return o; o = [];
  for (const n of s.nodes) if (n.r && (n.alive || n.k === 'stump' || n.k === 'tree')) o.push({ x: n.x, z: n.z, r: n.k === 'tree' && !n.alive ? .3 : n.r * (n.s || 1) });
  o.push({ x: 0, z: 0, r: s.fire.lv === 3 ? 1.3 : 1 }, { x: CFG.BENCH.x, z: CFG.BENCH.z, r: .9 }, { x: CFG.CHEST.x, z: CFG.CHEST.z, r: .7 });
  for (const b of s.builds) { if (b.k === 'fence') { const cx = Math.cos(b.ry), sz = -Math.sin(b.ry); for (const d of [-.8, 0, .8]) o.push({ x: b.x + cx * d, z: b.z + sz * d, r: .36, fence: true }); } if (b.k === 'lamp') o.push({ x: b.x, z: b.z, r: .35 }); }
  OBS.set(s, o); return o;
}
function collide(s, pos, rad, limit) {
  for (const o of obstacles(s)) { const dx = pos.x - o.x, dz = pos.z - o.z, m = o.r + rad; if (dx > m || dx < -m || dz > m || dz < -m) continue; const d = hyp(dx, dz); if (d < m && d > 1e-4) { pos.x = o.x + dx / d * m; pos.z = o.z + dz / d * m; } }
  const r = hyp(pos.x, pos.z); if (r > limit) { pos.x *= limit / r; pos.z *= limit / r; }
}

// ---------- контекстное действие (одна кнопка) ----------
const pushable = e => !e.dead && !e.leave && (e.k === 'mist' || (e.k === 'crow' && e.y < 1.8) || (e.k === 'moth' && e.y < 2.6));
export function context(s, pid) {
  const p = s.players[pid]; if (!p || p.sleep > 0 || p.rest > 0) return null;
  let best = null, bd = 1e9;
  for (const q of Object.values(s.players)) if (q !== p && q.sleep > 0) { const d = dist(p, q); if (d < 2 && d < bd) { bd = d; best = { kind: 'wake', id: q.id, x: q.x, z: q.z }; } }
  if (best) return best;
  const pr = pushReach(p) - .2;
  for (const e of s.enemies) { if (!pushable(e)) continue; const d = dist(p, e); if (d < pr && d < bd) { bd = d; best = { kind: 'push', id: e.id, x: e.x, z: e.z }; } }
  if (best) return best;
  const df = hyp(p.x, p.z);
  // v0.8 (QA1-02): ветки берутся сначала из рюкзака, потом из сундука — и для розжига, и для подкидывания
  // §15.1 (v0.8.6): топливо > max − 8 — ветка не тратится: «В костёр» серая, подсказка «Костёр полный — положи ветки в сундук» (у сундука — сразу «В сундук»)
  const nearChest = dist(p, CFG.CHEST) < 2.3 && RES.some(k => p.inv[k] > 0); let full = null;
  if (df < 2.9) { const sticks = have(s, p, 'stick');
    if (s.fire.fuel <= 0 ? sticks >= (s.firstLight ? 1 : CFG.RELIGHT_STICKS) : sticks > 0) { if (!fireFull(s)) return { kind: s.fire.fuel <= 0 ? 'ignite' : 'fuel', x: 0, z: 0 }; full = { kind: 'fuel', full: true, x: 0, z: 0 }; } }
  if (nearChest) return { kind: 'deposit', x: CFG.CHEST.x, z: CFG.CHEST.z };
  for (const n of s.nodes) { if (!n.alive || n.k === 'rock' || (n.k === 'bush' && !n.berry) || (n.k === 'stump' && !n.loot)) continue;
    const d = dist(p, n) - (n.r || 0) * (n.s || 1); if (d < 1.4 && d < bd) { bd = d; best = { kind: n.k, id: n.id, x: n.x, z: n.z }; } }
  if (best) return best;
  if (dist(p, CFG.BENCH) < 2.6) return { kind: 'bench', x: CFG.BENCH.x, z: CFG.BENCH.z };
  return full;   // §15.1: у полного костра — серая «В костёр» (верстак/сундук рядом важнее)
}
export const fireFull = s => s.fire.fuel > 0 && s.fire.fuel > fireMax(s) - CFG.FUEL_STICK;   // §15.1: ветка «не влезет» — не тратим
export const nearBench = (s, p) => dist(p, CFG.BENCH) < 3.2;
export const nearFire = (s, p) => hyp(p.x, p.z) < 3.4;

// ---------- команды ----------
export function apply(s, c) {
  const p = s.players[c.pid]; if (!p || s.result) return;
  switch (c.t) {
    case 'move': { const l = hyp(c.x, c.z); p.in.x = l > 1 ? c.x / l : c.x; p.in.z = l > 1 ? c.z / l : c.z; break; }
    case 'act': return act(s, p);
    case 'craft': return craft(s, p, c.id);
    case 'eat': return eat(s, p);
    case 'flash': if (p.has.flash && p.sleep <= 0 && p.rest <= 0) { p.flash.on = !p.flash.on && p.flash.charge > 2; ev(s, { t: 'flash', pid: p.id, on: p.flash.on }); } break;
    case 'ping': ev(s, { t: 'ping', pid: p.id, x: p.x, z: p.z, msg: c.msg | 0 }); break;
  }
}
function gain(s, p, k, n, x, z) { if (!canAdd(p, k, n)) { n = 0; while (canAdd(p, k, n + 1)) n++; if (!n) { ev(s, { t: 'full', pid: p.id }); return 0; } } p.inv[k] = (p.inv[k] || 0) + n; ev(s, { t: 'gain', pid: p.id, k, n, x, z }); return n; }
const far = p => PETS[p.pet].farPoor && hyp(p.x, p.z) > PETS[p.pet].farPoor;
function gather(s, p, n) {   // §15 п.5: срабатывает в конце замаха; узел мог исчезнуть или питомец отойти — тогда ничего
  if (!n || !n.alive || (n.k === 'bush' && !n.berry) || (n.k === 'stump' && !n.loot) || dist(p, n) - (n.r || 0) * (n.s || 1) > 1.4 + .3) return;
  switch (n.k) {
    case 'tree': { if (!canAdd(p, 'stick', 1)) return ev(s, { t: 'full', pid: p.id }); n.hp -= 3 / PETS[p.pet].gatherHits; ev(s, { t: 'hit', pid: p.id, id: n.id, x: n.x, z: n.z });   // §15 п.5: ударов всегда 3, енот бьёт быстрее, а не сильнее
      if (n.hp <= .01) { n.alive = false; n.back = s.night + 2; markDirty(s); gain(s, p, 'stick', 3, n.x, n.z); ev(s, { t: 'node', id: n.id }); } break; }
    case 'branch': if (gain(s, p, 'stick', rand(s) < .4 && !far(p) ? 2 : 1, n.x, n.z)) { n.alive = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'stone': if (gain(s, p, 'stone', rand(s) < .3 && !far(p) ? 2 : 1, n.x, n.z)) { n.alive = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'bush': if (gain(s, p, 'berry', 2, n.x, n.z)) { n.berry = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'stump': if (gain(s, p, 'cloth', 1, n.x, n.z)) { n.loot = false; n.back = s.night + 2; ev(s, { t: 'node', id: n.id }); } break;
  }
}
function act(s, p) {
  if (p.cd > 0) return; const c = context(s, p.id); if (!c) return;
  const G = PETS[p.pet].gather || 1, gk = c.kind === 'tree' || c.kind === 'branch' || c.kind === 'stone' || c.kind === 'bush' || c.kind === 'stump';
  p.cd = gk ? .32 / G : .32; p.swing = 1; p.face = Math.atan2(c.x - p.x, c.z - p.z);   // §11.4: енот собирает ×1,2 быстрее
  // §15 п.5 (v0.8.6): сбор — замах GATHER_T, у енота в 1,2 раза короче; так ×1,2 работает и на одиночный тап, а не только на удержание
  if (gk) { p.pend = { id: c.id, t: CFG.GATHER_T / G }; return; }
  switch (c.kind) {
    case 'ignite': case 'fuel': { if (c.full) { p.cd = .5; return ev(s, { t: 'msg', pid: p.id, text: 'Костёр полный — положи ветки в сундук', full: 1 }); }   // §15.1
      const was = s.fire.fuel, first = was <= 0 && s.firstLight, n = was > 0 || first ? 1 : CFG.RELIGHT_STICKS;
      const fromChest = pay(s, p, { stick: n }).stick || 0;
      s.fire.fuel = Math.min(fireMax(s), first ? Math.round(fireMax(s) * CFG.FIRST_LIGHT) : s.fire.fuel + CFG.FUEL_STICK * n);
      if (was <= 0) s.firstLight = false; ev(s, { t: 'fuel', pid: p.id, n: Math.round(s.fire.fuel - was), relit: was <= 0, sticks: n, fromChest }); break; }
    case 'deposit': { const moved = {}; let left = 0;
      for (const k of RES) if (p.inv[k] > 0) { const m = Math.min(p.inv[k], chestFree(s, k)); if (m > 0) { s.chest[k] += m; moved[k] = m; p.inv[k] -= m; } left += p.inv[k]; }
      if (!Object.keys(moved).length) return ev(s, { t: 'msg', pid: p.id, text: 'Сундук полон (' + CFG.CHEST_SLOTS + ' слота) — потрать запасы', warn: true });
      ev(s, { t: 'deposit', pid: p.id, moved, full: left > 0 }); break; }
    case 'push': { if (p.str < 2) return; p.cd = PETS[p.pet].pushCd; p.str = Math.max(0, p.str - 3);
      if (PETS[p.pet].dash) { let tg = null, td = 1e9; for (const e of s.enemies) { if (!pushable(e)) continue; const d = dist(p, e); if (d < pushReach(p) && d < td) { td = d; tg = e; } }
        if (tg && td > pushR(p) - .6) { const m = Math.min(PETS[p.pet].dash, td - (pushR(p) - .6)); p.x += (tg.x - p.x) / td * m; p.z += (tg.z - p.z) / td * m; ev(s, { t: 'dash', pid: p.id, x: p.x, z: p.z }); } }
      for (const e of s.enemies) { if (!pushable(e) || dist(p, e) > pushR(p)) continue;
        if (e.k === 'mist' || e.k === 'moth') { e.dead = 1; ev(s, { t: 'poof', k: e.k, x: e.x, z: e.z }); } else if (e.k === 'crow') { e.leave = true; ev(s, { t: 'shoo', x: e.x, z: e.z }); } }   // §11.6: толчок — улетает насовсем во всех ночах
      ev(s, { t: 'push', pid: p.id }); break; }
    case 'wake': { const q = s.players[c.id]; if (!q || q.sleep <= 0) break;   // v0.8: удержание 2,5 с (кнопку держат — act идёт каждые 0,25 с)
      p.cd = .25; p.swing = 0; if (q.wakeBy !== p.id) q.wakeP = 0; q.wakeBy = p.id; q.wakeIdle = 0; q.wakeP = (q.wakeP || 0) + .25;
      if (q.wakeP >= CFG.REVIVE_HOLD - 1e-6) { q.sleep = 0; q.str = 30; q.wakeP = 0; q.wakeBy = null; ev(s, { t: 'wake', pid: q.id, by: p.id }); }
      else ev(s, { t: 'waking', pid: q.id, by: p.id, p: +(q.wakeP / CFG.REVIVE_HOLD).toFixed(2) }); break; }
    case 'bench': ev(s, { t: 'openBench', pid: p.id }); break;
  }
}
export function recipeState(s, p, r) {
  const done = r.done ? !!r.done(s, p) : false; const need = r.need ? r.need(s, p) : '';
  const where = r.at === 'fire' ? (nearFire(s, p) ? '' : 'У костра') : !nearBench(s, p) ? 'У верстака' : (r.bench || 1) > s.bench.lv ? 'Верстак ур. 2' : '';
  const ok = !done && !need && !where && (!r.ok || r.ok(s, p)) && canPay(s, p, costOf(s, r));
  return { done, need: need || where, ok };
}
function craft(s, p, id) {
  const r = RECIPES.find(x => x.id === id); if (!r) return; const st = recipeState(s, p, r); if (!st.ok) return;
  let spot = null; if (r.place) { const x = p.x + Math.sin(p.face) * 1.8, z = p.z + Math.cos(p.face) * 1.8; if (hyp(x, z) < 2.6 || dist({ x, z }, CFG.BENCH) < 1.8 || dist({ x, z }, CFG.CHEST) < 1.6 || hyp(x, z) > openR(s) - .5) return ev(s, { t: 'msg', pid: p.id, text: 'Здесь не поставить — отойди от лагеря', warn: true }); spot = { x, z }; }
  const fromChest = pay(s, p, costOf(s, r));
  switch (id) {
    case 'pie': p.inv.pie = (p.inv.pie || 0) + 1; break;
    case 'fire2': s.fire.lv = 2; s.fire.fuel = Math.min(fireMax(s), s.fire.fuel + 20); markDirty(s); break;
    case 'fire3': s.fire.lv = 3; s.fire.fuel = Math.min(fireMax(s), s.fire.fuel + 20); markDirty(s); break;
    case 'flash': p.has.flash = true; p.flash.charge = 100; break;
    case 'basket': p.has.basket = true; break;
    case 'basket2': p.has.basket2 = true; break;
    case 'bench2': s.bench.lv = 2; break;
    case 'lamp': s.builds.push({ id: newId(s), k: 'lamp', x: CFG.LAMP.x, z: CFG.LAMP.z, ry: 0 }); markDirty(s); break;
    case 'fence': s.builds.push({ id: newId(s), k: 'fence', x: +spot.x.toFixed(2), z: +spot.z.toFixed(2), ry: +p.face.toFixed(2) }); markDirty(s); break;
    case 'trap': s.builds.push({ id: newId(s), k: 'trap', x: +spot.x.toFixed(2), z: +spot.z.toFixed(2), ry: 0, cd: 0 }); break;
  }
  ev(s, { t: 'craft', pid: p.id, id, name: r.name, fromChest });
}
export const nearFood = p => dist(p, CFG.CHEST) < 2.5 || hyp(p.x, p.z) < 3.4;
function eat(s, p) {
  if (p.sleep > 0 || p.rest > 0) return;
  const pie = () => { p.inv.pie--; p.hunger = Math.min(100, p.hunger + 70); p.str = Math.min(100, p.str + 15); ev(s, { t: 'eat', pid: p.id, k: 'pie' }); };
  if (p.hunger > 97) return ev(s, { t: 'msg', pid: p.id, text: PETS[p.pet].name + ' сыт' });   // v0.8 (QA1-12): сытость — до любого поедания
  if (p.inv.pie > 0 && p.hunger < 60) return pie();
  const fromChest = !(p.inv.berry > 0) && s.chest.berry > 0 && nearFood(p);   // §11.5: у костра (и у сундука) ягоду можно съесть прямо из сундука
  if (!(p.inv.berry > 0) && !fromChest) { if (p.inv.pie > 0) return pie(); return ev(s, { t: 'msg', pid: p.id, text: 'Нет еды — собери ягоды', warn: true }); }
  if (fromChest) s.chest.berry--; else p.inv.berry--; p.hunger = Math.min(100, p.hunger + 25); ev(s, { t: 'eat', pid: p.id, k: 'berry' });
}

// ---------- шаг симуляции ----------
export function step(s, dt, cmds = []) {
  for (const c of cmds) apply(s, c);
  if (s.result) return;
  const g = dt * s.timeScale; s.t += g;
  if (s.phase === 'day' && s.t >= dayLen(s)) startNight(s);
  else if (s.phase === 'night' && s.t >= nightLen(s)) { dawn(s); if (s.result) return; }
  while (s.spawnQ.length && s.phase === 'night' && s.t >= s.spawnQ[0][0]) spawn(s, s.spawnQ.shift()[1]);
  // костёр: в самый первый соло-старт он не горит, пока его не разожгут (и не тает)
  const night = s.phase === 'night';
  if (s.fire.fuel > 0) { let burn = burnRate(s);
    for (const p of Object.values(s.players)) if (PETS[p.pet].fireSave < 1 && hyp(p.x, p.z) < 4) burn *= PETS[p.pet].fireSave;
    s.fire.fuel = Math.max(0, s.fire.fuel - burn * g); if (s.fire.fuel <= 0) ev(s, { t: 'fireOut' }); }
  const LR = lightR(s), OR = openR(s);
  for (const p of Object.values(s.players)) stepPlayer(s, p, dt, g, LR, OR, night);
  for (let i = s.enemies.length - 1; i >= 0; i--) stepEnemy(s, s.enemies[i], dt, g, LR);
  for (const b of s.builds) if (b.k === 'trap' && b.cd > 0) b.cd -= dt;
}
function stepPlayer(s, p, dt, g, LR, OR, night) {
  const P = PETS[p.pet]; p.cd -= dt; if (p.pend && (p.pend.t -= dt) <= 0) { const q = p.pend; p.pend = null; if (p.sleep <= 0 && p.rest <= 0) gather(s, p, s.nodes.find(n => n.id === q.id)); } p.swing = Math.max(0, p.swing - dt * 4); p.scareCd -= dt;
  const df = hyp(p.x, p.z), inLight = df < LR;
  const moving = hyp(p.vx, p.vz) > .5; p.hunger = Math.max(0, p.hunger - g * (100 / 180) * (moving ? 1.25 : 1) * (night ? 1.1 : 1));
  if (p.rest > 0) { p.rest -= g; p.vx = p.vz = 0; if (p.rest <= 0) { p.rest = 0; p.str = 50; ev(s, { t: 'wake', pid: p.id }); } return; }
  if (p.sleep > 0) { if (p.wakeP > 0 && (p.wakeIdle = (p.wakeIdle || 0) + dt) > .6) { p.wakeP = 0; p.wakeBy = null; }
    p.sleep -= g; p.vx = p.vz = 0; if (p.sleep <= 0) { p.sleep = 0; p.x = CFG.BED.x; p.z = CFG.BED.z; p.rest = 15; p.flash.on = false; ev(s, { t: 'dream', pid: p.id }); } return; }
  if (night && !inLight) p.str -= g * 4 * P.dark;
  else if (p.hunger > 0 && inLight) p.str += g * 8 * P.regen;
  if (p.hunger <= 0 && !(night && !inLight)) p.str -= g * 1;
  if (p.flash.on) { p.flash.charge -= g * 5; if (p.flash.charge <= 0) { p.flash.charge = 0; p.flash.on = false; ev(s, { t: 'flash', pid: p.id, on: false, empty: true }); } }
  else if (df < Math.max(LR, 3)) p.flash.charge = Math.min(100, p.flash.charge + g * 20);
  p.str = clamp(p.str, 0, 100);
  if (p.str <= 0) { p.sleep = startN(s) > 1 ? 20 : 5; p.flash.on = false; ev(s, { t: 'sleep', pid: p.id }); return; }
  if (P.ember && s.phase !== 'lobby') ember(s, p, P.ember, g);
  moveP(s, p, dt, OR);
}
// Движение питомца (то же на сервере и в клиентском предсказании своего питомца в коопе)
export function moveP(s, p, dt, OR = openR(s)) {
  const P = PETS[p.pet]; const spd = CFG.SPEED * P.speed * (p.hunger <= 0 ? .8 : 1), k = 1 - Math.exp(-12 * dt);
  p.vx += (p.in.x * spd - p.vx) * k; p.vz += (p.in.z * spd - p.vz) * k;
  p.x += p.vx * dt; p.z += p.vz * dt; collide(s, p, CFG.PLAYER_R, OR - .4);
  if (hyp(p.in.x, p.in.z) > .1) { let d = Math.atan2(p.in.x, p.in.z) - p.face; d = Math.atan2(Math.sin(d), Math.cos(d)); p.face += d * Math.min(1, dt * 12); }
}
// ---------- враги ----------
function spawn(s, k) {
  const ps = Object.values(s.players), R = openR(s) - .8; let a = rand(s) * 6.283; if (ps[0] && k !== 'moth') a = Math.atan2(ps[0].z, ps[0].x) + Math.PI + rr(s, -1.5, 1.5);
  const e = { id: newId(s), k, x: +(Math.cos(a) * R).toFixed(2), z: +(Math.sin(a) * R).toFixed(2), ry: 0, y: k === 'crow' ? 4 : k === 'moth' ? 2.6 : 0, hp: 1, st: 'go', tt: 0, cd: 0, lit: 0, held: 0, dead: 0, leave: false, orbit: rand(s) < .5 ? 1 : -1, ph: +rr(s, 0, 6).toFixed(2) };
  s.enemies.push(e); ev(s, { t: 'spawn', k, id: e.id, x: e.x, z: e.z });
}
function beams(s, e) { let n = 0; for (const p of Object.values(s.players)) { if (!p.flash.on) continue; const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz); if (d < 7.5 && d > .1 && (dx * Math.sin(p.face) + dz * Math.cos(p.face)) / d > .8) n++; } return n; }
function moveTo(s, e, tx, tz, sp, dt, limit = CFG.MAP) { const dx = tx - e.x, dz = tz - e.z, d = hyp(dx, dz); if (d < .05) return d; const st = Math.min(d, sp * dt); e.x += dx / d * st; e.z += dz / d * st; let a = Math.atan2(dx, dz) - e.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); e.ry += a * Math.min(1, dt * 8); if (e.y < 1) collide(s, e, e.k === 'moose' ? .6 : .4, limit); return d; }
// §11.4 гусь: гогочет за 5 с до того, как угроза дойдёт до костра (один раз на врага)
function honk(s, e, ps, d, sp) { if (e.honk || !ps.some(p => PETS[p.pet].warn)) return; if (d / sp <= 5) { e.honk = 1; ev(s, { t: 'honk', k: e.k, id: e.id, x: e.x, z: e.z }); } }
// §11.4 дракончик: огонёк раз в 10 с — отпугивает одну тень в 3,4 м, иначе (если есть фонарик и он не полон) +50% заряда
function ember(s, p, E, g) { if ((p.emberCd = (p.emberCd || 0) - g) > 0) return;
  let tg = null, td = E.r; for (const e of s.enemies) { if (!pushable(e)) continue; const d = dist(p, e); if (d < td) { td = d; tg = e; } }
  if (tg) { if (tg.k === 'crow') tg.leave = true; else tg.dead = 1; p.emberCd = E.cd; ev(s, { t: 'ember', pid: p.id, k: tg.k, x: tg.x, z: tg.z }); ev(s, { t: tg.k === 'crow' ? 'shoo' : 'poof', k: tg.k, x: tg.x, z: tg.z }); return; }
  if (p.has.flash && p.flash.charge < 100 - 1e-6) { p.flash.charge = Math.min(100, p.flash.charge + E.charge); p.emberCd = E.cd; ev(s, { t: 'ember', pid: p.id, charge: true, x: p.x, z: p.z }); } }
function stepEnemy(s, e, dt, g, LR) {
  if (e.dead) { e.dead += dt * 2.5; if (e.dead >= 2) s.enemies.splice(s.enemies.indexOf(e), 1); return; }
  const df = hyp(e.x, e.z) || 1, rx = e.x / df, rz = e.z / df, ps = Object.values(s.players).filter(p => p.sleep <= 0 && p.rest <= 0);
  if (e.leave || s.phase === 'day') { e.leave = true; moveTo(s, e, rx * 30, rz * 30, 4, dt, 40); if (e.k === 'crow' || e.k === 'moth') e.y = Math.min(8, e.y + dt * 2); if (df > openR(s) + 2) { e.dead = 1; } return; }
  if (e.held > 0) { e.held -= dt; return; }
  if (e.y < 1 && e.k !== 'crow') for (const b of s.builds) if (b.k === 'trap' && b.cd <= 0 && hyp(b.x - e.x, b.z - e.z) < .9) { e.held = 4; b.cd = 10; ev(s, { t: 'trap', id: e.id, x: b.x, z: b.z }); return; }
  const nb = beams(s, e);
  if (e.k === 'mist') { // клубочек мглы: катится к костру и задувает его
    if (nb) { e.lit += dt; if (e.lit > .5) { e.dead = 1; ev(s, { t: 'poof', k: 'mist', x: e.x, z: e.z }); return; } } else e.lit = Math.max(0, e.lit - dt);
    const calm = ps.find(p => PETS[p.pet].calm && hyp(p.x - e.x, p.z - e.z) < PETS[p.pet].calm), sp = calm ? 1.7 * PETS[calm.pet].calmK : 1.7;   // §11.4: ×0,75 в 4 м от капибары
    honk(s, e, ps, df - (s.fire.lv === 3 ? 2 : 1.7), sp);
    const d = moveTo(s, e, 0, 0, sp, dt); e.st = d < (s.fire.lv === 3 ? 2 : 1.7) ? 'blow' : 'go';
    // v0.8 (§10): урон 1,5 / 2,5 / 3,5 ед/с; дует до толчка, но не дольше 8 с (ночи 1–3) / 20 с (10–12); 4–9 — без лимита, как v0.7.0
    if (e.st === 'blow' && s.fire.fuel > 0) { s.fire.fuel = Math.max(0, s.fire.fuel - mistDmg(s.night) * g); if ((e.cd -= dt) <= 0) { e.cd = 1.2; ev(s, { t: 'blow', id: e.id }); }
      const mb = mistMaxBlow(s.night); if (mb && (e.bt = (e.bt || 0) + g) >= mb) { e.leave = true; ev(s, { t: 'tired', k: 'mist', id: e.id, x: e.x, z: e.z }); } }
  } else if (e.k === 'moth') { // лунный мотылёк: летит на свет, садится на костёр и окутывает пламя
    if (nb) { e.lit += dt; if (e.lit > .3) { e.dead = 1; ev(s, { t: 'poof', k: 'moth', x: e.x, z: e.z }); return; } } else e.lit = Math.max(0, e.lit - dt);
    if (e.st !== 'land') honk(s, e, ps, df - 1.1, 2.1);
    const tx = Math.cos(e.ph) * .5, tz = Math.sin(e.ph) * .5, d = moveTo(s, e, tx, tz, e.st === 'land' ? .3 : 2.1, dt, 30); e.ph += dt * .8;
    if (d < 1.1 && s.fire.fuel > 0) { if (e.st !== 'land') ev(s, { t: 'mothLand', id: e.id }); e.st = 'land'; e.y = Math.max(1.25, e.y - dt * 2); s.fire.fuel = Math.max(0, s.fire.fuel - CFG.MOTH_DMG * g); }
    else { e.st = 'go'; e.y = 1.8 + Math.sin(s.t * 3 + e.id) * .4; }
  } else if (e.k === 'crow') { // сонный ворон: садится на сундук или костёр и таскает запасы
    // v0.8.1 (§11.6): во всех ночах улетает насовсем только после толчка либо через 15 с у цели, подход не спугивает;
    //   луч фонарика спугивает (улетает и возвращается) во все ночи.
    if (nb && e.st !== 'flee') { ev(s, { t: 'shoo', x: e.x, z: e.z }); e.st = 'flee'; e.tt = 8; }
    if (e.st === 'flee') { e.tt -= dt; e.y = Math.min(6, e.y + dt * 4); moveTo(s, e, rx * 20, rz * 20, 5, dt, 30); if (e.tt <= 0) e.st = 'go'; return; }
    // §10: в ночи 1–3 ворон крадёт только из сундука и топливо не клюёт — сидит на сундуке
    const early = nightTier(s.night) === 0, chestHas = RES.some(k => s.chest[k] > 0), onChest = chestHas || early, T = onChest ? CFG.CHEST : { x: .8, z: .8 };
    if (e.st !== 'peck') honk(s, e, ps, hyp(e.x - T.x, e.z - T.z) - .3, 4);
    const d = moveTo(s, e, T.x, T.z, 4, dt, 30); e.y = d > 3 ? Math.min(4, e.y + dt * 2) : Math.max(onChest ? 1.1 : 1.3, e.y - dt * 3);
    if (d < .3 && (e.pt = (e.pt || 0) + g) >= CFG.CROW_STAY) { e.leave = true; ev(s, { t: 'tired', k: 'crow', id: e.id, x: e.x, z: e.z }); return; }
    if (d < .3) { e.st = 'peck'; if ((e.cd -= g) <= 0) { e.cd = 2.5; if (chestHas) { const ks = RES.filter(k => s.chest[k] > 0), k = ks[Math.floor(rand(s) * ks.length)]; s.chest[k]--; ev(s, { t: 'steal', k, x: e.x, z: e.z }); } else if (!early && s.fire.fuel > 0) { s.fire.fuel = Math.max(0, s.fire.fuel - 4); ev(s, { t: 'peck', x: e.x, z: e.z }); } } }
  } else if (e.k === 'moose') { // Лунный Лось: держится у края света, пугает во тьме, задувает слабый костёр
    e.cd -= dt; const late = s.night >= 7, weak = s.fire.fuel / fireMax(s) < .15;
    // на этапе 7–12 Лось чуть дольше не отступает от одного фонарика; два фонарика — сразу
    if (nb) { e.lit += dt; if (e.st !== 'flee' && (nb >= 2 || e.lit > (late ? .8 : 0))) { e.st = 'flee'; e.tt = 3; ev(s, { t: 'mooseLit', x: e.x, z: e.z }); } } else e.lit = Math.max(0, e.lit - dt * .5);
    if (e.st !== 'blow') e.honk = 0;   // §15 п.6: отступил/отвлёкся — при следующем заходе к костру гусь гогочет снова
    if (e.st === 'flee') { e.tt -= dt; moveTo(s, e, rx * 30, rz * 30, 2.6, dt); if (e.tt <= 0) { e.st = 'go'; e.lit = 0; } return; }
    if (df < LR - 1 && !weak) { moveTo(s, e, rx * 30, rz * 30, 2.2, dt); e.st = 'shy'; return; }
    const prey = ps.filter(p => hyp(p.x, p.z) > LR && hyp(p.x - e.x, p.z - e.z) < (PETS[p.pet].loud || 8)).sort((a, b) => hyp(a.x - e.x, a.z - e.z) - hyp(b.x - e.x, b.z - e.z))[0];
    if (weak) { honk(s, e, ps, df - 1.8, 1.4);   /* §15 п.6: гусь гогочет и на Лося, идущего к лагерю, — тоже за 5 с */ const d = moveTo(s, e, rx * 1.8, rz * 1.8, 1.4, dt); e.st = 'blow'; if (d < .4 && s.fire.fuel > 0) s.fire.fuel = Math.max(0, s.fire.fuel - 4 * g); }
    else if (prey && e.cd <= 0) { const d = moveTo(s, e, prey.x, prey.z, 2.4, dt); e.st = 'hunt'; if (d < 2.2) { prey.str = Math.max(0, prey.str - 27); e.cd = 6; ev(s, { t: 'scare', pid: prey.id, x: e.x, z: e.z }); } }
    else { const want = Math.max(LR, 3) + (s.wx.special ? 1.2 : late ? 1.5 : 4); const a = Math.atan2(e.z, e.x) + e.orbit * dt * (s.wx.special ? .12 : .06); moveTo(s, e, Math.cos(a) * want, Math.sin(a) * want, .9, dt); e.st = 'watch'; }
  }
}
// Волна ночи: от номера ночи и стартового состава (без пересчёта, если кто-то вышел). Числа — предложение GDD.
export function waveFor(s, n) {
  const extra = startN(s) - 1, w = weatherFor(s, n);
  const mist = 2 + Math.ceil(CFG.COOP_MIST * extra - 1e-9) + (n >= 8 ? 1 : 0);   // v0.7 (баланс ГД): база 2 в ночи 1–7, 3 в 8–12 (было +1 с 4-й и ещё +1 в 8–10)
  const crows = 1 + (extra >= 2 ? 1 : 0);
  return { mist, crows, moose: n >= 3 ? 1 : 0, moths: w.moths ? w.moths + CFG.COOP_MOTH * extra : 0, twoWaves: w.special };
}
function startNight(s) {
  s.phase = 'night'; s.t = 0; const n = s.night, L = nightLen(s); s.spawnQ = []; s.wx = weatherFor(s, n);
  const w = waveFor(s, n);
  // v0.8 (§9.3/9.5, QA1-03): ночь 10 — общее число на всю ночь: первая волна ceil(60%) к 30% ночи, вторая — остаток с середины
  if (w.twoWaves) { const h = Math.ceil(w.mist * .6 - 1e-9), r = w.mist - h; for (let i = 0; i < h; i++) s.spawnQ.push([3 + i * (L * .3 / h), 'mist']); for (let i = 0; i < r; i++) s.spawnQ.push([L * .5 + i * (L * .35 / Math.max(1, r)), 'mist']); }
  else for (let i = 0; i < w.mist; i++) s.spawnQ.push([3 + i * (L * .6 / w.mist), 'mist']);
  for (let i = 0; i < w.crows; i++) s.spawnQ.push([7 + i * 9, 'crow']);
  if (w.moose) s.spawnQ.push([w.twoWaves ? 1 : 4, 'moose']);
  // §12.2: мотыльки двумя волнами — с 8-й секунды и с середины ночи
  { const h = Math.ceil(w.moths / 2), r = w.moths - h; for (let i = 0; i < h; i++) s.spawnQ.push([8 + i * (L * .25 / h), 'moth']); for (let i = 0; i < r; i++) s.spawnQ.push([L * .5 + i * (L * .25 / r), 'moth']); }
  s.spawnQ.sort((a, b) => a[0] - b[0]); ev(s, { t: 'night', n, wx: s.wx });
}
// Награды — ориентир Экономиста (GDD v0.5, раздел 11): 15 за ранние ночи этапа, 25 за поздние, +30 ночь 10, +100 победа этапа.
export const nightCoins = (s, n) => (n - STAGES[stageOf(n) - 1].from + 1 <= 3 ? 15 : 25) + (n === 10 ? 30 : 0);
function dawn(s) {
  const n = s.night; s.spawnQ = []; for (const e of s.enemies) e.leave = true;
  if (s.fire.fuel <= 0) { s.result = { win: false, night: n, stage: s.stage, coins: s.coins }; ev(s, { t: 'lose', night: n }); return; }
  const coins = nightCoins(s, n); s.coins += coins; s.nightsDone++; const wasSpecial = s.wx.special; s.wx = weatherFor(s, 0);
  for (const q of s.nodes) {
    if (q.k === 'tree' && !q.alive && q.back <= n + 1) { q.alive = true; q.hp = 3; }
    if (q.k === 'bush' && !q.berry && rand(s) < .85) q.berry = true;
    if (q.k === 'stump' && !q.loot && q.back <= n + 1) q.loot = true;
    if ((q.k === 'branch' && rand(s) < .6 || q.k === 'stone' && rand(s) < .4) && !q.alive) q.alive = true;
  }
  markDirty(s);
  if (n >= STAGES[s.stage - 1].to) {   // победа этапа: к утру после последней ночи костёр горит
    s.coins += 100; s.result = { win: true, stage: s.stage, night: n, coins: s.coins, mvpEnd: s.stage >= CFG.MVP_STAGES };
    ev(s, { t: 'dawn', n, coins, special: wasSpecial, nodes: true }); ev(s, { t: 'stageWin', stage: s.stage, coins: s.coins }); return;
  }
  s.phase = 'day'; s.t = 0; s.dawnFlag = true; s.night = n + 1;
  ev(s, { t: 'dawn', n, coins, special: wasSpecial, nodes: true });
}
