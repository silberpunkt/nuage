/* cuts.js -- the four cuts of Nuage, from one source: 64, 128, 256, and 1024 KB. Each is one page, offline, carrying
   what its size can hold. Two parts can be cut at any boundary, and so fill whatever room a cut has left:
     Cyc, sliced by concept (the most connected kept, with their ancestors), for the smallest cut;
     Mimia, as a prefix of her file (each unit a smaller working Mimia), for the larger.
   The cuts:
     64    Nuage alone: no voice, no tilt, a slice of Cyc, no lexicon or analysis. Text, cards, and pictures.
     128   Nuage as it stands: all its cards, Cyc, the shelves, Ecouter's voice and the wall it draws, Wallbreaker.
     256   the pocket instrument: the 128, and the sound drawings in the talk, Aquavit and its viewer, and Mimia's core.
     1024  the 256 with the whole of Mimia.
       node pack/cuts.js [64 128 256 1024]     -> dist/cuts/nuage-<n>k.html, and dist/cuts/MANIFEST.txt
   Sizes are aims, not oaths: a cut says in its manifest what it holds, what it left out, and how big it came out. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'dist', 'cuts'), TMP = path.join(OUT, '.work');
const K = (n) => (n / 1024).toFixed(1) + ' KB';
const want = process.argv.slice(2).map(Number).filter(Boolean); const SIZES = want.length ? want : [64, 128, 256, 1024];
fs.mkdirSync(TMP, { recursive: true });
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const has = (p) => fs.existsSync(path.join(ROOT, p));
const pack = (args, out) => { execFileSync(process.execPath, [path.join(ROOT, 'pack', 'pack.js')].concat(args, ['--out', out]), { cwd: ROOT, stdio: 'pipe' }); return fs.statSync(out).size; };
const otherKb = ['kb/vext.txt', 'kb/pictures.txt', 'kb/taught.kb'].filter(has);

// ---- CYC, SLICED: rank concepts by how much hangs on them and whether our own cards and questions use them
function cycSlice(n) {
  const lines = rd('kb/cyc.kb').split('\n'), kids = {}, up = {}, ours = rd('kb/seed.kb') + (has('kb/taught.kb') ? rd('kb/taught.kb') : '') + rd('test/score.txt');
  for (const l of lines) { const m = l.match(/^\(genls (\S+) (\S+)\)/); if (m) { kids[m[2]] = (kids[m[2]] || 0) + 1; (up[m[1]] = up[m[1]] || []).push(m[2]); } }
  const all = new Set(); for (const l of lines) { const m = l.match(/^\((?:genls|comment|word|disjoint|mass|isa) (\S+)/); if (m) all.add(m[1]); }
  const said = (c) => new RegExp('\\b' + c.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase() + '\\b').test(ours.toLowerCase()) ? 3 : 0;
  const rank = [...all].map((c) => [c, (kids[c] || 0) + said(c)]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const keep = new Set(); const add = (c) => { if (keep.has(c)) return; keep.add(c); (up[c] || []).forEach(add); };
  rank.slice(0, n).forEach(([c]) => add(c));
  const out = lines.filter((l) => { if (/^;/.test(l)) return true; const names = (l.match(/\(\w+ ([A-Z]\w*)(?: ([A-Z]\w*))?/) || []).slice(1).filter(Boolean); return names.length && names.every((x) => keep.has(x)); });
  return { text: out.join('\n'), concepts: keep.size, of: all.size };
}

// ---- THE MODULES, joined at the page's one door (window.NUAGE)
const script = (src) => '<script>\n' + src + '\n</script>\n';
const mimiaBin = has('patty/mimia/mimia.bin') ? fs.readFileSync(path.join(ROOT, 'patty/mimia/mimia.bin')) : null;
const MHEAD = 4376, MREC = 245;   // as grind.py writes them; checked against the file's own header below
function mimiaMod(units) {
  const h = mimiaBin.readUInt16LE(12), inn = mimiaBin.readUInt16LE(14), v = mimiaBin.readUInt16LE(10), d = mimiaBin[6];
  const head = 20 + v * d + 4 + v * d + 2 * v, rec = 6 + Math.ceil(inn / 5) + Math.ceil(v / 5), u = Math.min(units, h);
  const bin = mimiaBin.subarray(0, head + u * rec);
  return { html: script(rd('patty/mimia/mimia.js')) + script(rd('src/mods/mimia.mod.js').replace("B64 = '__MIMIA_B64__'", () => "B64 = '" + bin.toString('base64') + "'").replace("SIZE = '__MIMIA_NOTE__'", () => "SIZE = '" +  u + ' of ' + h + ' units, ' + K(bin.length) + "'")), units: u, of: h, bytes: bin.length, rec };
}
const soundMod = () => script(rd('words/noct-draw.js')) + script(rd('src/mods/sound.mod.js'));
function aquavitMod() {
  const yaml = require(path.join(ROOT, '..', '__libs', 'js-yaml.min.js'));
  const f = path.join(ROOT, '..', '..', '__tl', '__readme', 'Great YOWLs', 'aquavit - the axis mundi.yowl.yaml');
  if (!fs.existsSync(f)) return null;
  const doc = yaml.load(fs.readFileSync(f, 'utf8')), pal = {};
  (doc.palette || []).forEach((p) => { const [k, hx] = String(p).split(/\s+/); pal[k] = hx; });
  let sec = ''; const cards = doc.cards.map((c) => { const s0 = c.section && c.section !== sec ? (sec = c.section) : ''; return { section: s0, word: c.word, anglo: c.anglo, art: c.art, paint: c.paint, from: c.from, say: c.say }; });
  return script(rd('src/mods/aquavit.mod.js').replace('DECK = __AQUAVIT__', () => 'DECK = ' + JSON.stringify({ prelude: String(doc.prelude || '').replace(/\s+/g, ' ').trim(), palette: pal, cards })));
}
const insert = (page, extra, title) => page.replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>').replace(/<\/html>\s*$/, extra + '</html>\n');

// ---- BUILD
const manifest = ['; MANIFEST.txt -- the four cuts of Nuage, built ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' by pack/cuts.js', ''];
const base = path.join(TMP, 'base.html'), baseSize = pack([], base), basePage = fs.readFileSync(base, 'utf8');
const aq = aquavitMod(), snd = soundMod();
for (const n of SIZES) {
  const out = path.join(OUT, 'nuage-' + n + 'k.html'), target = n * 1024; let note = [];
  if (n <= 64) {   // the slice of Cyc that fits
    const total = cycSlice(1e9).concepts; let lo = 0, hi = total, best = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, sl = cycSlice(mid), kf = path.join(TMP, 'cyc-slice.kb'); fs.writeFileSync(kf, sl.text);
      const size = pack(['--no-libs', '--lean', 'kb/seed.kb', kf].concat(otherKb), out);
      if (size <= target) { best = { mid, sl, size }; lo = mid + 1; } else hi = mid - 1;
    }
    if (!best) { const sl = cycSlice(300); best = { mid: 300, sl }; }   // over the aim even bare: keep the 300 most-used concepts anyway, and say so in the manifest
    if (best) { const kf = path.join(TMP, 'cyc-slice.kb'); fs.writeFileSync(kf, best.sl.text); pack(['--no-libs', '--lean', 'kb/seed.kb', kf].concat(otherKb), out); }
    const pg = fs.readFileSync(out, 'utf8'); fs.writeFileSync(out, insert(pg, '', 'Nuage, the 64 KB cut'));
    note = ['holds:  Nuage, its seed and taught cards, the pictures, and Cyc sliced to ' + (best ? best.sl.concepts + ' of ' + best.sl.of + ' concepts' : 'nothing'), 'leaves out:  Ecouter (voice, colour, the wall), Wallbreaker (tilt), the shelves (flags, sky and science), the About box in full (its summary stays), the lexicon, the AI analysis'];
  } else if (n <= 128) {
    fs.writeFileSync(out, insert(basePage, '', 'Nuage, the 128 KB cut'));
    note = ['holds:  Nuage as it stands: every card, Cyc (2,000 everyday concepts), the shelves, Ecouter’s voice and the wall it draws while speaking, Wallbreaker, the lexicon, the AI analysis', 'leaves out:  Mimia, Aquavit, the sound drawings in the talk'];
  } else {
    const fixed = Buffer.byteLength(insert(basePage, snd + (aq || ''), 'x'), 'utf8');
    let units = mimiaBin ? mimiaBin.readUInt16LE(12) : 0;
    if (mimiaBin && n < 1024) { const m0 = mimiaMod(0), room = target - fixed - Buffer.byteLength(m0.html, 'utf8'); units = Math.max(0, Math.floor(room * 3 / 4 / m0.rec)); }
    const mm = mimiaBin ? mimiaMod(units) : null;
    fs.writeFileSync(out, insert(basePage, snd + (aq || '') + (mm ? mm.html : ''), 'Nuage, the ' + n + ' KB cut'));
    note = ['holds:  the 128 cut, the sound drawings in the talk ("draw the sound of glimmer"), ' + (aq ? 'Aquavit and its viewer (' + 'the Aquavit button), ' : '') + (mm ? 'and Mimia, ' + mm.units + ' of her ' + mm.of + ' units (' + K(mm.bytes) + ')' : 'and no Mimia (no mimia.bin)'), 'leaves out:  ' + (mm && mm.units < mm.of ? 'the rest of Mimia, ' : '') + 'the word libraries (CMUdict, WordNet, Wiktionary), which stay outer'];
  }
  const size = fs.statSync(out).size;
  manifest.push('nuage-' + n + 'k.html   ' + K(size) + ' (aim ' + n + ' KB)', '  ' + note.join('\n  '), '');
  console.log('cut ' + n + ': ' + K(size) + '   ' + note[0].slice(0, 110));
}
fs.writeFileSync(path.join(OUT, 'MANIFEST.txt'), manifest.join('\n'));
fs.rmSync(TMP, { recursive: true, force: true });
console.log('cuts: written to dist/cuts, with MANIFEST.txt');
