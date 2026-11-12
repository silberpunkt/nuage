# Nuage

*A classic chat engine for the Lucky 7 (2⁷ KB) compo: no model, no network, the old ways at full stretch.*

This imaginary prompt formed the concept. To some extent, we implemented a little of it. 

> Imaginary Demoscene Days. Dr. Holm and SweetJuice (formerly of The Officials UK) created a Claude-alike called Nuage. It makes fun of the "new AI age" by showing what a classic chat engine could really do in "impure LISP" and dried and cut excerpts from a Cyc database, Simple English Wikipedia, and leaning all over the built-ins available to JavaScript. With no network, no proper stack, and shopping out to WebGL for permutative video-feedback calculation, it was able to create Stickey Furniture (a Flappy Bird clone) in 2 min 38 seconds. There was crowd disbelief and then joy when SirDumptruck appeared onscreen and flattened many fine pixel furniture pieces. Not a hit, but hot. #35 out of a long list of entries to the new compo, JS128.

The knowing behind it: ELIZA and RACTER fooled people, ADVENT and SHRDLU did much more, Cleverbot carried the line on. There has always been a way to pack a local computer with pre-LLM technology for conversation, and with today's power and memory, much more could be done. Not Qwen's level, but well past what a console can do.

## The growth profile

|                   | budget | what it's for                                                                    |
| ----------------- | ------ | -------------------------------------------------------------------------------- |
| **dream**   | 128 KB | the compo entry: engine, a stripped Cyc, a pocket of Simple English, the bar     |
| **plan**    | 256 KB | room to lay it out properly: Stickey Furniture's game frame, the WebGL whirlpool |
| **realize** | 512 KB | the stretch at the very end: what one more doubling buys                         |

**The core and its loadables (3 xi 2026).** The 128 KB dream has been a good, low threshold: it taught Nuage to be simple and nice at that size, and the page still fits it. From here the core may grow to 256 KB, the plan, and no further, and it carries only what Nuage is. Whatever is supplementary rides as a loadable beside it (shelves, the libraries block, the workshop's panel), read in only when asked for, and never burdens the core. So a build can be asked for at 64, 128, 256 KB, or a full megabyte with everything attached, and the core stays small enough to live in cache.

Rough allotment of the dream: 16 to 32 KB of Cyc, stripped to bytes and bone, to establish what only a Cyc can pretend to know; the rest split among the engine, words, and the show.

## The rule of the page

Nuage is written for a general audience, the aged and the visually impaired included.

- **Type.** Everything is set in rem from a 95% base (what 135% looked like at the browser's 70%), so the reader's own font size governs the whole page. No type is smaller than the conversation. Nothing is faded, dimmed, or greyed down to a whisper.
- **Themes and size.** At the right of the title: Night (the house theme), Dusk (softer), and Day (ink on paper), then Font size with a minus and a plus. Both are remembered, and applied before anything is drawn. The page's colours live in CSS variables; the colours drawn by script (tincture, Wyrd, railyard, the lamp's white) are kept per theme. By day a picture stands on its own dark plate, as painted chat was drawn for one.
- **Folding.** Options (every switch, and the Patty-cake panel) and Credits fold away under their summaries, since a large type makes height dear. Each remembers whether it was open. Folded, the Options summary still shows a running job ("Options, Patty-cake: 40 of 200"), and the Credits summary still names OpenCyc, Ecouter, Wallbreaker, and Vespers.
- **Colour.** In every theme, every colour of text stands at least 4.5 to 1 against its ground. Focus shows as a bold yellow ring. A disabled button changes its border to dashes, never its legibility.
- **Order.** The bar's stages are named in full beneath it, each segment at least as wide as its name. The status line and the conversation are live regions for screen readers.
- **Prose.** Nuage writes in the manner of Strunk and White: capitals, commas, and periods, with the serial comma and no semicolons. Small numbers are spelled out, and its explanations come one sentence to a step ("Water is a liquid. A liquid that is heated may boil. A liquid that may boil gives off steam."). A last guard turns any semicolon that arrives in Cyc's glosses into a comma.

## Memory, and the switches

- **The pocket of the moment.** Nuage keeps the last lines both ways: "What did you just say?", "What did I say?", "What were we talking about?", "What have I taught you?"
- **What you teach is kept** in this browser (localStorage), written in Nuage's own forms, the same ones the knowledge files use: `(genls Turnip RootVegetable)`, `(has Bookcase "many shelves")`, `(in-mt FictionMt ...)`. On waking it says how many things it remembers. "Forget everything," or the Forget button, clears it and starts fresh.
- **Tilt** gives each question and reply longer than a line a Wallbreaker triangle: aired out, then tilted down.
- **Colour** cycles off, Viriditas, Vivificat, Omnia: each letter in the colour of its pitch, through Ecouter.
- **Tincture** (the fifth colour, after Vespers) uses no sound at all: each stretch is toned by how deep Wallbreaker finds it sits. The head keeps its ink; one step in is blue, then grass, dull goldenrod, and russet from four on (or wherever a sentence runs past its fifth stretch or forty words). The ink is only mixed toward the hue, 40% by default.
- **Vividness and Lightness** sliders appear whenever colour is on. Vividness takes Omnia (or the tincture) back toward plain grey and out again. Lightness brightens or darkens the coloured conversation. Both are remembered.
- **Wyrd** (after Vespers) sets a 25-by-5 path board above each reply: one line walking right along its stretches, stepping down a rung where Wallbreaker dives and up where it steps out, in the tincture's own hues.
- **Links.** Every word Nuage has a card for is underlined where it stands: a solid line for a thing ("tea"), a dashed gold line for a category with kinds of its own ("substance"). A click asks "What is it?", so a conversation becomes quick exploration. Drawn with the Custom Highlight API, so the words are never altered, and colour and tilt still work.
- **About.** Click the title, Nuage, for the About box: what Nuage is doing beside its computer science. It proposes, gently. Thirteen entries, each under one large glyph in a column at the left: User1's feather, then face (Brown and Levinson), Lakoff's three rules, Leech's tact, Goffman's ceremony, Searle's indirection, Pinker, Nowak, and Lee's graceful way out, Grice's implicature, Tomasello's joint attention, Clark's common ground, phatic communion (Malinowski, Jakobson), the premise (praemittere), and sympathesis. It is plain markup at the foot of the page, not compressed, so it can be read in the page's source and opens even before Nuage has unpacked. The thatch and the About box stand at the very top of the page's source, before the styles, so a reader of the source meets them first. Under each entry, one size smaller, "In Nuage:" says what in Nuage carries it, and for eight of them "In information theory:" adds the matching idea (Shannon 1948 and 1956, Equitz and Cover, Slepian and Wolf, and one marked as proposed here). Every citation links to its source, ringed like Nuage's own category words. After a lazy-S interlude (∾), "Great Milestones of Chat History": DWIM, ELIZA, SHRDLU, PARRY, ADVENT, Zork, MUD, RACTER, SCUMM, A.L.I.C.E., SmarterChild, Inform 7, and Cleverbot, each with its glyph, year, makers, and a link. The lineage named in the opening paragraph links there as a group. Then the last word: "The future is cloudy (nuageux)." The full About text lives in `src/about.html` and rides compressed in the payload. The page keeps only its thatch, in plain text: a title and a two-space-indented summary for each section, with a budget of its own (1,200 bytes, checked by the packer). The thatch shows if the About box is opened before Nuage wakes, and the full text unfolds over it when Nuage does.
- **Lexicon.** In the About box, before "(AI analysis)": the words this project leans on, in three drawers. As commonly accepted (ceremony, convention, premise, proposition, tact, and more). As used in linguistic and communication science, each with its source (common ground, face, feedback, grounding, handshake, implicature, metacommunication, phatic communion, redundancy, and more). And Nuage shop-talk, the coinages (consense, interscintillation, scintil, spinnetry, sympathesis, thatch, the third plate, and more). Compressed in `src/lexicon.html`, with a thatch in the page.
- **AI analysis.** In the About box, beside its title, "(AI analysis)" opens an assessment written by an AI model at User1's request, as a fair observer: what Nuage is, what it is good for, where it falls short, and what would help it most. Like the About text, it rides compressed (`src/analysis.html`) and shows a one-line thatch until Nuage wakes.
- **Do What I Mean.** After Warren Teitelman's DWIM: for a word Nuage does not know, it offers the nearest words it does (edit distance, transpositions counted as one step), one word for each thing, and never assumes. "What is a chiar?" "I have no card for 'chiar' yet. Did you mean chair? If not, what is a chiar?" "Yes" takes the first, naming one takes that one, and anything else teaches the new word, as before: "No, it is a kind of boat."
- **Hollow glosses left out.** `pack/hollow.js` drops OpenCyc descriptions that say nothing (a stutter such as "an event is an descending event," a circle such as "records are objects that record," or jargon such as "a subcollection of artifact") and puts the logicians' words plainly ("an instance of organization" becomes "an organization"). 33 were dropped and 13 mended. strip-cyc.js applies it whenever the knowledge is stripped again.
- **Shelves.** The flags (cards and pictures) wait on a shelf, Flags of Our World: their own small block in the page (3.6 KB), read in the first time a flag, banner, or pennant is asked about. The conversation shows it as a note, "[Loaded Flags of Our World, 8 cards.]" A flag Nuage does not know gets a plain answer and the list of those it does. A shelf saves waking work rather than bytes, and it is the shape a separate file of flags would take one day.
- **Scanatures.** Each conversation is kept as gist in this browser (`nuage.gist`): the things most asked about, and a mark a turn (● answered, ? asked back, X missed), as in "stars black holes penguins · ●●?●●●". It shows beside "Awake in", and a click opens the review of past conversations, each with a plain sentence ("You asked most about stars and black holes. I answered 5 of 6."). On waking, the last one is read first: "Last time: …". The sample chat is not counted. Forget clears them.
- **Sky and Science**, a second shelf, read in when the sky, the stars, the quantum, or the climate is first asked about: black holes, nebulae, where stars come from, galaxies, the universe and the Big Bang, quanta, quantum physics, qubits, quantum computers, climate, climate change, and the greenhouse effect. Begun from the questions the pupils asked.
- **Saying what it knows.** A question Nuage cannot answer, but which names something it knows, now gets what it knows ("Here is what I know of a star: …"), not "Ask me about it." "Is it a star?" asked of a word it is still waiting to learn gets "I do not know yet what a black hole is, so I cannot say." "It" means the thing just talked about. "Can you tell me what a qubit is?" is understood, and "What do you mean by 'no card'?" is answered: a card is one small fact.
- **Copying out** puts a blank line above each of your lines, so the asker stands apart from the answers.
- **Long paragraphs.** Nuage is best at one or two sentences, so three or more are taken backstage: each sentence is tried on its own, and the reply says what came of it. It answers what it can, notes what it could not ("Say 'notes' to see what I noted"), and says what the whole seems to be about, by the kind most of its named things share. The notes are kept for the session only. (user1: "We do what we can.")
- **Distilling the conversation.** The whole conversation is kept in memory for the session, so it can be asked about: "What are our hanging questions?" (Nuage's own questions still waiting, and your notes), "What's in the notes?", "What can I explain?" (the words it asked about and was not taught), "Any questions?" (it asks one), and "What have we talked about?" (how much was asked and answered, and the topics most asked about). Questions about the conversation are not counted as topics of it.
- **Painted pictures.** "Draw the flag of Norway." "Draw yourself." Pictures are written in painted chat, Vespers' colorburst grammar: glyphs, then one line of periods whose small marks carry the colours. `pack/paint.js` draws them by program and checks each shadow by decoding it; `vendor/yampal.js`, in the luggage, paints them on the page. The flag of Norway is drawn from its own vext card's ratios, in PMS 200 red and PMS 281 blue. The flag of Nepal follows the compass-and-straightedge construction of Schedule 1 of its constitution, step for step, with AB as the unit. Its height comes out 1.21901034 times its width, as it should. `test/nepal-construction.png` is the same geometry drawn at full resolution. The banner of Jeanne d'Arc follows its own card: white, about 1 to 4, swallowtailed, fringed componée in half-cell blocks, sown with gold, with Christ in Majesty in a mandorla, the two angels, and "JHESUS MARIA" in gold letters. Copied out, a picture is still plain text, and any reader with the grammar paints it again.
- Links are drawn softly: a thing's underline at 56% opacity, and a category ringed in a 2-pixel rounded line at 36%, so no letter stands on a dashed skate.
- **Railyard** (after Vespers) sets a signal stripe above each reply: a light for each known word (a diamond for a category), X for a denial, an arrow for a consequence, a slash for "and" and "or".
- **Vext cards** (`kb/vext.txt`): a card written as indented lines, two spaces a step. Nuage tells the top level and goes one level deeper each time you say "more" (or back with "less"). The indentation is the information, so the packer keeps it. "Tell me about the flag of Norway." "More."
- **The page spawns its own interface.** The page holds only the title, the bar, and the status line. Once the payload wakes, `src/ui.js` (packed and deflated with everything else) builds the entry box, the switches, and the sliders.
- The conversation scrolls. The title, the bar, the entry box, and the switches stay in view.
- **Say aloud** speaks the selection, or else the last reply, in Ecouter's own voice or the machine's.
- Ecouter and Wallbreaker (`vendor/`, MIT) ride deflated in their own block of the page and are inflated only when first wanted, so waking stays near 380 ms. The page is 78 KB with them, 51 KB without (`--no-libs`).

## The scoreboard

`test/score.txt` is a fixed set of questions with expected answers, in groups (kinds, the same said otherwise, commonsense, number and time, learning, Do What I Mean, conversation, worlds, flags, outside the cloud, harder). Each expectation is the right answer, not whatever Nuage happens to say, so a miss is a true miss. `test/score.mjs` runs it in QuickJS in about half a second and counts two things: how often Nuage answers rightly, and how gently. Gentleness is four numbers: dead ends (a reply that cannot help and offers nothing next), offers on a miss, statements acknowledged, and the words a reply costs to read. It prints every miss and dead end, and the change since the last run.

```
qjs test/score.mjs __nuage
```

The first run found two paraphrases failing ("Do you know what a chair is?", "A chair is what?") and five dead ends. All seven were mended. The set has since grown to 94 questions, many of them from the pupils and from your sessions, and Nuage answers 92 rightly with no dead ends. The harder group keeps two honest misses: "What is the plural of mouse?" and "Can a chair flap?". The totals are only worth what the set is, so it wants questions from others.

## Patty-cake

A small model claps questions at Nuage, and the misses come home as cards. The model never speaks inside Nuage. It only asks, judges, and proposes cards in Nuage's own forms, and every card must prove itself before it is kept.

```
python __demo\server.py                      # the engine room on :8177 (Qwen Zero, or any model it is told to load)
node patty\patty.js --n 200                  # ask, sort, judge, mend
node patty\review.js                         # your ruling, card by card
node pack\pack.js                            # rebuild; kb\taught.kb is read with the rest
```

1. **Questions**: half from fixed shapes over Nuage's own words, half written by the model about the same words.
2. **Answers**, sorted: answered, asked back, unknown, elsewhere (another world), or parroted (an old ELIZA turn).
   The session prints the coverage, so sessions can be compared.
3. **Judging** by one letter, never a score: A right and useful, B right but thin, C wrong, D not an answer.
4. **Cards**: for each miss, a card. Left to write freely, a small model rarely keeps to the forms (on the first run on the 3070, 144 of 147 free cards were turned away as "not a known form"). So for the common shapes of question it is only asked to fill a blank ("A vice is a kind of ___") or say yes or no, and the card is written by patty.js in Nuage's own names. Other free cards are mended where the meaning is plain (is-a, isa, "is a kind of", snake_case). A card must parse and use a known form. A fresh Nuage with the card must answer the same question better, and the sample chat must come out word for word as before. Survivors wait in `patty\proposed.kb`, each with its question and the answers before and after, whole.
5. **Your ruling**: `review.js` keeps a card (to `kb\taught.kb`), drops it (never proposed again), or lets it wait.

**From the page, with no console.** Serve the repo with its own `serve.php` and open Nuage through it:

```
cd C:\__john\__\__http\__mylar-lm
php -S localhost:8080 serve.php
start http://localhost:8080/__nuage/dist/nuage.html
```

A **Patty-cake** button then appears among the switches. Its panel shows the engine's light and lights it or rests it (through `__demo/engine.php`), runs a job of 50, 200, or 1,000 questions, and reports it as it goes: "Patty-cake is running: question 40 of 200, three cards kept so far." Reload the page and it notices the job still running. Cancel stops it. "Rest the engine when done" puts the card to sleep when the job finishes, so no power is spent idling. When a job is done, its cards wait in the panel with Keep and Drop, and "Rebuild Nuage" packs the kept ones in and reloads. The page talks to `patty/patty.php`, a janitor like the engine's: fixed verbs only, numbers read as numbers, a card acted on only if it is exactly one already waiting, and nothing answered but the house. `test/janitor-mock.js` stands in for both janitors in a headless browser, where there is no PHP.

**Engines.** Beside "Start the engine," choose one of three. Only one runs at a time, since an 8 GB card holds one model.

| Engine      | Model                                                                                                           | Role                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| the classic | Qwen2.5 1.5B, in `__demo/server.py`                                                                           | the original engine room, shared with the demo |
| impeccable  | Qwen3.5 9B, 4-bit (`unsloth/Qwen3.5-9B-GGUF:Q4_K_M`), in llama.cpp                                            | judging, filling blanks, writing cards         |
| fantastic   | Gemma 4 E4B, 4-bit (`ggml-org/gemma-4-E4B-it-GGUF:Q4_0`, the 4-bit file that repository offers), in llama.cpp | the curious pupil                              |

The larger two run in llama.cpp's own server, one program with no Python to install. "Fetch llama.cpp" runs `patty/fetch-llama.ps1`, which looks down GitHub's recent llama.cpp releases for the first carrying a Windows build (the numbered releases, v0.7.0 and on, carry notes only; the binaries ride on the nightly builds) and unpacks the Windows CUDA 12 build into `__libs/llama.cpp`. The first start of a model fetches it from Hugging Face into `__libs/models` (several gigabytes; the panel shows the server's last line meanwhile). After that, a start takes seconds. llama-server listens on port 8178, the classic engine room on 8177, and the janitor speaks to whichever is lit.

**Answers from.** In the panel, choose who answers what you type: Nuage, the engine, or both, Nuage first. The engine's replies are marked with its name ("Gemma 4 E4B:") and take every Wyrd, Omnia, railyard, and tilt that Nuage's do, so the two can be compared turn by turn. The engine sees only its own side of the talk, your lines and its replies, never Nuage's answers, so neither copies the other.

**Fetching, loading, waking, lit.** The panel names a large engine's start in the order it happens: fetching its model (the first time, with the gigabytes so far), loading it, waking (the server is listening but its model is not ready), and lit, which is llama-server's own /health saying "ok". Models are started without their image projectors (`--no-mmproj`), which saves half a gigabyte of the card for the conversation.

**Starting things without waiting on them.** The janitor starts the download, the engine, and the jobs with every stream sent to NUL, so it holds nothing open and answers the panel at once. (Started the first way, with popen and `start /B`, the child kept the janitor's pipe, and a single-threaded `php -S` answered nothing until the child ended.) If the engine stops, the panel says why, in the server's own last line. The panel opens again on reload if it was open.

**Where the panel lives.** All of Patty-cake (the panel, the engines, the jobs, the pupil, and the comparison) is in `patty/panel.js`, beside its janitor. ui.js fetches it only when Nuage is served over the web, so the page itself carries none of it, and the 128 KB dream is Nuage's alone.

**Watch a pupil talk.** The same pupil as the conversations below, but live, in the conversation itself: it picks a topic, and each of its questions is typed into the box a character at a time (the typing is theatre; the questions are its own), marked "Pupil:", and answered by Nuage as if you had asked. After four questions it gives its verdict in a note: "[The pupil was partly satisfied: 'it knew what a penguin was, but not why penguins swim.' Nuage answered three of four, and the miss goes to the candidates.]" Its words live with the janitor (`do=pupil`), not in the page.

**Conversations (the pupils).** Choose "conversations" beside Run patty-cake (ten by default). For each one, the model plays a school pupil who picks a topic of its own, asks Nuage three to five plain questions in turn, each following the last answer, and then says whether its interest was understood and satisfied (A, B, or C, with a sentence on what was missing). The panel reports "Patty-cake is talking: conversation 3 of 10." The questions Nuage missed are written to `test/candidates.txt` with the topic and what Nuage said. Give one a right answer (`question => pattern`), move it into `test/score.txt`, and it joins the scoreboard as a question written by someone other than Nuage's makers. Under the stand-in model, the first conversations found a crash ("What happens if it is heated?") and "Can it fly?" taking "it" for the insect. Both are mended: "it" now means what was just being talked about. `node patty/patty.js --talks --n 10 [--turns 4]`, or the panel, which asks the janitor for `do=start&talks=1`.

**Epirings (User1's word).** Rings that turn about the spine of a conversation and feed it forward. When Nuage cannot answer a pupil, the pupil often supplies an answer of its own in its next question: "Do clouds form when the warm air rises and gets cold?" The *listening ring* hears it, with no model at all. In the engine, `supposes()` turns such a question into a plain statement ("clouds form when the warm air rises and gets cold"). When Nuage cannot answer it, it says so, and keeps the supposition in its notes, for a person to rule on. Nothing a pupil says is taken for a fact. The *teaching ring* runs after a set of conversations. For each missed question, it asks the lit engine, as teacher, for one card that would answer it, with the pupil's supposition beside it. Each card is proved, asked again in its place in the talk, so that "it" still means what it meant. It must read, it must change the answer, and the sample chat must stay the same word for word. Survivors wait in `patty/proposed.kb` beside the evidence, for your ruling in the panel.

**The card's spare memory.** llama-server now starts with four slots (`-c 16384 -np 4`, 4,096 tokens a slot), and the mirror keeps four questions in flight at once, so the spare memory goes to speed.

**The Sontimeter (User1's canon, from the Exaspera).** Three dials and one light in the upper right of the page. Each dial is one axis of alignment in the talk, read over the last eight turns: *accord* (am I answering?), *ground* (are we on one thread, each turn acknowledged?), and *pitch* (is the talk going forward, not round?). When all three read above nought, the little light goes on. When it is off, the conversation may be in a disreputable state. `N.sontimeter(n)` gives the three numbers. A simple read.

**Colignity.** Simple alignment, by simple equivalence. "2 > 1." "It is." "Is ten greater than three?" "Yes, it is." "2 + 2 = 5." "It is not. 2 + 2 is 4, and that is less than 5." Both sides go through the calculator, so words and symbols both work.

**Mimia, the mirror (User1's terrible theory, made a method).** A separate engine that knows nothing, ground against a model's answers until her mirror shows its manner. Three steps, all from the panel:

1. *The mirror.* Choose "the mirror (Mimia's light)" beside Run patty-cake. The lit model answers plain questions, one to three sentences each, into `patty/mimia/light.jsonl`. The questions come from the distilled magazines (`__no-copy/__references/__distilled/distilled.txt`, 974 questions with their sources credited inline, read at run time and never copied into Nuage), then the scoreboard, the candidates, the pupils, and templates over Nuage's words, a little of each in turn. A fresh Nuage is asked each question too. When it already answers from its cards, the light says YIELD, so Mimia learns to hand back to the core what the core already knows. Runs add up, and questions already in the light are skipped. The long part is here: on the 3070, a few thousand answers take an hour or two.
2. *Grind Mimia.* `patty/mimia/grind.py` (Python and numpy, from the demo's venv, on the CPU) teaches her to guess each next byte of the teacher's answer from her own last 32 bytes, the question as a bag of hashed words, her place in the answer, and a copy hint, so that she can echo the question's words. Her weights are balanced ternary, after BitNet b1.58: -1, 0, or +1, times a scale for each hidden unit, packed five to a byte. She is nested, after MatFormer. Each step grinds the whole of her and one smaller core (64, 128, or 256 of her 512 units), and the file is laid out unit by unit, so **any prefix of `mimia.bin`, cut at a unit, is a smaller working Mimia.** The whole file is about 127 KB, and its first 64 KB is a wilder Mimia of 249 units. A grind writes `mimia.json`, with the bits a byte at each core size, and `mimia-samples.txt`, with answers read back from the very file at each size.
3. *Answers from Mimia.* Choose "Mimia, the mirror" under Answers from, and she answers in the conversation, labelled with her size. `patty/mimia/mimia.js` does the same arithmetic as `grind.py`, and the two agree byte for byte. When she yields, Nuage answers.

**Tappable domains.** Some kinds of talk are kept out of her grinding unless tapped on purpose, as a philatelist opens one album and leaves the rest shut. They are named in `patty/mimia/domains.json`; the first is *commerce* (prices, customers, sales, marketing, money). A question in a domain's words belongs to it, and so does an answer that uses three of them or more. The mirror marks each answer with its domain, and `grind.py` leaves the domain out unless given `--tap commerce`. Of the first 5,000 answers, 279 were commerce.

She copies manner, not knowledge. On a first test, with Nuage itself as the teacher, she learned its shape exactly ("A taking in is a kind of moving into, and so of movement.") and made up words where she had no facts ("A flumbatrig is a kind of tring."). That is the expected result at this size: TinyStories found that models under about ten million weights write fluent English only in narrow domains. She is greedy and deterministic, so she is as measurable as Nuage.

**Words, torn down (`words/`).** An outer frame for Nuage's word-knowing, never packed into the page. Type a word into "Tear down a word" in the panel, and its card appears in the conversation:

- its sounds: CMUdict's phonemes and stress, Wiktionary's IPA, and the NRL 1976 letter-to-sound reading by Vespers'
  Lexillogue (`__entile/__vespers/ecouter/lexillogue.js`), which reads any word at all;
- the mouth's path, vowel by vowel, high or low and front or back, because sounds are movies;
- its felt sense: phonaesthemes such as gl- (light and seeing) and sn- (the nose), each with its source (Firth 1930,
  Bloomfield 1933, Marchand 1969, and Bergen 2004, who tested gl- and sn-), and the small or large stressed vowel
  (Sapir 1929, Jespersen 1922);
- its parts: Wiktionary's affix templates when they are at hand, or a guess from common affixes, said to be a guess ("anti- + dis- + establish + -ment + -arian + -ism");
- its story and senses: the Wiktionary etymology and the Open English WordNet definitions;
- the canon: every YOWL card of that word, and the cards whose from-lines mention it (`words/canon.js` indexes Great YOWLs into `words/yowl-canon.json`, 798 cards from 35 decks).

Two kinds of kin, never confused. *Kin by descent* is what Wiktionary's etymology itself names: doublet, cognate, related, "more at". *Kin by sound* is the words that open with the same consonants and carry the same stressed vowel (CMUdict, kept to words WordNet knows), which the ear hears as family whether or not history agrees. Phonaesthesia lives in the second, and etymology in the first.

Sounds are movies, so each card is drawn twice from Ecouter's own score of the word (`phones.js` frames: length, formants, voice, hiss, breath). *Side-on*, the word lies along its milliseconds: voiced sound a column as tall as its voice, coloured by where the mouth is (front vowels warm, back vowels blue, open vowels deeper), hiss a grey stipple, a stop's silence a gap. *Face-on*, the word is what a wall receives at the instant the speaker stops: each sound has travelled outward as a wavefront, the first farthest, so the word is a target of rings with its last sound at the centre and its silences as empty rings. At 343 metres a second, "shire" (410 ms) has its first sound 141 metres out.

**WordNet beside the gloss.** When patty-cake writes a gloss for "What is X?", the model now sees WordNet's noun senses of X first, and the sense that shares most with what Nuage already says is offered as a card of its own, noted "from Open English WordNet 2025 (CC BY 4.0)". If you keep one, the page's Credits say so.

"Fetch the word libraries" runs `words/fetch_words.py` (Python's standard library only) into `__libs/words`: CMUdict (BSD-style), Open English WordNet 2025 (CC BY 4.0), and Wiktionary's English etymologies by way of kaikki.org (CC BY-SA 4.0), read as the 3 GB file streams and kept only for words in the first two. Everything is sharded by first letter, so a teardown reads one small file. `__libs/words/ATTRIBUTION.md` credits each. WordNet keeps no etymologies, so they come from Wiktionary.

**Challenge cards.** `patty/challenge.txt` is a written set of plain questions in groups (kinds and parts, properties, people, time and number, language, feelings), and `node patty/challenge.js` sorts every answer the same way. The first set took Nuage from 30% to 97% answered, by hand-woven cards: parts and counts ("How many legs does a dog have?"), properties (colour, temperature, material, what a thing eats, where it lives, what a person does), opposites, prime numbers, either-or questions, a few reasons ("Why is the sky blue?"), and plain answers about itself.

**Sums.** Nuage keeps a small calculator: a recursive-descent parser, no eval. "What is 15 percent of 80?" "The square root of 2." "Two to the power of ten." "(3 + 4) * 6." Say "help math" for the whole of it.

`--mock` runs the whole pipeline without a model, for testing. `--templates-only` asks only the fixed shapes. `pack\load.js` wakes the engine in Node with the same knowledge files, for the harness and for tests.

## The rule of the bar

The unpacker's progress bar is the most fun part of any demo, and here it must be **true**. Each segment is one stage (`inflate`, then the payload's own `read`, `index`, `words`, and whatever comes later). Each segment's fill is that stage's own count: bytes out of the inflater, characters read, assertions indexed, words learned. The segment widths are the packer's own timing of each stage, measured when it packed, with none narrower than a twelfth of the widest so its name stays readable. Nothing is eased, padded, or faked. And we hope it's fast.

## The four cuts

`pack/cuts.js` makes four pages from one source, each offline and whole, into `dist/cuts` with a `MANIFEST.txt` that says what each holds and leaves out. From the panel: **Build the four cuts**.

- **64 KB:** Nuage alone, with its own cards, the pictures, and as much of Cyc as fits, sliced by concept (the most connected kept, with their ancestors). No voice, no tilt, no shelves; the About box keeps its summary.
- **128 KB** (140 KB as it stands): Nuage whole, with Cyc, the shelves, Ecouter's voice and the wall it draws while speaking, Wallbreaker, the lexicon, and the analysis.
- **256 KB:** the pocket instrument. The 128, and the sound drawings in the talk ("draw the sound of glimmer", "how does clamor sound?"), Aquavit with its grid viewer (the Aquavit button), and as much of Mimia as the room left holds.
- **1024 KB** (about 850 KB): the 256 with the whole of Mimia.

Two parts cut cleanly at any boundary, and so fill the room a cut has: Cyc, by concept, for the smallest; Mimia, by unit, for the larger. The parts join the page through one door, `window.NUAGE` in `src/ui.js`, with a button among the options, a command answered before Nuage, or a word added after; the modules are in `src/mods/`. Mimia is off until her button is pressed, speaks only where Nuage could not answer, is labelled as the mirror, and yields to the cards.

## Layout

```
src/nuage.js     the engine: an impure LISP reader, the knowledge tables, the old tricks (pattern, reflection, asides)
src/boot.js      the unpacker and its bar
src/page.html    the page: honest UTF-8, the payload seven bits to a character, in lines of 320, with a check sum
kb/seed.kb       a hand-written placeholder in Cyc's shape, until the real one is stripped in
pack/pack.js     engine + knowledge -> dist/nuage.html; budget report; reads the page back as a browser would
dist/nuage.html  the entry
data/            raw sources (Cyc OWLs, Simple English dumps): not committed
```

```
node pack/pack.js              # build and report
node pack/pack.js kb/other.kb  # with another knowledge file
```

## Built-ins we lean on (zero bytes of decoder)

- `DecompressionStream('deflate-raw')`: the browser's own inflater, streamed so the bar can count it.
- **Seven bits a character** (after base-122): the deflated bytes ride as plain UTF-8, so the page reads the same whatever a server calls it, at an eighth more instead of base64's third. Four sevens cannot stand in a script's text (NUL, line feed, CR, '<'); each is folded with the seven after it into one character above U+0100. The data stands in lines of 320 with Windows breaks, and an Adler-32 check sum lets the page say plainly if it was changed on the way. (The first build declared windows-1252 and carried raw bytes, a cent and a half dearer than nothing; a server that says "UTF-8" in its headers overrules the page and breaks that, which is why it went.)
- Next: `Intl.Segmenter` (words and sentences), `Intl.PluralRules`, Unicode-property regexes, `speechSynthesis`, WebGL for the whirlpool.

## Where it stands

8.8 KB page, 7% of the dream. The engine reads, indexes and chats over a 69-assertion placeholder ("Is a stool a kind of furniture?" "Yes. A stool is a kind of furniture (stool > seat > furniture)."). Level 0, after ELIZA, PARRY and RACTER, plus the oldest honest trick: when it has no card, it asks, and remembers ("What is a turnip?" "a root vegetable" ... "Is a turnip a plant?" "Yes ... turnip > root vegetable > vegetable > plant"). It does sums with the built-ins, says what it holds when asked for help, and answers 'Liza's bucket as Henry should.

### The basket: rules, defaults and worlds (13.3 KB page)

The OWL gives the skeleton: kinds, glosses, spoken forms and disjoints, stripped to bone. A few dozen hand-woven rules give the commonsense step. Microtheories give context: Nuage answers inside whatever world the talk is in. "Let's talk about Apollo" switches context, and SirDumptruck stays in fiction unless you invite him out.

```lisp
(disjoint Bird Fish)                                  ; "Is a penguin a fish?" "No. A penguin is a bird, and nothing is both..."
(default (Bird ?x) => (flies ?x) (has-feathers ?x))   ; "Can a sparrow fly?" "Yes. A sparrow is a bird. Birds fly."
(except Penguin flies)                                ; "Can a penguin fly?" "No. Penguins do not fly."  (the nearest word wins)
(rule (Liquid ?x) (heated ?x) => (may-boil ?x))       ; "What happens if water is heated?"
(rule (Liquid ?x) (may-boil ?x) => (gives-off-steam ?x))   ;  "Then the water may boil, and gives off steam."  "Why?" gives the chain
(in-mt ApolloMt (isa Eagle Spacecraft) ...)           ; Eagle is known only from Apollo; elsewhere Nuage says where to find it
(mt-word ApolloMt "apollo" "the moon")                ; "let's talk about the moon"
```

Things taught while in a world stay in that world.

**SAMPLE CHAT.** A button beside the input plays `src/sample.txt`: what Nuage can do, then what it can't (yet), then "your turn". Every pack replays it and warns if any can-do line falls through to the old tricks.

`test/talk.txt` is the conversation every pack replays: user1's first run, line for line, then teaching. `test/drive.js` types it into the real page in a headless browser and photographs it (`test/talk.png`). The pack reports what better packers would reach (brotli about 9% under deflate on this payload); a context-mixing packer such as roadroller is the obvious next tool, once the payload is big enough for it to matter.

### Stripping an OWL (first practice: the WHO ICF, from `__remanent\protege\facsimile-master`)

```
node pack/strip-owl.js <file.owl> --gloss 60 --drop "other specified|unspecified" --world BodyMt --words "the body,health" --out data/icf.kb
node pack/pack.js kb/seed.kb data/icf.kb --talk test/body.txt
```

It prints a census first (what the file really holds), then the strip in two shapes, both measured deflated: the s-expressions Nuage reads, and an outline (one line per class, its depth as one character, so no parent is ever named; boot would reinflate it with a stack). On the ICF's 1,557 classes: skeleton only, 7 to 9 bytes a class deflated; with 60-character glosses, 16 to 22. Dropping its boilerplate ("other specified", "unspecified") removes 476 classes, 31%: pruning really is votable. Loaded as a world, Nuage answers in it ("let's talk about the body", "is quality of sleep a mental function?" "Yes ... quality of sleep > sleep functions > global mental functions > mental functions") and the bar has real work to count: 37 KB page, awake in about 330 ms in the headless browser.

### OpenCyc, stripped (the real skeleton)

```
node pack/strip-cyc.js opencyc-latest.owl.gz --words <ranked english word list> --max 2000 --parents 2 --cards 0 --gloss 60 --glossfor 400 --out kb/cyc.kb
node pack/pack.js          # now builds kb/seed.kb + kb/cyc.kb by default
```

From `__remanent\opencyc\opencyc-latest.owl.gz` (116,822 classes; the two 2012-05-10 files there are cut short and do not decompress to the end). The 2,000 most everyday concepts, chosen by how common their label is and how much lies beneath them, each filed under its nearest kept ancestors, take 27.6 KB deflated: 2,816 parent links, 400 glosses, 511 disjoints, and a list of "floors" (living thing, open system...) that Nuage files through but does not mention. The page is 43.8 KB, a third of the dream, and wakes in under 400 ms. The word list is only a build-time sieve and is never shipped.

OpenCyc is CC BY 3.0 (Cycorp, Inc.); the attribution rides in `kb/cyc.kb` and the packer prints it on the page.

Next:

1. Strip the Cyc OWLs (`data/`) to bytes and bone: `pack/strip-cyc.js`, measured against 16 and 32 KB.
2. Bring in the structure-finding of Wallbreaker and the bitpacking from the PBE audio format.
3. The WebGL whirlpool, as a stage the bar can count (shaders compiled, frames warmed).
4. Stickey Furniture's game frame, for the 256 KB plan.
   Its design, as user1 imagines it: there is gravity, but Sir Dumptruck simply goes on. He crushes a fine
   Scandinavian table or a Shaker chair ("OOPS," "EXCUSE ME," "I'LL BUY THAT") and keeps walking. He jumps, shallowly,
   and bumps his head on the gently swinging Mode 7 chandeliers overhead ("UH OH"), and keeps walking. He may make no
   points, but no one and nothing may stop the man. The game ends when he walks out of the far side of the store and
   says, "WHERE IS MY VEHICLE?"
   4a. Knowledge by primacy (user1: "Why, and By"): shelves arranged as a head and petals, like the strap-on boosters of
   a heavy rocket. Each shelf (Flags of Our World, puppies, biological bodies, astronomical objects) is not merged into
   general knowing but attached by its own introduction, its nose: from this place, here is that domain's own story,
   ordered first by what is attained, then by what depends on it. Things are; time is; light lets them be seen.
   4b. Computational impressionism (user1's stretch goal): with Nuage as the starting place, let a Gemma or a Qwen make
   impressions reciprocally across a set of conversations, so that what it knows is recreated, recrystallized, on the
   deterministic side, in few bytes. The pupils and the scoreboard are the first brushstrokes: the model asks, Nuage
   answers, a person rules, and what survives becomes cards.
5. Working alongside A-Frame, not inside it: an `<aframe-kit>` with a complementing OWL, so a scene can be asked for in plain sentences ("New A-scene, please. Standard environment with grass and rain. WASD controls. A red box at 0, 0, 1, turned 45 degrees on Y to face the camera, bouncing in Y like a ball at 1 Hz."). Nuage would write the markup; A-Frame, loaded by the page that asks, would draw it.
6. Compressors as tools to be handed, not shipped: qjs (or the page) given run-length, tar, a deflate, or a one-time bit-predictive cruncher, chosen for the job. Codebooks could arrive with the OWL that needs them.
