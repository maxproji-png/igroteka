// «99 ночей» — симуляция мира. Чистый JS: без Three.js и DOM.
// Состояние — обычный сериализуемый объект (JSON), у всех сущностей есть id.
// Ввод приходит командами {t, pid, ...}. Этот же модуль сможет крутиться в комнате Colyseus на сервере:
// клиент шлёт команды, сервер вызывает step() и рассылает состояние/события.
export const CFG = {
  DAY: 75, NIGHT: 45, NIGHTS: 10,              // соло, по GDD v0.2 (кооп: 85/55, 90/60 — см. dayLen())
  MAP: 24,                                       // поле 48×48 м, играем в круге R=24
  OPEN: [0, 16, 24, 24], LIGHT: [0, 8, 12, 16],  // открытая зона и круг света по уровню костра
  FUEL_MAX: [0, 100, 130, 160], BURN: [0, 1, .85, .7], FUEL_STICK: 8,
  STACK: 5, BAG: 8, BAG_BASKET: 12, BAG_BASKET2: 16,
  SPEED: 4.4, PLAYER_R: .38,
  FIRE: { x: 0, z: 0 }, BENCH: { x: 3.6, z: -2.4 }, CHEST: { x: -3.6, z: -2.4 }, BED: { x: 0, z: 2.8 }, LAMP: { x: 0, z: -4.2 },
  FENCE_MAX: 6, TRAP_MAX: 3,
};
export const RES = ['stick', 'stone', 'berry', 'cloth'];
export const PETS = {
  raccoon:  { name: 'Енот',      gatherHits: 2, dark: 1.2, speed: 1,   bag: 0,  regen: 1,   pushCd: .8, fireSave: 1 },
  capybara: { name: 'Капибара',  gatherHits: 3, dark: 1,   speed: .88, bag: 0,  regen: 1.4, pushCd: .8, fireSave: 1 },
  dragon:   { name: 'Дракончик', gatherHits: 3, dark: 1,   speed: 1,   bag: -2, regen: 1,   pushCd: .8, fireSave: .85 },
  goose:    { name: 'Гусь',      gatherHits: 3, dark: 1,   speed: 1.05, bag: 0, regen: 1,   pushCd: .55, fireSave: 1, warn: true },
};
// Рецепты GDD v0.2 (соло-стоимости). at: где крафтится; bench: нужный уровень верстака.
export const RECIPES = [
  { id: 'pie',     name: 'Пирожок',            at: 'fire',  cost: { berry: 3 }, desc: '+70% сытости и немного сил' },
  { id: 'fire2',   name: 'Костёр · ур. 2',     at: 'fire',  cost: { stick: 15, stone: 5 }, desc: 'Круг света 12 м, открывает больше леса', ok: s => s.fire.lv === 1, done: s => s.fire.lv >= 2 },
  { id: 'fire3',   name: 'Костёр · ур. 3',     at: 'fire',  cost: { stick: 30, stone: 10, cloth: 3 }, desc: 'Свет 16 м, вся карта', ok: s => s.fire.lv === 2, done: s => s.fire.lv >= 3, need: s => s.fire.lv < 2 ? 'Нужен ур. 2' : '' },
  { id: 'flash',   name: 'Фонарик',            at: 'bench', bench: 1, cost: { stick: 4, stone: 3 }, desc: 'Луч отпугивает тени, заряд у костра', ok: (s, p) => !p.has.flash, done: (s, p) => p.has.flash },
  { id: 'basket',  name: 'Корзинка',           at: 'bench', bench: 1, cost: { stick: 5, cloth: 2 }, desc: 'Рюкзак 12 слотов', ok: (s, p) => !p.has.basket, done: (s, p) => p.has.basket },
  { id: 'fence',   name: 'Заборчик',           at: 'bench', bench: 1, cost: { stick: 6, stone: 2 }, desc: 'Сегмент перед тобой, задерживает мелких', ok: s => count(s, 'fence') < CFG.FENCE_MAX, place: true },
  { id: 'bench2',  name: 'Верстак · ур. 2',    at: 'bench', bench: 1, cost: { stick: 10, stone: 8 }, desc: 'Открывает новые рецепты', ok: s => s.bench.lv === 1, done: s => s.bench.lv >= 2 },
  { id: 'lamp',    name: 'Большой фонарь',     at: 'bench', bench: 2, cost: { stick: 8, stone: 6, cloth: 2 }, desc: 'Стационарный свет, круг +2 м', ok: s => !count(s, 'lamp'), done: s => count(s, 'lamp') > 0 },
  { id: 'trap',    name: 'Сеточка-ловушка',    at: 'bench', bench: 2, cost: { stick: 2, cloth: 4 }, desc: 'Ненадолго ловит врага', ok: s => count(s, 'trap') < CFG.TRAP_MAX, place: true },
  { id: 'basket2', name: 'Большая корзинка',   at: 'bench', bench: 2, cost: { stick: 8, cloth: 4 }, desc: 'Рюкзак 16 слотов', ok: (s, p) => p.has.basket && !p.has.basket2, done: (s, p) => p.has.basket2, need: (s, p) => p.has.basket ? '' : 'Нужна корзинка' },
];
const count = (s, k) => s.builds.filter(b => b.k === k).length;

// ---------- утилиты ----------
export const rand = s => (s.rng = s.rng * 16807 % 2147483647) / 2147483647;
const rr = (s, a, b) => a + (b - a) * rand(s);
const hyp = Math.hypot, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (a, b) => hyp(a.x - b.x, a.z - b.z);
const ev = (s, e) => s.ev.push(e);
export const dayLen = s => { const n = activeCount(s); return n <= 1 ? CFG.DAY : n === 2 ? 85 : 90; };
export const nightLen = s => { const n = activeCount(s); return n <= 1 ? CFG.NIGHT : n === 2 ? 55 : 60; };
const activeCount = s => Object.keys(s.players).length;
export const fireMax = s => CFG.FUEL_MAX[s.fire.lv];
export const lightR = s => s.fire.fuel <= 0 ? 0 : CFG.LIGHT[s.fire.lv] * (.55 + .45 * Math.sqrt(s.fire.fuel / fireMax(s))) + (count(s, 'lamp') ? 2 : 0);
export const openR = s => CFG.OPEN[s.fire.lv];
export const bagCap = p => (p.has.basket2 ? CFG.BAG_BASKET2 : p.has.basket ? CFG.BAG_BASKET : CFG.BAG) + PETS[p.pet].bag;
export const bagSlots = inv => RES.reduce((a, k) => a + Math.ceil((inv[k] || 0) / CFG.STACK), 0);
export const canAdd = (p, k, n) => bagSlots({ ...p.inv, [k]: (p.inv[k] || 0) + n }) <= bagCap(p);
export const have = (s, p, k) => (p.inv[k] || 0) + (s.chest[k] || 0);
export const canPay = (s, p, cost) => Object.entries(cost).every(([k, v]) => have(s, p, k) >= v);
function pay(s, p, cost) { const fromChest = {}; for (const [k, v] of Object.entries(cost)) { const a = Math.min(p.inv[k] || 0, v); p.inv[k] -= a; if (v > a) { s.chest[k] -= v - a; fromChest[k] = v - a; } } return fromChest; }
const newId = s => s.nextId++;

// ---------- создание мира ----------
export function createState({ seed = 99, timeScale = 1 } = {}) {
  const s = { v: 2, seed, rng: seed, nextId: 1, timeScale, phase: 'day', t: 0, night: 1, dawnFlag: false, result: null,
    fire: { fuel: 60, lv: 1 }, bench: { lv: 1 }, chest: { stick: 0, stone: 0, berry: 0, cloth: 0 },
    players: {}, nodes: [], builds: [], enemies: [], spawnQ: [], ev: [] };
  const free = (x, z, gap) => hyp(x, z) > 6.5 && s.nodes.every(n => hyp(n.x - x, n.z - z) > (n.r || .4) + gap);
  const spot = (r0, r1, gap) => { for (let k = 0; k < 400; k++) { const a = rand(s) * 6.283, r = Math.sqrt(rr(s, r0 * r0, r1 * r1)), x = Math.cos(a) * r, z = Math.sin(a) * r; if (free(x, z, gap)) return [x, z]; } return [rr(s, -20, 20), rr(s, -20, 20)]; };
  const add = (k, n, r0, r1, gap, extra = {}) => { for (let i = 0; i < n; i++) { const [x, z] = spot(r0, r1, gap); s.nodes.push({ id: newId(s), k, x: +x.toFixed(2), z: +z.toFixed(2), ry: +rr(s, 0, 6.28).toFixed(2), s: +rr(s, .85, 1.25).toFixed(2), alive: true, ...extra(i) }); } };
  add('rock', 10, 8, 23, 2.2, () => ({ r: .9 }));
  add('tree', 46, 8, 23.5, 1.5, () => ({ r: .32, hp: 3, back: 0, sub: rand(s) < .55 ? 0 : 1 }));
  add('bush', 16, 7, 22, 1.2, i => ({ r: .45, berry: true }));
  add('stump', 7, 9, 23, 1.4, () => ({ r: .35, loot: true, back: 0 }));
  add('branch', 30, 6.5, 22, .7, () => ({}));
  add('stone', 22, 7, 22, .7, () => ({}));
  return s;
}
export function addPlayer(s, id, pet = 'raccoon', name = '') {
  s.players[id] = { id, pet, name, x: 0, z: 4.2, face: Math.PI, vx: 0, vz: 0, in: { x: 0, z: 0 }, str: 100, hunger: 100,
    inv: { stick: 0, stone: 0, berry: 0, cloth: 0, pie: 0 }, has: { flash: false, basket: false, basket2: false }, flash: { on: false, charge: 100 },
    sleep: 0, rest: 0, cd: 0, swing: 0, scareCd: 0, slot: Object.keys(s.players).length + 1 };
  return s.players[id];
}
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
export function context(s, pid) {
  const p = s.players[pid]; if (!p || p.sleep > 0 || p.rest > 0) return null;
  let best = null, bd = 1e9;
  for (const q of Object.values(s.players)) if (q !== p && q.sleep > 0) { const d = dist(p, q); if (d < 2 && d < bd) { bd = d; best = { kind: 'wake', id: q.id, x: q.x, z: q.z }; } }
  if (best) return best;
  for (const e of s.enemies) { if (e.dead || e.leave || e.k === 'moose' || e.y > 1.5) continue; const d = dist(p, e); if (d < 2.4 && d < bd) { bd = d; best = { kind: 'push', id: e.id, x: e.x, z: e.z }; } }
  if (best) return best;
  const df = hyp(p.x, p.z);
  if (df < 2.9 && (p.inv.stick > 0 || (s.fire.fuel <= 0 && s.chest.stick > 0)) && s.fire.fuel < fireMax(s) - 3) return { kind: 'fuel', x: 0, z: 0 };
  if (dist(p, CFG.CHEST) < 2.3 && RES.some(k => p.inv[k] > 0)) return { kind: 'deposit', x: CFG.CHEST.x, z: CFG.CHEST.z };
  for (const n of s.nodes) { if (!n.alive || n.k === 'rock' || (n.k === 'bush' && !n.berry) || (n.k === 'stump' && !n.loot)) continue;
    const d = dist(p, n) - (n.r || 0) * (n.s || 1); if (d < 1.4 && d < bd) { bd = d; best = { kind: n.k, id: n.id, x: n.x, z: n.z }; } }
  if (best) return best;
  if (dist(p, CFG.BENCH) < 2.6) return { kind: 'bench', x: CFG.BENCH.x, z: CFG.BENCH.z };
  return null;
}
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
  }
}
function gain(s, p, k, n, x, z) { if (!canAdd(p, k, n)) { n = 0; while (canAdd(p, k, n + 1)) n++; if (!n) { ev(s, { t: 'full', pid: p.id }); return 0; } } p.inv[k] = (p.inv[k] || 0) + n; ev(s, { t: 'gain', pid: p.id, k, n, x, z }); return n; }
function act(s, p) {
  if (p.cd > 0) return; const c = context(s, p.id); if (!c) return;
  p.cd = .32; p.swing = 1; p.face = Math.atan2(c.x - p.x, c.z - p.z);
  const n = c.id ? s.nodes.find(q => q.id === c.id) : null;
  switch (c.kind) {
    case 'tree': { if (!canAdd(p, 'stick', 1)) return ev(s, { t: 'full', pid: p.id }); n.hp -= 3 / PETS[p.pet].gatherHits; ev(s, { t: 'hit', id: n.id, x: n.x, z: n.z });
      if (n.hp <= .01) { n.alive = false; n.back = s.night + 2; markDirty(s); gain(s, p, 'stick', 3, n.x, n.z); ev(s, { t: 'node', id: n.id }); } break; }
    case 'branch': if (gain(s, p, 'stick', rand(s) < .4 ? 2 : 1, n.x, n.z)) { n.alive = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'stone': if (gain(s, p, 'stone', rand(s) < .3 ? 2 : 1, n.x, n.z)) { n.alive = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'bush': if (gain(s, p, 'berry', 2, n.x, n.z)) { n.berry = false; ev(s, { t: 'node', id: n.id }); } break;
    case 'stump': if (gain(s, p, 'cloth', 1, n.x, n.z)) { n.loot = false; n.back = s.night + 2; ev(s, { t: 'node', id: n.id }); } break;
    case 'fuel': { const was = s.fire.fuel; if (p.inv.stick > 0) p.inv.stick--; else s.chest.stick--; s.fire.fuel = Math.min(fireMax(s), s.fire.fuel + CFG.FUEL_STICK); ev(s, { t: 'fuel', pid: p.id, n: Math.round(s.fire.fuel - was), relit: was <= 0 }); break; }
    case 'deposit': { const moved = {}; for (const k of RES) if (p.inv[k] > 0) { s.chest[k] += p.inv[k]; moved[k] = p.inv[k]; p.inv[k] = 0; } ev(s, { t: 'deposit', pid: p.id, moved }); break; }
    case 'push': { if (p.str < 2) return; p.cd = PETS[p.pet].pushCd; p.str = Math.max(0, p.str - 3); for (const e of s.enemies) { if (e.dead || dist(p, e) > 2.6) continue; if (e.k === 'mist') { e.dead = 1; ev(s, { t: 'poof', x: e.x, z: e.z }); } else if (e.k === 'crow') { e.st = 'flee'; e.tt = 8; ev(s, { t: 'shoo', x: e.x, z: e.z }); } } ev(s, { t: 'push', pid: p.id }); break; }
    case 'wake': { const q = s.players[c.id]; if (q && q.sleep > 0) { q.sleep = 0; q.str = 30; ev(s, { t: 'wake', pid: q.id }); } break; }
    case 'bench': ev(s, { t: 'openBench', pid: p.id }); break;
  }
}
export function recipeState(s, p, r) {
  const done = r.done ? !!r.done(s, p) : false; const need = r.need ? r.need(s, p) : '';
  const where = r.at === 'fire' ? (nearFire(s, p) ? '' : 'У костра') : !nearBench(s, p) ? 'У верстака' : (r.bench || 1) > s.bench.lv ? 'Верстак ур. 2' : '';
  const ok = !done && !need && !where && (!r.ok || r.ok(s, p)) && canPay(s, p, r.cost) && !(r.id === 'pie' && !canAdd(p, 'pie', 1) && false);
  return { done, need: need || where, ok };
}
function craft(s, p, id) {
  const r = RECIPES.find(x => x.id === id); if (!r) return; const st = recipeState(s, p, r); if (!st.ok) return;
  let spot = null; if (r.place) { const x = p.x + Math.sin(p.face) * 1.8, z = p.z + Math.cos(p.face) * 1.8; if (hyp(x, z) < 2.6 || dist({ x, z }, CFG.BENCH) < 1.8 || dist({ x, z }, CFG.CHEST) < 1.6 || hyp(x, z) > openR(s) - .5) return ev(s, { t: 'msg', pid: p.id, text: 'Здесь не поставить — отойди от лагеря', warn: true }); spot = { x, z }; }
  const fromChest = pay(s, p, r.cost);
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
function eat(s, p) {
  if (p.sleep > 0 || p.rest > 0) return;
  if (p.inv.pie > 0 && p.hunger < 60) { p.inv.pie--; p.hunger = Math.min(100, p.hunger + 70); p.str = Math.min(100, p.str + 15); return ev(s, { t: 'eat', pid: p.id, k: 'pie' }); }
  const fromChest = !(p.inv.berry > 0) && s.chest.berry > 0 && dist(p, CFG.CHEST) < 2.5;
  if (!(p.inv.berry > 0) && !fromChest) { if (p.inv.pie > 0) { p.inv.pie--; p.hunger = Math.min(100, p.hunger + 70); p.str = Math.min(100, p.str + 15); return ev(s, { t: 'eat', pid: p.id, k: 'pie' }); } return ev(s, { t: 'msg', pid: p.id, text: 'Нет еды — собери ягоды', warn: true }); }
  if (p.hunger > 97) return ev(s, { t: 'msg', pid: p.id, text: PETS[p.pet].name + ' сыт' });
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
  // костёр
  const night = s.phase === 'night', nP = activeCount(s);
  if (s.fire.fuel > 0) { let burn = CFG.BURN[s.fire.lv] * (night ? 1 + .2 * (nP - 1) : .5);
    for (const p of Object.values(s.players)) if (PETS[p.pet].fireSave < 1 && hyp(p.x, p.z) < 4) burn *= PETS[p.pet].fireSave;
    s.fire.fuel = Math.max(0, s.fire.fuel - burn * g); if (s.fire.fuel <= 0) ev(s, { t: 'fireOut' }); }
  const LR = lightR(s), OR = openR(s);
  for (const p of Object.values(s.players)) stepPlayer(s, p, dt, g, LR, OR, night);
  for (let i = s.enemies.length - 1; i >= 0; i--) stepEnemy(s, s.enemies[i], dt, g, LR);
  for (const b of s.builds) if (b.k === 'trap' && b.cd > 0) b.cd -= dt;
}
function stepPlayer(s, p, dt, g, LR, OR, night) {
  const P = PETS[p.pet]; p.cd -= dt; p.swing = Math.max(0, p.swing - dt * 4); p.scareCd -= dt;
  const df = hyp(p.x, p.z), inLight = df < LR;
  // голод
  const moving = hyp(p.vx, p.vz) > .5; p.hunger = Math.max(0, p.hunger - g * (100 / 180) * (moving ? 1.25 : 1) * (night ? 1.1 : 1));
  // силы
  if (p.rest > 0) { p.rest -= g; p.vx = p.vz = 0; if (p.rest <= 0) { p.rest = 0; p.str = 50; ev(s, { t: 'wake', pid: p.id }); } return; }
  if (p.sleep > 0) { p.sleep -= g; p.vx = p.vz = 0; if (p.sleep <= 0) { p.sleep = 0; p.x = CFG.BED.x; p.z = CFG.BED.z; p.rest = 15; p.flash.on = false; ev(s, { t: 'dream', pid: p.id }); } return; }
  if (night && !inLight) p.str -= g * 4 * P.dark;
  else if (p.hunger > 0 && inLight) p.str += g * 8 * P.regen;
  if (p.hunger <= 0 && !(night && !inLight)) p.str -= g * 1;
  if (p.flash.on) { p.flash.charge -= g * 5; if (p.flash.charge <= 0) { p.flash.charge = 0; p.flash.on = false; ev(s, { t: 'flash', pid: p.id, on: false, empty: true }); } }
  else if (df < Math.max(LR, 3)) p.flash.charge = Math.min(100, p.flash.charge + g * 20);
  p.str = clamp(p.str, 0, 100);
  if (p.str <= 0) { p.sleep = activeCount(s) > 1 ? 20 : 5; p.flash.on = false; ev(s, { t: 'sleep', pid: p.id }); return; }
  // движение
  const spd = CFG.SPEED * P.speed * (p.hunger <= 0 ? .8 : 1), k = 1 - Math.exp(-12 * dt);
  p.vx += (p.in.x * spd - p.vx) * k; p.vz += (p.in.z * spd - p.vz) * k;
  p.x += p.vx * dt; p.z += p.vz * dt; collide(s, p, CFG.PLAYER_R, OR - .4);
  if (hyp(p.in.x, p.in.z) > .1) { let d = Math.atan2(p.in.x, p.in.z) - p.face; d = Math.atan2(Math.sin(d), Math.cos(d)); p.face += d * Math.min(1, dt * 12); }
}
// ---------- враги ----------
function spawn(s, k) {
  const ps = Object.values(s.players), R = openR(s) - .8; let a = rand(s) * 6.283; if (ps[0]) a = Math.atan2(ps[0].z, ps[0].x) + Math.PI + rr(s, -1.5, 1.5);
  const e = { id: newId(s), k, x: +(Math.cos(a) * R).toFixed(2), z: +(Math.sin(a) * R).toFixed(2), ry: 0, y: k === 'crow' ? 4 : 0, hp: 1, st: 'go', tt: 0, cd: 0, lit: 0, held: 0, dead: 0, leave: false, orbit: rand(s) < .5 ? 1 : -1 };
  s.enemies.push(e); ev(s, { t: 'spawn', k, id: e.id, x: e.x, z: e.z });
}
function inBeam(s, e) { for (const p of Object.values(s.players)) { if (!p.flash.on) continue; const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz); if (d < 7.5 && d > .1 && (dx * Math.sin(p.face) + dz * Math.cos(p.face)) / d > .8) return p; } return null; }
function moveTo(s, e, tx, tz, sp, dt, limit = CFG.MAP) { const dx = tx - e.x, dz = tz - e.z, d = hyp(dx, dz); if (d < .05) return d; const st = Math.min(d, sp * dt); e.x += dx / d * st; e.z += dz / d * st; let a = Math.atan2(dx, dz) - e.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); e.ry += a * Math.min(1, dt * 8); if (e.y < 1) collide(s, e, e.k === 'moose' ? .6 : .4, limit); return d; }
function stepEnemy(s, e, dt, g, LR) {
  if (e.dead) { e.dead += dt * 2.5; if (e.dead >= 2) s.enemies.splice(s.enemies.indexOf(e), 1); return; }
  const df = hyp(e.x, e.z) || 1, rx = e.x / df, rz = e.z / df, ps = Object.values(s.players).filter(p => p.sleep <= 0 && p.rest <= 0);
  if (e.leave || s.phase === 'day') { e.leave = true; moveTo(s, e, rx * 30, rz * 30, 4, dt, 40); if (e.k === 'crow') e.y = Math.min(8, e.y + dt * 2); if (df > openR(s) + 2) { e.dead = 1; } return; }
  // ловушка
  if (e.held > 0) { e.held -= dt; return; }
  if (e.y < 1 && e.k !== 'crow') for (const b of s.builds) if (b.k === 'trap' && b.cd <= 0 && hyp(b.x - e.x, b.z - e.z) < .9) { e.held = 4; b.cd = 10; ev(s, { t: 'trap', id: e.id, x: b.x, z: b.z }); return; }
  const beam = inBeam(s, e);
  if (e.k === 'mist') { // клубочек мглы: катится к костру и задувает его
    if (beam) { e.lit += dt; if (e.lit > .5) { e.dead = 1; ev(s, { t: 'poof', x: e.x, z: e.z }); return; } } else e.lit = Math.max(0, e.lit - dt);
    const d = moveTo(s, e, 0, 0, 1.7, dt); e.st = d < (s.fire.lv === 3 ? 2 : 1.7) ? 'blow' : 'go';
    if (e.st === 'blow' && s.fire.fuel > 0) { s.fire.fuel = Math.max(0, s.fire.fuel - 2.5 * g); if ((e.cd -= dt) <= 0) { e.cd = 1.2; ev(s, { t: 'blow', id: e.id }); } }
  } else if (e.k === 'crow') { // сонный ворон: садится на сундук или костёр и таскает запасы
    const near = ps.find(p => hyp(p.x - e.x, p.z - e.z) < 2.6);
    if (beam || (near && e.st !== 'flee')) { e.st = 'flee'; e.tt = 8; ev(s, { t: 'shoo', x: e.x, z: e.z }); }
    if (e.st === 'flee') { e.tt -= dt; e.y = Math.min(6, e.y + dt * 4); moveTo(s, e, rx * 20, rz * 20, 5, dt, 30); if (e.tt <= 0) e.st = 'go'; return; }
    const chestHas = RES.some(k => s.chest[k] > 0), T = chestHas ? CFG.CHEST : { x: .8, z: .8 };
    const d = moveTo(s, e, T.x, T.z, 4, dt, 30); e.y = d > 3 ? Math.min(4, e.y + dt * 2) : Math.max(chestHas ? 1.1 : 1.3, e.y - dt * 3);
    if (d < .3) { e.st = 'peck'; if ((e.cd -= g) <= 0) { e.cd = 2.5; if (chestHas) { const ks = RES.filter(k => s.chest[k] > 0), k = ks[Math.floor(rand(s) * ks.length)]; s.chest[k]--; ev(s, { t: 'steal', k, x: e.x, z: e.z }); } else if (s.fire.fuel > 0) { s.fire.fuel = Math.max(0, s.fire.fuel - 4); ev(s, { t: 'peck', x: e.x, z: e.z }); } } }
  } else if (e.k === 'moose') { // Лунный Лось: держится у края света, пугает во тьме, задувает слабый костёр
    e.cd -= dt; const late = s.night >= 7, weak = s.fire.fuel / fireMax(s) < .15;
    if (beam) { e.st = 'flee'; e.tt = 3; }
    if (e.st === 'flee') { e.tt -= dt; moveTo(s, e, rx * 30, rz * 30, 2.6, dt); if (e.tt <= 0) e.st = 'go'; return; }
    if (df < LR - 1 && !weak) { moveTo(s, e, rx * 30, rz * 30, 2.2, dt); e.st = 'shy'; return; }
    const prey = ps.filter(p => hyp(p.x, p.z) > LR && hyp(p.x - e.x, p.z - e.z) < 8).sort((a, b) => hyp(a.x - e.x, a.z - e.z) - hyp(b.x - e.x, b.z - e.z))[0];
    if (weak) { const d = moveTo(s, e, rx * 1.8, rz * 1.8, 1.4, dt); e.st = 'blow'; if (d < .4 && s.fire.fuel > 0) s.fire.fuel = Math.max(0, s.fire.fuel - 4 * g); }
    else if (prey && e.cd <= 0) { const d = moveTo(s, e, prey.x, prey.z, 2.4, dt); e.st = 'hunt'; if (d < 2.2) { prey.str = Math.max(0, prey.str - 27); e.cd = 6; ev(s, { t: 'scare', pid: prey.id, x: e.x, z: e.z }); } }
    else { const want = Math.max(LR, 3) + (late ? 1.5 : 4); const a = Math.atan2(e.z, e.x) + e.orbit * dt * .06; moveTo(s, e, Math.cos(a) * want, Math.sin(a) * want, .9, dt); e.st = 'watch'; }
  }
}
function startNight(s) {
  s.phase = 'night'; s.t = 0; const n = s.night, extra = activeCount(s) - 1; s.spawnQ = [];
  const mist = Math.min(2 + Math.floor(n * .7) + extra, 10), crows = (n >= 2 ? 1 : 0) + (n >= 6 ? 1 : 0) + (extra >= 2 ? 1 : 0) + (extra >= 3 ? 1 : 0);
  for (let i = 0; i < mist; i++) s.spawnQ.push([3 + i * (nightLen(s) * .6 / mist), 'mist']);
  for (let i = 0; i < crows; i++) s.spawnQ.push([6 + i * 9, 'crow']);
  if (n >= 3) s.spawnQ.push([4, 'moose']);
  s.spawnQ.sort((a, b) => a[0] - b[0]); ev(s, { t: 'night', n });
}
function dawn(s) {
  const n = s.night; s.spawnQ = []; for (const e of s.enemies) e.leave = true;
  if (s.fire.fuel <= 0) { s.result = { win: false, nights: n - 1 }; ev(s, { t: 'lose', nights: n - 1 }); return; }
  if (n >= CFG.NIGHTS) { s.result = { win: true, nights: n }; ev(s, { t: 'win', nights: n }); return; }
  s.phase = 'day'; s.t = 0; s.dawnFlag = true; s.night = n + 1;
  for (const q of s.nodes) {
    if (q.k === 'tree' && !q.alive && q.back <= s.night) { q.alive = true; q.hp = 3; }
    if (q.k === 'bush' && !q.berry && rand(s) < .85) q.berry = true;
    if (q.k === 'stump' && !q.loot && q.back <= s.night) q.loot = true;
    if ((q.k === 'branch' && rand(s) < .6 || q.k === 'stone' && rand(s) < .4) && !q.alive) q.alive = true;
  }
  markDirty(s); ev(s, { t: 'dawn', n, nodes: true });
}
