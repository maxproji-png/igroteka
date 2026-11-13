const { chromium } = require('/workspace/games/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const OUT = '/workspace/tapyshi-redesign/final-concept/shots';
fs.mkdirSync(OUT, { recursive: true });

function collect(page, bag) {
  page.on('pageerror', e => bag.push('JS: ' + e.message));
  page.on('requestfailed', r => {
    const u = r.url();
    if (u.startsWith(BASE) || u.includes('8765') || u.includes('tapyshi')) {
      bag.push('FAIL ' + r.method() + ' ' + u + ' ' + (r.failure() && r.failure().errorText));
    }
  });
  page.on('response', r => {
    if (r.status() >= 400) bag.push(r.status() + ' ' + r.url());
  });
}

(async () => {
  const b = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const report = [];

  async function shot(page, name) {
    await page.screenshot({ path: path.join(OUT, name + '.png') });
  }

  // ---- 390x844 checks ----
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  collect(p, errs);

  // PET
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 15000 });
  await p.waitForTimeout(800);
  // tab order
  const tabs = await p.$$eval('.tabbar .tab', els => els.map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
  report.push('pet tabs: ' + tabs.join(' | '));
  if (tabs.join() !== 'Питомец*,Игры,Клан,Магазин') report.push('ERROR tab order/active on pet: ' + JSON.stringify(tabs));
  await shot(p, 'pet-390x844');

  // tap raccoon several times for coins + combo
  const box = await p.locator('canvas.scene').boundingBox();
  const cx = box.x + box.width * 0.5, cy = box.y + box.height * 0.52;
  const before = await p.$eval('[data-b="coins"]', e => e.textContent);
  for (let i = 0; i < 8; i++) {
    await p.mouse.click(cx, cy);
    await p.waitForTimeout(80);
  }
  await p.waitForTimeout(600);
  const after = await p.$eval('[data-b="coins"]', e => e.textContent);
  const coins = await p.$$eval('.fcoin, .plus', els => els.length);
  const comboOn = await p.$eval('#combo', e => e.classList.contains('on'));
  const comboN = await p.$eval('#cn', e => e.textContent);
  report.push(`tap: coins ${before} -> ${after}, flying=${coins}, combo.on=${comboOn} n=${comboN}`);
  if (before === after && coins === 0) report.push('ERROR tap produced no coins');
  if (!comboOn && comboN === '0') report.push('ERROR combo did not start');
  await shot(p, 'pet-tap-390x844');

  // GAMES
  await p.click('.tabbar a.tab[href$="games/"]');
  await p.waitForURL(/\/games\/?/);
  await p.waitForSelector('.tabbar, .play, [data-open], .card', { timeout: 10000 });
  await p.waitForTimeout(500);
  const tabsG = await p.$$eval('.tabbar .tab', els => els.map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
  report.push('games tabs: ' + tabsG.join(' | '));
  await shot(p, 'games-390x844');
  // open sheet
  const openBtn = p.locator('[data-open], button.play, .card button, .play').first();
  if (await openBtn.count()) {
    await openBtn.click();
    await p.waitForTimeout(400);
    const sheet = await p.$('.sheet, .sh, [class*="sheet"], .scr-sheet, body.has-sheet');
    const hasSheet = await p.evaluate(() => document.body.classList.contains('has-sheet') || !!document.querySelector('.sheet,.stake,.mode-pick,[data-stake]'));
    report.push('games sheet: ' + hasSheet);
    if (!hasSheet) report.push('ERROR games sheet did not open');
    await shot(p, 'games-sheet-390x844');
    // close if possible to go back to catalog for nav
    // шторка перекрывает scrim — дальше открываем разделы по URL
  } else {
    report.push('ERROR no play/open button in games catalog');
  }

  // CLAN
  await p.goto(BASE + '/clan/', { waitUntil: 'networkidle' });
  await p.waitForSelector('.tabbar', { timeout: 10000 });
  await p.waitForTimeout(500);
  const tabsC = await p.$$eval('.tabbar .tab', els => els.map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
  report.push('clan tabs: ' + tabsC.join(' | '));
  await shot(p, 'clan-390x844');
  // switch inner tabs
  await p.click('#t2');
  await p.waitForTimeout(400);
  const topOn = await p.$eval('#t2', e => e.classList.contains('on'));
  const topText = await p.$eval('#panel', e => e.innerText.slice(0, 120).replace(/\s+/g, ' '));
  report.push(`clan top tab on=${topOn} panel="${topText}"`);
  if (!topOn) report.push('ERROR clan top tab did not activate');
  await shot(p, 'clan-top-390x844');
  await p.click('#t3');
  await p.waitForTimeout(400);
  const chatOn = await p.$eval('#t3', e => e.classList.contains('on'));
  report.push('clan chat tab on=' + chatOn);
  if (!chatOn) report.push('ERROR clan chat tab did not activate');
  await shot(p, 'clan-chat-390x844');
  await p.click('#t1');
  await p.waitForTimeout(300);

  // SHOP
  await p.goto(BASE + '/shop/', { waitUntil: 'networkidle' });
  await p.waitForSelector('.tabbar', { timeout: 10000 });
  await p.waitForTimeout(400);
  const tabsS = await p.$$eval('.tabbar .tab', els => els.map(e => e.textContent.trim() + (e.classList.contains('on') ? '*' : '')));
  const shopTitle = await p.$eval('h1, .hd b', e => e.textContent.trim());
  report.push('shop tabs: ' + tabsS.join(' | ') + ' title=' + shopTitle);
  await shot(p, 'shop-390x844');

  // broken images
  const broken = await p.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src));
  if (broken.length) report.push('ERROR broken images on shop: ' + broken.join(', '));

  await p.close();

  // ---- 360x740 screenshots of each tab (quick) ----
  const q = await b.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
  const errs2 = [];
  collect(q, errs2);
  for (const [url, name, ready] of [
    ['/', 'pet-360x740', true],
    ['/games/', 'games-360x740', false],
    ['/clan/', 'clan-360x740', false],
    ['/shop/', 'shop-360x740', false]
  ]) {
    await q.goto(BASE + url, { waitUntil: 'networkidle' });
    if (ready) {
      try { await q.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 12000 }); } catch (e) { report.push('ERROR 360 pet not ready'); }
    }
    await q.waitForTimeout(700);
    await shot(q, name);
  }
  await q.close();

  // overview 4 tabs
  const ov = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  collect(ov, errs);
  const files = ['pet-390x844', 'games-390x844', 'clan-390x844', 'shop-390x844'];
  // compose later with sharp or python PIL
  await ov.close();

  await b.close();

  const allErrs = [...errs, ...errs2].filter(x => !x.includes('favicon'));
  report.push('--- network/js ---');
  report.push(...(allErrs.length ? allErrs : ['none']));
  const text = report.join('\n');
  fs.writeFileSync(path.join(OUT, 'report.txt'), text);
  console.log(text);
})().catch(e => { console.error(e); process.exit(1); });
