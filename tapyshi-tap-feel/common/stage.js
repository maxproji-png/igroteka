// Тапыши · tap-feel · сцена с Булочкой (та же модель и свет, что в концепте).
// 3D рендерится только по запросу: на тап НЕ перерисовываем WebGL.
// Сжатие на тап — пружина в JS, пишет только transform обёртки (композитор).
import { THREE, makeRenderer, loadRaccoon, blob } from './kit.js?v=tf11132143mt';
export { THREE };
export async function petStage({ canvas, f = .42, cy = .58, cx = .5, yaw = .32, onTap, petInput = true }) {
  const R = makeRenderer(canvas, { exposure: 1.0, alpha: true }); R.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, .05, 50);
  scene.add(new THREE.HemisphereLight('#EAF4FF', '#FFF2E6', 1.35));
  const key = new THREE.DirectionalLight('#FFF1DE', 2.5); key.position.set(-1.2, 4.2, 3.6); key.castShadow = true;
  key.shadow.mapSize.set(512, 512); key.shadow.radius = 6; key.shadow.bias = -.0006; key.shadow.normalBias = .02;
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2, bottom: -1, near: .5, far: 12 }); scene.add(key);
  const rim = new THREE.DirectionalLight('#CFE6FF', 3.2); rim.position.set(2.4, 2.6, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#FFFFFF', 1.2); rim2.position.set(-2.6, 1.8, -2.4); scene.add(rim2);
  const fill = new THREE.DirectionalLight('#FFFFFF', .6); fill.position.set(2, 1, 3); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: .1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const soft = blob('rgba(50,70,130,.32)', 1.25); soft.position.y = .002; scene.add(soft);
  const pet = await loadRaccoon('../common/models/', { keepMaterials: true });
  pet.root.rotation.y = yaw; pet.rest(); scene.add(pet.root);
  pet.hit.scale.set(1.35, 1.25, 1.5);
  // Кадр считается как раньше — на весь экран (та же постановка, что в концепте), но холст
  // занимает только прямоугольник вокруг енота (setViewOffset): меньше пикселей в WebGL-буфере
  // и меньше слой, который масштабируется при сжатии.
  const host = canvas.parentElement;
  let crop = { x: 0, y: 0, w: 1, h: 1 }, FW = 1, FH = 1;
  const pv = new THREE.Vector3();
  function place() {
    FW = host.clientWidth; FH = host.clientHeight; const a = FW / FH;
    const t = Math.tan(cam.fov * Math.PI / 360), d = 1 / (f * 2 * t), Vh = 2 * d * t;
    const ly = .55 + (cy - .5) * Vh, lx = -(cx - .5) * Vh * a;
    cam.position.set(lx, ly + .16, d); cam.lookAt(lx, ly, 0);
    cam.aspect = a; cam.clearViewOffset(); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const X of [-.9, .9]) for (const Y of [0, 1.5]) for (const Z of [-.8, .8]) {
      pv.set(X, Y, Z).project(cam); const sx = (pv.x * .5 + .5) * FW, sy = (-pv.y * .5 + .5) * FH;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const m = 16; x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m)); x1 = Math.min(FW, Math.ceil(x1 + m)); y1 = Math.min(FH, Math.ceil(y1 + m));
    crop = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    for (const c of host.querySelectorAll('canvas.scene')) Object.assign(c.style, { left: crop.x + 'px', top: crop.y + 'px', width: crop.w + 'px', height: crop.h + 'px', right: 'auto', bottom: 'auto' });
    cam.setViewOffset(FW, FH, crop.x, crop.y, crop.w, crop.h); cam.updateProjectionMatrix();
    R.setSize(crop.w, crop.h, false);
  }
  place();
  const v = new THREE.Vector3();
  let rect = host.getBoundingClientRect();
  const toScreen = (x, y, z) => { v.set(x, y, z).project(cam); return { x: rect.left + crop.x + (v.x * .5 + .5) * crop.w, y: rect.top + crop.y + (-v.y * .5 + .5) * crop.h }; };
  const headTop = () => toScreen(0, 1.1, 0);
  let raf = 0;
  const draw = () => { raf = 0; R.render(scene, cam); };
  const requestDraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  // прогрев: компилируем шейдеры и грузим в GPU обе мордочки заранее, чтобы первый тап не дал фриз
// Радостная мордочка запекается в 2D-снимок: на тап WebGL вообще не перерисовывается,
  // смена мордочки — только opacity готового слоя.
  const snap = document.createElement('canvas'); snap.className = 'scene snap';
  canvas.after(snap); Object.assign(snap.style, { left: canvas.style.left, top: canvas.style.top, width: canvas.style.width, height: canvas.style.height, right: 'auto', bottom: 'auto' });
  function bake() {
    pet.models.happy.visible = true; pet.models.neutral.visible = false;
    R.shadowMap.needsUpdate = true; R.render(scene, cam);
    snap.width = canvas.width; snap.height = canvas.height;
    snap.getContext('2d').drawImage(canvas, 0, 0);
    pet.models.happy.visible = false; pet.models.neutral.visible = true;
    R.shadowMap.needsUpdate = true; R.render(scene, cam);
  }
  bake(); R.shadowMap.autoUpdate = false;
  addEventListener('resize', () => { place(); rect = host.getBoundingClientRect(); bake(); });

  // радостная мордочка на время комбо (2 перерисовки за серию, не на каждый тап)
  let happy = false;
  function setHappy(on) { if (on === happy) return; happy = on; snap.classList.toggle('on', on); }

  // попадание по еноту: проекция хит-бокса в экранный эллипс считается один раз,
  // на тап — только арифметика, без raycast и без чтения layout
  let hitE = null;
  function calcHit() {
    const c = toScreen(0, .6, 0), top = toScreen(0, 1.35, 0), side = toScreen(.7, .6, 0);
    hitE = { x: c.x, y: c.y, rx: Math.abs(side.x - c.x) * 1.15, ry: Math.abs(c.y - top.y) * 1.2 };
  }
  calcHit(); addEventListener('resize', calcHit);
  if (petInput) canvas.addEventListener('pointerdown', e => {
    const dx = (e.clientX - hitE.x) / hitE.rx, dy = (e.clientY - hitE.y) / hitE.ry;
    if (dx * dx + dy * dy <= 1 && onTap) onTap(e);
  }, { passive: true });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  return { pet, cam, toScreen, headTop, requestDraw, setHappy, hit: () => hitE };
}
