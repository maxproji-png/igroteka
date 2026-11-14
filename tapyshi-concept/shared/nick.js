// Тапыши · ник игрока.
// Берётся из MAX (WebApp.initDataUnsafe.user: first_name, иначе last_name, иначе username)
// один раз при первом заходе и пишется в localStorage.
// Если человек потом сменит имя в MAX, в Тапышах ник не обновляется.
// Позже планируется платная смена ника за золото — здесь её не делаем.
//
// Негативный ник (маты с обфускацией, оскорбления, насилие, имитация официальных лиц,
// ссылки, политика) при первом заходе заменяется на нейтральный «<Вид питомца> <4 цифры>»,
// например «Енот 4821». Игровые «злые» имена, эмодзи и обычные слова не трогаем.

const KEY = 'tapyshi.nick';
const FALLBACK = 'Игрок';
const MAX_LEN = 24;

export const SPECIES = {
  raccoon: 'Енот',
  capybara: 'Капибара',
  dragon: 'Дракончик',
  goose: 'Гусь'
};

// Две расшифровки латиницы: визуальная (p→р, как в написании «Huy» как «Нуу»)
// и фонетическая (huy→хуй, putin→путин). Проверяем обе, плюс исходную латиницу.
const VISUAL = {
  a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у',
  u: 'у', i: 'и', k: 'к', h: 'н', b: 'б', m: 'м', t: 'т',
  n: 'н', r: 'р', s: 'с', g: 'г', z: 'з', d: 'д', l: 'л',
  w: 'ш', f: 'ф', v: 'в', q: 'к', j: 'й',
  '0': 'о', '1': 'и', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', '$': 'с'
};
const PHONETIC = {
  a: 'а', b: 'б', c: 'с', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
  i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х',
  y: 'й', z: 'з',
  '0': 'о', '1': 'и', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', '$': 'с'
};

function lower(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е');
}

function squeeze(s) {
  return s.replace(/(.)\1+/g, '$1');
}

function mapLetters(s, table) {
  let t = '';
  for (const ch of lower(s)) {
    const mapped = table[ch] || ch;
    if (/[а-яa-z]/.test(mapped)) t += mapped;
  }
  return t;
}

function latinOnly(s) {
  return lower(s).replace(/[^a-z]/g, '');
}

// Подстановки «звёздочка вместо буквы»: х*й → хуй, п*зда → пизда, бл* → бля.
function starVariants(s) {
  const src = String(s || '');
  if (!/[*#]/.test(src)) return [src];
  if ((src.match(/[*#]/g) || []).length > 2) return [src, src.replace(/[*#]/g, '')];
  const vowels = ['', 'а', 'е', 'и', 'о', 'у', 'й', 'я'];
  let variants = [src];
  for (const mark of ['*', '#']) {
    const next = [];
    for (const v of variants) {
      const i = v.indexOf(mark);
      if (i < 0) { next.push(v); continue; }
      for (const sub of vowels) next.push(v.slice(0, i) + sub + v.slice(i + 1));
    }
    variants = next;
  }
  return variants;
}

export function formsForMatch(s) {
  const set = new Set();
  for (const v of starVariants(s)) {
    const raw = mapLetters(v, {});
    const vis = mapLetters(v, VISUAL);
    const pho = mapLetters(v, PHONETIC);
    const phoU = mapLetters(v, Object.assign({}, PHONETIC, { y: 'у', c: 'к' }));
    const lat = latinOnly(v);
    for (const f of [raw, vis, pho, phoU, lat]) {
      if (f) { set.add(f); set.add(squeeze(f)); }
    }
  }
  return [...set];
}

// Для отладки и тестов — фонетическая компактная форма.
export function compactForMatch(s) {
  const forms = formsForMatch(s);
  const pho = squeeze(mapLetters(s, PHONETIC)) || squeeze(mapLetters(s, VISUAL)) || squeeze(mapLetters(s, {}));
  return forms.includes(pho) ? pho : (forms[0] || '');
}

export function tokens(s) {
  const out = [];
  const src = lower(s);
  for (const part of src.split(/[^a-zа-я0-9ё]+/i)) {
    if (!part) continue;
    // «Лох228» → лох + 228, чтобы лох* ловился, а «лохматый» оставался одним токеном
    const bits = part.split(/(?<=[a-zа-яё])(?=[0-9])|(?<=[0-9])(?=[a-zа-яё])/i);
    for (const b of bits) if (b) out.push(b);
  }
  return out;
}

function compactToken(tok) {
  return squeeze(mapLetters(tok, PHONETIC) || mapLetters(tok, VISUAL) || mapLetters(tok, {}));
}

function isEmojiOnly(s) {
  const t = String(s || '').trim();
  if (!t) return false;
  // нет букв, цифр, ссылочных символов — только эмодзи/знаки
  return !/[a-zа-яё0-9@./]/i.test(t);
}

function hasLinkOrHandle(s) {
  const t = lower(s);
  if (/https?:\/\//.test(t) || /www\./.test(t)) return true;
  if (/\bt\.me\b/.test(t) || /telegram\.me/.test(t) || /t\.me\//.test(t)) return true;
  if (/[a-zа-я0-9-]\.(ru|com|org|net|io|gg|info|xyz|me|pro|tv|cc|co|su)\b/.test(t)) return true;
  if (/@[a-zа-я0-9_]/.test(t)) return true;
  return false;
}

// Основы мата — достаточно длинные/характерные, чтобы не задеть «хлебушек», «сукулент», «стебель».
const MAT_STEMS = [
  'хуй', 'хуя', 'хуе', 'хуи', 'хуле', 'хули',
  'пизд',
  'ебат', 'ебан', 'ебал', 'ебло', 'ебля', 'еблан', 'ебуч', 'ебыр',
  'ебну', 'ебни', 'ебенн',
  'бляд', 'блять', 'блят',
  'сука', 'суки', 'суке', 'сукой', 'сукою', 'сучар', 'сучк',
  'мудак', 'мудил', 'мудож', 'мудоз',
  'залуп',
  'пидор', 'пидар', 'пидр', 'педик',
  'гандон', 'гондон',
  'дроч',
  'шлюх', 'шалав',
  'fuck', 'shit', 'bitch'
];

// «бля» и «мля» — только как целое (компактное) слово, не «корабля» / «стебля».
const MAT_WHOLE = ['бля', 'мля', 'blya', 'blyat', 'hui', 'huy', 'xyu', 'xuy', 'xyi', 'pizda', 'suka', 'eban', 'ebal', 'mudak', 'pidor', 'loh'];

const INSULT_STEMS = [
  'тупой', 'тупая', 'тупое', 'тупые', 'тупиц', 'тупог', 'тупом', 'тупым', 'тупых',
  'ненавижу',
  'дебил', 'идиот', 'кретин',
  'чмошн', 'мраз',
  'сволоч', 'падла', 'падло'
];

const INSULT_WHOLE = ['лох', 'лохи', 'лохов', 'лохам', 'лоху', 'лоха', 'чмо'];

// «лох-несс» / «лохматый» / «лоханка» — не оскорбление.
function isLochNess(toks) {
  const c = toks.map(compactToken);
  for (let i = 0; i < c.length; i++) {
    if (c[i] === 'лох' && c[i + 1] && /^(нес|несс|ness|nes)$/.test(c[i + 1])) return true;
    if (/^лох(нес|несс|ness|мат|ан)/.test(c[i])) return true;
  }
  return false;
}

const VIOLENCE_STEMS = ['убийц', 'убийств', 'убью', 'убива', 'убить', 'террорист', 'насил', 'смерть'];
const VIOLENCE_WHOLE = ['смерть', 'смерти', 'смертью', 'смертей', 'киллер', 'killer', 'death'];

const IMPERSON_STEMS = [
  'админ', 'admin',
  'модератор', 'moderator',
  'поддержк',
  'тапыши', 'tapyshi',
  'официальн', 'official'
];
const IMPERSON_WHOLE = ['admin', 'support', 'модер'];

const POLITIC_STEMS = [
  'путин', 'putin',
  'навальн', 'navaln',
  'зеленск', 'zelensk',
  'лукашенк', 'lukashen',
  'кадыров', 'kadyrov',
  'жириновск',
  'зюганов',
  'собянин',
  'пригожин', 'prigozhin',
  'шойгу', 'shoigu',
  'мишустин',
  'гитлер', 'hitler',
  'кпрф', 'лдпр',
  'единаяросси', 'единойросси', 'edinayarossi'
];

// Scunthorpe: не задеваем обычные слова, в которых случайно встречается основа.
function stemSkip(stem, prev, next) {
  if ((stem === 'блять' || stem === 'блят') && /(р|тре)$/.test(prev)) return true; // употреблять, оскорблять
  if (stem === 'ебля' && /тр$/.test(prev)) return true;
  if (stem === 'ебен' && /[гр]$/.test(prev)) return true; // гребёнка, ребёнок
  if (stem === 'смерть' && /бес$/.test(prev)) return true; // бессмертный
  if (stem === 'хули' && /^ган/.test(next)) return true; // хулиган
  if ((stem === 'админ' || stem === 'admin') && /^рал/.test(next)) return true; // адмирал
  return false;
}

function formHasStem(form, stem) {
  const variants = [stem];
  const sq = squeeze(stem);
  // Не сжимаем короткие основы: ебенн → ебен цепляет «ребёнок».
  if (sq !== stem && stem.length >= 7) variants.push(sq);
  for (const st of variants) {
    let i = 0;
    while ((i = form.indexOf(st, i)) !== -1) {
      const prev = form.slice(0, i);
      const next = form.slice(i + st.length);
      if (!stemSkip(stem, prev, next)) return true;
      i += 1;
    }
  }
  return false;
}

function anyFormHasStem(forms, stems) {
  for (const f of forms) {
    for (const st of stems) {
      if (formHasStem(f, st)) return true;
    }
  }
  return false;
}

// Короткие перестановки «хуй» / huy / hui (xyu → хйу).
function isHuiAnagram(forms) {
  const targets = new Set(['йух', 'huy', 'hui']);
  for (const f of forms) {
    if (f.length === 3 && targets.has([...f].sort().join(''))) return true;
  }
  return false;
}

function anyFormIsWhole(forms, wholes) {
  const set = new Set(wholes);
  for (const w of wholes) set.add(squeeze(w));
  for (const f of forms) if (set.has(f)) return true;
  return false;
}

function tokenMatches(toks, wholes, stems) {
  for (const raw of toks) {
    const forms = formsForMatch(raw);
    if (wholes && anyFormIsWhole(forms, wholes)) return true;
    if (stems && anyFormHasStem(forms, stems)) return true;
  }
  return false;
}

export function isNickAllowed(nick) {
  const raw = String(nick == null ? '' : nick).trim();
  if (!raw) return false;
  if (isEmojiOnly(raw)) return true;
  if (hasLinkOrHandle(raw)) return false;

  const forms = formsForMatch(raw);
  const toks = tokens(raw);
  const lochNess = isLochNess(toks);

  if (anyFormHasStem(forms, MAT_STEMS) || anyFormIsWhole(forms, MAT_WHOLE) || isHuiAnagram(forms)) return false;
  if (tokenMatches(toks, MAT_WHOLE, MAT_STEMS)) return false;

  if (!lochNess && (anyFormIsWhole(forms, INSULT_WHOLE) || tokenMatches(toks, INSULT_WHOLE, null) || anyFormHasStem(forms, INSULT_STEMS))) return false;
  // «Хрен с горы» или ник из одного слова «хрен»
  if (anyFormIsWhole(forms, ['хрен']) || anyFormHasStem(forms, ['хренсгор'])) return false;
  const ct = toks.map(compactToken);
  if (ct.includes('хрен') && (ct.includes('горы') || ct.includes('гора') || ct.includes('гор'))) return false;

  if (anyFormHasStem(forms, VIOLENCE_STEMS) || anyFormIsWhole(forms, VIOLENCE_WHOLE) || tokenMatches(toks, VIOLENCE_WHOLE, VIOLENCE_STEMS)) return false;
  if (anyFormHasStem(forms, IMPERSON_STEMS) || anyFormIsWhole(forms, IMPERSON_WHOLE) || tokenMatches(toks, IMPERSON_WHOLE, IMPERSON_STEMS)) return false;
  if (anyFormHasStem(forms, POLITIC_STEMS)) return false;

  return true;
}

export function makeNeutralNick(pet, rand) {
  const rnd = typeof rand === 'function' ? rand : Math.random;
  const n = String(Math.floor(rnd() * 10000)).padStart(4, '0');
  const species = SPECIES[pet] || SPECIES.raccoon;
  return (species + ' ' + n).slice(0, MAX_LEN);
}

function fromMax() {
  try {
    const W = window.WebApp || (window.Telegram && window.Telegram.WebApp);
    const u = W && W.initDataUnsafe && W.initDataUnsafe.user;
    if (!u) return '';
    const first = String(u.first_name || '').trim();
    const last = String(u.last_name || '').trim();
    const user = String(u.username || '').trim();
    if (first) return first;
    if (last) return last;
    if (user) return user;
  } catch (e) {}
  return '';
}

function fromQuery() {
  try {
    return (new URLSearchParams(location.search).get('nick') || '').trim();
  } catch (e) { return ''; }
}

export function offeredNick() {
  return (fromMax() || fromQuery() || FALLBACK).slice(0, MAX_LEN) || FALLBACK;
}

function readSaved() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved.trim()) return saved.trim().slice(0, MAX_LEN);
  } catch (e) {}
  return '';
}

function writeSaved(nick) {
  try { localStorage.setItem(KEY, nick); } catch (e) {}
  return nick;
}

// pet нужен, если ник отклоняется: нейтральное имя строится по выбранному виду.
// Пока питомец неизвестен, плохой ник не записываем — иначе потом вид не совпадёт.
export function getPlayerNick(pet) {
  const saved = readSaved();
  if (saved) return saved;
  const offered = offeredNick();
  if (isNickAllowed(offered)) return writeSaved(offered);
  if (!pet) return offered;
  return writeSaved(makeNeutralNick(pet));
}

export function __resetNickForTests() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}
