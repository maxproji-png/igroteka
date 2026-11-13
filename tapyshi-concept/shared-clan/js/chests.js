/* Магазин сундуков — общие данные (СОДЕРЖИМОЕ, ШАНСЫ И ЦЕНЫ — ПРИМЕР) и лист «что внутри». Оплата только монетами. */
(function(){
var S = T.ch = {};
S.bal = 12000;
S.R = { c:{n:'Обычный',k:'c'}, r:{n:'Редкий',k:'r'}, l:{n:'Легендарный',k:'l'} };
var I=function(p){return T.img(p+'.png');};
S.list = [
 { id:'wood', n:'Деревянный', img:'v2/chest-wood', p:300, r:'c', tint:'var(--sun-l)',
   loot:[['items/icon-coin','150–400 монет',70],['items/boost-energy','Энергия +100',25],['v2/toy-ball','Мячик-радуга',5]] },
 { id:'candy', n:'Сладкий', img:'v2/chest-candy', p:800, r:'c', tint:'var(--lav-l)',
   loot:[['items/food-cookie','Печенька: энергия +300',50],['items/icon-coin','400–900 монет',40],['items/food-cupcake','Кекс: энергия +600',10]] },
 { id:'mint', n:'Цветочный', img:'v2/chest-mint', p:1500, r:'r', tint:'var(--green-l)',
   loot:[['items/icon-coin','800–1 600 монет',45],['v2/furn-plant','Монстера для комнаты',35],['items/boost-regen','Энергия ×2 на 1 час',20]] },
 { id:'crystal', n:'Кристальный', img:'v2/chest-crystal', p:2500, r:'r', tint:'var(--lav-l)',
   loot:[['items/icon-coin','1 500–3 000 монет',50],['items/boost-coins','Двойные монеты 30 мин',35],['v2/toy-yarn','Клубок-игрушка',15]] },
 { id:'gold', n:'Королевский', img:'v2/chest-gold', p:5000, r:'l', tint:'var(--sun-l)',
   loot:[['items/icon-coin','3 000–7 000 монет',55],['v2/furn-lamp','Лампа-грибок',30],['v2/toy-star','Звёздочка-сплюшка',15]] },
 { id:'star', n:'Звёздный', img:'v2/chest-star', p:15000, r:'l', tint:'var(--lav-l)',
   loot:[['items/icon-coin','10 000–25 000 монет',60],['v2/furn-aquarium','Аквариум',30],['v2/furn-bed','Лежанка-облачко',10]] } ];
S.by = function(id){ for(var i=0;i<S.list.length;i++) if(S.list[i].id===id) return S.list[i]; };
S.I = I;
S.price = function(p){ return T.coin()+'<span class="num">'+T.fmt(p)+'</span>'; };
S.rar = function(c){ return '<span class="rar '+c.r+'">'+S.R[c.r].n+'</span>'; };
S.lootRows = function(c){ return '<div class="loot">'+c.loot.map(function(l){
  return '<div class="lrow"><span class="li"><img src="'+I(l[0])+'" alt=""></span><span class="ln">'+l[1]+'</span><span class="lp">'+l[2]+'%</span></div>';}).join('')+'</div>'; };
S.buyBtn = function(c){ var lack=c.p-S.bal;
  if(lack>0) return '<button class="btn block lack tap" data-lack>Не хватает '+S.price(lack)+'</button><p class="after">Монеты дают за тапы, игры и награды клана</p>';
  return '<button class="btn gold block tap" data-buy="'+c.id+'">Открыть за '+S.price(c.p)+'</button><p class="after">После покупки останется '+T.fmt(S.bal-c.p)+' монет</p>'; };
S.sheet = function(id){ var c=S.by(id);
  T.sheet('<div class="sh-ch"><span class="disc" style="background:'+c.tint+'"></span><img src="'+I(c.img)+'" alt=""></div><div class="sh-t"><b>'+c.n+' сундук</b>'+S.rar(c)+'</div>'+
    '<div class="sh-sub">Что может выпасть · шанс</div>'+S.lootRows(c)+S.buyBtn(c)); S.bind(); };
S.bind = function(){ [].forEach.call(document.querySelectorAll('[data-buy]'),function(b){ if(b._b)return; b._b=1; b.addEventListener('click',function(){ T.burst&&T.burst(b); T.toast('Сундук открывается…'); }); });
  [].forEach.call(document.querySelectorAll('[data-lack]'),function(b){ if(b._b)return; b._b=1; b.addEventListener('click',function(){ b.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:300}); }); }); };
})();
