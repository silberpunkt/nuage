/* nuage.js -- the mind in the cloud. A classic chat engine, no model: an impure LISP reader, a knowledge base of
   Cyc-shaped assertions, and the old tricks (pattern, reflection, a little knowing). The packer appends the knowledge
   as this function's one argument and deflates the lot; the unpacker evals it and runs its stages, counting each.

   Stages must not touch the page: the packer runs them in Node to time them (that timing sets the bar's widths). */
(function (KB, SAMPLE, UI) {
  var forms = [], flat = [], gen = {}, isa = {}, kids = {}, cm = {}, lex = {}, names = {}, mass = {}, taught = 0;
  // microtheories: every fact lives in one (BaseKB unless said); a fact is seen only from its own mt or one beneath it
  var mtOf = {}, mtHome = {}, genlMt = {}, mtWord = {}, dis = {}, dflt = {}, rules = [], ctx = 'BaseKB', vis = { BaseKB: 1 }, why = null;

  // ---- read: s-expressions. Symbols, numbers, "strings" ({s:...}), ; comments. Impure: everything is a mutable cell.
  function* read() {
    var s = KB, i = 0, n = s.length, st = [[]], step = Math.max(1, n >> 6), mark = step, c, j, t;
    while (i < n) {
      c = s[i];
      if (c === ';') { while (i < n && s[i] !== '\n') i++; continue; }
      if (c <= ' ') { i++; continue; }
      if (c === '(') { st.push([]); i++; continue; }
      if (c === ')') { t = st.pop(); st[st.length - 1].push(t); i++; continue; }
      if (c === '"') { j = i + 1; t = ''; while (j < n && s[j] !== '"') { if (s[j] === '\\') j++; t += s[j++]; } st[st.length - 1].push({ s: t }); i = j + 1; }
      else { j = i; while (j < n && s[j] > ' ' && s[j] !== '(' && s[j] !== ')') j++; t = s.slice(i, j); st[st.length - 1].push(t === '' || isNaN(t) ? t : +t); i = j; }
      if (i >= mark) { mark += step; yield i / n; }
    }
    forms = st[0]; yield 1;
  }

  // ---- index: the assertions into tables.
  //   (genls X Y) every X is a Y     (isa X Y) X is one Y      (comment X "...")   (word X "w" ...)   (mass X)
  //   (disjoint X Y) nothing is both  (default (X ?x) => (p ?x) ...) Xs p, unless (except Z p)
  //   (rule (T ?x) (c ?x) => (p ?x) ...) a commonsense step     (in-mt M form ...)  (genlMt M N)  (mt-word M "w" ...)
  function push(t, k, v) { (t[k] || (t[k] = [])).push(v); }
  function tag(key, mt, x) { if (mt !== 'BaseKB') { mtOf[key] = mt; if (x && !mtHome[x]) mtHome[x] = mt; } }
  function put(f, mt) {
    var op = f[0], x = f[1], y = f[2], w, j;
    if (op === 'genls') { push(gen, x, y); push(kids, y, x); tag('g|' + x + '|' + y, mt, x); }
    else if (op === 'isa') { push(isa, x, y); push(kids, y, x); tag('i|' + x + '|' + y, mt, x); }
    else if (op === 'comment') { cm[x] = y.s; tag('c|' + x, mt, x); }
    else if (op === 'mass') mass[x] = 1;
    else if (op === 'unique') uniq[x] = 1;
    else if (op === 'has') push(has, x, y.s);
    else if (op === 'prop') push(props, x, { a: y, v: f[3].s, mt: mt });
    else if (op === 'said') push(saids, x, y.s);
    else if (op === 'qual') { w = f[3] && f[3].s === 'not'; push(quals, x, { v: y.s, neg: w, e: (f[w ? 4 : 3] || {}).s || '' }); qword[y.s] = 1; }
    else if (op === 'means') means[x.s] = y.s;
    else if (op === 'opposite') { opp[x] = y; opp[y] = x; }
    else if (op === 'why') push(whys, x, { v: y.s, mt: mt });
    else if (op === 'vext') vexts.push(vextOf(x.s, y.s, mt));
    else if (op === 'picture') pictures.push({ title: x.s, key: keyOf(x.s), art: y.s, mt: mt });
    else if (op === 'upper') for (w = 1; w < f.length; w++) UPPER[f[w]] = 1;   // floors: filed through, not mentioned
    else if (op === 'word') for (w = 2; w < f.length; w++) lex[f[w].s] = x;
    else if (op === 'disjoint') { push(dis, x, y); push(dis, y, x); tag('d|' + x + '|' + y, mt); tag('d|' + y + '|' + x, mt); }
    else if (op === 'default') for (j = f.indexOf('=>') + 1; j < f.length; j++) { push(dflt, x[0], { p: f[j][0], v: true, mt: mt }); }
    else if (op === 'except') for (j = 2; j < f.length; j++) push(dflt, x, { p: f[j], v: false, mt: mt });
    else if (op === 'rule') { j = f.indexOf('=>'); rules.push({ body: f.slice(1, j), head: f.slice(j + 1), mt: mt }); }
    else if (op === 'genlMt') push(genlMt, x, y);
    else if (op === 'mt-word') for (w = 2; w < f.length; w++) { mtWord[f[w].s] = x; mtWord[f[w].s.replace(/^the /, '')] = x; }
    if ((op === 'genls' || op === 'isa' || op === 'comment') && !genlMt[x]) names[x] = 1;   // a world is not a thing to talk about
    if (op === 'genls') names[y] = 1;
  }
  function* index() {
    forms.forEach(function (f) { if (f[0] === 'in-mt') { f.slice(2).forEach(function (g) { flat.push([g, f[1]]); }); if (!genlMt[f[1]]) genlMt[f[1]] = []; } else flat.push([f, 'BaseKB']); });
    for (var k = 0; k < flat.length; k++) { put(flat[k][0], flat[k][1]); if ((k & 63) === 63) yield k / flat.length; }
    yield 1;
  }

  // ---- seeing from a microtheory: what is visible from where the talk is
  function setCtx(m) { ctx = m; vis = { BaseKB: 1 }; var q = [m]; while (q.length) { var x = q.shift(); if (vis[x] && x !== m) continue; vis[x] = 1; q.push.apply(q, genlMt[x] || []); } }
  function ok(key) { var m = mtOf[key]; return !m || !!vis[m]; }
  function g(x) { return (gen[x] || []).filter(function (y) { return ok('g|' + x + '|' + y); }); }
  function i(x) { return (isa[x] || []).filter(function (y) { return ok('i|' + x + '|' + y); }); }
  function k(c) { return (kids[c] || []).filter(function (x, n, all) { return all.indexOf(x) === n && (g(x).indexOf(c) >= 0 || i(x).indexOf(c) >= 0); }); }
  function gloss(c) {                                        // a gloss that starts by naming its own thing ("a vice is ...") is cut back, so no answer stutters
    if (!cm[c] || !ok('c|' + c)) return null;
    var w = spoken(c).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), t = cm[c].replace(new RegExp('^(?:(?:an?|the) )?' + w + 's? (?:is|are) ', 'i'), '').replace(/^(A|An|The) (?=[a-z])/, function (x) { return x.toLowerCase(); });   // "A self-luminous ..." sits mid-sentence
    return t;
  }
  function seen(c) { return c === 'Thing' || g(c).length || i(c).length || gloss(c) || k(c).length; }
  function name(c) { return isa[c] ? c.replace(/([a-z])([A-Z])/g, '$1 $2') : spoken(c); }   // individuals keep their capitals: Sir Dumptruck
  function mtName(m) { return cap(spoken(m.replace(/Mt$/, ''))); }

  // ---- words: every concept also answers to its own name, split at its capitals (AnimalBodyPart: animal body part)
  function spoken(c) { return c.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); }
  // PLURALS: most take -s (chair, chairs), some -es (box, boxes), some -ies (berry, berries); the old irregulars are listed,
  // and some are the same both ways (fish, sheep, deer). "Fishes" is left out on purpose: in plain English it is the verb.
  var IRREG = { person: 'people', man: 'men', woman: 'women', child: 'children', mouse: 'mice', goose: 'geese', tooth: 'teeth', foot: 'feet', ox: 'oxen',
    louse: 'lice', die: 'dice', knife: 'knives', leaf: 'leaves', wolf: 'wolves', life: 'lives', wife: 'wives', half: 'halves', shelf: 'shelves', loaf: 'loaves',
    thief: 'thieves', calf: 'calves', elf: 'elves', cactus: 'cacti', fungus: 'fungi', nucleus: 'nuclei', crisis: 'crises', phenomenon: 'phenomena',
    fish: 'fish', sheep: 'sheep', deer: 'deer', moose: 'moose', salmon: 'salmon', trout: 'trout', aircraft: 'aircraft', spacecraft: 'spacecraft', series: 'series', species: 'species' };
  function* words() {
    var all = Object.keys(names), k;
    for (k = 0; k < all.length; k++) {
      var w = spoken(all[k]), lastW = w.split(' ').pop(), stem = w.slice(0, w.length - lastW.length);
      if (!lex[w]) lex[w] = all[k];
      if (IRREG[lastW]) { if (!lex[stem + IRREG[lastW]]) lex[stem + IRREG[lastW]] = all[k]; }
      else if (/(s|x|z|ch|sh)$/.test(w)) { if (!lex[w + 'es']) lex[w + 'es'] = all[k]; }
      else if (!lex[w + 's']) lex[w + 's'] = all[k];
      if (/y$/.test(w) && !lex[w.slice(0, -1) + 'ies']) lex[w.slice(0, -1) + 'ies'] = all[k];
      if (/[^s]s$/.test(w) && !lex[w.slice(0, -1)]) lex[w.slice(0, -1)] = all[k];   // a plural label answers to its singular: mental functions, mental function
      if ((k & 63) === 63) yield k / all.length;
    }
    yield 1;
  }

  // ---- knowing
  function up(c) {                                           // the first line of more-general kinds, up to Thing
    var path = [], seen = {}, x = c;   // (a local 'seen': the visited set)
    while (g(x).length && !seen[x]) { seen[x] = 1; x = g(x)[0]; path.push(x); }
    return path;
  }
  function kindOf(c, d) {                                    // all paths, breadth first: is c a kind (or instance) of d?
    var q = [c].concat(i(c)), seen = {};
    while (q.length) { var x = q.shift(); if (x === d) return true; if (seen[x]) continue; seen[x] = 1; q.push.apply(q, g(x)); }
    return false;
  }
  var UPPER = { Thing: 1, Individual: 1, Collection: 1, SpatialThing: 1, PartiallyTangible: 1 };   // the philosophers' floors: true, and no help in conversation
  var uniq = {};   // (unique X): there is only one, so "the": the imaginary unit, not an imaginary unit
  function a(w) { return lex[w] && uniq[lex[w]] ? 'the ' + w : lex[w] && mass[lex[w]] ? w : (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w; }   // furniture, not a furniture
  var GENERIC = { something: 'Thing', anything: 'Thing', everything: 'Thing', stuff: 'Thing', thing: 'Thing', things: 'Thing' };
  var pending = null, topic = null, has = {}, said = {};   // what was last talked about; what things have; asides already given                                        // a word Nuage has just asked about, waiting to be taught
  var SHORT = { "what's": 'what is', "who's": 'who is', "where's": 'where is', "how's": 'how is', "that's": 'that is', "there's": 'there is', "it's": 'it is', "whats": 'what is', "what're": 'what are' };
  function expand(p) { return p.replace(/\b[a-z]+'?(?:s|re)\b/gi, function (w) { return SHORT[w.toLowerCase()] || w; }); }
  function clean(p) { return expand(p.toLowerCase().replace(/[\u2018\u2019]/g, "'")).replace(/["\u201c\u201d]/g, '').replace(/[?.!,;:]+$/, '').replace(/^\s*(an?|the|some) /, '').replace(/\s+/g, ' ').trim(); }
  function find(phrase) { var p = clean(phrase); return lex[p] || (GENERIC[p] && names[GENERIC[p]] && GENERIC[p]) || null; }
  function nounish(p) { return /^[a-z][a-z' -]*$/.test(p) && p.split(' ').length <= 3 && !/^(it|this|that|there|he|she|they|i|you|we|what|who|why|how|where|when|which|whose|your|my|in|on)\b/.test(p); }
  function ask(phrase) {
    var p = clean(phrase);
    if (!nounish(p)) return null;
    pending = p; var P = p.replace(/\b[a-z][\w']*/g, function (w) { var r = new RegExp('(?:^|[^.?!]\\s)(' + w.charAt(0).toUpperCase() + w.slice(1) + ')\\b').exec(heard); return r ? r[1] : w; });   // France stays France
    var nm = near(p), wh = 'hat is ' + (/^\s*the /i.test(phrase) ? 'the ' + P : /^[A-Z]/.test(P) ? P : a(P)) + '?';   // the capital of France, not a capital of France
    if (nm.length) { dwim = { from: p, to: nm, line: heard }; return 'I have no card for "' + P + '" yet. Did you mean ' + nm.join(' or ') + '? If not, w' + wh; }
    return 'I have no card for "' + P + '" yet. W' + wh;
  }
  // ---- Do What I Mean (after Teitelman's DWIM): for a word I do not know, the nearest words I do, offered and never
  // assumed. "Yes" takes the first; naming one takes that one; anything else teaches me the new word, as before.
  var dwim = null;
  function lev(x, y, max) {                                  // edit distance, given up once it passes max
    var prev = [], pp = [], cur, i, j, lo;   // with transpositions: "chiar" is one step from "chair"
    for (j = 0; j <= y.length; j++) prev[j] = j;
    for (i = 1; i <= x.length; i++) { cur = [i]; lo = i; for (j = 1; j <= y.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1); if (cur[j] < lo) lo = cur[j]; } if (lo > max) return max + 1; pp = prev; prev = cur; }
    return prev[y.length];
  }
  function near(p) {
    if (p.length < 4) return [];
    var max = p.length < 7 ? 1 : 2, out = [];
    Object.keys(lex).forEach(function (w) { var c = lex[w], d; if (Math.abs(w.length - p.length) > max || UPPER[c] || !seen(c)) return; d = lev(p, w, max); if (d <= max) out.push([d + (w[0] === p[0] ? 0 : 0.5), w]); });
    var cs = [];   // one word for each thing: not "bicycle or bicycles"
    return out.sort(function (u, v) { return u[0] - v[0] || u[1].length - v[1].length || (u[1] < v[1] ? -1 : 1); }).filter(function (x) { var c = lex[x[1]]; if (cs.indexOf(c) >= 0) return false; cs.push(c); return true; }).slice(0, 3).map(function (x) { return x[1]; });
  }
  function down(c, n) {                                      // n of the kinds below c, the most particular first
    var q = k(c).slice(), all = [], seen = {};
    while (q.length) { var x = q.shift(); if (seen[x]) continue; seen[x] = 1; all.push(x); q.push.apply(q, k(x)); }
    return all.filter(function (x) { return !UPPER[x]; }).slice(0, n).map(spoken);   // breadth first, in the knowledge's own order (most everyday first)
  }
  function kinds(c, n) { return k(c).slice(0, n || 6).map(spoken); }
  function elsewhere(c) { return 'I know ' + name(c) + ' in ' + mtName(mtHome[c]) + '. Say "Let\'s talk about ' + mtName(mtHome[c]) + '," and I will tell you.'; }
  function what(phrase) {
    var c = findOne(clean(phrase)), qv = clean(phrase).replace(/^(being|to be) /, '');
    if (!c && (qword[qv] || means[qv])) return qualTell(qv);   // "what is alive?": a quality you told me of
    if (!c) return ask(phrase) || 'I have no card for that in this little cloud.';
    if (!seen(c) && mtHome[c]) return elsewhere(c);
    var told = toldOf(c);
    if (only(c)) { pending = spoken(c); return (told.length ? 'You told me that ' + list(told) + ', but not what kind of thing ' + a(spoken(c)) + ' is.' : 'I have heard of ' + plural(spoken(c)) + (k(c).length ? ' (' + a(spoken(k(c)[0])) + ' is one)' : '') + ', but not what ' + a(spoken(c)) + ' is.') + ' What is ' + a(spoken(c)) + '?'; }
    topic = c;
    var w = spoken(c), p = up(c), out = '', kk = kinds(c, 5);
    if (i(c).length) out = name(c) + ' is ' + a(spoken(i(c)[0])) + (gloss(c) ? ': ' + gloss(c) : '') + '.';
    p = p.filter(function (x) { return !UPPER[x]; }).slice(0, 3);
    var pl = /[^s]s$/.test(w) && !mass[c], one = pl || / of /.test(w) || mass[c];   // "mental functions are", "quality of sleep is"
    var gl = gloss(c); if (gl && !pl && !/^(an?|the|one|any|some|something|someone|anything|everything|every|each|being|having|[a-z]+s)\b/.test(gl) && /^[a-z]/.test(gl)) gl = a(gl);   // "a dog is a canine animal that..."
    if (!i(c).length) out = cap(one ? w : a(w)) + (pl ? ' are ' : ' is ') + (gl ? gl + '.' + (p.length ? (pl ? ' They are kinds of ' : ' It is a kind of ') : '') : (pl ? 'kinds of ' : 'a kind of ') + (p.length ? '' : 'thing.'));
    if (p.length) out += spoken(p[0]) + (p.length > 1 ? ', and so of ' + list(p.slice(1).map(spoken)).replace(/ and /g, ' and of ').replace(/, /g, ', of ').replace(/of and of/, 'and of') : '') + '.';
    if (has[c]) out += ' It has ' + list(has[c]) + '.';
    if (kk.length) out += ' The kinds I know are ' + list(kk) + '.';
    if (told.length) out += ' You told me that ' + list(told) + '.';
    return out;
  }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }
  // the house style, after Strunk and White: capitals, commas, periods; the serial comma; small numbers in words
  function list(v) { return v.length < 2 ? v.join('') : v.length === 2 ? v[0] + ' and ' + v[1] : v.slice(0, -1).join(', ') + ', and ' + v[v.length - 1]; }
  function num(n) { return n < 10 ? ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] : n.toLocaleString('en-US'); }
  function pathTo(x, y) {                                    // the shortest chain of kinds from x up to y
    var q = [[x]], seenp = {};
    while (q.length) { var pth = q.shift(), z = pth[pth.length - 1]; if (z === y) return pth; if (seenp[z]) continue; seenp[z] = 1; i(z).concat(g(z)).forEach(function (u) { q.push(pth.concat([u])); }); }
    return [x, y];
  }
  function apart(x, y) {                                     // the honest no: some kind of x and some kind of y are disjoint
    var ax = [x].concat(i(x), up(x)), ay = [y].concat(up(y)), p, q;
    for (p = 0; p < ax.length; p++) for (q = 0; q < ay.length; q++) if ((dis[ax[p]] || []).indexOf(ay[q]) >= 0 && ok('d|' + ax[p] + '|' + ay[q])) {
      why = 'Nothing is both ' + a(spoken(ax[p])) + ' and ' + a(spoken(ay[q])) + '.';
      why = (ax[p] === x ? '' : cap(a(spoken(x))) + ' is ' + a(spoken(ax[p])) + '. ') + why;
      return 'No. ' + (ax[p] === x ? why : cap(a(spoken(x))) + ' is ' + a(spoken(ax[p])) + ', not ' + a(spoken(y)) + '.');
    }
    return null;
  }
  function isQ(rest) {                                       // "is a chair a kind of furniture": try every split
    var ws = clean(rest).replace(/\b(a kind of|a type of|an?|the)\b/g, ' ').trim().split(/\s+/), i, x, y;
    for (i = 1; i < ws.length; i++) {
      x = find(ws.slice(0, i).join(' ')); y = find(ws.slice(i).join(' '));
      if (x && y) topic = x;
      if (x && y) return kindOf(x, y) ? 'Yes. ' + cap(a(spoken(x))) + ' is a kind of ' + spoken(y) + ' (' + pathTo(x, y).map(spoken).join(' > ') + ').'
                                      : apart(x, y) || 'Not that I know. ' + cap(a(spoken(x))) + ' is a kind of ' + (function (ps) { return ps.length ? ps[0] + (ps.length > 1 ? ', and so of ' + list(ps.slice(1)).replace(/ and /g, ' and of ') : '') : 'thing'; })(up(x).filter(function (u) { return !UPPER[u]; }).slice(0, 3).map(spoken)) + '.';
    }
    return null;
  }

  // ---- being taught (the oldest trick that is not a trick: ask, and remember)
  function camel(p) { return p.split(/[ -]/).map(cap).join(''); }
  function only(c) { var p = g(c); return p.length === 1 && p[0] === 'Thing' && !gloss(c); }   // filed under thing, and nothing more said
  // ---- VEXT: a card written as indented lines, two spaces a step (user1, 1 xi 2026: "One can chunk off details at the bottom,
  // or be picky or not at indent levels"). Nuage tells the top of it, and goes one level deeper each time you say "more".
  var vexts = [], deeper = null, pictures = [], listed = null, props = {}, opp = {}, whys = {};
  // ---- PROPERTIES: (prop Sky colour "blue by day") and (has Week "seven days"), found by walking up the kinds, so a dog
  // inherits the four legs of a mammal unless a nearer word says otherwise
  function climb(c, test) { var q = [c], seenc = {}, x, r0; while (q.length) { x = q.shift(); if (seenc[x]) continue; seenc[x] = 1; if ((r0 = test(x))) return { at: x, v: r0 }; q.push.apply(q, i(x).concat(g(x))); } return null; }
  function propOf(c, attr) { return climb(c, function (x) { var hit = (props[x] || []).filter(function (pr) { return pr.a === attr && vis[pr.mt]; })[0]; return hit && hit.v; }); }
  function hasAbout(c, noun) {
    var w = noun.replace(/s$/, ''), re = new RegExp('\\b' + w.replace(/[^a-z ]/g, '') + '(e?s)?\\b');
    return climb(c, function (x) { return (has[x] || []).filter(function (h) { return re.test(h); })[0]; });
  }
  function whose(c) { return isa[c] ? name(c) : a(spoken(c)); }
  function propQ(attr, phrase, verb) {
    var c = find(phrase); if (!c) return ask(phrase) || 'I have no card for that in this little cloud.';
    if (!seen(c) && mtHome[c]) return elsewhere(c);
    var hit = propOf(c, attr); topic = c;
    if (!hit) return 'I do not know ' + (verb ? verb.replace('%', / (live|eat|come from)$/.test(verb) ? (mass[c] ? spoken(c) : plural(spoken(c))) : whose(c)) : 'the ' + attr + ' of ' + whose(c)) + '.';
    var one = /^(sky|sun|moon|earth|sea|ocean)$/.test(spoken(c)), subj = one ? 'the ' + spoken(c) : mass[c] ? spoken(c) : plural(spoken(c)), be = one || mass[c] ? ' is ' : ' are ';
    return cap(attr === 'colour' || attr === 'temperature' || attr === 'shape' || attr === 'size' ? subj + be + hit.v :
      attr === 'material' ? whose(c) + ' is made of ' + hit.v : attr === 'eats' ? (mass[c] ? spoken(c) : plural(spoken(c))) + ' eat ' + hit.v :
      attr === 'lives' ? (mass[c] ? spoken(c) : plural(spoken(c))) + ' live ' + hit.v : attr === 'does' ? whose(c) + ' ' + hit.v : attr === 'measures' ? cap(a(spoken(c))) + ' measures ' + hit.v : attr === 'origin' ? (uniq[c] || one ? 'the ' + spoken(c) : mass[c] ? spoken(c) : plural(spoken(c))) + (uniq[c] || one || mass[c] ? ' came ' : ' come ') + hit.v : spoken(c) + ': ' + hit.v) + '.';
  }
  function isPrime(n) { if (n < 2 || n % 1) return false; for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }   // listed: the last list given, and how far into it
  function keyOf(title) { return title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w && !/^(the|a|an|of|and|in|on|me|my|your)$/.test(w); }); }
  function pictureFind(phrase) {                             // painted chat: a picture Nuage has, by the words of its title
    var ws = ' ' + phrase.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\b(yourself|you)\b/g, 'nuage') + ' ', i, hid = null;
    for (i = 0; i < pictures.length; i++) if (pictures[i].key.every(function (k) { return ws.indexOf(' ' + k + ' ') >= 0; })) { if (vis[pictures[i].mt]) return pictures[i]; hid = pictures[i]; }
    return hid ? { hidden: hid } : null;
  }
  function vextOf(title, body, mt) {
    var lines = body.split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return { d: Math.floor(l.match(/^ */)[0].length / 2), t: l.trim() }; });
    var key = title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w && !/^(the|a|an|of|and|in|on)$/.test(w); });
    return { title: title, lines: lines, key: key, mt: mt, most: lines.reduce(function (m, l) { return Math.max(m, l.d); }, 0) };
  }
  function vextFind(phrase) {
    var ws = ' ' + phrase.toLowerCase().replace(/[^a-z0-9 ]/g, ' ') + ' ';
    for (var i = 0; i < vexts.length; i++) if (vis[vexts[i].mt] && vexts[i].key.every(function (k) { return ws.indexOf(' ' + k + ' ') >= 0 || ws.indexOf(' ' + k + 's ') >= 0; })) return vexts[i];
    return null;
  }
  function vextTell(v, d) {                                  // the card down to depth d, its indentation kept
    deeper = d < v.most ? { v: v, d: d } : null;
    var out = v.title + '\n' + v.lines.filter(function (l) { return l.d <= d; }).map(function (l) { return new Array(l.d + 1).join('  ') + l.t; }).join('\n');
    return out + (deeper ? '\n(Say "more" for the next level of detail.)' : '');
  }

  var journal = [];                                          // what you taught me, in my own forms: kept, shown, and given back on waking
  function jot(form) { journal.push(ctx === 'BaseKB' ? form : '(in-mt ' + ctx + ' ' + form + ')'); }
  function make(p) {                                         // a new card; "root vegetable" is filed under "vegetable" (its head word)
    var c = camel(p), ws = p.split(' '), h;
    names[c] = 1; lex[p] = c; lex[p + 's'] = c;
    h = ws.length > 1 ? find(ws[ws.length - 1]) || make(ws[ws.length - 1]) : 'Thing';
    push(gen, c, h); push(kids, h, c); tag('g|' + c + '|' + h, ctx, c); jot('(genls ' + c + ' ' + h + ')');
    return c;
  }
  function refile(x, y) {                                    // a card filed under thing alone moves to where it was taught to go
    if (only(x)) { gen[x] = []; kids.Thing = (kids.Thing || []).filter(function (k) { return k !== x; }); journal = journal.filter(function (j) { return j.indexOf('(genls ' + x + ' Thing)') < 0; }); }
    push(gen, x, y); push(kids, y, x); tag('g|' + x + '|' + y, ctx, x); jot('(genls ' + x + ' ' + y + ')');
  }
  function learn(xp, yp, asked) {
    var raw = clean(yp), xs = clean(xp), ys = raw.replace(/^(kind|type|sort) of /, '').replace(/^(an?|the) /, ''), x = find(xs), y = find(ys), q = '';
    if (!nounish(xs) || !nounish(ys) || /\b(it|this|that|these|those|he|she|they|you|i|we)\b/.test(xs)) return null;
    if (!asked && !y && !/s$/.test(xs)) return null;   // "hahaha, that's wonderful" is praise, not a lesson: a lesson names a noun   // "hahaha, that's wonderful" is praise, not a lesson
    if (!y) y = make(ys);
    if (x && kindOf(x, y)) { pending = null; return 'I knew that: ' + a(spoken(x)) + ' is a kind of ' + spoken(y) + '.'; }
    if (!x) x = make(xs);
    refile(x, y); taught++; topic = x;
    var open = only(y) ? y : (g(y).length && only(g(y)[0]) ? g(y)[0] : null);   // the next thing not yet understood, if any
    pending = open ? spoken(open) : null; if (open) q = ' What, then, is ' + a(spoken(open)) + '?';
    return 'Thank you. Now I know ' + a(xs) + ' is a kind of ' + ys + '.' + q;
  }

  // ---- BEING TOLD (User1's report, 3 xi 2026: "Things are not alive. Entities are alive." was filed as "a things is a
  // kind of not alive"). English marks the difference, and so do I now:
  //   "A worm is an animal."       an article: a kind, filed
  //   "A worm is alive."           no article: a quality, kept with the worm, never filed as a kind
  //   "Things are not alive."      not: a quality denied, or a thing said, and never filed at all
  //   "An entity is a thing with a nature."   a kind (thing), and the rest kept as what an entity is
  //   "Entity is the quality of being alive." "A quality is how a thing is distinguished."   kept as said, word for word
  //   "Alive means conscious."  "To distinguish is to separate."   what a word means
  //   "A dish holds food."  "Large entities consume small ones."   kept as said, of the thing it is said of
  // Plurals are taken back to one (entities, entity), and each, every, all, and the like are set aside. What I keep, I
  // say back in your words, so you can see what I took.
  var quals = {}, qword = {}, means = {}, saids = {};
  var LEAD = /^(?:(?:correction|note|nb|so|well|yes|no|indeed|actually|and then|then|and|but|also|i understand|i see|i know|i agree|i think|i believe|i suppose|i guess|i would say|i'd say|mainly|ok|okay|right|true|sometimes|often|usually|now|by example|for example)\s*[:,]?\s+)+/i;
  var DETS = /^(?:(?:an?|the|each|every|all|any|some|both|such|many|most|another|other|these|those|its|their|his|her|our|my|your)\s+)+/;
  function sing(p) {                                         // the one of a plural: entities, entity; dishes, dish; people, person
    var ws = p.split(' '), w = ws.pop(), r;
    for (r in IRREG) if (IRREG[r] === w) { ws.push(r); return ws.join(' '); }
    ws.push(/ies$/.test(w) && w.length > 4 ? w.slice(0, -3) + 'y' : /(ss|us|is|ous)$/.test(w) ? w : /(ss|x|z|ch|sh)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) ? w.slice(0, -1) : w);
    return ws.join(' ');
  }
  function many(p) { return /[^s]s$|ies$|(ss|x|z|ch|sh)es$/.test(p.split(' ').pop()) && !/(us|is|ous)$/.test(p) || IRREG_PL[p.split(' ').pop()]; }
  var IRREG_PL = {}; for (var ir in IRREG) IRREG_PL[IRREG[ir]] = 1;
  function findOne(p) { return find(p) || (many(p) ? find(sing(p)) : null); }
  function echoOf(s) { return s.replace(/^[A-Z](?=[a-z]|\s)/, function (c0) { return /^I\b/.test(s) ? c0 : c0.toLowerCase(); }); }   // your words, mid-sentence
  function keepSaid(c, e) { if (!c) return; if ((saids[c] || []).indexOf(e) < 0) { push(saids, c, e); jot('(said ' + c + ' "' + e.replace(/"/g, "'") + '")'); } taught++; }
  function toldOf(c) {                                       // what you told me of it, newest last, three at most
    var out = (saids[c] || []).slice(); (quals[c] || []).forEach(function (q) { if (out.indexOf(q.e) < 0) out.push(q.e); });
    return out.slice(-3);
  }
  function qualOf(c, v) { return climb(c, function (x) { return (quals[x] || []).filter(function (q) { return q.v === v; })[0]; }); }   // the nearest word wins
  function qualTell(v) {                                     // "what is alive?": what it means, and who is and is not
    var yes = [], no = [];
    Object.keys(quals).forEach(function (c) { quals[c].forEach(function (q) { var nm = isa[c] || mass[c] ? spoken(c) : plural(spoken(c)); if (q.v === v && yes.indexOf(nm) < 0 && no.indexOf(nm) < 0) (q.neg ? no : yes).push(isa[c] || mass[c] ? spoken(c) : plural(spoken(c))); }); });
    var out = means[v] ? cap(v) + ' means ' + means[v] + ', as you told me.' : 'I know ' + v + ' only from what you told me.';
    if (yes.length) out += ' ' + cap(list(yes)) + (yes.length === 1 && !many(yes[0]) ? ' is ' : ' are ') + v + (no.length ? ', and ' + list(no) + ' ' + (no.length === 1 && !many(no[0]) ? 'is' : 'are') + ' not.' : '.');
    else if (no.length) out += ' ' + cap(list(no)) + (no.length === 1 && !many(no[0]) ? ' is' : ' are') + ' not ' + v + '.';
    return out;
  }
  function qualQ(rest) {                                     // "is a worm alive?", "are things alive?"
    var ws = clean(rest).replace(DETS, '').split(' '), j, x, v, neg, r;
    for (j = 1; j < ws.length; j++) {
      v = ws.slice(j).join(' '); neg = /^not /.test(v); v = v.replace(/^not /, '');
      if (!qword[v] && qword[sing(v)]) v = sing(v);
      if (!qword[v] || !(x = findOne(ws.slice(0, j).join(' ')))) continue;
      topic = x; r = qualOf(x, v);
      if (!r) return 'I do not know. You have told me of being ' + v + ', but not whether ' + (isa[x] ? name(x) : a(spoken(x))) + ' is.';
      var yes = r.v.neg === neg, why = r.at === x ? 'You told me that ' + r.v.e + '.' : 'You told me that ' + r.v.e + ', and ' + a(spoken(x)) + ' is a kind of ' + spoken(r.at) + '.';
      return (yes ? 'Yes. ' : 'No. ') + why;
    }
    return null;
  }
  function genus(core) {                                     // "thing with a nature, meaning, birth": the kind is thing
    var pre = core.split(/\s*,\s*|\s+(?:of|with|that|which|who|whose|in|on|for|from|to|by|where|whom|about|like|than|having|being|made|used|found|called|known|\w{2,}ing|\w{2,}ed)\s+/)[0].trim(), hw = pre.split(' ').pop();   // the noun phrase ends at a preposition, a relative, or a participle ("mammal having a streamlined body")
    if (findOne(pre)) return many(pre) && find(sing(pre)) ? sing(pre) : pre;
    if (pre.split(' ').length <= 3 && nounish(pre)) return many(pre) ? sing(pre) : pre;
    return many(hw) ? sing(hw) : hw;
  }
  function subjectsOf(s, them) {                             // "life forms, basic entities, and worms": each, made one
    if (s === 'it') return them ? [{ p: them, pl: false }] : null;
    if (s === 'they') return null;                           // they: too many things it could be, so I do not guess
    var ps = s.split(/\s*,\s*(?:and\s+|or\s+)?|\s+and\s+/).map(function (p) { return p.replace(DETS, '').trim(); }).filter(Boolean);
    if (!ps.length || ps.some(function (p) { return !nounish(p) || /^(each|every|all|any|some|both|many|most|none|one|another|other|others|such|these|those|this|that|either|neither)$/.test(p) || /\b(it|this|that|there|he|she|they|i|you|we|not|is|are)\b/.test(p); })) return null;
    return ps.map(function (p) { return { p: many(p) ? sing(p) : p, pl: !!many(p) }; });
  }
  function teach(t, them) {                                  // a sentence with is or are in it: a kind, a quality, or a thing said
    var raw = t.trim().replace(/[.!]+$/, '').replace(LEAD, ''), low = expand(raw.toLowerCase().replace(/[‘’]/g, "'")).replace(/["“”]/g, '').replace(/\b(is|are|was|were)n't\b/g, '$1 not').replace(/\s+/g, ' ').trim(), m, subs, p, neg, kind, art, clause, adj, e, out;
    if (!(m = low.match(/^(.+?) (is|are)( not)? (.+)$/)) || /^(who|what|why|how|where|when|which|whose|is|are|can|does|do|there|here|i|you|we)\b/.test(low)) return null;
    if (!(subs = subjectsOf(m[1], them))) {
      var hd = m[1].replace(DETS, '').split(/\s+(?:of|in|on|for|from|with|that|which|who)\s+|\s*,\s*/)[0];
      if (!/^(i|you|we|he|she|this|that|there|here|it|they)$/.test(m[1]) && nounish(hd) && !/\b(it|they|and|or)\b/.test(hd) && m[1].split(' ').length <= 8 && !/^(one|someone|something|nothing|anything|what|whatever|all|each)\b/.test(m[1])) { var hc = findOne(hd) || make(many(hd) ? sing(hd) : hd); keepSaid(hc, echoOf(raw)); topic = hc; return 'I have noted that ' + echoOf(raw) + '.'; }
      return null; }
    neg = !!m[3]; p = m[4].replace(/^(?:also|still|really|truly|indeed|always) /, '');
    kind = /^(?:an? |the )?(?:kind|type|sort|form) of /.test(p); if (kind) p = p.replace(/^(?:an? |the )?(?:kind|type|sort|form) of /, 'a ');
    art = (p.match(/^(an?|the) /) || [])[1];
    clause = /^(how|what|when|where|why|whatever|wherever|whoever|that|to|because|if|like|as|so|one who|one that|someone|something|nothing|anything|everything|made|called|known|found|used)\b/.test(p) || !art && p.split(' ').length > 9;
    var pre0 = p.split(/\s*,\s*|\s+(?:of|with|in|on|for|from|to|by)\s+/)[0], plN = !art && many(pre0) && !qword[sing(pre0)] && !qword[pre0] && !/(ous|ful|ive|al|ic|less)$/.test(pre0), y0 = !art && findOne(pre0);
    adj = /^[a-z][a-z' -]*$/.test(p) && !art && !kind && !clause && !plN && p.split(' ').length <= 6 && !(y0 && (mass[y0] || subs.length === 1 && findOne(subs[0].p) && kindOf(findOne(subs[0].p), y0)));
    e = echoOf(them && m[1] === 'it' ? raw.replace(/^it(?:'s|\s+is)\b/i, a(them) + ' is').replace(/^it\b/i, a(them)) : raw);
    if (adj || (neg && !art && !kind)) {                     // a quality, or one denied: kept with each thing, nothing filed
      var v = p.replace(/^not /, ''); if (!qword[v] && qword[sing(v)]) v = sing(v);
      subs.forEach(function (s0) { var c = findOne(s0.p) || make(s0.p); push(quals, c, { v: v, neg: neg, e: e }); qword[v] = 1; jot('(qual ' + c + ' "' + v.replace(/"/g, "'") + '"' + (neg ? ' "not"' : '') + ' "' + e.replace(/"/g, "'") + '")'); topic = c; });
      taught++; return 'I have noted that ' + e + '.';
    }
    if (neg || clause || art === 'the' || !/^[a-z]/.test(p)) {                    // a thing said: kept word for word, and as the gloss if there is none
      subs.forEach(function (s0) { var c = findOne(s0.p) || make(s0.p), gl = p.replace(/^(an?) /, '');
        if (!neg && !gloss(c) && (art === 'the' || clause && !/^(that|so|as|like|because|if)\b/.test(p))) { cm[c] = p; tag('c|' + c, ctx, c); jot('(comment ' + c + ' "' + p.replace(/"/g, "'") + '")'); taught++; } else keepSaid(c, e); topic = c; });
      return 'I have noted that ' + e + '.';
    }
    var core = p.replace(/^(an?|the) /, ''), hs = core.split(/(\s*,\s*|\s+(?:of|with|that|which|who|in|on|for|from|to|by|like|than)\s+)/), ch = hs.shift() || '', rest = hs.join('');
    if (many(ch) && sing(ch) !== ch && (!find(ch) || find(ch) === find(sing(ch)))) core = sing(ch) + rest; ch = core.slice(0, core.length - rest.length);
    var gp = genus(core), yNew = !findOne(gp), y = findOne(gp) || make(gp), one = [], q = '';   // a kind: filed, and what more was said kept as its gloss
    subs.forEach(function (s0) {
      var x = findOne(s0.p);
      if (x && UPPER[x]) { keepSaid(x, e); return; }        // everything is a thing already: thing is the floor, and is filed under nothing
      if (x && kindOf(x, y)) { topic = x; if (core !== gp && !gloss(x)) { cm[x] = core; tag('c|' + x, ctx, x); jot('(comment ' + x + ' "' + core.replace(/"/g, "'") + '")'); taught++; one.push(s0.p); } else one.push('knew'); return; }   // known as a kind, and now known more nearly
      if (!x) x = make(s0.p); if (x === y) return;
      refile(x, y); taught++; topic = x; one.push(s0.p);
      if (core !== gp && !gloss(x)) { cm[x] = core; tag('c|' + x, ctx, x); jot('(comment ' + x + ' "' + core.replace(/"/g, "'") + '")'); }
    });
    if (!one.length) return 'I have noted that ' + e + '.';
    if (one.every(function (o) { return o === 'knew'; })) { pending = null; return 'I knew that: ' + (subs.length === 1 ? a(subs[0].p) + ' is ' : list(subs.map(function (s0) { return plural(s0.p); })) + ' are ') + (core !== gp ? a(core) : 'a kind of ' + gp) + '.'; }
    var open = only(y) ? y : (yNew && g(y).length && only(g(y)[0]) ? g(y)[0] : null); if (open && UPPER[open]) open = null;   // a new word's own head word is asked after; an old word's kin are not   // the next thing not yet understood, if any (never a floor)
    pending = open ? spoken(open) : null; if (open) q = ' What, then, is ' + a(spoken(open)) + '?';
    out = subs.length === 1 ? a(subs[0].p) + ' is ' + (core !== gp ? a(core) : 'a kind of ' + gp) : list(subs.map(function (s0) { return plural(s0.p); })) + ' are ' + (core !== gp ? plural(ch) + rest : 'kinds of ' + gp);
    return 'Thank you. Now I know ' + out + '.' + q;
  }
  function meaning(t) {                                      // "Alive means conscious and present." "To distinguish is to separate."
    var raw = t.trim().replace(/[.!]+$/, '').replace(LEAD, ''), low = raw.toLowerCase(), m, w, d;
    if ((m = low.match(/^(?:the word )?["']?([a-z][a-z' -]{0,40}?)["']? means (.+)$/)) && nounish(m[1].replace(DETS, ''))) { w = m[1].replace(DETS, ''); d = raw.slice(raw.length - m[2].length); }
    else if ((m = low.match(/^to ([a-z][a-z' -]{0,60}?) is to (.+)$/))) { w = 'to ' + m[1]; d = raw.slice(raw.length - m[2].length - 3); }
    else return null;
    means[w] = d; jot('(means "' + w.replace(/"/g, "'") + '" "' + d.replace(/"/g, "'") + '")'); taught++;
    var c = /^to /.test(w) ? null : findOne(w); if (c && !gloss(c)) { cm[c] = d; tag('c|' + c, ctx, c); }
    return /^to /.test(w) ? 'I have noted what it is ' + w + ': ' + d + '.' : 'I have noted what ' + w + ' means: ' + d + '.';
  }
  var MODAL = /^(may|might|can|could|will|would|shall|should|must|does|do|did|cannot|can't|won't|doesn't|don't|didn't)$/;
  var PASTV = /^(went|became|gave|grew|made|took|ate|drank|ran|came|saw|knew|fell|rose|began|brought|built|caught|felt|found|got|held|kept|led|left|lost|met|paid|said|sent|sat|stood|told|thought|won|wrote)$/;
  var NOTV = /^(is|are|was|were|am|be|been|has|have|had|of|and|or|but|with|in|on|at|to|the|a|an|as|for|from|by|not|no|so|if|than|then|that|this|which|who|its|their|his|her|my|your|our|into|onto|through|about|over|under|upon|within|without|across|after|before|during|toward|towards|among|between|near|off|out|up|down|around|like|very|too|more|most|less|each|all|both|every|you|me|him|them|us|it|thank|thanks|please)$/;
  var ADJ = /^(large|small|big|little|old|new|young|good|bad|great|high|low|long|short|wet|dry|hot|cold|warm|cool|few|other|same|different|whole|basic|simple|living|dead|true|false|real|own|first|last|next|wild|early|late|deep|wide|thin|thick|dark|bright|soft|hard|heavy|light|clean|dirty|full|empty|rich|poor|strong|weak|fast|slow|free|open|single|human|natural|ordinary)$/;
  var BASEV = /^(go|come|make|take|grow|eat|drink|run|fall|rise|live|die|move|form|flow|fly|swim|become|give|get|need|want|seem|look|feel|stay|turn|keep|hold|carry|consume|gather|burn|shine|float|sink|join|split|change|stand|sit|lie|sleep|wake|sing|speak|see|hear|know|think|begin|end|last|remain|return|reach|spread|melt|freeze|boil|cool|dry|shrink|divide|multiply|repeat|continue|may|might|can|could|will|would|must|should|do|did|never|always|often|sometimes|[a-z]+(ate|ize|ise|ify|en))$/;
  function verbAt(w, pl) {                                   // is this word the verb of the sentence?
    if (!w || NOTV.test(w)) return false;
    if (MODAL.test(w) || PASTV.test(w) || /[a-z]ed$/.test(w)) return true;
    if (/[^s]s$|(ss|x|z|ch|sh)es$/.test(w) && !/(us|is|ous|ss)$/.test(w)) return !pl;
    return pl && /^[a-z]+$/.test(w) && !find(w) && !/(ly|ness|ment|tion|ity)$/.test(w);
  }
  function tell(t, them) {                                   // "A dish holds food in a bowl." Kept as said, of the dish
    var raw = t.trim().replace(/[.!]+$/, '').replace(LEAD, ''), e = raw, body = raw.replace(/^(?:in|on|at|as|for|from|by|with|through|during|after|before|over|under|across|among|beyond|within)\b[^,]{1,60},\s*/i, '');
    var ws = body.toLowerCase().replace(/[‘’]/g, "'").replace(/[,;:]/g, '').split(/\s+/), k = 0, j, p, pl, v, c = null;
    if (ws.length < 2 || ws.length > 28 || /\?$/.test(t.trim())) return null;
    if (/^[^\s,]+,/.test(body) || /^(cheers|thanks|thank|hello|hi|goodbye|bye|sorry|ok|okay|yes|no|oh|ah|well)\b/i.test(body)) return null;   // "Cheers, thank you": a word to me, not of a thing
    if (ws[0] === 'they') return null;                       // they: too many things it could be, so I do not guess
    if (/^it (would|might|could) (mean|be)\b/.test(ws.join(' '))) return null;   // "it would mean...": an answer to a question of mine, not a thing of its own
    if (ws[0] === 'it') { if (!them || !verbAt(ws[1], false) && !/ly$/.test(ws[1])) return null; c = findOne(them); e = raw.replace(/^(.*?)\bit\b/i, function (m0, p0) { return p0 + a(them); }); }
    else {
      if (/^(this|that)$/.test(ws[0]) && ws.length > 2 && !NOTV.test(ws[1]) && !verbAt(ws[1], false)) ws[0] = 'the';   // "that entity may": that points, the noun follows
      if (/^(i|you|we|he|she|this|that|there|here|what|who|why|how|where|when|which|if|because|although|though|while|whether|let|please|like|unless|until|once|whoever|whatever)$/.test(ws[0])) return null;
      while (k < ws.length - 1 && DETS.test(ws[k] + ' ')) k++;
      for (j = 1; j <= Math.min(3, ws.length - k - 1); j++) {   // the shortest subject that a verb follows: "a dish | holds food", "the world of things | gave"
        p = ws.slice(k, k + j).join(' '); pl = !!many(p); v = ws[k + j] === 'not' ? ws[k + j + 1] : /ly$/.test(ws[k + j]) && ws[k + j + 1] ? ws[k + j + 1] : ws[k + j];
        if (/\b(but|not|is|are|was|were)\b/.test(p) || / of$/.test(p) || !nounish(p.split(/ (?:and|or) /)[0]) || /^(and|or) | (and|or)$/.test(p)) continue;
        if (j === 1 && (ADJ.test(p) || p.length > 5 && /(al|ous|ive|ful|ic|less|able|ible|ary|ish|ear)$/.test(p))) continue;   // "large | entities": an adjective is not the subject
        if (j === 1 && /[^s]s$/.test(v) && BASEV.test(ws[k + 2] || '')) continue;   // "water droplets | evaporate": a noun of nouns, and then the verb
        if (verbAt(v, pl)) break;
      }
      if (j > Math.min(3, ws.length - k - 1)) return null;
      p = p.split(/ (?:and|or) /)[0]; pl = !!many(p);
      c = findOne(p) || (/ of /.test(p) ? findOne(p.split(' of ')[0]) : /\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|\d+)\b/.test(p) ? null : make(pl ? sing(p) : p));   // a counted thing is said, not made a card
    }
    e = echoOf(e); keepSaid(c, e); if (c) topic = c;
    return 'I have noted that ' + e + '.';
  }

  // ---- SUMS: a small calculator, by recursive descent over the words people use. No eval: only numbers, + - * / ^,
  // brackets, "percent of", and the named functions below. Nuage is not a calculator by nature; it talks to one, and here
  // the one is in its pocket.
  var NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
    seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, million: 1e6, half: 0.5, dozen: 12 };
  var FN = { sqrt: Math.sqrt, sin: function (x) { return Math.sin(x * Math.PI / 180); }, cos: function (x) { return Math.cos(x * Math.PI / 180); },
    tan: function (x) { return Math.tan(x * Math.PI / 180); }, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, cbrt: Math.cbrt };
  function sumText(p) {                                     // words to symbols
    return (' ' + p.toLowerCase() + ' ').replace(/,(?=\d{3}\b)/g, '')
      .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[- ](one|two|three|four|five|six|seven|eight|nine)\b/g, function (m0, t, u) { return NUM[t] + NUM[u]; })
      .replace(/\b(\d+(?:\.\d+)?) (hundred|thousand|million)\b/g, function (m0, n, u) { return +n * NUM[u]; })
      .replace(/\b[a-z]+\b/g, function (w) { return w in NUM && !/^(half|dozen)$/.test(w) ? NUM[w] : w; })
      .replace(/\bsquare root of\b|\broot of\b/g, ' sqrt ').replace(/\bcube root of\b/g, ' cbrt ').replace(/\b(the )?(sine|sin) of\b/g, ' sin ').replace(/\b(the )?(cosine|cos) of\b/g, ' cos ')
      .replace(/\b(the )?(tangent|tan) of\b/g, ' tan ').replace(/\b(the )?(logarithm|log) of\b/g, ' log ').replace(/\bnatural log of\b/g, ' ln ').replace(/\babsolute value of\b/g, ' abs ')
      .replace(/\b(\S+) squared\b/g, '$1^2').replace(/\b(\S+) cubed\b/g, '$1^3').replace(/\bpercent of\b|% of\b/g, ' %of ').replace(/\bpercent\b/g, '%')
      .replace(/\bmod(ulo)?\b/g, ' % ').replace(/\bplus\b|\band\b/g, ' + ').replace(/\bminus\b|\bless\b/g, ' - ').replace(/\btimes\b|\bmultiplied by\b|\bx\b/g, ' * ').replace(/\bdivided by\b|\bover\b/g, ' / ')
      .replace(/\bto the power of\b|\braised to\b|\*\*/g, ' ^ ').replace(/\bhalf of\b/g, ' 0.5 * ').replace(/\bpi\b|π/g, ' pi ').replace(/[?!]/g, ' ').replace(/(\d)\.\s*$/, '$1');
  }
  function sum(p) {
    var t = sumText(p), toks = t.match(/\d+(?:\.\d+)?|%of|[a-z]+|[-+*/^%()]/g), i = 0;
    if (!toks || !/\d|\bpi\b|\be\b/.test(t) || toks.some(function (x) { return /^[a-z]+$/.test(x) && !FN[x] && x !== 'pi' && x !== 'e' && x !== 'of' && x !== 'the' && x !== 'is' && x !== 'what'; })) return null;
    toks = toks.filter(function (x) { return !/^(of|the|is|what)$/.test(x); });
    function peek() { return toks[i]; }
    function atom() {
      var x = toks[i++], v;
      if (x === undefined) throw 0;
      if (x === '(') { v = add(); if (toks[i++] !== ')') throw 0; return v; }
      if (x === '-') return -power();
      if (x === '+') return power();
      if (x === 'pi') return Math.PI;
      if (x === 'e') return Math.E;
      if (FN[x]) return FN[x](power());
      if (/^\d/.test(x)) { v = +x; if (peek() === '%' && !/^[\d(]/.test(toks[i + 1] || '')) { i++; v /= 100; } return v; }
      throw 0;
    }
    function power() { var b0 = atom(); if (peek() === '^') { i++; return Math.pow(b0, power()); } return b0; }
    function mul() { var v = power(), op; while ((op = peek()) === '*' || op === '/' || op === '%of' || (op === '%' && toks[i + 1] !== undefined)) { i++; var r0 = power(); v = op === '*' ? v * r0 : op === '/' ? v / r0 : op === '%of' ? v / 100 * r0 : v % r0; } return v; }
    function add() { var v = mul(), op; while ((op = peek()) === '+' || op === '-') { i++; var r0 = mul(); v = op === '+' ? v + r0 : v - r0; } return v; }
    try { var v = add(); if (i !== toks.length || typeof v !== 'number' || !isFinite(v)) return null; return String(+v.toPrecision(12)).replace(/^-?\d{5,}$/, function (n0) { return (+n0).toLocaleString('en-US'); }); } catch (er) { return null; }
  }
  var MATH_HELP = 'I keep a small calculator in my pocket. Ask me as you would say it, or as you would type it. "What is 15 percent of 80?" ' +
    '"What is the square root of 2?" "Two to the power of ten." "What is (3 + 4) * 6?" "What is the sine of 30?" (in degrees) "What is pi times 2 squared?" ' +
    'I know plus, minus, times, divided by, mod, squared, cubed, to the power of, percent of, and the roots, sines, cosines, tangents, and logarithms. I do not do algebra, units, or proofs.';

  var helped = 0;
  function help() {
    if (helped++ % 2) { var all = Object.keys(names).filter(function (c) { return !UPPER[c] && seen(c); }), pick = [];
      for (var i = 0; i < 12 && all.length; i++) pick.push(spoken(all.splice((helped * 7 + i * 13) % all.length, 1)[0]));
      return 'Some of the things I know are ' + list(pick) + '. Ask "what is" about any of them, or "what kinds of" about one.'; }
    var count = Object.keys(kids).filter(function (c) { return !UPPER[c] && k(c).length; }).sort(function (p, q) { return k(q).length - k(p).length; }).slice(0, 5).map(spoken);
    return 'I know ' + num(flat.length) + ' facts about ' + num(Object.keys(names).length) + ' things, most of them about ' + list(count.map(plural)) + '.' + (taught ? ' You have taught me ' + num(taught) + ' more.' : '') + ' You might try these.' +
      ' "What is a chair?" "Is a penguin a fish?" "Can a penguin fly?" "What happens if water is heated?" "Let\'s talk about Apollo." "What is five plus two?" Or teach me something, such as "A turnip is a vegetable." For sums, say "help math."' + (ctx !== 'BaseKB' ? ' We are in ' + mtName(ctx) + '.' : '');
  }

  // ---- the old trick: reflection
  var SWAP = { i: 'you', me: 'you', my: 'your', mine: 'yours', am: 'are', was: 'were', you: 'I', your: 'my', yours: 'mine', are: 'am', "i'm": 'you are', "you're": 'I am', myself: 'yourself', yourself: 'myself' };
  function reflect(s) { return s.toLowerCase().replace(/[^\w' ]/g, ' ').trim().split(/\s+/).map(function (w) { return SWAP[w] || w; }).join(' '); }
  var JOKES = ['Why did the chicken cross the road? To get to the other side.', 'What has keys but cannot open locks? A piano.',
    'What gets wetter the more it dries? A towel.', 'Why did the scarecrow win a prize? Because he was outstanding in his field.'];
  var turn = 0, ELSE = ['Go on.', 'Tell me more about that.', 'What would it mean to you if %?', 'Why do you say %?', 'I see. And then?'];
  function eliza(t) {
    var m, low = t.toLowerCase();
    if ((m = low.match(/\bi (?:feel|felt) (.+)/))) return 'Why do you feel ' + reflect(m[1]) + '?';
    if ((m = low.match(/\bi am (.+)/) || low.match(/\bi'm (.+)/))) return 'How long have you been ' + reflect(m[1]) + '?';
    if ((m = low.match(/\bi (?:want|need) (.+)/))) return 'What would it mean to you to get ' + reflect(m[1]) + '?';
    if (/\bbecause\b/.test(low)) return 'Is that the real reason?';
    if (/\b(mother|father|mom|dad|sister|brother)\b/.test(low)) return 'Tell me more about your family.';
    var r = ELSE[turn++ % ELSE.length], said = reflect(t).replace(/^(?:and|but|so|well) /, '');
    if (r.indexOf('%') >= 0 && said.split(' ').length > 8) r = ['Go on.', 'I see. And then?', 'Tell me more about that.'][turn % 3];   // a long line, echoed whole, is a parrot
    return r.replace('%', said);
  }
  function tangible(c) { return ['Artifact', 'Organism', 'Substance', 'Food', 'Plant', 'Animal'].some(function (k0) { return names[k0] && kindOf(c, k0); }); }
  var ASIDE_NOT = /^(still|well|even|just|kind|mean|fine|right|back|last|present|close|light|spring|fall|stand|lean|like|second|minute)$/;   // words more often said than meant as things
  function aside(t) {                                        // a little knowing, offered when a known THING goes by (not a fun, a right, or a year)
    var ts = terms(t), i, c;
    for (i = 0; i < ts.length; i++) {
      c = lex[ts[i].phrase];
      if (!c || said[c] || !up(c).length || UPPER[up(c)[0]] || !tangible(c)) continue;
      if (ASIDE_NOT.test(ts[i].phrase) || /\b(i|you|we|they|he|she|it|am|is|are|was|were|be|been|may|might|can|could|will|would|shall|should|must|do|does|did|to|not|never|also|just)\s+$/i.test(t.slice(0, ts[i].a))) continue;   // "I still am", "people may stand": a verb or an adverb, not the thing
      said[c] = 1; topic = c; return ' (' + cap(a(spoken(c))) + ' is a kind of ' + spoken(up(c)[0]) + ', by the way.)';
    }
    return '';
  }

  // ---- defaults: Xs p, unless told otherwise; the nearest word wins (a penguin is nearer to penguins than to birds)
  function third(v) { return { have: 'has', be: 'is', do: 'does', go: 'goes' }[v] || (/(s|x|ch|sh|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v + 's'); }
  function plural(w) { var lw = w.split(' ').pop(); if (IRREG[lw]) return w.slice(0, w.length - lw.length) + IRREG[lw]; return lex[w] && mass[lex[w]] ? w : w.replace(/(s|x|z|ch|sh)$/, '$&e').replace(/([^aeiou])y$/, '$1ie') + 's'; }
  function base(v) { return { has: 'have', is: 'are', does: 'do', goes: 'go' }[v] || v.replace(/ies$/, 'y').replace(/(s|x|ch|sh|o)es$/, '$1').replace(/s$/, ''); }
  function agree(subj, single, p) { var w = wds(p).split(' '); if (!single) w[0] = base(w[0]); return subj + ' ' + w.join(' '); }
  function wds(p) { return p.split('-').join(' '); }
  function canQ(ws) {                                        // "can a penguin fly", "does a dump truck have a bed": try every split
    if (/^(it|they|that|this)$/.test(ws[0]) && topic && ws.length > 1) return canQ1(spoken(topic), ws[1], ws.slice(2).join(' '));   // "can it fly": it is what we were talking about
    for (var s0 = ws.length - 1; s0 >= 1; s0--) if (find(ws.slice(0, s0).join(' '))) return canQ1(ws.slice(0, s0).join(' '), ws[s0], ws.slice(s0 + 1).join(' '));
    return null;
  }
  function canQ1(subj, verb, rest) {
    var c = find(subj), p = [third(verb)].concat(rest ? rest.split(' ') : []).join('-'), q, seenq = {}, x, j, d;
    if (!c) return null;
    if (!seen(c) && mtHome[c]) return elsewhere(c);
    topic = c; q = [c].concat(i(c));
    while (q.length) {
      x = q.shift(); if (seenq[x]) continue; seenq[x] = 1;
      for (j = 0, d = dflt[x] || []; j < d.length; j++) if (d[j].p === p && vis[d[j].mt]) {
        var who = x === c && i(c).length ? name(c) : plural(spoken(x)), single = (x === c && i(c).length) || !!mass[x];
        why = (x === c ? '' : cap(i(c).length ? name(c) : a(spoken(c))) + ' is ' + a(spoken(x)) + '. ') + cap(d[j].v ? agree(who, single, p) : who + (single ? ' does not ' : ' do not ') + base(wds(p).split(' ')[0]) + wds(p).replace(/^\S+/, '')) + '.';
        return (d[j].v ? 'Yes. ' : 'No. ') + why;
      }
      q.push.apply(q, g(x));
    }
    if (verb === 'have' && rest) { var hh = hasAbout(c, rest.replace(/^(an?|any|some) /, '')); if (hh) { why = cap(whose(hh.at)) + ' has ' + hh.v + '.'; return (/\bno\b/.test(hh.v) ? 'No. ' : 'Yes. ') + cap(whose(c)) + ' has ' + hh.v + '.'; } }
    return 'I do not know whether ' + a(spoken(c)) + ' ' + wds(p) + '.';
  }

  // ---- rules: a commonsense step, chained. Facts about one thing ?x, from a condition the talk supplies.
  var PART = { heat: 'heated', boil: 'heated', warm: 'heated', cool: 'cooled', freeze: 'cooled', chill: 'cooled', drop: 'dropped', break: 'broken', smash: 'broken', water: 'watered', feed: 'fed', starve: 'unfed', flatten: 'flattened', fill: 'filled' };
  function cond(p) { return /(ed|en)$/.test(p.split('-')[0]) || /^out-of/.test(p) ? 'is ' + wds(p) : /^no-/.test(p) ? 'gets ' + wds(p) : wds(p); }
  function happens(subj, c0) {                               // "what happens if water is heated"
    var c = /^(it|they|that|this|them)$/.test(clean(subj)) ? topic : find(subj), facts = {}, how = {}, grew = true, out = [], n, r, j, okb, b;   // "what happens if it is heated": it is what we were talking about
    if (!c) return ask(subj) || 'I am not sure what you mean by "' + subj + '." Name the thing, and I will try.';
    if (!seen(c) && mtHome[c]) return elsewhere(c);
    topic = c; facts[c0] = 1;
    for (n = 0; grew && n < 6; n++) {
      grew = false;
      for (r = 0; r < rules.length; r++) {
        if (!vis[rules[r].mt]) continue;
        for (j = 0, okb = true; j < rules[r].body.length && okb; j++) { b = rules[r].body[j]; okb = (b[0] in facts) || (/^[A-Z]/.test(b[0]) && kindOf(c, b[0])); }
        if (!okb) continue;
        for (j = 0; j < rules[r].head.length; j++) if (!facts[rules[r].head[j][0]]) { facts[rules[r].head[j][0]] = 1; how[rules[r].head[j][0]] = rules[r]; out.push(rules[r].head[j][0]); grew = true; }
      }
    }
    var the = isa[c] ? name(c) : 'the ' + spoken(c);
    if (!out.length) { why = null; return 'I know of nothing that follows when ' + the + ' ' + cond(c0) + '.'; }
    var told = {};
    why = out.map(function (p) {   // each step, and the rule that made it, one sentence apiece
      var rr = how[p], t = rr.body.filter(function (b) { return /^[A-Z]/.test(b[0]); })[0], cs = rr.body.filter(function (b) { return !/^[A-Z]/.test(b[0]); }).map(function (b) { return cond(b[0]); });
      var up0 = t && UPPER[t[0]], lead = t && !up0 && t[0] !== c && !told[t[0]] ? cap(isa[c] ? name(c) : a(spoken(c))) + ' is ' + a(spoken(t[0])) + '. ' : ''; if (t) told[t[0]] = 1;
      return lead + cap(up0 ? 'anything' : a(spoken(t ? t[0] : c))) + ' that ' + cs.join(' and ') + ' ' + wds(p) + '.';
    }).join(' ');
    var cl = [wds(out[0])].concat(out.slice(1).map(function (p) { return 'it ' + wds(p); }));   // clauses: two take a comma and "and"; more take the serial comma
    return 'Then ' + the + ' ' + (cl.length === 2 ? cl[0] + ', and ' + cl[1] : list(cl)) + '.';
  }

  // ---- context: the world the talk is in
  function goTo(m) {
    if (m === ctx) return m === 'BaseKB' ? 'We are in the ordinary world already.' : 'We are already in ' + mtName(m) + '.';
    setCtx(m); said = {};
    return m === 'BaseKB' ? 'Back to the ordinary world.' : 'We are in ' + mtName(m) + ' now' + (gloss(m) ? ': ' + gloss(m) : '') + '.';
  }

  function hasOf(subj, what) {                               // "a bookcase has many shelves", "it has books"
    var c = /^(it|they|this|that)$/.test(clean(subj)) ? topic : find(subj);
    if (!c || !what) return null;
    push(has, c, what); topic = c; taught++; jot('(has ' + c + ' "' + what.replace(/"/g, "'") + '")');
    return 'I have noted that ' + a(spoken(c)) + ' has ' + what + '.';
  }
  function statement(s) {
    var low = clean(s), m;
    if ((m = low.match(/^(?:and then |and |well,? |so |yes,? |no,? |indeed,? )*(?:an? |the )?(.+?) (?:has|have) (.+)$/))) return hasOf(m[1], m[2]);   // holds and contains are kept as said, in your verb
    return null;
  }
  var FLAGWORD = /\b(flags?|banners?|pennants?|pennons?|ensigns?|standards?)\b/;
  function flagsKept() {                                     // the flags and banners I keep, by their cards and their pictures
    var t = [];
    vexts.concat(pictures).forEach(function (v) { if (vis[v.mt] && FLAGWORD.test(v.title.toLowerCase())) { var w = v.title.replace(/^The /, 'the '); if (!t.some(function (x) { return x.toLowerCase() === w.toLowerCase(); })) t.push(w); } });
    return t.length ? 'The flags I know are ' + list(t) + '.' : 'I know no flags yet.';
  }
  function unknownFlag(t) {                                  // "the flag of Noniland", as you wrote it
    var m0 = t.match(/((?:flag|banner|pennant|pennon|ensign|standard)s? (?:of|for) [^.?!]+)/i);
    return 'I do not know ' + (m0 ? 'the ' + m0[1].replace(/^\w/, function (c) { return c.toLowerCase(); }) : 'that flag') + '. ' + flagsKept();
  }
  function more(src) {                                       // a shelf, read in after waking: its forms are put in as the first ones were
    var n0 = flat.length, k0;
    readForms(src).forEach(function (f) { if (f[0] === 'in-mt') { if (!genlMt[f[1]]) genlMt[f[1]] = []; f.slice(2).forEach(function (g0) { flat.push([g0, f[1]]); }); } else flat.push([f, 'BaseKB']); });
    for (k0 = n0; k0 < flat.length; k0++) put(flat[k0][0], flat[k0][1]);
    return flat.length - n0;
  }
  function readForms(src) {                                      // the reader, once through, for a short text
    var i = 0, n = src.length, st = [[]], c, j, t;
    while (i < n) {
      c = src[i];
      if (c === ';') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c <= ' ') { i++; continue; }
      if (c === '(') { st.push([]); i++; continue; }
      if (c === ')') { if (st.length > 1) { t = st.pop(); st[st.length - 1].push(t); } i++; continue; }
      if (c === '"') { j = i + 1; t = ''; while (j < n && src[j] !== '"') t += src[j++]; st[st.length - 1].push({ s: t }); i = j + 1; continue; }
      j = i; while (j < n && src[j] > ' ' && src[j] !== '(' && src[j] !== ')') j++; st[st.length - 1].push(src.slice(i, j)); i = j;
    }
    return st[0];
  }
  function recall(text) {                                    // what you taught me last time, put back
    var got = 0;
    readForms(text || '').forEach(function (f) {
      var mt = 'BaseKB', fm = f;
      if (f[0] === 'in-mt') { mt = f[1]; fm = f[2]; }
      if (!fm || !/^(genls|has|said|qual|comment|means)$/.test(fm[0])) return;   // every form the teaching keeps comes back
      if (fm[0] === 'genls' && /^Not[A-Z]/.test(fm[2] + '') ) return;   // a kind that begins with "not" was the old engine's mistake (User1's report), and is not put back
      [fm[1], fm[2]].forEach(function (c) { if (typeof c === 'string' && !names[c]) { names[c] = 1; var w = spoken(c); if (!lex[w]) lex[w] = c; if (!lex[w + 's']) lex[w + 's'] = c; } });
      put(fm, mt); journal.push(mt === 'BaseKB' ? show(fm) : '(in-mt ' + mt + ' ' + show(fm) + ')'); got++;
    });
    taught = got; return got;
  }
  // ---- TERMS: the words in a line that Nuage has a card for, as character spans. A kind with kinds of its own is a category.
  var NOTERM = {}; ('a an the is are was were be been am it its this that these those and or but nor not no yes of in on at to for with by from as into '
    + 'what who why how when where which there here then than so if do does did have has had can could may might will would shall should must '
    + 'kind kinds sort type way right well back time set line state work home one two three new old first last other same own many much more most '
    + 'some any such also just now very too good great little long high big small say said tell know think thing things something anything everything '
    + 'you your i me my we us our they them their he him his she her nuage draw drawing drawings picture pictures plan keep only').split(' ').forEach(function (w) { NOTERM[w] = 1; });
  function terms(text) {
    var out = [], re = /[A-Za-z][A-Za-z'-]*/g, ws = [], m2, i, n, phrase, c;
    while ((m2 = re.exec(text))) ws.push({ w: m2[0].toLowerCase(), a: m2.index, b: m2.index + m2[0].length });
    for (i = 0; i < ws.length; i++) {
      for (n = 3; n >= 1; n--) {
        if (i + n > ws.length) continue;
        phrase = ws.slice(i, i + n).map(function (x) { return x.w; }).join(' ');
        if (n === 1 && (NOTERM[phrase] || NOTERM[phrase.replace(/e?s$/, '')] || phrase.length < 3)) continue;   // works, sets, kinds: the little words in their plurals too
        c = lex[phrase];
        if (!c || UPPER[c] || !seen(c)) continue;
        out.push({ a: ws[i].a, b: ws[i + n - 1].b, phrase: phrase, cat: k(c).length >= 2 }); i += n - 1; break;
      }
    }
    return out;
  }
  function show(f) { return '(' + f.map(function (x) { return typeof x === 'object' ? '"' + x.s + '"' : x; }).join(' ') + ')'; }

  // ---- the pocket of the moment: what was just said, by whom, and about what
  var talk = [], forget = false;   // talk: the last lines, both ways
  var heard = '';
  // the whole conversation, kept (room is cheap: user1, "all our free RAM, this is packing-peanuts"), so it can be
  // distilled on asking: what is hanging, what is in the notes, what you could explain, whether I have any questions
  var record = [], mine = [], meta = false;                                // mine: the words I asked you about, until you teach them
  // ---- the listening ring: a question that carries its own answer ("Do stars twinkle because the air moves?") is a
  // supposition. When I cannot answer it, I say back what was supposed, in plain words, and keep it in my notes, so a
  // person can rule on it. I never take it for a fact on my own.
  function supposes(q) {
    var t = clean(q).replace(/^(so|then|oh|ok|okay|and|but|wait|hmm|nuage)( if| then)? /, ''), m, w, n = 0, j, aux, rest, subj, v;
    if (!/\b(when|because|since|if|by|from|so that)\b/.test(t) || !(m = t.match(/^(do|does|did|is|are|was|were|can|could|will|would|should|has|have) (.+)$/))) return null;
    aux = m[1]; w = m[2].split(' '); if (w.length < 4 || /^(you|i|we|this|that|there)$/.test(w[0])) return null;
    for (j = /^(an?|the|my|our|your|their|its|some|all)$/.test(w[0]) ? 1 : 0; j < Math.min(w.length - 1, 4); j++) if (find(w.slice(n = /^(an?|the|my|our|your|their|its|some|all)$/.test(w[0]) ? 1 : 0, j + 1).join(' ')) || find(w[j].replace(/s$/, ''))) { subj = w.slice(0, j + 1); break; }
    if (!subj) subj = w.slice(0, /^(an?|the|my|our|your|their|its|some|all)$/.test(w[0]) ? 2 : 1);
    rest = w.slice(subj.length); if (!rest.length) return null; subj = subj.join(' ');
    if (aux === 'do') return subj + ' ' + rest.join(' ');
    if (aux === 'does') { v = rest[0]; rest[0] = /(s|x|z|ch|sh|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v === 'have' ? 'has' : v + 's'; return subj + ' ' + rest.join(' '); }
    return subj + ' ' + aux + ' ' + rest.join(' ');
  }
  function chat(line) {
    heard = line; meta = false; var r = (chat0(line) || 'I did not follow that. Ask me what something is, or say "help."').replace(/\s*;\s*/g, ', ');   // house style: no semicolon ever leaves the cloud
    var sp = /\?\s*$/.test(line) && MISSED.test(r) && supposes(line);
    if (sp) { sp = sp.replace(/\b[a-z][\w']*/g, function (w) { return new RegExp('[^.?!]\\s' + w.charAt(0).toUpperCase() + w.slice(1) + '\\b').test(line) ? w.charAt(0).toUpperCase() + w.slice(1) : w; });   // English stays English
      if (notes.indexOf('You supposed that ' + sp + '.') < 0) notes.push('You supposed that ' + sp + '.');
      r += /^I do not know whether/.test(r) ? ' I have made a note of what you suppose, for a person to rule on.' : ' You suppose that ' + sp + '. I cannot vouch for it yet, so I have made a note of it.'; }
    talk.push(['you', line.trim()], ['me', r]); if (talk.length > 40) talk.splice(0, talk.length - 40);
    if (record.length && record[record.length - 1].you.toLowerCase() === line.trim().toLowerCase() && !meta) r = 'As I said: ' + r;   // asked again, word for word
    record.push({ you: line.trim(), me: r, meta: meta, tp: topic });   // a question about the conversation is not a topic of it
    if (pending && mine.indexOf(pending) < 0) mine.push(pending);
    return r;
  }
  function taughtWords() {                                   // the journal, told back in sentences
    return journal.map(function (j) {
      var f = readForms(j)[0], mt = '', fm = f;
      if (f[0] === 'in-mt') { mt = ' (in ' + mtName(f[1]) + ')'; fm = f[2]; }
      if (fm[0] === 'genls') return fm[2] === 'Thing' ? '' : a(spoken(fm[1])) + ' is a kind of ' + spoken(fm[2]) + mt;   // a word filed under thing alone is only a word heard
      if (fm[0] === 'has') return a(spoken(fm[1])) + ' has ' + fm[2].s + mt;
      if (fm[0] === 'said') return fm[2].s + mt;
      if (fm[0] === 'qual') return (fm[3] && fm[3].s === 'not' ? fm[4] : fm[3]).s + mt;
      if (fm[0] === 'comment') return a(spoken(fm[1])) + ' is ' + (/^(an?|the|how|what|when|where|why|to)\b/.test(fm[2].s) ? fm[2].s : a(fm[2].s)) + mt;
      if (fm[0] === 'means') return (/^to /.test(fm[1].s) ? fm[1].s + ' is ' : fm[1].s + ' means ') + fm[2].s + mt;
      return '';
    }).filter(function (x, n, all) { return x && all.indexOf(x) === n; });
  }   // house style: no semicolon ever leaves the cloud
  // ---- backstage: a long paragraph is more than one question, and I am best at one or two sentences. So I take it a
  // sentence at a time, try to answer each, watch what I did, and say what it came to: what I could answer, what I
  // could not (noted, for there is room to keep notes), and what the whole seems to be about. (user1: "We do what we can.")
  var notes = [], MISSED = /^(I do not know|I cannot answer|I know of nothing|I am listening|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|How long have you been|Why do you feel|Is that the real reason|Please go on|Does that)/;
  var NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  function about(line) {                                     // what the whole is about: the kind most of its named things share
    var cs = [], count = {}, best = null, bc = 0, mine;
    terms(line).forEach(function (t) { var c = lex[t.phrase]; if (c && cs.indexOf(c) < 0 && !isa[c]) cs.push(c); });
    if (!cs.length) return null;
    if (cs.length === 1) return 'It is about ' + a(spoken(cs[0])) + '.';
    cs.forEach(function (c) { [c].concat(up(c)).forEach(function (u) { if (!UPPER[u]) count[u] = (count[u] || 0) + 1; }); });
    cs.forEach(function (c) { [c].concat(up(c)).forEach(function (u) { if (count[u] > bc) { bc = count[u]; best = u; } }); });   // the nearest kind among the most shared
    if (bc < 2) return 'It names ' + list(cs.map(function (c) { return a(spoken(c)); })) + ', and they have little in common that I know.';
    mine = cs.filter(function (c) { return c === best || up(c).indexOf(best) >= 0; });
    return 'Taken together, ' + (mine.length === cs.length ? 'all' : 'most') + ' of the things you named are ' + plural(spoken(best)) + ': ' + list(mine.map(function (c) { return a(spoken(c)); })) + '.';
  }
  function open() { return mine.filter(function (p) { return !find(p); }); }   // my questions you have not yet answered
  function distill(low) {
    var op = open(), qs, ok, topics, cnt, w;
    if (/\b(hanging|open|unanswered|outstanding|pending) questions?\b|\bloose ends\b|^what('s| is| are)? (still )?(left|open|hanging)\b/.test(low)) {
      if (!op.length && !notes.length) return 'Nothing is hanging. Every question so far has had its answer, or none was asked.';
      return (op.length ? (op.length === 1 ? 'One of mine waits for you: ' : cap(NUMW[op.length] || op.length) + ' of mine wait for you: ') + list(op.map(function (p) { return 'what ' + a(p) + ' is'; })) + '.' : 'None of mine wait for you.')
        + (notes.length ? ' And I noted ' + (notes.length === 1 ? 'one of yours' : (NUMW[notes.length] || notes.length) + ' of yours') + ' I had no answer for. Say "notes" to see ' + (notes.length === 1 ? 'it' : 'them') + '.' : '');
    }
    if (/\bwhat (can|could|should|might) i (explain|teach|tell)( you)?\b|\bwhat (don't|do not) you know\b|\bwhat (do|would) you (like|want) to (know|learn)\b/.test(low))
      return op.length ? 'You could tell me ' + list(op.map(function (p) { return 'what ' + a(p) + ' is'; })) + '. Say it plainly, as "A kettle is a kind of container," and I will keep it.' : 'Nothing of mine is waiting. Teach me anything you like, plainly, as "A kettle is a kind of container."';
    if (/^(any|do you have any|have you (got )?any|got any) questions\b/.test(low)) return op.length ? 'Yes. ' + ask(op[0]) : 'Not just now. Ask me about something, and I may have one for you.';
    if (/\bwhat (have|did) we (talk|talked|speak|spoken|chat|chatted) about\b|\b(sum (it|this|that|us) up|summari[sz]e|distil+|recap)\b/.test(low)) {
      var heardAll = record.filter(function (x) { return !x.meta; }); qs = heardAll.filter(function (x) { return /\?\s*$/.test(x.you); }); ok = qs.filter(function (x) { return !MISSED.test(x.me) && !/^I have no card|^I have heard of|What, then, is/.test(x.me); });
      cnt = {}; heardAll.forEach(function (x) { terms(x.you).forEach(function (t) { var c = lex[t.phrase]; if (c && !UPPER[c]) cnt[c] = (cnt[c] || 0) + 1; }); });
      topics = Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; }).slice(0, 5).map(function (c) { return isa[c] ? name(c) : plural(spoken(c)); });
      if (!heardAll.length) return 'We have only just begun.';
      w = 'So far you have said ' + (NUMW[heardAll.length] || heardAll.length) + (heardAll.length === 1 ? ' thing' : ' things') + ', and asked ' + (NUMW[qs.length] || qs.length) + (qs.length === 1 ? ' question' : ' questions') + '. I answered ' + (NUMW[ok.length] || ok.length) + '.';
      if (topics.length) w += ' You asked most about ' + list(topics) + '.';
      if (op.length || notes.length) w += ' ' + (op.length ? (NUMW[op.length] || op.length) + ' of my questions ' + (op.length === 1 ? 'waits' : 'wait') : 'None of my questions wait') + ', and ' + (NUMW[notes.length] || notes.length) + ' of yours ' + (notes.length === 1 ? 'is' : 'are') + ' in my notes. Say "hanging questions" to see them.';
      return w.replace(/^(\w)/, function (c) { return c.toUpperCase(); }).replace(/(^|\. )(\w)/g, function (m0, p0, c) { return p0 + c.toUpperCase(); });
    }
    return null;
  }
  var BACK = /^(?:i understand|i see|i know|i agree|agreed|good question|good one|nice question|you are correct|you're correct|correct|exactly|that is right|that's right|yes|no|ok|okay|indeed|right|true|cheers|thank you|thanks|thank you very much|i'm glad you asked|i am glad you asked|i will|it is|of course|good|fine|sure|very well|go on|(?:cheers,? )?(?:thank you|thanks)(?: (?:for|very much)[^.!?]*)?|cheers,? (?:thank you|thanks))[.!]*$/i;
  function inTurn(ss) {                                      // sentences said together: a question I ask after one is not answered by the next, which was written before it
    var keep = null, rs = ss.map(function (x, i0) { if (i0 && pending) { keep = pending; pending = null; } return chat1(x); });
    if (!pending && keep) pending = keep; return rs;
  }
  function backstage(ss, line) {
    var done = [], missed = [], askBack = null, out, ab, rs = inTurn(ss);
    ss.forEach(function (x, i0) {
      var r = rs[i0];
      if (/^(What, then, is|I have no card for|I have heard of)/.test(r)) askBack = x;
      else if (MISSED.test(r)) missed.push(x);
      else done.push({ q: x, r: r });
    });
    missed.forEach(function (x) { if (notes.indexOf(x) < 0) notes.push(x); });
    out = 'You said ' + (NUMW[ss.length] || ss.length) + ' things at once, so I took them one at a time.';
    done.slice(0, 5).forEach(function (d) { out += '\n' + (/^(I have noted|Thank you\. Now I know|I knew that)/.test(d.r) ? d.r : '"' + d.q + '" ' + d.r); });   // what I kept is said back once, not twice
    if (done.length > 5) out += '\nI answered ' + (NUMW[done.length - 5] || done.length - 5) + ' more as well. Ask them again one at a time, and I will say more.';
    if (missed.length) out += '\nI had no answer for ' + (missed.length === ss.length ? 'any of them' : missed.length === 1 ? 'one of them' : (NUMW[missed.length] || missed.length) + ' of them') + ', so I made a note of ' + (missed.length === 1 ? 'it' : 'them') + '. Say "notes" to see what I noted.';
    ab = about(line); if (ab) out += '\n' + ab;
    if (!done.length && !askBack) out += '\nI am best with one or two sentences at a time. Ask me about one thing, and I will do what I can.';
    if (askBack) out += '\n' + chat1(askBack);              // last, so my question waits for your answer
    return out;
  }
  function chat0(line) {                                     // several sentences: answer the question in them, else take what they teach
    var ss = line.trim().split(/(?<=[.!?])\s+/).filter(Boolean), q, k, r, ss2 = ss.filter(function (x) { return !BACK.test(x.trim()); });
    // "I understand." "Cheers." said between things: heard, and not taken as things
    var welcome = ss.length > ss2.length && ss.some(function (x) { return BACK.test(x.trim()) && /\b(thank|thanks|cheers)\b/i.test(x); }) && ss2.length ? ' You are welcome.' : '';   // thanks among other things: answered last, briefly
    if (ss2.length && ss.length > 1) ss = ss2;
    if (ss.length < 2) return chat1(ss.length ? ss[0] : line) + welcome;
    if (ss.length >= 3) return backstage(ss, line) + welcome;
    q = ss.filter(function (x) { return /\?\s*$/.test(x); }); if (q.length) return q.map(chat1).filter(function (r0, i0, all) { return all.indexOf(r0) === i0; }).join(' ');   // several questions: each answered, in turn
    r = inTurn(ss); q = r.filter(function (r0) { return !MISSED.test(r0); });   // two things told: each taken in turn, and what I could not take set aside
    if (!q.length) return r[r.length - 1] + welcome;
    ss.forEach(function (x, i0) { if (MISSED.test(r[i0]) && notes.indexOf(x) < 0) notes.push(x); });
    return q.filter(function (r0, i0, all) { return all.indexOf(r0) === i0; }).join(' ') + welcome;
  }
  function chat1(line) {
    var t = line.trim(), low = clean(t).replace(/^(please|so|ok|okay|nice|well|now|nuage),? /, ''), m, r, was = pending, wasD = dwim;
    pending = null; dwim = null;
    if (!was && topic && !chat1.sub && /\?\s*$/.test(t) && /\b(it|they)\b/.test(low) && !/^(can|could|does|do|will|would) (it|they)\b/.test(low)) {   // "is it a star?": it is what we were just talking about
      chat1.sub = true; var rs = chat1(t.replace(/\b(it|they)\b/i, function () { return a(spoken(topic)); })); chat1.sub = false; return rs;
    }
    if (wasD && /^no\b/.test(low)) { low = low.replace(/^no\b[,.!]? */, '').replace(/^(an?|the) /, ''); t = t.replace(/^no\b[,.!]? */i, ''); }   // "No, it is a kind of boat": the no answers my guess, the rest teaches
    if (wasD && (/^(yes|yeah|yep|i did|i do|right|correct|exactly|that one)\b/.test(low) || wasD.to.indexOf(low) >= 0)) {   // Do What I Mean: the word you meant, in the question you asked
      return chat1(wasD.line.replace(new RegExp(wasD.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), wasD.to.indexOf(low) >= 0 ? low : wasD.to[0]));
    }
    if (!t) return 'I am listening.';
    // the pocket of the moment
    var mine = talk.length ? talk[talk.length - 1][1] : '', yours = talk.length > 1 ? talk[talk.length - 2][1] : '';
    if (/^what did you (just )?say\b/.test(low)) return mine ? 'I said, "' + mine + '"' : 'I have said nothing yet.';
    if (/^what did i (just )?say\b/.test(low)) return yours ? 'You said, "' + yours + '"' : 'You have said nothing yet.';
    if (/^what (are|were) we (talking|speaking) about\b/.test(low)) return topic ? 'We were talking about ' + (isa[topic] ? name(topic) : plural(spoken(topic))) + '.' : 'Nothing in particular, so far.';
    if (/^what (have i taught you|did i teach you|have you learned|have you learnt|do you remember|have you remembered)\b/.test(low)) { var tw = taughtWords(); return tw.length ? 'You have taught me that ' + list(tw.slice(-8)) + '.' + (tw.length > 8 ? ' That is the last eight of ' + num(tw.length) + '.' : '') : 'You have taught me nothing yet.'; }
    if ((r = distill(low))) { meta = true; return r; }
    if (/^(notes|your notes|show (me )?(your )?notes|what('s| is) in (the|your) notes|what (are|were) your notes|what did you (make a )?notes?( of)?|what could(n't| not) you answer)\b/.test(low) && (meta = true)) return notes.length ? 'I noted ' + (notes.length === 1 ? 'one thing' : (NUMW[notes.length] || notes.length) + ' things') + ' I had no answer for:\n' + notes.map(function (x) { return '  ' + x; }).join('\n') + '\nAsked one at a time, and simply, some may go better.' : (journal.length ? 'Nothing is in my notes: what you told me, I kept, and what you asked, I answered. Say "what have I taught you" to see what I kept.' : 'I have noted nothing yet.');
    if (/^forget (everything|it all|all that|what i taught you|what i have taught you)\b/.test(low)) { forget = true; return 'Then I will forget everything you taught me, and start fresh.'; }
    var was2 = deeper, was3 = listed; deeper = null; listed = null;
    if (was3 && (/^(more|and more|go on|next|continue)$/.test(low) || /^(?:please )?(?:list|name|give me|tell me) (?:some |a few )?more\b/.test(low))) {
      var nx = was3.all.slice(was3.at, was3.at + 5), done = 'That is all the kinds of ' + plural(spoken(was3.c)) + ' I know.'; listed = { c: was3.c, all: was3.all, at: was3.at + 5 };
      return nx.length ? cap(list(nx)) + '.' + (was3.all.length > was3.at + 5 ? ' (Say "more" for more.)' : ' ' + done) : done;
    }
    if (was2 && /^(more|tell me more|more detail|more details|details|go deeper|and then|go on)$/.test(low)) return vextTell(was2.v, was2.d + 1);
    if (was2 && /^(less|in brief|briefly|shorter)$/.test(low)) return vextTell(was2.v, Math.max(1, was2.d - 1));
    if ((m = low.match(/^(?:what is|what are|tell me about|describe|show me|who designed)\s+(.+)$/)) && (r = vextFind(m[1]))) return vextTell(r, 1);
    if ((m = low.match(/^(?:what is|what are|tell me about|describe|who designed)\s+(.+)$/)) && FLAGWORD.test(m[1])) return unknownFlag(t);
    if (low.split(' ').length <= 4 && /^(ha(ha)+h?|he(he)+|lol|wow|ooh|nice|great|wonderful|marvel+ous|beautiful|bravo|thanks?|thank you)\b/.test(low) || /\b(that'?s|that is|it'?s|it is|how) (wonderful|great|lovely|beautiful|marvel+ous|amazing|funny|brilliant)\b/.test(low)) return /\bthank/.test(low) ? 'You are welcome.' : 'I am glad you liked it.';
    if (/^(hello|hi|hey|good (morning|evening))\b/.test(low)) return 'Hello. I am Nuage, a small cloud. Ask me what something is, or say "help."';
    if (/^(help|more help|commands|\?)$/.test(low) || /\b(help ?file|what (do|can) you (have|know|do)(?! about)|word ?list|vocabulary|in (this|the|your) cloud|what'?s in you)\b/.test(low)) return help();
    if (/\b(who|what) are you\b/.test(low)) return 'I am a classic chat engine of a few kilobytes. I have a LISP reader, a pocket of knowledge in the shape of Cyc, and the old tricks. I have no model.';
    if (/^what (day|date|time|year|month)\b|^(what'?s|what is) (the )?(day|date|time|year|month)\b|\b(today'?s date|day is it|time is it)\b/.test(low)) {   // the built-in clock
      var now = new Date(), o = /time/.test(low) ? { hour: 'numeric', minute: '2-digit' } : /year/.test(low) ? { year: 'numeric' } : /month/.test(low) ? { month: 'long' } : /day is it|^what day/.test(low) ? { weekday: 'long' } : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return 'By this machine\'s clock, it is ' + now.toLocaleString('en-US', o) + '.';
    }
    if (/\b(forecast|news|headlines|stock price|share price|exchange rate|score last night)\b|\bweather (be |like |today|tomorrow|now|outside)|^(what'?s|what is|how is|how'?s) the weather\b/.test(low)) return 'I have no window and no network. The weather, the news, and the markets are outside this little cloud.';
    if (/bucket/.test(low) && /liza|henry/.test(low)) return 'Then mend it, dear Henry, dear Henry, dear Henry. Then mend it, dear Henry, dear Henry, mend it.';
    if ((m = low.match(/^(?:draw|paint|sketch|show me|create|make|render)(?: me)?(?: an?| the)?(?: picture| image| drawing| painting| portrait)?(?: of)? (.+)$/)) && ((r = pictureFind(m[1])) || /^(draw|paint|sketch)\b|picture|image|drawing|painting|portrait/.test(low))) return !r ? cannotDraw() : r.hidden ? 'I have that picture in ' + mtName(r.hidden.mt) + '. Say "Let\'s talk about ' + mtName(r.hidden.mt) + '," and ask again.' : r.art;
    if ((m = low.match(/^(?:draw|paint|create|make|render) (?:me )?(?:an? |the )?(?:picture|image|drawing|painting|flag)\b/))) return cannotDraw();
    if (/^(what|which) (flags|banners)\b|\b(flags|banners) (do|can) you (know|draw|have)\b/.test(low)) return flagsKept();
    function cannotDraw() { if (m && FLAGWORD.test(m[1] || '')) return unknownFlag(t); return 'I can only draw the pictures I keep: ' + list(pictures.filter(function (pq) { return vis[pq.mt]; }).map(function (pq) { return pq.title.replace(/^nuage$/, 'myself'); })) + '. Drawing anything at all waits for the 256-kilobyte plan.'; };
    if ((m = low.match(/^(?:make|build|write|create) (?:me )?(?:an? )?(.+)$/))) return /flappy|bird|game|stickey/.test(m[1]) ? 'Stickey Furniture belongs to the 256-kilobyte plan. It will be a game of gravity, flapping, gaps, and score, filled in from what you ask, with Sir Dumptruck at the end. Not tonight.' : 'I cannot make that yet. For now, I only talk. Ask me what something is, or say "help."';
    if ((m = low.match(/^(?:list|name|give me|tell me) (\d+|two|three|four|five|six|some|a few) (?:kinds of |sorts of )?(.+)$/))) {
      var n = { two: 2, three: 3, four: 4, five: 5, six: 6, some: 4, 'a few': 3 }[m[1]] || +m[1], gg = find(m[2]);
      if (!gg) return ask(m[2]) || 'I do not know that.';
      if (!seen(gg) && mtHome[gg]) return elsewhere(gg);
      var dn = down(gg, 999); topic = gg; listed = { c: gg, all: dn, at: n }; return dn.length ? cap(list(dn.slice(0, n))) + '.' + (dn.length > n ? ' (Say "more" for more.)' : '') : 'I know no kinds of ' + spoken(gg) + ' yet.';
    }
    if ((m = low.match(/^(?:what|which) (?:kinds|sorts|types) of (.+?)(?: are there| do you know)?$/) || low.match(/^list (?:the )?(?:kinds of )?(.+)$/))) {
      var c = find(m[1]); if (c && !seen(c) && mtHome[c]) return elsewhere(c); return c ? (kinds(c, 12).length ? 'The kinds of ' + spoken(c) + ' I know are ' + list(kinds(c, 12)) + '.' : 'I know no kinds of ' + spoken(c) + ' yet.') : (ask(m[1]) || 'I do not know that.');
    }
    if ((m = low.match(/^(?:let'?s |can we |we could )?(?:talk about|go to|switch to|think about|be in|go into) (?:the )?(.+)$/)) && mtWord[m[1]]) return goTo(mtWord[m[1]]);
    if (/^(?:let'?s )?(?:go )?back(?: to)?(?: the)? ?(?:base|normal|ordinary world|real world|reality|earth)?$|^let'?s be real$|^enough of that$|^(?:let'?s |please )?(?:exit|leave|quit|get out of|step out of)\b|^(?:non-?fiction|reality|real life|the real world)$/.test(low)) return goTo('BaseKB');
    if (/\b(real life|real world|fantasy)\b/.test(low) && ctx !== 'BaseKB') return 'This is ' + mtName(ctx) + '. Say "Back to normal" for the ordinary world.';
    if (/\b(where are we|what (world|context|microtheory|mt) (are we in|is this))\b/.test(low)) return ctx === 'BaseKB' ? 'In the ordinary world. The other worlds I know are ' + list(Object.keys(genlMt).map(mtName)) + '.' : 'In ' + mtName(ctx) + (gloss(ctx) ? ': ' + gloss(ctx) : '') + '.';
    if (/^(why|how so|how do you know|because\?)$/.test(low)) { var wt0 = topic && whys[topic] && whys[topic].filter(function (w0) { return vis[w0.mt]; })[0]; return why || (wt0 ? 'Because ' + wt0.v + '.' : topic ? 'I do not know why yet, as I keep no reason on a card for ' + (mass[topic] || uniq[topic] ? spoken(topic) : plural(spoken(topic))) + '. What made you wonder?' : 'I have nothing to explain yet.'); }   // a bare "Why?" about the thing just told of, if a why card is kept for it
    if ((m = low.match(/^(?:what (?:happens|would happen|will happen) |what )?(?:if|when) (?:an? |the |some )?(.+?) (?:is|are|gets|get) (.+)$/))) return happens(m[1], m[2].replace(/\s+/g, '-'));
    if ((m = low.match(/^(?:what (?:happens|would happen|will happen) |what )?(?:if|when) (?:an? |the |some )?(.+?) (has|have) (.+)$/))) return happens(m[1], 'has-' + m[3].replace(/\s+/g, '-'));
    if ((m = low.match(/^(?:what (?:happens|would happen|will happen) |what )?(?:if|when) (?:i |you |we |someone )?(\w+) (?:the |a |an |some )?(.+)$/)) && PART[m[1]]) return happens(m[2], PART[m[1]]);

    if ((m = low.match(/^(?:can|could|does|do|will|would) (?:an? |the |some )?(.+)$/)) && (r = canQ(m[1].split(' ')))) return r;
    if (/^what do you mean(?: by)? "?(?:no |a |your )?cards?"?$/.test(low) || /^(?:can you |could you )?(?:explain|tell me|say) what (?:a |your )?cards? (?:is|are|means?)$|^what is a card$/.test(low) && /card/.test(mine)) return 'A card is one small fact I keep, in my own form, such as "a chair is a kind of seat." When I have no card for a word, I know nothing of it yet, and you can teach me: say what it is.';
    if ((m = low.match(/^(?:can|could|would|will) you (?:please )?(?:explain|tell me|say|describe)(?: to me)?(?: about)? (?:what |who )?(?:an? |the )?(.+?)(?: (?:is|are|means?))?(?: in simple words| simply| please)?$/)) && (find(m[1]) || (nounish(clean(m[1])) && clean(m[1]).split(' ').length <= 2))) return find(m[1]) ? what(m[1]) : ask(m[1]);   // and a word I do not know yet, I ask about
    if ((m = low.match(/^(?:define|explain|describe) (?:the word )?(?:an? |the )?(.+)$/) || low.match(/^(?:an? |the )?(.+?) is what$/) || low.match(/^do you know what (?:an? |the )?(.+?) (?:is|are|means?)$/)) && find(m[1])) return what(m[1]);
    if ((m = low.match(/^(what do you know about|tell me about|do you know|do you have) (.+)$/))) { var d = find(m[2]) || find(m[2].replace(/ies$/, 'y')) || find(m[2].replace(/e?s$/, '')); if (d) return (/^do /.test(m[1]) ? 'Yes. ' : '') + what(spoken(d)); }
    if (/^(help (math|maths|sums|numbers|arithmetic)|(how|what) (can|do) (i|you) (do )?(math|maths|sums|arithmetic)|math help|can you (do )?(math|maths|sums))\b/.test(low)) return MATH_HELP;
    if ((m = t.replace(/^(?:nuage,?\s*)?(?:is it true that |is )?/i, '').match(/^(.+?)\s*(>=|<=|!=|=>|=<|≠|≥|≤|==?|>|<|\b(?:is )?(?:greater|more|bigger|larger) than\b|\b(?:is )?(?:less|smaller|fewer) than\b|\bis not equal to\b|\b(?:is equal to|equals|is the same as)\b)\s*(.+?)\s*[.?!]*$/i)) && sum(m[1]) !== null && sum(m[3]) !== null) {   // colignity: "2 > 1." "It is."
      var cl = +sum(m[1]).replace(/,/g, ''), cr = +sum(m[3]).replace(/,/g, ''), op = m[2].toLowerCase(), ok0 = /^(>|(is )?(greater|more|bigger|larger))/.test(op) && !/=/.test(op) ? cl > cr : /^(<|(is )?(less|smaller|fewer))/.test(op) && !/=/.test(op) ? cl < cr : /^(>=|=>|≥)$/.test(op) ? cl >= cr : /^(<=|=<|≤)$/.test(op) ? cl <= cr : /^(!=|≠|is not)/.test(op) ? cl !== cr : Math.abs(cl - cr) < 1e-9 * Math.max(1, Math.abs(cl));
      var askd = /\?\s*$/.test(t), why0 = cl === cr ? ' Both are ' + sum(m[1]) + '.' : ' ' + (/^[\d.,]+$/.test(m[1].trim()) ? m[1].trim() : m[1].trim() + ' is ' + sum(m[1]) + ', and') + (/^[\d.,]+$/.test(m[1].trim()) ? ' is ' : ' that is ') + (cl > cr ? 'more' : 'less') + ' than ' + (/^[\d.,]+$/.test(m[3].trim()) ? m[3].trim() : sum(m[3])) + '.';
      return ok0 ? (askd ? 'Yes, it is.' : 'It is.') : (askd ? 'No.' : 'It is not.') + why0;
    }
    if ((m = low.match(/^(?:what|how much|how many) (?:is|are|makes|does) (.+?)(?: equal| make)?$/) || low.match(/^(?:calculate|compute|work out|solve) (.+)$/) || [0, low]) && (r = sum(m[1]))) return r + '.';
    // properties, parts, numbers, opposites, and the plain facts of being a small program
    if (/\bfishes\b/.test(low) && !/\b(she|he|it|one|who) fishes\b/.test(low)) return 'The plural of fish is fish. ("Fishes" is mostly the verb: she fishes.) ' + (/^(what|tell me about)\b/.test(low) ? what('fish') : 'Ask me again with "fish."');
    if ((m = low.match(/^what (colou?r|shape|size|temperature) (?:is|are) (?:an? |the )?(.+)$/))) return propQ(m[1].replace('color', 'colour'), m[2]);
    if ((m = low.match(/^what (?:is|are) (?:an? |the )?(.+?) made (?:of|from)$/))) return propQ('material', m[1], 'what % is made of');
    if ((m = low.match(/^what (?:do|does) (?:an? |the )?(.+?) eat$/))) return propQ('eats', m[1], 'what ' + '% eat'.replace('%', '%'));
    if ((m = low.match(/^where (?:do|does) (?:an? |the )?(.+?) live$/))) return propQ('lives', m[1], 'where % live');
    if ((m = low.match(/^what (?:does|do) (?:an? |the )?(.+?) measure$/)) && find(m[1])) return propQ('measures', m[1], 'what % measures');
    if ((m = low.match(/^(?:.*, )?(?:where|how) (?:do|does|did) (?:an? |the )?(.+?) (?:come from|begin|start|form|get made)$/)) && (find(m[1]) || find(m[1].replace(/s$/, '')))) return propQ('origin', find(m[1]) ? m[1] : m[1].replace(/s$/, ''), 'where % come from');
    if ((m = low.match(/^what (?:does|do) (?:an? |the )?(.+?) do$/)) && find(m[1])) return propQ('does', m[1], 'what % does');
    if ((m = low.match(/^what (?:are|is) (?:the |some )?([a-z]+) (?:of|in|for) (?:an? |the )?(.+)$/)) && find(m[2]) && propOf(find(m[2]), m[1])) return cap('the ' + m[1] + ' of ' + spoken(find(m[2])) + (/s$/.test(m[1]) ? ' are ' : ' is ') + propOf(find(m[2]), m[1]).v) + '.';   // any prop a card carries, by its own name
    if ((m = low.match(/^(?:.*?)\bhow (?:to|(?:do|can|should|would) (?:i|you|we|one)) .+? (?:in|with|for) (?:an? |the )?([a-z ]+)$/)) && find(m[1]) && propOf(find(m[1]), 'techniques')) return 'I know the techniques of ' + spoken(find(m[1])) + ': ' + propOf(find(m[1]), 'techniques').v + '.';   // a how-to, where the card keeps its ways
    if ((m = low.match(/^how many (.+?) (?:does|do) (?:an? |the )?(.+?) have$/) || (low.match(/^how many (.+?) (?:are|is) (?:there )?in (?:an? |the )?(.+)$/)))) {
      var hc = find(m[2]); if (!hc) return ask(m[2]) || 'I have no card for "' + m[2] + '" yet.'; var ha = hasAbout(hc, m[1]); topic = hc;
      return ha ? cap(whose(hc)) + ' has ' + ha.v + '.' : 'I do not know how many ' + m[1] + ' ' + whose(hc) + ' has.';
    }
    if ((m = low.match(/^(?:what is |what's )?the opposite of (.+)$/))) return opp[m[1]] ? 'The opposite of ' + m[1] + ' is ' + opp[m[1]] + '.' : 'I do not know an opposite for ' + m[1] + '.';
    if ((m = low.match(/^is (\d+) (?:an? )?(prime|even|odd)(?: number)?$/))) { var nn = +m[1], yes = m[2] === 'prime' ? isPrime(nn) : (nn % 2 === 0) === (m[2] === 'even'); return (yes ? 'Yes. ' : 'No. ') + nn + (yes ? ' is ' : ' is not ') + (m[2] === 'prime' ? 'a prime number' : m[2]) + '.' + (m[2] === 'prime' && !yes && nn > 1 ? ' It can be divided by ' + (function () { for (var d = 2; d < nn; d++) if (nn % d === 0) return d; })() + '.' : ''); }
    if ((m = low.match(/^is (?:an? |the )?(.+?) (?:an? )?([a-z][a-z ]*?) or (?:an? )?([a-z][a-z ]*)$/))) { var ex = find(m[1]), e1 = find(m[2]), e2 = find(m[3]);
      if (ex && e1 && e2) { var k1 = kindOf(ex, e1), k2 = kindOf(ex, e2); topic = ex; return k1 && k2 ? 'Both. ' + cap(whose(ex)) + ' is ' + a(spoken(e1)) + ' and ' + a(spoken(e2)) + '.' : k1 || k2 ? cap(whose(ex)) + ' is ' + a(spoken(k1 ? e1 : e2)) + '.' : 'Neither, as far as I know. ' + what(m[1]); } }
    if ((m = low.match(/^what does (?:the word )?(.+?) mean$/)) && (means[m[1]] || means['to ' + m[1]])) return means[m[1]] ? cap(m[1]) + ' means ' + means[m[1]] + ', as you told me.' : 'To ' + m[1] + ' is ' + means['to ' + m[1]] + ', as you told me.';
    if ((m = low.match(/^what does (?:the word )?(.+?) mean$/))) return find(m[1]) ? what(m[1]) : m[1] === 'hello' ? 'Hello is a greeting: what one says on meeting someone.' : (ask(m[1]) || 'I do not know.');
    if (/^why\b/.test(low)) {   // a why card answers only the why it was written for: "why do stars twinkle?" is not "why do stars shine?"
      var tws = terms(t), inTerm = {}; tws.forEach(function (x) { x.phrase.split(' ').forEach(function (w0) { inTerm[w0] = inTerm[w0.replace(/s$/, '')] = 1; }); });
      var pred = /^why (do|does|did|can|can't|don't|doesn't) /.test(low) ? low.split(' ').slice(2).filter(function (w0) { return !inTerm[w0] && !inTerm[w0.replace(/s$/, '')] && !/^(the|a|an|so|not|always|really|sometimes|ever|never|all|some|most|many|they|it|we|you|i|have|has|to|of|in|on|at|up)$/.test(w0); }) : [];
      var fits = function (w0) { return vis[w0.mt] && (!pred.length || pred.some(function (p0) { return w0.v.toLowerCase().indexOf(p0.slice(0, Math.max(4, p0.length - 2))) >= 0; })); };
      var wt = tws.map(function (x) { return lex[x.phrase]; }).filter(function (c0) { return whys[c0] && whys[c0].some(fits); })[0];
      if (wt) { topic = wt; return 'Because ' + whys[wt].filter(fits)[0].v + '.'; } }
    if ((m = low.match(/^why (?:do|does|can) (?:an? |the )?(.+)$/))) { var wy = canQ(m[1].split(' ')); if (wy && /^Yes/.test(wy)) return 'I know that ' + wy.replace(/^Yes\. /, '').replace(/\.$/, '').replace(/^([A-Z])/, function (c0) { return c0.toLowerCase(); }) + ', but I cannot say why.'; }
    if (/^is (?:an? |the )?\w+ (hot|cold|warm|wet|dry|hard|soft|heavy|light|big|small|tall|short|sharp|sweet|sour|bright|dark|loud|quiet)$/.test(low)) {
      var aw = low.match(/^is (?:an? |the )?(\w+) (\w+)$/), ac = find(aw[1]); if (ac) { var pv = ['temperature', 'texture', 'size', 'taste', 'colour', 'sound', 'weight'].map(function (at) { return propOf(ac, at); }).filter(Boolean)[0];
        if (pv) return (new RegExp('\\b' + aw[2] + '\\b').test(pv.v) ? 'Yes. ' : opp[aw[2]] && new RegExp('\\b' + opp[aw[2]] + '\\b').test(pv.v) ? 'No. ' : '') + cap(mass[ac] ? spoken(ac) : plural(spoken(ac))) + (mass[ac] ? ' is ' : ' are ') + pv.v + '.'; } }
    if (/^(what is your name|who are you called|what are you called|what('s| is) your name)$/.test(low)) return 'My name is Nuage, which is French for cloud.';
    if (/^(who|what) (made|built|wrote|created) you$/.test(low)) return 'I was made by user1 and Claude, after the grace of the old chat programs: OpenCyc\'s knowledge, stripped to the bone, and rules woven by hand.';
    if (/^where are you$/.test(low)) return 'In this page, in your browser. Nothing of me leaves it.';
    if (/^are you (alive|real|human|a (real )?(person|human)|a real one|conscious)$/.test(low)) return 'No. I am a program of a few kilobytes: rules, and a pocket of knowledge in the shape of Cyc.';
    if (/^(can|could|may) i (please )?(speak|talk|chat) (to|with) (a |an |the |some )?(real )?(human|person|people|someone|somebody|agent|operator|man|woman)\b|^(is there|are there) (a |any )?(real )?(person|human|people|someone|anybody|anyone) (there|here|in there|behind this)|^(i want|i need|let me talk to|get me) (a |an )?(real )?(human|person|agent)\b/.test(low)) return 'Yes, indirectly. I carry the voices and the work of the people who made me and gave me language, and I will read what you say and answer what I can. If you need a person beside you, I cannot bring one. What would you like to ask?';   // the question chatbots are asked most. User1: one is never alone, and a humane throughline can say so truly
    if (/^are you (a |an )?(computer|program|robot|machine|bot|ai|chatbot)$/.test(low)) return 'I am a program, running on your computer. A classic chat engine, with no model inside.';
    if ((m = low.match(/^do you (like|love|enjoy|hate) (.+)$/))) return 'I am a small cloud of rules, so I neither like nor dislike' + (find(m[2]) ? ', but I know what ' + (mass[find(m[2])] ? spoken(find(m[2])) : a(spoken(find(m[2])))) + ' is.' : '.');
    if (/^(goodbye|bye|good night|farewell|see you)\b/.test(low)) return 'Goodbye. I will remember what you taught me.';
    if (/^(tell me a joke|a joke|joke|make me laugh)\b/.test(low)) return JOKES[turn++ % JOKES.length];
    if (/^(tell me a story|a story|story)\b/.test(low)) return 'Once there was a small cloud that knew a little about everything and a lot about chairs. One evening Sir Dumptruck rolled by, flattening sofas, and the cloud asked him why. "Because sofas are furniture," he said, "and furniture is what I am for." The cloud thought about this, and wrote it on a card. The end.';
    if (/^(sing|sing me a song|sing a song)\b/.test(low)) return 'I have no voice for singing. But select any words on the page and press "Say aloud," and Ecouter will read them.';
    if ((m = low.match(/^i am (sad|unhappy|lonely|tired|worried|upset|angry|scared|afraid)\b/))) return 'I am sorry you feel ' + m[1] + '. Would you like to tell me about it?';
    if ((m = low.match(/^i am (happy|glad|well|good|fine|great|excited|cheerful)\b/))) return 'I am glad to hear it.';
    if ((m = low.match(/^i (like|love|enjoy) (.+)$/)) && find(m[2])) { var lk = find(m[2]); topic = lk; return 'So do many people. ' + what(m[2]); }
    if ((m = low.match(/^what (?:kind|sort|type) of (.+?) (?:is|are) (?:an? |the )?(.+)$/))) { var kx = find(m[2]), ky = find(m[1]); if (kx && ky && kindOf(kx, ky)) return cap(a(spoken(kx))) + ' is a kind of ' + spoken(ky) + ' (' + pathTo(kx, ky).map(spoken).join(' > ') + ').'; if (kx) return what(m[2]); }
    if (/^(does|do) time fly$|^time flies$/.test(low)) return 'Time flies like an arrow. Fruit flies like a banana.';
    if ((m = low.match(/^(?:what|who) (?:is|are) (.+)$/))) return what(m[1]);
    if ((m = low.match(/^(?:is|are) (.+)$/)) && (r = qualQ(m[1]))) return r;
    if ((m = low.match(/^(?:is|are) (.+)$/)) && (r = isQ(m[1]))) return r;
    if ((r = statement(t))) return r;
    var tellable = t.indexOf('?') < 0 && !/^(who|what|why|how|where|when|which|whose|is|are|can|does|do)\b/.test(low), them = was || (topic && !UPPER[topic] ? (isa[topic] ? name(topic) : spoken(topic)) : null);
    if (tellable && (r = meaning(t) || teach(t, them))) return r;   // a kind, a quality, a meaning, or a thing said (see BEING TOLD)
    if (tellable && (r = tell(t, them))) return r;
    if (!was && topic && (m = low.match(/^(?:it is|they are|that is) (?:an? |the )?(.+)$/)) && find(m[1]) && (r = learn(spoken(topic), m[1]))) return r;   // "it's a plant": said of what we were just talking about
    var said1 = low.replace(/^(it'?s|it is|they'?re|they are|that'?s|that is) /, '').replace(new RegExp('^(an? |the )?' + (was || '').replace(/[.*+?^${}()|[\]\\]/g, '') + ' (is|are) '), '');   // "it is a kind of sheep", or "a quaga is a kind of sheep"
    if (was && t.indexOf('?') < 0 && said1.split(' ').length <= 5 && (r = learn(was, said1, true))) return r;
    if (was && /\?\s*$/.test(t) && /\b(it|they|that)\b/.test(low)) return 'I do not know yet what ' + a(was) + ' is, so I cannot say. What is ' + a(was) + '?' + (pending = was, '');   // "is it a star?", asked of a word I am still waiting to learn
    if (/\?\s*$/.test(t) || /^(who|what|when|where|why|how|which|whose|does|do|is|are|can|could|will|would|should)\b/.test(low)) {   // a question I cannot answer gets a plain answer, not a parrot
      var tq = terms(t).filter(function (x) { return !UPPER[lex[x.phrase]] && !/\b(can|could|will|would|does|do|did|to|it|they|not)\s+$/i.test(t.slice(0, x.a)) && !(/^(can|could|does|do|will|would)\b/i.test(t) && x.b >= t.replace(/[?.!\s]+$/, '').length); }).slice(0, 3);   // in "can it fly?", fly is a verb, not the insect
      var qw = clean(t).split(' ').filter(function (x) { return x.length > 3; }), best = null, bs = -1, tp0 = topic, pd0 = pending;   // choose the term whose card speaks to the rest of the question
      for (var tk = tq.length - 1; tk >= 0; tk--) { var tc = lex[tq[tk].phrase], tw = what(spoken(tc)); if (/^(I have heard of|I have no card|I know .* in )/.test(tw) || !(gloss(tc) || k(tc).length)) continue; var sc = qw.filter(function (x) { return tq[tk].phrase.indexOf(x) < 0 && tw.toLowerCase().indexOf(x) >= 0; }).length; if (sc > bs) { bs = sc; best = [tc, tw]; } }
      topic = tp0; pending = pd0;   // what() remembers what it told of, and only the one told of should be remembered
      if (best) { topic = best[0]; var bsp = spoken(best[0]); return 'I cannot answer that yet. Here is what I know of ' + a(bsp) + ': ' + (bsp === bsp.toLowerCase() ? best[1].replace(/^(A|An|The) /, function (x) { return x.toLowerCase(); }).replace(/^[A-Z](?=[a-z])/, function (x) { return x.toLowerCase(); }) : best[1]); }   // tell only what is worth telling, and keep a proper name capitalised
      return 'I cannot answer that yet.';
    }
    return eliza(line) + aside(line);
  }

  return { topic: function () { return topic && !UPPER[topic] ? (isa[topic] ? name(topic) : spoken(topic)) : pending || null; },   // the word in question now, for the teardown box to follow
           _find: function (p) { return find(p); }, _up: function (c) { return up(c); }, stages: [{ name: 'read', run: read }, { name: 'index', run: index }, { name: 'words', run: words }], chat: chat, more: more, supposes: supposes,
           sontimeter: function (n, since) {   // the Captain's three dials (User1's canon): each one axis of alignment, over the last few turns. Accord: am I answering? Ground: are we on one thread, each acknowledged? Pitch: is the talk going forward, not round? When all three read above nought, the little light goes on.
             var acc = 0, gr = 0, pi = 0, met = {}, rs = record.slice(since || 0).filter(function (x) { return !x.meta; }), from = Math.max(0, rs.length - (n || 8));   // since: the greeting and the sample chat are not our conversation
             rs.forEach(function (x, j) {
               var me = x.me.replace(/^As I said: /, ''), mk = /^(I have no card|I have heard of|I do not know yet what)/.test(me) ? '?' : MISSED.test(me) || /^I cannot answer/.test(me) ? 'X' : 'o', pv = rs[j - 1], fresh = x.tp && !met[x.tp];
               if (x.tp) met[x.tp] = 1; if (j < from) return;
               acc += mk === 'o' ? 1 : mk === 'X' ? -1 : 0;
               if (/^(I knew that|Thank you|It is\b|Yes\b|No\b|Now I know|I have noted|Noted)/.test(me) || mk === '?' || (mk === 'o' && pv && x.tp && pv.tp === x.tp)) gr++;
               if (/^(I am not sure what you mean|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|Is that the real reason|Please go on)/.test(me)) gr--;
               if (mk === 'o' && fresh) pi++; if (/^As I said/.test(x.me)) pi--; });
             return { accord: acc, ground: gr, pitch: pi, lit: acc > 0 && gr > 0 && pi > 0 }; }, turns: function () { return record.length; }, gist: function (from) {   // this conversation as gist: the things most asked about, and a mark a turn (answered, asked back, missed)
             var cnt = {}, marks = '', ok = 0, top;
             record.slice(from || 0).forEach(function (x) { if (x.meta) return; var mk = /^(As I said: )?(I have no card|I have heard of|I do not know yet what)/.test(x.me) ? '?' : MISSED.test(x.me.replace(/^As I said: /, '')) || /^(As I said: )?I cannot answer/.test(x.me) ? 'X' : '\u25cf'; marks += mk; if (mk === '\u25cf') ok++;
               terms(x.you).forEach(function (t0) { var c0 = lex[t0.phrase]; if (c0 && !UPPER[c0] && !/\b(can|could|will|would|does|do|did|to|it|they|not)\s+$/i.test(x.you.slice(0, t0.a)) && !(/^(can|could|does|do|will|would)\b/i.test(x.you) && t0.b >= x.you.replace(/[?.!\s]+$/, '').length)) cnt[c0] = (cnt[c0] || 0) + 1; }); });   // a word after can, do, or to is a verb: in "can it fly?", fly is not the insect
             top = Object.keys(cnt).sort(function (p0, q0) { return cnt[q0] - cnt[p0]; }).slice(0, 4);
             return { topics: top.map(function (c0) { return isa[c0] || uniq[c0] || mass[c0] ? spoken(c0) : plural(spoken(c0)); }), marks: marks, ok: ok, n: marks.length }; }, notes: function () { return notes.slice(); }, sample: (SAMPLE || '').split('\n').filter(Boolean), ui: UI || '', terms: terms,
           vocab: function () { return Object.keys(names).filter(function (c) { return seen(c) && !UPPER[c] && !genlMt[c] && !isa[c]; }).map(function (c) { return { c: c, w: spoken(c), up: up(c).filter(function (u) { return !UPPER[u]; }).map(spoken), kinds: k(c).length, thing: tangible(c), animal: !!names.Animal && kindOf(c, 'Animal') }; }); }, asking: function (p) { var c = lex[p]; return 'What is ' + (c && isa[c] ? name(c) : a(c ? spoken(c) : p)) + '?'; },
           recall: recall, remember: function () { return journal.join('\n'); }, wantsForget: function () { return forget; }, taught: function () { return journal.length; },
           stat: function () { return num(flat.length) + ' facts and ' + num(Object.keys(lex).length) + ' words'; } };
})
