const path = require('path');
(async () => {
  const chromium = require('@sparkle/chromium'.replace('@sparkle', '@sparticuz')).default, puppeteer = require('puppeteer-core');
  const [pg, shot, shot2] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1100 });
  await page.goto('file://' + path.resolve(pg)); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => document.getElementById('i') && !document.getElementById('i').disabled, { timeout: 20000 });
  const ask = async (q) => { await page.type('#i', q); await page.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 400)); };
  await ask('What is tea?'); await ask('What is a substance?'); await ask('What is a dog?');
  console.log('rings:', await page.$$eval('#rings i', e => e.length), '| underlined things:', await page.evaluate(() => CSS.highlights.get('nu-thing').size));
  await page.screenshot({ path: shot });
  await ask('Draw yourself.'); await ask('Draw the flag of Norway.'); await ask('Draw a horse.');
  console.log('pictures:', await page.$$eval('#o .p', e => e.length), '| coloured spans in flag:', await page.$$eval('#o .p', e => e[e.length - 1].querySelectorAll('span').length), '| colours:', await page.$$eval('#o .p', e => [...new Set([...e[e.length - 1].querySelectorAll('span')].map(s => s.style.color))].join(' ')));
  console.log('last reply:', await page.$$eval('#o .n', e => e[e.length - 1].dataset.t));
  await page.screenshot({ path: shot2 });
  console.log('errors:', errs.join(' | ') || 'none'); await browser.close();
})();
