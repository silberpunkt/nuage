/* boot.js -- the unpacker, and its bar. The bar is true: each segment is one stage, and its fill is that stage's own
   count (bytes out of the inflater, characters read, assertions indexed, words learned). The segment WIDTHS are the
   packer's own timing of each stage, measured when it packed; nothing is eased, padded or faked.

   The payload rides in the page seven bits to a character (after base-122): plain UTF-8, whatever a server calls it.
   A character below 128 is seven bits; one from U+0100 is a forbidden seven (NUL, CR, '<') and the seven after it. */
(async () => {
  try { const pf = JSON.parse(localStorage.getItem('nuage.prefs') || '{}'); if (pf.theme) document.documentElement.dataset.theme = pf.theme; if (pf.size) document.documentElement.style.fontSize = pf.size + '%'; } catch (e) {}   // the reader's theme and size, before anything is drawn
  const H = __H__, $ = (i) => document.getElementById(i), seg = [], logo = [], lab = $('l');
  try { const pf0 = JSON.parse(localStorage.getItem('nuage.prefs') || '{}'); if (pf0.bar === false) { $('b').hidden = true; $('lg').hidden = false; } } catch (e) {}   // the graph folded into her mark last time: so again
  const SAY = { inflate: 'Unpacking', read: 'Reading', index: 'Indexing', words: 'Learning words', voice: 'Waking the voice' };
  H.s.forEach((name, k) => {
    const d = document.createElement('i'), nm = SAY[name] || name; d.style.flexGrow = H.w[k];
    d.innerHTML = '<u role=progressbar aria-label="' + nm + '" aria-valuemin=0 aria-valuemax=100 aria-valuenow=0><b></b></u><span>' + nm + '</span>';
    $('b').appendChild(d); seg.push(d.querySelector('b'));
    const g = document.createElement('i'); g.style.flexGrow = H.w[k]; g.innerHTML = '<b></b>'; $('lg').appendChild(g); logo.push(g.firstChild);   // the logo: the same graph, at button height
  });
  const set = (k, f) => { const p = 100 * Math.min(1, f); seg[k].style.width = p.toFixed(2) + '%'; logo[k].parentNode.style.setProperty('--p', p.toFixed(2) + '%'); seg[k].parentNode.setAttribute('aria-valuenow', Math.round(p)); };
  const frame = () => new Promise((r) => requestAnimationFrame(r)), t0 = performance.now();

  // bytes home, seven bits a character, then inflated by the browser's own inflater, fed in slices, counted as it comes out
  const ILL = [0, 10, 13, 60];
  const unpack = async (id, n, tick, zn, za) => {
    const t = $(id).text, src = new Uint8Array(zn); let acc = 0, nb = 0, m = 0;
    const put = (v) => { acc = (acc << 7) | v; nb += 7; if (nb >= 8) { nb -= 8; if (m < zn) src[m++] = (acc >> nb) & 255; acc &= (1 << nb) - 1; } };
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c === 10 || c === 13) continue; if (c < 128) put(c); else if (c < 0x500) { put(ILL[(c - 0x100) >> 7]); put((c - 0x100) & 127); } else put(ILL[c - 0x500]); }
    if (!m) return '';
    let a1 = 1, b1 = 0; for (let i = 0; i < m; i++) { a1 = (a1 + src[i]) % 65521; b1 = (b1 + a1) % 65521; }   // the page's own check sum: say so plainly if the data was changed on its way
    if (za !== undefined && b1 * 65536 + a1 !== za) { lab.textContent = 'The page\'s data does not match its check sum, so it was changed on its way here (perhaps re-encoded, or cut short). Please fetch it again.'; throw new Error('nuage: check sum mismatch in ' + id); }
    const ds = new DecompressionStream('deflate-raw'), wr = ds.writable.getWriter(), rd = ds.readable.getReader(), out = new Uint8Array(n);
    (async () => { for (let i = 0; i < m; i += 2048) await wr.write(src.subarray(i, Math.min(m, i + 2048))); await wr.close(); })();
    let got = 0;
    for (;;) { const r = await rd.read(); if (r.done) break; out.set(r.value, got); got += r.value.length; if (tick) await tick(got); }
    return new TextDecoder().decode(out);
  };
  const text = await unpack('z', H.n, async (got) => { set(0, got / H.n); lab.textContent = 'Unpacking, ' + got.toLocaleString('en-US') + ' of ' + H.n.toLocaleString('en-US') + ' bytes.'; await frame(); }, H.zn, H.za);

  // wake the payload and run its stages, each counting itself
  const N = (0, eval)(text);
  for (let k = 0; k < N.stages.length; k++) {
    let last = performance.now(); lab.textContent = (SAY[N.stages[k].name] || N.stages[k].name) + '.';
    for (const f of N.stages[k].run()) { set(k + 1, f); if (performance.now() - last > 12) { await frame(); last = performance.now(); } }
    set(k + 1, 1); await frame();
  }
  // the rest is the conversation, which the payload spawns for itself
  await new Function('C', 'return (async () => {\n' + N.ui + '\n})();')({ N, unpack, H, lab, t0, $ });
})();
