// Карта ассетов «99 ночей». Новая модель = положить .glb в models/art/ и добавить/поправить строку здесь.
// url = null или файл не загрузился → процедурная low-poly заглушка из GEO в js/game.js (фолбэк, игра не ломается).
// Спецификация 3D-художника (MVP, утверждено): Y вверх, «перед» в +Z, метры, origin на земле, только baseColor, scale 1.
// Статика запекается в один меш с цветами вершин → InstancedMesh, 1 draw call на тип; яркие emissive-части
// (стекло фонаря, угольки) — отдельным мешем без освещения. include/exclude — RegExp по именам узлов GLB.
// Существа (anim: true) грузятся как граф сцены + AnimationMixer (клипы idle/walk/fly/peck), как питомцы;
// меши под каждым анимируемым узлом (Body, Head, Leg_*, Wing_*…) склеиваются → у Лося ~10 draw calls вместо 54.
export const PET_MODELS = {   // питомцы Тапышей (стадия 1, из /workspace/elemental-evolutions-v2)
  raccoon:  { url: 'models/raccoon.glb',  scale: 1.55 },
  capybara: { url: 'models/capybara.glb', scale: 1.55 },
  dragon:   { url: 'models/dragon.glb',   scale: 1.5 },
  goose:    { url: 'models/goose.glb',    scale: 1.55 },
};
const A = 'models/art/';   // модели 3D-художника, /workspace/99nights/art/glb (mvp_manifest.json)
export const ASSETS = {
  // лес
  pine:     { url: A + 'pine.glb',     scale: 1 },
  oak:      { url: A + 'oak.glb',      scale: 1 },
  pineFar:  { url: A + 'pine_lod.glb', scale: 1.3 },   // LOD для дальнего кольца леса (за краем карты)
  oakFar:   { url: A + 'oak_lod.glb',  scale: 1.3 },
  stump:    { url: A + 'stump.glb',    scale: 1 },     // пень после рубки
  lstump:   { url: A + 'lstump.glb',   scale: 1, exclude: /^scrap/ },   // пень — точка лута…
  scraps:   { url: A + 'lstump.glb',   scale: 1, include: /^scrap/ },   // …и лоскутки на нём (прячутся, когда собраны)
  rock:     { url: A + 'rock.glb',     scale: 1 },
  stone:    { url: A + 'stone.glb',    scale: 1 },
  branch:   { url: A + 'branch.glb',   scale: 1 },
  bush:     { url: A + 'bush.glb',     scale: 1 },     // без ягод
  berries:  { url: A + 'berries.glb',  scale: 1 },     // тот же transform, что у куста; скрываются после сбора
  // лагерь и постройки
  campfire:         { url: A + 'campfire.glb',         scale: 1, exclude: /^Flame/ },   // пламя/свет/дым — VFX-пак
  campfire_addon_2: { url: A + 'campfire_addon_2.glb', scale: 1 },   // кольцо камней, уровень 2
  campfire_addon_3: { url: A + 'campfire_addon_3.glb', scale: 1 },   // площадка, уровень 3 (вместо addon_2)
  bench:    { url: A + 'bench.glb',    scale: 1 },
  chest:    { url: A + 'chest.glb',    scale: 1 },
  bed:      { url: A + 'bed.glb',      scale: 1 },
  lamp:     { url: A + 'lamp.glb',     scale: 1 },
  fence:    { url: A + 'fence.glb',    scale: 1 },
  trap:     { url: A + 'trap.glb',     scale: 1 },
  basket:   { url: A + 'basket.glb',   scale: 1 },     // за спиной питомца, когда скрафчена корзинка
  wood_log: { url: A + 'wood_log.glb', scale: 1, decor: [[-2.5, 1.7, 1.0], [2.6, 1.9, -1.1]] },   // декор: брёвна-лавочки у костра (x, z, ry)
  // ночные существа (анимации)
  mist:     { url: A + 'mist.glb',     scale: 1.3, anim: true },   // idle, walk · ×1.3 — читаемость на телефоне
  crow:     { url: A + 'crow.glb',     scale: 1, anim: true },   // idle, fly, peck
  moose:    { url: A + 'moose.glb',    scale: 1, anim: true },   // idle, walk
  moth:     { url: A + 'moth.glb',     scale: 1.7, anim: true },   // idle, fly · ×1.7 — иначе на 390 px почти не видно
};
