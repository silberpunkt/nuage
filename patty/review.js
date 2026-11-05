/* review.js -- your ruling on patty-cake's cards. Each proposed card is shown with the question it was written for, and
   what Nuage said before and after. Keep it (y), drop it (n), or leave it for another day (enter). Kept cards go to
   kb/taught.kb, which the packer and every later session read; dropped ones are remembered so they are not proposed again.
     node patty/review.js            then rebuild with: node pack/pack.js */
const fs = require('fs'), path = require('path'), readline = require('readline');
const HERE = __dirname, P = path.join(HERE, 'proposed.kb'), T = path.join(HERE, '..', 'kb', 'taught.kb'), X = path.join(HERE, 'dropped.kb');
if (!fs.existsSync(P)) { console.log('No cards are waiting. Run node patty/patty.js first.'); process.exit(0); }
const blocks = []; let cur = [];
fs.readFileSync(P, 'utf8').split('\n').forEach((l) => { if (!l.trim()) return; cur.push(l); if (l[0] === '(') { blocks.push(cur); cur = []; } });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout }), keep = [], drop = [], wait = [];
let i = 0;
const next = () => {
  if (i >= blocks.length) return finish();
  const b = blocks[i];
  console.log('\n' + b.join('\n'));
  rl.question('Keep this card? (y / n / enter to wait) ', (ans) => { (ans.trim()[0] === 'y' ? keep : ans.trim()[0] === 'n' ? drop : wait).push(b); i++; next(); });
};
function finish() {
  if (keep.length) fs.appendFileSync(T, (fs.existsSync(T) ? '' : '; taught.kb -- cards from patty-cake, kept by your ruling (review.js)\n') + keep.map((b) => b.join('\n')).join('\n') + '\n');
  if (drop.length) fs.appendFileSync(X, drop.map((b) => b.join('\n')).join('\n') + '\n');
  fs.writeFileSync(P, wait.map((b) => b.join('\n')).join('\n') + (wait.length ? '\n' : ''));
  console.log('\nKept ' + keep.length + ', dropped ' + drop.length + ', waiting ' + wait.length + '.' + (keep.length ? ' Rebuild with: node pack/pack.js' : ''));
  rl.close();
}
console.log(blocks.length + ' card(s) are waiting for your ruling.');
next();
