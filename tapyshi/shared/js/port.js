/* Оболочка макета: светлый стиль page-designer + наши игры, 3D-питомец, ставки, MAX-приглашение. */
(function () {
  'use strict';

  var GAMES = window.HUB_GAMES || [];
  var ICONS = window.HUB_ICONS || {};
  var META = window.HUB_META || {};
  var TAP = window.TAPYSHI;

  var ME = {
    pet: 'raccoon',
    petName: 'Булочка',
    stage: 1,
    stageName: 'Подросток',
    nextStageName: 'Взрослый',
    petLvl: 7,
    nextLvl: 10,
    coins: 12000,
    energy: 330,
    maxEnergy: 330,
    tapPower: 1
  };

  var INVITE = 'https://max.ru/tapyshi_bot?startapp=duel_8F3K';
  var STAKES = [50, 150, 300, 500];

  var tab = 'pet';
  var curPage = 0;
  var sheetId = null;
  var sheetView = null;
  var openId = null;
  var frame = null;
  var closeT = 0;
  var searchT = 0;
  var searchTick = 0;
  var searchSec = 0;
  var stake = 150;
  var gamesLoaded = true;
  var inClan = true;
  var clanView = 'in';
  var soundOn = true;
  var dailyClaimed = false;
  var shopTab = 't1';
  var pendingBuy = null;
  var equipped = null;
  var owned = {};
  var createEmblem = 'raccoon';
  var overlayOpen = null;
  var livePet = null;

  var CLAN_MEMBERS = [
    { name: 'Булочка', role: 'Вы · лидер', pet: 'raccoon', pts: 1240, me: true },
    { name: 'Мила', role: 'Гусь', pet: 'goose', pts: 980 },
    { name: 'Тима', role: 'Дракон', pet: 'dragon', pts: 760 },
    { name: 'Лера', role: 'Капибара', pet: 'capybara', pts: 510 }
  ];
  var CLANS = [
    { name: 'Пончики', pet: 'raccoon', n: 4, pts: 3490, mine: true },
    { name: 'Северные', pet: 'goose', n: 8, pts: 5120 },
    { name: 'Огненные', pet: 'dragon', n: 6, pts: 4710 },
    { name: 'Тихие воды', pet: 'capybara', n: 5, pts: 2880 }
  ];
  var TASKS = [
    { id: 'login', title: 'Зайти сегодня', reward: 200, ready: true },
    { id: 'tap', title: 'Сделать 50 тапов', reward: 150, ready: false, hint: '0 / 50' },
    { id: 'play', title: 'Сыграть партию', reward: 300, ready: false, hint: '0 / 1' }
  ];

  var SHOP = {
    t1: [
      { id: 'mint', name: 'Мятный скин', price: 800, pet: 'raccoon', filter: 'hue-rotate(100deg) saturate(1.05)', cat: 'Скины' },
      { id: 'peach', name: 'Персиковый', price: 1200, pet: 'raccoon', filter: 'hue-rotate(-18deg) saturate(1.25)', cat: 'Скины' },
      { id: 'night', name: 'Ночной', price: 2500, pet: 'raccoon', filter: 'hue-rotate(210deg) brightness(.86)', cat: 'Скины' },
      { id: 'crown', name: 'Корона', price: 25000, pet: 'raccoon', filter: 'saturate(1.2) contrast(1.05)', cat: 'Скины' }
    ],
    t2: [
      { id: 'cookie', name: 'Печенье', price: 150, color: 'linear-gradient(180deg,#FFE2A8,#E8A94A)', cat: 'Еда' },
      { id: 'berries', name: 'Ягодки', price: 300, color: 'linear-gradient(180deg,#FFB3C8,#E35A7A)', cat: 'Еда' },
      { id: 'honey', name: 'Горшочек мёда', price: 500, color: 'linear-gradient(180deg,#FFE7A0,#F2B432)', cat: 'Еда' },
      { id: 'cake', name: 'Тортик', price: 900, color: 'linear-gradient(180deg,#FFD4E6,#FF9AB5)', cat: 'Еда' }
    ],
    t3: [
      { id: 'x2', name: 'x2 за тап', price: 2000, color: 'linear-gradient(180deg,#C3D2FF,#7C9CFF)', cat: 'Бонусы' },
      { id: 'energy', name: 'Энергия +100', price: 800, color: 'linear-gradient(180deg,#FFF1B0,#FFD36E)', cat: 'Бонусы' },
      { id: 'shield', name: 'Щит', price: 1500, color: 'linear-gradient(180deg,#C8F3E1,#7FDDB9)', cat: 'Бонусы' }
    ]
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  function byId(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; }
  function metaOf(id) { return META[id] || {}; }
  function isSolo(id) { return (metaOf(id).kind || 'versus') === 'solo'; }
  function petHtml(kind, o) { return (TAP && TAP.petSvg) ? TAP.petSvg(kind, o || {}) : ''; }
  function petHero(kind, o) { return (TAP && TAP.petHero) ? TAP.petHero(kind, o || {}) : petHtml(kind, o); }

  function setBalances() {
    $$('.bal-val').forEach(function (el) { el.textContent = fmt(ME.coins); });
    var en = $('#en-val');
    if (en) en.textContent = fmt(ME.energy) + ' / ' + fmt(ME.maxEnergy);
    var bar = $('#en-bar');
    if (bar) bar.style.width = Math.max(0, Math.min(100, ME.energy / ME.maxEnergy * 100)) + '%';
    var eta = $('#en-eta');
    if (eta) {
      var left = Math.max(0, ME.maxEnergy - ME.energy);
      if (left <= 0) {
        eta.hidden = true;
      } else {
        var m = Math.floor(left / 60), sec = left % 60;
        eta.hidden = false;
        eta.textContent = 'полная через ' + m + ':' + (sec < 10 ? '0' : '') + sec;
      }
    }
  }

  function bumpBal() {
    $$('.balance').forEach(function (el) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  }

  function toast(msg, kind) {
    var box = $('#toasts'); if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast' + (kind === 'warn' ? ' warn' : kind === 'info' ? ' info' : kind === 'coin' ? ' coin-t' : '');
    var ic = kind === 'warn' ? 'i-info' : kind === 'info' ? 'i-info' : 'i-check';
    t.innerHTML = '<span class="t-ic">' + (kind === 'coin' ? '<span class="coin"></span>' : '<svg><use href="#' + ic + '"/></svg>') + '</span><span>' + msg + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }, 2400);
  }

  function screenId(name) { return name === 'pet' ? 'scr-pet' : name; }

  function showScreen(name, noHist) {
    if (name === 'scr-pet') name = 'pet';
    tab = name;
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === screenId(name)); });
    var scr = document.getElementById(screenId(name));
    if (scr) scr.scrollTop = 0;
    $$('#tabs [data-tab]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === name); });
    if (name === 'games' && !$('#hub .hcard')) renderGames();
    if (name === 'clan') renderClan();
    if (name === 'shop') renderShop();
    if (!noHist) {
      try { history.replaceState({ tab: name }, '', name === 'pet' ? '#' : '#' + name); } catch (e) {}
    }
  }

  function closeOverlay() {
    $$('.sheet.on, .modal.on, .full.on').forEach(function (el) { el.classList.remove('on'); });
    var scrim = $('#scrim');
    if (scrim) scrim.classList.remove('on');
    overlayOpen = null;
    if (sheetView === 'modes' || sheetView === 'search' || sheetView === 'invite') {
      /* callers set the new view */
    }
  }

  function openOverlay(id) {
    var el = document.getElementById(id);
    if (!el) return;
    $$('.sheet.on, .modal.on').forEach(function (x) { if (x.id !== id) x.classList.remove('on'); });
    el.classList.add('on');
    var scrim = $('#scrim');
    if (scrim && (el.classList.contains('sheet') || el.classList.contains('modal'))) scrim.classList.add('on');
    overlayOpen = id;
  }

  function openFull(id) {
    $$('.full.on').forEach(function (x) { if (x.id !== id) x.classList.remove('on'); });
    var el = document.getElementById(id);
    if (el) { el.classList.add('on'); el.scrollTop = 0; }
  }

  function hideFulls() {
    $$('.full.on').forEach(function (x) { x.classList.remove('on'); });
  }

  function closeSheet(silent) {
    var was = sheetId;
    $('#playSheet').classList.remove('on');
    $('#scrim').classList.remove('on');
    if (sheetView === 'modes') { sheetId = null; sheetView = null; }
    return was;
  }

  /* ---------- Home: 3D pet + energy tap ---------- */
  function mountHomePet() {
    var stage = $('#pet-stage');
    var mount = $('#pet-mount') || stage;
    if (!stage || !mount) return;
    stage.classList.add('filled');
    mount.innerHTML = petHero('raccoon', { mood: 'neutral', pose: 'neutral', idle: true, tap: true });
    var hero = $('[data-live-pet]', mount) || mount;
    if (TAP && TAP.mountLive) {
      TAP.mountLive(hero, { kind: 'raccoon', pose: 'neutral', idle: true, tap: true }).then(function (v) { livePet = v || (hero && hero._petViewer) || livePet; }).catch(function () {});
    }
    if (TAP && TAP.preloadLive) TAP.preloadLive('raccoon');
  }

  var tapHintN = 0;
  function onHomeTap(e) {
    if (e.target && e.target.closest && e.target.closest('.chip, .icon-btn, .btn, .balance, .topbar, .pet-actions, .home-card')) return;
    if (ME.energy < ME.tapPower) {
      toast('Энергия закончилась', 'warn');
      return;
    }
    ME.energy -= ME.tapPower;
    ME.coins += ME.tapPower;
    setBalances();
    bumpBal();
    tapHintN += 1;
    if (tapHintN >= 3) {
      var hint = $('#tap-hint');
      if (hint) hint.classList.add('out');
    }
    var stage = $('#pet-stage');
    if (stage) {
      stage.classList.remove('squish');
      void stage.offsetWidth;
      stage.classList.add('squish');
    }
    var hero = stage && $('[data-live-pet]', stage);
    var viewer = livePet || (hero && hero._petViewer);
    if (viewer && viewer.tap) viewer.tap();
    var f = document.createElement('div');
    f.className = 'float coin-float';
    f.innerHTML = '<span class="coin"></span><span>+' + ME.tapPower + '</span>';
    var app = $('#app').getBoundingClientRect();
    f.style.left = (e.clientX - app.left) + 'px';
    f.style.top = (e.clientY - app.top) + 'px';
    $('#app').appendChild(f);
    setTimeout(function () { f.remove(); }, 900);
  }

  setInterval(function () {
    if (ME.energy < ME.maxEnergy) {
      ME.energy += 1;
      setBalances();
    }
  }, 1000);

  /* ---------- Tasks / daily / upgrade ---------- */
  function renderTasks(empty) {
    var list = $('#task-list');
    if (!list) return;
    if (empty) {
      list.innerHTML = '<div class="empty"><div class="empty-ic"><svg><use href="#i-list"/></svg></div><div class="empty-t">Пока нет заданий</div><div class="muted">Загляните позже</div></div>';
      return;
    }
    list.innerHTML = TASKS.map(function (t) {
      return '<div class="task' + (t.ready ? ' claim' : '') + '">' +
        '<div class="slot task-ic filled">' + petHtml(t.id === 'play' ? 'goose' : 'raccoon', { mood: t.ready ? 'happy' : 'neutral' }) + '</div>' +
        '<div class="task-main"><div class="task-t">' + t.title + '</div>' +
        '<div class="task-sub"><span class="coin"></span> +' + t.reward + (t.hint ? ' · ' + t.hint : '') + '</div></div>' +
        '<div class="task-side">' + (t.ready ? '<button class="mini" data-claim="' + t.id + '">Забрать</button>' : '<button class="mini soft" disabled>Ещё нет</button>') + '</div></div>';
    }).join('');
  }

  function openTasks(empty) {
    renderTasks(empty);
    openOverlay('s-tasks');
  }

  function renderDays() {
    var box = $('#days'); if (!box) return;
    var html = '';
    for (var i = 1; i <= 7; i++) {
      var cls = 'day' + (i === 7 ? ' big' : '') + (i === 1 && !dailyClaimed ? ' today' : '') + (i === 1 && dailyClaimed ? ' got' : '');
      html += '<div class="' + cls + '"><span class="dl">день ' + i + '</span><span class="coin"></span><span class="dv">' + (50 * i) + '</span></div>';
    }
    box.innerHTML = html;
  }

  function openDaily() {
    renderDays();
    $('#daily-claim').disabled = dailyClaimed;
    $('#daily-claim').textContent = dailyClaimed ? 'Забрано' : 'Забрать';
    openOverlay('m-daily');
  }

  /* ---------- Games ---------- */
  function renderGames() {
    var gamesEl = $('#games');
    if (gamesEl) gamesEl.classList.remove('loading');
    var skel = $('#games-skel');
    if (skel && !skel.childElementCount) {
      skel.innerHTML = '<div class="sk-card"><div class="sk sq"></div><div class="sk line"></div><div class="sk line" style="width:60%"></div></div>'.repeat(4);
    }
    var pages = $('#pages');
    if (!pages) return;
    var groups = [GAMES.slice(0, 4), GAMES.slice(4, 8)];
    pages.innerHTML = groups.map(function (list) {
      return '<div class="page">' + list.map(cardHtml).join('') + '</div>';
    }).join('');
    updatePager();
  }

  var PLAY = '<svg viewBox="0 0 12 12"><path d="M2.5 1.3v9.4a.6.6 0 0 0 .9.5l7.6-4.7a.6.6 0 0 0 0-1L3.4.8a.6.6 0 0 0-.9.5z" fill="#fff"/></svg>';
  function cardHtml(g) {
    var m = metaOf(g.id);
    var rec = m.record ? '<span class="rec">' + m.record + '</span>' : '';
    return '<button type="button" class="game hcard" data-id="' + g.id + '" style="--c:' + (g.color || '#7C9CFF') + ';--soft:' + (g.soft || '#EEF3FF') + '" aria-label="' + g.title + '. ' + (g.tag || '') + '">' +
      '<div class="art"><div class="icon">' + (ICONS[g.icon] || '') + '</div><div class="pet">' + petHtml(g.pet) + '</div></div>' +
      '<span class="play">' + PLAY + '</span>' +
      '<div class="meta"><h3>' + g.title + '</h3><p>' + (g.tag || '') + '</p>' + rec + '</div>' +
    '</button>';
  }

  function goPage(i) {
    curPage = Math.max(0, Math.min(1, i));
    updatePager();
  }

  function updatePager() {
    var pages = $('#pages');
    if (pages) pages.style.transform = 'translateX(' + (-curPage * 100) + '%)';
    $$('#dots .dot').forEach(function (d, i) { d.classList.toggle('on', i === curPage); });
  }

  var swipeX = 0, swipeOn = false;
  function bindPagerSwipe() {
    var hub = $('#hub'); if (!hub) return;
    hub.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches[0]) return;
      swipeOn = true; swipeX = e.touches[0].clientX;
    }, { passive: true });
    hub.addEventListener('touchend', function (e) {
      if (!swipeOn) return;
      swipeOn = false;
      var x = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : swipeX;
      var dx = x - swipeX;
      if (dx < -40) goPage(curPage + 1);
      else if (dx > 40) goPage(curPage - 1);
    });
  }

  function onCard(id) {
    if (isSolo(id)) {
      closeSheet();
      openGame(id, { mode: 'solo', hint: true });
    } else {
      openSheet(id);
    }
  }

  function openSheet(id) {
    var g = byId(id); if (!g) return;
    var m = metaOf(id);
    sheetId = id;
    sheetView = 'modes';
    stake = m.stake || 150;
    $('#duel-name').textContent = g.title;
    $('#duel-rule').textContent = m.rule || g.tag || '';
    var prev = $('#duel-prev');
    prev.classList.add('filled');
    prev.innerHTML = petHtml(g.pet, { mood: 'happy' });
    var stakes = $('#stakes');
    var opts = STAKES.slice();
    if (opts.indexOf(stake) < 0) opts.push(stake);
    opts.sort(function (a, b) { return a - b; });
    stakes.innerHTML = opts.map(function (s) {
      return '<button type="button" class="stake' + (s === stake ? ' on' : '') + '" data-stake="' + s + '">' + fmt(s) + '</button>';
    }).join('');
    openOverlay('playSheet');
  }

  function startSearch(id) {
    closeSheet();
    sheetId = id;
    sheetView = 'search';
    var g = byId(id);
    var sub = $('#search-sub');
    if (sub) sub.textContent = (g ? g.title : 'Игра') + ' · ставка ' + fmt(stake);
    var radar = $('#psSearch .radar .slot, #psSearch [data-slot="player-avatar"]');
    if (radar) { radar.classList.add('filled'); radar.innerHTML = petHtml('raccoon', { mood: 'happy' }); }
    searchSec = 0;
    var timer = $('#search-timer');
    if (timer) timer.textContent = '0:00';
    clearInterval(searchTick);
    searchTick = setInterval(function () {
      searchSec += 1;
      if (timer) timer.textContent = '0:0' + Math.min(9, searchSec);
    }, 1000);
    openFull('psSearch');
    hideOtherSheets();
    clearTimeout(searchT);
    searchT = setTimeout(function () {
      clearInterval(searchTick);
      hideFulls();
      sheetView = null; sheetId = null;
      openGame(id, { mode: 'pvp', rival: 'Соперник' });
    }, 2200);
  }

  function hideOtherSheets() {
    $('#playSheet').classList.remove('on');
    $('#scrim').classList.remove('on');
  }

  function renderInvite(id) {
    hideOtherSheets();
    sheetId = id;
    sheetView = 'invite';
    var t = $('#link-text');
    if (t) t.textContent = INVITE;
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(INVITE).catch(function () {}); } catch (e) {}
    openFull('psInvite');
  }

  function cancelInvite() {
    hideFulls();
    if (sheetId) openSheet(sheetId);
  }

  function cancelSearch() {
    clearTimeout(searchT);
    clearInterval(searchTick);
    hideFulls();
    if (sheetId) openSheet(sheetId);
    else { sheetId = null; sheetView = null; }
  }

  function launchQuery(opts) {
    opts = opts || {};
    var p = [];
    if (opts.start !== false) p.push('start=1');
    if (opts.mode) p.push('mode=' + encodeURIComponent(opts.mode));
    if (opts.rival) p.push('rival=' + encodeURIComponent(opts.rival));
    if (opts.foe) p.push('foe=' + encodeURIComponent(opts.foe));
    if (opts.hint) p.push('hint=1');
    return p.length ? ('?' + p.join('&')) : '';
  }

  function openGame(id, opts) {
    var g = byId(id); if (!g) return;
    opts = opts || {};
    if (tab !== 'games') showScreen('games', true);
    closeSheet();
    hideFulls();
    sheetId = null;
    sheetView = null;
    if (openId) destroyFrame();
    clearTimeout(closeT);
    openId = id;
    var wrap = $('#gwrap');
    var gameEl = $('#game');
    wrap.classList.remove('loaded');
    var loader = $('#loader');
    if (loader) loader.innerHTML = petHtml(g.pet, { mood: 'happy' });
    frame = document.createElement('iframe');
    frame.title = g.title;
    frame.setAttribute('allow', 'autoplay; fullscreen; vibrate');
    frame.id = 'gameFrame';
    frame.dataset.game = id;
    frame.addEventListener('load', function () {
      wrap.classList.add('loaded');
      if (frame) frame.classList.add('ready');
      try { frame.contentWindow.focus(); } catch (e) {}
    });
    var start = opts.start !== false;
    var foe = opts.foe || (TAP && TAP.foeOf && TAP.foeOf(ME.pet)) || g.pet;
    frame.src = 'games/' + g.id + '/index.html' + launchQuery({
      start: start, mode: opts.mode || (isSolo(id) ? 'solo' : 'bot'), rival: opts.rival, foe: foe, hint: opts.hint
    });
    wrap.appendChild(frame);
    gameEl.classList.add('open');
    gameEl.setAttribute('aria-hidden', 'false');
    $('#app').classList.add('in-game');
    document.title = g.title + ' · Тапыши';
    if (!opts.noHist) {
      try { history.pushState({ tab: 'games', game: id }, '', '#game-' + id); } catch (e) {}
    }
  }

  function destroyFrame() {
    if (frame) { try { frame.src = 'about:blank'; } catch (e) {} frame.remove(); frame = null; }
  }

  function closeGame(fromPop) {
    if (!openId) {
      hideFulls();
      closeSheet();
      sheetId = null; sheetView = null;
      return;
    }
    openId = null;
    var gameEl = $('#game');
    gameEl.classList.remove('open');
    gameEl.setAttribute('aria-hidden', 'true');
    $('#app').classList.remove('in-game');
    document.title = 'Тапыши · макет игротеки';
    if (frame) frame.classList.remove('ready');
    closeT = setTimeout(destroyFrame, 400);
    hideFulls();
    if (!fromPop) {
      try {
        if (history.state && history.state.game) history.back();
        else history.replaceState({ tab: 'games' }, '', '#games');
      } catch (e) {}
    }
    showScreen('games', true);
  }

  /* ---------- Clan ---------- */
  function renderClan() {
    $$('#clan .cview').forEach(function (v) { v.classList.remove('on'); });
    var map = { in: 'cv-in', none: 'cv-none', list: 'cv-list', top: 'cv-top' };
    var id = map[clanView] || 'cv-in';
    var el = document.getElementById(id);
    if (el) el.classList.add('on');
    var emb = $('#cv-in [data-slot="clan-emblem"]');
    if (emb) { emb.classList.add('filled'); emb.innerHTML = petHtml('raccoon', { mood: 'happy' }); }
    var noneEmb = $('#cv-none [data-slot="clan-emblem"]');
    if (noneEmb) { noneEmb.classList.add('filled'); noneEmb.innerHTML = petHtml('capybara', { mood: 'neutral' }); }
    var members = $('#members');
    if (members) {
      members.innerHTML = CLAN_MEMBERS.map(function (m, i) {
        return '<div class="member' + (m.me ? ' me' : '') + '"><span class="rk">' + (i + 1) + '</span>' +
          '<div class="slot avatar filled">' + petHtml(m.pet, { mood: m.me ? 'happy' : 'neutral' }) + '</div>' +
          '<div class="who">' + m.name + '<small>' + m.role + '</small></div>' +
          '<div class="pts">' + fmt(m.pts) + '</div></div>';
      }).join('');
    }
    var prev = $('#top-preview');
    if (prev) {
      prev.innerHTML = CLANS.slice().sort(function (a, b) { return b.pts - a.pts; }).slice(0, 3).map(function (c, i) {
        return '<div class="member"><span class="rk">' + (i + 1) + '</span><div class="slot avatar filled">' + petHtml(c.pet, { mood: 'happy' }) + '</div>' +
          '<div class="who">' + c.name + '<small>' + c.n + ' участников</small></div><div class="pts">' + fmt(c.pts) + '</div></div>';
      }).join('');
    }
    renderClanList();
    renderClanTop();
  }

  function renderClanList(state) {
    var box = $('#clan-results'); if (!box) return;
    if (state === 'loading') {
      box.innerHTML = '<div class="sk-row"><div class="sk av"></div><div class="lines"><div class="sk line"></div><div class="sk line" style="width:40%"></div></div></div>'.repeat(3);
      return;
    }
    if (state === 'empty') {
      box.innerHTML = '<div class="empty"><div class="empty-ic"><svg><use href="#i-search"/></svg></div><div class="empty-t">Никого не нашли</div><div class="muted">Попробуйте другое название</div></div>';
      return;
    }
    var q = (($('#clan-q') || {}).value || '').toLowerCase();
    var list = CLANS.filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) >= 0; });
    if (!list.length) { renderClanList('empty'); return; }
    box.innerHTML = list.map(function (c) {
      return '<div class="member"><div class="slot avatar filled">' + petHtml(c.pet, { mood: 'happy' }) + '</div>' +
        '<div class="who">' + c.name + '<small>' + c.n + ' участников · ' + fmt(c.pts) + '</small></div>' +
        (c.mine ? '<span class="mini done">Ваш</span>' : '<button class="mini" data-join="' + c.name + '">Вступить</button>') +
        '</div>';
    }).join('');
  }

  function renderClanTop() {
    var sorted = CLANS.slice().sort(function (a, b) { return b.pts - a.pts; });
    var podium = $('#podium');
    if (podium) {
      var order = [sorted[1], sorted[0], sorted[2]];
      var cls = ['p2', 'p1', 'p3'];
      podium.innerHTML = order.map(function (c, i) {
        if (!c) return '<div class="pod"></div>';
        return '<div class="pod ' + cls[i] + '"><div class="slot filled">' + petHtml(c.pet, { mood: 'happy' }) + '</div>' +
          '<div class="pod-n">' + c.name + '</div><div class="pod-pts">' + fmt(c.pts) + '</div><div class="pod-b">' + (i === 1 ? '1' : i === 0 ? '2' : '3') + '</div></div>';
      }).join('');
    }
    var rest = $('#top-list');
    if (rest) {
      rest.innerHTML = sorted.slice(3).map(function (c, i) {
        return '<div class="member"><span class="rk">' + (i + 4) + '</span><div class="slot avatar filled">' + petHtml(c.pet) + '</div>' +
          '<div class="who">' + c.name + '<small>' + c.n + ' участников</small></div><div class="pts">' + fmt(c.pts) + '</div></div>';
      }).join('') || '<div class="muted center" style="padding:12px">Это весь топ</div>';
    }
  }

  function fillCreateEmblems() {
    var box = $('[data-slot="clan-emblem-picker"]');
    if (!box) return;
    box.classList.add('filled', 'emb-pick');
    var kinds = ['raccoon', 'goose', 'dragon', 'capybara'];
    box.innerHTML = kinds.map(function (k) {
      return '<button type="button" data-emb="' + k + '" class="' + (createEmblem === k ? 'on' : '') + '">' + petHtml(k, { mood: 'happy' }) + '</button>';
    }).join('');
  }

  /* ---------- Shop ---------- */
  function allItems() { return SHOP.t1.concat(SHOP.t2, SHOP.t3); }
  function findItem(id) {
    var all = allItems();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  }

  function itemPreview(it) {
    if (it.pet) return '<span style="filter:' + (it.filter || 'none') + ';display:block;width:100%;height:100%">' + petHtml(it.pet, { mood: 'happy' }) + '</span>';
    return '<span class="item-illu" style="background:' + (it.color || 'var(--accent)') + '"></span>';
  }

  function renderShop(loading) {
    var shop = $('#shop');
    if (loading) { shop.classList.add('loading'); renderShopSkel(); return; }
    shop.classList.remove('loading');
    ['t1', 't2', 't3'].forEach(function (t) {
      var box = $('#' + t + ' .items');
      if (!box) return;
      box.innerHTML = SHOP[t].map(function (it) {
        var state = equipped === it.id ? 'equipped' : owned[it.id] ? 'owned' : '';
        var label = state === 'equipped' ? 'Надето' : state === 'owned' ? 'Надеть' : '<span class="coin"></span>' + fmt(it.price);
        return '<div class="item" data-item="' + it.id + '"><div class="slot filled" style="background:#F4F7FF">' + itemPreview(it) + '</div>' +
          '<div class="name">' + it.name + '</div>' +
          '<button class="price ' + state + '" data-buy="' + it.id + '">' + label + '</button></div>';
      }).join('');
    });
  }

  function renderShopSkel() {
    var box = $('#shop-skel');
    if (!box) return;
    box.innerHTML = '<div class="sk-card"><div class="sk sq"></div><div class="sk line"></div></div>'.repeat(4);
  }

  function tryBuy(id) {
    var it = findItem(id); if (!it) return;
    if (owned[id]) {
      equipped = (equipped === id) ? equipped : id;
      renderShop();
      toast(it.name + ' надет');
      return;
    }
    if (ME.coins < it.price) {
      var need = it.price - ME.coins;
      $('#nc-text').textContent = 'Нужно ещё ' + fmt(need) + ' — сыграйте в игры или выполните задания';
      $('#nc-val').textContent = fmt(ME.coins) + ' / ' + fmt(it.price);
      $('#nc-fill').style.width = Math.max(4, Math.round(ME.coins / it.price * 100)) + '%';
      openOverlay('m-nocoins');
      return;
    }
    pendingBuy = it;
    $('#buy-name').textContent = it.name;
    $('#buy-cat').textContent = it.cat;
    $('#buy-price').textContent = fmt(it.price);
    $('#buy-left').textContent = fmt(ME.coins - it.price);
    var prev = $('[data-slot="item"]');
    if (prev) { prev.classList.add('filled'); prev.innerHTML = itemPreview(it); }
    openOverlay('m-buy');
  }

  function confirmBuy() {
    if (!pendingBuy) return;
    ME.coins -= pendingBuy.price;
    owned[pendingBuy.id] = true;
    if (pendingBuy.cat === 'Скины') equipped = pendingBuy.id;
    setBalances();
    bumpBal();
    var name = pendingBuy.name;
    pendingBuy = null;
    closeAllPop();
    renderShop();
    toast(name + ' куплен', 'coin');
  }

  /* ---------- Profile / results ---------- */
  function fillAvatars(root) {
    $$((root || document).querySelectorAll ? (root || document) === document ? '[data-slot="player-avatar"], [data-slot="opponent-avatar"]' : '[data-slot="player-avatar"], [data-slot="opponent-avatar"]' : 'xxx').forEach(function (el) {
      var slot = el.getAttribute('data-slot');
      el.classList.add('filled');
      el.innerHTML = petHtml(slot === 'opponent-avatar' ? 'goose' : 'raccoon', { mood: slot === 'opponent-avatar' ? 'neutral' : 'happy' });
    });
  }

  function openProfile() {
    fillAvatars($('#f-profile'));
    openFull('f-profile');
  }

  function showResult(win) {
    var el = $('#f-result');
    $('#res-title').textContent = win ? 'Победа!' : 'Поражение';
    $('#res-sub').textContent = win ? 'Вы обыграли соперника' : 'В этот раз не повезло';
    $('#res-pill').innerHTML = '<span class="coin"></span><span>' + (win ? '+' : '−') + fmt(stake) + '</span>';
    var ic = $('#res-ic');
    ic.className = 'big-ic ' + (win ? 'sun' : 'peach') + ' pop res-pet';
    ic.innerHTML = petHtml('raccoon', { mood: win ? 'happy' : 'sad' });
    var conf = $('#confetti');
    if (conf) conf.style.display = win ? '' : 'none';
    hideOtherSheets();
    openFull('f-result');
  }

  function closeAllPop() {
    $$('.sheet.on, .modal.on').forEach(function (el) { el.classList.remove('on'); });
    $('#scrim').classList.remove('on');
    overlayOpen = null;
  }

  /* ---------- Hash demo states (for shots) ---------- */
  function applyState(name) {
    closeAllPop();
    hideFulls();
    if (openId) { /* don't destroy mid-test unless requested */ }
    var st = name || '';
    function goTab(t) { showScreen(t, true); }
    if (st === 'tasks' || st === 'tasks-empty') { goTab('pet'); openTasks(st === 'tasks-empty'); }
    else if (st === 'daily' || st === 'daily-reward') { goTab('pet'); openDaily(); }
    else if (st === 'toast' || st === 'toasts') { goTab('pet'); toast('Монеты начислены', 'coin'); setTimeout(function () { toast('Задание выполнено'); }, 400); }
    else if (st === 'games' || st === 'games-badges') { goTab('games'); gamesLoaded = true; renderGames(); }
    else if (st === 'games-loading') { goTab('games'); $('#games').classList.add('loading'); }
    else if (st === 'duel' || st === 'duel-sheet') { goTab('games'); openSheet('tictactoe'); }
    else if (st === 'search') { goTab('games'); sheetId = 'tictactoe'; stake = 150; startSearch('tictactoe'); clearTimeout(searchT); }
    else if (st === 'link') { goTab('games'); renderInvite('tictactoe'); }
    else if (st === 'win') { showResult(true); }
    else if (st === 'lose') { showResult(false); }
    else if (st === 'clan-in') { inClan = true; clanView = 'in'; goTab('clan'); }
    else if (st === 'clan-none') { inClan = false; clanView = 'none'; goTab('clan'); }
    else if (st === 'clan-list') { clanView = 'list'; goTab('clan'); renderClanList(); }
    else if (st === 'clan-list-loading') { clanView = 'list'; goTab('clan'); renderClanList('loading'); }
    else if (st === 'clan-list-empty' || st === 'clan-empty') { clanView = 'list'; goTab('clan'); renderClanList('empty'); }
    else if (st === 'clan-create') { goTab('clan'); fillCreateEmblems(); openOverlay('m-create'); }
    else if (st === 'clan-top') { clanView = 'top'; goTab('clan'); }
    else if (st === 'clan-leave') { clanView = 'in'; goTab('clan'); openOverlay('m-confirm'); }
    else if (st === 'shop') { goTab('shop'); renderShop(); }
    else if (st === 'shop-loading') { goTab('shop'); renderShop(true); }
    else if (st === 'shop-confirm') { goTab('shop'); tryBuy('peach'); }
    else if (st === 'shop-bought' || st === 'shop-equipped') {
      goTab('shop'); owned.mint = true; equipped = 'mint'; renderShop();
    }
    else if (st === 'no-coins') { goTab('shop'); tryBuy('crown'); }
    else if (st === 'profile') { goTab('pet'); openProfile(); }
    else if (st === 'game') {
      goTab('games');
      fillAvatars($('#f-game'));
      $('#f-game').classList.add('demo', 'on');
      $('#game-title').textContent = 'Крестики-нолики';
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var nav = t.closest && t.closest('#tabs [data-tab]');
    if (nav) { showScreen(nav.getAttribute('data-tab')); return; }

    if (t.closest && t.closest('[data-open-profile]')) { openProfile(); return; }
    if (t.id === 'prof-back' || (t.closest && t.closest('#prof-back'))) { hideFulls(); return; }

    if (t.id === 'open-tasks' || (t.closest && t.closest('#open-tasks'))) { openTasks(false); return; }
    if (t.id === 'open-daily' || (t.closest && t.closest('#open-daily'))) { openDaily(); return; }
    if (t.id === 'upb' || (t.closest && t.closest('#upb'))) { toast('Макет: улучшение пока ничего не списывает', 'info'); return; }

    var claim = t.closest && t.closest('[data-claim]');
    if (claim) {
      var tid = claim.getAttribute('data-claim');
      TASKS.forEach(function (x) { if (x.id === tid) { x.ready = false; ME.coins += x.reward; } });
      setBalances(); bumpBal(); renderTasks(false); toast('Награда получена', 'coin');
      var dot = $('#tasks-dot'); if (dot && !TASKS.some(function (x) { return x.ready; })) dot.style.display = 'none';
      return;
    }

    if (t.id === 'daily-claim' || (t.closest && t.closest('#daily-claim'))) {
      if (dailyClaimed) return;
      dailyClaimed = true;
      ME.coins += 50;
      setBalances(); bumpBal();
      var ddot = $('#daily-dot'); if (ddot) ddot.style.display = 'none';
      closeAllPop();
      toast('Ежедневная награда +50', 'coin');
      return;
    }

    var card = t.closest && t.closest('.hcard[data-id]');
    if (card) { onCard(card.getAttribute('data-id')); return; }

    if (t.id === 'next' || (t.closest && t.closest('#next'))) { goPage(curPage + 1); return; }
    if (t.id === 'prev' || (t.closest && t.closest('#prev'))) { goPage(curPage - 1); return; }
    var dot = t.closest && t.closest('#dots .dot');
    if (dot) { goPage(+dot.getAttribute('data-page') || 0); return; }

    var stk = t.closest && t.closest('#stakes [data-stake]');
    if (stk) {
      stake = +stk.getAttribute('data-stake');
      $$('#stakes [data-stake]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-stake') === stake); });
      return;
    }

    if (t.id === 'psRnd' || (t.closest && t.closest('#psRnd'))) { startSearch(sheetId); return; }
    if (t.id === 'psBot' || (t.closest && t.closest('#psBot'))) {
      var bid = sheetId; closeSheet(); hideFulls(); openGame(bid, { mode: 'bot' }); return;
    }
    if (t.id === 'psFriend' || (t.closest && t.closest('#psFriend'))) { renderInvite(sheetId); return; }
    if (t.id === 'psInviteCancel' || (t.closest && t.closest('#psInviteCancel'))) { cancelInvite(); return; }
    if (t.id === 'search-cancel' || (t.closest && t.closest('#search-cancel'))) { cancelSearch(); return; }
    if (t.id === 'link-copy' || (t.closest && t.closest('#link-copy'))) {
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(INVITE).catch(function () {}); } catch (err) {}
      toast('Ссылка скопирована — отправь в MAX', 'info');
      return;
    }

    if (t.closest && t.closest('[data-clan-back]')) { clanView = inClan ? 'in' : 'none'; renderClan(); return; }
    if (t.id === 'nc-create' || (t.closest && t.closest('#nc-create'))) { fillCreateEmblems(); openOverlay('m-create'); return; }
    if (t.id === 'contribute' || (t.closest && t.closest('#contribute'))) { toast('Вклад внесён', 'coin'); return; }
    if (t.id === 'leave-clan' || (t.closest && t.closest('#leave-clan'))) { openOverlay('m-confirm'); return; }
    if (t.id === 'leave-ok' || (t.closest && t.closest('#leave-ok'))) { inClan = false; clanView = 'none'; closeAllPop(); renderClan(); toast('Вы вышли из клана', 'warn'); return; }
    var cv = t.closest && t.closest('[data-clan-view]');
    if (cv) { clanView = cv.getAttribute('data-clan-view'); renderClan(); return; }
    var join = t.closest && t.closest('[data-join]');
    if (join) { inClan = true; clanView = 'in'; $('#my-clan-name').textContent = join.getAttribute('data-join'); renderClan(); toast('Вы в клане ' + join.getAttribute('data-join')); return; }
    var emb = t.closest && t.closest('[data-emb]');
    if (emb) { createEmblem = emb.getAttribute('data-emb'); fillCreateEmblems(); return; }
    if (t.id === 'create-ok' || (t.closest && t.closest('#create-ok'))) {
      var nm = ($('#clan-name-in') || {}).value || 'Новый клан';
      inClan = true; clanView = 'in';
      $('#my-clan-name').textContent = nm;
      closeAllPop(); renderClan(); toast('Клан «' + nm + '» создан');
      return;
    }

    var shopTabBtn = t.closest && t.closest('.tabs .tab[data-tab]');
    if (shopTabBtn) {
      shopTab = shopTabBtn.getAttribute('data-tab');
      $$('.tabs .tab').forEach(function (b) { b.classList.toggle('on', b === shopTabBtn); });
      $$('.tab-panel').forEach(function (p) { p.classList.toggle('on', p.id === shopTab); });
      return;
    }
    var buy = t.closest && t.closest('[data-buy]');
    if (buy) { tryBuy(buy.getAttribute('data-buy')); return; }
    if (t.id === 'buy-ok' || (t.closest && t.closest('#buy-ok'))) { confirmBuy(); return; }
    if (t.id === 'nc-games' || (t.closest && t.closest('#nc-games'))) { closeAllPop(); showScreen('games'); return; }

    if (t.id === 'sw-sound' || (t.closest && t.closest('#sw-sound'))) {
      soundOn = !soundOn;
      $('#sw-sound').classList.toggle('on', soundOn);
      return;
    }

    if (t.id === 'g-win' || (t.closest && t.closest('#g-win'))) { hideFulls(); showResult(true); return; }
    if (t.id === 'g-lose' || (t.closest && t.closest('#g-lose'))) { hideFulls(); showResult(false); return; }
    if (t.id === 'res-again' || (t.closest && t.closest('#res-again'))) { hideFulls(); if (sheetId || openId) { /* replay last */ } showScreen('games'); return; }
    if (t.id === 'res-menu' || (t.closest && t.closest('#res-menu'))) { hideFulls(); showScreen('games'); return; }
    if (t.id === 'game-exit' || (t.closest && t.closest('#game-exit'))) { hideFulls(); showScreen('games'); return; }

    if (t.closest && t.closest('[data-close]')) { closeAllPop(); return; }
    if (t.id === 'scrim' || (t.closest && t.closest('.ps-dim'))) {
      if ($('#playSheet').classList.contains('on')) { closeSheet(); sheetId = null; sheetView = null; }
      closeAllPop();
      return;
    }
  });

  var stage = $('#pet-stage');
  if (stage) stage.addEventListener('pointerdown', onHomeTap);

  var clanQ = $('#clan-q');
  if (clanQ) clanQ.addEventListener('input', function () { renderClanList(); });
  var clanName = $('#clan-name-in');
  if (clanName) {
    clanName.addEventListener('input', function () {
      var n = clanName.value.length;
      var c = $('#clan-name-cnt'); if (c) c.textContent = n + '/20';
      var ok = $('#create-ok'); if (ok) ok.disabled = n < 2;
    });
  }

  window.addEventListener('popstate', function (e) {
    var st = e.state || {};
    var hid = (location.hash || '').replace(/^#/, '');
    if (hid.indexOf('state=') === 0) { applyState(hid.slice(6)); return; }
    var gid = st.game || (hid.indexOf('game-') === 0 ? hid.slice(5) : (byId(hid) ? hid : null));
    if (gid && byId(gid)) {
      if (tab !== 'games') showScreen('games', true);
      if (!openId) {
        if (isSolo(gid)) openGame(gid, { noHist: true, hint: true, mode: 'solo' });
        else openSheet(gid);
      }
      return;
    }
    if (openId) closeGame(true);
    hideFulls();
    closeAllPop();
    sheetId = null; sheetView = null;
    var t = st.tab || (hid === 'clan' || hid === 'games' || hid === 'shop' ? hid : 'pet');
    if (t !== tab) showScreen(t, true);
  });

  window.addEventListener('hashchange', function () {
    var hid = (location.hash || '').replace(/^#/, '');
    if (hid.indexOf('state=') === 0) applyState(decodeURIComponent(hid.slice(6)));
  });

  window.addEventListener('message', function (e) { if (e.data && e.data.hub === 'back') closeGame(false); });

  /* boot */
  setBalances();
  mountHomePet();
  renderGames();
  renderClan();
  renderShop();
  renderTasks(false);
  renderDays();
  fillAvatars(document);
  fillCreateEmblems();
  bindPagerSwipe();

  var startHash = (location.hash || '').replace(/^#/, '');
  if (startHash.indexOf('state=') === 0) {
    applyState(decodeURIComponent(startHash.slice(6)));
  } else if (startHash.indexOf('game-') === 0 && byId(startHash.slice(5))) {
    var sid = startHash.slice(5);
    showScreen('games', true);
    if (isSolo(sid)) openGame(sid, { noHist: true, start: true, hint: true, mode: 'solo' });
    else openSheet(sid);
  } else if (byId(startHash)) {
    showScreen('games', true);
    if (isSolo(startHash)) openGame(startHash, { noHist: true, start: true, hint: true, mode: 'solo' });
    else openSheet(startHash);
  } else if (startHash === 'clan' || startHash === 'games' || startHash === 'shop') {
    showScreen(startHash, true);
  }

  window.HUB = {
    open: function (id) { onCard(id); },
    play: function (id, opts) { closeSheet(); hideFulls(); openGame(id, opts || {}); },
    sheet: function (id) { openSheet(id); },
    closeSheet: function () { closeSheet(); sheetId = null; sheetView = null; },
    close: function () { closeSheet(); hideFulls(); sheetId = null; sheetView = null; closeGame(false); },
    go: goPage,
    goTab: showScreen,
    applyState: applyState,
    get page() { return curPage; },
    get game() { return openId; },
    get tab() { return tab; },
    get sheetId() { return sheetId; },
    get sheetView() { return sheetView; }
  };
})();
