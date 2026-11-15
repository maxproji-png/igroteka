// «99 ночей» — клиент прототипа (GDD v0.5): рендер (Three.js r160), ввод, HUD, меню, звук и эффекты.
// Вся игровая логика — в js/sim.js (чистое сериализуемое состояние + команды), клиент её только рисует.
import * as THREE from 'three';
import { ASSETS, PET_MODELS } from './assets.js?v=0.7.0';
import * as SIM from './sim.js?v=0.7.0';
import { GameSfx } from './sfx.js?v=0.7.0';
import { GameVFX } from './fx/vfx.js?v=0.7.0';
const { CFG, PETS, RECIPES, STAGES } = SIM;

// ---------- параметры ----------
const Q = new URLSearchParams(location.search);
const FAST = Q.has('fast') ? Math.max(2, +Q.get('fast') || 6) : 1;   // ?fast=1 — время ×6 (или ?fast=10)
const DEBUG = Q.get('debug') === '1';
const NOADAPT = Q.has('noadapt');
// QA-флаги (только вместе с ?debug=1): night=N — сразу соло в ночь N (1–12) нужного этапа с его стартовым набором, без сейва; unlock=1 — все этапы MVP открыты
const QA_NIGHT = DEBUG && Q.has('night') ? Math.max(1, Math.min(12, Math.floor(+Q.get('night')) || 1)) : 0, QA_UNLOCK = DEBUG && Q.get('unlock') === '1';
const TUT_KEY = '99n_tut';
const SAVE_KEY = '99n_v2_save', PET_KEY = '99n_v1_pet', ACC_KEY = '99n_acc', MUTE_KEY = '99n_mute'; let PID = 'p1';
// Кооп только с флагом ?server=ws://127.0.0.1:2567 — без него сборка остаётся соло (кнопки сети «скоро»)
const NET = /^wss?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d{2,5})?\/?$/.test(Q.get('server') || '') ? Q.get('server') : null; let COOP = null;
const QUALITY = Q.get('q') || (matchMedia('(pointer:coarse)').matches ? 'low' : 'high');   // слабый телефон — 'low' (по README пака)
const $ = id => document.getElementById(id);
let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;   // только для декора
const R = (a, b) => a + (b - a) * rnd();
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------- иконки (SVG, без эмодзи-шрифтов) ----------
const IC = {
 log:'<svg viewBox="0 0 32 32"><rect x="3" y="11" width="24" height="11" rx="5.5" fill="#c9824a"/><ellipse cx="26" cy="16.5" rx="4" ry="5.5" fill="#f2c27f"/><ellipse cx="26" cy="16.5" rx="1.8" ry="2.6" fill="#c9824a"/><path d="M7 14h10M9 19h9" stroke="#a7643a" stroke-width="1.6" stroke-linecap="round"/></svg>',
 stick:'<svg viewBox="0 0 32 32"><path d="M5 26L26 6M15 16l8 2M11 20l-2-7" stroke="#b5743f" stroke-width="3.2" stroke-linecap="round"/><circle cx="23.5" cy="18" r="2" fill="#7ccf5a"/></svg>',
 stone:'<svg viewBox="0 0 32 32"><path d="M5 22l3-9 8-5 9 4 2 10-6 4H11z" fill="#a9b1c6"/><path d="M8 13l8-5 9 4-8 4z" fill="#cfd5e3"/></svg>',
 berry:'<svg viewBox="0 0 32 32"><path d="M16 10c2-4 6-5 9-4-1 3-4 5-9 4z" fill="#62c35a"/><circle cx="11" cy="19" r="6" fill="#ff4f6d"/><circle cx="20" cy="21" r="6" fill="#e8365a"/><circle cx="9" cy="17" r="1.6" fill="#fff" opacity=".8"/><circle cx="18" cy="19" r="1.6" fill="#fff" opacity=".8"/></svg>',
 axe:'<svg viewBox="0 0 32 32"><path d="M9 28L22 7" stroke="#b5743f" stroke-width="3.4" stroke-linecap="round"/><path d="M16 8c3-5 10-5 12 0l-4 7c-2-2-5-3-8-3z" fill="#9aa6bf"/><path d="M24 15l4-7" stroke="#e6ebf5" stroke-width="2"/></svg>',
 torch:'<svg viewBox="0 0 32 32"><path d="M13 29l3-15" stroke="#b5743f" stroke-width="3.4" stroke-linecap="round"/><path d="M17 3c4 4 6 7 3 11-2 2-6 2-7-1-1-3 3-5 4-10z" fill="#ff8a3c"/><path d="M17 8c2 2 3 4 1 6-1 1-3 0-3-1 0-2 2-3 2-5z" fill="#ffe066"/></svg>',
 fire:'<svg viewBox="0 0 32 32"><path d="M16 3c6 6 10 11 7 18-2 5-12 5-14 0-2-5 2-8 4-10 0 3 1 4 3 5 1-4-1-8 0-13z" fill="#ff8a3c"/><path d="M16 14c3 3 4 5 3 8-1 2-5 2-6 0-1-2 1-4 3-8z" fill="#ffe066"/></svg>',
 camp:'<svg viewBox="0 0 32 32"><path d="M16 2c5 5 8 9 6 14-2 4-10 4-12 0-1-4 2-6 3-8 0 2 1 3 2 4 1-3-1-6 1-10z" fill="#ff8a3c"/><ellipse cx="6" cy="25" rx="5" ry="4" fill="#a9b1c6"/><ellipse cx="26" cy="25" rx="5" ry="4" fill="#a9b1c6"/><ellipse cx="16" cy="27" rx="5" ry="4" fill="#cfd5e3"/></svg>',
 fence:'<svg viewBox="0 0 32 32"><g fill="#c9824a"><path d="M5 28V9l3-4 3 4v19z"/><path d="M14 28V7l3-4 3 4v21z"/><path d="M23 28V9l3-4 3 4v19z"/></g><rect x="3" y="13" width="27" height="3" rx="1.5" fill="#a7643a"/><rect x="3" y="21" width="27" height="3" rx="1.5" fill="#a7643a"/></svg>',
 heart:'<svg viewBox="0 0 32 32"><path d="M16 28S3 20 3 11a6.5 6.5 0 0113-2 6.5 6.5 0 0113 2c0 9-13 17-13 17z" fill="#ff5470"/></svg>',
 food:'<svg viewBox="0 0 32 32"><path d="M16 9c-6-4-13 0-12 8 1 7 6 12 12 10 6 2 11-3 12-10 1-8-6-12-12-8z" fill="#ff9a3c"/><path d="M16 9c0-3 1-5 3-6" stroke="#8a5a2b" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M17 7c3-3 7-2 8 0-3 2-6 2-8 0z" fill="#62c35a"/></svg>',
 sun:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="7" fill="#ffc83c"/><path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M6 26l3-3M23 9l3-3" stroke="#ffc83c" stroke-width="3" stroke-linecap="round"/></svg>',
 moon:'<svg viewBox="0 0 32 32"><path d="M21 4a12 12 0 100 24A13 13 0 0121 4z" fill="#7d8cff"/><circle cx="25" cy="9" r="1.6" fill="#ffd45c"/></svg>',
 hand:'<svg viewBox="0 0 32 32"><path d="M10 17V9a2 2 0 014 0v6-9a2 2 0 014 0v9-7a2 2 0 014 0v8-4a2 2 0 014 0v9c0 6-4 10-10 10-5 0-8-3-10-7l-3-5a2 2 0 013-2z" fill="#ffd9b3" stroke="#d29a6a" stroke-width="1.4"/></svg>',
 paw:'<svg viewBox="0 0 32 32"><path d="M6 24L14 6M13 26L21 8M20 27L27 12" stroke="#ff5470" stroke-width="3.4" stroke-linecap="round"/></svg>',
 craft:'<svg viewBox="0 0 32 32"><path d="M7 27l12-12" stroke="#b5743f" stroke-width="3.6" stroke-linecap="round"/><path d="M15 9l6-5 7 7-5 6z" fill="#7d8cff"/><path d="M19 7l6 6" stroke="#c9d1ff" stroke-width="2"/></svg>',
 cloth:'<svg viewBox="0 0 32 32"><path d="M5 9l9-3 4 4 9-2-2 15-10 4-9-3z" fill="#ff8fb8"/><path d="M9 12l6 2 6-3M8 18l7 2 8-3" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 2" fill="none"/></svg>',
 bolt:'<svg viewBox="0 0 32 32"><path d="M18 3L7 18h7l-2 11 11-15h-7z" fill="#4f9dff"/></svg>',
 flash:'<svg viewBox="0 0 32 32"><path d="M17 12l10-6v20l-10-6z" fill="#ffe27a"/><rect x="4" y="11" width="14" height="10" rx="3" fill="#7d8cff"/><rect x="7" y="14" width="5" height="4" rx="1.5" fill="#c9d1ff"/></svg>',
 chest:'<svg viewBox="0 0 32 32"><rect x="4" y="13" width="24" height="14" rx="3" fill="#c9824a"/><path d="M4 14a6 6 0 016-6h12a6 6 0 016 6z" fill="#e0a46a"/><rect x="4" y="13" width="24" height="3" fill="#ffd36b"/><rect x="14" y="14" width="4" height="6" rx="1.5" fill="#ffd36b"/></svg>',
 pie:'<svg viewBox="0 0 32 32"><path d="M3 19c0-6 6-10 13-10s13 4 13 10z" fill="#f2b766"/><rect x="3" y="19" width="26" height="6" rx="3" fill="#d9914a"/><path d="M9 14l2 2M15 12l1 3M21 14l-2 2" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/></svg>',
 bag:'<svg viewBox="0 0 32 32"><path d="M11 10a5 5 0 0110 0" stroke="#a7643a" stroke-width="2.6" fill="none"/><rect x="5" y="10" width="22" height="18" rx="6" fill="#ffb13b"/><rect x="11" y="16" width="10" height="6" rx="2" fill="#ffd36b"/></svg>',
 bench:'<svg viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="5" rx="2" fill="#c9824a"/><path d="M6 16v11M26 16v11" stroke="#a7643a" stroke-width="3"/><path d="M14 4l6 6-2 2-6-6z" fill="#9aa6bf"/></svg>',
 wake:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#ffd36b"/><path d="M11 14h3M18 14h3M11 20q5 4 10 0" stroke="#33405a" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>',
 lamp:'<svg viewBox="0 0 32 32"><path d="M16 3v6" stroke="#a7643a" stroke-width="2.6"/><rect x="9" y="9" width="14" height="16" rx="4" fill="#ffd36b"/><rect x="12" y="12" width="8" height="10" rx="3" fill="#fff6c9"/></svg>',
 trap:'<svg viewBox="0 0 32 32"><circle cx="16" cy="18" r="11" fill="none" stroke="#b5743f" stroke-width="2.4"/><path d="M8 12l16 12M24 12L8 24M5 18h22M16 7v22" stroke="#d9a46a" stroke-width="1.6"/></svg>',
 rain:'<svg viewBox="0 0 32 32"><path d="M9 18a6 6 0 010-12 8 8 0 0115 2 5 5 0 011 10z" fill="#b9c6e6"/><path d="M11 22l-2 5M17 22l-2 5M23 22l-2 5" stroke="#4f9dff" stroke-width="2.4" stroke-linecap="round"/></svg>',
 fog:'<svg viewBox="0 0 32 32"><path d="M4 11h20M8 16h20M4 21h18M10 26h14" stroke="#9fb0d6" stroke-width="3" stroke-linecap="round"/></svg>',
 wind:'<svg viewBox="0 0 32 32"><path d="M4 12h15a4 4 0 10-4-4M4 18h21a4 4 0 11-4 4M4 24h9" stroke="#7fb8d9" stroke-width="2.8" stroke-linecap="round" fill="none"/></svg>',
 moth:'<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="2" ry="7" fill="#6d5daa"/><path d="M15 14C9 6 3 10 6 16c2 3 6 3 9 0zM17 14c6-8 12-4 9 2-2 3-6 3-9 0z" fill="#d9e4ff"/><path d="M15 19c-5 1-7 6-4 7 2 1 4-2 4-7zM17 19c5 1 7 6 4 7-2 1-4-2-4-7z" fill="#bcd0ff"/></svg>',
 snd:'<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#6b7590"/><path d="M21 11a7 7 0 010 10M24 7a12 12 0 010 18" stroke="#6b7590" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>',
 mute:'<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#9aa3b8"/><path d="M21 12l7 8M28 12l-7 8" stroke="#ff6b7f" stroke-width="2.8" stroke-linecap="round"/></svg>',
 coin:'<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#ffc83c"/><circle cx="16" cy="16" r="8.5" fill="#ffdf6e"/><path d="M13 11h5a3 3 0 010 6h-4M13 11v10" stroke="#d99a1a" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>',
 lock:'<svg viewBox="0 0 32 32"><rect x="7" y="14" width="18" height="13" rx="4" fill="#b4bccf"/><path d="M11 14v-3a5 5 0 0110 0v3" stroke="#b4bccf" stroke-width="3" fill="none"/></svg>',
 star:'<svg viewBox="0 0 32 32"><path d="M16 3l4 8.5 9 1.2-6.6 6.2 1.7 9.1L16 23.6 7.9 28l1.7-9.1L3 12.7l9-1.2z" fill="#ffc83c"/></svg>',
 save:'<svg viewBox="0 0 32 32"><path d="M6 5h16l5 5v16a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" fill="#7d8cff"/><rect x="10" y="5" width="11" height="7" rx="1" fill="#e3e8ff"/><rect x="9" y="17" width="14" height="8" rx="2" fill="#fff"/></svg>',
 pause:'<svg viewBox="0 0 32 32"><rect x="8" y="6" width="6" height="20" rx="2.5" fill="#6b7590"/><rect x="18" y="6" width="6" height="20" rx="2.5" fill="#6b7590"/></svg>',
};
const RES = [['log','Брёвна'],['stick','Ветки'],['stone','Камни'],['berry','Ягоды']];
// ---------- рендерер ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance', stencil: false });
const PR_CAP = Math.min(devicePixelRatio || 1, QUALITY === 'low' ? 1.35 : 1.5); let pixelRatio = PR_CAP;   // v0.7: на слабых (low) старт ниже, дальше — адаптивно в обе стороны
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = false;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x8fd3ff, 24, 62);
scene.background = new THREE.Color(0x8fd3ff);
const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 90);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 70 : 55; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const hemi = new THREE.HemisphereLight(0xdff2ff, 0x7fbf5a, 2.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.8); sun.position.set(20, 40, 12); scene.add(sun);
const fireLight = new THREE.PointLight(0xffa04a, 0, 20, 1.3); fireLight.position.set(0, 1.6, 0); scene.add(fireLight);
const torchLight = new THREE.PointLight(0xffb060, 0, 9, 1.4); scene.add(torchLight);

// ---------- геометрия: «запекание» деталей в один меш с цветами вершин ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
function part(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)));
  const n = g.attributes.position.count, col = new Float32Array(n * 3); _c.set(color);
  for (let i = 0; i < n; i += 3) { const k = 1 + (rnd() - .5) * .1; for (let j = 0; j < 3; j++) { col[(i + j) * 3] = _c.r * k; col[(i + j) * 3 + 1] = _c.g * k; col[(i + j) * 3 + 2] = _c.b * k; } }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of list) { const p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++, o++) { pos[o*3] = p.getX(i); pos[o*3+1] = p.getY(i); pos[o*3+2] = p.getZ(i);
      if (c) { col[o*3] = c.getX(i); col[o*3+1] = c.getY(i); col[o*3+2] = c.getZ(i); } else col.fill(1, o*3, o*3+3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
// запечь загруженный GLB (все меши, цвета материалов) в одну геометрию; a.include/a.exclude — фильтр по именам узлов.
// Обычные части → {geo} (освещаемый, цвет = baseColor + слабый emissive); яркие emissive-части → {glow} (без освещения).
const ASSET_STATE = { loaded: [], failed: [], tris: {} };
function bakeObject(root, a = {}) {
  root.updateMatrixWorld(true); const list = [], glowList = []; const ec = new THREE.Color();
  root.traverse(o => { if (!o.isMesh) return; const nm = o.name || (o.parent && o.parent.name) || '';
    if (a.include && !a.include.test(nm)) return; if (a.exclude && a.exclude.test(nm)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const mats = Array.isArray(o.material) ? o.material : [o.material]; const n = g.attributes.position.count;
    const groups = g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }];
    const m0 = mats[groups[0].materialIndex || 0] || mats[0]; const ei = m0.emissive ? (m0.emissiveIntensity ?? 1) : 0;
    const bright = m0.emissive && ei * Math.max(m0.emissive.r, m0.emissive.g, m0.emissive.b) > (a.glowMin ?? .35);
    const col = new Float32Array(n * 3);
    for (const gr of groups) { const m = mats[gr.materialIndex || 0] || mats[0];
      if (bright) ec.copy(m.emissive).multiplyScalar(Math.min(1.25, m.emissiveIntensity ?? 1)).add(_c.copy(m.color || _c.set(0, 0, 0)).multiplyScalar(.25)); else { ec.copy(m.color || _c.set(1, 1, 1)); if (m.emissive) ec.r = Math.min(1, ec.r + m.emissive.r * (m.emissiveIntensity ?? 1) * .5), ec.g = Math.min(1, ec.g + m.emissive.g * (m.emissiveIntensity ?? 1) * .5), ec.b = Math.min(1, ec.b + m.emissive.b * (m.emissiveIntensity ?? 1) * .5); }
      for (let i = gr.start; i < Math.min(n, gr.start + gr.count); i++) { col[i*3] = ec.r; col[i*3+1] = ec.g; col[i*3+2] = ec.b; } }
    if (g.attributes.color) { const vc = g.attributes.color; for (let i = 0; i < n; i++) { col[i*3] *= vc.getX(i); col[i*3+1] *= vc.getY(i); col[i*3+2] *= vc.getZ(i); } }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', g.attributes.position); ng.setAttribute('color', new THREE.BufferAttribute(col, 3)); (bright ? glowList : list).push(ng); });
  if (!list.length && !glowList.length) throw new Error('нет мешей под фильтр');
  if (!list.length) { const gg = merge(glowList); gg.scale(a.scale || 1, a.scale || 1, a.scale || 1); gg.computeBoundingSphere(); return { geo: null, glow: gg }; }
  const fin = (g, y0) => { g.rotateY(a.ry || 0); g.scale(a.scale || 1, a.scale || 1, a.scale || 1); g.translate(0, -y0, 0); g.computeBoundingSphere(); return g; };
  const geo = merge(list); geo.rotateY(a.ry || 0); geo.scale(a.scale || 1, a.scale || 1, a.scale || 1); geo.computeBoundingBox(); const y0 = a.noGround ? 0 : geo.boundingBox.min.y; geo.translate(0, -y0, 0); geo.computeBoundingSphere();
  return { geo, glow: glowList.length ? fin(merge(glowList), y0) : null, tris: (geo.attributes.position.count + (glowList.length ? 0 : 0)) / 3 };
}

const C = { trunk: '#b9773f', trunk2: '#9c6234', g1: '#47b956', g2: '#5ccd63', g3: '#86df6b', o1: '#7ed957', o2: '#9be56a', o3: '#62c94f', rock: '#b9c0d6', rock2: '#d3d8e6', berry: '#ff4f6d', bush: '#4cbc5a', wood: '#c9824a' };
const Cyl = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s), Cone = (r, h, s) => new THREE.ConeGeometry(r, h, s), Ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d), Dod = r => new THREE.DodecahedronGeometry(r, 0), Box = (a, b, c) => new THREE.BoxGeometry(a, b, c);
const GEO = {
  pine: () => merge([part(Cyl(.16, .24, 1.3, 6), C.trunk, 0, .65), part(Cone(1.35, 1.7, 7), C.g1, 0, 1.75), part(Cone(1.02, 1.45, 7), C.g2, 0, 2.55, 0, 0, .3), part(Cone(.66, 1.2, 7), C.g3, 0, 3.25, 0, 0, .6)]),
  oak: () => merge([part(Cyl(.18, .27, 1.5, 6), C.trunk, 0, .75), part(Ico(1.15), C.o1, 0, 2.3, 0, .3, .2), part(Ico(.8), C.o2, .65, 2.05, .3), part(Ico(.75), C.o3, -.55, 2.65, -.2, .5)]),
  stump: () => merge([part(Cyl(.26, .31, .36, 7), C.trunk, 0, .18), part(Cyl(.22, .22, .02, 7), '#f2c27f', 0, .37)]),
  rock: () => merge([part(Dod(.9), C.rock, 0, .35, 0, 0, 0, 0, 1, .62, 1), part(Dod(.45), C.rock2, .7, .18, .3, .4, .5, 0, 1, .7, 1)]),
  stone: () => merge([part(Dod(.22), '#a3abc2', 0, .13, 0, 0, 0, 0, 1, .7, 1), part(Dod(.13), '#c7cddd', .2, .08, .1)]),
  branch: () => merge([part(Cyl(.045, .06, 1, 5), C.wood, 0, .06, 0, 0, 0, Math.PI / 2), part(Cyl(.03, .04, .4, 4), C.wood, .15, .08, .14, 0, -.8, Math.PI / 2), part(Ico(.08), '#7ccf5a', -.4, .1, .05)]),
  bush: () => merge([part(Ico(.62), C.bush, 0, .45, 0, 0, 0, 0, 1, .85, 1), part(Ico(.45), '#5fd06a', .45, .32, .2), part(Ico(.4), '#45b052', -.4, .3, -.15)]),
  berries: () => merge([[.35, .7, .35], [-.3, .75, .3], [.1, .95, -.2], [.55, .45, .45], [-.55, .45, .1], [.2, .6, .55], [-.15, .55, -.5], [.5, .7, -.2]].map(p => part(new THREE.OctahedronGeometry(.11), C.berry, ...p))),
  fence: () => { const L = []; for (let i = 0; i < 5; i++) { const x = -1 + i * .5, h = 1.05 + (i % 2) * .15; L.push(part(Cyl(.08, .09, h, 5), C.wood, x, h / 2), part(Cone(.09, .2, 5), '#e0a46a', x, h + .1)); } L.push(part(Box(2.3, .1, .06), C.trunk2, 0, .4, .09), part(Box(2.3, .1, .06), C.trunk2, 0, .85, .09)); return merge(L); },
  grass: () => { const L = []; const cols = ['#6fd35a', '#8be06a', '#5cc24f', '#7fd860']; for (let i = 0; i < 4; i++) { const a = i * 1.6, h = .3 + (i % 2) * .14, tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-.06, 0, 0, .06, 0, 0, .02, h, .04], 3)); L.push(part(tri, cols[i], Math.cos(a) * .08, 0, Math.sin(a) * .08, 0, a, (i - 1.5) * .15)); } return merge(L); },
  flower: () => merge([part(new THREE.CylinderGeometry(.015, .015, .3, 3, 1, true), '#5cc24f', 0, .15), part(new THREE.CylinderGeometry(.09, .05, .04, 5), '#ffffff', 0, .31), part(new THREE.OctahedronGeometry(.035), '#ffd23c', 0, .34)]),
  lstump: () => merge([part(Cyl(.34, .42, .5, 8), C.trunk, 0, .25), part(Cyl(.3, .3, .02, 8), '#f2c27f', 0, .51), part(Ico(.12), '#62c35a', .3, .1, .3)]),
  scraps: () => merge([part(Box(.32, .05, .26), '#ff8fb8', .05, .55, .02, 0, .4, .08), part(Box(.2, .05, .2), '#7fd6ff', -.12, .58, -.08, 0, -.3, -.1)]),
  campfire: () => merge([part(Cyl(.13, .15, 1.3, 6), C.trunk, 0, .14, 0, 0, 0, Math.PI / 2), part(Cyl(.13, .15, 1.3, 6), C.trunk2, 0, .3, 0, Math.PI / 2, 0, Math.PI / 2), part(Cyl(.12, .14, 1.2, 6), C.trunk, 0, .22, 0, 0, .8, Math.PI / 2), ...Array.from({ length: 8 }, (_, i) => part(Dod(.17), i % 2 ? C.rock : C.rock2, Math.cos(i / 8 * 6.283) * .8, .1, Math.sin(i / 8 * 6.283) * .8, i, i))]),
  trap: () => { const L = [part(new THREE.TorusGeometry(.62, .05, 4, 14), '#b5743f', 0, .04, 0, Math.PI / 2)]; for (let i = 0; i < 4; i++) L.push(part(Box(1.2, .02, .03), '#e0b27a', 0, .04, 0, 0, i * Math.PI / 4)); return merge(L); },
  mist: () => merge([part(Ico(.5, 1), '#5b4c94', 0, .55), part(Ico(.32), '#6d5daa', .35, .75, -.1), part(Ico(.3), '#4d3f82', -.35, .45, -.15), part(Ico(.26), '#6d5daa', -.1, .95, -.25)]),
  mistEyes: () => merge([part(Ico(.08), '#ffffff', -.15, .68, .44), part(Ico(.08), '#ffffff', .15, .68, .44)]),
  crow: () => merge([part(Ico(.32), '#3d4670', 0, 0, 0, 0, 0, 0, 1, .9, 1.25), part(Ico(.22), '#4b5585', 0, .2, .32), part(Cone(.07, .22, 4), '#ffc24a', 0, .17, .58, Math.PI / 2), part(Box(.7, .05, .32), '#2f3760', -.42, .05, 0, 0, 0, .25), part(Box(.7, .05, .32), '#2f3760', .42, .05, 0, 0, 0, -.25), part(Cone(.12, .35, 4), '#2f3760', 0, 0, -.45, -Math.PI / 2)]),
  crowEyes: () => merge([part(Box(.08, .03, .02), '#ffe9a8', -.09, .26, .52), part(Box(.08, .03, .02), '#ffe9a8', .09, .26, .52)]),
  moose: () => { const L = [part(Box(.75, .7, 1.5), '#8e9be0', 0, 1.75), part(Box(.6, .5, .4), '#a9b4ee', 0, 1.75, .55), part(Box(.32, .9, .32), '#8e9be0', 0, 2.35, .75, -.35), part(Box(.42, .4, .55), '#8e9be0', 0, 2.75, 1.0), part(Box(.3, .26, .3), '#f1e6d2', 0, 2.62, 1.32), part(Box(.12, .06, .05), '#5a5f8a', 0, 2.7, 1.48)];
    for (const [x, z] of [[-.25, .55], [.25, .55], [-.25, -.55], [.25, -.55]]) L.push(part(Cyl(.06, .05, 1.45, 5), '#7480c8', x, .72, z), part(Box(.14, .1, .16), '#f1e6d2', x, .05, z));
    for (const sx of [-1, 1]) { L.push(part(Cyl(.04, .05, .7, 4), '#f6e9c8', sx * .32, 3.15, .95, 0, 0, sx * -.9)); for (let k = 0; k < 3; k++) L.push(part(Cyl(.03, .04, .35, 4), '#f6e9c8', sx * (.45 + k * .14), 3.32 + k * .04, .95 + (k - 1) * .12, 0, 0, sx * -.2)); L.push(part(Box(.2, .1, .08), '#7480c8', sx * .26, 2.98, .95, 0, 0, sx * .5)); }
    L.push(part(Cone(.1, .35, 4), '#a9b4ee', 0, 1.95, -.85, -2.2)); return merge(L); },
  mooseEyes: () => merge([part(Box(.08, .1, .03), '#e9f1ff', -.14, 2.85, 1.28), part(Box(.08, .1, .03), '#e9f1ff', .14, 2.85, 1.28)]),
  moth: () => merge([part(Cyl(.05, .03, .36, 4), '#6d5daa', 0, 0, 0, Math.PI / 2), part(new THREE.CircleGeometry(.28, 5), '#e6edff', -.2, 0, .02, -Math.PI / 2, 0, .3), part(new THREE.CircleGeometry(.28, 5), '#e6edff', .2, 0, .02, -Math.PI / 2, 0, -.3), part(new THREE.CircleGeometry(.18, 5), '#c9d6ff', -.15, 0, -.18, -Math.PI / 2), part(new THREE.CircleGeometry(.18, 5), '#c9d6ff', .15, 0, -.18, -Math.PI / 2)]),
  mothEyes: () => merge([part(Ico(.05), '#fff6a8', -.04, .03, .18), part(Ico(.05), '#fff6a8', .04, .03, .18)]),
  bench: () => merge([part(Box(1.7, .14, .9), C.wood, 0, .85), part(Box(1.5, .06, .7), '#e0a46a', 0, .95), ...[[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]].map(([x, z]) => part(Box(.12, .8, .12), C.trunk2, x, .4, z)), part(Box(.5, .08, .3), '#9aa6bf', -.3, 1.02, .05, 0, .4), part(Cyl(.03, .03, .45, 4), C.trunk, -.1, 1.0, .1, 0, 1.1, Math.PI / 2), part(Box(.3, .25, .25), '#ffd36b', .5, 1.05, -.1), part(Box(.32, .08, .27), '#ff8fb8', .5, 1.2, -.1)]),
  chest: () => merge([part(Box(1.1, .6, .7), C.wood, 0, .3), part(Box(1.14, .28, .74), '#e0a46a', 0, .72), part(Box(1.16, .08, .76), '#ffd36b', 0, .58), part(Box(.16, .24, .06), '#ffd36b', 0, .55, .38), part(Box(.06, .7, .74), '#ffd36b', -.4, .45), part(Box(.06, .7, .74), '#ffd36b', .4, .45)]),
  bed: () => merge([part(Box(1.3, .12, .8), '#ffb3c7', 0, .06), part(Box(1.36, .06, .86), '#ff8fb8', 0, .02), part(Box(.4, .12, .6), '#fff2f6', -.4, .16)]),
  lamp: () => merge([part(Cyl(.06, .08, 2.2, 5), C.trunk2, 0, 1.1), part(Box(.6, .08, .08), C.trunk2, .2, 2.15), part(Box(.36, .44, .36), '#ffd36b', .42, 1.85), part(Box(.26, .32, .26), '#fff6c9', .42, 1.85), part(Cone(.26, .18, 4), '#c9824a', .42, 2.17, 0, 0, Math.PI / 4)]),
};const matVC = new THREE.MeshLambertMaterial({ vertexColors: true });
// ветер по кронам: дешёвый сдвиг вершин в шейдере (без новой геометрии), сила — uWind
const WIND = { uTime: { value: 0 }, uWind: { value: .25 } };
const matTree = new THREE.MeshLambertMaterial({ vertexColors: true });
matTree.onBeforeCompile = sh => { Object.assign(sh.uniforms, WIND); sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  float hh = max(transformed.y - .9, 0.); vec3 ip = vec3(0.);
  #ifdef USE_INSTANCING
  ip = instanceMatrix[3].xyz;
  #endif
  float ph = uTime * 1.9 + ip.x * .37 + ip.z * .23; transformed.x += hh * hh * .05 * uWind * (sin(ph) + .6); transformed.z += hh * hh * .03 * uWind * cos(ph * 1.3);`); };
matTree.customProgramCacheKey = () => 'tree-wind';
const matFor = k => /^(pine|oak)/.test(k) ? matTree : matVC;
const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
const _q2 = new THREE.Quaternion();

// ---------- земля (48×48 игровое поле + декоративная опушка) ----------
{
  const SZ = 110, seg = 44; const g = new THREE.PlaneGeometry(SZ, SZ, seg, seg).toNonIndexed(); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3);
  const cA = new THREE.Color('#8fd66a'), cB = new THREE.Color('#79c95c'), cC = new THREE.Color('#a6e07a'), cD = new THREE.Color('#e3cf8f'), cE = new THREE.Color('#6cb956');
  for (let i = 0; i < n; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > CFG.MAP + 8) p.setY(i, Math.min(5, (r - CFG.MAP - 8) * .3) * (1 + Math.sin(x * .3) * Math.cos(z * .27) * .5)); else if (r > 7) p.setY(i, Math.sin(x * .35) * Math.cos(z * .3) * .12); }
  for (let i = 0; i < n; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3, r = Math.hypot(x, z);
    const nn = Math.sin(x * .21) * Math.cos(z * .17) + Math.sin(x * .07 + z * .11) * .7 + (rnd() - .5) * .5;
    _c.copy(nn > .4 ? cC : nn < -.5 ? cB : cA); if (r < 6.5) _c.lerp(cD, sstep(6.5, 3.5, r) * .85); if (r > CFG.MAP + 2) _c.lerp(cE, .5);
    for (let j = 0; j < 3; j++) { col[(i + j) * 3] = _c.r; col[(i + j) * 3 + 1] = _c.g; col[(i + j) * 3 + 2] = _c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, matVC));
}
// ручей-лента (декор)
{ const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = -30 + t * 60, z = 15 + Math.sin(t * 6) * 3; pts.push(new THREE.Vector3(x, .03, z)); }
  const L = [], w = .9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz), nx = -dz / l * w, nz = dx / l * w; L.push(a.x + nx, .03, a.z + nz, a.x - nx, .03, a.z - nz, b.x + nx, .03, b.z + nz, a.x - nx, .03, a.z - nz, b.x - nx, .03, b.z - nz, b.x + nx, .03, b.z + nz); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x8fd8ff })); m.position.y = .02; scene.add(m); }

// ---------- инстансы ----------
GEO.pineFar = GEO.pine; GEO.oakFar = GEO.oak; GEO.basket = () => merge([part(Cyl(.2, .16, .26, 7), C.wood, 0, .13), part(Cyl(.21, .21, .04, 7), C.trunk2, 0, .27)]);
function IM(key, count, mat = matFor(key)) { const im = new THREE.InstancedMesh(GEO[key](), mat, Math.max(1, count)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.userData.key = key; im.frustumCulled = false; scene.add(im); for (let i = 0; i < im.count; i++) hideI(im, i); return im; }
function setI(im, i, x, y, z, ry, s, sy = s, rx = 0, rz = 0) { im.setMatrixAt(i, _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(s, sy, s))); im.instanceMatrix.needsUpdate = true; }
const hideI = (im, i) => setI(im, i, 0, -50, 0, 0, .0001);
// декор опушки (клиентский, не влияет на логику)
{ const border = []; for (let i = 0; i < 64; i++) { const a = rnd() * 6.283, r = R(CFG.MAP + 1.2, CFG.MAP + 12); border.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: R(1, 1.5), ry: R(0, 6), pine: rnd() < .65 }); }
  const bp = border.filter(b => b.pine), bo = border.filter(b => !b.pine); const ip = IM('pineFar', bp.length), io = IM('oakFar', bo.length);  // дальнее кольцо — дешёвые заглушки (экономия треугольников)
  bp.forEach((b, i) => setI(ip, i, b.x, 0, b.z, b.ry, b.s)); bo.forEach((b, i) => setI(io, i, b.x, 0, b.z, b.ry, b.s));
  const nG = 360, nF = 80, ig = IM('grass', nG, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })), iff = IM('flower', nF);
  for (let i = 0; i < nG; i++) { const a = rnd() * 6.283, r = Math.sqrt(R(20, (CFG.MAP + 6) ** 2)); setI(ig, i, Math.cos(a) * r, 0, Math.sin(a) * r, R(0, 6), R(.8, 1.4)); }
  for (let i = 0; i < nF; i++) { const a = rnd() * 6.283, r = Math.sqrt(R(40, CFG.MAP ** 2)); setI(iff, i, Math.cos(a) * r, 0, Math.sin(a) * r, R(0, 6), R(.8, 1.3)); } }

// узлы мира из состояния: id → {im, i}
const NV = { map: new Map(), ims: {}, sig: new Map() }; const SHAKE = new Map();
// вспышка узла при ударе/сборе (v0.7): instanceColor > 1 подсвечивает инстанс на ~0,18 с, без новых draw calls
const FLASH = new Map(), FLASH_KINDS = ['pine', 'oak', 'bush', 'lstump', 'rock'];
function updFlash(dt) { if (!FLASH.size && !FLASH.dirty) return; FLASH.dirty = false;
  for (const [id, t0] of FLASH) { const t = t0 - dt; const n = S && S.nodes.find(q => q.id === id), v = NV.map.get(id); const k = t > 0 ? 1 + 1.6 * (t / .18) : 1;
    if (n && v) for (const kk of FLASH_KINDS) { const i = v[kk]; if (i == null) continue; const im = NV.ims[kk]; if (!im || !im.instanceColor) continue; im.setColorAt(i, _c.setRGB(k, k, k * .92)); im.instanceColor.needsUpdate = true; }
    if (t <= 0) FLASH.delete(id); else FLASH.set(id, t); } }
function buildNodeViews(s) {
  const kinds = { pine: [], oak: [], stump: [], rock: [], bush: [], berries: [], branch: [], stone: [], lstump: [], scraps: [] };
  for (const n of s.nodes) { if (n.k === 'tree') { kinds[n.sub ? 'oak' : 'pine'].push(n); kinds.stump.push(n); } else if (n.k === 'bush') { kinds.bush.push(n); kinds.berries.push(n); } else if (n.k === 'stump') { kinds.lstump.push(n); kinds.scraps.push(n); } else kinds[n.k].push(n); }
  for (const k in kinds) { const im = NV.ims[k] = IM(k, kinds[k].length); if (FLASH_KINDS.includes(k)) { im.setColorAt(0, _c.set(1, 1, 1)); im.instanceColor.array.fill(1); } kinds[k].forEach(n => { const v = NV.map.get(n.id) || {}; v[k] = null; NV.map.set(n.id, v); }); }
  NV.sig = new Map(); syncNodes(s, true);
}
// v0.7: инстансы узлов «упакованы» — видимые идут подряд, im.count = число видимых. Раньше спрятанные инстансы (пни под живыми
// деревьями, собранные ветки) всё равно рисовались масштабом 0: ~15k лишних треугольников. Пустой тип не даёт draw call.
// Индекс узла в инстансе (NV.map: id → {kind: i}) меняется при пересборке, поэтому окклюзия и вспышки берут его заново.
const nodeSig = n => n.k === 'tree' ? (n.alive ? 1 : 0) : n.k === 'bush' ? (n.berry ? 1 : 0) : n.k === 'stump' ? (n.loot ? 1 : 0) : (n.alive ? 1 : 0);
function syncNodes(s, force) {
  let dirty = !!force; for (const n of s.nodes) { const sig = nodeSig(n); if (NV.sig.get(n.id) !== sig) { NV.sig.set(n.id, sig); dirty = true; } }
  if (!dirty && !SHAKE.size) return;
  const cnt = {}; for (const k in NV.ims) cnt[k] = 0;
  const put = (k, n, sc, rx = 0, rz = 0) => { const im = NV.ims[k]; const i = cnt[k]++; setI(im, i, n.x, 0, n.z, n.ry, sc, sc, rx, rz); NV.map.get(n.id)[k] = i; };
  for (const n of s.nodes) { const v = NV.map.get(n.id); for (const k in v) v[k] = null;
    if (n.k === 'tree') { const sc = n.s * .85; const sh = SHAKE.get(n.id) || 0, w = sh > 0 ? Math.sin(sh * 40) * sh * .5 : 0; if (n.alive) put(n.sub ? 'oak' : 'pine', n, sc, w, w * .6); else put('stump', n, sc); }
    else if (n.k === 'bush') { put('bush', n, n.s); if (n.berry) put('berries', n, n.s); }
    else if (n.k === 'stump') { put('lstump', n, 1); if (n.loot) put('scraps', n, 1); }
    else if (n.k === 'rock') put('rock', n, n.s);
    else if (n.alive) put(n.k, n, 1); }
  for (const k in NV.ims) { const im = NV.ims[k]; im.count = cnt[k]; im.visible = cnt[k] > 0; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) { im.instanceColor.array.fill(1); im.instanceColor.needsUpdate = true; } }
  FLASH.dirty = true;
}
// лагерь
const camp = new THREE.Group(); scene.add(camp);
const addMesh = (key, x, z, ry = 0) => { const m = new THREE.Mesh(GEO[key](), matVC); m.userData.key = key; m.position.set(x, 0, z); m.rotation.y = ry; camp.add(m); return m; };
addMesh('bench', CFG.BENCH.x, CFG.BENCH.z, -.5); addMesh('chest', CFG.CHEST.x, CFG.CHEST.z, .5); addMesh('bed', CFG.BED.x, CFG.BED.z + .2, 0);
const lampMesh = addMesh('lamp', CFG.LAMP.x, CFG.LAMP.z); lampMesh.visible = false;
const imFence = IM('fence', CFG.FENCE_MAX), imTrap = IM('trap', CFG.TRAP_MAX);
function syncBuilds(s) { let f = 0, t = 0; lampMesh.visible = false; for (const b of s.builds) { if (b.k === 'fence') setI(imFence, f++, b.x, 0, b.z, b.ry, 1); else if (b.k === 'trap') setI(imTrap, t++, b.x, 0, b.z, 0, b.cd > 0 ? .7 : 1); else if (b.k === 'lamp') lampMesh.visible = true; } imFence.count = f; imTrap.count = t; imFence.visible = f > 0; imTrap.visible = t > 0; if (f) imFence.instanceMatrix.needsUpdate = true; if (t) imTrap.instanceMatrix.needsUpdate = true; }   // v0.7: пустые — без draw call

// ---------- костёр (вид) ----------
const fireG = new THREE.Group(); scene.add(fireG);
const fireLogs = new THREE.Mesh(GEO.campfire(), matVC); fireLogs.userData.key = 'campfire';
fireG.add(fireLogs);
const ringGeo = lv => { const L = [], n = lv === 2 ? 10 : 13, rr = lv === 2 ? 1.0 : 1.25; for (let i = 0; i < n; i++) { const a = i / n * 6.283; L.push(part(Dod(lv === 2 ? .24 : .3), i % 2 ? C.rock : C.rock2, Math.cos(a) * rr, .16, Math.sin(a) * rr, a, a)); } if (lv === 3) L.push(part(Cyl(1.5, 1.6, .18, 12), '#cfd5e3', 0, .05)); return merge(L); };
const RG = {}; GEO.campfire_addon_2 = () => RG[2] || (RG[2] = ringGeo(2)); GEO.campfire_addon_3 = () => RG[3] || (RG[3] = ringGeo(3));   // насадки костра (ур. 2 / ур. 3 вместо 2)
const fireRing = new THREE.Mesh(GEO.campfire_addon_2(), matVC); fireRing.visible = false; fireG.add(fireRing); let shownLv = 1;
// пламя, искры и дым — из пака эффектов (/fx/vfx.js). Камни/поленья/круг света рисуем свои (запечённые, 1 draw call),
// поэтому у костра из пака прячем его меши-основания, кольцо и свечение, а PointLight снимаем (свет костра — один, наш).
const vfx = new GameVFX({ quality: QUALITY });
// v0.7 (пак 0.6): диск и кольцо пака не создаются (base/ring: false). Отдельных опций для камней/поленьев пака пока нет —
// их (Lambert-меши) прячем один раз и после смены уровня (setLevel может включить каменное основание ур. 3).
const fireFx = vfx.createCampfire(scene, { level: 1, position: [0, 0, 0], base: false, ring: false });
fireFx.group.remove(fireFx.light); vfx.setCamera(camera);
const packHide = []; fireFx.group.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial) packHide.push(o); });
const hidePackBase = () => { for (const o of packHide) o.visible = false; };
hidePackBase();
const fogFx = vfx.createNightFog(scene, { radius: 11 });   // на 'high' — низкие простыни тумана ночью; цвет/дальность ниже подстраиваем под палитру
// погода из пака: дождь, листья на ветру, мотыльки (vfx.setWeather по данным симуляции). Пак рисует лужи только на 'high',
// поэтому на телефоне добавляем 6 простых луж-инстансов (один draw call). Ветер по кронам — наш шейдер matTree.
const PUD = 6, imPud = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fb8d8, transparent: true, opacity: .4, depthWrite: false }), PUD);
imPud.frustumCulled = false; imPud.visible = false; scene.add(imPud); const puddles = Array.from({ length: PUD }, (_, i) => { const a = i / PUD * 6.283 + rnd(), r = 3.6 + rnd() * 8; return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: .45 + rnd() * .5 }; });
let wetness = 0, vfxWxSig = '';
const fogName = f => f >= .9 ? 'dense' : f > 0 ? 'soft' : 'off';
function updWeather(dt) {
  const wx = S && mode !== 'menu' ? S.wx : {}, raining = !!wx.rain, windy = !!wx.wind;
  const sig = [raining, windy, wx.fog, !!wx.moths].join(); if (sig !== vfxWxSig) { vfxWxSig = sig; vfx.setWeather({ rain: raining, wind: windy, fog: fogName(wx.fog || 0), moths: !!wx.moths }); }
  wetness = clamp(wetness + (raining ? dt / 12 : -dt / 20), 0, 1);
  imPud.visible = QUALITY === 'low' && wetness > .01; if (imPud.visible) puddles.forEach((q, i) => setI(imPud, i, q.x, .045, q.z, 0, q.s * wetness));
  WIND.uWind.value += ((windy ? 1.6 : .25) - WIND.uWind.value) * Math.min(1, dt); WIND.uTime.value += dt;
}
function radialTex(stops, size = 64) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const h = size / 2, gr = x.createRadialGradient(h, h, 0, h, h, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,200,90,.9)'], [.4, 'rgba(255,150,60,.35)'], [1, 'rgba(255,120,40,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
glow.position.y = 1; fireG.add(glow);
// (v0.5.2) убран открытый цилиндр-«столб дыма» с жёсткими краями — ночью читался как белый прямоугольный столб света.
// Дым над костром теперь только частицы пака (мягкие радиальные точки).
const safeDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,190,90,0)'], [.7, 'rgba(255,190,90,.14)'], [.97, 'rgba(255,200,100,.42)'], [1, 'rgba(255,200,100,0)']]), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
safeDisc.position.y = .05; scene.add(safeDisc);
const safeRing = new THREE.Mesh(new THREE.RingGeometry(.975, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: .6, depthWrite: false, fog: false }));
safeRing.position.y = .06; scene.add(safeRing);
// туман границы открытой зоны
const wallTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,.9)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 64); const t = new THREE.CanvasTexture(c); return t; })();
const fogWall = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 48, 1, true), new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, color: 0xffffff }));
fogWall.position.y = 2.5; scene.add(fogWall);

// ---------- тени-кружки, частицы, маркер цели, звёзды ----------
const blobMat = new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(30,50,40,.45)'], [1, 'rgba(30,50,40,0)']]), transparent: true, depthWrite: false });
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
// v0.7: тени-кружки всех питомцев и врагов — один InstancedMesh (было по draw call на каждого). blob() отдаёт невидимый «якорь».
const BLOB_N = 48, imBlob = new THREE.InstancedMesh(blobGeo, blobMat, BLOB_N); imBlob.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imBlob.frustumCulled = false; imBlob.renderOrder = 1; imBlob.count = 0; scene.add(imBlob);
const blob = s => { const b = new THREE.Object3D(); b.userData.blobS = s; return b; };
const _bp = new THREE.Vector3();
function updBlobs() { let n = 0; const put = (v, a) => { if (!a || !a.visible || !v.g.parent || n >= BLOB_N) return; const k = a.userData.blobS * v.g.scale.x; imBlob.setMatrixAt(n++, _m.compose(_bp.set(v.g.position.x, .04, v.g.position.z), _q.identity(), _s.set(k, 1, k))); };
  for (const [, v] of PV) put(v, v.sh); for (const [, v] of EV) put(v, v.sh); imBlob.count = n; imBlob.visible = n > 0; if (n) imBlob.instanceMatrix.needsUpdate = true; }
const marker = new THREE.Mesh(new THREE.RingGeometry(.8, .95, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85, depthWrite: false })); marker.position.y = .07; marker.visible = false; scene.add(marker);
const PN = 48; const imPart = new THREE.InstancedMesh(Box(.12, .12, .12), new THREE.MeshBasicMaterial(), PN); imPart.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imPart.frustumCulled = false; scene.add(imPart);
const parts = []; for (let i = 0; i < PN; i++) { parts.push({ t: 0, p: new THREE.Vector3(), v: new THREE.Vector3() }); hideI(imPart, i); imPart.setColorAt(i, _c.set(1, 1, 1)); }
let pIdx = 0;
function burst(x, y, z, color, n = 6, spd = 3) { _c.set(color); for (let k = 0; k < n; k++) { const q = parts[pIdx]; imPart.setColorAt(pIdx, _c); q.t = .7; q.p.set(x, y, z); q.v.set(R(-1, 1) * spd, R(1.5, 3.5), R(-1, 1) * spd); pIdx = (pIdx + 1) % PN; } imPart.instanceColor.needsUpdate = true; }
function updParts(dt) { for (let i = 0; i < PN; i++) { const q = parts[i]; if (q.t <= 0) continue; q.t -= dt; q.v.y -= 9 * dt; q.p.addScaledVector(q.v, dt); if (q.p.y < .06) { q.p.y = .06; q.v.multiplyScalar(.5); } if (q.t <= 0) hideI(imPart, i); else setI(imPart, i, q.p.x, q.p.y, q.p.z, q.t * 8, Math.min(1, q.t * 2.5)); } }
const stars = new THREE.Points((() => { const g = new THREE.BufferGeometry(), a = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) { const th = rnd() * 6.283, ph = R(.12, 1.4), r = 80; a[i*3] = Math.cos(th) * Math.cos(ph) * r; a[i*3+1] = Math.sin(ph) * r; a[i*3+2] = Math.sin(th) * Math.cos(ph) * r; } g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g; })(), new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0, depthWrite: false }));
stars.frustumCulled = false; scene.add(stars);

// ---------- питомцы (вид) ----------
let gltfMod = null; const getLoader = async () => { if (!gltfMod) gltfMod = await import('../vendor/GLTFLoader.js'); return new gltfMod.GLTFLoader(); };
const petCache = {};
// Питомец ночью: френель-обводка (лунный rim) + слабая лунная подсветка + тёплый свет костра по близости (в view-space).
// Один общий набор uniform'ов на все материалы питомцев, 0 доп. draw calls, ~10 ALU во фрагменте.
const PETU = { uRim: { value: new THREE.Color(0, 0, 0) }, uFill: { value: new THREE.Color(0, 0, 0) }, uWarm: { value: new THREE.Color(0, 0, 0) }, uFireV: { value: new THREE.Vector3() }, uFireR: { value: 8 } };
function petMat(m) { m.onBeforeCompile = sh => { Object.assign(sh.uniforms, PETU);
  sh.fragmentShader = 'uniform vec3 uRim; uniform vec3 uFill; uniform vec3 uWarm; uniform vec3 uFireV; uniform float uFireR;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
    `float fr = pow(1.0 - clamp(dot(normal, geometryViewDir), 0.0, 1.0), 2.2);
     float fw = 1.0 - smoothstep(0.0, uFireR, length(-vViewPosition - uFireV));
     outgoingLight += uRim * fr + diffuseColor.rgb * (uFill + uWarm * fw * (0.55 + 0.45 * fr));
     #include <opaque_fragment>`); }; m.customProgramCacheKey = () => 'pet-night'; return m; }
const _fv = new THREE.Vector3();
function updPetLight(n, on, k) {   // n — «ночность» 0..1, on/k — костёр горит и его сила
  PETU.uRim.value.setRGB(.42, .52, .95).multiplyScalar(.06 + .38 * n); PETU.uFill.value.setRGB(.22, .26, .45).multiplyScalar(.9 * n);
  PETU.uWarm.value.setRGB(1, .62, .32).multiplyScalar(on ? .85 * n * k : 0); PETU.uFireR.value = Math.max(3, lightRv * 1.15);
  PETU.uFireV.value.copy(_fv.set(0, 1, 0).applyMatrix4(camera.matrixWorldInverse)); }
// v0.7: питомец склеивается в 3 меша (тело+голова+хвост+крылья / левая лапа / правая лапа) с цветами вершин из baseColor,
// нормали сохраняются. Было 14–23 draw calls на питомца (по примитиву на материал), стало 3 — в коопе на четверых экономия ~60.
const matPet = petMat(new THREE.MeshLambertMaterial({ vertexColors: true }));
function bakePetMeshes(meshes, inv) { let n = 0; const parts = [];
  for (const o of meshes) { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(_m.multiplyMatrices(inv, o.matrixWorld)); if (!g.attributes.normal) g.computeVertexNormals(); parts.push([g, o.material.color || _c.set(1, 1, 1)]); n += g.attributes.position.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let off = 0;
  for (const [g, c] of parts) { const cnt = g.attributes.position.count; pos.set(g.attributes.position.array.subarray(0, cnt * 3), off * 3); nor.set(g.attributes.normal.array.subarray(0, cnt * 3), off * 3); for (let i = 0; i < cnt; i++) { col[(off + i) * 3] = c.r; col[(off + i) * 3 + 1] = c.g; col[(off + i) * 3 + 2] = c.b; } off += cnt; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere(); return new THREE.Mesh(g, matPet); }
function mergePet(root) {
  root.updateMatrixWorld(true); const arms = [], rest = []; const isArm = o => { for (let q = o; q && q !== root; q = q.parent) if (/Arm_[LR]/.test(q.name)) return q; return null; };
  root.traverse(o => { if (!o.isMesh) return; const a = isArm(o); if (a) { let e = arms.find(x => x.node === a); if (!e) arms.push(e = { node: a, meshes: [] }); e.meshes.push(o); } else rest.push(o); });
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert(); const out = [];
  if (rest.length) out.push(bakePetMeshes(rest, rootInv));
  for (const { node, meshes } of arms) { const g = new THREE.Group(); g.name = node.name; node.updateMatrixWorld(true); _m.multiplyMatrices(rootInv, node.matrixWorld).decompose(g.position, g.quaternion, g.scale);
    g.add(bakePetMeshes(meshes, new THREE.Matrix4().copy(node.matrixWorld).invert())); out.push(g); }
  root.clear(); for (const o of out) root.add(o); }
function loadPet(pet) {
  if (petCache[pet]) return petCache[pet]; const a = PET_MODELS[pet];
  return petCache[pet] = (async () => { const gltf = await (await getLoader()).loadAsync(a.url); const root = gltf.scene;
    mergePet(root);
    root.scale.setScalar(a.scale || 1); const box = new THREE.Box3().setFromObject(root); root.position.y = -box.min.y; return root; })();
}
function placeholderPet() { return new THREE.Mesh(merge([part(Box(.6, .55, .5), '#9aa3b5', 0, .45), part(Box(.6, .5, .55), '#9aa3b5', 0, 1.0), part(Box(.5, .12, .05), '#3d4458', 0, 1.02, .28), part(Cone(.1, .2, 4), '#6f7890', -.2, 1.33, 0), part(Cone(.1, .2, 4), '#6f7890', .2, 1.33, 0)]), matVC); }
const PV = new Map();   // id игрока → вид
function playerView(p) {
  let v = PV.get(p.id); if (v) return v;
  v = { g: new THREE.Group(), body: new THREE.Group(), arms: [], walk: 0, pet: p.pet, zzz: null };
  v.g.add(v.body); v.g.add(v.sh = blob(1.3)); v.body.add(placeholderPet()); scene.add(v.g);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7.5, 16, 1, true).translate(0, -3.75, 0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  beam.position.set(0, .9, .3); beam.visible = false; v.g.add(beam); v.beam = beam;
  const zz = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); x.font = '900 34px Nunito, sans-serif'; x.fillStyle = '#fff'; x.strokeStyle = '#7d8cff'; x.lineWidth = 6; x.strokeText('z z', 6, 44); x.fillText('z z', 6, 44); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, fog: false }));
  zz.scale.set(1, 1, 1); zz.position.y = 2; zz.visible = false; v.g.add(zz); v.zzz = zz;
  loadPet(p.pet).then(root => { const m = root.clone(true); v.body.clear(); v.body.add(m); v.arms = []; m.traverse(o => { if (/Arm_[LR]/.test(o.name)) { o.userData.q0 = o.quaternion.clone(); o.userData.side = /_L/.test(o.name) ? 1 : -1; v.arms.push(o); } }); }).catch(e => console.warn('pet', e.message));
  PV.set(p.id, v); return v;
}
const id_is_me = p => p.id === PID;
function syncPlayers(s, dt) { FB.squash = Math.max(0, FB.squash - dt * 1.4);
  for (const [id, v] of PV) if (!s.players[id]) { scene.remove(v.g); PV.delete(id); }
  for (const p of Object.values(s.players)) { const v = playerView(p); v.g.position.set(p.x, 0, p.z); v.g.rotation.y = p.face;
    const sp = Math.hypot(p.vx, p.vz), asleep = p.sleep > 0 || p.rest > 0; v.walk += dt * sp * 2.4;
    v.body.position.y = sp > .3 ? Math.abs(Math.sin(v.walk)) * .08 : 0; v.body.rotation.z = asleep ? 1.35 : sp > .3 ? Math.sin(v.walk) * .06 : 0; v.body.rotation.x = Math.sin(p.swing * Math.PI) * .3;
    v.body.position.x = asleep ? .5 : 0; v.zzT = Math.max(0, (v.zzT || 0) - dt); v.zzz.visible = asleep && v.zzT <= 0; if (id_is_me(p)) { const q = FB.squash; v.body.scale.set(1 + q * .35, 1 - q * .3, 1 + q * .35); } if (asleep) v.zzz.position.y = 1.6 + Math.sin(performance.now() * .003) * .15;
    for (const a of v.arms) { const sw = sp > .3 ? Math.sin(v.walk) * .6 * a.userData.side : 0, hit = p.swing > 0 && a.userData.side < 0 ? -Math.sin(p.swing * Math.PI) * 1.8 : 0; a.quaternion.copy(a.userData.q0).multiply(_q2.setFromEuler(_e.set(sw + hit, 0, 0))); }
    if ((p.has.basket || p.has.basket2) && !v.basket) { v.basket = new THREE.Mesh(GEO.basket(), matVC); v.basket.userData.key = 'basket'; v.basket.position.set(0, .55, -.42); v.basket.scale.setScalar(.8); v.g.add(v.basket); }
    v.beam.visible = p.flash.on; if (p.flash.on) v.beam.material.opacity = .14 + Math.sin(performance.now() * .02) * .02; }
}
// ---------- враги (вид) ----------
const EG = {}; for (const k of ['mist', 'crow', 'moose', 'moth']) EG[k] = [GEO[k](), GEO[k + 'Eyes']()];
const matMoth = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, transparent: true, opacity: .92 });
const EV = new Map();
// существа художника: граф сцены + AnimationMixer; меши под каждым узлом-костью склеены (lit + glow) → мало draw calls
const CR = {};
function prepCreature(gltf, a) {
  const root = gltf.scene; root.updateMatrixWorld(true); const hosts = new Map();
  root.traverse(o => { if (o.isMesh) { const h = o.parent; if (!hosts.has(h)) hosts.set(h, []); hosts.get(h).push(o); } });
  for (const [h, ms] of hosts) { const tmp = new THREE.Group(); const inv = new THREE.Matrix4().copy(h.matrixWorld).invert();
    for (const o of ms) { const c = new THREE.Mesh(o.geometry, o.material); c.name = o.name; c.matrixAutoUpdate = false; c.matrix.multiplyMatrices(inv, o.matrixWorld); tmp.add(c); h.remove(o); }
    tmp.updateMatrixWorld(true); const { lit, glow } = bakeParts(tmp, a); if (lit) h.add(new THREE.Mesh(lit, matVC)); if (glow) h.add(new THREE.Mesh(glow, matGlow)); }
  root.scale.setScalar(a.scale || 1); root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(root); root.position.y = -box.min.y;
  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return { root, clips: gltf.animations };
}
function bakeParts(group, a) { const r = bakeObject(group, { glowMin: a.glowMin, scale: 1, noGround: true }); return { lit: r.geo, glow: r.glow }; }
const CLIP = { mist: e => e.st === 'go' || e.st === 'flee' || e.leave ? 'walk' : 'idle', crow: e => e.st === 'peck' ? 'peck' : e.y > .25 ? 'fly' : 'idle', moose: e => e.st === 'watch' || e.st === 'blow' ? 'idle' : 'walk', moth: e => e.st === 'land' ? 'idle' : 'fly' };
function enemyView(e) {
  let v = EV.get(e.id); if (v) return v; v = { g: new THREE.Group(), body: new THREE.Group(), t: Math.random() * 6 };
  const cr = CR[e.k];
  if (cr) { const m = cr.root.clone(true); v.body.add(m); v.glb = true; v.mixer = new THREE.AnimationMixer(m); v.acts = {}; for (const c of cr.clips) v.acts[c.name] = v.mixer.clipAction(c); v.clip = ''; }
  else { const m = new THREE.Mesh(EG[e.k][0], e.k === 'moth' ? matMoth : matVC), eyes = new THREE.Mesh(EG[e.k][1], matGlow); eyes.visible = !!EG[e.k][1].attributes.position; v.body.add(m, eyes); } v.g.add(v.body); v.g.add(v.sh = blob(e.k === 'moose' ? 1.5 : e.k === 'mist' ? 1.2 : e.k === 'moth' ? .4 : .8));
  scene.add(v.g); EV.set(e.id, v); return v;
}
function syncEnemies(s, dt) {
  const alive = new Set(s.enemies.map(e => e.id)); for (const [id, v] of EV) if (!alive.has(id)) { scene.remove(v.g); EV.delete(id); }
  for (const e of s.enemies) { const v = enemyView(e); v.t += dt; v.g.position.set(e.x, 0, e.z); v.g.rotation.y = e.ry; const sc = e.dead ? Math.max(.01, 2 - e.dead) : 1; v.g.scale.setScalar(sc);
    if (v.glb) { const want = CLIP[e.k](e), act = v.acts[want] || v.acts.idle; if (want !== v.clip && act) { const prev = v.acts[v.clip]; act.reset().play(); if (prev) act.crossFadeFrom(prev, .25, false); v.clip = want; } v.mixer.update(dt);
      if (e.k === 'crow' || e.k === 'moth') { v.body.position.y = e.y; v.sh.visible = e.k === 'crow' && e.y < 3; } if (e.k === 'mist' && e.st === 'blow') v.body.scale.set(1 + Math.sin(v.t * 12) * .08, 1, 1); else v.body.scale.set(1, 1, 1); continue; }
    if (e.k === 'mist') { v.body.position.y = Math.abs(Math.sin(v.t * 6)) * .15; v.body.rotation.x = v.t * 3; if (e.st === 'blow') v.body.scale.set(1 + Math.sin(v.t * 12) * .08, 1, 1); }
    else if (e.k === 'crow') { v.body.position.y = e.y; v.sh.visible = e.y < 3; v.body.rotation.z = e.st === 'peck' ? 0 : Math.sin(v.t * 14) * .25; v.body.rotation.x = e.st === 'peck' ? Math.sin(v.t * 10) * .3 : 0; }
    else if (e.k === 'moth') { v.body.position.y = e.y; v.body.scale.x = .35 + Math.abs(Math.sin(v.t * (e.st === 'land' ? 9 : 22))) * .75; v.body.rotation.x = e.st === 'land' ? .5 : .15; v.sh.visible = false; }
    else if (e.k === 'moose') { v.body.position.y = Math.abs(Math.sin(v.t * 3)) * .05; v.body.rotation.x = e.st === 'flee' ? -.15 : e.st === 'blow' ? .12 : 0; } }
}

// ---------- игра: состояние и связь с симуляцией ----------
let S = null;                 // состояние мира (из sim.js)
let mode = 'menu';            // menu | play | pause | over
let pet = Q.get('pet') || localStorage.getItem(PET_KEY) || 'raccoon'; if (!PETS[pet]) pet = 'raccoon';   // GDD: питомец только из профиля Тапышей (в прототипе — ?pet= или профиль-заглушка 99n_v1_pet); выбора в меню нет
const cmdQ = [];              // очередь команд → step()
const send = c => COOP && COOP.active() ? COOP.send(c) : cmdQ.push({ pid: PID, ...c });
const ico = (el, k) => { if (el) el.innerHTML = IC[k]; };
function initWorld(state) { S = state; OCC.set.clear(); for (const k in OCC.ghosts) { OCC.ghosts[k].count = 0; OCC.ghosts[k].visible = false; } S.timeScale = FAST; for (const im of Object.values(NV.ims)) scene.remove(im); NV.map.clear(); NV.ims = {}; buildNodeViews(S); syncBuilds(S); for (const [id, v] of PV) { scene.remove(v.g); } PV.clear(); for (const [, v] of EV) scene.remove(v.g); EV.clear(); audioSig = ''; }

// ---------- звук: разблокировка из первого жеста, mute, настроение/погода из состояния ----------
const sfx = new GameSfx({ masterVolume: .3, quality: QUALITY }); sfx.muted = localStorage.getItem(MUTE_KEY) === '1';
const unlockAudio = () => { if (!sfx.ready || sfx._ctx.state !== 'running') sfx.init().then(ok => { if (ok) syncAudio(true); }).catch(() => {}); };
addEventListener('pointerdown', unlockAudio, true); addEventListener('keydown', unlockAudio, true);
function setMute(m) { sfx.setMuted(m); try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {} document.querySelectorAll('.mute').forEach(b => { ico(b, m ? 'mute' : 'snd'); b.setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук'); }); }
let audioSig = '';
function syncAudio(force) {
  const inGame = S && mode !== 'menu', night = !!(inGame && S.phase === 'night'), wx = inGame ? S.wx : {};
  const mood = !inGame ? 'menu' : night ? (wx.special || wx.fog > .5 ? 'fog' : 'night') : 'day';
  const sig = [mood, night, wx.rain, wx.wind, wx.fog, inGame ? S.fire.lv : 1, inGame ? S.fire.fuel > 0 : 1].join();
  if (sig === audioSig && !force) return; audioSig = sig;
  if (sfx.night !== night) sfx.setNight(night); sfx.setWeather({ rain: !!wx.rain, wind: !!wx.wind, fog: fogName(wx.fog || 0), moths: !!wx.moths }); sfx.setFireLevel(inGame ? S.fire.lv : 1); sfx.setLit(inGame ? S.fire.fuel > 0 : true);
}

// ---------- аккаунт (в MVP — на сервере; в прототипе — localStorage): открытые этапы, монеты, первый заход дня ----------
const ACC0 = { open: 1, passed: [], coins: 0, lastDay: '', started: false };
function account() { try { return { ...ACC0, ...JSON.parse(localStorage.getItem(ACC_KEY) || '{}') }; } catch (e) { return { ...ACC0 }; } }
function saveAcc(a) { try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch (e) {} }
const today = () => new Date().toISOString().slice(0, 10);
const stageName = id => { const st = STAGES[id - 1]; return st.from + '–' + st.to; };
// состояние ячейки: soon (13–99 и финал) | passed | open | locked; + флаг соло-сейва
function cellState(id, a = account(), sv = loadSave()) { const save = !!(sv && sv.stage === id); if (id > CFG.MVP_STAGES) return { st: 'soon', save }; if (a.passed.includes(id)) return { st: 'passed', save }; if (QA_UNLOCK) return { st: 'open', save }; return { st: id <= a.open ? 'open' : 'locked', save }; }
let qaRun = false;   // ?debug=1&night=N — забег без сейва
function save() { if (!S || S.mode !== 'solo' || qaRun) return; try { localStorage.setItem(SAVE_KEY, SIM.serialize(S)); } catch (e) {} }
function loadSave() { try { const t = localStorage.getItem(SAVE_KEY); if (!t) return null; const s = SIM.deserialize(t); return s.v === 3 ? s : null; } catch (e) { return null; } }
function startStage(stage) {
  const a = account(), firstEver = !a.started, seed = +Q.get('seed') || (1 + Math.floor(Math.random() * 99990));
  const s = SIM.createState({ seed, timeScale: FAST, mode: 'solo', nPlayers: 1 }); SIM.addPlayer(s, PID, pet); SIM.beginStage(s, stage, { firstEver });
  a.started = true; saveAcc(a); qaRun = false; TUT.stop(false); initWorld(s); save(); startPlay();
  let tut = false; try { tut = stage === 1 && !localStorage.getItem(TUT_KEY); } catch (_) {}
  if (tut) TUT.start(S.fire.fuel > 0);
  else hint(firstEver ? 'Разожги костёр: подойди к нему и нажми «Разжечь»' : stage === 2 ? 'Этап 7–12: костёр 3-го уровня, в сундуке набор главы' : 'Собирай ветки и ягоды, корми костёр', 4);
}
// QA: сразу в ночь N (1–12) нужного этапа со стартовым набором этого этапа; сейв не пишется и не трогается
function startQaNight(n) {
  const stage = SIM.stageOf(n), seed = +Q.get('seed') || 7; const s = SIM.createState({ seed, timeScale: FAST, mode: 'solo', nPlayers: 1 }); SIM.addPlayer(s, PID, pet); SIM.beginStage(s, stage, {});
  s.night = n; s.t = SIM.dayLen(s) - 2; qaRun = true; TUT.stop(false); initWorld(s); startPlay(); toast('QA · ночь ' + n, 'Этап ' + stageName(stage) + ' · без сохранения');
}
function continueGame() { qaRun = false; TUT.stop(false); const s = loadSave(); if (!s) return showMap(); const p = s.players[PID]; p.x = 0; p.z = 4.2; p.vx = p.vz = 0; p.sleep = p.rest = 0; p.str = Math.max(p.str, 50); p.in = { x: 0, z: 0 }; p.flash.on = false; s.enemies = []; s.result = null; initWorld(s); startPlay(); toast('Этап ' + stageName(S.stage) + ' · ночь ' + SIM.stageNight(S), 'Продолжаем с утра'); }
const me = () => S.players[PID];

// ---------- HUD ----------
ico($('icHp'), 'bolt'); ico($('icHu'), 'food'); ico($('icFu'), 'fire'); ico($('pause'), 'pause');
ico($('bCraft').querySelector('.ico'), 'bench'); ico($('bTorch').querySelector('.ico'), 'flash'); ico($('bEat').querySelector('.ico'), 'berry'); ico($('bAct').querySelector('.ico'), 'hand');
const INV = [['stick', 'Ветки'], ['stone', 'Камешки'], ['berry', 'Ягоды'], ['cloth', 'Лоскутки']];
$('inv').innerHTML = INV.map(([k, n]) => `<div class="chip card" id="iv_${k}" title="${n}">${IC[k]}<b>0</b></div>`).join('') + `<div class="chip card bag" id="iv_bag">${IC.bag}<b>0/8</b></div>`;
const lastInv = {};
function bump(k) { const el = $('iv_' + k); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let lastPhaseIco = '';
function updHUD() {
  const p = me(), night = S.phase === 'night', len = night ? SIM.nightLen(S) : SIM.dayLen(S);
  $('nTxt').textContent = 'Ночь ' + SIM.stageNight(S); $('nOf').textContent = '/ ' + SIM.stageLen(S) + ' · ' + S.night + ' из ' + CFG.META;
  const wx = S.wx, wsig = [wx.rain, wx.fog, wx.wind, wx.moths, wx.special].join(); if (wsig !== updHUD.wsig) { updHUD.wsig = wsig; const ks = [wx.rain && 'rain', wx.fog > 0 && 'fog', wx.wind && 'wind', wx.moths && 'moth'].filter(Boolean); $('wx').innerHTML = ks.map(k => IC[k]).join('') + (wx.special ? '<b>Ночь 10</b>' : ''); $('wx').classList.toggle('hide', !ks.length); $('top').classList.toggle('special', !!wx.special); }
  const pi = night ? 'moon' : 'sun'; if (pi !== lastPhaseIco) { ico($('nIco'), pi); lastPhaseIco = pi; document.body.classList.toggle('isnight', night); }
  $('phName').textContent = night ? 'Ночь · до рассвета' : 'День · до ночи'; $('phTime').textContent = fmt((len - S.t) / S.timeScale);
  $('tbar').firstChild.style.width = (100 * S.t / len) + '%';
  $('hpb').firstChild.style.width = p.str + '%'; $('hub').firstChild.style.width = p.hunger + '%'; $('fub').firstChild.style.width = (100 * S.fire.fuel / SIM.fireMax(S)) + '%'; $('fLv').textContent = 'Костёр ' + S.fire.lv;
  $('fub').classList.toggle('low', S.fire.fuel / SIM.fireMax(S) < .2);
  for (const [k] of INV) { const v = p.inv[k] || 0; if (lastInv[k] !== v) { if (lastInv[k] !== undefined && v > lastInv[k]) bump(k); lastInv[k] = v; $('iv_' + k).querySelector('b').textContent = v; $('iv_' + k).classList.toggle('zero', !v); } }
  if (!night && !TUT.on && S.fire.fuel <= 0 && S.t < 3 && S.firstLight && hintT <= 0) hint('Костёр не горит — подойди и нажми «Разжечь»', 2);
  const used = SIM.bagSlots(p.inv), cap = SIM.bagCap(p); $('iv_bag').querySelector('b').textContent = used + '/' + cap; $('iv_bag').classList.toggle('full', used >= cap);
  const food = (p.inv.berry || 0) + (p.inv.pie || 0); $('bEat').querySelector('.n').textContent = food; $('bEat').classList.toggle('off', !food); ico($('bEat').querySelector('.ico'), p.inv.pie > 0 && p.hunger < 60 ? 'pie' : 'berry');
  const bt = $('bTorch'); bt.classList.toggle('hide', !p.has.flash); bt.querySelector('.n').textContent = Math.round(p.flash.charge) + '%'; bt.classList.toggle('down', p.flash.on);
  const sl = p.sleep > 0 || p.rest > 0; $('sleepCard').classList.toggle('hide', !sl);
  if (sl) { $('sleepT').textContent = PETS[p.pet].name + (p.rest > 0 ? ' отдыхает у костра' : ' устал и уснул'); $('sleepS').textContent = p.rest > 0 ? 'Встанет через ' + Math.ceil(p.rest / S.timeScale) + ' с' : 'Грёзы унесут к костру через ' + Math.ceil(p.sleep / S.timeScale) + ' с'; }
}
const hintLog = []; let hintT = 0; function hint(t, dur = 2.2, warn = false) { hintLog.push(t); if (hintLog.length > 40) hintLog.shift(); const el = $('hint'); el.textContent = t; el.classList.remove('hide'); el.classList.toggle('warn', warn); hintT = dur; }
function toast(t, sub) { const el = $('toast'); el.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 2600); }
const floats = []; for (let i = 0; i < 8; i++) { const el = document.createElement('div'); el.className = 'ft'; el.style.display = 'none'; $('hud').appendChild(el); floats.push({ el, t: 0, p: new THREE.Vector3() }); }
let fIdx = 0; function floatText(txt, x, y, z, bad) { const f = floats[fIdx]; fIdx = (fIdx + 1) % floats.length; f.el.innerHTML = txt; f.el.className = 'ft' + (bad ? ' bad' : ''); f.t = 1.1; f.p.set(x, y, z); f.el.style.display = ''; }
function updFloats(dt) { for (const f of floats) { if (f.t <= 0) continue; f.t -= dt; f.p.y += dt * 1.2; if (f.t <= 0) { f.el.style.display = 'none'; continue; } _v.copy(f.p).project(camera); const sc = f.t > .95 ? 1 + (f.t - .95) * 4 : 1; f.el.style.transform = `translate(${(_v.x * .5 + .5) * innerWidth}px,${(-_v.y * .5 + .5) * innerHeight}px) translate(-50%,-50%) scale(${sc.toFixed(2)})`; f.el.style.opacity = Math.min(1, f.t * 2); } }
const icoTxt = (k, n) => `+${n} <span style="display:inline-block;width:20px;height:20px;vertical-align:-4px">${IC[k]}</span>`;

// ---------- обучение первого дня (v0.7, план Геймдизайна, balance_1-12.md §6) ----------
// Только первый соло-заход этапа 1–6 (localStorage 99n_tut не задан), не блокирует игру, «Пропустить» — сразу и навсегда.
// Шаги идут по событиям симуляции; «подбрось веток, пока день» — по таймеру дня. Стрелка над целью — 1 draw call, только в обучении.
const TUT_STEPS = [
  { id: 'ignite', t: 'Подойди к костру и нажми «Разжечь». Без огня ночью будет страшно', at: () => ({ x: 0, z: 0 }) },
  { id: 'gather', t: 'Огонь горит! Днём собирай ветки и ягоды, потом неси в сундук у костра', at: () => nearestNode() },
  { id: 'more', t: 'Молодец! Набери ещё и вернись к костру', at: () => { const p = me(); return SIM.bagSlots(p.inv) >= 2 ? CFG.CHEST : nearestNode(); } },
  { id: 'craft', t: 'Теперь открой «Крафт» у верстака или подбрось веток в костёр', at: () => (me().inv.stick > 0 ? { x: 0, z: 0 } : CFG.BENCH) },
  { id: 'wait', t: '', at: () => null },
  { id: 'night', t: 'Ночь! Держись в круге света и не дай клубочкам задуть костёр. Толкни их кнопкой «Действие»', at: () => null },
  { id: 'dawn', t: 'Ночь позади. Завтра можно улучшить костёр — днём опять собирай ветки', at: () => null },
];
function nearestNode() { const p = me(); let b = null, bd = 1e9; for (const n of S.nodes) { if (!n.alive || !(n.k === 'branch' || (n.k === 'bush' && n.berry))) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; b = n; } } return b; }
const tutArrow = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 4).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd23c, fog: false, depthTest: false, transparent: true }));
tutArrow.renderOrder = 5; tutArrow.visible = false; scene.add(tutArrow);
const TUT = { on: false, i: 0, fed: false, full: false, feedHint: false, doneT: 0, log: [],
  start(firstLit) { this.on = true; this.i = firstLit ? 1 : 0; this.fed = false; this.full = false; this.feedHint = false; this.doneT = 0; this.log = []; document.body.classList.add('tut'); this.show(); },
  stop(done) { if (!this.on) return; this.on = false; tutArrow.visible = false; $('tut').classList.add('hide'); document.body.classList.remove('tut'); if (done) try { localStorage.setItem(TUT_KEY, '1'); } catch (_) {} },
  go(id) { const k = TUT_STEPS.findIndex(q => q.id === id); if (k > this.i) { this.i = k; this.show(); } },
  show(text) { const st = TUT_STEPS[this.i], t = text || st.t; this.log.push(st.id); $('tut').classList.toggle('hide', !t); if (!t) return;
    $('tutT').textContent = t; $('tutN').textContent = 'Обучение · ' + (Math.min(this.i, 5) + 1) + ' / 6'; const el = $('tut'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); },
  ev(t, e) { if (!this.on) return; const id = TUT_STEPS[this.i].id;
    if (t === 'fuel') { if (e.relit && id === 'ignite') this.go('gather'); else if (!e.relit) { this.fed = true; if (id === 'craft' || this.feedHint) { this.feedHint = false; this.go('wait'); this.show(); } } }
    else if (t === 'gain' && (e.k === 'stick' || e.k === 'berry') && id === 'gather') this.go('more');
    else if (t === 'full' && (id === 'gather' || id === 'more')) { this.go('more'); this.show('Рюкзак полон — отнеси всё в сундук у костра'); }
    else if (t === 'deposit' && (id === 'gather' || id === 'more')) this.go('craft');
    else if (t === 'craft' && id === 'craft') this.go('wait');
    else if (t === 'night') this.go('night');
    else if (t === 'dawn' && id === 'night') { this.go('dawn'); this.doneT = 7; } },
  update(dt) { if (!this.on || mode !== 'play') return; const id = TUT_STEPS[this.i].id;
    if (id === 'ignite' && S.fire.fuel > 0) this.go('gather');
    // «До ночи 20 с, костёр ещё не кормили после розжига, топливо < 40%» → «Подбрось веток в костёр, пока день»
    if (S.phase === 'day' && !this.fed && !this.feedHint && id !== 'ignite' && SIM.dayLen(S) - S.t <= 20 && S.fire.fuel / SIM.fireMax(S) < .4) { this.feedHint = true; this.show('Подбрось веток в костёр, пока день'); $('tut').classList.remove('hide'); }
    if (this.doneT > 0 && (this.doneT -= dt) <= 0) { this.stop(true); return; }
    const at = this.feedHint ? { x: 0, z: 0 } : TUT_STEPS[this.i].at(); tutArrow.visible = !!at;
    if (at) { tutArrow.position.set(at.x, (at === CFG.BENCH || at === CFG.CHEST ? 2.4 : at.x === 0 && at.z === 0 ? 2.8 : 1.9) + Math.abs(Math.sin(performance.now() * .005)) * .35, at.z); tutArrow.rotation.y += dt * 2; } } };
$('tutSkip').addEventListener('click', e => { e.stopPropagation(); TUT.stop(true); hint('Обучение пропущено', 1.5); });
// контекстные подсказки (v0.7): голод, силы во тьме, слабый костёр, скоро ночь — с паузами, не чаще одной за раз
const CH = { t: 0, cd: {} };
function ctxHints(dt) { if ((CH.t -= dt) > 0 || !S || mode !== 'play') return; CH.t = 1; if (hintT > 0) return; const p = me(), now = performance.now(), night = S.phase === 'night';
  const say = (k, txt, cd, warn) => { if ((CH.cd[k] || 0) > now) return false; CH.cd[k] = now + cd * 1000; hint(txt, 2.6, warn); return true; };
  const food = (p.inv.berry || 0) + (p.inv.pie || 0) + (Math.hypot(p.x - CFG.CHEST.x, p.z - CFG.CHEST.z) < 2.5 ? S.chest.berry : 0);
  if (p.sleep > 0 || p.rest > 0) return;
  if (p.hunger < 30 && (food ? say('eat', 'Проголодался — нажми «Съесть»', 20) : say('hungry', 'Голодно — собери ягоды с кустов или возьми из сундука', 25, true))) return;
  if (night && Math.hypot(p.x, p.z) > lightRv && p.str < 55 && say('dark', 'Силы тают во тьме — вернись в круг света', 14, true)) return;
  if (S.fire.fuel > 0 && S.fire.fuel / SIM.fireMax(S) < (night ? .25 : .15) && !TUT.on && say('fuel', night ? 'Костёр слабеет — подбрось веток!' : 'Костёр почти погас — подбрось веток', night ? 12 : 25, night)) return;
  if (!night && !TUT.on && SIM.dayLen(S) - S.t < 12 && S.t > 5 && say('dusk' + S.night, 'Скоро ночь — запаси веток у костра', 999)) return; }

// ---------- крафт-панель ----------
function renderRecipes() {
  const p = me(); const ch = S.chest;
  $('store').innerHTML = `Рюкзак ${SIM.bagSlots(p.inv)}/${SIM.bagCap(p)} · Сундук: ` + SIM.RES.map(k => `<i>${IC[k]}${ch[k] || 0}</i>`).join('') + (p.inv.pie ? ` · <i>${IC.pie}${p.inv.pie}</i>` : '');
  $('recipes').innerHTML = RECIPES.map(r => { const st = SIM.recipeState(S, p, r);
    const cost = Object.entries(SIM.costOf(S, r)).map(([k, v]) => { const h = SIM.have(S, p, k); return `<i class="${h >= v ? '' : 'no'}">${IC[k]}${h}/${v}</i>`; }).join('');
    const icon = { pie: 'pie', fire2: 'camp', fire3: 'fire', flash: 'flash', basket: 'bag', basket2: 'bag', fence: 'fence', bench2: 'bench', lamp: 'lamp', trap: 'trap' }[r.id];
    return `<div class="rc ${st.done ? 'done' : ''}"><div class="ic">${IC[icon]}</div><div class="tx"><b>${r.name}</b><em>${r.desc}</em><div class="cost">${cost}</div></div><button data-r="${r.id}" ${st.ok ? '' : 'disabled'}>${st.done ? 'Есть' : st.need || 'Создать'}</button></div>`; }).join('');
  renderRecipes.sig = recipeSig();
}
const recipeSig = () => { const p = me(); return JSON.stringify([p.inv, S.chest, S.fire.lv, S.bench.lv, p.has, S.builds.length, SIM.nearBench(S, p), SIM.nearFire(S, p)]); };
$('recipes').addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (b) send({ t: 'craft', id: b.dataset.r }); });
function openCraft(on) { const el = $('sheet'); on = on ?? !el.classList.contains('on'); if (on) renderRecipes(); el.classList.toggle('on', on); }
$('sClose').onclick = () => openCraft(false);

// ---------- отклик (v0.7): вибрация, «прыжок» питомца, иконка летит в рюкзак, вспышка костра ----------
let buzzT = 0; const buzz = ms => { if (!navigator.vibrate || sfx.muted) return; const t = performance.now(); if (t < buzzT) return; buzzT = t + 70; try { navigator.vibrate(ms); } catch (_) {} };
const FB = { squash: 0, fire: 0, n: { gain: 0, hit: 0, fly: 0, shake: 0, buzz: 0 } };
const flys = []; for (let i = 0; i < 6; i++) { const el = document.createElement('div'); el.className = 'fly'; el.style.display = 'none'; $('hud').appendChild(el); flys.push({ el, h: 0 }); }
let flyI = 0;
function flyToInv(k, x, y, z) { const tgt = $('iv_' + k); if (!tgt) return; _v.set(x, y, z).project(camera); if (_v.z > 1) return;
  const f = flys[flyI]; flyI = (flyI + 1) % flys.length; const r = tgt.getBoundingClientRect(), sx = (_v.x * .5 + .5) * innerWidth, sy = (-_v.y * .5 + .5) * innerHeight;
  const el = f.el; clearTimeout(f.h); el.innerHTML = IC[k]; el.style.transition = 'none'; el.style.display = ''; el.style.opacity = 1; el.style.transform = `translate(${sx - 14}px,${sy - 14}px) scale(1.25)`; void el.offsetWidth;
  el.style.transition = 'transform .5s cubic-bezier(.5,-0.3,.7,1), opacity .5s ease-in'; el.style.transform = `translate(${r.left + 6}px,${r.top + r.height / 2 - 14}px) scale(.7)`; el.style.opacity = .85;
  f.h = setTimeout(() => { el.style.display = 'none'; bump(k); }, 520); FB.n.fly++; }

// ---------- события симуляции → эффекты и подсказки ----------
const RN = { stick: 'ветки', stone: 'камешки', berry: 'ягоды', cloth: 'лоскутки' };
function handleEvents() {
  const evs = S.ev.splice(0); let nodesChanged = false;
  for (const e of evs) {
    const mine = !e.pid || e.pid === PID;   // в коопе чужие действия — тише/без подсказок
    if (!mine && !['spawn', 'ping', 'wake'].includes(e.t)) continue;
    switch (e.t) {
      case 'gain': { floatText(icoTxt(e.k, e.n), e.x, 1.4, e.z); { const p = me(); vfx.collect([e.x, .5, e.z], [p.x, 1.2, p.z], { item: { stick: 'sticks', stone: 'stones', berry: 'berries', cloth: 'scraps' }[e.k] }); } sfx.play('collect', { item: { stick: 'sticks', stone: 'stones', berry: 'berries', cloth: 'scraps' }[e.k] }); nodesChanged = true;
        flyToInv(e.k, e.x, .8, e.z); FB.squash = .22; buzz(12); FB.n.gain++; const nn = S.nodes.find(q => Math.abs(q.x - e.x) < .01 && Math.abs(q.z - e.z) < .01); if (nn) FLASH.set(nn.id, .18); TUT.on && TUT.ev('gain', e); break; }
      case 'hit': { const n = S.nodes.find(q => q.id === e.id); if (n) { SHAKE.set(n.id, .3); FLASH.set(n.id, .18); } vfx.hit([e.x, 1, e.z], { kind: 'tree' }); sfx.play('chop'); shake(.18); FB.squash = .16; buzz(18); FB.n.hit++; break; }
      case 'node': nodesChanged = true; break;
      case 'full': hint('Рюкзак полон — отнеси всё в сундук у костра', 2.4, true); TUT.on && TUT.ev('full', e); sfx.play('ui', { kind: 'timeout' }); break;
      case 'fuel': floatText('+' + e.n + ' огня', 0, 2.4, 0); burst(0, 1, 0, '#ffb13b', 8, 1.8); fireFx.burst(); FB.fire = 1; buzz(10); TUT.on && TUT.ev('fuel', e); if (e.relit) { sfx.play('fire', { kind: 'ignite' }); toast(S.firstLight === false && S.night === STAGES[S.stage - 1].from && S.phase === 'day' ? 'Костёр зажжён!' : 'Костёр снова горит!'); } else sfx.play('fire', { kind: 'feed' }); break;
      case 'deposit': { const t = Object.entries(e.moved).map(([k, n]) => n + ' ' + RN[k]).join(', '); hint('В сундук: ' + t, 2.2); TUT.on && TUT.ev('deposit', e); burst(CFG.CHEST.x, 1, CFG.CHEST.z, '#ffd36b', 8, 1.5); sfx.play('chest', { kind: 'in' }); break; }
      case 'craft': { const fc = Object.entries(e.fromChest || {}); toast(e.name, fc.length ? 'Взято из сундука: ' + fc.map(([k, n]) => n + ' ' + RN[k]).join(', ') : 'Готово!'); const p = me(); burst(p.x, 1, p.z, '#ffd36b', 10, 2);
        if (e.id === 'fire2' || e.id === 'fire3') { sfx.play('fire', { kind: 'upgrade' }); fireFx.burst(); FB.fire = 1.5; } else sfx.play('craft'); buzz(25); syncBuilds(S); renderRecipes(); TUT.on && TUT.ev('craft', e); break; }
      case 'eat': { const p = me(); floatText(e.k === 'pie' ? 'Пирожок!' : 'Ням!', p.x, 2, p.z); sfx.play('eat', { item: e.k === 'pie' ? 'pie' : 'berries' }); break; }
      case 'msg': hint(e.text, 2, e.warn); if (e.warn) sfx.play('ui', { kind: 'timeout' }); break;
      case 'push': { const p = me(); vfx.hit([p.x + Math.sin(p.face), .8, p.z + Math.cos(p.face)], { kind: 'enemy' }); sfx.play('push'); shake(.22); FB.squash = .2; buzz(20); break; }
      case 'poof': vfx.poof([e.x, e.k === 'moth' ? 1.6 : .7, e.z], { kind: e.k === 'moth' ? 'moth' : 'mist' }); sfx.play('poof');   // звук poof — из пака (обёртка больше не перехватывает) floatText('Пуф!', e.x, 1.6, e.z); break;
      case 'shoo': burst(e.x, 1.5, e.z, '#3d4670', 5, 2); sfx.play('crow', { kind: 'flap' }); break;
      case 'steal': floatText('-1 ' + RN[e.k], CFG.CHEST.x, 2, CFG.CHEST.z, true); hint('Ворон таскает из сундука — прогони его!', 2.2, true); sfx.play('crow', { kind: 'caw' }); break;
      case 'peck': hint('Ворон клюёт костёр!', 1.6, true); sfx.play('crow', { kind: 'caw' }); break;
      case 'blow': if ((handleEvents.blowT || 0) < performance.now()) { hint('Клубочек мглы задувает костёр — толкни его!', 2, true); sfx.play('mist', { kind: 'blow' }); handleEvents.blowT = performance.now() + 4000; } break;
      case 'mothLand': if ((handleEvents.mothT || 0) < performance.now()) { hint('Мотыльки облепили костёр — смахни их толчком или светом', 2.4, true); handleEvents.mothT = performance.now() + 5000; } sfx.play('moth'); break;
      case 'trap': burst(e.x, .3, e.z, '#ffe27a', 8, 2); syncBuilds(S); sfx.play('craft'); break;
      case 'scare': { const p = me(); floatText('-27 сил', p.x, 2.2, p.z, true); $('vig').style.opacity = 1; setTimeout(() => $('vig').style.opacity = 0, 350); shake(.45); hint('Лунный Лось напугал! Свети фонариком или беги к свету', 2.6, true); sfx.play('moose', { kind: 'breath' }); buzzT = 0; buzz(80); break; }
      case 'mooseLit': sfx.play('moose', { kind: 'light' }); break;
      case 'spawn': if (e.k === 'moose') { toast('Лунный Лось вышел к краю света', 'Держи костёр ярким'); sfx.play('moose', { kind: 'steps' }); }
        else if (e.k === 'moth') sfx.play('moth'); else if (e.k === 'crow') sfx.play('crow', { kind: 'caw' });
        else if (e.k === 'mist') { sfx.play('mist', { kind: 'puff' });   // v0.7: подсказка гуся раньше перехватывалась веткой mist выше и не показывалась
          if (PETS[me().pet].warn && (handleEvents.gooseT || 0) < performance.now()) { hint('Га-га! К костру катится клубочек мглы', 2); sfx.play('pet', { kind: 'idle', pet: 'goose' }); handleEvents.gooseT = performance.now() + 6000; } } break;
      case 'flash': sfx.play('lamp', { kind: e.on ? 'on' : 'charge' }); if (e.empty) hint('Фонарик разрядился — заряди его у костра', 2.2, true); break;
      case 'sleep': { const pv = PV.get(e.pid || PID); if (pv) { vfx.petTired(pv.g); pv.zzT = 3; } } hint(PETS[me().pet].name + ' устал и уснул…', 2.5, true); sfx.play('pet', { kind: 'sleep', pet: me().pet }); sfx.play('ping', { tired: true }); break;
      case 'dream': hint('Грёзы унесли к костру — отдых 15 с', 2.5); sfx.play('dream'); break;
      case 'wake': hint(PETS[me().pet].name + ' проснулся!', 1.8); sfx.play('pet', { kind: 'wake', pet: me().pet }); break;
      case 'ping': sfx.play('ping'); break;
      case 'fireOut': hint('Костёр погас! Подбрось веток до конца ночи', 3, true); sfx.play('fire', { kind: 'extinguish' }); shake(.3); buzzT = 0; buzz(60); break;
      case 'openBench': openCraft(true); sfx.play('ui', { kind: 'click' }); break;
      case 'night': { const w = e.wx || {}; sfx.play('night'); vfx.nightfall(camera);
        if (w.special) { toast('Ночь густого тумана', 'Особая ночь 10 · держись у костра'); hint('Туман закрыл даль. Лось ходит по краю света, клубочки идут двумя волнами', 4); }
        else { toast('Ночь ' + SIM.stageNight(S) + ' / ' + SIM.stageLen(S), w.title || (S.fire.fuel > 0 ? 'Держись в круге света!' : 'Костёр погас — разожги его!'));
          hint(w.moths ? 'Мотыльки летят на свет и садятся на костёр' : w.rain ? 'Дождь — костёр тает быстрее, подкладывай чаще' : e.n === 3 ? 'Появился Лунный Лось. Он боится света — не ходи во тьму без фонарика' : e.n >= 3 ? 'Лось боится света. Клубочки задувают костёр' : 'Ночью силы тают вне круга света', e.n === 3 ? 4.5 : 3); }
        syncAudio(true); TUT.on && TUT.ev('night', e); break; }
      case 'dawn': { nodesChanged = true; TUT.on && TUT.ev('dawn', e); const a = account(); let bonus = 0; if (a.lastDay !== today()) { bonus = 50; a.lastDay = today(); } a.coins += e.coins + bonus; saveAcc(a); save(); sfx.play('morning'); vfx.dawn(camera); syncAudio(true);
        if (!S.result) toast('Ночь ' + (e.n - STAGES[S.stage - 1].from + 1) + ' пережита!', `<span class="coin">${IC.coin}</span>+${e.coins + bonus} монет${bonus ? ' (первый заход дня)' : ''}${e.special ? ' · туман сошёл' : ''} · прогресс сохранён`); break; }
      case 'stageWin': vfx.stageWin([0, 1.3, 0]); stageWin(); break;
      case 'lose': sfx.play('lose'); gameOver(); break;
    }
  }
  if (nodesChanged) syncNodes(S);
}

// ---------- ввод → команды ----------
const input = { jx: 0, jy: 0, keys: {}, hold: false };
const joy = $('joy'), jbase = $('jbase'), jknob = $('jknob'); let joyId = null, jcx = 0, jcy = 0; const JR = 46, JDZ = .14, JFOLLOW = 1.5;
// v0.7: мёртвая зона 14% (дрожь пальца не двигает питомца), отклик сразу после неё (перемасштабирование 0..1), полный ход раньше (радиус 46),
// а если палец уехал дальше 1,5 радиуса — база джойстика едет за пальцем (не нужно возвращать палец назад, чтобы развернуться)
function joyHome() { const r = joy.getBoundingClientRect(); jbase.style.left = '92px'; jbase.style.top = Math.max(70, r.height - 120) + 'px'; jbase.style.opacity = .55; jknob.style.transform = ''; }
joy.addEventListener('pointerdown', e => { if (joyId !== null) return; joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (_) {} const r = joy.getBoundingClientRect(); jcx = e.clientX; jcy = e.clientY; jbase.style.left = (jcx - r.left) + 'px'; jbase.style.top = (jcy - r.top) + 'px'; jbase.style.opacity = 1; e.preventDefault(); });
joy.addEventListener('pointermove', e => { if (e.pointerId !== joyId) return; let dx = e.clientX - jcx, dy = e.clientY - jcy; let l = Math.hypot(dx, dy);
  if (l > JR * JFOLLOW) { const k = (l - JR * JFOLLOW) / l; jcx += dx * k; jcy += dy * k; const r = joy.getBoundingClientRect(); jbase.style.left = (jcx - r.left) + 'px'; jbase.style.top = (jcy - r.top) + 'px'; dx = e.clientX - jcx; dy = e.clientY - jcy; l = Math.hypot(dx, dy); }
  const kx = l > JR ? JR / l : 1; jknob.style.transform = `translate(${dx * kx}px,${dy * kx}px)`;
  const m = Math.min(1, l / JR), a = m < JDZ ? 0 : Math.min(1, (m - JDZ) / (1 - JDZ) * 1.08); input.jx = l > 0 ? dx / l * a : 0; input.jy = l > 0 ? dy / l * a : 0; });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; input.jx = input.jy = 0; joyHome(); };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
let dragId = null, dragX = 0, dragY = 0, dragT = 0;
canvas.addEventListener('pointerdown', e => { if (dragId !== null) return; dragId = e.pointerId; dragX = e.clientX; dragY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
canvas.addEventListener('pointermove', e => { if (e.pointerId !== dragId) return; cam.yaw -= (e.clientX - dragX) * .008; cam.pitch = clamp(cam.pitch + (e.clientY - dragY) * .004, .3, 1.05); dragX = e.clientX; dragY = e.clientY; dragT = performance.now(); });
const dragEnd = e => { if (e.pointerId === dragId) dragId = null; }; canvas.addEventListener('pointerup', dragEnd); canvas.addEventListener('pointercancel', dragEnd);
canvas.addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * .01, 5, 12); }, { passive: true });
function holdBtn(id, down, up) { const b = $(id); let pidB = null; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pidB = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add('down'); down(); }); const u = e => { if (pidB === null || (e && e.pointerId !== pidB)) return; pidB = null; b.classList.remove('down'); up && up(); }; for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(t, u); addEventListener('pointerup', u, true); addEventListener('pointercancel', u, true); }
holdBtn('bAct', () => { input.hold = true; send({ t: 'act' }); }, () => { input.hold = false; });
holdBtn('bEat', () => send({ t: 'eat' })); holdBtn('bTorch', () => send({ t: 'flash' })); holdBtn('bCraft', () => openCraft());
$('pause').onclick = () => setPause(true);
addEventListener('keydown', e => { const k = e.code; input.keys[k] = true; if (mode === 'play') { if ((k === 'KeyE' || k === 'Space') && !e.repeat) { input.hold = true; send({ t: 'act' }); e.preventDefault(); } if (k === 'KeyQ') send({ t: 'eat' }); if (k === 'KeyF') send({ t: 'flash' }); if (k === 'KeyC') openCraft(); if (DEBUG && k === 'KeyN') { S.t = S.phase === 'day' ? SIM.dayLen(S) : SIM.nightLen(S); } }
  if (k === 'Escape') { if ($('sheet').classList.contains('on')) openCraft(false); else if (mode === 'play') setPause(true); else if (mode === 'pause') setPause(false); } });
addEventListener('keyup', e => { input.keys[e.code] = false; if (e.code === 'KeyE' || e.code === 'Space') input.hold = false; });
addEventListener('blur', () => { input.keys = {}; input.hold = false; });
document.addEventListener('gesturestart', e => e.preventDefault()); document.addEventListener('dblclick', e => e.preventDefault()); document.addEventListener('contextmenu', e => e.preventDefault());
let lastMove = '';
function readInput() {
  let ix = input.jx, iy = input.jy; const K = input.keys;
  if (K.KeyW || K.ArrowUp) iy -= 1; if (K.KeyS || K.ArrowDown) iy += 1; if (K.KeyA || K.ArrowLeft) ix -= 1; if (K.KeyD || K.ArrowRight) ix += 1;
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } readInput.iy = iy;
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw); const x = +(sy * iy + cy * ix).toFixed(3), z = +(cy * iy - sy * ix).toFixed(3);
  const key = x + ',' + z; if (key !== lastMove) { lastMove = key; send({ t: 'move', x, z }); }
  return Math.min(1, l);
}

// ---------- камера: сзади питомца, мягко доворачивает за ним ----------
// v0.7: камера чуть ниже и ближе (на 390×844 питомец крупнее, видно горизонт и врагов), смотрит немного вперёд по ходу
const cam = { yaw: 0, pitch: .55, dist: 7.0, eff: 7.0, look: new THREE.Vector3(0, 1, 3), lead: new THREE.Vector3(), shake: 0 };
function shake(a) { cam.shake = Math.min(.5, Math.max(cam.shake, a)); }
// ---------- окклюзия камеры (как в Roblox): деревья/кусты/камни между камерой и питомцем становятся полупрозрачными,
// а если камера «влезла» в крону/куст — плавно подъезжает ближе. Проверка дешёвая: отрезок камера→питомец против
// вертикальных цилиндров узлов (XZ-расстояние + высота отрезка в ближайшей точке), раз в 0,1 с, ~100 узлов.
// Прозрачность: инстанс прячем в основном InstancedMesh и рисуем в «призрачном» InstancedMesh своего типа
// (+1 draw call на тип только пока есть заслонители).
const OCC = { set: new Map(), t: 0, ghosts: {}, pull: 99 };
const ghostMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: .28, depthWrite: false });
const OCC_KINDS = n => n.k === 'tree' ? (n.alive ? [n.sub ? 'oak' : 'pine'] : null) : n.k === 'bush' ? (n.berry ? ['bush', 'berries'] : ['bush']) : n.k === 'rock' ? ['rock'] : null;
const OCC_DIM = n => n.k === 'tree' ? [1.2 * n.s * .85, 3.9 * n.s * .85] : n.k === 'bush' ? [.62 * (n.s || 1), .9 * (n.s || 1)] : [.55 * (n.s || 1), .6 * (n.s || 1)];
function ghost(k) { let g = OCC.ghosts[k]; if (!g) { g = OCC.ghosts[k] = new THREE.InstancedMesh(GEO[k](), ghostMat, 8); g.userData.key = k; g.frustumCulled = false; g.count = 0; g.renderOrder = 2; scene.add(g); } return g; }
function updOcclusion(dt, px, pz, cx, cy, cz) {
  if (!S || !NV.ims.pine) return; OCC.t -= dt;
  if (OCC.t <= 0) { OCC.t = .1; const want = new Set(); let pull = 99; const dx = cx - px, dz = cz - pz, L2 = dx * dx + dz * dz || 1, L = Math.sqrt(L2);
    for (const n of S.nodes) { const ks = OCC_KINDS(n); if (!ks) continue; const [R, H] = OCC_DIM(n);
      const t = clamp(((n.x - px) * dx + (n.z - pz) * dz) / L2, 0, 1); if (t < .04) continue;   // за спиной питомца не трогаем
      const qx = px + dx * t - n.x, qz = pz + dz * t - n.z, d = Math.hypot(qx, qz); if (d > R + .25) continue;
      const y = 1.1 + (cy - 1.1) * t; if (y > H + .3) continue; want.add(n.id);
      if (n.k !== 'rock' && Math.hypot(cx - n.x, cz - n.z) < R + .5 && cy < H + .8) pull = Math.min(pull, Math.max(3.2, t * cam.dist - R - .3));   // камера в кроне/кусте
    }
    OCC.pull = pull;
    for (const [id, o] of OCC.set) if (!want.has(id) || o.sig !== NV.sig.get(id)) { OCC.set.delete(id); OCC.dirty = true; }
    if (OCC.dirty) { OCC.dirty = false; syncNodes(S, true); }
    for (const id of want) if (!OCC.set.has(id)) { const n = S.nodes.find(q => q.id === id), v = NV.map.get(id); if (!n || !v) continue;
      const ks = OCC_KINDS(n).filter(k => v[k] != null && NV.ims[k]); OCC.set.set(id, { ks, m: ks.map(k => { const m = new THREE.Matrix4(); NV.ims[k].getMatrixAt(v[k], m); return m; }), sig: NV.sig.get(id) }); }
    for (const k in OCC.ghosts) { OCC.ghosts[k].count = 0; OCC.ghosts[k].visible = false; }
    for (const [, o] of OCC.set) o.ks.forEach((k, i) => { const g = ghost(k); if (g.count < 8) { g.setMatrixAt(g.count++, o.m[i]); g.instanceMatrix.needsUpdate = true; g.visible = true; } }); }
  for (const [id, o] of OCC.set) { const v = NV.map.get(id); if (v) for (const k of o.ks) if (v[k] != null) hideI(NV.ims[k], v[k]); }   // индекс берём свежий (инстансы упакованы)
}
function updCamera(dt, moveAmt) {
  // автодоворот за спину — только когда идём «вперёд» (джойстик вверх); при ходьбе вбок камера больше не закручивается кругами
  const p = me(), fwd = Math.max(0, -readInput.iy); if (moveAmt > .2 && fwd > .3 && performance.now() - dragT > 1500) { let d = (p.face + Math.PI) - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.yaw += d * Math.min(1, dt * 1.5 * fwd); }
  const tgt = Math.min(cam.dist, OCC.pull); cam.eff += (tgt - cam.eff) * (1 - Math.exp(-(tgt < cam.eff ? 6 : 2) * dt));   // подъезд быстрее, отъезд мягче
  const cp = Math.cos(cam.pitch);
  updOcclusion(dt, p.x, p.z, p.x + Math.sin(cam.yaw) * cp * cam.dist, 1.1 + Math.sin(cam.pitch) * cam.dist, p.z + Math.cos(cam.yaw) * cp * cam.dist);   // до _v: hideI портит общий _v
  _v.set(p.x + Math.sin(cam.yaw) * cp * cam.eff, 1.1 + Math.sin(cam.pitch) * cam.eff, p.z + Math.cos(cam.yaw) * cp * cam.eff);
  cam.lead.lerp(_s.set(p.vx, 0, p.vz).multiplyScalar(.28), 1 - Math.exp(-3 * dt));
  camera.position.lerp(_v, 1 - Math.exp(-8 * dt)); cam.look.lerp(_s.set(p.x + cam.lead.x, 1.05, p.z + cam.lead.z), 1 - Math.exp(-10 * dt));
  if (cam.shake > .001) { const a = cam.shake * cam.shake, t = performance.now() * .05; camera.position.x += Math.sin(t * 1.7) * a * .35; camera.position.y += Math.sin(t * 2.3) * a * .25; cam.shake = Math.max(0, cam.shake - dt * 1.8); }
  camera.lookAt(cam.look);
}

// ---------- свет: день / закат / ночь ----------
const PAL = {
  day: { bg: new THREE.Color('#8fd3ff'), sky: new THREE.Color('#e4f4ff'), gnd: new THREE.Color('#88c45e'), sun: new THREE.Color('#fff1d6'), hI: 2.2, sI: 1.8, fn: 22, ff: 52 },
  dusk: { bg: new THREE.Color('#ffb48f'), sky: new THREE.Color('#ffd2b0'), gnd: new THREE.Color('#8a8a6a'), sun: new THREE.Color('#ffb070'), hI: 1.6, sI: 1.1, fn: 16, ff: 44 },
  night: { bg: new THREE.Color('#2a3570'), sky: new THREE.Color('#7d8fe8'), gnd: new THREE.Color('#34427a'), sun: new THREE.Color('#b4c2ff'), hI: 1.35, sI: .55, fn: 9, ff: 34 },
};
const cA = new THREE.Color();
const mixC = (n, k) => n < .5 ? cA.copy(PAL.day[k]).lerp(PAL.dusk[k], n * 2) : cA.copy(PAL.dusk[k]).lerp(PAL.night[k], (n - .5) * 2);
const mixN = (n, k) => n < .5 ? lerp(PAL.day[k], PAL.dusk[k], n * 2) : lerp(PAL.dusk[k], PAL.night[k], (n - .5) * 2);
function nightness() { if (!S || mode === 'menu') return 0; if (S.phase === 'night') return S.t > SIM.nightLen(S) - 3 ? 1 - (S.t - SIM.nightLen(S) + 3) / 6 : 1; if (S.dawnFlag && S.t < 3) return .5 - S.t / 6; return sstep(SIM.dayLen(S) - 8, SIM.dayLen(S), S.t); }
const FOG10 = new THREE.Color('#4d5f86'), RAINC = new THREE.Color('#6f7f99');
function applyLight(n, dt = .016) {
  // туман пака (пресеты night/soft/dense, спрайты-простыни) уже обновлён в vfx.update(); здесь смешиваем его дальность
  // с нашей светлой палитрой: в ясную ночь — наша палитра, в туман 10–12 — ближе к пресету пака, но светлее (мило-жутко, читаемо)
  fogFx.setNight(n); const wx = S && mode !== 'menu' ? S.wx : null, fz = wx ? (wx.fog || 0) * n : 0, rz = wx && wx.rain ? n : 0;
  const pNear = scene.fog.near, pFar = scene.fog.far;
  const bg = mixC(n, 'bg'); if (fz) bg.lerp(FOG10, fz * .55); if (rz) bg.lerp(RAINC, rz * .3);
  scene.background.copy(bg); scene.fog.color.copy(bg); scene.fog.near = lerp(mixN(n, 'fn'), pNear, fz); scene.fog.far = lerp(mixN(n, 'ff'), pFar + 2, fz);
  hemi.color.copy(mixC(n, 'sky')); hemi.groundColor.copy(mixC(n, 'gnd')); hemi.intensity = mixN(n, 'hI'); sun.color.copy(mixC(n, 'sun')); sun.intensity = mixN(n, 'sI');
  stars.material.opacity = sstep(.6, 1, n); fogWall.material.color.copy(scene.background).lerp(_c.set(0xffffff), .35 * (1 - n));
}
let lightRv = 8;
function animFire(dt) {
  const t = performance.now() * .001, fuel = S ? S.fire.fuel : 60, max = S ? SIM.fireMax(S) : 100, lv = S ? S.fire.lv : 1, on = fuel > 0, k = on ? .45 + .55 * Math.sqrt(fuel / max) : 0, big = lv === 3 ? 1.5 : lv === 2 ? 1.2 : 1;
  if (S && lv !== shownLv) { shownLv = lv; fireRing.visible = lv >= 2; if (lv >= 2) { fireRing.geometry = GEO['campfire_addon_' + lv](); fireRing.userData.key = 'campfire_addon_' + lv; } }
  const low = on && fuel / max < .15, flick = low ? (Math.sin(t * 20) > 0 ? 1 : .6) : 1;
  if (lv !== fireFx.level) { fireFx.setLevel(lv); hidePackBase(); } if (fireFx.lit !== on) fireFx.setLit(on); fireFx.setFuel(fuel / max);
  const LR = S ? SIM.lightR(S) : 8; lightRv += (LR - lightRv) * Math.min(1, dt * 3);
  glow.visible = on; glow.scale.setScalar(2.5 + lightRv * .35); 
  FB.fire = Math.max(0, FB.fire - dt * 2.2); glow.scale.multiplyScalar(1 + FB.fire * .35);
  const n = nightness(); updPetLight(n, on, k); fireLight.intensity = on ? (1.2 + 28.8 * n) * k * flick * (1 + Math.sin(t * 17) * .06) * (1 + FB.fire * .6) + FB.fire * 3 : 0; fireLight.distance = lightRv * 1.9 + 2;
  const vis = lightRv > .2; safeDisc.visible = safeRing.visible = vis; if (vis) { safeDisc.scale.setScalar(lightRv); safeRing.scale.setScalar(lightRv); }
  safeRing.material.opacity = (.25 + .5 * n) * (low ? flick : 1); safeDisc.material.opacity = .35 + .65 * n;
  const OR = S ? SIM.openR(S) : 16; fogWall.scale.set(OR + .3, 1, OR + .3); fogWall.visible = OR < CFG.MAP;
}

// ---------- кадр ----------
const STEP = 1 / 60; let acc = 0, hudT = 0, tgtT = 0, target = null, actShown = '';
const ACT = { push: ['paw', 'Толкнуть'], fuel: ['fire', 'В костёр'], ignite: ['fire', 'Разжечь'], deposit: ['chest', 'В сундук'], tree: ['axe', 'Рубить'], bush: ['berry', 'Собрать'], branch: ['stick', 'Подобрать'], stone: ['stone', 'Подобрать'], stump: ['cloth', 'Обыскать'], bench: ['bench', 'Верстак'], wake: ['wake', 'Разбудить'], none: ['hand', 'Действие'] };
function updActBtn() { const k = target ? target.kind : 'none'; if (k === actShown) return; actShown = k; const b = $('bAct'); ico(b.querySelector('.ico'), ACT[k][0]); b.querySelector('span').textContent = ACT[k][1]; b.classList.toggle('dim', k === 'none'); }
function frame(dt) {
  sfx.update(dt); vfx.update(dt);
  if (mode === 'menu') { const a = performance.now() * .00006; camera.position.set(Math.sin(a) * 13, 6.5, Math.cos(a) * 13); camera.lookAt(0, 1.2, 0); applyLight(0, dt); animFire(dt); updWeather(dt); syncAudio(); if (S) { syncPlayers(S, dt); } return; }
  if (mode !== 'play') return;
  const moveAmt = readInput(); if (input.hold && me().cd <= 0 && cmdQ.length === 0) send({ t: 'act' });
  if (COOP && COOP.active()) { cmdQ.length = 0; COOP.frame(dt); handleEvents(); if (mode !== 'play') return; }   // кооп: мир с сервера, свой питомец — предсказание
  else { acc += dt; let n = 0; while (acc >= STEP && n < 5) { SIM.step(S, STEP, cmdQ.splice(0)); acc -= STEP; n++; handleEvents(); if (mode !== 'play') return; } if (n >= 5) acc = 0; }
  if ((frame.nsT = (frame.nsT || 0) - dt) <= 0) { frame.nsT = .25; syncNodes(S); }   // страховка: узлы, изменённые не событием (отрастание, тесты)
  if (SHAKE.size) { for (const [id, sh] of SHAKE) { if (sh - dt <= 0) SHAKE.delete(id); else SHAKE.set(id, sh - dt); } syncNodes(S, true); }
  updFlash(dt);
  syncPlayers(S, dt); syncEnemies(S, dt); updCamera(dt, moveAmt);
  if ((tgtT -= dt) <= 0) { tgtT = .08; target = SIM.context(S, PID); updActBtn(); }
  if (target && target.kind !== 'bench') { marker.visible = true; let tx = target.x, tz = target.z; if (target.kind === 'push') { const e = S.enemies.find(q => q.id === target.id); if (e) { tx = e.x; tz = e.z; } } marker.position.x = tx; marker.position.z = tz; marker.scale.setScalar((target.kind === 'fuel' ? 1.6 : target.kind === 'deposit' ? 1.2 : 1) * (1 + Math.sin(performance.now() * .008) * .06)); marker.material.color.set(target.kind === 'push' ? 0xff6b7f : 0xffffff); } else marker.visible = false;
  applyLight(nightness(), dt); animFire(dt); updWeather(dt); stars.position.copy(camera.position); syncAudio();
  { const p = me(), sp = Math.hypot(p.vx, p.vz); if (sp > 1.2 && (frame.stepT = (frame.stepT || 0) - dt * sp / 4.4) <= 0) { frame.stepT = .34; const r = Math.hypot(p.x, p.z); sfx.play('step', { surface: r < 2.6 ? 'stone' : 'grass' }); } }
  if (hintT > 0 && (hintT -= dt) <= 0) $('hint').classList.add('hide');
  TUT.update(dt); ctxHints(dt);
  if ((hudT -= dt) <= 0) { hudT = .1; updHUD(); if ($('sheet').classList.contains('on') && recipeSig() !== renderRecipes.sig) renderRecipes(); }
}

// ---------- режимы и меню: «Соло» / «С другом» / «Поиск соперника», карта этапов, лобби ----------
const ROLE = { raccoon: 'сбор', capybara: 'лагерь', dragon: 'огонь', goose: 'дозор' };
// v0.7: ручной выбор питомца убран (GDD v0.5 — питомец только из профиля). Карточка только показывает питомца.
$('myPet').innerHTML = `<img src="img/${pet}.webp" alt=""><span><small>Твой питомец из профиля</small>${PETS[pet].name} · ${ROLE[pet]}</span>`;
const OVS = ['startOv', 'soloOv', 'mapOv', 'lobbyOv', 'confirmOv', 'pauseOv', 'overOv', 'winOv', 'loading'];
const only = id => OVS.forEach(o => $(o).classList.toggle('hide', o !== id));
const UIK = { bSolo: 'mode', bFriend: 'mode', bMap: 'map', bMap2: 'map', bWinMap: 'map', bLobbyStage: 'map', bMapGo: 'start', bCont: 'play', bRetry: 'play', bNextStage: 'start', cfYes: 'start' };
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled || b.closest('#acts')) return; sfx.play('ui', { kind: b.classList.contains('cell') ? 'stage' : UIK[b.id] || 'click' }); }, true);
function startPlay() { mode = 'play'; acc = 0; only(null); $('hud').classList.remove('hide'); actShown = ''; lastMove = ''; updHUD.wsig = ''; updHUD(); joyHome(); const p = me(); cam.yaw = 0; camera.position.set(p.x, 6, p.z + 7); cam.look.set(p.x, 1.1, p.z); clock.getDelta(); syncAudio(true); }
function setPause(on) { if (on && mode !== 'play') return; if (!on && mode !== 'pause') return; mode = on ? 'pause' : 'play'; $('pauseOv').classList.toggle('hide', !on); input.hold = false; if (!on) clock.getDelta(); }
function clearWorldEnemies() { if (S) { S.enemies = []; S.wx = SIM.weatherFor(S, 0); for (const [, v] of EV) scene.remove(v.g); EV.clear(); } }
function showMenu() { TUT.stop(false); mode = 'menu'; openCraft(false); $('hud').classList.add('hide'); only('startOv'); clearWorldEnemies(); }
function showSolo() { const d = loadSave(); if (!d) return showMap(); mode = 'menu'; only('soloOv'); $('contInfo').textContent = 'Этап ' + stageName(d.stage) + ' · ночь ' + SIM.stageNight(d) + ' / ' + SIM.stageLen(d) + ' · ' + PETS[d.players[PID].pet].name; }
// карта этапов: 16 ячеек по 6 ночей + финал 97–99; в MVP играбельны 1–6 и 7–12
let mapSel = 1, mapFor = 'solo', lobby = { stage: 1, fill: false, code: '' };
function showMap(forWhat = 'solo') {
  mode = 'menu'; mapFor = forWhat; const a = account(), sv = loadSave();
  const open = STAGES.filter(st => ['open', 'passed'].includes(cellState(st.id, a, sv).st)).map(st => st.id);
  mapSel = forWhat === 'lobby' ? lobby.stage : Math.max(...open);
  $('mapT').textContent = forWhat === 'lobby' ? 'Этап для комнаты' : 'Карта этапов';
  renderMap(); only('mapOv');
}
function renderMap() {
  const a = account(), sv = loadSave(); const LBL = { open: 'открыт', passed: 'пройден', locked: 'закрыт', soon: 'скоро' };
  $('cells').innerHTML = STAGES.map(st => { const c = cellState(st.id, a, sv), sel = st.id === mapSel, ten = st.from <= 10 && 10 <= st.to;
    return `<button class="cell ${c.st}${sel ? ' sel' : ''}${st.final ? ' final' : ''}" data-st="${st.id}" data-state="${c.st}" ${c.st === 'soon' || c.st === 'locked' ? 'disabled' : ''}>
      <b>${st.from}–${st.to}</b><small>${c.st === 'locked' || c.st === 'soon' ? IC.lock : c.st === 'passed' ? IC.star : ''}${LBL[c.st]}</small>${c.save ? `<i class="sv" title="есть сохранение">${IC.save}</i>` : ''}${ten ? '<em>ночь 10</em>' : ''}</button>`; }).join('');
  const c = cellState(mapSel, a, sv), st = STAGES[mapSel - 1];
  $('mapInfo').innerHTML = c.save ? 'Есть соло-сохранение: ночь ' + SIM.stageNight(sv) + ' / 6' : mapSel === 2 ? 'Набор главы: костёр 3-го ур., верстак 2-го ур., припасы в сундуке. Ночь 10 — «Ночь густого тумана»' : 'Клубочки мглы, сонные вороны, Лунный Лось с 3-й ночи';
  $('bMapGo').innerHTML = mapFor === 'lobby' ? 'Выбрать · ' + st.from + '–' + st.to : (c.save ? 'Продолжить · ' : 'Начать · этап ') + st.from + '–' + st.to;
}
$('cells').addEventListener('click', e => { const b = e.target.closest('.cell'); if (!b || b.disabled) return; mapSel = +b.dataset.st; renderMap(); });
$('bMapGo').onclick = () => {
  if (mapFor === 'lobby') { lobby.stage = mapSel; return showLobby(); }
  const sv = loadSave(); if (sv && sv.stage === mapSel) return continueGame();
  if (sv) return confirmBox('Начать этап ' + stageName(mapSel) + '?', 'Незавершённый забег этапа ' + stageName(sv.stage) + ' будет сброшен. Открытые этапы останутся.', () => { localStorage.removeItem(SAVE_KEY); startStage(mapSel); }, showMap);
  startStage(mapSel);
};
$('bMapBack').onclick = () => mapFor === 'lobby' ? showLobby() : loadSave() ? showSolo() : showMenu();
function confirmBox(t, sub, yes, no) { only('confirmOv'); $('cfT').textContent = t; $('cfS').textContent = sub; $('cfYes').onclick = yes; $('cfNo').onclick = no || showMenu; }
// «С другом»: лобби 2–4 с кодом и галочкой «Добрать случайных» (по умолчанию выключена). Сети пока нет — «Начать» ждёт второго игрока.
function showLobby() {
  mode = 'menu'; if (!lobby.code) lobby.code = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  const a = account(); $('lobbyCode').textContent = lobby.code; $('lobbyStage').textContent = stageName(lobby.stage); $('chkFill').checked = lobby.fill;
  $('slots').innerHTML = [0, 1, 2, 3].map(i => i === 0 ? `<div class="slot me" style="--c:${SIM.SLOT_COLORS[0]}"><img src="img/${pet}.webp" alt=""><span><b>Ты · ${PETS[pet].name}</b><small>открыто до этапа ${stageName(a.open)} · хост</small></span></div>` : `<div class="slot empty" style="--c:${SIM.SLOT_COLORS[i]}"><i></i><span><b>Свободно</b><small>${lobby.fill ? 'добор случайных…' : 'ждём друга по коду'}</small></span></div>`).join('');
  $('lobbyNote').textContent = lobby.fill ? 'Добор до 4 игроков из «Поиска соперника» заработает с сервером (скоро). Можно выключить галочку.' : 'Позови друга кодом или ссылкой. Минимум 2 игрока, максимум 4.';
  only('lobbyOv');
}
$('chkFill').onchange = e => { lobby.fill = e.target.checked; sfx.play('ui', { kind: 'fill' }); showLobby(); };
$('bLobbyStage').onclick = () => showMap('lobby');
$('bLobbyBack').onclick = showMenu;
// поражение: в соло можно сразу повторить эту ночь с состояния утра
function gameOver() { $('toast').classList.remove('on'); $('hint').classList.add('hide');
  mode = 'over'; input.hold = false; openCraft(false); const r = S.result || {};
  $('overT').textContent = 'Костёр погас';
  $('overS').innerHTML = `Ночь ${r.night - STAGES[(r.stage || 1) - 1].from + 1} / 6 этапа ${stageName(r.stage || 1)}. Открытые этапы не теряются.<br><span class="coin">${IC.coin}</span> за пережитые ночи: ${r.coins || 0}`;
  const d = S.mode === 'solo' ? loadSave() : null; $('bRetry').classList.toggle('hide', !d); $('bMap2').classList.toggle('hide', S.mode !== 'solo'); if (d) $('bRetry').innerHTML = 'Повторить ночь<small>с утра ночи ' + SIM.stageNight(d) + ' / 6</small>';
  only('overOv');
}
// победа этапа: открывает следующий; соло может сразу идти дальше с тем же лагерем
function stageWin() { $('toast').classList.remove('on'); $('hint').classList.add('hide');
  mode = 'over'; input.hold = false; openCraft(false); const r = S.result, a = account();
  if (!a.passed.includes(r.stage)) a.passed.push(r.stage); a.open = Math.max(a.open, Math.min(CFG.MVP_STAGES + 1, r.stage + 1)); a.coins += 100; saveAcc(a);
  if (S.mode === 'solo') localStorage.removeItem(SAVE_KEY); sfx.play('win'); const coop = S.mode !== 'solo';
  $('winT').textContent = 'Этап ' + stageName(r.stage) + ' пройден!';
  $('winS').innerHTML = `Утро после ${r.night}-й ночи, костёр горит.<br><span class="coin">${IC.coin}</span> за этап: ${r.coins} (вместе с бонусом +100)` + (r.mvpEnd ? '<br>Этапы 13–99 — скоро.' : '');
  $('bNextStage').classList.toggle('hide', !!r.mvpEnd || coop); $('bWinMap').classList.toggle('hide', coop); if (coop) $('winS').innerHTML += '<br>Командный забег: один этап за заход.'; if (!r.mvpEnd) $('bNextStage').innerHTML = 'Дальше: этап ' + stageName(r.stage + 1) + '<small>лагерь и рюкзак остаются</small>';
  only('winOv');
}
$('bNextStage').onclick = () => { if (SIM.continueNextStage(S)) { save(); startPlay(); toast('Этап ' + stageName(S.stage), 'Лагерь остался с тобой'); } };
$('bSolo').onclick = showSolo; $('bFriend').onclick = showLobby; $('bMap').onclick = () => showMap(); $('bBack1').onclick = showMenu;
$('bNewRun').onclick = () => { const d = loadSave(); confirmBox('Новый забег?', 'Сбросится только незавершённый забег этапа ' + (d ? stageName(d.stage) : '') + '. Открытые этапы останутся.', () => { localStorage.removeItem(SAVE_KEY); showMap(); }, showSolo); };
$('bCont').onclick = continueGame; $('bRetry').onclick = continueGame; $('bResume').onclick = () => setPause(false);
$('bMenu').onclick = showMenu; $('bMenu2').onclick = showMenu; $('bMap2').onclick = () => showMap(); $('bWinMap').onclick = () => showMap(); $('bWinMenu').onclick = showMenu;
document.querySelectorAll('.mute').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setMute(!sfx.muted); })); setMute(sfx.muted);
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && !(COOP && COOP.active())) setPause(true); if (sfx._ctx) { if (document.hidden) sfx._ctx.suspend().catch(() => {}); else if (sfx.ready) sfx._ctx.resume().catch(() => {}); } });

// ---------- цикл, FPS, адаптивное качество ----------
const clock = new THREE.Clock(); let fpsAcc = 0, fpsN = 0, fps = 60, lowT = 0, hiT = 0; const dbg = $('dbg'); if (DEBUG) dbg.classList.remove('hide');
function loop() {
  requestAnimationFrame(loop); if (document.hidden) return; const raw = clock.getDelta(), dt = Math.min(.05, raw);
  frame(dt); updParts(dt); updFloats(dt); updBlobs(); renderer.render(scene, camera);
  fpsAcc += raw; fpsN++; if (fpsAcc >= .5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
    // v0.7: вниз быстрее (FPS < 30 две секунды → −0,2), вверх осторожно (FPS > 55 восемь секунд → +0,1 до потолка)
    if (!NOADAPT && mode === 'play') { if (fps < 30) { lowT += .5; hiT = 0; } else { lowT = 0; hiT = fps > 55 ? hiT + .5 : 0; }
      if (lowT >= 2 && pixelRatio > .75) { pixelRatio = Math.max(.75, pixelRatio - .2); renderer.setPixelRatio(pixelRatio); resize(); lowT = 0; }
      if (hiT >= 8 && pixelRatio < PR_CAP) { pixelRatio = Math.min(PR_CAP, pixelRatio + .1); renderer.setPixelRatio(pixelRatio); resize(); hiT = 0; } }
    if (DEBUG) { const i = renderer.info.render; dbg.textContent = `FPS ${fps.toFixed(0)}  calls ${i.calls}  tris ${i.triangles}  px ${pixelRatio.toFixed(2)}  врагов ${S ? S.enemies.length : 0}  ×${FAST}`; } }
}
// API для тестов и отладки (только чтение/служебное)
window.__g = { scene, input, SIM, get S() { return S; }, get mode() { return mode; }, send, save, loadSave, startStage, continueGame, showMap, showMenu, account, saveAcc, sfx, vfx, fireFx, setMute, renderer, camera, cam, quality: QUALITY, assets: ASSET_STATE, occ: OCC, get coop() { return COOP; }, get PID() { return PID; },
  teleport: (x, z) => { const p = me(); p.x = x; p.z = z; const cp = Math.cos(cam.pitch); camera.position.set(x + Math.sin(cam.yaw) * cp * cam.dist, 1.1 + Math.sin(cam.pitch) * cam.dist, z + Math.cos(cam.yaw) * cp * cam.dist); cam.look.set(x, 1.1, z); },
  look: (yaw, pitch) => { cam.yaw = yaw; if (pitch) cam.pitch = pitch; dragT = performance.now(); },
  tut: TUT, fb: FB, startQaNight, hintLog, stats: () => ({ fps: Math.round(fps), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, px: pixelRatio }), get target() { return target; }, ready: false };

// подмена процедурных заглушек на GLB художника (js/assets.js): запекаем и меняем геометрию у инстансов, мешей лагеря и врагов.
// Нет url или файл не загрузился — остаётся заглушка. Один GLB может кормить несколько ключей (include/exclude).
async function loadStaticAssets() {
  const keys = Object.keys(ASSETS).filter(k => ASSETS[k] && ASSETS[k].url); if (!keys.length) return; const L = await getLoader(); const files = {};
  await Promise.all(keys.map(async k => { const a = ASSETS[k];
    try { const gltf = await (files[a.url] || (files[a.url] = L.loadAsync(a.url)));
      if (a.anim) { const c = CR[k] = prepCreature(gltf, a); let t = 0, calls = 0; c.root.traverse(o => { if (o.isMesh) { calls++; t += o.geometry.attributes.position.count / 3; } }); ASSET_STATE.tris[k] = Math.round(t); ASSET_STATE.calls = { ...(ASSET_STATE.calls || {}), [k]: calls }; ASSET_STATE.loaded.push(k); return; }
      const { geo, glow } = bakeObject(gltf.scene, a);
      ASSET_STATE.tris[k] = Math.round(geo.attributes.position.count / 3 + (glow ? glow.attributes.position.count / 3 : 0));
      const withGlow = m => { if (!glow || m.isInstancedMesh) return; let gm = m.children.find(c => c.userData.glow); if (!gm) { gm = new THREE.Mesh(glow, matGlow); gm.userData.glow = true; m.add(gm); } else gm.geometry = glow; };
      if (a.decor) for (const [x, z, ry] of a.decor) { const m = new THREE.Mesh(geo, matVC); m.position.set(x, 0, z); m.rotation.y = ry || 0; m.userData.key = k; camp.add(m); withGlow(m); }
      else { GEO[k] = () => geo; scene.traverse(o => { if (o.isMesh && o.userData.key === k) { o.geometry = geo; withGlow(o); } }); if (k.startsWith('campfire_addon')) RG[k.slice(-1)] = geo; }
      ASSET_STATE.loaded.push(k); } catch (e) { ASSET_STATE.failed.push(k); console.warn('asset', k, e.message); } }));
  // виды врагов, созданные до загрузки, пересоздаём уже с моделями
  for (const [, v] of EV) scene.remove(v.g); EV.clear();
}
// API для кооп-модуля (грузится только с ?server=)
const API = { get S() { return S; }, setS: v => { S = v; }, get PID() { return PID; }, setPID: id => { PID = id; }, get mode() { return mode; }, setMode: m => { mode = m; }, get pet() { return pet; },
  initWorld, startPlay, only, toast, hint, showMenu, handleEvents, syncNodes, syncBuilds, account, stageName, PV, scene, camera, THREE, sfx, IC, me, input, setPause };
(async () => {
  showMenu(); loop();
  if (NET) import('./coop.js?v=0.7.0').then(m => { COOP = m.initCoop(API, NET); window.__g.coopReady = true; }).catch(e => { console.error('coop', e); }); const assetsP = loadStaticAssets().catch(e => console.warn('assets', e.message));
  try { await Promise.race([loadPet(pet), new Promise(r => setTimeout(r, 6000))]); } catch (e) { console.warn('pet', e.message); }
  await Promise.race([assetsP, new Promise(r => setTimeout(r, 8000))]); $('loading').classList.add('hide'); window.__g.ready = true;
  if (QA_NIGHT && !NET) startQaNight(QA_NIGHT);
})();
