/* v3-3d · 3D-примерка в окне набора: three.js r160 (локально, ../lib) + GLTFLoader.
   GLB от Эволюции А: skins/glb/skin_<set>_raccoon_s1.glb, части = ноды part_<id>, правила видимости — glb/tryon_rules.mjs.
   Один общий кадр для всех наборов (ортокамера, радиус по самому широкому набору при вращении) → размер не меняется
   ни при переключении частей, ни между наборами. Рендер только по требованию; при закрытии окна — dispose. */
import * as THREE from 'three';
import { GLTFLoader } from '../../lib/addons/loaders/GLTFLoader.js?v=tc11132310';
import { applyRules } from './glb/tryon_rules.mjs?v=tc11152225';

const V = '?v=tc11152225';
const FILES = { common:'skin_common_raccoon_s1', epic:'skin_epic_raccoon_s1', legendary:'skin_legendary_raccoon_s1' };
/* fix4: известные размеры GLB в байтах (из glb/manifest.json → files[*].bytes). Поток fetch отдаёт уже распакованные байты,
   а Content-Length при gzip (GitHub Pages) — сжатый размер или его нет, поэтому знаменатель прогресса — этот размер */
const BYTES = { common:583596, epic:658024, legendary:807016 };
/* общий кадр: из glb/manifest.json (bbox_all). R — макс. радиус в плоскости XZ (Гроза с крыльями, 1,21 м), H — макс. высота (шляпа мага, 1,58 м) */
const BOX = { common:{min:[-0.44,-0.008,-0.558],max:[0.482,1.251,0.302]}, epic:{min:[-0.448,-0.002,-0.488],max:[0.593,1.575,0.35]}, legendary:{min:[-1.033,-0.008,-0.625],max:[1.041,1.225,0.302]} };
let R = 0, H = 0;
for (const b of Object.values(BOX)) { for (const x of [b.min[0], b.max[0]]) for (const z of [b.min[2], b.max[2]]) R = Math.max(R, Math.hypot(x, z)); H = Math.max(H, b.max[1]); }
const EL = THREE.MathUtils.degToRad(14);          // лёгкий взгляд сверху, как у рендеров 3/4
const TQ = 328;                                   // стартовый ракурс 3/4 = −32°: мордой влево-к нам, как у webp-рендеров (без скачка после загрузки)

function webglOK(){ try { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) return false; const l = g.getExtension('WEBGL_lose_context'); l && l.loseContext(); return true; } catch (e) { return false; } }
const OK = webglOK();

let ren, scene, cam, pivot, shadow, canvas, host, ro, cur = null, want = null, parts = new Set(), yaw = TQ, vel = 0, raf = 0, dirty = false, loadTok = 0;
const cache = {};   // gltf по набору (живёт, пока открыто окно)

function shadowTex(){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(40,30,90,.42)'); gr.addColorStop(.55,'rgba(40,30,90,.16)'); gr.addColorStop(1,'rgba(40,30,90,0)');
  g.fillStyle = gr; g.fillRect(0,0,128,128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function init(){
  ren = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  ren.setPixelRatio(Math.min(2, devicePixelRatio || 1)); ren.setClearColor(0x000000, 0);
  ren.outputColorSpace = THREE.SRGBColorSpace; ren.toneMapping = THREE.NoToneMapping;
  canvas = ren.domElement; canvas.className = 'sk3d-canvas'; canvas.setAttribute('aria-label','Питомец в наборе — крути пальцем');
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2f5, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(2.2, 3.2, 3.4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xf2eeff, 0.7); fill.position.set(-3, 1.2, 1.5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(0, 2.5, -3); scene.add(rim);
  cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  const d = 8; cam.position.set(0, Math.sin(EL) * d + H * 0.45, Math.cos(EL) * d); cam.lookAt(0, H * 0.45, 0);
  pivot = new THREE.Group(); scene.add(pivot);
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map:shadowTex(), transparent:true, depthWrite:false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.001; scene.add(shadow);
  /* вращение пальцем по Y, лёгкая инерция; без зума и без вертикального наклона */
  let px = null, lt = 0;
  canvas.addEventListener('pointerdown', e => { px = e.clientX; lt = performance.now(); vel = 0; canvas.setPointerCapture(e.pointerId); stop(); });
  canvas.addEventListener('pointermove', e => { if (px === null) return; const dx = e.clientX - px, t = performance.now(); px = e.clientX;
    const dy = dx * 0.55; yaw += dy; vel = dy / Math.max(8, t - lt) * 16; lt = t; draw(); });
  const up = () => { if (px === null) return; px = null; if (Math.abs(vel) > 0.3) spin(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  ro = new ResizeObserver(() => { if (size()) renderNow(); });   // размер сменился → перерисовать в том же кадре
}
function spin(){ stop(); const step = () => { vel *= 0.93; yaw += vel; draw(); if (Math.abs(vel) > 0.05) raf = requestAnimationFrame(step); else raf = 0; }; raf = requestAnimationFrame(step); }
function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; }
let sw = 0, shh = 0;
/* setSize очищает буфер WebGL — вызываем только при реальной смене размера, иначе на кадр мелькнёт пустой канвас */
function size(){ if (!host) return false; const w = host.clientWidth, h = host.clientHeight; if (!w || !h || (w === sw && h === shh)) return false; sw = w; shh = h; ren.setSize(w, h, false);
  /* кадр: ширина 2R (любой угол поворота), высота — проекция бокса 0…H с учётом наклона; запас 6% */
  const needW = 2 * R * 1.06, needH = (H * Math.cos(EL) + 2 * R * Math.sin(EL)) * 1.06, asp = w / h;
  let hw = needW / 2, hh = hw / asp; if (hh * 2 < needH) { hh = needH / 2; hw = hh * asp; }
  cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.updateProjectionMatrix(); return true; }
function draw(){ if (dirty) return; dirty = true; requestAnimationFrame(() => { dirty = false; if (!ren || !host) return; pivot.rotation.y = THREE.MathUtils.degToRad(yaw); ren.render(scene, cam); drawn = !!(cur && cache[cur] && cache[cur].visible); }); }

/* центр по bbox: голова+тело енота (без хвоста) → x,z = 0; лапы на полу → y = 0 */
function center(root){ const b = new THREE.Box3(); ['base_head','base_body'].forEach(n => { const o = root.getObjectByName(n); if (o) b.expandByObject(o); });
  if (b.isEmpty()) b.expandByObject(root.getObjectByName('body_base') || root);
  const c = b.getCenter(new THREE.Vector3()); root.position.set(-c.x, -0, -c.z); return { dx:-c.x, dz:-c.z }; }

/* fix3: GLB качаем fetch'ем (можно отменить) и разбираем parseAsync. Открытый/тапнутый набор — в приоритете:
   фоновая предзагрузка идёт строго по одному файлу и только когда нет приоритетной загрузки; если пользователь
   открыл другой набор, фоновая загрузка отменяется и встаёт в очередь заново (на Slow 4G не делим канал). */
const pending = {}, ctrl = {}, idleQ = [];
function load(set, idle){
  if (cache[set]) return Promise.resolve(cache[set]);
  if (pending[set]){ if (!idle) ctrl[set].idle = false; return pending[set]; }
  const c = new AbortController(); c.idle = !!idle; ctrl[set] = c;
  if (!idle) for (const k in ctrl) if (k !== set && ctrl[k].idle){ ctrl[k].abort(); if (!idleQ.includes(k)) idleQ.unshift(k); }
  pending[set] = fetch('skins/glb/' + FILES[set] + '.glb' + V, { signal:c.signal })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return readAll(r, set); })
    .then(buf => { setProg(set, 0.92); return new GLTFLoader().parseAsync(buf, 'skins/glb/'); })
    .then(g => { const off = center(g.scene); g.userData = off; cache[set] = g.scene; setProg(set, 0.95); return g.scene; })
    .finally(() => { delete pending[set]; delete ctrl[set]; setTimeout(pump, 0); });
  return pending[set];
}
/* fix4: прогресс загрузки. Скачивание — 0…90 %, разбор — 92–95 %, шейдеры — 97 %, первый кадр отрисован — 100 %
   (держится один кадр rAF, затем в том же такте показ 3D, поэтому 100 % не «висит»). Значение только растёт (max). Состояние хранится по набору: если GLB уже
   качается после pointerdown, открытое окно подхватывает текущий процент, второго запроса нет */
const prog = {};
let progRaf = 0;
function setProg(set, v){ if (!(v > (prog[set] || 0))) return; prog[set] = Math.min(1, v); if (!progRaf) progRaf = requestAnimationFrame(() => { progRaf = 0; paintProg(); }); }
function paintProg(){ if (!host || !want) return; const el = host.querySelector('.sk-load'); if (!el) return;
  const p = prog[want]; if (p == null) return; const pc = Math.floor(p * 100);
  el.classList.add('has-pc'); el.style.setProperty('--pc', pc + '%'); const t = el.querySelector('.sk-load-pc'); if (t) t.textContent = pc + '%'; el.dataset.pc = pc; }
async function readAll(r, set){
  const enc = (r.headers.get('content-encoding') || '').toLowerCase(), cl = +r.headers.get('content-length') || 0;
  const total = BYTES[set] || (!enc || enc === 'identity' ? cl : 0);
  if (!r.body || !r.body.getReader || !total){ const b = await r.arrayBuffer(); setProg(set, 0.9); return b; }
  const rd = r.body.getReader(), parts = []; let got = 0;
  setProg(set, 0.01);
  for (;;){ const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; setProg(set, 0.9 * Math.min(1, got / total)); }
  const out = new Uint8Array(got); let o = 0; for (const p of parts){ out.set(p, o); o += p.length; }
  setProg(set, 0.9); return out.buffer;
}
function pump(){
  if (Object.keys(pending).length) return;                       // по одному файлу; приоритетная загрузка — первой
  const i = idleQ.findIndex(x => !cache[x]); if (i < 0) { idleQ.length = 0; return; }
  const s = idleQ.splice(i, 1)[0]; load(s, true).catch(() => {});
}
/* предзагрузка: idle — фоновая очередь (простой на «Скинах»), без idle — сразу (pointerdown по карточке) */
function preload(set, idle){ if (!OK || !FILES[set] || cache[set]) return;
  if (idle){ if (!idleQ.includes(set) && !pending[set]) idleQ.push(set); pump(); } else load(set).catch(() => {}); }
function show(set){ for (const k in cache) cache[k].visible = (k === set); }

/* attach: окно набора перерисовалось — переносим канвас в новую сцену, грузим/переключаем модель, применяем правила */
/* attach: окно набора открыто/перерисовано. Постера в 3D-режиме нет — пока модель не готова, видна заглушка .sk-load.
   fix3: заглушка держится до первого РЕАЛЬНО показанного кадра с моделью: GLB скачан и разобран (текстуры внутри GLB
   уже декодированы parseAsync) → compileAsync (шейдеры) → render → rAF → ещё раз render и в том же такте .is-3d
   (канвас visible, заглушка display:none). Из кэша при живом рендерере — синхронно, как раньше (без заглушки). */
async function attach(stage, set, sel, angle){
  if (!OK) return false;
  if (!ren) init();
  if (host !== stage){ if (ro && host) ro.unobserve(host); host = stage; stage.appendChild(canvas); ro.observe(stage); size(); }
  if (angle != null) { yaw = angle; vel = 0; stop(); }
  parts = new Set(sel); want = set;
  if (cur !== set || !cache[set] || cache[set].parent !== pivot){
    const tok = ++loadTok;
    if (!cache[set]){
      stage.classList.remove('is-3d'); drawn = false;           // ещё не загружен: канвас скрыт, видна заглушка
      paintProg();                                              // предзагрузка уже идёт — сразу её текущий процент
      try {
        const root = await load(set);
        if (tok !== loadTok || !ren || host !== stage) return false;
        if (root.parent !== pivot) pivot.add(root); cur = set; show(cur); applyRules(cache[cur], parts);
        size(); pivot.rotation.y = THREE.MathUtils.degToRad(yaw);
        /* шейдеры: асинхронно, если есть KHR_parallel_shader_compile (иначе three пишет предупреждение) — синхронно */
        if (ren.extensions.has('KHR_parallel_shader_compile')) { try { await ren.compileAsync(scene, cam); } catch (e) { ren.compile(scene, cam); } } else ren.compile(scene, cam);
        if (tok !== loadTok || !ren || host !== stage) return false;
        setProg(set, 0.97);
        renderNow();                                              // первый кадр с моделью в буфере
        prog[set] = 1; paintProg();                               // 100 % виден ровно один кадр — затем сразу 3D
        await new Promise(r => requestAnimationFrame(r));
        if (tok !== loadTok || !ren || host !== stage) return false;
      } catch (e) { if (tok !== loadTok) return false; console.warn('3D: не загрузилось', set, e);
        if (window.SK3D_FALLBACK) window.SK3D_FALLBACK(stage); else stage.classList.add('is-3d-fail'); return false; }
    } else { const root = cache[set]; if (root.parent !== pivot) pivot.add(root); cur = set; }
  }
  show(cur); applyRules(cache[cur], parts);
  if (prog[cur] != null && prog[cur] < 1){ prog[cur] = 1; paintProg(); }   // 100 % — в том же такте, что показ 3D
  renderNow(); host.classList.add('is-3d'); host.dataset.sk3d = cur + ':' + [...parts].sort().join('+'); return true;
}
let drawn = false;   // последний render содержал модель (для проверок: SK3D.frame())
function renderNow(){ if (!ren || !host) return; size(); pivot.rotation.y = THREE.MathUtils.degToRad(yaw); ren.render(scene, cam); drawn = !!(cur && cache[cur] && cache[cur].parent === pivot && cache[cur].visible); }
function has(set){ return !!cache[set]; }
/* тап по части: только applyRules + кадр в том же такте (без rAF), чтобы после переноса сцены в DOM не было пустого кадра */
function update(sel){ if (!cur || !cache[cur]) return; parts = new Set(sel); applyRules(cache[cur], parts); if (host) host.dataset.sk3d = cur + ':' + [...parts].sort().join('+'); renderNow(); }
function detach(){ if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); if (ro && host) ro.unobserve(host); host = null; stop(); }
/* закрытие окна: освобождаем GPU (рендерер + контекст WebGL), но разобранные GLB оставляем в памяти сессии —
   повторное открытие сразу в 3D, без постера */
function dispose(){
  detach(); loadTok++;
  for (const k in cache) if (cache[k].parent) cache[k].parent.remove(cache[k]);
  if (shadow){ shadow.geometry.dispose(); shadow.material.map.dispose(); shadow.material.dispose(); }
  if (ren){ ren.dispose(); ren.forceContextLoss(); }
  if (ro) ro.disconnect();
  ren = scene = cam = pivot = shadow = canvas = ro = null; cur = want = null; drawn = false; yaw = TQ; sw = shh = 0;
}
function state(){ return { ok:OK, ready:!!(cur && host && host.classList.contains('is-3d')), cached:Object.keys(cache), set:cur, yaw:Math.round(((yaw % 360) + 360) % 360),
  visible: cur ? (() => { const r = []; cache[cur].traverse(o => { if (o.isMesh) { let v = true, p = o; while (p) { if (!p.visible) { v = false; break; } p = p.parent; } if (v) r.push(o.parent.name || o.name); } }); return [...new Set(r)]; })() : [],
  pixelRatio: ren ? ren.getPixelRatio() : 0 }; }

function frame(){ return { model: drawn && !!host && host.classList.contains('is-3d') }; }
window.SK3D = { ok:OK, TQ, attach, update, detach, dispose, state, has, preload, frame };
window.dispatchEvent(new Event('sk3d-ready'));
