/* score.mjs -- the scoreboard. Runs Nuage on test/score.txt and counts two things: whether it answers rightly, and
   whether it answers gently. Written for QuickJS, which wakes Nuage in a few dozen milliseconds:
       qjs test/score.mjs [path to __nuage]
   It prints the totals and every miss, writes them to test/score.last.txt, and shows the change since the last run.

   GENTLENESS, counted over every reply (not only the scored ones):
     dead ends    a reply that could not help and offers nothing next: no question back, no "say ...", no suggestion,
                  no note. Fewer is gentler.
     offers       of the replies that could not help, the share that offered something next. More is gentler.
     acknowledged of the things you told it (statements, not questions or commands), the share it acknowledged.
     words        the average words a reply costs to read (pictures left out). A plain measure of imposition. */
import * as std from 'std';
const ROOT = (scriptArgs[1] || '.').replace(/\/?$/, '/');
const read = (f) => std.loadFile(ROOT + f);
const vext = (t) => t.split('\n').filter((l) => !/^;/.test(l)).join('\n').split(/^<vext>\s*/m).filter((b) => b.trim()).map((b) => {
  const ls = b.split('\n'), title = ls.shift().trim(), q = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  return '(vext ' + q(title) + ' ' + q(ls.filter((l) => l.trim()).join('\n')) + ')'; }).join('\n');
const trimKb = (kb) => kb.split('\n').map((l) => (/^\s*;/.test(l) ? '' : l.trim())).filter(Boolean).join('\n');
const FILES = ['kb/seed.kb', 'kb/cyc.kb', 'kb/vext.txt', 'kb/pictures.txt', 'kb/taught.kb', 'kb/shelf-flags.txt', 'kb/shelf-flags-pictures.txt', 'kb/shelf-science.kb'];
const KB = FILES.map((f) => [f, read(f)]).filter((x) => x[1] !== null).map(([f, t]) => (/vext\.txt$|shelf-flags\.txt$/.test(f) ? vext(t) : /pictures\.txt$/.test(f) ? t.split('\n').filter((l) => !/^;/.test(l)).join('\n') : trimKb(t))).join('\n');
const ENGINE = read('src/nuage.js'), SAMPLE = read('src/sample.txt');
const wake = () => { const N = (0, eval)(ENGINE)(KB, SAMPLE, ''); for (const s of N.stages) for (const _ of s.run()); return N; };

const FAILED = /^(I do not know|I cannot answer|I know of nothing|Not that I know|I have no card|I can only|I cannot|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|Is that the real reason|Please go on)/;
const OFFER = /\?|say "|did you mean|made a note|ask me|teach me|try |let's talk about|i know are|i keep|is a kind of/i;   // a next step, or something related it does know
const COMMAND = /^(draw|tell|name|list|let's|back|more|less|yes|no|notes|define|write|sing|forget|help|hello|show)\b/i;
const ACK = /^(thank you|it is\b|i have noted|i knew that|now i know|i will|noted|yes|no\b|then i|we are in|back to|you said)/i;
const isPicture = (r) => /\n[⠀ ]*\.[.̀-ͯ]*$/.test(r);

let N = null, group = '', scored = 0, right = 0, replies = 0, failed = 0, offered = 0, told = 0, acked = 0, words = 0, wordReplies = 0;
const misses = [], dead = [], perGroup = {};
for (const raw of read('test/score.txt').split('\n')) {
  const line = raw.trim();
  if (!line || /^# score\.txt|^# (expression|group|happens|questions)/.test(line)) continue;
  if (line[0] === '#') { if (/^# [a-z]/.test(line) && !/=>|"/.test(line) && line.length < 40) { group = line.slice(2); N = wake(); perGroup[group] = [0, 0]; } continue; }
  const [q, want] = line.split(/\s*=>\s*/);
  const r = N.chat(q); replies++;
  if (FAILED.test(r)) { failed++; if (OFFER.test(r)) offered++; else dead.push('  [' + group + '] ' + q + '\n      ' + r.replace(/\s+/g, ' ').slice(0, 140)); }
  if (!/\?\s*$/.test(q) && !COMMAND.test(q)) { told++; if (ACK.test(r) || /^You said .* things at once/.test(r)) acked++; }
  if (!isPicture(r)) { words += r.split(/\s+/).length; wordReplies++; }
  if (want !== undefined) {
    scored++; perGroup[group][1]++;
    if (new RegExp(want, 'i').test(r)) { right++; perGroup[group][0]++; } else misses.push('  [' + group + '] ' + q + '\n      wanted /' + want + '/, got: ' + r.replace(/\s+/g, ' ').slice(0, 140));
  }
}
const pct = (a, b) => (b ? Math.round(100 * a / b) : 0) + '%';
const now = {
  right: pct(right, scored), deadEnds: failed - offered, offers: pct(offered, failed), acknowledged: pct(acked, told), words: (words / wordReplies).toFixed(1),
};
const summary = 'right ' + right + ' of ' + scored + ' (' + now.right + ')   dead ends ' + now.deadEnds + '   offers on a miss ' + now.offers + ' (' + offered + ' of ' + failed + ')   acknowledged ' + now.acknowledged + ' (' + acked + ' of ' + told + ')   words a reply ' + now.words;
const last = read('test/score.last.txt'), lastLine = last ? last.split('\n')[0] : null;
print('scoreboard: ' + replies + ' replies over ' + Object.keys(perGroup).length + ' groups');
print('  ' + summary);
if (lastLine && lastLine !== summary) print('  last time: ' + lastLine);
print('  by group: ' + Object.entries(perGroup).map(([g, [a, b]]) => g + ' ' + a + '/' + b).join(', '));
if (misses.length) print('  misses:\n' + misses.join('\n'));
if (dead.length) print('  dead ends:\n' + dead.join('\n'));
const f = std.open(ROOT + 'test/score.last.txt', 'w'); f.puts(summary + '\n' + (misses.length ? 'misses:\n' + misses.join('\n') + '\n' : '') + (dead.length ? 'dead ends:\n' + dead.join('\n') + '\n' : '')); f.close();
