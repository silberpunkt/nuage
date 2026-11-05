#!/usr/bin/env python3
"""fetch_words.py -- brings the outer word libraries home into __libs/words, to equip Nuage's word-knowing, never to be
packed into the page. Started by patty.php (do=words) from the panel's "Fetch the word libraries"; needs only Python's
own standard library. Every step goes to words/fetch.log; the last line says "done" or "failed".

  1. CMUdict (Carnegie Mellon, BSD-style licence): 135,000 words with their phonemes and stress, in ARPAbet.
  2. Open English WordNet 2025 (CC BY 4.0, globalwordnet): every lemma's senses and definitions, as the GWA XML.
  3. Etymologies from English Wiktionary (CC BY-SA 4.0), as extracted by kaikki.org (wiktextract, Tatu Ylonen): the
     etymology text, the affix templates (prefix, suffix, compound), and the IPA, for the words in 1 and 2 only.
     This is the long part: kaikki's English file is about 3 GB, read as it streams and never kept whole.

What lands in __libs/words, sharded by first letter so that one word is one small read:
  cmudict.dict, cmudict.LICENSE        as fetched
  wn/<a..z,_>.jsonl                    {"w", "pos", "defs": [...], "ex": [...]} a lemma and part of speech
  etym/<a..z,_>.jsonl                  {"w", "pos", "etym", "parts": [[name, args...]], "ipa": [...]}
  ATTRIBUTION.md                       who made what, and under which licence

    python words/fetch_words.py [--skip-etym] [--libs <path to __libs>]
"""
import gzip, io, json, os, re, sys, time, urllib.request, xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
LIBS = args[args.index('--libs') + 1] if '--libs' in args else os.path.join(HERE, '..', '..', '__libs')
OUT = os.path.join(os.path.abspath(LIBS), 'words')
LOG = os.path.join(HERE, 'fetch.log')
CMU = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict'
CMU_LIC = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/LICENSE'
OEWN = 'https://en-word.net/static/english-wordnet-2025.xml.gz'
KAIKKI = ['https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl',        # English only (deprecated, but lighter to read)
          'https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz']                       # every language; English kept by lang_code
AFFIX = {'af', 'affix', 'prefix', 'pre', 'suffix', 'suf', 'confix', 'con', 'compound', 'com', 'blend', 'univerbation', 'surf', 'inh', 'der', 'bor', 'lbor', 'clipping', 'back-formation', 'bf'}

def say(t):
    with open(LOG, 'a', encoding='utf-8') as f: f.write(t + '\n')
    print(t, flush=True)

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'nuage-words/1'}), timeout=60)

def shard(w):
    c = w[:1].lower()
    return c if 'a' <= c <= 'z' else '_'

class Shards:                                            # one open file a first letter
    def __init__(self, d):
        self.d = d; os.makedirs(d, exist_ok=True); self.f = {}
        for n in os.listdir(d):
            if n.endswith('.jsonl'): os.remove(os.path.join(d, n))
    def put(self, w, rec):
        k = shard(w)
        if k not in self.f: self.f[k] = open(os.path.join(self.d, k + '.jsonl'), 'w', encoding='utf-8')
        self.f[k].write(json.dumps(rec, ensure_ascii=False) + '\n')
    def close(self):
        for f in self.f.values(): f.close()

def cmudict():
    say('Fetching CMUdict.')
    data = get(CMU).read().decode('utf-8', 'replace')
    open(os.path.join(OUT, 'cmudict.dict'), 'w', encoding='utf-8').write(data)
    try: open(os.path.join(OUT, 'cmudict.LICENSE'), 'w', encoding='utf-8').write(get(CMU_LIC).read().decode('utf-8', 'replace'))
    except Exception as e: say('  (the licence file did not come: %s)' % e)
    words = {re.sub(r'\(\d+\)$', '', l.split(' ', 1)[0]).lower() for l in data.splitlines() if l and not l.startswith(';;;')}
    say('  CMUdict: %d words.' % len(words))
    return words

def kids(el, name): return [c for c in el if c.tag.split('}')[-1] == name]

def wordnet(stream):                                     # the GWA (LMF) XML, read as it streams
    say('Reading Open English WordNet 2025.')
    syn, entries = {}, []
    for ev, el in ET.iterparse(stream, events=('end',)):
        tag = el.tag.split('}')[-1]
        if tag == 'LexicalEntry':
            lem = (kids(el, 'Lemma') or [None])[0]
            if lem is not None:
                entries.append((lem.get('writtenForm'), lem.get('partOfSpeech'), [s.get('synset') for s in kids(el, 'Sense')]))
            el.clear()
        elif tag == 'Synset':
            d = (kids(el, 'Definition') or [None])[0]; exs = [x.text for x in kids(el, 'Example') if x.text]
            syn[el.get('id')] = ((d.text or '') if d is not None else '', exs[:1])
            el.clear()
    sh = Shards(os.path.join(OUT, 'wn')); words = set()
    for w, pos, ss in entries:
        if not w: continue
        defs = [syn[s][0] for s in ss if s in syn][:8]; ex = [e for s in ss if s in syn for e in syn[s][1]][:2]
        sh.put(w, {'w': w, 'pos': pos, 'defs': defs, 'ex': ex}); words.add(w.lower())
    sh.close()
    say('  WordNet: %d lemmas, %d synsets.' % (len(words), len(syn)))
    return words

def etymology(lines, keep):                              # kaikki JSONL, one entry a line; English entries for kept words only
    sh = Shards(os.path.join(OUT, 'etym')); n = kept = 0; t0 = time.time()
    for line in lines:
        n += 1
        if n % 200000 == 0: say('  %d entries read, %d kept, %ds.' % (n, kept, time.time() - t0))
        try: e = json.loads(line)
        except ValueError: continue
        if e.get('lang_code', 'en') != 'en': continue
        w = e.get('word') or ''
        if w.lower() not in keep: continue
        et = (e.get('etymology_text') or '').strip()
        parts = [[t.get('name')] + [v for k, v in sorted((t.get('args') or {}).items(), key=lambda kv: kv[0]) if k.isdigit()][:6]
                 for t in (e.get('etymology_templates') or []) if t.get('name') in AFFIX]
        ipa = [s['ipa'] for s in (e.get('sounds') or []) if s.get('ipa')][:2]
        if not (et or parts or ipa): continue
        sh.put(w, {'w': w, 'pos': e.get('pos'), 'etym': et[:900], 'parts': parts, 'ipa': ipa}); kept += 1
    sh.close()
    say('  Etymologies: %d entries read, %d kept.' % (n, kept))

def attribution():
    open(os.path.join(OUT, 'ATTRIBUTION.md'), 'w', encoding='utf-8').write("""# The word libraries, and who made them

Fetched by `__nuage/words/fetch_words.py` for local study. Not packed into Nuage's page.

- **CMUdict**, the Carnegie Mellon University Pronouncing Dictionary. BSD-style licence (cmudict.LICENSE).
  https://github.com/cmusphinx/cmudict
- **Open English WordNet 2025**, the Global WordNet Association and its contributors, after Princeton WordNet 3.0.
  CC BY 4.0. https://en-word.net
- **Etymologies, affix templates, and IPA from English Wiktionary**, by its editors, CC BY-SA 4.0, as extracted by
  kaikki.org with wiktextract (Tatu Ylonen, "Wiktextract: Wiktionary as Machine-Readable Structured Data", LREC 2022).
  https://kaikki.org . Anything made from etym/ and shared must carry the same licence.
""")

def main():
    os.makedirs(OUT, exist_ok=True)
    open(LOG, 'w').close()
    say('Bringing the word libraries home, into ' + OUT + '.')
    try:
        cmu = cmudict()
        wn = wordnet(gzip.GzipFile(fileobj=get(OEWN)))
        attribution()
        if '--skip-etym' not in args:
            keep = cmu | wn
            for url in KAIKKI:
                try:
                    say('Reading Wiktionary etymologies from ' + url + ' as it streams (about 3 GB; this is the long part).')
                    r = get(url)
                    raw = gzip.GzipFile(fileobj=r) if url.endswith('.gz') else r
                    etymology(io.TextIOWrapper(raw, encoding='utf-8', errors='replace'), keep)
                    break
                except urllib.error.HTTPError as e:
                    say('  %s answered %s; trying the next source.' % (url, e.code))
        say('done: the word libraries are in ' + OUT)
    except Exception as e:
        say('failed: %s' % e)

if __name__ == '__main__':
    main()
