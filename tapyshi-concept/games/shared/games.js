/* Тапыши · Игры — данные каталога и обложки (SVG-сцены игр).
   Питомцы — готовые 3D-спрайты (pets/*.webp из /workspace/tapyshi/current/pets/sprites).
   Рекорды — примерные значения для макета. */
(function(){
var F='font-family="Nunito,sans-serif" font-weight="900"';
var P={};

/* Крестики-нолики · блиц: доска в разгаре, линия победы, таймер 15 с */
P.ttt='<svg viewBox="0 0 120 120"><defs><linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#F6F2FF"/></linearGradient></defs>'+
'<rect x="10" y="16" width="100" height="100" rx="26" fill="#D9CEFF"/>'+
'<rect x="10" y="10" width="100" height="100" rx="26" fill="url(#tb)"/>'+
'<path d="M44 22v76M76 22v76M22 44h76M22 76h76" stroke="#E6E0FA" stroke-width="5" stroke-linecap="round"/>'+
'<g stroke="#FF8A3D" stroke-width="8" stroke-linecap="round"><path d="M26 26l12 12M38 26L26 38"/><path d="M54 54l12 12M66 54L54 66"/><path d="M82 82l12 12M94 82L82 94"/></g>'+
'<g fill="none" stroke="#2FC48C" stroke-width="7"><circle cx="92" cy="28" r="8"/><circle cx="28" cy="92" r="8"/></g>'+
'<path d="M24 24L96 96" stroke="#8B6CFF" stroke-width="6" stroke-linecap="round" opacity=".9"/></svg>';

/* 4 в ряд: синяя рамка, фишки, падающая фишка и бомба */
P.c4='<svg viewBox="0 0 120 120"><rect x="8" y="30" width="104" height="86" rx="22" fill="#2F6FE0"/><rect x="8" y="26" width="104" height="86" rx="22" fill="#4C8EFF"/>'+
'<g fill="#E8F1FF">'+[0,1,2,3].map(function(c){return [0,1,2].map(function(r){return '<circle cx="'+(29+c*21)+'" cy="'+(47+r*22)+'" r="8"/>';}).join('');}).join('')+'</g>'+
'<g><circle cx="29" cy="91" r="8" fill="#FF5A6A"/><circle cx="50" cy="91" r="8" fill="#FFC94D"/><circle cx="71" cy="91" r="8" fill="#FF5A6A"/><circle cx="92" cy="91" r="8" fill="#FF5A6A"/><circle cx="50" cy="69" r="8" fill="#FF5A6A"/><circle cx="71" cy="69" r="8" fill="#FFC94D"/><circle cx="71" cy="47" r="8" fill="#FFC94D"/></g>'+
'<g fill="#fff" opacity=".55"><circle cx="26" cy="88" r="2.4"/><circle cx="47" cy="88" r="2.4"/><circle cx="68" cy="88" r="2.4"/><circle cx="89" cy="88" r="2.4"/><circle cx="47" cy="66" r="2.4"/><circle cx="68" cy="66" r="2.4"/><circle cx="68" cy="44" r="2.4"/></g>'+
'<circle cx="92" cy="12" r="9" fill="#FF5A6A"/><circle cx="89" cy="9" r="2.6" fill="#fff" opacity=".6"/><path d="M92 26v-4M92 28v1" stroke="#FF5A6A" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>'+
'<circle cx="30" cy="14" r="10" fill="#2E3150"/><circle cx="26.5" cy="10.5" r="3" fill="#fff" opacity=".45"/><path d="M36 6q4-5 8-2" stroke="#B88A5A" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="45" cy="4" r="3" fill="#FFC94D"/></svg>';

/* Сложи блоки: поле, собранная линия и падающая фигура */
P.blocks='<svg viewBox="0 0 120 120"><rect x="8" y="14" width="104" height="104" rx="24" fill="#FFD0E1"/><rect x="8" y="10" width="104" height="104" rx="24" fill="#fff"/>'+
(function(){var s='',C={'0,4':'#4FA6FF','1,4':'#4FA6FF','1,3':'#4FA6FF','4,4':'#5CCB8F','4,3':'#5CCB8F','3,4':'#5CCB8F','0,1':'#9B83FF','0,2':'#9B83FF','4,1':'#FFB547'};
for(var r=0;r<5;r++)for(var c=0;c<5;c++){var k=c+','+r,x=18+c*17.5,y=20+r*17.5;
 if(r===2){s+='<rect x="'+x+'" y="'+y+'" width="15" height="15" rx="4.5" fill="#FFD84D"/><rect x="'+(x+2)+'" y="'+(y+2)+'" width="11" height="4" rx="2" fill="#fff" opacity=".55"/>';}
 else if(C[k]){s+='<rect x="'+x+'" y="'+y+'" width="15" height="15" rx="4.5" fill="'+C[k]+'"/><rect x="'+(x+2)+'" y="'+(y+2)+'" width="11" height="4" rx="2" fill="#fff" opacity=".45"/>';}
 else s+='<rect x="'+x+'" y="'+y+'" width="15" height="15" rx="4.5" fill="#F4EEF8"/>';}
return s;})()+
'<rect x="12" y="52" width="96" height="23" rx="9" fill="none" stroke="#FFC233" stroke-width="3" opacity=".8"/>'+
'<g transform="translate(78 -4) rotate(14)"><rect x="0" y="0" width="14" height="14" rx="4.5" fill="#FF6FA3"/><rect x="15" y="0" width="14" height="14" rx="4.5" fill="#FF6FA3"/><rect x="15" y="15" width="14" height="14" rx="4.5" fill="#FF6FA3"/><g fill="#fff" opacity=".5"><rect x="2" y="2" width="10" height="3.5" rx="1.7"/><rect x="17" y="2" width="10" height="3.5" rx="1.7"/></g></g></svg>';

/* 2048: персиковые плитки, золотая 2048 */
P['2048']='<svg viewBox="0 0 120 120"><rect x="8" y="14" width="104" height="104" rx="26" fill="#F2B58C"/><rect x="8" y="10" width="104" height="104" rx="26" fill="#FFD9BF"/>'+
'<rect x="17" y="19" width="41" height="41" rx="12" fill="#fff"/><text x="37.5" y="49" font-size="26" text-anchor="middle" fill="#F08A55" '+F+'>2</text>'+
'<rect x="62" y="19" width="41" height="41" rx="12" fill="#FFB487"/><text x="82.5" y="49" font-size="26" text-anchor="middle" fill="#fff" '+F+'>4</text>'+
'<rect x="17" y="64" width="41" height="41" rx="12" fill="#FF8F4F"/><text x="37.5" y="94" font-size="24" text-anchor="middle" fill="#fff" '+F+'>16</text>'+
'<rect x="62" y="68" width="41" height="41" rx="12" fill="#E5A400"/><rect x="62" y="64" width="41" height="41" rx="12" fill="#FFCF3F"/><rect x="66" y="67" width="33" height="7" rx="3.5" fill="#fff" opacity=".45"/><text x="82.5" y="91" font-size="15" text-anchor="middle" fill="#fff" '+F+'>2048</text></svg>';

/* Найди корабль: море в клетку, корабль, попадание и сонар */
P.ship='<svg viewBox="0 0 120 120"><rect x="8" y="14" width="104" height="104" rx="26" fill="#9FDCEE"/><rect x="8" y="10" width="104" height="104" rx="26" fill="#DDF5FC"/>'+
'<g stroke="#B9E6F3" stroke-width="2">'+[1,2,3,4].map(function(i){var v=8+i*20.8;return '<path d="M'+v+' 14v96M12 '+(10+i*20.8)+'h96"/>';}).join('')+'</g>'+
'<g opacity=".9"><circle cx="76" cy="72" r="30" fill="none" stroke="#1FB3D6" stroke-width="2.5" opacity=".35"/><circle cx="76" cy="72" r="19" fill="none" stroke="#1FB3D6" stroke-width="2.5" opacity=".55"/><path d="M76 72L101 56A30 30 0 0 1 104 76Z" fill="#1FB3D6" opacity=".22"/></g>'+
'<g transform="translate(18 30)"><path d="M0 18h52l-8 12H8z" fill="#FF6F7E"/><path d="M0 18h52l-2 3H2z" fill="#fff" opacity=".35"/><rect x="12" y="8" width="22" height="10" rx="4" fill="#fff"/><circle cx="18" cy="13" r="2.2" fill="#4FA6FF"/><circle cx="27" cy="13" r="2.2" fill="#4FA6FF"/><rect x="21" y="-8" width="3" height="16" rx="1.5" fill="#2E3150"/><path d="M24 -7l11 4.5L24 2z" fill="#FFC94D"/></g>'+
'<g transform="translate(76 72)"><circle r="9" fill="#FF5A6A"/><path d="M-4-4l8 8M4-4l-8 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>'+
'<circle cx="34" cy="90" r="4" fill="#fff" stroke="#9FD3E4" stroke-width="2"/><circle cx="96" cy="30" r="4" fill="#fff" stroke="#9FD3E4" stroke-width="2"/></svg>';

/* Шашки: деревянная доска, бой через шашку, дамка */
P.checkers='<svg viewBox="0 0 120 120"><rect x="8" y="14" width="104" height="104" rx="24" fill="#D9A06B"/><rect x="8" y="10" width="104" height="104" rx="24" fill="#FFEBD2"/>'+
'<clipPath id="ck"><rect x="14" y="16" width="92" height="92" rx="18"/></clipPath><g clip-path="url(#ck)" fill="#F0BE88">'+
(function(){var s='';for(var r=0;r<4;r++)for(var c=0;c<4;c++)if((r+c)%2)s+='<rect x="'+(14+c*23)+'" y="'+(16+r*23)+'" width="23" height="23"/>';return s;})()+'</g>'+
'<path d="M37 85Q50 52 83 39" stroke="#2FC48C" stroke-width="3.5" stroke-dasharray="1 7" stroke-linecap="round" fill="none"/>'+
'<g><ellipse cx="60" cy="66" rx="11" ry="9" fill="#5A3A20" opacity=".18"/><circle cx="60" cy="62" r="10.5" fill="#fff" stroke="#E9DDCF" stroke-width="2"/><circle cx="60" cy="62" r="6" fill="none" stroke="#E9DDCF" stroke-width="2"/></g>'+
'<g opacity=".5"><circle cx="37" cy="85" r="10" fill="none" stroke="#2FC48C" stroke-width="2.5" stroke-dasharray="4 3"/></g>'+
'<g><ellipse cx="83" cy="43" rx="12" ry="9" fill="#5A3A20" opacity=".2"/><circle cx="83" cy="38" r="11" fill="#2FC48C"/><circle cx="83" cy="38" r="6.5" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="79" cy="34" r="2.6" fill="#fff" opacity=".7"/></g>'+
'<g><ellipse cx="37" cy="40" rx="11" ry="8" fill="#5A3A20" opacity=".18"/><circle cx="37" cy="35" r="10.5" fill="#fff" stroke="#E9DDCF" stroke-width="2"/><path d="M31 38l2-7 4 4 4-4 2 7z" fill="#FFC233"/></g></svg>';

/* Города: две реплики, последняя буква подсвечена, таймер */
P.city='<svg viewBox="0 0 120 120">'+
'<rect x="6" y="22" width="78" height="30" rx="15" fill="#fff"/><path d="M14 50l-4 9 12-7z" fill="#fff"/>'+
'<text x="18" y="43" font-size="16" fill="#3D3560" '+F+'>Москв<tspan fill="#FF7A2E">а</tspan></text>'+
'<rect x="36" y="64" width="78" height="30" rx="15" fill="#FF8A3D"/><path d="M106 92l4 9-12-7z" fill="#FF8A3D"/>'+
'<text x="47" y="85" font-size="16" fill="#fff" '+F+'><tspan fill="#FFE27A">А</tspan>бакан</text>'+
'<g transform="translate(98 22)"><circle r="14" fill="#fff"/><circle r="10.5" fill="none" stroke="#FFE0C8" stroke-width="3.5"/><path d="M0 -10.5A10.5 10.5 0 1 1 -9 5.4" fill="none" stroke="#2FC48C" stroke-width="3.5" stroke-linecap="round"/><text y="4.5" font-size="11" text-anchor="middle" fill="#3D3560" '+F+'>20</text></g>'+
'<g transform="translate(16 104)" fill="#FFB27A"><rect x="0" y="-6" width="9" height="14" rx="2.5"/><rect x="11" y="-14" width="11" height="22" rx="2.5" fill="#FF8A3D"/><rect x="24" y="-9" width="9" height="17" rx="2.5" fill="#4C8EFF"/></g></svg>';

/* Секретное слово: буквы и свайп пальцем */
P.word='<svg viewBox="0 0 120 120"><rect x="8" y="14" width="104" height="104" rx="24" fill="#F3D27A"/><rect x="8" y="10" width="104" height="104" rx="24" fill="#FFF7DC"/>'+
(function(){var L=['С','Ы','Р','Л','К','О','Т','А','Ш','Е','М','Б','И','Н','Д','У'],s='';
 for(var i=0;i<16;i++){var c=i%4,r=(i/4)|0,x=17+c*22,y=19+r*22,on=(i===4||i===5||i===6);
  s+='<rect x="'+x+'" y="'+y+'" width="19" height="19" rx="6" fill="'+(on?'#FFC233':'#fff')+'"/>';
  s+='<text x="'+(x+9.5)+'" y="'+(y+14)+'" font-size="12" text-anchor="middle" fill="'+(on?'#fff':'#5B5480')+'" '+F+'>'+L[i]+'</text>';}
 return s;})()+
'<path d="M26.5 50.5H70.5" stroke="#FF9F1C" stroke-width="5" stroke-linecap="round" opacity=".35"/>'+
'<g transform="translate(74 58) rotate(-18)"><path d="M6 0c3 0 5 2 5 5v12l3-2c2-1 4 0 5 2l-9 15H2l-5-14c-1-2 0-4 2-4s3 1 4 3V5c0-3 2-5 5-5z" fill="#fff" stroke="#3D3560" stroke-width="2.4" stroke-linejoin="round"/></g></svg>';

window.TAP_PROPS=P;
window.TAP_GAMES=[
 {id:'tictactoe',title:'Крестики-нолики',short:'Крестики',desc:'Блиц: 15 секунд на всю партию',mode:'duo',pet:'raccoon',pose:'happy',prop:'ttt',extra:'<span class="xchip" style="left:16px;bottom:16px"><svg viewBox="0 0 20 20"><circle cx="10" cy="11" r="7" class="ico-white" stroke="currentColor" stroke-width="2.4"/><path d="M10 7.5V11l2.4 1.6M8 2.5h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>15 с на партию</span>',c:'var(--game-ttt)',cd:'var(--game-ttt-edge)',bg1:'var(--game-ttt-soft)',bg2:'var(--game-ttt-cover)',rec:'7 побед',recLabel:'Рекорд'},
 {id:'four-in-a-row',short:'4 в ряд',title:'4 в ряд',desc:'Собери линию и взорви бомбой',mode:'duo',pet:'goose',pose:'happy',prop:'c4',c:'var(--game-c4)',cd:'var(--game-c4-edge)',bg1:'var(--game-c4-soft)',bg2:'var(--game-c4-cover)',rec:'5 побед',recLabel:'Рекорд'},
 {id:'battleship',short:'Корабль',title:'Найди корабль',desc:'Морской бой с сонаром',mode:'duo',pet:'dragon',pose:'neutral',prop:'ship',c:'var(--game-ship)',cd:'var(--game-ship-edge)',bg1:'var(--game-ship-soft)',bg2:'var(--game-ship-cover)',rec:'12 побед',recLabel:'Рекорд'},
 {id:'checkers',short:'Шашки',title:'Шашки',desc:'Русские шашки и «Верни шашку»',mode:'duo',pet:'capybara',pose:'neutral',prop:'checkers',c:'var(--game-checkers)',cd:'var(--game-checkers-edge)',bg1:'var(--game-checkers-soft)',bg2:'var(--game-checkers-cover)',rec:'4 победы',recLabel:'Рекорд'},
 {id:'goroda',short:'Города',title:'Города',desc:'Слова на время: от последней буквы',mode:'duo',pet:'goose',pose:'happy',prop:'city',c:'var(--game-goroda)',cd:'var(--game-goroda-edge)',bg1:'var(--game-goroda-soft)',bg2:'var(--game-goroda-cover)',rec:'9 побед',recLabel:'Рекорд'},
 {id:'slozhi-bloki',short:'Блоки',title:'Сложи блоки',desc:'Заполняй ряды и собирай комбо',mode:'solo',pet:'dragon',pose:'happy',prop:'blocks',extra:'<span class="xchip" style="left:16px;bottom:16px">Комбо ×3</span>',c:'var(--game-blocks)',cd:'var(--game-blocks-edge)',bg1:'var(--game-blocks-soft)',bg2:'var(--game-blocks-cover)',rec:'1 240',recLabel:'Рекорд'},
 {id:'2048',short:'2048',title:'2048',desc:'Сливай плитки, есть отмена хода',mode:'solo',pet:'capybara',pose:'neutral',prop:'2048',c:'var(--game-2048)',cd:'var(--game-2048-edge)',bg1:'var(--game-2048-soft)',bg2:'var(--game-2048-cover)',rec:'3 560',recLabel:'Рекорд'},
 {id:'secret-word',short:'Слово',title:'Секретное слово',desc:'Найди все спрятанные слова',mode:'solo',pet:'raccoon',pose:'neutral',prop:'word',c:'var(--game-word)',cd:'var(--game-word-edge)',bg1:'var(--game-word-soft)',bg2:'var(--game-word-cover)',rec:'1:48',recLabel:'Рекорд'}
];
window.TAP_PET=function(g,base){return (base||'../shared/pets/')+g.pet+'_'+g.pose+'.webp';};
window.TAP_ICON={
 duo:'<svg viewBox="0 0 20 20"><circle cx="7" cy="6.5" r="3.2" fill="currentColor"/><circle cx="14" cy="7.5" r="2.6" fill="currentColor" opacity=".7"/><path d="M1.5 16.5c.5-3.3 2.7-5 5.5-5s5 1.7 5.5 5z" fill="currentColor"/><path d="M13 16.5c-.2-1.6-.8-2.9-1.8-3.9.8-.6 1.7-.9 2.8-.9 2.3 0 4 1.4 4.5 4.8z" fill="currentColor" opacity=".7"/></svg>',
 solo:'<svg viewBox="0 0 20 20"><circle cx="10" cy="6.5" r="3.4" fill="currentColor"/><path d="M4 17c.6-3.6 3-5.4 6-5.4s5.4 1.8 6 5.4z" fill="currentColor"/></svg>',
 cup:'<svg viewBox="0 0 20 20"><path d="M5 2.5h10v4.2a5 5 0 0 1-10 0z" class="ico-sun"/><path d="M5 4H2.6v1.3A3.3 3.3 0 0 0 5.6 9M15 4h2.4v1.3A3.3 3.3 0 0 1 14.4 9" style="stroke:var(--sun)" stroke-width="1.8" fill="none"/><rect x="8.6" y="11" width="2.8" height="3.2" class="ico-sun-edge"/><rect x="5.8" y="14" width="8.4" height="3.4" rx="1.5" class="ico-sun-edge"/><rect x="7" y="3.6" width="2" height="4" rx="1" class="ico-white" opacity=".6"/></svg>',
 play:'<svg viewBox="0 0 12 12"><path d="M3 1.6v8.8a.7.7 0 0 0 1.05.6l7-4.4a.7.7 0 0 0 0-1.2l-7-4.4A.7.7 0 0 0 3 1.6z" fill="currentColor"/></svg>'
};
})();
