// Тапыши · сцена с эволюциями. 3D рендерится только по запросу: на тап WebGL не перерисовываем.
// Сжатие на тап — CSS/WAAPI на обёртке. Смена модели — единственный повод для нового кадра.
import { THREE, makeRenderer, blob } from './kit.js?v=tc11132220';
import { loadEvo, preloadEvo, PETS } from './evo.js?v=tc11132220';
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
    const s = stg >= 6 ? 1.2 : stg >= 5 ? 1.05 : stg >= 4 ? .85 : .7;
    haloA.scale.setScalar(s); haloB.scale.setScalar(s * 1.15);
    haloA.visible = true;
    haloB.visible = stg >= 5;
  }

  const host = canvas.parentElement;
  let crop = { x: 0, y: 0, w: 1, h: 1 }, FW = 1, FH = 1;

  function worldBox() {
    box.makeEmpty();
    if (current.object) box.expandByObject(current.object);
    if (box.isEmpty()) box.set(new THREE.Vector3(-.8, 0, -.8), new THREE.Vector3(.8, 1.2, .8));
    return box;
  }

  function place() {
    FW = host.clientWidth; FH = host.clientHeight; const a = FW / FH;
    const t = Math.tan(cam.fov * Math.PI / 360), d = 1 / (f * 2 * t), Vh = 2 * d * t;
    const ly = .55 + (cy - .5) * Vh, lx = -(cx - .5) * Vh * a;
    cam.position.set(lx, ly + .16, d); cam.lookAt(lx, ly, 0);
    cam.aspect = a; cam.clearViewOffset(); cam.updateProjectionMatrix(); cam.updateMatrixWorld();

    // Кадрируем по реальному габариту модели (крылья, рога, кольцо, ореол), с запасом.
    const b = worldBox();
    const acc = () => { const sx = (pv.x * .5 + .5) * FW, sy = (-pv.y * .5 + .5) * FH; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) { pv.set(X, Y, Z).project(cam); acc(); }
    const pad = current.stage >= 5 ? .85 : .4;
    for (const X of [b.min.x - pad, b.max.x + pad]) for (const Z of [b.min.z - pad, b.max.z + pad]) { pv.set(X, 0, Z).project(cam); acc(); }
    // Если макушка залезает под верхний HUD — чуть отодвигаем камеру (не больше 18%).
    // Горизонтальный вылет крыльев не сжимает всю сцену: иначе питомец становится крошечным.
    const safeTop = 88;
    const overflowY = Math.max(0, safeTop - y0);
    if (overflowY > 0) {
      const extra = Math.min(.18, overflowY / FH * 1.3);
      const d2 = d * (1 + extra);
      cam.position.set(lx, ly + .16, d2); cam.lookAt(lx, ly, 0);
      cam.updateMatrixWorld();
      x0 = 1e9; y0 = 1e9; x1 = -1e9; y1 = -1e9;
      for (const X of [b.min.x, b.max.x]) for (const Y of [b.min.y, b.max.y]) for (const Z of [b.min.z, b.max.z]) { pv.set(X, Y, Z).project(cam); acc(); }
      for (const X of [b.min.x - pad, b.max.x + pad]) for (const Z of [b.min.z - pad, b.max.z + pad]) { pv.set(X, 0, Z).project(cam); acc(); }
    }
    const m = 22; x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m)); x1 = Math.min(FW, Math.ceil(x1 + m)); y1 = Math.min(FH, Math.ceil(y1 + m));
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

  let raf = 0;
  const draw = () => { raf = 0; R.render(scene, cam); };
  const requestDraw = () => { if (!raf) raf = requestAnimationFrame(draw); };

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

  return {
    cam, toScreen, headTop, requestDraw, setHappy, hit: () => hitE, show,
    get current() { return current; },
    preload(petId) { return preloadEvo(petId); }
  };
}
