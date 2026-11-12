/* ui.js -- the conversation's own interface, spawned by the payload once it wakes (user1: "applications that spawn their
   own UI ... makes frontend intimate with the code"). The page itself holds only the title, the bar, and the status line;
   everything you touch after that is built here. It runs as the body of an async function, given C: the woken engine (N),
   the unpacker, the header, the status line, the start time, and $. */
const { N, unpack, H, lab, t0, $ } = C;
{ const ab = document.querySelector('#about > div'), ai = document.querySelector('#ai > div'); if (ab) ab.innerHTML = __ABOUT__; if (ai) ai.innerHTML = __ANALYSIS__; const lx = document.querySelector('#lx > div'); if (lx) lx.innerHTML = __LEXICON__;
  // FOUR TABS AND AN X (User1, 12 xi 2026). The About box had two buttons in its bar, Lexicon and (AI analysis), which opened
  // boxes over it; the first took the focus, so on opening About one seemed to be "in Lexicon". Now the bar is four tabs,
  // [ About ] [ Milestones ] [ Lexicon ] [ AI Analysis ], the chosen one shown as chosen, and an [ X ] at the upper right.
  // The Milestones are cut out of the About text at their own heading; the other two bring their pages in from their boxes.
  const box = document.getElementById('about'), bar = box && box.querySelector('header');
  if (ab && bar) {
    const pane = (id) => { const s = document.createElement('section'); s.id = 'ab-' + id; s.hidden = true; ab.appendChild(s); return s; };
    const kids = Array.prototype.slice.call(ab.childNodes), ms = ab.querySelector('#ms'), cr = kids.filter((n) => n.nodeName === 'H3' && /Credits/.test(n.textContent))[0];
    const pa = pane('about'), pm = pane('ms'), pl = pane('lx'), pi = pane('ai'); let to = pa;
    kids.forEach((n) => { if (n === ms) to = pm; else if (n === cr) to = pa; to.appendChild(n); });
    if (lx) while (lx.firstChild) pl.appendChild(lx.firstChild); if (ai) while (ai.firstChild) pi.appendChild(ai.firstChild);
    const tabs = [['about', 'About', pa], ['ms', 'Milestones', pm], ['lx', 'Lexicon', pl], ['ai', 'AI Analysis', pi]].filter((t) => t[2].textContent.trim());
    ['lx-o', 'ai-o'].forEach((id) => { const b = document.getElementById(id); if (b) b.remove(); });
    const x = document.getElementById('ab-x'); x.textContent = 'X'; x.setAttribute('aria-label', 'Close'); x.title = 'Close';
    const show = (id) => tabs.forEach((t) => { t[2].hidden = t[0] !== id; t[3].setAttribute('aria-pressed', String(t[0] === id)); t[3].setAttribute('aria-selected', String(t[0] === id)); });
    const row = document.createElement('span'); row.id = 'ab-tabs'; row.setAttribute('role', 'tablist');
    tabs.forEach((t) => { const b = document.createElement('button'); b.textContent = t[1]; b.setAttribute('role', 'tab'); b.onclick = () => { show(t[0]); box.scrollTop = 0; }; t.push(b); row.appendChild(b); });
    bar.insertBefore(row, x); show('about');
    document.getElementById('nm').addEventListener('click', () => show('about'));   // opened by her name, it opens on About
  } }   // the About box unfolds from its thatch: the full text rides compressed (src/about.html)
// the conversation's own styles ride in the payload, compressed: the page's head keeps only what must show before waking (the bar, the title, the About box)
document.head.insertAdjacentHTML('beforeend', '<style>' + '#o .qt{cursor:pointer;text-decoration:underline dotted;text-underline-offset:.2em}#o .qt:hover{color:var(--ink)}#o div{margin:0 0 .6rem;white-space:pre-wrap}#o .u{color:var(--user)}#o .u:before{content:"You: "}#o .pu:before{content:"Pupil: "}#o .n{color:#e6e9ec}[data-theme=day] #o .n{color:var(--ink)}#o .n:before{content:"Nuage: ";background:linear-gradient(90deg,var(--head),var(--user));-webkit-background-clip:text;background-clip:text;color:transparent}#o .n.canon:before{content:"Canon: "}#o .m{color:var(--dim)}#o .h{color:var(--head);margin:1.2rem 0 .6rem;border-top:1px solid var(--line);padding-top:.6rem}#f,#t{display:flex;flex-wrap:wrap;gap:.3rem;margin:.6rem 0}#vr{display:inline-flex;align-items:center;gap:0}#vr .lbl{color:var(--desc);margin:0 .3rem 0 2px}#vr button+button{margin-left:0}#f{margin:.4rem 0 1px}#f button{margin-bottom:0}#f #i{margin-bottom:0}#i{flex:1 1 14rem;background:var(--btn);border:1px solid var(--btnline);color:var(--user);font:inherit;padding:.3rem .6rem}#i::placeholder{color:var(--dim);opacity:1}#i::placeholder{color:var(--dim)}::highlight(nu-thing){color:#9cc7dd;text-decoration:underline solid var(--under)}[data-theme=dusk] ::highlight(nu-thing){color:#a9d3ea}[data-theme=day] ::highlight(nu-thing){color:#1d5878}#o{position:relative}#rings{position:absolute;left:0;top:0;width:0;height:0}#hd #nm{border:2px solid transparent;border-radius:5px;margin:-1px -3px;padding:1px 3px;box-sizing:border-box}#hd #nm:hover{border-color:var(--head)}#hd:has(#nm:hover) #sq,#hd:has(#nm:hover) #lg{box-shadow:0 0 0 2px var(--head)}#gd{width:min(80rem,96vw);height:92vh;max-height:92vh;display:flex;flex-direction:column}#gd:not([open]){display:none}#gd iframe{flex:1;border:0;width:100%;background:#0b0d10}#rings i{position:absolute;box-sizing:border-box;border:1px solid var(--ring);border-radius:5px;pointer-events:none}#o .p{line-height:1.05;white-space:pre}#o .p:before{content:"Nuage:\\A";white-space:pre;color:var(--dim);line-height:1.5}[data-theme=day] #o .p{background:#0b0d10;color:#d8d0c0;padding:.3rem .6rem .5rem;display:inline-block;border-radius:4px}#o .r{margin:.4rem 0 .15rem;letter-spacing:.1em}#o .w{white-space:pre;line-height:1.05;margin:.4rem 0 .15rem}#g{display:flex;flex-wrap:wrap;gap:1.2rem;margin:.2rem 0 .6rem;color:var(--dim)}#g input{vertical-align:middle;width:10rem;accent-color:var(--bar2)}[data-wb-tri]{font:1rem/1.5 ui-monospace,Consolas,monospace!important;left:calc(-2.3rem - var(--col,0px))!important;color:var(--user)!important;border-color:var(--line)!important;border-radius:999px!important;padding:0 .45em!important;opacity:.76;background:var(--field)!important}[data-wb-tri]:hover{border-color:var(--dim)!important;opacity:1}#opt{margin:.2rem 0 .4rem}#gist-b{all:unset;cursor:pointer;color:var(--dim);border-bottom:1px dotted var(--dim)}#gist-b:focus-visible{outline:2px solid var(--focus)}#gist{color:var(--dim);margin:-.4rem 0 .8rem;max-height:30vh;overflow-y:auto;border-left:1px solid var(--line);padding-left:.8rem}#gist b{font-weight:normal;color:var(--ink)}#opt[open]>summary{color:var(--head)}' + '</style>');
// at the right of the title: the themes, and the type size, both remembered
document.getElementById('hd').insertAdjacentHTML('beforeend', '<button id=gal title="The Noctilucents: the gallery of words drawn as their sounds">\u224b Noctilucents</button><span class=nbc><button data-th=night aria-pressed=false>\u263e Night</button><button data-th=dusk aria-pressed=false>\u25d0 Dusk</button><button data-th=day aria-pressed=false>\u2600 Day</button></span>' +
  '<span class=nbc><span id=fs-l>Font size:</span><button id=fs-dn aria-label="Smaller type">\u2212</button><button id=fs-up aria-label="Larger type">+</button></span>' +
  '<span class=nbc><span id=cz-l>Chat:</span><button id=cz-dn aria-label="Smaller chat">\u2212</button><button id=cz-up aria-label="Larger chat">+</button></span>');   // NBC, a non-breaking control (User1): [ Label: [btn] [btn] ] is one thing and wraps as one
document.getElementById('o').insertAdjacentHTML('afterend',
  '<div id=f><input id=i aria-label="Ask Nuage a question" placeholder="Your question:"><button id=send>Send</button><button id=s title="The sample chat: see it, play it, make it your own">Script\u2026</button></div>' +
  '<details id=opt><summary>Options<span id=opt-note></span></summary><div id=t><button id=tilt aria-pressed=false>Tilt</button><button id=wyrd aria-pressed=false>Wyrd</button><button id=rail aria-pressed=false>Railyard</button><button id=sand aria-pressed=false title="Sandeko: the enclosure diagram, a circle about each sentence and each clause, over the whole talk and the line you are typing">Sandeko</button>' +
  '<button id=links aria-pressed=true>Links</button><button id=hue>Colour: off</button><button id=talk>Say aloud</button><span id=vr><span class=nbc><span class=lbl>Voice:</span> <button id=voice6 aria-pressed=true title="Arthur for the officials and the justs, Nuage for the rest, Miria for Mimia">Cast</button></span><button id=voice aria-pressed=false>Ecouter</button><button id=voice5 aria-pressed=false>Arthur</button><button id=voice3 aria-pressed=false>Nuage</button><button id=voice4 aria-pressed=false>Miria</button><button id=voice7 aria-pressed=false title="Marlon Blando: the human, as a jest, voiced as a computer">Blando</button><button id=voice2 aria-pressed=false>Machine</button></span><span class=nbc><span class=lbl>Fleuriant:</span> <button id=fl-lg aria-pressed=true title="The large Fleuriant stands at the upper right of the talk while the voice speaks, as well as the small one beside the strip">Large</button><button id=fl-sm aria-pressed=false title="Only the small Fleuriant, beside the strip of the voice">Small only</button></span><button id=forget>Forget</button></div>' +
  '<div id=g hidden><label>Vivid <input id=vv type=range min=0 max=1.5 step=0.05></label><label>Light <input id=ll type=range min=0.6 max=1.4 step=0.05></label></div></details>');
// the luggage: Ecouter and Wallbreaker ride deflated in their own block, and are inflated only when first wanted
// MORE LOADERS (User1): when a block is unpacked later, luggage or a shelf, a new front drifts into the bar and into her
// mark, a pixel apart from the last, as wide as its bytes against the payload's, and fills as it comes. Design, and true.
const stage = (name, zn) => { const w = Math.max(0.3, (H.w[0] || 1) * zn / (H.zn || 1)), b = document.createElement('i'), l = document.createElement('i');
  b.innerHTML = '<u role=progressbar aria-label="' + name + '" aria-valuemin=0 aria-valuemax=100 aria-valuenow=0><b></b></u><span>' + name + '</span>'; l.innerHTML = '<b></b>'; b.style.flexGrow = l.style.flexGrow = 0; $('b').appendChild(b); $('lg').appendChild(l);
  requestAnimationFrame(() => { b.style.flexGrow = l.style.flexGrow = w; });
  return (f) => { const p = (100 * Math.min(1, f)).toFixed(2) + '%'; b.querySelector('b').style.width = p; l.style.setProperty('--p', p); b.firstChild.setAttribute('aria-valuenow', Math.round(parseFloat(p))); }; };
let libs = null;
const luggage = async () => libs || (libs = JSON.parse((await (async () => { const st = stage('Luggage', H.lz); const t = await unpack('y', H.ln, (got) => st(got / H.ln), H.lz, H.la); st(1); return t; })()) || '{}'));
// copying out of the conversation gives Windows line breaks, so a pasted picture keeps its rows in any editor
document.addEventListener('copy', (e) => {   // copied out: Windows line breaks, and a blank line above each of your lines, so the asker stands apart from the answer
  const sel = window.getSelection(); if (!sel.rangeCount || !o.contains(sel.anchorNode)) return; const r = sel.getRangeAt(0);
  // what a line says, not how it is painted: a coloured reply is many little spans, and a range read across them loses
  // its spaces ("pocket.Ask"), so a line wholly selected gives its own words. A teardown gives its card as text, and a
  // drawing gives one line naming it, never the numbers of its picture. (User1's report, 3 xi 2026)
  const parts = [...o.children].filter((d) => d.id !== 'rings' && r.intersectsNode(d)).map((d) => { const sub = document.createRange(); sub.selectNodeContents(d);
    const whole = r.compareBoundaryPoints(Range.START_TO_START, sub) <= 0 && r.compareBoundaryPoints(Range.END_TO_END, sub) >= 0;
    if (d.classList.contains('pk-fig') || d.classList.contains('nfig') || (d.querySelector('svg') && !d.dataset.t)) return d.dataset.w ? '[the sound of ' + d.dataset.w + ', drawn]' : '[a drawing]';
    if (d.dataset.t && (whole || d.classList.contains('td'))) return (d.classList.contains('u') ? '\n' : '') + d.dataset.t;
    if (r.compareBoundaryPoints(Range.START_TO_START, sub) > 0) sub.setStart(r.startContainer, r.startOffset); if (r.compareBoundaryPoints(Range.END_TO_END, sub) < 0) sub.setEnd(r.endContainer, r.endOffset);
    return (d.classList.contains('u') ? '\n' : '') + sub.toString(); }).filter((x) => x.trim());
  if (!parts.length) return;
  e.clipboardData.setData('text/plain', parts.join('\n').replace(/^\n+/, '').replace(/\r?\n/g, '\r\n')); e.preventDefault();
});

// THE VOICE IN A WORKER (User1: the wall stuttered while the brigade built the next sentence). Ecouter needs no page, so
// a second copy of it runs in a Worker and builds the sound there; the page keeps the frames, which are cheap, and the
// drawing never waits. If a Worker cannot be made, the sound is built here, as before.
// THE VOICES (User1, 4 xi 2026): all are operations upon Ecouter. His frames lie flat; hers take the yinyang arc across
// each phonal unit (a sentence, or the span given): she begins slower and ends faster, begins lower in tone and ends
// higher, the black swell at the left and the white at the right, balanced, with a dot of accumulation in each swell;
// she is complete in 86 percent of his time; and her voice is lifted, equifeminely, by the tract and the pitch together.
// Miria is all of that, nearly crackingly too much: tighter, higher, clearer, the mirror too clear. Arthur is the inverse
// of all she does, reservedly, out of respect: a Manner of Ecouter, where she and Miria are Graces of it. The same code sings
// in the page and in the worker, so it is kept as one string, VOICE_SRC, and both read it.
const VOICE_SRC = String.raw`
var VOICES = {
  nuage: { time: 0.86, rateArc: 0.22, pitch: 1.5, pitchArc: 0.07, dot: 0.025, tract: 1.13, breath: 1, hiss: 1 },
  miria: { time: 0.78, rateArc: 0.36, pitch: 1.72, pitchArc: 0.13, dot: 0.05, tract: 1.19, breath: 0.35, hiss: 1.25 },
  blando: { time: 1.12, rateArc: 0, pitch: 0.87, pitchArc: 0, dot: 0, tract: 0.97, breath: 0.45, hiss: 1.1, flat: 0.72, even: 0.45 },   // plussed up (User1): more iron, less lead: a little more tone and time left in, the tract let out a touch, drier, crisper   // Marlon Blando: the human, as a jest, voiced as a computer. Most of the tone and most of the time taken out, and only most (User1: Hal in the memory room, slowing)
  arthur: { time: 1 / 1.08, rateArc: -0.08, pitch: 1.0595, pitchArc: -0.03, dot: -0.01, tract: 0.95, breath: 1.15, hiss: 0.9 }   // begins faster and ends slower, begins higher and ends lower; a full key up, with the tract let out so the raised note keeps its lower resonance and follows the ladies; at 108 percent of his pace, for he would not plod: he pushes himself, and that manner supports
};
function arcFrames(fr, V) {   // the yinyang over the span: u runs 0 to 1 across the frames' time
  if (!V) return fr;
  var sum = 0, i, out = [], acc = 0, raw = 0; for (i = 0; i < fr.length; i++) sum += fr[i].ms;
  var dots = function (u) { return V.dot * (Math.exp(-Math.pow((u - 0.75) / 0.09, 2)) - Math.exp(-Math.pow((u - 0.25) / 0.09, 2))); };   // a dot of accumulation in each swell
  var TAIL = V.tail === undefined ? 0.3 : V.tail, REST = V.rest === undefined ? -0.6 : V.rest;   // rest: where the swell settles at the end, a little below level, the cadence of a sentence that is done   // THE RECALM (User1): the arc rises to the end and must level out: over the last part of the span the swell returns to level, and the pace eases, a kerb cut back to steady flight; a gentleman's terminating offering
  for (i = 0; i < fr.length; i++) { var f = fr[i], u = sum ? (acc + f.ms / 2) / sum : 0.5, late = TAIL && u > 1 - TAIL ? (u - (1 - TAIL)) / TAIL : 0, ease = late * late * (3 - 2 * late), swell = (-Math.cos(Math.PI * u) + (V.dot ? dots(u) / Math.abs(V.dot) * 0.5 : 0)) * (1 - ease) + REST * ease; acc += f.ms;
    var g = {}; for (var k in f) g[k] = f[k];
    g.ms = f.ms * (1 - V.rateArc * swell) * (1 + 0.2 * late * late); raw += g.ms;   // slower at the start, faster at the end, and easing at the last
    if (f.f0) g.f0 = f.f0 * V.pitch * (1 + V.pitchArc * swell + dots(u));   // lower at the start, higher at the end, and lifted
    if (f.f) g.f = f.f.map(function (hz) { return hz * V.tract; });   // the smaller tract
    if (f.at) g.at = [f.at[0] * V.tract, f.at[1] * V.tract];
    if (f.breath) g.breath = f.breath * V.breath; if (f.hiss) g.hiss = Math.min(1, f.hiss * V.hiss);
    out.push(g); }
  if (V.flat || V.even) {   // flatness: pitch drawn toward its mean, and each frame's length toward the even, by so much
    var n0 = 0, f0m = 0, msm = 0; for (i = 0; i < out.length; i++) { msm += out[i].ms; if (out[i].f0 && out[i].voice > 0.2) { f0m += out[i].f0; n0++; } } f0m = n0 ? f0m / n0 : 0; msm = out.length ? msm / out.length : 0;
    for (i = 0; i < out.length; i++) { if (V.flat && out[i].f0 && f0m) out[i].f0 = out[i].f0 + (f0m - out[i].f0) * V.flat; if (V.even) out[i].ms = out[i].ms + (msm - out[i].ms) * V.even; } raw = 0; for (i = 0; i < out.length; i++) raw += out[i].ms; }
  var k2 = raw ? sum * V.time / raw : 1; for (i = 0; i < out.length; i++) out[i].ms = out[i].ms * k2;   // complete in her share of his time
  return out;
}
function sayFrames(E, fr) { var C = E.CHAIN, s = C.settings(C.PRESETS[C.HOUSE_NAME]); s.frames = fr; return C.make(s).pcm; }
`;
(0, eval)(VOICE_SRC);
// THE CAST (User1): with the radio on Cast, the voice is chosen at the moment of speaking. Arthur reads the officials
// (help, the headings, the loading notes, "As I said," "I cannot answer") and the justs and so-s (a reply of a few words);
// Nuage reads the rest of hers; Miria reads Mimia. A name on the radio overrides the cast.
const OFFICIAL = /^(I know [\d,]+ facts|As I said|I cannot answer|I have no card|I do not know|I did not follow|I am listening|\[|By this machine|I have no window)/;   // her hello, her name, and her makers are hers to say (User1: Arthur is for public speaking)
const castOf = (text, who) => who === 'you' ? 'blando' : who === 'mimia' ? 'miria' : who === 'h' || who === 'm' || OFFICIAL.test(text) || (text.split(/\s+/).length <= 4) ? 'arthur' : 'nuage';
let cast = 'nuage';   // the voice this utterance goes in, when the radio is on Cast
const voiceOf = () => voice === 'cast' ? cast : voice;
// THE EPAULETTE (User1): "nuage" is pronounced nuajj. The rules read it new-idge, and have no French j at all, so the sound
// is given the respelling nuwudge, which they read nUWwAHdj, the nearest they can say that the ear accepts. The respelling is for the sound only;
// the words shown and the chunks named stay as written.
const SAYABLE = [[/\bNuage'?s?\b/g, (m) => m.replace(/Nuage/, 'nuwudge')], [/\bnuage\b/g, 'nuwudge']];   // nUWwAHdj, as the teardown box said it and the ear approved (User1, 5 xi 2026): the oo, the w, the uh, and the dj with its stop in front, which gives it the body
const sayable = (t) => SAYABLE.reduce((x, [re, to]) => x.replace(re, to), t);
const voiceFrames = (E, text) => arcFrames(E.frames(sayable(text)), VOICES[voiceOf()]);   // the frames of the voice chosen: his, or hers by the arc
let vw = null, vwN = 0; const vwQ = {};
const sayIn = async (text) => {
  if (vw === false) return null;
  if (!vw) { try { const L = await luggage(); if (!L.ecouter || !window.Worker) throw new Error('no worker'); const url = URL.createObjectURL(new Blob([L.ecouter, '\n', VOICE_SRC, '\nonmessage = function (e) { var p = sayFrames(ECOUTER, arcFrames(ECOUTER.frames(e.data.text), VOICES[e.data.voice])); postMessage({ id: e.data.id, pcm: p }, [p.buffer]); };'], { type: 'text/javascript' })); vw = new Worker(url); vw.onmessage = (e) => { const r = vwQ[e.data.id]; if (r) { delete vwQ[e.data.id]; r(e.data.pcm); } }; vw.onerror = () => { Object.keys(vwQ).forEach((k) => { vwQ[k](null); delete vwQ[k]; }); vw = false; }; } catch (e) { vw = false; return null; } }
  return new Promise((r) => { const id = ++vwN; vwQ[id] = r; vw.postMessage({ id, text: sayable(text), voice: voiceOf() }); });
};
const ec = async () => { if (!window.ECOUTER) { const L = await luggage(); if (L.ecouter) { try { (0, eval)(L.ecouter); } catch (e) {} } } return window.ECOUTER; };
const wbk = async () => { if (!window.__wallbreaker) { const L = await luggage(); if (L.wallbreaker) (0, eval)(L.wallbreaker); } return window.__wallbreaker; };

// memory: what you taught me, kept in this browser, given back on waking (and forgotten on request)
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };
// THE LEFT COLUMN (User1): the options, the workshop panel, and the credits leave the foot of the talk for a column of
// their own; the divider beside it drags to widen and clicks to close or open, and remembers both. The panel's note
// and the app's state go to the statusbar at the foot.
{ const lc = $('lc'); if (lc) {
  lc.insertAdjacentHTML('afterbegin', '<h2 class=lch>Options</h2>'); lc.appendChild($('opt')); lc.appendChild($('t')); { const cl = document.createElement('div'); cl.id = 'cl'; cl.appendChild($('hue')); cl.appendChild($('g')); lc.appendChild(cl); } if ($('c')) $('at').appendChild($('c')); $('at').insertAdjacentHTML('beforeend', '<span id=vc><button id=again title="Say the last thing again">Speak</button><button id=hush title="Quiet the voice">Shoosh</button></span>');   // the voice's two words, always at hand, at the right of the credits row (User1)   // Colour leads a row with its Vivid and Light bars; the switches stand in the column itself, so the workshop panel beneath them can take the room that is left; the credits stand in the row under the title, above the graph upward
  $('sb').appendChild($('opt-note'));
  const sp = $('split'), keep = () => store.set('nuage.split', JSON.stringify({ w: lc.style.getPropertyValue('--lw'), closed: lc.classList.contains('closed') }));
  let st = {}; try { st = JSON.parse(store.get('nuage.split') || '{}'); } catch (e) {}
  if (st.w) lc.style.setProperty('--lw', st.w); lc.classList.toggle('closed', !!(st.closed || (st.closed === undefined && innerWidth < 760)));   // the page arrives with the column closed (so her loader has the stage); here it opens if that is how you left it
  // ON A PHONE THE DIVIDER IS THE DOOR (User1, 12 xi 2026). Under a finger the column is not beside the talk but over it:
  // the four-pixel bar stands lit at the talk's left edge; a tap there brings the Options out across 78 percent of the
  // width, with a blank margin at their left, and the same bar, now at their right edge, sends them back. A tap on the
  // talk beyond it does the same. It always starts closed, and its state is not kept, so it never changes the desk's.
  const coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  if (coarse) { lc.classList.add('closed'); sp.setAttribute('aria-label', 'Options'); sp.title = 'Options';
    sp.onclick = (e) => { e.stopPropagation(); lc.classList.toggle('closed'); };
    $('cc').addEventListener('click', () => lc.classList.add('closed'));
    // THE LUNETTE STAYS PUT (User1: "at vertical chat center fixed, so user is not hunting for it. Ab initio, it will land beneath the
    // short message, and that is preferable"). Its place is found once, as the page opens: the vertical centre of the chat window as it
    // then stands, between the talk's top and the chat line. It keeps that place on the screen however the talk grows or scrolls, and
    // is found again only if the screen itself changes (turned, or resized).
    const mid = () => { const m = $('main').getBoundingClientRect(), f = $('f') ? $('f').getBoundingClientRect() : m, a = Math.max(0, m.top + scrollY), b = Math.max(a, Math.min(innerHeight, (f.top || m.bottom) + scrollY)); sp.style.setProperty('--ly', Math.round((a + b) / 2) + 'px'); };
    addEventListener('resize', mid); setTimeout(mid, 0); setTimeout(mid, 1500); }
  sp.onpointerdown = (e) => { if (coarse) return;
    const x0 = e.clientX, w0 = lc.classList.contains('closed') ? 0 : lc.getBoundingClientRect().width; let moved = false; sp.setPointerCapture(e.pointerId); sp.classList.add('drag');
    sp.onpointermove = (m) => { const dx = m.clientX - x0; if (Math.abs(dx) > 3) moved = true; if (!moved) return; lc.classList.remove('closed'); lc.style.setProperty('--lw', Math.max(192, Math.min(innerWidth * 0.6, w0 + dx)) + 'px'); };
    sp.onpointerup = () => { sp.onpointermove = sp.onpointerup = null; sp.classList.remove('drag'); if (!moved) lc.classList.toggle('closed'); keep(); };
  };
  sp.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lc.classList.toggle('closed'); if (!coarse) keep(); } };
} }
const kept = N.recall(store.get('nuage.memory') || '');
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
lab.textContent = 'Awake in ' + Math.round(performance.now() - t0) + ' ms, with ' + N.stat() + '.' + (kept ? ' I remember ' + (WORD[kept] || kept) + (kept === 1 ? ' thing' : ' things') + ' you taught me.' : '');

// the conversation, and its switches: tilt (Wallbreaker), colour (Viriditas, through Ecouter), voice
const o = $('o'), inp = $('i'), prefs = JSON.parse(store.get('nuage.prefs') || '{}');
let fleurBig = prefs.fleur !== 'small', noctGone = false;   // the large Fleuriant: wanted at all (an Option), and put away for this reply by a tap on it
let speakAll = !!prefs.speak, speakReq = !!prefs.speakReq, chatZoom = prefs.chat > 0 ? +prefs.chat : 1.1, tiltState = +prefs.tiltState || 0;   // the last Tiltform state set by hand, so the reading survives a waking   // Speak every reply, and the chat's own zoom, remembered
const MODES = ['off', 'viriditas', 'vivificat', 'omnia', 'tincture'], NAMES = { off: 'off', viriditas: 'Viriditas', vivificat: 'Vivificat', omnia: 'Omnia', tincture: 'Tincture' };
let mode = MODES.indexOf(prefs.mode) >= 0 ? prefs.mode : 'tincture', tilt = prefs.tilt !== false, voice = /^(machine|nuage|miria|arthur|ecouter|blando)$/.test(prefs.voice) ? prefs.voice : 'cast';
let vivid = prefs.vivid >= 0 ? prefs.vivid : 1, light = prefs.light > 0 ? prefs.light : 1;
const save = () => store.set('nuage.prefs', JSON.stringify({ speak: speakAll, speakReq, tiltState, chat: chatZoom, mode, tilt, voice, vivid, light, wyrd: wyrdOn, rail: railOn, sand: sandOn, links: linksOn, fleur: fleurBig ? 'large' : 'small', theme, size, opt: $('opt').open, bar: !$('b').hidden, strip: !$('rl').hidden }));
// Options and Credits fold away, since a large type makes height dear; each remembers whether it was open
$('opt').open = $('lc') ? true : !!prefs.opt; if ($('ab-c')) $('ab-c').onclick = () => $('nm').click();   // the credits line opens About, where the many more are named
// THE LOGO: the unpacker graph folds on a click into a mark before her name, and unfolds on another (User1, 3 xi 2026)
// THE VOICE'S STRIP has a row of its own under the loadgraph, as wide (User1), and folds to a square of nine bins, leftmost
// of all, that sounds along while a voice speaks. Click the square to deploy the strip; click the strip to fold it.
$('b').insertAdjacentHTML('afterend', '<div id=rl hidden><canvas id=roll role=button tabindex=0 title="The voice\'s strip: colour is pitch, brightness is strength, sparks are hiss, and time runs to the left. Click to fold it away. \u2192 At the right, the fleuriant, the wall the voice strikes: click it to hear the last thing said again, four seconds at most." aria-label="The voice\'s strip"></canvas><div id=fl role=button tabindex=0 aria-label="The fleuriant: click to hear the last thing said again"><canvas width=152 height=152 aria-hidden=true></canvas><span></span></div></div>');
$('rl').before($('vc'));   // Speak and Shoosh are the strip's own keys (User1, 12 xi 2026): they stand directly above it, at its right, and no longer ride the credits row, where the unpacking bars could come between
{ const rl = $('rl'), sq = $('sq'), deploy = (f) => { rl.hidden = !f; sq.setAttribute('aria-pressed', f); save(); if (f) sizeRoll(); };   // the square stays, a control: it shows the strip, and the strip folds itself
  const rc = $('roll'), fl = $('fl'); rc.onclick = () => deploy(false); rc.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deploy(false); } }; sq.onclick = () => deploy(rl.hidden);
  fl.onclick = () => { if (lastSaid) speak(lastSaid, 4000); }; fl.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && lastSaid) { e.preventDefault(); speak(lastSaid, 4000); } };   // show it to me again
  if (prefs.strip !== false) { rl.hidden = false; sq.setAttribute('aria-pressed', 'true'); } }
{ const b = $('b'), lg = $('lg'), fold = (f) => { b.hidden = f; lg.hidden = !f; save(); };
  b.tabIndex = 0; b.setAttribute('role', 'button'); b.title = 'Click to fold the graph into her mark.'; b.onclick = () => fold(true); b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fold(true); } };
  lg.onclick = () => fold(false); }
['opt'].forEach((id) => $(id) && $(id).addEventListener('toggle', () => { save(); try { relink(); } catch (e) {} }));
// THE TINCTURE (after Vespers): sound plays no part. Each stretch is toned by how deep Wallbreaker finds it sits. The head
// keeps its ink, one step in turns cyan, two white, three grey, and a darker grey from four on (User1: the hot cyan,
// then white, then grey, and no gold), or wherever a sentence
// runs past its fifth stretch or forty words. The ink is only MIXED toward the hue, at 40% by default.
const hslRgb = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
  const v = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return v.map((q) => Math.round((q + m) * 255)); };
// THE THEMES: Night (the house), Dusk (softer), Day (ink on paper). The page's own colours live in CSS variables; the
// colours drawn by script (the tincture's ladder, the Wyrd, the railyard, the lamp's white, a picture's headline) live here.
const TH = {
  night: { ink: [216, 208, 192], user: [156, 199, 221], white: [232, 232, 232], ladder: [null, hslRgb(182.5, 0.7, 0.64), [236, 236, 236], [160, 168, 176], [110, 118, 126]], rung0: '#cfcbc2', turn: '#8f98a5', thing: '#9cc7dd', cat: '#e8e8e8', deny: '#e0907e', join: '#bcc6ce' },
  dusk: { ink: [228, 221, 207], user: [169, 211, 234], white: [236, 232, 222], ladder: [null, hslRgb(182.5, 0.7, 0.7), [240, 238, 232], [172, 180, 188], [122, 130, 138]], rung0: '#e4ddcf', turn: '#a2abb4', thing: '#a9d3ea', cat: '#ece8de', deny: '#eda090', join: '#c8d0d8' },
  day: { ink: [42, 41, 37], user: [29, 88, 120], white: [42, 41, 37], ladder: [null, [22, 112, 140], [20, 20, 18], [96, 102, 110], [140, 146, 154]], rung0: '#2a2925', turn: '#6b727c', thing: '#1d5878', cat: '#1a1a18', deny: '#a33a2a', join: '#59606a' } };
let theme = TH[prefs.theme] ? prefs.theme : 'night', T = TH[theme];
let LADDER = T.ladder;
const SIZES = [80, 87, 95, 103, 112, 122, 133, 145]; let size = SIZES.indexOf(prefs.size) >= 0 ? prefs.size : 95;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// SCANATURES: each conversation kept as gist (the things most asked about, and a mark a turn: ● answered, ? asked back,
// X missed), in this browser only (nuage.gist), shown beside "Awake in", and clicked open for review. On waking, the last
// one is read first, as preverbal review. Forget clears them. (user1: "admissible, to itself, for rapid, preverbal review")
const GK = 'nuage.gist', since = Date.now(), awake = lab.textContent, gl = () => { try { return JSON.parse(store.get(GK) || '[]'); } catch (e) { return []; } };
let gistFrom = 0;
const listing = (v) => (v.length < 2 ? v.join('') : v.slice(0, -1).join(', ') + (v.length > 2 ? ',' : '') + ' and ' + v[v.length - 1]);
const showGist = () => {
  const all = gl(), last = all[all.length - 1];
  lab.innerHTML = esc(awake) + (last ? ' <button id=gist-b aria-expanded=false title="My notes on our conversations">' + esc((last.id === since ? '' : 'Last time: ') + last.s) + '</button>' : '');
  if (!last) return;
  let box = $('gist'); if (!box) { lab.insertAdjacentHTML('afterend', '<div id=gist hidden></div>'); box = $('gist'); }
  box.innerHTML = all.slice().reverse().map((x) => '<div><b>' + esc(x.d + ' \u00b7 ' + x.s) + '</b> ' + esc(x.p) + '</div>').join('');
  $('gist-b').onclick = () => { box.hidden = !box.hidden; $('gist-b').setAttribute('aria-expanded', !box.hidden); };
};
// the Sontimeter (User1's canon, from the Exaspera): three dials and one light in the upper right. Each dial is one axis
// of alignment in the talk: accord (am I answering?), ground (are we on one thread, each acknowledged?), and pitch (is the
// talk going forward, not round?). When all three read above nought, the light goes on. A simple read.
const DIAL = (v) => (v <= 0 ? '\u25cb' : ['\u25d4', '\u25d1', '\u25d5'][Math.min(v, 3) - 1] || '\u25cf');
const sonti = () => {
  if (!N.sontimeter) return; const s = N.sontimeter(8, gistFrom), hd = $('hd'); let el = $('sont');
  if (!el) { hd.insertAdjacentHTML('beforeend', '<span id=sont role=img tabindex=0></span>'); el = $('sont'); }
  // TAPPED, THEY SAY WHAT THEY ARE (User1, 12 xi 2026), in the plainest box there is.
  el.onclick = () => alert('These Chat Meters try to show how things are going.\n\n1) Accord: am I answering you?  (' + s.accord + ')\n2) Ground: are we on one thread, each of us acknowledged?  (' + s.ground + ')\n3) Pitch: is the talk going forward, and not round?  (' + s.pitch + ')\n4) The colour light: on when all three stand above nought. Green is well, white is rare accord, and it goes amber, then red, as they fall away.');
  // THE LIGHT'S COLOURS (User1): white for unbelievable synchrony (every dial at three or more, mirrored identity,
  // 3 = 3), green for nominal (every dial above nought), then amber, yellow, orange-red, and red as the dials fall
  // away, and out when nothing has happened yet.
  const up = [s.accord, s.ground, s.pitch].filter((v) => v > 0).length, down = [s.accord, s.ground, s.pitch].filter((v) => v < 0).length;
  const L = Math.min(s.accord, s.ground, s.pitch) >= 3 ? ['#f4f1ea', 'white: unbelievable synchrony'] : up === 3 ? ['#7fd47f', 'green: nominal'] : up === 2 && !down ? ['#e0b050', 'amber: two dials of three'] : up === 2 ? ['#e8d84a', 'yellow: two dials, and one falling'] : up === 1 ? ['#ff6a2b', 'orange-red: one dial of three'] : down ? ['#e04040', 'red: the dials are falling'] : ['', 'out: nothing has been said yet'];
  el.textContent = DIAL(s.accord) + DIAL(s.ground) + DIAL(s.pitch) + ' \u25cf';
  el.className = s.lit ? 'lit' : ''; el.style.color = ''; if (L[0]) el.lastChild && (el.innerHTML = el.textContent.slice(0, -1) + '<b style="color:' + L[0] + ';font-weight:normal">\u25cf</b>');
  el.title = el.ariaLabel = 'Sontimeter. Accord ' + s.accord + ', ground ' + s.ground + ', pitch ' + s.pitch + '. The light is ' + L[1] + '.';
};
const keepGist = () => {
  const g = N.gist(gistFrom); if (!g.n) return;
  const all = gl().filter((x) => x.id !== since);
  all.push({ id: since, d: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), s: (g.topics.length ? g.topics.join(' ') + ' \u00b7 ' : '') + g.marks, p: (g.topics.length ? 'You asked most about ' + listing(g.topics) + '. ' : '') + 'I answered ' + g.ok + ' of ' + g.n + '.' });
  store.set(GK, JSON.stringify(all.slice(-30))); showGist();
};
const tincture = (t, ink) => {
  const w = window.__wallbreaker; if (!w || !w.plan) return esc(t);
  const toks = t.match(/\s*\S+\s*$|\s*\S+/g) || [], k = 0.4 * vivid; let at = 0, out = '', inSent = 0, words = 0;
  w.plan(t).forEach((L) => {
    if (L.d === 0) { inSent = 0; words = 0; } inSent++; words += L.n;
    const d = inSent > 5 || words > 40 ? 4 : Math.min(L.d, 4), seg = toks.slice(at, at + L.n).join(''); at += L.n;
    out += d ? '<span style="color:rgb(' + LADDER[d].map((h, i) => Math.round(ink[i] * (1 - k) + h * k)).join(',') + ')">' + esc(seg) + '</span>' : esc(seg);
  });
  return out + esc(toks.slice(at).join(''));
};
const lines = () => Array.prototype.slice.call(o.querySelectorAll('.u,.n,.e,.m,.td dd'));   // a teardown card's sections too: each its own marker (User1: the From of cow, aired, not a wall)
// THE WYRD (after Vespers): a 25 by 5 path board above a reply, one line walking right along its stretches, down a rung where
// Wallbreaker dives and up where it steps out, in box characters joined dead even. "Could be wolves, could be alehouse."
const rgb = (v) => 'rgb(' + v.join(',') + ')'; let RUNG = [T.rung0].concat(LADDER.slice(1).map(rgb)), TURN = T.turn;
const wyrd = (t) => {
  const w = window.__wallbreaker; if (!w || !w.plan) return '';
  const toks = t.split(/\s+/).filter(Boolean), W = 25, Hh = 5; let at = 0;
  const cells = w.plan(t).map((L) => { const ws = toks.slice(at, at + L.n); at += L.n; return { d: Math.min(Hh - 1, L.d), w: L.n, end: /[.!?]["')\]]*$/.test(ws[ws.length - 1] || '') }; });
  if (cells.length < 2) return '';
  const rows = [...Array(Hh)].map(() => Array(W).fill(null)), total = cells.reduce((s, c) => s + c.w, 0);
  const put = (r, c, ch, col) => { if (r >= 0 && r < Hh && c >= 0 && c < W && (!rows[r][c] || ch !== '\u2500')) rows[r][c] = [ch, col]; };
  let pos = 0, prevD = -1, start = true;
  cells.forEach((cell) => {
    let x0 = Math.floor(pos / total * W), x1 = Math.min(W, Math.max(x0 + 1, Math.floor((pos + cell.w) / total * W)));
    if (!start && prevD >= 0 && prevD !== cell.d) {
      const lo = Math.min(prevD, cell.d), hi = Math.max(prevD, cell.d);
      if (cell.d > prevD) { put(prevD, x0, '\u256e', TURN); put(cell.d, x0, '\u2570', TURN); } else { put(prevD, x0, '\u256f', TURN); put(cell.d, x0, '\u256d', TURN); }
      for (let k = lo + 1; k < hi; k++) put(k, x0, '\u2502', TURN);
      x0++; if (x1 < x0 + 1) x1 = Math.min(W, x0 + 1);
    }
    for (let c = x0; c < x1; c++) put(cell.d, c, '\u2500', RUNG[cell.d]);
    if (cell.end) { put(cell.d, x1 - 1, '\u2574', RUNG[cell.d]); start = true; prevD = -1; } else { start = false; prevD = cell.d; }
    pos += cell.w;
  });
  let last = Hh - 1; while (last > 0 && rows[last].every((x) => !x)) last--;
  return rows.slice(0, last + 1).map((r) => r.map((x) => (x ? '<span style="color:' + x[1] + '">' + x[0] + '</span>' : ' ')).join('')).join('\n');
};
let wyrdOn = !!prefs.wyrd;
const board = (p) => { if (!wyrdOn || p.className !== 'n') return; const h = wyrd(p.dataset.t); if (!h) return; const d = document.createElement('div'); d.className = 'w'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = h; o.insertBefore(d, p); };
const boards = async () => { o.querySelectorAll('.w').forEach((d) => d.remove()); if (wyrdOn) { await wbk(); o.querySelectorAll('.n').forEach(board); } };
// THE RAILYARD (after Vespers): a signal stripe above a reply, made from what its words signify. A light for each word Nuage
// has a card for (a diamond for a category), X for a denial, an arrow for a consequence, a slash for and and or.
let railOn = !!prefs.rail, sandOn = prefs.sand >= 0 ? +prefs.sand : 1;   // Sandeko's three states: 0 off, 1 the tray (grey lines, the mon by difference), 2 the sky (the depth palette, additive, z-sorted)
const RAIL = { no: 'X', not: 'X', nothing: 'X', never: 'X', cannot: 'X', then: '\u2192', so: '\u2192', because: '\u2192', therefore: '\u2192', if: '\u2192', and: '/', or: '/' };
const railOf = (t) => {
  const ts = N.terms(t), re = /[A-Za-z][A-Za-z'-]*/g, out = []; let m, j = 0;
  while ((m = re.exec(t))) {
    while (j < ts.length && ts[j].b <= m.index) j++;
    if (j < ts.length && ts[j].a <= m.index) { if (ts[j].a === m.index) out.push(ts[j].cat ? ['\u25c6', T.cat] : ['\u25cf', T.thing]); continue; }
    const c = RAIL[m[0].toLowerCase()]; if (c) out.push([c, c === 'X' ? T.deny : T.join]);
  }
  return out.length > 1 ? out.map((x) => '<span style="color:' + x[1] + '">' + x[0] + '</span>').join(' ') : '';
};
const stripe = (p) => { if (!railOn || p.className !== 'n') return; const h = railOf(p.dataset.t); if (!h) return; const d = document.createElement('div'); d.className = 'r'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = h; o.insertBefore(d, p); };
const stripes = () => { o.querySelectorAll('.r').forEach((d) => d.remove()); if (railOn) o.querySelectorAll('.n').forEach(stripe); };

// HER WORDS IN PLAIN INK (User1, 12 xi 2026: "my make-all-things-one instinct taken too far ... where is the moderate landing?").
// Her replies were gradient text: transparent letters with a gradient showing through. Safari redraws a highlighted
// word in the text's own colour, which was "transparent", so on an iPhone every linked word vanished and left its
// underline ("a small _____"). The landing: her words are one real colour, a cool white beside your warm one, and the
// gradient moves to her name before each reply, which is generated content and can never be a link.
// (Later the same day: plain ink was not enough, and on the iPhone a linked word was still blank. So a link is now given its
// colour outright, the living blue of "You:", in each theme by its own number and not by a variable, so that Safari has a
// colour to draw it with. User1: "it does truly offer an active living thing, and pre-vites the user to tap it, take it, say it.")
// LINKS: every word Nuage has a card for is underlined where it stands (dashed, in gold, for a category), and a click on it
// asks "What is it?" Drawn with the Custom Highlight API, so the words themselves are never touched, coloured or tilted.
const HL = window.CSS && CSS.highlights && window.Highlight, hlThing = HL ? new Highlight() : null, hlCat = HL ? new Highlight() : null, spans = [];
// a category is not underlined but ringed, softly, so its letters stand on nothing (user1: a rounded outline of 36% opacity, 1px, for "a thick box plays heck with the characters"). The box is border-box, so it stands an even 3px clear on either side and 1px above and below; a content-box border used to push it right and down by its own width.
const layer = document.createElement('div'); layer.id = 'rings'; layer.setAttribute('aria-hidden', 'true'); o.appendChild(layer);
const ring = (r) => {                                     // one ring a line: a coloured word comes back as a box a letter, so the boxes are joined first
  const ob = o.getBoundingClientRect(), lines0 = [];
  Array.prototype.forEach.call(r.getClientRects(), (b) => { if (!b.width) return; const L = lines0.find((x) => Math.abs(x.t - b.top) < 3); if (L) { L.l = Math.min(L.l, b.left); L.r = Math.max(L.r, b.right); L.h = Math.max(L.h, b.height); } else lines0.push({ t: b.top, l: b.left, r: b.right, h: b.height }); });
  lines0.forEach((b) => { const d = document.createElement('i'); d.style.cssText = 'left:' + (b.l - ob.left + o.scrollLeft - 3) + 'px;top:' + (b.t - ob.top + o.scrollTop - 1) + 'px;width:' + (b.r - b.l + 6) + 'px;height:' + (b.h + 2) + 'px'; layer.appendChild(d); });
};
let linksOn = prefs.links !== false;
if (HL) { CSS.highlights.set('nu-thing', hlThing); CSS.highlights.set('nu-cat', hlCat); }
const textNodesOf = (el) => { const out = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentNode.closest('[data-wb-tri]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) }); let n; while ((n = tw.nextNode())) out.push(n); return out; };
const relink = () => {
  layer.textContent = ''; if (layer.parentNode !== o || o.lastChild !== layer) o.appendChild(layer);
  if (!HL) return; hlThing.clear(); hlCat.clear(); spans.length = 0; if (!linksOn) return;
  o.querySelectorAll('.u,.n').forEach((el) => {
    const ns = textNodesOf(el), starts = []; let text = '';
    ns.forEach((n) => { starts.push(text.length); text += n.data; });
    const at = (pos, end) => { for (let i = 0; i < ns.length; i++) { const a = starts[i], b = a + ns[i].data.length; if (end ? pos > a && pos <= b : pos >= a && pos < b) return [ns[i], pos - a]; } return null; };
    N.terms(text).forEach((t) => { const s = at(t.a, false), e = at(t.b, true); if (!s || !e) return; const r = document.createRange(); r.setStart(s[0], s[1]); r.setEnd(e[0], e[1]); if (t.cat) ring(r); else hlThing.add(r); spans.push({ r, phrase: t.phrase }); });
  });
};
const spanAt = (x, y) => {
  const cp = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : null, cr = !cp && document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
  const node = cp ? cp.offsetNode : cr && cr.startContainer, off = cp ? cp.offset : cr && cr.startOffset;
  if (!node) return null;
  for (const s of spans) { try { if (s.r.isPointInRange(node, off) && s.r.toString().length) { const b = s.r.getBoundingClientRect(); if (x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) return s; } } catch (e) {} }
  return null;
};
let relinkQueued = false;
new MutationObserver((ms) => { if (relinkQueued || ms.every((m) => m.target === layer || m.target === o && [...m.addedNodes, ...m.removedNodes].every((n) => n === layer))) return; relinkQueued = true; requestAnimationFrame(() => { relinkQueued = false; relink(); }); }).observe(o, { childList: true, subtree: true });
addEventListener('resize', () => { relink(); sizeRoll(); });
// PAINTED CHAT: a reply that ends in a colorburst shadow is a picture. It is painted by the grammar's own decoder (yampal.js,
// in the luggage) against YAM-PAL, Vespers' table; the shadow itself is kept in the text but not shown.
const PALETTE = ['#cfcbc2', '#fff4d6', '#dbe8ff', '#9fc6ff', '#ff8a3c', '#58bff0', '#2b7fb8', '#6fd66f', '#a8825a', '#8a6b4a', '#e8be5a', '#ffd23f', '#e0947e',
  '#8f98a5', '#c9a9e8', '#ff5c72', '#bfeae0', '#efe6d2', '#9fb6c9', '#ffffff', '#ff4d4d', '#565b64', '#e8a39c', '#f2c48a', '#fff3c4', '#8f7aa8', '#e3a33f',
  '#6e5a8a', '#c9a24a', '#7a6a9a', '#000000', '#35855b'];
const BLANK = (ch) => ch === ' ' || ch === '\u2800';
const isPicture = (t) => { const ls = t.split('\n'), b = ls[ls.length - 1]; return ls.length > 1 && /^[\u2800 ]*\.[.\u0300-\u036f]*$/.test(b) && /[\u0316-\u0330]/.test(b); };
const paintPicture = async (p) => {
  const L = await luggage(); if (!window.YAMPAL && L.yampal) (0, eval)(L.yampal);
  const ls = p.dataset.t.split('\n'), burst = ls.pop().replace(/^[\u2800 ]+/, ''), head = /^[A-Z0-9\u2800 '.,-]+$/.test(ls[0]) ? ls.shift() : null;
  const d = window.YAMPAL ? YAMPAL.decode(burst, PALETTE) : { colours: [] }, cs = d.colours, kinds = []; let n = 1;
  const cell = (ch) => { if (BLANK(ch)) return null; if (d.mode === 'positional') return cs[n++]; let k = kinds.indexOf(ch); if (k < 0) { kinds.push(ch); k = kinds.length - 1; } return cs[1 + k]; };
  const row = (s, all) => { let h = '', run = '', col = null; const flush = () => { if (run) h += col ? '<span style="color:' + col + (/^[\u2588]+$/.test(run) ? ';background:' + col : '') + '">' + esc(run) + '</span>' : esc(run); run = ''; };   // a full block takes its colour as ground too, so no seam shows between cells
    Array.from(s).forEach((ch) => { const c = all ? (BLANK(ch) ? null : all) : cell(ch); if (c !== col) { flush(); col = c; } run += ch; }); flush(); return h; };
  p.innerHTML = (head ? row(head, theme === 'day' ? '#d8d0c0' : rgb(T.ink)) + '\n' : '') + ls.map((s) => row(s)).join('\n');   // by day a picture stands on its own dark plate, as painted chat was drawn for one
};
let INK = { u: T.user, n: T.ink };
const paint = (p) => {
  const t = p.dataset.t, E = window.ECOUTER;
  if (mode === 'tincture' && window.__wallbreaker) p.innerHTML = tincture(t, INK[p.className] || INK.n);
  else if (mode !== 'off' && mode !== 'tincture' && E && E.html) p.innerHTML = E.html(t, { mode, vivid, mix: 0.75 * Math.min(1, vivid), white: T.white });
  else p.textContent = t;
  if (p.className === 'n') quoteLinks(p);   // her quoted words stay clickable through every repaint
};
// QUOTED, SO CLICKABLE (User1): what stands in quotation marks is a thing to say. In her reply, a click says it for you
// ("Say "notes""); in a teardown card, it tears that word (the panel takes those). Text nodes only, so the colour stays.
const quoteLinks = (p) => {   // read across the painted letters: the quoted word may lie in one text node or in many (Colour on)
  const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentNode.closest('.qt,[data-wb-tri],svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }), at = []; let flat = '', n;
  while ((n = tw.nextNode())) for (let i = 0; i < n.data.length; i++) { at.push([n, i]); flat += n.data[i]; }
  const hits = []; flat.replace(/["“]([^"“”\n]{1,60})["”]/g, (m, w, i) => { hits.push([i + 1, i + 1 + w.length]); });
  for (const [a, b] of hits.reverse()) {   // last first, so earlier offsets stay true; each text node's part of the word is wrapped on its own, all parts one link
    const parts = []; let k = a; while (k < b) { const [node, off] = at[k]; let e = k; while (e < b && at[e][0] === node) e++; parts.push([node, off, off + (e - k)]); k = e; }
    const word = flat.slice(a, b).trim().replace(/[.,;:!?]+$/, '');
    for (const [node, o0, o1] of parts.reverse()) { const r = document.createRange(); r.setStart(node, o0); r.setEnd(node, o1); const sp = document.createElement('span'); sp.className = 'qt'; sp.dataset.q = word; sp.title = 'Click to say it.'; try { r.surroundContents(sp); } catch (e) {} }
  }
};
o.addEventListener('click', (e) => { const q = e.target.closest('.qt'); if (!q || q.closest('.td') || e.defaultPrevented || String(window.getSelection()).trim()) return; const w = (q.dataset.q || q.textContent).trim().replace(/[.,;:!?]+$/, ''); if (w) ask(w); });
const say = (who, s) => {
  const p = document.createElement('div'); if (who === 'n' && isPicture(s)) who = 'p'; p.className = who; p.dataset.t = s;
  if (who === 'n' && castOf(s, 'n') === 'arthur') p.classList.add('canon');   // the house's own lines are the Canon's, and say so (User1: Arthur's voice under "Nuage:" hassles the script-reading mind)
  if (who === 'h' || who === 'm') p.textContent = s; else if (who === 'p') { p.textContent = s.split('\n').slice(0, -1).join('\n'); paintPicture(p); } else paint(p);
  const lastTri = tilt && /^(n|e|m)$/.test(who) ? [...o.querySelectorAll('.n > [data-wb-tri], .e > [data-wb-tri], .m > [data-wb-tri]')].pop() : null, lastState = lastTri ? ['|>', '_|', '\\/'].indexOf(lastTri.textContent) : (tilt ? tiltState : 0);   // follow the last tilt (User1): the reader is reading like that
  o.appendChild(p); board(p); stripe(p); if (tilt && who !== 'h' && window.__wallbreaker) { window.__wallbreaker.mark(p); if (lastState > 0) { const t = p.querySelector('[data-wb-tri]'); for (let k = 0; k < lastState; k++) if (t) t.click(); } } o.scrollTop = o.scrollHeight;
};
// SHELVES: knowledge kept in its own block, read in the first time it is asked about, with a note in the conversation
// (user1: "the kind of late-load I would expect to see as a note in the conversation")
const SHELF = { flags: { name: 'Flags of Our World', re: /\b(flags?|banners?|pennants?|pennons?|ensigns?|vexill\w*)\b/i }, science: { name: 'Sky and Science', re: /\b(black holes?|stars?|nebula[es]?|galax\w*|universe|cosmos|big bang|planets?|quantum|qubits?|climate|greenhouse|global warming|astronom\w*)\b/i } };
let shelves = null; const shelfRead = {};
const shelfFor = async (q) => {
  for (const [k, v] of Object.entries(SHELF)) {
    if (shelfRead[k] || !H.sn || !v.re.test(q)) continue;
    shelfRead[k] = true; say('m', '[Loading ' + v.name + '.]'); const note = o.lastChild;
    try { shelves = shelves || JSON.parse((await (async () => { const st = stage(v.name, H.sz); const t = await unpack('x', H.sn, (got) => st(got / H.sn), H.sz, H.sa); st(1); return t; })()) || '{}'); const n = shelves[k] ? N.more(shelves[k].kb) : 0; note.textContent = note.dataset.t = '[Loaded ' + v.name + ', ' + n + (n === 1 ? ' card' : ' cards') + '.]'; }
    catch (e) { note.textContent = note.dataset.t = '[' + v.name + ' could not be read: ' + e.message + ']'; }
  }
};
let busy = false;
// YOUR LINE IS HEARD (User1, 12 xi 2026: "when I tap one of those links that autoprompts me (You:...), You's words are not spoken
// as such, yet answered. I'd like to make sure to hear my words in the thread of conversation"). Two things are done about it.
// A tapped link is a line you did not type, so it is read aloud whenever the voice is in use at all (Speak every reply, or
// Speak every request), not only under the second. And the sound is woken here, at once, inside the tap or the keystroke
// itself: a phone lets a page start sound only from within the gesture, and the voice is built a moment later, by which
// time the gesture is over and the line could go unheard.
const ask = async (q, who, tapped) => { noctGone = false;
  if (speakReq || speakAll) { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {} }
  busy = true; try {
  say(who || 'u', q);
  if (speakReq || (tapped && speakAll)) { await speak(q, 0, 'you'); while (performance.now() < voiceEnd + 200) await new Promise((r) => setTimeout(r, 100)); }   // your request, by Blando, and heard out before she answers
  for (const f of NUAGE.before) if (await f(q)) return;   // a cut's own command, answered by the part that knows it
  await shelfFor(q); const r = N.chat(q); say('n', r); store.set('nuage.memory', N.remember()); keepGist(); sonti();
  if (N.wantsForget()) { store.del('nuage.memory'); store.del(GK); setTimeout(() => location.reload(), 1600); }
  for (const f of NUAGE.after) await f(q, r);   // and a word after, from a part that has one (Mimia, where Nuage could not answer)
  } finally { busy = false; }
};
// THE ONE DOOR: a cut of Nuage may carry more than the core (Mimia, the sound drawings, Aquavit). Each joins here, with a
// button among the options, a command it answers before Nuage, or a word it adds after; none reaches further in.
window.NUAGE = { N, markCard: (d) => markCard(d), cast: () => voiceOf(), repaint: (p) => paint(p), say: (w, t) => say(w, t), ec: () => ec(), speak: (t, most, who) => speak(t, most, who), sound: (svg, w, F) => sound(svg, w, F), o, tools: $('t'), before: [], after: [] };
$('gal').onclick = () => {   // the Noctilucents open in a window of the page, like About, where the gallery can be fetched; else in a window of their own
  const url = /\/dist\/cuts\//.test(location.pathname) ? '../../words/gallery.html' : '../words/gallery.html';
  if (location.protocol === 'file:') { window.open(url, 'noctilucents'); return; }
  fetch(url, { method: 'HEAD' }).then((r) => {
    if (!r.ok) throw 0;
    if (!$('gd')) { document.body.insertAdjacentHTML('beforeend', '<dialog id=gd class=bx aria-labelledby=gd-h><header><h2 id=gd-h>Noctilucents</h2><button id=gd-x>Close</button></header><iframe id=gd-f title="The Noctilucents, the gallery of words drawn as their sounds"></iframe></dialog>'); const d = $('gd'); $('gd-x').onclick = () => d.close(); d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); }
    const d = $('gd'), f = $('gd-f'); if (!f.src) f.src = url; d.showModal();
  }).catch(() => window.open(url, 'noctilucents'));
};
const btn = $('s'), bTilt = $('tilt'), bHue = $('hue'), bTalk = $('talk'), bVoice = $('voice'), bForget = $('forget');
const bWyrd = $('wyrd'), bRail = $('rail'), bLinks = $('links');
const show = () => { o.classList.toggle('gutter', !!(tilt || wyrdOn || railOn)); bRail.setAttribute('aria-pressed', railOn); bLinks.setAttribute('aria-pressed', linksOn); bWyrd.setAttribute('aria-pressed', wyrdOn); bSand.setAttribute('aria-pressed', !!sandOn); bSand.textContent = sandOn === 2 ? 'Sandeko sky' : 'Sandeko'; bTilt.setAttribute('aria-pressed', tilt); bHue.textContent = 'Colour: ' + NAMES[mode]; bVoice.setAttribute('aria-pressed', voice === 'ecouter'); $('voice2').setAttribute('aria-pressed', voice === 'machine'); $('voice3').setAttribute('aria-pressed', voice === 'nuage'); $('voice4').setAttribute('aria-pressed', voice === 'miria'); $('voice5').setAttribute('aria-pressed', voice === 'arthur'); $('voice6').setAttribute('aria-pressed', voice === 'cast'); $('voice7').setAttribute('aria-pressed', voice === 'blando'); };
// a card's section markers stand in the gutter, as far left as the chat's own, so the label column is typography alone
const gutterTris = (d) => { const L = d.getBoundingClientRect().left; d.querySelectorAll('dd > [data-wb-tri]').forEach((t) => { t.style.setProperty('--col', (t.parentNode.getBoundingClientRect().left - L) + 'px'); }); };   // the label column's width, added to the chat's own gutter
o.addEventListener('click', (e) => { const t = e.target.closest('[data-wb-tri]'); if (!t) return; setTimeout(() => { const st = ['|>', '_|', '\\/'].indexOf(t.textContent); if (st >= 0) { tiltState = st; save(); } }, 0); }, true);   // what you set by hand is what she keeps (heard in capture: the Tiltform stops the click from rising)
const retilt = async () => { const w = await wbk(); if (w) { w.off(); if (tilt) lines().forEach((p) => { w.mark(p); const t = p.querySelector('[data-wb-tri]'); for (let k = 0; k < tiltState && t; k++) t.click(); }); o.querySelectorAll('.td').forEach((d) => { d.classList.toggle('tilted', tilt); if (tilt) gutterTris(d); }); } };
const markCard = async (d) => { if (!tilt) return; const w = await wbk(); if (w) { d.querySelectorAll('dd').forEach((p) => w.mark(p)); d.classList.add('tilted'); gutterTris(d); } };   // a card just drawn, while Tilt is on
bTilt.onclick = async () => { tilt = !tilt; show(); save(); await retilt(); };
const tune = () => { o.style.filter = mode !== 'off' && light !== 1 ? 'brightness(' + light + ')' : ''; $('g').hidden = mode === 'off'; $('vv').value = vivid; $('ll').value = light; };
const repaint = async () => { if (mode === 'tincture') await wbk(); else if (mode !== 'off') await ec(); if (window.__wallbreaker) window.__wallbreaker.off(); lines().forEach(paint); tune(); if (tilt) await retilt(); };
$('vv').oninput = () => { vivid = +$('vv').value; save(); repaint(); };   // live: the colours move toward plain grey and back
$('ll').oninput = () => { light = +$('ll').value; save(); tune(); };
bHue.onclick = async () => { mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]; show(); save(); await repaint(); };
bWyrd.onclick = async () => { wyrdOn = !wyrdOn; show(); save(); await boards(); stripes(); };
bRail.onclick = () => { railOn = !railOn; show(); save(); stripes(); };
// SANDEKO (User1, 4 xi 2026; after Vespers' rings, deco-sangaku, from Nepali sandheko, mixed by hand): the enclosure
// diagram over the whole talk, yours, hers, and the line you are typing. A circle proper about each sentence, in grey,
// and about each clause, in the ladder's colour of its depth: radius half the span's width, centred on its line, tangent
// at the middle of the space that bonds neighbours. A span broken onto the next line opens a hemicircle at its first
// character and closes one at its last. Brackets are figures: ( ) a circle, [ ] a square, { } a rounded rect. The figures
// compose by difference (the mon, at five percent over black, so stacks zebra) and their hairline edges lie over that; the
// whole sheet lightens the dark page, so a letter, brighter than any line, always wins. Nuage keeps every line herself, so
// the sheet is redrawn from her own DOM on her own events: a line added, a scroll, a resize, a keystroke in the box.
// THE SKY (User1, 5 xi 2026): a depth palette from the top of the sky bell down, Azure, Blue, Steel, Mist, Horizon, the
// great eternal horizontal Riversea beneath it, Umber, Russet, Taupe, Dun, dust to dust. Each ring takes the colour of its depth, the sentence's own ring azure and far, the
// deepest clause dun and near, filled faintly and composed additively, and z-sorted by depth so the near lies over the
// far. The reader is in a world, then, and may take a perspective on it, or type into it. The tray stays as state one.
// Composed as the tray is, by DIFFERENCE (User1: a full exposure, then composited on the animation stand, as Trumbull's
// monolith or Disney's Tron): two rings of one colour overlapping cancel to black, the open aperture, and two of different
// colours give their difference, a third thing and not a brighter one. No cumulation, so no cloud. Black is the through-way.
const SKY = ['#4aa8ff', '#2f6fd6', '#6f8aa8', '#a9b5c2', '#d8c9a8', '#2a7a86', '#8a5a2b', '#a0452a', '#7a6a5a', '#6b5a3e'];   // Azure, Blue, Steel, Mist, Horizon, the Riversea, Umber, Russet, Taupe, Dun
const skyOf = (d) => SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(d / 4 * (SKY.length - 1))))];
const SAND = { op: 0.42, mon: 0.06, width: 0.44, skyMon: 0.5, skyEdge: 0.5 }, bSand = $('sand');   // the light raised a little, since the chrome below takes some
let sandSheet = null, sandT = 0, sandMirror = null;
const sandSplit = (text) => {   // sentences, and within each its clauses with a depth: 0 the sentence's own, 1 after a comma or dash, 2 inside brackets
  const sents = []; let a = 0; for (let i = 0; i < text.length; i++) { if (/[.!?]/.test(text[i]) && (i + 1 >= text.length || /[\s"\u201d)]/.test(text[i + 1]))) { let b = i + 1; while (b < text.length && /["\u201d)]/.test(text[b])) b++; if (text.slice(a, b).trim()) sents.push([a + (text.slice(a).match(/^\s*/)[0].length), b]); a = b; } }
  if (text.slice(a).trim()) sents.push([a + (text.slice(a).match(/^\s*/)[0].length), text.length]);
  return sents.map((sn) => { const segs = []; let c = sn[0], depth = 0; for (let i = sn[0]; i < sn[1]; i++) { const ch = text[i]; if (/[,;:]/.test(ch) || ch === '\u2014' || (ch === '-' && text[i + 1] === '-')) { if (text.slice(c, i).trim()) segs.push([c, i, depth]); c = i + 1; depth = Math.max(depth, 1); } else if (/[(\[{]/.test(ch)) { if (text.slice(c, i).trim()) segs.push([c, i, depth]); c = i + 1; depth = 2; } else if (/[)\]}]/.test(ch)) { if (text.slice(c, i).trim()) segs.push([c, i, depth]); c = i + 1; depth = 1; } }
    if (text.slice(c, sn[1]).trim()) segs.push([c, sn[1], depth]); return { sn, segs: segs.map((g) => { let [x, y, d] = g; while (x < y && /\s/.test(text[x])) x++; while (y > x && /[\s.!?"\u201d]/.test(text[y - 1])) y--; return [x, y, d]; }).filter((g) => g[1] > g[0] + 1 && (segs.length > 1)) }; });
};
const sandFlat = (el) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentNode.closest('[data-wb-tri],.pk-fig,.nfig,svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }), at = []; let text = '', n; while ((n = tw.nextNode())) { for (let i = 0; i < n.data.length; i++) { at.push(n, i); text += /\s/.test(n.data[i]) ? ' ' : n.data[i]; } } return { text, at }; };
const sandDraw = (text, groups, rangeOf, base, sw, clip, out, sky) => {
  const f = (x) => x.toFixed(1), hue = (d) => sky ? skyOf(d) : d <= 0 ? '#8f98a5' : RUNG[Math.min(d, RUNG.length - 1)] || RUNG[1]; let zd = 0;   // zd: the depth of the ring being drawn, for the sky's z-sort
  const rects = (a, b) => { const rs = rangeOf(a, b).getClientRects(), q = []; for (const r of rs) { if (r.width < 1) continue; const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (clip && (cx < clip.l || cx > clip.r || cy < clip.t || cy > clip.b)) continue; q.push({ l: r.left - base.left, r: r.right - base.left, y: r.top - base.top + r.height / 2, h: r.height }); } return q; };
  // aerial perspective in the sky: the far rings fainter, the near fuller
  const styles = (col) => sky ? [' fill="none" stroke="' + col + '" stroke-opacity="' + (0.3 + 0.1 * zd).toFixed(2) + '" stroke-width="' + SAND.width + '" stroke-linecap="round"', ' stroke="none" fill="' + col + '" fill-opacity="' + (0.6 + 0.1 * zd).toFixed(2) + '" style="mix-blend-mode:difference"'] : [' fill="none" stroke="' + col + '" stroke-opacity="' + SAND.op + '" stroke-width="' + SAND.width + '" stroke-linecap="round"', ' stroke="none" fill="#fff" style="mix-blend-mode:difference"'];
  const push = (piece) => (piece.indexOf('mix-blend-mode:difference') >= 0 ? out.mon : out.edge).push(piece);   // the mon (the fills, by difference) and the edges, in the tray and in the sky alike
  const ring = (a, b, col) => { const q = rects(a, b); let w = 0; if (!q.length) return; if (a > 0 && text[a - 1] === ' ') q[0].l -= sw / 2; if (text[b] === ' ') q[q.length - 1].r += sw / 2; q.forEach((r) => { w += r.r - r.l; }); const R = w / 2, [stk, fil] = styles(col);
    if (q.length === 1) { const cc = ' cx="' + f(q[0].l + R) + '" cy="' + f(q[0].y) + '" r="' + f(R) + '"'; push('<circle' + cc + fil + '/>'); push('<circle' + cc + stk + '/>'); return; }
    const o0 = q[0], c = q[q.length - 1], dO = 'M' + f(o0.l + R) + ' ' + f(o0.y - R) + ' A' + f(R) + ' ' + f(R) + ' 0 0 0 ' + f(o0.l + R) + ' ' + f(o0.y + R), dC = 'M' + f(c.r - R) + ' ' + f(c.y - R) + ' A' + f(R) + ' ' + f(R) + ' 0 0 1 ' + f(c.r - R) + ' ' + f(c.y + R);
    push('<path d="' + dO + 'Z"' + fil + '/>'); push('<path d="' + dO + '"' + stk + '/>'); push('<path d="' + dC + 'Z"' + fil + '/>'); push('<path d="' + dC + '"' + stk + '/>'); };
  const figure = (kind, a, b) => { if (kind === '(') { ring(a, b, '#9fb6c9'); return; } const q = rects(a, b); let w = 0; if (!q.length) return; q.forEach((r) => { w += r.r - r.l; }); const [stk, fil] = styles('#9fb6c9'), o0 = q[0], H = o0.h * 1.5, rr = Math.min(H / 2, w / 2);
    if (q.length !== 1) return; const el = kind === '[' ? '<rect x="' + f(o0.l) + '" y="' + f(o0.y - w / 2) + '" width="' + f(w) + '" height="' + f(w) + '"' : '<rect x="' + f(o0.l) + '" y="' + f(o0.y - H / 2) + '" width="' + f(w) + '" height="' + f(H) + '" rx="' + f(rr) + '"'; push(el + fil + '/>'); push(el + stk + '/>'); };
  groups.forEach(({ sn, segs }) => { zd = 0; ring(sn[0], sn[1], hue(0)); segs.forEach((g) => { zd = 1 + g[2]; ring(g[0], g[1], hue(zd)); }); }); zd = 4;
  const OPEN = '([{', CLOSE = ')]}', st = { '(': [], '[': [], '{': [] }; for (let i = 0; i < text.length; i++) { const ch = text[i]; let k = OPEN.indexOf(ch); if (k >= 0) { st[ch].push(i); continue; } k = CLOSE.indexOf(ch); if (k >= 0 && st[OPEN[k]].length) figure(OPEN[k], st[OPEN[k]].pop(), i + 1); }
};
// THE CHROME (User1): what is scrolled to is nearest, the window's top is furthest in time, and the sheet is lit so: a
// vertical gradation over the chat's window, dark at the top, full at the scroll point, with the chrome's sheen a little
// above the foot, multiplied onto the whole sheet as a mask, and remade at every scroll, since the foot moves with you.
const sandCompose = (out, w, h, sky, win) => (!out.mon.length && !out.edge.length) ? '' : '<defs><linearGradient id="chrome" gradientUnits="userSpaceOnUse" x1="0" y1="' + win.t.toFixed(1) + '" x2="0" y2="' + win.b.toFixed(1) + '"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity=".45"/><stop offset=".86" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".8"/></linearGradient><mask id="chromem"><rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#chrome)"/></mask></defs><g mask="url(#chromem)"><g style="isolation:isolate" opacity="' + (sky ? SAND.skyMon : SAND.mon) + '"><rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#000"/>' + out.mon.join('') + '</g>' + out.edge.join('') + '</g>';   // the mon over black, isolated, so the differences stay among the figures; the edges over it; the chrome over all
const sandView = () => {
  if (!sandOn) { if (sandSheet) sandSheet.innerHTML = ''; return; }
  const cc = $('cc'); if (!sandSheet) { sandSheet = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sandSheet.id = 'sandeko'; sandSheet.setAttribute('aria-hidden', 'true'); cc.appendChild(sandSheet); }
  const sky = sandOn === 2, base = cc.getBoundingClientRect(), orc = o.getBoundingClientRect(), clip = { l: orc.left, t: orc.top, r: orc.right, b: orc.bottom }, out = { mon: [], edge: [] };
  sandSheet.style.mixBlendMode = theme === 'day' ? 'darken' : 'lighten';   // a letter, brighter than any line, always wins
  for (const el of o.querySelectorAll('.u,.n,.e,.pu,.h,.m')) { const r = el.getBoundingClientRect(); if (r.bottom < orc.top || r.top > orc.bottom || el.classList.contains('td')) continue;
    const { text, at } = sandFlat(el); if (!text.trim()) continue; const rangeOf = (a, b) => { const rg = document.createRange(); rg.setStart(at[2 * a], at[2 * a + 1]); rg.setEnd(at[2 * (b - 1)], at[2 * (b - 1) + 1] + 1); return rg; };
    const sp = text.indexOf(' '); let sw = 0; if (sp >= 0) { try { sw = rangeOf(sp, sp + 1).getBoundingClientRect().width; } catch (e) {} } if (!sw) sw = parseFloat(getComputedStyle(el).fontSize) * 0.6;
    try { sandDraw(text, sandSplit(text), rangeOf, base, sw, clip, out, sky); } catch (e) {} }
  // the line being typed: an input has no ranges, so a mirror of its text, in its font, stands behind it and is measured
  if (inp.value.trim()) { if (!sandMirror) { sandMirror = document.createElement('span'); sandMirror.id = 'sand-m'; sandMirror.setAttribute('aria-hidden', 'true'); cc.appendChild(sandMirror); } const cs = getComputedStyle(inp), ir = inp.getBoundingClientRect(); ['font', 'letterSpacing', 'wordSpacing'].forEach((k) => { sandMirror.style[k] = cs[k]; });
    sandMirror.style.left = (ir.left - base.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) - inp.scrollLeft) + 'px'; sandMirror.style.top = (ir.top - base.top) + 'px'; sandMirror.style.height = ir.height + 'px'; sandMirror.textContent = inp.value;
    const node = sandMirror.firstChild, text = inp.value, rangeOf = (a, b) => { const rg = document.createRange(); rg.setStart(node, a); rg.setEnd(node, b); return rg; }, sp = text.indexOf(' '); let sw = 0; if (sp >= 0) sw = rangeOf(sp, sp + 1).getBoundingClientRect().width; if (!sw) sw = parseFloat(cs.fontSize) * 0.6;
    try { sandDraw(text, sandSplit(text), rangeOf, base, sw, { l: ir.left, t: ir.top - 40, r: ir.right, b: ir.bottom + 40 }, out, sky); } catch (e) {} } else if (sandMirror) sandMirror.textContent = '';
  sandSheet.setAttribute('width', base.width); sandSheet.setAttribute('height', base.height); sandSheet.innerHTML = sandCompose(out, base.width, base.height, sky, { t: orc.top - base.top, b: orc.bottom - base.top });
};
const sandSoon = () => { if (!sandOn) return; cancelAnimationFrame(sandT); sandT = requestAnimationFrame(sandView); };
bSand.onclick = () => { sandOn = (sandOn + 1) % 3; show(); save(); sandView(); };   // one click, one step of three: off, the tray, the sky
o.addEventListener('scroll', sandSoon); addEventListener('resize', sandSoon); inp.addEventListener('input', sandSoon); new MutationObserver(sandSoon).observe(o, { childList: true, subtree: true, characterData: true }); if (window.ResizeObserver) new ResizeObserver(sandSoon).observe(o);
document.head.insertAdjacentHTML('beforeend', '<style>#cc{position:relative}#sandeko{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:3}#sand-m{position:absolute;visibility:hidden;white-space:pre;pointer-events:none;line-height:1}</style>');
bLinks.onclick = () => { linksOn = !linksOn; show(); save(); relink(); };
o.addEventListener('mousemove', (e) => { o.style.cursor = linksOn && spanAt(e.clientX, e.clientY) ? 'pointer' : ''; });
o.addEventListener('click', (e) => { if (!linksOn || String(window.getSelection()).trim()) return; const s = spanAt(e.clientX, e.clientY); if (s) ask(N.asking(s.phrase), undefined, true); });
bVoice.onclick = () => { voice = 'ecouter'; show(); save(); }; $('voice2').onclick = () => { voice = 'machine'; show(); save(); }; $('voice3').onclick = () => { voice = 'nuage'; show(); save(); }; $('voice4').onclick = () => { voice = 'miria'; show(); save(); }; $('voice5').onclick = () => { voice = 'arthur'; show(); save(); }; $('voice6').onclick = () => { voice = 'cast'; show(); save(); }; $('voice7').onclick = () => { voice = 'blando'; show(); save(); };   // Voice: one of two, an inline radio (User1)
let audio = null;
let speaking = null;
let lastSaid = store.get('nuage.said') || '', voiceEnd = 0;   // when the voice now speaking will be done, for whoever waits
const hush = () => { voiceEnd = 0; if (speaking) { try { speaking.stop(); } catch (e) {} speaking = null; } if (window.speechSynthesis) speechSynthesis.cancel(); ++rollTok; ++noctTok; const n = $('noct'); if (n) { n.style.opacity = 0; setTimeout(() => { if (n.style.opacity === '0') n.hidden = true; }, 700); } sqIdle(); sizeRoll(); };
{ const showFleur = () => { $('fl-lg').setAttribute('aria-pressed', fleurBig); $('fl-sm').setAttribute('aria-pressed', !fleurBig); };   // Large, or Small only (User1): one on, the other off
  $('fl-lg').onclick = () => { fleurBig = true; showFleur(); save(); }; $('fl-sm').onclick = () => { fleurBig = false; showFleur(); save(); const n = $('noct'); if (n) n.hidden = true; }; showFleur(); }
$('hush').onclick = () => { hush(); if (speakAll) { speakAll = false; showSpeak(); save(); } };   // off: quiet now, and quiet from here on
$('again').onclick = () => { noctGone = false; if (!speakAll) { speakAll = true; showSpeak(); save(); } const ns = o.querySelectorAll('.n'), t = lastSaid || (ns.length ? ns[ns.length - 1].dataset.t : ''); if (t) speak(t); };   // with nothing said yet (a first visit), Speak says her greeting, which sets the tone (User1, 12 xi 2026)   // on: say everything from here on, and the last thing now   // the last thing said, kept, so "show it to me again" works after a waking too
const speak = async (text, most, who, stretch) => {   // one voice at a time: a new reply quiets the last. most: a clip, so many ms at most. who: for the cast. stretch: { whole, at }, a part of a sentence
  if (!text) return; cast = castOf(stretch ? stretch.whole : text, who); if (!most) { lastSaid = text; store.set('nuage.said', text); } if (speaking) { try { speaking.stop(); } catch (e) {} speaking = null; }
  const E = voice !== 'machine' && (await ec());
  if (!E || !E.say) {   // the machine's voice: no score of its own, so the strip rolls by Ecouter's reading of the same words
    if (window.speechSynthesis) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); speechSynthesis.speak(u); const E2 = await ec(); if (E2 && E2.frames) { const fr = E2.frames(text); roll(fr, fr.reduce((a, f) => a + f.ms, 0)); } }
    return;
  }
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  // THE BRIGADE (User1): a long reply is not one haul. It is cut into sentences, and each is built while the one before it
  // plays, scheduled on the audio clock to follow without a seam. The strip and the wall take the whole text's frames at
  // once (frames are cheap, the sound is dear), with the little tail each sentence's sound carries counted in.
  const cut = (p) => { const out = []; while (p.length > 180) { const k = p.lastIndexOf(', ', 160); if (k < 40) break; out.push(p.slice(0, k + 1)); p = p.slice(k + 2); } out.push(p); return out; };   // a long run breaks at a comma
  const parts = most || stretch ? [text] : text.split(/(?<=[.!?:]["\u201d)]?)\s+(?=\S)/).flatMap(cut).filter((p) => p.trim());
  if (parts.length > 1) {
    const frs = parts.map((p) => voiceFrames(E, p)), ats = parts.map((p) => chunks(E, p) || []), phs = parts.map((p) => phonesOf(E, p) || []), TAIL = 120, fr = [], at = [], ph = []; let off = 0;
    frs.forEach((f0, i) => { f0.forEach((f) => fr.push(Object.assign({}, f, { ci: f.ci + off }))); off += ats[i].length; at.push.apply(at, ats[i]); ph.push.apply(ph, phs[i]); fr.push({ ms: TAIL, voice: 0, f: [500, 1500, 2500], ci: off - 1 }); });
    const total = fr.reduce((a, f) => a + f.ms, 0), srcs = [], mine = { stop: () => srcs.forEach((x) => { try { x.stop(); } catch (e) {} }) }; speaking = mine; voiceEnd = performance.now() + total + 400;
    try { noct(fr, total, at); roll(fr, total, { words: at, phones: ph }); } catch (e) {}
    (async () => { let t1 = audio.currentTime + 0.03;
      for (const p of parts) { if (speaking !== mine) return; const pc = (await sayIn(p)) || sayFrames(E, voiceFrames(E, p)); if (speaking !== mine) return; const b = audio.createBuffer(1, pc.length, E.SR); b.getChannelData(0).set(pc); const sr = audio.createBufferSource(); sr.buffer = b; sr.connect(audio.destination); t1 = Math.max(t1, audio.currentTime); sr.start(t1); t1 += b.duration; srcs.push(sr); await new Promise((r) => setTimeout(r, 0)); } })();
    return total;
  }
  if (stretch) {   // frames of the whole sentence; the stretch's own words found by their index; those frames kept, and sung
    const sent = stretch.whole.split(/(?<=[.!?:]["\u201d)]?)\s+(?=\S)/).find((p) => { const i = stretch.whole.indexOf(p); return i <= stretch.at && stretch.at < i + p.length; }) || stretch.whole, inS = stretch.at - stretch.whole.indexOf(sent);
    const wordsAll = [...sent.matchAll(/[A-Za-z0-9'\u2019-]+/g)], w0 = wordsAll.findIndex((m) => m.index + m[0].length > inS), w1 = wordsAll.findIndex((m) => m.index >= inS + text.length), lo = Math.max(0, w0), hi = w1 < 0 ? wordsAll.length : w1;
    const frW = voiceFrames(E, sent), at = chunks(E, sent) || [], keep = frW.filter((f) => { const wd = at[f.ci]; if (!wd) return false; const k = wordsAll.slice(0, hi).map((m) => m[0]).lastIndexOf(wd); return k >= lo; });
    if (keep.length) { const pc = sayFrames(E, keep), ms = pc.length / E.SR * 1000; if (speaking) { try { speaking.stop(); } catch (e) {} } audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const b = audio.createBuffer(1, pc.length, E.SR); b.getChannelData(0).set(pc); const sr = audio.createBufferSource(); sr.buffer = b; sr.connect(audio.destination); sr.start(); speaking = sr; voiceEnd = performance.now() + ms;
      try { noct(keep, ms, at); roll(keep, ms, { words: at, phones: phonesOf(E, sent) }); } catch (e) {} return ms; }
  }
  let fr0 = voiceFrames(E, text), pcm = most ? sayFrames(E, fr0) : ((await sayIn(text)) || sayFrames(E, fr0)); if (speaking) { try { speaking.stop(); } catch (e) {} speaking = null; } if (most && pcm.length / E.SR * 1000 > most) { const full = fr0.reduce((a, f) => a + f.ms, 0); pcm = pcm.subarray(pcm.length - Math.floor(most / 1000 * E.SR)); let acc0 = 0; fr0 = fr0.filter((f) => (acc0 += f.ms) > full - most); }   // the frames' own length, not the sound's, which carries a lead   // the last so many ms: the end is kept, the beginning elided (User1)
  const buf = audio.createBuffer(1, pcm.length, E.SR); buf.getChannelData(0).set(pcm);
  const src = audio.createBufferSource(); src.buffer = buf; src.connect(audio.destination); src.start(); speaking = src;
  const msOut = pcm.length / E.SR * 1000; voiceEnd = performance.now() + msOut;
  try { const fr = fr0, ms = msOut; noct(fr, ms, chunks(E, text)); roll(fr, ms, { words: chunks(E, text), phones: phonesOf(E, text) }); } catch (e) {}
  return msOut;   // how long the voice will take, for whoever must wait for it
};
// THE VOICE'S STRIP (User1: "to hear and see it roll on, the timeline spectro just rolling and rolling as it spoke"):
// pinned at the top of the chat while a voice speaks. Time runs right to left past a 'now' a little in from the right;
// colour is pitch, brightness is strength, sparks are hiss, as in the gallery. What has been said fades as it goes, the
// last in the last out, and when the voice is done the strip rolls on until it is dark, and leaves.
// THE CHUNKS (User1): each frame knows which phone it is (ci); the codes come word by word, so the phone's word is found
const phonesOf = (E, text) => { try { return E.PHONES.split(String(E.codes(sayable(text)))).map((tk) => (/[A-Za-z]/.test(tk) ? tk : '')); } catch (e) { return null; } };   // the phone of each token (ci), or '' for a space or a stop
const chunks = (E, text) => { try { const words = text.match(/[A-Za-z0-9'\u2019-]+/g) || [], toks = E.PHONES.split(String(E.codes(sayable(text)))), at = []; let w = -1, inWord = false;   // ci counts the tokens of the codes, the spaces among them
  for (const tk of toks) { const letter = /[A-Za-z]/.test(tk); if (letter && !inWord) { w++; inWord = true; } if (!letter && /\s/.test(tk)) inWord = false; at.push(letter ? (words[w] || '') : ''); } return at; } catch (e) { return null; } };
let rollTok = 0;
// THE SOUND, DRAWN FROM ITS FRAMES. The strip and the square are both drawn from the voice's frames at a moment t, so
// what is remembered is the frames, not pixels (a canvas read back can stall a browser for seconds), and every memory
// below is the same drawing, redrawn, at a lower light. The frames kept are slimmed to what the drawing reads.
const slim = (fr) => fr.map((f) => ({ ms: Math.round(f.ms), voice: +(f.voice || 0).toFixed(2), f: (f.f || []).map(Math.round), hiss: +(f.hiss || 0).toFixed(2), breath: +(f.breath || 0).toFixed(2), at: f.at ? f.at.map(Math.round) : undefined }));
const evOf = (fr, total) => { let acc = 0; const sum = fr.reduce((a, f) => a + f.ms, 0) || 1, k = total / sum; return fr.map((f) => { const s0 = acc * k; acc += f.ms; return { s0, d: f.ms * k, f }; }); };
const HUE = (hz) => 280 * Math.max(0, Math.min(1, Math.log(Math.max(250, hz) / 250) / Math.log(14)));
const PX = 0.22, FADE = 2600, BIN = (hz) => Math.max(0, Math.min(8, Math.floor(9 * Math.log(Math.max(150, hz) / 150) / Math.log(40))));   // nine bins, the strip's own pitch scale folded
const drawStrip = (g, W, H, ev, t, lum, L) => {   // time runs right to left past a 'now' at the right edge, on the fleuriant's edge
  const NOW = W - 1, y = (hz) => H - 14 - (H - 28) * Math.max(0, Math.min(1, Math.log(Math.max(150, hz) / 150) / Math.log(40)));
  g.globalCompositeOperation = 'lighter';
  for (const e of ev) {
    if (e.s0 > t) continue; const end = Math.min(t, e.s0 + e.d), age = t - end, fade = Math.exp(-age / FADE) * lum; if (fade < 0.004) continue;
    const x1 = NOW - (t - e.s0) * PX, x2 = NOW - (t - end) * PX, w = Math.max(1, x2 - x1), v = e.f.voice || 0, h = Math.min(1, (e.f.hiss || 0) + (e.f.breath || 0));
    if (v > 0.03) e.f.f.forEach((hz, j) => { const cy = y(hz), ry = 4 + 2 * j, gr = g.createLinearGradient(0, cy - ry, 0, cy + ry), c = 'hsla(' + HUE(hz).toFixed(0) + ',90%,62%,'; gr.addColorStop(0, c + '0)'); gr.addColorStop(0.5, c + (fade * v * [0.9, 0.7, 0.5][j]).toFixed(3) + ')'); gr.addColorStop(1, c + '0)'); g.fillStyle = gr; g.fillRect(x1, cy - ry, w, 2 * ry); });
    if (h > 0.03) { const at = e.f.at || [1800, 2400], ya = y(at[0] + at[1] / 2), yb = y(Math.max(160, at[0] - at[1] / 2)); g.fillStyle = 'hsla(' + HUE(at[0]).toFixed(0) + ',55%,85%,' + (fade * h).toFixed(3) + ')'; let sd = Math.round(e.s0 * 7) + 11; for (let n = Math.round(w * (yb - ya) * h * 0.12); n > 0; n--) { sd = (sd * 1103515245 + 12345) & 0x7fffffff; const px = x1 + (sd % 1000) / 1000 * w; sd = (sd * 1103515245 + 12345) & 0x7fffffff; const py = ya + (sd % 1000) / 1000 * (yb - ya); g.fillRect(px, py, 1, 1); } }
  }
  g.globalCompositeOperation = 'source-over';
  if (L) {   // TWO TYPESTREAMS (User1): the phones above, as the teardown writes them, and the words below, a subtitle running left with the sound
    g.font = '10px ui-monospace,Consolas,monospace'; g.textBaseline = 'alphabetic'; let ci = -1, word = '';
    for (const e of ev) { if (e.s0 > t || e.f.ci === ci) continue; ci = e.f.ci; const x = NOW - (t - e.s0) * PX, fade = Math.exp(-Math.max(0, t - e.s0 - e.d) / FADE) * lum; if (x < -40 || fade < 0.02) continue;
      const p = L.phones && L.phones[ci]; if (p) { g.fillStyle = 'rgba(176,170,158,' + (0.9 * fade).toFixed(3) + ')'; g.fillText(p, x, 11); }
      const wd = L.words && L.words[ci]; if (wd && wd !== word) { word = wd; g.fillStyle = 'rgba(216,208,192,' + (0.9 * fade).toFixed(3) + ')'; g.fillText(wd, x, H - 4); } else if (!wd) word = ''; }
  }
};
const drawSquare = (q, ev, t, lum) => {   // THE SQUARE (User1): the spectrogram box-reduced to nine bands, low at the foot, a pixel of black between, the last 1.8 seconds running right to left
  const S = 36, PXS = S / 1800; q.globalCompositeOperation = 'lighter';
  for (const e of ev) { if (e.s0 > t) continue; const end = Math.min(t, e.s0 + e.d), fade = Math.exp(-(t - end) / FADE) * lum, x1 = S - (t - e.s0) * PXS, x2 = S - (t - end) * PXS; if (x2 < 0) continue; const v = e.f.voice || 0, h = Math.min(1, (e.f.hiss || 0) + (e.f.breath || 0)), w = Math.max(1, x2 - x1);
    if (v > 0.03) e.f.f.forEach((hz, k0) => { q.fillStyle = 'hsla(' + HUE(hz).toFixed(0) + ',85%,60%,' + (fade * v * [1, 0.75, 0.55][k0]).toFixed(3) + ')'; q.fillRect(x1, (8 - BIN(hz)) * 4, w, 3); });
    if (h > 0.03) { const hz = (e.f.at || [1800])[0]; q.fillStyle = 'hsla(' + HUE(hz).toFixed(0) + ',40%,80%,' + (fade * h * 0.8).toFixed(3) + ')'; q.fillRect(x1, (8 - BIN(hz)) * 4, w, 3); } }
  q.globalCompositeOperation = 'source-over';
};
const squareFloor = (q) => { q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; q.fillStyle = '#000'; q.fillRect(0, 0, 36, 36); q.fillStyle = '#1a1f26'; for (let b = 0; b < 9; b++) q.fillRect(0, b * 4, 1, 3); };   // nine dark bands, a faint left edge each, so the square is seen to be nine even when quiet
// THE IDLE GRAPH (User1): when no voice has spoken for a while the square shows what has been heard: the first sound's
// attack, kept from the first time it ever spoke, and the last sound's release, kept from the latest, blended additively
// at 64 percent. With every voice heard the first counts a little less, and the latest tail a little more, so the
// control shows what its reader has seen and heard. Kept in this browser, with the rest of her memory.
let sqMem = {}; try { sqMem = JSON.parse(store.get('nuage.sq') || '{}'); if (typeof sqMem.first === 'string') sqMem = {}; } catch (e) {}
const sqIdle = () => { const q = $('sq').firstElementChild.getContext('2d'), n = sqMem.n || 0, f = Math.pow(0.9, Math.max(0, n - 1)); squareFloor(q);
  if (sqMem.first) drawSquare(q, evOf(sqMem.first.fr, sqMem.first.total), sqMem.first.t, 0.64 * f); if (sqMem.last) drawSquare(q, evOf(sqMem.last.fr, sqMem.last.total), sqMem.last.t, 0.64 + 0.36 * (1 - f)); };
const sqKeep = (k, fr, total, t) => { sqMem[k] = { fr: slim(fr), total, t }; if (k === 'last') sqMem.n = (sqMem.n || 0) + 1; store.set('nuage.sq', JSON.stringify(sqMem)); };
sqIdle();
// REMANENCE (User1): when the voice ends the strip snaps to black, as a tube does, and then, as its circuits discharge,
// the last thing shown surfaces as a latent image, never brighter than 22 percent of the range, and kept, so a blank
// display has a memory. It vanishes the instant a real signal takes over.
let rem = null; try { rem = JSON.parse(store.get('nuage.rem') || 'null'); if (rem && !rem.fr) rem = null; } catch (e) {}
const remanence = (g, W, H, a) => { if (rem) drawStrip(g, W, H, evOf(rem.fr, rem.total), rem.t, Math.min(0.22, a), rem.L); };
const sizeRoll = () => { const cv = $('roll'); if (!cv || $('rl').hidden) return; const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cv.clientHeight || 74; cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); cv.style.opacity = 1; remanence(g, W, H, 0.22); };
const roll = (fr, total, L) => {
  const cv = $('roll'), sq = $('sq').firstElementChild, tok = ++rollTok, strip = !$('rl').hidden; if (strip) sizeRoll();
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cv.clientHeight || 74, g = cv.getContext('2d'), q = sq.getContext('2d'), ev = evOf(fr, total), t0 = performance.now();
  let snapped = false, took = false, kept = false, idle = false;
  const draw = () => {
    if (tok !== rollTok) return;
    const t = performance.now() - t0;
    if (strip) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (t < total) { drawStrip(g, W, H, ev, t, 1, L); const ng = g.createLinearGradient(0, 0, 0, H); ng.addColorStop(0, 'rgba(244,241,234,0)'); ng.addColorStop(0.5, 'rgba(244,241,234,.35)'); ng.addColorStop(1, 'rgba(244,241,234,0)'); g.fillStyle = ng; g.fillRect(W - 1, 0, 1, H); }   // the now, a hair of light at the edge
      else { if (!snapped) { snapped = true; rem = { fr: slim(fr), total, t: total, L }; store.set('nuage.rem', JSON.stringify(rem)); } remanence(g, W, H, 0.22 * Math.min(1, Math.max(0, t - total - 400) / 4000)); }   // snapped to black, then the latent image surfaces
    }
    if (!sqMem.first && t >= Math.min(total, 1800) && !took) { took = true; sqKeep('first', fr, total, t); }   // the first sound ever heard, its attack, kept once
    if (t >= total + 1500 && !kept) { kept = true; sqKeep('last', fr, total, t); }   // the last sound's release, a breath and a half after it ends, kept
    if (t > total + 2000) { if (!idle) { idle = true; sqIdle(); } } else { squareFloor(q); drawSquare(q, ev, t, 1); }   // the last sound has rolled out of the square: the idle graph takes over
    if (t < total + 4500) requestAnimationFrame(draw);   // on until the square is idle and the remanence has surfaced
  };
  requestAnimationFrame(draw);
};
// A FLEURIANT, CLICKED (User1's word for the noctilucent soniforms): the picture plays from its start, and the word is
// said with it, in Ecouter's voice, or in the machine's if that is the voice chosen.
const sound = async (svg, word, F) => {
  if (!svg || !F) return; svg.pauseAnimations();
  let rate = F.SLOW || 4; const E = voice !== 'machine' && (await ec()); let src = null;
  if (E && E.say) { const pcm = sayFrames(E, voiceFrames(E, word)); audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const buf = audio.createBuffer(1, pcm.length, E.SR); buf.getChannelData(0).set(pcm); src = audio.createBufferSource(); src.buffer = buf; src.connect(audio.destination); rate = (F.SLOW || 4) * (F.ms || 1) / (pcm.length / E.SR * 1000); }
  const tok = {}; svg._tok = tok;
  requestAnimationFrame(() => {
    const t0 = performance.now(); if (src) src.start(); else if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(word)); }
    const tick = (now) => { if (svg._tok !== tok) return; const t = (now - t0) * rate; if (t >= F.D) { svg.setCurrentTime((F.D - 1) / 1000); return; } svg.setCurrentTime(t / 1000); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
};
bTalk.onclick = () => {   // the selection, if there is one on the page; else Nuage's last reply
  const S = window.getSelection ? window.getSelection() : null, sel = String(S || '').trim(), ns = o.querySelectorAll('.n');
  if (!sel) { speak(ns.length ? ns[ns.length - 1].dataset.t : ''); return; }
  // A STRETCH (User1): a highlighted part is read broken as it is, yet knowing it was once together: the arc is that of the
  // whole sentence it was cut from, and only the cut is sounded, so a fragment arrives mid-swell, where it lived.
  let whole = null, at = -1; try { const n = S.anchorNode, el = n && (n.nodeType === 1 ? n : n.parentElement), line = el && el.closest('.u,.n,.e,.m,.pu,.h'); if (line && line.dataset.t) { whole = line.dataset.t; at = whole.indexOf(sel); } } catch (e) {}
  if (whole && at >= 0) speak(sel, 0, undefined, { whole, at }); else speak(sel);
};
// SPEAK EVERY REPLY: with this on, each of Nuage's replies is said aloud as it comes, and the wall rings beside the talk
const bSpeak = document.createElement('button'); bSpeak.id = 'speakall'; bTalk.after(bSpeak); const bReq = document.createElement('button'); bReq.id = 'speakreq'; bReq.textContent = 'Speak every request'; bReq.title = 'Your line, read by Blando, before she answers'; bSpeak.after(bReq); bReq.onclick = () => { speakReq = !speakReq; bReq.setAttribute('aria-pressed', speakReq); save(); }; bReq.setAttribute('aria-pressed', speakReq);
const showSpeak = () => { bSpeak.textContent = 'Speak every reply'; bSpeak.setAttribute('aria-pressed', speakAll); $('again').setAttribute('aria-pressed', speakAll); $('hush').setAttribute('aria-pressed', !speakAll); };   // Speak and Shoosh: one on, the other off, never the same colour (User1's car radio)
bSpeak.onclick = () => { speakAll = !speakAll; showSpeak(); save(); }; showSpeak();
NUAGE.after.push((q, r) => { if (speakAll && !isPicture(r)) speak(r, 0, 'n'); });
// NOCTILUCENCE IN THE WINDOW (User1): while Ecouter speaks, a small round wall at the upper right of the conversation,
// like an interpreter in a corner of the screen, shows each sound arriving as a ring. Colour is pitch (red low, violet
// high), brightness is strength, the shape is geared by the formants, a hiss is a burr; every ring spreads, slows, and
// fades, the last in the last out. It is there only while the voice is, and goes when its light has gone.
let noctTok = 0;
const noct = (fr, total, at) => {
  const ntok = ++noctTok;   // one wall at a time: a new voice ends the old wall's loop
  let cv = $('noct'); if (!cv) { document.body.insertAdjacentHTML('beforeend', '<canvas id=noct width=360 height=360 aria-hidden=true title="Tap to put the Fleuriant away until the next reply"></canvas>'); cv = $('noct');
    // TAPPED AWAY (User1, 12 xi 2026: "when I don't want it, I cannot resist to tap it away, though that does nothing. Would that it
    // did, and continue again once the next utterance is underway"). It goes for the rest of this reply and is back with the next.
    cv.onclick = () => { noctGone = true; cv.style.opacity = 0; setTimeout(() => { if (noctGone) cv.hidden = true; }, 350); }; }
  if (!fleurBig || noctGone) { cv.hidden = true; return; }
  const r0 = o.getBoundingClientRect(), room = innerWidth - r0.right - 16, out = room >= 120, sz = out ? Math.min(180, room) : 180;   // in the margin beside the talk if there is room, else in its upper right corner
  cv.style.width = cv.style.height = sz + 'px'; cv.style.top = (r0.top + 8) + 'px'; cv.style.left = (out ? r0.right + 8 : r0.right - sz - 16) + 'px'; cv.hidden = false; cv.style.opacity = 1;
  const g = cv.getContext('2d'), S = 360, C = S / 2, R = S * 0.45, LIFE = 1100;
  let acc = 0; const rs = fr.map((f) => { const s0 = acc; acc += f.ms; return { s0, f }; }), k = acc ? total / acc : 1;
  const hue = (hz) => 280 * Math.max(0, Math.min(1, Math.log(Math.max(250, hz) / 250) / Math.log(14)));
  const shape = (rad, lb) => { g.beginPath(); for (let a = 0; a <= 180; a++) { const th = a / 90 * Math.PI, rr = rad * (1 + lb.reduce((x, q) => x + q.a * Math.cos(q.n * th), 0)); a ? g.lineTo(C + rr * Math.sin(th), C - rr * Math.cos(th)) : g.moveTo(C + rr * Math.sin(th), C - rr * Math.cos(th)); } g.stroke(); };
  const draw = () => {
    if (ntok !== noctTok) return;
    const now = performance.now() - t0; let live = 0;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
    const sg = g.createRadialGradient(C, C, 0, C, C, C); sg.addColorStop(0, 'rgba(143,152,165,.2)'); sg.addColorStop(1, 'rgba(143,152,165,0)');
    g.strokeStyle = sg; g.lineWidth = 1; g.beginPath(); g.moveTo(C, 0); g.lineTo(C, S); g.moveTo(0, C); g.lineTo(S, C); g.stroke();   // the four slits, fading as they go out: no hard edge anywhere
    g.globalCompositeOperation = 'lighter';
    for (const r of rs) {
      const age = now - r.s0 * k; if (age < 0) { live++; continue; } if (age > LIFE) continue; live++;
      const u = age / LIFE, rad = R * (1 - Math.pow(1 - u, 3)), fade = (1 - u) * (1 - u), f = r.f, v = f.voice || 0, h = Math.min(1, (f.hiss || 0) + (f.breath || 0));
      g.lineWidth = Math.max(1.5, f.ms * k / LIFE * R);
      if (v > 0.03) { g.setLineDash([]); g.strokeStyle = 'hsla(' + hue(f.f[1]).toFixed(0) + ',90%,60%,' + (fade * (0.3 + 0.7 * v)).toFixed(3) + ')'; shape(rad, [1, 2].map((j) => ({ n: Math.max(2, Math.round(f.f[j] / f.f[0])), a: [0, 0.075, 0.045][j] }))); }
      if (h > 0.03) { const at = f.at || [1800, 2400], n = Math.max(6, Math.round(at[0] / 250)); g.setLineDash([1.5, 6 - 4 * h]); g.strokeStyle = 'hsla(' + hue(at[0]).toFixed(0) + ',90%,82%,' + (fade * (0.45 + 0.5 * h)).toFixed(3) + ')'; shape(rad, [{ n, a: 0.05 }, { n: n + 3, a: 0.03 }]); }
    }
    if (live) requestAnimationFrame(draw2); else { cv.style.opacity = 0; setTimeout(() => { if (ntok === noctTok && cv.style.opacity === '0') cv.hidden = true; }, 700); }
  };
  const fl = $('fl'), fq = fl.firstElementChild.getContext('2d'), fs = fl.lastElementChild, draw0 = draw, draw2 = () => { draw0(); if (fl.offsetParent) { fq.drawImage(cv, 0, 0, 152, 152); const now = performance.now() - t0; let cur = null; for (const r of rs) if (r.s0 * k <= now) cur = r; fs.textContent = cur && at && at[cur.f.ci] !== undefined ? at[cur.f.ci] : ''; } };   // the fleuriant square in the strip's row sees the same wall, and names the chunk being spoken
  const t0 = performance.now(); requestAnimationFrame(draw2);
};
bForget.onclick = () => ask('Forget everything.');
const setTheme = async (name) => {
  theme = name; T = TH[name]; sandSoon(); LADDER = T.ladder; RUNG = [T.rung0].concat(LADDER.slice(1).map(rgb)); TURN = T.turn; INK = { u: T.user, n: T.ink };
  document.documentElement.dataset.theme = name; document.querySelectorAll('#hd [data-th]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.th === name)); save();
  if (mode !== 'off') await repaint(); if (wyrdOn) await boards(); stripes(); o.querySelectorAll('.p').forEach(paintPicture); relink();
};
document.querySelectorAll('#hd [data-th]').forEach((b) => (b.onclick = () => setTheme(b.dataset.th)));
const setSize = (dir) => { size = SIZES[Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(size) + dir))]; document.documentElement.style.fontSize = size + '%'; $('fs-dn').disabled = size === SIZES[0]; $('fs-up').disabled = size === SIZES[SIZES.length - 1]; save(); relink(); };
$('fs-dn').onclick = () => setSize(-1); $('fs-up').onclick = () => setSize(1);
// CHAT ZOOM (User1): the conversation alone grows or shrinks, the frame around it staying put
const setChat = (dir) => { chatZoom = Math.round(Math.max(0.7, Math.min(2.2, chatZoom + dir * 0.1)) * 10) / 10; o.style.fontSize = chatZoom + 'em'; inp.style.fontSize = Math.round(chatZoom * 1.087 * 1000) / 1000 + 'em'; $('cz-dn').disabled = chatZoom <= 0.7; $('cz-up').disabled = chatZoom >= 2.2; $('cz-l').title = 'Chat at ' + Math.round(chatZoom * 100) + '%'; save(); try { relink(); } catch (e) {} };
$('cz-dn').onclick = () => setChat(-1); $('cz-up').onclick = () => setChat(1); setChat(0);
document.querySelectorAll('#hd [data-th]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.th === theme)); setSize(0);
{ const hello = N.chat('hello'); say('n', hello); gistFrom = N.turns(); sonti();   // the greeting is Nuage's own, not part of what you asked
  // and said aloud, if every reply is to be (User1). A browser may hold the sound until the page is touched, so if the
  // audio is held the hello waits for the first touch, and is said then: she says hello when you come in.
  if (speakAll) { const hi = async () => { await speak(hello, 0, 'n'); if (audio && audio.state === 'suspended') { const once = () => { audio.resume(); }; addEventListener('pointerdown', once, { once: true }); addEventListener('keydown', once, { once: true }); } }; hi(); } }   // never said twice: the touch only lets the waiting hello out (User1's report: she cut in over the teardown box)
showGist();   // preverbal review: the last conversation's gist is the first thing read on waking
[inp, btn, bTilt, bWyrd, bRail, bSand, bLinks, bHue, bTalk, bVoice, $('voice2'), $('voice3'), $('voice4'), $('voice5'), $('voice6'), $('voice7'), bForget].forEach((e) => (e.disabled = false)); show(); inp.focus();
if (!H.ln) { bTilt.hidden = bWyrd.hidden = bHue.hidden = true; voice = 'machine'; show(); }
tune();
if (mode !== 'off' || tilt) repaint();   // the reader's own settings, kept from last time
if (wyrdOn) boards().then(stripes); else stripes();
// SAMPLE CHAT: from what Nuage can do, to what it cannot do yet; then the floor is yours
let sampling = false;
$('send').onclick = () => { if (inp.value.trim()) inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); inp.focus(); };
// THE SCRIPT (User1): the sample chat is a script anyone may read, change, and play back as their own. It is kept in this
// browser; "Built-in" brings back the one she came with. A line that starts with # is a heading in the talk.
const script = () => { const v = store.get('nuage.script'); return v !== null && v !== '' ? v : N.sample.join('\n'); };
document.body.insertAdjacentHTML('beforeend', '<dialog id=sc class=bx aria-labelledby=sc-h><header><h2 id=sc-h>Script</h2><button id=sc-x>Close</button></header><div><p class=note>The sample chat, line by line. Change it, play it, and it stays yours. A line beginning with # is a heading.</p><textarea id=sc-t rows=16 spellcheck=false></textarea><p><button id=sc-play>Play</button><button id=sc-save>Save</button><button id=sc-reset>Built-in</button></p></div></dialog>');
document.head.insertAdjacentHTML('beforeend', '<style>#sc-t{width:100%;box-sizing:border-box;font:inherit;background:var(--btn);color:var(--user);border:1px solid var(--btnline);border-radius:4px;padding:.4rem .6rem;resize:vertical}#sc .note{color:var(--desc)}</style>');
const scd = $('sc'); $('sc-x').onclick = () => scd.close(); scd.addEventListener('click', (e) => { if (e.target === scd) scd.close(); });
$('sc-save').onclick = () => { store.set('nuage.script', $('sc-t').value); $('sc-save').textContent = 'Saved'; setTimeout(() => { $('sc-save').textContent = 'Save'; }, 1200); };
$('sc-reset').onclick = () => { store.del('nuage.script'); $('sc-t').value = N.sample.join('\n'); };
const play = async (lines) => {   // a second click, while it runs, stops it harmlessly at the end of the line it is on
  if (sampling) { sampling = false; $('sc-play').textContent = 'Stopping'; return; }
  sampling = true; inp.disabled = true; $('sc-play').textContent = 'Stop'; scd.close();
  for (const q of lines) {
    if (!sampling) break; if (!q.trim()) continue;
    if (q[0] === '#') { say('h', q.slice(1).trim()); continue; }
    // each line goes in through the chat line itself, as if typed, so the panel's "Answers from" and Mimia's "joins in" hold (User1: the script encasts her)
    inp.disabled = false; inp.value = q; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); inp.disabled = true;
    await new Promise((r) => setTimeout(r, 380)); while (performance.now() < voiceEnd + 300 || busy) await new Promise((r) => setTimeout(r, 120));   // said, and heard out, before the next line
  }
  sampling = false; store.set('nuage.memory', N.remember()); gistFrom = N.turns();   // the sample chat is a demonstration, not our conversation: the gist begins after it
  $('sc-play').textContent = 'Play'; inp.disabled = false; inp.focus();
};
$('sc-play').onclick = () => play($('sc-t').value.split('\n'));
btn.onclick = () => { if (sampling) { play(); return; } $('sc-t').value = script(); scd.showModal(); };
let hist = []; try { hist = JSON.parse(store.get('nuage.hist') || '[]'); } catch (e) {} let hAt = hist.length, draft = '';   // what you typed and sent, the last fifty, for the arrow keys
inp.onkeydown = (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { if (!hist.length) return; if (hAt === hist.length) draft = inp.value; hAt = Math.max(0, Math.min(hist.length, hAt + (e.key === 'ArrowUp' ? -1 : 1))); inp.value = hAt === hist.length ? draft : hist[hAt]; e.preventDefault(); inp.setSelectionRange(inp.value.length, inp.value.length); return; }
  if (e.key !== 'Enter' || !inp.value.trim()) return; const q = inp.value; inp.value = ''; if (hist[hist.length - 1] !== q) hist.push(q); hist = hist.slice(-50); hAt = hist.length; draft = ''; store.set('nuage.hist', JSON.stringify(hist)); ask(q); };

// PATTY-CAKE lives with its janitor, in patty/panel.js: a workshop tool, fetched only when Nuage is served beside it, so
// the page itself carries none of it. It is evaluated here, in this scope, so it sees $, ask, say, and the rest.
if (/^https?:/.test(location.protocol)) fetch(new URL('../patty/panel.js', location.href)).then((r) => (r.ok ? r.text() : '')).then((t) => { if (t) eval(t); }).catch((e) => console.error('Patty-cake panel: ' + e.message));   // a fault in the panel is said aloud, never swallowed
