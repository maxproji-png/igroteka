/* Магазин · вкладка «Скины» (выбран концепт Б «Список наборов»). Окно части и окно набора.
   Данные — /workspace/pet-skins/skins.json (копия в assets/), арт — рендеры из shop/skins/assets (пересборка: python3 tools/skins-assets.py).
   Цены частей и наборов — финальная экономика (набор = сумма оставшихся частей, без скидки). Монета — PNG варианта A. */
(function(w){
  var T = w.T = w.T || {};
  var A = 'skins/assets/', MF = w.SK_MANIFEST, V = '?v=' + MF.v;
  /* монета: лапка вариант A (PNG из shared/coin/png через T.coinSrc); T.coin и «Бусты» не меняются */
  function coin(px){ px = +px || 18; return '<img class="coin cpng" src="'+T.coinSrc(px)+'" width="'+px+'" height="'+px+'" style="width:'+px+'px;height:'+px+'px" alt="">'; }
  var SLOT = { head:'Голова', body:'Тело', back:'Спина', limbs:'Лапки и хвост' };
  var PET = { raccoon:'Енот', capybara:'Капибара', dragon:'Дракон', goose:'Гусь' };
  var PET_ORDER = ['raccoon','capybara','dragon','goose'];
  var PET_IN = { raccoon:'на еноте', capybara:'на капибаре', dragon:'на драконе', goose:'на гусе' };
  var PART = {
    ice_hood:1800, ice_parka:2000, ice_pack:2000, ice_mittens:1700,
    mage_hat:2400, mage_robe:2700, mage_cloak:2700, mage_staff:2200,
    storm_crown:7000, storm_body:8000, storm_wings:8000, storm_tail:7000
  };
  var META = { common:{tone:'ice',theme:'Стихия · лёд'}, epic:{tone:'epic',theme:'Профессия · маг'}, legendary:{tone:'leg',theme:'Превращение · гроза'} };
  /* короткие описания для окна части (3 строки); остальные — из skins.json */
  var SHORT = { mage_staff:'Рукава-колокола с золотыми манжетами и посох с золотым полумесяцем и светящимся розовым кристаллом; звёздный чехол на хвост.',
    storm_tail:'Фиолетовые рукава с кольцами-разрядами и светлыми коготками; вместо родного хвоста — светящийся хвост-молния на облачке.' };
  var SETS = ['common','epic','legendary'].map(function(id){ var m = MF.sets[id];
    var s = { id:id, r:m.r, name:m.name, tone:META[id].tone, theme:META[id].theme, pets:m.pets };
    s.parts = m.parts.map(function(p){ return { id:p.id, slot:p.slot, name:p.name, desc:SHORT[p.id]||p.desc, set:s, img:A+p.img+'.webp'+V, price:PART[p.id] }; });
    return s; });
  /* демо: Мороз собран и надет (4/4), Чародей 2/4, Гроза 0/4; баланс — общий с «Бустами» (SHOP.bal) */
  var DEMO = { bal:0, own:{ ice_hood:1, ice_parka:1, ice_pack:1, ice_mittens:1, mage_hat:1, mage_robe:1 }, worn:'common' };
  var S = JSON.parse(JSON.stringify(DEMO));
  function setById(id){ for (var i=0;i<SETS.length;i++) if (SETS[i].id===id) return SETS[i]; }
  function partById(id){ for (var i=0;i<SETS.length;i++) for (var j=0;j<4;j++) if (SETS[i].parts[j].id===id) return SETS[i].parts[j]; }
  function owned(s){ return s.parts.filter(function(p){ return S.own[p.id]; }).length; }
  function rest(s){ return s.parts.filter(function(p){ return !S.own[p.id]; }); }
  function setPrice(s){ var r = rest(s), sum = r.reduce(function(a,p){ return a+p.price; },0); return { price: sum, full: sum, n: r.length }; }
  function fmt(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0'); }
  function render(name){ return A+name+'.webp'+V; }
  /* питомец в полном наборе (или сзади); null — рендера нет */
  function petOf(s, pet){ return s.pets[pet] ? pet : (s.pets.raccoon ? 'raccoon' : Object.keys(s.pets)[0]); }
  function petImg(s, pet, back){ var e = s.pets[petOf(s, pet)]; if (!e) return null; return render(back && e.back ? e.back : e.tq); }
  /* примерка: ключ комбинации = id выбранных частей в порядке набора через «__» */
  function comboKey(s, sel){ return s.parts.filter(function(p){ return sel[p.id]; }).map(function(p){ return p.id; }).join('__'); }
  function comboImg(s, pet, sel){ var e = s.pets[petOf(s, pet)], k = comboKey(s, sel), n = k ? k.split('__').length : 0;
    if (!e) return { src:null, exact:false, n:n };
    if (!n || n === 4) return { src:render(e.tq), exact:true, n:n };
    return e.combo[k] ? { src:render(e.combo[k]), exact:true, n:n } : { src:render(e.tq), exact:false, n:n }; }
  /* картинка части на текущем питомце (тот же ракурс, что у сцены); нет — крупный план части */
  function tileOf(p, pet){ var e = p.set.pets[petOf(p.set, pet)]; return e && e.tile && e.tile[p.id] ? render(e.tile[p.id]) : p.img; }
  function partOnPet(p, pet){ var e = p.set.pets[petOf(p.set, pet)]; return e && e.combo[p.id] ? render(e.combo[p.id]) : null; }
  function stub(){ return ''; }
  function pips(s, cur){ return '<span class="sk-pips">'+s.parts.map(function(p){ return '<i class="'+(S.own[p.id]?'on':'')+(cur&&cur===p.id?' cur':'')+'"></i>'; }).join('')+'</span>'; }
  function rchip(s){ return '<span class="sk-r sk-r--'+s.tone+'">'+s.r+'</span>'; }
  var I = {
    x:'<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>',
    lock:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 2.5A2.5 2.5 0 0 0 5.5 5v2h5V5A2.5 2.5 0 0 0 8 2.5z" opacity=".0"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/><rect x="4" y="7" width="8" height="6.5" rx="2" fill="currentColor"/></svg>',
    turn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"/><path d="M4 20v-5h5"/></svg>'
  };
  function petThumb(pet, st){ return w.TAP_petThumb ? TAP_petThumb(pet, st) : ''; }

  /* ── шторка над таб-баром: фиксированная высота (не зависит от состояния/питомца/вида) ── */
  var sh, scrim;
  function tbH(){ var t=document.querySelector('.tabbar'); return t ? t.offsetHeight : 72; }
  function place(){ var tb=tbH(); document.documentElement.style.setProperty('--tb', tb+'px');
    document.documentElement.style.setProperty('--sk-sheet-h', Math.min(620, innerHeight - tb - 8 - 28)+'px'); }
  function ensure(){ if (sh) return; scrim=document.createElement('div'); scrim.className='sk-scrim'; sh=document.createElement('div'); sh.className='sk-sheet'; sh.setAttribute('role','dialog');
    document.body.appendChild(scrim); document.body.appendChild(sh); scrim.addEventListener('click', close);
    sh.addEventListener('click', onSheetClick); }
  function open(html, instant){ isOpen = true; ensure(); place(); sh.innerHTML='<div class="sk-grab"></div><button type="button" class="sk-x" data-close aria-label="Закрыть">'+I.x+'</button>'+html;
    skel(sh);
    if (instant){ sh.classList.add('no-anim'); scrim.classList.add('no-anim'); }
    document.body.classList.add('has-sheet');
    requestAnimationFrame(function(){ sh.classList.add('on'); scrim.classList.add('on'); }); }
  /* 3D освобождаем после того, как шторка уехала (иначе на выезде мелькает пустая сцена); повторное открытие раньше — отмена */
  var disposeT = 0;
  function close(){ isOpen = false; if (w.SK3D){ clearTimeout(disposeT); disposeT = setTimeout(function(){ if (!isOpen) w.SK3D.dispose(); }, 520); } document.body.classList.remove('has-sheet'); if (!sh) return; sh.classList.remove('on','no-anim'); scrim.classList.remove('on','no-anim'); }
  addEventListener('resize', place); addEventListener('load', place);
  /* таб-бар строится nav.js и может поменять высоту после шрифтов — следим, чтобы зазор всегда был 8 px */
  (function watch(){ var t=document.querySelector('.tabbar'); if (!t) return setTimeout(watch, 50); if (w.ResizeObserver) new ResizeObserver(place).observe(t); place(); })();

  var view = { pet:'raccoon', back:false, set:null, sel:{}, angle:null };
  /* fix2: WebGL определяем сразу, синхронно, не дожидаясь модуля viewer3d.js. Есть WebGL → окно набора ВСЕГДА в 3D-разметке:
     пока модель не готова — нейтральная заглушка (лоадер), постер/webp не вставляется вовсе. Webp — только без WebGL
     или если 3D так и не загрузилось (ошибка/таймаут). */
  var GL = (function(){ try { var c=document.createElement('canvas'), g=c.getContext('webgl2')||c.getContext('webgl'); if (!g) return false;
    var l=g.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); return true; } catch(e){ return false; } })();
  function use3d(){ return GL && !modErr && !(w.SK3D && !w.SK3D.ok); }
  /* модуль 3D грузится позже классических скриптов: окно уже открыто с лоадером — просто подключаем 3D к той же сцене, без перерисовки */
  addEventListener('sk3d-ready', function(){ flushPre();
    var st = isOpen && sh && sh.querySelector('.sk-ss .sk-stage.sk3d');
    if (!st) return;
    if (!w.SK3D.ok){ setSheet(view.set, true); return; }
    w.SK3D.attach(st, view.set, Object.keys(view.sel), view.angle != null ? view.angle : null); view.angle = null; });
  /* предзагрузка GLB (простой на «Скинах», pointerdown по карточке); до загрузки модуля — в очередь */
  var preQ = [];   /* fix3: idle=true — фоновая очередь по одному файлу, без idle — сразу и в приоритете */
  function preload(id, idle){ if (!GL) return; load3d(); if (w.SK3D && w.SK3D.preload) w.SK3D.preload(id, !!idle); else preQ.push([id, !!idle]); }
  function flushPre(){ if (w.SK3D && w.SK3D.preload) preQ.splice(0).forEach(function(q){ w.SK3D.preload(q[0], q[1]); }); }
  /* fix5: 3D-модули (viewer3d.js → three, GLTFLoader, tryon_rules) подключаем сами и только при WebGL: на «Бустах» и без WebGL
     они не грузятся вовсе. Старт — открытие «Скинов», pointerdown на карточке набора или открытие окна набора.
     Все зависимости сразу как <link rel=modulepreload> (параллельно, без цепочки), затем import() точки входа.
     Если модуль не загрузился (сеть/ошибка) — флаг modErr: открытое окно получает постер-фолбэк, следующие — сразу webp */
  var D3EL = document.getElementById('sk3d'), D3URLS = ((D3EL && D3EL.getAttribute('data-3d')) || '').split(/\s+/).filter(Boolean);
  var modState = 0, modErr = false;   /* 0 — не начинали, 1 — грузим, 2 — готово */
  function load3d(){ if (!GL || modState || !D3URLS.length) return; modState = 1;
    D3URLS.forEach(function(u){ var abs = new URL(u, document.baseURI).href; if ([].some.call(document.querySelectorAll('link[rel=modulepreload]'), function(x){ return x.href === abs; })) return; var l = document.createElement('link'); l.rel = 'modulepreload'; l.href = u; document.head.appendChild(l); });
    var entry = new URL(D3URLS[0], document.baseURI).href;
    try { import(entry).then(function(){ modState = 2; }, function(e){ modErr = true; console.warn('3D: модуль не загрузился', e); failCheck(); }); }
    catch (e) { modErr = true; failCheck(); } }
  function failCheck(){ var st = isOpen && sh && sh.querySelector('.sk-ss .sk-stage.sk3d'); if (st && modErr && !w.SK3D && !st.classList.contains('is-3d')) fallbackPoster(st); }
  function fallbackPoster(st){ if (st.querySelector('.sk-poster') || !st.dataset.poster) return;
    var im = document.createElement('img'); im.className = 'sk-poster'; im.alt = ''; im.src = st.dataset.poster; st.insertBefore(im, st.firstChild);
    if (!st.querySelector('.sk-load')) st.insertAdjacentHTML('afterbegin', LOAD);
    st.classList.add('is-3d-fail'); waitImg(st); }
  /* fix3: картинка сцены (режим без WebGL / аварийный постер / окно части) ещё не скачана — держим заглушку,
     пустую сцену не показываем; из кэша картинка готова сразу, класс не ставится вовсе */
  var LOAD = '<span class="sk-load" aria-label="Загружаем"><i class="sk-load-sh"></i><i class="sk-load-r"></i><b>Загружаем</b></span>';
  function waitImg(st){ var im = st && st.querySelector('img'); if (!im) return;
    if (im.complete && im.naturalWidth) { st.classList.remove('is-wait'); return; }
    st.classList.add('is-wait'); var done = function(){ st.classList.remove('is-wait'); };
    im.addEventListener('load', done, { once:true }); im.addEventListener('error', done, { once:true }); }
  w.SK3D_FALLBACK = fallbackPoster;
  /* fix4: скелетон плиток частей (окно набора) и мини-превью (окно части), пока их webp не скачан и не декодирован.
     Вызывается сразу после innerHTML, до первой отрисовки: картинка из кэша (complete + naturalWidth) — скелетона нет вовсе.
     Загрузилась → decode() → класс снимается в том же такте, что и картинка становится видимой. Ошибка — скелетон без шиммера. */
  function skel(root){ [].forEach.call(root.querySelectorAll('.sk-p4-i > img, .sk-mini > img'), function(im){ var b = im.parentNode;
    if (im.complete && im.naturalWidth) return;
    b.classList.add('is-sk');
    if (im.complete && im.getAttribute('src')) { b.classList.add('is-sk-err'); return; }   /* уже упала */
    im.addEventListener('load', function(){ var fin = function(){ b.classList.remove('is-sk'); };
      if (im.decode) im.decode().then(fin, fin); else fin(); }, { once:true });
    im.addEventListener('error', function(){ b.classList.add('is-sk-err'); }, { once:true }); }); }
  var isOpen = false;
  function partSheet(id, instant){
    if (w.SK3D) w.SK3D.detach();
    var p = partById(id), s = p.set, have = !!S.own[p.id], can = bal() >= p.price, n = owned(s);
    var act = have ? (S.worn===s.id ? '<button class="sk-btn sk-btn--ghost" disabled>'+I.check+'Надето</button>' : '<button class="sk-btn sk-btn--soft" data-wear="'+s.id+'">Надеть</button>')
      : '<button class="sk-btn '+(can?'sk-btn--buy':'sk-btn--off')+'" '+(can?'data-buy="'+p.id+'"':'disabled')+'>'+(can?'Купить за ':'')+coin(22)+'<span class="cx-num">'+fmt(p.price)+'</span></button>';
    open('<div class="sk-ps sk-tone--'+s.tone+'">'+
      (function(){ var on = partOnPet(p, view.pet), pk = petOf(s, view.pet);
        return '<div class="sk-stage"><img class="'+(on?'':'is-item')+'" src="'+(on||p.img)+'" alt="">'+LOAD+'<span class="sk-stage-note">'+(on?PET_IN[pk]+' · ст. '+s.pets[pk].st:'крупный план')+'</span></div>'; })()+
      '<div class="sk-meta">'+rchip(s)+'<span class="sk-slot">'+SLOT[p.slot]+'</span></div>'+
      '<h3 class="sk-h">'+p.name+'</h3><p class="sk-desc">'+p.desc+'</p>'+
      '<button type="button" class="sk-setrow" data-set="'+s.id+'"><span class="sk-setrow-t"><small>Часть набора · '+n+' из 4</small><b>«'+s.name+'»</b></span>'+
        '<span class="sk-minis">'+s.parts.map(function(q){ return '<span class="sk-mini'+(S.own[q.id]?' on':'')+(q.id===p.id?' cur':'')+'"><img src="'+tileOf(q, view.pet)+'" alt=""></span>'; }).join('')+'</span>'+
        '</button>'+
      '<div class="sk-fill"></div>'+
      '<div class="sk-buyrow">'+(have?'<span class="sk-have">'+I.check+'Уже в коллекции</span>':'<span class="sk-pr"><small>Часть отдельно</small>'+stub()+'</span>')+act+'</div>'+
    '</div>', instant);
    waitImg(sh.querySelector('.sk-ps .sk-stage'));
  }
  /* окно набора: питомец сверху (текущий, без переключателя), тап по части — примерка на питомце */
  function selInfo(s){ var sel = view.sel, ids = s.parts.filter(function(p){ return sel[p.id]; }),
      buy = ids.filter(function(p){ return !S.own[p.id]; }), r = rest(s), sp = setPrice(s);
    if (!buy.length) return { all:true, k:0, price:sp.price, full:sp.full, n:sp.n, ids:r.map(function(p){ return p.id; }) };
    if (buy.length === r.length) return { all:true, k:buy.length, price:sp.price, full:sp.full, n:sp.n, ids:r.map(function(p){ return p.id; }) };
    return { all:false, k:buy.length, price:buy.reduce(function(a,p){ return a+p.price; },0), ids:buy.map(function(p){ return p.id; }) }; }
  function chast(n){ return n===1?'часть':(n<5?'части':'частей'); }
  function setSheet(id, instant){
    var s = setById(id), n = owned(s), done = n===4;
    if (view.set !== id){ view.set = id; view.sel = {}; s.parts.forEach(function(p){ view.sel[p.id] = 1; }); view.back = false; }  /* v3: при открытии надет весь набор — видно то, что выбрано */
    var pk = petOf(s, view.pet), e = s.pets[pk], cm = comboImg(s, pk, view.sel), trying = cm.n>0 && cm.n<4;
    var back = !trying && view.back && e && e.back, img = back ? render(e.back) : cm.src;
    var si = selInfo(s), can = bal() >= si.price;
    var act = done ? (S.worn===s.id ? '<button class="sk-btn sk-btn--ghost" disabled>'+I.check+'Надето</button>' : '<button class="sk-btn sk-btn--soft" data-wear="'+s.id+'">Надеть набор</button>')
      : '<button class="sk-btn '+(can?'sk-btn--buy':'sk-btn--off')+'" '+(can?'data-buysel="'+si.ids.join(',')+'"':'disabled')+'>'+coin(22)+'<span class="cx-num">'+fmt(si.price)+'</span></button>';
    var lbl = done ? '<span class="sk-have">'+I.check+'Набор собран</span>' :
      '<span class="sk-pr"><small>'+(si.all ? (n?'Докупить '+si.n+' '+chast(si.n):'Весь набор')
        : 'Выбрано '+si.k+' '+chast(si.k))+'</small></span>';
    var D3 = use3d(), M3 = D3 && !!w.SK3D;   /* M3 — модуль уже загружен */
    var note = D3 ? (cm.n===4 ? 'Весь набор' : cm.n ? 'Примерка · '+cm.n+' из 4' : 'Без костюма')
      : trying ? (cm.exact ? 'Примерка · '+cm.n+' из 4' : 'Нет рендера · показан весь набор') : (back ? 'Вид сзади' : 'Весь набор');
    var keep = D3 && isOpen && sh && sh.querySelector('.sk-ss[data-skset="'+id+'"] .sk-stage.sk3d');   /* тот же набор — сцену (канвас или лоадер) не трогаем */
    var has3d = M3 && w.SK3D.has && w.SK3D.has(s.id);   /* GLB уже разобран — лоадер не нужен */
    if (D3){ back = false; img = cm.n===0 ? (MF.base && MF.base[pk] ? render(MF.base[pk]) : render(e.tq)) : (cm.exact ? cm.src : render(e.tq)); }  /* адрес постера — только для аварийного фолбэка, в разметку не идёт */
    open('<div class="sk-ss sk-tone--'+s.tone+'" data-skset="'+s.id+'">'+
      '<div class="sk-stage big'+(!D3&&trying&&!cm.exact?' is-fallback':'')+(D3?' sk3d':'')+'"'+(D3?' data-poster="'+img+'"':'')+'>'+
        (D3 ? (has3d ? '' : '<span class="sk-load" aria-label="Загружаем 3D"><i class="sk-load-sh"></i><i class="sk-load-r"></i><b>Загружаем 3D<span class="sk-load-pc"></span></b><i class="sk-load-bar"><i></i></i></span>') : '<img class="sk-poster" src="'+img+'" alt="">'+LOAD)+
        '<span class="sk-try'+(trying?(D3||cm.exact?' on':' warn'):'')+'">'+note+'</span>'+
        (D3 ? '<span class="sk-spin" aria-hidden="true">'+I.turn+'<span>Крути пальцем</span></span>' : '')+
        (!D3 && !trying && e && e.back ? '<button type="button" class="sk-turn" data-turn aria-label="Повернуть">'+I.turn+'<span>'+(view.back?'Спереди':'Сзади')+'</span></button>':'')+
        '<span class="sk-stage-note">'+PET[pk]+' · ст. '+e.st+'</span></div>'+
      '<div class="sk-meta">'+rchip(s)+'<span class="sk-slot">'+s.theme+'</span></div>'+
      '<div class="sk-titlerow"><h3 class="sk-h">'+s.name+'</h3><span class="sk-cnt">'+pips(s)+'<b class="cx-num">'+n+' из 4</b></span></div>'+
      '<p class="sk-hint">Нажми на часть — она появится на питомце</p>'+
      '<div class="sk-parts4">'+s.parts.map(function(q){ var hv=!!S.own[q.id], on=!!view.sel[q.id];
        return '<div class="sk-p4'+(hv?' own':'')+(on?' sel':'')+'"><button type="button" class="sk-p4-t" data-try="'+q.id+'" aria-pressed="'+on+'" aria-label="'+q.name+'"><span class="sk-p4-i"><img src="'+q.img+'" alt=""></span>'+
          '<span class="sk-p4-b">'+(hv?'<em>'+I.check+'есть</em>':coin(14)+'<b class="cx-num">'+fmt(q.price)+'</b>')+'</span></button>'+
          '<button type="button" class="sk-p4-x" data-part="'+q.id+'" aria-label="Подробнее">i</button></div>'; }).join('')+'</div>'+
      '<div class="sk-fill"></div>'+
      '<div class="sk-buyrow">'+lbl+act+'</div>'+
    '</div>', instant);
    if (keep){ /* тап по части: возвращаем прежнюю сцену (живой канвас или лоадер), меняем только плашку */
      var ns = sh.querySelector('.sk-stage'); keep.querySelector('.sk-try').replaceWith(ns.querySelector('.sk-try')); ns.replaceWith(keep);
      if (M3){ if (keep.classList.contains('is-3d')) w.SK3D.update(Object.keys(view.sel)); else w.SK3D.attach(keep, s.id, Object.keys(view.sel), null); } }
    else if (M3){ w.SK3D.attach(sh.querySelector('.sk-stage'), s.id, Object.keys(view.sel), view.angle != null ? view.angle : null); view.angle = null; }
    else if (D3){ load3d(); failCheck(); }   /* модуль ещё грузится: лоадер, подключимся по sk3d-ready (или фолбэк, если модуль упал) */
    if (!D3) waitImg(sh.querySelector('.sk-ss .sk-stage'));
  }
  function onSheetClick(e){
    var b;
    if (e.target.closest('[data-close]')) return close();
    if ((b=e.target.closest('[data-set]'))){ view.set=null; return setSheet(b.dataset.set); }
    if ((b=e.target.closest('[data-part]'))) return partSheet(b.dataset.part);
    if ((b=e.target.closest('[data-try]'))){ var t=b.dataset.try; if (view.sel[t]) delete view.sel[t]; else view.sel[t]=1; view.back=false; return setSheet(cur(), true); }
    if (e.target.closest('[data-turn]')){ view.back=!view.back; return setSheet(cur(), true); }
    if ((b=e.target.closest('[data-buysel]'))){ var ss=setById(cur()), ids=b.dataset.buysel.split(','), si=selInfo(ss); if(!w.SHOP.spend(si.price)) return;
      ids.forEach(function(i){ S.own[i]=1; }); view.sel={}; changed(); toast(owned(ss)===4?'Набор «'+ss.name+'» собран!':(ids.length===1?partById(ids[0]).name+' — в коллекции':'Части в коллекции: '+ids.length)); return setSheet(ss.id, true); }
    if ((b=e.target.closest('[data-buy]'))){ var p=partById(b.dataset.buy); if(!w.SHOP.spend(p.price)) return; S.own[p.id]=1; changed(); toast(p.name+' — в коллекции'); return partSheet(p.id); }
    if ((b=e.target.closest('[data-buyset]'))){ var s=setById(b.dataset.buyset), sp=setPrice(s); if(!w.SHOP.spend(sp.price)) return; s.parts.forEach(function(q){S.own[q.id]=1;}); changed(); toast('Набор «'+s.name+'» собран!'); return setSheet(s.id); }
    if ((b=e.target.closest('[data-wear]'))){ S.worn=b.dataset.wear; changed(); toast('Надето'); return setSheet(S.worn); }
  }
  function cur(){ return view.set || 'common'; }
  function toast(t){ if (T.toast) T.toast(t); }
  var listeners=[]; function changed(){ listeners.forEach(function(f){ f(); }); }
  function bal(){ return w.SHOP ? w.SHOP.bal() : 0; }

  w.SK = { SETS:SETS, SLOT:SLOT, PET:PET, PET_ORDER:PET_ORDER, S:S, I:I, fmt:fmt, owned:owned, setPrice:setPrice, petImg:petImg, petOf:petOf, comboImg:comboImg, selInfo:selInfo, petThumb:petThumb, stub:stub, pips:pips, rchip:rchip,
    partSheet:partSheet, preload:preload, load3d:load3d, tileOf:tileOf, setSheet:setSheet, close:close, view:view, onChange:function(f){ listeners.push(f); }, coin:coin, changed:changed, partById:partById, setById:setById, render:render };
})(window);
