/* hollow.js -- a gloss that says nothing is worse than none. OpenCyc's comments, cut short, sometimes come out hollow:
   a stutter ("an event is an descending event"), a circle ("records are objects that record", "killer" for Killing),
   or logicians' jargon ("a subcollection of artifact"). user1: "simple tautology. Those add no value I can name."
   A gloss is hollow when it stutters, or names the thing it glosses (or Cyc's jargon) and adds at most one new word
   beyond the thing's own name and its parents'. strip-cyc.js drops hollow glosses as it writes; run alone, this file
   cleans a knowledge file in place:   node pack/hollow.js kb/cyc.kb */
const STOP = new Set('a an the of is are and or to in on for with that which by as be it its this any some kind type sort thing something'.split(' '));
const split = (c) => c.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/);
const root = (w) => w.replace(/(ing|er|ers|s|ed)$/, '');
function hollow(term, parents, gloss) {
  const g = gloss.toLowerCase();
  if (/^an? [a-z]+ (is|are) an? /.test(g) || /\bsub-?collection\b|\bspecialization of\b|\bthe collection of\b|\bcollection of instances\b|\[|--$/.test(g)) return true;   // a stutter, jargon, or a dangling dash
  if (/\b(a|an|the|of|with|certain|between)$/.test(g) || /\bintermediate between [\w ]+$/.test(g)) return true;   // cut short mid-thought
  const ownRoots = new Set(split(term).map(root)), known = new Set(split(term).concat(...(parents || []).map(split)).map(root));
  const ws = g.replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  const novel = ws.filter((w) => !known.has(root(w)));
  return ws.some((w) => ownRoots.has(root(w))) && novel.length <= 1;
}
function tidy(g) {                                       // the logicians' words, put plainly: "an instance of organization" -> "an organization"
  g = g.replace(/,? (i\.e|e\.g)\.?$/, '').replace(/\ba ([aeio])/g, 'an $1');   // a trailing "i.e" was cut short; "a end" is "an end"
  if (!/instance of|_/.test(g)) return g;
  return g.replace(/\b(?:some |an? )?instance of (?:an? )?(\w)/gi, (m, c) => (/[aeiou]/i.test(c) ? 'an ' : 'a ') + c).replace(/_generic\b/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
module.exports = { hollow, tidy };
function clean(t) {                                      // a whole knowledge file: hollow glosses out, the rest put plainly
  const gen = {}, dropped = [], tidied = [];   // "point_topographical is a tapering piece of land" becomes "a tapering piece of land"
  for (const m of t.matchAll(/\(genls (\w+) (\w+)\)/g)) (gen[m[1]] = gen[m[1]] || []).push(m[2]);
  const out = t.replace(/^\(comment (\w+) "([^"]*)"\)\n/gm, (all, c, g) => {
    const own = split(c)[0], n = tidy(g.replace(new RegExp('^' + own + '_[a-z_]+ (is|are) ', 'i'), ''));
    if (hollow(c, gen[c], n)) { dropped.push(c + ': ' + g); return ''; }
    if (n !== g) tidied.push(c + ': ' + n);
    return '(comment ' + c + ' "' + n + '")\n';
  });
  return { out, dropped, tidied };
}
module.exports.clean = clean;
if (require.main === module) {
  const fs = require('fs'), f = process.argv[2]; if (!f) { console.log('node pack/hollow.js <file.kb>'); process.exit(1); }
  const r = clean(fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(f, r.out); console.log('hollow glosses dropped: ' + r.dropped.length + (r.dropped.length ? '\n  ' + r.dropped.join('\n  ') : '') + '\ntidied: ' + r.tidied.length + (r.tidied.length ? '\n  ' + r.tidied.join('\n  ') : ''));
}
