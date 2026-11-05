/* paint.js -- Nuage's pictures, drawn by program and written in painted chat (Vespers' colorburst grammar, YAM-PAL), so a
   picture is plain text that any reader with the grammar can paint, and anyone without it still sees the drawing.
     node pack/paint.js            -> kb/pictures.txt, each picture checked by decoding its own shadow
   The rule of the grammar's own page: build the picture with a program that places each glyph, let a program write the
   shadow, and decode it again to count. vendor/yampal.js is the authority. */
const fs = require('fs'), path = require('path'), Y = require('../vendor/yampal.js');
const ROOT = path.join(__dirname, '..'), B = '⠀';   // the braille blank: a space that chat windows do not collapse
const PAL = { ink: 0, star: 2, sky: 3, fire: 4, water: 5, deep: 6, gold: 11, stone: 13, rose: 22, amber: 23, shadow: 21 };

function glyphMode(head, rows, colourOf) {               // one colour per KIND of glyph, in the order kinds first appear
  const seen = [], items = [{ pal: PAL[head] }];
  rows.forEach((r) => Array.from(r).forEach((ch) => { if (ch !== B && ch !== ' ' && seen.indexOf(ch) < 0) { seen.push(ch); items.push(colourOf(ch)); } }));
  return Y.encode(items);
}
function positional(head, cells) {                       // a bare period, the headline's slot, then one colour per inked cell
  const items = [{ pal: PAL[head] }]; let prev = null, run = 0;
  const flush = () => { while (run > 0) { const n = Math.min(8, run); items.push({ run: n }); run -= n; } };
  cells.forEach((c) => { const k = JSON.stringify(c); if (k === prev) run++; else { flush(); items.push(c); prev = k; } });
  flush();
  return '.' + Y.encode(items);
}

const pictures = [];
function add(title, headline, rows, burst, palette) {
  const kinds = new Set(), inked = rows.reduce((s, r) => s + Array.from(r).filter((ch) => ch !== B && ch !== ' ').length, 0);
  rows.forEach((r) => Array.from(r).forEach((ch) => { if (ch !== B && ch !== ' ') kinds.add(ch); }));
  const d = Y.decode(burst, palette), need = 1 + (d.mode === 'positional' ? inked : kinds.size);
  if (d.complaints.length || d.colours.length !== need) throw new Error(title + ': the shadow does not fit (' + d.colours.length + ' colours for ' + need + ') ' + d.complaints.join('; '));
  pictures.push({ title, text: [headline].concat(rows, [B + B + burst]).join('\n') });
}

// the flag of Norway, from its own vext card: 6:1:2:1:12 across and 6:1:2:1:6 down, red, white, and dark blue
// (PMS 200 and PMS 281 as plain colours). 44 columns by 15 rows: two columns to a unit across, about one row down.
(function () {
  const cols = [12, 2, 4, 2, 24], rowsU = [6, 1, 2, 1, 5], band = (spans, i) => { let a = 0; for (let k = 0; k < spans.length; k++) { if (i < a + spans[k]) return k; a += spans[k]; } return spans.length - 1; };
  const RED = { rgb: [186, 12, 47] }, WHITE = { rgb: [255, 255, 255] }, BLUE = { rgb: [0, 32, 91] };
  const rows = [], cells = [];
  for (let r = 0; r < 15; r++) {
    let line = '';
    for (let c = 0; c < 44; c++) {
      const br = band(rowsU, r), bc = band(cols, c);
      cells.push(br === 2 || bc === 2 ? BLUE : br === 1 || br === 3 || bc === 1 || bc === 3 ? WHITE : RED); line += '█';
    }
    rows.push(line);
  }
  add('the flag of Norway', 'THE⠀FLAG⠀OF⠀NORWAY', rows, positional('ink', cells), PALETTE());
})();

// the flag of Denmark, the Dannebrog: 28:37, its white cross dividing it 12:4:21 across and 12:4:12 down. 37 columns by 14
// rows: a column to a unit across, two units to a row down.
(function () {
  const RED = { rgb: [200, 16, 46] }, WHITE = { rgb: [255, 255, 255] }, rows = [], cells = [];
  for (let r = 0; r < 14; r++) { let line = ''; for (let c = 0; c < 37; c++) { cells.push(r === 6 || r === 7 || (c >= 12 && c < 16) ? WHITE : RED); line += '\u2588'; } rows.push(line); }
  add('the flag of Denmark', 'THE\u2800FLAG\u2800OF\u2800DENMARK', rows, positional('ink', cells), PALETTE());
})();

// the flag of Nepal, by the construction of Schedule 1 of its constitution, step for step: AB is the unit, every vertex,
// arc and the border's width follow from it, and nothing is measured by eye. Its height to its width, border and all,
// comes out 1.21901 to 1 (the least positive root of a quartic). 64 columns, about 1.9 units down to a column across;
// each cell is sampled six by six. Where the flag's edge crosses a cell, a quadrant block keeps the outline sharp.
(function () {
  const r2 = Math.SQRT2, A = [0, 0], Bv = [1, 0], C = [0, 4 / 3], E = [1 - 1 / r2, 1 / r2], F = [0, 1 / r2], G = [1, 1 / r2];
  const Jy = (C[1] + F[1]) / 2, L = [0.25, Jy], My = Jy + (G[1] - Jy) * 0.25, M = [0.25, My];   // steps 6 to 10
  const MN = Math.abs(0.25 + My - 1) / r2, N = [0.25, My - MN], LN = L[1] - N[1];               // step 11: M's distance to BD
  const MQ = Math.sqrt(LN * LN - (L[1] - My) * (L[1] - My));                                    // steps 12 to 14
  const Ty = (LN * LN - MN * MN - L[1] * L[1] + N[1] * N[1]) / (2 * (N[1] - L[1])), T = [0.25, Ty]; // step 15: RS meets HI
  const TN = Ty - N[1], TM = My - Ty, TS = Math.sqrt(MN * MN - TN * TN);                       // steps 16, 17, 23
  const W = [0.25, F[1] / 2];                                                                   // steps 19, 20
  const P = [A, Bv, E, G, C], w = TN, side = [];                                                 // the border: each side moved out by TN, mitred
  for (let i = 0; i < 5; i++) { const p = P[i], q = P[(i + 1) % 5], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); side.push([[p[0] + dy / l * w, p[1] - dx / l * w], [dx, dy]]); }
  const meet = (a, b) => { const [[x1, y1], [u1, v1]] = a, [[x2, y2], [u2, v2]] = b, t = ((x2 - x1) * v2 - (y2 - y1) * u2) / (u1 * v2 - v1 * u2); return [x1 + t * u1, y1 + t * v1]; };
  const O = side.map((s, i) => meet(side[(i + 4) % 5], s));
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const d = (p, x, y) => Math.hypot(x - p[0], y - p[1]);
  const ray = (c, r0, r1, n, a0, x, y) => {                       // n equal triangles round centre c, from radius r0 out to r1
    const rr = d(c, x, y), step = 2 * Math.PI / n; if (rr < r0 || rr > r1) return false;
    let a = Math.atan2(y - c[1], x - c[0]) - a0; a = ((a % step) + step) % step - step / 2;   // angle from the nearest apex
    const half = step / 2;
    const base = [r0 * Math.cos(half), r0 * Math.sin(half)], px = rr * Math.cos(a), py = Math.abs(rr * Math.sin(a));   // inside the triangle (apex [r1,0], base corners at +-half on r0)
    return (r1 - px) * base[1] - py * (r1 - base[0]) >= 0;
  };
  const white = (x, y) =>
    (y <= My && d(M, x, y) <= MQ && d(L, x, y) > LN) ||                        // the crescent, horns up
    (y >= Ty && d(T, x, y) <= TM) ||                                         // the moon's face
    (y >= Ty && ray(T, TM, TS, 16, Math.PI / 16, x, y)) ||                   // eight of its sixteen rays
    d(W, x, y) <= MN || ray(W, MN, LN, 12, Math.PI / 2, x, y);               // the sun, and its twelve rays, two upright
  const colour = (x, y) => !inPoly(O, x, y) ? 0 : !inPoly(P, x, y) ? 1 : white(x, y) ? 3 : 2;   // outside, blue, crimson, white
  const x0 = Math.min(...O.map((p) => p[0])), x1 = Math.max(...O.map((p) => p[0])), y0 = Math.min(...O.map((p) => p[1])), y1 = Math.max(...O.map((p) => p[1]));
  const COLS = 64, cw = (x1 - x0) / COLS, ch = cw * 1.9, ROWS = Math.round((y1 - y0) / ch), S = 6;
  const INK = [null, { rgb: [0, 56, 147] }, { rgb: [220, 20, 60] }, { rgb: [255, 255, 255] }];
  const QUAD = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';                                         // bits: top left 1, top right 2, bottom left 4, bottom right 8
  const rows = [], cells = [];
  for (let r = 0; r < ROWS; r++) {
    let line = '';
    for (let c = 0; c < COLS; c++) {
      const n = [0, 0, 0, 0], q = [0, 0, 0, 0];
      for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) {
        const k = colour(x0 + (c + (j + 0.5) / S) * cw, y1 - (r + (i + 0.5) / S) * ch); n[k]++;
        if (k) q[(i < S / 2 ? 0 : 2) + (j < S / 2 ? 0 : 1)]++;
      }
      let bits = 0; q.forEach((v, k) => { if (v * 2 > S * S / 4) bits |= 1 << k; });
      if (!bits) { line += B; continue; }
      const k = n[3] * 2 >= S * S ? 3 : n[1] * 3 >= S * S || n[1] > n[2] ? 1 : 2;   // white wants half a cell, so rays keep their gaps; blue, thin, wants a third
      line += QUAD[bits]; cells.push(INK[k]);
    }
    rows.push(line.replace(/⠀+$/, ''));
  }
  console.log('nepal: height to width ' + ((y1 - y0) / (x1 - x0)).toFixed(8) + ' to 1, border ' + w.toFixed(5) + ' of AB, ' + COLS + ' by ' + ROWS);
  add('the flag of Nepal', 'THE⠀FLAG⠀OF⠀NEPAL', rows, positional('ink', cells), PALETTE());
})();

// the banner of Jeanne d'Arc, after its vext card: white, about 1 to 4, a swallowtail of two points, the whole outline
// fringed componée in gold and white. The field is sown with gold (a fleur-de-lys is a dot at this size). In the broad part
// by the pole, Christ in Majesty in a golden mandorla, seated on a rainbow, the world in His left hand, His right raised;
// to His right Michael with a sword, to His left Gabriel with a lily; toward the tail, "JHESUS MARIA" in gold. 64 by 9.
(function () {
  const C = { W: [255, 255, 255], g: [205, 160, 40], G: [238, 196, 72], p: [246, 226, 160], h: [222, 178, 52], s: [232, 190, 150],
    r: [236, 110, 100], R: [204, 30, 36], b: [40, 80, 190], a: [196, 198, 210], w: [200, 44, 44], x: [150, 156, 168], l: [60, 140, 60], f: [250, 240, 190],
    1: [220, 50, 50], 2: [240, 170, 40], 3: [70, 160, 70], 4: [60, 100, 200] };
  const COLS = 64, ROWS = 9, mid = (ROWS - 1) / 2, DEPTH = 10, grid = [];
  for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill('W'));
  const put = (r, c, rows) => rows.forEach((row, i) => Array.from(row).forEach((ch, j) => { if (ch !== '.') grid[r + i][c + j] = ch; }));
  put(1, 4, ['..ggggggg..',                                   // the mandorla, and in it Christ in Majesty
             '.gpphshppg.',
             'gpsRRRRRbpg',
             'gppRrrrRppg',
             'gppRrrrRppg',
             '.g1234321g.',
             '..ggggggg..']);
  put(2, 1, ['x..', 'xsw', 'xaw', '.aa', '.a.']);              // Michael, with the sword, at His right
  put(2, 15, ['..f', 'wsl', 'wal', 'aa.', '.a.']);             // Gabriel, with the lily, at His left
  const MOTTO = 'JHESUS MARIA', m0 = 35;
  for (let k = -1; k <= MOTTO.length; k++) grid[4][m0 + k] = k < 0 || k === MOTTO.length || MOTTO[k] === ' ' ? ' ' : 'T' + MOTTO[k];
  for (let r = 2; r <= 6; r += 2) for (let c = 21 + (r % 4 ? 0 : 3); c < COLS - DEPTH - 2; c += 6) if (grid[r][c] === 'W') grid[r][c] = 'G';   // sown with gold
  const rows = [], cells = [];
  for (let r = 0; r < ROWS; r++) {
    const end = Math.round(COLS - DEPTH * (1 - Math.abs(r - mid) / mid));
    let line = '';
    for (let c = 0; c < end; c++) {   // the fringe is a half cell wide, as near its inch as a character comes: lower halves along the top, upper along the foot, inner halves at the hoist and the tail
      const top = r === 0, foot = r === ROWS - 1, hoist = c === 0, tail = c === end - 1, edge = top || foot || hoist || tail, k = edge ? ((r + c) % 2 ? 'G' : 'W') : grid[r][c];   // componée
      if (k === ' ') { line += B; continue; }
      if (k[0] === 'T') { line += k[1]; cells.push({ rgb: C.G }); continue; }
      line += top ? '▄' : foot ? '▀' : hoist ? '▐' : tail ? '▌' : '█'; cells.push({ rgb: C[k] });
    }
    rows.push(line);
  }
  add('the banner of Jeanne d\'Arc', 'THE⠀BANNER⠀OF⠀JEANNE⠀D\'ARC', rows, positional('ink', cells), PALETTE());
})();

// Nuage, as it sees itself
(function () {
  const rows = [B + B + B + B + B + '╭───╮', B + '╭───╯' + B + B + B + '╰─╮', '╭╯' + B + B + B + B + B + B + B + B + B + '╰╮', '╰───────────╯'];
  add('nuage', 'NUAGE', rows, glyphMode('sky', rows, () => ({ pal: PAL.star })), PALETTE());
})();

// Sir Dumptruck, and what is left of a sofa (Fiction)
(function () {
  const rows = [
    B + '▄▄▄▄▄▄▄▄' + B + B + B + B + B + B + B + B + B + B,
    B + '████████▙▄▄' + B + B + B + B + B + B + B,
    B + '▀◉▀▀▀▀◉▀▀◉▀' + B + '▁▂▁▂▁' + B];
  const C = { '▄': { pal: PAL.gold }, '█': { pal: PAL.amber }, '▙': { pal: PAL.sky }, '▀': { pal: PAL.shadow }, '◉': { pal: PAL.stone }, '▁': { pal: PAL.rose }, '▂': { pal: PAL.rose } };
  add('sir dumptruck', 'SIR⠀DUMPTRUCK', rows, glyphMode('fire', rows, (ch) => C[ch]), PALETTE());
})();

function PALETTE() {                                     // YAM-PAL, as Vespers carries it (32 slots, forest at 31)
  return ['#cfcbc2', '#fff4d6', '#dbe8ff', '#9fc6ff', '#ff8a3c', '#58bff0', '#2b7fb8', '#6fd66f', '#a8825a', '#8a6b4a', '#e8be5a', '#ffd23f', '#e0947e',
    '#8f98a5', '#c9a9e8', '#ff5c72', '#bfeae0', '#efe6d2', '#9fb6c9', '#ffffff', '#ff4d4d', '#565b64', '#e8a39c', '#f2c48a', '#fff3c4', '#8f7aa8', '#e3a33f',
    '#6e5a8a', '#c9a24a', '#7a6a9a', '#000000', '#35855b'];
}
const q = (s) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const out = '; pictures.txt -- written by pack/paint.js in painted chat (YAM-PAL). Do not edit by hand: the marks are not for hands.\n' +
  pictures.map((p) => (p.title === 'sir dumptruck' ? '(in-mt FictionMt (picture ' + q(p.title) + ' ' + q(p.text) + '))' : '(picture ' + q(p.title) + ' ' + q(p.text) + ')')).join('\n') + '\n';
const FLAG = /flag|banner/, line = (p) => (p.title === 'sir dumptruck' ? '(in-mt FictionMt (picture ' + q(p.title) + ' ' + q(p.text) + '))' : '(picture ' + q(p.title) + ' ' + q(p.text) + ')');
fs.writeFileSync(path.join(ROOT, 'kb', 'pictures.txt'), '; pictures.txt -- written by pack/paint.js in painted chat (YAM-PAL). Do not edit by hand: the marks are not for hands.\n' + pictures.filter((p) => !FLAG.test(p.title)).map(line).join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'kb', 'shelf-flags-pictures.txt'), '; shelf-flags-pictures.txt -- the flags\' pictures, for the Flags of Our World shelf. Written by pack/paint.js.\n' + pictures.filter((p) => FLAG.test(p.title)).map(line).join('\n') + '\n');
console.log('pictures: ' + pictures.map((p) => p.title + ' (' + p.text.length + ' chars)').join(', ') + ' -> kb/pictures.txt');
module.exports = { PALETTE };
