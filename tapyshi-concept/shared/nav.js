/* Единое нижнее меню: Питомец · Игры · Клан · Магазин.
   На странице: <html data-root="./" data-tab="pet"> — data-root ведёт к корню концепта.

   Переключение вкладок без полной перезагрузки: хост оставляет уже открытые
   экраны в памяти (3D на главной не поднимается заново), сразу отмечает
   активную вкладку и плавно проявляет новый экран (~200 мс). В iframe
   таббар не дублируется — его рисует только верхнее окно. */
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

  if (framed()) {
    document.documentElement.classList.add('is-tab-frame');
    document.addEventListener('click', boing);
    try {
      window.parent.postMessage({
        type: 'tapyshi-tab',
        ev: 'ready',
        tab: document.documentElement.getAttribute('data-tab') || '',
        url: location.href
      }, location.origin);
    } catch (e) {}
    return;
  }

  var root = document.documentElement.getAttribute('data-root') || './';
  if (root && root.slice(-1) !== '/') root += '/';
  var active = document.documentElement.getAttribute('data-tab') || 'pet';

  function abs(path) {
    var a = document.createElement('a');
    a.href = path;
    return a.href;
  }

  function tabUrl(id) {
    var i, t;
    for (i = 0; i < TABS.length; i++) if (TABS[i][0] === id) { t = TABS[i]; break; }
    return t ? abs(root + t[2]) : abs(root);
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
    'html.is-tab-host .tab-host-layers{position:fixed;inset:0;z-index:2;pointer-events:none;background:transparent}' +
    'html.is-tab-host .tab-pane{position:absolute;inset:0;opacity:0;pointer-events:none;' +
      'transition:opacity .2s ease;background:#F8F7FF}' +
    'html.is-tab-host .tab-pane.is-on{opacity:1;pointer-events:auto}' +
    'html.is-tab-host .tab-frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#F8F7FF}' +
    'html.is-tab-host .tabbar{z-index:50}' +
    'html.is-tab-host body>*{transition:opacity .2s ease}' +
    'html.is-tab-away body>:not(.tabbar):not(.tab-host-layers){opacity:0!important;pointer-events:none!important}' +
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
  }

  function hookSheet(iframe) {
    function sync() {
      var doc, hide = false;
      try {
        doc = iframe.contentDocument;
        if (doc && doc.body) {
          hide = /\b(has-sheet|is-sheet|no-tabs)\b/.test(doc.body.className || '');
        }
      } catch (e) {}
      document.body.classList.toggle('has-sheet', hide);
      document.body.classList.toggle('is-sheet', hide);
    }
    iframe.addEventListener('load', function () {
      sync();
      try {
        var doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        var mo = new MutationObserver(sync);
        mo.observe(doc.body, { attributes: true, attributeFilter: ['class'] });
        observers.push(mo);
        doc.addEventListener('click', boing);
      } catch (e) {}
    });
  }

  function ensure(id, href) {
    if (panes[id]) return panes[id];
    var pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.dataset.tab = id;
    pane.setAttribute('aria-hidden', 'true');
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

  function show(id) {
    var k, on, native = (id === active);
    document.documentElement.classList.toggle('is-tab-away', !native);
    for (k in panes) {
      if (!Object.prototype.hasOwnProperty.call(panes, k)) continue;
      on = !native && k === id;
      panes[k].el.classList.toggle('is-on', on);
      panes[k].el.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (native) {
      document.body.classList.remove('has-sheet', 'is-sheet');
      try { window.dispatchEvent(new Event('resize')); } catch (e) {}
    } else {
      wake(id);
    }
  }

  function go(id, href, hist) {
    if (!id) return;
    setOn(id);
    if (id !== active) ensure(id, href || tabUrl(id));
    show(id);
    var url = href || (id === active ? location.href : tabUrl(id));
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
        samePage(a.href, id === active ? location.href : tabUrl(id))) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    go(id, tabUrl(id), 'push');
  }

  nav.addEventListener('click', onTabClick);
  nav.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('a.tab');
    if (!a || !nav.contains(a)) return;
    var id = a.getAttribute('data-tab');
    if (id && id !== active) ensure(id, tabUrl(id));
  }, { passive: true });

  window.addEventListener('popstate', function (e) {
    var id = (e.state && e.state.tapyshiTab) || tabOf(location.href);
    go(id, location.href, 'none');
  });

  try { history.replaceState({ tapyshiTab: current }, '', location.href); } catch (e) {}

  function prefetch() {
    TABS.forEach(function (t) {
      if (t[0] === active) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = tabUrl(t[0]);
      link.as = 'document';
      document.head.appendChild(link);
    });
    var warm = function () {
      TABS.forEach(function (t, i) {
        if (t[0] === active) return;
        setTimeout(function () { ensure(t[0], tabUrl(t[0])); }, 500 + i * 400);
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2500 });
    else setTimeout(warm, 900);
  }
  if (document.readyState === 'complete') setTimeout(prefetch, 200);
  else window.addEventListener('load', function () { setTimeout(prefetch, 200); });

  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'tapyshi-tab') return;
    if (e.data.ev === 'sheet') {
      document.body.classList.toggle('has-sheet', !!e.data.on);
      document.body.classList.toggle('is-sheet', !!e.data.on);
    }
  });

  document.addEventListener('click', boing);
})();
