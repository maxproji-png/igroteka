/**
 * 99 ночей — VFX-модуль (концепт на согласование, не продакшен).
 * Three.js 0.160: огонь и искры, ночной туман, свет костра по уровням из GDD v0.5.
 *
 *   import { createCampfire, createNightFog, GameVFX, CAMPFIRE_LEVELS } from './fx/vfx.js';
 *   const fire = createCampfire(scene, { level: 1 });
 *   fire.setLevel(2);
 *   const fog = createNightFog(scene);
 *   fog.setNight(true);
 *   fire.update(dt); fog.update(dt);
 *   fire.dispose(); fog.dispose();
 */
import * as THREE from 'three';

export const VERSION = '0.6.3-concept';

/**
 * Уровни костра из GDD v0.5, разделы 6–7 (те же радиусы, что в v0.2; уровней по-прежнему три).
 *   ур. 1 — старт этапа 1–6: круг света ~8 м, открытая зона ~16 м;
 *   ур. 2 — ~12 м / ~24 м;
 *   ур. 3 — карта открыта целиком (старт этапа 7–12 с карты): ~16 м / край 24 м.
 * Единицы сцены = метры. intensity — PointLight, distance ≈ 2 × радиус света.
 */
export const CAMPFIRE_LEVELS = {
  // flameScale — общий множитель (1). Рост с уровнем: flameWidth / flameMul (число языков), не высота.
  // flameHeight держим почти плоским, чтобы ур. 3 был пухлым, а не свечой (QA v0.8, конус ночью).
  1: { lightRadius: 8,  openRadius: 16, intensity: 20, distance: 16, flameScale: 1, flameWidth: 0.88, flameHeight: 0.90, flameMul: 0.62, emberMul: 0.75, smokeMul: 0.8 },
  2: { lightRadius: 12, openRadius: 24, intensity: 32, distance: 24, flameScale: 1, flameWidth: 1.06, flameHeight: 0.97, flameMul: 0.85, emberMul: 1.0,  smokeMul: 1.15 },
  3: { lightRadius: 16, openRadius: 24, intensity: 46, distance: 32, flameScale: 1, flameWidth: 1.24, flameHeight: 1.04, flameMul: 1.00, emberMul: 1.25, smokeMul: 1.55 }
};

/** Бюджеты частиц (активных точек). Старые ключи flames/embers/smoke/mist сохранены. */
export const PARTICLE_BUDGET = {
  low:  { flames: 4, embers: 16, smoke: 8,  mist: 0,  mistDense: 4,  rain: 96,  leaves: 8,  moths: 4,  puddles: 0, feedback: 28, flashes: 2, rays: 0, zzz: 1 },
  high: { flames: 8, embers: 36, smoke: 20, mist: 8,  mistDense: 14, rain: 180, leaves: 20, moths: 10, puddles: 4, feedback: 64, flashes: 4, rays: 3, zzz: 2 }
};

/** Погода ночей 1–12 (GDD v0.5). Ночь 8 — лёгкий дождь; 10 — густой туман; 11–12 — туман, ветер, мотыльки. */
export const NIGHT_WEATHER = {
  1:  { rain: false, wind: false, fog: 'off',  moths: false },
  2:  { rain: false, wind: false, fog: 'off',  moths: false },
  3:  { rain: false, wind: false, fog: 'off',  moths: false },
  4:  { rain: false, wind: false, fog: 'off',  moths: false },
  5:  { rain: false, wind: false, fog: 'off',  moths: false },
  6:  { rain: false, wind: false, fog: 'off',  moths: false },
  7:  { rain: false, wind: false, fog: 'off',  moths: false },
  8:  { rain: true,  wind: false, fog: 'off',  moths: false },
  9:  { rain: false, wind: false, fog: 'off',  moths: false },
  10: { rain: false, wind: false, fog: 'dense', moths: false },
  11: { rain: false, wind: true,  fog: 'soft', moths: true  },
  12: { rain: false, wind: true,  fog: 'soft', moths: true  }
};

export function weatherForNight(n) {
  const i = Math.max(1, Math.min(12, n | 0));
  return Object.assign({}, NIGHT_WEATHER[i]);
}

/**
 * Рекомендуемый ореол у пламени (спрайт в игре, не круг света на земле).
 * В v0.7.0 `glow.scale = 2.5 + lightRv * 0.35` на ур. 3 даёт билборд ~8 м (QA1-17 / QA2-09).
 * Яркость держим вплотную к пламени: 2.2 / 2.7 / 3.2 м при полном топливе.
 */
export const CAMPFIRE_HALO = {
  scale: { 1: 2.2, 2: 2.7, 3: 3.2 },
  depthTest: true,
  depthWrite: false,
  renderOrder: -1
};

export function haloScale(level, fuelK = 1) {
  const lv = clamp(level | 0, 1, 3);
  return (2.2 + 0.5 * (lv - 1)) * (0.8 + 0.2 * clamp(fuelK, 0, 1));
}

/**
 * Настроить игровой спрайт ореола: масштаб у пламени, depthTest, рисуется до непрозрачных врагов.
 * Пример в js/game.js animFire: applyCampfireHalo(glow, { level: lv, fuelK: k, on });
 */
export function applyCampfireHalo(sprite, opts = {}) {
  if (!sprite) return 0;
  const on = opts.on !== false;
  const s = haloScale(opts.level ?? 3, opts.fuelK ?? 1);
  sprite.visible = on;
  sprite.scale.setScalar(s);
  const mat = sprite.material;
  if (mat) {
    mat.depthTest = true;
    mat.depthWrite = false;
    mat.transparent = true;
    if ('fog' in mat) mat.fog = false;
    if (opts.opacity != null) mat.opacity = opts.opacity;
  }
  sprite.renderOrder = CAMPFIRE_HALO.renderOrder;
  return s;
}


function R(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function makeDot(size, stops) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const x = cv.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

let _emberTex = null, _smokeTex = null, _glowTex = null, _mistTex = null;
function texEmber() {
  return _emberTex || (_emberTex = makeDot(32, [
    [0, 'rgba(255,230,160,1)'], [0.35, 'rgba(255,150,50,.8)'], [1, 'rgba(255,80,0,0)']
  ]));
}
function texSmoke() {
  return _smokeTex || (_smokeTex = makeDot(64, [
    [0, 'rgba(210,200,190,.55)'], [0.4, 'rgba(180,170,160,.28)'], [1, 'rgba(160,150,140,0)']
  ]));
}
function texGlow() {
  return _glowTex || (_glowTex = makeDot(128, [
    [0, 'rgba(255,170,80,.75)'], [0.45, 'rgba(255,120,40,.32)'],
    [0.85, 'rgba(255,90,20,.08)'], [1, 'rgba(255,80,20,0)']
  ]));
}
function texMist() {
  return _mistTex || (_mistTex = makeDot(128, [
    [0, 'rgba(200,210,230,.5)'], [0.45, 'rgba(180,195,220,.22)'], [1, 'rgba(160,180,210,0)']
  ]));
}

function maxEmbers() { return PARTICLE_BUDGET.high.embers + 8; }
function maxSmoke() { return PARTICLE_BUDGET.high.smoke + 8; }

/**
 * Создаёт костёр и добавляет его группу на сцену.
 * @param {import('three').Scene} scene
 * @param {{level?: 1|2|3, position?: [number,number,number]|THREE.Vector3, quality?: 'low'|'high', lit?: boolean, base?: boolean, ring?: boolean, stones?: boolean, logs?: boolean, light?: boolean, flameScale?: number, flameHeight?: number, flameY?: number}} [opts]
 *   base — диск свечения; ring — кольцо света; stones — камни (и цоколь ур. 3); logs — поленья; light — PointLight.
 *   Все по умолч. true. При false объект не создаётся; setLevel/setFuel/update/dispose безопасны.
 *   flameScale / flameHeight — доп. множители (1 = как в CAMPFIRE_LEVELS). flameY — высота базы языков в метрах (по умолч. 0.36, на поленьях GLB).
 */
export function createCampfire(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const group = new THREE.Group();
  const pos = opts.position;
  if (pos) {
    if (Array.isArray(pos)) group.position.set(pos[0], pos[1], pos[2]);
    else group.position.copy(pos);
  }

  const wantStones = opts.stones !== false;
  const wantLogs = opts.logs !== false;
  const wantLight = opts.light !== false;

  let stoneM = null, base = null;
  const stones = [];
  if (wantStones) {
    stoneM = new THREE.MeshLambertMaterial({ color: 0x6b6762, flatShading: true });
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(R(0.2, 0.28), 0), stoneM);
      s.position.set(Math.cos(a) * 1.02, 0.12, Math.sin(a) * 1.02);
      s.scale.y = 0.7;
      s.rotation.set(R(0, 3), R(0, 3), 0);
      s.castShadow = true;
      group.add(s);
      stones.push(s);
    }
    // простое каменное основание (заметно на ур. 3)
    base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.5, 0.16, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a564f, flatShading: true })
    );
    base.position.y = 0.02;
    base.visible = false;
    group.add(base);
  }

  let logM = null;
  if (wantLogs) {
    logM = new THREE.MeshLambertMaterial({ color: 0x3a2416, flatShading: true, emissive: 0x2a0800 });
    for (let i = 0; i < 5; i++) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.25, 6), logM);
      const a = i / 5 * Math.PI * 2;
      l.position.set(Math.cos(a) * 0.25, 0.32, Math.sin(a) * 0.25);
      l.lookAt(0, 0.95, 0);
      l.rotateX(Math.PI / 2);
      group.add(l);
    }
  }

  // Пухлые короткие языки (референс художника: Flame_* в campfire.glb, кончик ~1.43 м).
  // Тёплый оранжевый, без бледно-жёлтого ядра — иначе аддитив складывается в белый конус.
  const flameY = opts.flameY == null ? 0.36 : +opts.flameY;
  const tongueData = [
    [0.00,  0.00, 0.70, 0.88, 0xff5716, 0.48],
    [0.20,  0.12, 0.44, 0.78, 0xff6218, 0.50],
    [-0.22, 0.10, 0.42, 0.74, 0xff6218, 0.50],
    [0.10, -0.22, 0.42, 0.80, 0xff6c1c, 0.50],
    [-0.16,-0.14, 0.40, 0.70, 0xff6c1c, 0.46],
    [0.00,  0.04, 0.46, 0.70, 0xff7a22, 0.50],
    [0.12,  0.08, 0.28, 0.56, 0xff8626, 0.52],
    [-0.10,-0.06, 0.26, 0.52, 0xff8626, 0.52]
  ];
  const flames = [];
  tongueData.forEach(([x, z, r, h, c, o], i) => {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 5, 1, true).translate(0, h / 2, 0),
      new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: o,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    );
    m.position.set(x, flameY, z);
    m.userData.ph = R(0, 6.28);
    m.userData.sp = R(7, 13);
    m.userData.idx = i;
    m.userData.baseH = h;
    group.add(m);
    flames.push(m);
  });
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.36, 0),
    new THREE.MeshBasicMaterial({
      color: 0xff7a22, transparent: true, opacity: 0.42,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  core.position.y = flameY + 0.22;
  core.scale.y = 0.5;
  core.userData.core = true;
  group.add(core);
  flames.push(core);

  const emberCap = maxEmbers();
  const embers = [];
  const ePos = new Float32Array(emberCap * 3);
  for (let i = 0; i < emberCap; i++) {
    embers.push({ x: R(-0.2, 0.2), y: R(0.2, 1.4), z: R(-0.2, 0.2), vx: R(-0.45, 0.45), vz: R(-0.45, 0.45), v: R(0.7, 1.25), life: Math.random() });
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const emberPts = new THREE.Points(eg, new THREE.PointsMaterial({
    map: texEmber(), color: 0xffd9a0, size: 0.12, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  group.add(emberPts);

  const smokeCap = maxSmoke();
  const smoke = [];
  const sPos = new Float32Array(smokeCap * 3);
  for (let i = 0; i < smokeCap; i++) {
    smoke.push({
      x: R(-0.15, 0.15), y: R(0.4, 2.8), z: R(-0.15, 0.15),
      vx: R(0.02, 0.12), vz: R(-0.06, 0.06), v: R(0.25, 0.5), life: Math.random()
    });
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const smokePts = new THREE.Points(sg, new THREE.PointsMaterial({
    map: texSmoke(), color: 0xffffff, size: 0.7, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true
  }));
  group.add(smokePts);

  const wantBase = opts.base !== false;
  const wantRing = opts.ring !== false;

  let glow = null;
  if (wantBase) {
    glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        map: texGlow(), transparent: true, blending: THREE.AdditiveBlending,
        depthTest: true, depthWrite: false, fog: false
      })
    );
    glow.position.y = 0.03;
    glow.renderOrder = -1;
    group.add(glow);
  }

  let ring = null;
  if (wantRing) {
    ring = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffa050, transparent: true, opacity: 0.18,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    ring.position.y = 0.05;
    group.add(ring);
  }

  let light = null;
  if (wantLight) {
    light = new THREE.PointLight(0xff8a3a, 20, 16, 1.3);
    light.position.set(0, 1.5, 0);
    group.add(light);
  }

  scene.add(group);

  const state = {
    scene,
    group,
    light,
    quality,
    level: 1,
    lit: opts.lit !== false,
    fuel: 1,
    burst: 0,
    t: 0,
    wind: 0,
    disposed: false,
    flames, embers, emberPts, smoke, smokePts, glow, ring, base, stoneM, logM,
    baseVis: true, ringVis: true, glowScale: opts.glowScale == null ? 1 : Math.max(0, +opts.glowScale),
    userFlameScale: opts.flameScale == null ? 1 : Math.max(0, +opts.flameScale),
    userFlameHeight: opts.flameHeight == null ? 1 : Math.max(0, +opts.flameHeight),
    flameY
  };

  const api = {
    get group() { return group; },
    get light() { return light; },
    get level() { return state.level; },
    get lit() { return state.lit; },

    setLevel(n) { applyLevel(state, n); },
    setLit(on) { state.lit = !!on; if (!state.lit && state.light) state.light.intensity = 0; },
    /** 0..1, при низком топливе круг света мерцает (GDD). */
    setFuel(v) { state.fuel = clamp(v, 0, 1); },
    /** Вспышка искр при подбросе топлива. */
    burst() { state.burst = 1; kickEmbers(state); },
    /** 0..1, ветер клонит пламя (ночи 11–12). */
    setWind(v) { state.wind = clamp(v, 0, 1); },
    /** Показать/скрыть диск свечения, если он был создан (иначе no-op). */
    setBaseVisible(on) {
      state.baseVis = !!on;
      if (state.glow && !state.baseVis) state.glow.visible = false;
    },
    /** Показать/скрыть кольцо границы света, если оно было создано (иначе no-op). */
    setRingVisible(on) {
      state.ringVis = !!on;
      if (state.ring && !state.ringVis) state.ring.visible = false;
    },
    /** Множитель диска свечения пака (1 = как раньше, радиус света). 0 прячет. */
    setGlowScale(s) { state.glowScale = Math.max(0, +s); },
    /** Общий множитель пламени поверх уровня (1 = как в таблице). */
    setFlameScale(s) { state.userFlameScale = Math.max(0, +s); },
    /** Множитель только высоты языков (1 = как в таблице; меньше — пухлее). */
    setFlameHeight(s) { state.userFlameHeight = Math.max(0, +s); },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; applyLevel(state, state.level); },
    update(dt) { tickFire(state, dt); },
    dispose() { disposeCampfire(state); }
  };

  applyLevel(state, opts.level ?? 1);
  return api;
}

function applyLevel(state, n) {
  const level = clamp(n | 0, 1, 3);
  state.level = level;
  const L = CAMPFIRE_LEVELS[level];
  const bud = PARTICLE_BUDGET[state.quality];
  state.emberCount = Math.max(4, Math.round(bud.embers * L.emberMul));
  state.smokeCount = Math.max(4, Math.round(bud.smoke * L.smokeMul));
  const cap = bud.flames;
  const fMul = L.flameMul == null ? 1 : L.flameMul;
  state.flameCount = Math.max(3, Math.min(cap, Math.round(cap * fMul)));
  state.flameScale = L.flameScale == null ? 1 : L.flameScale;
  state.levelFlameWidth = L.flameWidth == null ? 1 : L.flameWidth;
  state.levelFlameHeight = L.flameHeight == null ? 1 : L.flameHeight;
  state.baseIntensity = L.intensity;
  state.lightDistance = L.distance;
  state.lightRadius = L.lightRadius;
  if (state.light) state.light.distance = L.distance;
  if (state.base) state.base.visible = level >= 3;
  if (state.ring) state.ring.scale.setScalar(L.lightRadius);
  if (state.glow) state.glow.scale.setScalar(L.lightRadius);
}

function kickEmbers(state) {
  const n = Math.min(state.emberCount, state.embers.length);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.55) {
      const e = state.embers[i];
      e.life = 0;
      e.x = R(-0.28, 0.28);
      e.z = R(-0.28, 0.28);
      e.y = R(0.3, 0.7);
      e.vx = R(-1.1, 1.1);
      e.vz = R(-1.1, 1.1);
      e.v = R(1.0, 1.8);
    }
  }
}

function tickFire(state, dt) {
  if (state.disposed) return;
  const d = Math.min(0.05, dt || 0.016);
  state.t += d;
  state.burst = Math.max(0, state.burst - d * 1.4);
  const lit = state.lit;
  const fuel = lit ? state.fuel : 0;
  const low = fuel < 0.22 ? 0.65 + 0.35 * Math.sin(state.t * 14) : 1;
  const flick = 0.85 + 0.15 * Math.sin(state.t * 17) + 0.08 * Math.sin(state.t * 31);
  const userS = state.userFlameScale == null ? 1 : state.userFlameScale;
  const userH = state.userFlameHeight == null ? 1 : state.userFlameHeight;
  const sx0 = (state.flameScale || 1) * (state.levelFlameWidth || 1) * userS;
  const sy0 = (state.flameScale || 1) * (state.levelFlameHeight || 1) * userS * userH;

  state.flames.forEach((f) => {
    if (f.userData.core) {
      f.visible = lit;
      if (lit) {
        const cx = sx0 * (0.95 + 0.08 * Math.sin(state.t * 17));
        const cy = sy0 * 0.5 * (0.96 + 0.06 * Math.cos(state.t * 15));
        f.scale.set(cx, cy, cx);
      }
      return;
    }
    const on = lit && f.userData.idx < state.flameCount;
    f.visible = on;
    if (!on) return;
    const u = f.userData;
    const wobX = 1 + 0.12 * Math.sin(state.t * u.sp + u.ph) + 0.06 * Math.sin(state.t * u.sp * 2.3 + u.ph);
    const wobY = 1 + 0.08 * Math.sin(state.t * u.sp * 0.9 + u.ph);
    const burstW = 0.92 + state.burst * 0.18;
    const burstH = 0.94 + state.burst * 0.10;
    f.scale.set(sx0 * burstW * wobX, sy0 * burstH * wobY, sx0 * burstW * wobX);
    f.rotation.z = (state.wind || 0) * 0.35 + Math.sin(state.t * 1.3) * (state.wind || 0) * 0.12;
  });

  if (state.light) {
    if (lit) {
      state.light.intensity = (state.baseIntensity * (0.55 + 0.45 * fuel) * flick + state.burst * 16) * low;
      state.light.distance = state.lightDistance * (0.75 + 0.25 * fuel);
    } else {
      state.light.intensity = 0;
    }
  }

  const glowOp = lit ? (0.4 + 0.3 * flick) * (0.45 + 0.55 * fuel) * low : 0;
  if (state.glow) {
    state.glow.visible = lit && state.baseVis;
    if (state.glow.visible) {
      const gs = state.glowScale == null ? 1 : state.glowScale;
      state.glow.scale.setScalar((state.lightRadius || 8) * (0.95 + 0.08 * flick + state.burst * 0.15) * gs);
      state.glow.material.opacity = glowOp * Math.min(1, gs);
    }
  }
  if (state.ring) {
    state.ring.visible = lit && state.ringVis;
    if (state.ring.visible) {
      state.ring.scale.setScalar(Math.max(0.2, (state.lightRadius || 8) * (0.75 + 0.25 * fuel)));
      state.ring.material.opacity = lit ? (0.1 + 0.1 * fuel) * low : 0;
    }
  }

  const ea = state.emberPts.geometry.attributes.position;
  const eN = lit ? state.emberCount : 0;
  for (let i = 0; i < state.embers.length; i++) {
    const e = state.embers[i];
    if (i >= eN) { ea.setXYZ(i, 0, -10, 0); continue; }
    e.life += d * e.v * 0.9;
    if (e.life > 1 || e.y > 2.35) {
      e.life = 0;
      e.x = R(-0.25, 0.25);
      e.z = R(-0.25, 0.25);
      e.y = R(0.2, 0.55);
      e.vx = R(-0.7, 0.7);
      e.vz = R(-0.7, 0.7);
      e.v = R(0.65, 1.25);
    }
    e.vx += R(-0.15, 0.15) * d;
    e.vz += R(-0.15, 0.15) * d;
    e.x += e.vx * d;
    e.z += e.vz * d;
    e.y += d * e.v * 1.15; // высота не растёт вместе с ур. 3 (scale), иначе складывается столб
    ea.setXYZ(i, e.x, e.y, e.z);
  }
  ea.needsUpdate = true;
  state.emberPts.geometry.setDrawRange(0, eN);

  const sa = state.smokePts.geometry.attributes.position;
  const sN = lit ? state.smokeCount : 0;
  for (let i = 0; i < state.smoke.length; i++) {
    const e = state.smoke[i];
    if (i >= sN) { sa.setXYZ(i, 0, -10, 0); continue; }
    e.life += d * e.v * 0.38;
    if (e.life > 1 || e.y > 3.0) {
      e.life = 0;
      e.x = R(-0.28, 0.28);
      e.z = R(-0.28, 0.28);
      e.y = R(0.5, 0.9);
      e.vx = R(0.08, 0.28);
      e.vz = R(-0.18, 0.18);
    }
    e.x += e.vx * d;
    e.z += e.vz * d;
    e.y += d * (0.45 + e.v);
    sa.setXYZ(i, e.x, e.y, e.z);
  }
  sa.needsUpdate = true;
  state.smokePts.geometry.setDrawRange(0, sN);
  state.smokePts.material.opacity = lit ? 0.38 + 0.12 * fuel : 0;
  state.smokePts.visible = lit && sN > 0;
}

function disposeObj(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        // общие CanvasTexture не диспоузим — они переиспользуются
        if (m.map && m.map !== _emberTex && m.map !== _smokeTex && m.map !== _glowTex && m.map !== _mistTex) {
          m.map.dispose();
        }
        m.dispose();
      });
    }
  });
}

function disposeCampfire(state) {
  if (state.disposed) return;
  state.disposed = true;
  if (state.group.parent) state.group.parent.remove(state.group);
  disposeObj(state.group);
}

const DAY_FOG = { color: 0xb8c6b8, near: 24, far: 100 };
const NIGHT_FOG = { color: 0x111c30, near: 6, far: 40 };
const SOFT_FOG = { color: 0x1a2438, near: 5, far: 32 };
const DENSE_FOG = { color: 0x2a3348, near: 4, far: 22 };
const DAWN_FOG = { color: 0xc4a070, near: 14, far: 60 };

/**
 * Ночной туман: обновляет scene.fog и (на high) добавляет низкие спрайты-простыни.
 * @param {import('three').Scene} scene
 * @param {{quality?: 'low'|'high', day?: {color:number,near:number,far:number}, night?: {color:number,near:number,far:number}, radius?: number}} [opts]
 */
export function createNightFog(scene, opts = {}) {
  const day = Object.assign({}, DAY_FOG, opts.day || {});
  const night = Object.assign({}, NIGHT_FOG, opts.night || {});
  const radius = opts.radius ?? 10;
  const prevFog = scene.fog;
  const fog = new THREE.Fog(day.color, day.near, day.far);
  scene.fog = fog;

  const sprites = [];
  const nMax = PARTICLE_BUDGET.high.mistDense;
  for (let i = 0; i < nMax; i++) {
    const mat = new THREE.SpriteMaterial({
      map: texMist(), transparent: true, opacity: 0, depthWrite: false, fog: false
    });
    const sp = new THREE.Sprite(mat);
    const a = i / nMax * Math.PI * 2;
    const r = radius * (0.7 + (i % 3) * 0.18);
    sp.position.set(Math.cos(a) * r, 0.7, Math.sin(a) * r);
    sp.scale.set(R(4.5, 7), R(1.4, 2.2), 1);
    sp.userData = { a, r, ph: R(0, 6.28), sp: R(0.05, 0.14) };
    sp.visible = false;
    scene.add(sp);
    sprites.push(sp);
  }

  const state = {
    scene, fog, prevFog, day, night, sprites,
    quality: opts.quality === 'low' ? 'low' : 'high',
    n: 0, target: 0, t: 0, disposed: false,
    preset: 'night',
    _dayC: new THREE.Color(day.color),
    _nightC: new THREE.Color(night.color),
    _softC: new THREE.Color(SOFT_FOG.color),
    _denseC: new THREE.Color(DENSE_FOG.color),
    _dawnC: new THREE.Color(DAWN_FOG.color)
  };

  const api = {
    setNight(onOrAmount) {
      state.target = typeof onOrAmount === 'number' ? clamp(onOrAmount, 0, 1) : (onOrAmount ? 1 : 0);
      if (state.target < 0.01) state.preset = 'night';
    },
    /** 'night' | 'soft' | 'dense' | 'dawn' — густой туман ночи 10 = 'dense'. */
    setPreset(name) {
      state.preset = name === 'dense' || name === 'soft' || name === 'dawn' ? name : 'night';
    },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; applyFog(state, true); },
    update(dt) { tickFog(state, dt); },
    dispose() { disposeFog(state); }
  };
  applyFog(state, true);
  return api;
}

function nightFogParams(state) {
  if (state.preset === 'dense') return { color: state._denseC, near: DENSE_FOG.near, far: DENSE_FOG.far, sprites: state.quality === 'low' ? PARTICLE_BUDGET.low.mistDense : PARTICLE_BUDGET.high.mistDense, op: 0.42 };
  if (state.preset === 'soft') return { color: state._softC, near: SOFT_FOG.near, far: SOFT_FOG.far, sprites: state.quality === 'low' ? 0 : PARTICLE_BUDGET.high.mist, op: 0.28 };
  if (state.preset === 'dawn') return { color: state._dawnC, near: DAWN_FOG.near, far: DAWN_FOG.far, sprites: state.quality === 'low' ? 0 : 6, op: 0.18 };
  return { color: state._nightC, near: state.night.near, far: state.night.far, sprites: state.quality === 'low' ? 0 : PARTICLE_BUDGET.high.mist, op: 0.28 };
}

function applyFog(state, snap) {
  const u = snap ? state.target : state.n;
  const P = nightFogParams(state);
  const col = state.fog.color;
  col.copy(state._dayC).lerp(P.color, u);
  state.fog.near = lerp(state.day.near, P.near, u);
  state.fog.far = lerp(state.day.far, P.far, u);
  const mistN = P.sprites;
  const op = mistN > 0 ? Math.max(0, (u - 0.25) * P.op) : 0;
  state.sprites.forEach((sp, i) => {
    sp.visible = i < mistN && op > 0.01;
    sp.material.opacity = op;
  });
}

function tickFog(state, dt) {
  if (state.disposed) return;
  const d = Math.min(0.05, dt || 0.016);
  state.t += d;
  const k = 1 - Math.exp(-d * 1.5);
  state.n += (state.target - state.n) * k;
  applyFog(state, false);
  if (state.quality === 'low') return;
  const tm = state.t;
  state.sprites.forEach((sp) => {
    if (!sp.visible) return;
    const u = sp.userData;
    u.a += u.sp * d * 0.15;
    sp.position.x = Math.cos(u.a) * u.r + Math.sin(tm * u.sp + u.ph) * 0.4;
    sp.position.z = Math.sin(u.a) * u.r + Math.cos(tm * u.sp + u.ph) * 0.4;
  });
}

function disposeFog(state) {
  if (state.disposed) return;
  state.disposed = true;
  state.sprites.forEach((sp) => {
    if (sp.parent) sp.parent.remove(sp);
    sp.material.dispose();
  });
  state.sprites.length = 0;
  if (state.scene.fog === state.fog) state.scene.fog = state.prevFog || null;
}


let _rainTex = null, _rainStreakTex = null, _leafTex = null, _mothTex = null, _pingTex = null;
function texRain() {
  return _rainTex || (_rainTex = makeDot(16, [
    [0, 'rgba(200,220,255,.7)'], [0.5, 'rgba(180,200,230,.25)'], [1, 'rgba(160,180,210,0)']
  ]));
}
function texRainStreak() {
  if (_rainStreakTex) return _rainStreakTex;
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 64;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(8, 0, 8, 64);
  g.addColorStop(0, 'rgba(230,242,255,0)');
  g.addColorStop(0.18, 'rgba(210,230,255,.3)');
  g.addColorStop(0.5, 'rgba(220,238,255,.9)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  x.fillStyle = g;
  x.fillRect(5, 0, 6, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  _rainStreakTex = tex;
  return tex;
}
function texLeaf() {
  if (_leafTex) return _leafTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const x = cv.getContext('2d');
  x.fillStyle = '#6a8a3a';
  x.beginPath();
  x.moveTo(16, 4);
  x.quadraticCurveTo(28, 16, 16, 28);
  x.quadraticCurveTo(6, 16, 16, 4);
  x.fill();
  _leafTex = new THREE.CanvasTexture(cv);
  _leafTex.needsUpdate = true;
  return _leafTex;
}
function texMoth() {
  return _mothTex || (_mothTex = makeDot(32, [
    [0, 'rgba(230,220,255,1)'], [0.35, 'rgba(180,170,255,.7)'], [1, 'rgba(140,130,255,0)']
  ]));
}
function texPing() {
  return _pingTex || (_pingTex = makeDot(64, [
    [0, 'rgba(255,236,180,1)'], [0.35, 'rgba(255,210,120,.45)'], [1, 'rgba(255,180,80,0)']
  ]));
}

function maxRain() { return PARTICLE_BUDGET.high.rain; }
function maxLeaves() { return PARTICLE_BUDGET.high.leaves; }
function maxMoths() { return PARTICLE_BUDGET.high.moths; }

/**
 * Лёгкий дождь: штрихи (InstancedMesh, 1 draw call) в объёме вокруг камеры/цели, не по всей карте.
 * setActive(false) прячет слой. setCamera / setFollow задают центр объёма.
 */
export function createRain(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const cap = maxRain();
  const radius = opts.area ?? opts.radius ?? 7.5;
  const height = opts.height ?? 9;
  const list = [];
  for (let i = 0; i < cap; i++) {
    list.push({ x: 0, y: 0, z: 0, v: 10, len: 0.5, wx: 0, wz: 0 });
  }

  const geo = new THREE.PlaneGeometry(0.04, 1);
  const mat = new THREE.MeshBasicMaterial({
    map: texRainStreak(),
    color: 0xe8f3ff,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const mesh = new THREE.InstancedMesh(geo, mat, cap);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.count = 0;
  scene.add(mesh);

  const dummy = new THREE.Object3D();
  const fall = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const side = new THREE.Vector3();
  const front = new THREE.Vector3();

  const puddles = [];
  if (PARTICLE_BUDGET.high.puddles) {
    const ptex = makeDot(64, [[0, 'rgba(80,100,130,.28)'], [0.55, 'rgba(60,80,110,.1)'], [1, 'rgba(40,60,80,0)']]);
    for (let i = 0; i < PARTICLE_BUDGET.high.puddles; i++) {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(R(0.35, 0.7), 10).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: ptex, transparent: true, opacity: 0, depthWrite: false })
      );
      m.position.set(R(-6, 6), 0.02, R(-6, 6));
      m.visible = false;
      scene.add(m);
      puddles.push(m);
    }
  }

  const state = {
    scene, mesh, list, puddles, quality,
    active: 0, target: 0, disposed: false,
    radius, height, camera: opts.camera || null, follow: opts.follow || null,
    windX: 0.35, windZ: 0.15, dummy, fall, toCam, side, front
  };

  function origin() {
    const c = state.camera;
    if (c && c.position) return c.position;
    const f = state.follow;
    if (f && f.position) return f.position;
    if (f && f.x != null) return f;
    return null;
  }

  function respawn(e, atTop) {
    const o = origin();
    const ox = o ? o.x : 0, oz = o ? o.z : 0, oy = o ? o.y : 3.5;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * state.radius;
    e.x = ox + Math.cos(a) * r;
    e.z = oz + Math.sin(a) * r;
    e.y = atTop ? oy + R(1.2, state.height) : oy + R(-1.5, state.height);
    e.v = R(10, 16);
    e.len = R(0.45, 0.85);
    e.wx = state.windX + R(-0.5, 0.5);
    e.wz = state.windZ + R(-0.4, 0.4);
  }

  for (let i = 0; i < cap; i++) respawn(list[i], false);

  function place(i, hide) {
    const e = state.list[i];
    const d = state.dummy;
    if (hide) {
      d.position.set(0, -40, 0);
      d.scale.set(0.001, 0.001, 0.001);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      state.mesh.setMatrixAt(i, d.matrix);
      return;
    }
    state.fall.set(e.wx, -e.v, e.wz).normalize();
    const o = origin();
    if (o) state.toCam.set(o.x - e.x, o.y - e.y, o.z - e.z);
    else state.toCam.set(0.3, 0.2, 1);
    if (state.toCam.lengthSq() < 1e-5) state.toCam.set(0, 0, 1);
    state.side.crossVectors(state.toCam, state.fall);
    if (state.side.lengthSq() < 1e-6) state.side.set(1, 0, 0);
    else state.side.normalize();
    state.front.crossVectors(state.fall, state.side).normalize();
    d.matrix.makeBasis(state.side, state.fall, state.front);
    const w = state.quality === 'low' ? 1.25 : 1;
    const el = d.matrix.elements;
    // масштабируем базис: X *= w, Y *= len (штрих), Z = 1
    el[0] *= w; el[1] *= w; el[2] *= w;
    el[4] *= e.len; el[5] *= e.len; el[6] *= e.len;
    d.matrix.setPosition(e.x, e.y, e.z);
    state.mesh.setMatrixAt(i, d.matrix);
  }

  return {
    setActive(on) { state.target = on ? 1 : 0; },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; },
    setCamera(cam) { state.camera = cam || null; },
    setFollow(obj) { state.follow = obj || null; },
    setWind(x, z) { if (x != null) state.windX = +x; if (z != null) state.windZ = +z; },
    update(dt) {
      if (state.disposed) return;
      const d = Math.min(0.05, dt || 0.016);
      state.active += (state.target - state.active) * Math.min(1, d * 2);
      const n = state.active > 0.02 ? (state.quality === 'low' ? PARTICLE_BUDGET.low.rain : PARTICLE_BUDGET.high.rain) : 0;
      state.mesh.visible = n > 0 && state.active > 0.02;
      state.mesh.material.opacity = 0.78 * state.active;
      const o = origin();
      const ox = o ? o.x : 0, oz = o ? o.z : 0;
      const rad2 = (state.radius + 1.6) * (state.radius + 1.6);
      for (let i = 0; i < state.list.length; i++) {
        if (i >= n) { place(i, true); continue; }
        const e = state.list[i];
        e.y -= e.v * d;
        e.x += e.wx * d;
        e.z += e.wz * d;
        const dx = e.x - ox, dz = e.z - oz;
        if (e.y < 0.04 || dx * dx + dz * dz > rad2) respawn(e, true);
        place(i, false);
      }
      state.mesh.count = n;
      state.mesh.instanceMatrix.needsUpdate = true;
      const puddleN = state.quality === 'low' ? 0 : PARTICLE_BUDGET.high.puddles;
      state.puddles.forEach((m, i) => {
        m.visible = i < puddleN && state.active > 0.2;
        m.material.opacity = 0.28 * state.active;
        if (m.visible && o && i === 0) {
          // лёгкие лужи держатся у ног/камеры, не по всей карте
        }
      });
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.mesh.parent) state.mesh.parent.remove(state.mesh);
      state.mesh.geometry.dispose();
      state.mesh.material.dispose();
      state.puddles.forEach((m) => {
        if (m.parent) m.parent.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      });
    }
  };
}

/**
 * Листья на ветру (ночи 11–12).
 */
export function createLeaves(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const cap = maxLeaves();
  const pos = new Float32Array(cap * 3);
  const list = [];
  for (let i = 0; i < cap; i++) {
    list.push({
      x: R(-10, 10), y: R(0.6, 4), z: R(-10, 10),
      vx: R(1.2, 2.4), vy: R(-0.3, 0.2), vz: R(-0.4, 0.4),
      ph: R(0, 6.28)
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: texLeaf(), color: 0xffffff, size: 0.22, transparent: true,
    opacity: 0.9, depthWrite: false, sizeAttenuation: true
  }));
  pts.visible = false;
  scene.add(pts);
  const state = { pts, list, quality, active: 0, target: 0, t: 0, disposed: false };
  return {
    setActive(on) { state.target = on ? 1 : 0; },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; },
    update(dt) {
      if (state.disposed) return;
      const d = Math.min(0.05, dt || 0.016);
      state.t += d;
      state.active += (state.target - state.active) * Math.min(1, d * 1.8);
      const n = state.active > 0.02 ? (state.quality === 'low' ? PARTICLE_BUDGET.low.leaves : PARTICLE_BUDGET.high.leaves) : 0;
      state.pts.visible = n > 0;
      state.pts.material.opacity = 0.85 * state.active;
      const a = state.pts.geometry.attributes.position;
      for (let i = 0; i < state.list.length; i++) {
        const e = state.list[i];
        if (i >= n) { a.setXYZ(i, 0, -20, 0); continue; }
        e.x += e.vx * d;
        e.y += (e.vy + Math.sin(state.t * 2 + e.ph) * 0.3) * d;
        e.z += e.vz * d;
        if (e.x > 12 || e.y < 0.2) {
          e.x = R(-12, -8); e.y = R(0.8, 4.5); e.z = R(-10, 10);
        }
        a.setXYZ(i, e.x, e.y, e.z);
      }
      a.needsUpdate = true;
      state.pts.geometry.setDrawRange(0, n);
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.pts.parent) state.pts.parent.remove(state.pts);
      state.pts.geometry.dispose();
      state.pts.material.dispose();
    }
  };
}

/**
 * Лунные мотыльки (ночи 11–12). Мало частиц; на low слой можно выключить setActive(false).
 */
export function createMoths(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const cap = maxMoths();
  const pos = new Float32Array(cap * 3);
  const list = [];
  for (let i = 0; i < cap; i++) {
    list.push({ a: R(0, 6.28), r: R(1.2, 4.5), y: R(0.7, 2.4), sp: R(0.4, 1.1), ph: R(0, 6.28) });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: texMoth(), color: 0xffffff, size: 0.16, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9
  }));
  pts.visible = false;
  scene.add(pts);
  const state = { pts, list, quality, active: 0, target: 0, t: 0, disposed: false };
  return {
    setActive(on) { state.target = on ? 1 : 0; },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; },
    update(dt) {
      if (state.disposed) return;
      const d = Math.min(0.05, dt || 0.016);
      state.t += d;
      state.active += (state.target - state.active) * Math.min(1, d * 1.6);
      const n = state.active > 0.02 ? (state.quality === 'low' ? PARTICLE_BUDGET.low.moths : PARTICLE_BUDGET.high.moths) : 0;
      state.pts.visible = n > 0;
      const blink = 0.55 + 0.45 * Math.sin(state.t * 6);
      state.pts.material.opacity = 0.85 * state.active * blink;
      const a = state.pts.geometry.attributes.position;
      for (let i = 0; i < state.list.length; i++) {
        const e = state.list[i];
        if (i >= n) { a.setXYZ(i, 0, -20, 0); continue; }
        e.a += e.sp * d;
        const x = Math.cos(e.a) * e.r;
        const z = Math.sin(e.a) * e.r;
        const y = e.y + Math.sin(state.t * 2.2 + e.ph) * 0.25;
        // чуть тянутся к костру
        e.r += (1.6 - e.r) * d * 0.05;
        a.setXYZ(i, x, y, z);
      }
      a.needsUpdate = true;
      state.pts.geometry.setDrawRange(0, n);
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.pts.parent) state.pts.parent.remove(state.pts);
      state.pts.geometry.dispose();
      state.pts.material.dispose();
    }
  };
}

/**
 * Мировой маркер пинга: мягкий столб света, короткий срок жизни (~2.4 с).
 */
export function createPingMarker(scene, opts = {}) {
  const pos = opts.position || [0, 0, 0];
  const color = opts.color ?? 0xffe08a;
  const life = opts.duration ?? 2.4;
  const group = new THREE.Group();
  if (Array.isArray(pos)) group.position.set(pos[0], pos[1], pos[2]);
  else group.position.copy(pos);

  const mat = new THREE.SpriteMaterial({
    map: texPing(), color, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false
  });
  const shaft = new THREE.Sprite(mat);
  shaft.scale.set(0.7, 3.2, 1);
  shaft.position.y = 1.6;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.42, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  ring.position.y = 0.04;
  group.add(shaft, ring);
  scene.add(group);

  const state = { group, shaft, ring, life, age: 0, disposed: false };
  return {
    group,
    get alive() { return !state.disposed && state.age < state.life; },
    update(dt) {
      if (state.disposed) return;
      state.age += dt || 0.016;
      const u = Math.max(0, 1 - state.age / state.life);
      const pulse = 0.85 + 0.15 * Math.sin(state.age * 8);
      shaft.material.opacity = u * pulse;
      shaft.scale.set(0.55 + (1 - u) * 0.4, 2.4 + u * 1.2, 1);
      ring.material.opacity = u * 0.7;
      ring.scale.setScalar(1 + (1 - u) * 1.8);
      if (state.age >= state.life) this.dispose();
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.group.parent) state.group.parent.remove(state.group);
      shaft.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
    }
  };
}


/* ---------- разовый фидбек: сбор, удар, рассвет/ночь, питомец, победа ---------- */

function vec3of(p, d = [0, 0, 0]) {
  if (!p) return { x: d[0], y: d[1], z: d[2] };
  if (Array.isArray(p)) return { x: +p[0] || 0, y: p[1] == null ? d[1] : +p[1], z: p[2] == null ? d[2] : +p[2] };
  return { x: p.x == null ? d[0] : +p.x, y: p.y == null ? d[1] : +p.y, z: p.z == null ? d[2] : +p.z };
}

let _flashTex = null, _starTex = null, _zzzTex = null, _dropTex = null, _vigNight = null, _vigDawn = null;
function texFlash() {
  return _flashTex || (_flashTex = makeDot(64, [
    [0, 'rgba(255,245,200,1)'], [0.35, 'rgba(255,200,80,.7)'], [1, 'rgba(255,140,40,0)']
  ]));
}
function texStar() {
  if (_starTex) return _starTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const x = cv.getContext('2d');
  x.translate(16, 16);
  x.fillStyle = '#fff';
  x.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 5 : 14;
    i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath(); x.fill();
  _starTex = new THREE.CanvasTexture(cv); _starTex.needsUpdate = true;
  return _starTex;
}
function texZzz() {
  if (_zzzTex) return _zzzTex;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96;
  const x = cv.getContext('2d');
  x.font = '900 36px Nunito, system-ui, sans-serif';
  x.lineWidth = 6; x.strokeStyle = '#6a74b8'; x.fillStyle = '#fffaf0';
  x.strokeText('Zzz', 10, 62); x.fillText('Zzz', 10, 62);
  _zzzTex = new THREE.CanvasTexture(cv); _zzzTex.needsUpdate = true;
  return _zzzTex;
}
function texDrop() {
  if (_dropTex) return _dropTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(140,190,255,.95)';
  x.beginPath(); x.moveTo(16, 4); x.bezierCurveTo(28, 16, 24, 28, 16, 28); x.bezierCurveTo(8, 28, 4, 16, 16, 4); x.fill();
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(13, 16, 3, 5, 0, 0, 7); x.fill();
  _dropTex = new THREE.CanvasTexture(cv); _dropTex.needsUpdate = true;
  return _dropTex;
}
function texVig(rgb) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d');
  const g = x.createRadialGradient(64, 64, 18, 64, 64, 64);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(0.55, `rgba(${rgb},0)`);
  g.addColorStop(0.82, `rgba(${rgb},.35)`);
  g.addColorStop(1, `rgba(${rgb},.7)`);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true;
  return tex;
}
function texVigNight() { return _vigNight || (_vigNight = texVig('18,24,56')); }
function texVigDawn() { return _vigDawn || (_vigDawn = texVig('255,170,90')); }

const COLLECT_COL = {
  stick: [0.79, 0.51, 0.29], sticks: [0.79, 0.51, 0.29],
  stone: [0.73, 0.75, 0.84], stones: [0.73, 0.75, 0.84],
  berry: [1, 0.31, 0.43], berries: [1, 0.31, 0.43],
  cloth: [1, 0.56, 0.72], scraps: [1, 0.56, 0.72]
};

/**
 * Пул разовых частиц и спрайтов (сбор, удар, рассвет, победа, poof, Zzz).
 * Дешёвый: один Points + несколько спрайтов, без постобработки.
 */
export function createFeedback(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const cap = PARTICLE_BUDGET[quality].feedback;
  const pos = new Float32Array(cap * 3);
  const col = new Float32Array(cap * 3);
  const bits = [];
  for (let i = 0; i < cap; i++) bits.push({
    on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    life: 0, max: 1, r: 1, g: 1, b: 1, mode: 'ball',
    sx: 0, sy: 0, sz: 0, tx: 0, ty: 0, tz: 0, arc: 0
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: texStar(), vertexColors: true, size: 0.22, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, sizeAttenuation: true
  }));
  pts.frustumCulled = false;
  scene.add(pts);

  const flashes = [];
  const flashN = PARTICLE_BUDGET[quality].flashes;
  for (let i = 0; i < flashN; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texFlash(), transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, fog: false, opacity: 0
    }));
    m.visible = false; m.userData.life = 0; scene.add(m); flashes.push(m);
  }

  const rays = [];
  const rayN = PARTICLE_BUDGET[quality].rays;
  for (let i = 0; i < rayN; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 9),
      new THREE.MeshBasicMaterial({
        color: 0xffe4a8, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide
      })
    );
    m.position.set((i - 1) * 1.1, 3.2, (i - 1) * 0.4);
    m.rotation.z = (i - 1) * 0.22;
    m.visible = false;
    scene.add(m);
    rays.push(m);
  }

  const vig = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({
      map: texVigNight(), transparent: true, opacity: 0,
      depthTest: false, depthWrite: false, fog: false, toneMapped: false
    })
  );
  vig.frustumCulled = false;
  vig.renderOrder = 1000;
  vig.visible = false;
  const vigState = { on: false, kind: 'night', t: 0, dur: 2.2, peak: 0.55 };

  const zzzList = [];

  const state = {
    scene, quality, cap, bits, pos, col, pts, flashes, rays,
    vig, vigState, zzzList, camera: opts.camera || null,
    dawnT: 0, disposed: false, t: 0
  };

  function spawn(n, fn) {
    let left = n;
    for (let i = 0; i < state.bits.length && left > 0; i++) {
      if (!state.bits[i].on) { fn(state.bits[i]); state.bits[i].on = true; left--; }
    }
    if (left <= 0) return;
    // переиспользуем самых старых
    const aged = state.bits.slice().sort((a, b) => a.life - b.life);
    for (let i = 0; i < aged.length && left > 0; i++) {
      fn(aged[i]); aged[i].on = true; left--;
    }
  }

  function flashAt(p, scale, life) {
    let s = state.flashes[0];
    for (const f of state.flashes) if (f.userData.life <= 0) { s = f; break; }
    if (!s) return;
    s.position.set(p.x, p.y, p.z);
    s.scale.setScalar(scale || 1.2);
    s.material.opacity = 0.9;
    s.visible = true;
    s.userData.life = life || 0.28;
    s.userData.max = s.userData.life;
  }

  function attachVig(kind) {
    const cam = state.camera;
    if (!cam) return;
    if (vig.parent !== cam) {
      if (vig.parent) vig.parent.remove(vig);
      cam.add(vig);
      vig.position.set(0, 0, -0.45);
    }
    vig.material.map = kind === 'dawn' ? texVigDawn() : texVigNight();
    vig.material.needsUpdate = true;
    vig.visible = true;
    const fov = ((cam.fov || 60) * Math.PI) / 180;
    const h = 2 * Math.tan(fov / 2) * 0.45;
    const aspect = cam.aspect || 1;
    vig.scale.set(h * aspect, h, 1);
    state.vigState.on = true;
    state.vigState.kind = kind;
    state.vigState.t = 0;
    state.vigState.dur = kind === 'dawn' ? 2.6 : 2.0;
    state.vigState.peak = kind === 'dawn' ? 0.42 : 0.5;
  }

  const api = {
    setCamera(cam) { state.camera = cam || null; },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; },

    hit(pos, opts = {}) {
      const p = vec3of(pos, [0, 1, 0]);
      const kind = opts.kind || 'tree';
      const n = state.quality === 'low' ? 6 : 12;
      flashAt({ x: p.x, y: p.y, z: p.z }, kind === 'enemy' ? 1.6 : 1.2, 0.22);
      if (kind === 'enemy') {
        spawn(n, (b) => {
          const a = R(0, 6.28), sp = R(2.2, 4.5);
          b.mode = 'ball'; b.x = p.x; b.y = p.y; b.z = p.z;
          b.vx = Math.cos(a) * sp; b.vy = R(1.5, 3.5); b.vz = Math.sin(a) * sp;
          b.life = 0; b.max = R(0.28, 0.5);
          b.r = 1; b.g = R(0.85, 1); b.b = R(0.5, 0.75);
        });
      } else {
        spawn(n, (b) => {
          const a = R(0, 6.28), sp = R(1.4, 3.2);
          b.mode = 'ball'; b.x = p.x; b.y = p.y + R(0, 0.4); b.z = p.z;
          b.vx = Math.cos(a) * sp; b.vy = R(1.8, 3.8); b.vz = Math.sin(a) * sp;
          b.life = 0; b.max = R(0.4, 0.7);
          if (Math.random() < 0.35) { b.r = 0.4; b.g = 0.7; b.b = 0.35; } // листок
          else { b.r = 0.72; b.g = 0.48; b.b = 0.28; }
        });
      }
    },

    collect(from, to, opts = {}) {
      const a = vec3of(from, [0, 0.5, 0]);
      const b = vec3of(to, [0, 1.2, 0]);
      const c = COLLECT_COL[opts.item] || COLLECT_COL[opts.color] || [1, 0.85, 0.4];
      const n = state.quality === 'low' ? 5 : 10;
      flashAt(a, 0.7, 0.18);
      spawn(n, (p) => {
        p.mode = 'arc';
        p.sx = a.x + R(-0.15, 0.15); p.sy = a.y + R(0, 0.2); p.sz = a.z + R(-0.15, 0.15);
        p.tx = b.x + R(-0.1, 0.1); p.ty = b.y + R(-0.1, 0.15); p.tz = b.z + R(-0.1, 0.1);
        p.x = p.sx; p.y = p.sy; p.z = p.sz;
        p.arc = R(0.6, 1.2);
        p.life = 0; p.max = R(0.35, 0.55);
        p.r = c[0]; p.g = c[1]; p.b = c[2];
        p.vx = p.vy = p.vz = 0;
      });
    },

    poof(pos, opts = {}) {
      const p = vec3of(pos, [0, 0.8, 0]);
      const moth = (opts.kind || '') === 'moth';
      const n = state.quality === 'low' ? 6 : 12;
      flashAt(p, moth ? 1.1 : 1.4, 0.3);
      spawn(n, (b) => {
        const a = R(0, 6.28), sp = R(1.2, 2.8);
        b.mode = 'ball'; b.x = p.x; b.y = p.y; b.z = p.z;
        b.vx = Math.cos(a) * sp; b.vy = R(0.8, 2.4); b.vz = Math.sin(a) * sp;
        b.life = 0; b.max = R(0.4, 0.7);
        if (moth) { b.r = 0.9; b.g = 0.93; b.b = 1; }
        else { b.r = 0.85; b.g = 0.8; b.b = 1; }
      });
    },

    dawn(camera) {
      if (camera) state.camera = camera;
      attachVig('dawn');
      state.dawnT = 2.4;
      const n = state.quality === 'low' ? 6 : 14;
      spawn(n, (b) => {
        const a = R(0, 6.28), r = R(1.5, 5);
        b.mode = 'spark';
        b.x = Math.cos(a) * r; b.y = R(0.4, 1.2); b.z = Math.sin(a) * r;
        b.vx = R(-0.15, 0.15); b.vy = R(0.35, 0.9); b.vz = R(-0.15, 0.15);
        b.life = 0; b.max = R(1.2, 2.0);
        b.r = 1; b.g = R(0.82, 0.95); b.b = R(0.45, 0.65);
      });
      state.rays.forEach((m, i) => {
        m.visible = true;
        m.userData.phase = i * 0.7;
        m.material.opacity = 0;
      });
    },

    nightfall(camera) {
      if (camera) state.camera = camera;
      attachVig('night');
    },

    petTired(obj3d, opts = {}) {
      const host = obj3d || state.scene;
      const g = new THREE.Group();
      const off = vec3of(opts.offset, [0, opts.y == null ? 1.7 : opts.y, 0]);
      if (!obj3d && opts.position) {
        const p = vec3of(opts.position);
        g.position.set(p.x + off.x, p.y + off.y, p.z + off.z);
      } else {
        g.position.set(off.x, off.y, off.z);
      }
      const zN = state.quality === 'low' ? 1 : PARTICLE_BUDGET.high.zzz;
      const sprites = [];
      for (let i = 0; i < zN; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texZzz(), transparent: true, depthWrite: false, fog: false, opacity: 0
        }));
        sp.scale.set(0.9, 0.68, 1);
        sp.position.set(i * 0.15, i * 0.25, 0);
        g.add(sp); sprites.push(sp);
      }
      const drop = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texDrop(), transparent: true, depthWrite: false, fog: false, opacity: 0
      }));
      drop.scale.set(0.22, 0.28, 1);
      drop.position.set(0.35, 0.1, 0.1);
      g.add(drop);
      host.add(g);
      const rec = { g, host, sprites, drop, t: 0, life: 2.8, disposed: false };
      state.zzzList.push(rec);
      return rec;
    },

    stageWin(pos) {
      const p = vec3of(pos, [0, 1.2, 0]);
      const n = state.quality === 'low' ? 12 : 26;
      flashAt(p, 2.2, 0.4);
      const pal = [
        [1, 0.85, 0.3], [1, 0.55, 0.45], [0.6, 0.95, 0.7], [1, 0.95, 0.85], [0.7, 0.8, 1]
      ];
      spawn(n, (b) => {
        const a = R(0, 6.28), sp = R(1.6, 4.2);
        b.mode = 'confetti';
        b.x = p.x; b.y = p.y; b.z = p.z;
        b.vx = Math.cos(a) * sp; b.vy = R(3.0, 6.0); b.vz = Math.sin(a) * sp;
        b.life = 0; b.max = R(1.1, 1.8);
        const c = pal[(Math.random() * pal.length) | 0];
        b.r = c[0]; b.g = c[1]; b.b = c[2];
      });
    },

    update(dt) {
      if (state.disposed) return;
      const d = Math.min(0.05, dt || 0.016);
      state.t += d;
      const attrP = state.pts.geometry.attributes.position;
      const attrC = state.pts.geometry.attributes.color;
      let live = 0;
      for (let i = 0; i < state.bits.length; i++) {
        const b = state.bits[i];
        if (!b.on) { attrP.setXYZ(i, 0, -40, 0); continue; }
        b.life += d;
        const u = b.life / b.max;
        if (u >= 1) { b.on = false; attrP.setXYZ(i, 0, -40, 0); continue; }
        if (b.mode === 'arc') {
          const e = u * u * (3 - 2 * u);
          b.x = b.sx + (b.tx - b.sx) * e;
          b.z = b.sz + (b.tz - b.sz) * e;
          b.y = b.sy + (b.ty - b.sy) * e + Math.sin(u * Math.PI) * b.arc;
        } else if (b.mode === 'spark') {
          b.x += b.vx * d; b.y += b.vy * d; b.z += b.vz * d;
        } else if (b.mode === 'confetti') {
          b.vy -= 7.5 * d;
          b.x += b.vx * d; b.y += b.vy * d; b.z += b.vz * d;
          b.vx *= 0.98; b.vz *= 0.98;
          if (b.y < 0.05) { b.y = 0.05; b.vy *= -0.25; b.vx *= 0.6; }
        } else {
          b.vy -= 8.5 * d;
          b.x += b.vx * d; b.y += b.vy * d; b.z += b.vz * d;
          if (b.y < 0.04) { b.y = 0.04; b.vy *= -0.3; }
        }
        const fade = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
        attrP.setXYZ(i, b.x, b.y, b.z);
        attrC.setXYZ(i, b.r * fade, b.g * fade, b.b * fade);
        live++;
      }
      attrP.needsUpdate = true;
      attrC.needsUpdate = true;
      state.pts.geometry.setDrawRange(0, state.bits.length);
      state.pts.visible = live > 0;

      state.flashes.forEach((s) => {
        if (s.userData.life <= 0) { s.visible = false; return; }
        s.userData.life -= d;
        const u = Math.max(0, s.userData.life / (s.userData.max || 0.28));
        s.material.opacity = u * 0.9;
        const sc = s.scale.x * (1 + d * 2.2);
        s.scale.setScalar(sc);
        s.visible = u > 0;
      });

      if (state.dawnT > 0) {
        state.dawnT -= d;
        const k = state.dawnT > 1.6 ? (2.4 - state.dawnT) / 0.8 : state.dawnT / 1.6;
        const op = Math.max(0, Math.min(1, k)) * 0.22;
        state.rays.forEach((m, i) => {
          m.visible = op > 0.01;
          m.material.opacity = op * (0.7 + 0.3 * Math.sin(state.t * 1.3 + m.userData.phase));
          m.rotation.y = 0.15 * Math.sin(state.t * 0.4 + i);
        });
        if (state.dawnT <= 0) state.rays.forEach((m) => { m.visible = false; m.material.opacity = 0; });
      }

      if (state.vigState.on) {
        state.vigState.t += d;
        const u = state.vigState.t / state.vigState.dur;
        let op = 0;
        if (u < 0.25) op = u / 0.25;
        else if (u < 0.55) op = 1;
        else if (u < 1) op = 1 - (u - 0.55) / 0.45;
        else { state.vigState.on = false; op = 0; }
        vig.material.opacity = op * state.vigState.peak;
        vig.visible = op > 0.01;
        if (state.camera && vig.parent === state.camera) {
          const fov = ((state.camera.fov || 60) * Math.PI) / 180;
          const h = 2 * Math.tan(fov / 2) * 0.45;
          vig.scale.set(h * (state.camera.aspect || 1), h, 1);
        }
      }

      for (let i = state.zzzList.length - 1; i >= 0; i--) {
        const z = state.zzzList[i];
        if (z.disposed) { state.zzzList.splice(i, 1); continue; }
        z.t += d;
        const u = z.t / z.life;
        if (u >= 1) {
          if (z.g.parent) z.g.parent.remove(z.g);
          z.sprites.forEach((s) => s.material.dispose());
          z.drop.material.dispose();
          z.disposed = true;
          state.zzzList.splice(i, 1);
          continue;
        }
        const fade = u < 0.15 ? u / 0.15 : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
        z.sprites.forEach((s, k) => {
          s.material.opacity = fade * 0.95;
          s.position.y = k * 0.25 + u * 0.55 + Math.sin((z.t + k) * 3) * 0.05;
          s.position.x = k * 0.18 + Math.sin((z.t + k) * 2) * 0.08;
          const sc = 0.75 + k * 0.12;
          s.scale.set(sc * 0.95, sc * 0.72, 1);
        });
        z.drop.material.opacity = fade * (u < 0.6 ? 0.9 : 0.9 * (1 - (u - 0.6) / 0.4));
        z.drop.position.y = 0.1 - u * 0.55;
      }
    },

    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (pts.parent) pts.parent.remove(pts);
      pts.geometry.dispose();
      pts.material.dispose();
      flashes.forEach((s) => { if (s.parent) s.parent.remove(s); s.material.dispose(); });
      rays.forEach((m) => {
        if (m.parent) m.parent.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      });
      if (vig.parent) vig.parent.remove(vig);
      vig.geometry.dispose();
      vig.material.dispose();
      zzzList.forEach((z) => {
        if (z.g.parent) z.g.parent.remove(z.g);
        z.sprites.forEach((s) => s.material.dispose());
        z.drop.material.dispose();
      });
      zzzList.length = 0;
    }
  };
  return api;
}


/**
 * Фасад для движка: один объект, createCampfire / createNightFog / setLevel / update / setQuality / dispose.
 * Новое в v0.6.3: пухлое пламя (flameWidth/Height/Mul, setFlameScale/setFlameHeight), тёплое ядро без белого конуса.
 * Новое в v0.6.2: applyCampfireHalo / CAMPFIRE_HALO / setGlowScale (ореол у пламени, depthTest).
 * Новое в v0.6.1: createCampfire({stones,logs,light}), дождь-штрихи вокруг камеры, искры без столба.
 * Новое в v0.6: hit/collect/dawn/nightfall/petTired/stageWin/poof, setCamera, setBaseVisible/setRingVisible.
 * Новое в v0.5: applyNight(n), setWeather, createRain / createLeaves / createMoths / createPingMarker.
 */
export class GameVFX {
  constructor(opts = {}) {
    this.quality = opts.quality === 'low' ? 'low' : 'high';
    this.campfire = null;
    this.fog = null;
    this.rain = null;
    this.leaves = null;
    this.moths = null;
    this.markers = [];
    this._scene = null;
    this._camera = opts.camera || null;
    this._fb = null;
    this._nightIndex = 0;
    this._weather = { rain: false, wind: false, fog: 'off', moths: false };
  }

  _ensureFb(scene) {
    const sc = scene || this._scene;
    if (!sc) return null;
    this._scene = sc;
    if (!this._fb) this._fb = createFeedback(sc, { quality: this.quality, camera: this._camera });
    else if (this._camera && this._fb.setCamera) this._fb.setCamera(this._camera);
    return this._fb;
  }

  setCamera(cam) {
    this._camera = cam || null;
    if (this._fb) this._fb.setCamera(this._camera);
    if (this.rain && this.rain.setCamera) this.rain.setCamera(this._camera);
  }

  hit(pos, opts = {}) { const fb = this._ensureFb(opts.scene); if (fb) fb.hit(pos, opts); }
  collect(from, to, opts = {}) { const fb = this._ensureFb(opts.scene); if (fb) fb.collect(from, to, opts); }
  poof(pos, opts = {}) { const fb = this._ensureFb(opts.scene); if (fb) fb.poof(pos, opts); }
  dawn(camera) { if (camera && camera.isCamera) this.setCamera(camera); const fb = this._ensureFb(); if (fb) fb.dawn(this._camera); }
  nightfall(camera) { if (camera && camera.isCamera) this.setCamera(camera); const fb = this._ensureFb(); if (fb) fb.nightfall(this._camera); }
  petTired(obj3d, opts = {}) { const fb = this._ensureFb(opts.scene); if (fb) return fb.petTired(obj3d, opts); }
  stageWin(pos, opts = {}) { const fb = this._ensureFb(opts && opts.scene); if (fb) fb.stageWin(pos); }

  setBaseVisible(on) { if (this.campfire && this.campfire.setBaseVisible) this.campfire.setBaseVisible(on); }
  setRingVisible(on) { if (this.campfire && this.campfire.setRingVisible) this.campfire.setRingVisible(on); }
  setGlowScale(s) { if (this.campfire && this.campfire.setGlowScale) this.campfire.setGlowScale(s); }
  setFlameScale(s) { if (this.campfire && this.campfire.setFlameScale) this.campfire.setFlameScale(s); }
  setFlameHeight(s) { if (this.campfire && this.campfire.setFlameHeight) this.campfire.setFlameHeight(s); }

  createCampfire(scene, opts = {}) {
    if (this.campfire) this.campfire.dispose();
    this._scene = scene;
    this.campfire = createCampfire(scene, Object.assign({ quality: this.quality }, opts));
    return this.campfire;
  }

  createNightFog(scene, opts = {}) {
    if (this.fog) this.fog.dispose();
    this._scene = scene;
    this.fog = createNightFog(scene, Object.assign({ quality: this.quality }, opts));
    return this.fog;
  }

  createRain(scene, opts = {}) {
    if (this.rain) this.rain.dispose();
    this._scene = scene || this._scene;
    this.rain = createRain(this._scene, Object.assign({ quality: this.quality, camera: this._camera }, opts));
    if (this._camera && this.rain.setCamera) this.rain.setCamera(this._camera);
    return this.rain;
  }

  createLeaves(scene, opts = {}) {
    if (this.leaves) this.leaves.dispose();
    this._scene = scene || this._scene;
    this.leaves = createLeaves(this._scene, Object.assign({ quality: this.quality }, opts));
    return this.leaves;
  }

  createMoths(scene, opts = {}) {
    if (this.moths) this.moths.dispose();
    this._scene = scene || this._scene;
    this.moths = createMoths(this._scene, Object.assign({ quality: this.quality }, opts));
    return this.moths;
  }

  createPingMarker(scene, opts = {}) {
    const sc = scene || this._scene;
    const m = createPingMarker(sc, opts);
    this.markers.push(m);
    return m;
  }

  setLevel(n) { if (this.campfire) this.campfire.setLevel(n); }
  setNight(on) { if (this.fog) this.fog.setNight(on); }

  /**
   * Пресет ночи 1–12: туман, дождь, ветер, мотыльки. setNight(boolean) по-прежнему только кроссфейд.
   */
  applyNight(n) {
    const i = Math.max(1, Math.min(12, n | 0));
    this._nightIndex = i;
    this.setNight(true);
    this.setWeather(weatherForNight(i));
    return i;
  }

  setWeather(w = {}) {
    const cur = this._weather;
    if ('rain' in w) cur.rain = !!w.rain;
    if ('wind' in w) cur.wind = !!w.wind;
    if ('moths' in w) cur.moths = !!w.moths;
    if ('fog' in w) cur.fog = w.fog === 'dense' ? 'dense' : w.fog === 'soft' ? 'soft' : 'off';
    if (this.fog) this.fog.setPreset(cur.fog === 'off' ? 'night' : cur.fog);
    if (this.campfire && this.campfire.setWind) this.campfire.setWind(cur.wind ? 0.55 : 0);
    const scene = this._scene;
    if (scene) {
      if (!this.rain) this.createRain(scene);
      if (!this.leaves) this.createLeaves(scene);
      if (!this.moths) this.createMoths(scene);
    }
    if (this.rain) {
      this.rain.setActive(cur.rain);
      if (this.rain.setCamera && this._camera) this.rain.setCamera(this._camera);
      if (this.rain.setWind) this.rain.setWind(cur.wind ? 1.2 : 0.35, cur.wind ? 0.4 : 0.15);
    }
    if (this.leaves) this.leaves.setActive(cur.wind);
    if (this.moths) this.moths.setActive(cur.moths);
  }

  setQuality(q) {
    this.quality = q === 'low' ? 'low' : 'high';
    if (this.campfire) this.campfire.setQuality(this.quality);
    if (this.fog) this.fog.setQuality(this.quality);
    if (this.rain) this.rain.setQuality(this.quality);
    if (this.leaves) this.leaves.setQuality(this.quality);
    if (this.moths) this.moths.setQuality(this.quality);
    if (this._fb) this._fb.setQuality(this.quality);
  }
  update(dt) {
    if (this.campfire) this.campfire.update(dt);
    if (this.fog) this.fog.update(dt);
    if (this.rain) this.rain.update(dt);
    if (this.leaves) this.leaves.update(dt);
    if (this.moths) this.moths.update(dt);
    if (this._fb) this._fb.update(dt);
    this.markers = this.markers.filter((m) => {
      m.update(dt);
      return m.alive;
    });
  }
  dispose() {
    if (this.campfire) this.campfire.dispose();
    if (this.fog) this.fog.dispose();
    if (this.rain) this.rain.dispose();
    if (this.leaves) this.leaves.dispose();
    if (this.moths) this.moths.dispose();
    if (this._fb) this._fb.dispose();
    this.markers.forEach((m) => m.dispose());
    this.campfire = null;
    this.fog = null;
    this.rain = null;
    this.leaves = null;
    this.moths = null;
    this._fb = null;
    this.markers = [];
  }
}

export default GameVFX;
