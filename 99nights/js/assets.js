// Карта ассетов «99 ночей».
// url = null → процедурная low-poly заглушка (см. GEO в js/game.js).
// Подключить модель 3D-художника: положить .glb в /models и вписать url.
// Требования к GLB: low-poly, цвета в материалах (baseColor) или в вершинах, без тяжёлых текстур,
// Y вверх, «перед» смотрит в +Z, размер в метрах (scale подправит), основание выравнивается на y=0.
// Статичные объекты «запекаются» в один меш с цветами вершин и рисуются InstancedMesh —
// один draw call на тип, сколько бы их ни было.
export const PET_MODELS = {   // питомцы Тапышей (стадия 1, из /workspace/elemental-evolutions-v2)
  raccoon:  { url: 'models/raccoon.glb',  scale: 1.55 },
  capybara: { url: 'models/capybara.glb', scale: 1.55 },
  dragon:   { url: 'models/dragon.glb',   scale: 1.5 },
  goose:    { url: 'models/goose.glb',    scale: 1.55 },
};
export const ASSETS = {
  pine:   { url: null, scale: 1 },  // деревце (ёлочка)
  oak:    { url: null, scale: 1 },  // деревце (круглое)
  stump:  { url: null, scale: 1 },  // пень после рубки
  lstump: { url: null, scale: 1 },  // пень с лоскутками (точка лута)
  rock:   { url: null, scale: 1 },
  stone:  { url: null, scale: 1 },  // камешки
  branch: { url: null, scale: 1 },  // ветка
  bush:   { url: null, scale: 1 },
  berries:{ url: null, scale: 1 },  // ягоды на кусте (скрываются, когда собраны)
  fence:  { url: null, scale: 1 },  // заборчик
  trap:   { url: null, scale: 1 },  // сеточка-ловушка
  mist:   { url: null, scale: 1 },  // клубочек мглы
  crow:   { url: null, scale: 1 },  // сонный ворон
  moose:  { url: null, scale: 1 },  // Лунный Лось
};
