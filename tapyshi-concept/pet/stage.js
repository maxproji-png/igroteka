// Тапыши · сцена с эволюциями. 3D рендерится только по запросу: на тап WebGL не перерисовываем.
// Сжатие на тап — CSS/WAAPI на обёртке. Смена модели — единственный повод для нового кадра.
import { THREE, makeRenderer, blob } from './kit.js?v=tc11132240';
import { loadEvo, preloadEvo, PETS } from './evo.js?v=tc11132240';
export { THREE };

export async function petStage({ canvas, f = .38, cy = .52, cx = .5, yaw = .32, onTap, petInput = true, pet = 'raccoon', stage = 2 } = {}) {
  const R = makeRenderer(canvas, { exposure: 1.0, alpha: true }); R.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, .05, 50);
  scene.add(new THREE.HemisphereLight('#EAF4FF', '#FFF2E6', 1.35));
  const key = new THREE.DirectionalLight('#FFF1DE', 2.5); key.position.set(-1.2, 4.2, 3.6); key.castShadow = true;
  key.shadow.mapSize.set(512, 512); key.shadow.radius = 6; key.shadow.bias = -.0006; key.shadow.normalBias = .02;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.6, bottom: -1.2, near: .5, far: 14 }); scene.add(key);
  const rim = new THREE.DirectionalLight('#CFE6FF', 3.2); rim.position.set(2.4, 2.6, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#FFFFFF', 1.2); rim2.position.set(-2.6, 1.8, -2.4); scene.add(rim2);
  const fill = new THREE.DirectionalLight('#FFFFFF', .6); fill.position.set(2, 1, 3); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: .1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const soft = blob('rgba(50,70,130,.32)', 1.35); soft.position.y = .002; scene.add(soft);

  // Дешёвое «bloom»: аддитивный ореол на полу (и чуть шире на 5–6 стадиях). Без UnrealBloomPass.
  const haloA = blob('rgba(160,210,255,.55)', 2.1, true); haloA.position.y = .012; haloA.visible = false; scene.add(haloA);
  const haloB = blob('rgba(160,210,255,.32)', 3.1, true); haloB.position.y = .014; haloB.visible = false; scene.add(haloB);

  const holder = new THREE.Group(); holder.rotation.y = yaw; scene.add(holder);
  let current = { pet, stage, object: null };
  const box = new THREE.Box3();
  const pv = new THREE.Vector3();

  function tintHalo(rgb, a, el) {
    // Перекрашиваем текстуру ореола под стихию (один раз на смену модели).
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const mat = el.material;
    if (mat.map) mat.map.dispose();
    mat.map = t; mat.needsUpdate = true;
  }

  function setHalo(petId, stg) {
    const rgb = (PETS[petId] || PETS.raccoon).halo;
    if (stg < 3) { haloA.visible = false; haloB.visible = false; return; }
    tintHalo(rgb, stg >= 5 ? .62 : .42, haloA);
    tintHalo(rgb, stg >= 5 ? .36 : .18, haloB);
    haloA.visible = true;
    haloB.visible = stg >= 5;
  }

  const host = canvas.parentElement;
  let crop = { x: 0, y: 0, w: 1, h: 1 }, FW = 1, FH = 1;

  // Габарит, покрывающий любой поворот вокруг Y: радиус в XZ + высота.
  const _v = new THREE.Vector3();
  function spinExtent(root) {
    if (root.userData.spinExtent) return root.userData.spinExtent;
    let r = 0, y0 = 1e9, y1 = -1e9;
    root.updateWorldMatrix(true, true);
    root.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      const pos = o.geometry.attributes.position;
      o.updateWorldMatrix(true, false);
      const m = o.matrixWorld;
      for (let i = 0; i < pos.count; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(m);
        r = Math.max(r, Math.hypot(_v.x, _v.z));
        y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
      }
    });
    if (!isFinite(r) || r < .4) r = .8;
    return (root.userData.spinExtent = { r, y0: Math.min(0, y0), y1 });
  }
  function worldBox() {
    if (current.object) {
      const e = spinExtent(current.object);
      box.set(new THREE.Vector3(-e.r, e.y0, -e.r), new THREE.Vector3(e.r, e.y1, e.r));
      return box;
    }
    box.set(new THREE.Vector3(-.8, 0, -.8), new THREE.Vector3(.8, 1.2, .8));
    return box;
  }

  // Референс: цилиндр/квадрат, покрывающий все питомцы во всех поворотах
  // (дракон: радиус ~1.13, капибара: высота 1.37). Один масштаб на все стадии.
  const REF = { r: 1.20, h: 1.38 };
  const EYE = .16;

  function safeRect() {
    const app = host.closest('.app') || document.querySelector('.app') || host;
    const topEl = app.querySelector('.top');
    const demo = app.querySelector('#demo');
    const side = app.querySelector('.side');
    const T = (topEl ? topEl.getBoundingClientRect().bottom : 60) + 14;
    const B = (demo ? demo.getBoundingClientRect().top : FH * .76) - 14;
    let sideBox = null;
    if (side) {
      const r = side.getBoundingClientRect();
      const appR = app.getBoundingClientRect();
      sideBox = { left: r.left - appR.left - 8, right: r.right - appR.left + 8, top: r.top - appR.top - 8, bottom: r.bottom - appR.top + 8 };
    }
    return { L: 16, R: FW - 16, T, B, side: sideBox };
  }

  function setCam(d, lookX, lookY) {
    cam.aspect = FW / FH;
    cam.clearViewOffset();
    cam.position.set(lookX, lookY + EYE, d);
    cam.lookAt(lookX, lookY, 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
  function proj(x, y, z) {
    pv.set(x, y, z).project(cam);
    return { x: (pv.x * .5 + .5) * FW, y: (-pv.y * .5 + .5) * FH };
  }
  function boxPoints(min, max, step = 1) {
    const pts = [];
    for (let i = 0; i <= step; i++) for (let j = 0; j <= step; j++) for (let k = 0; k <= step; k++) {
      pts.push([
        min.x + (max.x - min.x) * i / step,
        min.y + (max.y - min.y) * j / step,
        min.z + (max.z - min.z) * k / step
      ]);
    }
    return pts;
  }
  function screenExt(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y, z] of pts) {
      const p = proj(x, y, z);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    return { x0, y0, x1, y1 };
  }
  function overflows(pts, S, { sides = false } = {}) {
    for (const [x, y, z] of pts) {
      const p = proj(x, y, z);
      if (p.x < S.L - .5 || p.x > S.R + .5 || p.y < S.T - .5 || p.y > S.B + .5) return true;
      // Референсный ящик имеет полную ширину на всей высоте, поэтому угол «рога+крыло»
      // ложно задевает боковые кнопки и не даёт крупно посадить модель на высоком экране.
      // Для реальной модели боковые кнопки проверяем.
      if (sides && S.side && p.x < S.side.right && p.x > S.side.left && p.y > S.side.top && p.y < S.side.bottom) return true;
    }
    return false;
  }
  // lookY так, чтобы самая нижняя точка ящика села на S.B (над демо-чипом).
  function plantBottom(d, lookX, pts, S) {
    let lookY = .55;
    for (let i = 0; i < 12; i++) {
      setCam(d, lookX, lookY);
      const ext = screenExt(pts);
      const err = ext.y1 - (S.B - 1);
      if (Math.abs(err) < .4) break;
      const t = Math.tan(cam.fov * Math.PI / 360);
      const px = FH / Math.max(1e-3, 2 * d * t);
      lookY -= err / px;
    }
    return lookY;
  }

  let frame = { d: 6, lookY: .55, lookX: 0, floorY: 0, safe: null };

  function place() {
    FW = host.clientWidth; FH = host.clientHeight;
    const S = safeRect();
    const b = worldBox();
    // Ореол чуть больше кольца/стопы, но не на весь экран — иначе свечение лезет под HUD.
    const foot = Math.max(.45, Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z));
    haloA.scale.setScalar((foot * 2.15) / 2.1);
    haloB.scale.setScalar((foot * 2.7) / 3.1);

    const refMin = { x: -REF.r, y: 0, z: -REF.r }, refMax = { x: REF.r, y: REF.h, z: REF.r };
    const refPts = boxPoints(refMin, refMax, 2);

    // Общий масштаб по референсному ящику (покрытие всех поворотов), ось — между ног.
    let lo = 2.2, hi = 14, bestD = 8, bestY = .55;
    for (let k = 0; k < 18; k++) {
      const d = (lo + hi) / 2;
      const lookY = plantBottom(d, 0, refPts, S);
      setCam(d, 0, lookY);
      if (!overflows(refPts, S, { sides: false })) { bestD = d; bestY = lookY; hi = d; }
      else lo = d;
    }
    const lookX = 0;
    const modelPts = boxPoints(b.min, b.max, 2);
    setCam(bestD, lookX, bestY);
    if (overflows(modelPts, S, { sides: false })) {
      let d2 = bestD;
      for (let k = 0; k < 8 && overflows(modelPts, S, { sides: false }); k++) {
        d2 *= 1.06;
        bestY = plantBottom(d2, lookX, modelPts, S);
        setCam(d2, lookX, bestY);
      }
      bestD = d2;
    }
    setCam(bestD, lookX, bestY);
    frame = { d: bestD, lookY: bestY, lookX, floorY: proj(0, 0, 0).y, safe: S };

    const ext = screenExt(modelPts);
    const m = 18;
    let x0 = Math.max(0, Math.floor(ext.x0 - m)), y0 = Math.max(0, Math.floor(ext.y0 - m));
    let x1 = Math.min(FW, Math.ceil(ext.x1 + m)), y1 = Math.min(FH, Math.ceil(ext.y1 + m));
    crop = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
    for (const c of host.querySelectorAll('canvas.scene')) Object.assign(c.style, { left: crop.x + 'px', top: crop.y + 'px', width: crop.w + 'px', height: crop.h + 'px', right: 'auto', bottom: 'auto' });
    cam.setViewOffset(FW, FH, crop.x, crop.y, crop.w, crop.h); cam.updateProjectionMatrix();
    R.setSize(crop.w, crop.h, false);
  }

  const v = new THREE.Vector3();
  let rect = host.getBoundingClientRect();
  const toScreen = (x, y, z) => { v.set(x, y, z).project(cam); return { x: rect.left + crop.x + (v.x * .5 + .5) * crop.w, y: rect.top + crop.y + (-v.y * .5 + .5) * crop.h }; };
  function headTop() {
    let head = null;
    holder.traverse(o => { if (o.name && /_Head$/.test(o.name)) head = o; });
    if (head) {
      const hb = new THREE.Box3().setFromObject(head);
      v.set((hb.min.x + hb.max.x) * .5, hb.max.y, (hb.min.z + hb.max.z) * .5);
    } else {
      const b = worldBox(); v.set(0, b.max.y, 0);
    }
    v.project(cam);
    return { x: rect.left + crop.x + (v.x * .5 + .5) * crop.w, y: rect.top + crop.y + (-v.y * .5 + .5) * crop.h };
  }

  let raf = 0, spinning = false, spinRaf = 0, userYaw = 0;
  const BASE_YAW = yaw;
  function applyYaw() { holder.rotation.y = BASE_YAW + userYaw; }
  const draw = () => { raf = 0; if (spinning) R.shadowMap.needsUpdate = true; R.render(scene, cam); };
  const requestDraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const SPIN_K = .0085; // рад / пиксель: жест «потянул вправо — мордочка ушла вправо»
  function spinBy(dxPx) {
    userYaw += dxPx * SPIN_K;
    applyYaw();
    spinning = true;
    requestDraw();
  }
  function spinEnd(vxPxPerMs, onSettle) {
    let vel = (vxPxPerMs || 0) * SPIN_K; // рад / мс
    if (Math.abs(vel) < .00025) {
      spinning = false; requestDraw(); onSettle && onSettle(); return;
    }
    if (spinRaf) cancelAnimationFrame(spinRaf);
    let last = performance.now();
    const tick = now => {
      spinRaf = 0;
      const dt = Math.min(32, Math.max(0, now - last)); last = now;
      userYaw += vel * dt;
      vel *= Math.exp(-dt * .0085);
      applyYaw();
      spinning = true;
      requestDraw();
      if (Math.abs(vel) > .00005) spinRaf = requestAnimationFrame(tick);
      else { spinning = false; requestDraw(); onSettle && onSettle(); }
    };
    spinRaf = requestAnimationFrame(tick);
  }
  let onSpinSettle = null;

  let hitE = null;
  function calcHit() {
    const b = worldBox();
    const midY = Math.max(.35, (b.min.y + b.max.y) * .5);
    const c = toScreen(0, midY, 0), top = toScreen(0, b.max.y, 0);
    const side = toScreen(Math.max(Math.abs(b.min.x), Math.abs(b.max.x), .55), midY, 0);
    hitE = { x: c.x, y: c.y, rx: Math.abs(side.x - c.x) * 1.15, ry: Math.abs(c.y - top.y) * 1.15 };
  }

  async function show(petId, stg) {
    const id = PETS[petId] ? petId : 'raccoon';
    const n = Math.max(1, Math.min(6, stg | 0));
    const obj = await loadEvo(id, n);
    if (current.object && current.object !== obj) holder.remove(current.object);
    if (obj.parent !== holder) holder.add(obj);
    current = { pet: id, stage: n, object: obj };
    applyYaw(); // угол, который выкрутили, сохраняется при смене стадии/питомца
    setHalo(id, n);
    place();
    rect = host.getBoundingClientRect();
    calcHit();
    R.shadowMap.needsUpdate = true;
    requestDraw();
    return current;
  }

  await show(pet, stage);
  R.shadowMap.autoUpdate = false;
  addEventListener('resize', () => { place(); rect = host.getBoundingClientRect(); calcHit(); R.shadowMap.needsUpdate = true; requestDraw(); });
  function setHappy(_on) {}

  if (petInput) canvas.addEventListener('pointerdown', e => {
    const dx = (e.clientX - hitE.x) / hitE.rx, dy = (e.clientY - hitE.y) / hitE.ry;
    if (dx * dx + dy * dy <= 1 && onTap) onTap(e);
  }, { passive: true });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Фон: остальные стадии текущего питомца, чтобы листание демо было мгновенным.
  setTimeout(() => preloadEvo(current.pet), 500);

  function measure() {
    const b = worldBox();
    const S = frame.safe, pts = [];
    if (!S) return null;
    // project without view offset? current cam already has view offset; use toScreen via crop.
    // Recompute from stored frame by temporarily... we report screen via current camera + view offset inverted.
    const ext = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    const corners = [];
    for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) {
      const p = toScreen(X, Y, Z);
      // toScreen is viewport CSS (includes crop)
      ext.x0 = Math.min(ext.x0, p.x); ext.x1 = Math.max(ext.x1, p.x);
      ext.y0 = Math.min(ext.y0, p.y); ext.y1 = Math.max(ext.y1, p.y);
      corners.push([+p.x.toFixed(1), +p.y.toFixed(1)]);
    }
    return {
      pet: current.pet, stage: current.stage,
      world: { min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] },
      screen: ext, corners, frame, crop
    };
  }

  return {
    cam, toScreen, headTop, requestDraw, setHappy, hit: () => hitE, show, measure,
    spinBy, spinEnd,
    get yaw() { return userYaw; },
    set onSpinSettle(fn) { onSpinSettle = fn; },
    get current() { return current; },
    preload(petId) { return preloadEvo(petId); }
  };
}
