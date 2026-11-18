'use strict';
(function () {
  /* ---------- tiny helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  };
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rand(0, a.length - 1)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pip:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pip:' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };
  const frac = (a, b) => `<span class="frac"><span class="n">${a}</span><span class="d">${b}</span></span>`;
  const fmt = n => n.toLocaleString('en-GB');
  const app = $('#app');

  /* ---------- sound (WebAudio, no files needed) ---------- */
  let muted = store.get('muted', false), ac = null;
  function tone(freq, start, dur, type = 'sine', vol = 0.15) {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + start;
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch { /* audio not available */ }
  }
  const sfx = {
    right() { tone(660, 0, .12); tone(880, .1, .18); },
    wrong() { tone(220, 0, .25, 'triangle', .12); },
    combo() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .07, .15, 'square', .08)); },
    fanfare() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * .12, .22, 'triangle', .14)); },
    click() { tone(500, 0, .05, 'square', .05); }
  };
  function say(text) {
    if (muted || !('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; u.rate = .85; speechSynthesis.speak(u); return true;
  }
  const muteBtn = $('#mute');
  const paintMute = () => { muteBtn.textContent = muted ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { muted = !muted; store.set('muted', muted); paintMute(); if (muted && 'speechSynthesis' in window) speechSynthesis.cancel(); else sfx.click(); });
  paintMute();

  /* ---------- fun effects ---------- */
  function confetti(n = 70) {
    const cols = ['#ff3d6e', '#ffb703', '#2f6fed', '#14a36b', '#8b4fd8', '#0f9fb0'];
    for (let i = 0; i < n; i++) {
      const c = h('i', { class: 'confetti', style: `left:${Math.random() * 100}vw;background:${pick(cols)};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .6}s;border-radius:${Math.random() > .5 ? '50%' : '2px'}` });
      document.body.append(c); setTimeout(() => c.remove(), 5500);
    }
  }
  function popup(text) { const p = h('div', { class: 'combo', role: 'status' }, text); document.body.append(p); setTimeout(() => p.remove(), 1400); }

  /* ---------- progress state ---------- */
  const state = { name: store.get('name', ''), best: store.get('best', {}), gold: store.get('gold', {}) };
  const totalStars = () => Object.values(state.best).reduce((a, b) => a + b, 0);
  const LEVEL_SIZE = 12;
  const levelOf = s => Math.floor(s / LEVEL_SIZE) + 1;
  const RANKS = [[0, 'Curious Cub'], [12, 'Explorer'], [28, 'Adventurer'], [48, 'Champion'], [72, 'Legend'], [100, 'Super Genius']];
  const rankOf = s => [...RANKS].reverse().find(r => s >= r[0])[1];
  function paintHeader() {
    const s = totalStars();
    $('#stars').textContent = '⭐ ' + s;
    $('#lvl').textContent = 'Level ' + levelOf(s);
  }
  function complete(id, stars, perfect) {
    const before = levelOf(totalStars());
    state.best[id] = Math.max(state.best[id] ?? 0, stars);
    if (perfect) state.gold[id] = true;
    store.set('best', state.best); store.set('gold', state.gold);
    paintHeader();
    if (levelOf(totalStars()) > before) setTimeout(() => { popup('🚀 LEVEL UP! Level ' + levelOf(totalStars())); sfx.fanfare(); confetti(120); }, 700);
  }

  /* ---------- Pip the mascot ---------- */
  const PIP = {
    welcome: ['Hi! I\'m Pip! Ready for an adventure?', 'Let\'s learn something awesome today!', 'Wow, a new day of quests! Let\'s go!'],
    right: ['Brilliant!', 'Yes! You\'re on fire!', 'Spot on!', 'Ooh, clever you!', 'That\'s the way!', 'Boom! Nailed it!'],
    wrong: ['Nearly! Every mistake grows your brain 🧠', 'Good try! You\'ll get the next one!', 'Oops! Learn it, then smash it!'],
    done: ['What a legend! Pick your sticker!', 'Quest complete! You\'re amazing!']
  };
  const pipLine = k => pick(PIP[k]);
  function mascot(text, id = 'pipbubble') {
    const pip = h('button', { class: 'pip', 'aria-label': 'Pip the fox. Tap me!', onclick: () => { pip.classList.remove('cheer'); void pip.offsetWidth; pip.classList.add('cheer'); sfx.click(); $('#' + id).textContent = pick(['Hee hee, that tickles!', 'Did you know foxes can hear a watch tick from 40 metres away?', 'Keep going, you\'re doing great!', 'Tap the quests below to begin!']); } }, '🦊');
    return h('div', { class: 'mascot' }, pip, h('div', { class: 'bubble', id, 'aria-live': 'polite' }, text));
  }
  const pipSay = t => { const b = $('#pipbubble'); if (b) b.textContent = t; const p = $('.pip'); if (p) { p.classList.remove('cheer'); void p.offsetWidth; p.classList.add('cheer'); } };

  /* ---------- result screen ---------- */
  let cleanup = null;
  function showResult(box, { id, score, total, stars, again }) {
    const perfect = score === total;
    complete(id, stars, perfect);
    const ratio = score / total;
    if (ratio >= .7) { confetti(perfect ? 140 : 80); sfx.fanfare(); }
    const act = ACTS.find(a => a.id === id);
    box.replaceChildren(h('div', { class: 'card result pop' },
      h('div', { style: 'font-size:4rem' }, perfect ? '🏆' : ratio >= .7 ? '🎉' : '💪'),
      h('h2', { class: 'rainbow' }, perfect ? 'PERFECT! Golden sticker!' : ratio >= .7 ? 'Fantastic work!' : 'Good effort — try again for more stars!'),
      total > 1 ? h('div', { class: 'bigscore' }, `${score}/${total}`) : null,
      h('p', {}, `You earned ${stars} ⭐   ·   New sticker: `, h('span', { style: 'font-size:2rem' }, act ? act.sticker : '⭐')),
      h('p', { class: 'muted' }, pipLine('done')),
      h('div', { class: 'row center' },
        again ? h('button', { class: 'btn', onclick: again }, '🔁 Play again') : null,
        h('a', { class: 'btn primary', href: '#/', style: 'text-decoration:none' }, 'Back to my quests →'))));
  }

  /* ---------- quiz engine ---------- */
  function runQuiz(box, { id, make, context, again }) {
    const questions = make();
    const total = questions.length;
    let i = 0, score = 0, streak = 0;
    const restart = () => runQuiz(box, { id, make, context, again });

    function show() {
      if (i >= total) return showResult(box, { id, score, total, stars: score, again: again || restart });
      const q = questions[i];
      let answered = false;
      const fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
      const nextBtn = h('button', { class: 'btn primary hidden', onclick: () => { sfx.click(); i++; show(); } }, i === total - 1 ? 'See my results 🎉' : 'Next →');
      const body = h('div', { class: 'qbody' });
      const finish = (ok, custom) => {
        if (answered) return; answered = true;
        if (ok) {
          score++; streak++; sfx.right();
          fb.className = 'feedback good';
          fb.innerHTML = (custom || pipLine('right')) + (q.explain ? ' ' + q.explain : '');
          if (streak >= 3) { popup(`🔥 ${streak} in a row!`); sfx.combo(); confetti(30); }
          pipSay(streak >= 3 ? `${streak} in a row! You\'re unstoppable!` : pipLine('right'));
        } else {
          streak = 0; sfx.wrong();
          fb.className = 'feedback bad';
          fb.innerHTML = (custom || `${pipLine('wrong')} The answer is <b>${q.answerText || q.answer}</b>.`) + (q.explain ? ' ' + q.explain : '');
          pipSay(pipLine('wrong'));
        }
        nextBtn.classList.remove('hidden'); nextBtn.focus();
      };

      if (q.type === 'input') {
        let phase = 'answer';
        const inp = h('input', { type: 'text', class: 'answer', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', inputmode: q.numeric ? 'numeric' : 'text', 'aria-label': 'Your answer' });
        const btn = h('button', { class: 'btn primary', onclick: () => submit() }, 'Check ✓');
        const norm = s => q.numeric ? s.replace(/[,\s£]/g, '') : s.trim().toLowerCase();
        const submit = () => {
          const v = inp.value; if (!v.trim()) return;
          const ok = norm(v) === norm(q.answer);
          if (phase === 'answer') {
            if (ok) { inp.disabled = btn.disabled = true; finish(true); }
            else if (q.practice) {
              phase = 'practice'; streak = 0; sfx.wrong(); inp.value = ''; inp.placeholder = 'Type it again…';
              fb.className = 'feedback bad'; fb.innerHTML = `Not quite! It\'s spelt <b class="spell">${q.answer}</b>. Look, cover, then type it once to practise.`; inp.focus();
            } else { inp.disabled = btn.disabled = true; finish(false); }
          } else if (ok) { inp.disabled = btn.disabled = true; answered = true; fb.className = 'feedback good'; fb.textContent = 'Well done for practising! 👏'; sfx.right(); nextBtn.classList.remove('hidden'); nextBtn.focus(); }
          else { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); }
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        body.append(h('div', { class: 'row' }, inp, btn));
        setTimeout(() => inp.focus(), 50);
      } else if (q.type === 'order') {
        const picks = [];
        const wrap = h('div', { class: 'chips' });
        shuffle(q.items).forEach(t => {
          const c = h('button', { class: 'chip num', onclick: () => {
            if (answered || picks.includes(t)) return; sfx.click();
            picks.push(t); c.prepend(h('b', {}, picks.length)); c.disabled = true;
            if (picks.length === q.items.length) {
              const ok = picks.every((p, k) => p === q.items[k]);
              finish(ok, ok ? null : `Not quite — the right order is: <ol>${q.items.map(x => `<li>${x}</li>`).join('')}</ol>`);
            }
          } }, t);
          wrap.append(c);
        });
        body.append(wrap);
      } else {
        const wrap = h('div', { class: 'opts' });
        q.options.forEach(opt => wrap.append(h('button', { class: 'opt', html: opt, 'data-v': opt, onclick: ev => {
          if (answered) return;
          const b = ev.currentTarget, ok = opt === q.answer;
          b.classList.add(ok ? 'right' : 'wrong');
          [...wrap.children].forEach(x => { x.disabled = true; if (x.dataset.v === q.answer) x.classList.add('right'); });
          finish(ok);
        } })));
        body.append(wrap);
      }

      let vis = q.visual; if (typeof vis === 'function') vis = vis();
      if (typeof vis === 'string') vis = h('div', { html: vis });
      const ctx = context ? h('details', { class: 'passage', open: true }, h('summary', {}, context.title), h('div', { html: context.html })) : null;
      box.replaceChildren(...[ctx, h('div', { class: 'card pop' },
        h('div', { class: 'qmeta' }, h('span', {}, `Question ${i + 1} of ${total}`), h('span', {}, `⭐ ${score}`)),
        h('div', { class: 'bar' }, h('i', { style: `width:${(i / total) * 100}%` })),
        vis, h('div', { class: 'prompt', html: q.prompt }), body, fb, nextBtn)].filter(Boolean));
      if (q.onShow) setTimeout(q.onShow, 250);
    }
    show();
  }

  /* ---------- sorter engine ---------- */
  function runSorter(box, { id, intro, buckets, items }) {
    let sel = null, mistakes = 0, placed = 0; const counted = new Set();
    const msg = h('div', { class: 'feedback', 'aria-live': 'polite' }, 'Tap an item, then tap the right box.');
    const pool = h('div', { class: 'pool' });
    const total = items.length;
    const drop = (b, list) => {
      if (!sel) { msg.className = 'feedback bad'; msg.textContent = 'Pick an item first!'; return; }
      const { it, el } = sel;
      if (it.b === b.id) {
        sfx.right(); list.append(h('span', { class: 'placed pop' }, it.t)); el.remove(); sel = null; placed++;
        msg.className = 'feedback good'; msg.textContent = '✅ ' + it.fact; pipSay(pipLine('right'));
        if (placed === total) setTimeout(() => { const score = Math.max(0, total - mistakes); showResult(box, { id, score, total, stars: Math.max(1, score), again: () => runSorter(box, { id, intro, buckets, items }) }); }, 1200);
      } else {
        sfx.wrong(); if (!counted.has(it.t)) { counted.add(it.t); mistakes++; }
        el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400);
        msg.className = 'feedback bad'; msg.textContent = 'Hmm, not quite — think again! 🤔';
      }
    };
    shuffle(items).forEach(it => {
      const c = h('button', { class: 'chip', onclick: () => { sfx.click(); if (sel) sel.el.classList.remove('sel'); sel = { it, el: c }; c.classList.add('sel'); msg.className = 'feedback'; msg.textContent = `Where does “${it.t}” go?`; } }, it.t);
      pool.append(c);
    });
    const bk = h('div', { class: 'buckets' });
    buckets.forEach(b => { const list = h('div', {}); bk.append(h('div', { class: 'bucket' }, h('button', { class: 'bucket-head', onclick: () => drop(b, list) }, `${b.emoji} ${b.label}`), list)); });
    box.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'intro', html: intro }), pool, msg, bk));
  }

  /* ---------- question makers ---------- */
  function makeTables(sel) {
    const qs = [], seen = new Set();
    while (qs.length < 12) {
      const a = pick(sel), b = rand(1, 12), div = Math.random() < .25;
      const p = div ? `${a * b} ÷ ${a} = ?` : (Math.random() < .5 ? `${a} × ${b} = ?` : `${b} × ${a} = ?`);
      if (seen.has(p) && seen.size < 40) continue; seen.add(p);
      qs.push({ type: 'input', numeric: true, prompt: p, answer: String(div ? b : a * b) });
    }
    return qs;
  }
  function pizza(n, k) {
    const r = 52, c = 60; let s = '';
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / n;
      const f = x => x.toFixed(2);
      s += `<path d="M${c},${c} L${f(c + r * Math.cos(a0))},${f(c + r * Math.sin(a0))} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(c + r * Math.cos(a1))},${f(c + r * Math.sin(a1))} Z" fill="${i < k ? '#ffb703' : '#fff7e0'}" stroke="#7a4a12" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 120 120" class="pizza" role="img" aria-label="A pizza with ${n} equal slices, ${k} of them yellow">${s}</svg>`;
  }
  function makeFractions() {
    const qs = [];
    const same = (a, b, c, d) => a * d === b * c;
    for (let t = 0; t < 3; t++) {
      const n = pick([3, 4, 5, 6, 8, 10]), k = rand(1, n - 1);
      const cand = [[n - k, n], [k + 1, n], [k - 1, n], [k, n + 1], [k, n - 1], [k, n + 2]].filter(([a, b]) => a > 0 && b > a && !same(a, b, k, n));
      const uniq = [...new Map(cand.map(x => [x.join('/'), x])).values()];
      const opts = shuffle([[k, n], ...shuffle(uniq).slice(0, 3)]).map(([a, b]) => frac(a, b));
      qs.push({ visual: pizza(n, k), prompt: 'What fraction of the pizza is yellow?', options: opts, answer: frac(k, n), answerText: frac(k, n) });
    }
    for (let t = 0; t < 2; t++) {
      const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5]]), m = pick([2, 3, 4]);
      const A = a * m, B = b * m;
      const cand = [[A + 1, B], [A, B + m], [A * 2, B], [a + 1, B], [A, B - 1]].filter(([x, y]) => y > 0 && x < y && !same(x, y, a, b));
      const uniq = [...new Map(cand.map(x => [x.join('/'), x])).values()];
      qs.push({ prompt: `Which fraction is the same as ${frac(a, b)}?`, options: shuffle([[A, B], ...shuffle(uniq).slice(0, 3)]).map(([x, y]) => frac(x, y)), answer: frac(A, B), answerText: frac(A, B), explain: `Multiply the top and bottom by ${m}.` });
    }
    for (let t = 0; t < 3; t++) {
      const d = pick([2, 3, 4, 5, 10]), k = Math.random() < .5 ? 1 : rand(2, Math.min(3, d - 1)), n = d * rand(2, 8);
      qs.push({ type: 'input', numeric: true, prompt: `Find ${frac(k, d)} of ${n}`, answer: String(n / d * k), explain: `Divide by ${d}${k > 1 ? ', then times by ' + k : ''}.` });
    }
    for (let t = 0; t < 2; t++) {
      if (t === 0) { const d = rand(5, 12), a = rand(1, d - 2), b = rand(a + 1, d - 1); qs.push({ prompt: `Which is bigger: ${frac(a, d)} or ${frac(b, d)}?`, options: [frac(a, d), frac(b, d)], answer: frac(b, d), answerText: frac(b, d), explain: 'Same bottom number, so the bigger top number wins.' }); }
      else { const a = rand(2, 5), b = rand(6, 10); qs.push({ prompt: `Which is bigger: ${frac(1, a)} or ${frac(1, b)}?`, options: [frac(1, a), frac(1, b)], answer: frac(1, a), answerText: frac(1, a), explain: 'Fewer slices means bigger slices!' }); }
    }
    return shuffle(qs);
  }
  function toRoman(n) { let s = ''; for (const [v, r] of [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; }
  function clockSVG(hr, mn) {
    let s = '<circle cx="100" cy="100" r="92" fill="#fff" stroke="#26324b" stroke-width="6"/>';
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, l = i % 5 ? 3 : 8; s += `<line x1="${100 + (88 - l) * Math.sin(a)}" y1="${100 - (88 - l) * Math.cos(a)}" x2="${100 + 88 * Math.sin(a)}" y2="${100 - 88 * Math.cos(a)}" stroke="#26324b" stroke-width="${i % 5 ? 1 : 3}"/>`; }
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += `<text x="${100 + 68 * Math.sin(a)}" y="${100 - 68 * Math.cos(a) + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="#26324b">${i}</text>`; }
    const ha = ((hr % 12) + mn / 60) * Math.PI / 6, ma = mn * Math.PI / 30;
    s += `<line x1="100" y1="100" x2="${100 + 45 * Math.sin(ha)}" y2="${100 - 45 * Math.cos(ha)}" stroke="#e0457b" stroke-width="8" stroke-linecap="round"/>`;
    s += `<line x1="100" y1="100" x2="${100 + 70 * Math.sin(ma)}" y2="${100 - 70 * Math.cos(ma)}" stroke="#2f6fed" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#26324b"/>`;
    return `<svg viewBox="0 0 200 200" class="clock" role="img" aria-label="Analogue clock. The short pink hand is the hour hand, the long blue hand is the minute hand.">${s}</svg>`;
  }
  const hm = (h2, m) => `${h2}:${String(m).padStart(2, '0')}`;
  function makeNumberTime() {
    const qs = [];
    let n = rand(1000, 8999);
    qs.push({ prompt: `What is 1,000 more than ${fmt(n)}?`, type: 'input', numeric: true, answer: String(n + 1000) });
    n = rand(1100, 9000);
    qs.push({ prompt: `What is 10 less than ${fmt(n)}?`, type: 'input', numeric: true, answer: String(n - 10) });
    n = rand(1000, 9999); const ds = String(n).split(''); const idxs = ds.map((d, i) => d !== '0' ? i : -1).filter(i => i >= 0); const ix = pick(idxs);
    const dig = +ds[ix], p = 3 - ix, val = dig * 10 ** p;
    const vopts = [...new Set([val, dig, dig * 10 ** Math.min(3, p + 1), dig * 10 ** Math.max(0, p - 1), dig * 1000, dig * 100, dig * 10])].filter(x => x !== val);
    qs.push({ prompt: `What is the value of the digit <b>${dig}</b> in ${fmt(n)}?`, options: shuffle([val, ...shuffle(vopts).slice(0, 3)]).map(fmt), answer: fmt(val) });
    n = rand(1000, 9999);
    qs.push({ prompt: `Round ${fmt(n)} to the nearest 100.`, type: 'input', numeric: true, answer: String(Math.round(n / 100) * 100), explain: 'Look at the tens digit: 5 or more, round up!' });
    for (let t = 0; t < 2; t++) {
      const r = rand(6, 99), o = shuffle([...new Set([r + 10, r - 10, r + 1, r - 1, r + 5, r - 5].filter(x => x > 0 && x !== r))]).slice(0, 3);
      qs.push({ visual: `<div style="font-size:2.4rem;font-weight:900;text-align:center;letter-spacing:.1em">${toRoman(r)}</div>`, prompt: 'Which number is this Roman numeral?', options: shuffle([r, ...o]).map(String), answer: String(r) });
    }
    for (let t = 0; t < 2; t++) {
      const r = rand(6, 99), o = shuffle([...new Set([r + 10, r - 10, r + 1, r - 1, r + 5].filter(x => x > 0 && x !== r).map(toRoman))]).filter(x => x !== toRoman(r)).slice(0, 3);
      qs.push({ prompt: `Write <b>${r}</b> in Roman numerals.`, options: shuffle([toRoman(r), ...o]), answer: toRoman(r), explain: 'I=1, V=5, X=10, L=50, C=100.' });
    }
    for (let t = 0; t < 2; t++) {
      const H = rand(1, 12), M = rand(0, 11) * 5, sw = [hm(M === 0 ? 12 : M / 5, (H % 12) * 5), hm(H % 12 + 1, M), hm((H + 10) % 12 + 1, M), hm(H, (M + 5) % 60), hm(H, (M + 55) % 60), hm(H, (M + 10) % 60)];
      const correct = hm(H, M), wrong = shuffle([...new Set(sw)].filter(x => x !== correct)).slice(0, 3);
      qs.push({ visual: clockSVG(H, M), prompt: 'What time does the clock show?', options: shuffle([correct, ...wrong]), answer: correct, explain: 'Short pink hand = hours, long blue hand = minutes.' });
    }
    const hp = rand(1, 11), mp = pick([0, 15, 30, 45]);
    const c24 = hm(hp + 12, mp), w24 = [hm(String(hp).padStart(2, '0'), mp), hm(hp + 11, mp), hm(hp + 13, mp)];
    qs.push({ prompt: `Write <b>${hm(hp, mp)} pm</b> in 24-hour time.`, options: shuffle([c24, ...w24]), answer: c24, explain: 'Add 12 to the hour for pm times.' });
    const sh = rand(1, 10), sm = rand(0, 9) * 5; const cross = Math.random() < .4; let em, eh = sh;
    if (cross) { em = rand(0, Math.max(0, sm / 5 - 1)) * 5; eh = sh + 1; } else { em = sm + rand(1, (55 - sm) / 5 || 1) * 5; if (em > 55) em = 55; }
    const mins = cross ? 60 - sm + em : em - sm;
    return [...qs.slice(0, 8), ...qs.slice(8)].concat([{ prompt: `A film starts at ${hm(sh, sm)} and ends at ${hm(eh, em)}. How many minutes long is it?`, type: 'input', numeric: true, answer: String(mins) }]).filter(q => !(q.type === 'input' && q.answer === 'NaN'));
  }

  /* ---------- word / question banks ---------- */
  const WORDS = [
    ['accident', 'Luckily nobody was hurt in the ___.'], ['believe', 'I ___ in you!'], ['century', 'A ___ is one hundred years.'],
    ['different', 'My two socks are ___ colours.'], ['difficult', 'That puzzle was really ___.'], ['favourite', 'Pizza is my ___ food.'],
    ['grammar', 'We practise spelling and ___ in English.'], ['history', 'In ___ we learn about the Romans.'], ['library', 'I borrowed a book from the ___.'],
    ['material', 'Wool is a soft ___.'], ['naughty', 'The puppy was ___ and chewed my slipper.'], ['popular', 'That game is very ___ at school.'],
    ['promise', 'I ___ I will tidy my room.'], ['strange', 'I heard a ___ noise in the night.'], ['therefore', 'It was raining; ___, we took umbrellas.'],
    ['February', 'The shortest month is ___.'], ['island', 'Britain is an ___.'], ['weight', 'The ___ of the bag was heavy.'],
    ['imagine', 'Close your eyes and ___ a dragon.'], ['surprise', 'Mum planned a ___ party.'], ['straight', 'Draw a ___ line with a ruler.'],
    ['special', 'Today is a ___ day.'], ['often', 'We ___ go to the park.'], ['answer', 'Can you ___ the question?'], ['breath', 'Take a deep ___.'],
    ['experiment', 'We did a science ___.'], ['quarter', 'A ___ is one of four equal parts.'], ['early', 'Birds wake up very ___.']
  ].map(([w, s]) => ({ w, s }));
  function makeSpelling() {
    return shuffle(WORDS).slice(0, 8).map(({ w, s }) => ({
      type: 'input', practice: true, answer: w, prompt: 'Listen, then spell the missing word:',
      visual: () => h('div', {}, h('span', { class: 'sent', html: s.replace('___', '<span class="blank">________</span>') }),
        h('div', { class: 'row' }, h('button', { class: 'btn listen', onclick: () => { if (!say(`${w}. ${s.replace('___', w)} ${w}.`)) alert('Sound is off — the word has ' + w.length + ' letters.'); } }, '🔊 Hear the word'), h('span', { class: 'muted' }, `${w.length} letters, starts with “${w[0]}”`))),
      onShow: () => say(`${w}. ${s.replace('___', w)} ${w}.`)
    }));
  }
  const GRAMMAR = [
    { prompt: 'One girl owns a bag. Which is correct?', options: ['the girls bag', 'the girl’s bag', 'the girls’ bag', 'the girl’s’s bag'], answer: 'the girl’s bag', explain: 'One owner: apostrophe before the s.' },
    { prompt: 'Many boys own footballs. Which is correct?', options: ['the boys footballs', 'the boy’s footballs', 'the boys’ footballs', 'the boys’s footballs'], answer: 'the boys’ footballs', explain: 'Lots of owners ending in s: apostrophe after the s.' },
    { prompt: 'Which is correct? The ___ toys were everywhere.', options: ['childrens’', 'children’s', 'childrens', 'childrens’s'], answer: 'children’s', explain: '“Children” is already plural, so add ’s.' },
    { prompt: 'Which is the short form of “do not”?', options: ['dont’', 'don’t', 'do’nt', 'd’ont'], answer: 'don’t', explain: 'The apostrophe takes the place of the missing “o”.' },
    { prompt: 'Which sentence starts with a fronted adverbial?', options: ['Early in the morning, Dad made pancakes.', 'Dad made pancakes early in the morning.', 'Dad made pancakes.', 'Pancakes are tasty.'], answer: 'Early in the morning, Dad made pancakes.', explain: 'It goes at the front and is followed by a comma.' },
    { prompt: 'Pick the fronted adverbial: “Before sunrise, the farmer fed the hens.”', options: ['Before sunrise', 'the farmer', 'fed the hens', 'the hens'], answer: 'Before sunrise' },
    { prompt: 'We stayed inside ___ it was raining.', options: ['because', 'banana', 'under', 'quickly'], answer: 'because', explain: '“Because” is a conjunction — it joins ideas.' },
    { prompt: 'Which word is an adjective? “The tiny frog leapt.”', options: ['tiny', 'frog', 'leapt', 'The'], answer: 'tiny', explain: 'Adjectives describe nouns.' },
    { prompt: 'Which word is the verb? “The cat chased the mouse.”', options: ['cat', 'chased', 'mouse', 'the'], answer: 'chased', explain: 'A verb is a doing word.' },
    { prompt: 'Which is the adverb? “The snail moved slowly.”', options: ['snail', 'moved', 'slowly', 'The'], answer: 'slowly', explain: 'Adverbs tell us how a verb is done.' },
    { prompt: 'Which is an expanded noun phrase?', options: ['dog', 'the fluffy brown dog with floppy ears', 'barked loudly', 'ran fast'], answer: 'the fluffy brown dog with floppy ears' },
    { prompt: 'Which sentence has the speech punctuated correctly?', options: ['“Where are you going?” asked Mum.', '“Where are you going,” asked Mum.', '“Where are you going” asked Mum?', 'Where are you going? asked Mum.'], answer: '“Where are you going?” asked Mum.', explain: 'The question mark goes inside the speech marks.' },
    { prompt: 'Which prefix makes “appear” mean the opposite?', options: ['dis', 'un', 'mis', 'pre'], answer: 'dis', explain: 'dis + appear = disappear.' },
    { prompt: 'Turn the adjective “gentle” into an adverb.', options: ['gentlely', 'gently', 'gentley', 'gentle-ly'], answer: 'gently', explain: 'Words ending in -le: drop the e and add -y.' },
    { prompt: 'Yesterday, I ___ to school. (run)', options: ['runned', 'ran', 'run', 'runs'], answer: 'ran', explain: 'Run is an irregular verb.' },
    { prompt: 'We ___ late for school.', options: ['was', 'were', 'is', 'be'], answer: 'were', explain: 'Standard English: we were, not we was.' },
    { prompt: '“___ going to the beach!” (They are)', options: ['Their', 'There', 'They’re', 'Theyre'], answer: 'They’re', explain: 'They’re = they are.' },
    { prompt: 'The dogs wagged ___ tails.', options: ['their', 'there', 'they’re', 'thier'], answer: 'their', explain: '“Their” shows that something belongs to them.' },
    { prompt: 'Which plural is spelled correctly?', options: ['babys', 'babies', 'babyes', 'babis'], answer: 'babies', explain: 'Consonant + y: change y to i, add -es.' },
    { prompt: 'Which word is a plural of “child”?', options: ['childs', 'childrens', 'children', 'childes'], answer: 'children' }
  ];
  const makeGrammar = () => shuffle(GRAMMAR).slice(0, 10).map(q => ({ ...q, options: shuffle(q.options) }));

  const READING = {
    title: '📖 Read the story (tap to hide/show)',
    html: `<p><b>The Night the Lighthouse Went Dark</b></p>
<p>Mara lived with her grandad in the old lighthouse at the edge of Cragmouth Bay. Every evening, as the sky turned the colour of a ripe plum, Grandad climbed the ninety-nine steps to switch on the great lamp. Its beam swept across the waves like a giant golden broom.</p>
<p>One stormy night, a crack of thunder shook the tower and the lamp flickered and died. “Oh no,” whispered Mara. Out at sea, the little fishing boat <i>Sparrow</i> was heading home through the dark water.</p>
<p>Mara thought quickly. She raced downstairs, grabbed Grandad’s torch and a mirror from the hallway, and scrambled back up. Standing at the window, she held the mirror in front of the torch and tilted it towards the sea. The light bounced off the glass and flashed across the waves: long, short, long, short.</p>
<p>Far away, Captain Ruiz saw the signal. “That’s the lighthouse!” he cried, and steered the <i>Sparrow</i> safely between the rocks.</p>
<p>The next morning, the whole village gathered to thank Mara. Grandad hugged her so tightly that she squeaked. “I always said you were the brightest spark in Cragmouth,” he laughed.</p>`
  };
  const makeReading = () => [
    { prompt: 'How many steps did Grandad climb to the lamp?', options: ['19', '90', '99', '100'], answer: '99' },
    { prompt: 'What happened to the lamp?', options: ['It was switched off by Grandad', 'Thunder shook the tower and it flickered and died', 'It fell into the sea', 'Mara broke it'], answer: 'Thunder shook the tower and it flickered and died' },
    { prompt: 'What two things did Mara use to make a signal?', options: ['A candle and a bell', 'A torch and a mirror', 'A flag and a whistle', 'A lamp and a window'], answer: 'A torch and a mirror' },
    { prompt: '“Its beam swept across the waves like a giant golden broom.” What is this?', options: ['A simile', 'A rhyme', 'A question', 'A command'], answer: 'A simile', explain: 'It compares two things using “like”.' },
    { prompt: 'Why did Mara tilt the mirror towards the sea?', options: ['To look at her reflection', 'To bounce the torchlight out so the boat could see it', 'To keep the torch cool', 'To scare the fish'], answer: 'To bounce the torchlight out so the boat could see it', explain: 'This is an inference — the text shows it without saying it!' },
    { prompt: 'Why did Grandad call Mara “the brightest spark”?', options: ['She was clever and her light helped the boat', 'She liked electricity', 'She had a bright red coat', 'She was good at lighting fires'], answer: 'She was clever and her light helped the boat' },
    { prompt: 'In the story, “scrambled” means…', options: ['mixed up like eggs', 'climbed quickly using hands and feet', 'fell down', 'walked slowly'], answer: 'climbed quickly using hands and feet' }
  ];
  const makeRomans = () => shuffle([
    { prompt: 'In which year AD did the Romans successfully invade Britain under Emperor Claudius?', options: ['AD 43', 'AD 1066', 'AD 410', 'AD 122'], answer: 'AD 43' },
    { prompt: 'Which language did the Romans speak?', options: ['Latin', 'French', 'Greek', 'Old English'], answer: 'Latin' },
    { prompt: 'Which Roman invention carried fresh water along raised channels?', options: ['Aqueducts', 'Trampolines', 'Skyscrapers', 'Canals of lava'], answer: 'Aqueducts' },
    { prompt: 'Why was Hadrian’s Wall built?', options: ['To defend the northern border of Roman Britain', 'To keep sheep in', 'To make a giant playground', 'To hide treasure'], answer: 'To defend the northern border of Roman Britain' },
    { prompt: 'Which warrior queen of the Iceni tribe led a rebellion against the Romans?', options: ['Boudica', 'Cleopatra', 'Queen Victoria', 'Elizabeth I'], answer: 'Boudica' },
    { prompt: 'About how many soldiers were in a Roman “century”?', options: ['8', '80', '800', '8,000'], answer: '80', explain: 'Despite the name, it was around 80 men, led by a centurion!' },
    { prompt: 'What did the Romans call London?', options: ['Londinium', 'Romeville', 'Thamesopolis', 'Caesaria'], answer: 'Londinium' },
    { prompt: 'Why did Romans build such straight roads?', options: ['So armies could march quickly', 'They liked rulers', 'To make mazes', 'To stop chariots'], answer: 'So armies could march quickly' },
    { type: 'order', prompt: 'Tap these events in order, <b>earliest first</b>!', items: ['Julius Caesar visits Britain (55 BC)', 'Romans invade under Claudius (AD 43)', 'Boudica’s rebellion (AD 60)', 'Hadrian’s Wall begun (AD 122)', 'Romans leave Britain (about AD 410)'] }
  ]).slice(0, 9);
  const makeGeo = () => shuffle([
    { prompt: 'What is the capital city of Wales?', options: ['Cardiff', 'Swansea', 'Belfast', 'Glasgow'], answer: 'Cardiff' },
    { prompt: 'What is the capital city of Scotland?', options: ['Edinburgh', 'Aberdeen', 'Dundee', 'Inverness'], answer: 'Edinburgh' },
    { prompt: 'What is the capital city of Northern Ireland?', options: ['Belfast', 'Dublin', 'Derry', 'Cardiff'], answer: 'Belfast' },
    { prompt: 'What is the capital of England?', options: ['London', 'Manchester', 'York', 'Bristol'], answer: 'London' },
    { prompt: 'Which is the highest mountain in the UK?', options: ['Ben Nevis', 'Snowdon', 'Scafell Pike', 'Mount Everest'], answer: 'Ben Nevis', explain: 'It’s in Scotland and is 1,345 m tall.' },
    { prompt: 'Which is the longest river in the UK?', options: ['River Severn', 'River Thames', 'River Mersey', 'River Tyne'], answer: 'River Severn', explain: 'The Thames is the longest river in England only.' },
    { prompt: 'Which sea is on the east side of England?', options: ['North Sea', 'Irish Sea', 'Red Sea', 'Dead Sea'], answer: 'North Sea' },
    { prompt: 'Which flag has a red dragon on it?', options: ['Wales', 'England', 'Scotland', 'Northern Ireland'], answer: 'Wales' },
    { prompt: 'How many countries make up the United Kingdom?', options: ['2', '3', '4', '5'], answer: '4', explain: 'England, Scotland, Wales and Northern Ireland.' },
    { prompt: 'Which ocean is to the west of the UK?', options: ['Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean', 'Arctic Ocean'], answer: 'Atlantic Ocean' }
  ]).slice(0, 8);

  const STATES = {
    intro: 'Scientists group materials as <b>solids</b>, <b>liquids</b> and <b>gases</b>. Tap an item, then tap the box where it belongs!',
    buckets: [{ id: 's', label: 'Solid', emoji: '🧊' }, { id: 'l', label: 'Liquid', emoji: '💧' }, { id: 'g', label: 'Gas', emoji: '💨' }],
    items: [
      { t: 'Ice cube', b: 's', fact: 'Ice is frozen water — its particles are packed tightly and keep their shape.' },
      { t: 'Milk', b: 'l', fact: 'Liquids flow and take the shape of their container.' },
      { t: 'Steam', b: 'g', fact: 'Steam is water as a gas — it spreads out to fill space.' },
      { t: 'Brick', b: 's', fact: 'Solids keep their own shape.' },
      { t: 'Orange juice', b: 'l', fact: 'You can pour it, so it’s a liquid.' },
      { t: 'Air in a balloon', b: 'g', fact: 'Gases fill up whatever container they’re in.' },
      { t: 'Honey', b: 'l', fact: 'It’s slow and sticky, but it still flows — a liquid!' },
      { t: 'Pencil', b: 's', fact: 'Solids can be hard to squash or bend.' },
      { t: 'Cooking oil', b: 'l', fact: 'Oil flows, so it’s a liquid.' },
      { t: 'Helium in a party balloon', b: 'g', fact: 'Helium is a gas that is lighter than air — that’s why the balloon floats!' }
    ]
  };
  const CIRCUIT = {
    intro: 'In an electric circuit, <b>conductors</b> let electricity flow through. <b>Insulators</b> stop it. Sort the materials!',
    buckets: [{ id: 'c', label: 'Conductor', emoji: '⚡' }, { id: 'i', label: 'Insulator', emoji: '🛑' }],
    items: [
      { t: 'Copper wire', b: 'c', fact: 'Copper is a great conductor — wires inside cables are made of it.' },
      { t: 'Rubber glove', b: 'i', fact: 'Rubber doesn’t let electricity flow, so electricians use it.' },
      { t: 'Iron nail', b: 'c', fact: 'Most metals are conductors.' },
      { t: 'Plastic ruler', b: 'i', fact: 'Plastic is an insulator — it covers wires to keep us safe.' },
      { t: 'Aluminium foil', b: 'c', fact: 'Foil is a metal, so it conducts.' },
      { t: 'Wooden spoon', b: 'i', fact: 'Wood is an insulator.' },
      { t: 'Metal key', b: 'c', fact: 'Metal = conductor.' },
      { t: 'Glass jar', b: 'i', fact: 'Glass is an insulator.' },
      { t: 'Steel paperclip', b: 'c', fact: 'Steel is a metal, so it conducts.' },
      { t: 'Woollen sock', b: 'i', fact: 'Wool is an insulator.' }
    ]
  };
  const MOVES = [
    ['🤸', 'Star jumps!', 'Do as many star jumps as you can!'], ['🐆', 'Cheetah sprint', 'Run on the spot as fast as a cheetah!'],
    ['🦩', 'Flamingo balance', 'Stand on one leg. Can you stay still?'], ['🐸', 'Frog hops', 'Squat down low and hop like a frog!'],
    ['🛡️', 'Roman march', 'March with HIGH knees like a Roman soldier!'], ['💃', 'Dance party', 'Dance like nobody is watching!'],
    ['🦀', 'Crab walk', 'Sit, lift your tummy and scuttle sideways!'], ['🙆', 'Reach for the sky', 'Stretch up high, then touch your toes!']
  ];

  /* ---------- activities (the day) ---------- */
  const tablesSel = new Set(store.get('tables', [2, 5, 10]));
  const ACTS = [
    { id: 'tables', time: '09:00', title: 'Times Table Blast-Off', subject: 'Maths', cls: 's-maths', icon: '🚀', sticker: '🚀', desc: 'Warm up your brain with fast times tables and division facts.', main: true,
      run(box) {
        const chips = h('div', { class: 'chips' });
        const paint = () => [...chips.children].forEach(c => { if (c.dataset.t) { const on = tablesSel.has(+c.dataset.t); c.classList.toggle('sel', on); c.setAttribute('aria-pressed', on); } });
        for (let t = 2; t <= 12; t++) chips.append(h('button', { class: 'chip', 'data-t': t, onclick: () => { sfx.click(); tablesSel.has(t) ? tablesSel.delete(t) : tablesSel.add(t); paint(); } }, t + '×'));
        chips.append(h('button', { class: 'chip', onclick: () => { for (let t = 2; t <= 12; t++) tablesSel.add(t); paint(); } }, '🌟 All!'));
        box.replaceChildren(h('div', { class: 'card' }, h('h3', {}, 'Which tables do you want to practise?'), h('p', { class: 'intro' }, 'Tap to choose. Pick lots for a super challenge! You\'ll get 12 questions — build a streak for a combo 🔥'), chips,
          h('button', { class: 'btn primary big', onclick: () => { if (!tablesSel.size) [2, 5, 10].forEach(x => tablesSel.add(x)); store.set('tables', [...tablesSel]); runQuiz(box, { id: 'tables', make: () => makeTables([...tablesSel]), again: () => this.run(box) }); } }, 'Blast off! 🚀')));
        paint();
      } },
    { id: 'fractions', time: '09:30', title: 'Pizza Fractions', subject: 'Maths', cls: 's-maths', icon: '🍕', sticker: '🍕', desc: 'Slice, compare and share! Fractions of shapes and amounts.', main: true,
      run(box) { runQuiz(box, { id: 'fractions', make: makeFractions }); } },
    { id: 'move', time: '10:10', title: 'Brain Break', subject: 'Move!', cls: 's-pe', icon: '🤸', sticker: '🏅', desc: 'Wiggle, jump and breathe. Moving helps your brain learn!', main: true,
      run(box) {
        const moves = shuffle(MOVES).slice(0, 4); let k = 0, iv = null;
        cleanup = () => clearInterval(iv);
        const step = () => {
          clearInterval(iv);
          if (k >= moves.length) {
            const lbl = h('div', { class: 'timer' }, '30');
            box.replaceChildren(h('div', { class: 'card movecard' }, h('div', { class: 'big' }, '🧘'), h('h3', {}, 'Calm breathing'), h('p', {}, 'Breathe in as the circle grows… out as it shrinks.'), h('div', { class: 'breathe' }), lbl));
            let t = 30; iv = setInterval(() => { t--; lbl.textContent = t; if (t <= 0) { clearInterval(iv); showResult(box, { id: 'move', score: 1, total: 1, stars: 3 }); } }, 1000);
            return;
          }
          const [e, t, d] = moves[k];
          const lbl = h('div', { class: 'timer' }, '20');
          const go = h('button', { class: 'btn primary big', onclick: () => {
            go.disabled = true; sfx.fanfare(); let n = 20; lbl.textContent = n;
            iv = setInterval(() => { n--; lbl.textContent = n; if (n <= 3 && n > 0) sfx.click(); if (n <= 0) { clearInterval(iv); sfx.combo(); k++; confetti(20); step(); } }, 1000);
          } }, 'Go! (20 seconds)');
          box.replaceChildren(h('div', { class: 'card movecard pop' }, h('div', { class: 'qmeta' }, h('span', {}, `Move ${k + 1} of ${moves.length}`)), h('div', { class: 'big' }, e), h('h2', {}, t), h('p', {}, d), lbl, go));
        };
        step();
      } },
    { id: 'spelling', time: '10:30', title: 'Spelling Spies', subject: 'English', cls: 's-english', icon: '🕵️', sticker: '🕵️', desc: 'Listen to the secret word, then crack the spelling code.', main: true,
      run(box) { runQuiz(box, { id: 'spelling', make: makeSpelling }); } },
    { id: 'grammar', time: '11:00', title: 'Grammar Gym', subject: 'English', cls: 's-english', icon: '💪', sticker: '💪', desc: 'Apostrophes, fronted adverbials, speech marks and more.', main: true,
      run(box) { runQuiz(box, { id: 'grammar', make: makeGrammar }); } },
    { id: 'reading', time: '11:30', title: 'Reading Detective', subject: 'English', cls: 's-english', icon: '🔍', sticker: '🔍', desc: 'Read “The Night the Lighthouse Went Dark” and solve the clues.', main: true,
      run(box) { runQuiz(box, { id: 'reading', make: makeReading, context: READING }); } },
    { id: 'lunch', time: '12:15', title: 'Lunch & Play', subject: 'Break', cls: 's-other', icon: '🥪', sticker: '🥪', desc: 'Tap when you\'ve had lunch and a good run around!', main: true, manual: true },
    { id: 'numtime', time: '13:15', title: 'Number & Time Detectives', subject: 'Maths', cls: 's-maths', icon: '⏰', sticker: '⏰', desc: 'Place value, Roman numerals and reading clocks.', main: true,
      run(box) { runQuiz(box, { id: 'numtime', make: makeNumberTime }); } },
    { id: 'romans', time: '13:45', title: 'Roman Britain Time Travel', subject: 'History', cls: 's-history', icon: '🏛️', sticker: '🏛️', desc: 'Roads, soldiers, Boudica and Hadrian\'s Wall.', main: true,
      run(box) { runQuiz(box, { id: 'romans', make: makeRomans }); } },
    { id: 'mosaic', time: '14:15', title: 'Roman Mosaic Maker', subject: 'Art', cls: 's-art', icon: '🎨', sticker: '🎨', desc: 'Make a mosaic from tiny coloured tiles, just like the Romans!', main: true,
      run(box) {
        const N = 12, S = 30, pal = ['#c4572e', '#e0a030', '#1f3a5f', '#f4ead2', '#6b7a3a', '#222222', '#ffffff', '#b3202a', '#2a9d8f'];
        let grid = store.get('mosaic', null); if (!Array.isArray(grid) || grid.length !== N * N) grid = Array(N * N).fill('');
        let col = pal[0], down = false;
        const cv = h('canvas', { width: N * S, height: N * S, class: 'mosaic', 'aria-label': 'Mosaic drawing grid' });
        const ctx = cv.getContext('2d');
        const painted = () => grid.filter(Boolean).length;
        const finBtn = h('button', { class: 'btn primary', onclick: () => showResult(box, { id: 'mosaic', score: 1, total: 1, stars: 3 }) }, '🎉 I\'m finished!');
        const note = h('p', { class: 'muted' });
        const draw = () => {
          ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, N * S, N * S);
          grid.forEach((c, i) => { const x = (i % N) * S, y = Math.floor(i / N) * S; if (c) { ctx.fillStyle = c; ctx.fillRect(x + 1, y + 1, S - 2, S - 2); } });
          ctx.strokeStyle = 'rgba(122,74,18,.35)'; ctx.lineWidth = 1;
          for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo(i * S, N * S); ctx.moveTo(0, i * S); ctx.lineTo(N * S, i * S); ctx.stroke(); }
          const p = painted(); finBtn.disabled = p < 20; note.textContent = p < 20 ? `Colour ${20 - p} more tiles to finish your mosaic.` : 'Looking great! Finish when you\'re happy.';
        };
        const paint = e => { const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N); if (x >= 0 && y >= 0 && x < N && y < N) { grid[y * N + x] = col; draw(); } };
        cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); paint(e); });
        cv.addEventListener('pointermove', e => { if (down) paint(e); });
        const up = () => { if (down) { down = false; store.set('mosaic', grid); } };
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        const sws = h('div', { class: 'swatches' });
        [...pal, ''].forEach(c => { const b = h('button', { class: 'sw' + (c === col ? ' on' : ''), style: c ? `background:${c}` : 'background:repeating-linear-gradient(45deg,#fff,#fff 6px,#ddd 6px,#ddd 12px)', 'aria-label': c ? 'Colour ' + c : 'Rubber', onclick: () => { col = c; sfx.click(); [...sws.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); } }); sws.append(b); });
        box.replaceChildren(h('div', { class: 'card' },
          h('p', { class: 'intro' }, 'Roman artists made pictures from thousands of tiny coloured squares called ', h('b', {}, 'tesserae'), '. Try a repeating border pattern, then a picture in the middle — a fish, a star or a laurel wreath!'),
          sws, cv, note,
          h('div', { class: 'row center' }, finBtn,
            h('button', { class: 'btn', onclick: () => { grid = Array(N * N).fill(''); store.set('mosaic', grid); draw(); } }, '🗑️ Clear'),
            h('button', { class: 'btn', onclick: () => { const a = h('a', { href: cv.toDataURL('image/png'), download: 'my-roman-mosaic.png' }); a.click(); } }, '💾 Save picture'))));
        draw();
      } },
    { id: 'states', time: '14:45', title: 'Science Lab: Solid, Liquid, Gas', subject: 'Science', cls: 's-science', icon: '🧪', sticker: '🧪', desc: 'Sort materials into solids, liquids and gases.', main: true,
      run(box) { runSorter(box, { id: 'states', ...STATES }); } },
    { id: 'story', time: '15:15', title: 'Story Studio', subject: 'English', cls: 's-english', icon: '✍️', sticker: '📚', desc: 'Write your own adventure with a magic story starter.', main: true,
      run(box) {
        const PROMPTS = ['A mysterious door appears in your bedroom wall…', 'You discover a tiny dragon in the garden shed…', 'A Roman soldier steps out of a time portal at your school…', 'Your pet suddenly talks. What is the first thing it says?'];
        let pi = store.get('storyPrompt', 0);
        const ta = h('textarea', { 'aria-label': 'Write your story here', placeholder: 'Once upon a time…' });
        const count = h('div', { class: 'muted' });
        const finBtn = h('button', { class: 'btn primary', onclick: () => { const w = wc(); showResult(box, { id: 'story', score: 1, total: 1, stars: Math.min(5, 1 + Math.floor(w / 30)) }); } }, '🎉 I\'ve finished my story!');
        const wc = () => (ta.value.trim().match(/\S+/g) || []).length;
        const upd = () => { const w = wc(); count.textContent = `${w} words${w < 40 ? ` — write ${40 - w} more to finish` : ' — fantastic!'}`; finBtn.disabled = w < 40; };
        const load = () => { ta.value = store.get('story' + pi, ''); upd(); };
        ta.addEventListener('input', () => { store.set('story' + pi, ta.value); upd(); });
        const sel = h('select', { 'aria-label': 'Choose a story starter', onchange: e => { pi = +e.target.value; store.set('storyPrompt', pi); load(); } }, PROMPTS.map((p, i) => h('option', { value: i, selected: i === pi }, p)));
        const ins = t => { const s = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, s) + (s && !/\s$/.test(ta.value.slice(0, s)) ? ' ' : '') + t + ' ' + ta.value.slice(s); store.set('story' + pi, ta.value); ta.focus(); upd(); sfx.click(); };
        const chips = (arr) => h('div', { class: 'chips' }, arr.map(t => h('button', { class: 'chip', onclick: () => ins(t) }, t)));
        const checks = ['Capital letters and full stops', 'At least one fronted adverbial (Suddenly, … / Later that day, …)', 'A conjunction: because, but, so or when', 'Powerful adjectives and verbs', 'Read it aloud to check it makes sense'].map((t, i) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: store.get('chk' + i, false), onchange: e => store.set('chk' + i, e.target.checked) }), t));
        const save = () => { const blob = new Blob([PROMPTS[pi] + '\n\n' + ta.value], { type: 'text/plain' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'my-story.txt' }); a.click(); };
        box.replaceChildren(h('div', { class: 'two' },
          h('div', { class: 'card' }, h('h3', {}, 'Pick a story starter'), sel, h('div', { style: 'height:12px' }), ta, count,
            h('div', { class: 'row' }, finBtn, h('button', { class: 'btn', onclick: save }, '💾 Save story'), h('button', { class: 'btn', onclick: () => window.print() }, '🖨️ Print'))),
          h('div', {}, h('div', { class: 'card' }, h('h3', {}, 'Sentence starters (tap to add!)'), chips(['Suddenly,', 'Later that day,', 'Without a sound,', 'In the distance,', 'Just then,', 'To my surprise,'])),
            h('div', { class: 'card' }, h('h3', {}, 'Wow words'), chips(['gigantic', 'shimmering', 'whispered', 'sprinted', 'mysterious', 'tumbled', 'glittering', 'terrified'])),
            h('div', { class: 'card' }, h('h3', {}, 'My checklist'), checks))));
        load();
      } },
    // bonus quests
    { id: 'circuits', title: 'Bonus: Electric Circuits', subject: 'Science', cls: 's-science', icon: '⚡', sticker: '⚡', desc: 'Conductors or insulators? Sort them out!', bonus: true,
      run(box) { runSorter(box, { id: 'circuits', ...CIRCUIT }); } },
    { id: 'uk', title: 'Bonus: Explore the UK', subject: 'Geography', cls: 's-geo', icon: '🗺️', sticker: '🗺️', desc: 'Capitals, mountains, rivers and flags.', bonus: true,
      run(box) { runQuiz(box, { id: 'uk', make: makeGeo }); } }
  ];

  /* ---------- views ---------- */
  function frame(act) {
    const box = h('div', {});
    app.replaceChildren(h('div', { class: 'topbar' }, h('a', { class: 'btn', href: '#/', style: 'text-decoration:none' }, '← My quests'), h('h2', {}, `${act.icon} ${act.title}`)), box);
    return box;
  }
  function slot(a, nextId) {
    const isDone = a.id in state.best;
    const kids = [
      h('div', { class: 'time' }, a.time || 'Bonus'), h('div', { class: 'ico' }, a.icon),
      h('div', { class: 'info' }, h('div', { class: 'ttl' }, a.title), h('div', { class: 'desc' }, a.desc), h('span', { class: 'tag' }, a.subject)),
      h('div', { class: 'status' }, isDone ? (a.manual ? '✓ Done' : `✓ ${state.best[a.id]} ⭐`) : a.manual ? 'Tick me' : 'Start ▶')
    ];
    const cls = `slot ${a.cls}${isDone ? ' done' : ''}${a.id === nextId ? ' next' : ''}`;
    if (a.manual) return h('button', { class: cls, onclick: () => { if (isDone) delete state.best[a.id]; else { state.best[a.id] = 0; sfx.right(); confetti(25); } store.set('best', state.best); paintHeader(); home(); } }, kids);
    return h('a', { class: cls, href: '#/' + a.id }, kids);
  }
  function home() {
    cleanup && cleanup(); cleanup = null;
    const main = ACTS.filter(a => a.main), bonus = ACTS.filter(a => a.bonus);
    const doneN = main.filter(a => a.id in state.best).length;
    const next = main.find(a => !(a.id in state.best));
    const s = totalStars(), lvl = levelOf(s), into = s % LEVEL_SIZE;
    const unlocked = doneN >= Math.ceil(main.length * .75);
    const nameIn = h('input', { type: 'text', placeholder: 'Type your name…', 'aria-label': 'Your name', maxlength: 20, value: state.name });
    const save = () => { const v = nameIn.value.trim(); if (!v) return; state.name = v; store.set('name', v); sfx.right(); home(); };
    nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    app.replaceChildren(
      h('div', { class: 'card hero' },
        h('h1', {}, state.name ? h('span', {}, 'Hi ', h('span', { class: 'rainbow' }, state.name), '! 👋') : 'Welcome, explorer! 👋'),
        mascot(state.name ? (doneN === 0 ? pipLine('welcome') : doneN === main.length ? 'You finished the WHOLE day! Go and get your certificate!' : `${doneN} quest${doneN > 1 ? 's' : ''} done! Keep going!`) : 'Hi! I\'m Pip! What\'s your name?'),
        !state.name ? h('div', { class: 'namebox' }, nameIn, h('button', { class: 'btn primary', onclick: save }, 'That\'s me!')) : h('div', {},
          h('div', { class: 'qmeta' }, h('span', {}, `🗺️ Quests: ${doneN} of ${main.length}`), h('span', {}, `Rank: ${rankOf(s)}`)),
          h('div', { class: 'pbar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': main.length, 'aria-valuenow': doneN }, h('i', { style: `width:${doneN / main.length * 100}%` })),
          h('div', { class: 'qmeta' }, h('span', {}, `Level ${lvl}`), h('span', {}, `${LEVEL_SIZE - into} ⭐ to Level ${lvl + 1}`)),
          h('div', { class: 'lvlbar' }, h('i', { style: `width:${into / LEVEL_SIZE * 100}%` })),
          next ? h('div', { class: 'row' }, h('a', { class: 'btn primary big', href: '#/' + next.id, style: 'text-decoration:none' }, `${next.icon} Next quest: ${next.title}`)) : null)),
      h('h2', { class: 'section-title' }, '🗓️ Today\'s quests'),
      ...main.map(a => slot(a, next && next.id)),
      h('h2', { class: 'section-title' }, '🌟 Bonus quests'), h('p', { class: 'muted' }, 'Finished early? Try these for extra stars!'),
      ...bonus.map(a => slot(a)),
      h('h2', { class: 'section-title' }, '🎖️ My sticker book'),
      h('div', { class: 'card' }, h('div', { class: 'stickers' }, ACTS.map(a => h('div', { class: 'stk' + (a.id in state.best ? ' got' : '') + (state.gold[a.id] ? ' gold' : ''), title: a.title + (state.gold[a.id] ? ' (gold: perfect score!)' : '') }, a.sticker))), h('p', { class: 'muted' }, 'Finish a quest to win its sticker. Get every answer right for a ', h('b', {}, 'golden'), ' one!')),
      unlocked ? h('div', { class: 'card hero pop' }, h('h2', {}, '🏆 Your certificate is ready!'), h('a', { class: 'btn primary big', href: '#/certificate', style: 'text-decoration:none' }, 'See my certificate')) : h('p', { class: 'muted' }, `🔒 Finish ${Math.ceil(main.length * .75) - doneN} more quest${Math.ceil(main.length * .75) - doneN === 1 ? '' : 's'} to unlock your certificate.`),
      h('footer', {}, h('a', { href: 'plan.html' }, '👩‍🏫 Parents\' lesson plan'), ' · ', h('button', { onclick: () => { const n = prompt('What\'s your name?', state.name); if (n && n.trim()) { state.name = n.trim().slice(0, 20); store.set('name', state.name); home(); } } }, 'Change name'), ' · ', h('button', { onclick: () => { if (confirm('Start a brand new day? This clears today\'s stars and stickers.')) { state.best = {}; state.gold = {}; store.set('best', {}); store.set('gold', {}); paintHeader(); home(); } } }, 'Start a new day'), h('p', {}, 'Progress is saved only in this browser. No sign-up, no tracking.')));
  }
  function certificate() {
    const s = totalStars();
    app.replaceChildren(
      h('div', { class: 'topbar no-print' }, h('a', { class: 'btn', href: '#/', style: 'text-decoration:none' }, '← My quests')),
      h('div', { class: 'cert pop' }, h('div', { style: 'font-size:3rem' }, '🏆🦊🏆'), h('h1', {}, 'Certificate of Awesomeness'), h('p', {}, 'This certificate is proudly awarded to'),
        h('div', { class: 'nm' }, state.name || 'a Super Learner'), h('p', {}, `for an amazing day of learning at home, earning ${s} ⭐ and reaching Level ${levelOf(s)}.`),
        h('p', { style: 'font-size:1.4rem;font-weight:800' }, `Rank: ${rankOf(s)}`), h('p', { class: 'muted' }, new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })), h('div', { style: 'font-size:2rem' }, ACTS.filter(a => a.id in state.best).map(a => a.sticker).join(' '))),
      h('div', { class: 'row center no-print' }, h('button', { class: 'btn primary big', onclick: () => window.print() }, '🖨️ Print it!')));
    confetti(120); sfx.fanfare();
  }

  function route() {
    cleanup && cleanup(); cleanup = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    window.scrollTo(0, 0);
    const id = location.hash.replace(/^#\/?/, '');
    if (!id) return home();
    if (id === 'certificate') return certificate();
    const act = ACTS.find(a => a.id === id && a.run);
    if (!act) return home();
    act.run(frame(act));
  }
  window.addEventListener('hashchange', route);
  paintHeader();
  route();
})();
