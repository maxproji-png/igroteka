/* Приглашение друга через MAX: shareMaxContent / :share, иначе navigator.share, иначе шторка с копированием ссылки.
   Награда +2500 пригласившему и +2500 новичку, когда друг впервые открывает игру по ссылке — без лимита, без защиты от фарма. */
(function (w) {
  var BOT = 'se13358463_bot';
  var REF = '101';
  var REWARD = 2500;
  var KEY = 'tapyshi.invite.joined';

  var GAME_LINE = {
    'tictactoe': 'Зову тебя сыграть в Крестики-нолики в Тапышах! Блиц 15 секунд — кто быстрее? 🐾',
    'four-in-a-row': 'Зову тебя сыграть в 4 в ряд в Тапышах! Собери линию и взорви бомбой 🐾',
    'battleship': 'Зову тебя сыграть в «Найди корабль» в Тапышах! Морской бой с сонаром — найдёшь мой флот? 🐾',
    'checkers': 'Зову тебя сыграть в Шашки в Тапышах! Русские шашки и «Верни шашку» 🐾',
    'goroda': 'Зову тебя сыграть в Города в Тапышах! Слова на время — от последней буквы 🐾'
  };

  function wa() { try { return w.WebApp || null; } catch (e) { return null; } }
  function inMax() {
    var W = wa();
    try { return !!(W && (W.initData || (W.initDataUnsafe && W.initDataUnsafe.user))); } catch (e) { return false; }
  }
  function startapp(opts) {
    opts = opts || {};
    var parts = [];
    if (opts.game) parts.push('game_' + opts.game);
    if (opts.clan && opts.clan.id) parts.push('clan_' + opts.clan.id);
    parts.push('ref_' + (opts.ref || REF));
    return parts.join('_');
  }
  function link(opts) {
    return 'https://max.ru/' + BOT + '?startapp=' + startapp(opts);
  }
  function text(opts) {
    opts = opts || {};
    if (opts.game && GAME_LINE[opts.game]) return GAME_LINE[opts.game];
    if (opts.clan && opts.clan.name) return 'Го в мой клан «' + opts.clan.name + '» в Тапышах! Растим питомцев и рубимся в мини-игры 🐾';
    return 'Давай играть в Тапыши! Растим питомцев и рубимся в мини-игры 🐾';
  }
  function payload(opts) {
    var t = text(opts), l = link(opts);
    return { text: t, link: l, full: t + '\n' + l };
  }

  function toast(msg) {
    var t = document.getElementById('tap-invite-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tap-invite-toast';
      t.className = 'inv-toast';
      document.body.appendChild(t);
    }
    t.innerHTML = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 2400);
    if (w.T && T.toast && t.id !== 'tap-invite-toast') { /* keep own toast so it looks the same on games + clan */ }
  }

  function copy(s) {
    if (w.navigator.clipboard && w.isSecureContext) {
      return w.navigator.clipboard.writeText(s).catch(function () { fallbackCopy(s); });
    }
    fallbackCopy(s);
    return Promise.resolve();
  }
  function fallbackCopy(s) {
    var ta = document.createElement('textarea');
    ta.value = s; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function injectCss() {
    if (document.getElementById('tap-invite-css')) return;
    var st = document.createElement('style');
    st.id = 'tap-invite-css';
    st.textContent =
      '.inv-scrim{position:fixed;inset:0;z-index:200;background:var(--scrim,rgb(58 51 88 / .42));animation:invIn .2s ease}' +
      '.inv-sheet{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:201;width:100%;max-width:430px;' +
      'background:var(--white);border-radius:28px 28px 0 0;padding:10px 18px calc(18px + env(safe-area-inset-bottom,0px));' +
      'box-shadow:0 -10px 40px rgb(var(--shade,80 62 160) / .18);animation:invUp .38s var(--spring,cubic-bezier(.34,1.56,.64,1))}' +
      '.inv-sheet .grab{display:block;width:40px;height:5px;border-radius:3px;background:var(--fill);margin:2px auto 12px}' +
      '.inv-sheet h3{margin:0 0 6px;font-size:22px;font-weight:1000;letter-spacing:-.3px}' +
      '.inv-sheet .ex{margin:0 0 14px;font-size:13.5px;font-weight:800;color:var(--ink-2);line-height:1.35}' +
      '.inv-sheet .ex b{color:var(--ink)}' +
      '.inv-preview{background:var(--bg,var(--fill));border-radius:20px;padding:12px 14px;margin:0 0 12px;font-size:14.5px;font-weight:800;line-height:1.35;color:var(--ink)}' +
      '.inv-preview .lnk{display:block;margin-top:8px;font-size:12.5px;font-weight:800;color:var(--violet);word-break:break-all}' +
      '.inv-sheet .row{display:flex;flex-direction:column;gap:8px}' +
      '.inv-x{position:absolute;right:14px;top:14px;width:36px;height:36px;border-radius:50%;border:0;padding:0;background:var(--fill);color:var(--ink-2);display:grid;place-items:center;cursor:pointer}' +
      '.inv-sheet h3{padding-right:44px}' +
      '.inv-link{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:10px 12px;border-radius:var(--r-md,20px);background:var(--white);box-shadow:var(--sh-sm),inset 0 0 0 2px var(--line)}' +
      '.inv-li{width:40px;height:40px;flex:none;border-radius:14px;display:grid;place-items:center;background:var(--blue-soft);color:var(--blue)}.inv-li svg{width:20px;height:20px}' +
      '.inv-lt{flex:1;min-width:0}.inv-lt small{display:block;font-size:12px;font-weight:800;color:var(--ink-2)}' +
      '.inv-lt b{display:block;margin-top:1px;font-size:14.5px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.inv-toast{position:fixed;left:50%;bottom:calc(var(--tabbar-space,72px) + 16px);transform:translateX(-50%) translateY(10px);z-index:210;' +
      'padding:10px 16px;border-radius:999px;background:var(--ink);color:var(--white);font-size:14px;font-weight:900;' +
      'box-shadow:var(--sh-md,0 8px 24px rgb(80 62 160 / .16));opacity:0;pointer-events:none;white-space:nowrap;max-width:calc(100% - 32px);' +
      'display:inline-flex;align-items:center;gap:6px;' +
      'overflow:hidden;text-overflow:ellipsis;transition:opacity .25s,transform .25s}' +
      '.inv-toast .coin{width:18px;height:18px;flex:none}' +
      '.inv-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}' +
      '.inv-demo{display:inline-flex;margin-top:8px;font-size:12px;font-weight:800;color:var(--ink-3);background:none;border:0;padding:0;cursor:pointer}' +
      '@keyframes invIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes invUp{from{transform:translateX(-50%) translateY(24px)}to{transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(st);
  }

  var sheetOnDone = null;
  function closeSheet() {
    var a = document.querySelector('.inv-scrim, .inv-sheet');
    document.querySelectorAll('.inv-scrim, .inv-sheet').forEach(function (n) { n.remove(); });
    if (!document.querySelector('body > .sheet.on')) document.body.classList.remove('is-sheet');
  }
  function shareMax(p) {
    var W = wa();
    try {
      if (W && W.shareMaxContent) return W.shareMaxContent({ text: p.text, link: p.link });
      if (W && W.shareContent) return W.shareContent({ text: p.text, link: p.link });
      if (W && W.openMaxLink) return W.openMaxLink('https://max.ru/:share?text=' + encodeURIComponent(p.full));
    } catch (e) {}
    copy(p.full); toast('Ссылка скопирована');
  }
  function showSheet(p, opts) {
    opts = opts || {};
    injectCss();
    /* qa-fix-14: приглашение в клан — игровая карточка клана в шторке клана (над таб-баром, высота фиксирована) */
    if (opts.clan && w.T && T.c3 && T.c3.inviteSheet && w.CX && CX.open) {
      T.c3.inviteSheet(p, { copy: copy, toast: toast, inMax: inMax, shareMax: function () { shareMax(p); } });
      return;
    }
    closeSheet();
    sheetOnDone = opts.onDone || null;
    var scrim = document.createElement('div');
    scrim.className = 'inv-scrim';
    var sh = document.createElement('div');
    sh.className = 'inv-sheet';
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-label', 'Позвать друга');
    sh.innerHTML =
      '<i class="grab"></i>' +
      '<button type="button" class="inv-x" data-inv="close" aria-label="Закрыть"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>' +
      '<h3>Позвать друга</h3>' +
      '<p class="ex">Награда <b>+' + REWARD.toLocaleString('ru-RU') + ' тебе</b> и <b>+' + REWARD.toLocaleString('ru-RU') + ' другу</b>, когда он <b>впервые откроет игру</b> по твоей ссылке. Лимита нет. За саму отправку монеты не даём.</p>' +
      '<div class="inv-link"><span class="inv-li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg></span>' +
      '<span class="inv-lt"><small>Ссылка-приглашение</small><b>' + esc(p.link.replace(/^https?:\/\//, '')) + '</b></span></div>' +
      '<div class="row">' +
      '<button type="button" class="btn btn--primary btn--l" data-inv="copy">Скопировать ссылку</button>' +
      '</div>';
    document.body.appendChild(scrim);
    document.body.appendChild(sh);
    document.body.classList.add('is-sheet');
    scrim.addEventListener('click', function () { var d = sheetOnDone; closeSheet(); if (d) d('close'); });
    sh.addEventListener('click', function (e) {
      var b = e.target.closest('[data-inv]');
      if (!b) return;
      var act = b.getAttribute('data-inv');
      if (act === 'copy') {
        copy(p.full);
        toast('Ссылка скопирована');
        var d = sheetOnDone; closeSheet(); if (d) d('copy');
      } else if (act === 'demo') {
        demoFriendJoined();
      } else if (act === 'close') {
        var d2 = sheetOnDone; closeSheet(); if (d2) d2('close');
      }
    });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function demoFriendJoined() {
    injectCss();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    if (w.TapyshiBal) w.TapyshiBal.add(REWARD);
    toast('Друг зашёл — +' + REWARD.toLocaleString('ru-RU') + ' ' + (window.TAP_COIN || (w.T && T.coin && T.coin()) || ''));
  }

  function share(opts) {
    opts = opts || {};
    var p = payload(opts);
    var W = wa();
    var done = opts.onDone || function () {};
    injectCss();
    if (/demoSheet=1/.test(location.search)) { showSheet(p, opts); return; }
    try {
      if (inMax() && W.shareMaxContent) {
        return W.shareMaxContent({ text: p.text, link: p.link }).then(function (r) {
          if (r && r.status === 'shared') done('shared');
        }).catch(function () { showSheet(p, opts); });
      }
      if (inMax() && W.shareContent) {
        return W.shareContent({ text: p.text, link: p.link }).then(function (r) {
          if (r && r.status === 'shared') done('shared');
        }).catch(function () { showSheet(p, opts); });
      }
      if (inMax() && W.openMaxLink) {
        W.openMaxLink('https://max.ru/:share?text=' + encodeURIComponent(p.full));
        done('shared');
        return;
      }
    } catch (e) {}
    if (w.navigator.share) {
      return w.navigator.share({ title: 'Тапыши', text: p.text, url: p.link }).then(function () {
        done('shared');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        showSheet(p, opts);
      });
    }
    showSheet(p, opts);
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-invite-demo]');
    if (d) { e.preventDefault(); demoFriendJoined(); }
  });

  w.TapInvite = {
    BOT: BOT, REF: REF, REWARD: REWARD, GAME_LINE: GAME_LINE,
    link: link, text: text, payload: payload, startapp: startapp,
    share: share, showSheet: showSheet, shareMax: shareMax, toast: toast, demoFriendJoined: demoFriendJoined, copy: copy, inMax: inMax
  };
})(window);
