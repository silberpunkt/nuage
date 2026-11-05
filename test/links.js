const path = require('path');
(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const [pg, shot] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox', '--allow-file-access-from-files']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1100 });
  await page.goto('file://' + path.resolve(pg)); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => document.getElementById('i') && !document.getElementById('i').disabled, { timeout: 20000 });
  console.log('status:', await page.$eval('#l', e => e.textContent));
  const ask = async (q) => { await page.type('#i', q); await page.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 150)); };
  const click = async (sel) => { const el = await page.$(sel); const b = await el.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await new Promise(r => setTimeout(r, 250)); };
  await ask('Tell me about the flag of Norway.'); await ask('More.'); await ask('More.');
  console.log('vext reply:\n' + await page.$$eval('#o .n', e => e[e.length - 1].dataset.t));
  await ask('What is tea?'); await ask('What is a dog?');
  console.log('highlights:', await page.evaluate(() => [CSS.highlights.get('nu-thing').size, CSS.highlights.get('nu-cat').size]));
  // click the word "mammal" in the last reply
  const pt = await page.evaluate(() => { const n = [...document.querySelectorAll('#o .n')].pop(); const tw = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = tw.nextNode())) { const i = t.data.indexOf('mammal'); if (i >= 0) { const r = document.createRange(); r.setStart(t, i + 2); r.setEnd(t, i + 3); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } } return null; });
  if (pt) { await page.mouse.click(pt.x, pt.y); await new Promise(r => setTimeout(r, 200)); }
  console.log('after clicking "mammal":', await page.$$eval('#o .u', e => e[e.length - 1].dataset.t), '->', await page.$$eval('#o .n', e => e[e.length - 1].dataset.t));
  await click('#rail'); console.log('railyard stripes:', await page.$$eval('#o .r', e => e.length), '| e.g.', await page.$$eval('#o .r', e => e.length ? e[e.length - 1].textContent : ''));
  for (let i = 0; i < 12; i++) await ask('What is a cat?');
  const layout = await page.evaluate(() => { const o = document.getElementById('o'), f = document.getElementById('f').getBoundingClientRect(); return { scrolls: o.scrollHeight > o.clientHeight, bottomOfEntry: Math.round(f.bottom), viewport: innerHeight, atEnd: Math.abs(o.scrollTop + o.clientHeight - o.scrollHeight) < 4 }; });
  console.log('layout:', JSON.stringify(layout));
  await page.screenshot({ path: shot });
  console.log('errors:', errs.join(' | ') || 'none'); await browser.close();
})();
