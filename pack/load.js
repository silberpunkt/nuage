/* load.js -- the Nuage engine, woken in Node with no page: the same knowledge files, read the same way the packer reads
   them, plus any extra cards. For patty-cake and for tests.
     const { wake, kbText } = require('./load.js');  const N = wake(extraCards);  N.chat('What is a dog?') */
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const DEFAULT = ['kb/seed.kb', 'kb/cyc.kb', 'kb/vext.txt', 'kb/pictures.txt', 'kb/taught.kb', 'kb/shelf-flags.txt', 'kb/shelf-flags-pictures.txt', 'kb/shelf-science.kb'];   // the shelves too: patty-cake and the tests see all of Nuage
function vext(t) {
  return t.split('\n').filter((l) => !/^;/.test(l)).join('\n').split(/^<vext>\s*/m).filter((b) => b.trim()).map((b) => { const ls = b.split('\n'), title = ls.shift().trim(), q = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    return '(vext ' + q(title) + ' ' + q(ls.filter((l) => l.trim()).join('\n')) + ')'; }).join('\n');
}
function trimKb(kb) { return kb.split('\n').map((l) => (/^\s*;/.test(l) ? '' : l.trim())).filter(Boolean).join('\n'); }
function kbText(files) {
  return (files || DEFAULT).filter((f) => fs.existsSync(path.join(ROOT, f))).map((f) => {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    return /vext\.txt$|shelf-flags\.txt$/.test(f) ? vext(t) : /pictures\.txt$/.test(f) ? t.split('\n').filter((l) => !/^;/.test(l)).join('\n') : trimKb(t);
  }).join('\n');
}
function wake(extra, files) {
  const N = (0, eval)(fs.readFileSync(path.join(ROOT, 'src', 'nuage.js'), 'utf8'))(kbText(files) + '\n' + (extra || ''), fs.readFileSync(path.join(ROOT, 'src', 'sample.txt'), 'utf8'), '');
  for (const s of N.stages) for (const _ of s.run());
  return N;
}
module.exports = { wake, kbText, ROOT };
