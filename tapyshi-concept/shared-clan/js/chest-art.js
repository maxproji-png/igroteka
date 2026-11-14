/* Сундуки клана — векторная отрисовка (SVG). Концепты: a — классика, b — пухляши, c — тематические.
   CH.svg(concept, tier 0..2, open, {cls}) → строка <svg>. viewBox 0 0 200 200, низ сундука ≈ y176.
   Оттенки материалов выведены из палитры tokens.css (фиолетовый/зелёный/жёлтый/розовый) + тёплое дерево и серебро. */
(function(){
var uid=0;
var SH='rgb(80 62 160)';
var M={
  wood:  {l:'#F8D3A0',b:'#E5A766',d:'#C07D45',o:'#8C5634',in:'#6E3F22'},
  steel: {l:'#FFFFFF',b:'#DCD6F3',d:'#A89ED6',o:'#6D60AA'},
  silver:{l:'#FFFFFF',b:'#ECE9F8',d:'#BDB5DF',o:'#7F74B4',in:'#4B3C93'},
  violet:{l:'#C2B2FF',b:'#7C5CFF',d:'#5E40DB',o:'#3E27A6',in:'#2C1B7C'},
  gold:  {l:'#FFF0A8',b:'#FFC233',d:'#E8A100',o:'#A66A00',in:'#7A4A05'},
  green: {l:'#9DF0CC',b:'#26B880',d:'#1C9B6A',o:'#0F6B48',in:'#0B5236'},
  pink:  {l:'#FFC2D8',b:'#FF5E99',d:'#E8417E',o:'#A8245A'},
  sky:   {l:'#D6E6FF',b:'#8FB6FF',d:'#5E8EE8',o:'#3A63B8'},
  straw: {l:'#FFE7B0',b:'#F4C677',d:'#D69A45',o:'#9A6328',in:'#7A4A20'}
};
function C(){var id='ch'+(++uid),defs=[],k=0;
  function stops(s){return s.map(function(x){return '<stop offset="'+x[0]+'" stop-color="'+x[1]+'"'+(x[2]!=null?' stop-opacity="'+x[2]+'"':'')+'/>'}).join('')}
  return {defs:defs,
    lin:function(s,x1,y1,x2,y2){var n=id+'g'+(k++);defs.push('<linearGradient id="'+n+'" x1="'+(x1||0)+'" y1="'+(y1||0)+'" x2="'+(x2==null?0:x2)+'" y2="'+(y2==null?1:y2)+'">'+stops(s)+'</linearGradient>');return 'url(#'+n+')'},
    rad:function(s,cx,cy,r,fx,fy){var n=id+'g'+(k++);defs.push('<radialGradient id="'+n+'" cx="'+(cx==null?.5:cx)+'" cy="'+(cy==null?.5:cy)+'" r="'+(r||.5)+'"'+(fx!=null?' fx="'+fx+'" fy="'+fy+'"':'')+'>'+stops(s)+'</radialGradient>');return 'url(#'+n+')'},
    clip:function(sh){var n=id+'c'+(k++);defs.push('<clipPath id="'+n+'">'+sh+'</clipPath>');return 'url(#'+n+')'},
    blur:function(sd){var n=id+'f'+(k++);defs.push('<filter id="'+n+'" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="'+sd+'"/></filter>');return 'url(#'+n+')'}
  };}
function P(d,f,s,w,extra){return '<path d="'+d+'" fill="'+f+'"'+(s?' stroke="'+s+'" stroke-width="'+(w||4)+'" stroke-linejoin="round" stroke-linecap="round"':'')+(extra||'')+'/>'}
function shadow(c,cx,cy,rx,ry,a){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+SH+'" opacity="'+(a||.22)+'" filter="'+c.blur(4)+'"/>'}
function spark(x,y,s,col,cls){return '<path class="'+(cls||'ch-tw')+'" style="transform-origin:'+x+'px '+y+'px" d="M'+x+','+(y-s)+' Q'+x+','+y+' '+(x+s)+','+y+' Q'+x+','+y+' '+x+','+(y+s)+' Q'+x+','+y+' '+(x-s)+','+y+' Q'+x+','+y+' '+x+','+(y-s)+'Z" fill="'+(col||'#fff')+'"/>'}
function glow(c,cx,cy,r,col,a){return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+c.rad([[0,'#fff',a==null?.95:a],[.35,col,.55],[1,col,0]])+'"/>'}
function rays(c,cx,cy,r,n,col){var s='';for(var i=0;i<n;i++){var a=i/n*Math.PI*2,w=Math.PI/n*.55;
  s+='<path d="M'+cx+','+cy+' L'+(cx+Math.cos(a-w)*r).toFixed(1)+','+(cy+Math.sin(a-w)*r).toFixed(1)+' L'+(cx+Math.cos(a+w)*r).toFixed(1)+','+(cy+Math.sin(a+w)*r).toFixed(1)+'Z"/>'}
  return '<g class="ch-rays" style="transform-origin:'+cx+'px '+cy+'px" fill="'+c.rad([[0,col,.75],[1,col,0]],.5,.5,.5)+'">'+s+'</g>'}
function coin(c,x,y,r,t){t=t==null?.55:t;var ry=r*t,g=M.gold;
  return '<g><ellipse cx="'+x+'" cy="'+(y+r*.16)+'" rx="'+r+'" ry="'+ry+'" fill="'+g.d+'" stroke="'+g.o+'" stroke-width="1.8"/>'+
   '<ellipse cx="'+x+'" cy="'+y+'" rx="'+r+'" ry="'+ry+'" fill="'+c.lin([[0,g.l],[1,g.b]])+'" stroke="'+g.o+'" stroke-width="1.8"/>'+
   '<ellipse cx="'+x+'" cy="'+y+'" rx="'+(r*.62)+'" ry="'+(ry*.62)+'" fill="none" stroke="'+g.d+'" stroke-width="1.6" opacity=".8"/>'+
   '<ellipse cx="'+(x-r*.3)+'" cy="'+(y-ry*.35)+'" rx="'+(r*.25)+'" ry="'+(ry*.2)+'" fill="#fff" opacity=".8"/></g>'}
function gem(c,x,y,s,m){m=M[m]||m;
  var p=[[x-s,y-s*.25],[x-s*.55,y-s*.75],[x+s*.55,y-s*.75],[x+s,y-s*.25],[x,y+s]];
  var d='M'+p.map(function(q){return q[0].toFixed(1)+','+q[1].toFixed(1)}).join(' L')+'Z';
  return '<g>'+P(d,c.lin([[0,m.l],[.5,m.b],[1,m.d]],0,0,1,1),m.o,Math.max(1.5,s*.16))+
   P('M'+(x-s)+','+(y-s*.25)+' H'+(x+s)+' M'+(x-s*.3)+','+(y-s*.25)+' L'+x+','+(y+s)+' L'+(x+s*.3)+','+(y-s*.25),'none','#fff',Math.max(1,s*.09),' opacity=".55"')+
   P('M'+(x-s*.5)+','+(y-s*.68)+' L'+(x-s*.1)+','+(y-s*.68)+' L'+(x-s*.35)+','+(y-s*.3)+'Z','#fff','',0,' opacity=".85"')+'</g>'}
function heart(c,x,y,s,m){m=M[m]||m;var d='M'+x+','+(y+s*.85)+' C'+(x-s*1.4)+','+(y-s*.05)+' '+(x-s*.95)+','+(y-s*1.15)+' '+x+','+(y-s*.45)+' C'+(x+s*.95)+','+(y-s*1.15)+' '+(x+s*1.4)+','+(y-s*.05)+' '+x+','+(y+s*.85)+'Z';
  return '<g>'+P(d,c.lin([[0,m.l],[.55,m.b],[1,m.d]],0,0,.6,1),m.o,Math.max(1.6,s*.18))+'<ellipse cx="'+(x-s*.42)+'" cy="'+(y-s*.32)+'" rx="'+(s*.22)+'" ry="'+(s*.15)+'" transform="rotate(-35 '+(x-s*.42)+' '+(y-s*.32)+')" fill="#fff" opacity=".85"/></g>'}
function starPath(x,y,R,r){var d='';for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr=i%2?r:R;d+=(i?'L':'M')+(x+Math.cos(a)*rr).toFixed(1)+','+(y+Math.sin(a)*rr).toFixed(1)}return d+'Z'}
function star(c,x,y,R,m){m=M[m]||m;return '<g>'+P(starPath(x,y,R,R*.5),c.lin([[0,m.l],[.6,m.b],[1,m.d]]),m.o,Math.max(1.6,R*.16))+'<ellipse cx="'+(x-R*.2)+'" cy="'+(y-R*.25)+'" rx="'+(R*.2)+'" ry="'+(R*.13)+'" fill="#fff" opacity=".8"/></g>'}
function heap(c,cx,base,w,h,opt){opt=opt||{};var g=M.gold,s='';
  s+=P('M'+(cx-w)+','+base+' C'+(cx-w*.7)+','+(base-h*.8)+' '+(cx+w*.7)+','+(base-h*.8)+' '+(cx+w)+','+base+'Z',c.lin([[0,g.l],[.5,g.b],[1,g.d]]),g.o,3);
  var n=opt.n||7,rr=(opt.r||9)*1.2;
  for(var j=0;j<2;j++)for(var i=0;i<n-j;i++){var t=(i+.5+j*.5)/n,x=cx-w*.8+t*w*1.6,yy=base-h*(1-Math.pow(2*t-1,2))*(.5+j*.22)-2-(i%2)*4;s+=coin(c,x,yy,rr*(1-j*.12),.48+((i+j)%3)*.08)}
  (opt.gems||[]).forEach(function(q){s+=q[3]==='heart'?heart(c,cx+q[0],base+q[1],q[2],'pink'):q[3]==='star'?star(c,cx+q[0],base+q[1],q[2],'gold'):gem(c,cx+q[0],base+q[1],q[2],q[3])});
  return s}
function scaleG(s,k,inner){return '<g transform="translate(100 178) scale('+s+') translate(-100 -178)">'+inner+'</g>'}
function wrap(c,body,cls){return '<svg class="chest '+(cls||'')+'" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" overflow="visible"><defs>'+c.defs.join('')+'</defs>'+body+'</svg>'}

/* ---------- А и база для В: классический сундук ---------- */
function classic(c,o){
  var L=o.L||30,R=o.R||170,bt=100,bb=170,lh=o.lidH||52,top=bt-lh,mb=M[o.body],mk=M[o.band],r=o.round||Math.min(lh-8,40);
  var mid=(L+R)/2,s='';
  var body='M'+L+','+bt+' H'+R+' V'+(bb-16)+' Q'+R+','+bb+' '+(R-16)+','+bb+' H'+(L+16)+' Q'+L+','+bb+' '+L+','+(bb-16)+'Z';
  var LL=L-4,RR=R+4;
  var lid='M'+LL+','+(bt+6)+' V'+(top+r)+' C'+LL+','+(top+r*.25)+' '+(LL+r*.25)+','+top+' '+(LL+r)+','+top+' H'+(RR-r)+' C'+(RR-r*.25)+','+top+' '+RR+','+(top+r*.25)+' '+RR+','+(top+r)+' V'+(bt+6)+'Z';
  var lidTop='M'+(LL+8)+','+(top+r*.9)+' C'+(LL+8)+','+(top+r*.3)+' '+(LL+r*.35)+','+(top+7)+' '+(LL+r)+','+(top+7)+' H'+(RR-r)+' C'+(RR-r*.35)+','+(top+7)+' '+(RR-8)+','+(top+r*.3)+' '+(RR-8)+','+(top+r*.9)+' C'+(RR-30)+','+(top+r*.62)+' '+(LL+30)+','+(top+r*.62)+' '+(LL+8)+','+(top+r*.9)+'Z';
  var bx=o.bands||[L+20,R-38],bw=o.bandW||18;
  s+=shadow(c,mid,bb+6,(R-L)*.52,9);
  if(o.open){
    var ot=bt-lh*1.08-6;
    s+=glow(c,mid,bt-14,112,o.glow||M.gold.b,.9);
    s+=rays(c,mid,bt-10,118,12,o.glow||'#FFE27A');
    var ol='M'+(L+2)+','+(bt+4)+' L'+(L-8)+','+(ot+22)+' Q'+(L-8)+','+ot+' '+(L+16)+','+ot+' H'+(R-16)+' Q'+(R+8)+','+ot+' '+(R+8)+','+(ot+22)+' L'+(R-2)+','+(bt+4)+'Z';
    var il='M'+(L+13)+','+(bt+4)+' L'+(L+4)+','+(ot+25)+' Q'+(L+4)+','+(ot+12)+' '+(L+20)+','+(ot+12)+' H'+(R-20)+' Q'+(R-4)+','+(ot+12)+' '+(R-4)+','+(ot+25)+' L'+(R-13)+','+(bt+4)+'Z';
    s+=P(ol,c.lin([[0,mb.l],[.5,mb.b],[1,mb.d]]),mb.o,4);
    s+=P(il,c.lin([[0,mb.in||mb.o],[1,mb.d]]),'',0)+'<path d="'+il+'" fill="none" stroke="'+(mb.in||mb.o)+'" stroke-width="3" opacity=".6"/>';
    var lc=c.clip('<path d="'+ol+'"/>');

    s+='<path d="M'+(L+16)+','+(ot+22)+' Q'+(L+18)+','+(ot+14)+' '+(L+30)+','+(ot+14)+'" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>';
    s+='<rect x="'+(L+5)+'" y="'+(bt-12)+'" width="'+(R-L-10)+'" height="22" rx="9" fill="'+(mb.in||mb.o)+'"/>';
    s+='<path d="M'+(L+20)+','+(bt+4)+' L'+(L+40)+',0 H'+(R-40)+' L'+(R-20)+','+(bt+4)+'Z" fill="'+c.lin([[0,'#fff',0],[1,'#FFF6D0',.75]])+'"/>';
    s+=o.treasure?o.treasure(c,mid,bt+4):heap(c,mid,bt+4,(R-L)*.4,40);
  }
  s+='<path d="'+body+'" transform="translate(0 6)" fill="'+mb.o+'"/>';
  s+=P(body,c.lin([[0,mb.b],[1,mb.d]]),mb.o,4);
  var bc=c.clip('<path d="'+body+'"/>');
  s+='<g clip-path="'+bc+'">';
  if(o.planks) s+='<path d="M'+L+','+(bt+24)+' H'+R+' M'+L+','+(bt+48)+' H'+R+'" stroke="'+mb.o+'" stroke-width="3" opacity=".35"/><path d="M'+(L+30)+','+(bt+33)+' q10,-4 20,0 M'+(R-56)+','+(bt+58)+' q10,-4 20,0" stroke="'+mb.d+'" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>';
  s+='<rect x="'+L+'" y="'+(bb-12)+'" width="'+(R-L)+'" height="14" fill="'+mb.o+'" opacity=".18"/>';
  s+='<rect x="'+L+'" y="'+(bt+12)+'" width="'+(R-L)+'" height="9" fill="'+mb.o+'" opacity=".22"/>';
  s+='<rect x="'+(L+6)+'" y="'+(bt+16)+'" width="6" height="'+(bb-bt-34)+'" rx="3" fill="#fff" opacity=".35"/>';
  s+='</g>';
  if(o.decorBody) s+=o.decorBody(c,{L:L,R:R,bt:bt,bb:bb,mid:mid});
  if(!o.open){
    s+='<path d="'+lid+'" transform="translate(0 4)" fill="'+mb.o+'"/>';
    s+=P(lid,c.lin([[0,mb.l],[.55,mb.b],[1,mb.d]]),mb.o,4);
    var lc2=c.clip('<path d="'+lid+'"/>');
    s+='<g clip-path="'+lc2+'">';
    if(o.planks) s+='<path d="M'+L+','+(top+22)+' Q'+mid+','+(top+12)+' '+R+','+(top+22)+'" stroke="'+mb.o+'" stroke-width="3" fill="none" opacity=".3"/>';
    s+='<rect x="'+LL+'" y="'+(bt-10)+'" width="'+(RR-LL)+'" height="16" fill="'+mb.o+'" opacity=".2"/><path d="'+lidTop+'" fill="'+mb.l+'" opacity=".55"/></g>';
    if(o.decorLid) s+=o.decorLid(c,{L:L,R:R,top:top,bt:bt,mid:mid});
    s+='<path d="M'+(L+12)+','+(top+r+4)+' Q'+(L+14)+','+(top+10)+' '+(L+r+14)+','+(top+8)+'" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="'+(L+r+28)+'" cy="'+(top+8)+'" r="3.5" fill="#fff" opacity=".6"/>';
  }
  var sil=o.open?body:body+lid;
  var cc=c.clip('<path d="'+body+'"/>'+(o.open?'':'<path d="'+lid+'"/>'));
  s+='<g clip-path="'+cc+'">'+bx.map(function(x){return '<rect x="'+x+'" y="'+(o.open?bt:0)+'" width="'+bw+'" height="200" fill="'+c.lin([[0,mk.l],[.45,mk.b],[1,mk.d]],0,0,1,0)+'" stroke="'+mk.o+'" stroke-width="3"/>'}).join('')+'</g>';
  if(o.studs) bx.forEach(function(x){[o.open?bt+26:top+16,bt+30,bb-12].forEach(function(y){s+='<circle cx="'+(x+bw/2)+'" cy="'+y+'" r="3.6" fill="'+(o.studs==='gem'?M.pink.b:mk.l)+'" stroke="'+(o.studs==='gem'?M.pink.o:mk.o)+'" stroke-width="1.6"/><circle cx="'+(x+bw/2-1.2)+'" cy="'+(y-1.2)+'" r="1.2" fill="#fff"/>'})});
  s+=P('M'+(L-6)+','+(bt-3)+' H'+(R+6)+' Q'+(R+10)+','+(bt-3)+' '+(R+10)+','+(bt+5)+' Q'+(R+10)+','+(bt+13)+' '+(R+6)+','+(bt+13)+' H'+(L-6)+' Q'+(L-10)+','+(bt+13)+' '+(L-10)+','+(bt+5)+' Q'+(L-10)+','+(bt-3)+' '+(L-6)+','+(bt-3)+'Z',c.lin([[0,mk.l],[.5,mk.b],[1,mk.d]]),mk.o,3.5);
  s+='<rect x="'+(L-4)+'" y="'+(bt-1)+'" width="'+(R-L+8)+'" height="3" rx="1.5" fill="#fff" opacity=".7"/>';
  if(o.baseBand) s+=P('M'+(L-3)+','+(bb-14)+' H'+(R+3)+' V'+(bb-6)+' Q'+(R+3)+','+(bb+2)+' '+(R-8)+','+(bb+2)+' H'+(L+8)+' Q'+(L-3)+','+(bb+2)+' '+(L-3)+','+(bb-6)+'Z',c.lin([[0,mk.l],[.5,mk.b],[1,mk.d]]),mk.o,3);
  if(o.corners) [[L,bb,1,-1],[R,bb,-1,-1]].forEach(function(q){var x=q[0],y=q[1],sx=q[2];s+=P('M'+(x-sx*2)+','+(y-30)+' L'+(x-sx*2)+','+(y+2)+' L'+(x+sx*26)+','+(y+2)+' Q'+(x+sx*14)+','+(y-6)+' '+(x+sx*10)+','+(y-12)+' Q'+(x+sx*6)+','+(y-20)+' '+(x-sx*2)+','+(y-30)+'Z',c.lin([[0,mk.l],[1,mk.d]]),mk.o,3)});
  if(o.feet) [L+8,R-30].forEach(function(x){s+=P('M'+x+','+(bb)+' h22 v6 q0,7 -7,7 h-8 q-7,0 -7,-7z',c.lin([[0,mk.b],[1,mk.d]]),mk.o,3)});
  var ly=bt+4, lk=o.lock||'key';
  s+=P('M'+(mid-17)+','+(ly-8)+' H'+(mid+17)+' Q'+(mid+21)+','+(ly-8)+' '+(mid+21)+','+(ly-4)+' V'+(ly+14)+' Q'+(mid+21)+','+(ly+28)+' '+mid+','+(ly+34)+' Q'+(mid-21)+','+(ly+28)+' '+(mid-21)+','+(ly+14)+' V'+(ly-4)+' Q'+(mid-21)+','+(ly-8)+' '+(mid-17)+','+(ly-8)+'Z',c.lin([[0,mk.l],[.5,mk.b],[1,mk.d]]),mk.o,3.5);
  if(lk==='key') s+='<circle cx="'+mid+'" cy="'+(ly+8)+'" r="5" fill="'+mk.o+'"/><path d="M'+(mid-3)+','+(ly+10)+' L'+(mid-4)+','+(ly+21)+' H'+(mid+4)+' L'+(mid+3)+','+(ly+10)+'Z" fill="'+mk.o+'"/>';
  else if(lk==='heart') s+=heart(c,mid,ly+11,12,'pink');
  else if(lk==='star') s+=star(c,mid,ly+11,12,'gold');
  else s+=gem(c,mid,ly+11,11,lk);
  if(o.crown && !o.open) s+=o.crown(c,mid,top+2);
  if(o.crown && o.open) s+=o.crown(c,mid,bt-lh*1.08-18,true);
  if(o.extra) s+=o.extra(c,{L:L,R:R,top:top,bt:bt,bb:bb,mid:mid});
  if(o.open||o.sparkle){ (o.sp||[[34,40,9],[170,28,7],[178,92,6],[20,96,5]]).forEach(function(q,i){s+=spark(q[0],q[1],q[2],i%2?'#FFF3B0':'#fff')})}
  return s}

function crown(c,x,y,floating){var g=M.gold,w=30,h=26,base=y+4;
  var d='M'+(x-w)+','+base+' L'+(x-w-4)+','+(base-h)+' L'+(x-w*.45)+','+(base-h*.45)+' L'+x+','+(base-h-8)+' L'+(x+w*.45)+','+(base-h*.45)+' L'+(x+w+4)+','+(base-h)+' L'+(x+w)+','+base+'Z';
  var s=(floating?'<g class="ch-float">':'<g>')+P(d,c.lin([[0,g.l],[.6,g.b],[1,g.d]]),g.o,3.5)+
   '<rect x="'+(x-w-1)+'" y="'+(base-5)+'" width="'+(2*w+2)+'" height="9" rx="4.5" fill="'+c.lin([[0,g.l],[1,g.d]])+'" stroke="'+g.o+'" stroke-width="3"/>'+
   '<circle cx="'+(x-w-4)+'" cy="'+(base-h)+'" r="4" fill="'+M.violet.b+'" stroke="'+M.violet.o+'" stroke-width="1.6"/><circle cx="'+(x+w+4)+'" cy="'+(base-h)+'" r="4" fill="'+M.violet.b+'" stroke="'+M.violet.o+'" stroke-width="1.6"/><circle cx="'+x+'" cy="'+(base-h-8)+'" r="4.5" fill="'+M.green.b+'" stroke="'+M.green.o+'" stroke-width="1.6"/>'+
   heart(c,x,base-11,6.5,'pink')+'<path d="M'+(x-w+4)+','+(base-h+8)+' L'+(x-w+8)+','+(base-8)+'" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>';
  return s}

/* ---------- Концепт А · Классика: дерево → серебро → золото ---------- */
var A=[
  function(c,open){return classic(c,{body:'wood',band:'steel',planks:1,lidH:54,open:open,lock:'key',
     treasure:function(c,x,y){return heap(c,x,y,52,30,{n:5,r:9})}})},
  function(c,open){return classic(c,{body:'silver',band:'violet',lidH:54,open:open,studs:1,baseBand:1,lock:'green',glow:M.violet.l,
     treasure:function(c,x,y){return heap(c,x,y,56,40,{n:6,r:9.5,gems:[[-30,-26,9,'violet'],[26,-30,10,'green']]})}})},
  function(c,open){return classic(c,{body:'gold',band:'silver',open:open,studs:'gem',baseBand:1,lock:'heart',sparkle:1,lidH:56,glow:'#FFD45A',
     decorLid:function(c,g){return star(c,g.mid,g.top+18,10,'pink')},
     treasure:function(c,x,y){return heap(c,x,y,60,48,{n:7,r:10,gems:[[-34,-30,10,'violet'],[0,-50,12,'heart'],[32,-34,10,'green']]})}})}
];

/* ---------- Концепт Б · Пухляши: мягкие желейные, цвет по уровню ---------- */
function puffy(c,o){var m=M[o.mat],a=M[o.acc],s='';
  var body='M40,102 C24,102 22,122 24,140 C26,166 46,176 100,176 C154,176 174,166 176,140 C178,122 176,102 160,102Z';
  var lid='M34,110 C14,110 12,66 38,56 C62,46 138,46 162,56 C188,66 186,110 166,110Z';
  s+=shadow(c,100,182,76,9);
  if(o.open){ s+=glow(c,100,84,110,o.glow||M.gold.b,.95)+rays(c,100,88,118,14,o.glow||'#FFE27A');
    s+='<ellipse cx="100" cy="104" rx="66" ry="12" fill="'+m.in+'"/>';
    s+=(o.burst||burst)(c);
  }
  s+='<path d="'+body+'" transform="translate(0 7)" fill="'+m.d+'"/>';
  if(!o.open) s+='<g opacity=".45">'+coin(c,70,150,10,.5)+coin(c,98,156,11,.5)+coin(c,128,148,10,.5)+'</g>';
  s+=P(body,c.lin([[0,m.l],[.35,m.b],[1,m.d]]),'',0,' fill-opacity=".93"');
  s+='<path d="'+body+'" fill="'+c.rad([[0,'#fff',.45],[1,'#fff',0]],.5,.35,.55)+'"/>';
  s+='<path d="M40,160 C60,170 140,170 160,160" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".4"/>';
  s+='<path d="M34,124 C32,134 34,146 40,154" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>';
  [[60,132,4],[146,140,3],[136,124,2.5]].forEach(function(b){s+='<circle cx="'+b[0]+'" cy="'+b[1]+'" r="'+b[2]+'" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>'});
  var lidG='<path d="'+lid+'" transform="translate(0 6)" fill="'+m.d+'"/>'+P(lid,c.lin([[0,m.l],[.6,m.b],[1,m.d]]),'',0)+
    '<path d="'+lid+'" fill="'+c.rad([[0,'#fff',.5],[1,'#fff',0]],.45,.3,.6)+'"/>'+
    [[64,80],[100,74],[136,80]].map(function(q){return '<ellipse cx="'+q[0]+'" cy="'+q[1]+'" rx="6" ry="3.6" fill="'+m.d+'" opacity=".45"/><ellipse cx="'+q[0]+'" cy="'+(q[1]+3)+'" rx="5" ry="1.6" fill="#fff" opacity=".5"/>'}).join('')+
    '<path d="M36,84 C38,70 50,62 74,58" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="88" cy="56" r="4" fill="#fff" opacity=".85"/>'+
    (o.sprinkles?o.sprinkles(c):'');
  if(o.open) s+='<g class="ch-pop" style="transform-origin:100px 80px"><g transform="translate(-6 -58) rotate(-13 100 80)">'+lidG+'</g></g>';
  else s+=lidG;
  // медальон-застёжка
  var mx=100,my=112;
  s+='<circle cx="'+mx+'" cy="'+(my+4)+'" r="19" fill="'+a.d+'"/><circle cx="'+mx+'" cy="'+my+'" r="19" fill="'+c.lin([[0,a.l],[.6,a.b],[1,a.d]])+'"/><circle cx="'+mx+'" cy="'+my+'" r="13" fill="'+c.lin([[0,a.b],[1,a.l]])+'" opacity=".55"/>'+
    '<path d="M'+(mx-11)+','+(my-7)+' Q'+(mx-6)+','+(my-14)+' '+(mx+3)+','+(my-14)+'" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>';
  s+=o.icon(c,mx,my+1);
  if(o.open||o.sparkle) [[30,40,8],[172,34,7],[180,100,5],[18,104,6]].forEach(function(q,i){s+=spark(q[0],q[1],q[2],i%2?'#FFF3B0':'#fff')});
  return s}
function paw(x,y,col){return '<g fill="'+col+'"><ellipse cx="'+x+'" cy="'+(y+3)+'" rx="5.2" ry="4.3"/><circle cx="'+(x-6.4)+'" cy="'+(y-2)+'" r="2.3"/><circle cx="'+(x-2.4)+'" cy="'+(y-6.2)+'" r="2.4"/><circle cx="'+(x+2.4)+'" cy="'+(y-6.2)+'" r="2.4"/><circle cx="'+(x+6.4)+'" cy="'+(y-2)+'" r="2.3"/></g>'}
function burst(c,big){var s='',pts=[[100,40,11],[72,56,10],[128,52,10],[88,74,9],[116,76,9],[58,84,8],[142,82,8]];if(big)pts=pts.concat([[100,18,9],[64,32,8],[138,30,8]]);
  pts.forEach(function(q,i){s+=coin(c,q[0],q[1],q[2],.62-(i%3)*.12)});return s}
var B=[
  function(c,open){return puffy(c,{mat:'green',acc:'gold',open:open,icon:function(c,x,y){return paw(x,y,M.gold.o)},
     burst:function(c){return '<g class="ch-fly">'+[[100,58,10],[76,70,9],[124,68,9],[90,86,8],[112,88,8]].map(function(q,i){return coin(c,q[0],q[1],q[2],.6-(i%2)*.15)}).join('')+'</g>'}})},
  function(c,open){return puffy(c,{mat:'violet',acc:'gold',open:open,glow:M.violet.l,icon:function(c,x,y){return star(c,x,y,9,'violet')},
     burst:function(c){return '<g class="ch-fly">'+burst(c)+gem(c,60,62,9,'green')+gem(c,142,60,9,'pink')+'</g>'}})},
  function(c,open){return puffy(c,{mat:'gold',acc:'pink',open:open,sparkle:1,icon:function(c,x,y){return heart(c,x,y,8.5,'gold')},
     sprinkles:function(c){return [[56,68,'violet',-30],[80,62,'pink',20],[120,62,'green',-15],[146,70,'violet',35],[110,90,'pink',-40],[72,92,'green',10],[132,94,'sky',30]].map(function(q){return '<rect x="'+(q[0]-5)+'" y="'+(q[1]-2)+'" width="10" height="4" rx="2" fill="'+M[q[2]].b+'" transform="rotate('+q[3]+' '+q[0]+' '+q[1]+')"/>'}).join('')},
     burst:function(c){return '<g class="ch-fly">'+burst(c,1)+gem(c,52,58,10,'violet')+heart(c,100,40,13,'pink')+gem(c,150,56,10,'green')+star(c,70,24,8,'gold')+'</g>'}})}
];

/* ---------- Концепт В · Тематические: корзинка → ларец → сокровищница ---------- */
function basket(c,open){var m=M.straw,g=M.green,s='';
  var body='M28,100 H172 L162,164 Q160,175 148,175 H52 Q40,175 38,164Z';
  s+=shadow(c,100,182,70,9);
  if(open) s+=glow(c,100,86,100,M.gold.b,.9)+rays(c,100,90,110,10,'#FFE27A');
  // ручка
  s+='<path d="M44,98 C44,30 156,30 156,98" stroke="'+m.o+'" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M44,98 C44,30 156,30 156,98" stroke="'+c.lin([[0,m.l],[1,m.d]])+'" stroke-width="11" fill="none" stroke-linecap="round"/>'+
     '<path d="M44,98 C44,30 156,30 156,98" stroke="'+m.d+'" stroke-width="11" fill="none" stroke-dasharray="3 7" opacity=".55"/><path d="M52,74 C58,50 80,42 100,41" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>';
  if(open){ s+='<rect x="34" y="88" width="132" height="20" rx="9" fill="'+m.in+'"/>'+heap(c,100,104,54,34,{n:5,r:9,gems:[[28,-24,8,'green']]});}
  s+='<path d="'+body+'" transform="translate(0 6)" fill="'+m.o+'"/>';
  s+=P(body,c.lin([[0,m.b],[1,m.d]]),m.o,4);
  var bc=c.clip('<path d="'+body+'"/>'),w='';
  for(var r=0;r<6;r++){var y=106+r*12;for(var x=20+(r%2)*10;x<190;x+=20){w+='<rect x="'+(x-8)+'" y="'+(y-4.5)+'" width="16" height="9" rx="4.5" fill="'+c.lin([[0,m.l],[1,m.b]])+'" stroke="'+m.d+'" stroke-width="1.6"/>'}}
  s+='<g clip-path="'+bc+'">'+w+'<rect x="0" y="160" width="200" height="20" fill="'+m.o+'" opacity=".18"/><path d="M36,112 L44,160" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/></g>';
  // ободок-косичка
  s+='<rect x="22" y="92" width="156" height="17" rx="8.5" fill="'+c.lin([[0,m.l],[1,m.d]])+'" stroke="'+m.o+'" stroke-width="3.5"/>';
  for(var i=0;i<14;i++) s+='<path d="M'+(30+i*10.6)+',95 l6,11" stroke="'+m.d+'" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>';
  s+='<rect x="26" y="94.5" width="148" height="3" rx="1.5" fill="#fff" opacity=".6"/>';
  if(!open){
    var cl='M24,100 C26,70 58,56 100,58 C142,56 174,70 176,100 C168,112 156,100 146,112 C134,102 122,116 100,108 C80,116 66,102 54,112 C44,100 32,112 24,100Z';
    var pat='ckp'+(++uid);
    c.defs.push('<pattern id="'+pat+'" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="16" height="16" fill="'+g.l+'"/><rect width="8" height="16" fill="'+g.b+'" opacity=".55"/><rect width="16" height="8" fill="'+g.b+'" opacity=".55"/></pattern>');
    s+='<path d="'+cl+'" transform="translate(0 4)" fill="'+g.d+'"/>'+P(cl,'url(#'+pat+')',g.o,3.5)+'<path d="'+cl+'" fill="'+c.lin([[0,'#fff',.35],[1,'#fff',0]])+'"/>'+
       '<path d="M40,84 C46,72 64,64 86,62" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>'+
       '<path d="M82,70 Q100,90 118,72" stroke="'+g.d+'" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>';
    s+='<path d="M44,98 C44,30 156,30 156,98" stroke="'+m.o+'" stroke-width="0" fill="none"/>';
  } else {
    var fl='M30,104 C20,110 18,140 26,150 C34,144 40,150 46,142 C44,128 46,114 52,104Z';
    s+=P(fl,g.b,g.o,3)+'<path d="M30,108 C26,122 26,134 28,144" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>';
  }
  // бирка-сердечко
  s+='<path d="M100,106 v6" stroke="'+m.o+'" stroke-width="3"/>'+heart(c,100,124,12,'pink');
  if(open) [[30,44,8],[172,36,7],[178,96,5],[20,92,6]].forEach(function(q,i){s+=spark(q[0],q[1],q[2],i%2?'#FFF3B0':'#fff')});
  return s}
var Cc=[
  function(c,open){return basket(c,open)},
  function(c,open){return classic(c,{body:'violet',band:'gold',L:42,R:158,lidH:62,round:50,bands:[],baseBand:1,corners:1,open:open,lock:'star',feet:1,glow:M.violet.l,
     decorBody:function(c,g){return '<path d="M'+(g.L+30)+','+(g.bt+34)+' c-8,-2 -10,10 -2,12 c6,1 8,-6 3,-7 M'+(g.R-30)+','+(g.bt+34)+' c8,-2 10,10 2,12 c-6,1 -8,-6 -3,-7" stroke="'+M.gold.b+'" stroke-width="3" fill="none" stroke-linecap="round"/>'},
     decorLid:function(c,g){return [-24,0,24].map(function(dx,i){return gem(c,g.mid+dx,g.top+30-(i==1?4:0),i==1?7:5.5,i==1?'pink':'gold')}).join('')},
     crown:function(c,x,y,fl){return (fl?'<g class="ch-float">':'<g>')+star(c,x,y-6,13,'gold')+'</g>'},
     treasure:function(c,x,y){return heap(c,x,y,46,40,{n:5,r:9,gems:[[-24,-28,9,'green'],[22,-30,9,'pink'],[0,-44,10,'star']]})}})},
  function(c,open){return classic(c,{body:'gold',band:'violet',L:22,R:178,lidH:62,round:48,bands:[40,142],bandW:18,open:open,lock:'heart',studs:'gem',baseBand:1,sparkle:1,crown:crown,
     treasure:function(c,x,y){return heap(c,x,y,68,52,{n:8,r:10,gems:[[-40,-30,10,'violet'],[38,-34,10,'green'],[-12,-50,9,'pink'],[16,-52,9,'star']]})},
     extra:function(c,g){return open?'':'<g class="ch-orbit" style="transform-origin:100px 96px">'+star(c,16,64,7,'gold')+star(c,186,58,6,'gold')+star(c,184,128,5,'gold')+'</g>'}})}
];

var SETS={a:A,b:B,c:Cc};
var SCALE=[.82,.91,1];
window.CH={
  svg:function(con,tier,open,opt){opt=opt||{};var c=C();var inner=SETS[con][tier](c,!!open);
    var k=opt.noScale?1:SCALE[tier];return wrap(c,k===1?inner:scaleG(k,0,inner),(opt.cls||'')+(open?' is-open':''));},
  M:M
};
})();
