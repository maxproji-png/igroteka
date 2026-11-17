/* Применяет созданный игроком клан к экрану «Вклад каждого». */
(function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function injectStyle() {
    if (document.getElementById('clan-badge-css')) return;
    var st = document.createElement('style');
    st.id = 'clan-badge-css';
    st.textContent =
      '.emb.clan-badge{background:linear-gradient(180deg,color-mix(in srgb,var(--cc) 82%,var(--white)),var(--cc));' +
      'box-shadow:0 3px 0 color-mix(in srgb,var(--ce) 70%,transparent),inset 0 -3px 0 color-mix(in srgb,var(--ce) 40%,transparent);' +
      'color:var(--badge-ink,var(--white));overflow:hidden}' +
      '.emb.clan-badge svg{width:58%;height:58%;display:block;margin:0}' +
      '.chat-head{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:0 0 12px;background:var(--white);border-radius:var(--r-lg);box-shadow:var(--sh-sm)}' +
      '.chat-head .t{min-width:0}' +
      '.chat-head b{display:block;font-size:14.5px;font-weight:1000}' +
      '.chat-head small{display:block;margin-top:1px;font-size:12px;font-weight:800;color:var(--ink-2)}';
    document.head.appendChild(st);
  }
  function bindLeave(sel, href) {
    setTimeout(function () {
      var l = document.getElementById(sel);
      if (l) l.addEventListener('click', function () { location.href = href; });
    }, 0);
  }

  function applyMine(clan) {
    var C = T.c3;
    var col = ClanCreate.colorBy(clan.color);
    var ic = ClanCreate.iconBy(clan.icon);
    var name = clan.name;
    var badge = '<span class="emb clan-badge" style="' + ClanCreate.badgeStyle(col) + '">' + ClanCreate.svg(ic) + '</span>';
    var badgeSm = '<span class="emb sm clan-badge" style="' + ClanCreate.badgeStyle(col) + '">' + ClanCreate.svg(ic) + '</span>';

    C.goal.now = 12500;
    C.goal.goal = 1500000;
    var pc = document.querySelector('.prog .pc');
    if (pc) pc.innerHTML = '1<small>%</small>';
    var tx = document.querySelector('.prog .tx small');
    if (tx) tx.textContent = '12 500 из 1 500 000';
    var you = document.querySelector('.legend .you b');
    if (you) you.textContent = '12 500';

    C.members = [{ n: 'Ты', pet: 'raccoon', lvl: 7, t: 12500, on: 1, me: 1, owner: 1 }];
    C.colors = ['var(--sun)'];
    C.restN = 0;
    C.restT = 0;
    var st = document.getElementById('stack');
    if (st) st.innerHTML = '<i class="me" style="width:8px;min-width:8px;background:var(--sun)"></i>';
    if (C.paintMilestones) C.paintMilestones();

    C.top.forEach(function (c) { c.me = 0; });
    C.top.push({ n: name, icon: clan.icon, color: clan.color, lvl: 1, m: 1, t: 12500, me: 1 });

    C.chatHead = '<div class="chat-head">' + badgeSm +
      '<span class="t"><b>Чат клана «' + esc(name) + '»</b><small>пока только ты — позови друзей</small></span></div>';
    C.chat = [
      { day: 'Сегодня' },
      { sys: 'Ты создал клан «' + esc(name) + '»' },
      { sys: 'Ты теперь глава клана' }
    ];

    var t1 = document.getElementById('t1');
    if (t1) t1.innerHTML = 'Участники<em>1</em>';
    var t3 = document.getElementById('t3');
    if (t3) t3.innerHTML = 'Чат';

    document.title = 'Тапыши · ' + name + ' · «Вклад каждого»';

    if (window.CX && CX.applyClan) {
      CX.applyClan({
        name: name, icon: clan.icon, color: clan.color,
        lvl: 1, members: 1, cap: 40, online: 1,
        wins: 0, nextWins: 30, nextCap: 45,
        owner: 'Ты', my: 12500
      });
      if (window.CXC && CXC.paint) CXC.paint();
    }

    // перерисовать открытую вкладку
    var on = document.querySelector('.seg button.on');
    if (on) on.click();
    else {
      var m = document.querySelector('.seg [data-tab="members"]');
      if (m) m.click();
    }
  }

  /* qa-fix-14: пустое состояние «нет клана» — как живые экраны: питомцы-рендеры, польза клана, две кнопки.
     «Найти клан» — шторка поиска над таб-баром; если ничего не нашлось — своё пустое состояние. */
  var ROOT = (document.documentElement.getAttribute('data-root') || '../').replace(/\/?$/, '/');
  function pet(n, cls) { return '<img class="' + (cls || '') + '" src="' + ROOT + 'shared/pets/stage/' + n + '.png" alt="" draggable="false">'; }
  var IC = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.5 4h13A3.5 3.5 0 0 1 22 7.5v7a3.5 3.5 0 0 1-3.5 3.5H11l-4.6 3.4c-.7.5-1.4.1-1.4-.7V18A3.5 3.5 0 0 1 2 14.5v-7A3.5 3.5 0 0 1 5.5 4z"/></svg>',
    top: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.4 10.2 7.6 13.4 12 5.4l4.4 8 3.2-3.2v8.2H4.4z"/></svg>',
    clear: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  function chestImg() { return '<img src="' + ROOT + 'shared-clan/img/v2/chest-gold.png" alt="">'; }
  function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ''); }

  function nothingFound(q) {
    return '<div class="ec ec--sm">' +
      '<div class="ec-art ec-art--sm" aria-hidden="true"><i class="ec-blob"></i>' + pet('goose_3', 'ec-p ec-p1') + '<span class="ec-q">?</span></div>' +
      '<h3>Ничего не найдено</h3>' +
      '<p>Клана «' + esc(q) + '» нет. Проверь название или создай свой — и позови друзей.</p>' +
      '<div class="ec-btns"><a class="btn btn--primary btn--l" href="../clan-create/">' + IC.plus + 'Создать клан</a>' +
      '<button type="button" class="btn btn--secondary btn--m btn--wide" data-fd-reset>Сбросить поиск</button></div></div>';
  }
  function clanCard(c) {
    var emb = (window.ClanCreate && ClanCreate.embHTML) ? ClanCreate.embHTML(c, 'sm') : '<span class="emb sm clan-badge"></span>';
    var cap = c.lvl >= 3 ? 50 : c.lvl >= 2 ? 45 : 40, full = c.m >= cap;
    return '<div class="fd-card">' + emb +
      '<span class="fd-t"><b>' + esc(c.n) + '</b><span class="fd-meta"><span class="chip chip--s chip--sun"><b>ур. ' + c.lvl + '</b></span><small>' + c.m + ' из ' + cap + '</small></span></span>' +
      (full ? '<span class="fd-full">мест нет</span>'
            : '<button type="button" class="btn btn--primary btn--s fd-join tap" data-fd-join="' + esc(c.n) + '">Вступить</button>') +
      '</div>';
  }
  function findSheet(q0) {
    var C = T.c3; if (!C || !C.dock) return;
    var list = (C.top || []).slice();
    var html = '<div class="q14-col fd">' +
      '<div class="q14-head"><h3>Найти клан</h3><p>Открытые кланы — вступай в любой, где есть места</p></div>' +
      '<label class="fd-search">' + IC.search + '<input type="search" id="fd-q" placeholder="Название клана" autocomplete="off" enterkeyhint="search" maxlength="18">' +
      '<button type="button" class="fd-clear" data-fd-reset aria-label="Очистить" hidden>' + IC.clear + '</button></label>' +
      '<div class="q14-scroll" id="fd-res"></div></div>';
    var sh = C.dock(html, 'fd-sheet');
    if (!sh) return;
    var inp = sh.querySelector('#fd-q'), res = sh.querySelector('#fd-res'), clr = sh.querySelector('.fd-clear');
    function paint() {
      var q = inp.value.trim(), n = norm(q);
      var hit = list.filter(function (c) { return !n || norm(c.n).indexOf(n) >= 0; });
      clr.hidden = !q;
      res.innerHTML = hit.length
        ? '<div class="fd-sec"><span>' + (q ? 'Нашлось' : 'Популярные кланы') + '</span><span>' + hit.length + '</span></div><div class="fd-list">' + hit.map(clanCard).join('') + '</div>'
        : nothingFound(q);
    }
    inp.addEventListener('input', paint);
    sh.addEventListener('click', function (e) {
      if (e.target.closest('[data-fd-reset]')) { inp.value = ''; paint(); inp.focus(); return; }
      var j = e.target.closest('[data-fd-join]');
      if (j) { j.disabled = true; j.textContent = 'Заявка'; j.classList.remove('btn--primary'); j.classList.add('btn--secondary');
        if (T.toast) T.toast('Заявка в «' + j.getAttribute('data-fd-join') + '» отправлена'); }
    });
    if (q0) inp.value = q0;
    paint();
  }

  function showEmpty() {
    document.title = 'Тапыши · Мой клан';
    var app = document.getElementById('app');
    if (app) app.classList.remove('is-chat');
    var mine = window.ClanCreate && ClanCreate.load();
    var demo = '<div class="ec-demo"><span>демо</span>' +
      (mine ? '<a href="?mine=1">Мой клан</a>' : '') + '<a href="./">Клан «Дикий зоопарк»</a></div>';
    var s = document.querySelector('.scroll');
    if (!s) return;
    s.innerHTML = '<div class="ec ec--page">' +
      '<div class="ec-art" aria-hidden="true"><i class="ec-blob"></i><i class="ec-blob b2"></i>' +
        pet('capybara_3', 'ec-p ec-p2') + pet('dragon_3', 'ec-p ec-p3') + pet('raccoon_3', 'ec-p ec-p1') +
        '<span class="ec-slot">' + IC.plus + '</span></div>' +
      '<h1>Пока нет клана</h1>' +
      '<p>Вступи в клан к друзьям или собери свой: вместе копите сундук и попадайте в топ недели.</p>' +
      '<div class="ec-perks">' +
        '<span class="ec-perk"><i class="sun">' + chestImg() + '</i><b>Общий сундук</b></span>' +
        '<span class="ec-perk"><i class="vio">' + IC.top + '</i><b>Топ недели</b></span>' +
        '<span class="ec-perk"><i class="grn">' + IC.chat + '</i><b>Чат клана</b></span>' +
      '</div>' +
      '<div class="ec-btns"><a class="btn btn--primary btn--l" href="../clan-create/">' + IC.plus + 'Создать клан</a>' +
      '<button type="button" class="btn btn--secondary btn--l tap" data-find-clan>' + IC.search + 'Найти клан</button></div>' +
      demo + '</div>';
    s.addEventListener('click', function (e) { if (e.target.closest('[data-find-clan]')) findSheet(); });
    var hm = (location.hash || '').match(/^#find(?:=(.*))?$/);
    if (hm) setTimeout(function () { findSheet(hm[1] ? decodeURIComponent(hm[1]) : ''); }, 60);
  }
  window.TapClanFind = { open: findSheet };

  function enhanceDemo() {
    /* шапка и шторка «О клане» рисуются из каталога гербов (CX / CXC). */
  }

  injectStyle();
  var q = location.search || '';
  if (/[?&]empty=1/.test(q)) showEmpty();
  else if (/[?&]mine=1/.test(q)) {
    var clan = window.ClanCreate && ClanCreate.load();
    if (!clan) { location.replace('?empty=1'); return; }
    applyMine(clan);
  } else {
    enhanceDemo();
  }
})();
