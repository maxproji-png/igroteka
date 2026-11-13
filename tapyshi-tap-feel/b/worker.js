// Вариант B · воркер: частицы рисуются вне главного потока (OffscreenCanvas).
import { createRenderer } from './particles.js?v=tf11132143mt';
let R = null;
onmessage = e => {
  const m = e.data;
  if (m.type === 'init') R = createRenderer(m.canvas, m.dpr, m.sprites, m.rm);
  else if (m.type === 'tap' && R) R.tap(m);
  else if (m.type === 'resize' && R) R.resize(m.w, m.h);
};
