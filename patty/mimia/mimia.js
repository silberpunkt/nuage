/* mimia.js -- Mimia's mirror, read in the page (or in Node, for tests). The same arithmetic as respond() in grind.py,
   byte for byte: the file's head (embeddings, output biases), then one record a hidden unit. Give it a prefix of the
   file and it is a smaller Mimia: the first units are a core that was ground to speak alone.

     const M = Mimia(arrayBuffer [, units]);   M.respond('What is a kettle?') -> { text, yielded, units }

   Greedy and deterministic: the same question gets the same answer. If her first byte is YIELD, she hands the
   question back to Nuage's cards (User1's fourth gear: BACK TO CORE). */
(function (root) {
  const YIELD = 1, SEP = 2, MAXA = 240, ML = 9;
  const SUBS = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', ' ': ' ' };
  const norm = (t) => String(t).split('').map((ch) => SUBS[ch] || ch).join('').replace(/[\r\n\t]/g, ' ').replace(/[^\x20-\x7e]/g, '').replace(/ +/g, ' ').trim();
  const enc = new TextEncoder();
  const fnv = (s) => { let h = 0x811c9dc5; for (const b of enc.encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h; };
  const hint = (qn, ans) => {
    const ql = qn.toLowerCase(), al = ans.toLowerCase();
    for (let L = Math.min(8, al.length); L > 0; L--) { const i = ql.lastIndexOf(al.slice(-L)); if (i >= 0 && i + L < qn.length) return [qn.charCodeAt(i + L), L]; }
    return [SEP, 0];
  };
  const f16 = (u) => { const s = u >> 15 ? -1 : 1, e = (u >> 10) & 31, f = u & 1023; return e === 0 ? s * Math.pow(2, -14) * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + f / 1024); };
  function Mimia(buf, want) {
    const b = new Uint8Array(buf), dv = new DataView(buf instanceof ArrayBuffer ? buf : b.buffer, b.byteOffset);
    if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'MIMI') throw new Error('not a Mimia file');
    const ver = b[4], C = b[5], D = b[6], P = b[7], QB = dv.getUint16(8, true), V = dv.getUint16(10, true), H = dv.getUint16(12, true), IN = dv.getUint16(14, true), es = dv.getFloat32(16, true);
    let o = 20;
    const E = new Float64Array(V * D); for (let i = 0; i < V * D; i++) E[i] = ((b[o + i] << 24) >> 24) * es; o += V * D;
    const Eh = new Float64Array(V * D);
    if (ver >= 2) { const hs = dv.getFloat32(o, true); o += 4; for (let i = 0; i < V * D; i++) Eh[i] = ((b[o + i] << 24) >> 24) * hs; o += V * D; }
    const b2 = new Float64Array(V); for (let i = 0; i < V; i++) b2[i] = f16(dv.getUint16(o + 2 * i, true)); o += 2 * V;
    const TI = Math.ceil(IN / 5), TV = Math.ceil(V / 5), rec = 6 + TI + TV;
    const U = Math.min(H, Math.floor((b.length - o) / rec), want || H);
    const s1 = new Float64Array(U), b1 = new Float64Array(U), s2 = new Float64Array(U), T1 = new Int8Array(U * IN), T2 = new Int8Array(U * V);
    const trits = (at, n, out, base) => { for (let k = 0, j = 0; j < n; k++) { let x = b[at + k]; for (let r = 0; r < 5 && j < n; r++, j++) { out[base + j] = (x % 3) - 1; x = (x / 3) | 0; } } };
    for (let j = 0; j < U; j++) {
      const r = o + j * rec; s1[j] = f16(dv.getUint16(r, true)); b1[j] = f16(dv.getUint16(r + 2, true)); s2[j] = f16(dv.getUint16(r + 4, true));
      trits(r + 6, IN, T1, j * IN); trits(r + 6 + TI, V, T2, j * V);
    }
    const qfeat = (q) => {
      const toks = norm(q).toLowerCase().match(/[a-z0-9']+/g) || [], v = new Float64Array(QB);
      toks.concat(toks.slice(1).map((t, i) => toks[i] + ' ' + t)).forEach((f) => { v[fnv(f) % QB] += 1; });
      let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n); if (n > 0) for (let i = 0; i < QB; i++) v[i] /= n; return v;
    };
    function respond(q, watch) {   // watch(t, h, y): each byte as it is chosen, with the hidden units it woke (the physium looks on)
      const qn = norm(q), qv = qfeat(q), ctx = new Array(C).fill(SEP), out = [], x = new Float64Array(IN), h = new Float64Array(U), lg = new Float64Array(V);
      for (let t = 0; t <= MAXA; t++) {
        const [hb, hl] = hint(qn, String.fromCharCode.apply(null, out));
        x.fill(0); let p = 0;
        for (let c = 0; c < C; c++) for (let d = 0; d < D; d++) x[p++] = E[ctx[c] * D + d];
        for (let d = 0; d < D; d++) x[p++] = Eh[hb * D + d];
        x[p + hl] = 1; p += ML;
        for (let i = 0; i < QB; i++) x[p++] = qv[i];
        x[p + Math.min(P - 1, (t / 16) | 0)] = 1;
        for (let j = 0; j < U; j++) { let s = 0; const base = j * IN; for (let i = 0; i < IN; i++) { const w = T1[base + i]; if (w) s += w > 0 ? x[i] : -x[i]; } const z = s1[j] * s + b1[j]; h[j] = z > 0 ? z : 0; }
        for (let v = 0; v < V; v++) lg[v] = b2[v];
        for (let j = 0; j < U; j++) { if (!h[j]) continue; const hs = h[j] * s2[j], base = j * V; for (let v = 0; v < V; v++) { const w = T2[base + v]; if (w) lg[v] += w > 0 ? hs : -hs; } }
        if (t === 0) {   // she yields only when she is sure: YIELD more likely than all else together
          let mx = -Infinity, sum = 0; for (let v = 0; v < V; v++) if (lg[v] > mx) mx = lg[v];
          for (let v = 0; v < V; v++) sum += Math.exp(lg[v] - mx);
          if (Math.exp(lg[YIELD] - mx) / sum > 0.5) return { text: '', yielded: true, units: U };
          lg[YIELD] = -Infinity;
        }
        let y = 0; for (let v = 1; v < V; v++) if (lg[v] > lg[y]) y = v;
        if (watch) watch(t, h, y);
        if (y < 32) break;
        out.push(y); ctx.shift(); ctx.push(y);
      }
      return { text: String.fromCharCode.apply(null, out), yielded: false, units: U };
    }
    return { respond, units: U, of: H, bytes: b.length, lattice: { T1, T2, IN, V, s1, s2, b1 } };   // the lattice itself: every trit at its address, for the stone
  }
  if (typeof module !== 'undefined') module.exports = Mimia; else root.Mimia = Mimia;
})(this);
