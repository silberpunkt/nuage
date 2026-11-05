/* aquavit.mod.js -- the canon's own deck, Aquavit (the axis mundi, distilled from the Great YOWLs), carried inside a
   larger cut of Nuage with a small grid viewer: every card with its section, word, anglo, painted art, say, and from-line,
   as the YOWL format draws them. pack/cuts.js fills __AQUAVIT__ from the deck's YAML. */
(function () {
  const go = () => (window.NUAGE ? init() : setTimeout(go, 150));
  const init = () => {
    const NU = window.NUAGE, DECK = __AQUAVIT__;
    const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const paint = (art, p) => {   // the paint field: "!default glyphs=pigment ...", the palette naming the colours
      const toks = String(p || '').split(/\s+/).filter(Boolean), map = {}, def = DECK.palette[(toks[0] || '!ink').slice(1)] || '#cfcbc2';
      toks.slice(1).forEach((t) => { const k = t.lastIndexOf('='); if (k > 0) for (const ch of Array.from(t.slice(0, k))) map[ch] = DECK.palette[t.slice(k + 1)] || def; });
      return art.map((l) => Array.from(l).map((ch) => (ch === ' ' ? ' ' : '<span style="color:' + (map[ch] || def) + '">' + esc(ch) + '</span>')).join('')).join('\n');
    };
    const cards = DECK.cards.map((c) => '<div class=aqc>' + (c.section ? '<div class=aqs>' + esc(c.section) + '</div>' : '') + '<div class=aqw>' + esc(c.word) + '</div><div class=aqa>' + esc(c.anglo) + '</div><pre>' + paint(c.art || [], c.paint) + '</pre><p>' + esc(c.say) + '</p><p class=aqf>' + esc(c.from) + '</p></div>').join('');
    document.head.insertAdjacentHTML('beforeend', '<style>#aq{width:min(76rem,96vw)}#aq .aqg{display:grid;grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr));gap:.8rem;padding:1rem 1.2rem}.aqc{border:1px solid var(--line);padding:.6rem .7rem}.aqs{color:#e0b050;font-size:.75rem;letter-spacing:.08em}.aqw{letter-spacing:.15em;color:var(--fieldink)}.aqa{color:var(--dim);font-size:.85rem}.aqc pre{margin:.5rem 0;line-height:1.15;font-size:.95rem}.aqc p{margin:.3rem 0;font-size:.85rem}.aqc .aqf{color:var(--dim);font-size:.75rem}#aq .aqp{padding:0 1.2rem;color:var(--dim);max-width:70ch}</style>');
    document.body.insertAdjacentHTML('beforeend', '<dialog id=aq class=bx aria-labelledby=aq-h><header><h2 id=aq-h>Aquavit: the axis mundi, distilled</h2><button id=aq-x>Close</button></header><p class=aqp>' + esc(DECK.prelude) + '</p><div class=aqg>' + cards + '</div></dialog>');
    const dlg = document.getElementById('aq'); document.getElementById('aq-x').onclick = () => dlg.close(); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    const b = document.createElement('button'); b.id = 'aq-o'; b.textContent = 'Aquavit'; b.title = 'The canon’s own deck: ' + DECK.cards.length + ' cards'; b.onclick = () => { dlg.showModal(); dlg.scrollTop = 0; };
    NU.tools.appendChild(b);
  };
  go();
})();
