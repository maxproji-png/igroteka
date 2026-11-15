// «99 ночей» — клиент прототипа v1: рендер (Three.js r160), ввод, HUD.
// Вся игровая логика — в js/sim.js (чистое сериализуемое состояние + команды), клиент её только рисует.
import * as THREE from 'three';
import { ASSETS, PET_MODELS } from './assets.js';
import * as SIM from './sim.js';
const { CFG, PETS, RECIPES } = SIM;

// ---------- параметры ----------
const Q = new URLSearchParams(location.search);
const FAST = Q.has('fast') ? Math.max(2, +Q.get('fast') || 6) : 1;   // ?fast=1 — время ×6 (или ?fast=10)
const DEBUG = Q.get('debug') === '1';
const NOADAPT = Q.has('noadapt');
const SAVE_KEY = '99n_v1_save', PET_KEY = '99n_v1_pet', PID = 'p1';
const $ = id => document.getElementById(id);
let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;   // только для декора
const R = (a, b) => a + (b - a) * rnd();
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------- иконки (SVG, без эмодзи-шрифтов) ----------
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
 pause:'<svg viewBox="0 0 32 32"><rect x="8" y="6" width="6" height="20" rx="2.5" fill="#6b7590"/><rect x="18" y="6" width="6" height="20" rx="2.5" fill="#6b7590"/></svg>',
};
const RES = [['log','Брёвна'],['stick','Ветки'],['stone','Камни'],['berry','Ягоды']];
// ---------- рендерер ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance', stencil: false });
let pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
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
// запечь загруженный GLB (все меши, цвета материалов) в одну геометрию
function bakeObject(root, scale = 1) {
  root.updateMatrixWorld(true); const list = [];
  root.traverse(o => { if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const mats = Array.isArray(o.material) ? o.material : [o.material]; const n = g.attributes.position.count;
    const col = new Float32Array(n * 3); const groups = g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }];
    for (const gr of groups) { const m = mats[gr.materialIndex || 0] || mats[0]; const mc = m && m.color ? m.color : _c.set(1, 1, 1);
      for (let i = gr.start; i < Math.min(n, gr.start + gr.count); i++) { col[i*3] = mc.r; col[i*3+1] = mc.g; col[i*3+2] = mc.b; } }
    if (g.attributes.color) { const vc = g.attributes.color; for (let i = 0; i < n; i++) { col[i*3] *= vc.getX(i); col[i*3+1] *= vc.getY(i); col[i*3+2] *= vc.getZ(i); } }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', g.attributes.position); ng.setAttribute('color', new THREE.BufferAttribute(col, 3)); list.push(ng); });
  const g = merge(list); g.scale(scale, scale, scale); g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0); g.computeBoundingSphere(); return g;
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
  lstump: () => merge([part(Cyl(.34, .42, .5, 8), C.trunk, 0, .25), part(Cyl(.3, .3, .02, 8), '#f2c27f', 0, .51), part(Box(.32, .05, .26), '#ff8fb8', .05, .55, .02, 0, .4, .08), part(Box(.2, .05, .2), '#7fd6ff', -.12, .58, -.08, 0, -.3, -.1), part(Ico(.12), '#62c35a', .3, .1, .3)]),
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
  bench: () => merge([part(Box(1.7, .14, .9), C.wood, 0, .85), part(Box(1.5, .06, .7), '#e0a46a', 0, .95), ...[[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]].map(([x, z]) => part(Box(.12, .8, .12), C.trunk2, x, .4, z)), part(Box(.5, .08, .3), '#9aa6bf', -.3, 1.02, .05, 0, .4), part(Cyl(.03, .03, .45, 4), C.trunk, -.1, 1.0, .1, 0, 1.1, Math.PI / 2), part(Box(.3, .25, .25), '#ffd36b', .5, 1.05, -.1), part(Box(.32, .08, .27), '#ff8fb8', .5, 1.2, -.1)]),
  chest: () => merge([part(Box(1.1, .6, .7), C.wood, 0, .3), part(Box(1.14, .28, .74), '#e0a46a', 0, .72), part(Box(1.16, .08, .76), '#ffd36b', 0, .58), part(Box(.16, .24, .06), '#ffd36b', 0, .55, .38), part(Box(.06, .7, .74), '#ffd36b', -.4, .45), part(Box(.06, .7, .74), '#ffd36b', .4, .45)]),
  bed: () => merge([part(Box(1.3, .12, .8), '#ffb3c7', 0, .06), part(Box(1.36, .06, .86), '#ff8fb8', 0, .02), part(Box(.4, .12, .6), '#fff2f6', -.4, .16)]),
  lamp: () => merge([part(Cyl(.06, .08, 2.2, 5), C.trunk2, 0, 1.1), part(Box(.6, .08, .08), C.trunk2, .2, 2.15), part(Box(.36, .44, .36), '#ffd36b', .42, 1.85), part(Box(.26, .32, .26), '#fff6c9', .42, 1.85), part(Cone(.26, .18, 4), '#c9824a', .42, 2.17, 0, 0, Math.PI / 4)]),
};const matVC = new THREE.MeshLambertMaterial({ vertexColors: true });
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
function IM(key, count, mat = matVC) { const im = new THREE.InstancedMesh(GEO[key](), mat, Math.max(1, count)); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.userData.key = key; im.frustumCulled = false; scene.add(im); for (let i = 0; i < im.count; i++) hideI(im, i); return im; }
function setI(im, i, x, y, z, ry, s, sy = s, rx = 0, rz = 0) { im.setMatrixAt(i, _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(s, sy, s))); im.instanceMatrix.needsUpdate = true; }
const hideI = (im, i) => setI(im, i, 0, -50, 0, 0, .0001);
// декор опушки (клиентский, не влияет на логику)
{ const border = []; for (let i = 0; i < 64; i++) { const a = rnd() * 6.283, r = R(CFG.MAP + 1.2, CFG.MAP + 12); border.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: R(1, 1.5), ry: R(0, 6), pine: rnd() < .65 }); }
  const bp = border.filter(b => b.pine), bo = border.filter(b => !b.pine); const ip = IM('pine', bp.length), io = IM('oak', bo.length);
  bp.forEach((b, i) => setI(ip, i, b.x, 0, b.z, b.ry, b.s)); bo.forEach((b, i) => setI(io, i, b.x, 0, b.z, b.ry, b.s));
  const nG = 360, nF = 80, ig = IM('grass', nG, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })), iff = IM('flower', nF);
  for (let i = 0; i < nG; i++) { const a = rnd() * 6.283, r = Math.sqrt(R(20, (CFG.MAP + 6) ** 2)); setI(ig, i, Math.cos(a) * r, 0, Math.sin(a) * r, R(0, 6), R(.8, 1.4)); }
  for (let i = 0; i < nF; i++) { const a = rnd() * 6.283, r = Math.sqrt(R(40, CFG.MAP ** 2)); setI(iff, i, Math.cos(a) * r, 0, Math.sin(a) * r, R(0, 6), R(.8, 1.3)); } }

// узлы мира из состояния: id → {im, i}
const NV = { map: new Map(), ims: {}, sig: new Map() }; const SHAKE = new Map();
function buildNodeViews(s) {
  const kinds = { pine: [], oak: [], stump: [], rock: [], bush: [], berries: [], branch: [], stone: [], lstump: [] };
  for (const n of s.nodes) { if (n.k === 'tree') { kinds[n.sub ? 'oak' : 'pine'].push(n); kinds.stump.push(n); } else if (n.k === 'bush') { kinds.bush.push(n); kinds.berries.push(n); } else if (n.k === 'stump') kinds.lstump.push(n); else kinds[n.k].push(n); }
  for (const k in kinds) { const im = NV.ims[k] = IM(k, kinds[k].length); kinds[k].forEach((n, i) => { const v = NV.map.get(n.id) || {}; v[k] = i; NV.map.set(n.id, v); }); }
  NV.sig = new Map(); syncNodes(s, true);
}
function syncNodes(s, force) {
  for (const n of s.nodes) { const sig = n.k === 'tree' ? (n.alive ? 1 : 0) : n.k === 'bush' ? (n.berry ? 1 : 0) : n.k === 'stump' ? (n.loot ? 1 : 0) : (n.alive ? 1 : 0);
    if (!force && NV.sig.get(n.id) === sig) continue; NV.sig.set(n.id, sig); const v = NV.map.get(n.id);
    if (n.k === 'tree') { const im = NV.ims[n.sub ? 'oak' : 'pine'], k = v[n.sub ? 'oak' : 'pine'], sc = n.s * .85; const sh = SHAKE.get(n.id) || 0, w = sh > 0 ? Math.sin(sh * 40) * sh * .5 : 0;
      if (n.alive) { setI(im, k, n.x, 0, n.z, n.ry, sc, sc, w, w * .6); hideI(NV.ims.stump, v.stump); } else { hideI(im, k); setI(NV.ims.stump, v.stump, n.x, 0, n.z, n.ry, sc); } }
    else if (n.k === 'bush') { setI(NV.ims.bush, v.bush, n.x, 0, n.z, n.ry, n.s); if (n.berry) setI(NV.ims.berries, v.berries, n.x, 0, n.z, n.ry, n.s); else hideI(NV.ims.berries, v.berries); }
    else if (n.k === 'stump') setI(NV.ims.lstump, v.lstump, n.x, 0, n.z, n.ry, n.loot ? 1 : .85, n.loot ? 1 : .7);
    else if (n.k === 'rock') setI(NV.ims.rock, v.rock, n.x, 0, n.z, n.ry, n.s);
    else { const im = NV.ims[n.k]; if (n.alive) setI(im, v[n.k], n.x, 0, n.z, n.ry, 1); else hideI(im, v[n.k]); } }
}
// лагерь
const camp = new THREE.Group(); scene.add(camp);
const addMesh = (key, x, z, ry = 0) => { const m = new THREE.Mesh(GEO[key](), matVC); m.position.set(x, 0, z); m.rotation.y = ry; camp.add(m); return m; };
addMesh('bench', CFG.BENCH.x, CFG.BENCH.z, -.5); addMesh('chest', CFG.CHEST.x, CFG.CHEST.z, .5); addMesh('bed', CFG.BED.x, CFG.BED.z + .2, 0);
const lampMesh = addMesh('lamp', CFG.LAMP.x, CFG.LAMP.z); lampMesh.visible = false;
const imFence = IM('fence', CFG.FENCE_MAX), imTrap = IM('trap', CFG.TRAP_MAX);
function syncBuilds(s) { let f = 0, t = 0; lampMesh.visible = false; for (const b of s.builds) { if (b.k === 'fence') setI(imFence, f++, b.x, 0, b.z, b.ry, 1); else if (b.k === 'trap') setI(imTrap, t++, b.x, 0, b.z, 0, b.cd > 0 ? .7 : 1); else if (b.k === 'lamp') lampMesh.visible = true; } for (; f < CFG.FENCE_MAX; f++) hideI(imFence, f); for (; t < CFG.TRAP_MAX; t++) hideI(imTrap, t); }

// ---------- костёр (вид) ----------
const fireG = new THREE.Group(); scene.add(fireG);
const fireLogs = new THREE.Mesh(merge([part(Cyl(.13, .15, 1.3, 6), C.trunk, 0, .14, 0, 0, 0, Math.PI / 2), part(Cyl(.13, .15, 1.3, 6), C.trunk2, 0, .3, 0, Math.PI / 2, 0, Math.PI / 2), part(Cyl(.12, .14, 1.2, 6), C.trunk, 0, .22, 0, 0, .8, Math.PI / 2), ...Array.from({ length: 8 }, (_, i) => part(Dod(.17), i % 2 ? C.rock : C.rock2, Math.cos(i / 8 * 6.283) * .8, .1, Math.sin(i / 8 * 6.283) * .8, i, i))]), matVC);
fireG.add(fireLogs);
const ringGeo = lv => { const L = [], n = lv === 2 ? 10 : 13, rr = lv === 2 ? 1.0 : 1.25; for (let i = 0; i < n; i++) { const a = i / n * 6.283; L.push(part(Dod(lv === 2 ? .24 : .3), i % 2 ? C.rock : C.rock2, Math.cos(a) * rr, .16, Math.sin(a) * rr, a, a)); } if (lv === 3) L.push(part(Cyl(1.5, 1.6, .18, 12), '#cfd5e3', 0, .05)); return merge(L); };
const fireRing = new THREE.Mesh(ringGeo(2), matVC); fireRing.visible = false; fireG.add(fireRing); let shownLv = 1;
const flameMats = [new THREE.MeshBasicMaterial({ color: 0xff7a2e, fog: false }), new THREE.MeshBasicMaterial({ color: 0xffb13b, fog: false }), new THREE.MeshBasicMaterial({ color: 0xffef7a, fog: false })];
const flames = flameMats.map((m, i) => { const f = new THREE.Mesh(Cone(.42 - i * .1, 1.1 - i * .2, 6), m); f.position.y = .75 - i * .08; fireG.add(f); return f; });
function radialTex(stops, size = 64) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const h = size / 2, gr = x.createRadialGradient(h, h, 0, h, h, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); x.fillStyle = gr; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,200,90,.9)'], [.4, 'rgba(255,150,60,.35)'], [1, 'rgba(255,120,40,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
glow.position.y = 1; fireG.add(glow);
const smoke = new THREE.Mesh(new THREE.CylinderGeometry(.25, .7, 14, 7, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide })); smoke.position.y = 8.5; fireG.add(smoke);
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
const blob = s => { const b = new THREE.Mesh(blobGeo, blobMat); b.scale.set(s, 1, s); b.position.y = .04; b.renderOrder = 1; return b; };
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
function loadPet(pet) {
  if (petCache[pet]) return petCache[pet]; const a = PET_MODELS[pet];
  return petCache[pet] = (async () => { const gltf = await (await getLoader()).loadAsync(a.url); const root = gltf.scene;
    root.traverse(o => { if (o.isMesh) { const ms = (Array.isArray(o.material) ? o.material : [o.material]).map(om => new THREE.MeshLambertMaterial({ color: om.color, vertexColors: !!o.geometry.attributes.color })); o.material = ms.length > 1 ? ms : ms[0]; } });
    root.scale.setScalar(a.scale || 1); const box = new THREE.Box3().setFromObject(root); root.position.y = -box.min.y; return root; })();
}
function placeholderPet() { return new THREE.Mesh(merge([part(Box(.6, .55, .5), '#9aa3b5', 0, .45), part(Box(.6, .5, .55), '#9aa3b5', 0, 1.0), part(Box(.5, .12, .05), '#3d4458', 0, 1.02, .28), part(Cone(.1, .2, 4), '#6f7890', -.2, 1.33, 0), part(Cone(.1, .2, 4), '#6f7890', .2, 1.33, 0)]), matVC); }
const PV = new Map();   // id игрока → вид
function playerView(p) {
  let v = PV.get(p.id); if (v) return v;
  v = { g: new THREE.Group(), body: new THREE.Group(), arms: [], walk: 0, pet: p.pet, zzz: null };
  v.g.add(v.body); v.g.add(blob(1.3)); v.body.add(placeholderPet()); scene.add(v.g);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 7.5, 16, 1, true).translate(0, -3.75, 0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  beam.position.set(0, .9, .3); beam.visible = false; v.g.add(beam); v.beam = beam;
  const zz = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); x.font = '900 34px Nunito, sans-serif'; x.fillStyle = '#fff'; x.strokeStyle = '#7d8cff'; x.lineWidth = 6; x.strokeText('z z', 6, 44); x.fillText('z z', 6, 44); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, fog: false }));
  zz.scale.set(1, 1, 1); zz.position.y = 2; zz.visible = false; v.g.add(zz); v.zzz = zz;
  loadPet(p.pet).then(root => { const m = root.clone(true); v.body.clear(); v.body.add(m); v.arms = []; m.traverse(o => { if (/Arm_[LR]/.test(o.name)) { o.userData.q0 = o.quaternion.clone(); o.userData.side = /_L/.test(o.name) ? 1 : -1; v.arms.push(o); } }); }).catch(e => console.warn('pet', e.message));
  PV.set(p.id, v); return v;
}
function syncPlayers(s, dt) {
  for (const [id, v] of PV) if (!s.players[id]) { scene.remove(v.g); PV.delete(id); }
  for (const p of Object.values(s.players)) { const v = playerView(p); v.g.position.set(p.x, 0, p.z); v.g.rotation.y = p.face;
    const sp = Math.hypot(p.vx, p.vz), asleep = p.sleep > 0 || p.rest > 0; v.walk += dt * sp * 2.4;
    v.body.position.y = sp > .3 ? Math.abs(Math.sin(v.walk)) * .08 : 0; v.body.rotation.z = asleep ? 1.35 : sp > .3 ? Math.sin(v.walk) * .06 : 0; v.body.rotation.x = Math.sin(p.swing * Math.PI) * .3;
    v.body.position.x = asleep ? .5 : 0; v.zzz.visible = asleep; if (asleep) v.zzz.position.y = 1.6 + Math.sin(performance.now() * .003) * .15;
    for (const a of v.arms) { const sw = sp > .3 ? Math.sin(v.walk) * .6 * a.userData.side : 0, hit = p.swing > 0 && a.userData.side < 0 ? -Math.sin(p.swing * Math.PI) * 1.8 : 0; a.quaternion.copy(a.userData.q0).multiply(_q2.setFromEuler(_e.set(sw + hit, 0, 0))); }
    v.beam.visible = p.flash.on; if (p.flash.on) v.beam.material.opacity = .14 + Math.sin(performance.now() * .02) * .02; }
}
// ---------- враги (вид) ----------
const EG = {}; for (const k of ['mist', 'crow', 'moose']) EG[k] = [GEO[k](), GEO[k + 'Eyes']()];
const EV = new Map();
function enemyView(e) {
  let v = EV.get(e.id); if (v) return v; v = { g: new THREE.Group(), body: new THREE.Group(), t: Math.random() * 6 };
  const m = new THREE.Mesh(EG[e.k][0], matVC), eyes = new THREE.Mesh(EG[e.k][1], matGlow); v.body.add(m, eyes); v.g.add(v.body); v.g.add(v.sh = blob(e.k === 'moose' ? 2 : e.k === 'mist' ? 1.2 : .8));
  scene.add(v.g); EV.set(e.id, v); return v;
}
function syncEnemies(s, dt) {
  const alive = new Set(s.enemies.map(e => e.id)); for (const [id, v] of EV) if (!alive.has(id)) { scene.remove(v.g); EV.delete(id); }
  for (const e of s.enemies) { const v = enemyView(e); v.t += dt; v.g.position.set(e.x, 0, e.z); v.g.rotation.y = e.ry; const sc = e.dead ? Math.max(.01, 2 - e.dead) : 1; v.g.scale.setScalar(sc);
    if (e.k === 'mist') { v.body.position.y = Math.abs(Math.sin(v.t * 6)) * .15; v.body.rotation.x = v.t * 3; if (e.st === 'blow') v.body.scale.set(1 + Math.sin(v.t * 12) * .08, 1, 1); }
    else if (e.k === 'crow') { v.body.position.y = e.y; v.sh.visible = e.y < 3; v.body.rotation.z = e.st === 'peck' ? 0 : Math.sin(v.t * 14) * .25; v.body.rotation.x = e.st === 'peck' ? Math.sin(v.t * 10) * .3 : 0; }
    else if (e.k === 'moose') { v.body.position.y = Math.abs(Math.sin(v.t * 3)) * .05; v.body.rotation.x = e.st === 'flee' ? -.15 : e.st === 'blow' ? .12 : 0; } }
}

// ---------- игра: состояние и связь с симуляцией ----------
let S = null;                 // состояние мира (из sim.js)
let mode = 'menu';            // menu | play | pause | over
let pet = localStorage.getItem(PET_KEY) || 'raccoon'; if (!PETS[pet]) pet = 'raccoon';
const cmdQ = [];              // очередь команд → step()
const send = c => cmdQ.push({ pid: PID, ...c });
function initWorld(state) { S = state; S.timeScale = FAST; for (const im of Object.values(NV.ims)) { scene.remove(im); im.geometry.dispose(); } NV.map.clear(); NV.ims = {}; buildNodeViews(S); syncBuilds(S); for (const [id, v] of PV) { scene.remove(v.g); } PV.clear(); for (const [, v] of EV) scene.remove(v.g); EV.clear(); }
function save() { try { localStorage.setItem(SAVE_KEY, SIM.serialize(S)); } catch (e) {} }
function loadSave() { try { const t = localStorage.getItem(SAVE_KEY); if (!t) return null; const s = SIM.deserialize(t); return s.v === 2 ? s : null; } catch (e) { return null; } }
function newGame() { const s = SIM.createState({ seed: 99, timeScale: FAST }); SIM.addPlayer(s, PID, pet); initWorld(s); save(); startPlay(); hint('Собирай ветки и ягоды, корми костёр', 4); }
function continueGame() { const s = loadSave(); if (!s) return newGame(); const p = s.players[PID]; p.x = 0; p.z = 4.2; p.vx = p.vz = 0; p.sleep = p.rest = 0; p.str = Math.max(p.str, 50); p.in = { x: 0, z: 0 }; s.enemies = []; initWorld(s); startPlay(); toast('Ночь ' + S.night + ' / ' + CFG.NIGHTS, 'Прогресс загружен'); }
const me = () => S.players[PID];

// ---------- HUD ----------
const ico = (el, k) => { el.innerHTML = IC[k]; };
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
  $('nTxt').textContent = 'Ночь ' + S.night; const pi = night ? 'moon' : 'sun'; if (pi !== lastPhaseIco) { ico($('nIco'), pi); lastPhaseIco = pi; document.body.classList.toggle('isnight', night); }
  $('phName').textContent = night ? 'Ночь · до рассвета' : 'День · до ночи'; $('phTime').textContent = fmt((len - S.t) / S.timeScale);
  $('tbar').firstChild.style.width = (100 * S.t / len) + '%';
  $('hpb').firstChild.style.width = p.str + '%'; $('hub').firstChild.style.width = p.hunger + '%'; $('fub').firstChild.style.width = (100 * S.fire.fuel / SIM.fireMax(S)) + '%'; $('fLv').textContent = 'Костёр ' + S.fire.lv;
  $('fub').classList.toggle('low', S.fire.fuel / SIM.fireMax(S) < .2);
  for (const [k] of INV) { const v = p.inv[k] || 0; if (lastInv[k] !== v) { if (lastInv[k] !== undefined && v > lastInv[k]) bump(k); lastInv[k] = v; $('iv_' + k).querySelector('b').textContent = v; $('iv_' + k).classList.toggle('zero', !v); } }
  const used = SIM.bagSlots(p.inv), cap = SIM.bagCap(p); $('iv_bag').querySelector('b').textContent = used + '/' + cap; $('iv_bag').classList.toggle('full', used >= cap);
  const food = (p.inv.berry || 0) + (p.inv.pie || 0); $('bEat').querySelector('.n').textContent = food; $('bEat').classList.toggle('off', !food); ico($('bEat').querySelector('.ico'), p.inv.pie > 0 && p.hunger < 60 ? 'pie' : 'berry');
  const bt = $('bTorch'); bt.classList.toggle('hide', !p.has.flash); bt.querySelector('.n').textContent = Math.round(p.flash.charge) + '%'; bt.classList.toggle('down', p.flash.on);
  const sl = p.sleep > 0 || p.rest > 0; $('sleepCard').classList.toggle('hide', !sl);
  if (sl) { $('sleepT').textContent = PETS[p.pet].name + (p.rest > 0 ? ' отдыхает у костра' : ' устал и уснул'); $('sleepS').textContent = p.rest > 0 ? 'Встанет через ' + Math.ceil(p.rest / S.timeScale) + ' с' : 'Грёзы унесут к костру через ' + Math.ceil(p.sleep / S.timeScale) + ' с'; }
}
let hintT = 0; function hint(t, dur = 2.2, warn = false) { const el = $('hint'); el.textContent = t; el.classList.remove('hide'); el.classList.toggle('warn', warn); hintT = dur; }
function toast(t, sub) { const el = $('toast'); el.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 2600); }
const floats = []; for (let i = 0; i < 8; i++) { const el = document.createElement('div'); el.className = 'ft'; el.style.display = 'none'; $('hud').appendChild(el); floats.push({ el, t: 0, p: new THREE.Vector3() }); }
let fIdx = 0; function floatText(txt, x, y, z, bad) { const f = floats[fIdx]; fIdx = (fIdx + 1) % floats.length; f.el.innerHTML = txt; f.el.className = 'ft' + (bad ? ' bad' : ''); f.t = 1.1; f.p.set(x, y, z); f.el.style.display = ''; }
function updFloats(dt) { for (const f of floats) { if (f.t <= 0) continue; f.t -= dt; f.p.y += dt * 1.2; if (f.t <= 0) { f.el.style.display = 'none'; continue; } _v.copy(f.p).project(camera); f.el.style.transform = `translate(${(_v.x * .5 + .5) * innerWidth}px,${(-_v.y * .5 + .5) * innerHeight}px) translate(-50%,-50%)`; f.el.style.opacity = Math.min(1, f.t * 2); } }
const icoTxt = (k, n) => `+${n} <span style="display:inline-block;width:20px;height:20px;vertical-align:-4px">${IC[k]}</span>`;

// ---------- крафт-панель ----------
function renderRecipes() {
  const p = me(); const ch = S.chest;
  $('store').innerHTML = `Рюкзак ${SIM.bagSlots(p.inv)}/${SIM.bagCap(p)} · Сундук: ` + SIM.RES.map(k => `<i>${IC[k]}${ch[k] || 0}</i>`).join('') + (p.inv.pie ? ` · <i>${IC.pie}${p.inv.pie}</i>` : '');
  $('recipes').innerHTML = RECIPES.map(r => { const st = SIM.recipeState(S, p, r);
    const cost = Object.entries(r.cost).map(([k, v]) => { const h = SIM.have(S, p, k); return `<i class="${h >= v ? '' : 'no'}">${IC[k]}${h}/${v}</i>`; }).join('');
    const icon = { pie: 'pie', fire2: 'camp', fire3: 'fire', flash: 'flash', basket: 'bag', basket2: 'bag', fence: 'fence', bench2: 'bench', lamp: 'lamp', trap: 'trap' }[r.id];
    return `<div class="rc ${st.done ? 'done' : ''}"><div class="ic">${IC[icon]}</div><div class="tx"><b>${r.name}</b><em>${r.desc}</em><div class="cost">${cost}</div></div><button data-r="${r.id}" ${st.ok ? '' : 'disabled'}>${st.done ? 'Есть' : st.need || 'Создать'}</button></div>`; }).join('');
  renderRecipes.sig = recipeSig();
}
const recipeSig = () => { const p = me(); return JSON.stringify([p.inv, S.chest, S.fire.lv, S.bench.lv, p.has, S.builds.length, SIM.nearBench(S, p), SIM.nearFire(S, p)]); };
$('recipes').addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (b) send({ t: 'craft', id: b.dataset.r }); });
function openCraft(on) { const el = $('sheet'); on = on ?? !el.classList.contains('on'); if (on) renderRecipes(); el.classList.toggle('on', on); }
$('sClose').onclick = () => openCraft(false);

// ---------- события симуляции → эффекты и подсказки ----------
const RN = { stick: 'ветки', stone: 'камешки', berry: 'ягоды', cloth: 'лоскутки' };
function handleEvents() {
  const evs = S.ev.splice(0); let nodesChanged = false;
  for (const e of evs) {
    if (e.pid && e.pid !== PID && !['spawn'].includes(e.t)) continue;
    switch (e.t) {
      case 'gain': floatText(icoTxt(e.k, e.n), e.x, 1.4, e.z); burst(e.x, .5, e.z, { stick: '#c9824a', stone: '#b9c0d6', berry: '#ff4f6d', cloth: '#ff8fb8' }[e.k], 5, 2); nodesChanged = true; break;
      case 'hit': { const n = S.nodes.find(q => q.id === e.id); if (n) SHAKE.set(n.id, .3); burst(e.x, 1, e.z, '#e8b070', 4, 2.5); burst(e.x, 2.2, e.z, '#6fd35a', 3, 2); break; }
      case 'node': nodesChanged = true; break;
      case 'full': hint('Рюкзак полон — отнеси в сундук у костра', 2.4, true); break;
      case 'fuel': floatText('+' + e.n + ' огня', 0, 2.4, 0); burst(0, 1, 0, '#ffb13b', 8, 1.8); if (e.relit) toast('Костёр снова горит!'); break;
      case 'deposit': { const t = Object.entries(e.moved).map(([k, n]) => n + ' ' + RN[k]).join(', '); hint('В сундук: ' + t, 2.2); burst(CFG.CHEST.x, 1, CFG.CHEST.z, '#ffd36b', 8, 1.5); break; }
      case 'craft': { const fc = Object.entries(e.fromChest || {}); toast(e.name, fc.length ? 'Взято из сундука: ' + fc.map(([k, n]) => n + ' ' + RN[k]).join(', ') : 'Готово!'); const p = me(); burst(p.x, 1, p.z, '#ffd36b', 10, 2); syncBuilds(S); renderRecipes(); break; }
      case 'eat': { const p = me(); floatText(e.k === 'pie' ? 'Пирожок!' : 'Ням!', p.x, 2, p.z); break; }
      case 'msg': hint(e.text, 2, e.warn); break;
      case 'push': { const p = me(); burst(p.x + Math.sin(p.face), .8, p.z + Math.cos(p.face), '#ffffff', 6, 3); break; }
      case 'poof': burst(e.x, .7, e.z, '#d9ccff', 12, 3); burst(e.x, .7, e.z, '#fff6a8', 6, 2); break;
      case 'shoo': burst(e.x, 1.5, e.z, '#3d4670', 5, 2); break;
      case 'steal': floatText('-1 ' + RN[e.k], CFG.CHEST.x, 2, CFG.CHEST.z, true); hint('Ворон таскает из сундука — прогони его!', 2.2, true); break;
      case 'peck': hint('Ворон клюёт костёр!', 1.6, true); break;
      case 'blow': if ((handleEvents.blowT || 0) < performance.now()) { hint('Клубочек мглы задувает костёр — толкни его!', 2, true); handleEvents.blowT = performance.now() + 4000; } break;
      case 'trap': burst(e.x, .3, e.z, '#ffe27a', 8, 2); syncBuilds(S); break;
      case 'scare': { const p = me(); floatText('-27 сил', p.x, 2.2, p.z, true); $('vig').style.opacity = 1; setTimeout(() => $('vig').style.opacity = 0, 350); hint('Лунный Лось напугал! Свети фонариком или беги к свету', 2.6, true); if (navigator.vibrate) try { navigator.vibrate(80); } catch (_) {} break; }
      case 'spawn': if (e.k === 'moose') toast('Лунный Лось вышел к краю света', 'Держи костёр ярким'); else if (PETS[me().pet].warn && e.k === 'mist') hint('Га-га! К костру катится клубочек мглы', 2); break;
      case 'flash': if (e.empty) hint('Фонарик разрядился — заряди его у костра', 2.2, true); break;
      case 'sleep': hint(PETS[me().pet].name + ' устал и уснул…', 2.5, true); break;
      case 'dream': hint('Грёзы унесли к костру — отдых 15 с', 2.5); break;
      case 'wake': hint(PETS[me().pet].name + ' проснулся!', 1.8); break;
      case 'fireOut': hint('Костёр погас! Подбрось веток до конца ночи', 3, true); break;
      case 'openBench': openCraft(true); break;
      case 'night': toast('Ночь ' + e.n, S.fire.fuel > 0 ? 'Держись в круге света!' : 'Костёр погас — разожги его!'); hint(e.n >= 3 ? 'Лось боится света. Клубочки задувают костёр' : 'Ночью силы тают вне круга света', 3); break;
      case 'dawn': nodesChanged = true; save(); toast('Ночь ' + e.n + ' пережита!', 'Прогресс сохранён'); break;
      case 'win': localStorage.removeItem(SAVE_KEY); gameOver(true, e.nights); break;
      case 'lose': gameOver(false, e.nights); break;
    }
  }
  if (nodesChanged) syncNodes(S);
}

// ---------- ввод → команды ----------
const input = { jx: 0, jy: 0, keys: {}, hold: false };
const joy = $('joy'), jbase = $('jbase'), jknob = $('jknob'); let joyId = null, jcx = 0, jcy = 0; const JR = 52;
function joyHome() { const r = joy.getBoundingClientRect(); jbase.style.left = '92px'; jbase.style.top = Math.max(70, r.height - 120) + 'px'; jbase.style.opacity = .55; jknob.style.transform = ''; }
joy.addEventListener('pointerdown', e => { if (joyId !== null) return; joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (_) {} const r = joy.getBoundingClientRect(); jcx = e.clientX; jcy = e.clientY; jbase.style.left = (jcx - r.left) + 'px'; jbase.style.top = (jcy - r.top) + 'px'; jbase.style.opacity = 1; e.preventDefault(); });
joy.addEventListener('pointermove', e => { if (e.pointerId !== joyId) return; let dx = e.clientX - jcx, dy = e.clientY - jcy; const l = Math.hypot(dx, dy); if (l > JR) { dx *= JR / l; dy *= JR / l; } jknob.style.transform = `translate(${dx}px,${dy}px)`; input.jx = dx / JR; input.jy = dy / JR; });
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
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw); const x = +(sy * iy + cy * ix).toFixed(3), z = +(cy * iy - sy * ix).toFixed(3);
  const key = x + ',' + z; if (key !== lastMove) { lastMove = key; send({ t: 'move', x, z }); }
  return Math.min(1, l);
}

// ---------- камера: сзади питомца, мягко доворачивает за ним ----------
const cam = { yaw: 0, pitch: .6, dist: 7.2, look: new THREE.Vector3(0, 1, 3) };
function updCamera(dt, moveAmt) {
  const p = me(); if (moveAmt > .2 && performance.now() - dragT > 1500) { let d = (p.face + Math.PI) - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.yaw += d * Math.min(1, dt * 1.6 * moveAmt); }
  const cp = Math.cos(cam.pitch); _v.set(p.x + Math.sin(cam.yaw) * cp * cam.dist, 1.1 + Math.sin(cam.pitch) * cam.dist, p.z + Math.cos(cam.yaw) * cp * cam.dist);
  camera.position.lerp(_v, 1 - Math.exp(-7 * dt)); cam.look.lerp(_s.set(p.x, 1.1, p.z), 1 - Math.exp(-10 * dt)); camera.lookAt(cam.look);
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
function applyLight(n) {
  scene.background.copy(mixC(n, 'bg')); scene.fog.color.copy(scene.background); scene.fog.near = mixN(n, 'fn'); scene.fog.far = mixN(n, 'ff');
  hemi.color.copy(mixC(n, 'sky')); hemi.groundColor.copy(mixC(n, 'gnd')); hemi.intensity = mixN(n, 'hI'); sun.color.copy(mixC(n, 'sun')); sun.intensity = mixN(n, 'sI');
  stars.material.opacity = sstep(.6, 1, n); fogWall.material.color.copy(scene.background).lerp(_c.set(0xffffff), .35 * (1 - n));
}
let lightRv = 8;
function animFire(dt) {
  const t = performance.now() * .001, fuel = S ? S.fire.fuel : 60, max = S ? SIM.fireMax(S) : 100, lv = S ? S.fire.lv : 1, on = fuel > 0, k = on ? .45 + .55 * Math.sqrt(fuel / max) : 0, big = lv === 3 ? 1.5 : lv === 2 ? 1.2 : 1;
  if (S && lv !== shownLv) { shownLv = lv; fireRing.visible = lv >= 2; if (lv >= 2) { fireRing.geometry.dispose(); fireRing.geometry = ringGeo(lv); } }
  const low = on && fuel / max < .15, flick = low ? (Math.sin(t * 20) > 0 ? 1 : .6) : 1;
  flames.forEach((f, i) => { f.visible = on; const s = k * big * flick * (1 + Math.sin(t * (9 + i * 3) + i) * .12); f.scale.set(s, s * (1 + Math.sin(t * 13 + i * 2) * .15), s); f.rotation.y = t * (1 + i); });
  const LR = S ? SIM.lightR(S) : 8; lightRv += (LR - lightRv) * Math.min(1, dt * 3);
  glow.visible = on; glow.scale.setScalar(2.5 + lightRv * .35); smoke.visible = on; smoke.material.opacity = .06 + .04 * big; smoke.scale.set(big, 1, big);
  const n = nightness(); fireLight.intensity = on ? (1.2 + 28.8 * n) * k * flick * (1 + Math.sin(t * 17) * .06) : 0; fireLight.distance = lightRv * 1.9 + 2;
  const vis = lightRv > .2; safeDisc.visible = safeRing.visible = vis; if (vis) { safeDisc.scale.setScalar(lightRv); safeRing.scale.setScalar(lightRv); }
  safeRing.material.opacity = (.25 + .5 * n) * (low ? flick : 1); safeDisc.material.opacity = .35 + .65 * n;
  const OR = S ? SIM.openR(S) : 16; fogWall.scale.set(OR + .3, 1, OR + .3); fogWall.visible = OR < CFG.MAP;
}

// ---------- кадр ----------
const STEP = 1 / 60; let acc = 0, hudT = 0, tgtT = 0, target = null, actShown = '';
const ACT = { push: ['paw', 'Толкнуть'], fuel: ['fire', 'В костёр'], deposit: ['chest', 'В сундук'], tree: ['axe', 'Рубить'], bush: ['berry', 'Собрать'], branch: ['stick', 'Подобрать'], stone: ['stone', 'Подобрать'], stump: ['cloth', 'Обыскать'], bench: ['bench', 'Верстак'], wake: ['wake', 'Разбудить'], none: ['hand', 'Действие'] };
function updActBtn() { const k = target ? target.kind : 'none'; if (k === actShown) return; actShown = k; const b = $('bAct'); ico(b.querySelector('.ico'), ACT[k][0]); b.querySelector('span').textContent = ACT[k][1]; b.classList.toggle('dim', k === 'none'); }
function frame(dt) {
  if (mode === 'menu') { const a = performance.now() * .00006; camera.position.set(Math.sin(a) * 13, 6.5, Math.cos(a) * 13); camera.lookAt(0, 1.2, 0); applyLight(0); animFire(dt); if (S) { syncPlayers(S, dt); } return; }
  if (mode !== 'play') return;
  const moveAmt = readInput(); if (input.hold && me().cd <= 0 && cmdQ.length === 0) send({ t: 'act' });
  acc += dt; let n = 0; while (acc >= STEP && n < 5) { SIM.step(S, STEP, cmdQ.splice(0)); acc -= STEP; n++; handleEvents(); if (mode !== 'play') return; } if (n >= 5) acc = 0;
  for (const [id, sh] of SHAKE) { const nn = SHAKE.get(id) - dt; if (nn <= 0) SHAKE.delete(id); else SHAKE.set(id, nn); const node = S.nodes.find(q => q.id === id); if (node) { NV.sig.delete(id); } } if (SHAKE.size || NV.dirty) syncNodes(S);
  syncPlayers(S, dt); syncEnemies(S, dt); updCamera(dt, moveAmt);
  if ((tgtT -= dt) <= 0) { tgtT = .08; target = SIM.context(S, PID); updActBtn(); }
  if (target && target.kind !== 'bench') { marker.visible = true; let tx = target.x, tz = target.z; if (target.kind === 'push') { const e = S.enemies.find(q => q.id === target.id); if (e) { tx = e.x; tz = e.z; } } marker.position.x = tx; marker.position.z = tz; marker.scale.setScalar((target.kind === 'fuel' ? 1.6 : target.kind === 'deposit' ? 1.2 : 1) * (1 + Math.sin(performance.now() * .008) * .06)); marker.material.color.set(target.kind === 'push' ? 0xff6b7f : 0xffffff); } else marker.visible = false;
  applyLight(nightness()); animFire(dt); stars.position.copy(camera.position);
  if (hintT > 0 && (hintT -= dt) <= 0) $('hint').classList.add('hide');
  if ((hudT -= dt) <= 0) { hudT = .1; updHUD(); if ($('sheet').classList.contains('on') && recipeSig() !== renderRecipes.sig) renderRecipes(); }
}

// ---------- режимы и меню ----------
$('pets').innerHTML = Object.entries(PETS).map(([k, P]) => `<button class="pet" data-pet="${k}"><img src="img/${k}.webp" alt="">${P.name}<small>${{ raccoon: 'сбор', capybara: 'лагерь', dragon: 'огонь', goose: 'дозор' }[k]}</small></button>`).join('');
const markPet = () => document.querySelectorAll('.pet').forEach(b => b.classList.toggle('on', b.dataset.pet === pet)); markPet();
$('pets').addEventListener('click', e => { const b = e.target.closest('.pet'); if (!b) return; pet = b.dataset.pet; localStorage.setItem(PET_KEY, pet); markPet(); loadPet(pet); });
function startPlay() { mode = 'play'; acc = 0; ['startOv', 'pauseOv', 'overOv', 'loading'].forEach(id => $(id).classList.add('hide')); $('hud').classList.remove('hide'); actShown = ''; lastMove = ''; updHUD(); joyHome(); const p = me(); cam.yaw = 0; camera.position.set(p.x, 6, p.z + 7); cam.look.set(p.x, 1.1, p.z); clock.getDelta(); }
function setPause(on) { if (on && mode !== 'play') return; if (!on && mode !== 'pause') return; mode = on ? 'pause' : 'play'; $('pauseOv').classList.toggle('hide', !on); input.hold = false; if (!on) clock.getDelta(); }
function showMenu() { mode = 'menu'; openCraft(false); $('hud').classList.add('hide'); ['pauseOv', 'overOv'].forEach(id => $(id).classList.add('hide')); $('startOv').classList.remove('hide'); const d = loadSave(); $('bCont').classList.toggle('hide', !d); if (d) $('contInfo').textContent = 'Ночь ' + d.night + ' / ' + CFG.NIGHTS + ' · ' + PETS[d.players[PID].pet].name; if (S) { S.enemies = []; for (const [, v] of EV) scene.remove(v.g); EV.clear(); } }
function gameOver(win, nights) {
  mode = 'over'; input.hold = false; openCraft(false);
  $('overT').textContent = win ? 'Ты пережил 10 ночей!' : 'Костёр погас';
  $('overS').textContent = win ? 'Утро. Костёр горит, лес спокоен.' : `Пережито ночей: ${nights}. Не дай огню погаснуть до рассвета.`;
  const d = !win && loadSave(); $('bRetry').classList.toggle('hide', !d); if (d) $('bRetry').innerHTML = 'С последнего рассвета<small>Ночь ' + d.night + '</small>';
  $('overOv').classList.remove('hide');
}
$('bNew').onclick = newGame; $('bNew2').onclick = newGame; $('bCont').onclick = continueGame; $('bRetry').onclick = continueGame; $('bResume').onclick = () => setPause(false); $('bMenu').onclick = showMenu; $('bMenu2').onclick = showMenu;
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setPause(true); });

// ---------- цикл, FPS, адаптивное качество ----------
const clock = new THREE.Clock(); let fpsAcc = 0, fpsN = 0, fps = 60, lowT = 0; const dbg = $('dbg'); if (DEBUG) dbg.classList.remove('hide');
function loop() {
  requestAnimationFrame(loop); if (document.hidden) return; const raw = clock.getDelta(), dt = Math.min(.05, raw);
  frame(dt); updParts(dt); updFloats(dt); renderer.render(scene, camera);
  fpsAcc += raw; fpsN++; if (fpsAcc >= .5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
    if (!NOADAPT && mode === 'play') { if (fps < 28) lowT += .5; else lowT = 0; if (lowT >= 3 && pixelRatio > .75) { pixelRatio = Math.max(.75, pixelRatio - .35); renderer.setPixelRatio(pixelRatio); resize(); lowT = 0; } }
    if (DEBUG) { const i = renderer.info.render; dbg.textContent = `FPS ${fps.toFixed(0)}  calls ${i.calls}  tris ${i.triangles}  px ${pixelRatio.toFixed(2)}  врагов ${S ? S.enemies.length : 0}  ×${FAST}`; } }
}
// API для тестов и отладки (только чтение/служебное)
window.__g = { scene, input, SIM, get S() { return S; }, get mode() { return mode; }, send, save, loadSave, newGame, continueGame, renderer, camera, cam,
  teleport: (x, z) => { const p = me(); p.x = x; p.z = z; const cp = Math.cos(cam.pitch); camera.position.set(x + Math.sin(cam.yaw) * cp * cam.dist, 1.1 + Math.sin(cam.pitch) * cam.dist, z + Math.cos(cam.yaw) * cp * cam.dist); cam.look.set(x, 1.1, z); },
  look: (yaw, pitch) => { cam.yaw = yaw; if (pitch) cam.pitch = pitch; dragT = performance.now(); },
  stats: () => ({ fps: Math.round(fps), calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, px: pixelRatio }), get target() { return target; }, ready: false };

// подмена процедурных заглушек на GLB художника (js/assets.js): запекаем в одну геометрию и меняем у инстансов/врагов
async function loadStaticAssets() {
  const keys = Object.keys(ASSETS).filter(k => ASSETS[k] && ASSETS[k].url); if (!keys.length) return; const L = await getLoader();
  for (const k of keys) { try { const geo = bakeObject((await L.loadAsync(ASSETS[k].url)).scene, ASSETS[k].scale || 1); GEO[k] = () => geo;
      scene.traverse(o => { if (o.isInstancedMesh && o.userData.key === k) o.geometry = geo; }); if (EG[k]) EG[k] = [geo, new THREE.BufferGeometry()]; } catch (e) { console.warn('asset', k, e.message); } }
}
(async () => {
  showMenu(); loop(); loadStaticAssets();
  try { await Promise.race([loadPet(pet), new Promise(r => setTimeout(r, 6000))]); } catch (e) { console.warn('pet', e.message); }
  $('loading').classList.add('hide'); window.__g.ready = true;
})();
