/* wallbreaker.js -- the textwall-breaker, as a bookmarklet: Sandraker for any page.
   (User1, 26 x 2026: "It says to the solid-wall of printing, you may be solid or rag-right, but you are raggedly-dressed.
   No-one has given you the whitespace you requested ... We merely grant you back all you requested.")

   Vendored into Nuage from github.com/silberpunkt/wallbreaker (MIT). One change, at the very end: it exports mark()
   for one paragraph and plan() for one text's depths, and does not scan the screen when loaded, so Nuage can give each
   question and reply its triangle, and its tincture.

   Click the bookmarklet while reading. It asks the page what is at the centre of the screen, finds the paragraph there,
   and gives that paragraph and its visible siblings (the few you are reading) each a small triangle to its left.
   If nothing readable is at the centre, nothing is done. Click the bookmarklet again where nothing new is found,
   and every paragraph is given back as it was, and the triangles go.

   Each triangle is a three-state cycle; it stays where it was put, at the paragraph's first line:
     |>   untouched: the paragraph as the page set it
     _|   aired out: a line at every period and every comma (and ; :), each comma one step deeper -- two spaces,
          however deep -- each sentence back to the margin
     \/   tilted down: and inside each of those lines, the joints too -- the clause words, the prepositions, the
          coordinators -- by the same small dictionary of connection Bela's deep rake uses
   and back to |>. SHIFT+click turns the cycle backward (User1, 27 x: "a way to 'pick back up' a descended sentence without
   passing through full descent"): \/ to _| to |>. Nothing of the page is lost: the paragraph's own nodes are set aside, untouched, and put back.
   Links and emphasis stay what they were in the aired-out view (each line is cut from a copy of the paragraph).

   It does not touch Bela: it uses its own marks (data-wb-*), and it leaves alone anything Bela has raked or drawn,
   and anything editable. Plain script, no library, no network. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.__wallbreaker) { W.__wallbreaker.scan(); return; }

  /* ---- the words: Bela's small dictionaries of connection (vespers.js, the deep rake) ---- */
  function list(s) { return s.split(' '); }
  var R_PREP = list('of in on at to for with by from as into onto under over through about between among against without within upon toward towards across along around during like near via per unto beside behind beyond above below despite amid amidst');
  var R_TAIL = list('of');
  var R_COP = list('is are was were am be been being');
  var R_REL = list('which that who whom whose where when because until unless although though since while whereas if so');
  var R_COORD = list('and but or nor yet');
  var V_ABBR = list('mr mrs ms dr st vs etc e.g i.e cf jr sr fig pp vol approx no');
  var V_CLOSE = '"\')]’”»', V_OPEN = '"\'([“‘«';
  var MIN = 4, DEEP = 3, MAXD = 8;
  function isLetter(c) { return c.toUpperCase() !== c.toLowerCase(); }
  function isUpper(c) { return c.toUpperCase() === c && c.toLowerCase() !== c; }
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function tok(w) { var i = 0, t = ''; while (i < w.length && !isLetter(w[i])) i++; while (i < w.length && (isLetter(w[i]) || w[i] === "'" || w[i] === '’')) t += w[i++]; return t.toLowerCase(); }
  function nwords(w) { return w.split(' ').length; }

  /* ---- AIRED OUT: words -> lines [{d, n}] (n words each); a period ends a line and returns to the margin, a comma
     ends a line and steps one deeper ---- */
  function bare(w) { var b = w.length; while (b > 0 && V_CLOSE.indexOf(w[b - 1]) >= 0) b--; return w.slice(0, b); }
  function lead(w) { var a = 0; while (a < w.length && V_OPEN.indexOf(w[a]) >= 0) a++; return w.slice(a); }
  function sentenceEnd(w, next) {
    var b = bare(w), c = b[b.length - 1];
    if (c !== '.' && c !== '!' && c !== '?') return false;
    if (!next) return true;
    var n0 = lead(next)[0] || '';
    if (!(isUpper(n0) || isDigit(n0) || V_OPEN.indexOf(next[0]) >= 0)) return false;
    if (c === '.') { var core = lead(b.slice(0, -1)); if ((core.length === 1 && isUpper(core)) || V_ABBR.indexOf(core.toLowerCase()) >= 0) return false; }
    return true;
  }
  function commaEnd(w, next) {
    if (!next) return false;
    var b = bare(w), c = b[b.length - 1];
    return c === ',' || c === ';' || c === ':' || w === '—' || w === '--' || /—$/.test(b);
  }
  function airOut(ws) {
    var lines = [], d = 0, cur = 0, i;
    for (i = 0; i < ws.length; i++) {
      cur++;
      var next = ws[i + 1];
      if (sentenceEnd(ws[i], next)) { lines.push({ d: d, n: cur }); cur = 0; d = 0; }
      else if (commaEnd(ws[i], next)) { lines.push({ d: d, n: cur }); cur = 0; d = Math.min(MAXD, d + 1); }
    }
    if (cur) lines.push({ d: d, n: cur });
    return lines;
  }

  /* ---- TILTED DOWN: one aired-out line lifted at its joints -- Bela's rLiftLine, on words ---- */
  function lift(ws0, d0) {
    var ws = ws0.slice(), out = [], cur = [], curD = d0, i, w, k, q = 0, p = 0, prev = '';
    if (ws.length <= MIN - 1) return [{ d: d0, n: ws.length }];
    for (i = 0; i < ws.length - 1; i++) if (tok(ws[i]) === 'so' && tok(ws[i + 1]) === 'that') ws.splice(i, 2, ws[i] + ' ' + ws[i + 1]);
    function push() { if (cur.length) out.push({ d: curD, w: cur }); cur = []; }
    for (i = 0; i < ws.length; i++) {
      w = ws[i]; k = tok(w);
      var inQuote = q > 0 || p > 0, first = cur.length === 0 && !out.length;
      if (!inQuote && !first && cur.length) {
        var opener = cur.length === 1 && (R_REL.indexOf(tok(cur[0])) >= 0 || R_PREP.indexOf(tok(cur[0])) >= 0 || tok(cur[0]) === 'so that');
        if (R_COORD.indexOf(k) >= 0 && i < ws.length - 1 && w === w.toLowerCase()) { push(); if (ws.length - 1 - i >= 3) out.push({ d: curD, w: [w] }); else cur.push(w); prev = k; continue; }
        if (!opener && (R_REL.indexOf(k) >= 0 || k === 'so that') && w === w.toLowerCase() && k !== 'so' && !(k === 'that' && i === ws.length - 1)) { push(); curD = Math.min(d0 + DEEP, curD + 1); cur.push(w); prev = k; continue; }
        if (R_COP.indexOf(k) >= 0 && cur.length >= 3) { push(); out.push({ d: curD, w: [w] }); prev = k; continue; }
        if (R_COP.indexOf(k) >= 0 && ws.length - 1 - i >= 3) { cur.push(w); push(); prev = k; continue; }
        if (!opener && R_PREP.indexOf(k) >= 0 && w === w.toLowerCase() && i < ws.length - 1 && R_COORD.indexOf(prev) < 0) {
          var tail = R_TAIL.indexOf(k) >= 0 || /(ed|ing)$/.test(prev);
          if (tail) { cur.push(w); push(); curD = Math.min(d0 + DEEP, curD + 1); prev = k; continue; }
          push(); curD = Math.min(d0 + DEEP, curD + 1); cur.push(w); prev = k; continue;
        }
      }
      if (!inQuote && R_COORD.indexOf(prev) >= 0 && out.length && out[out.length - 1].w.length === 1 && out[out.length - 1].w[0] === ws[i - 1]) curD = out.length > 1 ? out[out.length - 2].d : d0;
      cur.push(w);
      for (var c = 0; c < w.length; c++) { if ('"“'.indexOf(w[c]) >= 0) q++; if ('"”'.indexOf(w[c]) >= 0 && q > 0 && w[c] !== '“') q--; if (w[c] === '(') p++; if (w[c] === ')' && p > 0) p--; }
      prev = k;
    }
    push();
    for (i = out.length - 1; i > 0; i--) {
      var kk = tok(out[i].w[0]);
      if (out[i].w.length === 1 && out[i].w[0].indexOf(' ') < 0 && R_COORD.indexOf(kk) < 0 && R_COP.indexOf(kk) < 0) { out[i - 1].w = out[i - 1].w.concat(out[i].w); out.splice(i, 1); }
    }
    return out.map(function (o) { return { d: o.d, n: o.w.reduce(function (a, x) { return a + nwords(x); }, 0) }; });
  }
  function tiltDown(ws) {
    var lines = [], at = 0;
    airOut(ws).forEach(function (L) { lift(ws.slice(at, at + L.n), L.d).forEach(function (x) { lines.push(x); }); at += L.n; });
    return lines;
  }

  /* ---- the paragraph's text, word by word, with where each word stands in its text nodes ---- */
  function textNodes(root) {
    var out = [], tw = D.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode && n.parentNode.nodeName; return p === 'SCRIPT' || p === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), n;
    while ((n = tw.nextNode())) out.push(n);
    return out;
  }
  function wordsOf(root) {
    var nodes = textNodes(root), text = '', starts = [];
    nodes.forEach(function (n) { starts.push(text.length); text += n.data; });
    var ws = [], re = /\S+/g, m;
    while ((m = re.exec(text))) ws.push({ w: m[0], a: m.index, b: m.index + m[0].length });
    return { nodes: nodes, starts: starts, text: text, words: ws };
  }
  function pointAt(T, pos, isEnd) {
    for (var i = 0; i < T.nodes.length; i++) {
      var a = T.starts[i], b = a + T.nodes[i].data.length;
      if (isEnd ? (pos > a && pos <= b) : (pos >= a && pos < b)) return [T.nodes[i], pos - a];
    }
    var last = T.nodes[T.nodes.length - 1]; return [last, last.data.length];
  }

  /* ---- the view: each line a block of its own, cut from a copy of the paragraph, indented two spaces a step ---- */
  function render(src, plan) {
    var T = wordsOf(src), view = D.createElement('span'), at = 0;
    view.setAttribute('data-wb-view', '1');
    plan.forEach(function (L) {
      if (!L.n) return;
      var first = T.words[at], last = T.words[at + L.n - 1]; at += L.n;
      if (!first || !last) return;
      var r = D.createRange(), s = pointAt(T, first.a, false), e = pointAt(T, last.b, true);
      r.setStart(s[0], s[1]); r.setEnd(e[0], e[1]);
      var line = D.createElement('span');
      line.style.cssText = 'display:block;text-indent:0;padding-left:' + (2 * L.d) + 'ch';
      line.appendChild(r.cloneContents()); view.appendChild(line);
    });
    return view;
  }

  /* ---- the triangle and its three states ---- */
  var GLYPH = ['|>', '_|', '\\/'];
  var TITLE = ['air it out: a line at every period and comma (shift+click: back)', 'tilt it down: the joints inside each line too (shift+click: back)', 'gather it back as the page set it (shift+click: back)'];
  var marked = [];
  function apply(st) {
    var p = st.p;
    if (st.view) { st.view.remove(); st.view = null; }
    if (st.state === 0) { p.appendChild(st.stash); st.stash = D.createDocumentFragment(); return; }
    if (!st.stash.childNodes.length) { var n = st.tri.nextSibling; while (n) { var nx = n.nextSibling; st.stash.appendChild(n); n = nx; } }   /* the page's own nodes, set aside untouched */
    var src = D.createElement('div'); src.appendChild(st.stash.cloneNode(true));
    var ws = wordsOf(src).words.map(function (x) { return x.w; });
    st.view = render(src, st.state === 1 ? airOut(ws) : tiltDown(ws));
    p.appendChild(st.view);
  }
  function mark(p) {
    var cs = getComputedStyle(p), rect = p.getBoundingClientRect();
    var st = { p: p, state: 0, stash: D.createDocumentFragment(), view: null, pos: p.style.position, tri: D.createElement('span') };
    if (cs.position === 'static') p.style.position = 'relative';
    var t = st.tri, room = Math.max(4, Math.min(30, rect.left - 2));
    t.setAttribute('data-wb-tri', '1'); t.setAttribute('role', 'button'); t.setAttribute('aria-label', TITLE[0]);
    t.textContent = GLYPH[0]; t.title = TITLE[0];
    t.style.cssText = 'position:absolute;left:-' + room + 'px;top:0;font:11px/16px ui-monospace,Consolas,monospace;color:#8f98a5;'
      + 'border:1px solid #3a3f47;border-radius:6px;padding:0 3px;background:rgba(18,20,26,.82);cursor:pointer;user-select:none;'
      + 'z-index:2147483000;text-indent:0;letter-spacing:0;white-space:pre';
    t.addEventListener('mouseenter', function () { t.style.borderColor = '#3f86d6'; t.style.color = '#d8e8fa'; });
    t.addEventListener('mouseleave', function () { t.style.borderColor = '#3a3f47'; t.style.color = '#8f98a5'; });
    t.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); });
    t.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      st.state = (st.state + (e.shiftKey ? 2 : 1)) % 3; t.textContent = GLYPH[st.state]; t.title = TITLE[st.state]; t.setAttribute('aria-label', TITLE[st.state]);
      apply(st);
    });
    p.insertBefore(t, p.firstChild); p.setAttribute('data-wb', '1');
    marked.push(st);
  }
  function unmarkAll() {
    marked.forEach(function (st) {
      if (st.state) { st.state = 0; apply(st); }
      st.tri.remove(); st.p.removeAttribute('data-wb'); st.p.style.position = st.pos;
    });
    marked = [];
  }

  /* ---- which paragraphs: the one at the centre of the screen, and its visible siblings ---- */
  var PARA = { P: 1, LI: 1, BLOCKQUOTE: 1, DD: 1, FIGCAPTION: 1 };
  function hands(el) {
    return !el || el.closest('[contenteditable], textarea, input, select, button, pre, code, [data-wb-tri], [data-bk-raked], [data-bk-wyrd-box], #blinken-clock, #bk-tilts, #bk-ring-sheet, #bk-blue');
  }
  function readable(el) {
    if (!el || el.nodeType !== 1 || hands(el)) return false;
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length < 40 || !/[.,;:!?]/.test(t)) return false;
    if (PARA[el.tagName]) return true;
    if (el.tagName === 'DIV' || el.tagName === 'SECTION' || el.tagName === 'SPAN') {      /* a div of running text, with no blocks of its own inside */
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) { var dsp = getComputedStyle(c).display; if (dsp === 'block' || dsp === 'flex' || dsp === 'grid' || dsp === 'list-item' || dsp === 'table') return false; }
      return getComputedStyle(el).display !== 'inline';
    }
    return false;
  }
  function paraAt(x, y) {
    var el = D.elementFromPoint(x, y);
    while (el && el !== D.body) { if (readable(el)) return el; el = el.parentElement; }
    return null;
  }
  function scan() {
    var cx = W.innerWidth / 2, cy = W.innerHeight / 2, p = paraAt(cx, cy);
    if (!p) { var i; for (i = 1; i <= 4 && !p; i++) p = paraAt(cx, cy - i * 40) || paraAt(cx, cy + i * 40); }   /* between two paragraphs: the nearest above or below */
    if (!p) { if (marked.length) unmarkAll(); return; }                                                  /* nothing readable here: nothing is done (or, if some are marked, all are given back) */
    var fresh = 0, sibs = p.parentElement ? Array.prototype.slice.call(p.parentElement.children) : [p];
    sibs.forEach(function (s) {
      if (s.hasAttribute('data-wb') || !readable(s)) return;
      var r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > W.innerHeight || !r.width) return;   /* only those in view */
      mark(s); fresh++;
    });
    if (!fresh && marked.length) unmarkAll();                                                            /* clicked again with nothing new: all given back */
  }
  /* nuage: mark() one paragraph at a time, and no scan on load */
  W.__wallbreaker = { scan: scan, off: unmarkAll, mark: function (p) { if (!p.hasAttribute('data-wb') && readable(p)) mark(p); },
    plan: function (text) { return tiltDown(text.split(/\s+/).filter(Boolean)); } };   /* the depths, for the tincture */
})();
