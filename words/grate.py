#!/usr/bin/env python3
"""grate.py -- the cheese-grater (User1, 4 xi 2026): how do sentences usually come out? A corpus is read once and only the
SHAPES of its sentences are kept: at every gap between two words, what kind of word came before, what kind comes after,
and how long the run has gone since the last stop, against what stood in the gap (nothing, a comma, a full stop). Two
hundred thousand articles boil down to a punctuation model of a few tens of kilobytes, words/punct.json, and with it a
run of words with no marks in it, such as Mimia's read-back, can be made to scan: periods and commas where English usually
puts them, and capitals after the periods. It does not make her make sense. It makes her scan, which is the smaller and
the honest promise.

    python words/grate.py                 grate the Simple English Wikipedia shard, if fetched; else the texts at hand
    python words/grate.py --test "..."    punctuate a run of words with the model, to see it work

The word kinds: a function word is itself (the, of, and, is, that ...: a hundred or so); any other word is its shape,
by its ending and its length (ing, ed, ly, s, tion, long, short). The gap before a word that stands first in a sentence
is counted as a full stop. Counts, not weights: the model is a table, legible and small.
"""
import json, os, re, sys, math, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
SHARD = os.path.join(ROOT, '__no-copy', '__sources', 'wp--simple-english', 'simplewiki.jsonl')
OUT = os.path.join(HERE, 'punct.json')
FUNC = set("""the a an of and or but nor so yet to in on at by for from with without into onto upon over under about
around through during before after between among against is are was were be been being am has have had do does did
not no it its it's this that these those he she they we you i me him her them us his their our your my who whom whose
which what when where why how than then there here as if because while though although since until unless whether
can could will would shall should may might must also very too just only even still more most much many some any all
each every both either neither such own same other another one two three first last new old good great little long
up down out off away back again now ever never always often""".split())
MAXRUN = 40


def kind(w):
    lw = w.lower()
    if lw in FUNC: return lw
    if lw.isdigit(): return '#'
    for e in ('tion', 'ing', 'ed', 'ly', 'ness', 'ment', 'ous', 'ive', 'al', 'er', 'es', 's', 'y'):
        if lw.endswith(e) and len(lw) > len(e) + 2: return '-' + e
    return 'long' if len(lw) > 7 else 'short' if len(lw) > 3 else 'tiny'


def runs(n): return str(min(n, MAXRUN) // 3)   # the run since the last stop, in threes


class Model:
    def __init__(self):
        self.pair = collections.defaultdict(lambda: [0, 0, 0, 0, 0])   # (prev kind, next kind) -> [none, comma, dash, semicolon or colon, stop]
        self.run = collections.defaultdict(lambda: [0, 0, 0, 0, 0])    # run since the last stop -> the same
        self.runc = collections.defaultdict(lambda: [0, 0, 0, 0, 0])   # run since the last mark of any kind -> the same
        self.n = 0

    def feed(self, text):
        for para in re.split(r'\n\s*\n', text):
            toks = re.findall(r"[A-Za-z0-9][A-Za-z0-9'\u2019-]*|[.!?;:,]|\u2014|\u2013|--", para)
            words, gaps = [], []   # words, and the mark after each: 0 none, 1 comma, 2 dash, 3 semicolon or colon, 4 stop
            MARK = {',': 1, '\u2014': 2, '\u2013': 2, '--': 2, ';': 3, ':': 3, '.': 4, '!': 4, '?': 4}
            for t in toks:
                if t in MARK:
                    if words: gaps[-1] = max(gaps[-1], MARK[t])
                else: words.append(t); gaps.append(0)
            if len(words) < 6: continue
            since, sincec = 0, 0
            for i in range(len(words) - 1):
                g = gaps[i]; k = (kind(words[i]), kind(words[i + 1]))
                self.pair[k][g] += 1; self.run[runs(since)][g] += 1; self.runc[runs(sincec)][g] += 1; self.n += 1
                since = 0 if g == 4 else since + 1; sincec = 0 if g else sincec + 1

    def dump(self):   # pairs seen fewer than four times are dropped: the table stays small, and the rare gap falls to its run
        prior = [0, 0, 0, 0, 0]
        for v in self.run.values(): prior = [x + y for x, y in zip(prior, v)]
        return {'pair': {a + '|' + b: v for (a, b), v in self.pair.items() if sum(v) >= 20}, 'run': dict(self.run), 'runc': dict(self.runc), 'prior': prior, 'n': self.n}


def lp(v, j):   # a smoothed log probability
    return math.log((v[j] + 0.5) / (sum(v) + 0.5 * len(v)))
MARKS = ['', ',', ' \u2014', ';', '.']   # what each class writes; the semicolon stands for the colon too, being the commoner


def punctuate(words, M):
    """A run of words, with marks placed: greedy over the gaps, each by its pair and its runs together."""
    toks = re.findall(r"[A-Za-z0-9'\u2019-]+|[.,;:!?]+|\u2014|\u2013|--", ' '.join(words)); words, own = [], []   # her own evidence: a mark she wrote votes for itself, a capital after the first word for a stop
    for t in toks:
        if t[0] in '.,;:!?\u2014\u2013-':
            if words: own[-1] = 4 if re.search(r'[.!?]', t) else 3 if re.search(r'[;:]', t) else 2 if re.search(r'[\u2014\u2013-]', t) else 1
        else: words.append(t); own.append(0)
    out, since, sincec = [], 0, 0
    for i, w in enumerate(words):
        if i == len(words) - 1: out.append(w); break
        k = kind(w) + '|' + kind(words[i + 1]); pv = M['pair'].get(k, [1] * 5); rv = M['run'].get(runs(since), [1] * 5); cv = M['runc'].get(runs(sincec), [1] * 5)
        nx = words[i + 1]; cap = 2.5 if re.match(r'[A-Z][a-z]', nx) and nx != 'I' else 0; long = 0.5 + max(0.0, (since - 18) * 0.3)   # a run past twenty words leans toward a stop (User1: sentences do not go that long)
        best = max(range(5), key=lambda j: lp(pv, j) + lp(rv, j) + 0.5 * lp(cv, j) - 1.5 * lp(M['prior'], j) + (cap + long if j == 4 else 0) + (3.0 if own[i] == j else 0))   # three votes, the prior counted once, and her own evidence, which stands unless the corpus is very sure
        if best == 4 and since < 3: best = 0   # no sentence of two words
        out.append(w + MARKS[best])
        since = 0 if best == 4 else since + 1; sincec = 0 if best else sincec + 1
    text = ' '.join(out).rstrip(',; \u2014') + '.'
    text = re.sub(r'(^|[.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)   # a capital after each stop
    return text


def corpus():
    if os.path.exists(SHARD):
        print('grating the Simple English Wikipedia shard')
        with open(SHARD, encoding='utf-8') as f:
            for line in f:
                try: yield json.loads(line)['x']
                except Exception: continue
        return
    print('no shard yet: grating the texts at hand (the distilled questions, the light, and About)')
    for p in [os.path.join(ROOT, '__no-copy', '__references', '__distilled', 'distilled.txt'), os.path.join(ROOT, 'src', 'about.html'), os.path.join(ROOT, 'src', 'sample.txt')]:
        if os.path.exists(p): yield re.sub(r'<[^>]+>', ' ', open(p, encoding='utf-8', errors='replace').read())
    lf = os.path.join(ROOT, 'patty', 'mimia', 'light.jsonl')
    if os.path.exists(lf):
        with open(lf, encoding='utf-8') as f:
            for line in f:
                try: r = json.loads(line); yield str(r.get('a', '')) + '\n\n'
                except Exception: continue


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--test']:
        M = json.load(open(OUT, encoding='utf-8'))
        print(punctuate(' '.join(a[1:]).split(), M))
    else:
        M = Model(); n = 0
        for text in corpus(): M.feed(text); n += 1
        d = M.dump(); json.dump(d, open(OUT, 'w', encoding='utf-8'), separators=(',', ':'))
        print('grated %d texts, %d gaps; %d pairs kept; %s is %d bytes' % (n, d['n'], len(d['pair']), OUT, os.path.getsize(OUT)))
