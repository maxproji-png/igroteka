/* Магазин · бусты новой экономики: данные, карточки, шторка покупки (демо).
   Цены и эффекты — из задания владелицы. Лимит офлайн-добычи и сумма нехватки не показываются (по просьбе владелицы). */
(function(){
var T=window.T,BAL_KEY='tapyshi.shop.boosts';
var BOOSTS=[
  {id:'tap',n:'Сила тапа',d:'Больше монет за каждый тап',lv:[{v:'1',p:0},{v:'2',p:3000},{v:'3',p:15000}],unit:'coin-tap'},
  {id:'energy',n:'Запас энергии',d:'Больше энергии в шкале',lv:[{v:'200',p:0},{v:'250',p:2000},{v:'300',p:10000}],unit:'energy'},
  {id:'regen',n:'Восстановление энергии',d:'Шкала заполняется быстрее',lv:[{v:'10',p:0},{v:'5',p:10000}],unit:'regen'},
  {id:'offline',n:'Офлайн-добыча',d:'Монеты копятся, пока тебя нет',lv:[{v:'0,05',p:0},{v:'0,1',p:10000},{v:'0,2',p:30000}],unit:'offline'}
];
/* демо: баланс 4 200 → видны все три состояния */
var DEMO={bal:4200,lv:{tap:1,energy:2,regen:2,offline:2}};
var S=JSON.parse(JSON.stringify(DEMO));
if(window.TapyshiBal) S.bal=window.TapyshiBal.get();
var BOLT='<svg class="bolt" width="14" height="14" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M13.5 2 L4.5 13.5 H11 L9.8 22 L19.5 9.8 H13 Z" style="fill:var(--sun);stroke:var(--sun-edge)" stroke-width="1.8" stroke-linejoin="round"/></svg>';
var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"/></svg>';
var ARR='<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 H18 M13 6 L19 12 L13 18"/></svg>';
function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0');}
function coin(px){return T.coin('',px||16);}
function word(n){n=+String(n).replace(',','.');return n===1?'монета':(n>=2&&n<=4)?'монеты':'монет';}
/* эффект: from/to — индексы уровней; to=null → только текущий */
function eff(b,f,t,px){var A=b.lv[f],B=t!=null?b.lv[t]:null,v=function(x,cls){return '<b'+(cls?' class="'+cls+'"':'')+'>'+x.v+'</b>'},ar='<span class="ar">→</span>';
  var mid=B?v(A)+ar+v(B,'to'):v(A),sub='';
  if(b.unit==='coin-tap') mid+='<span class="unit">'+coin(px||16)+' за тап</span>';
  if(b.unit==='energy'){mid+=BOLT;sub='максимум энергии';}
  if(b.unit==='regen'){mid+='<span class="unit">мин</span>';sub='полная шкала';}
  if(b.unit==='offline'){mid+='<span class="unit">'+coin(px||16)+' в сек.</span>';}
  return {mid:mid,sub:sub};}
function state(b,lv,bal){if(lv>=b.lv.length)return 'max';return bal>=b.lv[lv].p?'buy':'lack';}
function card(b,lv,bal){var st=state(b,lv,bal),max=b.lv.length,e=st==='max'?eff(b,lv-1):eff(b,lv-1,lv),act;
  if(st==='max') act='<span class="maxchip">'+CHECK+'Максимум</span>';
  else if(st==='buy') act='<span class="btn btn--primary price" data-buy="'+b.id+'">'+coin()+fmt(b.lv[lv].p)+'</span>';
  else act='<span class="btn price" data-buy="'+b.id+'" aria-disabled="true">'+coin()+fmt(b.lv[lv].p)+'</span>';
  var pips='';for(var i=0;i<max;i++)pips+='<i'+(i<lv?' class="on"':'')+'></i>';
  return '<button type="button" class="bc st-'+st+'" data-id="'+b.id+'" aria-label="'+b.n+', уровень '+lv+' из '+max+'">'+
    '<span class="bc-ico">'+BA.svg(b.id,lv,{badge:1,max:lv===max})+'</span>'+
    '<b class="bc-nm">'+b.n+'</b><span class="bc-tx"><span class="pips">'+pips+'<span>'+(st==='max'?'ур. '+lv+' · макс.':'ур. '+lv+' из '+max)+'</span></span>'+
    '<span class="eff">'+e.mid+'</span>'+(e.sub?'<span class="eff-sub">'+e.sub+'</span>':'')+'</span>'+
    '<span class="bc-act">'+act+'</span></button>';}
function byId(id){for(var i=0;i<BOOSTS.length;i++)if(BOOSTS[i].id===id)return BOOSTS[i];}
function sheet(id){var b=byId(id),lv=S.lv[id],max=b.lv.length,st=state(b,lv,S.bal);
  var top=st==='max'?'<span class="b">'+BA.svg(id,lv,{badge:1,max:1})+'</span>':'<span class="a">'+BA.svg(id,lv,{badge:1})+'</span>'+ARR+'<span class="b">'+BA.svg(id,lv+1,{badge:1,max:lv+1===max})+'</span>';
  var e=st==='max'?eff(b,lv-1,null,22):eff(b,lv-1,lv,22);
  var rows=b.lv.map(function(L,i){var ee=eff(b,i),cls=i<lv?'have':i===lv?'next':'';
    return '<li class="'+cls+'"><b>Ур. '+(i+1)+'</b><span class="val">'+ee.mid.replace(/<b[^>]*>/g,'').replace(/<\/b>/g,'')+'</span><span class="p">'+(i===0?'старт':i<lv?CHECK.replace('<svg','<svg class="tick" width="14" height="14"')+'есть':coin(14)+fmt(L.p))+'</span></li>'}).join('');
  var btn=st==='max'?'<button class="btn btn--secondary btn--m btn--wide" disabled>Всё куплено</button>':
    st==='buy'?'<button class="btn btn--primary btn--l" data-confirm="'+id+'">Купить за '+coin(20)+fmt(b.lv[lv].p)+'</button>':
    '<button class="btn btn--l" disabled>'+coin(20)+fmt(b.lv[lv].p)+'</button>';
  var after=st==='buy'?'<p class="after">Баланс после покупки: '+fmt(S.bal-b.lv[lv].p)+'</p>':'';
  T.sheet('<div class="bs"><div class="bs-top">'+top+'</div><h3>'+b.n+'</h3><p class="sub">'+(st==='max'?'Максимальный уровень · '+b.d.toLowerCase():'Ур. '+lv+' → ур. '+(lv+1)+' · '+b.d.toLowerCase())+'</p>'+
    '<div class="big">'+e.mid+'</div>'+(e.sub?'<p class="sub" style="margin-top:-4px">'+e.sub+'</p>':'')+'<ul class="lvl">'+rows+'</ul>'+btn+after+'</div>');
  setTimeout(function(){var c=document.querySelector('[data-confirm]');if(c)c.addEventListener('click',function(){buy(id)});},0);}
function closeSheet(){if(T.closeSheet)return T.closeSheet();var bg=document.querySelector('.sheet-bg'),sh=document.querySelector('.sheet');if(bg)bg.classList.remove('on');if(sh)sh.classList.remove('on');}
function buy(id){var b=byId(id),lv=S.lv[id];if(lv>=b.lv.length||S.bal<b.lv[lv].p)return;
  if(window.TapyshiBal){if(!window.TapyshiBal.spend(b.lv[lv].p))return;S.bal=window.TapyshiBal.get();}
  else S.bal-=b.lv[lv].p;S.lv[id]=lv+1;closeSheet();render();
  var c=document.querySelector('.bc[data-id="'+id+'"]');if(c){c.classList.add('bump');}
  if(T.toast)T.toast(b.n+' — ур. '+(lv+1)+'!');}
var host,balEl;
var balFns=[];
function render(){balFns.forEach(function(f){f(S.bal)});if(balEl)balEl.innerHTML=coin(24)+'<span class="num">'+fmt(S.bal)+'</span>';
  if(host)host.innerHTML=BOOSTS.map(function(b){return card(b,S.lv[b.id],S.bal)}).join('');}
window.SHOP={BOOSTS:BOOSTS,card:card,state:state,
  mount:function(h,bal){host=h;balEl=bal;render();
    h.addEventListener('click',function(e){var c=e.target.closest('.bc');if(c)sheet(c.dataset.id);});
    var m=(location.hash||'').match(/^#buy-(\w+)$/);if(m&&byId(m[1]))setTimeout(function(){sheet(m[1])},300);},
  reset:function(){var bal=window.TapyshiBal?window.TapyshiBal.get():S.bal;S=JSON.parse(JSON.stringify(DEMO));S.bal=bal;render();},
  /* общий баланс магазина — его же тратит вкладка «Скины» (skins/skins.js) */
  bal:function(){if(window.TapyshiBal) S.bal=window.TapyshiBal.get();return S.bal;},
  spend:function(n){if(window.TapyshiBal){if(!window.TapyshiBal.spend(n))return false;S.bal=window.TapyshiBal.get();render();return true;}if(S.bal<n)return false;S.bal-=n;render();return true;},
  onBal:function(f){balFns.push(f);}};
if(window.TapyshiBal) window.TapyshiBal.on(function(n){if(S.bal===n)return;S.bal=n;render();});
})();
