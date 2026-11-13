/* Нижнее меню с иконками из «Игр» (/workspace/tapyshi-redesign/2-games/shared/tabbar.js), цвета — токены. */
(function(){
var I={
 pet:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5.4" ry="4.4" fill="currentColor"/><circle cx="5.6" cy="10.4" r="2.3" fill="currentColor"/><circle cx="9.3" cy="6.2" r="2.4" fill="currentColor"/><circle cx="14.7" cy="6.2" r="2.4" fill="currentColor"/><circle cx="18.4" cy="10.4" r="2.3" fill="currentColor"/></svg>',
 clan:'<svg viewBox="0 0 24 24"><path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z" fill="currentColor"/><path class="cut" d="M12 7.6l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" opacity=".9"/></svg>',
 games:'<svg viewBox="0 0 24 24"><path d="M7.5 6.5h9a5 5 0 0 1 4.9 4.1l.9 5.1a2.9 2.9 0 0 1-5 2.4L15.6 16H8.4l-1.7 2.1a2.9 2.9 0 0 1-5-2.4l.9-5.1A5 5 0 0 1 7.5 6.5z" fill="currentColor"/><path class="cut-s" d="M7.6 9.6v3.6M5.8 11.4h3.6" stroke-width="1.9" stroke-linecap="round"/><circle class="cut" cx="15.6" cy="10.4" r="1.2"/><circle class="cut" cx="17.6" cy="12.6" r="1.2"/></svg>',
 shop:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 11.2A2 2 0 0 1 16 21H8a2 2 0 0 1-2-1.8z" fill="currentColor"/><path d="M8.8 10V7a3.2 3.2 0 0 1 6.4 0v3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
};
T.nav=function(active){var t=[['pet','Питомец'],['games','Игры'],['clan','Клан'],['shop','Магазин']];
  return '<nav class="nav">'+t.map(function(x){return '<a href="#" class="tap'+(x[0]===active?' on':'')+'" data-nav="'+x[0]+'"><span class="ic">'+I[x[0]]+'</span>'+x[1]+(x[0]==='games'?'<i class="nb"></i>':'')+'</a>'}).join('')+'</nav>';};
/* иконки с цветами из токенов (вместо сырых цветов в app.js) */
T.IC.cup='<svg viewBox="0 0 24 24" class="trophy"><path d="M7 3.5 H17 V9 Q17 14 12 14.6 Q7 14 7 9Z" style="fill:var(--sun);stroke:var(--sun-edge)" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.5 H4.2 Q4 9.6 7.6 10.6 M17 5.5 H19.8 Q20 9.6 16.4 10.6" fill="none" style="stroke:var(--sun-edge)" stroke-width="1.6" stroke-linecap="round"/><path d="M10.6 14.4 H13.4 L13.9 17.6 H10.1Z" style="fill:var(--sun-edge)"/><rect x="7.6" y="17.4" width="8.8" height="3.4" rx="1.2" style="fill:var(--sun-edge)"/></svg>';
T.IC.crown='<svg viewBox="0 0 24 24"><path d="M3.5 8 L8 12 L12 5 L16 12 L20.5 8 L19 18 H5Z" style="fill:var(--sun);stroke:var(--sun-edge)" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="14.2" r="1.5" style="fill:var(--white)" opacity=".85"/></svg>';
T.IC.max='<svg viewBox="0 0 24 24"><path d="M12 3.5 C7 3.5 3.5 7 3.5 11.6 C3.5 14 4.4 15.9 6 17.3 L5.2 20.5 L8.7 18.9 C9.7 19.3 10.8 19.6 12 19.6 C17 19.6 20.5 16.1 20.5 11.6 C20.5 7 17 3.5 12 3.5Z" style="fill:var(--white)"/></svg>';
T.IC.chat='<svg viewBox="0 0 24 24"><path d="M4 5.5 Q4 3.5 6 3.5 H18 Q20 3.5 20 5.5 V14.5 Q20 16.5 18 16.5 H11 L6.5 20.5 V16.5 H6 Q4 16.5 4 14.5Z" fill="currentColor"/><circle class="cut" cx="8.6" cy="10" r="1.3"/><circle class="cut" cx="12" cy="10" r="1.3"/><circle class="cut" cx="15.4" cy="10" r="1.3"/></svg>';
})();
