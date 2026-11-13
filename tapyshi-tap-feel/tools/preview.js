// Превью: скриншоты (покой, середина комбо, ×1,5) + видео серии тапов → mp4/gif
// node preview.js <url> <outDir>
const { chromium } = require('/workspace/games/node_modules/playwright-core');
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const [url, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const vdir = fs.mkdtempSync('/tmp/vid-');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: vdir, size: { width: 780, height: 1688 } } });
  const t0 = Date.now();
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(out, 'shot-idle.png') });
  const cdp = await ctx.newCDPSession(p);
  const c = await p.evaluate(() => window.__petCenter());
  let i = 0;
  const tap = () => { const x = c.x + ((i * 37) % 70 - 35), y = c.y + ((i * 53) % 80 - 40); i++;
    cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const burst = async (n, rate) => { for (let k = 0; k < n; k++) { tap(); await new Promise(r => setTimeout(r, 1000 / rate)); } };
  const vStart = (Date.now() - t0) / 1000 - .4;
  await burst(6, 7); await burst(8, 14);               // разгон
  await p.screenshot({ path: path.join(out, 'shot-combo.png') });   // ~14 тапов: +1 в полёте, комбо над головой
  await burst(8, 18);                                   // порог ×1,5 на 20
  await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(out, 'shot-x15.png') });
  await burst(30, 30);                                  // 30 тапов/с; у C — burst на 25 и 50
  await p.screenshot({ path: path.join(out, 'shot-fast.png') });
  await burst(14, 30);
  await p.waitForTimeout(1500);
  const vEnd = (Date.now() - t0) / 1000;
  const video = p.video(); await ctx.close(); const vp = await video.path(); await b.close();
  const dur = (vEnd - vStart).toFixed(2), ss = vStart.toFixed(2);
  execSync(`ffmpeg -y -loglevel error -ss ${ss} -t ${dur} -i ${vp} -vf "scale=390:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart ${path.join(out, 'preview.mp4')}`);
  execSync(`ffmpeg -y -loglevel error -ss ${ss} -t ${dur} -i ${vp} -vf "fps=15,scale=300:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" ${path.join(out, 'preview.gif')}`);
  console.log('ok', out, ss, dur);
})().catch(e => { console.error(e); process.exit(1); });
