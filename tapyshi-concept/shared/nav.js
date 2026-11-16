/* Единое нижнее меню: Питомец · Игры · Клан · Магазин.
   На странице: <html data-root="./" data-tab="pet"> — data-root ведёт к корню концепта.

   Переключение вкладок без полной перезагрузки: хост оставляет уже открытые
   экраны в памяти (3D на главной не поднимается заново), сразу отмечает
   активную вкладку и проявляет новый экран (~200 мс) на фоне #F8F7FF.
   Старый экран уходит сразу — без наложения двух UI. В iframe таббар
   не дублируется — его рисует только верхнее окно. */
(function () {
  var I = {
    pet: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5.4" ry="4.4" fill="currentColor"/><circle cx="5.6" cy="10.4" r="2.3" fill="currentColor"/><circle cx="9.3" cy="6.2" r="2.4" fill="currentColor"/><circle cx="14.7" cy="6.2" r="2.4" fill="currentColor"/><circle cx="18.4" cy="10.4" r="2.3" fill="currentColor"/></svg>',
    games: '<svg viewBox="0 0 24 24"><path d="M7.5 6.5h9a5 5 0 0 1 4.9 4.1l.9 5.1a2.9 2.9 0 0 1-5 2.4L15.6 16H8.4l-1.7 2.1a2.9 2.9 0 0 1-5-2.4l.9-5.1A5 5 0 0 1 7.5 6.5z" fill="currentColor"/><path class="cut-s" d="M7.6 9.6v3.6M5.8 11.4h3.6" stroke-width="1.9" stroke-linecap="round"/><circle class="cut" cx="15.6" cy="10.4" r="1.2"/><circle class="cut" cx="17.6" cy="12.6" r="1.2"/></svg>',
    clan: '<svg viewBox="0 0 24 24"><path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z" fill="currentColor"/><path class="cut" d="M12 7.6l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" opacity=".9"/></svg>',
    shop: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 11.2A2 2 0 0 1 16 21H8a2 2 0 0 1-2-1.8z" fill="currentColor"/><path d="M8.8 10V7a3.2 3.2 0 0 1 6.4 0v3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
  };
  var TABS = [
    ['pet', 'Питомец', 'index.html'],
    ['games', 'Игры', 'games/'],
    ['clan', 'Клан', 'clan/'],
    ['shop', 'Магазин', 'shop/']
  ];
  var TITLES = {
    pet: 'Тапыши · Питомец',
    games: 'Тапыши · Игры',
    clan: 'Тапыши · Мой клан',
    shop: 'Тапыши · Магазин'
  };

  function framed() {
    try {
      return window.self !== window.top && window.top.location.origin === location.origin;
    } catch (e) {
      return true;
    }
  }

  function boing(e) {
    var b = e.target.closest('.spring,.play,.card,.btn');
    if (!b) return;
    b.classList.remove('boing');
    void b.offsetWidth;
    b.classList.add('boing');
  }

  function sheetOpenIn(doc) {
    if (!doc || !doc.body) return false;
    if (/\b(has-sheet|is-sheet)\b/.test(doc.body.className || '')) return true;
    try {
      var nodes = doc.querySelectorAll('.sk-sheet.on, .sk-scrim.on, body > .sheet.on, body > .sheet-bg.on, .home-sheet.on, .home-sheet-bg.on, [role="dialog"].on');
      return nodes.length > 0;
    } catch (e) { return false; }
  }

  function closeDocSheet(doc) {
    if (!doc) return;
    var win = doc.defaultView;
    try {
      if (win && win.SK && typeof win.SK.close === 'function' && doc.querySelector('.sk-sheet.on, .sk-scrim.on')) {
        win.SK.close();
      }
    } catch (e) {}
    try {
      if (win && win.T && typeof win.T.closeSheet === 'function' && doc.querySelector('body > .sheet.on, body > .sheet-bg.on')) {
        win.T.closeSheet();
      }
    } catch (e) {}
    try {
      if (win && typeof win.go === 'function' && win.S && (win.S.screen === 'sheet' || (win.S.screen === 'friends' && win.S.pick))) {
        if (win.S.screen === 'friends' && win.S.pick) win.go({ screen: 'friends', pick: false });
        else if (win.S.fromFriends) win.go({ screen: 'friends', pick: false });
        else win.go({ screen: 'catalog', pick: false });
      }
    } catch (e) {}
    try {
      var btn = doc.querySelector('[data-act="close"], [data-sheet-close], .sk-x[data-close], .home-x[data-close], .home-sheet [data-close]');
      if (btn) btn.click();
    } catch (e) {}
    try {
      var list = doc.querySelectorAll('.sk-sheet.on, .sk-scrim.on, body > .sheet.on, body > .sheet-bg.on, .home-sheet.on, .home-sheet-bg.on');
      Array.prototype.forEach.call(list, function (n) { n.classList.remove('on'); });
      doc.body.classList.remove('has-sheet', 'is-sheet');
    } catch (e) {}
  }

  if (framed()) {
    document.documentElement.classList.add('is-tab-frame');
    document.addEventListener('click', boing);
    try {
      window.parent.postMessage({
        type: 'tapyshi-tab',
        ev: 'ready',
        tab: document.documentElement.getAttribute('data-tab') || '',
        url: location.href,
        title: document.title || ''
      }, location.origin);
    } catch (e) {}
    /* Сообщаем хосту об открытии/закрытии шитов, в том числе .sk-sheet без has-sheet. */
    try {
      var lastSheet = false;
      function reportSheet() {
        var on = sheetOpenIn(document);
        if (on === lastSheet) return;
        lastSheet = on;
        window.parent.postMessage({ type: 'tapyshi-tab', ev: 'sheet', on: on }, location.origin);
      }
      var mo = new MutationObserver(reportSheet);
      if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
      else document.addEventListener('DOMContentLoaded', function () {
        mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
        reportSheet();
      });
      reportSheet();
    } catch (e) {}
    return;
  }

  var root = document.documentElement.getAttribute('data-root') || './';
  if (root && root.slice(-1) !== '/') root += '/';
  var active = document.documentElement.getAttribute('data-tab') || 'pet';
  var startTitle = document.title || TITLES[active] || document.title;
  var startV = '';
  try { startV = new URL(location.href).searchParams.get('v') || ''; } catch (e) {}

  function abs(path) {
    var a = document.createElement('a');
    a.href = path;
    return a.href;
  }

  function tabUrl(id) {
    var i, t, url;
    for (i = 0; i < TABS.length; i++) if (TABS[i][0] === id) { t = TABS[i]; break; }
    url = new URL(t ? abs(root + t[2]) : abs(root));
    if (startV) url.searchParams.set('v', startV);
    return url.href;
  }

  function tabOf(href) {
    var path;
    try { path = new URL(href, location.href).pathname; } catch (e) { return 'pet'; }
    if (/\/games(\/|$)/.test(path) || /\/friends(\/|$)/.test(path)) return 'games';
    if (/\/shop(\/|$)/.test(path)) return 'shop';
    if (/\/clan-create(\/|$)/.test(path) || /\/clan(\/|$)/.test(path)) return 'clan';
    return 'pet';
  }

  var css = document.createElement('style');
  css.id = 'tab-host-css';
  css.textContent =
    'html.is-tab-host{background:#F8F7FF}' +
    'html.is-tab-away,html.is-tab-away body{height:100%;height:100dvh;overflow:hidden}' +
    'html.is-tab-host body>:not(.tabbar):not(.tab-host-layers){position:relative;z-index:1}' +
    'html.is-tab-host .tab-host-layers{position:fixed;inset:0;z-index:2;pointer-events:none;background:transparent}' +
    'html.is-cover-tabs .tab-host-layers,html.is-tab-away .tab-host-layers{' +
      'z-index:80;-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}' +
    'html.is-tab-host .tab-pane{position:absolute;inset:0;opacity:0;pointer-events:none;' +
      'background:#F8F7FF;z-index:0}' +
    'html.is-tab-host .tab-pane.is-on{opacity:1;pointer-events:auto;z-index:1}' +
    'html.is-tab-host .tab-pane.is-back{opacity:1;pointer-events:none;z-index:1;transition:none}' +
    'html.is-tab-host .tab-pane.is-front{z-index:4;pointer-events:auto;' +
      '-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}' +
    'html.is-tab-host .tab-pane.is-pre{opacity:.4;transition:none}' +
    'html.is-tab-host .tab-pane.is-front.is-on:not(.is-pre){opacity:1;transition:opacity .18s ease}' +
    '@media (prefers-reduced-motion:reduce){html.is-tab-host .tab-pane.is-front.is-on:not(.is-pre){transition:none}}' +
    'html.is-cover-tabs .hud,html.is-cover-tabs .tap-hint,html.is-cover-tabs .vtag,' +
    'html.is-cover-tabs .toast,html.is-cover-tabs .combo,html.is-cover-tabs .flash,' +
    'html.is-cover-tabs .plus-img,html.is-cover-tabs .fcoin,html.is-cover-tabs .evo-flash,' +
    'html.is-cover-tabs .demo{visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:none!important}' +
    'html.is-tab-host .tab-skel{position:absolute;inset:0;z-index:0;background:#F8F7FF;padding:22px 16px;pointer-events:none;box-sizing:border-box}' +
    'html.is-tab-host .tab-skel b{display:block;border-radius:16px;' +
      'background:linear-gradient(90deg,#EDE9F8 0%,#F6F3FC 45%,#EDE9F8 90%);background-size:200% 100%;' +
      'animation:tab-skel-sh 1.2s ease-in-out infinite}' +
    'html.is-tab-host .tab-skel .h{height:28px;width:46%;margin:4px 0 18px;border-radius:12px}' +
    'html.is-tab-host .tab-skel .chip{height:36px;width:58%;margin-bottom:16px;border-radius:20px}' +
    'html.is-tab-host .tab-skel .card{height:132px;margin-bottom:12px;border-radius:24px}' +
    'html.is-tab-host .tab-skel .card.s{height:88px}' +
    '@keyframes tab-skel-sh{to{background-position:-200% 0}}' +
    '@media (prefers-reduced-motion:reduce){html.is-tab-host .tab-skel b{animation:none}}' +
    'html.is-tab-host .tab-pane.is-ready .tab-skel{opacity:0;transition:opacity .15s ease}' +
    'html.is-tab-host .tab-frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:transparent;z-index:1;opacity:0}' +
    'html.is-tab-host .tab-pane.is-ready .tab-frame{opacity:1;background:#F8F7FF}' +
    'html.is-tab-host .tabbar{z-index:100}' +
    'html.is-tab-away body>:not(.tabbar):not(.tab-host-layers){opacity:0;pointer-events:none}' +
    'html.is-reveal-native .tab-host-layers{z-index:2;-webkit-transform:none;transform:none}' +
    'html.is-reveal-native body>:not(.tabbar):not(.tab-host-layers){' +
      'position:relative;z-index:3;opacity:.4;pointer-events:none;transition:none;' +
      '-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}' +
    'html.is-reveal-native-in body>:not(.tabbar):not(.tab-host-layers){' +
      'opacity:1;pointer-events:auto;transition:opacity .18s ease}' +
    '@media (prefers-reduced-motion:reduce){html.is-reveal-native-in body>:not(.tabbar):not(.tab-host-layers){transition:none}}' +
    'html.is-tab-frame .tabbar{display:none!important}';
  document.head.appendChild(css);
  document.documentElement.classList.add('is-tab-host');

  /* Документ остаётся тем, с которого открыли хост, а в адресной строке — URL вкладки.
     <base> фиксирует исходную директорию, чтобы относительные ресурсы главной не ходили в /games/... */
  if (!document.querySelector('base')) {
    var baseEl = document.createElement('base');
    baseEl.href = new URL('.', location.href).href;
    document.head.insertBefore(baseEl, document.head.firstChild);
  }

  var nav = document.createElement('nav');
  nav.className = 'tabbar';
  nav.setAttribute('aria-label', 'Разделы');
  nav.innerHTML = TABS.map(function (t) {
    var on = t[0] === active;
    return '<a class="tab spring' + (on ? ' on' : '') + '" data-tab="' + t[0] + '" href="' + tabUrl(t[0]) + '"' +
      (on ? ' aria-current="page"' : '') + '>' + I[t[0]] + '<span>' + t[1] + '</span></a>';
  }).join('');
  document.body.appendChild(nav);

  var layers = document.createElement('div');
  layers.className = 'tab-host-layers';
  document.body.insertBefore(layers, nav);

  var panes = {};
  var current = active;
  var observers = [];
  var sheetHist = false;
  var ignoringPop = false;

  function setTitle(id) {
    var t = TITLES[id] || startTitle;
    if (id === active) t = startTitle;
    try {
      if (id !== active && panes[id] && panes[id].iframe && panes[id].iframe.contentDocument && panes[id].iframe.contentDocument.title) {
        t = panes[id].iframe.contentDocument.title || t;
      }
    } catch (e) {}
    document.title = t;
  }

  function setOn(id) {
    current = id;
    document.documentElement.setAttribute('data-tab', id);
    var links = nav.querySelectorAll('a.tab');
    Array.prototype.forEach.call(links, function (a) {
      var on = a.getAttribute('data-tab') === id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    setTitle(id);
  }

  function syncHostSheet(open) {
    var hide = !!open;
    document.body.classList.toggle('has-sheet', hide);
    document.body.classList.toggle('is-sheet', hide);
    if (hide && !sheetHist) {
      sheetHist = true;
      try { history.pushState({ tapyshiTab: current, sheet: true }, '', location.href); } catch (e) {}
    } else if (!hide && sheetHist) {
      sheetHist = false;
      if (history.state && history.state.sheet) {
        ignoringPop = true;
        try { history.back(); } catch (e) { ignoringPop = false; }
        /* popstate снимет ignoringPop; если back не сработал — сбросим флаг */
        setTimeout(function () { ignoringPop = false; }, 50);
      }
    }
  }

  function sheetDocFor(id) {
    if (id === active) return document;
    var p = panes[id];
    try { return p && p.iframe && p.iframe.contentDocument; } catch (e) { return null; }
  }

  function hookSheet(iframe) {
    function sync() {
      if (current === (iframe.getAttribute('data-tab') || '')) syncHostSheet(sheetOpenIn(iframe.contentDocument));
    }
    iframe.addEventListener('load', function () {
      sync();
      markReady(iframe.getAttribute('data-tab'));
      try {
        var doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        var mo = new MutationObserver(sync);
        mo.observe(doc.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
        observers.push(mo);
        doc.addEventListener('click', boing);
        setTitle(current);
      } catch (e) {}
    });
  }

  function skelHtml() {
    return '<div class="tab-skel" aria-hidden="true"><b class="h"></b><b class="chip"></b><b class="card"></b><b class="card"></b><b class="card s"></b></div>';
  }

  var shownId = active;
  var pendingId = null;
  var revealGuard = 0;

  function panePainted(id) {
    if (id === active) return true;
    var p = panes[id];
    if (!p) return false;
    try {
      var doc = p.iframe.contentDocument;
      if (!doc || !doc.body) return false;
      var app = doc.getElementById('app');
      if (app) return app.childElementCount > 0;
      return doc.body.childElementCount > 0;
    } catch (e) { return false; }
  }

  function markReady(id) {
    var p = panes[id];
    if (!p) return;
    if (!panePainted(id)) return;
    p.el.classList.add('is-ready');
    if (typeof p._onPainted === 'function') {
      var fn = p._onPainted;
      p._onPainted = null;
      fn();
    }
  }

  function afterPainted(id, cb) {
    var called = false;
    function once() {
      if (called) return;
      called = true;
      cb();
    }
    if (id === active) {
      requestAnimationFrame(function () { requestAnimationFrame(once); });
      return;
    }
    var p = panes[id];
    if (!p) { once(); return; }
    function inFrame() {
      try {
        var w = p.iframe.contentWindow;
        if (w && typeof w.requestAnimationFrame === 'function') {
          w.requestAnimationFrame(function () { w.requestAnimationFrame(once); });
          return;
        }
      } catch (e) {}
      requestAnimationFrame(function () { requestAnimationFrame(once); });
    }
    if (panePainted(id)) { inFrame(); return; }
    p._onPainted = function () { p._onPainted = null; inFrame(); };
    p.iframe.addEventListener('load', function () {
      markReady(id);
      if (panePainted(id)) inFrame();
    }, { once: true });
    try {
      var doc = p.iframe.contentDocument;
      if (doc && doc.documentElement) {
        var mo = new MutationObserver(function () {
          if (panePainted(id)) { mo.disconnect(); inFrame(); }
        });
        mo.observe(doc.documentElement, { childList: true, subtree: true });
      }
    } catch (e) {}
  }

  function ensure(id, href) {
    if (panes[id]) return panes[id];
    var pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.dataset.tab = id;
    pane.setAttribute('aria-hidden', 'true');
    pane.innerHTML = skelHtml();
    var f = document.createElement('iframe');
    f.className = 'tab-frame';
    f.setAttribute('title', (TABS.filter(function (t) { return t[0] === id; })[0] || [id, id])[1]);
    f.setAttribute('data-tab', id);
    f.src = href || tabUrl(id);
    pane.appendChild(f);
    layers.appendChild(pane);
    hookSheet(f);
    panes[id] = { el: pane, iframe: f };
    return panes[id];
  }

  function wake(id) {
    var p = panes[id];
    if (!p || !p.iframe) return;
    try {
      var w = p.iframe.contentWindow;
      if (w) w.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }

  function reduceMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function onOpacityEnd(el, cb) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', onEnd);
      cb();
    }
    function onEnd(e) {
      if (e.propertyName && e.propertyName !== 'opacity') return;
      finish();
    }
    el.addEventListener('transitionend', onEnd);
    /* только страховка, если transitionend не пришёл; старт анимации ждёт rAF кадра, не этот таймер */
    setTimeout(finish, 400);
  }

  function finishReveal(id) {
    if (pendingId !== id) return;
    var native = (id === active), k, on;
    document.documentElement.classList.remove('is-reveal-native', 'is-reveal-native-in');
    document.documentElement.classList.toggle('is-cover-tabs', !native);
    document.documentElement.classList.toggle('is-tab-away', !native);
    for (k in panes) {
      if (!Object.prototype.hasOwnProperty.call(panes, k)) continue;
      on = !native && k === id;
      panes[k].el.classList.toggle('is-on', on);
      panes[k].el.classList.remove('is-back', 'is-front', 'is-pre');
      panes[k].el.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    shownId = id;
    pendingId = null;
    if (native) {
      document.body.classList.remove('has-sheet', 'is-sheet');
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    } else {
      wake(id);
      markReady(id);
      syncHostSheet(sheetOpenIn(sheetDocFor(id)));
    }
  }

  function startReveal(id) {
    if (pendingId !== id) return;
    var native = (id === active), k, incoming = null, html = document.documentElement;
    for (k in panes) {
      if (!Object.prototype.hasOwnProperty.call(panes, k)) continue;
      panes[k].el.classList.remove('is-front', 'is-pre');
      if (panes[k].el.classList.contains('is-on')) panes[k].el.classList.add('is-back');
    }
    if (native) {
      /* питомец выезжает поверх текущего iframe; тот остаётся видимым до конца анимации */
      html.classList.remove('is-cover-tabs', 'is-tab-away');
      html.classList.remove('is-reveal-native-in');
      html.classList.add('is-reveal-native');
      void html.offsetWidth;
      html.classList.add('is-reveal-native-in');
      if (reduceMotion()) { finishReveal(id); return; }
      onOpacityEnd(document.body, function () { finishReveal(id); });
      return;
    }
    incoming = panes[id] && panes[id].el;
    if (!incoming) { finishReveal(id); return; }
    /* новый экран выше HUD главной; оверлеи главной сразу прячем, сцена остаётся под fade */
    html.classList.add('is-cover-tabs');
    incoming.classList.remove('is-back');
    incoming.classList.add('is-front', 'is-pre', 'is-on');
    incoming.setAttribute('aria-hidden', 'false');
    void incoming.offsetWidth;
    incoming.classList.remove('is-pre');
    if (reduceMotion()) { finishReveal(id); return; }
    onOpacityEnd(incoming, function () { finishReveal(id); });
  }

  function show(id) {
    if (id !== active) ensure(id);
    markReady(id);
    if (id === shownId && pendingId == null) {
      if (id === active) {
        document.documentElement.classList.remove('is-tab-away', 'is-reveal-native', 'is-reveal-native-in', 'is-cover-tabs');
        try { window.dispatchEvent(new Event('resize')); } catch (e) {}
      } else {
        wake(id);
        syncHostSheet(sheetOpenIn(sheetDocFor(id)));
      }
      return;
    }
    var token = ++revealGuard;
    pendingId = id;
    afterPainted(id, function () {
      if (token !== revealGuard || pendingId !== id) return;
      startReveal(id);
    });
  }

  function go(id, href, hist) {
    if (!id) return;
    setOn(id);
    if (id !== active) ensure(id, href || tabUrl(id));
    show(id);
    var url = href || tabUrl(id);
    if (startV) {
      try {
        var u = new URL(url, location.href);
        if (!u.searchParams.get('v')) { u.searchParams.set('v', startV); url = u.href; }
      } catch (e) {}
    }
    if (hist === 'push') {
      try {
        if (url !== location.href) history.pushState({ tapyshiTab: id }, '', url);
        else history.replaceState({ tapyshiTab: id }, '', url);
      } catch (e) {}
    } else if (hist === 'replace') {
      try { history.replaceState({ tapyshiTab: id }, '', url); } catch (e) {}
    }
  }

  function samePage(a, b) {
    try {
      var ua = new URL(a, location.href), ub = new URL(b, location.href);
      return ua.pathname.replace(/\/index\.html$/, '/') === ub.pathname.replace(/\/index\.html$/, '/') &&
        ua.search === ub.search && ua.hash === ub.hash;
    } catch (e) { return a === b; }
  }

  function onTabClick(e) {
    var a = e.target.closest('a.tab');
    if (!a || !nav.contains(a)) return;
    var id = a.getAttribute('data-tab');
    if (!id) return;
    if (id === current && (id === active || (panes[id] && panes[id].el.classList.contains('is-on'))) &&
        samePage(tabUrl(id), id === active ? location.href : tabUrl(id))) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    /* если открыт шит — закрыть его без отдельной записи истории, затем сменить вкладку */
    if (sheetHist || sheetOpenIn(sheetDocFor(current))) {
      closeDocSheet(sheetDocFor(current));
      sheetHist = false;
      if (history.state && history.state.sheet) {
        try { history.replaceState({ tapyshiTab: current }, '', location.href); } catch (err) {}
      }
    }
    go(id, tabUrl(id), 'push');
  }

  nav.addEventListener('click', onTabClick);
  nav.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('a.tab');
    if (!a || !nav.contains(a)) return;
    var id = a.getAttribute('data-tab');
    /* до ready главной грузим только ту вкладку, которую нажали, остальные не трогаем */
    if (id && id !== active) ensure(id, tabUrl(id));
  }, { passive: true });

  window.addEventListener('popstate', function (e) {
    if (ignoringPop) { ignoringPop = false; return; }
    var st = e.state || {};
    /* Back с открытого шита: закрыть шит, остаться на вкладке */
    if (sheetHist && !st.sheet) {
      sheetHist = false;
      closeDocSheet(sheetDocFor(current));
      document.body.classList.remove('has-sheet', 'is-sheet');
      return;
    }
    if (st.sheet) sheetHist = true;
    else sheetHist = false;
    var id = st.tapyshiTab || tabOf(location.href);
    go(id, location.href, 'none');
  });

  try { history.replaceState({ tapyshiTab: current }, '', location.href); } catch (e) {}

  /* Хост сам тоже может открыть шит (задания/награда на главной). */
  try {
    var hostMo = new MutationObserver(function () {
      if (current === active) syncHostSheet(sheetOpenIn(document));
    });
    if (document.body) hostMo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {}

  var prefetchStarted = false;
  function startPrefetch() {
    if (prefetchStarted) return;
    prefetchStarted = true;
    var warm = function () {
      TABS.forEach(function (t, i) {
        /* не поднимаем скрытый iframe питомца — в нём 3D / второй WebGL */
        if (t[0] === active || t[0] === 'pet') return;
        setTimeout(function () { ensure(t[0], tabUrl(t[0])); }, 400 + i * 450);
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 1200);
  }

  function whenPetReady(fn) {
    if (active !== 'pet') { fn(); return; }
    if (document.documentElement.getAttribute('data-pet') === 'ready') { fn(); return; }
    var mo = new MutationObserver(function () {
      if (document.documentElement.getAttribute('data-pet') === 'ready') {
        mo.disconnect();
        fn();
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pet'] });
  }

  /* Прогрев соседних вкладок — только после ready главной и в idle.
     До этого prefetch не занимает канал у three.js / GLB. */
  whenPetReady(startPrefetch);

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'tapyshi-tab') return;
    if (e.data.ev === 'sheet') {
      var from = '';
      try {
        for (var k in panes) {
          if (panes[k].iframe && panes[k].iframe.contentWindow === e.source) from = k;
        }
      } catch (err) {}
      if (from && from === current) syncHostSheet(!!e.data.on);
    }
    if (e.data.ev === 'ready') {
      var id = e.data.tab;
      if (id && panes[id]) {
        panes[id].iframe.setAttribute('data-ready', '1');
        markReady(id);
        if (current === id) setTitle(id);
      }
    }
  });

  document.addEventListener('click', boing);
})();
