/* Создать клан — общее состояние, гербы, цвета, предпросмотр. */
(function (w) {
  var ICONS = [
    { id: 'paw',     name: 'Лапка', svg: '<ellipse cx="6.45" cy="9.75" rx="2.12" ry="2.62" transform="rotate(-22 6.45 9.75)"/><ellipse cx="9.85" cy="6.5" rx="2.28" ry="2.78" transform="rotate(-7 9.85 6.5)"/><ellipse cx="14.15" cy="6.5" rx="2.28" ry="2.78" transform="rotate(7 14.15 6.5)"/><ellipse cx="17.55" cy="9.75" rx="2.12" ry="2.62" transform="rotate(22 17.55 9.75)"/><path d="M12 10.95c-3.95 0-5.85 2.35-5.85 5.55 0 2.85 2.05 3.95 4.05 3.35 .85-.25 1.2-.7 1.8-.7s.95.45 1.8.7c2 .6 4.05-.5 4.05-3.35 0-3.2-1.9-5.55-5.85-5.55z"/>' },
    { id: 'crown',   name: 'Корона', svg: '<path d="M4.4 10.2 7.6 13.4 12 5.4 16.4 13.4 19.6 10.2v8.2H4.4z"/><path d="M5.2 19.2h13.6v1.7H5.2z"/><circle cx="4.4" cy="10.05" r="1.35"/><circle cx="12" cy="5.25" r="1.45"/><circle cx="19.6" cy="10.05" r="1.35"/>' },
    { id: 'bolt',    name: 'Молния', svg: '<path d="M13.9 2.4 7.05 13.15h4.85L9.5 21.6 18.4 9.7h-4.7z"/>' },
    { id: 'leaf',    name: 'Листик', svg: '<path fill-rule="evenodd" d="M18.15 4.45C12.6 5.1 8.2 9.35 6.55 15.55c-.4 1.5-.15 2.35.7 2.4C12.6 18.6 16.7 12.35 18.15 4.45zM16.2 6.55c-.28-.22-.62-.05-.8.28C14.1 8.9 11.7 12.2 9.55 15.55c-.22.35-.08.7.28.82.32.1.62-.08.78-.38C12.7 12.55 15.05 9.3 16.4 7.15c.2-.32.1-.62-.2-.6z"/><path d="M6.85 17.55c-.85 1.55-1.85 2.85-2.7 3.7.2-.05 2.15-1.35 2.85-3.15z"/>' },
    { id: 'snow',    name: 'Снежинка', svg: '<circle cx="12" cy="12" r="1.7"/><g transform="rotate(0 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g><g transform="rotate(60 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g><g transform="rotate(120 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g><g transform="rotate(180 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g><g transform="rotate(240 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g><g transform="rotate(300 12 12)"><path d="M11.15 4.7h1.7v6.7h-1.7z"/><circle cx="12" cy="4.7" r="1.05"/><path d="M12 7.15l-2.55-1.55-.7 1.15L11.15 8.2V7.15z"/><path d="M12 7.15l2.55-1.55.7 1.15-2.4 1.45V7.15z"/></g>' },
    { id: 'flame',   name: 'Пламя', svg: '<path fill-rule="evenodd" d="M12.15 2.35c.85 4.15 4.55 6.35 5.95 10.05 1.05 2.75.55 5.15-1.55 6.85A6.55 6.55 0 0 1 5.7 16.35c.15-2.55 1.55-4.35 3.45-6.15C10.4 8.9 10.9 7.6 10.55 5.55c.7 2.35 1.85 3.55 3.35 4.35C13.05 7.7 12.55 4.85 12.15 2.35zM12.35 10.15c.75 1.7 2.25 2.85 2.15 5.05a2.55 2.55 0 1 1-5.05-.25c.35-1.7 1.45-3.05 2.9-4.8z"/>' },
    { id: 'star',    name: 'Звезда', svg: '<path d="M12 3.1L14.26 9.14L20.7 9.42L15.66 13.44L17.38 19.65L12 16.1L6.62 19.65L8.34 13.44L3.3 9.42L9.74 9.14Z"/>' },
    { id: 'heart',   name: 'Сердце', svg: '<path d="M12 20.35C12 20.35 4 14.35 4 8.95A4.55 4.55 0 0 1 12 6.85 4.55 4.55 0 0 1 20 8.95c0 5.4-8 11.4-8 11.4z"/>' },
    { id: 'shield',  name: 'Щит', svg: '<path d="M12 2.7 19.3 5.55v5.85c0 4.35-3.05 8-7.3 9.5-4.25-1.5-7.3-5.15-7.3-9.5V5.55z"/>' },
    { id: 'moon',    name: 'Луна', svg: '<path fill-rule="evenodd" d="M13.1 3.3a8.7 8.7 0 1 0 7.3 13.55A8.15 8.15 0 0 1 11.3 5.15 8.6 8.6 0 0 0 13.1 3.3z"/>' },
    { id: 'flower',  name: 'Цветок', svg: '<circle cx="12" cy="7.55" r="3.05"/><circle cx="16.23" cy="10.62" r="3.05"/><circle cx="14.62" cy="15.6" r="3.05"/><circle cx="9.38" cy="15.6" r="3.05"/><circle cx="7.77" cy="10.62" r="3.05"/><circle cx="12" cy="12" r="2.55"/>' },
    { id: 'gem',     name: 'Кристалл', svg: '<path fill-rule="evenodd" d="M12 2.9 19.15 9.15 12 21.1 4.85 9.15zM8.15 9.15 12 4.55 15.85 9.15 12 11.55z"/>' }
  ];

  var COLORS = [
    { id: 'violet', name: 'Фиолетовый', c: 'var(--violet)', soft: 'var(--violet-soft)', e: 'var(--violet-edge)' },
    { id: 'green',  name: 'Зелёный',    c: 'var(--green)',  soft: 'var(--green-soft)',  e: 'var(--green-edge)' },
    { id: 'sun',    name: 'Жёлтый',     c: 'var(--sun)',    soft: 'var(--sun-soft)',    e: 'var(--sun-edge)' },
    { id: 'blue',   name: 'Синий',      c: 'var(--blue)',   soft: 'var(--blue-soft)',   e: 'var(--blue-edge)' },
    { id: 'pink',   name: 'Розовый',    c: 'var(--pink)',   soft: 'var(--pink-soft)',   e: 'var(--pink-edge)' },
    { id: 'orange', name: 'Оранжевый',  c: 'var(--game-goroda)', soft: 'var(--game-goroda-soft)', e: 'var(--game-goroda-edge)' },
    { id: 'teal',   name: 'Бирюзовый',  c: 'var(--game-ship)',    soft: 'var(--game-ship-soft)',    e: 'var(--game-ship-edge)' }
  ];

  var KEY = 'tapyshi.clan.create';
  var FALLBACK = 'Новый клан';
  var MAX = 18;

  function iconBy(id) { return ICONS.find(function (x) { return x.id === id; }) || ICONS[0]; }
  function colorBy(id) { return COLORS.find(function (x) { return x.id === id; }) || COLORS[0]; }
  function svg(ic, vb) {
    return '<svg viewBox="' + (vb || '0 0 24 24') + '" fill="currentColor" aria-hidden="true">' + ic.svg + '</svg>';
  }
  function displayName(s) {
    s = (s || '').trim();
    return s || FALLBACK;
  }

  function badgeHTML(st, size) {
    var ic = iconBy(st.icon), col = colorBy(st.color);
    return '<span class="badge badge--' + (size || 'sm') + '" style="' + badgeStyle(col) + '">' + svg(ic) + '</span>';
  }

  function previewHTML(st, kind) {
    var name = displayName(st.name);
    var col = colorBy(st.color);
    if (kind === 'hero') {
      return badgeHTML(st, 'lg') +
        '<b class="nm">' + esc(name) + '</b>' +
        '<span class="cap">так клан будут видеть все</span>';
    }
    if (kind === 'card') {
      return badgeHTML(st, 'md') +
        '<span class="meta"><b>' + esc(name) + '</b><small>ур. 1 · 1 участник</small></span>' +
        '<span class="rank">новый</span>';
    }
    /* row — как шапка «Мой клан» */
    return badgeHTML(st, 'sm') +
      '<span class="t"><b>' + esc(name) + '</b><small><span class="chip chip--sun"><b>ур. 1</b></span>1 из 45 · ты лидер</small></span>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function crestCell(ic, st) {
    var on = ic.id === st.icon ? ' on' : '';
    var col = colorBy(st.color);
    return '<button type="button" class="crest tap' + on + '" data-icon="' + ic.id + '" style="--cc:' + col.c + '" aria-label="' + ic.name + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      svg(ic) + '<em>' + ic.name + '</em></button>';
  }
  function swatchCell(col, st, compact) {
    var on = col.id === st.color ? ' on' : '';
    return '<button type="button" class="swatch tap' + on + '" data-id="' + col.id + '" style="' + badgeStyle(col) + '" aria-label="' + col.name + '" aria-pressed="' + (on ? 'true' : 'false') + '"></button>';
  }

  function save(st) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        name: displayName(st.name), icon: st.icon, color: st.color, at: Date.now()
      }));
    } catch (e) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }
  function badgeStyle(col) {
    var sun = col.id === 'sun';
    return '--cc:' + col.c + ';--ce:' + col.e + (sun ? ';--badge-ink:var(--ink)' : '');
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.querySelector('.app').appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }

  function init(opts) {
    var st = { name: opts.name || '', icon: opts.icon || 'paw', color: opts.color || 'violet' };
    var previews = [].concat(opts.preview || []);
    var nameEl = typeof opts.nameInput === 'string' ? document.querySelector(opts.nameInput) : opts.nameInput;
    var crestsEl = typeof opts.crests === 'string' ? document.querySelector(opts.crests) : opts.crests;
    var colorsEl = typeof opts.colors === 'string' ? document.querySelector(opts.colors) : opts.colors;
    var createEl = typeof opts.create === 'string' ? document.querySelector(opts.create) : opts.create;
    var hintEl = typeof opts.hint === 'string' ? document.querySelector(opts.hint) : opts.hint;

    function paint() {
      previews.forEach(function (p) {
        var el = typeof p.el === 'string' ? document.querySelector(p.el) : p.el;
        if (!el) return;
        el.innerHTML = previewHTML(st, p.kind || 'row');
      });
      if (crestsEl) {
        if (!crestsEl.childElementCount) {
          crestsEl.innerHTML = ICONS.map(function (ic) { return crestCell(ic, st); }).join('');
        } else {
          var col = colorBy(st.color);
          [].forEach.call(crestsEl.querySelectorAll('[data-icon]'), function (b) {
            var on = b.getAttribute('data-icon') === st.icon;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.style.setProperty('--cc', col.c);
          });
        }
      }
      if (colorsEl) {
        if (!colorsEl.childElementCount) {
          colorsEl.innerHTML = COLORS.map(function (c) { return swatchCell(c, st); }).join('');
        } else {
          [].forEach.call(colorsEl.querySelectorAll('[data-id]'), function (b) {
            var on = b.getAttribute('data-id') === st.color;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }
      }
      if (createEl) {
        var ok = displayName(st.name) !== FALLBACK || (st.name || '').trim().length >= 2;
        /* кнопка активна, если введено хотя бы 2 символа */
        var ready = (st.name || '').trim().length >= 2;
        createEl.disabled = !ready;
      }
      if (hintEl) {
        var n = (st.name || '').trim().length;
        hintEl.textContent = n ? (n + ' из ' + MAX) : 'от 2 до ' + MAX + ' букв';
        hintEl.classList.toggle('warn', n >= MAX);
      }
      if (opts.onChange) opts.onChange(st);
    }

    if (nameEl) {
      nameEl.maxLength = MAX;
      nameEl.setAttribute('maxlength', String(MAX));
      nameEl.setAttribute('autocomplete', 'off');
      nameEl.setAttribute('autocorrect', 'off');
      nameEl.setAttribute('autocapitalize', 'words');
      nameEl.setAttribute('spellcheck', 'false');
      nameEl.setAttribute('enterkeyhint', 'done');
      nameEl.value = st.name;
      function readName() {
        var v = nameEl.value.slice(0, MAX);
        if (nameEl.value !== v) nameEl.value = v;
        st.name = v;
        paint();
      }
      nameEl.addEventListener('input', readName);
      nameEl.addEventListener('paste', function () { setTimeout(readName, 0); });
      nameEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
      });
      nameEl.addEventListener('focus', function () {
        setTimeout(function () { nameEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 280);
      });
      if (window.visualViewport) {
        var vv = window.visualViewport;
        function syncKb() {
          var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
          document.documentElement.style.setProperty('--kb', kb + 'px');
          if (kb > 80 && document.activeElement === nameEl) {
            nameEl.scrollIntoView({ block: 'center' });
          }
        }
        vv.addEventListener('resize', syncKb);
        vv.addEventListener('scroll', syncKb);
      }
    }
    if (crestsEl) {
      crestsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-icon]');
        if (!b) return;
        st.icon = b.getAttribute('data-icon');
        paint();
      });
    }
    if (colorsEl) {
      colorsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-id]');
        if (!b) return;
        st.color = b.getAttribute('data-id');
        paint();
      });
    }
    if (createEl) {
      createEl.addEventListener('click', function () {
        if (createEl.disabled) return;
        save(st);
        if (opts.onCreate) opts.onCreate(st);
        else location.href = opts.afterCreate || '../clan/?mine=1';
      });
    }
    paint();
    return {
      get: function () { return Object.assign({}, st); },
      set: function (patch) {
        if (patch.name != null) { st.name = String(patch.name).slice(0, MAX); if (nameEl) nameEl.value = st.name; }
        if (patch.icon) st.icon = patch.icon;
        if (patch.color) st.color = patch.color;
        paint();
      },
      toast: toast,
      ICONS: ICONS,
      COLORS: COLORS
    };
  }

  w.ClanCreate = { ICONS: ICONS, COLORS: COLORS, KEY: KEY, init: init, previewHTML: previewHTML, svg: svg, iconBy: iconBy, colorBy: colorBy, displayName: displayName, toast: toast, save: save, load: load, badgeHTML: badgeHTML, badgeStyle: badgeStyle };
})(window);
