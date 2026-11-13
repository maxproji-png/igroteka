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

    var emb = document.querySelector('.ch-h .emb');
    if (emb) {
      emb.outerHTML = badge;
    }
    var title = document.querySelector('.ch-h .t > b');
    if (title) title.textContent = name;
    var sub = document.querySelector('.ch-h .t small');
    if (sub) sub.innerHTML = '<span class="chip chip--sun"><b>ур. 1</b></span>1 из 45 · <i class="gdot"></i> 1 онлайн';

    C.goal.now = 12500;
    C.goal.goal = 1500000;
    var pc = document.querySelector('.prog .pc');
    if (pc) pc.innerHTML = '1<small>%</small>';
    var tx = document.querySelector('.prog .tx small');
    if (tx) tx.textContent = '12 500 из 1,5 млн';
    var you = document.querySelector('.legend .you b');
    if (you) you.textContent = '12 500';

    C.members = [{ n: 'Ты', pet: 'raccoon', lvl: 7, t: 12500, on: 1, me: 1, owner: 1 }];
    C.colors = ['var(--sun)'];
    C.restN = 0;
    C.restT = 0;
    var st = document.getElementById('stack');
    if (st) st.innerHTML = '<i class="me" style="width:8px;min-width:8px;background:var(--sun)"></i>';

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

    var more = document.getElementById('more');
    if (more) {
      var next = more.cloneNode(true);
      more.parentNode.replaceChild(next, more);
      next.addEventListener('click', function () {
        T.sheet(
          '<h3>' + esc(name) + '</h3>' +
          '<div class="srow">Уровень клана<b>1</b></div>' +
          '<div class="srow">Мест занято<b>1 из 45</b></div>' +
          '<div class="srow" id="to-demo">Демо-клан «Дикий зоопарк»</div>' +
          '<div class="srow danger" id="leave">Покинуть клан</div>'
        );
        bindLeave('leave', '?empty=1');
        bindLeave('to-demo', './');
      });
    }

    // перерисовать открытую вкладку
    var on = document.querySelector('.seg button.on');
    if (on) on.click();
    else {
      var m = document.querySelector('.seg [data-tab="members"]');
      if (m) m.click();
    }
  }

  function showEmpty() {
    document.title = 'Тапыши · Мой клан';
    var app = document.getElementById('app');
    if (app) app.classList.remove('is-chat');
    var mine = window.ClanCreate && ClanCreate.load();
    var back = mine
      ? '<a class="back-my" href="?mine=1">Вернуться в мой клан</a><a class="back-my" href="./">Демо-клан «Дикий зоопарк»</a>'
      : '<a class="back-my" href="./">Вернуться в демо-клан</a>';
    var s = document.querySelector('.scroll');
    if (!s) return;
    s.innerHTML = '<div class="empty-clan">' +
      '<div class="ghost"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z"/><path d="M12 7.6l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="var(--white)" opacity=".95"/></svg></div>' +
      '<h1>Пока нет клана</h1>' +
      '<p>Собери друзей, копите сундук вместе и попадайте в топ.</p>' +
      '<a class="btn btn--primary btn--l" href="../clan-create/">Создать клан</a>' +
      back +
      '</div>';
    var st = document.createElement('style');
    st.textContent = '.empty-clan{display:flex;flex-direction:column;align-items:center;text-align:center;padding:72px 16px 24px}' +
      '.empty-clan .ghost{width:112px;height:112px;border-radius:32px;display:grid;place-items:center;margin-bottom:18px;color:var(--white);' +
      'background:linear-gradient(180deg,color-mix(in srgb,var(--violet) 82%,var(--white)),var(--violet));box-shadow:0 6px 14px color-mix(in srgb,var(--violet) 30%,transparent),0 3px 0 var(--violet-edge)}' +
      '.empty-clan .ghost svg{width:56px;height:56px}' +
      '.empty-clan h1{margin:0;font-size:26px;font-weight:1000;letter-spacing:-.4px}' +
      '.empty-clan p{margin:8px 8px 28px;font-size:15px;font-weight:800;color:var(--ink-2);line-height:1.35;max-width:280px}' +
      '.empty-clan .btn{max-width:280px}' +
      '.empty-clan .back-my{margin-top:16px;font-size:14px;font-weight:800;color:var(--ink-2)}';
    document.head.appendChild(st);
  }

  function enhanceDemo() {
    var mine = window.ClanCreate && ClanCreate.load();
    if (!mine) return;
    var more = document.getElementById('more');
    if (!more) return;
    more.addEventListener('click', function () {
      setTimeout(function () {
        var sheet = document.querySelector('.sheet');
        if (!sheet || sheet.querySelector('#to-mine')) return;
        var row = document.createElement('div');
        row.className = 'srow';
        row.id = 'to-mine';
        row.textContent = 'Мой клан «' + mine.name + '»';
        var leave = sheet.querySelector('#leave');
        if (leave) leave.parentNode.insertBefore(row, leave);
        else sheet.appendChild(row);
        row.addEventListener('click', function () { location.href = '?mine=1'; });
      }, 0);
    });
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
