// Тапыши · сцена с эволюциями. 3D подключается только при доступном WebGL —
// иначе 2D-постер, без загрузки three.js / GLTFLoader.
import { webglOK } from './webgl.js';
import { PETS } from './evo.js';
export { webglOK };

function posterUrl(pet, stage) {
  const root = (document.documentElement.dataset.root || './').replace(/\/?$/, '/');
  return `${root}shared/pets/stage/${pet}_${stage}.png`;
}

async function fallbackStage({ canvas, onTap, petInput = true, pet = 'raccoon', stage = 2, onProgress } = {}) {
  const host = canvas.parentElement || canvas;
  canvas.style.display = 'none';
  canvas.style.pointerEvents = 'none';
  host.classList.add('is-fallback');
  let img = host.querySelector('img.pet-poster');
  if (!img) {
    img = document.createElement('img');
    img.className = 'pet-poster';
    img.alt = 'Питомец';
    img.draggable = false;
    host.appendChild(img);
  }
  let current = { pet, stage, object: null };
  let yaw = 0, onSpinSettle = null;

  function box() { return img.getBoundingClientRect(); }
  function toScreen(x, y) {
    const r = box();
    return { x: r.left + r.width / 2 + (x || 0) * r.width * .45, y: r.bottom - (y || 0) * r.height };
  }
  function headTop() {
    const r = box();
    return { x: r.left + r.width / 2, y: r.top + r.height * .08 };
  }
  function hit() {
    const r = box();
    return { x: r.left + r.width / 2, y: r.top + r.height * .48, rx: Math.max(48, r.width * .42), ry: Math.max(64, r.height * .48) };
  }
  async function show(petId, stg) {
    const id = PETS[petId] ? petId : 'raccoon';
    const n = Math.max(1, Math.min(6, stg | 0));
    current = { pet: id, stage: n, object: null };
    img.src = posterUrl(id, n);
    try { if (img.decode) await img.decode(); } catch (e) {}
    if (onProgress) onProgress(1);
    return current;
  }
  function spinEnd(_v, onSettle) { onSettle && onSettle(); onSpinSettle && onSpinSettle(); }

  if (petInput) {
    img.addEventListener('pointerdown', e => { if (onTap) onTap(e); }, { passive: true });
  }
  await show(pet, stage);

  return {
    cam: null, toScreen, headTop, requestDraw() {}, setHappy() {}, hit, show,
    measure() { return { pet: current.pet, stage: current.stage, fallback: true }; },
    relayout() {}, spinBy() {}, spinEnd,
    get yaw() { return yaw; },
    set onSpinSettle(fn) { onSpinSettle = fn; },
    get current() { return current; },
    preload() { return Promise.resolve(); },
    fallback: true
  };
}

export async function petStage(opts = {}) {
  try {
    if (!webglOK()) return await fallbackStage(opts);
    const { create3dStage } = await import('./stage3d.js');
    return await create3dStage(opts);
  } catch (e) {
    console.warn('3D сцена недоступна, показываю 2D-заглушку', e);
    try { return await fallbackStage(opts); } catch (err) { throw e; }
  }
}
