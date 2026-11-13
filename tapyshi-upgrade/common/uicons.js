/* Иконки улучшений в стиле концепта (пухлые формы, мягкий блик). Добавляются к спрайту icons.js. */
(function () {
  var s = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>' +
  '<linearGradient id="gu-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A08BFF"/><stop offset="1" stop-color="#7C5CFF"/></linearGradient>' +
  '<linearGradient id="gu-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD3A4"/><stop offset="1" stop-color="#26B880"/></linearGradient>' +
  '<linearGradient id="gu-y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFDA6E"/><stop offset="1" stop-color="#FFC233"/></linearGradient></defs>' +
  // доход за тап: монета + палец
  '<symbol id="u-tap" viewBox="0 0 48 48"><circle cx="20" cy="20" r="13" fill="url(#gu-y)"/><circle cx="20" cy="20" r="9" fill="none" stroke="#E8A100" stroke-width="2.4" opacity=".55"/><path d="M15 15a6 6 0 0 1 6-3" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85"/>' +
  '<path d="M30 22a3 3 0 0 1 6 0v8l3-1.2a3 3 0 0 1 3.6 4.2L38 42H28l-4-8a2.6 2.6 0 0 1 4-3.2l2 1.6z" fill="#fff" stroke="#5E40DB" stroke-width="2.6" stroke-linejoin="round"/></symbol>' +
  // запас энергии: батарейка с молнией
  '<symbol id="u-energy" viewBox="0 0 48 48"><rect x="9" y="12" width="28" height="26" rx="7" fill="url(#gu-g)"/><rect x="37" y="20" width="4" height="10" rx="2" fill="#1C9B6A"/><path d="M25 16l-8 11h6l-2 8 8-11h-6z" fill="#fff"/></symbol>' +
  // скорость восстановления: круговая стрелка + молния
  '<symbol id="u-regen" viewBox="0 0 48 48"><path d="M24 8a16 16 0 1 1-14.6 9.5" fill="none" stroke="url(#gu-v)" stroke-width="6" stroke-linecap="round"/><path d="M5 10l5 9 9-4z" fill="#7C5CFF"/><path d="M26 15l-8 11h6l-2 8 8-11h-6z" fill="#FFC233" stroke="#E8A100" stroke-width="1.2" stroke-linejoin="round"/></symbol>' +
  // автотап: лапка + искры движения
  '<symbol id="u-auto" viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="10" ry="8.5" fill="url(#gu-v)"/><circle cx="12.5" cy="20" r="4.2" fill="url(#gu-v)"/><circle cx="19.5" cy="13" r="4.4" fill="url(#gu-v)"/><circle cx="28.5" cy="13" r="4.4" fill="url(#gu-v)"/><circle cx="35.5" cy="20" r="4.2" fill="url(#gu-v)"/>' +
  '<path d="M40 31l4-2M40 37l4 1M7 34l-4 1" stroke="#FFC233" stroke-width="2.8" stroke-linecap="round"/></symbol>' +
  '<symbol id="u-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="2.4" fill="none"/></symbol>' +
  '<symbol id="u-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
  '<symbol id="u-arrow" viewBox="0 0 24 24"><path d="M4 12h13M12 6l6 6-6 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
  '</svg>';
  document.body.insertAdjacentHTML('afterbegin', s);
})();
