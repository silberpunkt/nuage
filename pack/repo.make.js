/* repo.make.js -- the workshop, staged as a repository, to stand shoulders up with Vespers and Ecouter (User1, 5 xi 2026).
   The workshop stays the source. What is Nuage's to publish is copied into ../__repo in a layout developers know; what is
   yours to keep (the __no-copy folder: references, sources, the shard, your reports, the notes) never leaves here.
       node pack/repo.make.js            stage it (after pack.js and cuts.js, so dist/ is fresh)
   README.md, LICENSE and docs/ are written the first time and kept by hand thereafter; everything else is written over.
   The manifest of what went is printed at the end, with sizes, so the staging is a thing one can read. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '__repo');
const K = (n) => (n / 1024).toFixed(1) + ' KB';
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const copy = (rel) => { const s = path.join(ROOT, rel), d = path.join(OUT, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); return fs.statSync(d).size; };
const list = (dir, re, not) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => fs.statSync(path.join(ROOT, dir, f)).isFile() && re.test(f) && !(not && not.test(f))).map((f) => dir + '/' + f);

// ---- what is hers to publish
const FILES = [].concat(
  ['dist/nuage.html'], list('dist/cuts', /./),
  list('src', /\.(js|html|txt)$/), list('src/mods', /\.js$/),
  list('kb', /\.(kb|txt)$/),
  list('pack', /\.js$/),
  list('vendor', /./),
  list('words', /\.(js|py|json|html)$/, /^fetch\.|\.log$/),
  ['patty/panel.js', 'patty/patty.php', 'patty/patty.js', 'patty/challenge.js', 'patty/challenge.txt', 'patty/review.js'],
  ['patty/mimia/grind.py', 'patty/mimia/mimia.js', 'patty/mimia/domains.json', 'patty/mimia/mimia.bin', 'patty/mimia/mimia.json'],
  list('test', /\.(txt|mjs|js)$/, /^score\.last|^cyc\.txt$|^body\.txt$|^candidates|^glosses/),
  list('data', /./),
  ['the-cloud-and-the-third-plate.yowl.yaml']
).filter((f) => fs.existsSync(path.join(ROOT, f)));

// ---- a clean slate, but the hand-kept files stay
const KEEP = ['README.md', 'LICENSE', 'docs', 'index.html', 'media', '.nojekyll', '.git'];   // and the site's own files, and git's
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (!KEEP.includes(f)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let total = 0; const went = [];
for (const f of FILES) { const n = copy(f); total += n; went.push([f, n]); }

// ---- the attribution: every outer thing, with its licence, where it is used
const man = fs.existsSync(path.join(ROOT, 'dist/cuts/MANIFEST.txt')) ? rd('dist/cuts/MANIFEST.txt') : '';
fs.writeFileSync(path.join(OUT, 'ATTRIBUTION.md'), `# Attribution

Nuage is MIT (see LICENSE). It stands on these, each under its own licence, named where the work is shown:

- **OpenCyc** (kb/cyc.kb, sliced and stripped): knowledge from OpenCyc, (c) 2001-2012 Cycorp, Inc., under the Creative
  Commons Attribution 3.0 licence. https://github.com/asanchez75/opencyc
- **Ecouter** (vendor/ecouter.min.js): the voice, the colour, and the frames the drawings read; MIT, vendor/ecouter-LICENSE.txt.
  https://github.com/silberpunkt/ecouter
- **Wallbreaker** (vendor/wallbreaker.js): the tilt; MIT, vendor/wallbreaker-LICENSE.txt. https://github.com/silberpunkt/wallbreaker
- **Vespers**: the painted pictures' grammar, the rings that became the sandeko, the Wyrd; MIT. https://github.com/silberpunkt/vespers
- **Open English WordNet 2025**: some cards kept by the user's ruling quote its glosses, and the teardown's "Means" rows
  are its senses when the word libraries are fetched; Creative Commons Attribution 4.0. https://en-word.net
- **Simple English Wikipedia**: words/punct.json is a table of counts grated from it by words/grate.py (what stood in the
  gaps between words); Creative Commons Attribution-ShareAlike 4.0. The articles themselves are not shipped.
  https://simple.wikipedia.org
- **CMUdict** and **Wiktionary** (via kaikki.org): fetched to the machine by words/fetch_words.py when asked for, used by
  the teardown and the read-back; never shipped. BSD, and CC BY-SA 4.0.
- **The ICF** (data/icf.kb): the WHO's International Classification of Functioning, stripped to a microtheory.

The four cuts, as last built:

${man.split('\n').slice(2).join('\n')}
`);

// ---- README and LICENSE and docs: written once, then yours
const once = (rel, text) => { const d = path.join(OUT, rel); if (fs.existsSync(d)) return false; fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, text); return true; };
once('LICENSE', `MIT License

Copyright (c) 2026 User1 and the Nuage contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);
once('docs/workshop.md', rd('README.md'));
if (fs.existsSync(path.join(ROOT, 'words/voices - a note for ecouter.md'))) once('docs/voices.md', rd('words/voices - a note for ecouter.md'));
const sizes = {}; for (const [f, n] of went) if (/^dist\/cuts\/nuage-(\d+)k/.test(f)) sizes[RegExp.$1] = K(n); const full = went.find(([f]) => f === 'dist/nuage.html');
once('README.md', `# Nuage

*A small talking cloud: a classic chat engine with no model inside, in one page, offline, in four cuts.*

Nuage answers "What is a kettle?" from a pocket of Cyc stripped to bytes and bone, learns what you teach her in plain
sentences and keeps it in your browser, speaks in Ecouter's voice (and her own), draws the sound of what she says, and
shows the shape of every sentence as circles. Nothing leaves the page. Open \`dist/nuage.html\` and she wakes.

## The four cuts

| cut | size | holds |
|---|---|---|
| \`dist/cuts/nuage-64k.html\` | ${sizes['64'] || '?'} | Nuage alone: her cards, the pictures, and a slice of Cyc. No voice, no tilt. |
| \`dist/cuts/nuage-128k.html\` | ${sizes['128'] || '?'} | Nuage as she stands: every card, Cyc, the shelves, Ecouter's voice and the wall it draws, Wallbreaker. |
| \`dist/cuts/nuage-256k.html\` | ${sizes['256'] || '?'} | The pocket instrument: the 128, the sound drawings in the talk, Aquavit and its viewer, and Mimia's core. |
| \`dist/cuts/nuage-1024k.html\` | ${sizes['1024'] || '?'} | The 256 with the whole of Mimia. |

\`dist/nuage.html\` (${full ? K(full[1]) : '?'}) is the workshop's own build, with everything the panel needs. The sizes are aims, not oaths;
\`dist/cuts/MANIFEST.txt\` says what each holds and what it left out.

## What is in her

- **The engine** (\`src/nuage.js\`): a LISP reader, Cyc's forms (genls, isa, comment, prop, has, why, vext, picture),
  microtheories, defaults and rules, Do What I Mean, a small calculator, and the old tricks. She writes in the manner of
  Strunk and White. When you tell her something she keeps it as a kind, a quality, a meaning, or a thing said, and gives it
  back on waking.
- **The voices** (\`src/ui.js\`, VOICE_SRC): all are operations on Ecouter's frames. Nuage takes the yinyang arc across each
  sentence, slower then faster, lower then higher, lifted, and lands; Miria is that, nearly too much; Arthur is the slight
  inverse, out of respect; Blando is the human as a jest, voiced as a computer. A cast gives each line to the right voice.
- **The drawings**: the strip (colour is pitch, brightness is strength, sparks are hiss, time runs left, with the phones
  above and the words below), the square (the spectrogram box-reduced to nine bands, which remembers the first sound and
  the last), and the fleuriant (the wall the voice strikes, rings born at the centre and spreading, the past the outer ring).
- **Sandeko**: the enclosure diagram, a circle proper about each sentence and each clause, composed by difference so the
  overlaps go to black, in a tray of grey lines or a sky of depths, over the whole talk and the line being typed.
- **Mimia** (\`patty/mimia\`): a mirror, a byte-level net with balanced-ternary weights, five trits a byte, ground from the
  light of a local model's answers with commerce kept out; any prefix of her file is a smaller Mimia. Her lines are her own
  words, scanned into sentences by a table grated from Simple English Wikipedia; a click shows them reconnected.
- **The teardown** (\`words/\`): a word's sounds by rule, its mouth, its felt sense, its parts, its story, its kin by
  descent and by sound, and what it means, with the word libraries fetched to the machine when asked.
- **The janitor** (\`patty/\`): a PHP page and a panel that run the engines, gather the light, and rule on the cards.

## Running her

Open any cut in a browser; nothing else is needed. For the workshop: \`node pack/pack.js\` packs \`dist/nuage.html\`,
\`node pack/cuts.js\` builds the four cuts, \`qjs test/score.mjs .\` runs the scoreboard (QuickJS), and
\`qjs test/replay.mjs . test/report4.txt\` replays a user's session line by line. \`node pack/repo.make.js\` stages this
repository from the workshop.

## Who made her

User1 and Claude, after the grace of the old chat programs, with Ecouter, Wallbreaker and Vespers from the same house.
See ATTRIBUTION.md for everything she stands on, and \`docs/workshop.md\` for the plan she grew by.
`);

// ---- the manifest, printed
went.sort((a, b) => b[1] - a[1]);
console.log('staged ' + went.length + ' files, ' + K(total) + ', into ' + OUT);
for (const [f, n] of went.slice(0, 12)) console.log('  ' + K(n).padStart(10) + '  ' + f);
console.log('  ...');
console.log('kept by hand: ' + KEEP.join(', ') + '; kept out: __no-copy, logs, sessions, the light, the shard');
