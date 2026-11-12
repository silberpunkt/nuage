// gallery.js -- small multiples: a row of words, each drawn as its sounds in light and the wall it strikes, at one scale
// where they fit. Click a word's picture, and Ecouter says it as the movie begins again, at the movie's own pace (four
// times slower than spoken, every sound drawn out alike), so that what is heard is what is seen. Ecouter's phones.js and
// voicebox.js ride inside the page, so words/gallery.html needs nothing beside it.
//   node words/gallery.js scintillate hamlet plonk ...
const fs = require('fs'), path = require('path'), T = require('./teardown.js');
const ws = process.argv.slice(2);
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ECO = [process.env.NUAGE_ECOUTER, path.join(__dirname, '..', '..', '..', '__entile', '__vespers', 'ecouter'), path.join(__dirname, '..', '..', '..', '..', '__vespers', 'ecouter')].find((d) => d && fs.existsSync(path.join(d, 'voicebox.js')));
let rows = '';
for (const w of ws) {
  const t = T.tear(w), f = t.figures;
  const sound = (t.cmu && t.cmu[0]) || t.nrl || '', kin = (t.sound || []).slice(0, 6).join(', ');
  rows += '<section' + (f ? ' data-codes="' + esc(f.codes) + '" data-slow="' + f.SLOW + '" data-d="' + Math.round(f.D) + '"' : '') + '><h2>' + esc(w) + '</h2><p>' + esc(sound) + (t.cmu && t.cmu.length ? ', from CMUdict.' : ', read by rule.') + (t.syllables ? ' ' + (['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][t.syllables] || t.syllables) + (t.syllables === 1 ? ' syllable.' : ' syllables.') : '') + (t.phonaesthemes.length ? ' Felt sense: ' + esc(t.phonaesthemes.map((p) => p.mark + ', ' + p.sense).join(', and ')) + '.' : '') + (kin ? ' Kin by sound: ' + esc(kin) + '.' : '') + '</p>' + (f ? f.svg : '<p>(no score for this word)</p>') + '</section>\n';
}
const lib = ECO ? '<script>' + fs.readFileSync(path.join(ECO, 'voicebox.js'), 'utf8') + '\n</script><script>' + fs.readFileSync(path.join(ECO, 'phones.js'), 'utf8') + '\n</script>' : '';
// TENDING (12 xi 2026): a visitor may add a word of their own, at the top, and take any word out with its [ X ] or a
// sideways sweep. For that the page also carries the Lexillogue (letters to phonemes by rule) with its rules, the
// drawing itself (noct-draw.js), and noct-tend.js, which does the adding and removing. Without Ecouter there is no
// reading by rule, so the box is left out and the gallery is as it was.
const inl = (f) => '<script>' + fs.readFileSync(f, 'utf8') + '\n</script>';
const tend = ECO && fs.existsSync(path.join(ECO, 'lexillogue.js'))
  ? inl(path.join(ECO, 'rules.js')) + inl(path.join(ECO, 'lexillogue.js')) + inl(path.join(__dirname, 'noct-draw.js')) + inl(path.join(__dirname, 'noct-tend.js')) : '';
const TEND_CSS = 'h2{display:flex;align-items:center;gap:.8rem;max-width:786px}h2 .rm{margin-left:auto;flex:none;width:1.7em;height:1.7em;padding:0;font:inherit;line-height:1;letter-spacing:0;background:none;color:#707070;border:1px solid #707070;border-radius:50%;cursor:pointer}h2 .rm:hover,h2 .rm:focus-visible{color:#c9c3b6;border-color:#c9c3b6;outline:none}section{touch-action:pan-y;transition:transform .15s,opacity .15s}#nw{font:inherit;background:#11151a;color:#e8e0d0;border:1px solid #2a323b;padding:.2rem .4rem;width:16em;max-width:60vw}#nwgo,#nwback button{font:inherit;background:#11151a;color:#e8e0d0;border:1px solid #8f98a5;border-radius:3px;padding:.2rem .7rem;cursor:pointer}#nwsay{margin-left:.6rem}';
const TEND_ROW = tend ? '<p><label>New word <input id=nw autocomplete=off autocapitalize=off spellcheck=false placeholder="type a word, press Enter"></label> <button id=nwgo type=button>Draw it</button><span id=nwsay aria-live=polite></span></p><p id=nwback hidden></p>' : '';
const play = `<script>
// THE EAR FOR THE EYE. Every picture plays once by itself as it first comes into view, silent, and holds its last frame. After
// that it plays only when clicked, with Ecouter's voice, at the speed chosen at the top: 1/1 as spoken, slower to see
// it unfold, or 2/1, a burst. The pictures' clocks are paused and driven here, frame by frame, so one drawing serves
// every speed; the voice is sung at the same pace, every sound stretched or pressed alike.
(function () {
  const secs = [...document.querySelectorAll('section[data-codes]')], runs = new Map(); let ac = null;
  const speed = () => +document.getElementById('spd').value;
  function run(sec, withVoice) {
    const svg = sec.querySelector('svg'), D = +sec.dataset.d, slow = +sec.dataset.slow || 4, sp = speed(), rate = sp * slow;   // the drawing's clock runs at 1/slow of speech
    let src = null;
    if (withVoice && window.PHONES && window.VOICEBOX) {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const fr = PHONES.frames(sec.dataset.codes).map((f) => Object.assign({}, f, { ms: f.ms / sp }));
      const sr = 22050, pcm = VOICEBOX.mellow(VOICEBOX.sing(fr, sr), sr), buf = ac.createBuffer(1, pcm.length, sr);
      buf.getChannelData(0).set(pcm); src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
    }
    const token = {}; runs.set(sec, token);
    requestAnimationFrame(() => {   // the work done, picture and sound begin on one fresh frame
      const t0 = performance.now(); if (src) src.start();
      const tick = (now) => {
        if (runs.get(sec) !== token) return;   // a newer click took over
        const t = (now - t0) * rate;
        if (t >= D) { svg.setCurrentTime((D - 1) / 1000); return; }   // hold the last frame
        svg.setCurrentTime(t / 1000); requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  const wire = (sec) => {
    const svg = sec.querySelector('svg'); svg.pauseAnimations(); svg.setCurrentTime(0);
    svg.style.cursor = 'pointer'; svg.setAttribute('tabindex', '0'); svg.setAttribute('aria-label', svg.getAttribute('aria-label') + '. Click to hear it.');
    svg.addEventListener('click', () => run(sec, true));
    svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(sec, true); } });
  };
  secs.forEach(wire);
  // a word added in the page (noct-tend.js) is wired the same way, and played once, silent, to build its last frame
  window.NOCTWIRE = (sec) => { wire(sec); run(sec, false); };
  // once each, silent, to build its last frame: as it first comes into view, so the page is never asked to play all at once
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { seen.unobserve(e.target); run(e.target, false); } }), { threshold: 0.35 });
  secs.forEach((sec) => seen.observe(sec));
})();
</script>`;
const html = '<!doctype html><html lang=en><meta charset=utf-8><title>Noctilucence: words in light</title><style>body{background:#0b0d10;color:#c9c3b6;font:13px/1.4 ui-monospace,Consolas,monospace;margin:1.2rem}h1{font-weight:normal;letter-spacing:.2em}h2{font-weight:normal;margin:1.2rem 0 .2rem;color:#e8e0d0;letter-spacing:.1em}p{margin:.1rem 0 .5rem;color:#8f98a5;max-width:70ch}details{margin:.6rem 0 1rem}summary{cursor:pointer;color:#c9c3b6}dl.gl{display:grid;grid-template-columns:3.4em minmax(0,70ch);gap:.45rem 0;margin:.5rem 0 0 .2rem}dl.gl dt{color:#f5f5f5;font-size:1.8em;text-align:center;line-height:1}dl.gl dd{margin:0;color:#8f98a5}svg{max-width:100%;height:auto}svg:focus{outline:1px solid #8f98a5}select{font:inherit;background:#11151a;color:#e8e0d0;border:1px solid #2a323b}' + TEND_CSS + '</style><h1>NOCTILUCENCE</h1><p>Words in light. Noctilucence is User1\'s name for it: sound shining in the dark, as noctilucent clouds shine after sunset.</p><p><label>Speed <select id=spd><option value=2>2/1, a burst</option><option value=1>1/1, as spoken</option><option value=0.5 selected>1/2</option><option value=0.25>1/4</option><option value=0.125>1/8</option></select></label></p>' + TEND_ROW + '<details open><summary>Each word as Ecouter would say it:</summary><dl class=gl><dt>&#x224B;</dt><dd>Along the strip, its sounds in light, in the order they are spoken. Colour is pitch, from red at the low end to violet at the high. Height says pitch again. Brightness is strength. Sparks are hiss.</dd><dt>&#x25CE;</dt><dd>At the right, the wall it strikes, ring by ring. Each ring is born at the centre at its own moment, spreads, slows, and fades. The last in is the last out, and when the air falls silent the wall is dark again.</dd><dt>&#x273A;</dt><dd>Each ring is shaped by its formants. A narrow chord, as in aa or oo, makes a few broad lobes. A wide one, as in ee, makes many fine points. A hiss is a burr.</dd><dt>&#x271B;</dt><dd>Read the wall along its four slits, above, below, left, and right of the centre. The centre is the most recent sound.</dd><dt>&#x25B7;</dt><dd>Each picture plays once, silent, as it comes into view. Click it to hear the word, at the speed chosen above, in step with its picture.</dd><dt>&#xA7;</dt><dd>Drawn by words/teardown.js from Ecouter\'s phones.js, and voiced by its voicebox.js. Phonemes come from CMUdict, or, where CMUdict has no entry, from the rules of NRL Report 7948 (1976).</dd></dl></details>\n' + '<i id=noct-top hidden></i>' + rows + lib + play + tend + '</html>\n';
fs.writeFileSync(path.join(__dirname, 'gallery.html'), html);
console.log('gallery: ' + ws.length + ' words into words/gallery.html' + (ECO ? ', with Ecouter inside' : ', silent (Ecouter not found)'));
