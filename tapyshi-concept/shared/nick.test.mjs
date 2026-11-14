// Проверки фильтра ника: пропуск обычных имён и замена негативных.
import { isNickAllowed, makeNeutralNick, compactForMatch } from './nick.js';
import { strict as assert } from 'node:assert';

const PASS = [
  // ~40 обычных имён и безобидных ников (Scunthorpe)
  'Саша', 'Маша', 'Максим', 'Макс', 'Анна', 'Алла', 'Кирилл', 'Наташа',
  'Даша', 'Петя', 'Ваня', 'Олег', 'Игорь', 'Катя', 'Лена', 'Оля',
  'Никита', 'Артём', 'Дима', 'Вова', 'Таня', 'Юля', 'Соня', 'Василиса',
  'Филипп', 'Инна', 'Любовь', 'Миша', 'Костя', 'Игрок',
  'Хлебушек', 'Сукулент', 'Суккулент', 'Психолог', 'Оскорбление',
  'Лохматый', 'Лохнес', 'Лох-Несс', 'Лоханка',
  'Кораблик', 'Стебель', 'Модерн', 'Медведь', 'Яблоко', 'Зелёный',
  'Бублик', 'Подруга', 'Трудяга', 'Облачко', 'Тень',
  'чмок', 'употреблять', 'оскорблять', 'гребёнка', 'ребёнок',
  'Бессмертный', 'Адмирал', 'Хулиган', 'Хренов',
  // явно оставить
  'Злой Гусь', 'Тёмный Лорд', 'Пьяный Дракон', 'Продам монеты',
  'Милый Енот', '😈🔥', '🐾🐾🐾', '😎', '🌚✨'
];

const REPLACE = [
  // примеры из теста заказчицы
  'Лох228', 'Лох', 'лох', 'Тупой_*', 'Тупой_енот', 'Тупой',
  'Хрен с горы', 'Ненавижу_всех', 'Ненавижу всех',
  'Убийца', 'Убийца228', 'Смерть_*', 'Смерть_всем', 'Смерть',
  'админ', 'Админ', 'модератор', 'поддержка',
  'Тапыши', 'official tapyshi', 'Официальный канал',
  't.me/foo', 'http://evil.com', 'https://x.ru', 'www.site.ru',
  'name.ru', 'shop.com', '@username', '@vasya',
  // мат и обфускация
  'хуй', 'х*й', 'х у й', 'хуууй', 'xyй', 'huy', 'HUI',
  'пизда', 'pizda', 'п*зда', 'бля', 'бл*', 'блять',
  'сука', 'еблан', 'мудак', 'пидор',
  // политика (короткий список)
  'путин', 'Putin', 'Навальный', 'зеленский', 'гитлер', 'КПРФ', 'Единая Россия',
  'lo h 228', 'Л О Х', 'Lох228',
  'xyu', 'смертьвсем', 'чмошник'
];

let failed = 0;
const details = [];

function check(nick, expectAllowed, bag) {
  const got = isNickAllowed(nick);
  if (got !== expectAllowed) {
    failed++;
    details.push(`  FAIL  "${nick}" compact=${compactForMatch(nick)}  expected ${expectAllowed ? 'PASS' : 'REPLACE'}  got ${got ? 'PASS' : 'REPLACE'}`);
    bag.fail++;
  } else {
    bag.pass++;
  }
}

const passBag = { pass: 0, fail: 0 };
const repBag = { pass: 0, fail: 0 };
for (const n of PASS) check(n, true, passBag);
for (const n of REPLACE) check(n, false, repBag);

const neu = makeNeutralNick('raccoon', () => 0.4821);
assert.equal(neu, 'Енот 4821');
const neu2 = makeNeutralNick('dragon', () => 0.0001);
assert.equal(neu2, 'Дракончик 0001');
const neu3 = makeNeutralNick('capybara', () => 0.9999);
assert.equal(neu3, 'Капибара 9999');
const neu4 = makeNeutralNick('goose', () => 0);
assert.equal(neu4, 'Гусь 0000');

console.log(`PASS list: ${passBag.pass}/${PASS.length} ok`);
console.log(`REPLACE list: ${repBag.pass}/${REPLACE.length} ok`);
console.log('neutral form: Енот 4821 / Дракончик 0001 / Капибара 9999 / Гусь 0000 ok');
if (details.length) {
  console.log('Failures:');
  details.forEach(l => console.log(l));
  process.exit(1);
}
console.log('All nick filter tests passed.');
