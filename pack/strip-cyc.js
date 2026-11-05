/* strip-cyc.js -- OpenCyc's OWL export to an everyday pocket of knowing, measured.
     node pack/strip-cyc.js <opencyc-latest.owl.gz | .owl> --words <ranked word list> [--top 12000] [--max 3000]
                            [--gloss 80] [--out kb/cyc.kb] [--cache /tmp/cyc.json]
   OpenCyc is CC BY 3.0 (Cycorp, Inc.): whatever this writes carries that attribution in its first lines.

   1  parse: every owl:Class -- its English label, Cyc name, spoken forms, parents, disjoints, comment.
   2  choose: a concept is everyday when its label is a common English word or two (rank < --top in the word list,
      which is only a sieve at build time and never shipped); where several concepts share a label, the one with the
      most below it wins. Functional terms ("(AbnormalFn Cell)") are left out.
   3  contract: each chosen concept is filed under its nearest chosen ancestors, the unchosen in between squeezed
      out, and a parent dropped when another parent already lies beneath it.
   4  gloss: Cyc's comments are for logicians; "Each instance of Dog is a canine animal that..." gives "a canine
      animal that...". A comment that only restates the name ("The collection of all X") gives nothing.
   5  write (genls ...) (comment ...) (word ...) (disjoint ...) and report the bytes, deflated. */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const SRC = args[0], CACHE = opt('cache', '/tmp/cyc-parsed.json');
if (!SRC || !opt('words')) { console.log('node pack/strip-cyc.js <opencyc.owl[.gz]> --words <list> [--top 12000] [--max 3000] [--gloss 80] [--out kb/cyc.kb]'); process.exit(1); }
const K = (n) => (n / 1024).toFixed(1) + ' KB', D = (s) => zlib.deflateRawSync(Buffer.from(s), { level: 9 }).length;
const unx = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// ---- 1 parse (cached: the export is a quarter of a gigabyte)
let C;
if (fs.existsSync(CACHE) && fs.statSync(CACHE).mtimeMs > fs.statSync(SRC).mtimeMs) C = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
else {
  const t0 = Date.now(), buf = fs.readFileSync(SRC), xml = (/\.gz$/.test(SRC) ? zlib.gunzipSync(buf) : buf).toString('utf8');
  const PRETTY = 'Mx4rwLSVCpwpEbGdrcN5Y29ycA'; C = {};
  const re = /<owl:Class rdf:about="([^"]+)">([\s\S]*?)<\/owl:Class>/g; let m;
  while ((m = re.exec(xml))) {
    const b = m[2], one = (t) => { const r = b.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>')); return r ? unx(r[1]).trim() : ''; };
    const all = (r) => { const o = []; let q; while ((q = r.exec(b))) o.push(q[1]); return o; };
    C[m[1]] = { l: one('rdfs:label'), n: one('cycAnnot:label'), c: one('rdfs:comment'),
      p: all(/<rdfs:subClassOf rdf:resource="([^"]+)"/g), d: all(/<owl:disjointWith rdf:resource="([^"]+)"/g),
      w: all(new RegExp('<' + PRETTY + ' xml:lang="en">([^<]+)<', 'g')) };
  }
  fs.writeFileSync(CACHE, JSON.stringify(C));
  console.log('parsed ' + Object.keys(C).length + ' classes in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s (cached to ' + CACHE + ')');
}
const ids = Object.keys(C), byName = {};
ids.forEach((id) => { byName[C[id].n] = id; });
const kids = {}; ids.forEach((id) => C[id].p.forEach((p) => (kids[p] = kids[p] || []).push(id)));
const below = {};                                    // distinct concepts beneath, counted by a capped walk (stable, so sorting is sane)
function under(id) {
  if (below[id] !== undefined) return below[id];
  const seen = new Set([id]), q = [id];
  while (q.length && seen.size < 50000) { const x = q.pop(); (kids[x] || []).forEach((k) => { if (!seen.has(k)) { seen.add(k); q.push(k); } }); }
  return (below[id] = seen.size - 1);
}
console.log('OpenCyc: ' + ids.length + ' classes, ' + ids.reduce((s, id) => s + C[id].p.length, 0) + ' parent links, ' + ids.reduce((s, id) => s + C[id].d.length, 0) + ' disjoint links, ' + ids.filter((id) => C[id].c).length + ' with comments');

// ---- 2 choose
const rank = Object.create(null); fs.readFileSync(opt('words'), 'utf8').split('\n').forEach((w, i) => { if (!(w in rank)) rank[w] = i; });
const TOP = +opt('top', 30000), MAX = +opt('max', 3000), GL = +opt('gloss', 80), FLOOR = +opt('floor', 40000);
const STOP = new Set('the a an my your our his her its their this that these those new other some any every each no not own same such very'.split(' '));
const wrank = (l) => { if (l !== l.toLowerCase()) return Infinity;   // AS, IBM: names and acronyms are not everyday kinds
  const ws = l.split(' '); if (ws.length > 2 || STOP.has(ws[0]) || !ws.every((w) => /^[a-z]+$/.test(w) && w in rank) || (ws.length === 1 && rank[ws[0]] < 100)) return Infinity;
  return Math.max(...ws.map((w) => rank[w])) * (ws.length === 2 ? 3 : 1); };   // a label is as common as its rarest word; two words, a third as likely
const ROOT = byName.Thing;
const cand = {};
ids.forEach((id) => { const c = C[id]; if (!c.l || c.n[0] === '(' || wrank(c.l) > TOP || under(id) > FLOOR) return; const l = c.l.toLowerCase(); if (!cand[l] || under(id) > under(cand[l])) cand[l] = id; });
// everyday and well-connected: a common word that also gathers many kinds beneath it rises (mammal, carnivore, vehicle)
const score = (id) => wrank(C[id].l) / Math.log2(3 + under(id));
let chosen = Object.values(cand).sort((a, b) => score(a) - score(b)).slice(0, MAX);
const keep = new Set(chosen); if (ROOT) keep.add(ROOT);

// ---- 3 contract
function nearest(id) {                               // nearest kept ancestors, through the unkept
  const out = new Set(), seen = new Set(), q = [...C[id].p];
  while (q.length) { const x = q.shift(); if (seen.has(x) || !C[x]) continue; seen.add(x); if (keep.has(x)) out.add(x); else q.push(...C[x].p); }
  return [...out];
}
const up = {}; keep.forEach((id) => (up[id] = id === ROOT ? [] : nearest(id)));
const anc = {}; function ancs(id, seen) { if (anc[id]) return anc[id]; seen = seen || new Set(); if (seen.has(id)) return new Set(); seen.add(id); const s = new Set(); (up[id] || []).forEach((p) => { s.add(p); ancs(p, seen).forEach((x) => s.add(x)); }); return (anc[id] = s); }
const PMAX = +opt('parents', 2);                    // Cyc files a chair under furniture, seat AND goods: keep the most everyday few
keep.forEach((id) => { up[id] = up[id].filter((p) => !up[id].some((q) => q !== p && ancs(q).has(p))).sort((a, b) => wrank(C[a].l) - wrank(C[b].l)).slice(0, PMAX); if (!up[id].length && id !== ROOT && ROOT) up[id] = [ROOT]; });

// ---- 4 gloss and names
const spokenName = (n) => n.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
function gloss(id) {
  if (!GL) return '';
  let t = C[id].c.replace(/<a [^>]*>([^<]*)<\/a>/g, (m, n) => spokenName(n)).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/\(q\.v\.\)|\(see [^)]*\)|\([^)]*\)/g, '').replace(/\s+([,.;])/g, '$1');
  const lab = C[id].l.toLowerCase(), r = t.match(/\b(?:Each|Every) (?:instance|element|member) of [^,]*? is (?:an? |the )?(.+?)(?:\.\s|$)/i);
  let g = r ? r[1] : t.split(/\.\s/)[0];
  if (/^(the collection of|a collection of|a specialization of|a type of|an? \w+ \(?scientific)/i.test(g) && !r) return '';
  if (g.toLowerCase().indexOf(lab) >= 0 && g.length < lab.length + 30) return '';     // only restates the name
  g = g.replace(/"/g, "'").replace(/\.$/, '').replace(/\s{2,}/g, ' ').replace(/^([A-Z])(?=[a-z])/, (m) => m.toLowerCase()).replace(/^(an?|the) (?=piece of|kind of|type of)/i, '');
  if (g.length > GL * 1.4) {                          // a clause if one ends in reach; else words, with a dangling phrase taken off
    const m = g.slice(0, Math.round(GL * 1.4)).match(/^(.*[a-z])(?:[,;:]| or | but | and (?!so))/);
    g = m && m[1].length > GL * 0.4 ? m[1] : g.slice(0, GL).replace(/\s\S*$/, '').replace(/\s+(for|about|to|with|in|on|at|by|from|of|which|that|who|and|or)\b(\s+\S+){0,3}$/i, '');
    g = g.replace(/(\s+(to|of|the|and|or|for|in|with|a|an|that|which|who|such|as|by|from|on|at|is|are|whether|while|where|when|because|if|or|its|their))+$/i, '').replace(/[ ,;:]+$/, '');
  }
  return g;
}
const sym = {}, used = {};
keep.forEach((id) => { let s = C[id].l.replace(/[^A-Za-z ]+/g, ' ').trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') || 'Thing'; if (id === ROOT) s = 'Thing'; if (used[s]) s += 'X'; used[s] = 1; sym[id] = s; });

// ---- 5 write
const GFOR = +opt('glossfor', 1e9), order = {}; chosen.forEach((id, i) => (order[id] = i));   // glosses only for the most everyday GFOR: prose does not compress
let out = '; derived from OpenCyc (c) 2001-2012 Cycorp, Inc., under CC BY 3.0 (creativecommons.org/licenses/by/3.0)\n; stripped by pack/strip-cyc.js: ' + keep.size + ' everyday concepts of ' + ids.length + '\n';
let nG = 0, nC = 0, nW = 0, nD = 0;
keep.forEach((id) => {
  if (id === ROOT) return;
  up[id].forEach((p) => { out += '(genls ' + sym[id] + ' ' + sym[p] + ')\n'; nG++; });
  const g = order[id] < GFOR ? gloss(id) : ''; if (g) { out += '(comment ' + sym[id] + ' "' + g + '")\n'; nC++; }
  const lab = C[id].l.toLowerCase(), extra = C[id].w.filter((w) => w === w.toLowerCase() && w !== lab && w !== lab + 's' && /^[a-z ]+$/.test(w) && w.split(' ').length <= 2 && w.split(' ').every((x) => rank[x] < TOP * 2));
  if (extra.length && opt('cards', '1') !== '0') { out += '(word ' + sym[id] + ' ' + extra.slice(0, 4).map((w) => '"' + w + '"').join(' ') + ')\n'; nW++; }
});
// the philosophers' floors among the kept (much beneath them, little to say): nuage files through them but does not mention them
const ABSTRACT = new Set('being system information action event situation individual structure transfer expression performing entity object item element unit part process activity state condition relation group set human'.split(' '));
const UPPER = [...keep].filter((id) => id !== ROOT && under(id) > +opt('upper', 3000) && (C[id].l.indexOf(' ') > 0 || ABSTRACT.has(C[id].l.toLowerCase()))).map((id) => sym[id]);
if (UPPER.length) out += '(upper ' + UPPER.join(' ') + ')\n';
const pairs = new Set();
keep.forEach((a) => C[a].d.forEach((b) => { if (keep.has(b) && a !== b) { const k = [sym[a], sym[b]].sort().join(' '); if (!pairs.has(k)) { pairs.add(k); out += '(disjoint ' + k + ')\n'; nD++; } } }));
console.log('chosen: ' + keep.size + ' everyday concepts (rarest word ranked under ' + TOP + ', floors over ' + FLOOR + ' below squeezed out)  ->  ' + nG + ' genls, ' + nC + ' glosses, ' + nW + ' word cards, ' + nD + ' disjoints');
console.log('  ' + K(out.length) + ' raw, ' + K(D(out)) + ' deflated (' + (D(out) / keep.size).toFixed(1) + ' B a concept)');
const OUT = opt('out', ''); if (OUT) { const cl = require('./hollow.js').clean(out); fs.writeFileSync(path.resolve(OUT), cl.out); console.log('  wrote ' + OUT + ' (' + cl.dropped.length + ' hollow glosses left out, ' + cl.tidied.length + ' put plainly: pack/hollow.js)'); }
