/* Шапка «Мой клан» · общий код трёх концептов (только концепт).
   Герб и цвет — только из каталога экрана создания клана (ClanCreate.ICONS / COLORS).
   ?alt=1 — показать шапку с другим демо-кланом (герб и цвет из того же каталога).
   #about — сразу открыть шторку «О клане», #leave — сразу подтверждение выхода. */
(function(w){
  var CC = w.ClanCreate, T = w.T;
  var q = new URLSearchParams(location.search);
  var ALT = {
    a: { name:'Хомяки-силачи', lvl:2, members:25, cap:45, online:4, wins:41, nextWins:100, nextCap:50, owner:'Гоша' },
    b: { name:'Ёжики в тумане', lvl:2, members:31, cap:45, online:9, wins:77, nextWins:100, nextCap:50, owner:'Лена' },
    c: { name:'Лапки вверх', lvl:1, members:22, cap:40, online:5, wins:18, nextWins:30, nextCap:45, owner:'Рома' }
  };
  var concept = document.documentElement.getAttribute('data-concept') || 'a';
  var base = Object.assign({}, T.clan, { owner:'Макс' });
  var cl = q.has('alt') ? Object.assign({}, base, ALT[concept]) : base;
  var mark = CC.demoByName(cl.name);
  cl.icon = q.get('crest') || mark.icon; cl.color = q.get('color') || mark.color;
  var ic = CC.iconBy(cl.icon), col = CC.colorBy(cl.color);
  cl.pct = Math.round(cl.wins / cl.nextWins * 100);
  cl.my = 131250;

  var root = document.documentElement.style;
  root.setProperty('--cc', col.c); root.setProperty('--ce', col.e); root.setProperty('--cs', col.soft);
  root.setProperty('--cink', col.id === 'sun' ? 'var(--ink)' : 'var(--white)');
  if (col.id === 'sun') document.documentElement.classList.add('clan-light');

  var I = {
    ppl: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="8" r="3.6"/><path d="M2.5 19.5Q3 13.5 9 13.5t6.5 6z"/><circle cx="17" cy="9" r="2.8"/><path d="M15.8 13.6Q21 13.4 21.5 19.5h-4.2q-.1-3.5-1.5-5.9z"/></svg>',
    exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h6"/><path d="M15 8.5l3.5 3.5-3.5 3.5M18.5 12H10"/></svg>',
    win: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.1l2.26 6.04 6.44.28-5.04 4.02 1.72 6.21L12 16.1l-5.38 3.55 1.72-6.21L3.3 9.42l6.44-.28z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.4 10.2 7.6 13.4 12 5.4l4.4 8 3.2-3.2v8.2H4.4z"/></svg>',
    seat: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 20q.5-6.5 7.5-6.5t7.5 6.5z"/></svg>',
    x: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12 4.5 6.5 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3.5" y="9" width="17" height="4" rx="1.4"/><rect x="5" y="13" width="14" height="7.5" rx="1.6"/><path d="M11 9h2v11.5h-2z" style="fill:var(--white)" opacity=".7"/><path d="M12 8.6C10.4 5 6.6 4.6 6.9 7.2 7.1 8.7 9.6 8.9 12 8.6zm0 0c1.6-3.6 5.4-4 5.1-1.4-.2 1.5-2.7 1.7-5.1 1.4z"/></svg>'
  };

  function crestSVG(){ return CC.svg(ic); }
  /* «Щит» — рамка-подложка под герб каталога (сам герб не меняется) */
  function shield(size){
    var id = 'sh' + Math.random().toString(36).slice(2,7);
    return '<span class="cx-shield" style="--sz:'+size+'px">'+
      '<svg class="cx-shield-bg" viewBox="0 0 80 90" aria-hidden="true"><defs>'+
        '<linearGradient id="'+id+'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--white)"/><stop offset="1" style="stop-color:var(--cs)"/></linearGradient>'+
        '<linearGradient id="'+id+'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--cc) 70%,var(--white))"/><stop offset="1" style="stop-color:var(--cc)"/></linearGradient></defs>'+
        '<path d="M40 4 74 15v27c0 20-14 37-34 44C20 79 6 62 6 42V15z" style="fill:var(--ce)" transform="translate(0 4)"/>'+
        '<path d="M40 4 74 15v27c0 20-14 37-34 44C20 79 6 62 6 42V15z" fill="url(#'+id+'g)"/>'+
        '<path d="M40 11 67 20v22c0 16-11 30-27 36C24 72 13 58 13 42V20z" fill="url(#'+id+'c)"/>'+
        
      '</svg><span class="cx-shield-ic">'+crestSVG()+'</span></span>';
  }
  function badge(cls){ return '<span class="emb clan-badge cx-badge '+(cls||'')+'" style="'+CC.badgeStyle(col)+'">'+crestSVG()+'</span>'; }
  function ring(size, stroke, inner){
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - cl.pct / 100);
    return '<span class="cx-ring" style="--rs:'+size+'px"><svg viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+
      '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" style="stroke:var(--ring-track,var(--fill))" stroke-width="'+stroke+'"/>'+
      '<circle class="cx-ring-p" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" style="stroke:var(--cc)" stroke-width="'+stroke+'" stroke-linecap="round" stroke-dasharray="'+c.toFixed(2)+'" stroke-dashoffset="'+off.toFixed(2)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>'+
      '</svg>'+inner+'</span>';
  }
  function pattern(n){ /* бледный узор из того же герба на баннере */
    var pos = [[6,18,22,-14],[24,64,16,10],[44,12,18,8],[62,58,26,-8],[80,20,20,16],[92,70,14,-20],[14,82,14,20],[70,92,12,0]], out='';
    for (var i=0;i<(n||pos.length);i++){ var p=pos[i]; out+='<i style="left:'+p[0]+'%;top:'+p[1]+'%;width:'+p[2]+'px;height:'+p[2]+'px;transform:translate(-50%,-50%) rotate('+p[3]+'deg)">'+crestSVG()+'</i>'; }
    return '<span class="cx-pat" aria-hidden="true">'+out+'</span>';
  }
  function heads(n){
    var on = (T.c3 ? T.c3.allMembers() : []).filter(function(m){return m.on;}).slice(0,n);
    return on.map(function(m){ var src = w.TAP_petThumb ? TAP_petThumb(m.pet, m.lvl) : ''; return '<span class="cx-head"><img src="'+src+'" alt=""></span>'; }).join('');
  }
  function fmt(n){ return T.fmt ? T.fmt(n) : String(n); }
  function plural(n,a,b,c){ var m=n%100,d=n%10; return (m>10&&m<20)||!d||d>4?c:d===1?a:b; }

  /* ── Шторка над таб-баром: фиксированная высота, контент меняется внутри ── */
  var sh, scrim, dlg;
  function tbH(){ var tb=document.querySelector('.tabbar, .nav'); if(!tb) return 72; return Math.max(48, Math.round(window.innerHeight - tb.getBoundingClientRect().top)); }
  function ensure(){
    if (sh) return;
    scrim = document.createElement('div'); scrim.className = 'cx-scrim';
    sh = document.createElement('div'); sh.className = 'cx-sheet'; sh.setAttribute('role','dialog');
    document.body.appendChild(scrim); document.body.appendChild(sh);
    scrim.addEventListener('click', close);
    sh.addEventListener('click', function(e){ if (e.target.closest('[data-cx-close]')) close(); });
  }
  function place(){ document.documentElement.style.setProperty('--tb', tbH() + 'px'); }
  function open(html, cls, instant){
    ensure(); place();
    sh.className = 'cx-sheet ' + (cls||'');
    sh.innerHTML = '<div class="cx-page on">'+html+'</div>';
    if (instant){ sh.classList.add('no-anim'); scrim.classList.add('no-anim'); }
    requestAnimationFrame(function(){ scrim.classList.add('on'); sh.classList.add('on'); });
    if (w.CX.onOpen) w.CX.onOpen(sh);
  }
  function swap(html, dir, instant){ /* смена содержимого той же шторки — высота не меняется */
    var old = sh.querySelector('.cx-page.on'), nw = document.createElement('div');
    nw.className = 'cx-page' + (instant ? ' on' : ' in-' + (dir||'fwd')); nw.innerHTML = html; sh.appendChild(nw);
    if (old){ if (instant) old.remove(); else { old.classList.add('out-' + (dir||'fwd')); old.classList.remove('on'); setTimeout(function(){ old.remove(); }, 380); } }
    if (!instant) requestAnimationFrame(function(){ requestAnimationFrame(function(){ nw.classList.remove('in-fwd','in-back'); nw.classList.add('on'); }); });
    if (w.CX.onOpen) w.CX.onOpen(sh);
  }
  function close(){ if (dlg) closeDialog(); if (!sh) return; sh.classList.remove('on','no-anim'); scrim.classList.remove('on','no-anim'); }
  function dialog(html, instant){ /* диалог по центру поверх шторки (концепт Б) */
    ensure(); place();
    if (!dlg){ dlg = document.createElement('div'); dlg.className = 'cx-dlg-wrap'; document.body.appendChild(dlg);
      dlg.addEventListener('click', function(e){ if (e.target === dlg || e.target.closest('[data-cx-dlg-close]')) closeDialog(); }); }
    dlg.innerHTML = '<div class="cx-dlg" role="alertdialog">'+html+'</div>';
    if (instant) dlg.classList.add('no-anim');
    requestAnimationFrame(function(){ dlg.classList.add('on'); });
    if (w.CX.onOpen) w.CX.onOpen(dlg);
  }
  function closeDialog(){ if (dlg) dlg.classList.remove('on','no-anim'); }
  function left(){ close(); location = '?empty=1'; }
  window.addEventListener('resize', place);

  function applyClan(patch){
    Object.assign(cl, patch || {});
    ic = CC.iconBy(cl.icon); col = CC.colorBy(cl.color);
    cl.pct = cl.nextWins ? Math.round(cl.wins / cl.nextWins * 100) : 0;
    root.setProperty('--cc', col.c); root.setProperty('--ce', col.e); root.setProperty('--cs', col.soft);
    root.setProperty('--cink', col.id === 'sun' ? 'var(--ink)' : 'var(--white)');
    document.documentElement.classList.toggle('clan-light', col.id === 'sun');
    w.CX.icon = ic; w.CX.color = col;
  }
  w.CX = { clan: cl, icon: ic, color: col, I: I, shield: shield, badge: badge, ring: ring, pattern: pattern, heads: heads,
    fmt: fmt, plural: plural, open: open, swap: swap, close: close, dialog: dialog, closeDialog: closeDialog, left: left, crestSVG: crestSVG, applyClan: applyClan };
})(window);
