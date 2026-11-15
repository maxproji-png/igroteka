/* Б «Стекло»: компактная стеклянная карточка на цветных пятнах в цвет клана, статистика плитками с мини-полосками.
   Шторка «О клане» — карточки-строки; подтверждение выхода — диалог по центру поверх шторки. */
window.CXC = (function(){
  var X = CX, c = X.clan, I = X.I;
  var seatPct = Math.round(c.members / c.cap * 100);
  function header(){
    return '<div class="b-blobs" aria-hidden="true"><i></i><i></i><i></i></div>'+
    '<div class="b-card">'+
      '<div class="b-row"><span class="b-crest">'+X.badge('b-emb')+'<span class="b-lvl cx-num">'+c.lvl+'</span></span>'+
        '<span class="b-t"><b>'+c.name+'</b><small>Твой клан · глава '+c.owner+'</small></span>'+
        '<button class="b-more tap" id="more" aria-label="О клане">'+T.IC.dots+'</button></div>'+
      '<div class="b-tiles">'+
        '<div class="b-tl"><small>Уровень</small><b class="cx-num">'+c.lvl+'<em>→ '+(c.lvl+1)+'</em></b><span class="b-mini"><i style="width:'+c.pct+'%"></i></span></div>'+
        '<div class="b-tl"><small>Места</small><b class="cx-num">'+c.members+'<em>/'+c.cap+'</em></b><span class="b-mini v"><i style="width:'+seatPct+'%"></i></span></div>'+
        '<div class="b-tl"><small>В сети</small><b class="cx-num"><i class="b-dot"></i>'+c.online+'</b><span class="cx-heads b-heads">'+X.heads(3)+'</span></div>'+
      '</div>'+
    '</div>';
  }
  function segs(){ var n=10, f=c.wins/c.nextWins*n, o=''; for(var i=0;i<n;i++){ var w=Math.max(0,Math.min(1,f-i)); o+='<i><b style="width:'+(w*100)+'%"></b></i>'; } return o; }
  function about(){
    var owner = (T.c3 ? T.c3.members.filter(function(m){return m.owner;})[0] : null);
    return '<div class="cx-grab"></div><button type="button" class="cx-x" data-cx-close aria-label="Закрыть">'+I.x+'</button>'+
      '<div class="b-s">'+
        '<div class="b-shead">'+X.badge('b-semb')+'<span class="b-t"><b>'+c.name+'</b><small>Твой клан</small></span></div>'+
        '<div class="b-lvcard"><div class="b-lvtop"><span class="b-lvbig cx-num">'+c.lvl+'</span><span class="b-lvtx"><b>Уровень клана</b><small>'+c.wins+' из '+c.nextWins+' побед до '+(c.lvl+1)+'-го</small></span></div>'+
          '<span class="b-segs">'+segs()+'</span>'+
          '<span class="b-next">'+I.gift+'<span>На '+(c.lvl+1)+'-м уровне — <b>'+c.nextCap+' мест</b></span></span></div>'+
        '<div class="b-list">'+
          '<div class="b-li"><span class="b-li-ic">'+I.crown+'</span><span class="b-li-l">Глава</span><span class="b-li-r">'+(owner&&window.TAP_petThumb?'<span class="cx-head"><img src="'+TAP_petThumb(owner.pet,owner.lvl)+'" alt=""></span>':'')+c.owner+'</span></div>'+
          '<div class="b-li"><span class="b-li-ic">'+I.ppl+'</span><span class="b-li-l">Участники</span><span class="b-li-r cx-num">'+c.members+' из '+c.cap+'</span></div>'+
          '<div class="b-li"><span class="b-li-ic g"><i class="b-dot"></i></span><span class="b-li-l">Сейчас в сети</span><span class="b-li-r cx-num">'+c.online+'</span></div>'+
        '</div>'+
        '<div class="b-fill"></div>'+
        '<button type="button" class="cx-btn b-leave tap" id="cx-leave">'+I.exit+'Покинуть клан</button>'+
      '</div>';
  }
  function confirm(){
    return '<span class="b-dl-ic">'+I.exit+'</span>'+
      '<h3 class="b-dl-h">Покинуть клан?</h3>'+
      '<p class="b-dl-p">Ты выйдешь из клана <b class="nm">«'+c.name+'»</b>. Вклад <b class="cx-num">'+X.fmt(c.my)+'</b> останется клану, а сундуки этой недели ты не получишь.</p>'+
      '<button type="button" class="cx-btn cx-btn--danger tap" data-leave-ok>Покинуть</button>'+
      '<button type="button" class="cx-btn cx-btn--soft b-dl-no tap" data-cx-dlg-close>Отмена</button>';
  }
  function bind(el){
    var l = el.querySelector('#cx-leave'); if (l && !l._b){ l._b=1; l.addEventListener('click', function(){ X.dialog(confirm()); }); }
    var ok = el.querySelector('[data-leave-ok]'); if (ok && !ok._b){ ok._b=1; ok.addEventListener('click', X.left); }
  }
  function paint(){
    var el = document.getElementById('hdr');
    if (!el) return;
    el.innerHTML = header();
    var more = document.getElementById('more');
    if (more) more.addEventListener('click', function(){ X.open(about(),'b-sheet'); });
  }
  function init(){
    X.onOpen = bind;
    paint();
    var h = location.hash;
    if (h === '#about') X.open(about(),'b-sheet',true);
    if (h === '#leave'){ X.open(about(),'b-sheet',true); X.dialog(confirm(),true); }
  }
  return { init: init, paint: paint };
})();
