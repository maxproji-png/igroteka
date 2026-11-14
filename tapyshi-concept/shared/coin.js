/* Единая монета Тапышей · вариант A (лапка). Цвета запечены в SVG. */
(function (w) {
  var n = 0;
  var BIG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".45" stop-color="#FFC233"/><stop offset="1" stop-color="#F5AC12"/></linearGradient><linearGradient id="a-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B97800"/><stop offset=".5" stop-color="#D99200"/><stop offset="1" stop-color="#B97800"/></linearGradient></defs><circle cx="48" cy="44.5" r="43" fill="#A66A00"/><circle cx="48" cy="51" r="43" fill="#A66A00"/><circle cx="48" cy="51" r="39.5" fill="url(#a-side)"/><circle cx="48" cy="44.5" r="39.5" fill="url(#a-face)"/><path d="M10.6 50a38 38 0 0 0 74.8 0" fill="none" stroke="#FFE27A" stroke-width="2" stroke-linecap="round" opacity=".55"/><g transform="translate(0 2.6)" fill="#C98300" opacity="0.55"><path d="M48 49.32c10.2 0 17.68 7.48 17.68 15.3c0 6.800000000000001-5.78 10.2-10.2 10.2c-3.4000000000000004 0-4.760000000000001-1.36-7.48-1.36s-4.08 1.36-7.48 1.36c-4.42 0-10.2-3.4000000000000004-10.2-10.2c0-7.82 7.48-15.3 17.68-15.3z"/><ellipse cx="30.32" cy="43.2" rx="5.44" ry="6.800000000000001" transform="rotate(-20 30.32 43.2)"/><ellipse cx="41.2" cy="34.02" rx="5.44" ry="7.14" transform="rotate(-6 41.2 34.02)"/><ellipse cx="54.8" cy="34.02" rx="5.44" ry="7.14" transform="rotate(6 54.8 34.02)"/><ellipse cx="65.68" cy="43.2" rx="5.44" ry="6.800000000000001" transform="rotate(20 65.68 43.2)"/></g><g fill="#FFFFFF"><path d="M48 49.32c10.2 0 17.68 7.48 17.68 15.3c0 6.800000000000001-5.78 10.2-10.2 10.2c-3.4000000000000004 0-4.760000000000001-1.36-7.48-1.36s-4.08 1.36-7.48 1.36c-4.42 0-10.2-3.4000000000000004-10.2-10.2c0-7.82 7.48-15.3 17.68-15.3z"/><ellipse cx="30.32" cy="43.2" rx="5.44" ry="6.800000000000001" transform="rotate(-20 30.32 43.2)"/><ellipse cx="41.2" cy="34.02" rx="5.44" ry="7.14" transform="rotate(-6 41.2 34.02)"/><ellipse cx="54.8" cy="34.02" rx="5.44" ry="7.14" transform="rotate(6 54.8 34.02)"/><ellipse cx="65.68" cy="43.2" rx="5.44" ry="6.800000000000001" transform="rotate(20 65.68 43.2)"/></g><path d="M19.5 33.5a31 31 0 0 1 17-17.5" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".85"/><circle cx="16.6" cy="42" r="2.6" fill="#FFFFFF" opacity=".8"/></svg>';
  var SMALL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><defs><linearGradient id="a-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset=".5" stop-color="#FFC233"/><stop offset="1" stop-color="#F5AC12"/></linearGradient></defs><circle cx="8" cy="7" r="7" fill="#A66A00"/><circle cx="8" cy="8" r="7" fill="#A66A00"/><circle cx="8" cy="8" r="6" fill="#D99200"/><circle cx="8" cy="7" r="6" fill="url(#a-f)"/><g fill="#FFFFFF"><ellipse cx="8" cy="9" rx="3" ry="2.1"/><circle cx="4.9" cy="5.7" r="1.3"/><circle cx="8" cy="4.3" r="1.35"/><circle cx="11.1" cy="5.7" r="1.3"/></g></svg>';

  function mint(raw, cls, px) {
    var id = 'ca' + (++n);
    var size = px || 18;
    var klass = 'coin' + (cls ? ' ' + cls : '') + (size >= 48 ? ' coin--lg' : '');
    var s = raw
      .replace(/id="([^"]+)"/g, 'id="' + id + '-$1"')
      .replace(/url\(#([^)]+)\)/g, 'url(#' + id + '-$1)')
      .replace(/<svg\b/, '<svg class="' + klass + '" style="--coin-size:' + size + 'px" aria-hidden="true" focusable="false"');
    return s;
  }

  function coin(cls, px) {
    var size = +px || 18;
    return mint(size <= 20 ? SMALL : BIG, cls || '', size);
  }

  function root() {
    var r = document.documentElement.getAttribute('data-root');
    if (r == null || r === '') return '../';
    return r.replace(/\/?$/, '/');
  }

  function src(cssPx) {
    var dpr = Math.min(3, Math.max(1, Math.round(w.devicePixelRatio || 1)));
    var size = +cssPx || 24;
    var base = 48;
    if (size <= 20) base = 16;
    else if (size <= 32) base = 24;
    else if (size <= 64) base = 48;
    else base = 96;
    return root() + 'shared/coin/png/coin-' + base + '@' + dpr + 'x.png';
  }

  w.T = w.T || {};
  T.coin = coin;
  T.coinSrc = src;
  Object.defineProperty(w, 'TAP_COIN', { get: function () { return coin(); }, configurable: true });
})(window);
