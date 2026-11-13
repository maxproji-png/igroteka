// Тапыши · «Улучшить» · общая модель (макет). Каждое улучшение = +1 уровень питомца.
// Старт как на главной: 12 000 монет, Булочка ур. 7 («Иней», стадия 2).
export const STAGE_AT = [1, 5, 10, 15, 20, 25];
export const STAGE_NAMES = ['Снежок', 'Иней', 'Льдинка', 'Морозко', 'Вьюжка', 'Снежная Звёздочка'];
export const PET_NAME = 'Булочка';
export const stageOf = lv => { for (let i = 5; i >= 0; i--) if (lv >= STAGE_AT[i]) return i + 1; return 1; };
export const petImg = st => `../common/pet/raccoon_${st}.webp?v=up11140230`;
export const fmt = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
export const dec = n => String(Math.round(n * 10) / 10).replace('.', ',');
const round50 = n => n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50;

export const UPG = [
  { id: 'tap', name: 'Доход за тап', short: 'Доход', icon: 'u-tap', color: 'sun', max: 15, lvl: 3,
    hint: 'Монет за каждый тап по Булочке',
    val: l => 1 + l, show: v => '+' + v, unit: 'за тап', cost: l => round50(260 * Math.pow(1.55, l)) },
  { id: 'energy', name: 'Запас энергии', short: 'Запас', icon: 'u-energy', color: 'green', max: 10, lvl: 2,
    hint: 'Сколько тапов подряд без отдыха',
    val: l => 210 + 60 * l, show: v => fmt(v), unit: 'энергии', cost: l => round50(240 * Math.pow(1.5, l)) },
  { id: 'regen', name: 'Скорость восстановления', short: 'Восстановление', icon: 'u-regen', color: 'violet', max: 5, lvl: 1,
    hint: 'Энергия возвращается быстрее',
    val: l => .5 + .5 * l, show: v => dec(v), unit: 'энергии/с', cost: l => round50(380 * Math.pow(1.7, l)) },
  { id: 'auto', name: 'Автотап', short: 'Автотап', icon: 'u-auto', color: 'violet', max: 10, lvl: 0,
    hint: 'Булочка тапает сама, даже когда вас нет',
    val: l => l * .5, show: v => v ? dec(v) : 'выкл', unit: 'тапа/с', cost: l => round50(2400 * Math.pow(1.6, l)) }
];

export const S = { coins: 12000, energy: 330, get level() { return 1 + UPG.reduce((a, u) => a + u.lvl, 0); } };
// 1 + 3 + 2 + 1 + 0 = 7 — совпадает с главной

export function info(u) {
  const maxed = u.lvl >= u.max;
  const cost = maxed ? 0 : u.cost(u.lvl);
  return { maxed, cost, now: u.show(u.val(u.lvl)), next: maxed ? null : u.show(u.val(u.lvl + 1)), can: !maxed && S.coins >= cost, short: maxed ? 0 : Math.max(0, cost - S.coins) };
}
export function progress() {
  const lv = S.level, st = stageOf(lv);
  if (st >= 6) return { lv, st, from: STAGE_AT[5], to: null, left: 0, frac: 1 };
  const from = STAGE_AT[st - 1], to = STAGE_AT[st];
  return { lv, st, from, to, left: to - lv, frac: (lv - from) / (to - from) };
}
export function buy(id) {
  const u = UPG.find(x => x.id === id), i = info(u);
  if (!i.can) return { ok: false, reason: i.maxed ? 'max' : 'coins', short: i.short };
  const st0 = stageOf(S.level);
  S.coins -= i.cost; u.lvl++;
  if (u.id === 'energy') S.energy = u.val(u.lvl);
  const st1 = stageOf(S.level);
  return { ok: true, cost: i.cost, stageUp: st1 > st0, from: st0, to: st1 };
}
export const pluralLv = n => n % 10 === 1 && n % 100 !== 11 ? 'уровень' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'уровня' : 'уровней';
