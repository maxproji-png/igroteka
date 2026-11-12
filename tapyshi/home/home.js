/* Главный экран «Питомец»: живая 3D-Булочка, тап с энергией — логика в shared/js/port.js. */
(function (w) {
  'use strict';
  w.TapyshiHome = {
    mount: function (el, opts) {
      if (!el || !w.TAPYSHI) return;
      opts = opts || { kind: 'raccoon', pose: 'neutral', idle: true, tap: true };
      var hero = el.querySelector('[data-live-pet]') || el;
      if (TAPYSHI.mountLive) TAPYSHI.mountLive(hero, opts);
    }
  };
})(window);
