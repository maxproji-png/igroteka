// A · Список карточек: самый прямой путь — каждая строка «что → сейчас → после → цена».
import { S, UPG, info, buy, progress, STAGE_NAMES, PET_NAME, petImg, pluralLv } from '../common/econ.js?v=up11140230';
import { shell, syncBalance, floatCost, toast, shake, pop, press, showEvo, coinImg, $ } from '../common/ui.js?v=up11140230';

const app = $('.app'); shell(app);
app.insertAdjacentHTML('beforeend', `<main class="scroll">
  <section class="card petcard"><div class="ph"><img id="pImg" alt=""></div>
    <div class="meta"><div class="nm">${PET_NAME} <small id="pStage"></small></div><div class="lvl">★ <span id="pLv"></span></div>
      <div class="bar"><i id="pBar"></i></div><div class="to" id="pTo"></div><div class="stages" id="pSt">${'<i></i>'.repeat(6)}</div></div></section>
  <div class="sec">Улучшения · каждое +1 уровень питомцу</div>
  <div class="list">${UPG.map(u => `<article class="card up" data-id="${u.id}">
    <div class="tile ${u.color === 'sun' ? 'sun' : u.color === 'green' ? 'green' : ''}"><svg><use href="#${u.icon}"/></svg></div>
    <div class="t"><b>${u.name}</b><small>${u.hint}</small></div><span class="lv"></span>
    <div class="row"><div class="nn"><span class="now"></span><svg class="ar"><use href="#u-arrow"/></svg><span class="nx"></span><span class="u">${u.unit}</span></div>
      <button class="btn btn--success" type="button"></button></div></article>`).join('')}</div>
</main>`);

function renderPet() {
  const p = progress();
  $('#pImg').src = petImg(p.st); $('#pStage').textContent = '«' + STAGE_NAMES[p.st - 1] + '»'; $('#pLv').textContent = 'ур. ' + p.lv;
  $('#pBar').style.transform = `scaleX(${p.to ? Math.max(.04, p.frac) : 1})`;
  $('#pTo').innerHTML = p.to ? `До стадии <b>«${STAGE_NAMES[p.st]}»</b> — ${p.left} ${pluralLv(p.left)}` : 'Последняя стадия — Булочка во всей красе';
  [...$('#pSt').children].forEach((i, k) => { i.className = k + 1 < p.st ? 'on' : k + 1 === p.st ? 'cur' : ''; });
}
function renderRow(el) {
  const u = UPG.find(x => x.id === el.dataset.id), i = info(u), b = el.querySelector('.btn');
  el.querySelector('.lv').textContent = i.maxed ? 'макс.' : `ур. ${u.lvl}/${u.max}`;
  el.querySelector('.now').textContent = i.now; el.querySelector('.nx').textContent = i.next || '';
  el.classList.toggle('maxed', i.maxed);
  b.classList.toggle('btn--success', i.can); b.classList.toggle('is-short', !i.can && !i.maxed); b.classList.toggle('is-max', i.maxed);
  b.innerHTML = i.maxed ? 'Максимум' : `${coinImg()}${i.cost.toLocaleString('ru-RU')}`;
  b.disabled = i.maxed; b.setAttribute('aria-label', i.maxed ? 'Максимальный уровень' : `Улучшить за ${i.cost} монет`);
}
const rows = [...document.querySelectorAll('.up')];
const renderAll = () => { rows.forEach(renderRow); renderPet(); };
renderAll();

app.addEventListener('click', e => {
  const b = e.target.closest('.up .btn'); if (!b) return;
  const row = b.closest('.up'), r = buy(row.dataset.id);
  press(b);
  if (!r.ok) { shake(row); if (r.reason === 'coins') toast(`Не хватает ${r.short.toLocaleString('ru-RU')} монет — потапай ещё`); return; }
  floatCost(b, r.cost); syncBalance(); renderAll();
  pop(row.querySelector('.nx'), 1.25); pop($('#pImg'), 1.08);
  if (r.stageUp) setTimeout(() => showEvo(r.from, r.to, S.level), 420);
});
window.__upg = { S, UPG }; document.documentElement.dataset.ready = '1';
// для автотеста: нажать первую доступную кнопку «купить» через настоящий клик
window.__demoBuy = () => { const b = rows.map(r => r.querySelector('.btn')).find(x => x.classList.contains('btn--success')); if (!b) return false; b.click(); return true; };
