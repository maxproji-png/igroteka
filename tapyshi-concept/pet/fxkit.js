// Тапыши · tap-feel · пулы DOM-узлов + WAAPI. Анимации transform/opacity уходят в композитор:
// главный поток только создаёт анимацию на тап, кадры считает GPU-поток.
export function pool(parent, n, make) {
  const items = []; for (let i = 0; i < n; i++) { const el = make(i); parent.appendChild(el); items.push({ el, anim: null, data: {} }); }
  let i = 0;
  return { items, next() { const it = items[i]; i = (i + 1) % n; if (it.anim) it.anim.cancel(); return it; } };
}
export function play(it, frames, opts) { it.anim = it.el.animate(frames, Object.assign({ fill: 'none' }, opts)); return it.anim; }
// точки квадратичной кривой → ключевые кадры (плавная дуга без JS на каждом кадре)
export function arc(sx, sy, mx, my, tx, ty, steps, fn) {
  const out = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps, u = 1 - t;
    const x = u * u * sx + 2 * u * t * mx + t * t * tx, y = u * u * sy + 2 * u * t * my + t * t * ty;
    out.push(fn(x, y, t));
  }
  return out;
}
export function img(src, w, cls = 'sprite') { const i = new Image(); i.src = src; i.className = cls; i.style.width = w + 'px'; i.style.height = w + 'px'; i.style.margin = (-w / 2) + 'px 0 0 ' + (-w / 2) + 'px'; i.decoding = 'sync'; i.alt = ''; return i; }
