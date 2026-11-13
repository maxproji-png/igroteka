/* Тапыши · главная · набор SVG-иконок (один стиль: пухлые формы, мягкие блики). */
(function () {
  var S = '' +
  '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>' +
  '<radialGradient id="g-coin" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6BF"/><stop offset=".38" stop-color="#FFD84A"/><stop offset=".8" stop-color="#FFB61E"/><stop offset="1" stop-color="#F29A0C"/></radialGradient>' +
  '<linearGradient id="g-coin-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC93A"/><stop offset="1" stop-color="#FFE47A"/></linearGradient>' +
  '<linearGradient id="g-coin-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9730A"/><stop offset=".5" stop-color="#E58E0E"/><stop offset="1" stop-color="#B9650A"/></linearGradient>' +
  '<linearGradient id="g-bolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE66B"/><stop offset="1" stop-color="#FFB21A"/></linearGradient>' +
  '<linearGradient id="g-gift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8DB5"/><stop offset="1" stop-color="#FF5C8E"/></linearGradient>' +
  '<linearGradient id="g-task" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FB0FF"/><stop offset="1" stop-color="#3D82F5"/></linearGradient>' +
  '<linearGradient id="g-gear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9B4D6"/><stop offset="1" stop-color="#7F8BB5"/></linearGradient>' +
  '<linearGradient id="g-star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE15C"/><stop offset="1" stop-color="#FFAE12"/></linearGradient>' +
  '</defs>' +

  /* Объёмная монета: ребро + лицевая сторона + внутренний круг + выпуклая звезда + блик */
  '<symbol id="i-coin" viewBox="0 0 48 48">' +
    '<ellipse cx="24" cy="27.2" rx="20" ry="19.6" fill="url(#g-coin-edge)"/>' +
    '<circle cx="24" cy="23" r="20" fill="url(#g-coin)"/>' +
    '<circle cx="24" cy="23" r="20" fill="none" stroke="#E8900C" stroke-width="1.4" opacity=".55"/>' +
    '<circle cx="24" cy="23.4" r="14.2" fill="#F0A114" opacity=".55"/>' +
    '<circle cx="24" cy="22.6" r="14.2" fill="url(#g-coin-in)"/>' +
    '<path d="M24 13.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L24 28.4l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z" fill="#E08A08" transform="translate(0 1.3)"/>' +
    '<path d="M24 13.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L24 28.4l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z" fill="#FFF3B0"/>' +
    '<path d="M24 15.6l2.2 4.5 4.6.7" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>' +
    '<path d="M10.5 17.5a14.6 14.6 0 0 1 9-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>' +
    '<circle cx="9.6" cy="21.6" r="1.5" fill="#fff" opacity=".7"/>' +
  '</symbol>' +

  '<symbol id="i-gear" viewBox="0 0 32 32">' +
    '<circle cx="16" cy="16" r="10.6" fill="none" stroke="url(#g-gear)" stroke-width="5.4" stroke-dasharray="4.2 4.12" transform="rotate(12 16 16)"/>' +
    '<circle cx="16" cy="16" r="9.6" fill="url(#g-gear)"/>' +
    '<circle cx="16" cy="16" r="4" fill="#fff"/>' +
    '<path d="M9.8 12.4a7 7 0 0 1 4-3.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".6"/>' +
  '</symbol>' +

  '<symbol id="i-tasks" viewBox="0 0 32 32">' +
    '<rect x="5" y="5" width="20" height="24" rx="5.5" fill="#2F6FD8"/>' +
    '<rect x="5" y="4" width="20" height="23.5" rx="5.5" fill="url(#g-task)"/>' +
    '<rect x="10.5" y="2" width="9" height="5.4" rx="2.7" fill="#fff"/>' +
    '<rect x="9.5" y="12" width="11" height="2.8" rx="1.4" fill="#fff" opacity=".95"/>' +
    '<rect x="9.5" y="17.4" width="7" height="2.8" rx="1.4" fill="#fff" opacity=".7"/>' +
    '<circle cx="23.5" cy="23" r="6.6" fill="#36C25B"/><circle cx="23.5" cy="22.4" r="6.6" fill="#4ED46F"/>' +
    '<path d="M20.6 22.4l2 2 3.8-4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</symbol>' +

  '<symbol id="i-gift" viewBox="0 0 32 32">' +
    '<rect x="5" y="14" width="22" height="15" rx="4.5" fill="#E8457A"/>' +
    '<rect x="5" y="13" width="22" height="15" rx="4.5" fill="url(#g-gift)"/>' +
    '<rect x="3" y="9.5" width="26" height="7.5" rx="3.6" fill="#FF7BA7"/>' +
    '<rect x="3" y="9" width="26" height="6" rx="3" fill="#FF9CC0"/>' +
    '<rect x="13.6" y="9" width="4.8" height="19" fill="#FFCF33"/>' +
    '<path d="M16 9.4c-2.6-5.4-8.4-5-7.7-1.6.5 2.3 4.6 2.2 7.7 1.6zM16 9.4c2.6-5.4 8.4-5 7.7-1.6-.5 2.3-4.6 2.2-7.7 1.6z" fill="#FFCF33" stroke="#F2A900" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M7 11.2h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
  '</symbol>' +

  '<symbol id="i-bolt" viewBox="0 0 32 32">' +
    '<path d="M18.6 2.8L6.8 17.6c-.7.9-.1 2.2 1 2.2h6.4l-2.4 9.4c-.3 1.2 1.2 1.9 2 1l12-15c.7-.9.1-2.2-1-2.2h-6.4l2.3-9.1c.3-1.2-1.3-1.9-2.1-.9z" fill="#F29A0C" transform="translate(0 1)"/>' +
    '<path d="M18.6 2.8L6.8 17.6c-.7.9-.1 2.2 1 2.2h6.4l-2.4 9.4c-.3 1.2 1.2 1.9 2 1l12-15c.7-.9.1-2.2-1-2.2h-6.4l2.3-9.1c.3-1.2-1.3-1.9-2.1-.9z" fill="url(#g-bolt)"/>' +
    '<path d="M16.4 7.2l-6 7.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>' +
  '</symbol>' +

  '<symbol id="i-star" viewBox="0 0 32 32">' +
    '<path d="M16 3.6l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L16 22.7l-7.4 3.9L10 18.3l-6-5.9 8.3-1.2z" fill="#F29A0C" stroke="#F29A0C" stroke-width="2.4" stroke-linejoin="round" transform="translate(0 1.2)"/>' +
    '<path d="M16 3.6l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L16 22.7l-7.4 3.9L10 18.3l-6-5.9 8.3-1.2z" fill="url(#g-star)" stroke="url(#g-star)" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M13.4 10.8l2.6-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>' +
  '</symbol>' +

  '<symbol id="i-up" viewBox="0 0 32 32">' +
    '<path d="M16 5.5L6.5 15.2h5.6V25a2 2 0 0 0 2 2h3.8a2 2 0 0 0 2-2v-9.8h5.6z" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>' +
  '</symbol>' +

  '<symbol id="i-tap" viewBox="0 0 32 32">' +
    '<path d="M12.6 15V6.8a2.4 2.4 0 0 1 4.8 0v6.4l6.1 1.3a3 3 0 0 1 2.4 3.3l-.8 6.3A4.6 4.6 0 0 1 20.5 28h-5.2a4.6 4.6 0 0 1-3.6-1.8l-4.4-5.6a2.2 2.2 0 0 1 3.1-3.1l2.2 1.8z" fill="#fff" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<path d="M8 6.5l-2-1.6M8.6 10.6l-2.6.4M21.6 6.5l2-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
  '</symbol>' +

  /* Нижние вкладки: одна заливка currentColor + белые детали */
  '<symbol id="t-paw" viewBox="0 0 32 32">' +
    '<ellipse cx="8" cy="13.2" rx="3.1" ry="3.8" transform="rotate(-18 8 13.2)" fill="currentColor"/>' +
    '<ellipse cx="13.2" cy="8.2" rx="3.2" ry="4" transform="rotate(-6 13.2 8.2)" fill="currentColor"/>' +
    '<ellipse cx="19.4" cy="8.2" rx="3.2" ry="4" transform="rotate(6 19.4 8.2)" fill="currentColor"/>' +
    '<ellipse cx="24.4" cy="13.4" rx="3.1" ry="3.8" transform="rotate(18 24.4 13.4)" fill="currentColor"/>' +
    '<path d="M16.2 14.6c-4.3 0-8.6 5.2-8.6 9.2 0 3.6 3.4 4.4 5.5 3.5 1.4-.6 2.1-.9 3.1-.9s1.7.3 3.1.9c2.1.9 5.5.1 5.5-3.5 0-4-4.3-9.2-8.6-9.2z" fill="currentColor"/>' +
    '<path d="M12 20.4a5 5 0 0 1 2.4-2.4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none" opacity=".55"/>' +
  '</symbol>' +
  '<symbol id="t-shield" viewBox="0 0 32 32">' +
    '<path d="M16 3.2l10.2 3.7c.8.3 1.3 1 1.3 1.9v6.4c0 6.6-4.6 11.7-11 13.9a1.6 1.6 0 0 1-1 0C9.1 26.9 4.5 21.8 4.5 15.2V8.8c0-.9.5-1.6 1.3-1.9z" fill="currentColor"/>' +
    '<path d="M16 9.6l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#fff"/>' +
  '</symbol>' +
  '<symbol id="t-games" viewBox="0 0 32 32">' +
    '<path d="M9.4 8.5h13.2a6.6 6.6 0 0 1 6.4 5.1l1.5 7c.6 2.8-1.5 5.4-4.3 5.4-1.5 0-2.9-.8-3.7-2l-1.3-2h-10.4l-1.3 2c-.8 1.2-2.2 2-3.7 2-2.8 0-4.9-2.6-4.3-5.4l1.5-7a6.6 6.6 0 0 1 6.4-5.1z" fill="currentColor"/>' +
    '<path d="M10.2 12.6v5.2M7.6 15.2h5.2" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>' +
    '<circle cx="21.6" cy="13.4" r="1.7" fill="#fff"/><circle cx="24.4" cy="16.8" r="1.7" fill="#fff"/>' +
  '</symbol>' +
  '<symbol id="t-bag" viewBox="0 0 32 32">' +
    '<path d="M11 11V9.6a5 5 0 0 1 10 0V11" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M7.6 10.2h16.8c1 0 1.9.8 2 1.8l1.2 13.2c.2 2-1.4 3.6-3.4 3.6H7.8c-2 0-3.6-1.6-3.4-3.6L5.6 12c.1-1 1-1.8 2-1.8z" fill="currentColor"/>' +
    '<path d="M12 16.4a4 4 0 0 0 8 0" stroke="#fff" stroke-width="2.3" fill="none" stroke-linecap="round"/>' +
  '</symbol>' +
  '</svg>';
  function put() { if (document.getElementById('tp-icons')) return; var d = document.createElement('div'); d.id = 'tp-icons'; d.innerHTML = S; document.body.insertBefore(d, document.body.firstChild); }
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
})();
(function () {
  var F = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>' +
  '<linearGradient id="g-fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF4F6E"/><stop offset=".6" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFD24A"/></linearGradient></defs>' +
  '<symbol id="i-flame" viewBox="0 0 32 38"><path d="M16 2c1.5 6.5 9.5 10 9.5 20A9.5 9.5 0 0 1 6.5 22c0-4.5 2.3-7.4 4.8-9.4-.2 3 .9 5 2.7 6.1C13.6 12.5 14.6 7 16 2z" fill="url(#g-fl)"/>' +
  '<path d="M16.3 18c.9 3.3 4.7 4.8 4.7 9a5 5 0 0 1-10 0c0-2.6 1.6-4.2 3.1-5.1.1 1.6.7 2.6 1.5 3 0-2.7.1-4.8.7-6.9z" fill="#FFE68A"/></symbol></svg>';
  function put() { var d = document.createElement('div'); d.innerHTML = F; document.body.insertBefore(d, document.body.firstChild); }
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
})();
