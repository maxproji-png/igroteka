// «99 ночей» — компактный сетевой протокол v0.8.2 (общий для клиента и сервера; сервер берёт копию через npm run sync).
// Всё целыми: координаты/скорости/таймеры — сантиметры/сотые (×100), углы — сотые радиана в [-π, π], игрок — индекс слота.
// snap (10 Гц) несёт только изменившиеся строки; клиент хранит «текущее» состояние строк и дополняет снимок до полного.
export const Q = 100, INV = ['stick', 'stone', 'berry', 'cloth', 'pie'], HAS = ['flash', 'basket', 'basket2'], CH = ['stick', 'stone', 'berry', 'cloth'];
const q = v => Math.round((v || 0) * Q), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const trim = (a, min) => { while (a.length > min && a[a.length - 1] === 0) a.pop(); return a; };
export const slotsOf = s => Object.keys(s.players);                                              // порядок вставки = порядок лобби = слот
export const pRow = (p, i) => trim([i, q(p.x), q(p.z), q(wrap(p.face || 0)), q(p.vx), q(p.vz), q(Math.max(0, p.swing || 0)), q(Math.max(0, p.cd || 0))], 3);   // быстрые поля игрока
export const sRow = (p, i) => [i, Math.round(p.str), Math.round(p.hunger), q(p.sleep), p.flash.on ? 1 : 0, p.away ? 1 : 0, q(p.rest)];   // медленные
export const eRow = e => trim([e.id, q(e.x), q(e.z), q(wrap(e.ry || 0)), q(e.y)], 3);
export const mRow = e => [e.id, e.k, e.st || '', q(e.dead), e.leave ? 1 : 0];
export const nRow = n => [n.id, n.alive ? 1 : 0, n.berry ? 1 : 0, n.loot ? 1 : 0, q(n.hp)];
export const bRow = b => [b.id, b.k, q(b.x), q(b.z), q(b.ry)];
export const iRow = (p, i) => [i, INV.map(k => p.inv[k] | 0), HAS.reduce((b, k, j) => b | (p.has[k] ? 1 << j : 0), 0), Math.round(p.flash.charge)];
export const same = (a, b) => { if (!a || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
export const PH = ['day', 'night'];

// ---------- клиент: «текущее» состояние строк, построенное из полного снимка (старт / resync) ----------
export function makeCur(s) {
  const slots = slotsOf(s), ps = slots.map(id => s.players[id]);
  return { slots, p: new Map(ps.map((p, i) => [i, pRow(p, i)])), s: new Map(ps.map((p, i) => [i, sRow(p, i)])),
    e: new Map(s.enemies.map(e => [e.id, eRow(e)])), m: new Map(s.enemies.map(e => [e.id, mRow(e)])) };
}
// применяет дельта-снимок; возвращает полный кадр в метрах для интерполяции: { p: Map pid→[x,z,face,vx,vz,swing,cd], e: Map id→[x,z,y,ry] }
export function applySnap(cur, m) {
  for (const r of m.p || []) cur.p.set(r[0], r);
  for (const r of m.s || []) cur.s.set(r[0], r);
  for (const id of m.x || []) { cur.e.delete(id); cur.m.delete(id); }
  for (const r of m.e || []) cur.e.set(r[0], r);
  for (const r of m.m || []) cur.m.set(r[0], r);
  const P = new Map(), E = new Map(), d = v => (v || 0) / Q;
  for (const [i, r] of cur.p) P.set(cur.slots[i], [d(r[1]), d(r[2]), d(r[3]), d(r[4]), d(r[5]), d(r[6]), d(r[7])]);
  for (const [id, r] of cur.e) E.set(id, [d(r[1]), d(r[2]), d(r[4]), d(r[3])]);
  return { p: P, e: E };
}
export const slowOf = r => ({ str: r[1], hunger: r[2], sleep: r[3] / Q, flash: !!r[4], away: !!r[5], rest: r[6] / Q });
export const metaOf = r => ({ id: r[0], k: r[1], st: r[2], dead: r[3] / Q, leave: !!r[4] });
// мир-дельта → применить к состоянию S (узлы по id, сундук, постройки, верстак, уровень костра, первый огонь, рюкзаки по слоту)
export function applyWorld(S, nodeMap, slots, w) {
  for (const [id, alive, berry, loot, hp] of w.nd || []) { const n = nodeMap.get(id); if (n) { n.alive = !!alive; n.berry = !!berry; n.loot = !!loot; n.hp = hp / Q; } }
  if (w.ch) CH.forEach((k, j) => S.chest[k] = w.ch[j]);
  if (w.b) S.builds = w.b.map(([id, k, x, z, ry]) => ({ id, k, x: x / Q, z: z / Q, ry: ry / Q })); if (w.bl != null) S.bench.lv = w.bl; if (w.lv != null) S.fire.lv = w.lv; if (w.fl != null) S.firstLight = !!w.fl;
  for (const [i, inv, has, ch] of w.iv || []) { const p = S.players[slots[i]]; if (!p) continue; INV.forEach((k, j) => p.inv[k] = inv[j]); HAS.forEach((k, j) => p.has[k] = !!(has & 1 << j)); p.flash.charge = ch; }
}
