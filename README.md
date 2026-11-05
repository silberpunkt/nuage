# Nuage

*A small talking cloud: a classic chat engine with no model inside, in one page, offline, in four cuts.*

Nuage answers "What is a kettle?" from a pocket of Cyc stripped to bytes and bone, learns what you teach her in plain
sentences and keeps it in your browser, speaks in Ecouter's voice (and her own), draws the sound of what she says, and
shows the shape of every sentence as circles. Nothing leaves the page. Open `dist/nuage.html` and she wakes.

## The four cuts

| cut | size | holds |
|---|---|---|
| `dist/cuts/nuage-64k.html` | 94.9 KB | Nuage alone: her cards, the pictures, and a slice of Cyc. No voice, no tilt. |
| `dist/cuts/nuage-128k.html` | 173.6 KB | Nuage as she stands: every card, Cyc, the shelves, Ecouter's voice and the wall it draws, Wallbreaker. |
| `dist/cuts/nuage-256k.html` | 255.9 KB | The pocket instrument: the 128, the sound drawings in the talk, Aquavit and its viewer, and Mimia's core. |
| `dist/cuts/nuage-1024k.html` | 882.7 KB | The 256 with the whole of Mimia. |

`dist/nuage.html` (173.6 KB) is the workshop's own build, with everything the panel needs. The sizes are aims, not oaths;
`dist/cuts/MANIFEST.txt` says what each holds and what it left out.

## What is in her

- **The engine** (`src/nuage.js`): a LISP reader, Cyc's forms (genls, isa, comment, prop, has, why, vext, picture),
  microtheories, defaults and rules, Do What I Mean, a small calculator, and the old tricks. She writes in the manner of
  Strunk and White. When you tell her something she keeps it as a kind, a quality, a meaning, or a thing said, and gives it
  back on waking.
- **The voices** (`src/ui.js`, VOICE_SRC): all are operations on Ecouter's frames. Nuage takes the yinyang arc across each
  sentence, slower then faster, lower then higher, lifted, and lands; Miria is that, nearly too much; Arthur is the slight
  inverse, out of respect; Blando is the human as a jest, voiced as a computer. A cast gives each line to the right voice.
- **The drawings**: the strip (colour is pitch, brightness is strength, sparks are hiss, time runs left, with the phones
  above and the words below), the square (the spectrogram box-reduced to nine bands, which remembers the first sound and
  the last), and the fleuriant (the wall the voice strikes, rings born at the centre and spreading, the past the outer ring).
- **Sandeko**: the enclosure diagram, a circle proper about each sentence and each clause, composed by difference so the
  overlaps go to black, in a tray of grey lines or a sky of depths, over the whole talk and the line being typed.
- **Mimia** (`patty/mimia`): a mirror, a byte-level net with balanced-ternary weights, five trits a byte, ground from the
  light of a local model's answers with commerce kept out; any prefix of her file is a smaller Mimia. Her lines are her own
  words, scanned into sentences by a table grated from Simple English Wikipedia; a click shows them reconnected.
- **The teardown** (`words/`): a word's sounds by rule, its mouth, its felt sense, its parts, its story, its kin by
  descent and by sound, and what it means, with the word libraries fetched to the machine when asked.
- **The janitor** (`patty/`): a PHP page and a panel that run the engines, gather the light, and rule on the cards.

## Running her

Open any cut in a browser; nothing else is needed. For the workshop: `node pack/pack.js` packs `dist/nuage.html`,
`node pack/cuts.js` builds the four cuts, `qjs test/score.mjs .` runs the scoreboard (QuickJS), and
`qjs test/replay.mjs . test/report4.txt` replays a user's session line by line. `node pack/repo.make.js` stages this
repository from the workshop.

## Who made her

User1 and Claude, after the grace of the old chat programs, with Ecouter, Wallbreaker and Vespers from the same house.
See ATTRIBUTION.md for everything she stands on, and `docs/workshop.md` for the plan she grew by.
