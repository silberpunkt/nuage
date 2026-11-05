(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [url, shot] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1200 });
  const ready = () => page.waitForFunction(() => document.getElementById('pk-open') && !document.getElementById('pk-open').hidden, { timeout: 20000 });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms)), msg = () => page.$eval('#pk-msg', e => e.textContent), eng = () => page.$eval('#pk-et', e => e.textContent);
  const click = async (sel) => { await page.$eval(sel, e => e.scrollIntoView()); const b = await (await page.$(sel)).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(300); };
  await page.goto(url); await ready(); console.log('1 panel button shown');
  await click('#pk-open'); console.log('2', await eng(), '|', await msg());
  await click('#pk-start'); await sleep(4500); console.log('3', await eng());
  await page.select('#pk-n', '50'); await click('#pk-run'); await sleep(3500); console.log('4', await msg());
  await page.reload(); await ready(); await sleep(800); console.log('5 after reload, panel open:', await page.$eval('#pk', e => !e.hidden), '|', await msg());
  await click('#pk-cancel'); await sleep(2500); console.log('6', await msg());
  await page.select('#pk-n', '50'); await click('#pk-run'); await sleep(12000); console.log('7', await msg());
  const n = await page.$$eval('.pk-card', e => e.length); console.log('8 cards shown:', n);
  if (n) { await click('.pk-card button'); await sleep(800); console.log('9 after Keep: rebuild shown:', await page.$eval('#pk-pack', e => !e.hidden), '| cards left:', await page.$$eval('.pk-card', e => e.length)); }
  await page.screenshot({ path: shot });
  if (n) { await click('#pk-pack'); await sleep(6000); await ready(); console.log('10 after rebuild and reload:', await page.$eval('#l', e => e.textContent)); }
  console.log('errors:', errs.join(' | ') || 'none'); await browser.close();
})();
