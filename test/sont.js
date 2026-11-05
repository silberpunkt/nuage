const path = require('path');
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.setViewport({ width: 1000, height: 700 });
  await page.goto('file://' + path.resolve('dist/nuage.html')); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => document.getElementById('i') && !document.getElementById('i').disabled, { timeout: 20000 });
  for (const q of ['What is a penguin?', 'What does it eat?', 'Can it fly?', '2 > 1.', 'Do stars twinkle because the air moves?']) { await page.type('#i', q); await page.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 200)); }
  console.log(await page.$eval('#sont', e => e.textContent + ' | ' + e.className + ' | ' + e.title));
  await page.screenshot({ path: 'test/sontimeter.png' }); console.log('errors:', errs.join('; ') || 'none'); await browser.close();
})();
