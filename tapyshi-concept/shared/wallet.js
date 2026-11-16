/* Общий демо-баланс вкладок: localStorage + событие storage + postMessage. */
(function (w) {
  var KEY = 'tapyshi.coins';
  var DEF = 12000;
  var listeners = [];
  var last = null;

  function num(n) {
    n = Math.floor(Number(n));
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function read() {
    try {
      var v = w.localStorage.getItem(KEY);
      if (v == null || v === '') return null;
      var n = parseInt(v, 10);
      return isFinite(n) && n >= 0 ? n : null;
    } catch (e) { return null; }
  }

  function broadcast(n) {
    try {
      var msg = { type: 'tapyshi-tab', ev: 'coins', coins: n };
      if (w.parent && w.parent !== w) w.parent.postMessage(msg, location.origin);
      var frames = w.document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try { frames[i].contentWindow.postMessage(msg, location.origin); } catch (e) {}
      }
    } catch (e) {}
  }

  function emit(n, src) {
    last = n;
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](n, src); } catch (e) {}
    }
    if (src !== 'message' && src !== 'storage') broadcast(n);
  }

  function write(n, src) {
    n = num(n);
    try { w.localStorage.setItem(KEY, String(n)); } catch (e) {}
    if (last === n) return n;
    emit(n, src || 'set');
    return n;
  }

  function get() {
    var n = read();
    if (n == null) return write(DEF, 'init');
    if (last == null) last = n;
    return n;
  }

  w.addEventListener('message', function (e) {
    if (!e || e.origin !== location.origin || !e.data || e.data.type !== 'tapyshi-tab' || e.data.ev !== 'coins') return;
    var n = num(e.data.coins);
    if (last === n) return;
    try { w.localStorage.setItem(KEY, String(n)); } catch (err) {}
    emit(n, 'message');
  });

  w.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    var n = read();
    if (n == null || n === last) return;
    emit(n, 'storage');
  });

  w.TapyshiBal = {
    key: KEY,
    get: get,
    set: function (n) { return write(n, 'set'); },
    add: function (d) { return write(get() + Number(d || 0), 'add'); },
    spend: function (n) {
      n = num(n);
      if (get() < n) return false;
      write(get() - n, 'spend');
      return true;
    },
    on: function (f) { if (typeof f === 'function') listeners.push(f); }
  };
})(window);
