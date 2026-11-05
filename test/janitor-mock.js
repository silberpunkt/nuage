// janitor-mock.js -- stands in for serve.php, patty/patty.php and __demo/engine.php, so the page's patty-cake panel can be
// driven in a headless browser where there is no PHP and no card. Same verbs, same answers; the job runs patty.js --mock.
//   node test/janitor-mock.js <root holding __nuage> [port]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execSync } = require('child_process');
const ROOT = path.resolve(process.argv[2] || '..'), PORT = +(process.argv[3] || 8080), NU = path.join(ROOT, '__nuage'), JOB = process.env.MOCK_JOB || '/tmp/nuage-mock-job.json';   // never the real patty/job.json: a real job may be running beside the test
let engine = false; const llama = { installed: false, lit: false, loading: false, fetching: false, model: '' };
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return false; } };
const job = () => { try { return JSON.parse(fs.readFileSync(JOB, 'utf8')); } catch (e) { return null; } };
const running = (j) => !!j && ['starting', 'writing questions', 'running'].includes(j.state) && (j.pid ? alive(j.pid) : Date.now() / 1000 - (j.since || 0) < 20);
const MD = path.join(NU, 'patty', 'mimia'), ML = path.join(MD, 'light.mock.jsonl'), MLOG = path.join(MD, 'grind.mock.log');
const mim = () => { const log = fs.existsSync(MLOG) ? fs.readFileSync(MLOG, 'utf8').trim() : ''; return { light: fs.existsSync(ML) ? fs.readFileSync(ML, 'utf8').split('\n').filter(Boolean).length : 0, grinding: !!log && !/grind: done|Traceback/.test(log), log: log.split('\n').pop(), bin: fs.existsSync(path.join(MD, 'mimia.bin')) ? fs.statSync(path.join(MD, 'mimia.bin')).size : 0, meta: fs.existsSync(path.join(MD, 'mimia.json')) ? JSON.parse(fs.readFileSync(path.join(MD, 'mimia.json'), 'utf8')) : null }; };
const blocks = (f) => { if (!fs.existsSync(f)) return []; const out = []; let notes = []; fs.readFileSync(f, 'utf8').split('\n').forEach((l) => { if (!l.trim()) return; if (l[0] === '(') { out.push({ card: l, notes }); notes = []; } else notes.push(l); }); return out; };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), q = Object.fromEntries(u.searchParams), send = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  if (u.pathname === '/__demo/engine.php') { if (q.do === 'start') engine = true; if (q.do === 'stop') engine = false; return send({ ok: true, alive: engine }); }
  if (u.pathname === '/__nuage/patty/patty.php') {
    const P = path.join(NU, 'patty', 'proposed.kb');
    const body = () => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { r(JSON.parse(b)); } catch (e) { r({}); } }); });
    if (q.do === 'fetch') { setTimeout(() => (llama.installed = true), 800); return send({ ok: true }); }
    if (q.do === 'lstart') { llama.model = q.model; llama.lit = true; return send({ ok: true }); }
    if (q.do === 'lstop') { llama.lit = false; return send({ ok: true }); }
    if (q.do === 'pupil') return body().then((b) => { if (!engine && !llama.lit) return send({ error: 'the engine is dark' }); const n = (b.talk || []).length;
      send({ reply: b.step === 'topic' ? 'Penguins' : b.step === 'verdict' ? 'B - it knew what a penguin was, but not where penguins live.' : ['What is a penguin?', 'Can it fly?', 'Where do penguins live?', 'Why do penguins swim?'][n % 4] }); });
    if (q.do === 'ask') return body().then((b) => { if (!engine && !llama.lit) return send({ error: 'the engine is dark' }); const m = b.messages || [], last = m.filter((x) => x.role === 'user').pop() || {}; send({ reply: 'A penguin is a flightless seabird of the southern hemisphere. (You asked: ' + last.content + '; I can see ' + m.length + ' messages.)' }); });
    if (q.do === 'misses') return body().then((b) => { fs.appendFileSync(path.join(NU, 'test', 'candidates.mock.txt'), (b.misses || []).map((m) => m.q + ' =>   ; ' + b.topic).join('\n') + '\n'); send({ ok: true }); });
    if (q.do === 'status') { const j = job(); if (j && !running(j) && ['starting', 'writing questions', 'running'].includes(j.state)) { j.state = 'stopped'; fs.writeFileSync(JOB, JSON.stringify(j)); } return send({ engine: engine || llama.lit, classic: engine, llama: Object.assign({ name: { impeccable: 'Qwen3.5 9B', fantastic: 'Gemma 4 E4B' }[llama.model] || '' }, llama), job: j, running: running(j), waiting: blocks(P).length, mimia: mim(), words: { fetched: false, fetching: false, log: '' } }); }
    if (q.do === 'start') { if (running(job())) return send({ ok: false, note: 'a job is already running' }); if (!engine) return send({ ok: false, error: 'the engine is dark: start it first' });
      fs.writeFileSync(JOB, JSON.stringify({ state: 'starting', pid: 0, n: +q.n, since: Date.now() / 1000 }));
      spawn(process.execPath, ['patty/patty.js', '--mock', '--n', String(+q.n), '--job', JOB, '--slow'].concat(q.talks === '1' ? ['--talks'] : q.mirror === '1' ? ['--mirror'] : []), { cwd: NU, detached: true, stdio: 'ignore' }).unref(); return send({ ok: true }); }
    if (q.do === 'stop') { const j = job(); if (running(j)) { try { process.kill(j.pid, 'SIGTERM'); } catch (e) {} } return send({ ok: true }); }
    if (q.do === 'grind') { if (!fs.existsSync(ML)) return send({ ok: false, error: 'there is no light yet: run the mirror first' }); fs.writeFileSync(MLOG, 'grind: starting\n');
      const pr = spawn('python3', ['patty/mimia/grind.py', '--light', ML, '--steps', '120'], { cwd: NU, detached: true, stdio: ['ignore', fs.openSync(MLOG, 'a'), fs.openSync(MLOG, 'a')] }); pr.unref(); return send({ ok: true }); }
    if (q.do === 'word') { if (!/^[A-Za-z][A-Za-z'-]{0,47}$/.test(q.w || '')) return send({ ok: false, error: 'one word, of letters, please' }); const t = JSON.parse(execSync(process.execPath + ' words/teardown.js --json ' + q.w, { cwd: NU }).toString()); return send({ ok: true, tear: t, card: execSync(process.execPath + ' words/teardown.js ' + q.w, { cwd: NU }).toString().trim() }); }
    if (q.do === 'words') return send({ ok: true });
    if (q.do === 'readback') return body().then((b) => { const tf = '/tmp/rb-mock.txt'; fs.writeFileSync(tf, String(b.text || '')); try { send({ ok: true, read: JSON.parse(execSync(process.execPath + ' words/readback.js --json --file ' + tf, { cwd: NU }).toString()) }); } catch (e) { send({ ok: false, error: e.message }); } });
    if (q.do === 'cards') return send({ cards: blocks(P) });
    if (q.do === 'rule') { const all = blocks(P), i = all.findIndex((b) => b.card === q.card); if (i < 0) return send({ ok: false, error: 'that card is not waiting' });
      const b = all.splice(i, 1)[0]; if (q.keep === '1' && q.amend && q.amend !== b.card) { b.notes.push(';   amended by your ruling, from: ' + b.card); b.card = q.amend; } const text = b.notes.concat([b.card]).join('\n') + '\n'; fs.appendFileSync(q.keep === '1' ? path.join(NU, 'kb', 'taught.kb') : path.join(NU, 'patty', 'dropped.kb'), text);
      fs.writeFileSync(P, all.map((x) => x.notes.concat([x.card]).join('\n')).join('\n') + (all.length ? '\n' : '')); return send({ ok: true, kept: q.keep === '1', waiting: all.length }); }
    if (q.do === 'pack') { const log = execSync(process.execPath + ' pack/pack.js 2>&1', { cwd: NU }).toString(); return send({ ok: /read back byte for byte: ok/.test(log), log: log.slice(0, 1200) }); }
  }
  const f = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(fs.readFileSync(f));   // utf-8, as serve.php and most servers say
}).listen(PORT, () => console.log('janitor-mock on ' + PORT + ', serving ' + ROOT));
