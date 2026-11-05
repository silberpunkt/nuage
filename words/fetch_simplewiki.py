#!/usr/bin/env python3
"""fetch_simplewiki.py -- a shard of Simple English Wikipedia, on the machine and never shipped (User1, 4 xi 2026):
"a spectacular, and accurate in the main, and reliable in the manner, source of citations. And arguably, some ground
truth. Here and there." It is the mirror's and the janitor's: for derivative training, for fast find-and-copy, for
citing. Nothing of it rides in a cut.

    python words/fetch_simplewiki.py            fetch the dump (resumable), and distil it
    python words/fetch_simplewiki.py --distil   distil again from the dump already here
    python words/fetch_simplewiki.py --grep COW  find articles whose title holds a word (a quick check)

What it writes, under __no-copy/__sources/wp--simple-english:
    simplewiki-latest-pages-articles.xml.bz2     the dump as Wikimedia gives it (about 300 MB)
    simplewiki.jsonl      one line an article: {"t": title, "x": plain text}, the wikitext stripped, redirects left out
    simplewiki.titles     the titles, one a line, with the byte offset of each line in the jsonl: the index
    ATTRIBUTION.md        the licence, CC BY-SA 4.0, and how to cite

Standard library only: urllib, bz2, xml.sax, re. The stripping is a plain one, written to be read, not to be perfect:
templates, tables, references, files and categories are cut, links are kept as their shown text, headings are kept as
lines. A sentence that comes out of it is the article's; the citation is the title.
"""
import bz2, json, os, re, sys, time, urllib.request, xml.sax

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '__no-copy', '__sources', 'wp--simple-english'))
URL = 'https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2'
DUMP = os.path.join(OUT, 'simplewiki-latest-pages-articles.xml.bz2')
JSONL = os.path.join(OUT, 'simplewiki.jsonl')
TITLES = os.path.join(OUT, 'simplewiki.titles')

ATTRIBUTION = """# Simple English Wikipedia, a shard

Text from Simple English Wikipedia (https://simple.wikipedia.org), the dump at
%s, fetched %s.

Licence: Creative Commons Attribution-ShareAlike 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
Contributors: the Wikipedia editors; the history of each article is at https://simple.wikipedia.org/wiki/<title>?action=history

This shard is kept on this machine for the mirror's light and for citation. It is not shipped in any cut of Nuage.
Anything derived from it and kept (a card, a line of light) carries this attribution, and the About window names it.
To cite an article: "Simple English Wikipedia, <title>, CC BY-SA 4.0."
"""


def fetch():
    os.makedirs(OUT, exist_ok=True)
    have = os.path.getsize(DUMP) if os.path.exists(DUMP) else 0
    req = urllib.request.Request(URL, headers={'User-Agent': 'nuage-fetch/1 (a small chat engine; local shard)'})
    if have:
        req.add_header('Range', 'bytes=%d-' % have)
    try:
        r = urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as e:
        if e.code == 416:
            print('the dump is already whole:', have, 'bytes'); return
        raise
    total = have + int(r.headers.get('Content-Length') or 0)
    mode = 'ab' if have and r.status == 206 else 'wb'
    if mode == 'wb': have = 0
    t0 = time.time(); got = have
    with open(DUMP, mode) as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b); got += len(b)
            if int(time.time() - t0) % 5 == 0:
                sys.stdout.write('\r  %5.1f of %5.1f MB' % (got / 1e6, total / 1e6)); sys.stdout.flush()
    print('\rfetched', got, 'bytes to', DUMP)
    with open(os.path.join(OUT, 'ATTRIBUTION.md'), 'w', encoding='utf-8') as f:
        f.write(ATTRIBUTION % (URL, time.strftime('%Y-%m-%d')))


# ---- the stripping of wikitext: plain, legible, and enough
RE_COMMENT = re.compile(r'<!--.*?-->', re.S)
RE_REF = re.compile(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>', re.S | re.I)
RE_TAG = re.compile(r'</?(?:math|gallery|timeline|syntaxhighlight|source|pre|code|nowiki|includeonly|noinclude|div|span|br|small|big|sub|sup|center|blockquote|poem|table|tr|td|th)[^>]*>', re.I)
RE_FILE = re.compile(r'\[\[(?:File|Image|Media|Category|Kategorie):[^\]]*(?:\[\[[^\]]*\]\][^\]]*)*\]\]', re.I)
RE_LINK = re.compile(r'\[\[([^\]|]*)\|?([^\]]*)\]\]')
RE_EXT = re.compile(r'\[(?:https?|ftp)://[^\s\]]+\s*([^\]]*)\]')
RE_URL = re.compile(r'https?://\S+')
RE_HEAD = re.compile(r'^=+\s*(.*?)\s*=+\s*$', re.M)
RE_BOLD = re.compile(r"'{2,5}")
RE_TABLE = re.compile(r'\{\|.*?\|\}', re.S)
RE_LIST = re.compile(r'^[*#:;]+\s*', re.M)
RE_WS = re.compile(r'[ \t]+')
RE_NL = re.compile(r'\n{3,}')


def strip_templates(s):   # {{...}} with nesting, cut whole
    out = []; depth = 0; i = 0; n = len(s)
    while i < n:
        if s.startswith('{{', i): depth += 1; i += 2; continue
        if s.startswith('}}', i) and depth: depth -= 1; i += 2; continue
        if not depth: out.append(s[i])
        i += 1
    return ''.join(out)


def plain(wt):
    s = RE_COMMENT.sub('', wt)
    s = RE_REF.sub('', s)
    s = strip_templates(s)
    s = RE_TABLE.sub('', s)
    s = RE_FILE.sub('', s)
    s = RE_LINK.sub(lambda m: m.group(2) or m.group(1), s)
    s = RE_EXT.sub(lambda m: m.group(1), s)
    s = RE_URL.sub('', s)
    s = RE_TAG.sub('', s)
    s = RE_HEAD.sub(lambda m: '\n' + m.group(1) + '\n', s)
    s = RE_BOLD.sub('', s)
    s = RE_LIST.sub('', s)
    s = RE_WS.sub(' ', s)
    s = RE_NL.sub('\n\n', s)
    return s.strip()


class Pages(xml.sax.ContentHandler):
    def __init__(self, out, idx):
        super().__init__(); self.out = out; self.idx = idx; self.path = []; self.buf = []; self.title = ''; self.text = ''; self.ns = '0'; self.redirect = False; self.n = 0; self.kept = 0

    def startElement(self, name, attrs):
        self.path.append(name); self.buf = []
        if name == 'page': self.title = ''; self.text = ''; self.ns = '0'; self.redirect = False
        if name == 'redirect': self.redirect = True

    def characters(self, c): self.buf.append(c)

    def endElement(self, name):
        v = ''.join(self.buf); self.path.pop()
        if name == 'title': self.title = v
        elif name == 'ns': self.ns = v.strip()
        elif name == 'text': self.text = v
        elif name == 'page':
            self.n += 1
            if self.ns == '0' and not self.redirect and self.text:
                x = plain(self.text)
                if len(x) >= 80:
                    at = self.out.tell()
                    self.out.write(json.dumps({'t': self.title, 'x': x}, ensure_ascii=False) + '\n')
                    self.idx.write('%s\t%d\n' % (self.title.replace('\t', ' '), at)); self.kept += 1
            if self.n % 5000 == 0:
                sys.stdout.write('\r  %d pages read, %d articles kept' % (self.n, self.kept)); sys.stdout.flush()


def distil():
    if not os.path.exists(DUMP): print('no dump yet: run without --distil first'); return
    with bz2.open(DUMP, 'rb') as src, open(JSONL, 'w', encoding='utf-8') as out, open(TITLES, 'w', encoding='utf-8') as idx:
        h = Pages(out, idx); xml.sax.parse(src, h)
    print('\rdistilled: %d pages read, %d articles kept, in %s' % (h.n, h.kept, JSONL))


def grep(word):
    if not os.path.exists(TITLES): print('no index yet'); return
    w = word.lower(); hits = 0
    with open(TITLES, encoding='utf-8') as f, open(JSONL, 'rb') as j:
        for line in f:
            t, at = line.rstrip('\n').rsplit('\t', 1)
            if w in t.lower():
                j.seek(int(at)); rec = json.loads(j.readline().decode('utf-8'))
                print(rec['t'] + ': ' + rec['x'][:160].replace('\n', ' ') + ' ...'); hits += 1
                if hits >= 12: break
    print(hits, 'shown')


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--distil']: distil()
    elif a[:1] == ['--grep'] and len(a) > 1: grep(' '.join(a[1:]))
    else: fetch(); distil()
