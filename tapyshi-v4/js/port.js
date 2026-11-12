/* Макет переноса игротеки внутрь оболочки «Тапышей». Без сервера, цифры статичные. */
(function () {
  'use strict';
  var A = window.ART, IC = A.IC;
  var GAMES = window.HUB_GAMES, PETS = window.HUB_PETS, ICONS = window.HUB_ICONS, META = window.HUB_META || {};
  var $app = document.getElementById('app');
  var $tabs = document.getElementById('tabs');
  var $layer = document.getElementById('layer');
  var $toast = document.getElementById('toast');

  var TI_TASKS = '<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="18" rx="3.5" fill="currentColor"/><rect x="8.5" y="2" width="7" height="4" rx="1.6" fill="#fff" opacity=".9"/><path d="M8 11.5 l2 2 4-4 M8 17 h8" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_EXIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 8l-4 4 4 4M5 12h10"/></svg>';
  var LX = '<button class="lx" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';

  // Статичный «игрок» как на снимке живой главной (home-progress): енот Булочка, 7 ур., 12 000 монет
  var ME = {
    pet: 'raccoon', petName: 'Булочка', stage: 1, petLvl: 7, coins: 12000, trophies: 40,
    energy: 330, maxEnergy: 330, tapPower: 1, hat: null, skin: null,
    nextStageName: 'взрослого', nextLvl: 10
  };
  var HATS = [
    { id: 'cap', name: 'Кепка', price: 100, own: true, wear: false },
    { id: 'bow', name: 'Бантик', price: 500 },
    { id: 'shades', name: 'Тёмные очки', price: 2000 },
    { id: 'wreath', name: 'Венок', price: 6000 },
    { id: 'ushanka', name: 'Ушанка', price: 15000 },
    { id: 'crown', name: 'Корона', price: 50000 }
  ];
  var tryHat = null, trySkin = undefined, shopTab = 'hats';
  var tab = 'pet';

  function fmt(n) { return Math.floor(n || 0).toLocaleString('ru-RU').replace(/\u00a0|\u202f/g, ' '); }
  function coin(v) { return '<span class="coinv">' + IC.coin + fmt(v) + '</span>'; }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function petURL(k, happy) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PETS[k + (happy ? 'H' : 'N')]); }
  function petArt(kind, o) {
    o = o || {};
    if (window.TAPYSHI && TAPYSHI.petSvg) return TAPYSHI.petSvg(kind || ME.pet, o);
    return A.pet(kind || ME.pet, o);
  }
  function stagePet(o) {
    o = o || {};
    var st = o.stage != null ? o.stage : ME.stage;
    var kind = o.pet || ME.pet;
    // шляпы/скины есть только у старых SVG — оставляем их в магазине
    if (o.hat || o.skin) {
      return A.pet(kind, {
        hat: o.hat !== undefined ? o.hat : ME.hat,
        skin: o.skin !== undefined ? o.skin : ME.skin,
        grow: st, cls: o.cls,
        vb: o.vb || (st > 0 ? '0 -24 200 230' : undefined)
      });
    }
    return petArt(kind, { cls: o.cls, happy: (o.cls || '').indexOf('happy') >= 0, mood: o.mood });
  }
  function stagePetHero() {
    if (window.TAPYSHI && TAPYSHI.petHero) {
      return TAPYSHI.petHero(ME.pet, { pose: 'neutral', cls: 'home-hero', tap: true });
    }
    return stagePet();
  }
  function ava(kind, hat, skin) {
    return '<div class="ava c-' + kind + '">' + A.avatar(kind, { hat: hat, skin: skin }) + '</div>';
  }
  var toastT = 0;
  function toast(msg) {
    $toast.innerHTML = msg;
    $toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { $toast.classList.remove('on'); }, 2200);
  }
  function mockToast() { toast('Это макет — без сервера и покупок'); }
  function closeLayer() { $layer.innerHTML = ''; }
  function openSheet(html, cls) {
    $layer.innerHTML = '<div class="dim" data-close="1"></div><div class="sheet' + (cls ? ' ' + cls : '') + '">' + LX + html + '</div>';
    q('.lx', $layer).onclick = closeLayer;
    q('.dim', $layer).onclick = closeLayer;
  }

  // ---------- вкладки ----------
  var TABS = [['pet', 'Питомец', 'paw'], ['clan', 'Клан', 'shield'], ['games', 'Игры', 'swords'], ['shop', 'Магазин', 'bag']];
  function renderTabs() {
    $tabs.hidden = false;
    $tabs.innerHTML = TABS.map(function (t) {
      var badge = t[0] === 'clan' ? '<i class="badge"></i>' : '';
      return '<button class="tab' + (t[0] === tab ? ' on' : '') + '" data-tab="' + t[0] + '">' + IC[t[2]] + '<span>' + t[1] + '</span>' + badge + '</button>';
    }).join('');
    qa('.tab', $tabs).forEach(function (b) {
      b.onclick = function () { go(b.dataset.tab); };
    });
  }
  function go(t, noHist) {
    if (openId) closeGame(true);
    closeSheet(true);
    if (tab === t) { renderTabs(); return; }
    closeLayer();
    tab = t;
    qa('#screen > .scr').forEach(function (s) { s.classList.toggle('on', s.dataset.tab === t); });
    renderTabs();
    if (t === 'shop') drawShop();
    if (!noHist) {
      try {
        var hash = t === 'pet' ? '' : '#' + t;
        history.replaceState({ tab: t }, '', location.pathname + location.search + hash);
      } catch (e) {}
    }
    if (t === 'games') setTimeout(function () { syncPages(true); }, 40);
  }

  // ---------- главная ----------
  function drawHome() {
    var el = q('#scr-pet');
    var pct = Math.round((ME.petLvl - 5) / (ME.nextLvl - 5) * 100);
    el.innerHTML =
      '<div class="top"></div>' +
      '<div class="balance-wrap"><div class="balance"><div class="v" id="bal">' + IC.coin + '<span>' + fmt(ME.coins) + '</span></div>' +
        '<div class="tp-slot"><button class="tasks-pill" id="tpill" aria-label="Задания"><span class="ic">' + TI_TASKS + '</span><b>Задания</b><i class="tb-badge">1</i></button></div>' +
      '</div></div>' +
      '<div class="tapzone" id="tz"><div class="halo"></div><div class="ring"></div>' +
        '<div class="pet-col" data-st="' + ME.stage + '"><div class="pet-wrap" id="pw" style="width:320px"><div class="pet-idle">' + stagePetHero() + '</div></div>' +
        '<div class="pname podium">' + ME.petName + ' · Подросток</div>' +
        '<div class="fnext"><div class="tx">до ' + ME.nextStageName + ' · ' + ME.petLvl + '/' + ME.nextLvl + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
      '</div></div>' +
      '<div class="homebot"><div class="energy"><div class="row"><b>' + IC.bolt + '<span>' + fmt(ME.energy) + '</span> / <span>' + fmt(ME.maxEnergy) + '</span></b></div><div class="bar"><i style="width:100%"></i></div><div class="tap-rate">' + ME.tapPower + ' за тап</div></div>' +
        '<button class="upbtn" id="upb"><span class="up-lab">' + IC.up + 'Улучшить</span><span class="up-pr">' + IC.coin + '1 800</span></button></div>';
    var homeHero = q('[data-live-pet]', el) || q('.home-hero', el);
    if (window.TAPYSHI && TAPYSHI.mountLive && homeHero) {
      TAPYSHI.mountLive(homeHero, { kind: ME.pet, pose: 'neutral', idle: true, tap: true });
    }
    q('#tz', el).addEventListener('pointerdown', function (e) {
      var pw = q('#pw', el), pet = q('.pet', pw);
      var viewer = homeHero && homeHero._petViewer;
      if (viewer && viewer.tap) {
        viewer.tap();
      } else {
        pw.classList.add('squash'); if (pet) pet.classList.add('happy');
        setTimeout(function () { pw.classList.remove('squash'); if (pet) pet.classList.remove('happy'); }, 380);
      }
      var f = document.createElement('div');
      f.className = 'float'; f.textContent = '+' + ME.tapPower;
      var r = $app.getBoundingClientRect();
      f.style.left = (e.clientX - r.left) + 'px';
      f.style.top = (e.clientY - r.top) + 'px';
      $app.appendChild(f);
      setTimeout(function () { f.remove(); }, 900);
    });
    q('#upb', el).onclick = openUpgrade;
    q('#tpill', el).onclick = openTasks;
  }
  function openUpgrade() {
    openSheet(
      '<div class="one-up"><div class="ou-pet">' + stagePet({ vb: '0 -24 200 230' }) + '<span class="ou-lv">ур. ' + ME.petLvl + '</span></div>' +
      '<h2>Прокачать питомца</h2><p>Макет: кнопки ничего не списывают</p>' +
      '<div class="ou-rows"><div class="ou-row"><span class="ic c1">' + IC.hand + '</span>Монет за тап<b>' + ME.tapPower + ' → <em>2</em></b></div>' +
      '<div class="ou-row"><span class="ic c2">' + IC.bolt + '</span>Энергия<b>' + ME.maxEnergy + ' → <em>360</em></b></div></div>' +
      '<button class="btn" id="doUp">Прокачать за ' + coin(1800) + '</button></div>',
      'upg'
    );
    q('#doUp', $layer).onclick = function () { closeLayer(); mockToast(); };
  }
  function openTasks() {
    openSheet(
      '<div class="sh-h"><h2>Задания</h2></div>' +
      '<div class="tk claim"><span class="ic c4">' + TI_TASKS + '</span><div class="tx"><div class="nm">Зайти сегодня</div><div class="tk-rw">' + IC.coin + '+200</div></div><button class="btn sm green" id="tkClaim">Забрать</button></div>' +
      '<p class="mock-note" style="color:var(--ink2);margin:12px 0 0">В макете награды не начисляются</p>',
      'tasks'
    );
    var b = q('#tkClaim', $layer); if (b) b.onclick = function () { closeLayer(); mockToast(); };
  }

  // ---------- клан (заглушка) ----------
  function drawClan() {
    var members = [
      { me: true, name: 'Ты', pet: 'raccoon', petName: 'Булочка', level: 7, week: 2400, owner: false },
      { name: 'Мила', pet: 'goose', petName: 'Гоша', level: 9, week: 3100, owner: true },
      { name: 'Тима', pet: 'dragon', petName: 'Искорка', level: 6, week: 1800 },
      { name: 'Лера', pet: 'capybara', petName: 'Бублик', level: 5, week: 900 }
    ];
    q('#scr-clan').innerHTML =
      '<div class="clan-head v24 cn-head">' + A.crest('raccoon') + '<div class="cn-t"><h1>Пончики</h1><div class="sb">4 игрока · <i class="odot"></i>2 онлайн</div></div>' +
      '<button class="cn-leave" id="leave2" type="button">' + IC_EXIT + 'Выйти</button></div>' +
      '<p class="mock-note">Макет вкладки «Клан» — без живых данных</p>' +
      '<div class="pad"><div class="card cxd cxs win"><div class="top"><span class="lbl">' + IC.swords + 'Дуэль кланов</span><span class="tm">' + IC.clock + '<b>1:40</b></span></div>' +
        '<div class="cxs-row"><div class="cxs-s">' + A.crest('raccoon') + '<div class="sc">12 тыс</div><div class="nm">Пончики</div></div><div class="cxs-vs">vs</div>' +
        '<div class="cxs-s">' + A.crest('goose') + '<div class="sc">9,4 тыс</div><div class="nm">Речники</div></div></div>' +
        '<div class="bar"><i style="width:56%"></i></div><div class="cxs-st">Мы побеждаем!</div>' +
        '<button class="btn green" id="help">' + IC.hand + 'Тапать за клан</button><div class="cxs-pr">Победа: +' + IC.coin + ' 500</div></div></div>' +
      '<div class="pad"><div class="sec-t"><h3>Игроки клана</h3><span>тапы за неделю</span></div><div class="card list">' +
        members.map(function (x) {
          return '<div class="li' + (x.me ? ' me' : '') + '">' + ava(x.pet) + '<div class="tx"><div class="nm">' + x.name + (x.owner ? '<span class="tag own">👑 глава</span>' : '') + '</div><div class="sb">' + x.petName + ' · ур. ' + x.level + '</div></div><div class="pc" style="font-size:14px">' + fmt(x.week) + '</div></div>';
        }).join('') + '</div></div><div style="height:8px"></div>';
    q('#help', q('#scr-clan')).onclick = function () { go('pet'); toast('Каждый тап — в дуэль! (в макете тапы не считаются)'); };
    q('#leave2', q('#scr-clan')).onclick = mockToast;
  }

  // ---------- магазин (заглушка) ----------
  function shopTabs() {
    return '<div class="shoptabs"><button data-st="hats"' + (shopTab === 'hats' ? ' class="on"' : '') + '>Шапки</button><button data-st="skins"' + (shopTab === 'skins' ? ' class="on"' : '') + '>Скины</button></div>';
  }
  function drawShop() {
    var el = q('#scr-shop');
    if (shopTab === 'skins') {
      var skins = [
        { id: null, name: 'Обычный окрас', tier: 'base', price: 0, own: true },
        { id: 'raccoon_ginger', name: 'Рыжий енот', tier: 'common', price: 80 },
        { id: 'raccoon_snow', name: 'Снежный енот', tier: 'common', price: 80 },
        { id: 'raccoon_night', name: 'Ночной енот', tier: 'rare', price: 300 }
      ];
      var preview = trySkin !== undefined ? trySkin : ME.skin;
      var cur = skins.filter(function (k) { return (k.id || null) === (preview || null); })[0] || skins[0];
      el.innerHTML =
        '<div class="pagehead"><h1>Магазин</h1><span class="timer tr">' + IC.cup + '<span>' + fmt(ME.trophies) + '</span></span></div>' + shopTabs() +
        '<div class="shophead skinhead v24"><div class="podium"></div>' + stagePet({ skin: preview, hat: null, cls: 'pv', vb: '-10 -30 220 250' }) +
          '<div class="sk-name"><b>' + cur.name + '</b></div></div>' +
        '<p class="note24">Макет: скины только примеряются</p>' +
        '<div class="items skins">' + skins.map(function (k) {
          var wear = (preview || null) === k.id;
          var pr = wear && k.own ? '<span class="pr wear">Надет</span>' : k.own ? '<span class="pr own">Бесплатно</span>' : '<span class="pr tr">' + IC.cup + k.price + '</span>';
          return '<button class="item skin t-' + k.tier + (wear ? ' sel' : '') + '" data-k="' + (k.id || '') + '">' +
            (k.tier === 'rare' ? '<span class="tier rare">Редкий</span>' : k.tier === 'common' ? '<span class="tier">Обычный</span>' : '') +
            '<div class="sk-ava">' + stagePet({ skin: k.id, hat: null, vb: '-34 -32 268 250' }) + '</div>' + pr + '</button>';
        }).join('') + '</div>';
    } else {
      var preview = tryHat !== null ? tryHat : ME.hat;
      el.innerHTML =
        '<div class="pagehead"><h1>Магазин</h1><span class="timer">' + coin(ME.coins) + '</span></div>' + shopTabs() +
        '<div class="shophead v24"><div class="podium"></div>' + stagePet({ hat: preview, cls: 'pv', vb: '-10 -40 220 260' }) + '</div>' +
        '<div class="note24">Шапки — только для красоты, на силу тапа не влияют</div>' +
        '<div class="items">' + HATS.map(function (i) {
          var wear = preview === i.id, can = ME.coins >= i.price;
          var pr = wear && i.own ? '<span class="pr wear">Надета</span>' : i.own ? '<span class="pr own">Куплена</span>' : '<span class="pr">' + IC.coin + fmt(i.price) + '</span>';
          return '<button class="item' + (wear ? ' sel' : '') + '" data-hat="' + i.id + '"><div class="hat-svg">' + A.hatIcon(i.id) + '</div><div class="nm">' + i.name + '</div>' + pr + '</button>';
        }).join('') + '</div>' +
        '<div class="pad shopcta-static"><button class="btn" id="shopBuy">В макете купить нельзя</button></div>';
    }
    qa('[data-st]', el).forEach(function (b) {
      b.onclick = function () { shopTab = b.dataset.st; drawShop(); };
    });
    qa('[data-hat]', el).forEach(function (b) {
      b.onclick = function () { tryHat = b.dataset.hat; drawShop(); };
    });
    qa('[data-k]', el).forEach(function (b) {
      b.onclick = function () { trySkin = b.dataset.k || null; drawShop(); };
    });
    var buy = q('#shopBuy', el); if (buy) buy.onclick = mockToast;
  }

  // ---------- игротека ----------
  function buildHub() {
    q('#gamesBal').innerHTML = IC.coin + fmt(ME.coins);
    var squad = q('#squad');
    ['raccoon', 'goose', 'capybara', 'dragon'].forEach(function (k) {
      var d = document.createElement('div'); d.className = 'p';
      d.innerHTML = petArt(k, { cls: 'happy', mood: 'happy' });
      squad.appendChild(d);
    });
    var pagesEl = q('#pages'), dotsEl = q('#dots');
    var PER = 4, NP = Math.ceil(GAMES.length / PER);
    var PLAY = '<svg viewBox="0 0 12 12"><path d="M2.5 1.3v9.4a.6.6 0 0 0 .9.5l7.6-4.7a.6.6 0 0 0 0-1L3.4.8a.6.6 0 0 0-.9.5z" fill="#fff"/></svg>';
    for (var p = 0; p < NP; p++) {
      var pg = document.createElement('section'); pg.className = 'page'; pg.setAttribute('aria-label', 'Страница ' + (p + 1));
      var gr = document.createElement('div'); gr.className = 'grid';
      GAMES.slice(p * PER, p * PER + PER).forEach(function (g) {
        var c = document.createElement('button');
        c.className = 'hcard'; // .card оставляем для тестов/совместимости, стили — у .hcard
        c.dataset.id = g.id;
        c.style.setProperty('--c', g.color);
        c.style.setProperty('--soft', g.soft);
        c.setAttribute('aria-label', g.title + '. ' + g.tag);
        var meta = META[g.id] || {};
        var rec = meta.kind === 'solo' && meta.record ? '<span class="rec">' + meta.record + '</span>' : '';
        c.innerHTML = '<div class="art"><div class="icon">' + ICONS[g.icon] + '</div><div class="pet">' + petArt(g.pet) + '</div></div><span class="play">' + PLAY + '</span><div class="meta"><h3>' + g.title + '</h3><p>' + g.tag + '</p>' + rec + '</div>';
        c.addEventListener('click', function () { onCard(g.id, c); });
        gr.appendChild(c);
      });
      pg.appendChild(gr); pagesEl.appendChild(pg);
      var d = document.createElement('button'); d.className = 'dot';
      d.setAttribute('aria-label', 'Страница ' + (p + 1));
      (function (i) { d.onclick = function () { goPage(i); }; })(p);
      dotsEl.appendChild(d);
    }
    bindPager(pagesEl, NP);
    q('#loader').innerHTML = petArt(ME.pet, { mood: 'happy', cls: 'happy' });
  }

  var curPage = 0, NPAGES = 2;
  function goPage(i) {
    var pagesEl = q('#pages');
    i = Math.max(0, Math.min(NPAGES - 1, i));
    pagesEl.scrollTo({ left: i * pagesEl.clientWidth, behavior: 'smooth' });
  }
  function syncPages(force) {
    var pagesEl = q('#pages'); if (!pagesEl) return;
    var i = Math.round(pagesEl.scrollLeft / Math.max(1, pagesEl.clientWidth));
    if (i !== curPage || force) {
      curPage = i;
      qa('#dots .dot').forEach(function (d, k) { d.classList.toggle('on', k === i); });
      q('#prev').disabled = i === 0;
      q('#next').disabled = i === NPAGES - 1;
      q('#pageTitle').innerHTML = 'Страница ' + (i + 1) + '<em>из ' + NPAGES + '</em>';
    }
  }
  function bindPager(pagesEl, NP) {
    NPAGES = NP;
    pagesEl.addEventListener('scroll', function () { window.requestAnimationFrame(function () { syncPages(false); }); }, { passive: true });
    q('#prev').onclick = function () { goPage(curPage - 1); };
    q('#next').onclick = function () { goPage(curPage + 1); };
    // перетаскивание мышью, как в хабе
    (function () {
      var down = false, sx = 0, sl = 0, moved = false;
      pagesEl.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = false; sx = e.clientX; sl = pagesEl.scrollLeft;
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        if (Math.abs(dx) > 6) { moved = true; pagesEl.style.scrollSnapType = 'none'; pagesEl.style.scrollBehavior = 'auto'; pagesEl.scrollLeft = sl - dx; }
      });
      window.addEventListener('pointerup', function () {
        if (!down) return; down = false;
        pagesEl.style.scrollSnapType = ''; pagesEl.style.scrollBehavior = '';
        if (moved) {
          var dx = (pagesEl.scrollLeft - sl);
          var base = Math.round(sl / Math.max(1, pagesEl.clientWidth));
          goPage(Math.abs(dx) > 60 ? base + (dx > 0 ? 1 : -1) : base);
        }
      });
      pagesEl.addEventListener('click', function (e) {
        if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
      }, true);
    })();
    window.addEventListener('resize', function () {
      pagesEl.style.scrollBehavior = 'auto';
      pagesEl.scrollLeft = curPage * pagesEl.clientWidth;
      pagesEl.style.scrollBehavior = '';
    });
    document.addEventListener('keydown', function (e) {
      if (openId || tab !== 'games') return;
      if (e.key === 'ArrowRight') goPage(curPage + 1);
      else if (e.key === 'ArrowLeft') goPage(curPage - 1);
    });
    syncPages(true);
  }

  var gameEl = q('#game'), wrap = q('#gwrap'), frame = null, openId = null, closeT = 0, lastLaunch = null;
  function byId(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; }
  function isSolo(id) { return (META[id] || {}).kind === 'solo'; }
  function cardEl(id) { return document.querySelector('.hcard[data-id="' + id + '"]'); }

  var RIVALS = ['Лера', 'Макс', 'Соня', 'Тимур', 'Ника', 'Даня', 'Кира', 'Артём', 'Мила', 'Егор'];
  var FOES = ['goose', 'dragon', 'capybara'];
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function onCard(id, el) {
    if (isSolo(id)) {
      var seen = false;
      try { seen = !!sessionStorage.getItem('tapyshi.seenHint.' + id); } catch (e) {}
      openGame(id, el, { start: true, hint: !seen });
      try { sessionStorage.setItem('tapyshi.seenHint.' + id, '1'); } catch (e) {}
    } else {
      openSheet(id, el);
    }
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

  function openGame(id, fromEl, opts) {
    var g = byId(id); if (!g) return;
    opts = opts || {};
    if (typeof opts === 'boolean') opts = { noHist: opts };
    if (tab !== 'games') go('games', true);
    if (openId) destroyFrame();
    clearTimeout(closeT);
    openId = id;
    lastLaunch = { id: id, mode: opts.mode || (isSolo(id) ? 'solo' : 'bot'), rival: opts.rival || '', foe: opts.foe || '' };
    var from = fromEl || cardEl(id);
    var r = from ? from.getBoundingClientRect() : null;
    var ar = $app.getBoundingClientRect();
    gameEl.style.setProperty('--ox', r ? (r.left - ar.left + r.width / 2) + 'px' : '50%');
    gameEl.style.setProperty('--oy', r ? (r.top - ar.top + r.height / 2) + 'px' : '50%');
    gameEl.style.setProperty('--gbg', g.bg);
    gameEl.style.setProperty('--gsoft', g.soft);
    wrap.classList.remove('loaded');
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
    var start = opts.start !== false; // default start
    frame.src = 'games/' + g.id + '.html' + launchQuery({
      start: start, mode: opts.mode, rival: opts.rival, foe: opts.foe, hint: opts.hint
    });
    wrap.appendChild(frame);
    void gameEl.offsetWidth;
    gameEl.classList.add('open');
    gameEl.setAttribute('aria-hidden', 'false');
    $app.classList.add('in-game');
    document.title = g.title + ' · Тапыши';
    if (!opts.noHist) { try { history.pushState({ tab: 'games', game: id }, '', '#game-' + id); } catch (e) {} }
  }
  function destroyFrame() {
    if (frame) { try { frame.src = 'about:blank'; } catch (e) {} frame.remove(); frame = null; }
  }
  function closeGame(fromPop) {
    if (!openId) return;
    openId = null;
    gameEl.classList.remove('open');
    gameEl.setAttribute('aria-hidden', 'true');
    $app.classList.remove('in-game');
    document.title = 'Тапыши · макет игротеки';
    if (frame) frame.classList.remove('ready');
    closeT = setTimeout(destroyFrame, 480);
    if (!fromPop) {
      try {
        if (history.state && history.state.game) history.back();
        else history.replaceState({ tab: 'games' }, '', '#games');
      } catch (e) {}
    }
  }

  window.addEventListener('popstate', function (e) {
    var st = e.state || {};
    var hid = (location.hash || '').replace(/^#/, '');
    var gid = st.game || (hid.indexOf('game-') === 0 ? hid.slice(5) : (byId(hid) ? hid : null));
    if (gid && byId(gid)) { if (tab !== 'games') go('games', true); openGame(gid, null, true); return; }
    if (openId) closeGame(true);
    var t = st.tab || (hid === 'clan' || hid === 'games' || hid === 'shop' ? hid : 'pet');
    if (t !== tab) go(t, true);
  });
  window.addEventListener('message', function (e) { if (e.data && e.data.hub === 'back') closeGame(false); });

  // ---------- общий нижний шит для игр 1 на 1 ----------
  var sheetEl = q('#playSheet'), sheetId = null, sheetView = null, searchT = 0, sheetCloseT = 0;
  var IC_RND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M19 5l1.5-3M5 5L3.5 2"/></svg>';
  var IC_BOT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="4"/><path d="M12 8V5M9 13h.01M15 13h.01M9.5 17h5"/></svg>';
  var IC_FRIEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3.5 19c.4-3.6 3.4-5.5 5.5-5.5s5.1 1.9 5.5 5.5M14.5 13.6c1.7-.3 3.7.8 4.5 3.4"/></svg>';
  var IC_SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.4 13.2l7.2 3.6M15.6 7.2l-7.2 3.6"/></svg>';
  var IC_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="#1FA86A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l5 5 9-11"/></svg>';

  function metaOf(id) { return META[id] || {}; }

  function renderModes(id) {
    var g = byId(id), m = metaOf(id);
    var pet = (window.TAPYSHI && TAPYSHI.petHero) ? TAPYSHI.petHero(g.pet, { mood: 'happy', pose: 'happy' }) : petArt(g.pet, { mood: 'happy', cls: 'happy' });
    q('#psModes').innerHTML =
      '<div class="ps-hero"><div class="ps-pet">' + pet + '</div><div class="ps-titles"><h2 id="psTitle">' + g.title + '</h2><p>' + (m.rule || g.tag) + '</p></div></div>' +
      '<div class="ps-stake">' + IC.coin + 'Ставка ' + (m.stake || 150) + '</div>' +
      '<div class="ps-acts">' +
        '<button type="button" class="ps-btn rnd" id="psRnd" data-act="rnd">' + IC_RND + 'Случайный соперник</button>' +
        '<button type="button" class="ps-btn bot" id="psBot" data-act="bot">' + IC_BOT + 'С ботом</button>' +
        '<button type="button" class="ps-btn friend" id="psFriend" data-act="friend">' + IC_FRIEND + 'С другом</button>' +
      '</div>';
    q('#psRnd').onclick = function () { startSearch(id); };
    q('#psBot').onclick = function () { playFromSheet(id, { mode: 'bot' }); };
    q('#psFriend').onclick = function () { renderInvite(id); };
  }

  function renderSearch(id) {
    var g = byId(id);
    q('#psSearch').innerHTML =
      '<div class="ps-orbit"><div class="bob">' + petArt(g.pet, { mood: 'happy', cls: 'happy' }) + '</div></div>' +
      '<h3>Ищем соперника…</h3><p>Подбираем игрока похожего уровня</p>' +
      '<div class="ps-dots" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<button type="button" class="ps-cancel" id="psSearchCancel">Отмена</button>';
    q('#psSearchCancel').onclick = function () { cancelSearch(); showSheetView('modes'); };
  }

  function renderInvite(id) {
    q('#psInvite').innerHTML =
      '<div class="ps-ok" aria-hidden="true">' + IC_OK + '</div>' +
      '<h3>Ссылка скопирована</h3>' +
      '<p>Отправь другу в MAX — как только примет, начнёте партию</p>' +
      '<button type="button" class="ps-btn rnd" id="psShare">' + IC_SHARE + 'Поделиться</button>' +
      '<button type="button" class="ps-cancel" id="psInviteCancel">Отмена</button>';
    q('#psShare').onclick = function () { toast('Это макет — без настоящей отправки'); };
    q('#psInviteCancel').onclick = function () { showSheetView('modes'); };
    showSheetView('invite');
  }

  function showSheetView(name) {
    sheetView = name;
    qa('#playSheet .ps-view').forEach(function (v) {
      var on = v.getAttribute('data-view') === name;
      v.hidden = !on;
    });
  }

  function openSheet(id, fromEl) {
    var g = byId(id); if (!g || isSolo(id)) return;
    if (openId) closeGame(true);
    clearTimeout(searchT); clearTimeout(sheetCloseT);
    sheetId = id;
    renderModes(id); renderSearch(id); renderInvite(id);
    showSheetView('modes');
    sheetEl.classList.remove('closing');
    void sheetEl.offsetWidth;
    sheetEl.classList.add('on');
    sheetEl.setAttribute('aria-hidden', 'false');
  }

  function closeSheet(immediate) {
    clearTimeout(searchT); clearTimeout(sheetCloseT);
    if (!sheetEl.classList.contains('on') && !sheetEl.classList.contains('closing')) {
      sheetId = null; sheetView = null; return;
    }
    sheetEl.classList.remove('on');
    if (immediate) {
      sheetEl.classList.remove('closing');
      sheetEl.setAttribute('aria-hidden', 'true');
      sheetId = null; sheetView = null;
      return;
    }
    sheetEl.classList.add('closing');
    sheetCloseT = setTimeout(function () {
      sheetEl.classList.remove('closing');
      sheetEl.setAttribute('aria-hidden', 'true');
      sheetId = null; sheetView = null;
    }, 360);
  }

  function playFromSheet(id, opts) {
    closeSheet(false);
    setTimeout(function () { openGame(id, cardEl(id), opts); }, 180);
  }

  function startSearch(id) {
    showSheetView('search');
    clearTimeout(searchT);
    searchT = setTimeout(function () {
      if (sheetId !== id || sheetView !== 'search') return;
      playFromSheet(id, { mode: 'random', rival: pick(RIVALS), foe: pick(FOES) });
    }, 1600);
  }
  function cancelSearch() { clearTimeout(searchT); }

  q('.ps-dim', sheetEl).addEventListener('click', function () { closeSheet(false); });

  (function bindSwipe() {
    var card = q('.ps-card', sheetEl);
    var sy = 0, dy = 0, dragging = false, lastY = 0, lastT = 0, vel = 0;
    function onDown(e) {
      if (e.target.closest('button')) return;
      dragging = true; dy = 0;
      sy = (e.touches ? e.touches[0].clientY : e.clientY);
      lastY = sy; lastT = Date.now(); vel = 0;
      card.classList.add('dragging');
    }
    function onMove(e) {
      if (!dragging) return;
      var y = (e.touches ? e.touches[0].clientY : e.clientY);
      dy = Math.max(0, y - sy);
      var now = Date.now(), dt = Math.max(1, now - lastT);
      vel = (y - lastY) / dt;
      lastY = y; lastT = now;
      card.style.transform = 'translateY(' + dy + 'px)';
      if (e.cancelable) e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false; card.classList.remove('dragging');
      card.style.transform = '';
      if (dy > 80 || vel > 0.7) closeSheet(false);
    }
    card.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  })();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (sheetEl.classList.contains('on'))) closeSheet(false);
  });



  // ---------- старт ----------
  if (A.globalDefs) {
    var hold = document.createElement('div');
    hold.innerHTML = A.globalDefs;
    $app.insertBefore(hold.firstChild, $app.firstChild);
  }
  drawHome();
  if (window.TAPYSHI && TAPYSHI.preloadLive) TAPYSHI.preloadLive('raccoon');
  drawClan();
  drawShop();
  buildHub();
  renderTabs();

  var startHash = (location.hash || '').replace(/^#/, '');
  if (startHash.indexOf('game-') === 0 && byId(startHash.slice(5))) {
    var sid = startHash.slice(5);
    go('games', true);
    if (isSolo(sid)) openGame(sid, null, { noHist: true, start: true, hint: true });
    else openSheet(sid);
  } else if (byId(startHash)) {
    go('games', true);
    if (isSolo(startHash)) openGame(startHash, null, { noHist: true, start: true, hint: true });
    else openSheet(startHash);
  } else if (startHash === 'clan' || startHash === 'games' || startHash === 'shop') {
    go(startHash, true);
  }

  window.HUB = {
    open: function (id, opts) { onCard(id, cardEl(id)); },
    play: function (id, opts) { opts = opts || {}; closeSheet(true); openGame(id, cardEl(id), opts); },
    sheet: function (id) { openSheet(id); },
    closeSheet: function () { closeSheet(false); },
    close: function () { closeSheet(true); closeGame(false); },
    go: goPage,
    goTab: go,
    get page() { return curPage; },
    get game() { return openId; },
    get tab() { return tab; },
    get sheetId() { return sheetId; },
    get sheetView() { return sheetView; }
  };
})();
