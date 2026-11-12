/* Общий мост макета: питомец игрока = енот Булочка с главной, рисуется ART.pet. */
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
      var f = (w.location.pathname || '').split('/').pop() || '';
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

  function petSvg(kind, o) {
    o = o || {};
    if (typeof o === 'string') o = { mood: o };
    var A = w.ART;
    if (!A || !A.pet) return '';
    var mood = o.mood || '';
    var cls = [o.cls || '', (mood === 'happy' || o.happy) ? 'happy' : '', mood === 'sad' ? 'sad' : '']
      .join(' ').replace(/\s+/g, ' ').trim();
    var grow = o.grow != null ? o.grow : (kind === ME.pet ? ME.stage : 0);
    var vb = o.vb;
    if (!vb) {
      if (o.face) vb = '24 8 152 160';
      else vb = grow > 0 ? '0 -24 200 230' : '0 -8 200 214';
    }
    return A.pet(kind, { hat: o.hat, skin: o.skin, grow: grow, cls: cls, vb: vb });
  }

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
    'svg.pet{width:100%;height:100%;display:block;max-width:100%;max-height:100%;overflow:visible}';

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
    hubBack: hubBack,
    hubBackButton: hubBackButton,
    gameId: gameId,
    boot: boot,
    showHint: showHint
  };
})(window);
