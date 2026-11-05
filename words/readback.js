/* readback.js -- what could Mimia have meant? (User1: "a rip-fast pretend-to-speak, pretend-to-listen, actually-remap-
   speech-symbols process".) Her made words are said aloud by rule (Ecouter's Lexillogue, NRL 1976), and each is heard
   against the words her teacher used, by their sounds (CMUdict): the nearest by sound is what she may have meant, with
   a confidence. A made word that sounds like two words run together is a smashword, and is named as one, since those
   are worth keeping. Real words stand as they are. Every reading is shown in IPA too, the middle ground we can both read,
   and in Bell's forms (Visible Speech, in User1's threes), which Bela paints and Ecouter reads.

     node words/readback.js "Foroducts are useful because they provide vericged, for hurve conteorates."
     node words/readback.js --json "..."        (the janitor's do=readback)

   Nothing here is a fact about the world: it is a guess at a mirror's mumble, said with how sure the guess is. */
const fs = require('fs'), path = require('path');
const HERE = __dirname, first = (c) => c.find((p) => p && fs.existsSync(p));
const LIBS = first([process.env.NUAGE_LIBS, path.join(HERE, '..', '..', '__libs')]) || '';
const ECO = first([path.join(HERE, '..', '..', '..', '__entile', '__vespers', 'ecouter'), path.join(HERE, '..', '..', '..', '..', '__vespers', 'ecouter')]);
const LEX = require(path.join(ECO, 'lexillogue.js')), PH = require(path.join(ECO, 'phones.js'));
const VOW = new Set(['IY', 'IH', 'EY', 'EH', 'AE', 'AA', 'AO', 'OW', 'UH', 'UW', 'ER', 'AX', 'AH', 'AY', 'AW', 'OY']);
const CMU2NRL = { AH0: 'AX', HH: 'h', JH: 'j', B: 'b', D: 'd', F: 'f', G: 'g', K: 'k', L: 'l', M: 'm', N: 'n', P: 'p', R: 'r', S: 's', T: 't', V: 'v', W: 'w', Y: 'y', Z: 'z' };
const IPA = { IY: 'i', IH: 'ɪ', EY: 'eɪ', EH: 'ɛ', AE: 'æ', AA: 'ɑ', AO: 'ɔ', OW: 'oʊ', UH: 'ʊ', UW: 'u', ER: 'ɝ', AX: 'ə', AH: 'ʌ', AY: 'aɪ', AW: 'aʊ', OY: 'ɔɪ', p: 'p', b: 'b', t: 't', d: 'd', k: 'k', g: 'ɡ', f: 'f', v: 'v', TH: 'θ', DH: 'ð', s: 's', z: 'z', SH: 'ʃ', ZH: 'ʒ', h: 'h', HH: 'h', m: 'm', n: 'n', NG: 'ŋ', l: 'l', r: 'ɹ', w: 'w', y: 'j', CH: 'tʃ', j: 'dʒ', WH: 'ʍ' };
const ipa = (ph) => '/' + ph.map((p) => IPA[p] || '').join('') + '/';
// BELL'S FORMS (Visible Speech, 1867, in User1's three-character glyphs, as Ecouter's bell.js keeps them): the sheets
// read backwards, codes into Bell, the first glyph a sheet gives for each sound. Bell wrote the glides as two vowels,
// and the affricates as two consonants, so those are spelled out in two threes.
let BELLINV = null;
const bellOf = (ph) => {
  if (BELLINV === null) { BELLINV = {}; try { const B = require(path.join(ECO, 'bell-orthoes', 'bell.js')); for (const [g, c] of Object.entries(B.table)) if (!BELLINV[c]) BELLINV[c] = g; } catch (e) { BELLINV = false; } }
  if (!BELLINV) return null;
  const SPLIT = { AY: ['AA', 'IH'], AW: ['AA', 'UH'], OY: ['AO', 'IH'], ER: ['AX', 'r'], CH: ['t', 'SH'], j: ['d', 'ZH'], h: ['HH'] };
  return ph.flatMap((p) => SPLIT[p] || [p]).map((p) => BELLINV[p] || '?').join(' ');
};
const PLACE = { p: 'L', b: 'L', m: 'L', f: 'L', v: 'L', w: 'L', WH: 'L', t: 'T', d: 'T', n: 'T', s: 'T', z: 'T', l: 'T', r: 'T', TH: 'T', DH: 'T', SH: 'P', ZH: 'P', CH: 'P', j: 'P', y: 'P', k: 'K', g: 'K', NG: 'K', h: 'H' };
const sub = (a, b) => (a === b ? 0 : VOW.has(a) && VOW.has(b) ? 0.45 : !VOW.has(a) && !VOW.has(b) ? (PLACE[a] && PLACE[a] === PLACE[b] ? 0.5 : 0.8) : 1);
function dist(a, b) {                                      // weighted edit distance over phones: a vowel for a vowel is cheap
  const m = a.length, n = b.length, D = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) D[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + sub(a[i - 1], b[j - 1]));
  return D[m][n];
}
const byRule = (w) => PH.split(String(LEX.say(w)).replace(/[\s.]+/g, '')).filter((p) => IPA[p] !== undefined);

// the dictionary: her teacher's words, by how often the teacher used them, with their sounds from CMUdict
let DICT = null;
function load() {
  if (DICT) return DICT;
  const cmu = new Map(), f = path.join(LIBS, 'words', 'cmudict.dict');
  if (!fs.existsSync(f)) throw new Error('readback needs CMUdict: press "Fetch the word libraries" in the panel');
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l || l.startsWith(';;;')) continue; const i = l.indexOf(' '), k = l.slice(0, i); if (/^[A-Z]/.test(k)) names.add(k.toLowerCase());   // a word CMUdict spells with a capital is a name
    if (/\(\d+\)$/.test(k) || cmu.has(k)) continue; cmu.set(k, l.slice(i + 1).replace(/\s*#.*$/, '').trim().split(' ').map((p) => CMU2NRL[p] || CMU2NRL[p.replace(/\d$/, '')] || p.replace(/\d$/, ''))); }
  const freq = new Map(), lf = path.join(HERE, '..', 'patty', 'mimia', 'light.jsonl');
  if (fs.existsSync(lf)) for (const l of fs.readFileSync(lf, 'utf8').split('\n')) { if (!l) continue; let r; try { r = JSON.parse(l); } catch (e) { continue; } for (const w of String(r.a || '').toLowerCase().match(/[a-z']+/g) || []) freq.set(w, (freq.get(w) || 0) + 1); }
  const vocab = [...freq.keys()].filter((w) => cmu.has(w)).map((w) => ({ w, ph: cmu.get(w), f: freq.get(w) }));
  return (DICT = { cmu, freq, vocab });
}
function nearest(ph, pool) {
  let best = null;
  for (const v of pool) {
    if (Math.abs(v.ph.length - ph.length) > 3) continue;
    const d = dist(ph, v.ph), sim = 1 - d / Math.max(ph.length, v.ph.length), score = sim + 0.02 * Math.log(1 + v.f);
    if (!best || score > best.score) best = { w: v.w, ph: v.ph, sim, score };
  }
  return best;
}
function read(text) {
  const D = load(), out = [];
  for (const tok of String(text).match(/[A-Za-z']+|[^A-Za-z']+/g) || []) {
    if (!/[A-Za-z]/.test(tok)) { out.push({ t: tok }); continue; }
    const lw = tok.toLowerCase();
    if (D.cmu.has(lw)) { out.push({ t: tok, word: lw, sure: 1, real: true }); continue; }
    const ph = byRule(lw), one = nearest(ph, D.vocab);
    let two = null;                                          // a smashword: two of her teacher's words, run together
    for (let k = 2; k <= lw.length - 2; k++) { const a = lw.slice(0, k), b = lw.slice(k); if (D.freq.has(a) && D.freq.has(b) && D.cmu.has(a) && D.cmu.has(b)) { const sim = 1 - dist(ph, D.cmu.get(a).concat(D.cmu.get(b))) / Math.max(ph.length, D.cmu.get(a).length + D.cmu.get(b).length); if (!two || sim > two.sim) two = { w: a + ' ' + b, sim }; } }
    const pick = two && (!one || two.sim > one.sim + 0.05) ? { w: two.w, sim: two.sim, smash: true } : one ? { w: one.w, sim: one.sim } : null;
    const meant = pick ? pick.w.split(' ').flatMap((w) => D.cmu.get(w) || []) : [];
    out.push({ t: tok, ipa: ipa(ph), bell: bellOf(ph), word: pick ? pick.w : null, wordIpa: pick ? ipa(meant) : null, wordBell: pick ? bellOf(meant) : null, sure: pick ? Math.max(0, pick.sim) : 0, smash: !!(pick && pick.smash) });
  }
  const english = out.map((x) => (x.word && !x.real && x.sure < 0.5 ? '(' + x.t + ')' : x.word ? (/^[A-Z]/.test(x.t) ? x.word[0].toUpperCase() + x.word.slice(1) : x.word) : x.t)).join('');
  const made = out.filter((x) => x.ipa), sure = made.length ? made.reduce((a, x) => a + x.sure, 0) / made.length : 1;
  return { said: text, english, scanned: scan(english), scannedRaw: scan(text), sure, words: out.filter((x) => /[A-Za-z]/.test(x.t)), smashwords: out.filter((x) => x.smash).map((x) => x.t + ' = ' + x.word) };
}
// THE SCAN (User1, 4 xi 2026): with words/punct.json, grated from Simple English Wikipedia by words/grate.py, a run of
// words with no marks in it is given periods and commas where English usually puts them, and capitals after the stops.
// The same table and the same rule as grate.py's, so the two agree: the kind of the word before the gap, the kind after,
// and how long the run has gone since the last stop and the last comma.
const FUNC = new Set(`the a an of and or but nor so yet to in on at by for from with without into onto upon over under about
around through during before after between among against is are was were be been being am has have had do does did
not no it its it's this that these those he she they we you i me him her them us his their our your my who whom whose
which what when where why how than then there here as if because while though although since until unless whether
can could will would shall should may might must also very too just only even still more most much many some any all
each every both either neither such own same other another one two three first last new old good great little long
up down out off away back again now ever never always often`.split(/\s+/));
const kind = (w) => { const lw = w.toLowerCase(); if (FUNC.has(lw)) return lw; if (/^\d+$/.test(lw)) return '#'; for (const e of ['tion', 'ing', 'ed', 'ly', 'ness', 'ment', 'ous', 'ive', 'al', 'er', 'es', 's', 'y']) if (lw.endsWith(e) && lw.length > e.length + 2) return '-' + e; return lw.length > 7 ? 'long' : lw.length > 3 ? 'short' : 'tiny'; };
const runs = (n) => String(Math.floor(Math.min(n, 40) / 3)), lp = (v, j) => Math.log((v[j] + 0.5) / (v.reduce((a, b) => a + b, 0) + 0.5 * v.length));
let PUNCT = null;
function scan(text) {
  if (PUNCT === null) { try { PUNCT = JSON.parse(fs.readFileSync(path.join(HERE, 'punct.json'), 'utf8')); } catch (e) { PUNCT = false; } }
  if (!PUNCT || !PUNCT.prior || PUNCT.prior.length !== 5) return null;
  // five marks: none, comma, dash, semicolon (standing for the colon too), stop. Her own evidence (User1: do we not impute?): a
  // capital after the first word is a stop's strongest witness, and a mark she wrote herself votes for itself; a run past
  // eighteen words leans toward a stop, since sentences do not go that long; the table decides the rest.
  const MARKS = ['', ',', ' —', ';', '.'], toks = String(text).match(/[A-Za-z0-9'’-]+|[.,;:!?]+|—|–|--/g) || [], words = [], own = [];
  for (const t of toks) { if (/^[.,;:!?—–-]/.test(t)) { if (words.length) own[words.length - 1] = /[.!?]/.test(t) ? 4 : /[;:]/.test(t) ? 3 : /[—–-]/.test(t) ? 2 : 1; } else { words.push(t); own.push(0); } }
  const out = []; let since = 0, sincec = 0;
  for (let i = 0; i < words.length; i++) { const w = words[i]; if (i === words.length - 1) { out.push(w); break; }
    const pv = PUNCT.pair[kind(w) + '|' + kind(words[i + 1])] || [1, 1, 1, 1, 1], rv = PUNCT.run[runs(since)] || [1, 1, 1, 1, 1], cv = PUNCT.runc[runs(sincec)] || [1, 1, 1, 1, 1], nx = words[i + 1], cap = /^[A-Z][a-z]/.test(nx) && nx !== 'I' ? 2.5 : 0, long = 0.5 + Math.max(0, (since - 18) * 0.3);
    let best = 0, bs = -Infinity; for (let j = 0; j < 5; j++) { const sc = lp(pv, j) + lp(rv, j) + 0.5 * lp(cv, j) - 1.5 * lp(PUNCT.prior, j) + (j === 4 ? cap + long : 0) + (own[i] === j ? 3.0 : 0); if (sc > bs) { bs = sc; best = j; } }
    if (best === 4 && since < 3) best = 0;
    out.push(w + MARKS[best]); since = best === 4 ? 0 : since + 1; sincec = best ? 0 : sincec + 1; }
  // LOOSE CAPITALS (User1): a capital she did not lead with is a stray of the grinding, not a meaning. A capital INSIDE a
  // word is always a stray and is lowered ("tamG" to "tamg"). A capital at a word's head is lowered only if the word is one
  // she MADE ("BEss" to "bess"); a word that is real English, or a name she took whole from her light, keeps what she gave
  // it. The word libraries here hold no register of places, so nothing is lowered on their authority alone.
  const made = new Set(out.filter((x) => x.ipa && /[A-Za-z]/.test(x.t)).map((x) => x.t));
  let t2 = (out.join(' ').replace(/[,;—\s]+$/, '') + '.').replace(/([A-Za-z])([A-Z])/g, (m, p, u) => p + u.toLowerCase());
  t2 = t2.replace(/\b[A-Z][A-Za-z']*/g, (w, at) => (at === 0 || /[.!?]["”)]?\s+$/.test(t2.slice(0, at)) || !made.has(w)) ? w : w.toLowerCase());
  return t2.replace(/(^|[.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase());
}
function card(r) {
  const L = ['Mimia said:  ' + r.said, 'Maybe:  ' + (r.scanned || r.english) + '   (' + Math.round(r.sure * 100) + '% sure, on the words she made)'];
  r.words.filter((x) => !x.real).forEach((x) => { L.push('  ' + x.t + '  ' + x.ipa + '  ->  ' + (x.word || '?') + ' ' + (x.wordIpa || '') + (x.smash ? ' (a smashword)' : '') + '  ' + Math.round(x.sure * 100) + '%'); if (x.bell) L.push('      in Bell:  ' + x.bell + '   ->   ' + (x.wordBell || '?')); });
  if (r.smashwords.length) L.push('Smashwords worth keeping: ' + r.smashwords.join(', ') + '.');
  return L.join('\n');
}
module.exports = { read, card, scan };
if (require.main === module) {
  const a = process.argv.slice(2), json = a.includes('--json'), fi = a.indexOf('--file'), text = fi >= 0 ? fs.readFileSync(a[fi + 1], 'utf8') : a.filter((x) => x !== '--json').join(' ');
  const r = read(text); console.log(json ? JSON.stringify(r) : card(r));
}
