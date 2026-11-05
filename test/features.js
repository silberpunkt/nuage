const path = require('path');
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [pg, shot] = process.argv.slice(2), url = 'file://' + path.resolve(pg);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1300 });
  const ready = async () => page.waitForFunction(() => document.getElementById('i') && !document.getElementById('i').disabled, { timeout: 20000 });
  const status = () => page.$eval('#l', e => e.textContent);
  const ask = async (q) => { await page.type('#i', q); await page.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 120)); };
  const click = async (sel) => { const b = await (await page.$(sel)).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await new Promise(r => setTimeout(r, 150)); };
  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload(); await ready();
  console.log('1 status:', await status());
  await ask('What is a turnip?'); await ask('A root vegetable.'); await ask('A bookcase has many shelves.');
  await page.reload(); await ready(); console.log('2 after reload:', await status());
  await ask('What have I taught you?'); console.log('  ', await page.$$eval('#o .n', e => e[e.length - 1].dataset.t));
  await ask('Is a penguin a fish? Why?'); await ask('What happens if water is heated?'); await ask('What did you just say?'); console.log('  ', await page.$$eval('#o .n', e => e[e.length - 1].dataset.t));
  await click('#hue'); await click('#hue'); await click('#hue'); console.log('3 colour button:', await page.$eval('#hue', e => e.textContent), '| coloured spans in last reply:', await page.$$eval('#o .n', e => e[e.length - 1].querySelectorAll('span[style]').length));
  await click('#tilt'); console.log('4 tilt pressed:', await page.$eval('#tilt', e => e.getAttribute('aria-pressed')), '| triangles:', await page.$$eval('[data-wb-tri]', e => e.length));
  const tri = await page.$$('[data-wb-tri]'); if (tri.length) { const b = await tri[tri.length - 1].boundingBox(); await page.mouse.click(b.x + 5, b.y + 5); await new Promise(r => setTimeout(r, 150)); await page.mouse.click(b.x + 5, b.y + 5); await new Promise(r => setTimeout(r, 150)); }
  console.log('  tilted view lines:', await page.$$eval('[data-wb-view] > span', e => e.length), '| triangle font:', await page.$eval('[data-wb-tri]', e => getComputedStyle(e).fontSize).catch(() => '-'));
  await ask('Can a sparrow fly?'); console.log('  new reply has triangle:', await page.$$eval('#o .n', e => !!e[e.length - 1].querySelector('[data-wb-tri]')));
  await click('#talk'); console.log('5 say aloud (Ecouter): errors so far:', errs.length);
  await page.screenshot({ path: shot });
  await click('#forget'); await new Promise(r => setTimeout(r, 2500)); await ready(); console.log('6 after Forget:', await status(), '| prefs kept:', await page.$eval('#hue', e => e.textContent));
  console.log('errors:', errs.join(' | ') || 'none'); await browser.close();
})();
