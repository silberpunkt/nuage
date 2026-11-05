/* strip-owl.js -- an OWL (RDF/XML, as Protege writes it) to bytes and bone.
     node pack/strip-owl.js <file.owl> [--out kb/name.kb] [--world NameMt --about "..." --words "a,b"] [--gloss 80] [--drop "regex"] [--depth 9]
   First a census: what the file really holds (every element, how often; tree depth; gloss lengths). Then the strip:
   classes, their parents, a label, a gloss cut at a clause, and disjoints, in two shapes, both measured deflated:
     sexpr    (genls Child Parent) (comment Child "...") (disjoint A B): what nuage reads today
     outline  one line per class in tree order, its depth as one character, then the label and |gloss: the tree is
              in the order, so no parent is ever named; boot reinflates it with a stack
   No dependencies: Protege's RDF/XML is regular enough for patterns. */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const args = process.argv.slice(2), file = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
if (!file) { console.log('node pack/strip-owl.js <file.owl> [--out kb/x.kb] [--world XMt] [--gloss 80] [--drop "regex"] [--depth 9]'); process.exit(1); }
const xml = fs.readFileSync(file, 'utf8'), K = (n) => (n / 1024).toFixed(1) + ' KB', D = (s) => zlib.deflateRawSync(Buffer.from(s), { level: 9 }).length;
const ent = {}; xml.replace(/<!ENTITY\s+(\w+)\s+"([^"]*)"/g, (m, k, v) => (ent[k] = v));
const iri = (s) => s.replace(/&(\w+);/g, (m, k) => ent[k] || m);
const frag = (s) => iri(s).replace(/^.*[#/]/, '');
const unx = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim();

// ---- census
const tags = {}; xml.replace(/<([A-Za-z_][\w:.-]*)/g, (m, t) => { tags[t] = (tags[t] || 0) + 1; });
console.log('census of ' + path.basename(file) + ' (' + K(xml.length) + '):');
console.log('  ' + Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t, n]) => t + ' ' + n).join('   '));

// ---- classes
const C = {};
xml.replace(/<owl:Class rdf:about="([^"]+)"\s*>([\s\S]*?)<\/owl:Class>/g, (m, about, body) => {
  const id = frag(about), c = C[id] || (C[id] = { id, up: [], dis: [], label: '', alt: '', def: '' });
  body = body.replace(/<rdfs:subClassOf>\s*<owl:Restriction>[\s\S]*?<\/owl:Restriction>\s*<\/rdfs:subClassOf>/g, '');   // restrictions: not bone
  body.replace(/<rdfs:subClassOf rdf:resource="([^"]+)"/g, (m2, r) => c.up.push(frag(r)));
  body.replace(/<owl:disjointWith rdf:resource="([^"]+)"/g, (m2, r) => c.dis.push(frag(r)));
  const get = (t) => { const r = body.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>')); return r ? unx(r[1]) : ''; };
  c.label = get('rdfs:label'); c.alt = get('skos:altLabel'); c.def = get('skos:definition') || get('rdfs:comment');
});
const ids = Object.keys(C), kids = {}; ids.forEach((id) => C[id].up.forEach((p) => (kids[p] = kids[p] || []).push(id)));
const roots = ids.filter((id) => !C[id].up.some((p) => C[p]));
const depth = {}; (function walk(list, d) { list.forEach((id) => { if (depth[id] !== undefined) return; depth[id] = d; walk(kids[id] || [], d + 1); }); })(roots, 0);
const dh = {}; Object.values(depth).forEach((d) => (dh[d] = (dh[d] || 0) + 1));
const withDef = ids.filter((id) => C[id].def).length, dl = ids.map((id) => C[id].def.length).filter(Boolean).sort((a, b) => a - b);
console.log('  ' + ids.length + ' classes, ' + roots.length + ' roots; depth: ' + Object.entries(dh).map(([d, n]) => d + ':' + n).join(' ') +
  '; glosses on ' + withDef + ' (median ' + (dl[dl.length >> 1] || 0) + ' chars); disjoint pairs ' + ids.reduce((s, id) => s + C[id].dis.length, 0));

// ---- the strip
const GL = +opt('gloss', 80), DROP = opt('drop', '') ? new RegExp(opt('drop'), 'i') : null, MAXD = +opt('depth', 99), WORLD = opt('world', '');
const nameOf = (c) => (c.alt || c.label.replace(/^[a-z]?\d+\.?\s*/i, '') || c.id).replace(/\s+/g, ' ');
function cut(s, n) {                                   // the gloss, cut at a clause near n characters
  if (!n || !s) return ''; s = s.replace(/\s+/g, ' ').replace(/"/g, "'").replace(/^(Definitions?:\s*|This chapter is about\s+|This chapter deals with\s+)/i, '');
  s = s.replace(/^([A-Z])(?=[a-z])/, (m) => m.toLowerCase());   // a gloss continues a sentence: "quality of sleep: mental functions that..."
  const tidy = (t) => t.replace(/[ ,;:]+$/, '').replace(/(\s+(to|of|the|and|or|for|in|with|a|an|that|such|as|by|from|on|at))+$/i, '');
  if (s.length <= n) return s.replace(/\.$/, '');
  const m = s.slice(0, n).match(/^(.*[a-z])[,;:(]/); return tidy(m && m[1].length > n * 0.4 ? m[1] : s.slice(0, n).replace(/\s\S*$/, ''));
}
const keep = ids.filter((id) => depth[id] !== undefined && depth[id] <= MAXD && !(DROP && DROP.test(nameOf(C[id]))));
const kept = new Set(keep), sym = {}, used = {};
keep.forEach((id) => {
  let s = nameOf(C[id]).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') || id;
  if (/^\d/.test(s)) s = 'N' + s; if (used[s]) s += id.replace(/\W/g, ''); used[s] = 1; sym[id] = s;
});
// sexpr
let sx = '';
keep.forEach((id) => {
  const c = C[id], ps = c.up.filter((p) => kept.has(p));
  ps.forEach((p) => (sx += '(genls ' + sym[id] + ' ' + sym[p] + ')\n'));
  if (!ps.length) sx += '(genls ' + sym[id] + ' Thing)\n';
  const g = cut(c.def, GL); if (g) sx += '(comment ' + sym[id] + ' "' + g + '")\n';
  c.dis.filter((d) => kept.has(d) && id < d).forEach((d) => (sx += '(disjoint ' + sym[id] + ' ' + sym[d] + ')\n'));
});
if (WORLD) sx = (opt('about', '') ? '(comment ' + WORLD + ' "' + opt('about') + '")\n' : '') + (opt('words', '') ? '(mt-word ' + WORLD + ' ' + opt('words').split(',').map((w) => '"' + w.trim() + '"').join(' ') + ')\n' : '') + '(in-mt ' + WORLD + '\n' + sx + ')\n';
// outline: depth as one character, label, |gloss; children follow their parent (first parent only)
let ol = ''; const done = new Set();
(function walk(list, d) { list.forEach((id) => { if (!kept.has(id) || done.has(id)) return; done.add(id); const g = cut(C[id].def, GL);
  ol += String.fromCharCode(48 + d) + nameOf(C[id]) + (g ? '|' + g : '') + '\n'; walk(kids[id] || [], d + 1); }); })(roots, 0);
console.log('\nstrip (gloss ' + (GL || 'none') + (DROP ? ', dropping /' + DROP.source + '/' : '') + (MAXD < 99 ? ', depth <= ' + MAXD : '') + '): ' + keep.length + ' classes kept');
console.log('  sexpr    ' + K(sx.length).padStart(9) + ' raw   ' + K(D(sx)).padStart(9) + ' deflated   (' + (D(sx) / keep.length).toFixed(1) + ' B a class)');
console.log('  outline  ' + K(ol.length).padStart(9) + ' raw   ' + K(D(ol)).padStart(9) + ' deflated   (' + (D(ol) / keep.length).toFixed(1) + ' B a class)');
for (const n of [16, 32]) { const b = n * 1024; console.log('  in ' + n + ' KB, deflated: about ' + Math.floor(keep.length * b / D(sx)) + ' classes as sexpr, ' + Math.floor(keep.length * b / D(ol)) + ' as outline'); }
const out = opt('out', '');
if (out) { fs.writeFileSync(path.resolve(out), '; stripped from ' + path.basename(file) + ' by pack/strip-owl.js\n' + sx); fs.writeFileSync(path.resolve(out).replace(/\.kb$/, '.outline'), ol); console.log('  wrote ' + out + ' and its .outline'); }
