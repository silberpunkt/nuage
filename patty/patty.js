/* patty.js -- patty-cake: a small model claps questions at Nuage, Nuage claps answers back, and the misses come home as
   cards. The model never speaks inside Nuage: it only asks, judges, and proposes cards in Nuage's own forms, and every card
   must prove itself before it is kept (it parses, it answers the miss it was written for, and it changes nothing that
   already worked). You rule on the survivors with review.js.

     node patty/patty.js [--url http://localhost:8177] [--n 200] [--seed 7] [--templates-only] [--mock]
                         [--job patty/job.json] [--then-stop]
   --job writes its progress to a small file as it goes (the page reads it, notices a job running, and can cancel it);
   --then-stop rests the engine room when the job is done, so no power is spent on an idle card.

   The model is the one __demo/server.py serves (Qwen Zero by default; any it can load). It is asked through POST /chat
   with { messages, temperature, max_new_tokens, sampler_seed } and answers { reply }. On a 3070 a short call is about a
   second, so two hundred questions, judged and mended, is a quarter of an hour or so.

   1  QUESTIONS. Half from fixed shapes over Nuage's own words (what is, is a ... a, can ... fly, what happens if, what
      kinds of), half written by the model about those same words, as a curious person would ask them.
   2  ANSWERS. Nuage answers each one, and the answer is sorted by how it came out: answered, asked back (no card),
      unknown (said it could not), elsewhere (known in another world), or parroted (an old ELIZA turn).
   3  JUDGING. Each answered question is judged by the model choosing ONE LETTER (FINDINGS.md: small judges rate too
      politely, so they choose rather than score): A right and useful, B right but thin, C wrong, D not an answer.
   4  CARDS. For each miss (and each C or D), the model writes one card. The card must parse, use only known forms, and
      name concepts in CamelCase; then a fresh Nuage with the card is asked the same question, and must do better; then
      the sample chat must come out word for word as before. Survivors go to patty/proposed.kb with their evidence.
   5  THE LEDGER. patty/sessions/<time>.json keeps every question, answer, verdict and card, and the coverage numbers. */
const fs = require('fs'), path = require('path');
const { wake } = require('../pack/load.js');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; }, flag = (k) => args.includes('--' + k);
const URL_ = opt('url', 'http://localhost:8177'), LLAMA = flag('llama') || /:8178\b/.test(URL_), TALKS = flag('talks'), MIRROR = flag('mirror'), TURNS = Math.max(3, Math.min(7, +opt('turns', 6))), NQ = +opt('n', TALKS ? 10 : 200), MOCK = flag('mock'), TEMPLATES = flag('templates-only') || MOCK;
let seed = +opt('seed', 7); const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648, pick = (v) => v[Math.floor(rnd() * v.length)];
const HERE = __dirname, STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const JOB = opt('job', ''), THEN_STOP = flag('then-stop'), job = { state: 'starting', pid: process.pid, started: STAMP, mode: MIRROR ? 'mirror' : TALKS ? 'talks' : 'questions', n: NQ, asked: 0, kept: 0, counts: {}, model: MOCK ? 'mock' : URL_ };
function report(more) { if (!JOB) return; Object.assign(job, more || {}); try { fs.writeFileSync(JOB, JSON.stringify(job)); } catch (e) {} }
['SIGINT', 'SIGTERM'].forEach((sg) => process.on(sg, () => { report({ state: 'stopped', finished: new Date().toISOString() }); process.exit(130); }));
async function rest() {   // rest the engine when asked: the classic engine room has /shutdown; llama-server is ended by name
  if (!THEN_STOP || MOCK) return;
  if (LLAMA) { try { require('child_process').execSync('taskkill /F /IM llama-server.exe', { stdio: 'ignore' }); } catch (e) {} return; }
  try { await fetch(URL_ + '/shutdown', { method: 'POST' }); } catch (e) {}
}

// ---- the model, through the demo's engine room
let calls = 0, callMs = 0;
async function ask(messages, o) {
  if (MOCK) return mock(messages);
  const t = Date.now();
  const p = Object.assign({ temperature: 0.3, max_new_tokens: 120, sampler_seed: 1234 }, o || {});
  const r = LLAMA   // llama-server speaks the OpenAI dialect; the classic engine room its own
    ? await fetch(URL_ + '/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, temperature: p.temperature, max_tokens: p.max_new_tokens, seed: p.sampler_seed, chat_template_kwargs: { enable_thinking: false } }) })
    : await fetch(URL_ + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ messages }, p)) });
  if (!r.ok) throw new Error('the engine room said ' + r.status);
  const j = await r.json(); calls++; callMs += Date.now() - t;
  return String((LLAMA ? ((j.choices || [])[0] || {}).message && j.choices[0].message.content : j.reply) || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
function mock(messages) {                                  // a stand-in for testing the harness without the GPU
  const u = messages[messages.length - 1].content;
  if (/one to three sentences/.test(messages[0].content || '')) { const w = (u.match(/[a-z]{4,}/gi) || ['that']).pop(); return 'That is a good question about ' + w.toLowerCase() + '. In short, it depends on what you mean, but most people would say yes.'; }
  if (/^Judge/.test(u)) return 'A';
  if (/Name one topic/.test(u)) return ['Volcanoes', 'Penguins', 'The Moon'][(messages.seed || 0) % 3];
  if (/satisfying answer/.test(u)) return 'B - it knew what the thing was, but not much more.';
  if (/next question to Nuage/.test(u)) { const t = (u.match(/Your topic: (.*)/) || [])[1] || 'it', n = (u.match(/\nYou: /g) || []).length; return ['What is ' + t.toLowerCase().replace(/s$/, '') + '?', 'Why?', 'Can it fly?', 'What happens if it is heated?', 'Does it melt when the sun is hot?', 'Tell me more.'][n % 6]; }
  if (/^Complete with/.test(u)) return 'thing';
  if (/^Finish this/.test(u)) return 'a ' + ((u.match(/"an? (.+?) is ___"/) || [])[1] || 'thing') + ' is a thing kept for testing';
  if (/yes or no\.$/.test(u)) return 'No.';
  if (/asked Nuage: /.test(u)) { const t = ((u.match(/curious about (.+?) asked/) || [])[1] || 'Thing').replace(/(^|\s)\w/g, (c) => c.toUpperCase()).replace(/\s/g, ''); return '(why ' + t.replace(/s$/, '') + ' "it was made so, for testing the rings")'; }
  const q = (u.match(/Question: (.*)/) || [])[1] || '';
  let m;
  if ((m = q.match(/^Can an? (\w+) (fly|swim)\?/i))) return '(except ' + m[1][0].toUpperCase() + m[1].slice(1) + ' ' + (m[2] === 'fly' ? 'flies' : 'swims') + ')';
  if ((m = q.match(/^What is an? ([a-z]+)\?/i))) return '(genls ' + m[1][0].toUpperCase() + m[1].slice(1) + ' Thing)';
  return '(nonsense card';
}

// ---- 1 questions
const N0 = wake(), V = N0.vocab().filter((v) => v.w.indexOf(' ') < 0 || v.w.split(' ').length <= 2);
const an = (w) => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
function templated(n) {
  const out = [];
  while (out.length < n) {
    const v = pick(V), other = pick(V), shape = Math.floor(rnd() * 6);
    if (shape === 0) out.push('What is ' + an(v.w) + '?');
    else if (shape === 1) out.push('Is ' + an(v.w) + ' ' + an(v.up[0] && rnd() < 0.5 ? v.up[0] : other.w) + '?');
    else if (shape === 2 && v.thing) out.push('Can ' + an(v.w) + ' ' + pick(v.animal ? ['fly', 'swim', 'walk', 'talk'] : ['fly', 'float', 'break']) + '?');   // only of things that could
    else if (shape === 3 && v.thing) out.push('What happens if ' + an(v.w) + ' is ' + pick(v.animal ? ['hungry', 'cold', 'fed'] : ['dropped', 'heated', 'broken']) + '?');
    else if (shape === 4 && v.kinds >= 2) out.push('What kinds of ' + v.w + ' are there?');
    else if (shape === 5) out.push('Tell me about ' + an(v.w) + '.');
  }
  return out;
}
async function written(n) {
  const out = [];
  while (out.length < n) {
    const words = [0, 1, 2, 3, 4].map(() => pick(V).w);
    const reply = await ask([{ role: 'system', content: 'You write short, plain questions that a curious person might ask. One question per line. No numbering, no answers.' },
      { role: 'user', content: 'Write one short question about each of these: ' + words.join(', ') + '.' }], { temperature: 0.7 });
    reply.split('\n').map((l) => l.replace(/^[\s\d.)*-]+/, '').trim()).filter((l) => /\?$/.test(l) && l.length < 90).forEach((l) => out.length < n && out.push(l));
  }
  return out;
}

// ---- 2 answers, sorted
function sort(reply) {
  if (/^I have no card for|What, then, is|I have heard of/.test(reply)) return 'asked';
  if (/^I do not know|^I cannot answer|^I know of nothing|^Not that I know|^I can only draw/.test(reply)) return 'unknown';
  if (/^I know .* in [A-Z]\w*\. Say/.test(reply)) return 'elsewhere';
  if (/^(Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|How long have you been|Why do you feel|Is that the real reason|Tell me more about your family)/.test(reply)) return 'parrot';
  return 'answered';
}
const MISS = { asked: 1, unknown: 1, parrot: 1 };

// ---- 3 judging, by one letter
async function judge(q, a) {
  const r = await ask([{ role: 'user', content: 'Judge a small program\'s answer.\nQuestion: ' + q + '\nAnswer: ' + a + '\nChoose ONE letter:\nA = correct and useful\nB = correct but says little\nC = wrong\nD = does not answer the question\nReply with the letter only.' }], { temperature: 0.1, max_new_tokens: 4 });
  return (r.match(/[ABCD]/) || ['?'])[0];
}

// ---- 4 cards, proved
const SHOTS = 'Nuage keeps its knowledge as one-line cards in these forms only:\n' +
  '(genls Kettle Container)                        a kettle is a kind of container\n' +
  '(comment Kettle "a pot with a spout, for boiling water")   what a kettle is, in a few words\n' +
  '(default (Fish ?x) => (swims ?x))               fish usually swim\n' +
  '(except Penguin flies)                          penguins do not fly, though birds do\n' +
  '(rule (Liquid ?x) (heated ?x) => (may-boil ?x)) when a liquid is heated, it may boil\n' +
  '(has Bookcase "shelves")                        a bookcase has shelves\n' +
  'Names of kinds are CamelCase. Write ONE card that would let Nuage answer the question well. Reply with the card only.';
function readCard(s) {                                     // the first balanced form in the reply, or null
  const i = s.indexOf('('); if (i < 0) return null;
  let d = 0, j; for (j = i; j < s.length; j++) { if (s[j] === '(') d++; if (s[j] === ')' && --d === 0) break; }
  return d === 0 ? s.slice(i, j + 1).replace(/\s+/g, ' ') : null;
}
const OPS = { genls: /^\(genls [A-Z][A-Za-z]* [A-Z][A-Za-z]*\)$/, comment: /^\(comment [A-Z][A-Za-z]* "[^"]{3,140}"\)$/, has: /^\(has [A-Z][A-Za-z]* "[^"]{2,60}"\)$/,
  except: /^\(except [A-Z][A-Za-z]* [a-z][a-z-]*\)$/, default: /^\(default \([A-Z][A-Za-z]* \?x\) => (\([a-z][a-z-]* \?x\) ?)+\)$/,
  rule: /^\(rule (\([A-Za-z][A-Za-z-]* \?x\) ?)+=> (\([a-z][a-z-]* \?x\) ?)+\)$/,
  prop: /^\(prop [A-Z][A-Za-z]* [a-z]+ "[^"]{3,160}"\)$/, why: /^\(why [A-Z][A-Za-z]* "[^"]{3,200}"\)$/ };
// A small model rarely keeps to the forms when left to write a card freely (on the first run on the 3070, 144 of 147
// free cards were turned away as "not a known form"). So for the common shapes of question it is asked only to fill a
// blank or say yes or no, and the card is written here, in Nuage's own names; a free card is mended where its meaning is
// plain (is-a, isa, "is a kind of", snake_case, a bare pair whose first word is the question's own subject).
const BYW = {}; N0.vocab().forEach((v) => { BYW[v.w] = v.c; });
const termOf = (w) => { w = String(w || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').toLowerCase().replace(/["'.?!:]/g, '').replace(/^(a|an|the) /, '').trim(); return BYW[w] || BYW[w.replace(/s$/, '')] || BYW[w.replace(/es$/, '')] || null; };
const subjectOf = (q) => { const m = q.match(/^(?:What is|Is|Can|Tell me about|What happens if|What kinds of) (?:an? |the )?(.+?)(?: (?:an?|is|are|fly|swim|float|walk|talk|break)\b.*)?[?.]$/i); return m ? termOf(m[1]) : null; };
async function blank(prompt, max) { return (await ask([{ role: 'user', content: prompt }], { temperature: 0.1, max_new_tokens: max || 12 })).split('\n')[0].trim(); }
async function yes(prompt) { return /^\W*yes\b/i.test(await blank(prompt + '\nAnswer yes or no.', 3)); }
const VERB = { fly: 'flies', swim: 'swims', float: 'floats', walk: 'walks', talk: 'talks', break: 'breaks' };
function mend(card, q) {
  if (!card) return null;
  const s = card.replace(/:(?=[A-Za-z])/g, '').replace(/\s+/g, ' '), op = (s.match(/^\((\w+)/) || [])[1];
  if (OPS[op] && OPS[op].test(s)) return s;
  let m, x, y;
  if ((m = s.match(/^\((?:isa|is-a|genls) ([^\s()]+) ([^\s()]+)\)$/i)) || (m = s.match(/^\((.+?) (?:is a kind of|is-kind-of|kind-of|is-a|isa|is an?) (.+)\)$/i)))
    if ((x = termOf(m[1])) && (y = termOf(m[2])) && x !== y) return '(genls ' + x + ' ' + y + ')';
  if ((m = s.match(/^\(([^\s()]+) ([^\s()]+)\)$/)) && (x = termOf(m[1])) && (y = termOf(m[2])) && x !== y && x === subjectOf(q)) return '(genls ' + x + ' ' + y + ')';
  return s;
}
// WORDNET, for the gloss (User1: "even a model could draw from these rich choices"). The word's noun senses from Open
// English WordNet 2025 (__libs/words/wn, fetched from the panel) are set before the model when it writes a gloss, and
// the sense that best fits what Nuage already knows is offered as a card of its own, credited, for your ruling.
const WNDIR = path.join(HERE, '..', '..', '__libs', 'words', 'wn'), FROM_WN = new Set();
function wnSenses(w) {
  const c = w[0].toLowerCase(), f = path.join(WNDIR, (c >= 'a' && c <= 'z' ? c : '_') + '.jsonl');
  if (!fs.existsSync(f)) return [];
  const lw = w.toLowerCase();
  return fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.toLowerCase().includes('"w": "' + lw + '"')).map((l) => JSON.parse(l)).filter((r) => r.w.toLowerCase() === lw && r.pos === 'n').flatMap((r) => r.defs).slice(0, 5);
}
async function propose(q, a) {
  let m, X, Y;
  if ((m = q.match(/^(?:What is|Tell me about) (?:an? )?(.+?)[?.]$/i)) && (X = termOf(m[1]))) {
    const cards = [], up = termOf(await blank('Complete with one or two plain words: "' + an(m[1]) + ' is a kind of ___." Reply with the missing words only.'));
    if (up && up !== X) cards.push('(genls ' + X + ' ' + up + ')');
    const own = new RegExp('^(?:(?:an?|the) )?' + m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's? (?:is|are) ', 'i');   // "a vice is a ..." -> "a ...": the card holds only what follows
    const senses = wnSenses(m[1]), kindOf = (a.match(/is a kind of ([a-z ]+?)[,.]/) || [])[1];
    const d = (await blank((senses.length ? 'A dictionary gives these senses of "' + m[1] + '":\n' + senses.map((x, i) => (i + 1) + '. ' + x).join('\n') + '\n' + (kindOf ? 'The sense wanted is the one that is a kind of ' + kindOf + '.\n' : '') : '') + 'Finish this in under twelve plain words: "' + an(m[1]) + ' is ___". Reply with the words that go in the blank, beginning "a" or "an".', 30)).replace(/["().]/g, '').trim().replace(own, '');
    if (/^an? \w/i.test(d) && d.length <= 90) cards.push('(comment ' + X + ' "' + d.toLowerCase() + '")');
    if (senses.length) {   // WordNet's own words, the sense that shares most with what Nuage says of the thing
      const head = m[1].toLowerCase(), near = (x) => (a.toLowerCase().match(/[a-z]{4,}/g) || []).filter((t) => t !== head && t !== 'kind' && t !== 'thing' && new RegExp('\\b' + t + '\\b').test(x.toLowerCase())).length;
      const best = senses.slice().sort((x, y) => near(y) - near(x))[0].replace(/["();]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
      const wc = '(comment ' + X + ' "' + best + '")'; FROM_WN.add(wc); cards.push(wc);
    }
    return cards;
  }
  if ((m = q.match(/^Is (?:an? )?(.+?) an? (.+?)\?$/i)) && (X = termOf(m[1])) && (Y = termOf(m[2])) && X !== Y)
    return (await yes('Is ' + an(m[1]) + ' a kind of ' + m[2] + '?')) ? ['(genls ' + X + ' ' + Y + ')'] : [];
  if ((m = q.match(/^Can (?:an? )?(.+?) (fly|swim|float|walk|talk|break)\?$/i)) && (X = termOf(m[1]))) {
    const v = VERB[m[2].toLowerCase()];
    return (await yes('Can ' + an(m[1]) + ' ' + m[2] + '?')) ? ['(default (' + X + ' ?x) => (' + v + ' ?x))'] : ['(except ' + X + ' ' + v + ')'];
  }
  const reply = await ask([{ role: 'system', content: SHOTS }, { role: 'user', content: 'Question: ' + q + '\nNuage said: ' + a }], { temperature: 0.2, max_new_tokens: 60 });
  const c = mend(readCard(reply), q); return c ? [c] : [];
}
const sampleText = (N) => N.sample.filter((q) => q[0] !== '#').map((q) => N.chat(q)).join('\n');
const BASE_SAMPLE = sampleText(wake());
function prove(card, q, before) {
  const op = (card.match(/^\((\w+)/) || [])[1];
  if (!OPS[op] || !OPS[op].test(card)) return { ok: false, why: 'not a known form' };
  let N;
  try { N = wake(card); } catch (e) { return { ok: false, why: 'does not read: ' + e.message }; }
  const after = N.chat(q), was = sort(before), now = sort(after);
  if (MISS[now] || after === before) return { ok: false, why: 'the question is no better (' + now + ')', after };
  if (sampleText(wake(card)) !== BASE_SAMPLE) return { ok: false, why: 'it changes the sample chat', after };
  return { ok: true, after, was, now };
}

// ---- CONVERSATIONS (user1's pupils): the model plays a school pupil curious about a topic of its own choosing, talks
// with Nuage for a few turns, then says whether its interest was understood and satisfied. The questions are the
// model's, not ours, so they test Nuage where we would not think to; the ones it missed go to test/candidates.txt for a
// person to give right answers to, and so become scoreboard questions written by someone other than its makers.
const SUBJECTS = ['the night sky', 'animals', 'history', 'geography', 'music', 'cooking', 'machines', 'plants', 'the human body', 'the weather', 'the oceans', 'art', 'sport', 'numbers', 'languages', 'inventions'];   // a different subject for each pupil, so that ten pupils are not ten black holes
async function talks() {
  const rows = [], verdicts = {}, misses = []; let turns = 0, answered = 0;
  for (let i = 0; i < NQ; i++) {
    const s0 = 9001 + 37 * i, tell = (talk) => talk.map((x) => 'You: ' + x.q + '\nNuage: ' + x.a).join('\n');
    const m0 = [{ role: 'user', content: 'You are a school pupil. Your class has been learning about ' + SUBJECTS[i % SUBJECTS.length] + '. Name one topic within it that you are curious about. Reply with the topic only, in one to four words. Name the topic in the subject.' }]; m0.seed = i;
    const topic = (await ask(m0, { temperature: 0.9, max_new_tokens: 12, sampler_seed: s0 })).split('\n')[0].replace(/["*.:]/g, '').trim() || 'animals';
    const N = wake(), talk = [];
    for (let k = 0; k < TURNS; k++) {
      const u = 'You are a school pupil, curious about ' + topic + ', which you heard about at school. You are talking with Nuage, a small chat program that knows simple facts. Ask short, plain questions, one at a time, to see whether it understands your interest and can satisfy it.\nYour topic: ' + topic + '\n' + (talk.length ? 'The conversation so far:\n' + tell(talk) + '\n' : '') + 'Write your next question to Nuage, one short sentence, nothing else.';
      const q = (await ask([{ role: 'user', content: u }], { temperature: 0.6, max_new_tokens: 40, sampler_seed: s0 + k + 1 })).split('\n')[0].replace(/^(pupil|student|you|me|q)\s*:\s*/i, '').replace(/^"|"$/g, '').trim();
      if (!q) break;
      const a = N.chat(q), kind = sort(a); talk.push({ q, a, kind }); turns++;
      const prev = misses.length && misses[misses.length - 1].topic === topic && misses[misses.length - 1].k === k - 1 ? misses[misses.length - 1] : null, sup = supposes(q);
      if (prev && sup) prev.supposed = sup;   // the pupil, not answered, supplies an answer of its own
      if (kind === 'answered') answered++; else misses.push({ topic, q, a, k, before: talk.slice(0, -1).map((x) => x.q) });
    }
    const v = await ask([{ role: 'user', content: 'You asked Nuage about ' + topic + '. The conversation:\n' + tell(talk) + '\nDid Nuage understand your interest and give a satisfying answer? Reply with one letter, A (satisfied), B (partly), or C (not at all), then a dash, then one short sentence saying what was missing.' }], { temperature: 0.1, max_new_tokens: 40, sampler_seed: s0 + 99 });
    const letter = (v.match(/[ABC]/) || ['?'])[0], note = v.replace(/^[^-\u2013\u2014]*[-\u2013\u2014]\s*/, '').split('\n')[0].trim();
    verdicts[letter] = (verdicts[letter] || 0) + 1; rows.push({ topic, talk, verdict: letter, note });
    console.log('  ' + (i + 1) + '. ' + topic + ': ' + letter + (note ? ' - ' + note : '') + '   (' + talk.filter((x) => x.kind === 'answered').length + ' of ' + talk.length + ' turns answered)');
    report({ state: 'running', asked: i + 1, counts: { answered, turns }, verdicts });
  }
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0) + '%', W = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n);
  fs.mkdirSync(path.join(HERE, 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(HERE, 'sessions', 'talks-' + STAMP + '.json'), JSON.stringify({ when: STAMP, model: MOCK ? 'mock' : URL_, turns: TURNS, verdicts, rows }, null, 1));
  const CF = path.join(HERE, '..', 'test', MOCK ? 'candidates.mock.txt' : 'candidates.txt');   // the stand-in model's misses are kept apart
  if (misses.length) fs.appendFileSync(CF, (fs.existsSync(CF) ? '' : '; candidates.txt -- questions Nuage missed in patty-cake\'s conversations, written by a pupil it did not choose. Give one a right answer\n; (question => pattern) and move it into test/score.txt, and it joins the scoreboard.\n') + '; ' + STAMP + '\n' + misses.map((m) => m.q + ' =>   ; ' + m.topic + ' | Nuage said: ' + m.a.replace(/\s+/g, ' ').slice(0, 120)).join('\n') + '\n');
  const ring = await epirings(misses);
  const parts = [['A', 'satisfied'], ['B', 'partly satisfied'], ['C', 'not satisfied']].filter(([k]) => verdicts[k]).map(([k, w]) => w + ' in ' + (verdicts[k] === rows.length ? (rows.length === 2 ? 'both' : 'all ' + W(rows.length)) : W(verdicts[k])));
  const and = (v) => (v.length < 2 ? v.join('') : v.slice(0, -1).join(', ') + (v.length > 2 ? ',' : '') + ' and ' + v[v.length - 1]);
  const summary = (rows.length === 1 ? 'In one conversation, the pupil was ' + ({ A: 'satisfied', B: 'partly satisfied', C: 'not satisfied' }[rows[0].verdict] || 'undecided') : 'Of ' + W(rows.length) + ' conversations, the pupils were ' + (parts.length ? and(parts) : 'silent')) + '. Nuage answered ' + pct(answered, turns) + ' of ' + (rows.length === 1 ? 'its ' : 'their ') + turns + ' questions. ' + (misses.length ? 'It missed ' + W(misses.length) + (misses.length === 1 ? ', which waits' : ', which wait') + ' in test/candidates.txt.' : 'It missed none.') + (ring ? ' ' + cap(W(ring)) + (ring === 1 ? ' card, written for a missed question, is' : ' cards, written for missed questions, are') + ' waiting for your ruling.' : '');
  console.log('\n  ' + summary + '\n  topics: ' + rows.map((r) => r.topic).join(', ') + '\n  the session is in patty/sessions/talks-' + STAMP + '.json');
  report({ state: 'done', finished: new Date().toISOString(), verdicts, counts: { answered, turns }, added: ring, session: 'talks-' + STAMP + '.json', summary });
  await rest();
}
const cap = (t) => t[0].toUpperCase() + t.slice(1);

// ---- THE MIRROR (User1's Mimia): gather the light of the lit model, one plain question and one plain answer at a time,
// into patty/mimia/light.jsonl, for grind.py to grind Mimia's surface against. The questions come first from the
// distilled magazines (__no-copy/__references/__distilled/distilled.txt, read here, never copied into Nuage), then
// the scoreboard, the candidates, the pupils' own questions, and last, plain templates over Nuage's words. For each,
// a fresh Nuage is asked too: when Nuage already answers from its cards, the light says YIELD, so that Mimia learns to
// hand back to the core what the core already knows. Already-gathered questions are skipped, so runs add up.
const DOMS = (() => { try { return Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(HERE, 'mimia', 'domains.json'), 'utf8'))).filter(([k]) => k[0] !== '_').map(([k, v]) => [k, new RegExp(v, 'i')])); } catch (e) { return {}; } })();
async function mirror() {
  const D = path.join(HERE, 'mimia'), LF = opt('light', path.join(D, MOCK ? 'light.mock.jsonl' : 'light.jsonl')); fs.mkdirSync(path.dirname(LF), { recursive: true });
  // ON THE FARM: --part i/n (or FARM_PART and FARM_PARTS from the foreman) takes every n-th question from the i-th, so n
  // machines share one list without overlap; --light names where this machine's answers go (merge them after).
  const [PI, PN] = (opt('part', process.env.FARM_PARTS ? process.env.FARM_PART + '/' + process.env.FARM_PARTS : '0/1')).split('/').map(Number);
  const rd = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
  const model = MOCK ? 'mock' : (job.model || URL_);
  const have = new Set(rd(LF).split('\n').filter(Boolean).map((l) => { try { const r = JSON.parse(l); return r.model + '\u0001' + r.q; } catch (e) { return ''; } }));
  const qs = [], seenQ = new Set(), add = (q, src) => { q = String(q || '').replace(/\s+/g, ' ').trim(); if (q.length < 4 || q.length > 220 || seenQ.has(q.toLowerCase())) return; seenQ.add(q.toLowerCase()); qs.push({ q, src }); };
  rd(path.join(HERE, '..', '__no-copy', '__references', '__distilled', 'distilled.txt')).split('\n').forEach((l) => { if (l && !/^[;#]/.test(l)) add(l.replace(/(\s+\[S\d+\])+\s*$/, ''), 'magazines'); });
  rd(path.join(HERE, '..', 'test', 'score.txt')).split('\n').forEach((l) => { if (l.trim() && l[0] !== '#') add(l.split(/\s*=>/)[0], 'scoreboard'); });
  rd(path.join(HERE, '..', 'test', 'candidates.txt')).split('\n').forEach((l) => { if (l.trim() && l[0] !== ';') add(l.split(/\s*=>/)[0], 'candidates'); });
  if (fs.existsSync(path.join(HERE, 'sessions'))) fs.readdirSync(path.join(HERE, 'sessions')).filter((f) => /^talks-/.test(f)).forEach((f) => { try { JSON.parse(rd(path.join(HERE, 'sessions', f))).rows.forEach((r) => r.talk.forEach((x) => add(x.q, 'pupils'))); } catch (e) {} });
  const T = ['What is %a?', 'Tell me about %p.', 'Can %a fly?', 'Where do %p live?', 'What is %a made of?', 'Why are %p useful?', 'What does %a do?', 'Is %a alive?'];
  for (let i = 0; qs.length < NQ + have.size + 50 && i < 40 * V.length; i++) { const v = pick(V); add(pick(T).replace('%a', an(v.w)).replace('%p', v.w.replace(/([^s])$/, '$1s')), 'templates'); }
  const bySrc = {}; qs.filter((x, i) => i % PN === PI).filter((x) => !have.has(model + '\u0001' + x.q)).forEach((x) => (bySrc[x.src] = bySrc[x.src] || []).push(x));
  const todo = []; for (let k = 0; todo.length < NQ && Object.values(bySrc).some((v) => k < v.length); k++) Object.values(bySrc).forEach((v) => { if (k < v.length && todo.length < NQ) todo.push(v[k]); });   // a little of every source, turn and turn about
  console.log('  the mirror' + (PN > 1 ? ' (part ' + PI + ' of ' + PN + ')' : '') + ': ' + qs.length + ' questions in all, ' + have.size + ' already in the light, ' + todo.length + ' to ask ' + model);
  let n = 0, yielded = 0, next = 0;
  // llama-server keeps four slots (-np 4), so four questions are in flight at once: the card's spare memory, spent on
  // speed. The classic engine room answers one at a time.
  const one = async () => {
    while (next < todo.length) {
      const x = todo[next++];
      const a = await ask([{ role: 'system', content: 'Answer plainly and briefly, in one to three sentences.' }, { role: 'user', content: x.q }], { temperature: 0.2, max_new_tokens: 100, sampler_seed: 1234 });
      const kind = sort(wake().chat(x.q)), yl = kind === 'answered';
      const dom = Object.entries(DOMS).find(([k, rx]) => rx.test(x.q) || new Set((String(a).match(new RegExp(rx.source, 'gi')) || []).map((m) => m.toLowerCase())).size >= 3);   // the tappable domain it belongs to, if any
      fs.appendFileSync(LF, JSON.stringify({ q: x.q, a, model, yield: yl, nuage: kind, src: x.src, when: STAMP, domain: dom ? dom[0] : 'general' }) + '\n');
      n++; if (yl) yielded++;
      if (n % 10 === 0 || n === todo.length) report({ state: 'running', asked: n, kept: yielded });
      if (n % 100 === 0) console.log('  ' + n + ' of ' + todo.length + ' in the light');
    }
  };
  await Promise.all(Array.from({ length: LLAMA ? 4 : 1 }, one));
  const total = rd(LF).split('\n').filter(Boolean).length;
  const summary = 'The mirror gathered ' + n + ' answers from ' + model + ' (Nuage already answers ' + yielded + ' of those, so they teach Mimia to yield). The light now holds ' + total + '. Press "Grind Mimia" to grind her against it.';
  console.log('\n  ' + summary);
  report({ state: 'done', finished: new Date().toISOString(), counts: { asked: n, yielded }, added: 0, summary });
  await rest();
}

// ---- EPIRINGS (User1's word): rings that turn about the spine of the talk and feed it forward. When Nuage cannot answer
// a pupil, the pupil often supplies an answer of its own in its next question ("Do clouds form when the warm air rises
// and gets cold?"). The first ring listens: that supposition is kept, in plain words, with no model at all. The second
// ring asks the lit engine, as teacher, for one card that would let Nuage answer, with the supposition beside it. Each
// card is proved as the others are (it reads, it changes the answer, the sample chat stays word for word), then waits
// in patty/proposed.kb for a person's ruling. Nothing a pupil says enters the cloud unruled.
const supposes = (q) => N0.supposes(q);   // the engine's own listening ring, so the page and the harness hear alike
const TEACH = SHOTS.replace('Names of kinds', '(prop Milk soothes "the heat of chili, since its fat carries the capsaicin away")   a fact about milk, by name\n' +
  '(why Sky "sunlight is scattered by the air, and blue light most of all")   why the sky is blue\n' +
  'Write plain sentences: capitals, commas, and periods, no semicolons. Names of kinds');
async function epirings(misses) {
  if (!misses.length) return 0;
  const seen = new Set([path.join(HERE, 'proposed.kb'), path.join(HERE, 'dropped.kb'), path.join(HERE, '..', 'kb', 'taught.kb')].filter((f) => fs.existsSync(f)).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l[0] === '(')));
  const one = (t) => String(t).replace(/\s*\n\s*/g, ' / '), add = [];
  for (const x of misses) {
    const reply = await ask([{ role: 'system', content: TEACH }, { role: 'user', content: 'A pupil curious about ' + x.topic + ' asked Nuage: ' + x.q + '\nNuage said: ' + x.a + (x.supposed ? '\nThe pupil then supposed: ' + x.supposed : '') }], { temperature: 0.2, max_new_tokens: 90 });
    const card = mend(readCard(reply), x.q); if (!card || seen.has(card)) continue;
    const op = (card.match(/^\((\w+)/) || [])[1]; if (!OPS[op] || !OPS[op].test(card)) continue;
    let after; try { const W1 = wake(card); (x.before || []).forEach((b) => W1.chat(b)); after = W1.chat(x.q); } catch (e) { continue; }   // asked again in its place in the talk, so "it" still means what it meant
    if (after === x.a || sampleText(wake(card)) !== BASE_SAMPLE) continue;   // it must change the answer, and nothing else
    seen.add(card);
    add.push('; ' + STAMP + ' | epiring | ' + x.topic + ' | a pupil asked: ' + x.q + (x.supposed ? '\n;   the pupil supposed: ' + x.supposed : '') + '\n;   before: ' + one(x.a) + '\n;   after: ' + one(after) + '\n' + card);
  }
  if (add.length) fs.appendFileSync(path.join(HERE, 'proposed.kb'), add.join('\n') + '\n');
  console.log('  epirings: ' + add.length + ' card(s) for ' + misses.length + ' missed question(s), waiting in patty/proposed.kb');
  return add.length;
}

(async () => {
  console.log('patty-cake: ' + (MOCK ? 'mock model' : URL_) + ', ' + NQ + ' questions over ' + V.length + ' of Nuage\'s words');
  if (!MOCK) { try { const h = LLAMA ? { model: ((await (await fetch(URL_ + '/v1/models')).json()).data || [{}])[0].id, device: 'llama.cpp' } : await (await fetch(URL_ + '/health')).json(); console.log('  the engine room: ' + h.model + ' on ' + h.device); job.model = h.model; } catch (e) { console.log('  the engine room is not answering at ' + URL_ + ' (start __demo/server.py, or use --mock)'); process.exit(1); } }
  if (MIRROR) { report({ state: 'running', asked: 0 }); return mirror(); }
  if (TALKS) { report({ state: 'running', asked: 0 }); return talks(); }
  report({ state: 'writing questions' });
  const qs = templated(TEMPLATES ? NQ : Math.ceil(NQ / 2)).concat(TEMPLATES ? [] : await written(Math.floor(NQ / 2)));
  const rows = [], counts = {}, verdicts = {}, kept = [];
  for (const [i, q] of qs.entries()) {
    const N = wake(), a = N.chat(q), kind = sort(a), row = { q, a, kind };
    counts[kind] = (counts[kind] || 0) + 1;
    if (kind === 'answered') { row.verdict = await judge(q, a); verdicts[row.verdict] = (verdicts[row.verdict] || 0) + 1; }
    if (MISS[kind] || row.verdict === 'C' || row.verdict === 'D') {
      row.cards = (await propose(q, a)).map((card) => ({ card, proof: prove(card, q, a) }));
      const ok = row.cards.filter((x) => x.proof.ok), first = ok[0] || row.cards[0];
      if (first) { row.card = first.card; row.proof = first.proof; }
      ok.forEach((x) => kept.push({ q, a, card: x.card, proof: x.proof }));
    }
    rows.push(row); report({ state: 'running', asked: i + 1, kept: kept.length, counts });
    if (flag('slow')) await new Promise((r) => setTimeout(r, 150));   // for testing the page's panel: slow enough to watch, and to cancel
    if ((i + 1) % 20 === 0) process.stdout.write('  ' + (i + 1) + ' asked, ' + kept.length + ' cards kept\n');
  }
  // the coverage, and the survivors
  const pct = (k) => Math.round(100 * (counts[k] || 0) / rows.length) + '%';
  console.log('\n  answered ' + pct('answered') + ', asked back ' + pct('asked') + ', unknown ' + pct('unknown') + ', elsewhere ' + pct('elsewhere') + ', parroted ' + pct('parrot'));
  console.log('  verdicts on the answered: ' + ['A', 'B', 'C', 'D', '?'].map((v) => v + ' ' + (verdicts[v] || 0)).join('   '));
  console.log('  cards proposed ' + rows.reduce((t, r) => t + (r.cards ? r.cards.length : 0), 0) + ', proved and kept ' + kept.length + (calls ? '   (' + calls + ' model calls, ' + Math.round(callMs / calls) + ' ms each)' : ''));
  fs.mkdirSync(path.join(HERE, 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(HERE, 'sessions', STAMP + '.json'), JSON.stringify({ when: STAMP, model: MOCK ? 'mock' : URL_, counts, verdicts, rows }, null, 1));
  const seen = new Set([path.join(HERE, 'proposed.kb'), path.join(HERE, 'dropped.kb'), path.join(HERE, '..', 'kb', 'taught.kb')].filter((f) => fs.existsSync(f)).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l[0] === '(')));   // never propose again what is waiting, dropped, or kept
  const one = (t) => String(t).replace(/\s*\n\s*/g, ' / ');   // one comment line, however many lines the answer had
  const add = kept.filter((r) => !seen.has(r.card) && (seen.add(r.card), true)).map((r) => '; ' + STAMP + ' | ' + r.q + '\n;   before (' + r.proof.was + '): ' + one(r.a) + '\n;   after: ' + one(r.proof.after) + (FROM_WN.has(r.card) ? '\n;   from Open English WordNet 2025 (CC BY 4.0, en-word.net)' : '') + '\n' + r.card);   // whole, never cut: you rule on what was said
  if (add.length) fs.appendFileSync(path.join(HERE, 'proposed.kb'), add.join('\n') + '\n');
  console.log('  ' + add.length + ' new card(s) in patty/proposed.kb; the session is in patty/sessions/' + STAMP + '.json. Rule on them with: node patty/review.js');
  report({ state: 'done', finished: new Date().toISOString(), counts, verdicts, added: add.length, session: STAMP + '.json',
    summary: 'Of ' + rows.length + ' questions, Nuage answered ' + pct('answered') + ', asked back ' + pct('asked') + ', could not answer ' + pct('unknown') + ', and parroted ' + pct('parrot') + '. ' + (add.length ? ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][add.length] || add.length : 'No') + (add.length === 1 ? ' new card is' : ' new cards are') + ' waiting.' });
  await rest();
})().catch(async (e) => { console.error('patty-cake stopped: ' + e.message + (process.env.PATTY_DEBUG ? '\n' + e.stack : '')); report({ state: 'error', error: e.message, finished: new Date().toISOString() }); await rest(); process.exit(1); });
