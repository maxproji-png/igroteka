/* Данные макета. Реальные правила — из /workspace/tapyshi-live-v28/server/game.js (v28):
   вместимость клана по уровню (40/45/50, уровни по победам 0/30/100), награды недели топ-3 = 3 000 / 2 000 / 1 000 монет,
   «Позвать друга» в концепте = +2500 пригласившему и +2500 новичку, когда друг впервые откроет ссылку, без лимита; энергия 200, полная шкала за 10 минут. */
window.T = window.T || {};
T.PETS = { raccoon: 'Енот', capybara: 'Капибара', dragon: 'Дракон', goose: 'Гусь' };
T.me = { name: 'Дима', coins: 12000, energy: 120, energyMax: 200 };
if (typeof window !== 'undefined' && window.TapyshiBal) {
  T.me.coins = window.TapyshiBal.get();
  window.TapyshiBal.on(function (n) { T.me.coins = n; });
}
T.clan = {
  name: 'Дикий зоопарк', icon: 'paw', color: 'orange', lvl: 2, members: 27, cap: 45, online: 6,
  wins: 64, nextWins: 100, nextCap: 50,
  weekTaps: 1240560, weekPlace: 3, weekGoal: 1500000,
  weekLeft: '2 д 14 ч', coinByPlace: [3000, 2000, 1000],
  refBonus: 2500
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
