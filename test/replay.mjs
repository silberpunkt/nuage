/* replay.mjs -- play a talk to Nuage, one line a turn, and print what she says.   qjs test/replay.mjs [__nuage] [talk.txt] */
import * as std from 'std';
const ROOT = (scriptArgs[1] || '.').replace(/\/?$/, '/'), TALK = scriptArgs[2] || 'test/report4.txt';
const read = (f) => std.loadFile(ROOT + f);
const vext = (t) => t.split('\n').filter((l) => !/^;/.test(l)).join('\n').split(/^<vext>\s*/m).filter((b) => b.trim()).map((b) => {
  const ls = b.split('\n'), title = ls.shift().trim(), q = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  return '(vext ' + q(title) + ' ' + q(ls.filter((l) => l.trim()).join('\n')) + ')'; }).join('\n');
const trimKb = (kb) => kb.split('\n').map((l) => (/^\s*;/.test(l) ? '' : l.trim())).filter(Boolean).join('\n');
const FILES = ['kb/seed.kb', 'kb/cyc.kb', 'kb/vext.txt', 'kb/pictures.txt', 'kb/taught.kb', 'kb/shelf-flags.txt', 'kb/shelf-flags-pictures.txt', 'kb/shelf-science.kb'];
const KB = FILES.map((f) => [f, read(f)]).filter((x) => x[1] !== null).map(([f, t]) => (/vext\.txt$|shelf-flags\.txt$/.test(f) ? vext(t) : /pictures\.txt$/.test(f) ? t.split('\n').filter((l) => !/^;/.test(l)).join('\n') : trimKb(t))).join('\n');
const N = (0, eval)(read('src/nuage.js'))(KB, read('src/sample.txt'), ''); for (const s of N.stages) for (const _ of s.run());
for (const l of read(TALK).split('\n')) { if (!l.trim()) continue; print('> ' + l); print('  ' + N.chat(l).replace(/\n/g, '\n  ')); print(''); }
