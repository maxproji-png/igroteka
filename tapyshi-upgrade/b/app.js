// B · Питомец в центре: всё вокруг Булочки — стадии роста и «кольца силы»; одна панель покупки для выбранного.
import { S, UPG, info, buy, progress, STAGE_AT, STAGE_NAMES, PET_NAME, petImg, pluralLv } from '../common/econ.js?v=up11140230';
import { shell, syncBalance, floatCost, toast, shake, pop, press, showEvo, coinImg, $, RM } from '../common/ui.js?v=up11140230';

const app = $('.app'); shell(app);
let sel = 'tap';
app.insertAdjacentHTML('beforeend', `<main class="scroll">
  <section class="hero"><div class="glow"></div><div class="pet" id="pet"><img id="petA" alt=""><img id="petB" alt="" style="opacity:0"></div>
    <div class="tag">${PET_NAME} <em id="stg"></em><b id="lv"></b></div></section>
  <section class="tl"><div class="line"><i id="tlFill"></i></div><div class="pts">${STAGE_AT.map((l, i) => `<div class="pt" data-s="${i + 1}"><div class="av"><img src="${petImg(i + 1)}" alt="${STAGE_NAMES[i]}"></div><small>${l === 25 ? '25+' : 'ур. ' + l}</small></div>`).join('')}</div></section>
  <div class="tl-note" id="note"></div>
  <section class="rings">${UPG.map(u => `<button class="rg ${u.color}" data-id="${u.id}" type="button"><span class="ring"><svg><use href="#${u.icon}"/></svg></span>
    <span class="tx"><small>${u.short}</small><b></b><i></i></span><span class="dot"></span></button>`).join('')}</section>
  <section class="card panel" id="panel"><div class="ttl"><b id="pN"></b><span id="pL"></span></div><p id="pH"></p>
    <div class="cmp"><div class="c"><small>Сейчас</small><b id="pNow"></b><em id="pU1"></em></div><svg><use href="#u-arrow"/></svg><div class="c nx"><small>После</small><b id="pNext"></b><em id="pU2"></em></div></div>
    <button class="btn btn--success btn--l" id="buy" type="button"></button></section>
</main>`);

let shownSt = 0;
function renderPet(animate) {
  const p = progress();
  if (p.st !== shownSt) {
    if (animate && !RM) { // перелив старой стадии в новую — две готовые картинки, только opacity/transform
      const A = $('#petA'), B = $('#petB'); B.src = petImg(p.st);
      A.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.1)' }], { duration: 500, fill: 'forwards' });
      B.animate([{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1.08)', offset: .7 }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, fill: 'forwards', easing: 'cubic-bezier(.34,1.56,.64,1)' })
        .onfinish = () => { A.src = B.src; A.getAnimations().forEach(a => a.cancel()); B.getAnimations().forEach(a => a.cancel()); B.style.opacity = 0; };
    } else $('#petA').src = petImg(p.st);
    shownSt = p.st;
  }
  $('#stg').textContent = '«' + STAGE_NAMES[p.st - 1] + '»'; $('#lv').textContent = 'ур. ' + p.lv;
  // заливка линии: от центра 1-й точки до текущей позиции между точками
  const pos = p.to ? (p.st - 1 + p.frac) / 5 : 1;
  $('#tlFill').style.transform = `scaleX(${pos})`;
  document.querySelectorAll('.tl .pt').forEach(el => { const s = +el.dataset.s; el.className = 'pt ' + (s < p.st ? 'done' : s === p.st ? 'cur' : s === p.st + 1 ? 'next lock' : 'lock'); });
  $('#note').innerHTML = p.to ? `Ещё ${p.left} ${pluralLv(p.left)} — и Булочка станет <b>«${STAGE_NAMES[p.st]}»</b>` : 'Булочка достигла последней стадии!';
}
function renderRings() {
  document.querySelectorAll('.rg').forEach(el => {
    const u = UPG.find(x => x.id === el.dataset.id), i = info(u);
    el.querySelector('.ring').style.setProperty('--p', Math.round(u.lvl / u.max * 100));
    el.querySelector('b').textContent = i.now; el.querySelector('i').textContent = i.maxed ? 'макс.' : `ур. ${u.lvl}/${u.max}`;
    el.classList.toggle('on', u.id === sel); el.classList.toggle('can', i.can);
  });
}
function renderPanel() {
  const u = UPG.find(x => x.id === sel), i = info(u), b = $('#buy');
  $('#pN').textContent = u.name; $('#pL').textContent = i.maxed ? 'максимум' : `ур. ${u.lvl} → ${u.lvl + 1}`; $('#pH').textContent = u.hint;
  $('#pNow').textContent = i.now; $('#pNext').textContent = i.next || '—'; $('#pU1').textContent = $('#pU2').textContent = u.unit;
  b.className = 'btn btn--l ' + (i.maxed ? 'is-max' : i.can ? 'btn--success' : 'is-short'); b.disabled = i.maxed;
  b.innerHTML = i.maxed ? 'Максимальный уровень' : i.can ? `Улучшить за ${coinImg()} ${i.cost.toLocaleString('ru-RU')}` : `Не хватает ${coinImg()} ${i.short.toLocaleString('ru-RU')}`;
}
const renderAll = a => { renderPet(a); renderRings(); renderPanel(); };
renderAll(false);

app.addEventListener('click', e => {
  const rg = e.target.closest('.rg');
  if (rg) { if (rg.dataset.id !== sel) { sel = rg.dataset.id; renderRings(); renderPanel(); pop($('#panel'), 1.02); } press(rg); return; }
  const b = e.target.closest('#buy'); if (!b) return;
  const r = buy(sel); press(b);
  if (!r.ok) { shake($('#panel')); if (r.reason === 'coins') toast('Пока не хватает монет — потапай Булочку'); return; }
  floatCost(b, r.cost); syncBalance(); renderAll(true);
  pop(document.querySelector(`.rg[data-id="${sel}"] .ring`), 1.15); pop($('#pNow'), 1.2); pop($('#pet'), 1.06);
  if (r.stageUp) setTimeout(() => showEvo(r.from, r.to, S.level), 650);
});
window.__upg = { S, UPG };
// автотест: выбрать первое доступное улучшение и нажать «купить» настоящими кликами
window.__demoBuy = () => { const u = UPG.find(x => info(x).can); if (!u) return false; document.querySelector(`.rg[data-id="${u.id}"]`).click(); $('#buy').click(); return true; };
document.documentElement.dataset.ready = '1';
