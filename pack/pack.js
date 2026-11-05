/* pack.js -- engine + knowledge -> one page, dist/nuage.html, with a budget report.
     node pack/pack.js [kb files...] [--talk test/x.txt]     (default kb/seed.kb, test/talk.txt)
   Steps: join the payload; trim comments and indentation (safely: whole-line // comments and block comments at a
   line's start only); deflate (raw, level 9); time every stage here in Node so the bar's widths are honest; escape
   the bytes for a windows-1252 page; write; then read the page back the way a browser would and check every byte
   and a short conversation. Reports what better packers would reach (brotli, zstd, xz) against the three budgets. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), { performance } = require('perf_hooks');
const ROOT = path.join(__dirname, '..'), rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ARGS = process.argv.slice(2), TALK = ARGS.includes('--talk') ? ARGS.splice(ARGS.indexOf('--talk'), 2)[1] : 'test/talk.txt';
const NOLIBS = ARGS.includes('--no-libs'); if (NOLIBS) ARGS.splice(ARGS.indexOf('--no-libs'), 1);   // the voice and the tilt are optional luggage
const LEAN = ARGS.includes('--lean'); if (LEAN) ARGS.splice(ARGS.indexOf('--lean'), 1);   // the smallest cut leaves out the analysis and the lexicon, and says so
const OUT = ARGS.includes('--out') ? ARGS.splice(ARGS.indexOf('--out'), 2)[1] : path.join(ROOT, 'dist', 'nuage.html');   // the cuts are written elsewhere
const KBS = ARGS.length ? ARGS : ['kb/seed.kb'].concat(['kb/cyc.kb', 'kb/vext.txt', 'kb/pictures.txt', 'kb/taught.kb'].filter((f) => fs.existsSync(path.join(ROOT, f)))), KBF = KBS.join(' + ');   // several knowledge files are read as one

// A NOSE FOR THE TRAP (5 xi 2026, twice in one day): a remark at the end of a line that has a declaration after it has
// swallowed the declaration. The packer refuses such a line, naming it, and will not write the page.
function nose(js, name) {
  js.split('\n').forEach((l, i) => { const k = l.indexOf('//'); if (k < 0 || /^\s*\/\//.test(l) || /['"`]/.test(l.slice(0, k).replace(/'[^']*'|"[^"]*"|`[^`]*`/g, ''))) return;
    if (/\b(let|const|var|function)\s+\w+\s*[=(]/.test(l.slice(k + 2))) throw new Error(name + ':' + (i + 1) + ': a remark at the end of the line has a declaration after it, which it swallows: ' + l.trim().slice(0, 100)); });
  return js;
}
function trim(js) {
  return js.replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '').split('\n').filter((l) => !/^\s*\/\//.test(l) && l.trim()).map((l) => l.trim()).join('\n');
}
function vext(t) {   // "<vext> Title" and its indented lines become (vext "Title" "lines..."): the indentation is the information, so it is kept
  return t.split('\n').filter((l) => !/^;/.test(l)).join('\n').split(/^<vext>\s*/m).filter((b) => b.trim()).map((b) => { const ls = b.split('\n'), title = ls.shift().trim(), q = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    return '(vext ' + q(title) + ' ' + q(ls.filter((l) => l.trim()).join('\n')) + ')'; }).join('\n');
}
function trimKb(kb) { return kb.split('\n').map((l) => (/^\s*;/.test(l) ? '' : l.trim())).filter(Boolean).join('\n'); }

const tails = (js) => (LEAN ? js.split('\n').map((l) => l.replace(/([;{})\],])\s{2,}\/\/ .*$/, '$1')).join('\n') : js);   // the smallest cut sheds the notes at the ends of lines too; the source keeps them
const engine = tails(trim(nose(rd('src/nuage.js'), 'src/nuage.js'))), kb = KBS.map((f) => { const t = fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'); return /vext\.txt$/.test(f) ? vext(t) : /pictures\.txt$/.test(f) ? t.split('\n').filter((l) => !/^;/.test(l)).join('\n') : trimKb(t); }).join('\n');
const sample = rd('src/sample.txt').split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
const libs = NOLIBS ? {} : { ecouter: fs.readFileSync(path.join(ROOT, 'vendor/ecouter.min.js'), 'utf8'), wallbreaker: '/* Wallbreaker, MIT licence (vendor/wallbreaker-LICENSE.txt) */\n' + trim(fs.readFileSync(path.join(ROOT, 'vendor/wallbreaker.js'), 'utf8')), yampal: '/* yampal.js, the colorburst grammar of Vespers, MIT licence */\n' + trim(fs.readFileSync(path.join(ROOT, 'vendor/yampal.js'), 'utf8')) };   // their notes stay in vendor/; the luggage carries the code
const aboutFull = LEAN ? '<p>This is the smallest cut of Nuage: its own cards and a slice of Cyc, with no voice and no tilt. The About box in full, with its citations, rides in the larger cuts, and its summary stands at the top of this page.</p>' : rd('src/about.html').replace(/^<!--[\s\S]*?-->\s*/, '').trim();
const analysis = LEAN ? '<p>This is the smallest cut of Nuage. The AI analysis rides in the larger cuts.</p>' : rd('src/analysis.html').replace(/^<!--[\s\S]*?-->\s*/, '').trim();
const credits = [...new Set(KBS.map((f) => (fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8').match(/^; derived from (.*)$/m) || [])[1]).filter(Boolean))];
const creditBody = '<p>' + (credits.length ? 'Knowledge from ' + credits.join(', and from ').replace(/</g, '&lt;').replace(/\(c\)/g, '&copy;').replace(/(\d{4})-(\d{4})/g, '$1&ndash;$2').replace(/,? under CC BY 3\.0 \(creativecommons\.org\/licenses\/by\/3\.0\)/, ', under the Creative Commons Attribution 3.0 licence').replace(/^OpenCyc /, '<a href="https://github.com/asanchez75/opencyc">OpenCyc</a>, ') + '.' : '')
  + (KBS.some((f) => /Open English WordNet/.test(fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'))) ? ' Some cards kept by your ruling quote <a href="https://en-word.net">Open English WordNet 2025</a>, under the Creative Commons Attribution 4.0 licence.' : '')
  + (NOLIBS ? '' : ' Voice and colour from <a href="https://github.com/silberpunkt/ecouter">Ecouter</a>. The tilt is Wallbreaker\'s and the painted pictures are by the grammar of Vespers, both of this house, under the MIT licence.') + ' The word libraries, when fetched, are CMUdict, Open English WordNet, and Wiktionary, each under its own licence, named in their folder.</p>';   // CC BY and MIT ask for credit where the work is shown
const credit = '<p id=c>Credits: ' + [credits.length ? '<a href="https://github.com/asanchez75/opencyc">OpenCyc</a>' : '', NOLIBS ? '' : '<a href="https://github.com/silberpunkt/ecouter">Ecouter</a>'].filter(Boolean).join(', ') + ', and many more in the <button id=ab-c>About</button> window.</p>';   // the line names those who did the most (User1); the rest is told in About
const ui = tails(trim(nose(rd('src/ui.js'), 'src/ui.js'))).replace('__ABOUT__', () => JSON.stringify(aboutFull + '<h3>Credits</h3>' + creditBody)).replace('__ANALYSIS__', () => JSON.stringify(analysis)).replace('__LEXICON__', () => JSON.stringify(LEAN ? '<p>This is the smallest cut of Nuage. The lexicon rides in the larger cuts.</p>' : rd('src/lexicon.html').replace(/^<!--[\s\S]*?-->\s*/, '').trim()));   // the About box in full, compressed with the rest
const THATCH = 1200, thatchLen = Buffer.byteLength((rd('src/page.html').match(/<pre class=th>[\s\S]*?<\/pre>/) || [''])[0]);   // the plain-text summary has a budget of its own
// SHELVES: knowledge that waits in its own block, read in only when first asked about ("[Loading Flags of Our World.]")
const SHELVES = { flags: { name: 'Flags of Our World', files: ['kb/shelf-flags.txt', 'kb/shelf-flags-pictures.txt'] }, science: { name: 'Sky and Science', files: ['kb/shelf-science.kb'] } };
const shelves = {}; if (!LEAN) for (const [k, v] of Object.entries(SHELVES)) { const fsx = v.files.filter((f) => fs.existsSync(path.join(ROOT, f))); if (fsx.length) shelves[k] = { name: v.name, kb: fsx.map((f) => { const t = rd(f); return /pictures\.txt$/.test(f) ? t.split('\n').filter((l) => !/^;/.test(l)).join('\n') : /\.kb$/.test(f) ? trimKb(t) : vext(t); }).join('\n') }; }
const shelfRaw = Buffer.from(JSON.stringify(shelves), 'utf8'), shelfDef = zlib.deflateRawSync(shelfRaw, { level: 9, memLevel: 9 });
const shelve = (N) => { for (const v of Object.values(shelves)) N.more(v.kb); return N; };
const payload = engine + '(' + JSON.stringify(kb) + ',' + JSON.stringify(sample) + ',' + JSON.stringify(ui) + ')', raw = Buffer.from(payload, 'utf8');
{ const qjs = ['/tmp/qjs', path.join(ROOT, '..', '__remanent', 'quickjs', 'quickjs-linux-x86_64-2026-06-04', 'qjs')].find((p) => fs.existsSync(p));   // the strictest reader at hand reads the page first (User1: qjs redeems)
  if (qjs) { const chk = path.join(ROOT, 'dist', '.parse.mjs'); fs.mkdirSync(path.dirname(chk), { recursive: true }); fs.writeFileSync(chk, "import * as std from 'std';\nconst src = std.loadFile(scriptArgs[1]);\ntry { new Function(src); new Function('C', 'return (async () => {\\n' + JSON.parse(std.loadFile(scriptArgs[2])) + '\\n})();'); print('ok'); } catch (e) { print('refused: ' + e.message + ' ' + String(e.stack || '').split('\\n')[0]); }\n");
    const uiF = path.join(ROOT, 'dist', '.ui.json'); fs.writeFileSync(uiF, JSON.stringify(ui)); const engF = path.join(ROOT, 'dist', '.engine.js'); fs.writeFileSync(engF, engine);
    const r = require('child_process').spawnSync(qjs, [chk, engF, uiF], { encoding: 'utf8' }); [chk, uiF, engF].forEach((f) => fs.unlinkSync(f));
    if (!/^ok/.test(r.stdout || '')) throw new Error('QuickJS refused the payload: ' + (r.stdout || r.stderr).trim()); } }
const libRaw = Buffer.from(NOLIBS ? '' : JSON.stringify(libs), 'utf8'), libDef = libRaw.length ? zlib.deflateRawSync(libRaw, { level: 9, memLevel: 9 }) : Buffer.alloc(0);   // its own block: inflated only when first wanted, so waking stays quick
const def = zlib.deflateRawSync(raw, { level: 9, memLevel: 9 });

// time each stage, as the browser will run it
const ms = (f, n) => { const a = performance.now(); for (let i = 0; i < n; i++) f(); return (performance.now() - a) / n; };
const tInflate = ms(() => zlib.inflateRawSync(def), 20);
const N0 = (0, eval)(payload), times = [tInflate], names = ['inflate'];
for (const s of N0.stages) { const a = performance.now(); for (const _ of s.run()); times.push(performance.now() - a); names.push(s.name); }
const most = Math.max(...times), widths = times.map((t) => +Math.max(t, most / 12).toFixed(3));   // none narrower than 1/12 of the widest, so its name can be read

// escape for the latin-1 page: NUL, CR, '<' and the escape byte 1 itself
// SEVEN BITS A CHARACTER (after Kevin Albertson's base-122): the deflated bytes are read seven bits at a time, and each
// seven become one ASCII character, which UTF-8 keeps as one byte. Three sevens cannot stand in a script's text (NUL, CR,
// and '<'); one of those is folded with the seven after it into a single two-byte character above U+0100. So the page is
// honest UTF-8, whatever a server says of it, at a cost of an eighth (8 bits carried for every 7).
const ILL = [0, 10, 13, 60], WRAP = 320;   // line feed is forbidden too, so the data can stand in lines a reader can scroll
const adler = (b) => { let a1 = 1, b1 = 0; for (const x of b) { a1 = (a1 + x) % 65521; b1 = (b1 + a1) % 65521; } return b1 * 65536 + a1; };   // the check sum the boot compares
function enc7(buf) {
  let out = '', acc = 0, nb = 0; const ch = [];
  for (const b of buf) { acc = (acc << 8) | b; nb += 8; while (nb >= 7) { nb -= 7; ch.push((acc >> nb) & 127); } acc &= (1 << nb) - 1; }
  if (nb) ch.push((acc << (7 - nb)) & 127);
  for (let i = 0; i < ch.length; i++) {
    const k = ILL.indexOf(ch[i]);
    if (k < 0) out += String.fromCharCode(ch[i]);
    else if (i + 1 < ch.length) out += String.fromCharCode(0x100 + ((k << 7) | ch[++i]));
    else out += String.fromCharCode(0x500 + k);
  }
  return out.replace(new RegExp('[^]{1,' + WRAP + '}', 'g'), '\r\n$&') + '\r\n';   // lines of 320, Windows breaks; the reader skips them
}
function dec7(t, n) {
  const out = new Uint8Array(n); let acc = 0, nb = 0, m = 0;
  const put = (v) => { acc = (acc << 7) | v; nb += 7; if (nb >= 8) { nb -= 8; if (m < n) out[m++] = (acc >> nb) & 255; acc &= (1 << nb) - 1; } };
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); if (c === 10 || c === 13) continue; if (c < 128) put(c); else if (c < 0x500) { put(ILL[(c - 0x100) >> 7]); put((c - 0x100) & 127); } else put(ILL[c - 0x500]); }
  return out;
}
const esc = enc7(def), escL = enc7(libDef), escS = enc7(shelfDef);
const boot = trim(rd('src/boot.js')).replace('__H__', JSON.stringify({ n: raw.length, zn: def.length, za: adler(def), s: names, w: widths, ln: libRaw.length, lz: libDef.length, la: adler(libDef), sn: shelfRaw.length, sz: shelfDef.length, sa: adler(shelfDef) }));
// THE FAVICON (User1): her mark, the four stages at their true widths in the one gradient, a pixel of dark between, the
// corners turned by a pixel; drawn at pack time from the same timings the bar is drawn from, so the tab shows her waking
const favicon = (() => { const S = 32, G = 1, sum = widths.reduce((a, b) => a + b, 0), free = S - G * (widths.length - 1); let x = 0; const bars = widths.map((w, i) => { const bw = Math.max(1, Math.round(w / sum * free)), r = '<rect x="' + x + '" y="0" width="' + bw + '" height="' + S + '" rx="1"/>'; x += bw + G; return r; }).join('');
  return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#3d6e8c"/><stop offset="1" stop-color="#9cc7dd"/></linearGradient><mask id="m"><g fill="#fff">' + bars + '</g></mask></defs><rect width="32" height="32" rx="1" fill="#0b0d10"/><rect width="32" height="32" fill="url(#g)" mask="url(#m)"/></svg>'); })();
const [head0, tail0] = rd('src/page.html').replace('<title>', '<link rel=icon href="' + favicon + '"><title>').split('__DATA__'), head = head0.replace(/\s*\/\*[\s\S]*?\*\//g, ''), tail = tail0.replace('</script>', '</script>' + credit);   // the style's notes stay in src/page.html, for readers of the source
const [tailA, tailBC] = tail.replace('__BOOT__', () => boot).split('__LIBS__'), [tailB, tailC] = tailBC.split('__SHELF__');
const crlf = (s0) => s0.replace(/\r?\n/g, '\r\n');   // Windows line breaks in the page's own markup (the data has none)
const html = Buffer.from(crlf(head) + esc + crlf(tailA) + escL + crlf(tailB) + escS + crlf(tailC), 'utf8');
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, html);

// read it back as a browser would: UTF-8, then seven bits a character, then inflate; both blocks
const text = new TextDecoder('utf-8', { fatal: true }).decode(html), cut = (id) => { const a = text.indexOf('<script type=x id=' + id + '>') + 20; return text.slice(a, text.indexOf('</script>', a)); };
const ok = Buffer.compare(zlib.inflateRawSync(Buffer.from(dec7(cut('z'), def.length))), raw) === 0 && (!libDef.length || Buffer.compare(zlib.inflateRawSync(Buffer.from(dec7(cut('y'), libDef.length))), libRaw) === 0)
  && Buffer.compare(zlib.inflateRawSync(Buffer.from(dec7(cut('x'), shelfDef.length))), shelfRaw) === 0;

const K = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
const br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_LGWIN]: 24 } }).length;
const zs = zlib.zstdCompressSync ? zlib.zstdCompressSync(raw, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } }).length : NaN;
let xz = NaN; try { xz = require('child_process').execSync('xz -9e --format=raw --stdout 2>/dev/null', { input: raw }).length; } catch (e) {}
console.log('nuage, packed from ' + KBF + (ok ? '  (read back byte for byte: ok)' : '  READ-BACK FAILED'));
console.log('  engine ' + K(Buffer.byteLength(engine)) + '   knowledge ' + K(Buffer.byteLength(kb)) + '   payload ' + K(raw.length));
console.log('  libraries (inflated only when first wanted) ' + K(libRaw.length) + ' -> ' + K(libDef.length));
console.log('  About box: full text ' + K(Buffer.byteLength(aboutFull)) + ' compressed in the payload; its thatch, in plain text, ' + thatchLen + ' of ' + THATCH + ' bytes' + (thatchLen > THATCH ? '  OVER ITS BUDGET' : ''));
console.log('  shelves (read in when first asked about: ' + Object.values(shelves).map((v) => v.name).join(', ') + ') ' + K(shelfRaw.length) + ' -> ' + K(shelfDef.length));
console.log('  deflate ' + K(def.length) + ' (' + (100 * def.length / raw.length).toFixed(1) + '%)   encoded ' + K(Buffer.byteLength(esc)) + ' (+' + (esc.length - def.length) + ' B)   page ' + K(html.length));
console.log('  what a better packer would reach: brotli ' + K(br) + '   zstd ' + K(zs) + '   xz ' + K(xz));
console.log('  stage times here (ms): ' + names.map((n, i) => n + ' ' + times[i].toFixed(2)).join('   '));
for (const [label, cap] of [['dream', 128], ['plan', 256], ['realize', 512]]) console.log('  ' + label.padEnd(8) + String(cap).padStart(4) + ' KB: ' + (100 * html.length / (cap * 1024)).toFixed(1).padStart(5) + '% used, ' + K(cap * 1024 - html.length) + ' left');
const N = (0, eval)(payload); for (const s of N.stages) for (const _ of s.run()); shelve(N);
console.log('\n  a short conversation (' + N.stat() + '):');
for (const q of rd(TALK).split('\n').filter((l) => l.trim() && l[0] !== '#')) console.log('   > ' + q + '\n     ' + N.chat(q));
// the SAMPLE CHAT button's run, checked: in the "can do" part, nothing should fall through to the old tricks
const N2 = (0, eval)(payload); for (const s of N2.stages) for (const _ of s.run()); shelve(N2);
let part = '', weak = [];
for (const q of N2.sample) { if (q[0] === '#') { part = q; continue; } const r = N2.chat(q); if (/can do/.test(part) && /^(Go on|Tell me more|I see\. And then|What would it mean|Why do you say)/.test(r)) weak.push(q + ' -> ' + r); }
console.log('\n  sample chat: ' + N2.sample.filter((q) => q[0] !== '#').length + ' turns' + (weak.length ? '; FELL THROUGH in the can-do part:\n    ' + weak.join('\n    ') : '; every can-do line answered on its own terms'));
