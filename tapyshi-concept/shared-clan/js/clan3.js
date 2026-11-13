/* Клан · раунд 3 — общие данные и списки (участники / топ кланов / чат) и вкладки.
   Награды и вклад — заглушки макета; трофеи топ-3 = 60/40/20; приглашение друга в концепте — +5000 пригласившему за первый вход по ссылке. */
(function(){
var C = T.c3 = {};
C.goal = { now: 1240560, goal: 1500000, left: '2 д 14 ч', place: 3,
  ms: [ { at: 500000, lbl: '500 тыс', rw: '+200', icon: 'coin', txt: '+200 монет каждому' },
        { at: 1000000, lbl: '1 млн', rw: '+500', icon: 'coin', txt: '+500 монет каждому' },
        { at: 1500000, lbl: '1,5 млн', rw: 'Сундук', icon: 'chest', txt: 'Сундук клана каждому' } ] };
C.members = [
  { n:'Макс', pet:'dragon', lvl:17, t:182400, on:1, owner:1 }, { n:'Алина', pet:'goose', lvl:14, t:156900, on:1 },
  { n:'Дима', pet:'raccoon', lvl:12, t:131250, on:1, me:1 }, { n:'Соня', pet:'capybara', lvl:11, t:98700 },
  { n:'Артём', pet:'raccoon', lvl:9, t:87300, on:1 }, { n:'Виктория-Анастасия', pet:'dragon', lvl:8, t:74100 },
  { n:'Егор', pet:'capybara', lvl:7, t:61800, on:1 }, { n:'Лиза', pet:'goose', lvl:6, t:48200 },
  { n:'Никита', pet:'dragon', lvl:5, t:39600 }, { n:'Оля', pet:'capybara', lvl:4, t:27900, on:1 } ];
C.restN = 17; C.restT = 332410;
/* цвета вклада — только палитра: оттенки фиолетового, «ты» — жёлтым */
C.colors = ['var(--violet-edge)','var(--violet)','var(--sun)','color-mix(in srgb,var(--violet) 60%,var(--white))','color-mix(in srgb,var(--violet) 40%,var(--white))'];
C.rest = 'color-mix(in srgb,var(--violet) 18%,var(--white))';
C.top = [
  { n:'Котики-ниндзя', pet:'dragon', lvl:3, m:48, t:1980400 }, { n:'Пушистый отряд', pet:'goose', lvl:3, m:46, t:1612300 },
  { n:'Дикий зоопарк', pet:'raccoon', lvl:2, m:27, t:1240560, me:1 }, { n:'Ёжики в тумане', pet:'capybara', lvl:2, m:31, t:1104900 },
  { n:'Хомяки-силачи', pet:'dragon', lvl:2, m:25, t:987200 }, { n:'Совы не спят', pet:'goose', lvl:1, m:19, t:842010 },
  { n:'Лапки вверх', pet:'capybara', lvl:1, m:22, t:760300 } ];
C.chat = [
  { day:'Сегодня' },
  { sys:'Соня вступила в клан' },
  { n:'Макс', owner:1, pet:'dragon', tm:'12:04', tx:'Всем привет! До сундука осталось совсем чуть-чуть' },
  { n:'Алина', pet:'goose', tm:'12:10', tx:'Я сегодня 20 тысяч натапала 🙌' },
  { sys:'Клан прошёл 1 млн тапов — всем по +500 монет' },
  { n:'Егор', pet:'capybara', tm:'13:22', tx:'Котики-ниндзя опять впереди, давайте поднажмём' },
  { me:1, tm:'13:25', tx:'Вечером догоню!' } ];
var H = function(p){ return T.img('pets/'+p+'_happy_head.png'); };
C.head = H;
C.pct = function(){ return Math.round(C.goal.now / C.goal.goal * 100); };
C.ava = function(p, cls){ return '<span class="ava '+p+' '+(cls||'')+'"><img src="'+H(p)+'" alt=""></span>'; };
C.inviteRow = function(lbl){ return '<button class="inv-row tap" data-invite><span class="max-ic big">'+T.IC.max+'</span><span class="tx"><b>'+(lbl||'Позвать друга')+'</b><small>через MAX · +5000 🪙 за первый вход</small></span><span class="go">'+T.IC.chev+'</span></button>'; };
C.members_ = function(o){ o=o||{}; var max=C.members[0].t;
  return '<div class="list">'+C.members.map(function(m,i){
    var bar = o.bars ? '<span class="cbar"><i style="width:'+(m.t/max*100).toFixed(1)+'%;background:'+(i<5?C.colors[i]:C.rest)+'"></i></span>' : '';
    var share = o.bars ? '<small class="share">'+(m.t/C.goal.now*100).toFixed(1).replace('.',',')+'%</small>' : '';
    return '<div class="row tap'+(m.me?' me':'')+'">'+(o.rank?'<span class="rk r'+(i+1)+'">'+(i+1)+'</span>':'')+
      '<span class="avw">'+C.ava(m.pet,'sm')+(m.on?'<i class="on-dot"></i>':'')+'</span>'+
      '<span class="nm"><b>'+(m.me?'Ты':m.n)+(m.owner?' '+T.IC.crown:'')+'</b>'+(o.bars?bar:'<small>ур. '+m.lvl+(m.owner?' · глава':'')+'</small>')+'</span>'+
      '<span class="val"><b class="num">'+T.fmt(m.t)+'</b>'+(o.bars?share:'<small>тапов</small>')+'</span></div>';
  }).join('')+(C.restN?'<div class="row more tap"><span class="nm"><b>Ещё '+C.restN+' участников</b><small>'+T.fmt(C.restT)+' тапов вместе</small></span><span class="go">'+T.IC.chev+'</span></div>':'')+'</div>';
};
var topEmb = function(c){
  if (c.icon && window.ClanCreate) {
    var col = ClanCreate.colorBy(c.color), ic = ClanCreate.iconBy(c.icon);
    return '<span class="emb sm clan-badge" style="'+ClanCreate.badgeStyle(col)+'">'+ClanCreate.svg(ic)+'</span>';
  }
  return '<span class="emb sm e-'+c.pet+'"><img src="'+H(c.pet)+'" alt=""></span>';
};
C.top_ = function(){
  return '<div class="prize"><span class="cap">Трофеи недели</span><span class="chip chip--sun">'+T.IC.cup+'1 место — <b>60</b></span><span class="chip chip--sun">2 — <b>40</b></span><span class="chip chip--sun">3 — <b>20</b></span></div><div class="list">'+C.top.map(function(c,i){
    return '<div class="row tap'+(c.me?' me':'')+'"><span class="rk r'+(i+1)+'">'+(i+1)+'</span>'+topEmb(c)+''+
      '<span class="nm"><b>'+c.n+'</b><small>ур. '+c.lvl+' · '+c.m+' игроков</small></span><span class="val"><b class="num">'+T.short(c.t)+'</b><small>за неделю</small></span></div>';
  }).join('')+'</div><p class="foot">Неделя закончится через '+C.goal.left+'</p>';
};
C.chat_ = function(){
  return '<div class="chat">'+(C.chatHead||'')+C.chat.map(function(m){
    if(m.day) return '<div class="day">'+m.day+'</div>';
    if(m.sys) return '<div class="sys">'+m.sys+'</div>';
    if(m.me) return '<div class="msg me"><div class="bub">'+m.tx+'<time>'+m.tm+'</time></div></div>';
    return '<div class="msg">'+C.ava(m.pet,'xs')+'<div class="bub"><b>'+m.n+(m.owner?T.IC.crown:'')+'</b>'+m.tx+'<time>'+m.tm+'</time></div></div>';
  }).join('')+'</div>';
};
C.chatbar = function(){ return '<div class="chatbar"><input placeholder="Сообщение клану…"><button class="snd tap">'+T.IC.send.replace('M12 15 V3 M7 8 L12 3 L17 8"/><path d="M5 12 V19 Q5 21 7 21 H17 Q19 21 19 19 V12','M12 19 V5 M6 11 L12 5 L18 11')+'</button></div>'; };
/* вкладки: [data-tab] кнопки внутри tabsEl, панель #panel. hash #top / #chat открывает сразу */
C.tabs = function(tabsEl, opts){ opts=opts||{}; var app=document.querySelector('.app'), panel=document.getElementById('panel'), sc=document.querySelector('.scroll');
  var R={ members:function(){return (opts.members||C.members_)();}, top:C.top_, chat:C.chat_ };
  function go(k, anim){ [].forEach.call(tabsEl.querySelectorAll('[data-tab]'),function(b){b.classList.toggle('on',b.dataset.tab===k)});
    if(opts.onTab) opts.onTab(k);
    panel.innerHTML=R[k](); app.classList.toggle('is-chat',k==='chat');
    if(k==='chat'){ var b=tabsEl.querySelector('[data-tab=chat] .tb-badge'); if(b) b.remove(); }
    if(anim){ panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
    if(k==='chat' && sc) setTimeout(function(){ sc.scrollTop=sc.scrollHeight; },anim?30:0);
    bind(); }
  function clanShare(){
    if(/empty=1/.test(location.search)) return {};
    if(window.ClanCreate && /mine=1/.test(location.search)){
      var c=ClanCreate.load();
      if(c) return {clan:{id:'new',name:c.name}};
    }
    return {clan:{id:1,name:(T.clan&&T.clan.name)||'Дикий зоопарк'}};
  }
  function bind(){ [].forEach.call(document.querySelectorAll('[data-invite]'),function(b){ if(b._b) return; b._b=1; b.addEventListener('click',function(){
    if(window.TapInvite) TapInvite.share(clanShare());
    else T.toast('Ссылка-приглашение открыта в MAX');
  }); }); }
  tabsEl.addEventListener('click',function(e){ var b=e.target.closest('[data-tab]'); if(b) go(b.dataset.tab,true); });
  var h=(location.hash||'').slice(1); go(R[h]?h:'members',false);
  app.insertAdjacentHTML('beforeend',C.chatbar());
};

/* Сундуки на шкале цели недели — каждый открывает свою шторку с наградами (демо). */
C.chests = [
  { id:'c500', at:500000, lbl:'500 тыс', title:'Сундук 500 000', img:'chest-wood.png',
    cond:'Клан натапал 500 000',
    who:'Каждому участнику, который внёс вклад на этой неделе',
    defaultClaimed:1,
    rewards:[{k:'coin',n:'Монеты',a:'+200'}] },
  { id:'c1m', at:1000000, lbl:'1 млн', title:'Сундук 1 000 000', img:'chest-star.png',
    cond:'Клан натапал 1 000 000',
    who:'Каждому участнику, который внёс вклад на этой неделе',
    rewards:[{k:'coin',n:'Монеты',a:'+500'}] },
  { id:'c15', at:1500000, lbl:'1,5 млн', title:'Сундук клана', img:'chest-gold.png',
    cond:'Клан натапал 1 500 000',
    who:'Каждому, кто натапал не меньше 1 000 за эту неделю',
    rewards:[
      {k:'coin',n:'Монеты',a:'+2 000'},
      {k:'bolt',n:'Энергия',a:'полная шкала'},
      {k:'xp',n:'Опыт клана',a:'+50 XP'},
      {k:'rare',n:'Цвет ника «Солнечный»',a:'1 шт'}
    ] }
];
C._claimed = null;
C.claimedMap = function(){
  if(C._claimed) return C._claimed;
  try{ C._claimed = JSON.parse(sessionStorage.getItem('tapyshi.clan.chests')||'{}'); }
  catch(e){ C._claimed = {}; }
  return C._claimed;
};
C.chestState = function(ch){
  var m=C.claimedMap();
  if(m[ch.id]==='claimed') return 'claimed';
  if(m[ch.id]==='ready') return 'ready';
  if(C.goal.now >= ch.at){
    if(ch.defaultClaimed && m[ch.id]!=='ready') return 'claimed';
    return 'ready';
  }
  return 'locked';
};
C.markClaimed = function(id){
  var m=C.claimedMap(); m[id]='claimed'; C._claimed=m;
  try{ sessionStorage.setItem('tapyshi.clan.chests', JSON.stringify(m)); }catch(e){}
};
function rwIcon(k){
  if(k==='coin') return T.coin ? T.coin('rw-ico') : '<span class="rw-ph">🪙</span>';
  if(k==='bolt') return '<span class="rw-svg bolt">'+T.IC.bolt+'</span>';
  if(k==='xp') return '<span class="rw-svg xp">'+T.IC.shield+'</span>';
  return '<span class="rw-svg rare"><svg viewBox="0 0 24 24"><path d="M12 3.5 L14.4 9.2 L20.5 10 L16 14.3 L17.2 20.4 L12 17.4 L6.8 20.4 L8 14.3 L3.5 10 L9.6 9.2Z" fill="#FFC93D" stroke="#E39200" stroke-width="1.4" stroke-linejoin="round"/></svg></span>';
}
function stLabel(s){ return s==='claimed'?'Получен':s==='ready'?'Можно забрать':'Закрыт'; }
C.chestSheet = function(id){
  var ch, i; for(i=0;i<C.chests.length;i++) if(C.chests[i].id===id) ch=C.chests[i];
  if(!ch) return;
  var st=C.chestState(ch), now=C.goal.now, need=ch.at, left=Math.max(0, need-now);
  var chip='<span class="ch-st '+st+'">'+stLabel(st)+'</span>';
  var rewards=ch.rewards.map(function(r){
    return '<li class="rw'+(r.k==='rare'?' is-rare':'')+'">'+rwIcon(r.k)+'<span class="rw-n">'+r.n+(r.k==='rare'?' <em>редкая награда</em>':'')+'</span><b>'+(r.k==='rare'?'':'')+r.a+'</b></li>';
  }).join('');
  var cta='';
  if(st==='ready') cta='<button type="button" class="btn btn--primary btn--l" data-claim="'+ch.id+'">Забрать</button>';
  else if(st==='claimed') cta='<button type="button" class="btn btn--secondary btn--m btn--wide" disabled>Уже получен</button>';
  else cta='<button type="button" class="btn btn--secondary btn--m btn--wide" disabled>Пока закрыт</button>';
  var html='<div class="chest-sheet" data-chest-sheet="'+ch.id+'">'+
    '<div class="cs-head"><img src="'+T.img('v2/'+ch.img)+'" alt=""><div><h3>'+ch.title+'</h3>'+chip+'</div></div>'+
    '<p class="cs-demo">цифры и состав — демо макета</p>'+
    '<ul class="rw-list">'+rewards+'</ul>'+
    '<div class="cs-meta"><div><small>Как открыть</small><b>'+ch.cond+'</b><span>'+(st==='locked'?'Ещё '+T.fmt(left)+' тапов · сейчас '+T.fmt(now):'Цель выполнена: '+T.fmt(Math.min(now,need))+' / '+T.fmt(need))+'</span></div>'+
    '<div><small>Кто получает</small><b>'+ch.who+'</b></div></div>'+cta+'</div>';
  T.sheet(html);
  setTimeout(function(){
    var btn=document.querySelector('[data-claim="'+ch.id+'"]');
    if(!btn) return;
    btn.addEventListener('click', function(){
      C.markClaimed(ch.id);
      C.paintMilestones();
      if(T.toast) T.toast(ch.rewards[0].a+' — сундук получен');
      C.chestSheet(ch.id);
    });
  }, 0);
};
C.paintMilestones = function(){
  var host=document.getElementById('ms-rail');
  if(!host){
    var stack=document.getElementById('stack');
    if(!stack) return;
    host=document.createElement('div');
    host.id='ms-rail';
    host.className='ms-rail';
    stack.parentNode.insertBefore(host, stack);
  }
  var goal=C.goal.goal||1500000;
  host.innerHTML='<div class="ms-track">'+C.chests.map(function(ch){
    var pct=Math.min(100, ch.at/goal*100), st=C.chestState(ch);
    return '<button type="button" class="ms-ch st-'+st+'" style="left:'+pct+'%" data-chest="'+ch.id+'" aria-label="'+ch.title+', '+stLabel(st)+'">'+
      '<span class="ms-ico"><img src="'+T.img('v2/'+ch.img)+'" alt=""><i></i></span>'+
      '<small>'+ch.lbl+'</small></button>';
  }).join('')+'</div>';
  var big=document.querySelector('[data-chest-big], .ch-btn, .prog .ch');
  if(big && !big.closest('[data-chest]')){
    var wrap=big.closest('.ch-btn')||big;
    wrap.setAttribute('data-chest','c15');
    wrap.classList.add('ch-btn','st-'+C.chestState(C.chests[2]));
  }
  if(!C._chestBound){
    C._chestBound=1;
    document.addEventListener('click', function(e){
      var b=e.target.closest('[data-chest]');
      if(!b) return;
      e.preventDefault();
      C.chestSheet(b.getAttribute('data-chest'));
    });
  }
};
})();
