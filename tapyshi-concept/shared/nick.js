// Тапыши · ник игрока.
// Берётся из MAX (WebApp.initDataUnsafe.user: first_name, иначе last_name, иначе username)
// один раз при первом заходе и пишется в localStorage.
// Если человек потом сменит имя в MAX, в Тапышах ник не обновляется.
// Позже планируется платная смена ника за золото — здесь её не делаем.

const KEY = 'tapyshi.nick';
const FALLBACK = 'Игрок';
const MAX_LEN = 24;

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

export function getPlayerNick() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved.trim()) return saved.trim().slice(0, MAX_LEN);
  } catch (e) {}
  const nick = (fromMax() || fromQuery() || FALLBACK).slice(0, MAX_LEN) || FALLBACK;
  try { localStorage.setItem(KEY, nick); } catch (e) {}
  return nick;
}
