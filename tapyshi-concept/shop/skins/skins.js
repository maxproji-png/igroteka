/* Магазин · вкладка «Скины» (выбран концепт Б «Список наборов»). Окно части и окно набора.
   Данные — /workspace/pet-skins/skins.json (копия в assets/), арт — рендеры из shop/skins/assets (пересборка: python3 tools/skins-assets.py).
   ЦЕНЫ — ЗАГЛУШКИ (экономика не утверждена), см. README. Монета — PNG варианта A (assets/coin). */
(function(w){
  var T = w.T = w.T || {};
  var A = 'skins/assets/', MF = w.SK_MANIFEST, V = '?v=' + MF.v;
  /* монета: лапка вариант A (PNG из shared/coin/png через T.coinSrc); T.coin и «Бусты» не меняются */
  function coin(px){ px = +px || 18; return '<img class="coin cpng" src="'+T.coinSrc(px)+'" width="'+px+'" height="'+px+'" style="width:'+px+'px;height:'+px+'px" alt="">'; }
  var SLOT = { head:'Голова', body:'Тело', back:'Спина', limbs:'Лапки и хвост' };
  var PET = { raccoon:'Енот', capybara:'Капибара', dragon:'Дракон', goose:'Гусь' };
  var PET_ORDER = ['raccoon','capybara','dragon','goose'];
  var PET_IN = { raccoon:'на еноте', capybara:'на капибаре', dragon:'на драконе', goose:'на гусе' };
  /* ЦЕНЫ-ЗАГЛУШКИ: часть = PART[r]; полный набор = 85% от суммы частей (округление до 100) */
  var PART = { common:1500, epic:4000, legendary:9000 };
  var META = { common:{tone:'ice',theme:'Стихия · лёд'}, epic:{tone:'epic',theme:'Профессия · маг'}, legendary:{tone:'leg',theme:'Превращение · гроза'} };
  /* короткие описания для окна части (3 строки); остальные — из skins.json */
  var SHORT = { mage_staff:'Рукава-колокола с золотыми манжетами и посох с золотым полумесяцем и светящимся розовым кристаллом; звёздный чехол на хвост.',
    storm_tail:'Фиолетовые рукава с кольцами-разрядами и светлыми коготками; вместо родного хвоста — светящийся хвост-молния на облачке.' };
  var SETS = ['common','epic','legendary'].map(function(id){ var m = MF.sets[id];
    var s = { id:id, r:m.r, name:m.name, tone:META[id].tone, theme:META[id].theme, pets:m.pets };
    s.parts = m.parts.map(function(p){ return { id:p.id, slot:p.slot, name:p.name, desc:SHORT[p.id]||p.desc, set:s, img:A+p.img+'.webp'+V, price:PART[id] }; });
    return s; });
  /* демо: Мороз собран и надет (4/4), Чародей 2/4, Гроза 0/4; баланс — общий с «Бустами» (SHOP.bal) */
  var DEMO = { bal:0, own:{ ice_hood:1, ice_parka:1, ice_pack:1, ice_mittens:1, mage_hat:1, mage_robe:1 }, worn:'common' };
  var S = JSON.parse(JSON.stringify(DEMO));
  function r100(n){ return Math.round(n/100)*100; }
  function setById(id){ for (var i=0;i<SETS.length;i++) if (SETS[i].id===id) return SETS[i]; }
  function partById(id){ for (var i=0;i<SETS.length;i++) for (var j=0;j<4;j++) if (SETS[i].parts[j].id===id) return SETS[i].parts[j]; }
  function owned(s){ return s.parts.filter(function(p){ return S.own[p.id]; }).length; }
  function rest(s){ return s.parts.filter(function(p){ return !S.own[p.id]; }); }
  function setPrice(s){ var r = rest(s), sum = r.reduce(function(a,p){ return a+p.price; },0); return { price: r100(sum*0.85), full: sum, n: r.length }; }
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
  function stub(){ return '<span class="sk-stub" title="Цена не утверждена экономикой">цена-заглушка</span>'; }
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
    if (instant){ sh.classList.add('no-anim'); scrim.classList.add('no-anim'); }
    requestAnimationFrame(function(){ sh.classList.add('on'); scrim.classList.add('on'); }); }
  function close(){ isOpen = false; if (w.SK3D) w.SK3D.dispose(); if (!sh) return; sh.classList.remove('on','no-anim'); scrim.classList.remove('on','no-anim'); }
  addEventListener('resize', place); addEventListener('load', place);
  /* таб-бар строится nav.js и может поменять высоту после шрифтов — следим, чтобы зазор всегда был 8 px */
  (function watch(){ var t=document.querySelector('.tabbar'); if (!t) return setTimeout(watch, 50); if (w.ResizeObserver) new ResizeObserver(place).observe(t); place(); })();

  var view = { pet:'raccoon', back:false, set:null, sel:{}, angle:null };
  /* модуль 3D грузится позже классических скриптов: если окно набора уже открыто — перерисовать его в 3D */
  addEventListener('sk3d-ready', function(){ if (isOpen && sh.querySelector('.sk-ss')) setSheet(view.set, true); });
  var isOpen = false;
  function partSheet(id, instant){
    if (w.SK3D) w.SK3D.detach();
    var p = partById(id), s = p.set, have = !!S.own[p.id], can = bal() >= p.price, n = owned(s);
    var act = have ? (S.worn===s.id ? '<button class="sk-btn sk-btn--ghost" disabled>'+I.check+'Надето</button>' : '<button class="sk-btn sk-btn--soft" data-wear="'+s.id+'">Надеть</button>')
      : '<button class="sk-btn '+(can?'sk-btn--buy':'sk-btn--off')+'" '+(can?'data-buy="'+p.id+'"':'disabled')+'>'+(can?'Купить за ':'')+coin(22)+'<span class="cx-num">'+fmt(p.price)+'</span></button>';
    open('<div class="sk-ps sk-tone--'+s.tone+'">'+
      (function(){ var on = partOnPet(p, view.pet), pk = petOf(s, view.pet);
        return '<div class="sk-stage"><img class="'+(on?'':'is-item')+'" src="'+(on||p.img)+'" alt=""><span class="sk-stage-note">'+(on?PET_IN[pk]+' · ст. '+s.pets[pk].st:'крупный план')+'</span></div>'; })()+
      '<div class="sk-meta">'+rchip(s)+'<span class="sk-slot">'+SLOT[p.slot]+'</span></div>'+
      '<h3 class="sk-h">'+p.name+'</h3><p class="sk-desc">'+p.desc+'</p>'+
      '<button type="button" class="sk-setrow" data-set="'+s.id+'"><span class="sk-setrow-t"><small>Часть набора · '+n+' из 4</small><b>«'+s.name+'»</b></span>'+
        '<span class="sk-minis">'+s.parts.map(function(q){ return '<span class="sk-mini'+(S.own[q.id]?' on':'')+(q.id===p.id?' cur':'')+'"><img src="'+tileOf(q, view.pet)+'" alt=""></span>'; }).join('')+'</span>'+
        '</button>'+
      '<div class="sk-fill"></div>'+
      '<div class="sk-buyrow">'+(have?'<span class="sk-have">'+I.check+'Уже в коллекции</span>':'<span class="sk-pr"><small>Часть отдельно</small>'+stub()+'</span>')+act+'</div>'+
    '</div>', instant);
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
      '<span class="sk-pr"><small>'+(si.all ? (n?'Докупить '+si.n+' '+chast(si.n):'Весь набор')+' · <s class="cx-num">'+fmt(si.full)+'</s> <em>−15%</em>'
        : 'Выбрано '+si.k+' '+chast(si.k)+' · без скидки')+'</small>'+stub()+'</span>';
    var D3 = !!(w.SK3D && w.SK3D.ok);
    var note = D3 ? (cm.n===4 ? 'Весь набор' : cm.n ? 'Примерка · '+cm.n+' из 4' : 'Без костюма')
      : trying ? (cm.exact ? 'Примерка · '+cm.n+' из 4' : 'Нет рендера · показан весь набор') : (back ? 'Вид сзади' : 'Весь набор');
    if (D3){ back = false; img = cm.n===0 ? (MF.base && MF.base[pk] ? render(MF.base[pk]) : render(e.tq)) : (cm.exact ? cm.src : render(e.tq)); }  /* постер, пока грузится GLB */
    open('<div class="sk-ss sk-tone--'+s.tone+'">'+
      '<div class="sk-stage big'+(!D3&&trying&&!cm.exact?' is-fallback':'')+(D3?' sk3d':'')+'"><img class="sk-poster" src="'+img+'" alt="">'+
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
    if (D3) w.SK3D.attach(sh.querySelector('.sk-stage'), s.id, Object.keys(view.sel), view.angle != null ? view.angle : null), view.angle = null;
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
    partSheet:partSheet, tileOf:tileOf, setSheet:setSheet, close:close, view:view, onChange:function(f){ listeners.push(f); }, coin:coin, changed:changed, partById:partById, setById:setById, render:render };
})(window);
