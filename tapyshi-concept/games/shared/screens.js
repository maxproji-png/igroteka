window.TAP=window.TAP||{};
/* Тапыши · Игры — экраны этапа 2: шторка дуэли, поиск, друг, найден, оболочка, итоги.
   Один рендерер для прототипа и для отдельных папок экранов: TAP.render({screen, game, mode, stake, outcome}). */
(function(){
var G=TAP_GAMES,P=TAP_PROPS,I=TAP_ICON;
var BASE=(window.TAP_BASE||'../shared/');
var ME={name:'Ты',petName:'Булочка',pet:'raccoon'};
/* соперник подписан именем игрока из MAX; бот — «Бот» */
var OPP={random:{name:'Кира',pet:'goose',tag:'игрок MAX'},bot:{name:'Бот',pet:'capybara',tag:'тренировка'},friend:{name:'Саша',pet:'dragon',tag:'друг из MAX'}};
var BAL=12000, STAKES=[300,500], DEF=300;
function pet(k,pose){return BASE+'pets/'+k+'_'+(pose||'neutral')+'.webp';}
function game(id){for(var i=0;i<G.length;i++)if(G[i].id===id)return G[i];return G[0];}
function sty(g){return '--c:'+g.c+';--cd:'+g.cd+';--bg1:'+g.bg1+';--bg2:'+g.bg2;}
function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');}
var COIN='<svg class="coin" viewBox="0 0 24 24"><circle cx="12" cy="12.8" r="10" class="ico-sun-edge"/><circle cx="12" cy="11.6" r="10" class="ico-sun"/><circle cx="12" cy="11.6" r="7.4" class="coin-in"/><g class="ico-white" opacity=".95"><ellipse cx="12" cy="13.6" rx="3" ry="2.4"/><circle cx="8.6" cy="10.6" r="1.25"/><circle cx="10.6" cy="8.6" r="1.25"/><circle cx="13.4" cy="8.6" r="1.25"/><circle cx="15.4" cy="10.6" r="1.25"/></g><path d="M5.6 7.6a7.6 7.6 0 0 1 5-3.4" class="ico-white-s" stroke-width="1.6" stroke-linecap="round" opacity=".6" fill="none"/></svg>';
var IC={
 x:'<svg viewBox="0 0 20 20"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
 back:'<svg viewBox="0 0 20 20"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 pause:'<svg viewBox="0 0 20 20"><rect x="5.5" y="4.5" width="3.2" height="11" rx="1.5" fill="currentColor"/><rect x="11.3" y="4.5" width="3.2" height="11" rx="1.5" fill="currentColor"/></svg>',
 sound:'<svg viewBox="0 0 20 20"><path d="M3.5 7.5h3l4-3.5v12l-4-3.5h-3z" fill="currentColor"/><path d="M13.5 7a4 4 0 0 1 0 6M15.6 5a7 7 0 0 1 0 10" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"/></svg>',
 globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".18"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
 max:'<svg viewBox="0 0 24 24"><path d="M12 3.5c5 0 8.5 3.4 8.5 7.8s-3.5 7.8-8.5 7.8c-1 0-2-.1-2.9-.4L5 20.5l1-3.6C4.3 15.5 3.5 13.5 3.5 11.3 3.5 6.9 7 3.5 12 3.5z" fill="currentColor"/><path d="M8.5 13.5l2-4 1.5 3 1.5-3 2 4" class="ico-white-s" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 bot:'<svg viewBox="0 0 24 24"><rect x="4" y="7.5" width="16" height="12" rx="5" fill="currentColor"/><circle cx="9.3" cy="13.4" r="1.7" class="ico-white"/><circle cx="14.7" cy="13.4" r="1.7" class="ico-white"/><path d="M12 7.5V4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="3.6" r="1.6" fill="currentColor"/></svg>',
 link:'<svg viewBox="0 0 20 20"><path d="M8.5 11.5a3.2 3.2 0 0 0 4.5 0l2.6-2.6a3.2 3.2 0 0 0-4.5-4.5l-1 1M11.5 8.5a3.2 3.2 0 0 0-4.5 0l-2.6 2.6a3.2 3.2 0 0 0 4.5 4.5l1-1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
 copy:'<svg viewBox="0 0 20 20"><rect x="6.5" y="6.5" width="10" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13.5 4.5a2 2 0 0 0-2-1.5H6a3 3 0 0 0-3 3v5.5a2 2 0 0 0 1.5 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
 check:'<svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.2L15 6.8" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 flag:'<svg viewBox="0 0 20 20"><path d="M5 17.5V3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5.5 4h9l-2 3.5 2 3.5h-9z" fill="currentColor"/></svg>',
 redo:'<svg viewBox="0 0 20 20"><path d="M15.5 9.5a5.5 5.5 0 1 1-1.8-4.1M15.5 3.5v3.8h-3.8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 home:'<svg viewBox="0 0 20 20"><path d="M3.5 9.5L10 4l6.5 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-4V17H4.5a1 1 0 0 1-1-1z" fill="currentColor"/></svg>'
};
TAP.ICONS=IC;TAP.COIN=COIN;

/* ---------- каталог (вариант A) ---------- */
function modeChip(g){return '<span class="mode '+g.mode+'">'+I[g.mode]+(g.mode==='duo'?'на двоих':'соло')+'</span>';}
function rec(g){return '<span class="rec">'+I.cup+'<span>'+g.recLabel+' <b>'+g.rec+'</b></span></span>';}
function card(g,wide){
  var s=sty(g),art='<div class="cover"><i class="glow"></i><div class="prop">'+P[g.prop]+'</div>'+(wide?(g.extra||''):'')+'<div class="shadow"></div><img class="pet" src="'+pet(g.pet,g.pose)+'" alt="">'+modeChip(g)+'</div>';
  var btn='<button class="btn btn--game btn--s play" data-open="'+g.id+'">'+I.play+'Играть</button>';
  if(wide) return '<article class="card wide" style="'+s+'" data-mode="'+g.mode+'">'+art+'<div class="info"><div class="txt"><h3>'+g.title+'</h3><p>'+g.desc+'</p>'+rec(g)+'</div>'+btn+'</div></article>';
  return '<article class="card" style="'+s+'" data-mode="'+g.mode+'">'+art+'<div class="info"><h3>'+g.title+'</h3><p>'+g.desc+'</p>'+rec(g)+btn+'</div></article>';
}
function catalog(){
  var duo=G.filter(function(g){return g.mode==='duo'}),solo=G.filter(function(g){return g.mode==='solo'});
  return '<div class="bgdeco" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div><main class="page">'+
  '<header class="top"><div class="ttl"><h1>Игры</h1><p>8 игр с питомцами</p></div><button class="invite spring" data-act="invite-any"><span class="ic"><svg viewBox="0 0 20 20"><circle cx="8" cy="6.5" r="3.3" fill="currentColor"/><path d="M2 17c.6-3.6 3-5.4 6-5.4s5.4 1.8 6 5.4z" fill="currentColor"/><path d="M16 5.5v6M13 8.5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></span><span>Позвать<br>друга</span></button></header>'+
  '<div class="seg"><button class="spring on" data-f="all">Все <em>8</em></button><button class="spring" data-f="duo">На двоих <em>5</em></button><button class="spring" data-f="solo">Соло <em>3</em></button></div>'+
  '<section class="sec" data-sec="duo"><div class="sech"><h2>На двоих</h2><span>с другом из MAX или с ботом</span></div><div class="grid">'+duo.map(function(g,i){return card(g,!i)}).join('')+'</div></section>'+
  '<section class="sec" data-sec="solo"><div class="sech"><h2>Соло</h2><span>головоломки на рекорд</span></div><div class="grid">'+solo.map(function(g,i){return card(g,!i)}).join('')+'</div></section>'+
  '<p class="foot">Рекорды на макете — примерные</p></main>';
}

/* ---------- шторка дуэли ---------- */
function sheet(o){
  var g=game(o.game),m=o.mode||'random',st=o.stake||DEF;
  var modes=[['random','globe','Случайный соперник','Найдём игрока за пару секунд'],['friend','max','С другом','Ссылка-приглашение в MAX'],['bot','bot','С ботом','Тренировка, без ставки']];
  var cta={random:'Найти соперника',friend:'Позвать друга',bot:'Играть с ботом'}[m];
  return '<div class="scrim" data-act="close"></div><section class="sheet" style="'+sty(g)+'" role="dialog" aria-label="'+g.title+'"><i class="grab"></i>'+
  '<button class="ibtn ibtn--round xbtn" data-act="close" aria-label="Закрыть">'+IC.x+'</button>'+
  '<div class="sh-head"><div class="sh-icon">'+P[g.prop]+'</div><div><h2>'+g.title+'</h2><p class="sh-sub">'+modeChip(g)+'<span class="rec">'+I.cup+'<span>Рекорд <b>'+g.rec+'</b></span></span></p></div></div>'+
  '<div class="sh-me"><img src="'+pet(ME.pet,'happy')+'" alt=""><span>Играешь своим питомцем: <b>'+ME.petName+'</b></span></div>'+
  '<h4 class="sh-h">С кем играем</h4><div class="opts">'+modes.map(function(x){return '<button class="opt selectable spring'+(x[0]===m?' on':'')+'" data-mode="'+x[0]+'"><span class="oi oi-'+x[0]+'">'+IC[x[1]]+'</span><span class="ot"><b>'+x[2]+'</b><small>'+x[3]+'</small></span><span class="radio"></span></button>';}).join('')+'</div>'+
  (m==='bot'?'<div class="botnote"><span class="oi oi-bot">'+IC.bot+'</span><span><b>Без ставки</b><small>С ботом играем на интерес — монеты не списываются</small></span></div>':
  '<div class="stakebox"><div class="sk-h"><h4 class="sh-h">Ставка</h4><span class="bal">'+COIN+'на счету <b>'+fmt(BAL)+'</b></span></div>'+
  '<div class="stakes">'+STAKES.map(function(s){return '<button class="stk spring'+(s===st?' on':'')+'" data-stake="'+s+'"><span class="stack">'+COIN+COIN+(s>300?COIN:'')+'</span><span class="sv"><b>'+fmt(s)+'</b><small>банк '+fmt(s*2)+'</small></span><span class="radio"></span></button>';}).join('')+'</div>'+
  '<p class="sk-note">Победитель забирает весь банк, при ничьей ставка вернётся</p></div>')+
  '<button class="btn btn--primary btn--l" data-act="start">'+cta+(m==='bot'?'':'<span class="btn-tag">'+COIN+fmt(st)+'</span>')+'</button></section>';
}

/* ---------- полноэкранные этапы матчмейкинга ---------- */
function stageTop(g,label){return '<header class="stg-top"><div class="gchip" style="'+sty(g)+'"><span class="gi">'+P[g.prop]+'</span>'+g.title+'</div><span class="chip chip--m chip--white stg-lbl">'+label+'</span></header>';}
function potChip(st){return '<span class="chip chip--m chip--sun pot">'+COIN+'Банк <b>'+fmt(st*2)+'</b></span>';}
function search(o){
  var g=game(o.game),st=o.stake||DEF;
  return '<main class="stage s-search" style="'+sty(g)+'">'+stageTop(g,'ставка '+fmt(st))+
  '<div class="stg-title"><h1>Ищем соперника<span class="dots3"><i>.</i><i>.</i><i>.</i></span></h1><p>Обычно это занимает до 10 секунд</p></div>'+
  '<div class="radar"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i><i class="sweep"></i>'+
  '<span class="orb o1"><img src="'+pet('goose')+'" alt=""></span><span class="orb o2"><img src="'+pet('dragon')+'" alt=""></span><span class="orb o3"><img src="'+pet('capybara')+'" alt=""></span>'+
  '<div class="mepet"><img src="'+pet(ME.pet,'happy')+'" alt=""><i class="plat"></i></div></div>'+
  '<div class="stg-info"><span class="chip chip--m chip--white timer">0:07</span>'+potChip(st)+'</div>'+
  '<div class="stg-actions"><button class="btn btn--secondary btn--m btn--wide" data-act="cancel">Отмена</button></div></main>';
}
function invite(o){
  var g=game(o.game),st=o.stake||DEF;
  return '<main class="stage s-invite" style="'+sty(g)+'">'+stageTop(g,'ставка '+fmt(st))+
  '<div class="stg-title"><h1>Позови друга</h1><p>Отправь ссылку в MAX — друг откроет её и сразу попадёт в партию</p></div>'+
  '<div class="duo-pre"><div class="slot mine"><img src="'+pet(ME.pet,'happy')+'" alt=""><b>'+ME.name+'</b></div><span class="vs-mini">VS</span><div class="slot empty"><span class="plus">+</span><b>Друг</b></div></div>'+
  '<div class="linkcard"><span class="li">'+IC.link+'</span><span class="lt"><small>Ссылка-приглашение</small><b>max.ru/tapyshi?duel=7KQ2</b></span><button class="ibtn copy" aria-label="Скопировать">'+IC.copy+'</button></div>'+
  '<p class="hint-s">Ссылка и срок действия — пример для макета</p><div class="stg-info">'+potChip(st)+'</div>'+
  '<div class="stg-actions"><button class="btn btn--max btn--l" data-act="send">'+IC.max+'Отправить в MAX</button><button class="btn btn--secondary btn--m btn--wide" data-act="cancel">Отмена</button></div></main>';
}
function wait(o){
  var g=game(o.game),st=o.stake||DEF;
  return '<main class="stage s-wait" style="'+sty(g)+'">'+stageTop(g,'ставка '+fmt(st))+
  '<div class="stg-title"><h1>Ждём друга<span class="dots3"><i>.</i><i>.</i><i>.</i></span></h1><p>Как только друг откроет ссылку, партия начнётся</p></div>'+
  '<div class="duo-pre big"><div class="slot mine"><img src="'+pet(ME.pet,'happy')+'" alt=""><b>'+ME.name+'</b></div><span class="vs-mini">VS</span><div class="slot empty pulse"><span class="typing"><i></i><i></i><i></i></span><b>Друг</b></div></div>'+
  '<div class="stg-info">'+potChip(st)+'</div><ul class="steps"><li class="ok"><span>'+IC.check+'</span>Приглашение отправлено в MAX</li><li class="now"><span><i class="spin"></i></span>Друг ещё не открыл ссылку</li><li><span>3</span>Партия начнётся автоматически</li></ul>'+
  '<div class="stg-actions"><button class="btn btn--max-soft btn--m btn--wide" data-act="send">'+IC.max+'Напомнить в MAX</button><button class="btn btn--secondary btn--m btn--wide" data-act="cancel">Отмена</button></div></main>';
}
/* ---------- оболочка игры ---------- */
function topbar(g){return '<header class="sh-bar"><button class="ibtn rb" data-act="pause" aria-label="Пауза">'+IC.pause+'</button><div class="gchip" style="'+sty(g)+'"><span class="gi">'+P[g.prop]+'</span>'+g.title+'</div><button class="ibtn rb" aria-label="Звук">'+IC.sound+'</button></header>';}
var REACT=['😄','😂','😮','😅','🔥','👍'];
function bubble(side,e,stay){return '<span class="rbub '+side+(stay?' stay':'')+'">'+e+'</span>';}
function shellDuo(o){
  var g=game(o.game||'checkers'),st=o.stake||DEF,op=OPP[o.mode||'random'],bot=o.mode==='bot';
  return '<main class="shell'+(o.enter?' enter':'')+'" style="'+sty(g)+'">'+topbar(g)+
  (o.enter?'<div class="toast">'+(o.mode==='friend'?op.name+' принял приглашение':bot?'Играем с ботом':'Соперник найден: '+op.name)+'</div>':'')+
  '<div class="vsbar"><div class="pl me on"><span class="av"><img src="'+pet(ME.pet,'happy')+'" alt=""></span><span class="pn"><b>'+ME.name+'</b><small>'+(bot?'без ставки':'ставка '+fmt(st))+'</small></span>'+(o.myReact?bubble('l',o.myReact,o.stay):'')+'</div>'+
  '<div class="mid"><span class="score">2<i>:</i>1</span><span class="chip chip--s chip--solid-violet turn">Твой ход</span></div>'+
  '<div class="pl op"><span class="pn"><b>'+op.name+'</b><small>'+op.tag+'</small></span><span class="av"><img src="'+pet(op.pet)+'" alt=""></span>'+(o.oppReact?bubble('r',o.oppReact,o.stay):'')+'</div>'+
  '<div class="tbar"><i style="width:68%"></i></div><span class="tleft">0:12</span></div>'+
  fieldOf(g)+
  '<footer class="sh-foot duo'+(o.tray?' tray-open':'')+'">'+
   '<div class="foot-main">'+(bot?'<span class="chip chip--m chip--sun pot">Тренировка · без ставки</span>':potChip(st))+'<button class="ibtn emo" data-act="tray" aria-label="Реакции">😄</button><button class="btn btn--secondary btn--s" data-act="surrender">'+IC.flag+'Сдаться</button></div>'+
   '<div class="tray" role="toolbar" aria-label="Реакции">'+REACT.map(function(e){return '<button class="re spring" data-react="'+e+'">'+e+'</button>';}).join('')+'<button class="re close spring" data-act="tray" aria-label="Закрыть">'+IC.x+'</button></div>'+
  '</footer>'+demo('duo')+'</main>';
}
function shellSolo(o){
  var g=game(o.game||'2048');
  return '<main class="shell solo" style="'+sty(g)+'">'+topbar(g)+
  '<div class="scorebar"><div class="sc"><small>Счёт</small><b>1 240</b></div><div class="sc best"><small>'+I.cup+'Рекорд</small><b>3 560</b></div><img class="mini" src="'+pet(ME.pet,'happy')+'" alt=""></div>'+
  fieldOf(g)+
  '<footer class="sh-foot"><button class="btn btn--secondary btn--s">'+IC.redo+'Новая игра</button></footer>'+demo('solo')+'</main>';
}
function fieldOf(g){
  var img=(g.id==='checkers'||g.id==='2048')?'<img src="'+BASE+'fields/'+g.id+'.webp" alt="Игровое поле">':'<div class="ph">'+P[g.prop]+'<span>Поле игры «'+g.title+'»</span></div>';
  return '<div class="field">'+img+'<span class="flabel">поле игры — без изменений</span></div>';}
function demo(k){
  if(!window.TAP_PROTO) return '';
  return '<div class="demo"><span>Исход (демо):</span>'+(k==='duo'?'<button data-out="win">Победа</button><button data-out="lose">Поражение</button><button data-out="draw">Ничья</button>':'<button data-out="record">Новый рекорд</button>')+'</div>';
}

/* ---------- итоги ---------- */
function confetti(){var c=['var(--sun)','var(--pink)','var(--violet)','var(--blue)','var(--green)','var(--game-2048)'],s='';
  for(var i=0;i<26;i++){var l=(i*37)%100,d=(i*0.13)%1.6,r=(i*47)%360,w=6+(i%3)*2;s+='<i style="left:'+l+'%;background:'+c[i%6]+';animation-delay:-'+d.toFixed(2)+'s;transform:rotate('+r+'deg);width:'+w+'px;height:'+(w*1.6)+'px;top:'+((i*29)%60-10)+'%"></i>';}
  return '<div class="confetti" aria-hidden="true">'+s+'</div>';}
function result(o){
  var g=game(o.game||'checkers'),st=o.stake||DEF,op=OPP[o.mode||'random'],k=o.outcome||'win',bot=o.mode==='bot';
  var under=(k==='record')?shellSolo({game:o.game||'2048'}):shellDuo(o);
  var noStake='<div class="prize draw nost"><span class="oi oi-bot">'+IC.bot+'</span><small>Тренировка с ботом — без ставки</small></div>';
  var h='';
  if(k==='win') h=confetti()+'<div class="rcard win"><div class="rpet"><i class="rays"></i><img src="'+pet(ME.pet,'happy')+'" alt=""></div><span class="chip chip--m chip--solid-green rbadge">Победа!</span>'+
    '<h2>Победа за тобой!</h2><p>Соперник: '+op.name+' · счёт 2:1</p>'+
    (bot?noStake:'<div class="prize">'+COIN+'<b>+'+fmt(st*2)+'</b><small>весь банк твой: '+fmt(st)+' + '+fmt(st)+'</small></div>')+
    '<div class="rstats"><span><b>5</b>побед в «'+g.title+'»</span><span><b>2:1</b>счёт</span></div>'+btns('Ещё раз')+'</div>';
  if(k==='lose') h='<div class="rcard lose"><div class="rpet"><img src="'+pet(ME.pet)+'" alt=""><span class="bubble">Ещё разок?</span></div><span class="chip chip--m chip--violet rbadge">Почти получилось</span>'+
    '<h2>В этот раз — '+op.name+'</h2><p>Счёт 1:2 — совсем рядом! '+ME.petName+' уже рвётся в реванш.</p>'+
    (bot?noStake:'<div class="prize lose">'+COIN+'<b>−'+fmt(st)+'</b><small>твоя ставка ушла в банк соперника</small></div>')+
    (g.id==='checkers'?'<div class="tip"><span class="tbulb"><svg viewBox="0 0 20 20"><path d="M10 2.5a5.5 5.5 0 0 0-3.2 10c.5.4.7.9.7 1.5h5c0-.6.2-1.1.7-1.5A5.5 5.5 0 0 0 10 2.5z" class="ico-sun"/><rect x="7.5" y="15" width="5" height="2.6" rx="1.3" class="ico-sun-edge"/></svg></span>Совет: в шашках бить обязательно — ищи размены в свою пользу</div>':'')+btns('Реванш')+'</div>';
  if(k==='draw') h='<div class="rcard draw"><div class="rpet two"><img class="l" src="'+pet(ME.pet,'happy')+'" alt=""><img class="r" src="'+pet(op.pet,'happy')+'" alt=""></div><span class="chip chip--m chip--blue rbadge">Ничья</span>'+
    '<h2>Силы равны!</h2><p>Ты и '+op.name+' сыграли вничью</p>'+
    (bot?noStake:'<div class="prize draw">'+COIN+'<b>'+fmt(st)+'</b><small>ставка вернулась к тебе</small></div>')+btns('Ещё раз')+'</div>';
  if(k==='record') h=confetti()+'<div class="rcard record"><div class="rpet"><i class="rays"></i><img src="'+pet(ME.pet,'happy')+'" alt=""></div><span class="chip chip--m chip--solid-sun rbadge">'+I.cup+'Новый рекорд!</span>'+
    '<div class="bigscore">3 840</div><p>Прошлый рекорд — 3 560. Плюс 280!</p>'+
    '<div class="rstats"><span><b>128</b>ходов</span>'+((o.game||'2048')==='2048'?'<span><b>256</b>лучшая плитка</span>':'')+'<span><b>6:12</b>время</span></div>'+btns('Ещё раз')+'</div>';
  return under+'<div class="rscrim"></div><div class="rwrap">'+h+'</div>';
}
function btns(again){return '<div class="rbtns"><button class="btn btn--primary btn--l" data-act="again">'+IC.redo+again+'</button><button class="btn btn--secondary btn--m btn--wide" data-act="menu">'+IC.home+'В меню</button></div>';}

var SCREENS={catalog:catalog,sheet:function(o){return catalog()+sheet(o)},search:search,invite:invite,wait:wait,shellDuo:shellDuo,shellSolo:shellSolo,result:result};
TAP.render=function(o){
  var app=document.getElementById('app');app.innerHTML=SCREENS[o.screen](o);
  document.body.className='scr-'+o.screen+(o.screen==='catalog'||o.screen==='sheet'?'':' no-tabs')+(o.screen==='sheet'?' has-sheet':'');
  if(o.screen!=='sheet'&&o.screen!=='catalog')window.scrollTo(0,0);
};
TAP.game=game;TAP.OPP=OPP;
})();
