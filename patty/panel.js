/* panel.js -- Patty-cake's panel: the engine (classic, impeccable, or fantastic), the jobs (questions or conversations),
   the cards for your ruling, the watched pupil, and answers from Nuage, the engine, or both. It is a workshop tool, so it
   lives here beside its janitor (patty.php), not in the page: ui.js fetches it only when Nuage is served over the web,
   and evaluates it in its own scope, where $, ask, say, inp, btn, and o are already known. */
document.head.insertAdjacentHTML('beforeend', '<style>#pk{border-top:1px solid var(--line);margin:.2rem 0 .4rem;max-height:40vh;overflow-y:auto}#lc #pk{max-height:none}#pk p{margin:.5rem 0}#pk select{font:inherit;background:var(--btn);color:var(--user);border:1px solid var(--btnline);padding:.15rem .3rem}#pk select option{background:var(--bg);color:var(--desc)}#pk select option:checked{color:var(--user)}#pk p{color:var(--desc)}#pk .info,#pk-et,#pk-msg,#pk-mt,#pk-ws,#pk-ct{color:var(--ink)}#o .td{white-space:normal}#o .pk-fig{text-align:right}#o .pk-fig svg{max-width:100%;height:auto}#o .pk-fig+.td{border-top:0;margin-top:0;padding-top:.3rem}#o .td dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:.2rem 2ch;margin:0}#o .td.tilted dd{position:relative}#o .td dt{color:var(--head)}#o .td dd{margin:0}#o .td .teach{all:unset;cursor:pointer;color:var(--user);border:1px solid var(--line);border-radius:999px;padding:0 .45em;margin-right:.6em;font-size:.85em;opacity:.76}#o .td .teach:hover{opacity:1;border-color:var(--dim)}#o .subtil{border:1px solid rgba(128,128,128,.09);border-radius:4px;padding:0 .3em;margin:0 -.3em;cursor:pointer;background:none;transition:border-color .15s,color .15s}#o .subtil:hover{border-color:rgba(128,128,128,.24);background:none;color:var(--user)}#o .qt{cursor:pointer;text-decoration:underline dotted;text-underline-offset:.2em}#o .qt:hover{color:var(--ink)}#o .td .wl{color:#f4f4f4}[data-theme=day] #o .td .wl{color:var(--ink)}#o .td .sup{color:var(--dim)}#o .td div.sup{margin:0}.pk-fig svg{max-width:100%;height:auto;vertical-align:top;margin:.2rem .6rem .2rem 0}#pk input:not([type=checkbox]){font:inherit;background:var(--btn);color:var(--user);border:1px solid var(--btnline);padding:.1rem .3rem}#pk input::placeholder{color:var(--dim);opacity:1}.pk-card label{display:block;margin:.3rem 0}#pk-dot{color:var(--dark)}.pk-card{border:1px solid var(--line);border-radius:4px;padding:.15rem .6rem;margin:2px 0}.pk-card summary{color:var(--user);cursor:pointer;line-height:1.5}.pk-card[open]{padding-bottom:.4rem}.pk-card pre{margin-top:.4rem}.pk-card pre{margin:0 0 .4rem;white-space:pre-wrap;font:inherit}.pk-card button{margin-right:.5rem}#o .e:before{content:attr(data-who) ": ";color:var(--dim)}</style>');
$('t').insertAdjacentHTML('beforeend', '<button id=pk-open aria-expanded=false>Patty-cake</button>');
$('t').insertAdjacentHTML('afterend', "<div id=pk hidden><p id=pk-lib><button id=pk-words>Fetch the word libraries</button> <button id=pk-swp title=\"A shard of Simple English Wikipedia, on this machine and never shipped: for the mirror's light and for citations\">Fetch Simple Wikipedia</button> <span id=pk-ws></span></p><p id=pk-eng><span id=pk-dot>\u25cf</span> <span id=pk-et>Looking for the engine.</span> <select id=pk-m aria-label=\"Which engine\"><option value=classic>Qwen2.5 1.5B, the classic</option><option value=impeccable>Qwen3.5 9B, impeccable</option><option value=fantastic>Gemma 4 E4B, fantastic</option></select> <button id=pk-start>Start the engine</button> <button id=pk-stop>Rest the engine</button> <button id=pk-fetch hidden>Fetch llama.cpp</button></p><p><button id=pk-run>Run patty-cake</button> with <select id=pk-n aria-label=\"How many\"><option>10</option><option>50</option><option selected>200</option><option>1000</option></select> <select id=pk-mode aria-label=\"Of what\"><option value=q>questions</option><option value=t>conversations</option><option value=m>the mirror (Mimia's light)</option></select>. <label><input type=checkbox id=pk-rest checked> Rest the engine when done</label> <button id=pk-cancel hidden>Cancel the job</button></p><p>Answers from <select id=pk-by aria-label=\"Answers from\"><option value=n>Nuage</option><option value=e>the engine</option><option value=b>both, Nuage first</option><option value=m>Mimia, the mirror</option></select>, to compare them. <label><input type=checkbox id=pk-mj> Mimia joins in where Nuage cannot answer</label></p><p id=pk-mim><button id=pk-phys title=\"The physium: Mimia as a stone, every trit a filament, lit as a word passes through her\">Physium</button> <button id=pk-grind>Grind Mimia</button> at <select id=pk-msz aria-label=\"Mimia's size\"><option value=512>127 KB</option><option value=1024>250 KB</option><option value=2048>500 KB, a 128 KB core inside</option></select>, <select id=pk-mep aria-label=\"How long to grind\"><option value=12>12 passes</option><option value=30>30 passes</option></select> <span id=pk-mt></span></p><p id=pk-wd><input id=pk-w size=22 aria-label=\"A word to tear down\" placeholder=\"Tear down a word\"></p><p><button id=pk-watch>Watch a pupil talk</button> here, in the conversation. <label><input type=checkbox id=pk-tap> Typing sounds</label></p><p id=pk-msg aria-live=polite></p><div id=pk-cards></div><p><button id=pk-pack hidden>Rebuild Nuage with the kept cards</button> <button id=pk-cuts>Build the four cuts</button> <span id=pk-ct></span></p></div>");
(async () => {
  const P = (q) => fetch(new URL('../patty/patty.php?' + q, location.href)).then((r) => r.json()), E = (q) => fetch(new URL('../../__demo/engine.php?do=' + q, location.href)).then((r) => r.json());
  const open = $('pk-open'), pk = $('pk');
  open.hidden = false;   // served over the web: offer the panel, and if the janitor does not answer, say why rather than hide
  let st; try { const r0 = await fetch(new URL('../patty/patty.php?do=status', location.href)), t0 = await r0.text(); try { st = JSON.parse(t0); } catch (e) { throw new Error('the janitor answered ' + r0.status + ', not in JSON: ' + t0.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)); } }
  catch (e) { open.onclick = () => { pk.hidden = !pk.hidden; open.setAttribute('aria-expanded', !pk.hidden); }; $('pk-eng').hidden = true; $('pk-run').parentNode.hidden = true; $('pk-msg').textContent = 'Patty-cake needs its janitor, patty/patty.php, served by PHP beside this page. It did not answer: ' + e.message; return; }
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'], w = (n) => (n < 10 ? WORDS[n] : String(n));
  open.hidden = false;
  const keep = () => store.set('nuage.pk', pk.hidden ? '0' : '1');   // the panel opens again on reload if it was open
  open.onclick = () => { pk.hidden = !pk.hidden; open.setAttribute('aria-expanded', !pk.hidden); keep(); if (!pk.hidden) tick(); };
  let first = true, startedHere = false;
  const show = (s0) => {
    // which engine is lit, which is chosen, and whether the chosen one last failed: the three are kept apart, so a
    // change of choice offers "Switch to this engine", and a failure is told only of the engine that failed
    st = s0; const L = s0.llama || {}, lit = L.lit ? L.model : s0.classic ? 'classic' : '';
    if (first && lit) $('pk-m').value = lit; first = false;
    const sel = $('pk-m').value, big = sel !== 'classic', nm = $('pk-m').selectedOptions[0].textContent.replace(/,.*/, '');
    const failed = big && sel === L.model && !L.lit && !L.loading && (startedHere || (L.logAge >= 0 && L.logAge < 120)) && /\b(error|failed|exiting)\b/i.test(L.log || '');   // only a fresh failure, or one from a start pressed here, is told
    $('pk-dot').style.color = s0.engine ? '#6fd66f' : '#565b64';
    const gb = (b) => (b / 1073741824).toFixed(1) + ' GB';   // fetching its model, then loading it, then waking: named in the order they happen
    $('pk-et').textContent = L.stage === 'fetching' ? 'The engine is fetching its model' + (L.name ? ', ' + L.name : '') + ': ' + gb(L.got) + ' so far. The first start takes some minutes.'
      : L.stage === 'loading' || (L.loading && L.stage !== 'waking') ? 'The engine is loading' + (L.name ? ', ' + L.name : '') + '.'
      : L.stage === 'waking' ? 'The engine is waking' + (L.name ? ', ' + L.name : '') + '.'
      : L.fetching ? 'Fetching llama.cpp: ' + L.fetch
      : (lit ? 'The engine is lit: ' + (L.lit ? L.name : 'Qwen2.5 1.5B') + '.' : 'The engine is dark.')
        + (failed ? ' The last start of ' + nm + ' stopped: ' + L.log.replace(/^[\d.]+ +[EWI] +/, '') : '')
        + (big && !L.installed ? (/^failed/.test(L.fetch || '') ? ' Fetching llama.cpp ' + L.fetch : ' The larger engines need llama.cpp first.') : '');
    $('pk-start').hidden = sel === lit || L.loading || s0.running; $('pk-start').textContent = lit ? 'Switch to ' + nm : 'Start ' + nm;
    $('pk-stop').hidden = !(s0.engine || L.loading) || s0.running; $('pk-run').disabled = $('pk-watch').disabled = s0.running || !s0.engine; $('pk-cancel').hidden = !s0.running;
    $('pk-fetch').hidden = !big || L.installed || L.fetching; $('pk-start').disabled = big && !L.installed;
    const j = s0.job;
    $('pk-msg').textContent = !j ? 'No job has run yet.' : s0.running ? (j.mode === 'mirror' ? 'The mirror is gathering light: answer ' + (j.asked || 0) + ' of ' + j.n + '.' : j.mode === 'talks' ? 'Patty-cake is talking: conversation ' + (j.asked || 0) + ' of ' + j.n + '.' : 'Patty-cake is running: question ' + (j.asked || 0) + ' of ' + j.n + ', ' + w(j.kept || 0) + (j.kept === 1 ? ' card' : ' cards') + ' kept so far.')
      : j.state === 'done' ? 'The last job is done. ' + (j.summary || '') : j.state === 'stopped' ? 'The last job was stopped after ' + (j.asked || 0) + ' questions.' : j.state === 'error' ? 'The last job stopped with an error: ' + j.error : '';
    if (s0.running && pk.hidden) { pk.hidden = false; open.setAttribute('aria-expanded', true); }
    const M0 = s0.mimia || {};   // MIMIA: the light gathered, the grinding, and the mirror itself
    $('pk-mt').textContent = M0.grinding ? 'Mimia is being ground: ' + M0.log : (M0.light ? 'The light holds ' + M0.light + ' answers. ' : 'No light yet: run the mirror first. ') + (M0.bin ? 'Mimia is ' + Math.round(M0.bin / 1024) + ' KB' + (M0.meta ? ', ground ' + M0.meta.when.slice(0, 10) + ' against ' + M0.meta.light + ' answers, ' + M0.meta.bits[Math.max(...Object.keys(M0.meta.bits).map(Number))] + ' bits a byte at her widest' : '') + '.' : 'Mimia has not been ground yet.');
    $('pk-grind').disabled = s0.running || M0.grinding || !M0.light;
    const W0 = s0.words || {};   // THE WORD LIBRARIES: CMUdict, Open English WordNet, Wiktionary's etymologies
    $('pk-words').hidden = W0.fetched && !W0.fetching; $('pk-words').disabled = !!W0.fetching;
    $('pk-ws').textContent = W0.fetching ? 'Fetching: ' + W0.log : W0.fetched ? 'The word libraries are at hand.' : /^failed/.test(W0.log || '') ? 'The last fetch ' + W0.log : 'Without them, a teardown has the Lexillogue, the tables, and the YOWL canon.';
  };
  const cards = async () => {
    const c = (await P('do=cards')).cards || [], box = $('pk-cards'); box.textContent = '';
    if (!c.length) return;
    const h = document.createElement('p'); h.textContent = cap(w(c.length)) + (c.length === 1 ? ' card is' : ' cards are') + ' waiting for your ruling.'; box.appendChild(h);
    let opened = []; try { opened = JSON.parse(localStorage.getItem('nuage.pk.open') || '[]'); } catch (e) {}   // each card folded to its question (User1: a lot of scroll), and left as you left it
    c.forEach((b) => {
      const d = document.createElement('details'); d.className = 'pk-card'; const key = b.card.slice(0, 120), sm = document.createElement('summary');
      const q0 = (b.notes.map((l) => l.replace(/^;\s*/, '')).map((l) => (l.match(/^\S+ \| (.*)$/) || [])[1]).filter(Boolean)[0]) || b.card; sm.textContent = q0; d.appendChild(sm);
      d.open = opened.indexOf(key) >= 0; d.addEventListener('toggle', () => { opened = opened.filter((k) => k !== key); if (d.open) opened.push(key); try { localStorage.setItem('nuage.pk.open', JSON.stringify(opened.slice(-200))); } catch (e) {} });
      const t = document.createElement('pre'), say = (l) => { l = l.replace(/^;\s*/, ''); let m;
        if ((m = l.match(/^\S+ \| (.*)$/))) return 'Question: ' + m[1]; if ((m = l.match(/^before \((\w+)\): (.*)$/))) return 'Before: ' + m[2]; if ((m = l.match(/^after: (.*)$/))) return 'After: ' + m[1]; return l; };
      t.textContent = b.notes.map(say).join('\n') + '\nCard: ' + b.card; d.appendChild(t);
      // THE LITTLE BOX (User1's): "in fact the card should say ...". A comment card shows only its words; any other card
      // shows itself whole. Change it, and Keep keeps it as you wrote it, with the original noted beside it.
      const cm = b.card.match(/^\(comment (\S+) "(.*)"\)$/), ab = document.createElement('input');
      ab.size = 60; ab.value = cm ? cm[2] : b.card; ab.setAttribute('aria-label', cm ? 'What ' + cm[1] + ' should say' : 'The card as it should be');
      const amended = () => { const v = ab.value.trim().replace(/"/g, "'"); return cm ? (v === cm[2] ? '' : '(comment ' + cm[1] + ' "' + v + '")') : (ab.value.trim() === b.card ? '' : ab.value.trim()); };
      const lab = document.createElement('label'); lab.textContent = cm ? 'It should say: ' : 'In fact: '; lab.appendChild(ab); d.appendChild(lab); d.appendChild(document.createElement('br'));
      [['Keep', '1'], ['Drop', '0']].forEach(([label, k]) => { const bt = document.createElement('button'); bt.textContent = label; bt.onclick = async () => { const am = k === '1' ? amended() : ''; const r = await P('do=rule&keep=' + k + '&card=' + encodeURIComponent(b.card) + (am ? '&amend=' + encodeURIComponent(am) : '')); if (r && r.ok === false && r.error) { $('pk-msg').textContent = r.error; return; } if (k === '1') $('pk-pack').hidden = false; cards(); }; d.appendChild(bt); });
      ab.oninput = () => { d.querySelector('button').textContent = amended() ? 'Keep as amended' : 'Keep'; };
      box.appendChild(d);
    });
  };
  const cap = (x) => x[0].toUpperCase() + x.slice(1);
  let timer = null;
  const tick = async () => { clearTimeout(timer); try { show(await P('do=status')); } catch (e) {} if (st && st.mimia && st.mimia.grinding) mimia = null; open.textContent = st.running && st.job ? 'Patty-cake: ' + (st.job.asked || 0) + ' of ' + st.job.n : st.waiting ? 'Patty-cake: ' + st.waiting + (st.waiting === 1 ? ' card waits' : ' cards wait') : 'Patty-cake'; $('opt-note').textContent = open.textContent === 'Patty-cake' ? '' : open.textContent; if (!st.running) cards(); timer = setTimeout(tick, st.running || (st.mimia && st.mimia.grinding) || (st.words && st.words.fetching) || (st.llama && (st.llama.loading || st.llama.fetching)) ? 2000 : 10000); };   // the button itself shows the job, panel open or shut
  $('pk-start').onclick = async () => {   // one engine at a time: an 8 GB card holds one model
    const m = $('pk-m').value; startedHere = true; $('pk-et').textContent = 'Kindling the engine. The model takes some seconds to warm' + (m === 'classic' ? '.' : ', and minutes on its first start, while it is fetched.');
    if (m === 'classic') { await P('do=lstop'); await E('start'); } else { try { await E('stop'); } catch (e) {} const r = await P('do=lstart&model=' + m); if (!r.ok) $('pk-msg').textContent = r.error; }
    setTimeout(tick, 3000);
  };
  $('pk-stop').onclick = async () => { try { await E('stop'); } catch (e) {} await P('do=lstop'); tick(); };
  $('pk-fetch').onclick = async () => { $('pk-fetch').hidden = true; $('pk-et').textContent = 'Asking GitHub for llama.cpp.'; const r = await P('do=fetch'); if (!r.ok) $('pk-et').textContent = r.error || 'The janitor would not fetch it.'; setTimeout(tick, 1500); };
  // ANSWERS FROM: Nuage, the lit engine, or both, so that they can be compared turn by turn, with every Wyrd and Omnia.
  // The engine sees only its own side of the talk (your lines and its replies), never Nuage's answers.
  const engineSay = async () => {
    const hist = [...o.querySelectorAll('.u,.e')].slice(-8).map((d) => ({ role: d.classList.contains('u') ? 'user' : 'assistant', content: d.dataset.t }));
    let r; try { r = await (await fetch(new URL('../patty/patty.php?do=ask', location.href), { method: 'POST', body: JSON.stringify({ messages: [{ role: 'system', content: 'You are a friendly partner in a small chat window. Answer plainly and briefly, in at most three sentences.' }].concat(hist), temperature: 0.5, max_tokens: 160, seed: 1 }) })).json(); } catch (e) { r = { error: e.message }; }
    say('e', r.error ? '(It did not answer: ' + r.error + ')' : r.reply); o.lastChild.dataset.who = st.llama && st.llama.lit ? st.llama.name : st.classic ? 'Qwen2.5 1.5B' : 'The engine';
  };
  // MIMIA ANSWERS: her file and her mirror (patty/mimia), fetched once. A prefix of the file is a smaller Mimia, so the
  // size she is read at can be chosen in the future; today she is read whole. When she yields, Nuage answers.
  let mimia = null;
  const mimiaLoad = async () => { if (!mimia) { if (!window.Mimia) eval(await (await fetch(new URL('../patty/mimia/mimia.js', location.href))).text()); mimia = window.Mimia(await (await fetch(new URL('../patty/mimia/mimia.bin?' + Date.now(), location.href))).arrayBuffer()); } return mimia; };
  const mimiaLine = async (q) => {   // her line: UNUS, her words as she made them, scanned (stops, marks, capitals); or BYSSHE, Unus with 56 percent of her made words reconnected, the surest first
    const m = await mimiaLoad(), r = m.respond(q);
    if (r.yielded) return r;
    const readback = async (text) => { try { const rb = await (await fetch(new URL('../patty/patty.php?do=readback', location.href), { method: 'POST', body: JSON.stringify({ text }) })).json(); return rb.ok && rb.read; } catch (e) { return null; } };
    const read = r.text ? await readback(r.text) : null, raw = r.text || '...', nl = (x) => x.replace(/([.!?])\s+/g, '$1\n');
    const unus = read && read.scannedRaw ? nl(read.scannedRaw) : raw;
    // BYSSHE (User1, after Percy): the made words that the read-back is surest of, smashwords first, are reconnected to their
    // nearest words, until 56 percent of the made words are; then the mix is scanned again, so the stops fit the new words.
    let bysshe = unus;
    if (read && read.words) { const made = read.words.filter((x) => !x.real && x.word), take = made.slice().sort((a, b) => (b.smash - a.smash) || (b.sure - a.sure)).slice(0, Math.round(made.length * 0.56)), sw = new Map(take.map((x) => [x.t, x.word]));
      let k = 0; const mixed = raw.replace(/[A-Za-z']+/g, (w) => sw.has(w) ? (/^[A-Z]/.test(w) ? sw.get(w).replace(/^./, (c) => c.toUpperCase()) : sw.get(w)) : w); const rb2 = mixed !== raw ? await readback(mixed) : null; bysshe = rb2 && rb2.scannedRaw ? nl(rb2.scannedRaw) : nl(mixed); }
    let mode = 'unus'; try { mode = localStorage.getItem('nuage.pk.mode') === 'bysshe' ? 'bysshe' : 'unus'; } catch (e) {}   // whichever was left showing is what the next line arrives in
    const shown = () => (mode === 'bysshe' ? bysshe : unus);
    say('e', shown()); const line = o.lastChild; line.dataset.who = 'Mimia, the ' + Math.round(m.bytes / 1024) + ' KB mirror (re: ' + String(q).trim().replace(/[.?!]+$/, '').slice(0, 48) + (String(q).trim().length > 48 ? '…' : '') + (read ? ', ' + Math.round(read.sure * 100) + '% sure' : '') + ')'; line.dataset.t = shown();   // the subject, and how sure the read-back is of her made words (User1: at 80 percent, a comedy line)
    line.style.cursor = 'pointer'; line.title = mode === 'bysshe' ? 'Bysshe. Click for Unus.' : 'Unus. Click for Bysshe.';
    line.addEventListener('click', () => { mode = mode === 'bysshe' ? 'unus' : 'bysshe'; try { localStorage.setItem('nuage.pk.mode', mode); } catch (e) {} line.dataset.t = shown(); line.title = (mode === 'bysshe' ? 'Bysshe. Click for Unus.' : 'Unus. Click for Bysshe.') + (line.dataset.read ? '\n' + line.dataset.read : ''); if (window.NUAGE && window.NUAGE.repaint) window.NUAGE.repaint(line); else line.textContent = shown(); });
    if (window.NUAGE && window.NUAGE.speak && JSON.parse(localStorage.getItem('nuage.prefs') || '{}').speak) window.NUAGE.speak(shown().replace(/\n/g, ' '), 0, 'mimia');   // Mimia, read by Miria when everything is spoken
    if (read) line.dataset.read = read.words.filter((x) => !x.real).map((x) => x.t + '  ' + x.ipa + '  ' + (x.bell || '') + '  ->  ' + (x.word || '?') + '  ' + (x.wordIpa || '') + '  ' + (x.wordBell || '') + '  ' + Math.round(x.sure * 100) + '%').join('\n') + (read.smashwords.length ? '\nSmashwords: ' + read.smashwords.join(', ') : ''); if (read) line.title += '\n' + line.dataset.read;   // the whole reading (IPA, Bell's forms, the nearest words) on hover; the Maybe line is retired (User1)
    return r;
  };
  const mimiaSay = async (q) => {   // Answers from: Mimia alone
    say('u', q);
    try { const r = await mimiaLine(q); if (r.yielded) say('n', '(Mimia yields to the core.) ' + N.chat(q)); }
    catch (er) { say('e', '(Mimia did not answer: ' + er.message + ')'); }
  };
  // MIMIA JOINS IN: with the box ticked, wherever Nuage could not answer (a question typed, or a watched pupil's), she
  // adds her line after Nuage's, and the read-back after hers. Through the page's one door, so it needs no other hook.
  const MJ_MISS = /^(I do not know|I cannot answer|I know of nothing|I have no card|I have heard of|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|Is that the real reason|Please go on|Does that)/;
  try { $('pk-mj').checked = localStorage.getItem('nuage.pk.mj') === '1'; } catch (e) {} $('pk-mj').addEventListener('change', () => { try { localStorage.setItem('nuage.pk.mj', $('pk-mj').checked ? '1' : '0'); } catch (e) {} });   // she stays joined in, as you left her
  if (window.NUAGE) window.NUAGE.after.push(async (q, r) => { if ($('pk-mj').checked && MJ_MISS.test(r)) { try { await mimiaLine(q); } catch (e) { say('e', '(Mimia did not answer: ' + e.message + ')'); } } });
  $('pk-swp').onclick = async () => { const r = await P('do=simplewiki'); $('pk-ws').textContent = r.note || r.error || ''; };
  $('pk-words').onclick = async () => { const r = await P('do=words'); $('pk-ws').textContent = r.ok ? 'Fetching the word libraries.' : r.error || r.note; setTimeout(tick, 2000); };
  { const lc = $('lc'), wd = $('pk-wd'), box = $('pk-w'); if (lc && wd) {   // TEAR DOWN A WORD stands first in the column, above the Options (User1), and follows the word in question
      lc.insertBefore(wd, lc.firstChild); box.placeholder = 'Tear down a word. Space to search.'; box.size = 14; box.setAttribute('autocomplete', 'off');
      // THE SEARCH (User1): no system menu opens of itself. Space shows what you have torn before, in our own type, no
      // brighter than the box; typing narrows it, generously; twelve at most, for that is what a mind holds; Enter takes one.
      const wrap = document.createElement('span'); wrap.id = 'pk-wrap'; box.parentNode.insertBefore(wrap, box); wrap.appendChild(box);
      const menu = document.createElement('div'); menu.id = 'pk-wl'; menu.hidden = true; menu.setAttribute('role', 'listbox'); wrap.appendChild(menu);
      let torn = [], at = -1, shown = []; try { torn = JSON.parse(localStorage.getItem('nuage.torn') || '[]'); } catch (e) {}
      const remember = (w) => { torn = [w].concat(torn.filter((x) => x !== w)).slice(0, 40); try { localStorage.setItem('nuage.torn', JSON.stringify(torn)); } catch (e) {} };
      const close = () => { menu.hidden = true; at = -1; };
      const draw = () => { menu.innerHTML = shown.map((w, k) => '<div role=option' + (k === at ? ' class=on aria-selected=true' : '') + '>' + w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) + '</div>').join(''); menu.hidden = !shown.length; };
      const search = () => { const t = box.value.trim().toLowerCase(); shown = torn.filter((w) => !t || w.toLowerCase().indexOf(t) >= 0 || t.indexOf(w.toLowerCase()) >= 0).slice(0, 12); at = -1; draw(); };
      box.oninput = () => { box.dataset.mine = box.value.trim() ? '1' : ''; if (!menu.hidden) search(); };   // typed by hand: left alone until sent or emptied
      box.addEventListener('keydown', (e) => {
        if (e.key === ' ') { e.preventDefault(); search(); if (!shown.length) close(); return; }
        if (menu.hidden) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); at = (at + (e.key === 'ArrowDown' ? 1 : shown.length - 1) + shown.length) % shown.length; draw(); return; }
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'Enter' && at >= 0) { box.value = shown[at]; close(); }   // taken, and the Enter goes on to tear it
      }, true);
      menu.onmousedown = (e) => { const d = e.target.closest('[role=option]'); if (!d) return; e.preventDefault(); box.value = d.textContent; close(); box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); };
      box.addEventListener('blur', () => setTimeout(close, 120));
      const follow = () => { const t = window.NUAGE && window.NUAGE.N && window.NUAGE.N.topic && window.NUAGE.N.topic(); if (t && !box.dataset.mine && document.activeElement !== box) box.value = t; };
      if (window.NUAGE) window.NUAGE.after.push(async () => follow()); setTimeout(follow, 500);
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && box.value.trim()) remember(box.value.trim()); }, true);
      document.head.insertAdjacentHTML('beforeend', '<style>#pk-wrap{position:relative;flex:1 1 9rem;min-width:0;display:block}#pk-wrap input{width:100%;box-sizing:border-box}#pk-wl{position:absolute;left:0;right:0;top:100%;z-index:5;background:var(--bg);border:1px solid var(--line);border-top:0;color:var(--desc);font-size:.95rem;line-height:1.5;max-height:19rem;overflow:hidden}#pk-wl div{padding:.05rem .5rem;cursor:pointer}#pk-wl .on,#pk-wl div:hover{color:var(--user);background:#00000000}</style>');
  } }
  o.addEventListener('click', (e) => { const q = e.target.closest('.td .qt, .td .subtil'); if (!q) return; e.preventDefault(); const w = q.textContent.trim().replace(/[.,;:!?]+$/, '').split(/\s*,\s*/)[0].replace(/^(an?|the) /, ''); if (!w) return; $('pk-w').value = w; $('pk-w').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });   // the first word of "cauldron, kettle"
  $('pk-w').onkeydown = async (e) => {   // TEAR DOWN A WORD: its sounds, the mouth's path, its felt sense, its parts, its story, its canon
    if (e.key !== 'Enter' || !$('pk-w').value.trim()) return; const w = $('pk-w').value.trim(); $('pk-w').dataset.mine = '1';   // your word stays in the box (User1): it is yours, and it was never lost
    const r = await P('do=word&w=' + encodeURIComponent(w));
    const F = r.ok && r.tear && r.tear.figures;   // sounds are movies: side-on along time, face-on as rings (our own SVG, the word escaped)
    if (F) {   // the fleuriant: it plays once, silent, and holds; click it to hear the word as it plays again
      const fg = document.createElement('div'); fg.className = 'h pk-fig'; fg.dataset.w = w; fg.innerHTML = F.svg || F.side; o.appendChild(fg); o.scrollTop = o.scrollHeight;
      const svg = fg.querySelector('svg'); svg.pauseAnimations(); svg.setCurrentTime(0); svg.style.cursor = 'pointer'; svg.setAttribute('tabindex', '0'); svg.setAttribute('aria-label', (svg.getAttribute('aria-label') || w) + '. Click to hear it.');
      const once = performance.now(), tick = (now) => { if (svg._tok) return; const t = (now - once) * (F.SLOW || 4); if (t >= F.D) { svg.setCurrentTime((F.D - 1) / 1000); return; } svg.setCurrentTime(t / 1000); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      const hear = () => window.NUAGE && window.NUAGE.sound(svg, w, F);
      svg.addEventListener('click', hear); svg.addEventListener('keydown', (k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); hear(); } });
    }
    if (r.ok && r.tear && r.tear.rows) {   // whitelined: the labels in a column, each statement in white, its supplements in the dim beneath
      const e = (x) => String(x).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
      const d = document.createElement('div'); d.className = 'h td'; d.dataset.t = r.card;
      let prev = ''; d.innerHTML = '<dl>' + r.tear.rows.map((x) => '<dt>' + (x.k === prev ? '"' : e(x.k) + ':') + ((prev = x.k), '') + '</dt><dd>' + (x.pre ? '<span class=sup>' + e(x.pre) + '</span> ' : '') + (x.v ? '<span class=wl>' + e(x.v) + '</span>' : '') + (x.dim ? ' <span class=sup>' + e(x.dim) + '</span>' : '') + x.sub.map((y) => '<div class=sup>' + e(y) + '</div>').join('') + '</dd>').join('') + '</dl>';
      d.querySelectorAll('dd').forEach((dd) => { const tw = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT), ts = []; let n; while ((n = tw.nextNode())) if (/[\u201c"][^\u201c\u201d"\n]{1,40}[\u201d"]/.test(n.data)) ts.push(n);   // a quoted word in a card: click, and it is torn
        ts.forEach((t) => { const f = document.createDocumentFragment(); let last = 0; t.data.replace(/([\u201c"])([^\u201c\u201d"\n]{1,40})([\u201d"])/g, (m, q1, w, q2, i) => { f.appendChild(document.createTextNode(t.data.slice(last, i) + q1)); const s = document.createElement('span'); s.className = 'qt'; s.textContent = w; s.title = 'Click to tear it down.'; f.appendChild(s); f.appendChild(document.createTextNode(q2)); last = i + m.length; }); f.appendChild(document.createTextNode(t.data.slice(last))); t.parentNode.replaceChild(f, t); }); });
      // SUBTILS (User1's word): in the felt sense, the things a sound goes with ("spitting, spraying, and a point") are not
      // links, yet recommend themselves to the mind. Each sits in a round bubble, barely there, that comes forward on hover,
      // its word turning cyan to show it is ready; a click tears it down.
      // <| (User1): a Tilt-like arrow on each meaning: pull the definition and assert it to Nuage, "A pinniped is ...", through the
      // talk itself, so it is kept as anything taught is kept, and given back on waking.
      d.querySelectorAll('dd').forEach((dd, i0) => { const k0 = r.tear.rows[i0] && r.tear.rows[i0].k; if (k0 !== 'Means') return; const wl = dd.querySelector('.wl'); if (!wl) return;
        const b = document.createElement('button'); b.className = 'teach'; b.textContent = '<|'; b.title = 'Teach this to Nuage: ' + w + ' is ' + wl.textContent.replace(/\.$/, '') + '.';
        b.onclick = () => { const def = wl.textContent.trim().replace(/[.;]+$/, ''), art = /^[aeiou]/i.test(w) ? 'An ' : 'A ', line = art + w + ' is ' + (/^(an? |the )/i.test(def) ? def : /^(to |how |what |when |where |why )/i.test(def) ? def : (/^[aeiou]/i.test(def) ? 'an ' : 'a ') + def) + '.'; ask(line); };
        dd.insertBefore(b, dd.firstChild); });
      d.querySelectorAll('dd').forEach((dd, i0) => { const k0 = r.tear.rows[i0] && r.tear.rows[i0].k; if (k0 !== 'Felt sense') return; const wl = dd.querySelector('.wl'); if (!wl) return; const m0 = wl.textContent.match(/^(.*? goes with )(.*)\.$/); if (!m0) return;
        const its = m0[2].split(/,\s*(?:and\s+)?|\s+and\s+/).map((x) => x.trim()).filter(Boolean).map((it) => '<span class=subtil>' + e(it) + '</span>');
        wl.innerHTML = e(m0[1]) + (its.length < 2 ? its.join('') : its.length === 2 ? its[0] + ' and ' + its[1] : its.slice(0, -1).join(', ') + ', and ' + its[its.length - 1]) + '.'; });   // the serial comma kept
      o.appendChild(d); o.scrollTop = o.scrollHeight; if (window.NUAGE && window.NUAGE.markCard) window.NUAGE.markCard(d);
      if (window.NUAGE && window.NUAGE.speak) { const sense = (r.tear.rows.find((x) => x.k === 'Means') || {}).v; window.NUAGE.speak(w + '.' + (sense ? ' ' + sense : '')); }   // a read-through, in the voice: the word, and what it means
    } else say('h', r.ok ? r.card : '(' + (r.error || r.raw || 'no teardown') + ')');
  };
  // THE PHYSIUM (User1, 4 xi 2026): Mimia as rutilated stone. Her 2048 units lie on a square spiral from the heart, so the
  // first 64 are the centre and each larger core a growth zone about it; each unit is a cell, and the cell's inclusions are
  // its input trits: +1 copper, -1 iron, 0 clear quartz. A word passing through her lights the units it wakes, byte by
  // byte, in the order she chose them, as bright as each is heard. Nothing is drawn that is not in the file at an address.
  $('pk-phys').onclick = async () => {
    const m = await mimiaLoad(), L = m.lattice, U = m.units, side = Math.ceil(Math.sqrt(U)), CELL = 14, S = side * CELL, SAMP = 7;
    if (!$('ph')) { document.body.insertAdjacentHTML('beforeend', '<dialog id=ph class=bx aria-labelledby=ph-h><header><h2 id=ph-h>Physium</h2><button id=ph-x>Close</button></header><div><p class=note>Mimia, ' + U + ' units on a spiral from the heart: the first 64 at the centre, each core a growth zone about it. A cell is a unit; its inclusions are its input trits, copper for +1, iron for −1, clear for 0. Say something, and the units she wakes light as each byte is chosen.</p><canvas id=ph-c width=' + S + ' height=' + S + '></canvas><p><input id=ph-i placeholder=\"A word for the stone. Enter to pass it through.\"> <span id=ph-t></span></p></div></dialog>');
      document.head.insertAdjacentHTML('beforeend', '<style>#ph{width:min(' + (S + 48) + 'px,96vw)}#ph-c{display:block;width:100%;height:auto;background:#000;border:1px solid #191919;border-radius:1px}#ph .note{color:var(--desc)}#ph-i{width:60%;font:inherit;background:var(--btn);color:var(--user);border:1px solid var(--btnline);border-radius:4px;padding:.3rem .5rem}#ph-t{color:var(--ink);white-space:pre-wrap}</style>');
      $('ph-x').onclick = () => $('ph').close(); $('ph').addEventListener('click', (e) => { if (e.target === $('ph')) $('ph').close(); }); }
    const cv = $('ph-c'), g = cv.getContext('2d'), pos = [];   // the spiral: unit j at (x, y), from the heart outward
    { let x = 0, y = 0, dx = 0, dy = -1; for (let k = 0; k < side * side; k++) { if (-side / 2 < x && x <= side / 2 && -side / 2 < y && y <= side / 2) pos.push([x, y]); if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) { const t = dx; dx = -dy; dy = t; } x += dx; y += dy; } }
    const cx = (j) => (pos[j][0] + (side >> 1)) * CELL, cy = (j) => (pos[j][1] + (side >> 1)) * CELL;
    const stone = document.createElement('canvas'); stone.width = stone.height = S; const sg = stone.getContext('2d'); sg.fillStyle = '#000'; sg.fillRect(0, 0, S, S);
    const step = Math.floor(L.IN / (SAMP * SAMP)), px = CELL / SAMP;   // each cell shows a sample of its trits, evenly through the row
    for (let j = 0; j < U; j++) { const X = cx(j), Y = cy(j), base = j * L.IN; for (let a = 0; a < SAMP; a++) for (let b = 0; b < SAMP; b++) { const w = L.T1[base + (a * SAMP + b) * step]; if (!w) continue; sg.fillStyle = w > 0 ? 'rgba(205,127,50,.55)' : 'rgba(118,132,146,.55)'; sg.fillRect(X + b * px + 0.5, Y + a * px + 0.5, px - 1, px - 1); } }
    sg.strokeStyle = 'rgba(176,170,158,.14)'; sg.lineWidth = 1;   // the growth zones: each core's units lie within a square of its own side, about the heart
    [64, 128, 256, 512, 1024, 2048].filter((n) => n <= U).forEach((n) => { const r = Math.sqrt(n) * CELL / 2, c = (side >> 1) * CELL + CELL / 2; sg.beginPath(); sg.roundRect(c - r, c - r, 2 * r, 2 * r, CELL / 2); sg.stroke(); });
    const dark = (a) => { g.drawImage(stone, 0, 0); if (a) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.fillRect(0, 0, S, S); } };
    dark(0); $('ph').showModal(); $('ph-i').focus();
    let tok = 0;
    $('ph-i').onkeydown = (e) => {
      if (e.key !== 'Enter' || !$('ph-i').value.trim()) return; const q = $('ph-i').value.trim(), frames = [], mine = ++tok;
      const r = m.respond(q, (t, h, y) => { const lit = []; let mx = 0; for (let j = 0; j < U; j++) { const v = h[j] * Math.abs(L.s2[j]); if (v > 0) { lit.push([j, v]); if (v > mx) mx = v; } } frames.push({ y, lit, mx }); });
      $('ph-t').textContent = r.yielded ? '(She yields to the core.)' : '';
      if (!frames.length) return;
      let k = 0, said = ''; const show = () => { if (mine !== tok) return; const f = frames[k]; dark(0.5); g.globalCompositeOperation = 'lighter';
        for (const [j, v] of f.lit) { const a = Math.pow(v / f.mx, 0.7); g.fillStyle = 'rgba(255,236,200,' + (0.85 * a).toFixed(3) + ')'; g.fillRect(cx(j) + 1, cy(j) + 1, CELL - 2, CELL - 2); }
        g.globalCompositeOperation = 'source-over'; if (f.y >= 32) said += String.fromCharCode(f.y); $('ph-t').textContent = said; k++; if (k < frames.length) setTimeout(show, 90); else setTimeout(() => { if (mine === tok) dark(0); }, 1200); };
      show();
    };
  };
  $('pk-grind').onclick = async () => { const r = await P('do=grind&units=' + $('pk-msz').value + '&epochs=' + $('pk-mep').value); $('pk-mt').textContent = r.ok ? 'Mimia is being ground.' : r.error || r.note; mimia = null; setTimeout(tick, 2000); };
  const keys0 = inp.onkeydown;   // the page's own keys (Enter, and the arrows' memory) stay; only an Enter meant for another voice is taken here
  inp.onkeydown = async (e) => {
    if (e.key !== 'Enter' || !inp.value.trim()) return keys0 && keys0(e); const q = inp.value, by = $('pk-by').value; if (by === 'n' || !st.engine) return keys0 && keys0(e); inp.value = '';
    if (by === 'm') return mimiaSay(q);
    if (by === 'b') await ask(q); else say('u', q);
    inp.disabled = true; await engineSay(); inp.disabled = false; inp.focus();
  };
  $('pk-m').onchange = () => show(st);
  // WATCH A PUPIL: the model plays a school pupil and talks with Nuage here, in the conversation, typing its questions
  // into the box for all to see (the typing is theatre; the questions are its own). Then it gives its verdict, and the
  // questions Nuage missed go to test/candidates.txt. The same pupil as patty-cake's conversations, live.
  let watching = false;
  // THE CLATTER, after Safecracker's (User1's dom shim): a key is not a tone but a transient, a bright tick of noise as the
  // plate breaks and a short low thock as it bottoms out, about eleven milliseconds, no ring. Each stroke builds its own
  // little graph, so a fast passage clatters as a real keyboard does. Only for keys nobody pressed: the pupil's.
  let AC = null; $('pk-tap').checked = store.get('nuage.tap') !== '0'; $('pk-tap').onchange = () => store.set('nuage.tap', $('pk-tap').checked ? '1' : '0');
  const tap = (kind) => {
    if (!$('pk-tap').checked) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } if (AC.state === 'suspended') AC.resume();
    const ac = AC, t = ac.currentTime, big = kind === 'return', jit = Math.random(), NL = big ? 0.016 : 0.011, len = Math.floor(ac.sampleRate * NL);
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) { const k = 1 - i / len; d[i] = (Math.random() * 2 - 1) * k * k; }
    const n = ac.createBufferSource(); n.buffer = buf; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = (big ? 2200 : 3200) + jit * 700; f.Q.value = 0.8;
    const g = ac.createGain(); g.gain.setValueAtTime((big ? 0.30 : 0.38) * (0.85 + jit * 0.3), t); g.gain.exponentialRampToValueAtTime(0.0004, t + NL + 0.006);
    n.connect(f); f.connect(g); g.connect(ac.destination); n.start(t); n.stop(t + 0.06);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime((big ? 175 : 230) + jit * 40, t); o.frequency.exponentialRampToValueAtTime(big ? 105 : 140, t + 0.022);
    const g2 = ac.createGain(); g2.gain.setValueAtTime(big ? 0.040 : 0.024, t); g2.gain.exponentialRampToValueAtTime(0.0004, t + (big ? 0.038 : 0.026));
    o.connect(g2); g2.connect(ac.destination); o.start(t); o.stop(t + 0.06);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), MISS = /^(I know that [^.]*but I cannot|I do not know|I cannot|I know of nothing|I have no card|I have heard of|Not that I know|I can only|I did not follow|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say)/;
  const M = async (step, topic, talk, seed) => { const j = await (await fetch(new URL('../patty/patty.php?do=pupil', location.href), { method: 'POST', body: JSON.stringify({ step, topic, talk, seed }) })).json(); if (j.error) throw new Error(j.error); return String(j.reply || '').split('\n')[0].trim(); };   // the pupil's words are kept by the janitor
  $('pk-watch').onclick = async () => {
    if (watching) { watching = false; return; }
    watching = true; $('pk-watch').textContent = 'Stop watching'; inp.disabled = btn.disabled = true;
    const s0 = Date.now() % 100000, talk = [];
    try {
      const topic = (await M('topic', '', [], s0)).replace(/["*.:]/g, '').trim() || 'animals';
      say('m', '[A pupil, curious about ' + topic.toLowerCase() + ', sits down to talk.]');
      for (let k = 0; k < 6 && watching; k++) {   // six turns: success, or failure, shows best a step or two in
        const q = (await M('ask', topic, talk, s0 + k + 1)).replace(/^(pupil|student|you|me|q)\s*:\s*/i, '').replace(/^"|"$/g, '');
        if (!q || !watching) break;
        inp.value = '';
        for (let j = 0; j < q.length; j++) {   // typing is not a metronome: letters come in bursts, the hand pauses at a space, longer after a stop
          const prev = q[j - 1] || '', ch = q[j], k = /[.,!?;:]/.test(prev) ? 2.6 : prev === ' ' ? 1.9 : ch === ' ' ? 1.35 : 1;
          inp.value += ch; tap('key'); await sleep(48 * k * (0.75 + Math.random() * 0.5) + (Math.random() < 0.04 ? 220 : 0));
        }
        await sleep(450); tap('return'); inp.value = ''; await ask(q, 'u pu');
        const ns = o.querySelectorAll('.n,.p'), a = ns.length ? ns[ns.length - 1].dataset.t : '';
        talk.push({ q, a, ok: !MISS.test(a) }); await sleep(1100);
      }
      if (talk.length) {
        const v = await M('verdict', topic, talk, s0 + 99);
        const L = (v.match(/[ABC]/) || ['?'])[0], note = v.replace(/^[^-\u2013\u2014]*[-\u2013\u2014]\s*/, '').trim(), got = talk.filter((x) => x.ok).length, miss = talk.filter((x) => !x.ok);
        say('m', '[The pupil was ' + ({ A: 'satisfied', B: 'partly satisfied', C: 'not satisfied' }[L] || 'undecided') + (note ? ': "' + note.replace(/"/g, "'") + '"' : '.') + ' Nuage answered ' + w(got) + ' of ' + w(talk.length) + (miss.length ? ', and the ' + (miss.length === 1 ? 'miss goes' : 'misses go') + ' to the candidates.]' : '.]'));
        if (miss.length) fetch(new URL('../patty/patty.php?do=misses', location.href), { method: 'POST', body: JSON.stringify({ topic, misses: miss }) });
      }
    } catch (e) { say('m', '[The pupil could not be reached: ' + e.message + ']'); }
    watching = false; $('pk-watch').textContent = 'Watch a pupil talk'; inp.disabled = btn.disabled = false; inp.value = ''; inp.focus();
  };
  $('pk-mode').onchange = () => { const m0 = $('pk-mode').value; if (m0 === 'm' && ![...$('pk-n').options].some((x) => x.value === '5000')) $('pk-n').insertAdjacentHTML('beforeend', '<option>5000</option>'); $('pk-n').value = m0 === 't' ? '10' : m0 === 'm' ? '1000' : '200'; };   // conversations: a pupil picks a topic and talks with Nuage for a few turns
  $('pk-run').onclick = async () => { const r = await P('do=start&n=' + $('pk-n').value + ($('pk-mode').value === 't' ? '&talks=1' : $('pk-mode').value === 'm' ? '&mirror=1' : '') + ($('pk-rest').checked ? '&rest=1' : '')); if (!r.ok) $('pk-msg').textContent = r.error || r.note; setTimeout(tick, 1500); };
  $('pk-cancel').onclick = async () => { await P('do=stop'); tick(); };
  $('pk-cuts').onclick = async () => { $('pk-ct').textContent = 'Cutting: 64, 128, 256, and 1024 KB.'; const r = await P('do=cuts'); $('pk-ct').textContent = r.ok ? (r.log.match(/^cut .*$/gm) || []).map((l) => l.replace(/ +holds:.*$/, '')).join('; ') + '. They are in dist/cuts, with MANIFEST.txt.' : 'The cuts did not finish: ' + (r.log || r.error || '').slice(-300); };
  $('pk-pack').onclick = async () => { $('pk-msg').textContent = 'Rebuilding Nuage.'; const r = await P('do=pack'); $('pk-msg').textContent = r.ok ? 'Rebuilt. Reloading.' : 'The rebuild did not finish: ' + r.log; if (r.ok) setTimeout(() => location.reload(), 800); };
  show(st); if (st.running || st.waiting || store.get('nuage.pk') === '1') { pk.hidden = false; open.setAttribute('aria-expanded', true); }
  tick();
})();
