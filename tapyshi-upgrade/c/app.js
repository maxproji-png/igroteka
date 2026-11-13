// C · Одно улучшение в фокусе: листаем карточки, на каждой крупно «Сейчас → После», внизу одна большая кнопка.
import { S, UPG, info, buy, progress, STAGE_NAMES, PET_NAME, petImg, pluralLv } from '../common/econ.js?v=up11140230';
import { shell, syncBalance, floatCost, toast, shake, pop, press, showEvo, coinImg, $, RM } from '../common/ui.js?v=up11140230';

const app = $('.app'); shell(app);
let cur = 0;
app.insertAdjacentHTML('beforeend', `<main class="scroll">
  <section class="card prog"><div class="av" id="av"><img id="avImg" alt=""></div><div class="tx"><b>${PET_NAME} <em id="stg"></em></b><small id="to"></small></div>
    <div class="nx"><img id="nxImg" alt=""><svg><use href="#u-lock"/></svg></div></section>
  <nav class="chips">${UPG.map((u, i) => `<button class="chip" data-i="${i}" type="button">${u.short}</button>`).join('')}</nav>
  <div class="track" id="track">${UPG.map(u => `<article class="slide ${u.color}" data-id="${u.id}">
    <div class="band"><div class="big"><svg><use href="#${u.icon}"/></svg></div><div><h2>${u.name}</h2><small>${u.hint}</small></div></div>
    <div class="pips">${'<i></i>'.repeat(u.max)}</div>
    <div class="vs"><div class="c"><small>Сейчас</small><b class="now"></b><em>${u.unit}</em></div><svg><use href="#u-arrow"/></svg><div class="c after"><small>После</small><b class="nxv"></b><em>${u.unit}</em></div></div>
    <div class="gain"><span></span></div></article>`).join('')}</div>
  <div class="dots">${UPG.map(() => '<i></i>').join('')}</div>
  <section class="card evo2"><div class="pp"><img id="e1" alt=""><small id="e1t"></small></div>
    <div class="mid"><b id="eh"></b><div class="bar"><i id="ebar"></i></div><small id="en"></small></div>
    <div class="pp nx"><img id="e2" alt=""><small id="e2t"></small></div></section>
</main>
<div class="cta"><button class="btn btn--success btn--l" id="buy" type="button"></button><span class="sub" id="sub"></span></div>`);

const slides = [...document.querySelectorAll('.slide')], track = $('#track');
function gainText(u) {
  const a = u.val(u.lvl), b = u.val(u.lvl + 1);
  if (!a) return 'Включить';
  const pct = Math.round((b - a) / a * 100);
  return `+${pct}%`;
}
function renderSlide(el) {
  const u = UPG.find(x => x.id === el.dataset.id), i = info(u);
  el.querySelector('.now').textContent = i.now; el.querySelector('.nxv').textContent = i.next || '—';
  [...el.querySelectorAll('.pips i')].forEach((p, k) => p.className = k < u.lvl ? 'on' : k === u.lvl ? 'nx' : '');
  el.classList.toggle('maxed', i.maxed);
  el.querySelector('.gain span').textContent = i.maxed ? 'Максимальный уровень' : `${gainText(u)} · ур. ${u.lvl} → ${u.lvl + 1}`;
}
function renderPet() {
  const p = progress();
  $('#avImg').src = petImg(p.st); $('#stg').textContent = '«' + STAGE_NAMES[p.st - 1] + '» · ур. ' + p.lv;
  $('#av').style.setProperty('--p', Math.round((p.to ? p.frac : 1) * 100));
  $('#to').textContent = p.to ? `До «${STAGE_NAMES[p.st]}»: ${p.left} ${pluralLv(p.left)}` : 'Последняя стадия';
  $('#nxImg').src = petImg(Math.min(6, p.st + 1));
  const ns = Math.min(6, p.st + 1);
  $('#e1').src = petImg(p.st); $('#e2').src = petImg(ns);
  $('#e1t').textContent = STAGE_NAMES[p.st - 1]; $('#e2t').textContent = p.to ? STAGE_NAMES[ns - 1] : '—';
  $('#eh').textContent = p.to ? 'Следующая стадия' : 'Булочка полностью выросла';
  $('#ebar').style.transform = `scaleX(${p.to ? p.frac : 1})`;
  $('#en').textContent = p.to ? `Любое улучшение = +1 уровень · ещё ${p.left}` : 'Все 6 стадий открыты';
}
function renderCta() {
  const u = UPG[cur], i = info(u), b = $('#buy');
  b.className = 'btn btn--l ' + (i.maxed ? 'is-max' : i.can ? 'btn--success' : 'is-short'); b.disabled = i.maxed;
  b.innerHTML = i.maxed ? 'Уже максимум' : i.can ? `Улучшить за ${coinImg()} ${i.cost.toLocaleString('ru-RU')}` : `Не хватает ${coinImg()} ${i.short.toLocaleString('ru-RU')}`;
  $('#sub').textContent = i.maxed ? 'Выберите другое улучшение' : `${u.name}: ${i.now} → ${i.next} · +1 уровень Булочке`;
  document.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', k === cur));
  document.querySelectorAll('.dots i').forEach((c, k) => c.classList.toggle('on', k === cur));
}
const renderAll = () => { slides.forEach(renderSlide); renderPet(); renderCta(); };
renderAll();

// какая карточка в фокусе — IntersectionObserver, без чтения layout на скролле
const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .6) { const k = slides.indexOf(e.target); if (k !== cur) { cur = k; renderCta(); } } }); }, { root: track, threshold: [.6] });
slides.forEach(s => io.observe(s));
const goTo = k => slides[k].scrollIntoView({ behavior: RM ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });

app.addEventListener('click', e => {
  const ch = e.target.closest('.chip'); if (ch) { goTo(+ch.dataset.i); return; }
  const b = e.target.closest('#buy'); if (!b) return;
  const id = UPG[cur].id, r = buy(id), sl = slides[cur]; press(b);
  if (!r.ok) { shake(sl); if (r.reason === 'coins') toast('Не хватает монет — потапай или выбери другое'); return; }
  floatCost(b, r.cost); syncBalance();
  // «После» переезжает в «Сейчас»: новое значение въезжает справа
  if (!RM) {
    sl.querySelector('.now').animate([{ transform: 'translateX(60px) scale(.8)', opacity: 0 }, { transform: 'translateX(0) scale(1.12)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    sl.querySelector('.nxv').animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 360, delay: 120, fill: 'backwards', easing: 'ease-out' });
  }
  renderAll();
  pop(sl.querySelector('.big'), 1.14); pop($('#avImg'), 1.1);
  const pip = sl.querySelectorAll('.pips i')[UPG[cur].lvl - 1]; if (pip) pop(pip, 1.5);
  if (r.stageUp) setTimeout(() => showEvo(r.from, r.to, S.level), 520);
});
window.__upg = { S, UPG };
window.__demoBuy = () => { const k = UPG.findIndex(x => info(x).can); if (k < 0) return false; cur = k; renderCta(); $('#buy').click(); return true; };
document.documentElement.dataset.ready = '1';
