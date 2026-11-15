// «99 ночей» — кооп-клиент (Colyseus). Грузится ТОЛЬКО с флагом ?server=ws://…; без него игра — соло, как раньше.
// Сервер авторитарен (тот же sim.js). Клиент шлёт команды; свой питомец — предсказание (SIM.moveP) с мягкой коррекцией,
// чужие питомцы и враги — интерполяция по буферу снимков (~120 мс назад). Мир (узлы, сундук, постройки, рюкзаки) — сообщением 'world'.
import * as SIM from './sim.js?v=0.6.0';
const { PETS, STAGES } = SIM;
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TEMPLATES = ['К костру!', 'Нужны ветки', 'Складываю в сундук', 'Беру ягоды', 'Лось справа', 'Я устал, помоги', 'Сейчас разожгу', 'Молодцы!'];
const PINGS = ['Сюда!'];
const RT_KEY = '99n_rt', NAME_KEY = '99n_name', CHAT_OFF = '99n_chat_off', INTERP = 120;

function loadLib() {
  if (window.Colyseus) return Promise.resolve(window.Colyseus);
  return new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'vendor/colyseus.js?v=0.16.22'; sc.onload = () => ok(window.Colyseus); sc.onerror = () => no(new Error('colyseus.js не загрузился')); document.head.appendChild(sc); });
}

export function initCoop(G, url) {
  const st = { client: null, room: null, lobby: null, active: false, snaps: [], enemies: new Map(), nodeMap: null, chat: [], muted: new Set(), unread: 0,
    chatOff: localStorage.getItem(CHAT_OFF) === '1', lastSend: 0, pendMove: null, tags: new Map(), bubbles: [], pings: [], kind: 'friend', err: '' };
  const Q = new URLSearchParams(location.search);
  const myName = () => (Q.get('name') || localStorage.getItem(NAME_KEY) || PETS[G.pet].name).slice(0, 16);
  const nameOf = id => (G.S && G.S.players[id] && G.S.players[id].name) || (st.lobby && (st.lobby.players.find(p => p.id === id) || {}).name) || 'Игрок';
  const colorOf = id => (G.S && G.S.players[id] && G.S.players[id].color) || SIM.SLOT_COLORS[Math.max(0, st.lobby ? st.lobby.players.findIndex(p => p.id === id) : 0) % 4];

  // ---------- меню: включаем сетевые кнопки ----------
  $('bSearch').disabled = false; $('bSearch').innerHTML = 'Поиск соперника<small>случайная команда 2–4</small>';
  $('bFriend').onclick = () => openRoom('friend');
  $('bSearch').onclick = () => openRoom('search');
  $('joinRow').classList.remove('hide');
  $('bJoin').onclick = () => joinCode($('joinCode').value.trim());
  $('chkFill').onchange = e => { if (st.room) st.room.send('fill', e.target.checked); G.sfx.play('ui', { kind: 'fill' }); };
  $('bLobbyStage').onclick = () => { if (!st.room || !st.lobby) return; const open = Math.min(SIM.CFG.MVP_STAGES, G.account().open); st.room.send('stage', st.lobby.stage >= open ? 1 : st.lobby.stage + 1); };
  $('bLobbyGo').onclick = () => st.room && st.room.send('start');
  $('bLobbyBack').onclick = () => { leave(); G.showMenu(); };
  for (const id of ['bWinMenu', 'bMenu2', 'bMenu']) $(id).addEventListener('click', () => leave());

  async function client() { if (!st.client) { const C = await loadLib(); st.client = new C.Client(url); } return st.client; }
  const opts = kind => ({ kind, stage: Math.min(SIM.CFG.MVP_STAGES, G.account().open), pet: G.pet, name: myName(), open: G.account().open });
  async function openRoom(kind) {
    st.kind = kind; showLobbyUI(); setNote(kind === 'search' ? 'Ищем команду…' : 'Создаём комнату…');
    try { const c = await client(); if (st.room) await leave();
      const room = kind === 'search' ? await c.joinOrCreate('night', opts('search')) : await c.create('night', opts('friend'));
      attach(room); } catch (e) { setNote('Сервер недоступен: ' + e.message); }
  }
  async function joinCode(code) {
    if (!code) return; setNote('Входим…');
    try { const c = await client(); if (st.room) await leave(); st.kind = 'friend'; attach(await c.joinById(code, opts('friend'))); }
    catch (e) { setNote('Не удалось войти: ' + (e.message || e)); }
  }
  async function leave() { const r = st.room; st.room = null; st.active = false; st.lobby = null; sessionStorage.removeItem(RT_KEY); hud(false); if (r) try { await r.leave(true); } catch (e) {} }

  function attach(room) {
    st.room = room; sessionStorage.setItem(RT_KEY, room.reconnectionToken);
    room.onMessage('lobby', m => { st.lobby = m; if (!st.active) renderLobby(); });
    room.onMessage('note', m => setNote(m));
    room.onMessage('start', m => begin(m.snap));
    room.onMessage('resync', m => { begin(m.snap); st.chat = []; $('chatFeed').innerHTML = ''; for (const c of m.chat || []) addChat(c, true); });
    room.onMessage('snap', m => onSnap(m));
    room.onMessage('world', m => onWorld(m));
    room.onMessage('ev', evs => { if (!st.active || !G.S) return; for (const e of evs) { if (e.t === 'ping') onPing(e); } G.S.ev.push(...evs); });
    room.onMessage('chat', m => addChat(m));
    room.onMessage('chatErr', m => G.hint(m, 1.6, true));
    room.onMessage('result', () => { sessionStorage.removeItem(RT_KEY); });
    room.onLeave(code => { if (st.room !== room) return; st.room = null; if (st.active && G.mode !== 'over' && code !== 1000 && code !== 4000) reconnect(room.reconnectionToken || sessionStorage.getItem(RT_KEY)); else { st.active = false; hud(false); } });
  }
  async function reconnect(tok, tries = 6) {
    if (!tok) return; G.hint('Связь пропала — переподключаемся…', 3, true);
    for (let i = 0; i < tries; i++) { try { const c = await client(); const r = await c.reconnect(tok); attach(r); r.send('resync'); G.hint('Снова в игре', 1.5); return true; } catch (e) { await new Promise(r => setTimeout(r, 800 + i * 700)); } }
    sessionStorage.removeItem(RT_KEY); st.active = false; hud(false); G.toast('Связь потеряна', 'Комната закрыта или окно возврата истекло'); G.showMenu(); return false;
  }

  // ---------- лобби ----------
  function setNote(t) { $('lobbyNote').textContent = t; }
  function showLobbyUI() { G.setMode('menu'); G.only('lobbyOv'); $('lobbyOv').querySelector('h2').textContent = st.kind === 'search' ? 'Поиск соперника' : 'С другом';
    $('joinRow').classList.toggle('hide', st.kind === 'search'); $('slots').innerHTML = ''; $('lobbyCode').textContent = '…'; $('bLobbyGo').disabled = true; }
  function renderLobby() {
    const L = st.lobby, meId = st.room && st.room.sessionId, host = L.host === meId; if (!L) return; G.only('lobbyOv');
    $('lobbyCode').textContent = L.kind === 'search' ? '—' : L.code; $('lobbyStage').textContent = stageName(L.stage);
    $('slots').innerHTML = [0, 1, 2, 3].map(i => { const p = L.players[i], c = SIM.SLOT_COLORS[i];
      return p ? `<div class="slot${p.id === meId ? ' me' : ''}" style="--c:${c}"><img src="img/${p.pet}.webp" alt=""><span><b>${esc(p.name)}${p.id === meId ? '<em class="tag">ты</em>' : ''}${p.id === L.host ? '<em class="tag">хост</em>' : ''}</b><small>${PETS[p.pet].name} · открыто до этапа ${stageName(p.open)}</small></span></div>`
        : `<div class="slot empty" style="--c:${c}"><i></i><span><b>Свободно</b><small>${L.fill ? 'добор случайных…' : L.kind === 'search' ? 'ищем…' : 'ждём друга по коду'}</small></span></div>`; }).join('');
    $('chkFill').checked = L.fill; $('chkFill').disabled = !host || L.kind === 'search'; $('chkFill').closest('label').classList.toggle('hide', L.kind === 'search');
    $('bLobbyStage').disabled = !host || L.kind === 'search';
    const n = L.players.length; $('bLobbyGo').disabled = !host || n < 2 || L.kind === 'search';
    $('bLobbyGo').innerHTML = L.kind === 'search' ? 'Автостарт<small>' + (L.timer ? 'через ' + L.timer + ' с' : 'ждём второго игрока') + '</small>' : host ? (n < 2 ? 'Начать<small>нужно минимум 2 игрока</small>' : 'Начать<small>' + n + ' из 4 · этап ' + stageName(L.stage) + '</small>') : 'Ждём хоста<small>начать может только хост</small>';
    if (L.kind === 'search') setNote('Ищем команду на этап ' + stageName(L.stage) + (L.timer ? ' · автостарт через ' + L.timer + ' с' : '…'));
    else if (L.fill && L.timer) setNote('Добор случайных до 4 игроков… ' + L.timer + ' с. Можно начать раньше.');
    else if (!$('lobbyNote').textContent.startsWith('Никого')) setNote(host ? 'Скажи другу код ' + L.code + ' (или ссылку ?room=' + L.code + '). Минимум 2, максимум 4.' : 'Ты в комнате ' + L.code + '. Ждём старта.');
  }
  const stageName = n => { const s = STAGES[n - 1]; return s ? s.from + '–' + s.to : '1–6'; };

  // ---------- старт / снимки ----------
  function begin(snap) {
    const s = SIM.deserialize(snap); G.setPID(st.room.sessionId); G.initWorld(s); s.timeScale = 1; st.snaps = []; st.enemies.clear(); st.nodeMap = new Map(s.nodes.map(n => [n.id, n]));
    for (const e of s.enemies) st.enemies.set(e.id, e);
    st.active = true; G.startPlay(); hud(true); for (const [, t] of st.tags) t.parent && t.parent.remove(t); st.tags.clear();
    G.toast('Командный забег', 'Этап ' + stageName(s.stage) + ' · ' + Object.keys(s.players).length + ' игрока');
  }
  function onSnap(m) {
    const S = G.S; if (!st.active || !S) return; st.snaps.push({ at: performance.now(), m }); if (st.snaps.length > 30) st.snaps.shift();
    S.t = m.t; S.phase = m.ph; S.night = m.n; S.fire.fuel = m.fire[0]; S.fire.lv = m.fire[1]; S.wx = m.wx; if (m.res) S.result = m.res;
    for (const a of m.p) { const p = S.players[a[0]]; if (!p) continue;
      p.str = a[4]; p.hunger = a[5]; p.sleep = a[6]; p.flash.on = !!a[7]; p.away = !!a[8]; p.rest = a[11]; p.swing = a[12]; p.cd = a[13];
      if (a[0] === G.PID) { const dx = a[1] - p.x, dz = a[2] - p.z, err = Math.hypot(dx, dz), moving = Math.hypot(p.in.x, p.in.z) > .1;
        if (err > 2.5 || p.sleep > 0 || p.rest > 0) { p.x = a[1]; p.z = a[2]; } else { const k = moving ? .06 : .3; p.x += dx * k; p.z += dz * k; } } }
    // состав врагов — по последнему снимку (позиции интерполируются в frame)
    const ids = new Set(); for (const a of m.e) { ids.add(a[0]); let e = st.enemies.get(a[0]); if (!e) { e = { id: a[0], k: a[1], x: a[2], z: a[3], y: a[4], ry: a[5], hp: 1, st: a[6], dead: 0, leave: false, tt: 0, cd: 0, lit: 0, held: 0 }; st.enemies.set(a[0], e); }
      e.st = a[6]; e.dead = a[7]; e.leave = !!a[8]; }
    for (const id of [...st.enemies.keys()]) if (!ids.has(id)) st.enemies.delete(id);
    S.enemies = [...st.enemies.values()];
  }
  function onWorld(w) {
    const S = G.S; if (!st.active || !S) return; for (const [id, alive, berry, loot, hp] of w.nodes) { const n = st.nodeMap.get(id); if (n) { n.alive = !!alive; n.berry = !!berry; n.loot = !!loot; n.hp = hp; } }
    S.chest = w.chest; S.builds = w.builds; S.bench.lv = w.bench; S.fire.lv = w.lv; S.firstLight = w.firstLight;
    for (const id in w.inv) { const p = S.players[id]; if (p) { p.inv = w.inv[id][0]; p.has = w.inv[id][1]; p.flash.charge = w.inv[id][2]; } }
    G.syncNodes(S); G.syncBuilds(S);
  }
  // интерполяция: рендерим мир на INTERP мс в прошлом
  function interp() {
    const S = G.S, A = st.snaps; if (A.length < 1) return; const rt = performance.now() - INTERP; let i = A.length - 1; while (i > 0 && A[i - 1].at > rt) i--;
    const b = A[i], a = A[Math.max(0, i - 1)], k = b === a ? 1 : Math.min(1, Math.max(0, (rt - a.at) / (b.at - a.at || 1)));
    const ia = new Map(a.m.p.map(q => [q[0], q])), ea = new Map(a.m.e.map(q => [q[0], q]));
    for (const q of b.m.p) { if (q[0] === G.PID) continue; const p = S.players[q[0]]; if (!p) continue; const o = ia.get(q[0]) || q;
      p.x = o[1] + (q[1] - o[1]) * k; p.z = o[2] + (q[2] - o[2]) * k; let d = q[3] - o[3]; d = Math.atan2(Math.sin(d), Math.cos(d)); p.face = o[3] + d * k; p.vx = q[9]; p.vz = q[10]; }
    for (const q of b.m.e) { const e = st.enemies.get(q[0]); if (!e) continue; const o = ea.get(q[0]) || q; e.x = o[2] + (q[2] - o[2]) * k; e.z = o[3] + (q[3] - o[3]) * k; e.y = o[4] + (q[4] - o[4]) * k; let d = q[5] - o[5]; d = Math.atan2(Math.sin(d), Math.cos(d)); e.ry = o[5] + d * k; }
  }
  function frame(dt) {
    const S = G.S, p = S.players[G.PID]; S.t += dt;   // таймер тикает между снимками
    if (st.pendMove && performance.now() - st.lastSend > 66) flushMove();
    if (p && p.sleep <= 0 && p.rest <= 0 && !p.away) SIM.moveP(S, p, dt); else if (p) { p.vx = p.vz = 0; }
    interp(); tagsAndBubbles(dt);
  }
  function flushMove() { const m = st.pendMove; st.pendMove = null; st.lastSend = performance.now(); st.room && st.room.send('cmd', m); }
  function send(c) {
    if (!st.room) return; if (c.t === 'move') { const p = G.S.players[G.PID]; if (p) { const l = Math.hypot(c.x, c.z); p.in.x = l > 1 ? c.x / l : c.x; p.in.z = l > 1 ? c.z / l : c.z; } st.pendMove = { t: 'move', x: c.x, z: c.z }; if (performance.now() - st.lastSend > 66) flushMove(); return; }
    if (c.t === 'act') { const p = G.S.players[G.PID]; if (p && p.cd > 0) return; if (p) p.cd = .25; }   // не спамим: сервер всё равно проверит
    st.room.send('cmd', { ...c, pid: undefined });
  }

  // ---------- таблички, пузыри чата, пинги ----------
  function textSprite(text, color, big = false) {
    const c = document.createElement('canvas'), x = c.getContext('2d'), fs = big ? 30 : 34; x.font = `900 ${fs}px Nunito, sans-serif`;
    const lines = big ? wrap(x, text, 360) : [text]; const w = Math.min(420, Math.max(...lines.map(l => x.measureText(l).width)) + 36), h = lines.length * (fs + 8) + 20;
    c.width = w; c.height = h; x.font = `900 ${fs}px Nunito, sans-serif`; x.fillStyle = big ? 'rgba(255,255,255,.95)' : color; rr(x, 2, 2, w - 4, h - 4, 18); x.fill();
    if (big) { x.strokeStyle = color; x.lineWidth = 4; x.stroke(); } x.fillStyle = big ? '#33405a' : '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center'; lines.forEach((l, i) => x.fillText(l, w / 2, 10 + (fs + 8) * (i + .5)));
    const tex = new G.THREE.CanvasTexture(c); tex.colorSpace = G.THREE.SRGBColorSpace; const sp = new G.THREE.Sprite(new G.THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, transparent: true }));
    sp.renderOrder = 10; const sc = big ? .0062 : .0052; sp.scale.set(w * sc, h * sc, 1); return sp;
  }
  function wrap(x, t, max) { const out = []; let line = ''; for (const w of t.split(' ')) { const tt = line ? line + ' ' + w : w; if (x.measureText(tt).width > max && line) { out.push(line); line = w; } else line = tt; } if (line) out.push(line); return out.slice(0, 3); }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function tagsAndBubbles(dt) {
    const S = G.S; for (const p of Object.values(S.players)) { const v = G.PV.get(p.id); if (!v) continue; let t = st.tags.get(p.id);
      if (!t) { t = textSprite(p.name + (p.id === G.PID ? ' (ты)' : ''), p.color); t.position.y = 2.15; v.g.add(t); st.tags.set(p.id, t); }
      t.material.opacity = p.away ? .45 : 1; }
    for (const b of st.bubbles) { b.t -= dt; b.sp.material.opacity = Math.min(1, b.t * 2); } st.bubbles = st.bubbles.filter(b => { if (b.t > 0) return true; b.sp.parent && b.sp.parent.remove(b.sp); return false; });
    for (const q of st.pings) { q.t -= dt; q.g.scale.setScalar(1 + Math.sin(performance.now() * .01) * .1); q.g.children.forEach(c => c.material.opacity = Math.min(1, q.t)); }
    st.pings = st.pings.filter(q => { if (q.t > 0) return true; G.scene.remove(q.g); return false; });
  }
  function bubble(id, text) { const v = G.PV.get(id); if (!v) return; for (const b of st.bubbles) if (b.id === id) b.t = 0; const sp = textSprite(text, colorOf(id), true); sp.position.y = 2.95; v.g.add(sp); st.bubbles.push({ id, sp, t: 2.8 }); }
  function onPing(e) {
    const T = G.THREE, col = new T.Color(colorOf(e.pid)), g = new T.Group();
    const ring = new T.Mesh(new T.RingGeometry(.55, .78, 24).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, fog: false })); ring.position.y = .06;
    const pole = new T.Mesh(new T.CylinderGeometry(.06, .06, 2.6, 6), new T.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, fog: false })); pole.position.y = 1.3;
    g.add(ring, pole); g.position.set(e.x, 0, e.z); G.scene.add(g); st.pings.push({ g, t: 4 });
    G.hint(nameOf(e.pid) + ': ' + (PINGS[e.msg] || PINGS[0]), 2.2); G.sfx.play('ping');
  }

  // ---------- чат (текст фильтрует и маскирует сервер; клиент рисует только то, что пришло) ----------
  $('chatTpl').innerHTML = TEMPLATES.map((t, i) => `<button data-tpl="${i}">${t}</button>`).join('');
  $('chatTpl').onclick = e => { const b = e.target.closest('button'); if (b && st.room) st.room.send('chat', { tpl: +b.dataset.tpl }); };
  const sendText = () => { const v = $('chatIn').value.trim(); if (!v || !st.room) return; st.room.send('chat', { text: v.slice(0, 80) }); $('chatIn').value = ''; };
  $('chatSend').onclick = sendText; $('chatIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendText(); }); $('chatIn').addEventListener('keyup', e => e.stopPropagation());
  $('bChat').onclick = () => { const on = $('chatPanel').classList.toggle('hide'); st.unread = 0; badge(); if (!on) {} };
  $('chatClose').onclick = () => $('chatPanel').classList.add('hide');
  $('chatOff').checked = st.chatOff; $('chatOff').onchange = e => { st.chatOff = e.target.checked; localStorage.setItem(CHAT_OFF, st.chatOff ? '1' : '0'); $('chatFeed').classList.toggle('hide', st.chatOff); };
  $('chatFeed').classList.toggle('hide', st.chatOff);
  $('chatFeed').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.mute) { st.muted.add(b.dataset.mute); G.hint('Игрок заглушён (пинги остаются)', 1.6); } if (b.dataset.rep && st.room) { st.room.send('report', { id: +b.dataset.rep }); G.hint('Жалоба отправлена', 1.6); } };
  $('bPing').onclick = () => send({ t: 'ping', msg: 0 });
  function badge() { const n = $('bChat').querySelector('.n'); n.textContent = st.unread; n.classList.toggle('hide', !st.unread); }
  function addChat(m, silent) {
    if (st.muted.has(m.from) || st.chatOff) return; st.chat.push(m); const mine = st.room && m.from === st.room.sessionId;
    const el = document.createElement('p'); el.style.setProperty('--c', colorOf(m.from)); el.innerHTML = `<b>${esc(nameOf(m.from))}:</b> ${esc(m.text)}` + (mine ? '' : ` <button class="mini" data-mute="${esc(m.from)}" title="Заглушить">🔇</button><button class="mini" data-rep="${m.id}" title="Пожаловаться">⚑</button>`);
    $('chatFeed').appendChild(el); while ($('chatFeed').children.length > 50) $('chatFeed').firstChild.remove(); $('chatFeed').scrollTop = 1e6;
    if (!silent) { bubble(m.from, m.text); if ($('chatPanel').classList.contains('hide') && !mine) { st.unread++; badge(); } G.sfx.play('chat'); }
  }
  function hud(on) { $('bChat').classList.toggle('hide', !on); $('bPing').classList.toggle('hide', !on); if (!on) $('chatPanel').classList.add('hide'); }

  // ---------- автозапуск: приглашение ?room=КОД или переподключение после перезагрузки ----------
  (async () => { const tok = sessionStorage.getItem(RT_KEY); if (tok) { if (await reconnect(tok, 2)) return; }
    const code = Q.get('room'); if (code) { st.kind = 'friend'; showLobbyUI(); $('joinCode').value = code; joinCode(code); } })();

  return { active: () => st.active && !!st.room, send, frame, state: st, leave, get room() { return st.room; } };
}
