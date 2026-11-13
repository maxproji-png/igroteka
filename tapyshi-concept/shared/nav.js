/* Единое нижнее меню: Питомец · Игры · Клан · Магазин.
   На странице: <html data-root="./" data-tab="pet"> — data-root ведёт к корню концепта. */
(function () {
  var I = {
    pet: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5.4" ry="4.4" fill="currentColor"/><circle cx="5.6" cy="10.4" r="2.3" fill="currentColor"/><circle cx="9.3" cy="6.2" r="2.4" fill="currentColor"/><circle cx="14.7" cy="6.2" r="2.4" fill="currentColor"/><circle cx="18.4" cy="10.4" r="2.3" fill="currentColor"/></svg>',
    games: '<svg viewBox="0 0 24 24"><path d="M7.5 6.5h9a5 5 0 0 1 4.9 4.1l.9 5.1a2.9 2.9 0 0 1-5 2.4L15.6 16H8.4l-1.7 2.1a2.9 2.9 0 0 1-5-2.4l.9-5.1A5 5 0 0 1 7.5 6.5z" fill="currentColor"/><path class="cut-s" d="M7.6 9.6v3.6M5.8 11.4h3.6" stroke-width="1.9" stroke-linecap="round"/><circle class="cut" cx="15.6" cy="10.4" r="1.2"/><circle class="cut" cx="17.6" cy="12.6" r="1.2"/></svg>',
    clan: '<svg viewBox="0 0 24 24"><path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10v-6z" fill="currentColor"/><path class="cut" d="M12 7.6l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" opacity=".9"/></svg>',
    shop: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 11.2A2 2 0 0 1 16 21H8a2 2 0 0 1-2-1.8z" fill="currentColor"/><path d="M8.8 10V7a3.2 3.2 0 0 1 6.4 0v3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
  };
  var TABS = [
    ['pet', 'Питомец', 'index.html'],
    ['games', 'Игры', 'games/'],
    ['clan', 'Клан', 'clan/'],
    ['shop', 'Магазин', 'shop/']
  ];
  var root = document.documentElement.getAttribute('data-root') || './';
  if (root && root.slice(-1) !== '/') root += '/';
  var active = document.documentElement.getAttribute('data-tab') || 'pet';
  var nav = document.createElement('nav');
  nav.className = 'tabbar';
  nav.setAttribute('aria-label', 'Разделы');
  nav.innerHTML = TABS.map(function (t) {
    var on = t[0] === active;
    return '<a class="tab spring' + (on ? ' on' : '') + '" href="' + root + t[2] + '"' +
      (on ? ' aria-current="page"' : '') + '>' + I[t[0]] + '<span>' + t[1] + '</span></a>';
  }).join('');
  document.body.appendChild(nav);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.spring,.play,.card,.btn');
    if (!b) return;
    b.classList.remove('boing');
    void b.offsetWidth;
    b.classList.add('boing');
  });
})();
