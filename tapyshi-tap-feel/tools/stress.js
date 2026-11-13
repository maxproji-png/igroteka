// Стресс-тест тапалки: 30 тапов/с ~10 с, кадры через rAF.
// node stress.js <url> [engine=chromium] [cpu=1] [dpr=3] [secs=10] [rate=30]
const pw = require('/workspace/games/node_modules/playwright-core');
const [url, engine = 'chromium', cpu = '1', dpr = '3', secs = '10', rate = '30'] = process.argv.slice(2);
(async () => {
  const opts = engine === 'chromium' ? { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {};
  const b = await pw[engine].launch(opts);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +dpr, isMobile: engine !== 'firefox', hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 });
  let cdp = null;
  if (engine === 'chromium') { cdp = await ctx.newCDPSession(p); if (+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu }); }
  await p.waitForTimeout(1200);
  const c = await p.evaluate(() => (window.__petCenter ? window.__petCenter() : window.__petScreen()));
  // рекордер кадров
  await p.evaluate(() => {
    window.__ft = []; window.__lf = []; window.__rec = true; let last = performance.now();
    window.__taps0 = window.__taps || 0; window.__pd = 0; if (!window.__pdHook) { window.__pdHook = 1; document.querySelector('canvas.scene').addEventListener('pointerdown', () => window.__pd++, true); }
    const loop = now => { if (!window.__rec) return; window.__ft.push(now - last); if (now - last > 20) (window.__lf = window.__lf || []).push([Math.round(now - last), window.__taps || window.__pd]); last = now; requestAnimationFrame(loop); };
    requestAnimationFrame(n => { last = n; requestAnimationFrame(loop); });
  });
  await p.waitForTimeout(100);
  const TRACE = engine === 'chromium' && process.env.TRACE !== '0';
  if (TRACE) await b.startTracing(p, { categories: ['toplevel', 'v8', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'benchmark'] });
  const N = Math.round(+secs * +rate), iv = 1000 / +rate, t0 = Date.now();
  if (cdp) {
    for (let i = 0; i < N; i++) {
      const due = t0 + i * iv, w = due - Date.now(); if (w > 0) await new Promise(r => setTimeout(r, w));
      const x = c.x + ((i * 37) % 60 - 30), y = c.y + ((i * 53) % 70 - 35);
      cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }).catch(() => {});
      cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
    }
  } else {
    // WebKit: нет CDP — синтетические pointer-события из таймера внутри страницы
    await p.evaluate(({ c, N, iv }) => new Promise(res => {
      const cv = document.querySelector('canvas.scene'); let i = 0; const t0 = performance.now();
      const step = () => {
        while (i < N && performance.now() - t0 >= i * iv) {
          const x = c.x + ((i * 37) % 60 - 30), y = c.y + ((i * 53) % 70 - 35);
          cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true }));
          cv.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true }));
          i++;
        }
        if (i < N) setTimeout(step, 4); else res();
      }; step();
    }), { c, N, iv });
  }
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => { window.__rec = false; return { lf: window.__lf, ft: window.__ft, taps: (window.__taps || 0) - window.__taps0, pd: window.__pd }; });
  let tr = null;
  if (TRACE) {
    const buf = await b.stopTracing(); if (process.env.DUMP) require('fs').writeFileSync(process.env.DUMP, buf); const ev = JSON.parse(buf.toString()).traceEvents || [];
    const agg = {}; const add = (k, d) => { const a = agg[k] || (agg[k] = { n: 0, ms: 0 }); a.n++; a.ms += (d || 0) / 1000; };
    let frames = { presented: 0, dropped: 0, partial: 0 };
    for (const e of ev) {
      if (['Layout', 'UpdateLayoutTree', 'Paint', 'RasterTask', 'Layerize', 'PrePaint', 'Commit', 'FunctionCall', 'EventDispatch', 'GPUTask', 'ParseHTML'].includes(e.name) && e.ph === 'X') add(e.name, e.dur);
      if (e.name === 'PipelineReporter' && e.ph === 'b' && e.args && e.args.chrome_frame_reporter) {
        const st = e.args.chrome_frame_reporter.state; if (st === 'STATE_PRESENTED_ALL') frames.presented++; else if (st === 'STATE_DROPPED') frames.dropped++; else if (st === 'STATE_PRESENTED_PARTIAL') frames.partial++;
      }
    }
    for (const k in agg) agg[k].ms = +agg[k].ms.toFixed(1);
    tr = { agg, frames };
  }
  if (cdp && +cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const ft = r.ft.slice(2), sorted = [...ft].sort((a, b) => a - b), dur = ft.reduce((a, b) => a + b, 0);
  const q = k => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * k))];
  const worst = sorted.slice(Math.floor(sorted.length * .99)); const w1 = worst.reduce((a, b) => a + b, 0) / worst.length;
  const out = { url, engine, cpu: +cpu, dpr: +dpr, taps: r.taps, pointerdowns: r.pd, frames: ft.length, avgFps: +(ft.length / (dur / 1000)).toFixed(1),
    low1Fps: +(1000 / w1).toFixed(1), p95ms: +q(.95).toFixed(1), p99ms: +q(.99).toFixed(1), maxMs: +sorted[sorted.length - 1].toFixed(1),
    long20: ft.filter(x => x > 20).length, dropped: ft.reduce((a, x) => a + Math.max(0, Math.round(x / 16.667) - 1), 0), errs, longAt: r.lf, trace: tr };
  console.log(JSON.stringify(out));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
