#!/usr/bin/env python3
"""grind.py -- Mimia, the fast lithogrinder (User1's terrible theory, made a method).

Mimia knows nothing. She is a small, separate engine, a function respond(question) like a language model's, and at
step nought she can only say nothing. The light of a model (Qwen, Gemma: whichever was lit when the mirror ran) is
gathered by patty-cake's mirror step into patty/mimia/light.jsonl, one question and one teacher answer a line. This
script grinds her surface against that light until her mirror shows the manner, and perhaps the maker.

How, in plain words:
  * She reads bytes, not words: the last 32 bytes of her own answer, the question as a bag of hashed words and word
    pairs, how far into the answer she is, and a copy hint (the byte that follows, in the question, the longest tail of
    what she has said so far), so she can echo the question's own words. From these she guesses the next byte. Every byte she guesses rightly
    earns credit, so half an answer earns half the credit (User1: "rewarded for partial or guttural answers").
  * Balanced ternary: every weight is -1, 0, or +1, times one scale a hidden unit (after BitNet b1.58). Five trits
    pack into a byte, so the whole of her fits in about 125 KB.
  * Nested, like a matryoshka (after MatFormer): each training step grinds the whole of her and also a smaller core,
    the first 64, 128, or 256 hidden units, so that every core can speak alone. The file is laid out unit by unit,
    so ANY PREFIX OF THE FILE, cut at a unit boundary, is a smaller working Mimia. Take the first 64 KB: you get a
    wilder, simpler one. The small spinny core calls out to the broader frame around it.
  * The fourth gear (User1's NO WAY, BACK TO CORE): when Nuage already answers a question from its cards, the light
    for it is a single byte, YIELD. So she learns to hand back to the core whatever the core already knows.
  * Deterministic: fixed weights, greedy choice of the likeliest byte. The same question gets the same answer.

She copies manner, not knowledge. At this size, expect the shape of the teacher's answers (openings, rhythm, length,
hedges) and wild shots at facts. Never let her state a fact as Nuage's own: that is what the yield gear is for.

Needs only Python 3 and numpy (the demo's venv has both). CPU is enough: she is small. The long part is the light.

    python patty/mimia/grind.py [--epochs 3] [--units 512|2048] [--tap commerce] [--light patty/mimia/light.jsonl] [--steps N] [--seed 7]

Writes patty/mimia/mimia.bin, mimia.json (what was done, and the loss at each core size), and mimia-samples.txt
(a few answers read back from the very file written, at each core size). Progress goes to stdout, one line a stride.
"""
import json, math, os, re, struct, sys, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
C, D, QB, P, V = 32, 16, 512, 16, 128                    # context bytes, embedding width, question buckets, position bins, vocabulary
H = int(sys.argv[sys.argv.index('--units') + 1]) if '--units' in sys.argv else 512   # hidden units: 512 is about 127 KB; 2048 is about 500 KB, whose first 128 KB is a core
GR = [g for g in (64, 128, 256, 512, 1024, 2048, 4096) if g < H] + [H]                # the nested cores, each ground to speak alone
ML = 9                                                  # match lengths 0..8, for the copy hint
IN = C * D + D + ML + QB + P
YIELD, SEP, END = 1, 2, 3
MAXA = 240                                              # the longest answer she is taught, or will give
TRIT_IN = (IN + 4) // 5                                 # bytes for one hidden unit's input weights
TRIT_V = (V + 4) // 5                                   # bytes for one hidden unit's output weights

SUBS = {'‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', ' ': ' '}
def norm(t):                                            # the same in mimia.js: plain ASCII, one line, single spaces
    t = ''.join(SUBS.get(ch, ch) for ch in str(t)).replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
    t = ''.join(ch for ch in t if 32 <= ord(ch) < 127)
    return re.sub(r' +', ' ', t).strip()

def fnv(s):                                             # FNV-1a, 32 bits, over UTF-8: the same in mimia.js
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h = ((h ^ b) * 0x01000193) & 0xffffffff
    return h

def qfeat(q):                                           # the question as a bag of hashed words and word pairs, unit length
    toks = re.findall(r"[a-z0-9']+", norm(q).lower())
    feats = toks + [toks[i] + ' ' + toks[i + 1] for i in range(len(toks) - 1)]
    v = np.zeros(QB, np.float64)
    for f in feats:
        v[fnv(f) % QB] += 1.0
    n = math.sqrt(float((v * v).sum()))
    return v / n if n > 0 else v

def posb(t): return min(P - 1, t // 16)

def hint(qn, ans):                                      # the copy hint: find the longest tail of the answer so far (up to
    ql, al = qn.lower(), ans.lower()                    # 8 bytes) in the question, latest place first, and offer the byte
    for L in range(min(8, len(al)), 0, -1):             # that follows it there. "An e" finds "a e" in "what is a edge?",
        i = ql.rfind(al[-L:])                           # and offers "d". So she can echo the question's own words.
        if i >= 0 and i + L < len(qn):
            return ord(qn[i + L]), L
    return SEP, 0

def target(a, yield_):                                  # what she is taught to say, as bytes
    if yield_:
        return [YIELD, END]
    a = norm(a)
    if len(a) > MAXA:                                   # cut at a sentence end where one falls late enough
        cut = a.rfind('. ', 0, MAXA)
        a = a[:cut + 1] if cut > MAXA // 2 else a[:MAXA]
    return [ord(ch) for ch in a] + [END]

# ---- the file: a header, then one record a hidden unit, so that any prefix cut at a unit is a smaller Mimia
def pack_trits(q):                                      # q in {-1,0,1}, 5 trits a byte
    d = (q.astype(np.int64) + 1)
    pad = (-len(d)) % 5
    d = np.concatenate([d, np.ones(pad, np.int64)]).reshape(-1, 5)
    return (d[:, 0] + 3 * d[:, 1] + 9 * d[:, 2] + 27 * d[:, 3] + 81 * d[:, 4]).astype(np.uint8).tobytes()

def unpack_trits(b, n):
    a = np.frombuffer(b, np.uint8).astype(np.int64)
    out = np.empty((len(a), 5), np.int64)
    for k in range(5):
        out[:, k] = a % 3; a = a // 3
    return (out.reshape(-1)[:n] - 1).astype(np.float64)

def tq(W, axis):                                        # ternary quantization, one scale a hidden unit
    s = np.abs(W).mean(axis=axis, keepdims=True) + 1e-8
    Q = np.clip(np.round(W / s), -1, 1)
    return Q * s, Q, s

def export(path, E, Eh, b1, b2, W1, W2):
    es = float(np.abs(E).max()) / 127.0 + 1e-12
    _, Q1, s1 = tq(W1, 1)
    _, Q2, s2 = tq(W2, 0)
    out = bytearray(b'MIMI') + struct.pack('<BBBBHHHHf', 2, C, D, P, QB, V, H, IN, es)
    out += np.clip(np.round(E / es), -127, 127).astype(np.int8).tobytes()
    hs = float(np.abs(Eh).max()) / 127.0 + 1e-12
    out += struct.pack('<f', hs) + np.clip(np.round(Eh / hs), -127, 127).astype(np.int8).tobytes()
    out += b2.astype(np.float16).tobytes()
    head = len(out)
    for j in range(H):
        out += struct.pack('<eee', float(s1[j, 0]), float(b1[j]), float(s2[0, j]))
        out += pack_trits(Q1[j]) + pack_trits(Q2[:, j])
    open(path, 'wb').write(bytes(out))
    return head, (len(out) - head) // H

def load(path, units=None):                             # read back (a prefix of) the file, as mimia.js does
    b = open(path, 'rb').read()
    assert b[:4] == b'MIMI'
    ver, c, d, p, qb, v, h, inn, es = struct.unpack('<BBBBHHHHf', b[4:20])
    o = 20
    E = np.frombuffer(b, np.int8, v * d, o).astype(np.float64).reshape(v, d) * es; o += v * d
    hs = struct.unpack('<f', b[o:o + 4])[0]; o += 4
    Eh = np.frombuffer(b, np.int8, v * d, o).astype(np.float64).reshape(v, d) * hs; o += v * d
    b2 = np.frombuffer(b, np.float16, v, o).astype(np.float64); o += 2 * v
    rec = 6 + TRIT_IN + TRIT_V
    have = min(h, (len(b) - o) // rec, units or h)
    s1, bb1, s2, T1, T2 = [], [], [], [], []
    for j in range(have):
        r = b[o + j * rec: o + (j + 1) * rec]
        a1, a2, a3 = struct.unpack('<eee', r[:6])
        s1.append(a1); bb1.append(a2); s2.append(a3)
        T1.append(unpack_trits(r[6:6 + TRIT_IN], inn)); T2.append(unpack_trits(r[6 + TRIT_IN:], v))
    return dict(E=E, Eh=Eh, b2=b2, s1=np.array(s1), b1=np.array(bb1), s2=np.array(s2), T1=np.array(T1), T2=np.array(T2).T, units=have)

def respond(m, q):                                      # greedy, deterministic; returns (text, yielded)
    qn = norm(q); qv, ctx, out = qfeat(q), [SEP] * C, []
    W2 = m['T2'] * m['s2']
    for t in range(MAXA + 1):
        hb, hl = hint(qn, ''.join(map(chr, out)))
        x = np.concatenate([m['E'][ctx].reshape(-1), m['Eh'][hb], np.eye(ML)[hl], qv, np.eye(P)[posb(t)]])
        h = np.maximum(m['s1'] * (m['T1'] @ x) + m['b1'], 0)
        lg = W2 @ h + m['b2']
        if t == 0:                                      # she yields only when she is sure: YIELD more likely than all else together
            pr = np.exp(lg - lg.max()); pr /= pr.sum()
            if pr[YIELD] > 0.5: return '', True
            lg[YIELD] = -np.inf
        y = int(np.argmax(lg))
        if y < 32: break
        out.append(y); ctx = ctx[1:] + [y]
    return ''.join(map(chr, out)), False

# ---- the grinding
def main():
    a = sys.argv[1:]
    opt = lambda k, dflt: type(dflt)(a[a.index('--' + k) + 1]) if '--' + k in a else dflt
    light = opt('light', os.path.join(HERE, 'light.jsonl')); epochs = opt('epochs', 3.0); seed = opt('seed', 7)
    rng = np.random.default_rng(seed)
    # TAPPABLE DOMAINS (User1: "don't train her on commercial sh** ever. Witches don't."): kinds of talk named in
    # domains.json are left out of her grinding, unless tapped on purpose with --tap <name>.
    tap = set(a[a.index('--tap') + 1].split(',')) if '--tap' in a else set()
    dpath = os.path.join(HERE, 'domains.json')
    DOMS = {k: re.compile(v, re.I) for k, v in (json.load(open(dpath)) if os.path.exists(dpath) else {}).items() if not k.startswith('_')}
    kept_out = {k: 0 for k in DOMS}
    def domain_of(r):
        if r.get('domain') and r['domain'] != 'general': return r['domain']
        for k, rx in DOMS.items():
            if rx.search(str(r.get('q', ''))) or len(set(m.lower() for m in rx.findall(str(r.get('a', ''))))) >= 3: return k   # the question, or an answer steeped in it
        return 'general'
    rows = []
    for line in open(light, encoding='utf-8'):
        line = line.strip()
        if not line: continue
        try: r = json.loads(line)
        except ValueError: continue
        if not (r.get('q') and (r.get('a') or r.get('yield'))): continue
        d = domain_of(r)
        if d != 'general' and d not in tap: kept_out[d] += 1; continue
        rows.append(r)
    if not rows: sys.exit('grind: no light in ' + light + ' -- run the mirror first')
    models = sorted(set(r.get('model', '?') for r in rows))
    print('grind: %d answers of light, from %s; %d yield to the core' % (len(rows), ', '.join(models), sum(1 for r in rows if r.get('yield'))), flush=True)
    for k, v in kept_out.items():
        if v: print('grind: %d answers in the %s domain kept out (tap them with --tap %s)' % (v, k, k), flush=True)
    QV = np.array([qfeat(r['q']) for r in rows], np.float32)
    seqs, ctxs, ys, poss, hbs, hls = [], [], [], [], [], []
    for i, r in enumerate(rows):
        tg = target(r.get('a', ''), r.get('yield')); qn = norm(r['q'])
        hist = [SEP] * C; said = ''
        for t, y in enumerate(tg):
            hb, hl = hint(qn, said)
            seqs.append(i); ctxs.append(hist[-C:]); ys.append(y); poss.append(posb(t)); hbs.append(hb); hls.append(hl)
            hist = hist + [y]; said += chr(y)
    seqs = np.array(seqs, np.int32); ctxs = np.array(ctxs, np.int64); ys = np.array(ys, np.int64); poss = np.array(poss, np.int64)
    hbs = np.array(hbs, np.int64); hls = np.array(hls, np.int64)
    N = len(ys); B = 512
    steps = opt('steps', int(max(200, epochs * N / B)))
    print('grind: %d bytes to learn, %d steps of %d, cores %s' % (N, steps, B, GR), flush=True)
    E = rng.normal(0, 0.5, (V, D)); Eh = rng.normal(0, 0.5, (V, D)); W1 = rng.normal(0, 1 / math.sqrt(IN), (H, IN)); b1 = np.zeros(H)
    W2 = rng.normal(0, 1 / math.sqrt(H), (V, H)); b2 = np.zeros(V)
    ps = [E, Eh, W1, b1, W2, b2]; m1 = [np.zeros_like(p) for p in ps]; m2 = [np.zeros_like(p) for p in ps]
    eye = np.eye(P, dtype=np.float32); eyem = np.eye(ML, dtype=np.float32)
    t0 = time.time(); stride = max(1, steps // 40); seen = {g: [] for g in GR}
    for st in range(1, steps + 1):
        k = rng.integers(0, N, B); ctx = ctxs[k]; y = ys[k]
        hb = hbs[k]
        x = np.concatenate([E[ctx].reshape(B, C * D), Eh[hb], eyem[hls[k]], QV[seqs[k]], eye[poss[k]]], axis=1)
        W1q, _, _ = tq(W1, 1); W2q, _, _ = tq(W2, 0)
        z = x @ W1q.T + b1; h = np.maximum(z, 0)
        dh = np.zeros_like(h); dW2 = np.zeros_like(W2); db2 = np.zeros_like(b2)
        for g in (H, GR[rng.integers(0, len(GR) - 1)] if len(GR) > 1 else H):   # the whole of her, and one smaller core
            lg = h[:, :g] @ W2q[:, :g].T + b2
            lg -= lg.max(1, keepdims=True); pr = np.exp(lg); pr /= pr.sum(1, keepdims=True)
            seen[g].append(float(-np.log(pr[np.arange(B), y] + 1e-12).mean()))
            dl = pr; dl[np.arange(B), y] -= 1; dl /= B
            dW2[:, :g] += dl.T @ h[:, :g]; db2 += dl.sum(0); dh[:, :g] += dl @ W2q[:, :g]
        dz = dh * (z > 0)
        dW1 = dz.T @ x; db1 = dz.sum(0); dx = dz @ W1q
        dE = np.zeros_like(E); np.add.at(dE, ctx, dx[:, :C * D].reshape(B, C, D))
        dEh = np.zeros_like(Eh); np.add.at(dEh, hb, dx[:, C * D:C * D + D])
        lr = 2e-3 * (0.1 + 0.9 * 0.5 * (1 + math.cos(math.pi * st / steps)))
        for i, (p, gp) in enumerate(zip(ps, [dE, dEh, dW1, db1, dW2, db2])):   # Adam, straight through the ternary rounding
            m1[i] = 0.9 * m1[i] + 0.1 * gp; m2[i] = 0.999 * m2[i] + 0.001 * gp * gp
            p -= lr * (m1[i] / (1 - 0.9 ** st)) / (np.sqrt(m2[i] / (1 - 0.999 ** st)) + 1e-8)
        if st % stride == 0 or st == steps:
            avg = {g: (sum(seen[g][-50:]) / len(seen[g][-50:])) for g in GR if seen[g]}
            print('step %d of %d   bits a byte: %s   %ds' % (st, steps, '  '.join('%d:%.2f' % (g, v / math.log(2)) for g, v in sorted(avg.items())), time.time() - t0), flush=True)
    path = os.path.join(HERE, 'mimia.bin')
    head, rec = export(path, E, Eh, b1, b2, W1, W2)
    size = os.path.getsize(path)
    print('grind: wrote mimia.bin, %d bytes: a %d-byte head, then %d units of %d bytes. Any prefix cut at a unit is a smaller Mimia.' % (size, head, H, rec), flush=True)
    meta = dict(when=time.strftime('%Y-%m-%dT%H:%M:%S'), light=len(rows), kept_out=kept_out, tapped=sorted(tap), models=models, bytes=N, steps=steps, size=size, head=head, record=rec, cores=GR,
                bits={g: round(sum(seen[g][-200:]) / max(1, len(seen[g][-200:])) / math.log(2), 3) for g in GR if seen[g]})
    json.dump(meta, open(os.path.join(HERE, 'mimia.json'), 'w'), indent=1)
    pick = [r for r in rows[:: max(1, len(rows) // 7)] if not r.get('yield')][:6] + [r for r in rows if r.get('yield')][:1]   # mostly questions she should answer, one she should yield
    probe = [(r['q'], '[yield]' if r.get('yield') else norm(r.get('a', ''))[:200]) for r in pick] + [('What is a flumbatrix?', '(not in the light)')]
    lines = []
    for g in GR:
        m = load(path, g)
        lines.append('## the first %d units (%d KB of the file)' % (g, (head + g * rec + 1023) // 1024))
        for q, teach in probe:                          # her answer beside the teacher's, so the two can be read together
            txt, yl = respond(m, q)
            lines.append('> ' + q + '\n  teacher: ' + teach + '\n  Mimia:   ' + ('[yield]' if yl else txt or '...'))
    open(os.path.join(HERE, 'mimia-samples.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('grind: done. Samples, read back from the file at each core size, are in mimia-samples.txt.', flush=True)

if __name__ == '__main__':
    main()
