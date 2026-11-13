/* Данные макета. Реальные правила — из /workspace/tapyshi-live-v28/server/game.js (v28):
   вместимость клана по уровню (40/45/50, уровни по победам 0/30/100), трофеи недели топ-3 = 60/40/20,
   «Позвать друга» в концепте = +5000 пригласившему, когда друг впервые откроет ссылку (в живой игре правило другое), энергия 300, восстановление 1/с, крит 5% ×5, золотые монетки.
   Еды и бустов в живой игре нет — цены и эффекты ниже ЗАГЛУШКИ под шкалу монет v28. */
window.T = window.T || {};
T.PETS = { raccoon: 'Енот', capybara: 'Капибара', dragon: 'Дракон', goose: 'Гусь' };
T.me = { name: 'Дима', coins: 12000, energy: 120, energyMax: 300 };
T.clan = {
  name: 'Дикий зоопарк', emblem: 'raccoon', lvl: 2, members: 27, cap: 45, online: 6,
  wins: 64, nextWins: 100, nextCap: 50,
  weekTaps: 1240560, weekPlace: 3, weekGoal: 1500000,
  weekLeft: '2 д 14 ч', trophyByPlace: [60, 40, 20],
  refBonus: 5000
};
T.members = [
  { n: 'Макс', pet: 'dragon', pn: 'Искорка', lvl: 17, w: 21380, on: true, owner: true },
  { n: 'Алина', pet: 'goose', pn: 'Пухля', lvl: 14, w: 18420, on: true },
  { n: 'Дима', pet: 'raccoon', pn: 'Булочка', lvl: 12, w: 15960, on: true, me: true },
  { n: 'Соня', pet: 'capybara', pn: 'Мандаринка', lvl: 11, w: 12105, on: false },
  { n: 'Артём', pet: 'raccoon', pn: 'Шнырь', lvl: 9, w: 9870, on: true },
  { n: 'Вика', pet: 'dragon', pn: 'Зефир', lvl: 8, w: 7340, on: false },
  { n: 'Егор', pet: 'capybara', pn: 'Кекс', lvl: 7, w: 5210, on: true },
  { n: 'Лиза', pet: 'goose', pn: 'Гоша', lvl: 6, w: 3980, on: false },
  { n: 'Никита', pet: 'dragon', pn: 'Чили', lvl: 5, w: 2440, on: false },
  { n: 'Оля', pet: 'capybara', pn: 'Пончик', lvl: 4, w: 1150, on: true }
];
T.food = [
  { id: 'mandarin', name: 'Мандаринка', img: 'food-mandarin', fx: '+100', fxk: 'energy', note: 'перекус', price: 120, tint: 'peach' },
  { id: 'cookie', name: 'Печенька-лапка', img: 'food-cookie', fx: '+300', fxk: 'energy', note: 'полная шкала', price: 300, tint: 'sun', hit: true },
  { id: 'cupcake', name: 'Ягодный кекс', img: 'food-cupcake', fx: '+600', fxk: 'energy', note: 'две шкалы', price: 550, tint: 'pink' },
  { id: 'honey', name: 'Медовый горшочек', img: 'food-honey', fx: '+1000', fxk: 'energy', note: 'на долгую игру', price: 900, tint: 'sky' }
];
T.basket = { id: 'basket', name: 'Корзинка вкусняшек', img: 'food-basket', note: '3 мандаринки, 2 печеньки и кекс', price: 1290, old: 1510, off: 15 };
T.boosts = [
  { id: 'x2', name: 'Двойные монеты', img: 'boost-coins', fx: '×2 монеты за тап', dur: '30 мин', price: 2500, tint: 'sun', tag: 'Хит' },
  { id: 'nolimit', name: 'Энергетик', img: 'boost-energy', fx: 'тапы без энергии', dur: '5 мин', price: 1800, tint: 'sun' },
  { id: 'regen', name: 'Быстрая энергия', img: 'boost-regen', fx: 'энергия ×2 быстрее', short: 'Энергия ×2', dur: '1 час', price: 1200, tint: 'mint', active: '41:12' },
  { id: 'crit', name: 'Супер-тап', img: 'boost-crit', fx: 'криты ×2 чаще', dur: '15 мин', price: 1500, tint: 'pink' },
  { id: 'magnet', name: 'Магнит монеток', img: 'boost-magnet', fx: 'золотые монетки чаще', dur: '1 час', price: 2000, tint: 'peach' }
];
