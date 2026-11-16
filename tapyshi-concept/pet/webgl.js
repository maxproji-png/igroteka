// Проверка WebGL без three.js: на 2D-фоллбэке стек не качаем.
let _webgl = undefined;
export function webglOK() {
  if (_webgl !== undefined) return _webgl;
  try {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!g) { _webgl = false; return _webgl; }
    const l = g.getExtension('WEBGL_lose_context');
    if (l) l.loseContext();
    _webgl = true;
  } catch (e) { _webgl = false; }
  return _webgl;
}
