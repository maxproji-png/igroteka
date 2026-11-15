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
  /* ЦЕНЫ-ЗАГЛУШКИ: часть = PART[r]; полный набор = 85% от суммы частей (округление до 100) */
  var PART = { common:1500, epic:4000, legendary:9000 };
  var META = { common:{tone:'ice',theme:'Стихия · лёд'}, epic:{tone:'epic',theme:'Профессия · маг'}, legendary:{tone:'leg',theme:'Превращение · гроза'} };
  /* короткие описания для окна части (3 строки); остальные — из skins.json */
  var SHORT = { mage_staff:'Рукава-колокола с золотыми манжетами и посох с золотым полумесяцем и светящимся розовым кристаллом; звёздный чехол на хвост.',
    storm_tail:'Фиолетовые рукава с кольцами-разрядами и светлыми коготками; вместо родного хвоста — светящийся хвост-молния на облачке.' };
  var SETS = ['common','epic','legendary'].map(function(id){ var m = MF.sets[id];
    var s = { id:id, r:m.r, name:m.name, tone:META[id].tone, theme:META[id].theme, pets:m.pets, back:m.back };
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
  function petImg(s, pet, back){ if (back && pet==='raccoon') return render(s.back); var p = s.pets[pet]; return p ? render(p[1]) : null; }
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
  function open(html, instant){ ensure(); place(); sh.innerHTML='<div class="sk-grab"></div><button type="button" class="sk-x" data-close aria-label="Закрыть">'+I.x+'</button>'+html;
    if (instant){ sh.classList.add('no-anim'); scrim.classList.add('no-anim'); }
    requestAnimationFrame(function(){ sh.classList.add('on'); scrim.classList.add('on'); }); }
  function close(){ if (!sh) return; sh.classList.remove('on','no-anim'); scrim.classList.remove('on','no-anim'); }
  addEventListener('resize', place);

  var view = { pet:'raccoon', back:false };
  function partSheet(id, instant){
    var p = partById(id), s = p.set, have = !!S.own[p.id], can = bal() >= p.price, n = owned(s);
    var act = have ? (S.worn===s.id ? '<button class="sk-btn sk-btn--ghost" disabled>'+I.check+'Надето</button>' : '<button class="sk-btn sk-btn--soft" data-wear="'+s.id+'">Надеть</button>')
      : '<button class="sk-btn '+(can?'sk-btn--buy':'sk-btn--off')+'" '+(can?'data-buy="'+p.id+'"':'disabled')+'>'+(can?'Купить за ':'')+coin(22)+'<span class="cx-num">'+fmt(p.price)+'</span></button>';
    open('<div class="sk-ps sk-tone--'+s.tone+'">'+
      '<div class="sk-stage"><img src="'+p.img+'" alt=""><span class="sk-stage-note">на еноте · ст. 1</span></div>'+
      '<div class="sk-meta">'+rchip(s)+'<span class="sk-slot">'+SLOT[p.slot]+'</span></div>'+
      '<h3 class="sk-h">'+p.name+'</h3><p class="sk-desc">'+p.desc+'</p>'+
      '<button type="button" class="sk-setrow" data-set="'+s.id+'"><span class="sk-setrow-t"><small>Часть набора · '+n+' из 4</small><b>«'+s.name+'»</b></span>'+
        '<span class="sk-minis">'+s.parts.map(function(q){ return '<span class="sk-mini'+(S.own[q.id]?' on':'')+(q.id===p.id?' cur':'')+'"><img src="'+q.img+'" alt=""></span>'; }).join('')+'</span>'+
        '</button>'+
      '<div class="sk-fill"></div>'+
      '<div class="sk-buyrow">'+(have?'<span class="sk-have">'+I.check+'Уже в коллекции</span>':'<span class="sk-pr"><small>Часть отдельно</small>'+stub()+'</span>')+act+'</div>'+
    '</div>', instant);
  }
  function setSheet(id, instant){
    var s = setById(id), n = owned(s), sp = setPrice(s), done = n===4, can = bal() >= sp.price;
    if (!s.pets[view.pet]) view.pet = 'raccoon';
    var img = petImg(s, view.pet, view.back);
    var pets = PET_ORDER.map(function(k){ var ok = !!s.pets[k], st = ok ? s.pets[k][0] : 1;
      return '<button type="button" class="sk-pet'+(k===view.pet?' on':'')+(ok?'':' no')+'" '+(ok?'data-pet="'+k+'"':'disabled')+' aria-label="'+PET[k]+'"><img src="'+petThumb(k, ok?st:1)+'" alt="">'+(ok?'':'<i>'+I.lock+'</i>')+'<span class="sk-pet-n">'+PET[k]+'</span>'+'</button>'; }).join('');
    var act = done ? (S.worn===s.id ? '<button class="sk-btn sk-btn--ghost" disabled>'+I.check+'Надето</button>' : '<button class="sk-btn sk-btn--soft" data-wear="'+s.id+'">Надеть набор</button>')
      : '<button class="sk-btn '+(can?'sk-btn--buy':'sk-btn--off')+'" '+(can?'data-buyset="'+s.id+'"':'disabled')+'>'+coin(22)+'<span class="cx-num">'+fmt(sp.price)+'</span></button>';
    var lbl = done ? '<span class="sk-have">'+I.check+'Набор собран</span>' :
      '<span class="sk-pr"><small>'+(n?'Докупить '+sp.n+' '+(sp.n===1?'часть':'части'):'Весь набор')+' · <s class="cx-num">'+fmt(sp.full)+'</s></small>'+stub()+'</span>';
    open('<div class="sk-ss sk-tone--'+s.tone+'">'+
      '<div class="sk-stage big"><img src="'+img+'" alt="">'+
        (view.pet==='raccoon'?'<button type="button" class="sk-turn" data-turn aria-label="Повернуть">'+I.turn+'<span>'+(view.back?'Спереди':'Сзади')+'</span></button>':'')+
        '<span class="sk-stage-note">'+PET[view.pet]+' · ст. '+s.pets[view.pet][0]+'</span></div>'+
      '<div class="sk-pets">'+pets+'</div>'+
      '<div class="sk-meta">'+rchip(s)+'<span class="sk-slot">'+s.theme+'</span><span class="sk-cnt cx-num">'+n+'/4</span></div>'+
      '<h3 class="sk-h">'+s.name+'</h3>'+
      '<div class="sk-parts4">'+s.parts.map(function(q){ var hv=!!S.own[q.id]; return '<button type="button" class="sk-p4'+(hv?' on':'')+'" data-part="'+q.id+'"><img src="'+q.img+'" alt=""><span class="sk-p4-b">'+(hv?I.check:coin(14)+'<b class="cx-num">'+fmt(q.price)+'</b>')+'</span></button>'; }).join('')+'</div>'+
      '<div class="sk-fill"></div>'+
      '<div class="sk-buyrow">'+lbl+act+'</div>'+
    '</div>', instant);
  }
  function onSheetClick(e){
    var b;
    if (e.target.closest('[data-close]')) return close();
    if ((b=e.target.closest('[data-set]'))) return setSheet(b.dataset.set);
    if ((b=e.target.closest('[data-part]'))) return partSheet(b.dataset.part);
    if ((b=e.target.closest('[data-pet]'))){ view.pet=b.dataset.pet; view.back=false; return setSheet(cur()); }
    if (e.target.closest('[data-turn]')){ view.back=!view.back; return setSheet(cur()); }
    if ((b=e.target.closest('[data-buy]'))){ var p=partById(b.dataset.buy); if(!w.SHOP.spend(p.price)) return; S.own[p.id]=1; changed(); toast(p.name+' — в коллекции'); return partSheet(p.id); }
    if ((b=e.target.closest('[data-buyset]'))){ var s=setById(b.dataset.buyset), sp=setPrice(s); if(!w.SHOP.spend(sp.price)) return; s.parts.forEach(function(q){S.own[q.id]=1;}); changed(); toast('Набор «'+s.name+'» собран!'); return setSheet(s.id); }
    if ((b=e.target.closest('[data-wear]'))){ S.worn=b.dataset.wear; changed(); toast('Надето'); return setSheet(S.worn); }
  }
  function cur(){ var el=sh.querySelector('.sk-ss'); if(!el) return 'common'; var m=sh.innerHTML.match(/sk-tone--(ice|epic|leg)/); return {ice:'common',epic:'epic',leg:'legendary'}[m[1]]; }
  function toast(t){ if (T.toast) T.toast(t); }
  var listeners=[]; function changed(){ listeners.forEach(function(f){ f(); }); }
  function bal(){ return w.SHOP ? w.SHOP.bal() : 0; }

  w.SK = { SETS:SETS, SLOT:SLOT, PET:PET, PET_ORDER:PET_ORDER, S:S, I:I, fmt:fmt, owned:owned, setPrice:setPrice, petImg:petImg, petThumb:petThumb, stub:stub, pips:pips, rchip:rchip,
    partSheet:partSheet, setSheet:setSheet, close:close, view:view, onChange:function(f){ listeners.push(f); }, coin:coin, changed:changed, partById:partById, setById:setById, render:render };
})(window);
