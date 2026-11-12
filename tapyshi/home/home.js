/* Главный экран «Питомец»: тап по Булочке, улучшение, задания.
   Оболочка (вкладки, игротека, шит) остаётся в shared/js/port.js. */
(function (w) {
  'use strict';

  function draw(C) {
    var q = C.q, ME = C.ME, IC = C.IC, $app = C.$app, fmt = C.fmt;
    var el = q('#scr-pet');
    var pct = Math.round((ME.petLvl - 5) / (ME.nextLvl - 5) * 100);
    el.innerHTML =
      '<div class="top"></div>' +
      '<div class="balance-wrap"><div class="balance"><div class="v" id="bal">' + IC.coin + '<span>' + fmt(ME.coins) + '</span></div>' +
        '<div class="tp-slot"><button class="tasks-pill" id="tpill" aria-label="Задания"><span class="ic">' + C.TI_TASKS + '</span><b>Задания</b><i class="tb-badge">1</i></button></div>' +
      '</div></div>' +
      '<div class="tapzone" id="tz"><div class="halo"></div><div class="ring"></div>' +
        '<div class="pet-col" data-st="' + ME.stage + '"><div class="pet-wrap" id="pw" style="width:320px"><div class="pet-idle">' + C.stagePetHero() + '</div></div>' +
        '<div class="pname podium">' + ME.petName + ' · Подросток</div>' +
        '<div class="fnext"><div class="tx">до ' + ME.nextStageName + ' · ' + ME.petLvl + '/' + ME.nextLvl + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
      '</div></div>' +
      '<div class="homebot"><div class="energy"><div class="row"><b>' + IC.bolt + '<span>' + fmt(ME.energy) + '</span> / <span>' + fmt(ME.maxEnergy) + '</span></b></div><div class="bar"><i style="width:100%"></i></div><div class="tap-rate">' + ME.tapPower + ' за тап</div></div>' +
        '<button class="upbtn" id="upb"><span class="up-lab">' + IC.up + 'Улучшить</span><span class="up-pr">' + IC.coin + '1 800</span></button></div>';
    var homeHero = q('[data-live-pet]', el) || q('.home-hero', el);
    if (w.TAPYSHI && TAPYSHI.mountLive && homeHero) {
      TAPYSHI.mountLive(homeHero, { kind: ME.pet, pose: 'neutral', idle: true, tap: true });
    }
    q('#tz', el).addEventListener('pointerdown', function (e) {
      var pw = q('#pw', el), pet = q('.pet', pw);
      var viewer = homeHero && homeHero._petViewer;
      if (viewer && viewer.tap) {
        viewer.tap();
      } else {
        pw.classList.add('squash'); if (pet) pet.classList.add('happy');
        setTimeout(function () { pw.classList.remove('squash'); if (pet) pet.classList.remove('happy'); }, 380);
      }
      var f = document.createElement('div');
      f.className = 'float'; f.textContent = '+' + ME.tapPower;
      var r = $app.getBoundingClientRect();
      f.style.left = (e.clientX - r.left) + 'px';
      f.style.top = (e.clientY - r.top) + 'px';
      $app.appendChild(f);
      setTimeout(function () { f.remove(); }, 900);
    });
    q('#upb', el).onclick = function () { openUpgrade(C); };
    q('#tpill', el).onclick = function () { openTasks(C); };
  }

  function openUpgrade(C) {
    var q = C.q, ME = C.ME, IC = C.IC;
    C.openSheet(
      '<div class="one-up"><div class="ou-pet">' + C.stagePet({ vb: '0 -24 200 230' }) + '<span class="ou-lv">ур. ' + ME.petLvl + '</span></div>' +
      '<h2>Прокачать питомца</h2><p>Макет: кнопки ничего не списывают</p>' +
      '<div class="ou-rows"><div class="ou-row"><span class="ic c1">' + IC.hand + '</span>Монет за тап<b>' + ME.tapPower + ' → <em>2</em></b></div>' +
      '<div class="ou-row"><span class="ic c2">' + IC.bolt + '</span>Энергия<b>' + ME.maxEnergy + ' → <em>360</em></b></div></div>' +
      '<button class="btn" id="doUp">Прокачать за ' + C.coin(1800) + '</button></div>',
      'upg'
    );
    var $layer = document.getElementById('layer');
    q('#doUp', $layer).onclick = function () { C.closeLayer(); C.mockToast(); };
  }

  function openTasks(C) {
    var q = C.q;
    C.openSheet(
      '<div class="sh-h"><h2>Задания</h2></div>' +
      '<div class="tk claim"><span class="ic c4">' + C.TI_TASKS + '</span><div class="tx"><div class="nm">Зайти сегодня</div><div class="tk-rw">' + C.IC.coin + '+200</div></div><button class="btn sm green" id="tkClaim">Забрать</button></div>' +
      '<p class="mock-note" style="color:var(--ink2);margin:12px 0 0">В макете награды не начисляются</p>',
      'tasks'
    );
    var $layer = document.getElementById('layer');
    var b = q('#tkClaim', $layer); if (b) b.onclick = function () { C.closeLayer(); C.mockToast(); };
  }

  w.TapyshiHome = { draw: draw, openUpgrade: openUpgrade, openTasks: openTasks };
})(window);
