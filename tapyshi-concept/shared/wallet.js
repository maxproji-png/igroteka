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


  var BKEY = 'tapyshi.boosts';
  var BDEF = { tap: 1, energy: 1, regen: 1, offline: 1 };
  var BMAX = { tap: 3, energy: 3, regen: 3, offline: 3 };
  var ENERGY = [200, 250, 300];
  var POWER = [1, 2, 3];
  var REGEN_SEC = [600, 450, 300];
  var OFF_RATE = [0.05, 0.1, 0.2];
  var OFF_CAP = [1000, 1500, 2000];

  function clampLv(n, max) {
    n = Math.floor(Number(n) || 1);
    if (n < 1) n = 1;
    if (n > max) n = max;
    return n;
  }
  function readBoosts() {
    var o = {}, k, raw;
    try { raw = w.localStorage.getItem(BKEY); } catch (e) { raw = null; }
    if (raw) {
      try { o = JSON.parse(raw) || {}; } catch (e) { o = {}; }
    }
    var out = {};
    for (k in BDEF) {
      if (!Object.prototype.hasOwnProperty.call(BDEF, k)) continue;
      out[k] = clampLv(o[k], BMAX[k]);
    }
    return out;
  }
  function writeBoosts(lv, src) {
    var cur = readBoosts(), k, next = {}, changed = false;
    lv = lv || {};
    for (k in BDEF) {
      if (!Object.prototype.hasOwnProperty.call(BDEF, k)) continue;
      next[k] = clampLv(lv[k] != null ? lv[k] : cur[k], BMAX[k]);
      if (next[k] !== cur[k]) changed = true;
    }
    try { w.localStorage.setItem(BKEY, JSON.stringify(next)); } catch (e) {}
    if (changed || src === 'init') {
      try {
        var msg = { type: 'tapyshi-tab', ev: 'boosts', lv: next };
        if (w.parent && w.parent !== w) w.parent.postMessage(msg, location.origin);
        var frames = w.document.querySelectorAll('iframe');
        for (var i = 0; i < frames.length; i++) {
          try { frames[i].contentWindow.postMessage(msg, location.origin); } catch (e) {}
        }
      } catch (e) {}
    }
    return next;
  }
  function idx(lv, id) { return clampLv((lv || readBoosts())[id], BMAX[id]) - 1; }

  w.addEventListener('message', function (e) {
    if (!e || e.origin !== location.origin || !e.data || e.data.type !== 'tapyshi-tab' || e.data.ev !== 'boosts') return;
    writeBoosts(e.data.lv, 'message');
  });

  w.TapyshiBoosts = {
    key: BKEY,
    get: readBoosts,
    set: function (lv) { return writeBoosts(lv, 'set'); },
    lv: function (id) { return readBoosts()[id] || 1; },
    power: function (lv) { return POWER[idx(lv, 'tap')]; },
    energyMax: function (lv) { return ENERGY[idx(lv, 'energy')]; },
    regenSec: function (lv) { return REGEN_SEC[idx(lv, 'regen')]; },
    offlineRate: function (lv) { return OFF_RATE[idx(lv, 'offline')]; },
    offlineCap: function (lv) { return OFF_CAP[idx(lv, 'offline')]; }
  };

})(window);
