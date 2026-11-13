/* Общий мост макета v4: 3D-питомцы (спрайты + live three.js на героях). */
(function (w) {
  'use strict';
  var ME = { pet: 'raccoon', name: 'Булочка', stage: 1 };
  var SPECIES = { raccoon: 'Енот', goose: 'Гусь', capybara: 'Капибара', dragon: 'Дракон' };
  var FOE_BY_GAME = {
    tictactoe: 'goose',
    'four-in-a-row': 'dragon',
    battleship: 'goose',
    checkers: 'goose',
    goroda: 'goose'
  };

  function gameId() {
    try {
      var path = w.location.pathname || '';
      var m = path.match(/\/games\/([^/]+)/);
      if (m) return m[1].replace(/\.html$/, '');
      var f = path.split('/').pop() || '';
      return f.replace(/\.html$/, '');
    } catch (e) { return ''; }
  }

  function foeOf(kind) {
    var me = kind || ME.pet;
    var f = FOE_BY_GAME[gameId()];
    if (f && f !== me) return f;
    var order = ['goose', 'dragon', 'capybara'];
    for (var i = 0; i < order.length; i++) if (order[i] !== me) return order[i];
    return 'goose';
  }

  function nameOf(kind, isPlayer) {
    if (isPlayer === true || (isPlayer !== false && kind === ME.pet)) return ME.name;
    return SPECIES[kind] || kind;
  }

  function dirFromScript(src) {
    return String(src || '').replace(/\/[^/]+(?:\?.*)?$/, '/');
  }
  var BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) return dirFromScript(s.src);
    var nodes = document.querySelectorAll('script[src*="pets-bridge"]');
    if (nodes.length) return dirFromScript(nodes[0].src);
    if (/\/games(\/|$)/.test((w.location.pathname || ''))) return new URL('../../pets/', w.location.href).href;
    return new URL('pets/', w.location.href).href;
  })();
  if (BASE && !/\/$/.test(BASE)) BASE += '/';
  w.__TAPYSHI_BASE = BASE;

  function assetBase() { return w.__TAPYSHI_BASE || BASE; }

  function isHappy(o) {
    o = o || {};
    if (o.mood === 'happy' || o.happy) return true;
    if (o.pose === 'happy') return true;
    var cls = o.cls || '';
    return cls.indexOf('happy') >= 0;
  }

  function spriteUrl(kind, mood) {
    var m = mood === 'happy' ? 'happy' : 'neutral';
    return assetBase() + 'sprites/' + (kind || ME.pet) + '_' + m + '.webp';
  }

  function petSvg(kind, o) {
    o = o || {};
    if (typeof o === 'string') o = { mood: o };
    kind = kind || ME.pet;
    if (!SPECIES[kind]) kind = ME.pet;
    var happy = isHappy(o);
    var mood = happy ? 'happy' : 'neutral';
    var cls = ['pet', 'pet-sprite', o.cls || '', happy ? 'happy' : '', o.mood === 'sad' ? 'sad' : '']
      .join(' ').replace(/\s+/g, ' ').trim();
    var src = spriteUrl(kind, mood);
    var png = src.replace(/\.webp$/, '.png');
    var alt = nameOf(kind, kind === ME.pet);
    return '<img class="' + cls + '" data-pet="' + kind + '" data-mood="' + mood + '" src="' + src +
      '" alt="' + alt + '" draggable="false" onerror="this.onerror=null;this.src=\'' + png + '\'">';
  }

  function petHero(kind, o) {
    o = o || {};
    kind = kind || ME.pet;
    if (!SPECIES[kind]) kind = ME.pet;
    var pose = isHappy(o) ? 'happy' : (o.pose || 'neutral');
    var cls = ['pet', 'pet-hero', o.cls || ''].join(' ').replace(/\s+/g, ' ').trim();
    var attrs = ' class="' + cls + '" data-live-pet="' + kind + '" data-pose="' + pose + '"';
    if (o.idle === false) attrs += ' data-idle="0"';
    if (o.tap) attrs += ' data-tap="1"';
    return '<div' + attrs + '>' + petSvg(kind, { mood: pose, cls: 'pet-fallback' }) + '</div>';
  }

  var viewerLoading = null;
  function loadViewer() {
    if (w.PetViewer && w.PetViewer.mount) return Promise.resolve(w.PetViewer);
    if (viewerLoading) return viewerLoading;
    viewerLoading = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = assetBase() + 'pet-viewer.js';
      s.async = true;
      s.onload = function () { res(w.PetViewer); };
      s.onerror = function () { viewerLoading = null; rej(new Error('pet-viewer load')); };
      (document.head || document.documentElement).appendChild(s);
    });
    return viewerLoading;
  }

  function mountLive(el, opts) {
    if (!el) return Promise.resolve(null);
    return loadViewer().then(function (PV) { return PV.mount(el, opts || {}); });
  }

  function hydrateHeroes(root) {
    var scope = root || document;
    var found = (scope.querySelectorAll && scope.querySelectorAll('[data-live-pet]')) || [];
    if (!found.length && !(scope.hasAttribute && scope.hasAttribute('data-live-pet'))) return;
    loadViewer().then(function (PV) { PV.hydrate(scope); }).catch(function () {});
  }

  function preloadLive(kind) {
    return loadViewer().then(function (PV) { return PV.preload(kind); }).catch(function () {});
  }

  function syncSpriteMood(el) {
    if (!el || !el.classList) return;
    var img = (el.tagName === 'IMG' && el.classList.contains('pet-sprite')) ? el
      : (el.querySelector && el.querySelector('img.pet-sprite'));
    if (!img) return;
    var happy = el.classList.contains('happy') || img.classList.contains('happy');
    var kind = img.getAttribute('data-pet') || ME.pet;
    var want = happy ? 'happy' : 'neutral';
    if (img.getAttribute('data-mood') !== want) {
      img.setAttribute('data-mood', want);
      img.src = spriteUrl(kind, want);
    }
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'attributes' && m.attributeName === 'class') syncSpriteMood(m.target);
      if (m.type === 'childList') {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.hasAttribute && n.hasAttribute('data-live-pet')) hydrateHeroes(n);
          else if (n.querySelector && n.querySelector('[data-live-pet]')) hydrateHeroes(n);
        }
      }
    }
  });

  function startObservers() {
    if (!document.documentElement) return;
    mo.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class'],
      childList: true
    });
    hydrateHeroes(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObservers);
  else startObservers();

  function hubBack() {
    try { if (w.parent && w.parent !== w) w.parent.postMessage({ hub: 'back' }, '*'); } catch (e) {}
  }

  var BACK_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function hubBackButton(label) {
    return '<button type="button" class="hub-back" data-hub-back aria-label="Все игры">' +
      BACK_ICON + (label || 'Все игры') + '</button>';
  }

  var css = '.hub-back,[data-hub-back]{display:inline-flex;align-items:center;gap:6px;flex:none;' +
    'height:38px;padding:0 14px 0 8px;border:0;border-radius:14px;background:#fff;color:#2A2D4B;cursor:pointer;' +
    'box-shadow:0 3px 10px -4px rgba(60,50,140,.35),inset 0 0 0 1.5px #E8EAF5;' +
    'font:900 14px Nunito,ui-rounded,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}' +
    '.hub-back:active,[data-hub-back]:active{transform:scale(.93)}' +
    '.hub-back svg{width:18px;height:18px;display:block;flex:none}' +
    'img.pet,img.pet-sprite,svg.pet{width:100%;height:100%;display:block;max-width:100%;max-height:100%;' +
    'object-fit:contain;object-position:center bottom;pointer-events:none;-webkit-user-drag:none;' +
    'filter:drop-shadow(0 2px 3px rgba(40,30,90,.16))}' +
    '.pet-hero{position:relative;width:100%;height:100%;display:block;min-width:0;min-height:0}' +
    '.pet-hero .pet-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .28s ease;pointer-events:none}' +
    '.pet-hero img.pet-fallback,.pet-hero img.pet-sprite{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;transition:opacity .28s ease}' +
    '.pet-hero.is-live img.pet-fallback,.pet-hero.is-live img.pet-sprite{opacity:0}' +
    '.ava,.who .av,.pcard .pet,.msg .ava,.row .ava,.p1 .ava,.p2 .ava,.bot .ava{background:transparent!important}' +
    '.ava img.pet,.who .av img.pet,.pcard img.pet{width:100%;height:100%}';

  function injectCss() {
    if (document.getElementById('pets-bridge-css')) return;
    var st = document.createElement('style');
    st.id = 'pets-bridge-css';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  if (document.head) injectCss();
  else document.addEventListener('DOMContentLoaded', injectCss);

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-hub-back]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    hubBack();
  }, true);

  function boot() {
    var q = {};
    try {
      var s = new URLSearchParams(w.location.search || '');
      s.forEach(function (v, k) { q[k] = v; });
    } catch (e) {}
    return {
      start: q.start === '1' || q.go === '1',
      mode: q.mode || 'bot',
      rival: q.rival || '',
      foe: q.foe || '',
      hint: q.hint === '1'
    };
  }

  function showHint(opts) {
    opts = opts || {};
    var key = 'tapyshi.hint.' + gameId();
    var force = boot().hint;
    try { if (!force && w.localStorage.getItem(key)) return false; } catch (e) {}
    if (document.getElementById('firstHint')) return true;
    var wrap = document.createElement('div');
    wrap.id = 'firstHint';
    wrap.className = 'first-hint';
    wrap.setAttribute('role', 'dialog');
    wrap.innerHTML = '<div class="fh-card">' +
      (opts.pet ? '<div class="fh-pet">' + petSvg(opts.pet || ME.pet, { cls: 'happy', grow: 0 }) + '</div>' : '') +
      '<b>' + (opts.title || 'Как играть') + '</b>' +
      '<p>' + (opts.text || '') + '</p>' +
      '<span>Нажми, чтобы начать</span></div>';
    (document.body || document.documentElement).appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('on'); });
    function dismiss(ev) {
      if (ev) ev.preventDefault();
      wrap.classList.remove('on');
      try { w.localStorage.setItem(key, '1'); } catch (e) {}
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 280);
    }
    wrap.addEventListener('click', dismiss);
    wrap.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') dismiss(e); }, { once: true });
    return true;
  }

  var hintCss = '.first-hint{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;' +
    'background:rgba(42,45,75,.38);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .28s}' +
    '.first-hint.on{opacity:1}' +
    '.fh-card{width:min(100%,320px);background:#fff;border-radius:28px;padding:22px 22px 18px;text-align:center;' +
    'box-shadow:0 18px 40px -12px rgba(20,8,70,.4);color:#2A2D4B;font-family:Nunito,ui-rounded,system-ui,sans-serif}' +
    '.fh-pet{width:88px;height:92px;margin:0 auto 8px;filter:drop-shadow(0 6px 8px rgba(40,30,90,.14))}' +
    '.fh-card b{display:block;font-size:22px;font-weight:900;letter-spacing:-.3px}' +
    '.fh-card p{margin:8px 0 14px;font-size:15px;font-weight:700;color:#6A6F95;line-height:1.35}' +
    '.fh-card span{display:inline-block;font-size:13px;font-weight:800;color:#7C5CFF}';
  function injectHintCss() {
    if (document.getElementById('first-hint-css')) return;
    var st = document.createElement('style'); st.id = 'first-hint-css'; st.textContent = hintCss;
    (document.head || document.documentElement).appendChild(st);
  }
  if (document.head) injectHintCss();
  else document.addEventListener('DOMContentLoaded', injectHintCss);

  w.TAPYSHI = {
    ME: ME,
    SPECIES: SPECIES,
    playerPet: ME.pet,
    playerName: ME.name,
    playerStage: ME.stage,
    get foe() { return foeOf(ME.pet); },
    foeOf: foeOf,
    nameOf: nameOf,
    petSvg: petSvg,
    petHero: petHero,
    mountLive: mountLive,
    hydrateHeroes: hydrateHeroes,
    preloadLive: preloadLive,
    spriteUrl: spriteUrl,
    hubBack: hubBack,
    hubBackButton: hubBackButton,
    gameId: gameId,
    boot: boot,
    showHint: showHint
  };
})(window);
