/* challenge.js -- ask Nuage a written challenge set and sort each answer the way patty-cake does, group by group.
     node patty/challenge.js [patty/challenge.txt] [--all]      (--all prints every answer, not only the misses) */
const fs = require('fs'), path = require('path'), { wake } = require('../pack/load.js');
const file = process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, 'challenge.txt'), ALL = process.argv.includes('--all');
function sort(reply) {
  if (/^I have no card for|What, then, is|I have heard of/.test(reply)) return 'asked';
  if (/^I do not know|^I cannot answer|^I know of nothing|^Not that I know|^I can only draw|^I cannot make/.test(reply)) return 'unknown';
  if (/^I know .* in [A-Z]\w*\. Say/.test(reply)) return 'elsewhere';
  if (/^(Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|How long have you been|Why do you feel|Is that the real reason|Tell me more about your family)/.test(reply)) return 'parrot';
  return 'answered';
}
const N = wake(), groups = []; let g = null;
fs.readFileSync(file, 'utf8').split('\n').forEach((l) => {
  if (!l.trim() || /^# [a-z]+\.txt/.test(l)) return;
  if (l[0] === '#') { if (/^# One per line/.test(l)) return; g = { name: l.slice(1).trim(), rows: [] }; groups.push(g); return; }
  const a = N.chat(l.trim()); (g || (g = { name: 'questions', rows: [] }, groups.push(g), g)).rows.push({ q: l.trim(), a, kind: sort(a) });
});
let total = 0, ok = 0;
groups.forEach((gr) => {
  const n = gr.rows.filter((r) => r.kind === 'answered').length; total += gr.rows.length; ok += n;
  console.log('\n' + gr.name + ': ' + n + ' of ' + gr.rows.length + ' answered');
  gr.rows.forEach((r) => { if (ALL || r.kind !== 'answered') console.log('  [' + r.kind + '] ' + r.q + '\n      ' + r.a.slice(0, 150)); });
});
console.log('\nall: ' + ok + ' of ' + total + ' answered (' + Math.round(100 * ok / total) + '%). "Answered" means Nuage gave an answer of its own, not that the answer is right: read them.');
