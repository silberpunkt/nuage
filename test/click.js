const path = require('path');
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [pg, shot] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.setViewport({ width: 900, height: 1400 });
  await page.goto('file://' + path.resolve(pg)); await page.waitForFunction(() => document.getElementById('s') && !document.getElementById('s').disabled);
  const box = await (await page.$('#s')).boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => !document.getElementById('s').disabled && document.querySelectorAll('#o .h').length >= 3, { timeout: 60000 });
  const n = await page.evaluate(() => [document.querySelectorAll('#o .u').length, document.querySelectorAll('#o .n').length, [...document.querySelectorAll('#o .h')].map(h => h.textContent).join(' | ')]);
  await page.screenshot({ path: shot }); console.log('turns', n[0], 'replies', n[1], 'dividers:', n[2], '| errors:', errs.join('; ') || 'none'); await browser.close();
})();
