/* noct-draw.js -- Noctilucence, the drawing alone: a word's sounds in light along time, and the wall it strikes, as one
   SVG with its own movie. No dependencies, so the same code draws in Node (words/teardown.js, words/gallery.js) and in
   the page (a cut of Nuage carries it inline). Give it the word and Ecouter's score of it, as phones.js makes it:
     NOCT.figure('glint', { fr: PHONES.frames(codes), sp: PHONES.split(codes), codes })  ->  { svg, ms, D, SLOW, codes } */
(function (root) {
// ---- THE VIVID FIGURE (User1, after Tufte): not a plot from a lab, a characterisation, as colour photography once
// illustrated sound. One strip, black ground, light added to light (screen blending). Height is pitch: the three
// formants of a voiced sound glow as three bands at their own heights, so each vowel has its own chord of light, and a
// hiss is a cloud of sparks at the height of its noise, as wide as its band. Magnitude is brightness, never area. Each
// sound fades at its edges and leans forward, its centre ahead and its extents trailing, as a wavefront does. A stop is
// darkness and then a thin flash. At the right, centred, the wall turned to face us: the same sounds as rings, the first
// farthest out, each ring bent by its formants into a round polygon (a round triangle for a narrow chord, up to a round
// octagon for a wide one, sparks for a hiss), coloured by the golden angle through that octave of shapes.
const PHI = 137.508;
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let figN = 0;
function figure(word, sc) {
  if (!sc || !sc.fr) return null; const t = { word: word };
  const fr = sc.fr, total = fr.reduce((a, f) => a + f.ms, 0); if (!total) return null;
  const id = 'vf' + (++figN) + '-' + String(t.word).replace(/[^a-z0-9]/gi, '').slice(0, 12);
  const H = 226, top = 20, bot = 184, msPx = Math.max(1.4, total / 560), SW = Math.round(total / msPx), FX = 560 + 30 + 96, W = FX + 100;   // the wall always at the same place, right-justified, so walls compare down a page
  const yOf = (hz) => bot - (Math.log(Math.max(150, Math.min(6000, hz)) / 150) / Math.log(6000 / 150)) * (bot - top);   // pitch, on a log scale, as the ear hears it
  // COLOUR IS PITCH (User1: "colour is the correct way to show comparative pitch; the brightness of that colour is its
  // amplitude"). Low sounds red, through orange, yellow, green, and blue, to violet at the top of speech, on the same log
  // scale the ear uses, as light orders its own colours; brightness is strength. Height in the strip says pitch again.
  const pitchHue = (hz) => (280 * Math.max(0, Math.min(1, Math.log(Math.max(250, hz) / 250) / Math.log(3500 / 250)))).toFixed(0);   // 250 Hz red, 3.5 kHz and above violet: the span of the formants
  const pcol = (hz, l) => 'hsl(' + pitchHue(hz) + ',90%,' + (l || 60) + '%)';
  // THE RING'S SHAPE BY GEARING (User1): each formant above the first turns the ring's edge into lobes, as many as it is
  // times the first, and the lobes of two formants gear together. A narrow chord (aa, oo: F2 a little above F1) makes a
  // few broad lobes, a round ring; a wide one (ee: F2 eight times F1) makes many, and they gear into points. So the
  // bouba of a back vowel and the kiki of a front one come of themselves, not by a rule laid on them.
  const lobes = (f) => [1, 2].map((k) => ({ n: Math.max(2, Math.round(f[k] / f[0])), a: [0, 0.075, 0.045][k] }));
  const col = (n, k, l) => 'hsl(' + ((200 + (n - 3) * PHI + (k || 0) * PHI) % 360).toFixed(0) + ',85%,' + (l || 60) + '%)';   // (kept for the order of shapes; colour now follows pitch)
  let defs = '', body = '', x = 0, labels = '', lastCi = -1, gi = 0;
  const glow = (cx, cy, rx, ry, color, op) => {   // a soft lens of light, brightest just ahead of centre, fading to nothing at its edges
    const g = id + 'g' + (gi++);
    defs += '<radialGradient id="' + g + '" cx="0.5" cy="0.5" r="0.5" fx="0.62" fy="0.5"><stop offset="0" stop-color="' + color + '" stop-opacity="' + op.toFixed(2) + '"/><stop offset="0.55" stop-color="' + color + '" stop-opacity="' + (op * 0.45).toFixed(2) + '"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>';
    body += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" fill="url(#' + g + ')"/>';
  };
  for (const f of fr) {
    const w = f.ms / msPx, xc = x + w / 2, v = f.voice || 0, hs = f.hiss || 0, br = f.breath || 0;
    if (v > 0.03) f.f.forEach((hz, k) => glow(xc + w * 0.1, yOf(hz), w * 0.85 + 5, 10 + 4 * k, pcol(hz, 62), Math.min(1, v * [1, 0.85, 0.6][k] * 1.15)));
    if (hs > 0.03 || br > 0.03) {   // sparks, at the height of the noise and as wide as its band
      const at = f.at || [1800, 2400], y0 = yOf(at[0] + at[1] / 2), y1 = yOf(Math.max(160, at[0] - at[1] / 2)), cnt = Math.round(w * (y1 - y0) * (hs + br * 0.6) * 0.28);
      let sd = 7919 + Math.round(x * 13); const rnd = () => (sd = (sd * 1103515245 + 12345) % 2147483648) / 2147483648;
      const sc0 = pcol(at[0], 82);   // a hiss's sparks in the colour of its pitch, pale, as noise is
      for (let k = 0; k < cnt; k++) { const px = x + rnd() * w, py = y0 + rnd() * (y1 - y0), e = Math.min(1, 1 - Math.abs((px - xc) / (w / 2 + 0.01)) * 0.7); body += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (0.5 + rnd() * 0.7).toFixed(2) + '" fill="' + sc0 + '" opacity="' + ((0.35 + 0.65 * rnd()) * e * Math.min(1, hs + br)).toFixed(2) + '"/>'; }
      if (f.ms < 25 && hs > 0.1) body += '<line x1="' + xc.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + xc.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="' + sc0 + '" stroke-width="1.2" opacity="' + Math.min(1, hs + 0.2).toFixed(2) + '" filter="url(#' + id + 'b)"/>';   // a stop's burst: a thin flash
    }
    if (f.ci !== lastCi && sc.sp[f.ci] !== undefined) { labels += '<text x="' + (x + 1).toFixed(1) + '" y="' + (H - 10) + '" font-size="16" fill="#8f98a5">' + esc(sc.sp[f.ci]) + '</text>'; lastCi = f.ci; }
    x += w;
  }
  // THE WALL, AND ITS MOVIE (User1: "here's how this one hit the wall"). Each sound is born at the centre at its own
  // moment and spreads, and as it spreads it slows and fades, so that every older ring mixes with the newer light within
  // it: the bloom of all the rings apart is only one moment of the movie. Every ring lives the same span, so the last in
  // is the last out: when the air falls silent the light goes back to black, ring by ring (User1: "growingly, fadingly,
  // last in, last out"). The drawing's clock runs four times slower than speech; the page may drive it at any speed.
  const R = 84, CX = FX, CY = (top + bot) / 2, SLOW = 4, LIFE = Math.max(1400, SLOW * total * 0.9), D = SLOW * total + LIFE;
  const kt = (ms) => Math.max(0, Math.min(1, ms / D)).toFixed(4), EASE = '0.1 0.65 0.3 1';
  let rings = '', tt = 0;
  const ring = (inner, s0, op0) => {   // one ring: born at s0, spreading with an easing that slows, fading to nothing over one life
    const a = SLOW * s0, b = a + LIFE;
    return '<g transform="translate(' + CX + ' ' + CY + ')"><g opacity="' + (op0 * 0.5).toFixed(2) + '">' + inner
      + '<animateTransform attributeName="transform" type="scale" values="0;0;1;1" keyTimes="0;' + kt(a) + ';' + kt(b) + ';1" calcMode="spline" keySplines="0 0 1 1;' + EASE + ';0 0 1 1" dur="' + D + 'ms" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values="0;0;' + op0.toFixed(2) + ';0;0" keyTimes="0;' + kt(a) + ';' + kt(a + 1) + ';' + kt(b) + ';1" calcMode="spline" keySplines="0 0 1 1;0 0 1 1;0.25 0.55 0.45 1;0 0 1 1" dur="' + D + 'ms" repeatCount="indefinite"/></g></g>';
  };
  for (const f of fr) {
    const s0 = tt, Ri = R, wd = Math.max(0.8, SLOW * f.ms / LIFE * R), v = f.voice || 0, hs = f.hiss || 0, br = f.breath || 0;
    tt += f.ms;
    if (v > 0.03) {
      const lb = lobes(f.f); let d = '';
      for (let a = 0; a <= 180; a++) { const th = a / 180 * 2 * Math.PI, rr = Ri * (1 + lb.reduce((acc, o) => acc + o.a * Math.cos(o.n * th), 0)); d += (a ? 'L' : 'M') + (rr * Math.sin(th)).toFixed(1) + ' ' + (-rr * Math.cos(th)).toFixed(1); }
      rings += ring('<path d="' + d + 'Z" fill="none" stroke="' + pcol(f.f[1], 62) + '" stroke-width="' + wd.toFixed(2) + '" vector-effect="non-scaling-stroke"/>', s0, 0.3 + 0.7 * v);
    }
    if (hs > 0.03 || br > 0.03) { const at = f.at || [1800, 2400], n = Math.max(6, Math.round(at[0] / 250)); let d = '';   // a hiss: many fine lobes, a burr of points, in the colour of its pitch
      for (let a = 0; a <= 360; a++) { const th = a / 360 * 2 * Math.PI, rr = Ri * (1 + 0.05 * Math.cos(n * th) + 0.03 * Math.cos((n + 3) * th)); d += (a ? 'L' : 'M') + (rr * Math.sin(th)).toFixed(1) + ' ' + (-rr * Math.cos(th)).toFixed(1); }
      rings += ring('<path d="' + d + 'Z" fill="none" stroke="' + pcol(at[0], 82) + '" stroke-width="' + wd.toFixed(2) + '" stroke-dasharray="0.6 ' + (3 - 2 * Math.min(1, hs + br)).toFixed(2) + '" vector-effect="non-scaling-stroke"/>', s0, 0.45 + 0.5 * Math.min(1, hs + br)); }
  }
  defs += '<filter id="' + id + 'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter><filter id="' + id + 'r" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.7"/></filter>';
  const cur = (at) => '<animate attributeName="' + at + '" values="0;' + SW + ';' + SW + '" keyTimes="0;' + kt(SLOW * total) + ';1" dur="' + D + 'ms" repeatCount="indefinite"/>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" font-family="ui-monospace,Consolas,monospace" role="img" aria-label="' + esc(t.word) + ': its sounds in light along ' + total + ' milliseconds, and, at the right, the wall it strikes, ring by ring"><defs>' + defs + '</defs>'
    + '<linearGradient id="' + id + 'gh"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.05" stop-color="#fff"/><stop offset="0.95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="' + id + 'gv" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.1" stop-color="#fff"/><stop offset="0.9" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    + '<mask id="' + id + 'mh"><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'gh)"/></mask><mask id="' + id + 'mv"><rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'gv)"/></mask>'
    + '<g mask="url(#' + id + 'mh)"><rect width="' + W + '" height="' + H + '" fill="#000" mask="url(#' + id + 'mv)"/></g><g style="mix-blend-mode:screen">' + body + '</g>' + labels
    + '<g style="mix-blend-mode:screen" filter="url(#' + id + 'r)">' + rings + '</g>'
    + '<radialGradient id="' + id + 's" gradientUnits="userSpaceOnUse" cx="' + CX + '" cy="' + CY + '" r="' + (R + 8) + '"><stop offset="0" stop-color="#8f98a5" stop-opacity="0.35"/><stop offset="1" stop-color="#8f98a5" stop-opacity="0"/></radialGradient>'
    + '<g stroke="url(#' + id + 's)" stroke-width="0.6"><line x1="' + CX + '" y1="' + (CY - R - 6) + '" x2="' + CX + '" y2="' + (CY - 6) + '"/><line x1="' + CX + '" y1="' + (CY + 6) + '" x2="' + CX + '" y2="' + (CY + R + 6) + '"/><line x1="' + (CX - R - 6) + '" y1="' + CY + '" x2="' + (CX - 6) + '" y2="' + CY + '"/><line x1="' + (CX + 6) + '" y1="' + CY + '" x2="' + (CX + R + 6) + '" y2="' + CY + '"/></g>'   // the four slits (User1): read the formant shapes along them, the centre the most now
    + '<line x1="0" y1="' + top + '" x2="0" y2="' + bot + '" stroke="#fff" stroke-width="1" opacity="0.35">' + cur('x1') + cur('x2') + '<animate attributeName="opacity" values="0.35;0.35;0;0" keyTimes="0;' + kt(SLOW * total) + ';' + kt(SLOW * total + 1) + ';1" dur="' + D + 'ms" repeatCount="indefinite"/></line>'
    + '<text x="4" y="14" font-size="12" fill="#8f98a5">' + total + ' ms. One pixel is ' + msPx.toFixed(1) + ' ms. Colour and height are pitch, and brightness is strength.</text><text x="' + CX + '" y="' + (H - 10) + '" font-size="16" fill="#c9c3b6" text-anchor="middle">' + esc(t.word) + '</text></svg>';
  return { side: svg, face: '', ms: total, svg, D, SLOW, codes: sc.codes };
}

  const NOCT = { figure: figure };
  if (typeof module !== 'undefined' && module.exports) module.exports = NOCT; else root.NOCT = NOCT;
})(typeof window !== 'undefined' ? window : this);
