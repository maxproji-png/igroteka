/* Иконки бустов (SVG, светлый мультяшный объём — как сундуки А). viewBox 0 0 120 120.
   BA.svg(id, level 1..N, {badge:true}) → строка <svg>.  id: tap | energy | regen | offline.
   Материал растёт с уровнем: ур. 1 — серебро, ур. 2 — фиолетовый, макс. — золото с сиянием.
   Монета — та же, что T.coin (../shared/coin.js): золотая с лапкой. */
(function(){
var uid=0,SH='rgb(80 62 160)';
var M={
  steel: {l:'#FFFFFF',b:'#DCD6F3',d:'#A89ED6',o:'#6D60AA'},
  violet:{l:'#C2B2FF',b:'#7C5CFF',d:'#5E40DB',o:'#3E27A6'},
  gold:  {l:'#FFF0A8',b:'#FFC233',d:'#E8A100',o:'#A66A00'},
  green: {l:'#9DF0CC',b:'#26B880',d:'#1C9B6A',o:'#0F6B48'},
  pink:  {l:'#FFC2D8',b:'#FF5E99',d:'#E8417E',o:'#A8245A'},
  glass: {l:'#FFFFFF',b:'#F1ECFF',d:'#DCD3FA',o:'#8C7FCF'}
};
var MAT={1:'steel',2:'violet',3:'gold'};
function C(){var id='bo'+(++uid),defs=[],k=0;
  function st(s){return s.map(function(x){return '<stop offset="'+x[0]+'" stop-color="'+x[1]+'"'+(x[2]!=null?' stop-opacity="'+x[2]+'"':'')+'/>'}).join('')}
  return {defs:defs,
    lin:function(s,x1,y1,x2,y2){var n=id+'g'+(k++);defs.push('<linearGradient id="'+n+'" x1="'+(x1||0)+'" y1="'+(y1||0)+'" x2="'+(x2==null?0:x2)+'" y2="'+(y2==null?1:y2)+'">'+st(s)+'</linearGradient>');return 'url(#'+n+')'},
    rad:function(s,cx,cy,r){var n=id+'g'+(k++);defs.push('<radialGradient id="'+n+'" cx="'+(cx==null?.5:cx)+'" cy="'+(cy==null?.5:cy)+'" r="'+(r||.5)+'">'+st(s)+'</radialGradient>');return 'url(#'+n+')'},
    clip:function(sh){var n=id+'c'+(k++);defs.push('<clipPath id="'+n+'">'+sh+'</clipPath>');return 'url(#'+n+')'},
    blur:function(sd){var n=id+'f'+(k++);defs.push('<filter id="'+n+'" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="'+sd+'"/></filter>');return 'url(#'+n+')'}};}
function P(d,f,s,w,x){return '<path d="'+d+'" fill="'+f+'"'+(s?' stroke="'+s+'" stroke-width="'+(w||3)+'" stroke-linejoin="round" stroke-linecap="round"':'')+(x||'')+'/>'}
function grad(c,m){return c.lin([[0,m.l],[.55,m.b],[1,m.d]])}
function shadow(c,cx,cy,rx,ry){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+SH+'" opacity=".2" filter="'+c.blur(3)+'"/>'}
function spark(x,y,s,col){return '<path class="bo-tw" style="transform-origin:'+x+'px '+y+'px" d="M'+x+','+(y-s)+' Q'+x+','+y+' '+(x+s)+','+y+' Q'+x+','+y+' '+x+','+(y+s)+' Q'+x+','+y+' '+(x-s)+','+y+' Q'+x+','+y+' '+x+','+(y-s)+'Z" fill="'+(col||'#fff')+'"/>'}
function aura(c,lv,cx,cy,col){if(lv<2)return '';var s='<circle cx="'+cx+'" cy="'+cy+'" r="'+(lv>2?58:48)+'" fill="'+c.rad([[0,col,lv>2?.75:.45],[1,col,0]])+'"/>';
  if(lv>2){var r='';for(var i=0;i<12;i++){var a=i/12*Math.PI*2,w=.13;r+='<path d="M'+cx+','+cy+' L'+(cx+Math.cos(a-w)*62).toFixed(1)+','+(cy+Math.sin(a-w)*62).toFixed(1)+' L'+(cx+Math.cos(a+w)*62).toFixed(1)+','+(cy+Math.sin(a+w)*62).toFixed(1)+'Z"/>'}
    s+='<g class="bo-rays" style="transform-origin:'+cx+'px '+cy+'px" fill="'+c.rad([[0,'#FFE27A',.7],[1,'#FFE27A',0]])+'">'+r+'</g>'}
  return s}
function paw(x,y,s,col,op){return '<g fill="'+col+'"'+(op?' opacity="'+op+'"':'')+'><ellipse cx="'+x+'" cy="'+(y+s*.25)+'" rx="'+(s*.42)+'" ry="'+(s*.34)+'"/><circle cx="'+(x-s*.5)+'" cy="'+(y-s*.2)+'" r="'+(s*.16)+'"/><circle cx="'+(x-s*.2)+'" cy="'+(y-s*.5)+'" r="'+(s*.17)+'"/><circle cx="'+(x+s*.2)+'" cy="'+(y-s*.5)+'" r="'+(s*.17)+'"/><circle cx="'+(x+s*.5)+'" cy="'+(y-s*.2)+'" r="'+(s*.16)+'"/></g>'}
/* монета: как T.coin — золотая, ребро, внутренний круг, белая лапка */
function coin(c,x,y,r,tilt,rot){var g=M.gold,ry=r*(tilt||1),t=rot?' transform="rotate('+rot+' '+x+' '+y+')"':'';
  return '<g'+t+'><ellipse cx="'+x+'" cy="'+(y+r*.18)+'" rx="'+r+'" ry="'+ry+'" fill="'+g.d+'" stroke="'+g.o+'" stroke-width="'+Math.max(1.4,r*.12)+'"/>'+
    '<ellipse cx="'+x+'" cy="'+y+'" rx="'+r+'" ry="'+ry+'" fill="'+c.lin([[0,g.l],[.6,g.b],[1,g.d]])+'" stroke="'+g.o+'" stroke-width="'+Math.max(1.4,r*.12)+'"/>'+
    '<ellipse cx="'+x+'" cy="'+y+'" rx="'+(r*.72)+'" ry="'+(ry*.72)+'" fill="'+g.b+'" stroke="'+g.d+'" stroke-width="'+Math.max(1,r*.08)+'"/>'+
    '<g transform="translate('+x+' '+y+') scale(1 '+(tilt||1)+') translate('+(-x)+' '+(-y)+')">'+paw(x,y+r*.05,r*.85,'#fff',.95)+'</g>'+
    '<path d="M'+(x-r*.68)+','+(y-ry*.3)+' A'+(r*.72)+','+(ry*.72)+' 0 0 1 '+(x-r*.15)+','+(y-ry*.7)+'" stroke="#fff" stroke-width="'+Math.max(1.2,r*.12)+'" fill="none" stroke-linecap="round" opacity=".8"/></g>'}
function bolt(c,x,y,s){var g=M.gold;var d='M'+(x+s*.15)+','+(y-s)+' L'+(x-s*.55)+','+(y+s*.12)+' H'+(x-s*.02)+' L'+(x-s*.22)+','+(y+s)+' L'+(x+s*.58)+','+(y-s*.18)+' H'+(x+s*.05)+'Z';
  return P(d,c.lin([[0,'#FFF6C2'],[.5,g.b],[1,g.d]]),g.o,Math.max(2,s*.12))+P('M'+(x+s*.02)+','+(y-s*.62)+' L'+(x-s*.28)+','+(y-s*.02),'none','#fff',Math.max(1.5,s*.1),' opacity=".8"')}
function badge(c,lv,max){var m=max?M.gold:(M[MAT[lv]]||M.gold),cx=100,cy=100;
  return '<g><circle cx="'+cx+'" cy="'+(cy+2)+'" r="14" fill="'+m.o+'"/><circle cx="'+cx+'" cy="'+cy+'" r="14" fill="'+grad(c,m)+'" stroke="#fff" stroke-width="3"/>'+
   '<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" font-family="Nunito,ui-rounded,system-ui,sans-serif" font-weight="1000" font-size="17" fill="'+(lv===3||max?M.gold.o:lv===1?M.steel.o:'#fff')+'">'+lv+'</text></g>'}

/* 1. Сила тапа: кнопка-«тапалка» с лапкой, из неё выпрыгивают 1/2/3 монеты */
function tap(c,lv,mx){var m=M[MAT[lv]],s='';
  s+=aura(c,lv,60,58,lv>2?M.gold.b:M.violet.l)+shadow(c,60,104,40,7);
  // основание
  s+='<ellipse cx="60" cy="96" rx="42" ry="13" fill="'+M.steel.o+'"/>'+'<ellipse cx="60" cy="92" rx="42" ry="13" fill="'+c.lin([[0,M.steel.l],[1,M.steel.d]])+'" stroke="'+M.steel.o+'" stroke-width="3"/>';
  // кнопка-цилиндр
  s+=P('M28,70 V86 A32,11 0 0 0 92,86 V70Z',c.lin([[0,m.d],[.3,m.b],[.5,m.l],[.75,m.b],[1,m.d]],0,0,1,0),m.o,3);
  s+='<ellipse cx="60" cy="70" rx="32" ry="11.5" fill="'+c.lin([[0,m.l],[1,m.b]])+'" stroke="'+m.o+'" stroke-width="3"/>';
  s+='<g transform="translate(60 70) scale(1 .4) translate(-60 -70)">'+paw(60,72,24,lv===1?M.steel.o:'#fff',lv===1?.45:.92)+'</g>';
  s+='<path d="M34,76 Q34,86 44,90" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".6"/>';
  // монеты
  var pos={1:[[60,30,15,0]],2:[[42,36,14,-14],[78,28,14,12]],3:[[28,40,13,-18],[60,20,15,0],[92,38,13,16]]}[lv];
  pos.forEach(function(q){s+='<path d="M'+q[0]+','+(q[1]+q[2]+5)+' V'+(q[1]+q[2]+12)+'" stroke="'+M.gold.b+'" stroke-width="3" stroke-linecap="round" opacity=".7"/>'+coin(c,q[0],q[1],q[2],.92,q[3])});
  if(lv>2){s+=spark(14,26,6)+spark(106,22,7,'#FFF3B0')+spark(104,70,4)}
  else if(lv>1) s+=spark(100,24,5);
  return s}
/* 2. Запас энергии: батарейка, растёт в высоту, ячеек 2/3/4 */
function energy(c,lv,mx){var m=M[MAT[lv]],s='',cells=lv+1,top=[0,40,30,20][lv],w=[0,38,42,46][lv],L=60-w/2,R=60+w/2,bot=102;
  s+=aura(c,lv,60,62,lv>2?M.gold.b:M.green.l)+shadow(c,60,106,w*.75,6);
  // клемма
  s+='<rect x="'+(60-9)+'" y="'+(top-9)+'" width="18" height="12" rx="4" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="3"/>';
  // корпус
  s+='<rect x="'+L+'" y="'+(top+4)+'" width="'+w+'" height="'+(bot-top)+'" rx="14" fill="'+m.o+'"/>';
  s+='<rect x="'+L+'" y="'+top+'" width="'+w+'" height="'+(bot-top)+'" rx="14" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="3"/>';
  var iL=L+6,iw=w-12,iT=top+6,iB=bot-6;
  s+='<rect x="'+iL+'" y="'+iT+'" width="'+iw+'" height="'+(iB-iT)+'" rx="9" fill="'+c.lin([[0,'#FFFFFF'],[1,M.glass.d]])+'" stroke="'+m.d+'" stroke-width="2"/>';
  var gap=3,ch=(iB-iT-4-gap*(cells-1))/cells;
  for(var i=0;i<cells;i++){var y=iB-2-(i+1)*ch-i*gap;s+='<rect x="'+(iL+3)+'" y="'+y.toFixed(1)+'" width="'+(iw-6)+'" height="'+ch.toFixed(1)+'" rx="5" fill="'+c.lin([[0,M.green.l],[1,M.green.b]])+'" stroke="'+M.green.d+'" stroke-width="1.5"/><rect x="'+(iL+6)+'" y="'+(y+2).toFixed(1)+'" width="'+(iw-16)+'" height="2.6" rx="1.3" fill="#fff" opacity=".7"/>'}
  s+=bolt(c,60,(top+bot)/2+2,Math.min(20,(bot-top)*.3));
  s+='<rect x="'+(L+3)+'" y="'+(top+10)+'" width="4" height="'+(bot-top-26)+'" rx="2" fill="#fff" opacity=".6"/>';
  if(lv>2){s+=spark(20,30,6)+spark(100,26,7,'#FFF3B0')+spark(98,74,4)} else if(lv>1) s+=spark(96,34,5);
  return s}
/* 3. Скорость восстановления: секундомер с молнией и линиями скорости */
function regen(c,lv,mx){var m=M[lv>=2?'gold':'steel'],s='',cx=64,cy=64,r=lv>=2?34:31;
  s+=aura(c,lv>=2?3:1,cx,cy,M.gold.b)+shadow(c,cx,104,34,6);
  var nl=lv>=2?4:2;for(var i=0;i<nl;i++){var y=cy-16+i*(lv>=2?11:16),len=lv>=2?26-i%2*8:16;s+='<path d="M'+(cx-r-6)+','+y+' H'+(cx-r-6-len)+'" stroke="'+(lv>=2?M.violet.b:M.steel.d)+'" stroke-width="5" stroke-linecap="round"/>'}
  // заводная головка и кнопка
  s+='<rect x="'+(cx-8)+'" y="'+(cy-r-14)+'" width="16" height="10" rx="4" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="3"/><rect x="'+(cx-4)+'" y="'+(cy-r-6)+'" width="8" height="7" fill="'+m.d+'" stroke="'+m.o+'" stroke-width="2"/>';
  s+='<rect x="'+(cx+r*.62)+'" y="'+(cy-r*.92)+'" width="12" height="8" rx="3" transform="rotate(42 '+(cx+r*.7)+' '+(cy-r*.8)+')" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="2.5"/>';
  s+='<circle cx="'+cx+'" cy="'+(cy+4)+'" r="'+r+'" fill="'+m.o+'"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="3"/>';
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-7)+'" fill="'+c.lin([[0,'#FFFFFF'],[1,M.glass.b]])+'" stroke="'+m.d+'" stroke-width="2"/>';
  // дуга заполнения
  var rr=r-12,f=lv>=2?.92:.55,a0=-Math.PI/2,a1=a0+f*Math.PI*2;
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+rr+'" fill="none" stroke="'+M.glass.d+'" stroke-width="5"/>';
  s+='<path d="M'+cx+','+(cy-rr)+' A'+rr+','+rr+' 0 '+(f>.5?1:0)+' 1 '+(cx+Math.cos(a1)*rr).toFixed(1)+','+(cy+Math.sin(a1)*rr).toFixed(1)+'" stroke="'+M.green.b+'" stroke-width="5" fill="none" stroke-linecap="round"/>';
  s+=bolt(c,cx,cy+1,lv>=2?14:12);
  s+='<path d="M'+(cx-r+7)+','+(cy-8)+' A'+(r-6)+','+(r-6)+' 0 0 1 '+(cx-8)+','+(cy-r+7)+'" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>';
  if(lv>=2){s+=spark(108,30,7,'#FFF3B0')+spark(104,96,4)+spark(26,96,5)}
  return s}
/* 4. Офлайн-добыча: банка-копилка с монетами и месяцем; монет всё больше */
function offline(c,lv,mx){var m=M[MAT[lv]],s='',L=32,R=88,T=40,B=104;
  s+=aura(c,lv,60,66,lv>2?M.gold.b:M.violet.l)+shadow(c,60,107,32,6);
  var jar='M'+(L+6)+','+T+' H'+(R-6)+' Q'+R+','+T+' '+R+','+(T+10)+' V'+(B-12)+' Q'+R+','+B+' '+(R-12)+','+B+' H'+(L+12)+' Q'+L+','+B+' '+L+','+(B-12)+' V'+(T+10)+' Q'+L+','+T+' '+(L+6)+','+T+'Z';
  s+=P(jar,c.lin([[0,'#FFFFFF',.95],[1,M.glass.b,.95]]),M.glass.o,3);
  var jc=c.clip('<path d="'+jar+'"/>'),fill={1:84,2:70,3:52}[lv],cs='';
  cs+='<rect x="'+L+'" y="'+fill+'" width="'+(R-L)+'" height="'+(B-fill)+'" fill="'+c.lin([[0,M.gold.b],[1,M.gold.d]])+'"/>';
  var rows=Math.ceil((B-fill)/9);for(var j=0;j<rows;j++)for(var x=L+6+(j%2)*7;x<R;x+=14) cs+=coin(c,x,fill+4+j*9,7,.45);
  s+='<g clip-path="'+jc+'">'+cs+'<rect x="'+(L+5)+'" y="'+(T+8)+'" width="6" height="'+(B-T-24)+'" rx="3" fill="#fff" opacity=".75"/></g>';
  s+=P(jar,'none',M.glass.o,3);
  // крышка
  s+='<rect x="'+(L-3)+'" y="'+(T-12)+'" width="'+(R-L+6)+'" height="15" rx="6" fill="'+m.o+'" transform="translate(0 3)"/><rect x="'+(L-3)+'" y="'+(T-12)+'" width="'+(R-L+6)+'" height="15" rx="6" fill="'+grad(c,m)+'" stroke="'+m.o+'" stroke-width="3"/><rect x="'+(L+2)+'" y="'+(T-9)+'" width="'+(R-L-6)+'" height="3" rx="1.5" fill="#fff" opacity=".7"/>';
  s+='<rect x="51" y="'+(T-9)+'" width="18" height="4" rx="2" fill="'+m.o+'" opacity=".7"/>';
  if(lv>2) s+=coin(c,52,T-20,9,.6,-12)+coin(c,70,T-24,8,.6,14);
  // месяц и «z»
  var mx_=lv>2?20:22,my=lv>2?30:32;
  s+=P('M'+(mx_+9)+','+(my-13)+' A14,14 0 1 0 '+(mx_+12)+','+(my+12)+' A11,11 0 1 1 '+(mx_+9)+','+(my-13)+'Z',c.lin([[0,'#FFF6C2'],[1,M.gold.b]]),M.gold.o,2.5);
  s+='<text x="'+(lv>2?100:96)+'" y="'+(lv>2?36:40)+'" font-family="Nunito,ui-rounded,sans-serif" font-weight="1000" font-size="'+(12+lv*2)+'" fill="'+M.violet.b+'" stroke="#fff" stroke-width="3" paint-order="stroke">z</text>';
  if(lv>1) s+='<text x="'+(lv>2?88:86)+'" y="'+(lv>2?22:26)+'" font-family="Nunito,ui-rounded,sans-serif" font-weight="1000" font-size="11" fill="'+M.violet.b+'" stroke="#fff" stroke-width="3" paint-order="stroke">z</text>';
  if(lv>2){s+=spark(106,64,6,'#FFF3B0')+spark(14,72,5)} else if(lv>1) s+=spark(104,66,4);
  return s}

var F={tap:tap,energy:energy,regen:regen,offline:offline};
window.BA={
  svg:function(id,lv,opt){opt=opt||{};var c=C(),body=F[id](c,lv);if(opt.badge)body+=badge(c,lv,opt.max);
    return '<svg class="boost-ico '+(opt.cls||'')+'" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" overflow="visible"><defs>'+c.defs.join('')+'</defs>'+body+'</svg>'},
  coin:function(cls){var c=C();return '<svg class="coin3d '+(cls||'')+'" viewBox="0 0 40 40"><defs>'+(function(){var s=coin(c,20,19,16,1);return c.defs.join('')+'</defs>'+s})()+'</svg>'}
};
})();
