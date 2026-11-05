/* yampal.js -- the colorburst grammar, and the only copy of it.
   =================================================================
   =
   THE LAW, WHICH IS THE NOTE'S: the file is the only authority on
   its own colours, and a reader that cannot read a mark must say
   which mark. This file is what lets both halves be kept without
   every reader writing its own half.

   It runs in node and in a browser and asks for nothing:

       const Y = require('./yampal.js');        // node
       <script src="yampal.js"></script>        // browser ->
       window.YAMPAL

   TWO THINGS ONLY, and neither of them knows what a card is:

       Y.decode(burst, palette)  ->  { colours, complaints }
       Y.encode(items)           ->  a burst string

   The palette is PASSED IN. There is no table in this file, and
   that is deliberate: a reader that carries one is a second
   authority on the one quantity that may only have one, and it
   will be right for years and then quietly wrong on the day
   somebody adds a slot. Where a caller genuinely has no file --
   a chat window, a console -- it passes whatever table it is
   using and SAYS SO to the person, including how many slots it
   has.

   THE MARKS. Sixteen combining characters, all of combining class
   220, so a burst is byte-identical under NFC and NFD. The anchor
   is the humble period; a period and its marks are one grapheme
   cluster, which is the delimiter, and it costs nothing.

   A BARE PERIOD IS THE MODE SWITCH AND NOTHING ELSE. Zero is
   written with its own mark, U+0316, and always was. A slot with
   no marks anywhere but position 0 is malformed, and is reported
   rather than quietly resolved to palette[0] -- which is a real
   colour, and would look almost right.

   THE HIGH HALF. A slot addresses 0..255 and the palette has never
   needed more than thirty-odd, so the spare room is spent the way
   UTF-8 spends it. See section 6b of the note; the table is
   repeated once, here, in the code that implements it:

       0xxxxxxx  00-7F  palette index                 1 token
       10xxxxxx  80-BF  RGB 2-2-2, said outright      1 token
       1100rrrr  C0-CF  RGB 4-4-4, g and b follow     2 tokens
       1110xxxx  E0-EF  reserved, deliberately empty  --
       11110mmm  F0-F7  true colour, model m, then
                        three tokens. model 0 is
                        sRGB888.                      4 tokens
       11111nnn  F8-FF  the previous colour again,
                        n+1 more times                1 token

   quiet + plur. -- for the entile caravan, 2026
   ================================================================== */
(function (root, make) {
  var api = make();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.YAMPAL = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* value -> combining mark. the order is the format and may never
     be sorted, prettified, or extended past fifteen. */
  var DIG = [0x0316, 0x0317, 0x031C, 0x031D, 0x031E, 0x031F, 0x0320, 0x0323,
             0x0324, 0x0325, 0x0326, 0x0329, 0x032C, 0x032D, 0x032E, 0x0330];
  var VAL = {}; for (var i = 0; i < DIG.length; i++) VAL[DIG[i]] = i;

  function isMark(cp) { return VAL[cp] !== undefined; }

  /* ---- reading --------------------------------------------------
     The string is walked once and turned into SLOTS, each slot
     being the digits it was written with. Nothing is interpreted
     here; interpretation is the next step, and keeping them apart
     is what lets an empty slot be an empty slot rather than a
     zero. */
  function slots(s) {
    var out = [], i, cp;
    s = String(s || '');
    for (i = 0; i < s.length; i++) {
      cp = s.charCodeAt(i);
      if (s.charAt(i) === '.') out.push([]);
      else if (isMark(cp) && out.length) out[out.length - 1].push(VAL[cp]);
    }
    return out;
  }

  /* is there a burst in this line at all? two slots or more, so a
     sentence that happens to end in a full stop is not mistaken
     for a painting. */
  function has(text) {
    var n = 0, run = 0, s = String(text || ''), i, cp;
    for (i = 0; i < s.length; i++) {
      cp = s.charCodeAt(i);
      if (s.charAt(i) === '.') { run = 0; n++; }
      else if (isMark(cp)) { run++; if (run > 2) return false; }
    }
    return n >= 2;
  }

  function hex2(n) { n = Math.max(0, Math.min(255, n | 0));
                     return (n < 16 ? '0' : '') + n.toString(16); }
  function rgb(r, g, b) { return '#' + hex2(r) + hex2(g) + hex2(b); }

  /* ---- decode ---------------------------------------------------
     Returns every colour it could read and a complaint for every
     mark it could not. The two lists are separate on purpose: a
     caller that only wants the picture may have it, and a caller
     that wants to know why a band is missing is told, with the
     token number, which is what a person needs to find the slipped
     mark with their finger. */
  function decode(burst, palette) {
    var sl = slots(burst), out = [], why = [], i, k, v, mode = 'glyph';
    palette = palette || [];

    /* the mode switch: an empty slot at position 0, and only there */
    var start = 0;
    if (sl.length && sl[0].length === 0) { mode = 'positional'; start = 1; }

    for (i = start; i < sl.length; i++) {
      var d = sl[i];
      if (d.length === 0) {
        why.push('token ' + i + ': a period with no marks. zero is ' +
                 'written U+0316; a bare period is the mode switch ' +
                 'and only at the start');
        out.push(null);
        continue;
      }
      if (d.length > 2) {
        why.push('token ' + i + ': ' + d.length + ' marks on one period, ' +
                 'and a slot holds at most two');
        out.push(null);
        continue;
      }
      v = d.length === 1 ? d[0] : d[0] * 16 + d[1];

      if (v < 0x80) {                                   /* the palette */
        if (v < palette.length) out.push(palette[v]);
        else {
          why.push('token ' + i + ': slot ' + v + ' is past this ' +
                   'palette, which has ' + palette.length + ' entries');
          out.push(null);
        }
      } else if (v < 0xC0) {                            /* RGB 2-2-2 */
        out.push(rgb(((v >> 4) & 3) * 85, ((v >> 2) & 3) * 85, (v & 3) * 85));
      } else if (v < 0xD0) {                            /* RGB 4-4-4 */
        var nx = sl[++i];
        if (!nx || !nx.length) {
          why.push('token ' + i + ': half a four-bit colour, the rest ' +
                   'of it is missing');
          out.push(null); break;
        }
        var n2 = nx.length === 1 ? nx[0] : nx[0] * 16 + nx[1];
        out.push(rgb((v & 15) * 17, ((n2 >> 4) & 15) * 17, (n2 & 15) * 17));
      } else if (v < 0xF0) {                            /* reserved */
        why.push('token ' + i + ': lead 0x' + v.toString(16) + ' is ' +
                 'reserved and nothing is written there yet');
        out.push(null);
      } else if (v < 0xF8) {                            /* true colour */
        var model = v & 7, part = [], k2;
        for (k2 = 0; k2 < 3; k2++) {
          var t = sl[++i];
          part.push(!t || !t.length ? null
                    : (t.length === 1 ? t[0] : t[0] * 16 + t[1]));
        }
        if (part.indexOf(null) !== -1) {
          why.push('token ' + i + ': a true colour ran off the end of ' +
                   'the line');
          out.push(null); break;
        }
        if (model !== 0) {
          why.push('token ' + i + ': colour model ' + model + ' is not ' +
                   'defined yet. model 0 is sRGB888');
          out.push(null);
        } else out.push(rgb(part[0], part[1], part[2]));
      } else {                                          /* a run */
        var more = (v & 7) + 1, last = out.length ? out[out.length - 1] : undefined;
        if (last === undefined) {
          why.push('token ' + i + ': a run with nothing in front of it ' +
                   'to repeat');
          continue;
        }
        for (k = 0; k < more; k++) out.push(last);
      }
    }
    return { colours: out, complaints: why, mode: mode };
  }

  /* ---- encode ---------------------------------------------------
     Items are the same vocabulary the table describes:

         { pal: 19 }              a palette slot
         { c222: [3,1,0] }        a coarse colour, 0..3 each
         { c444: [3,10,15] }      a mid colour,    0..15 each
         { rgb: [232,63,122] }    anything at all, 0..255 each
         { run: 8 }               the one before, 8 more times
         { mode: 'positional' }   first item only

     Nothing here guesses. A caller who wants runs found for them
     calls pack() first, which is a separate job and says so. */
  function tok(v) {
    v = v & 0xFF;
    var ds = v < 16 ? [v] : [(v >> 4) & 15, v & 15];
    return '.' + ds.map(function (d) { return String.fromCharCode(DIG[d]); }).join('');
  }
  function encode(items) {
    var out = '', i, it;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.mode === 'positional') { out += '.'; continue; }
      if ('pal'  in it) out += tok(it.pal & 0x7F);
      else if ('c222' in it) out += tok(0x80 | (it.c222[0] << 4) |
                                        (it.c222[1] << 2) | it.c222[2]);
      else if ('c444' in it) out += tok(0xC0 | (it.c444[0] & 15)) +
                                    tok((it.c444[1] << 4) | it.c444[2]);
      else if ('rgb'  in it) out += tok(0xF0) + tok(it.rgb[0]) +
                                    tok(it.rgb[1]) + tok(it.rgb[2]);
      else if ('run'  in it) out += tok(0xF8 | ((it.run - 1) & 7));
    }
    return out;
  }

  /* ---- pack -----------------------------------------------------
     Runs of the same value become runs. Nine identical blues is
     nine chances to slip a mark by hand; a colour and a run is
     two. The shortest true spelling is the most accurate one. */
  function pack(values) {
    var out = [], i = 0, j, n;
    while (i < values.length) {
      out.push({ pal: values[i] });
      j = i + 1;
      while (j < values.length && values[j] === values[i]) j++;
      n = j - i - 1;
      while (n > 0) { var take = Math.min(8, n); out.push({ run: take }); n -= take; }
      i = j;
    }
    return out;
  }

  return { decode: decode, encode: encode, pack: pack,
           slots: slots, has: has, DIG: DIG };
});
