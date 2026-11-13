// Крупный «+1» у пальца (DOM-варианты A и C).
// Битмап «+N» рисуется один раз на canvas и показывается через <img>: слой-картинка,
// движок не перерисовывает текст при scale. Двигается только transform/opacity (WAAPI).
// Если тапы чаще 1 раз/70 мс, соседние склеиваются в «+2», «+3»… — на экране не больше ~11 чисел.
import { RM, fmtGain, plusURL } from './core.js?v=tc11132220';
import { pool, play } from './fxkit.js?v=tc11132220';
export function plusFx(app, { life = 760, merge = 70, size = 12 } = {}) {
  const P = pool(app, size, () => { const i = new Image(); i.className = 'plus-img'; i.alt = ''; i.decoding = 'sync'; i.src = plusURL('+1', 1); return i; });
  let lastAt = -1e9, acc = 0, accT = 0, ax = 0, ay = 0, at = 1;
  function spawn(x, y, gain, tier) {
    const p = P.next(), key = gain + '|' + tier;
    if (p.data.k !== key) { p.el.src = plusURL(fmtGain(gain), tier); p.data.k = key; }
    const px = x + (Math.random() - .5) * 26, py = y - 36, r = (Math.random() - .5) * 10;
    if (RM) { play(p, [{ opacity: 0, transform: `translate(${px}px,${py}px)` }, { opacity: 1, offset: .2 }, { opacity: 0, transform: `translate(${px}px,${py}px)` }], { duration: 600 }); return; }
    play(p, [
      { opacity: 0, transform: `translate(${px}px,${py + 10}px) rotate(${r}deg) scale(.5)` },
      { opacity: 1, transform: `translate(${px}px,${py - 18}px) rotate(${r * .6}deg) scale(1.14)`, offset: .16 },
      { opacity: 1, transform: `translate(${px}px,${py - 46}px) rotate(${r * .3}deg) scale(1)`, offset: .55 },
      { opacity: 0, transform: `translate(${px}px,${py - 84}px) rotate(0deg) scale(.9)` }
    ], { duration: life, easing: 'cubic-bezier(.2,.75,.3,1)' });
  }
  function flush(now) { clearTimeout(accT); accT = 0; if (!acc) return; const g = Math.round(acc * 10) / 10; acc = 0; lastAt = now; spawn(ax, ay, g, at); }
  return {
    tap(x, y, gain, tier, now) {
      acc += gain; ax = x; ay = y; at = tier;
      if (now - lastAt >= merge) flush(now);
      else if (!accT) accT = setTimeout(() => flush(performance.now()), merge - (now - lastAt));
    }
  };
}
