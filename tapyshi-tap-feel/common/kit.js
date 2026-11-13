// Тапыши v2 · общий 3D-набор: рендер, свет, енот с характером, блочные пропсы
import * as THREE from 'three';
import { GLTFLoader } from './lib/addons/loaders/GLTFLoader.js?v=tf11132143mt';
import { RoundedBoxGeometry } from './lib/addons/geometries/RoundedBoxGeometry.js?v=tf11132143mt';
export { THREE };

export const C = (hex) => new THREE.Color(hex);

// ---------- рендер ----------
export function makeRenderer(canvas, { exposure = 1.0, shadows = true, alpha = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = exposure;
  r.shadowMap.enabled = shadows;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}
export function fit(renderer, camera, el) {
  const w = el.clientWidth, h = el.clientHeight;
  renderer.setSize(w, h, false);
  if (camera.isPerspectiveCamera) camera.aspect = w / h;
  else { const k = camera.userData.zoomH || 6; camera.left = -k * w / h / 2; camera.right = k * w / h / 2; camera.top = k / 2; camera.bottom = -k / 2; }
  camera.updateProjectionMatrix();
}

// Градиентное небо (без тонмаппинга — точные пастельные цвета)
export function skyDome(top, mid, bottom, { radius = 60, midAt = 0.52 } = {}) {
  const g = new THREE.SphereGeometry(radius, 32, 20);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { t: { value: C(top) }, m: { value: C(mid) }, b: { value: C(bottom) }, k: { value: midAt } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 t,m,b; uniform float k; varying vec3 vP; void main(){ float y = vP.y*.5+.5; vec3 c = y>k ? mix(m,t,smoothstep(k,1.,y)) : mix(b,m,smoothstep(0.,k,y)); gl_FragColor = vec4(c,1.); }'
  });
  const s = new THREE.Mesh(g, m); s.renderOrder = -10; return s;
}

// Свет: тёплое солнце с мягкой тенью + холодное небо + rim сзади
export function dayLights(scene, { sunPos = [3, 6, 4], sun = '#FFE6C7', sunI = 2.6, sky = '#CFE6FF', ground = '#F7E3CC', hemiI = 1.25, rim = '#B9DCFF', rimI = 2.2, rimPos = [-3, 3.5, -4], shadowSize = 4, bias = -0.0006 } = {}) {
  const hemi = new THREE.HemisphereLight(sky, ground, hemiI); scene.add(hemi);
  const s = new THREE.DirectionalLight(sun, sunI); s.position.set(...sunPos); s.castShadow = true;
  s.shadow.mapSize.set(2048, 2048); s.shadow.radius = 6; s.shadow.bias = bias; s.shadow.normalBias = 0.02;
  const sc = s.shadow.camera; sc.left = -shadowSize; sc.right = shadowSize; sc.top = shadowSize; sc.bottom = -shadowSize; sc.near = 0.5; sc.far = 30;
  scene.add(s); scene.add(s.target);
  const r = new THREE.DirectionalLight(rim, rimI); r.position.set(...rimPos); scene.add(r);
  return { hemi, sun: s, rim: r };
}

// ---------- материалы и примитивы ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color: C(color), roughness: o.rough ?? 0.72, metalness: 0, flatShading: !!o.flat,
    emissive: o.emissive ? C(o.emissive) : C('#000'), emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1 });
  matCache.set(key, m); return m;
}
export function rbox(w, h, d, r, color, o = {}) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, o.seg ?? 3, Math.min(r, Math.min(w, h, d) / 2 - 1e-3)), o.material || mat(color, o));
  m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true; return m;
}
export function mesh(geo, color, o = {}) { const m = new THREE.Mesh(geo, o.material || mat(color, o)); m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true; return m; }
export function at(o, x, y, z, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; return o; }

// Блочное облако
export function cloud(scale = 1, color = '#FFFFFF') {
  const g = new THREE.Group();
  const m = mat(color, { rough: 0.95, emissive: '#F2F7FF', ei: 0.35 });
  [[0, 0, 0, 1.3, .62, .8], [-.62, -.08, .05, .8, .46, .66], [.66, -.1, 0, .86, .42, .7], [.15, .3, 0, .78, .5, .66]].forEach(([x, y, z, w, h, d]) => {
    const b = rbox(w, h, d, .2, color, { material: m, cast: false, recv: false }); b.position.set(x, y, z); g.add(b);
  });
  g.scale.setScalar(scale); return g;
}
// Низкополигональный кустик травы
export function tuft(color = '#6CCB5F', s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = mesh(new THREE.ConeGeometry(.05, .2 + i * .04, 4), color, { flat: true, rough: .8 });
    c.position.set((i - 1) * .05, .1 + i * .02, (i % 2) * .03); c.rotation.z = (i - 1) * .35; g.add(c);
  }
  g.scale.setScalar(s); return g;
}
export function flower(petal = '#FF8FB8', s = 1) {
  const g = new THREE.Group();
  const st = mesh(new THREE.CylinderGeometry(.012, .012, .2, 5), '#5DBB5A'); st.position.y = .1; g.add(st);
  const center = rbox(.06, .05, .06, .02, '#FFD84A'); center.position.y = .22; g.add(center);
  for (let i = 0; i < 4; i++) { const p = rbox(.07, .035, .07, .015, petal); const a = i * Math.PI / 2; p.position.set(Math.cos(a) * .055, .215, Math.sin(a) * .055); g.add(p); }
  g.scale.setScalar(s); return g;
}
export function tree(s = 1, leaf = '#63C96E', leaf2 = '#8EE08A') {
  const g = new THREE.Group();
  const tr = rbox(.18, .6, .18, .05, '#B98A64'); tr.position.y = .3; g.add(tr);
  const a = rbox(.78, .5, .78, .16, leaf); a.position.y = .78; g.add(a);
  const b = rbox(.56, .4, .56, .14, leaf2); b.position.set(.04, 1.12, .02); g.add(b);
  const c = rbox(.3, .26, .3, .1, leaf2); c.position.set(-.02, 1.38, 0); g.add(c);
  // яблочки
  [[.36, .78, .2], [-.3, .7, .3], [.12, .9, .38]].forEach(([x, y, z]) => { const ap = rbox(.1, .1, .1, .04, '#FF6B7E'); ap.position.set(x, y, z); g.add(ap); });
  g.scale.setScalar(s); return g;
}
export function giftBox(s = 1, body = '#FF7EAE', ribbon = '#FFD447') {
  const g = new THREE.Group();
  const b = rbox(.5, .4, .5, .07, body); b.position.y = .2; g.add(b);
  const lid = rbox(.58, .14, .58, .06, body, { emissive: '#FF4F8A', ei: .08 }); lid.position.y = .44; g.add(lid);
  const r1 = rbox(.12, .55, .52, .03, ribbon); r1.position.y = .26; g.add(r1);
  const r2 = rbox(.52, .55, .12, .03, ribbon); r2.position.y = .26; g.add(r2);
  const l1 = rbox(.2, .14, .08, .05, ribbon); l1.position.set(-.1, .58, 0); l1.rotation.z = .5; g.add(l1);
  const l2 = l1.clone(); l2.position.x = .1; l2.rotation.z = -.5; g.add(l2);
  g.scale.setScalar(s); return g;
}
// Мягкое пятно тени / свечения (canvas-текстура)
export function blob(color = 'rgba(40,60,120,.38)', size = 1, glow = false) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
}
// Мягкий спрайт (облако вне фокуса, боке)
export function softSprite(kind = 'cloud', color = '#fff', opacity = 1) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const x = cv.getContext('2d');
  x.filter = kind === 'cloud' ? 'blur(10px)' : 'blur(3px)';
  x.fillStyle = color;
  if (kind === 'cloud') { [[128, 150, 70], [80, 160, 46], [178, 160, 50], [110, 118, 48], [156, 122, 42]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }); x.fillRect(60, 150, 140, 46); }
  else { x.globalAlpha = .9; x.beginPath(); x.arc(128, 128, 100, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }));
}

// ---------- енот ----------
const PALETTE = { // теплее и сочнее исходного серо-синего
  M_Raccoon_Fur: { c: '#B49CDB', rough: .58, sheen: .7 },
  M_Raccoon_Dark: { c: '#5A4790', rough: .65 },
  M_Raccoon_Cream: { c: '#FFEFDB', rough: .55, sheen: .4 },
  M_Raccoon_Mask: { c: '#5B4A8E', rough: .55 },
  M_Nose: { c: '#2B2238', rough: .25, coat: 1 },
  M_InnerEar: { c: '#FF9DB4', rough: .6 },
  M_Eye: { c: '#1A1426', rough: .12, coat: 1 },
  M_EyeHighlight: { c: '#FFFFFF', rough: .2, em: '#FFFFFF' },
  M_Blush: { c: '#FF8FA8', rough: .7 },
  M_Mouth: { c: '#6E1E3A', rough: .5 },
  M_Tongue: { c: '#FF6F8C', rough: .4 }
};
function juicy(m) {
  const p = PALETTE[m.name]; if (!p) return m;
  const n = new THREE.MeshPhysicalMaterial({ color: C(p.c), roughness: p.rough, metalness: 0,
    sheen: p.sheen || 0, sheenColor: C('#FFFFFF'), sheenRoughness: .5, clearcoat: p.coat || 0, clearcoatRoughness: .1 });
  if (p.em) { n.emissive = C(p.em); n.emissiveIntensity = .6; }
  n.name = m.name; return n;
}
export async function loadRaccoon(base = 'models/', opts = {}) {
  const L = new GLTFLoader();
  const [n, h] = await Promise.all(['neutral', 'happy'].map(k => L.loadAsync(base + 'raccoon_' + k + '.glb')));
  return new Pet(n.scene, h.scene, opts);
}
export class Pet {
  constructor(neutral, happy, opts = {}) {
    this.root = new THREE.Group();      // позиция в мире, поворот к пальцу
    this.hop = new THREE.Group();       // прыжок
    this.squash = new THREE.Group();    // сжатие/дыхание
    this.root.add(this.hop); this.hop.add(this.squash);
    this.models = { neutral, happy };
    const box = new THREE.Box3().setFromObject(neutral); const size = box.getSize(new THREE.Vector3());
    const k = 1 / size.y; // высота = 1
    for (const [name, m] of Object.entries(this.models)) {
      m.scale.setScalar(k); m.position.y = -box.min.y * k;
      m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (!opts.keepMaterials) o.material = juicy(o.material); } });
      const parts = {}; m.traverse(o => { const mm = /_(Head|Arm_L|Arm_R|Tail|Body)$/.exec(o.name); if (mm) parts[mm[1]] = { o, r: o.rotation.clone() }; });
      m.userData.parts = parts; m.visible = name === 'neutral'; this.squash.add(m);
    }
    // невидимая зона попадания
    this.hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, .9), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = .55; this.root.add(this.hit);
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.tapT = -9; this.happyUntil = -9; this.t = 0; this.turn = 0; this.hopH = .32;
  }
  setLook(nx, ny) { this.look.tx = THREE.MathUtils.clamp(nx, -1, 1); this.look.ty = THREE.MathUtils.clamp(ny, -1, 1); this.lookAt = this.t; }
  tap() { this.tapT = this.t; this.happyUntil = this.t + .75; }
  rest() {
    this.squash.scale.set(1, 1, 1);
    this.squash.rotation.set(0, 0, 0);
    this.hop.position.y = 0;
    this.hop.rotation.set(0, 0, 0);
    this.models.neutral.visible = true;
    this.models.happy.visible = false;
    for (const m of Object.values(this.models)) {
      const p = m.userData.parts || {};
      for (const part of Object.values(p)) part.o.rotation.copy(part.r);
    }
  }
  update(dt) {
    const t = (this.t += dt);
    const happy = t < this.happyUntil;
    this.models.neutral.visible = !happy; this.models.happy.visible = happy;
    // без пальца — изредка оглядывается сам
    if (t - (this.lookAt ?? -9) > 2.5) { this.look.tx = Math.sin(t * .45) * .55; this.look.ty = Math.sin(t * .31) * .2; }
    const L = this.look; L.x += (L.tx - L.x) * Math.min(1, dt * 5); L.y += (L.ty - L.y) * Math.min(1, dt * 5);
    // дыхание + покачивание
    const br = Math.sin(t * 2.3);
    let sx = 1 + br * .012, sy = 1 + br * .022, hy = 0;
    this.squash.rotation.z = Math.sin(t * 1.15) * .035;
    // реакция на тап: сжатие → прыжок → приземление
    const u = (t - this.tapT) / .55;
    if (u >= 0 && u < 1) {
      if (u < .18) { const q = Math.sin(u / .18 * Math.PI / 2); sy -= .2 * q; sx += .13 * q; }
      else if (u < .8) { const q = (u - .18) / .62; hy = Math.sin(q * Math.PI) * this.hopH; sy += .1 * Math.sin(q * Math.PI) * (1 - q); sx -= .05 * Math.sin(q * Math.PI) * (1 - q); }
      else { const q = Math.sin((u - .8) / .2 * Math.PI); sy -= .1 * q; sx += .07 * q; }
    }
    this.squash.scale.set(sx, sy, sx); this.hop.position.y = hy;
    this.hop.rotation.y = (u >= 0 && u < 1) ? Math.sin(u * Math.PI) * .25 : 0;
    this.squash.rotation.y = L.x * .28;
    for (const m of Object.values(this.models)) {
      const p = m.userData.parts;
      if (p.Head) { p.Head.o.rotation.y = p.Head.r.y + L.x * .5; p.Head.o.rotation.x = p.Head.r.x + L.y * .28; p.Head.o.rotation.z = p.Head.r.z + Math.sin(t * 1.3) * .05; }
      if (p.Arm_L) p.Arm_L.o.rotation.x = p.Arm_L.r.x + Math.sin(t * 2.3) * .07;
      if (p.Arm_R) p.Arm_R.o.rotation.x = p.Arm_R.r.x - Math.sin(t * 2.3) * .07;
      if (p.Tail) p.Tail.o.rotation.y = p.Tail.r.y + Math.sin(t * (happy ? 14 : 3.2)) * (happy ? .5 : .28);
    }
  }
}

// Кольцо-волна на земле при тапе
export function shockRing(scene, pos, color = '#FFFFFF') {
  const m = new THREE.Mesh(new THREE.RingGeometry(.35, .42, 48), new THREE.MeshBasicMaterial({ color: C(color), transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(pos); m.position.y += .01; scene.add(m);
  const t0 = performance.now();
  (function step() { const u = (performance.now() - t0) / 520; if (u >= 1) { scene.remove(m); m.geometry.dispose(); return; }
    m.scale.setScalar(1 + u * 1.6); m.material.opacity = .9 * (1 - u); requestAnimationFrame(step); })();
}

// HTML-метки, привязанные к 3D-объектам
export function anchor(obj, el, camera, canvasEl, offset = new THREE.Vector3()) {
  const v = new THREE.Vector3();
  return () => { obj.getWorldPosition(v); v.add(offset); v.project(camera);
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    const ew = el.offsetWidth / 2 + 18; const x = Math.min(w - ew, Math.max(ew, (v.x * .5 + .5) * w));
    el.style.transform = `translate(${x}px,${(-v.y * .5 + .5) * h}px) translate(-50%,-100%)`; };
}

// Тапы: попадание в енота или в предметы сцены
export function bindTaps(canvas, camera, targets, onMiss) {
  const ray = new THREE.Raycaster(), p = new THREE.Vector2();
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(); p.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(p, camera);
    for (const t of targets) { if (ray.intersectObject(t.obj, true).length) { t.fn(e); return; } }
    onMiss && onMiss(e);
  });
}
// Пружинка для 3D-объекта
export function boing3d(o) { const s0 = o.userData.s0 ?? (o.userData.s0 = o.scale.x); const t0 = performance.now();
  (function step() { const u = (performance.now() - t0) / 450; if (u >= 1) { o.scale.setScalar(s0); return; }
    const k = 1 + Math.sin(u * Math.PI * 2.5) * .18 * (1 - u); o.scale.set(s0 * (2 - k), s0 * k, s0 * (2 - k)); requestAnimationFrame(step); })(); }
