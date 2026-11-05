// mimia-panel.js -- drives the patty-cake panel through Mimia's whole loop under the mock janitor: the mirror gathers
// light, Mimia is ground, and then she answers in the conversation.   node test/mimia-panel.js http://localhost:8099/__nuage/dist/nuage.html shot.png
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [url, shot] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1300 });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms)), txt = (s) => page.$eval(s, e => e.textContent);
  await page.goto(url); await page.waitForFunction(() => document.getElementById('pk-open') && !document.getElementById('pk-open').hidden, { timeout: 20000 });
  await page.evaluate(() => document.getElementById('pk-open').click()); await sleep(500);
  await page.evaluate(() => document.getElementById('pk-start').click()); await sleep(3500);
  await page.select('#pk-mode', 'm'); await page.select('#pk-n', '10'); console.log('1', await txt('#pk-mt'));
  await page.evaluate(() => document.getElementById('pk-run').click());
  for (let i = 0; i < 40; i++) { await sleep(1000); const m = await txt('#pk-msg'); if (/done/.test(m)) { console.log('2', m); break; } }
  console.log('2b', await txt('#pk-msg'), '|', await txt('#pk-mt'), '| grind disabled:', await page.$eval('#pk-grind', e => e.disabled));
  await page.evaluate(() => document.getElementById('pk-grind').click()); await sleep(1500); console.log('2c', await txt('#pk-mt'));
  for (let i = 0; i < 30; i++) { await sleep(2000); const m = await txt('#pk-mt'); if (/Mimia is \d+ KB/.test(m)) { console.log('3', m); break; } if (i % 5 === 0) console.log('   ', m); }
  await page.select('#pk-by', 'm');
  await page.type('#i', 'What is a kettle?'); await page.keyboard.press('Enter'); await sleep(2500);
  console.log('4', await page.evaluate(() => [...document.querySelectorAll('#o > div')].slice(-2).map(d => d.className + ': ' + d.textContent + (d.dataset.who ? ' [' + d.dataset.who + ']' : '')).join(' | ')));
  if (shot) await page.screenshot({ path: shot });
  console.log('errors:', errs.join('; ') || 'none'); await browser.close();
})();
