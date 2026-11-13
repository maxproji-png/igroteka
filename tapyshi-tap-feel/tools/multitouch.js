// Мультитач-тест варианта A: CDP Input.dispatchTouchEvent с 3/4/5 точками в одном touchStart.
const { chromium } = require('/workspace/games/node_modules/playwright-core');
const url = process.argv[2];
const multOf = k => k >= 50 ? 2 : k >= 20 ? 1.5 : 1;
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 });
  const cdp = await ctx.newCDPSession(p);
  const pet = await p.evaluate(() => window.__petCenter());
  // точки: на еноте и мимо него, но в центральной зоне
  const PTS = [[pet.x, pet.y], [40, 260], [350, 300], [60, 640], [330, 660], [195, 180], [120, 450], [280, 520], [pet.x - 90, pet.y + 150], [pet.x + 100, pet.y - 160]];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1, radiusX: 8, radiusY: 8 })) });
  const rows = [];
  async function scenario(name, fn) {
    await sleep(1300);                                   // комбо сбросилось
    await p.evaluate(() => { window.__S.energy = 1e6; });
    const c0 = await p.evaluate(() => ({ n: window.__tapCount || 0, coins: window.__S.coins }));
    const { dispatched, events, rounds } = await fn();
    await sleep(1600);                                   // досчёт баланса устоялся
    const c1 = await p.evaluate(() => ({ n: window.__tapCount, coins: window.__S.coins, shown: document.getElementById('balNum').textContent.replace(/\D/g, '') }));
    const counted = c1.n - c0.n; let exp = 0; for (let k = 1; k <= dispatched; k++) exp += multOf(k);
    rows.push({ name, rounds, events, dispatched, counted, match: counted === dispatched ? '100%' : (100 * counted / dispatched).toFixed(1) + '%',
      coinsDelta: +(c1.coins - c0.coins).toFixed(1), expectedDelta: exp, balanceShown: +c1.shown, balanceState: Math.floor(c1.coins), balanceOk: +c1.shown === Math.floor(c1.coins) && Math.abs(c1.coins - c0.coins - exp) < 1e-6 });
  }
  for (const N of [3, 4, 5]) {
    await scenario(`${N} touches per touchStart`, async () => {
      const R = 40; let d = 0;
      for (let r = 0; r < R; r++) {
        const pts = []; for (let i = 0; i < N; i++) pts.push(PTS[(r * 3 + i) % PTS.length]);
        await send('touchStart', pts); await send('touchEnd', []); d += N; await sleep(r % 4 === 0 ? 5 : 30);
      }
      return { dispatched: d, events: R, rounds: R };
    });
  }
  await scenario('mixed: fingers added one by one (1→2→3), then lift', async () => {
    const R = 40; let d = 0, ev = 0;
    for (let r = 0; r < R; r++) {
      const a = PTS[r % 10], bb = PTS[(r + 4) % 10], c = PTS[(r + 7) % 10];
      await send('touchStart', [a]); await send('touchStart', [a, bb]); await send('touchStart', [a, bb, c]); await send('touchEnd', []);
      d += 3; ev += 3; await sleep(10);
    }
    return { dispatched: d, events: ev, rounds: R };
  });
  await scenario('mixed rapid: 1/2/5/3 fingers, no gaps (~60 events/s)', async () => {
    const seq = [1, 2, 5, 3, 1, 4, 1, 1, 5, 2]; let d = 0, ev = 0;
    for (let r = 0; r < 60; r++) {
      const N = seq[r % seq.length]; const pts = []; for (let i = 0; i < N; i++) pts.push(PTS[(r + i * 3) % 10]);
      send('touchStart', pts); send('touchEnd', []);      // без await — пачкой, как быстрые пальцы
      d += N; ev++; await sleep(16);
    }
    return { dispatched: d, events: ev, rounds: 60 };
  });
  console.table(rows); console.log(JSON.stringify({ rows, errs }));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
