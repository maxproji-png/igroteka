/* Миниатюра чужого питомца — лицевая аватарка Эволюции А, стадия по уровню (STAGE_AT). */
(function (w) {
  var STAGE_AT = [1, 5, 10, 15, 20, 25];
  var V = 'tc11150030';
  function stageOfLevel(level) {
    var lv = Math.max(1, Math.floor(+level) || 1), i;
    for (i = STAGE_AT.length - 1; i >= 0; i--) if (lv >= STAGE_AT[i]) return i + 1;
    return 1;
  }
  function root() {
    var r = document.documentElement.getAttribute('data-root');
    if (r != null && r !== '') return r.replace(/\/?$/, '/');
    if (w.TAP_BASE) return String(w.TAP_BASE).replace(/shared\/?$/, '');
    return '../';
  }
  function petThumb(kind, level) {
    var k = kind || 'raccoon';
    var st = stageOfLevel(level);
    return root() + 'shared/pets/avatars/' + k + '_stage_' + st + '.webp?v=' + V;
  }
  w.TAP_stageOfLevel = stageOfLevel;
  w.TAP_petThumb = petThumb;
  w.TAP_PET_AVA_V = V;
})(window);
