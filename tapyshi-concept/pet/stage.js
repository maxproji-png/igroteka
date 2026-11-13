// Тапыши v3 · крупный серый енот на прозрачном холсте (фон — CSS)
import { THREE, makeRenderer, loadRaccoon, blob, shockRing } from './kit.js';
export { THREE };
export async function petStage({ canvas, f = .48, cy = .5, cx = .5, yaw = .32, hop = .22, onTap, onHover }) {
  const R = makeRenderer(canvas, { exposure: 1.0, alpha: true }); R.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, .05, 50);
  scene.add(new THREE.HemisphereLight('#EAF4FF', '#FFF2E6', 1.35));
  const key = new THREE.DirectionalLight('#FFF1DE', 2.5); key.position.set(-1.2, 4.2, 3.6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 8; key.shadow.bias = -.0006; key.shadow.normalBias = .02;
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2, bottom: -1, near: .5, far: 12 }); scene.add(key);
  const rim = new THREE.DirectionalLight('#CFE6FF', 3.2); rim.position.set(2.4, 2.6, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#FFFFFF', 1.2); rim2.position.set(-2.6, 1.8, -2.4); scene.add(rim2);
  const fill = new THREE.DirectionalLight('#FFFFFF', .6); fill.position.set(2, 1, 3); scene.add(fill);
  // тень-ловушка на прозрачном «полу»
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: .1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const soft = blob('rgba(50,70,130,.32)', 1.25); soft.position.y = .002; scene.add(soft);
  const pet = await loadRaccoon('models/', { keepMaterials: true });
  pet.root.rotation.y = yaw; pet.hopH = hop; scene.add(pet.root);
  pet.hit.scale.set(1.35, 1.25, 1.5);
  function place() {
    const w = canvas.clientWidth, h = canvas.clientHeight, a = w / h;
    const t = Math.tan(cam.fov * Math.PI / 360), d = 1 / (f * 2 * t), Vh = 2 * d * t;
    const ly = .55 + (cy - .5) * Vh, lx = -(cx - .5) * Vh * a;
    cam.position.set(lx, ly + .16, d); cam.lookAt(lx, ly, 0);
    R.setSize(w, h, false); cam.aspect = a; cam.updateProjectionMatrix();
  }
  place(); addEventListener('resize', place);
  const v = new THREE.Vector3();
  const toScreen = (x, y, z) => { v.set(x, y, z).project(cam); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height }; };
  const headTop = () => toScreen(0, 1.1, 0);
  window.__petScreen = () => toScreen(0, .6, 0);
  // взгляд за пальцем и тапы
  const ray = new THREE.Raycaster(), p2 = new THREE.Vector2();
  function look(e) { const c = toScreen(0, .75, 0); pet.setLook((e.clientX - c.x) / 140, (e.clientY - c.y) / 200); }
  canvas.addEventListener('pointermove', look);
  canvas.addEventListener('pointerdown', e => {
    look(e); const r = canvas.getBoundingClientRect(); p2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(p2, cam);
    if (ray.intersectObject(pet.hit).length && onTap && onTap(e) !== false) { pet.tap(); shockRing(scene, new THREE.Vector3(0, 0, 0), '#FFFFFF'); }
  });
  const clock = new THREE.Clock(); const hooks = [];
  (function frame() { const dt = Math.min(.05, clock.getDelta()); pet.update(dt); hooks.forEach(h => h(dt)); R.render(scene, cam); requestAnimationFrame(frame); })();
  return { pet, cam, toScreen, headTop, onFrame: h => hooks.push(h) };
}
