/* sound.mod.js -- Noctilucence in the conversation, carried inside a cut of Nuage. pack/cuts.js puts words/noct-draw.js
   before this. Ask "draw the sound of glimmer", "sound out tinsel", or "how does clamor sound?", and the word is read by
   rule (Ecouter's Lexillogue, NRL 1976), drawn as its sounds in light and the wall they strike, and its felt sense told
   where a phonaestheme fits. The picture plays once, silent; click it to hear the word as you watch it, at speaking pace. */
(function () {
  const go = () => (window.NUAGE && window.NOCT ? init() : setTimeout(go, 150));
  const init = () => {
    const NU = window.NUAGE;
    const ASK = [/^(?:please )?(?:draw|show me|sound out|picture) (?:the )?(?:sound of )?(?:the word )?["']?([a-z][a-z'-]{0,40})["']?[.!?]*$/i, /^how does (?:the word )?["']?([a-z][a-z'-]{0,40})["']? sound\??$/i];
    const FEEL = [['scr', 'scraping'], ['squ', 'squeezing'], ['str', 'length and strain'], ['gl', 'light and seeing'], ['sn', 'the nose and mouth'], ['fl', 'quick movement and flashing light'], ['sl', 'slipping and sliding'], ['sw', 'swinging and sweeping'], ['tw', 'twisting'], ['wr', 'twisting and wrenching'], ['cl', 'clinging and closing'], ['cr', 'cracking and crushing'], ['gr', 'grinding and grumbling'], ['bl', 'blowing and swelling'], ['sp', 'spitting and spraying']];
    const RIME = [['ump', 'a heavy, rounded mass'], ['ash', 'a violent impact'], ['ush', 'a soft rush'], ['ack', 'a sharp sound'], ['ip', 'smallness and quickness']];
    const feel = (w) => { const lw = w.toLowerCase(), out = []; const o = FEEL.find(([k]) => lw.startsWith(k)); if (o) out.push(o[0] + '- goes with ' + o[1]); const r = lw.length <= 7 && RIME.find(([k]) => lw.endsWith(k)); if (r) out.push('-' + r[0] + ' with ' + r[1]); return out.length ? ' Its felt sense: ' + out.join(', and ') + ' (Firth, Bloomfield, Marchand).' : ''; };
    let ac = null;
    const play = (svg, D, rate, pcm, sr) => {
      const tok = {}; svg._tok = tok;
      let src = null;
      if (pcm) { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const buf = ac.createBuffer(1, pcm.length, sr); buf.getChannelData(0).set(pcm); src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); }
      requestAnimationFrame(() => {
        const t0 = performance.now(); if (src) src.start();
        const tick = (now) => { if (svg._tok !== tok) return; const t = (now - t0) * rate; if (t >= D) { svg.setCurrentTime((D - 1) / 1000); return; } svg.setCurrentTime(t / 1000); requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      });
    };
    NU.before.push(async (q) => {
      const m = ASK.map((re) => q.trim().match(re)).find(Boolean); if (!m) return false;
      const w = m[1], E = await NU.ec();
      if (!E || !E.PHONES) { NU.say('n', 'I need my voice to draw a sound, and this cut of me has none.'); return true; }
      const codes = String(E.codes(w)).replace(/[\s.]+/g, ''), fr = E.frames(w), f = window.NOCT.figure(w, { fr, sp: E.PHONES.split(codes), codes });
      NU.say('n', w + ', read by rule: ' + codes + '.' + feel(w) + ' Click the picture to hear it.');
      const d = document.createElement('div'); d.className = 'nfig'; d.dataset.w = w; d.innerHTML = f.svg; NU.o.appendChild(d); NU.o.scrollTop = NU.o.scrollHeight;
      const svg = d.querySelector('svg'); svg.pauseAnimations(); svg.setCurrentTime(0); svg.style.cursor = 'pointer'; svg.setAttribute('tabindex', '0');
      const total = fr.reduce((a, x) => a + x.ms, 0);
      play(svg, f.D, f.SLOW, null);   // once, silent, at speaking pace
      const hear = () => (NU.sound ? NU.sound(svg, w, f) : (() => { const pcm = E.say(w), spoken = pcm.length / E.SR * 1000; play(svg, f.D, f.SLOW * total / spoken, pcm, E.SR); })());   // in the voice chosen, Ecouter's or the machine's
      svg.addEventListener('click', hear); svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hear(); } });
      return true;
    });
    document.head.insertAdjacentHTML('beforeend', '<style>#o .nfig{white-space:normal}#o .nfig svg{max-width:50%;height:auto}</style>');
  };
  go();
})();
