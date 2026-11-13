/* Прототип: каталог A → шторка → поиск / друг / бот → сразу игра (мягкий вход, без экрана «найден») → итог.
   Соло — сразу в оболочку. Реакции: кнопка 😄 в оболочке на двоих.
   Позвать друга на вкладке — общая ссылка MAX; в меню дуэли — ссылка на эту игру.
   Экран «Друзья»: инвайт в партию онлайн или MAX, если друг не в сети. */
(function(){
var S={screen:'catalog',game:'checkers',mode:'random',stake:300,filter:'all',fromFriends:false,pick:false,write:false,friend:null,empty:false},T=[];
var REACT=['😄','😂','😮','😅','🔥','👍'];
function clear(){T.forEach(clearTimeout);T=[];}
function later(fn,ms){T.push(setTimeout(fn,ms));}
function go(p){clear();for(var k in p)S[k]=p[k];
  var o=Object.assign({},S);TAP.render(o);S.enter=false;
  if(S.screen==='catalog'||S.screen==='sheet'||S.screen==='friends'){if(S.screen!=='friends')applyFilter();window.scrollTo(0,S.y||0);}
  if(S.screen==='search'){var t=0,el=document.querySelector('.timer');(function tick(){el.textContent='0:'+('0'+t).slice(-2);t++;if(t<=4)later(tick,1000);})();later(startGame,4200);}
  if(S.screen==='wait')later(startGame,4500);
  if(S.screen==='waitFriend')later(startGame,2800);
  if(S.screen==='shellDuo')later(function(){bubble('op',REACT[4]);},3200);
}
function startGame(){
  if(S.friend){
    TAP.OPP.friend={name:S.friend.name,pet:S.friend.pet||'raccoon',tag:'друг из MAX'};
    S.mode='friend';
  }
  go({screen:'shellDuo',enter:true});
}
function bubble(side,e){
  var pl=document.querySelector('.pl.'+side);if(!pl)return;
  var old=pl.querySelector('.rbub');if(old)old.remove();
  var b=document.createElement('span');b.className='rbub '+(side==='me'?'l':'r');b.textContent=e;pl.appendChild(b);
  later(function(){b.remove();},2700);
}
function applyFilter(){document.querySelectorAll('.seg button').forEach(function(x){x.classList.toggle('on',x.dataset.f===S.filter)});
  document.querySelectorAll('.sec').forEach(function(s){s.hidden=!(S.filter==='all'||s.dataset.sec===S.filter)});}
function friendBy(id){var L=TAP.FRIENDS||[];for(var i=0;i<L.length;i++)if(L[i].id===id)return L[i];return null;}
function shareGame(done){
  if(window.TapInvite)TapInvite.share({game:S.game,onDone:done});
  else if(done)done();
}
document.addEventListener('click',function(e){
  var t=e.target.closest('button,[data-act],a[href="#friends"]');if(!t)return;
  if(t.dataset.f){S.filter=t.dataset.f;applyFilter();return;}
  if(t.dataset.open){var g=TAP.game(t.dataset.open);S.y=window.scrollY;S.fromFriends=false;S.friend=null;
    if(g.mode==='solo')go({screen:'shellSolo',game:g.id});else go({screen:'sheet',game:g.id,mode:'random'});return;}
  if(t.dataset.react){bubble('me',t.dataset.react);document.querySelector('.sh-foot').classList.remove('tray-open');
    var r=REACT[(REACT.indexOf(t.dataset.react)+2)%REACT.length];T.push(setTimeout(function(){bubble('op',r)},1400));return;}
  if(t.dataset.mode){go({screen:'sheet',mode:t.dataset.mode});return;}
  if(t.dataset.stake && S.screen!=='friends'){go({screen:'sheet',stake:+t.dataset.stake});return;}
  if(t.dataset.out){go({screen:'result',outcome:t.dataset.out});return;}
  if(t.dataset.fgame){go({screen:'friends',pick:true,game:t.dataset.fgame});return;}
  if(t.dataset.fstake!=null && t.dataset.fstake!==''){go({screen:'friends',pick:true,stake:+t.dataset.fstake});return;}
  var a=t.dataset.act;
  if(a==='tray'){document.querySelector('.sh-foot').classList.toggle('tray-open');}
  else if(a==='friends'){S.y=window.scrollY;go({screen:'friends',pick:false,empty:false,fromFriends:true});}
  else if(a==='friends-empty'){go({screen:'friends',empty:true,pick:false});}
  else if(a==='friends-demo'){go({screen:'friends',empty:false,pick:false});}
  else if(a==='friends-play'||a==='friends-write'){
    var fr=friendBy(t.dataset.fid);if(!fr)return;
    go({screen:'friends',pick:true,write:a==='friends-write',friend:fr,game:S.game&&TAP.game(S.game).mode==='duo'?S.game:'tictactoe',stake:S.stake||300});
  }
  else if(a==='friends-back'){go({screen:'friends',pick:false});}
  else if(a==='pick-go'){
    if(S.write){shareGame(function(){});return;}
    go({screen:'waitFriend',fromFriends:true,mode:'friend',pick:false});
  }
  else if(a==='close'||a==='menu'||a==='pause'){go({screen:S.fromFriends?'friends':'catalog',pick:false});}
  else if(a==='invite-any'){if(window.TapInvite)TapInvite.share({});return;}
  else if(a==='start'){
    if(S.mode==='random')go({screen:'search'});
    else if(S.mode==='friend'){shareGame(function(){go({screen:'wait'});});}
    else startGame();
  }
  else if(a==='cancel'){
    if(S.screen==='waitFriend'||S.fromFriends)go({screen:'friends',pick:false});
    else go({screen:'sheet'});
  }
  else if(a==='send'){shareGame(function(){go({screen:'wait'});});}
  else if(a==='again'){
    if(S.outcome==='record')go({screen:'shellSolo'});
    else if(S.fromFriends)go({screen:'waitFriend',mode:'friend'});
    else if(S.mode==='random')go({screen:'search'});
    else if(S.mode==='friend')go({screen:'wait'});
    else startGame();
  }
  else if(a==='surrender'){go({screen:'result',outcome:'lose'});}
});
var q=location.search||'';
if(/friends=empty/.test(q))go({screen:'friends',empty:true,fromFriends:true});
else if(/friends=1|friends/.test(q))go({screen:'friends',fromFriends:true});
else go({screen:'catalog'});
})();
