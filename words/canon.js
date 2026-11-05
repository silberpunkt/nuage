// canon.js -- the YOWL canon, indexed: every card of every deck in Great YOWLs (word, deck, section, anglo, from, say),
// into words/yowl-canon.json, so that a word's teardown can show what the caravan has already said of it. The from-lines
// are the canon's etymologies. Run again whenever a deck is added; the janitor does it before a teardown if it is stale.
//   node words/canon.js [path to Great YOWLs]
const fs = require('fs'), path = require('path');
const yaml = require(path.join(__dirname, '..', '..', '__libs', 'js-yaml.min.js'));
const DIR = process.argv[2] || path.join(__dirname, '..', '..', '..', '__tl', '__readme', 'Great YOWLs');
const out = [];
for (const f of fs.readdirSync(DIR).filter((n) => /\.ya?ml$/i.test(n)).sort()) {
  let doc; try { doc = yaml.load(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { console.log('  (could not read ' + f + ': ' + e.message.split('\n')[0] + ')'); continue; }
  const deck = f.replace(/[ _]?(\.deck)?[._]yowl\.ya?ml$/i, '').replace(/\.ya?ml$/i, '').trim();
  let sec = '';
  for (const c of (doc && doc.cards) || []) {
    if (!c || typeof c !== 'object') continue;
    if (c.section) sec = String(c.section);
    out.push({ w: String(c.word || '').trim(), deck, section: sec, anglo: String(c.anglo || ''), from: String(c.from || ''), say: String(c.say || '') });
  }
}
fs.writeFileSync(path.join(__dirname, 'yowl-canon.json'), JSON.stringify({ made: new Date().toISOString(), from: DIR, cards: out }));
console.log('canon: ' + out.length + ' cards from ' + new Set(out.map((c) => c.deck)).size + ' decks, into words/yowl-canon.json');
