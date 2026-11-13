/* Создать клан — общее состояние, гербы, цвета, предпросмотр. */
(function (w) {
  var ICONS = [
    { id: 'paw',    name: 'Лапка',     svg: '<path d="M8.2 7.6a2.6 2.6 0 1 1 3.4-3.2 2.6 2.6 0 0 1-3.4 3.2zm7.2 0A2.6 2.6 0 1 0 19 4.4a2.6 2.6 0 0 0-3.6 3.2zM5.2 12.2a2.5 2.5 0 1 1 2.1-4 2.5 2.5 0 0 1-2.1 4zm13.6 0a2.5 2.5 0 1 0-2.1-4 2.5 2.5 0 0 0 2.1 4zM12 10.2c-3.6 0-6.4 3.4-5.6 6.4.5 1.8 2.2 3 4 3.2 1 .1 1.4-.4 1.6-1.1.2.7.6 1.2 1.6 1.1 1.8-.2 3.5-1.4 4-3.2.8-3-2-6.4-5.6-6.4z"/>' },
    { id: 'crown',  name: 'Корона',    svg: '<path d="M4.2 9.2 7.6 13l4.4-6.6 4.4 6.6 3.4-3.8.6 10.2H3.6z"/><path d="M6 20.2h12v1.8H6z"/>' },
    { id: 'bolt',   name: 'Молния',    svg: '<path d="M13.4 2 6 13.2h5.2L9.2 22 18.6 10H13L13.4 2z"/>' },
    { id: 'leaf',   name: 'Листик',    svg: '<path d="M12 2.6C8.2 6.8 6.4 11.6 6.4 15.6c0 3.7 2.5 6 5.6 6s5.6-2.3 5.6-6C17.6 11.6 15.8 6.8 12 2.6z"/><path d="M12 8.6v12.2" fill="none" stroke="color-mix(in srgb,currentColor 30%,white)" stroke-width="1.7" stroke-linecap="round"/>' },
    { id: 'snow',   name: 'Снежинка',  svg: '<path d="M12 3.2v17.6M5.2 7.2l13.6 9.6M5.2 16.8l13.6-9.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 6.2 10 4.6M12 6.2l2-1.6M12 17.8l-2 1.6M12 17.8l2 1.6M7.6 8.6l-2.4.2M7.6 8.6l.6-2.3M16.4 15.4l2.4-.2M16.4 15.4l-.6 2.3M7.6 15.4l-2.4-.2M7.6 15.4l.6 2.3M16.4 8.6l2.4.2M16.4 8.6l-.6-2.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' },
    { id: 'flame',  name: 'Пламя',     svg: '<path d="M12 2.4c1.2 5.2 7.6 8 7.6 15.2A7.6 7.6 0 0 1 4.4 17.6c0-3.6 1.8-6 3.8-7.6-.2 2.4.7 4 2.2 4.9C10 10.8 10.8 6.4 12 2.4z"/>' },
    { id: 'star',   name: 'Звезда',    svg: '<path d="M12 3.2 14.6 9l6.4.8-4.8 4.4 1.2 6.4L12 17.4 6.6 20.6l1.2-6.4L3 9.8 9.4 9z"/>' },
    { id: 'heart',  name: 'Сердце',    svg: '<path d="M12 20.4S3.6 14.2 3.6 8.8A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.4 2.2c0 5.4-8.4 11.6-8.4 11.6z"/>' },
    { id: 'shield', name: 'Щит',       svg: '<path d="M12 2.6 19.2 5.4v5.8c0 4.4-3 8-7.2 9.6-4.2-1.6-7.2-5.2-7.2-9.6V5.4z"/>' },
    { id: 'moon',   name: 'Луна',      svg: '<path d="M14.2 3.4A8.8 8.8 0 1 0 20 15.6 8.4 8.4 0 0 1 14.2 3.4z"/>' },
    { id: 'flower', name: 'Цветок',    svg: '<circle cx="12" cy="6.6" r="3.15"/><circle cx="17.14" cy="10.34" r="3.15"/><circle cx="15.17" cy="16.46" r="3.15"/><circle cx="8.83" cy="16.46" r="3.15"/><circle cx="6.86" cy="10.34" r="3.15"/><circle cx="12" cy="12" r="3.2"/>' },
    { id: 'gem',    name: 'Кристалл',  svg: '<path d="M12 3.2 19.2 9.2 12 21 4.8 9.2z"/><path d="M4.8 9.2h14.4M8.2 9.2 12 21 15.8 9.2 12 3.2z" fill="none" stroke="color-mix(in srgb, currentColor 55%, white)" stroke-width="1.2"/>' }
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
    return '<span class="badge badge--' + (size || 'sm') + '" style="--cc:' + col.c + ';--ce:' + col.e + '">' + svg(ic) + '</span>';
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
    return '<button type="button" class="swatch tap' + on + '" data-id="' + col.id + '" style="--cc:' + col.c + ';--ce:' + col.e + '" aria-label="' + col.name + '" aria-pressed="' + (on ? 'true' : 'false') + '"></button>';
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
        crestsEl.innerHTML = ICONS.map(function (ic) { return crestCell(ic, st); }).join('');
      }
      if (colorsEl) {
        colorsEl.innerHTML = COLORS.map(function (c) { return swatchCell(c, st); }).join('');
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
      nameEl.value = st.name;
      nameEl.addEventListener('input', function () {
        st.name = nameEl.value.slice(0, MAX);
        paint();
      });
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
        toast('Клан «' + displayName(st.name) + '» создан!');
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

  w.ClanCreate = { ICONS: ICONS, COLORS: COLORS, init: init, previewHTML: previewHTML, svg: svg, iconBy: iconBy, colorBy: colorBy, displayName: displayName, toast: toast };
})(window);
