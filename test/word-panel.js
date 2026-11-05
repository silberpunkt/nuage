(async () => {
  const chromium = require('@sparticuz/chromium').default, puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', args: chromium.args.concat(['--no-sandbox']) });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.setViewport({ width: 1000, height: 1100 });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  await page.goto('http://localhost:8099/__nuage/dist/nuage.html'); await page.waitForFunction(() => document.getElementById('pk-open') && !document.getElementById('pk-open').hidden, { timeout: 20000 });
  await page.waitForFunction(() => !document.getElementById('i').disabled, { timeout: 20000 });
  await page.evaluate(() => { document.getElementById('opt').open = true; if (document.getElementById('pk').hidden) document.getElementById('pk-open').click(); }); await sleep(1500);
  console.log('panel hidden:', await page.$eval('#pk', e => e.hidden), '| row hidden:', await page.$eval('#pk-wd', e => e.hidden || getComputedStyle(e).display));
  console.log(await page.$eval('#pk-ws', e => e.textContent));
  console.log('handler set:', await page.$eval('#pk-w', e => typeof e.onkeydown), '| count of #pk-w:', await page.$$eval('#pk-w', l => l.length), '| active:', await page.evaluate(() => document.activeElement.id));
  for (let k = 0; k < 20; k++) { const ok = await page.evaluate(() => { document.getElementById('opt').open = true; const pk = document.getElementById('pk'); if (pk.hidden) document.getElementById('pk-open').click(); const w = document.getElementById('pk-w'); w.scrollIntoView(); w.focus(); return document.activeElement === w; }); if (ok) break; await sleep(300); }
  console.log('active after focus:', await page.evaluate(() => document.activeElement.id), await page.$eval('#pk-w', e => [e.disabled, !!e.offsetParent, e.outerHTML, e.closest('[inert]') ? 'inert' : '', getComputedStyle(e).visibility, e.getBoundingClientRect().height].join(' | '))); await page.type('#pk-w', 'proximal'); await page.keyboard.press('Enter'); await sleep(7000);
  console.log(await page.evaluate(() => { return [...document.querySelectorAll('#o > div')].slice(-3).map(d => d.className + ' | ' + getComputedStyle(d).whiteSpace + ' | ' + d.textContent).join('\n---\n'); }));
  await page.evaluate(() => { const d = [...document.querySelectorAll('#o > div')].pop(); d.scrollIntoView(); });
  await page.evaluate(() => { const d = document.querySelector('#o .td'); d.scrollIntoView(); }); await page.screenshot({ path: '/tmp/wordpanel.png' }); console.log('errors:', errs.join('; ') || 'none'); await browser.close();
})();
