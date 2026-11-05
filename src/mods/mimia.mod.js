/* mimia.mod.js -- Mimia, the mirror, carried inside a cut of Nuage. pack/cuts.js puts her runner (patty/mimia/mimia.js)
   before this, and her file (a prefix of patty/mimia/mimia.bin, as many units as the cut has room for) in __MIMIA_B64__.
   She is off until asked for, by her button among the options. When she is on, and Nuage could not answer, she says
   what the mirror shows, labelled as hers, and yields where she is sure Nuage's cards should speak. She copies manner,
   not knowledge: her words may be made words, and they are never Nuage's facts. */
(function () {
  const go = () => (window.NUAGE && window.Mimia ? init() : setTimeout(go, 150));
  const init = () => {
    const NU = window.NUAGE, B64 = '__MIMIA_B64__', SIZE = '__MIMIA_NOTE__';
    const MISSED = /^(I do not know|I cannot answer|I know of nothing|I have no card|I have heard of|Go on\.|Tell me more|I see\. And then|What would it mean|Why do you say|Is that the real reason|Please go on|Does that)/;
    let on = false, M = null;
    document.head.insertAdjacentHTML('beforeend', '<style>#o .e{color:var(--ink)}#o .e:before{content:attr(data-who) ": ";color:var(--dim)}</style>');
    const b = document.createElement('button'); b.id = 'mimia'; b.textContent = 'Mimia: off'; b.setAttribute('aria-pressed', 'false');
    b.title = 'Mimia, the mirror (' + SIZE + '): where Nuage cannot answer, she says what a language model taught her the manner of. Her words are not facts.';
    b.onclick = () => { on = !on; b.textContent = 'Mimia: ' + (on ? 'on' : 'off'); b.setAttribute('aria-pressed', on); };
    NU.tools.appendChild(b);
    const load = () => { if (!M) { const s = atob(B64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); M = window.Mimia(u.buffer); } return M; };
    NU.after.push(async (q, r) => {
      if (!on || !MISSED.test(r)) return;
      await new Promise((res) => setTimeout(res, 20));   // let the page breathe before she thinks
      const a = load().respond(q);
      if (a.yielded) return;
      NU.say('e', a.text || '...'); NU.o.lastChild.dataset.who = 'Mimia, the mirror';
    });
  };
  go();
})();
