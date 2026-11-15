/* Вкладка «Скины» · «Список наборов»: сверху самое редкое; каждый набор — карточка с прогрессом сбора, 4 частями в ряд и кнопкой «Весь набор». */
(function(){
  var host=document.getElementById('tab-skins');
  var ORDER=['legendary','epic','common'];
  function seg(s){ return '<span class="b-bar">'+s.parts.map(function(p){ return '<i class="'+(SK.S.own[p.id]?'on':'')+'"></i>'; }).join('')+'</span>'; }
  function card(s){ var n=SK.owned(s), sp=SK.setPrice(s);
    return '<section class="b-set sk-tone--'+s.tone+'">'+
      '<button type="button" class="b-top" data-open-set="'+s.id+'">'+
        '<span class="b-thumb"><img src="'+SK.petImg(s,SK.view.pet)+'" alt=""></span>'+
        '<span class="b-info">'+SK.rchip(s)+'<b class="b-name">'+s.name+'</b><small class="b-theme">'+s.theme+'</small>'+
          '<span class="b-prog">'+seg(s)+'<span class="cx-num">'+(n===4?'Собран':n+' из 4')+'</span></span></span>'+
        '<span class="b-go">'+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'+'</span>'+
      '</button>'+
      '<div class="b-parts">'+s.parts.map(function(p){ var hv=!!SK.S.own[p.id];
        return '<button type="button" class="b-p'+(hv?' on':'')+'" data-open-part="'+p.id+'"><span class="b-pimg"><img src="'+SK.tileOf(p,SK.view.pet)+'" alt="">'+(hv?'<i>'+SK.I.check+'</i>':'')+'</span>'+
          '<span class="b-pslot">'+SK.SLOT[p.slot]+'</span>'+
          '<span class="b-pp">'+(hv?'<em>есть</em>':SK.coin(14)+'<b class="cx-num">'+SK.fmt(p.price)+'</b>')+'</span></button>'; }).join('')+'</div>'+
      '<div class="b-foot">'+(n===4?(SK.S.worn===s.id?'<span class="b-worn">'+SK.I.check+'Надето на питомце</span>':'<span class="b-worn off">В коллекции</span>')+'<button type="button" class="b-btn ghost" data-open-set="'+s.id+'">Примерить</button>'
        :'<span class="b-ftx"><small>'+(n?'Докупить '+sp.n+' '+(sp.n===1?'часть':'части'):'Весь набор сразу')+' · <s class="cx-num">'+SK.fmt(sp.full)+'</s></small></span>'+
         '<button type="button" class="b-btn'+((window.SHOP&&SHOP.bal()<sp.price)?' off':'')+'" data-open-set="'+s.id+'">'+SK.coin(18)+'<b class="cx-num">'+SK.fmt(sp.price)+'</b></button>')+'</div>'+
    '</section>'; }
  function paint(){
    host.innerHTML='<div class="b-head"><b>Наборы скинов</b><span class="b-sub">Собирай по частям или сразу целиком · подходят всем питомцам</span>'+
      '<span class="b-legend">'+SK.stub()+'<span>все цены пока не утверждены</span></span></div>'+
      ORDER.map(function(id){ return card(SK.setById(id)); }).join('');
  }
  host.addEventListener('click',function(e){ var b;
    if((b=e.target.closest('[data-open-set]'))) return SK.setSheet(b.dataset.openSet);
    if((b=e.target.closest('[data-open-part]'))) return SK.partSheet(b.dataset.openPart); });
  SK.onChange(paint); paint();
  /* вкладки «Бусты / Скины»: ?tab=skins или #skins / #part-<id> / #set-<id> открывают «Скины» */
  var tabs=document.getElementById('shoptabs');
  function go(t){ [].forEach.call(tabs.querySelectorAll('[data-t]'),function(x){x.classList.toggle('on',x.dataset.t===t)});
    document.getElementById('tab-boosts').hidden=t!=='boosts'; host.hidden=t!=='skins'; }
  tabs.addEventListener('click',function(e){ var x=e.target.closest('[data-t]'); if(x) go(x.dataset.t); });
  if(window.SHOP&&SHOP.onBal) SHOP.onBal(function(){ paint(); });
  var h=location.hash.slice(1), m, pm=location.search.match(/[?&]pet[=-](\w+)/);
  if(pm) SK.view.pet=pm[1];
  go(/[?&]tab=skins/.test(location.search)||/^(skins|part-|set-)/.test(h)?'skins':'boosts');
  setTimeout(function(){ /* после nav.js — чтобы шторка мерила реальный таб-бар */
    if((m=h.match(/^part-(\w+)$/))) SK.partSheet(m[1],true);
    /* #set-<id> или #set-<id>.<часть>.<часть> — окно набора с уже выбранными для примерки частями */
    if((m=h.match(/^set-(\w+?)((?:\.\w+)*)$/))){ SK.setSheet(m[1],true); m[2].split('.').filter(Boolean).forEach(function(i){ SK.view.sel[i]=1; }); if(m[2]) SK.setSheet(m[1],true); } },0);
})();
