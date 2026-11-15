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

export const VERSION = '0.5-concept';

/**
 * Уровни костра из GDD v0.5, разделы 6–7 (те же радиусы, что в v0.2; уровней по-прежнему три).
 *   ур. 1 — старт этапа 1–6: круг света ~8 м, открытая зона ~16 м;
 *   ур. 2 — ~12 м / ~24 м;
 *   ур. 3 — карта открыта целиком (старт этапа 7–12 с карты): ~16 м / край 24 м.
 * Единицы сцены = метры. intensity — PointLight, distance ≈ 2 × радиус света.
 */
export const CAMPFIRE_LEVELS = {
  1: { lightRadius: 8,  openRadius: 16, intensity: 20, distance: 16, flameScale: 0.85, emberMul: 0.75, smokeMul: 0.8 },
  2: { lightRadius: 12, openRadius: 24, intensity: 32, distance: 24, flameScale: 1.15, emberMul: 1.0,  smokeMul: 1.15 },
  3: { lightRadius: 16, openRadius: 24, intensity: 46, distance: 32, flameScale: 1.45, emberMul: 1.25, smokeMul: 1.55 }
};

/** Бюджеты частиц (активных точек). Старые ключи flames/embers/smoke/mist сохранены. */
export const PARTICLE_BUDGET = {
  low:  { flames: 4, embers: 16, smoke: 8,  mist: 0,  mistDense: 4,  rain: 40,  leaves: 8,  moths: 4,  puddles: 0 },
  high: { flames: 8, embers: 36, smoke: 20, mist: 8,  mistDense: 14, rain: 110, leaves: 20, moths: 10, puddles: 4 }
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
 * @param {{level?: 1|2|3, position?: [number,number,number]|THREE.Vector3, quality?: 'low'|'high', lit?: boolean}} [opts]
 */
export function createCampfire(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const group = new THREE.Group();
  const pos = opts.position;
  if (pos) {
    if (Array.isArray(pos)) group.position.set(pos[0], pos[1], pos[2]);
    else group.position.copy(pos);
  }

  const stoneM = new THREE.MeshLambertMaterial({ color: 0x6b6762, flatShading: true });
  const stones = [];
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
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.5, 0.16, 10),
    new THREE.MeshLambertMaterial({ color: 0x5a564f, flatShading: true })
  );
  base.position.y = 0.02;
  base.visible = false;
  group.add(base);

  const logM = new THREE.MeshLambertMaterial({ color: 0x3a2416, flatShading: true, emissive: 0x2a0800 });
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.25, 6), logM);
    const a = i / 5 * Math.PI * 2;
    l.position.set(Math.cos(a) * 0.25, 0.32, Math.sin(a) * 0.25);
    l.lookAt(0, 0.95, 0);
    l.rotateX(Math.PI / 2);
    group.add(l);
  }

  const tongueData = [
    [0, 0, 0.62, 1.5, 0xff4d12, 0.75],
    [0.18, 0.1, 0.36, 1.1, 0xff5a14, 0.8],
    [-0.2, 0.06, 0.34, 1.0, 0xff5a14, 0.8],
    [0.05, -0.2, 0.32, 1.15, 0xff6a1a, 0.8],
    [0, 0, 0.42, 1.25, 0xff9a2a, 0.85],
    [0.1, 0.12, 0.22, 0.95, 0xffb03a, 0.9],
    [-0.12, -0.05, 0.22, 0.85, 0xffb03a, 0.9],
    [0, 0, 0.22, 0.75, 0xffe39a, 0.95]
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
    m.position.set(x, 0.18, z);
    m.userData.ph = R(0, 6.28);
    m.userData.sp = R(7, 13);
    m.userData.idx = i;
    group.add(m);
    flames.push(m);
  });
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffc060, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  core.position.y = 0.28;
  core.scale.y = 0.6;
  core.userData.core = true;
  group.add(core);
  flames.push(core);

  const emberCap = maxEmbers();
  const embers = [];
  const ePos = new Float32Array(emberCap * 3);
  for (let i = 0; i < emberCap; i++) {
    embers.push({ x: 0, y: R(0, 2.4), z: 0, vx: R(-0.15, 0.15), vz: R(-0.15, 0.15), v: R(0.8, 1.8), life: Math.random() });
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const emberPts = new THREE.Points(eg, new THREE.PointsMaterial({
    map: texEmber(), color: 0xffffff, size: 0.16, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false
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

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: texGlow(), transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, fog: false
    })
  );
  glow.position.y = 0.03;
  group.add(glow);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xffa050, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  ring.position.y = 0.05;
  group.add(ring);

  const light = new THREE.PointLight(0xff8a3a, 20, 16, 1.3);
  light.position.set(0, 1.5, 0);
  group.add(light);

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
    flames, embers, emberPts, smoke, smokePts, glow, ring, base, stoneM, logM
  };

  const api = {
    get group() { return group; },
    get light() { return light; },
    get level() { return state.level; },
    get lit() { return state.lit; },

    setLevel(n) { applyLevel(state, n); },
    setLit(on) { state.lit = !!on; if (!state.lit) light.intensity = 0; },
    /** 0..1, при низком топливе круг света мерцает (GDD). */
    setFuel(v) { state.fuel = clamp(v, 0, 1); },
    /** Вспышка искр при подбросе топлива. */
    burst() { state.burst = 1; kickEmbers(state); },
    /** 0..1, ветер клонит пламя (ночи 11–12). */
    setWind(v) { state.wind = clamp(v, 0, 1); },
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
  state.flameCount = bud.flames;
  state.flameScale = L.flameScale;
  state.baseIntensity = L.intensity;
  state.lightDistance = L.distance;
  state.lightRadius = L.lightRadius;
  state.light.distance = L.distance;
  state.base.visible = level >= 3;
  state.ring.scale.setScalar(L.lightRadius);
  state.glow.scale.setScalar(L.lightRadius);
}

function kickEmbers(state) {
  const n = Math.min(state.emberCount, state.embers.length);
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.55) {
      const e = state.embers[i];
      e.life = 0;
      e.x = R(-0.22, 0.22);
      e.z = R(-0.22, 0.22);
      e.y = R(0.3, 0.7);
      e.vx = R(-0.4, 0.4);
      e.vz = R(-0.4, 0.4);
      e.v = R(1.4, 2.6);
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
  const scale = state.flameScale || 1;

  state.flames.forEach((f) => {
    if (f.userData.core) {
      f.visible = lit;
      if (lit) f.scale.set((1 + 0.1 * Math.sin(state.t * 17)) * scale, 0.6 * scale, (1 + 0.1 * Math.cos(state.t * 15)) * scale);
      return;
    }
    const on = lit && f.userData.idx < state.flameCount;
    f.visible = on;
    if (!on) return;
    const u = f.userData;
    const k = scale * (0.85 + state.burst * 0.45) * (1 + 0.22 * Math.sin(state.t * u.sp + u.ph) + 0.1 * Math.sin(state.t * u.sp * 2.3 + u.ph));
    f.scale.set(k, k, k);
    f.rotation.z = (state.wind || 0) * 0.35 + Math.sin(state.t * 1.3) * (state.wind || 0) * 0.12;
  });

  if (lit) {
    state.light.intensity = (state.baseIntensity * (0.55 + 0.45 * fuel) * flick + state.burst * 16) * low;
    state.light.distance = state.lightDistance * (0.75 + 0.25 * fuel);
  } else {
    state.light.intensity = 0;
  }

  const glowOp = lit ? (0.4 + 0.3 * flick) * (0.45 + 0.55 * fuel) * low : 0;
  state.glow.visible = lit;
  state.glow.scale.setScalar((state.lightRadius || 8) * (0.95 + 0.08 * flick + state.burst * 0.15));
  state.glow.material.opacity = glowOp;
  state.ring.visible = lit;
  state.ring.scale.setScalar(Math.max(0.2, (state.lightRadius || 8) * (0.75 + 0.25 * fuel)));
  state.ring.material.opacity = lit ? (0.1 + 0.1 * fuel) * low : 0;

  const ea = state.emberPts.geometry.attributes.position;
  const eN = lit ? state.emberCount : 0;
  for (let i = 0; i < state.embers.length; i++) {
    const e = state.embers[i];
    if (i >= eN) { ea.setXYZ(i, 0, -10, 0); continue; }
    e.life += d * e.v * 0.45;
    if (e.life > 1) {
      e.life = 0;
      e.x = R(-0.18, 0.18);
      e.z = R(-0.18, 0.18);
      e.y = R(0.2, 0.5);
      e.vx = R(-0.2, 0.2);
      e.vz = R(-0.2, 0.2);
      e.v = R(0.8, 1.9);
    }
    e.x += e.vx * d;
    e.z += e.vz * d;
    e.y += d * e.v * 1.6 * scale;
    ea.setXYZ(i, e.x, e.y, e.z);
  }
  ea.needsUpdate = true;
  state.emberPts.geometry.setDrawRange(0, eN);

  const sa = state.smokePts.geometry.attributes.position;
  const sN = lit ? state.smokeCount : 0;
  for (let i = 0; i < state.smoke.length; i++) {
    const e = state.smoke[i];
    if (i >= sN) { sa.setXYZ(i, 0, -10, 0); continue; }
    e.life += d * e.v * 0.28;
    if (e.life > 1) {
      e.life = 0;
      e.x = R(-0.2, 0.2);
      e.z = R(-0.2, 0.2);
      e.y = R(0.5, 0.9);
      e.vx = R(0.05, 0.18);
      e.vz = R(-0.08, 0.08);
    }
    e.x += e.vx * d;
    e.z += e.vz * d;
    e.y += d * (0.55 + e.v) * scale;
    sa.setXYZ(i, e.x, e.y, e.z);
  }
  sa.needsUpdate = true;
  state.smokePts.geometry.setDrawRange(0, sN);
  state.smokePts.material.opacity = lit ? 0.5 + 0.15 * fuel : 0;
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


let _rainTex = null, _leafTex = null, _mothTex = null, _pingTex = null;
function texRain() {
  return _rainTex || (_rainTex = makeDot(16, [
    [0, 'rgba(200,220,255,.7)'], [0.5, 'rgba(180,200,230,.25)'], [1, 'rgba(160,180,210,0)']
  ]));
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
 * Лёгкий дождь (спрайты-капли). setActive(false) прячет слой.
 */
export function createRain(scene, opts = {}) {
  const quality = opts.quality === 'low' ? 'low' : 'high';
  const cap = maxRain();
  const pos = new Float32Array(cap * 3);
  const list = [];
  const area = opts.area ?? 22;
  for (let i = 0; i < cap; i++) {
    list.push({ x: R(-area, area), y: R(1, 10), z: R(-area, area), v: R(7, 12) });
    pos[i * 3] = list[i].x; pos[i * 3 + 1] = list[i].y; pos[i * 3 + 2] = list[i].z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    map: texRain(), color: 0xcfe4ff, size: 0.12, transparent: true,
    opacity: 0.55, depthWrite: false, sizeAttenuation: true
  }));
  pts.visible = false;
  scene.add(pts);

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

  const state = { scene, pts, list, puddles, quality, active: 0, target: 0, disposed: false, area };
  return {
    setActive(on) { state.target = on ? 1 : 0; },
    setQuality(q) { state.quality = q === 'low' ? 'low' : 'high'; },
    update(dt) {
      if (state.disposed) return;
      const d = Math.min(0.05, dt || 0.016);
      state.active += (state.target - state.active) * Math.min(1, d * 2);
      const n = state.active > 0.02 ? (state.quality === 'low' ? PARTICLE_BUDGET.low.rain : PARTICLE_BUDGET.high.rain) : 0;
      state.pts.visible = n > 0;
      state.pts.material.opacity = 0.45 * state.active;
      const a = state.pts.geometry.attributes.position;
      for (let i = 0; i < state.list.length; i++) {
        const e = state.list[i];
        if (i >= n) { a.setXYZ(i, 0, -20, 0); continue; }
        e.y -= e.v * d;
        if (e.y < 0) { e.y = R(6, 11); e.x = R(-state.area, state.area); e.z = R(-state.area, state.area); }
        a.setXYZ(i, e.x, e.y, e.z);
      }
      a.needsUpdate = true;
      state.pts.geometry.setDrawRange(0, n);
      const puddleN = state.quality === 'low' ? 0 : PARTICLE_BUDGET.high.puddles;
      state.puddles.forEach((m, i) => {
        m.visible = i < puddleN && state.active > 0.2;
        m.material.opacity = 0.22 * state.active;
      });
    },
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.pts.parent) state.pts.parent.remove(state.pts);
      state.pts.geometry.dispose();
      state.pts.material.dispose();
      state.puddles.forEach((m) => {
        if (m.parent) m.parent.remove(m);
        m.geometry.dispose();
        m.material.dispose(); // общую текстуру луж не диспоузим
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

/**
 * Фасад для движка: один объект, createCampfire / createNightFog / setLevel / update / setQuality / dispose.
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
    this._nightIndex = 0;
    this._weather = { rain: false, wind: false, fog: 'off', moths: false };
  }

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
    this.rain = createRain(this._scene, Object.assign({ quality: this.quality }, opts));
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
    if (this.rain) this.rain.setActive(cur.rain);
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
  }
  update(dt) {
    if (this.campfire) this.campfire.update(dt);
    if (this.fog) this.fog.update(dt);
    if (this.rain) this.rain.update(dt);
    if (this.leaves) this.leaves.update(dt);
    if (this.moths) this.moths.update(dt);
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
    this.markers.forEach((m) => m.dispose());
    this.campfire = null;
    this.fog = null;
    this.rain = null;
    this.leaves = null;
    this.moths = null;
    this.markers = [];
  }
}

export default GameVFX;
