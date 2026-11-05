/* teardown.js -- a word, torn down: how it sounds, how it moves the mouth, what its sounds are felt to mean, what it is
   built of, where it came from, what it means now, and what the YOWL canon has already said of it. An outer frame for
   Nuage's word-knowing: it equips the work and is never packed into the page.

     node words/teardown.js juxtaposition        -> the card, in plain text
     node words/teardown.js --json glimmer        -> the same, as JSON (the janitor's do=word uses this)

   Its sources, each named on the line it gives:
     Ecouter's Lexillogue    NRL Report 7948 letter-to-sound rules (1976), as Vespers keeps them; any word at all
     CMUdict                 phonemes and stress for 135,000 words (__libs/words, fetched by fetch_words.py)
     Open English WordNet    senses and definitions (__libs/words/wn)
     Wiktionary, by kaikki   etymology, affix templates, IPA (__libs/words/etym), CC BY-SA
     the YOWL canon          words/yowl-canon.json (canon.js): the caravan's own cards and from-lines
     the tables below        phonaesthemes and affixes, each with where the claim comes from
   What is missing is said, not guessed: without the fetched libraries, the card has the Lexillogue, the tables, and
   the canon. */
const fs = require('fs'), path = require('path');
const HERE = __dirname;
const first = (cands) => cands.find((p) => p && fs.existsSync(p));
const LIBS = first([process.env.NUAGE_LIBS, path.join(HERE, '..', '..', '__libs')]) || '';
const LEXI = first([process.env.NUAGE_LEXILLOGUE, path.join(HERE, '..', '..', '..', '__entile', '__vespers', 'ecouter', 'lexillogue.js'), path.join(HERE, '..', '..', '..', '..', '__vespers', 'ecouter', 'lexillogue.js')]);

// ---- PHONAESTHEMES: clusters of sound that recur in words of like meaning. The claims are old (Firth 1930, who named
// them; Bloomfield 1933; Marchand 1969), and two were tested by experiment (gl- and sn-, Bergen 2004, where readers
// recognised their meanings faster). They are tendencies, not rules: "glove" has gl- and nothing of light.
const ONSETS = [
  ['scr', 'scraping and harsh friction', 'scrape, scratch, scrub, screech', 'Marchand 1969'],
  ['squ', 'squeezing and wet pressure', 'squeeze, squash, squish, squelch', 'Marchand 1969'],
  ['str', 'length, lines, and strain', 'strand, string, stripe, stretch', 'Marchand 1969'],
  ['gl', 'light and seeing', 'glow, gleam, glint, glitter, glance', 'Firth 1930, Bergen 2004 (tested)'],
  ['sn', 'the nose and mouth', 'sniff, snout, snore, sneeze, snort', 'Firth 1930, Bergen 2004 (tested)'],
  ['fl', 'quick movement and flashing light', 'flash, flicker, flutter, flap, flit', 'Bloomfield 1933'],
  ['sl', 'slipping, sliding, and the low', 'slide, slip, slick, slime, slither', 'Firth 1930'],
  ['sw', 'swinging and sweeping motion', 'sway, swing, sweep, swirl, swish', 'Bloomfield 1933'],
  ['tw', 'twisting', 'twist, twirl, twine, twiddle, tweak', 'Marchand 1969'],
  ['wr', 'twisting and wrenching', 'wring, wrist, wrap, wriggle, writhe', 'Marchand 1969'],
  ['cl', 'clinging, gathering, and closing', 'clasp, cling, clump, cluster, clutch', 'Marchand 1969'],
  ['cr', 'cracking, crushing, and the crooked', 'crack, crash, crush, crumple, crook', 'Marchand 1969'],
  ['gr', 'grinding and grumbling', 'grind, grate, growl, grumble, grunt', 'Marchand 1969'],
  ['bl', 'blowing and swelling', 'blow, blast, bloat, blister, bluster', 'Marchand 1969'],
  ['sp', 'spitting, spraying, and a point', 'spit, spew, spray, sputter, spurt', 'Marchand 1969'],
];
const RIMES = [
  ['ump', 'a heavy, rounded mass', 'lump, bump, hump, clump, stump', 'Bloomfield 1933'],
  ['ash', 'a violent impact', 'bash, crash, smash, dash, clash', 'Bloomfield 1933'],
  ['ush', 'a soft rush', 'rush, gush, hush, flush, slush', 'Bloomfield 1933'],
  ['ack', 'a sharp sound', 'crack, smack, whack, clack', 'Marchand 1969'],
  ['ip', 'smallness and quickness', 'tip, nip, sip, zip, flip, drip', 'Jespersen 1922'],
];
const ENDS = [
  [/[^aeiou]le$/, '-le', 'repeated small motion', 'sparkle, crackle, wiggle, twinkle', 'Marchand 1969 (iterative -le)'],
  [/(mm|tt|ck|zz|nn|tt|pp|dd|gg|bb|ll|th|sh|ck)er$|(imm|utt|ick|att|itt|ow)er$/, '-er', 'flickering repetition', 'flicker, glimmer, shimmer, flutter, chatter', 'Marchand 1969 (frequentative -er)'],
];
// ---- AFFIXES: the commonest Latin, Greek, and English pieces, with their sense. Used only when Wiktionary's affix
// templates are not at hand, and then said to be a guess.
const PREFIX = { anti: 'against', dis: 'apart, not', super: 'above', juxta: 'beside', trans: 'across', inter: 'between', intra: 'within', con: 'with', com: 'with', ex: 'out', pro: 'forward', re: 'again, back', sub: 'under', pre: 'before', post: 'after', de: 'down, from', ab: 'away', per: 'through', circum: 'around', contra: 'against', counter: 'against', epi: 'upon', peri: 'around', para: 'beside', syn: 'with', sym: 'with', tele: 'far', micro: 'small', macro: 'large', mono: 'one', poly: 'many', auto: 'self', un: 'not', mis: 'wrongly', over: 'beyond', under: 'below', hyper: 'over', hypo: 'under', semi: 'half', ambi: 'both', bene: 'well', mal: 'badly', omni: 'all', pan: 'all', proto: 'first', pseudo: 'false', retro: 'backward', ultra: 'beyond', extra: 'outside', infra: 'below' };
const SUFFIX = { arian: 'one who holds to', ism: 'a belief or practice', ist: 'one who', ment: 'the act or result of', ation: 'the act of', tion: 'the act of', sion: 'the act of', ity: 'the state of', ness: 'the state of', less: 'without', ful: 'full of', ous: 'full of', ious: 'full of', ize: 'to make', ise: 'to make', ify: 'to make', able: 'able to be', ible: 'able to be', ic: 'of', ical: 'of', al: 'of', ive: 'tending to', ology: 'the study of', logy: 'the study of', cracy: 'rule by', dom: 'the realm of', hood: 'the state of', ship: 'the state of', ward: 'toward', ly: 'in the manner of', er: 'one who', ess: 'she who', ette: 'small', let: 'small', ling: 'small', esque: 'in the style of', cide: 'killing', phile: 'lover of', phobe: 'fearer of', graph: 'writing', scope: 'seeing', meter: 'measure' };
// ---- THE MOUTH: where each ARPAbet vowel sits, high to low and front to back (after the IPA chart; Peterson and
// Barney 1952 measured the formants that place them). Sounds are movies: a word's vowels are the mouth's path.
const MOUTH = { IY: 'high front', IH: 'near-high front', EY: 'mid front, rising', EH: 'mid front', AE: 'low front', AA: 'low back', AO: 'low-mid back', OW: 'mid back, rising', UH: 'near-high back', UW: 'high back', AH: 'mid central', ER: 'mid central, r-coloured', AY: 'low, rising to high front', AW: 'low, rising to high back', OY: 'mid back, rising to high front' };
const SMALL = { IY: 1, IH: 1, EY: 1 }, LARGE = { AA: 1, AO: 1, OW: 1, UW: 1 };

const PHON = LEXI ? path.join(path.dirname(LEXI), 'phones.js') : null;
const CMU2NRL = { AH0: 'AX', HH: 'h', JH: 'j', B: 'b', D: 'd', F: 'f', G: 'g', K: 'k', L: 'l', M: 'm', N: 'n', P: 'p', R: 'r', S: 's', T: 't', V: 'v', W: 'w', Y: 'y', Z: 'z' };
const toNrl = (cmuStr) => cmuStr.split(' ').map((p) => CMU2NRL[p] || CMU2NRL[p.replace(/\d$/, '')] || p.replace(/\d$/, '')).join('');

// ---- KIN, two kinds, never confused. By descent: what Wiktionary's etymology itself names as doublet, cognate, or
// related. By sound: words that open with the same consonants and carry the same stressed vowel (CMUdict), which the ear
// hears as family whether or not history agrees. Phonaesthesia lives in the second, etymology in the first.
function kinByDescent(etym) {
  return (etym || '').replace(/\n/g, ' ').split(/(?<=\.)\s+/).filter((x) => /^(Doublet of|Cognate with|Compare|Related to|More at|Akin to)\b/.test(x)).map((x) => x.slice(0, 220)).slice(0, 3);
}
let soundIx = null, lemmas;
function wnLemmas() {                                       // the words WordNet knows, so kin by sound are words, not names
  if (lemmas !== undefined) return lemmas;
  const d = path.join(LIBS, 'words', 'wn'); if (!fs.existsSync(d)) return (lemmas = null);
  lemmas = new Set(); for (const f of fs.readdirSync(d)) for (const m of fs.readFileSync(path.join(d, f), 'utf8').matchAll(/"w": "([^"]+)"/g)) lemmas.add(m[1].toLowerCase());
  return lemmas;
}
function kinBySound(w, pron) {
  if (!pron) return [];
  const key = (pr) => { const ph = pr.split(' '), i = ph.findIndex((x) => /\d$/.test(x)), st = ph.find((x) => /1$/.test(x)) || ph[i]; return i < 0 ? '' : ph.slice(0, i).join('.') + '|' + (st || '').replace(/\d$/, ''); };
  if (!soundIx) { soundIx = new Map(); for (const [k, prs] of cmu) { if (!/^[a-z]+$/.test(k) || k.length > 9) continue; const kk = key(prs[0]); if (!soundIx.has(kk)) soundIx.set(kk, []); soundIx.get(kk).push(k); } }
  const lw = w.toLowerCase(), stem = lw.replace(/(ing|ed|es|s|er|ly)$/, '');
  const lem = wnLemmas();
  return (soundIx.get(key(pron)) || []).filter((k) => (!lem || lem.has(k)) && k !== lw && !k.startsWith(stem) && !lw.startsWith(k.replace(/(ing|ed|es|s)$/, ''))).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)).slice(0, 10);
}

// ---- SOUNDS ARE MOVIES (User1): two drawings of one word, from Ecouter's own score of it (phones.js frames: how long,
// which formants, how much voice, hiss, and breath). SIDE-ON, the word as moments along a line of time, each sound a
// band: voiced sound a column as tall as its voice, coloured by where the mouth is (front vowels warm, back vowels
// blue, open vowels deeper), hiss a grey stipple, a stop's silence a gap. FACE-ON, the word as a wall receives it at
// the instant the speaker stops: every sound has travelled outward as a wavefront, the first farthest, so the word is a
// target of rings, its last sound at the centre, its silences empty rings. At 343 metres a second, a ring 100 ms out is
// 34 metres from the mouth: the figure is that snapshot, scaled to fit.
function score(t) {
  if (!PHON || !fs.existsSync(PHON)) return null;
  let P; try { P = require(PHON); } catch (e) { return null; }
  const codes = t.cmu && t.cmu.length ? toNrl(t.cmu[0]) : t.nrl ? t.nrl.replace(/ /g, '') : null;
  if (!codes) return null;
  try { const fr = P.frames(codes), sp = P.split(codes); return { fr, sp, codes }; } catch (e) { return null; }
}
const NOCT = require('./noct-draw.js');   // the drawing lives on its own, so a cut of Nuage can carry it into the page
function figures(t) { const sc = score(t); return sc ? NOCT.figure(t.word, sc) : null; }

let lexi = null, cmu = null, canon = null;
function nrl(w) {
  if (lexi === null) { lexi = false; try { if (LEXI) lexi = require(LEXI); } catch (e) { lexi = false; } }
  return lexi ? lexi.say(w).trim() : null;
}
function cmuOf(w) {
  if (cmu === null) { cmu = new Map(); const f = path.join(LIBS, 'words', 'cmudict.dict'); if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l || l.startsWith(';;;')) continue; const i = l.indexOf(' '), k = l.slice(0, i).replace(/\(\d+\)$/, ''); if (!cmu.has(k)) cmu.set(k, []); cmu.get(k).push(l.slice(i + 1).replace(/\s*#.*$/, '').trim()); } }
  return cmu.get(w.toLowerCase()) || [];
}
function shardOf(dir, w) {
  const c = w[0].toLowerCase(), f = path.join(LIBS, 'words', dir, (c >= 'a' && c <= 'z' ? c : '_') + '.jsonl');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8').split('\n').filter((l) => l && l.toLowerCase().includes('"w": "' + w.toLowerCase() + '"')).map((l) => JSON.parse(l)).filter((r) => r.w.toLowerCase() === w.toLowerCase());
}
function canonOf(w) {
  if (canon === null) { const f = path.join(HERE, 'yowl-canon.json'); canon = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).cards : []; }
  const lw = w.toLowerCase(), re = new RegExp('\\b' + lw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const own = canon.filter((c) => c.w.toLowerCase() === lw), kin = canon.filter((c) => c.w.toLowerCase() !== lw && re.test(c.from)).slice(0, 4);
  return { own, kin };
}
function guessParts(w, freq) {                              // longest prefixes from the left, suffixes from the right, the root between
  let s = w.toLowerCase(); const pre = [], suf = [];
  const tail = freq && s.endsWith('er') ? ['er'] : []; if (tail.length) s = s.slice(0, -2);   // a frequentative -er, not an agent
  for (let again = true; again;) { again = false; for (const p of Object.keys(PREFIX).sort((a, b) => b.length - a.length)) if (s.startsWith(p) && s.length - p.length >= 4) { pre.push(p); s = s.slice(p.length); again = true; break; } }
  for (let again = true; again;) { again = false; for (const x of Object.keys(SUFFIX).sort((a, b) => b.length - a.length)) if (s.endsWith(x) && s.length - x.length >= 3) { suf.unshift(x); s = s.slice(0, -x.length); again = true; break; } }
  return pre.map((p) => [p + '-', PREFIX[p]]).concat([[s, 'the root']], suf.map((x) => ['-' + x, SUFFIX[x]]), tail.map(() => ['-er', 'again and again']));
}

function tear(word) {
  const w = String(word).trim(), lw = w.toLowerCase(), t = { word: w, sources: [] };
  t.nrl = nrl(w); if (t.nrl) t.sources.push('Lexillogue (NRL 1976)');
  t.cmu = cmuOf(w); if (t.cmu.length) t.sources.push('CMUdict');
  if (t.cmu.length) {
    const ph = t.cmu[0].split(' '), vow = ph.filter((p) => /\d$/.test(p));
    t.syllables = vow.length; t.stress = vow.map((p) => p.slice(-1)).join('');
    t.mouth = vow.map((p) => { const v = p.slice(0, -1); return v === 'AH' && p.endsWith('0') ? 'mid central (schwa)' : MOUTH[v] || v; });
    const st = vow.find((p) => p.endsWith('1')); if (st) { const v = st.slice(0, -1); t.vowelFeel = SMALL[v] ? 'Its stressed vowel is small and bright, the kind heard as little (Sapir 1929, Jespersen 1922).' : LARGE[v] ? 'Its stressed vowel is large and dark, the kind heard as big (Sapir 1929).' : null; }
  }
  t.phonaesthemes = [];
  for (const [o, sense, eg, src] of ONSETS) if (lw.startsWith(o)) { t.phonaesthemes.push({ mark: o + '-', sense, eg, src }); break; }
  if (lw.length <= 7) for (const [r, sense, eg, src] of RIMES) if (lw.endsWith(r)) { t.phonaesthemes.push({ mark: '-' + r, sense, eg, src }); break; }
  for (const [re, mark, sense, eg, src] of ENDS) if (re.test(lw) && lw.length <= 9) t.phonaesthemes.push({ mark, sense, eg, src });
  const et = shardOf('etym', w), wn = shardOf('wn', w);
  if (et && et.length) { t.sources.push('Wiktionary (kaikki), CC BY-SA'); t.etymology = et.map((e) => e.etym).filter(Boolean)[0] || null; t.ipa = et.flatMap((e) => e.ipa || [])[0] || null; t.parts = et.flatMap((e) => e.parts || []).filter((p) => /^(af|affix|prefix|pre|suffix|suf|confix|con|compound|com|blend|surf)$/.test(p[0])).map((p) => p.slice(2).filter((x) => x && !/^[a-z]{2,3}$/.test(x) || x.length > 3)); }
  t.guess = !(t.parts && t.parts.length); const fq = t.phonaesthemes.some((p) => p.mark === '-er'); if (t.guess) { const g = guessParts(w, fq); t.parts = [g.map((x) => x[0])]; t.partSenses = g.map((x) => x[1]); }
  if (wn && wn.length) { t.sources.push('Open English WordNet'); t.senses = wn.flatMap((r) => r.defs.map((d) => '(' + r.pos + ') ' + d)).slice(0, 4); }
  const c = canonOf(w); t.canon = c.own; t.kin = c.kin; if (c.own.length || c.kin.length) t.sources.push('the YOWL canon');
  if (!t.syllables && t.nrl) { const vs = (t.nrl.match(/IY|IH|EY|EH|AE|AA|AO|OW|UH|UW|ER|AX|AH|AY|AW|OY/g) || []); t.syllables = vs.length; t.stress = '?'.repeat(vs.length); t.mouth = vs.map((v) => MOUTH[v] || (v === 'AX' ? 'mid central (schwa)' : v)); t.byRule = true; }   // no CMUdict entry: count by the rule-reading
  t.descent = kinByDescent(t.etymology); t.sound = kinBySound(w, t.cmu && t.cmu[0]);
  t.figures = figures(t);
  t.missing = [!t.nrl && 'the Lexillogue (Vespers\' ecouter/lexillogue.js was not found)', !LIBS || !fs.existsSync(path.join(LIBS, 'words')) ? 'the fetched word libraries (press "Fetch the word libraries")' : null].filter(Boolean);
  return t;
}

// THE CARD, WHITELINED (User1): a column of labels, and beside each, its statement in white; the supplements (sources,
// glosses, explanations) stand under the statement in the dim, in the same column, so the eye runs down the white and
// reads the word, and turns to the grey only when it wants the why. rows() is the structure; card() sets it as text.
function rows(t) {
  const R = [], row = (k, v, dim, sub, pre) => R.push({ k, v, dim: dim || '', pre: pre || '', sub: (sub || []).filter(Boolean) });
  const firstSentence = (x) => { const m = String(x).match(/^(.+?[.!?])(\s+)([\s\S]*)$/); return m ? [m[1], m[3]] : [x, '']; };
  row('Word', t.word.toLowerCase());
  (t.senses || []).forEach((x) => { const m = String(x).match(/^\((\w+)\)\s*(.*)$/); row('Means', m ? m[2] + '.' : x, '', [], m ? '(' + m[1] + ')' : ''); });   // the word and what it means first, then all else that might be said (User1)
  if (t.cmu && t.cmu.length) row('Sounds', t.cmu[0] + (t.ipa ? '   ' + t.ipa : ''), '', ['(CMUdict' + (t.ipa ? ', IPA from Wiktionary' : '') + ')']);
  if (t.nrl) row('Read by rule', t.nrl, '', ['(NRL 1976, by the Lexillogue)']);
  if (t.syllables) row('Breakdown', t.syllables + (t.syllables === 1 ? ' syllable' : ' syllables') + (t.byRule ? '.' : ', stress ' + t.stress + '.'), '', [(t.byRule ? 'Counted from the reading by rule; the stress is not known. ' : '') + 'The mouth moves ' + t.mouth.join(', then ') + '.', t.vowelFeel]);
  t.phonaesthemes.forEach((p) => row('Felt sense', p.mark + ' goes with ' + p.sense + '.', '', ['As in ' + p.eg + ' (' + p.src + ').']));
  if (t.parts && t.parts.length && t.parts[0].length > 1) row(t.guess ? 'Affix guess' : 'Built of', t.parts[0].join(' + ') + '.', t.guess && t.partSenses ? '(' + t.partSenses.join(' + ') + ')' : '(Wiktionary)');
  if (t.etymology) { const e = t.etymology.replace(/^Etymology tree\n[\s\S]*?\n(?=From |Borrowed |Inherited |Learned )/, '').replace(/\n/g, ' '), [a, b] = firstSentence(e); row('From', a, '', [b]); }
  if (t.descent && t.descent.length) row('Kin by descent', t.descent[0], '', t.descent.slice(1).concat(['(Wiktionary)']));
  if (t.sound && t.sound.length) row('Kin by sound', t.sound.join(', ') + '.', '', ['(CMUdict: the same opening and stressed vowel, and not descent unless shown above)']);
  if (t.figures) row('Drawn below', 'Its sounds in light along ' + t.figures.ms + ' ms.', '', ['Height is pitch and brightness is strength. At the right are the rings a wall receives as it ends.']);
  t.canon.forEach((c) => row('In the YOWLs', c.w + ', ' + c.anglo + '.', '(' + c.deck + ')', [c.from, c.say]));
  t.kin.forEach((c) => row('YOWL kin', c.w + '.', '(' + c.deck + ')', [c.from]));
  if (t.missing.length) row('Not at hand', '', '', [t.missing.join(', and ') + '.']);
  return R;
}
function card(t) {                                          // the same, as aligned text: labels in a column, supplements indented under
  const R = rows(t), W = Math.max(...R.map((r) => r.k.length + 1)) + 2, pad = (x) => (x + ':').padEnd(W);   // two characters between the columns, no more or less
  let prev = '';
  return R.map((r) => [(r.k === prev ? '"'.padEnd(W) : pad(r.k)) + ((prev = r.k), '') + (r.pre ? r.pre + ' ' : '') + r.v + (r.dim ? '   ' + r.dim : '')].concat(r.sub.map((x) => ' '.repeat(W) + x)).join('\n')).join('\n');
}

module.exports = { tear, card, rows, figures };
if (require.main === module) {
  const a = process.argv.slice(2), json = a.includes('--json'), ws = a.filter((x) => x !== '--json');
  const svgOut = a.includes('--svg');
  for (const w of ws.filter((x) => x !== '--svg')) { const t = tear(w); if (svgOut && t.figures) fs.writeFileSync(w + '.svg', t.figures.svg); console.log(json ? JSON.stringify(Object.assign(t, { rows: rows(t) })) : card(t) + '\n'); }
}
