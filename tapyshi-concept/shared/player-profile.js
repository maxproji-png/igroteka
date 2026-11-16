/* Шторка профиля игрока · утверждённый концепт В (финал).
   TapProfile.open(src) — открыть по данным игрока; клики по строкам клана / чата / друзей биндятся сами. */
(function (w) {
  var FORMS = {
    raccoon:  ['Снежок', 'Иней', 'Льдинка', 'Морозко', 'Вьюжка', 'Снежная Звёздочка'],
    capybara: ['Росточек', 'Листик', 'Веточка', 'Бутончик', 'Цветик', 'Мандариновый Цвет'],
    dragon:   ['Искорка', 'Уголёк', 'Огонёк', 'Пламенчик', 'Жарик', 'Солнечный Дракоша'],
    goose:    ['Ветерок', 'Облачко', 'Пёрышко', 'Бриз', 'Небесный', 'Облачный Ангел']
  };
  var STAGE_AT = [1, 5, 10, 15, 20, 25];
  var I = {
    x:'<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    game:'<svg viewBox="0 0 24 24"><path d="M7.5 6.5h9a5 5 0 0 1 4.9 4.1l.9 5.1a2.9 2.9 0 0 1-5 2.4L15.6 16H8.4l-1.7 2.1a2.9 2.9 0 0 1-5-2.4l.9-5.1A5 5 0 0 1 7.5 6.5z" fill="currentColor"/><path d="M7.6 9.6v3.6M5.8 11.4h3.6" stroke="var(--cut,#fff)" stroke-width="1.9" stroke-linecap="round"/><circle cx="15.6" cy="10.4" r="1.2" fill="var(--cut,#fff)"/><circle cx="17.6" cy="12.6" r="1.2" fill="var(--cut,#fff)"/></svg>',
    clan:'<svg viewBox="0 0 24 24"><path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z" fill="currentColor"/><path d="M12 7.6l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="var(--cut,#fff)" opacity=".95"/></svg>',
    friend:'<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="4" fill="currentColor"/><path d="M2.5 20c.4-4.6 3.4-7 7.5-7s7.1 2.4 7.5 7z" fill="currentColor"/><path d="M19 7.5v6M16 10.5h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    star:'<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    dice:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="currentColor"/><circle cx="8.5" cy="8.5" r="1.7" fill="var(--cut,#fff)"/><circle cx="15.5" cy="15.5" r="1.7" fill="var(--cut,#fff)"/><circle cx="12" cy="12" r="1.7" fill="var(--cut,#fff)"/></svg>',
    crown:'<svg viewBox="0 0 24 24"><path d="M3.5 8l4.3 3.6L12 5l4.2 6.6L20.5 8l-1.8 10H5.3z" fill="var(--sun)" stroke="var(--sun-edge)" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };
  var DUO = ['tictactoe', 'four-in-a-row', 'battleship', 'checkers', 'goroda'];
  var SOLO = ['slozhi-bloki', '2048', 'secret-word'];
  var SOLO_U = ['очков', 'очков', 'лучшее время'];
  var MY = function () { return (w.T && T.clan && T.clan.name) || 'Дикий зоопарк'; };

  /* Каталог демо-рекордов и кланов. Живые поля строки (уровень, онлайн, питомец) имеют приоритет. */
  var CATALOG = {
    max:    { nick:'Макс', pet:'dragon', lvl:17, on:1, seen:'', clan:'Дикий зоопарк', owner:1, friend:1, coins:182400, wins:71, games:186, rec:{w:[20,18,14,11,8],s:[4870,9320,'1:05']} },
    alina:  { nick:'Алина', pet:'goose', lvl:14, on:1, seen:'', clan:'Дикий зоопарк', friend:0, coins:86450, wins:37, games:112, rec:{w:[12,9,7,5,4],s:[2840,5120,'1:12']} },
    vika:   { nick:'Виктория-Анастасия', pet:'dragon', lvl:8, on:0, seen:'была 3 ч назад', clan:'Дикий зоопарк', friend:1, coins:23900, wins:12, games:41, rec:{w:[5,3,2,2,0],s:[620,null,null]} },
    викторианастасия: { alias:'vika' },
    sasha:  { nick:'Саша', pet:'dragon', lvl:22, on:1, seen:'', clan:'Котики-ниндзя', friend:1, coins:214300, wins:96, games:240, rec:{w:[27,22,20,15,12],s:[6310,12480,'0:54']} },
    саша:   { alias:'sasha' },
    marina: { nick:'Марина', pet:'capybara', lvl:16, on:0, seen:'была 2 ч назад', clan:'', friend:1, coins:61200, wins:44, games:98, rec:{w:[14,11,9,6,4],s:[3150,7240,'1:31']} },
    марина: { alias:'marina' },
    sonya:  { nick:'Соня', pet:'capybara', lvl:11, on:0, seen:'была вчера', clan:'Дикий зоопарк', friend:0, coins:98700, wins:29, games:77, rec:{w:[9,7,6,4,3],s:[1980,3560,'2:03']} },
    соня:   { alias:'sonya' },
    tema:   { nick:'tema.max', pet:'raccoon', lvl:11, on:1, seen:'', clan:'', friend:0, coins:41800, wins:18, games:52, rec:{w:[6,5,3,2,2],s:[1240,null,'1:48']} },
    temamax:{ alias:'tema' },
    kira:   { nick:'Кира М.', pet:'goose', lvl:12, on:1, seen:'', clan:'Совы не спят', friend:1, coins:52800, wins:24, games:67, rec:{w:[8,6,5,3,2],s:[1540,2880,'1:56']} },
    кирам:  { alias:'kira' },
    артём:  { nick:'Артём', pet:'raccoon', lvl:9, on:1, seen:'', clan:'Дикий зоопарк', friend:0, coins:31200, wins:16, games:48, rec:{w:[6,4,3,2,1],s:[980,null,null]} },
    артем:  { alias:'артём' },
    егор:   { nick:'Егор', pet:'capybara', lvl:7, on:1, seen:'', clan:'Дикий зоопарк', friend:0, coins:18400, wins:11, games:33, rec:{w:[4,3,2,1,1],s:[null,null,'2:40']} },
    лиза:   { nick:'Лиза', pet:'goose', lvl:6, on:0, seen:'была вчера', clan:'Дикий зоопарк', friend:0, coins:12600, wins:8, games:25, rec:{w:[3,2,2,1,0],s:[440,null,null]} },
    никита: { nick:'Никита', pet:'dragon', lvl:5, on:0, seen:'был вчера', clan:'Дикий зоопарк', friend:0, coins:8900, wins:6, games:19, rec:{w:[2,2,1,1,0],s:[null,null,null]} },
    оля:    { nick:'Оля', pet:'capybara', lvl:4, on:1, seen:'', clan:'Дикий зоопарк', friend:0, coins:5400, wins:4, games:14, rec:{w:[2,1,1,0,0],s:[null,null,null]} },
    дима:   { nick:'Дима', pet:'raccoon', lvl:12, on:1, seen:'', clan:'Дикий зоопарк', me:1, friend:0, coins:12000, wins:22, games:61, rec:{w:[7,5,4,3,3],s:[1680,2740,'1:38']} }
  };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, '');
  }
  function catalog(key) {
    var n = norm(key), x = CATALOG[n], k;
    if (x && x.alias) x = CATALOG[x.alias] || CATALOG[norm(x.alias)];
    if (x && !x.alias) return Object.assign({}, x);
    for (k in CATALOG) {
      x = CATALOG[k];
      if (!x || x.alias) continue;
      if (norm(k) === n || norm(x.nick) === n) return Object.assign({}, x);
    }
    return null;
  }
  function stageOf(level) {
    if (w.TAP_stageOfLevel) return TAP_stageOfLevel(level);
    var lv = Math.max(1, Math.floor(+level) || 1), i;
    for (i = STAGE_AT.length - 1; i >= 0; i--) if (lv >= STAGE_AT[i]) return i + 1;
    return 1;
  }
  function formOf(pet, lvl) {
    var a = FORMS[pet];
    return a ? a[Math.max(0, Math.min(5, stageOf(lvl) - 1))] : '';
  }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  function short(n) { return fmt(n); }
  function plural(n, a, b, c) { var m = n % 100, d = n % 10; return (m > 10 && m < 20) || !d || d > 4 ? c : d === 1 ? a : b; }
  function coin(px) { return (w.T && T.coin) ? T.coin('', px || 24) : ''; }
  function hash(s) {
    var h = 2166136261, i;
    s = String(s || '');
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function invent(seed) {
    var h = hash(seed), lvl = seed.lvl || 8;
    var w0 = Math.max(0, Math.round(lvl * 0.9) + (h % 4));
    var w = [w0, Math.max(0, w0 - 1 - (h % 3)), Math.max(0, w0 - 2), Math.max(0, w0 - 3), Math.max(0, w0 - 4 - (h % 2))];
    var wins = w.reduce(function (a, b) { return a + b; }, 0);
    var s1 = lvl >= 8 ? 180 * lvl + (h % 400) : null;
    var s2 = lvl >= 10 ? 420 * lvl + (h % 800) : null;
    var s3 = lvl >= 7 ? (Math.floor(40 + (30 - lvl) * 4 + (h % 20)) + ':' + ('0' + (h % 60)).slice(-2)) : null;
    return {
      coins: 800 * lvl * lvl + (h % 2500),
      wins: wins,
      games: wins * 3 + 8 + (h % 7),
      rec: { w: w, s: [s1, s2, s3] }
    };
  }
  function friendIds() {
    var set = {}, list = (w.TAP && TAP.FRIENDS) || [];
    list.forEach(function (f) { if (f && f.pet && (f.joined || !f.invited)) { set[norm(f.id)] = 1; set[norm(f.name)] = 1; } });
    return set;
  }

  function build(src) {
    src = src || {};
    var hit = catalog(src.id) || catalog(src.n) || catalog(src.name) || catalog(src.nick) || {};
    var inv = invent({ n: src.n || src.name || src.id || hit.nick, lvl: src.lvl != null ? src.lvl : hit.lvl });
    var p = {
      nick: src.nick || src.name || src.n || hit.nick || 'Игрок',
      pet: src.pet || hit.pet || 'raccoon',
      lvl: src.lvl != null ? src.lvl : (hit.lvl || 1),
      on: src.on != null ? (src.on ? 1 : 0) : (hit.on ? 1 : 0),
      seen: src.seen != null ? src.seen : (hit.seen || 'не в сети'),
      owner: !!(src.owner || hit.owner),
      me: !!(src.me || hit.me),
      coins: src.coins != null ? src.coins : (hit.coins != null ? hit.coins : inv.coins),
      wins: src.wins != null ? src.wins : (hit.wins != null ? hit.wins : inv.wins),
      games: src.games != null ? src.games : (hit.games != null ? hit.games : inv.games),
      rec: src.rec || hit.rec || inv.rec,
      _clanSent: 0,
      _frSent: 0
    };
    if (src.fromClan) p.clan = (src.clan != null ? src.clan : MY());
    else if (src.clan != null) p.clan = src.clan;
    else p.clan = hit.clan != null ? hit.clan : '';
    if (src.fromFriends || src.friend) p.friend = 1;
    else if (hit.friend) p.friend = 1;
    else p.friend = friendIds()[norm(p.nick)] ? 1 : 0;
    p.form = formOf(p.pet, p.lvl);
    return p;
  }

  function avaHTML(p) {
    var src = (w.TAP_petThumb ? TAP_petThumb(p.pet, p.lvl) : '');
    return '<span class="pp-ava ' + p.pet + '" style="width:80px;height:80px;border-radius:24px">' +
      '<span class="face">' + (src ? '<img src="' + src + '" alt="">' : '') + '</span>' +
      (p.on ? '<i class="pp-dot" style="--d:18px"></i>' : '') + '</span>';
  }
  function statusHTML(p) {
    return p.on ? '<span class="pp-st on">в сети</span>' : '<span class="pp-st off">' + (p.seen || 'не в сети') + '</span>';
  }
  function clanMark(name) {
    if (!name || !w.ClanCreate || !ClanCreate.embHTML) return '';
    return '<span class="tl-crest">' + ClanCreate.embHTML(name) + '</span>';
  }
  function gm(id) {
    var list = w.PP_GAMES || [], i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return { id: id, title: id, bg: 'var(--fill)' };
  }
  function icon(id) { return (w.PP_GAME_ICON && PP_GAME_ICON[id]) || ''; }
  function grow(id, val, unit, best, none) {
    var g = gm(id);
    var bg = g.bg || 'var(--fill)';
    if (bg.indexOf('var(') === 0 && bg.indexOf(',') < 0) {
      /* fallback if the token is missing on the clan page */
    }
    return '<div class="gr' + (best ? ' best' : '') + '"><span class="gi" style="--gb:' + bg + '">' + icon(id) + '</span><span class="gn"><span>' + g.title + '</span>' +
      (best ? '<em class="best-tag">Лучшая</em>' : '') + '</span>' +
      '<span class="gv' + (none ? ' none' : '') + '"><b class="num">' + val + '</b><small>' + unit + '</small></span></div>';
  }
  function ac(kind, st) {
    var T = {
      clan: { invite: ['Пригласить<br>в клан', I.clan, ''], mine: ['В твоём<br>клане', I.check, 'done'], sent: ['Приглашение<br>отправлено', I.clock, 'sent'] },
      fr: { add: ['Добавить<br>в друзья', I.friend, ''], done: ['Уже<br>в друзьях', I.check, 'done'], sent: ['Заявка<br>отправлена', I.clock, 'sent'] }
    }[kind][st];
    return '<button type="button" class="ac ' + kind + ' ' + T[2] + '" data-pp="' + (kind === 'fr' ? 'friend' : 'clan') + '">' + T[1] + '<span>' + T[0] + '</span></button>';
  }
  function panel(p, tab) {
    if (tab === 'games') {
      var r = p.rec || { w: [0, 0, 0, 0, 0], s: [null, null, null] };
      var mx = Math.max.apply(null, r.w);
      return '<div class="glist" id="pp-glist"><div class="gh"><span>На двоих</span><span>победы</span></div>' +
        DUO.map(function (id, i) { return grow(id, r.w[i], plural(r.w[i], 'победа', 'победы', 'побед'), mx > 0 && r.w[i] === mx && r.w.indexOf(mx) === i); }).join('') +
        '<div class="gh"><span>Соло</span><span>рекорд</span></div>' +
        SOLO.map(function (id, i) { var v = r.s[i]; return v == null ? grow(id, '—', 'пока нет', 0, 1) : grow(id, typeof v === 'number' ? fmt(v) : v, SOLO_U[i], 0, 0); }).join('') +
        '</div>';
    }
    var mine = p.clan && p.clan === MY();
    return '<div class="tiles">' +
      '<div class="tl tl-coins"><small>Монеты</small><b class="num">' + coin(24) + '<span>' + short(p.coins) + '</span></b></div>' +
      '<div class="tl tl-wins"><span class="deco">' + I.star + '</span><small>Победы в играх</small><b class="num"><span>' + p.wins + '</span></b></div>' +
      '<div class="tl tl-games"><span class="deco">' + I.dice + '</span><small>Сыграно партий</small><b class="num"><span>' + p.games + '</span></b></div>' +
      '<div class="tl tl-clan"><small>Клан' + (mine ? '<em class="tag">' + (p.owner ? I.crown + 'глава' : 'твой') + '</em>' : '') + '</small>' +
        (p.clan ? '<b>' + clanMark(p.clan) + '<span>' + p.clan + '</span></b>' : '<b class="muted"><span>Без клана</span></b>') +
      '</div></div>';
  }
  function bodyHTML(p, tab) {
    var frSt = p._frSent ? 'sent' : (p.friend ? 'done' : 'add');
    var clSt = p._clanSent ? 'sent' : (p.clan === MY() ? 'mine' : 'invite');
    return '<div class="c"><div class="pp-grab"></div>' +
      '<div class="c-head">' + avaHTML(p) + '<div class="tx"><b class="pp-nick">' + p.nick + '</b>' +
        '<span class="c-form"><span class="fn">' + p.form + ' · <b>ур. ' + p.lvl + '</b></span></span>' + statusHTML(p) + '</div>' +
        '<button type="button" class="c-x" data-pp="close" aria-label="Закрыть">' + I.x + '</button></div>' +
      '<div class="seg"><button type="button" data-tab="prof" class="' + (tab === 'prof' ? 'on' : '') + '">Профиль</button>' +
        '<button type="button" data-tab="games" class="' + (tab === 'games' ? 'on' : '') + '">Мини-игры</button></div>' +
      '<div class="panel">' + panel(p, tab) + '</div>' +
      '<div class="acts">' +
        '<button type="button" class="ac' + (p.on ? '' : ' off') + '" data-pp="' + (p.on ? 'game' : 'none') + '"' + (p.on ? '' : ' aria-disabled="true"') + '>' + I.game + '<span>Позвать<br>в игру</span></button>' +
        (p.clan ? '' : ac('clan', clSt)) +
        ac('fr', frSt) +
      '</div></div>';
  }

  var state = { p: null, tab: 'prof', sh: null, bg: null };

  function toast(t) {
    var el = document.querySelector('.pp-toast');
    if (!el) { el = document.createElement('div'); el.className = 'pp-toast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 1800);
  }
  function tune() {
    var tb = document.querySelector('.tabbar, .nav');
    var h = 72;
    if (tb) h = Math.max(48, Math.round(window.innerHeight - tb.getBoundingClientRect().top));
    document.documentElement.style.setProperty('--pp-tb', h + 'px');
  }
  function bindList() {
    var l = state.sh && state.sh.querySelector('#pp-glist');
    if (!l) return;
    var f = function () { l.classList.toggle('end', l.scrollTop + l.clientHeight >= l.scrollHeight - 2); };
    l.addEventListener('scroll', f);
    f();
  }
  function paint() {
    if (!state.sh || !state.p) return;
    state.sh.innerHTML = bodyHTML(state.p, state.tab);
    bindList();
  }
  function close() {
    if (state.sh) state.sh.classList.remove('on');
    if (state.bg) state.bg.classList.remove('on');
    document.body.classList.remove('pp-open');
  }
  function open(src, tab) {
    var p = build(src);
    if (!p.pet || p.me) return;
    state.p = p;
    state.tab = tab || 'prof';
    if (w.T && T.closeSheet) {
      /* если профиль открыли из шторки «Участники», закрываем её, чтобы таб-бар был свободен */
      var members = document.querySelector('body > .sheet.on .clan-members-sheet');
      if (members) T.closeSheet();
    }
    if (!state.bg) {
      state.bg = document.createElement('div');
      state.bg.className = 'pp-scrim';
      state.bg.addEventListener('click', close);
      document.body.appendChild(state.bg);
    }
    if (!state.sh) {
      state.sh = document.createElement('section');
      state.sh.className = 'pp-sheet';
      state.sh.setAttribute('role', 'dialog');
      state.sh.setAttribute('aria-label', 'Профиль игрока');
      state.sh.addEventListener('click', onSheetClick);
      document.body.appendChild(state.sh);
    }
    paint();
    tune();
    document.body.classList.add('pp-open');
    requestAnimationFrame(function () {
      tune();
      state.bg.classList.add('on');
      state.sh.classList.add('on');
    });
  }
  function onSheetClick(e) {
    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn && state.sh.contains(tabBtn)) {
      state.tab = tabBtn.getAttribute('data-tab');
      state.sh.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.toggle('on', x === tabBtn); });
      var pan = state.sh.querySelector('.panel');
      if (pan) pan.innerHTML = panel(state.p, state.tab);
      bindList();
      return;
    }
    var b = e.target.closest('[data-pp]');
    if (!b || !state.sh.contains(b)) return;
    var a = b.getAttribute('data-pp');
    if (a === 'close') close();
    else if (a === 'game') toast('Приглашение в игру отправлено');
    else if (a === 'clan' && !state.p.clan && !state.p._clanSent) { state.p._clanSent = 1; paint(); toast('Приглашение в клан отправлено'); }
    else if (a === 'friend' && !state.p.friend && !state.p._frSent) { state.p._frSent = 1; paint(); toast('Заявка в друзья отправлена'); }
  }

  function currentClan() {
    if (w.ClanCreate && /[?&]mine=1/.test(location.search || '')) {
      var c = ClanCreate.load();
      if (c && c.name) return c.name;
    }
    return MY();
  }
  function memberByName(name) {
    var list = (w.T && T.c3 && T.c3.allMembers) ? T.c3.allMembers() : ((w.T && T.c3 && T.c3.members) || []);
    var i, n = norm(name);
    for (i = 0; i < list.length; i++) if (norm(list[i].n) === n) return list[i];
    return null;
  }
  function friendByKey(key) {
    var list = (w.TAP && TAP.FRIENDS) || [], i, n = norm(key);
    for (i = 0; i < list.length; i++) if (norm(list[i].id) === n || norm(list[i].name) === n) return list[i];
    return null;
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.pp-sheet, .pp-scrim, .pp-toast')) return;
    if (e.target.closest('.fr-act, [data-act="friends-play"], [data-act="friends-write"], [data-invite], .inv, .row.more, [data-members-all], .chatbar, .c-x')) return;

    var fr = e.target.closest('.fr-row');
    if (fr) {
      var fid = fr.getAttribute('data-profile') || fr.getAttribute('data-fid');
      var f = friendByKey(fid) || friendByKey(fr.querySelector('.fr-nm b') && fr.querySelector('.fr-nm b').textContent);
      if (f && f.pet) { e.preventDefault(); open({ id: f.id, name: f.name, pet: f.pet, lvl: f.lvl, on: f.on, seen: f.seen, fromFriends: 1 }); }
      return;
    }

    var hit = e.target.closest('[data-profile]');
    if (hit && !hit.classList.contains('fr-row')) {
      if (hit.getAttribute('data-me') === '1' || hit.classList.contains('me')) return;
      if (hit.classList.contains('more') || hit.classList.contains('inv')) return;
      var key = hit.getAttribute('data-profile');
      var m = memberByName(key);
      if (m) { if (m.me) return; open({ n: m.n, pet: m.pet, lvl: m.lvl, on: m.on, owner: m.owner, clan: currentClan(), fromClan: 1 }); }
      else open({ n: key, fromClan: 1, clan: currentClan() });
      return;
    }
  });

  w.addEventListener('resize', function () { if (document.body.classList.contains('pp-open')) tune(); });

  w.TapProfile = { open: open, close: close, build: build };
})(window);
