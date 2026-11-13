/* Общие помощники макета: формат чисел, меню, пружина, монетки, тост. */
(function () {
  var T = window.T = window.T || {};
  var ROOT = T.ROOT || '../shared/';
  T.img = function (p) { return ROOT + 'img/' + p; };
  T.fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); };
  T.short = function (n) { if (n >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',').replace(/0$/, '') + '\u00A0млн'; if (n >= 1e4) return Math.round(n / 1e3) + '\u00A0тыс'; return T.fmt(n); };
  T.IC = {
    paw: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15.5" rx="5.2" ry="4.4" fill="currentColor"/><circle cx="5.4" cy="10" r="2.3" fill="currentColor"/><circle cx="9.2" cy="5.8" r="2.4" fill="currentColor"/><circle cx="14.8" cy="5.8" r="2.4" fill="currentColor"/><circle cx="18.6" cy="10" r="2.3" fill="currentColor"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2 L20.5 5 Q21 15 12 22 Q3 15 3.5 5Z" fill="currentColor"/><path d="M12 7.5 l1.4 2.9 3.2.5 -2.3 2.2 .5 3.1 -2.8 -1.5 -2.8 1.5 .5 -3.1 -2.3 -2.2 3.2 -.5z" fill="#fff" opacity=".9"/></svg>',
    swords: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 L14 14 M4 4 h4 M4 4 v4"/><path d="M20 4 L10 14 M20 4 h-4 M20 4 v4"/><path d="M12 16 l-4 4 M8 16 l4 4 M12 16 l4 4 M16 16 l-4 4" stroke-width="2.6"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M4 8 H20 L18.8 20.5 Q18.6 22 17 22 H7 Q5.4 22 5.2 20.5Z" fill="currentColor"/><path d="M8.5 10 V6.5 Q8.5 2.8 12 2.8 Q15.5 2.8 15.5 6.5 V10" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="8.5" cy="11" r="1.4" fill="#fff"/><circle cx="15.5" cy="11" r="1.4" fill="#fff"/></svg>',
    cup: '<svg viewBox="0 0 24 24" class="trophy"><path d="M7 3.5 H17 V9 Q17 14 12 14.6 Q7 14 7 9Z" fill="#ffc93a" stroke="#d98a07" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.5 H4.2 Q4 9.6 7.6 10.6 M17 5.5 H19.8 Q20 9.6 16.4 10.6" fill="none" stroke="#d98a07" stroke-width="1.6" stroke-linecap="round"/><path d="M10.6 14.4 H13.4 L13.9 17.6 H10.1Z" fill="#e9a21a"/><rect x="7.6" y="17.4" width="8.8" height="3.4" rx="1.2" fill="#b86a00"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13.5 2 L4.5 13.5 H11 L9.8 22 L19.5 9.8 H13 Z" fill="#FFCF33" stroke="#F09000" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15.5 14"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5.5 Q4 3.5 6 3.5 H18 Q20 3.5 20 5.5 V14.5 Q20 16.5 18 16.5 H11 L6.5 20.5 V16.5 H6 Q4 16.5 4 14.5Z" fill="currentColor"/><circle cx="8.6" cy="10" r="1.3" fill="#fff"/><circle cx="12" cy="10" r="1.3" fill="#fff"/><circle cx="15.4" cy="10" r="1.3" fill="#fff"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="18.5" cy="12" r="2.2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"><path d="M12 5 V19 M5 12 H19"/></svg>',
    crown: '<svg viewBox="0 0 24 24"><path d="M3.5 8 L8 12 L12 5 L16 12 L20.5 8 L19 18 H5Z" fill="#FFC93D" stroke="#E39200" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="14.2" r="1.5" fill="#fff" opacity=".85"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15 V3 M7 8 L12 3 L17 8"/><path d="M5 12 V19 Q5 21 7 21 H17 Q19 21 19 19 V12"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5 L16 12 L9 19"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9 L12 15 L18 9"/></svg>',
    max: '<svg viewBox="0 0 24 24"><path d="M12 3.5 C7 3.5 3.5 7 3.5 11.6 C3.5 14 4.4 15.9 6 17.3 L5.2 20.5 L8.7 18.9 C9.7 19.3 10.8 19.6 12 19.6 C17 19.6 20.5 16.1 20.5 11.6 C20.5 7 17 3.5 12 3.5Z" fill="#fff"/></svg>'
  };
  T.coin = function (cls) { return '<img class="' + (cls || '') + '" src="' + T.img('items/icon-coin.png') + '" alt="">'; };

  T.nav = function (active) {
    var items = [['pet', 'Питомец', 'paw'], ['clan', 'Клан', 'shield'], ['games', 'Игры', 'swords'], ['shop', 'Магазин', 'bag']];
    return '<nav class="nav">' + items.map(function (it) {
      return '<a href="#" class="tap' + (it[0] === active ? ' on' : '') + '" data-nav="' + it[0] + '"><span class="ic">' + T.IC[it[2]] + '</span>' + it[1] + (it[0] === 'games' ? '<i class="nb"></i>' : '') + '</a>';
    }).join('') + '</nav>';
  };

  // пружина на всё, что нажимается
  function down(e) { var t = e.target.closest('.tap'); if (!t) return; t.classList.add('is-down'); T._down = t; }
  function up() { var t = T._down; if (!t) return; t.classList.remove('is-down'); T._down = null; }
  document.addEventListener('pointerdown', down);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
  document.addEventListener('pointerleave', up);
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });

  T.burst = function (from, to) {
    var a = from.getBoundingClientRect(), b = (to || document.querySelector('.coins img') || from).getBoundingClientRect();
    for (var i = 0; i < 7; i++) (function (i) {
      var c = document.createElement('img'); c.src = T.img('items/icon-coin.png'); c.className = 'fx-coin';
      c.style.left = (a.left + a.width / 2 - 13) + 'px'; c.style.top = (a.top + a.height / 2 - 13) + 'px';
      document.body.appendChild(c);
      var dx = (Math.random() - .5) * 90, dy = -30 - Math.random() * 50;
      requestAnimationFrame(function () {
        c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)';
        setTimeout(function () { c.style.transform = 'translate(' + (b.left - a.left - a.width / 2 + 13) + 'px,' + (b.top - a.top - a.height / 2 + 13) + 'px) scale(.6)'; c.style.opacity = '.2'; }, 260 + i * 40);
        setTimeout(function () { c.remove(); }, 1200 + i * 40);
      });
    })(i);
  };
  T.toast = function (html) {
    var t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.querySelector('.app').appendChild(t); }
    t.innerHTML = html; t.classList.add('on'); clearTimeout(T._tt); T._tt = setTimeout(function () { t.classList.remove('on'); }, 1800);
  };
  T.popIn = function (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
})();
