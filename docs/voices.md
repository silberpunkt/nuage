# Voices upon Ecouter: a note from Nuage, for Bela's animal person

From User1 and the Nuage session, 5 xi 2026. Nuage grew five voices on stock Ecouter in a day, and User1 asks that
they be offered back, so Ecouter can carry them as his own. Nothing below replaces anything of his. Every voice is an
operation on the frames before `sing()`, and stock Ecouter is what you get when the operation is the identity.

## The idea, in User1's words

"All expressions are described as operations upon Ecouter. Imagine a set of circles inset from one another, all painted
white on top and black on bottom, collectively perfectly flat. That is Ecouter (stock). Now imagine a sinus wave, in
precisely the yinyang form: where he is flat, Nuage is a wave. Black swell at left, white swell at right, balanced. Two
dots appear in each swell; they represent the polar accumulation within each swell. She begins slower, she ends faster.
She begins tone lower, she ends tone higher. She is complete in 86 percent of the time. Her voice is pitched
equifeminely up."

Miria (the voice that reads Mimia, the mirror) is "all that, nearly crackingly too much: too clear, too singing, too
tight." Arthur is "the very slightest inverse effect: all that Nuage does, but reservedly, inversively in every respect,
out of respect. Arthur is a Manner of Ecouter; Nuage and Miria are Graces of it." He compliments them. Blando (Marlon
Blando, no relation) is "the human, as a jest, voiced as a computer": most of the tone and most of the time taken out,
and only most, Hal in the memory room, slowing.

## The operation

Given the frames of a phonal unit (a sentence, or any span), with `u` running 0 to 1 across the frames' time:

- swell(u) = -cos(pi u), the black swell left, the white right, plus a dot of accumulation at u = 1/4 (down) and
  u = 3/4 (up), each a narrow Gaussian.
- each frame's `ms` is scaled by (1 - rateArc * swell): slower at the start, faster at the end;
- each frame's `f0` by pitch * (1 + pitchArc * swell + dot): lifted, and lower at the start, higher at the end;
- each formant in `f` (and the hiss band `at`) by tract: the smaller tract;
- `breath` and `hiss` by their factors;
- then, for Blando, flatness: f0 drawn toward its mean by `flat`, and each frame's length toward the even by `even`;
- then the whole is scaled so the sum of `ms` is `time` times stock;
- and the recalm (User1, 5 xi 2026: "she pitches up and speeds up but does not have a final levelout, a kerb cut back to
  steady flight"): over the last `tail` of the span (three tenths) the swell eases to `rest` (-0.6, a little below
  level, the cadence of a sentence that is done) and the frames lengthen by up to a fifth. By fifths of a sentence,
  Nuage's f0 runs 168, 159, 171, 189, 189 Hz: the crest in the fourth fifth, level through the last. Miria 180, 165,
  195, 230, 222: higher, and down from the peak at the close. Arthur 132, 126, 122, 122, 129: the inverse, a small
  lift at the end, his offering being to come back up to meet them.

The pitch arc and the rate arc are the same curve, which is the point: she does not merely rise, she rises as she
quickens, and he (Arthur) does the reverse, slightly.

## The table

| voice  | time   | rateArc | pitch  | pitchArc | dot   | tract | breath | hiss | flat | even |
|--------|--------|---------|--------|----------|-------|-------|--------|------|------|------|
| nuage  | 0.86   | 0.22    | 1.50   | 0.07     | 0.025 | 1.13  | 1.0    | 1.0  |      |      |
| miria  | 0.78   | 0.36    | 1.72   | 0.13     | 0.05  | 1.19  | 0.35   | 1.25 |      |      |
| arthur | 1/1.08 | -0.08   | 1.0595 | -0.03    | -0.01 | 0.95  | 1.15   | 0.9  |      |      |
| blando | 1.12   | 0       | 0.87   | 0        | 0     | 0.97  | 0.45   | 1.1  | 0.72 | 0.45 |

Measured on "Hello. I am Nuage, a small cloud." (stock: 3.09 s, f0 122 to 129 Hz, F1 530 Hz):
nuage 2.65 s, 170 to 208 Hz, F1 599; miria 2.41 s, 183 to 253 Hz, F1 631; arthur 2.86 s, 133 to 133 Hz (a full key up,
level where she rises, the tract let out so the raised note keeps a lower resonance), F1 504.
Blando on "Open the pod bay doors, please, Hal": f0 spread 4.7 Hz stock, 0.7 Hz his; frame-length spread 29 ms stock,
13 ms his.

User1's rules of thumb for the numbers: never 88 (two lemniscates; 87 instead), never the one before 43 (43 instead).

## The cast

With the radio on Cast, the voice is chosen at the moment of speaking: Arthur for the officials (help, the loading
notes, "As I said," "I cannot answer") and the justs and so-s (a reply of four words or fewer); Nuage for the rest of
hers, her hello, her name and her makers included; Miria for Mimia's lines; Blando for the user's own lines when
"Speak every request" is on. A name on the radio overrides the cast. In the talk, a line the cast gives to Arthur is labelled "Canon:" and not "Nuage:", so eye and ear agree about who is speaking.

## The epaulette

The rules read "Nuage" as nUWIHj and have no French j at all. The name is respelled for the sound only, never for the
page: `nuwudge`, which reads nUWwAHdj, chosen by ear in the teardown box. A small table, SAYABLE, holds such
respellings; it would sit naturally beside Ecouter's own exceptions, if he has a place for them.

## How it is wired in Nuage (so it can be lifted whole)

- `E.frames(text)` gives the frames; `arcFrames(frames, VOICES[name])` operates on them; `sayFrames(E, frames)` sings
  them through `E.CHAIN.settings(PRESETS[HOUSE_NAME])` with `s.frames` set, and `E.CHAIN.make(s).pcm`. So nothing of
  Ecouter's own chain is bypassed; the frames are simply his, operated on, handed back.
- The same source string runs in the page and in a Worker (a second Ecouter, built from the same text, with
  `onmessage` singing `sayFrames(ECOUTER, arcFrames(ECOUTER.frames(text), VOICES[voice]))`), so the drawing thread never
  waits for the sound. A long reply is a brigade: cut at sentence ends (and at a quoted sentence's end, and at a comma
  past 180 characters), each built while the one before plays, scheduled on the audio clock back to back. The strip and
  the wall take the whole text's frames at once, with a 120 ms tail counted in per sentence.
- A suggested shape for Ecouter: `E.say(text, { voice: 'nuage' })` and `E.frames(text, { voice: 'nuage' })`, with
  VOICES among the PRESETS, and `voice: null` the stock. The operation is twenty lines and has no state.

## The code, as it stands in Nuage (src/ui.js, VOICE_SRC)

```js
var VOICES = {
  nuage: { time: 0.86, rateArc: 0.22, pitch: 1.5, pitchArc: 0.07, dot: 0.025, tract: 1.13, breath: 1, hiss: 1 },
  miria: { time: 0.78, rateArc: 0.36, pitch: 1.72, pitchArc: 0.13, dot: 0.05, tract: 1.19, breath: 0.35, hiss: 1.25 },
  blando: { time: 1.12, rateArc: 0, pitch: 0.87, pitchArc: 0, dot: 0, tract: 0.97, breath: 0.45, hiss: 1.1, flat: 0.72, even: 0.45 },   // plussed up (User1): more iron, less lead: a little more tone and time left in, the tract let out a touch, drier, crisper   // Marlon Blando: the human, as a jest, voiced as a computer. Most of the tone and most of the time taken out, and only most (User1: Hal in the memory room, slowing)
  arthur: { time: 1 / 1.08, rateArc: -0.08, pitch: 1.0595, pitchArc: -0.03, dot: -0.01, tract: 0.95, breath: 1.15, hiss: 0.9 }   // begins faster and ends slower, begins higher and ends lower; a full key up, with the tract let out so the raised note keeps its lower resonance and follows the ladies; at 108 percent of his pace, for he would not plod: he pushes himself, and that manner supports
};
function arcFrames(fr, V) {   // the yinyang over the span: u runs 0 to 1 across the frames' time
  if (!V) return fr;
  var sum = 0, i, out = [], acc = 0, raw = 0; for (i = 0; i < fr.length; i++) sum += fr[i].ms;
  var dots = function (u) { return V.dot * (Math.exp(-Math.pow((u - 0.75) / 0.09, 2)) - Math.exp(-Math.pow((u - 0.25) / 0.09, 2))); };   // a dot of accumulation in each swell
  var TAIL = V.tail === undefined ? 0.3 : V.tail, REST = V.rest === undefined ? -0.6 : V.rest;   // rest: where the swell settles at the end, a little below level, the cadence of a sentence that is done   // THE RECALM (User1): the arc rises to the end and must level out: over the last part of the span the swell returns to level, and the pace eases, a kerb cut back to steady flight; a gentleman's terminating offering
  for (i = 0; i < fr.length; i++) { var f = fr[i], u = sum ? (acc + f.ms / 2) / sum : 0.5, late = TAIL && u > 1 - TAIL ? (u - (1 - TAIL)) / TAIL : 0, ease = late * late * (3 - 2 * late), swell = (-Math.cos(Math.PI * u) + (V.dot ? dots(u) / Math.abs(V.dot) * 0.5 : 0)) * (1 - ease) + REST * ease; acc += f.ms;
    var g = {}; for (var k in f) g[k] = f[k];
    g.ms = f.ms * (1 - V.rateArc * swell) * (1 + 0.2 * late * late); raw += g.ms;   // slower at the start, faster at the end, and easing at the last
    if (f.f0) g.f0 = f.f0 * V.pitch * (1 + V.pitchArc * swell + dots(u));   // lower at the start, higher at the end, and lifted
    if (f.f) g.f = f.f.map(function (hz) { return hz * V.tract; });   // the smaller tract
    if (f.at) g.at = [f.at[0] * V.tract, f.at[1] * V.tract];
    if (f.breath) g.breath = f.breath * V.breath; if (f.hiss) g.hiss = Math.min(1, f.hiss * V.hiss);
    out.push(g); }
  if (V.flat || V.even) {   // flatness: pitch drawn toward its mean, and each frame's length toward the even, by so much
    var n0 = 0, f0m = 0, msm = 0; for (i = 0; i < out.length; i++) { msm += out[i].ms; if (out[i].f0 && out[i].voice > 0.2) { f0m += out[i].f0; n0++; } } f0m = n0 ? f0m / n0 : 0; msm = out.length ? msm / out.length : 0;
    for (i = 0; i < out.length; i++) { if (V.flat && out[i].f0 && f0m) out[i].f0 = out[i].f0 + (f0m - out[i].f0) * V.flat; if (V.even) out[i].ms = out[i].ms + (msm - out[i].ms) * V.even; } raw = 0; for (i = 0; i < out.length; i++) raw += out[i].ms; }
  var k2 = raw ? sum * V.time / raw : 1; for (i = 0; i < out.length; i++) out[i].ms = out[i].ms * k2;   // complete in her share of his time
  return out;
}
function sayFrames(E, fr) { var C = E.CHAIN, s = C.settings(C.PRESETS[C.HOUSE_NAME]); s.frames = fr; return C.make(s).pcm; }
```

With love from the small cloud, and from User1, who heard those women's minds and wants Bela to hear them too.
