/* Главный экран «Питомец»: живая 3D-Булочка, тап с энергией — логика в shared/js/port.js.
   Кадр камеры вьюера оставляет много воздуха; здесь сдвигаем и слегка увеличиваем
   модель, чтобы уши были чуть ниже верха сцены, а лапы — чуть выше подсказки. */
(function (w) {
  'use strict';

  /* Доля холста, которую занимает питомец при штатном кадре PetViewer
     (FOV 30°, lookAt y=0.74, дистанция 4.05). Вертикаль не зависит от aspect. */
  var PET_TOP_F = 0.112;
  var PET_BOT_F = 0.868;
  var PET_LEFT_F = 0.108;
  var PET_RIGHT_F = 0.780;
  var EAR_PAD = 18;
  var HINT_GAP = 8;

  function frameHomePet() {
    var stage = document.getElementById('pet-stage');
    var mount = document.getElementById('pet-mount');
    var hint = document.getElementById('tap-hint');
    if (!stage || !mount) return;
    var sh = stage.clientHeight;
    if (sh < 80) return;
    var stageBox = stage.getBoundingClientRect();
    var hintTop = hint
      ? Math.max(0, hint.getBoundingClientRect().top - stageBox.top)
      : sh - 36;
    var targetTop = EAR_PAD;
    var targetBot = Math.min(sh - 4, hintTop - HINT_GAP);
    if (targetBot - targetTop < 80) return;
    var petH = (PET_BOT_F - PET_TOP_F) * sh;
    var scale = (targetBot - targetTop) / petH;
    var visualTop = (sh - sh * scale) / 2 + PET_TOP_F * sh * scale;
    var ty = targetTop - visualTop;
    var sw = stage.clientWidth;
    var visualLeft = (sw - sw * scale) / 2 + PET_LEFT_F * sw * scale;
    var visualRight = (sw - sw * scale) / 2 + PET_RIGHT_F * sw * scale;
    var tx = sw / 2 - (visualLeft + visualRight) / 2;
    mount.style.transformOrigin = '50% 50%';
    mount.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
  }

  function watch() {
    var stage = document.getElementById('pet-stage');
    if (!stage || stage._homeFramed) return;
    stage._homeFramed = true;
    frameHomePet();
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () { frameHomePet(); });
      ro.observe(stage);
    }
    w.addEventListener('resize', frameHomePet);
  }

  w.TapyshiHome = {
    mount: function (el, opts) {
      if (!el || !w.TAPYSHI) return;
      opts = opts || { kind: 'raccoon', pose: 'neutral', idle: true, tap: true };
      var hero = el.querySelector('[data-live-pet]') || el;
      if (TAPYSHI.mountLive) TAPYSHI.mountLive(hero, opts);
      frameHomePet();
    },
    frame: frameHomePet
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})(window);
