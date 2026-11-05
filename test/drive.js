// drive.js -- type each line of a talk file into nuage like a person, then photograph the page. Uses the parked eyes
// (C:\__john\__\__http\__tl\__readme\eyes, Linux only): copy this beside their node_modules, then
//   node drive.js ../dist/nuage.html talk.txt talk.png
const fs = require('fs'), path = require('path');
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [page_, talk, shot] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files']) });
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 900, height: 1400 });
  await page.goto('file://' + path.resolve(page_)); await page.waitForFunction(() => !document.getElementById('i').disabled, { timeout: 10000 });
  const bar = await page.evaluate(() => [...document.querySelectorAll('#b b')].map(b => b.style.width) + ' | ' + document.getElementById('l').textContent);
  for (const q of fs.readFileSync(talk, 'utf8').split('\n').filter(l => l.trim() && l[0] !== '#')) { await page.type('#i', q, { delay: 2 }); await page.keyboard.press('Enter'); }
  const last = await page.evaluate(() => [...document.querySelectorAll('#o div')].slice(-4).map(d => d.className + ': ' + d.textContent).join('\n'));
  await page.screenshot({ path: shot, fullPage: false });
  console.log('bar: ' + bar + '\nlast turns:\n' + last + '\npage errors: ' + (errs.join('; ') || 'none'));
  await browser.close();
})();
