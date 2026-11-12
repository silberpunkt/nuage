/* noct-tend.js -- tending the Noctilucents: a visitor adds a word of their own, and takes any word away.
   User1, 12 xi 2026: "the Noctilucents should allow New entries in a box at top, as well as swipe or X delete";
   "User's additions would naturally be top of list and not buried at foot"; "make it an [ X ] delete ... at far right in oppose of title, above
   Fleuriant"; and then, on seeing it: "must be a round (x) since we are not closing the window ... dead grey, about 44%."

   words/gallery.js sets this inside the gallery page, after Ecouter's rules.js, lexillogue.js and phones.js and
   after noct-draw.js, so a new word is read and drawn in the page by the same code that drew the others:
     LEXILLOGUE.say(word)  the letters to phonemes, by the NRL rules of 1976 (no dictionary rides in the page, so a
                           visitor's word is always "read by rule", and the page says so)
     PHONES.frames, PHONES.split   Ecouter's score of those phonemes
     NOCT.figure           the picture and its movie
     NOCTWIRE(section)     the gallery's own wiring: click to hear, and one silent play to build the last frame

   What is kept, in this browser only: the visitor's words, newest first ("noctilucents.mine"), and the names of the
   gallery's own words they have taken out ("noctilucents.gone"). Nothing is sent anywhere. */
(function () {
  var MINE = 'noctilucents.mine', GONE = 'noctilucents.gone';
  var get = function (k) { try { var v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  var put = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var $ = function (id) { return document.getElementById(id); };
  var top = $('noct-top'), box = $('nw'), go = $('nwgo'), note = $('nwsay'), back = $('nwback');
  if (!top || !box) return;
  var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  var nameOf = function (sec) { return sec.dataset.word || ''; };
  var sections = function () { return Array.prototype.slice.call(document.querySelectorAll('section')); };
  var tidy = function (w) { return String(w).toLowerCase().replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40); };

  // a word, read by rule and drawn: a <section> like the gallery's own, or null if it cannot be scored
  function draw(word) {
    if (!(window.LEXILLOGUE && window.PHONES && window.NOCT)) return null;
    var nrl, fig;
    try { nrl = LEXILLOGUE.say(word).trim(); var codes = nrl.replace(/ /g, '');
      if (!codes) return null;
      fig = NOCT.figure(word, { fr: PHONES.frames(codes), sp: PHONES.split(codes), codes: codes }); } catch (e) { return null; }
    if (!fig) return null;
    var syl = (nrl.match(/IY|IH|EY|EH|AE|AA|AO|OW|UH|UW|ER|AX|AH|AY|AW|OY/g) || []).length;
    var sec = document.createElement('section');
    sec.dataset.codes = fig.codes; sec.dataset.slow = fig.SLOW; sec.dataset.d = Math.round(fig.D); sec.dataset.mine = '1';
    sec.innerHTML = '<h2>' + esc(word) + '</h2><p>' + esc(nrl) + ', read by rule.'
      + (syl ? ' ' + (COUNT[syl] || syl) + (syl === 1 ? ' syllable.' : ' syllables.') : '') + ' Added here.</p>' + fig.svg;
    return sec;
  }

  // every word wears a small round (x), dead grey, at the far right of its title, over the wall (round, not a
  // square X: nothing is being closed); and it can be swept away sideways
  function dress(sec) {
    var h = sec.querySelector('h2'); if (!h || h.querySelector('.rm')) return;
    sec.dataset.word = h.textContent.trim();
    var b = document.createElement('button'); b.className = 'rm'; b.type = 'button'; b.textContent = 'x';
    b.title = 'Take "' + nameOf(sec) + '" out of the gallery'; b.setAttribute('aria-label', 'Remove ' + nameOf(sec));
    b.addEventListener('click', function () { remove(sec); });
    h.appendChild(b);
    var x0 = 0, y0 = 0, dx = 0, live = false;
    sec.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; live = false; }, { passive: true });
    sec.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 1) return;
      var mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (!live && Math.abs(mx) > 14 && Math.abs(mx) > 2 * Math.abs(my)) live = true;      // a sideways hand, not a scroll
      if (!live) return;
      dx = mx; sec.style.transition = 'none'; sec.style.transform = 'translateX(' + dx + 'px)'; sec.style.opacity = String(Math.max(0.25, 1 - Math.abs(dx) / 260));
    }, { passive: true });
    var end = function () {
      if (!live) return; live = false; sec.style.transition = '';
      if (Math.abs(dx) > 110) remove(sec); else { sec.style.transform = ''; sec.style.opacity = ''; }
    };
    sec.addEventListener('touchend', end); sec.addEventListener('touchcancel', end);
  }

  // asked first, with the browser's own plain question (User1: "on confirm, naturally"). Declined, the word stays
  // and a swept one slides back.
  function remove(sec) {
    var w = nameOf(sec);
    if (!window.confirm('Take "' + w + '" out of the gallery?')) { sec.style.transform = ''; sec.style.opacity = ''; return; }
    if (sec.dataset.mine) put(MINE, get(MINE).filter(function (x) { return x !== w; }));
    else { var g = get(GONE); if (g.indexOf(w) < 0) g.push(w); put(GONE, g); }
    sec.remove(); tally(); say('"' + w + '" taken out.');
  }

  // the gallery's own words that were taken out can all come back; a visitor's own word is simply typed again
  function tally() {
    var g = get(GONE); back.hidden = !g.length; if (!g.length) return;
    back.innerHTML = g.length + (g.length === 1 ? ' of the gallery\'s words is' : ' of the gallery\'s words are') + ' out: ' + esc(g.join(', ')) + '. <button type=button>Bring them back</button>';
    back.querySelector('button').onclick = function () { put(GONE, []); location.reload(); };
  }
  var say = function (t) { note.textContent = t; };

  // a new word goes to the TOP of the list
  function add(raw, quiet) {
    var w = tidy(raw); if (!w) { if (!quiet) say('Type a word.'); return false; }
    var have = sections().filter(function (s) { return nameOf(s) === w; })[0];
    if (have) { if (!quiet) { have.scrollIntoView({ block: 'center', behavior: 'smooth' }); say('"' + w + '" is already here.'); } return false; }
    var sec = draw(w);
    if (!sec) { if (!quiet) say('"' + w + '" could not be drawn.'); return false; }
    top.parentNode.insertBefore(sec, top.nextSibling);
    dress(sec); if (window.NOCTWIRE) NOCTWIRE(sec);
    if (!quiet) { var m = get(MINE).filter(function (x) { return x !== w; }); m.unshift(w); put(MINE, m); say('"' + w + '" drawn, read by rule. Click it to hear it.'); }
    return true;
  }

  // on arrival: the gallery's words that were taken out stay out; the visitor's words return, newest on top
  var gone = get(GONE);
  sections().forEach(function (sec) { dress(sec); if (gone.indexOf(nameOf(sec)) >= 0) sec.remove(); });
  get(MINE).slice().reverse().forEach(function (w) { add(w, true); });
  tally();
  var submit = function () { if (add(box.value)) box.value = ''; box.focus(); };
  go.addEventListener('click', submit);
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
})();
