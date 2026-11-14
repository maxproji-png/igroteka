/* Единая монета Тапышей (SVG), не эмодзи и не PNG из магазина. */
(function (w) {
  var COIN = '<svg class="coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12.8" r="10" class="ico-sun-edge"/><circle cx="12" cy="11.6" r="10" class="ico-sun"/><circle cx="12" cy="11.6" r="7.4" class="coin-in"/><g class="ico-white" opacity=".95"><ellipse cx="12" cy="13.6" rx="3" ry="2.4"/><circle cx="8.6" cy="10.6" r="1.25"/><circle cx="10.6" cy="8.6" r="1.25"/><circle cx="13.4" cy="8.6" r="1.25"/><circle cx="15.4" cy="10.6" r="1.25"/></g><path d="M5.6 7.6a7.6 7.6 0 0 1 5-3.4" class="ico-white-s" stroke-width="1.6" stroke-linecap="round" opacity=".6" fill="none"/></svg>';
  w.TAP_COIN = COIN;
  w.T = w.T || {};
  T.coin = function (cls) {
    return cls ? COIN.replace('class="coin"', 'class="coin ' + cls + '"') : COIN;
  };
})(window);
