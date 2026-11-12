# Attribution

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

nuage-64k.html   98.0 KB (aim 64 KB)
  holds:  Nuage, its seed and taught cards, the pictures, and Cyc sliced to 349 of 1999 concepts
  leaves out:  Ecouter (voice, colour, the wall), Wallbreaker (tilt), the shelves (flags, sky and science), the About box in full (its summary stays), the lexicon, the AI analysis

nuage-128k.html   177.0 KB (aim 128 KB)
  holds:  Nuage as it stands: every card, Cyc (2,000 everyday concepts), the shelves, Ecouter’s voice and the wall it draws while speaking, Wallbreaker, the lexicon, the AI analysis
  leaves out:  Mimia, Aquavit, the sound drawings in the talk

nuage-256k.html   255.8 KB (aim 256 KB)
  holds:  the 128 cut, the sound drawings in the talk ("draw the sound of glimmer"), Aquavit and its viewer (the Aquavit button), and Mimia, 72 of her 2048 units (21.5 KB)
  leaves out:  the rest of Mimia, the word libraries (CMUdict, WordNet, Wiktionary), which stay outer

nuage-1024k.html   886.1 KB (aim 1024 KB)
  holds:  the 128 cut, the sound drawings in the talk ("draw the sound of glimmer"), Aquavit and its viewer (the Aquavit button), and Mimia, 2048 of her 2048 units (494.3 KB)
  leaves out:  the word libraries (CMUdict, WordNet, Wiktionary), which stay outer

