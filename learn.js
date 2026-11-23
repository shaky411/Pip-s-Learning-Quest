'use strict';
/* Pip's Learn Zone: interactive explainers to get ready for the quests. */
(function () {
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
  const frac = (a, b) => `<span class="frac"><span class="n">${a}</span><span class="d">${b}</span></span>`;
  const fmt = n => n.toLocaleString('en-GB');
  const range = (min, max, val, on, label) => h('input', { type: 'range', min, max, value: val, class: 'slider', 'aria-label': label, oninput: e => on(+e.target.value) });
  const toRoman = n => { let s = ''; for (const [v, r] of [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
  const tip = (title, html) => h('div', { class: 'tipcard' }, h('b', {}, title), h('div', { html }));
  const section = (title, ...kids) => h('div', { class: 'card' }, h('h3', {}, title), ...kids);

  /* ---------- shared pictures ---------- */
  function pizza(n, k) {
    const r = 52, c = 60; let s = '';
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / n, f = x => x.toFixed(2);
      s += `<path d="M${c},${c} L${f(c + r * Math.cos(a0))},${f(c + r * Math.sin(a0))} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f(c + r * Math.cos(a1))},${f(c + r * Math.sin(a1))} Z" fill="${i < k ? '#ffb703' : '#fff7e0'}" stroke="#7a4a12" stroke-width="2" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 120 120" class="pizza" role="img" aria-label="A pizza cut into ${n} equal slices with ${k} shaded">${s}</svg>`;
  }
  function clockSVG(hr, mn) {
    let s = '<circle cx="100" cy="100" r="92" fill="#fff" stroke="#26324b" stroke-width="6"/>';
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, l = i % 5 ? 3 : 8; s += `<line x1="${100 + (88 - l) * Math.sin(a)}" y1="${100 - (88 - l) * Math.cos(a)}" x2="${100 + 88 * Math.sin(a)}" y2="${100 - 88 * Math.cos(a)}" stroke="#26324b" stroke-width="${i % 5 ? 1 : 3}"/>`; }
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += `<text x="${100 + 68 * Math.sin(a)}" y="${100 - 68 * Math.cos(a) + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="#26324b">${i}</text>`; }
    const ha = ((hr % 12) + mn / 60) * Math.PI / 6, ma = mn * Math.PI / 30;
    s += `<line x1="100" y1="100" x2="${100 + 45 * Math.sin(ha)}" y2="${100 - 45 * Math.cos(ha)}" stroke="#e0457b" stroke-width="8" stroke-linecap="round"/>`;
    s += `<line x1="100" y1="100" x2="${100 + 70 * Math.sin(ma)}" y2="${100 - 70 * Math.cos(ma)}" stroke="#2f6fed" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#26324b"/>`;
    return `<svg viewBox="0 0 200 200" class="clock" role="img" aria-label="Analogue clock">${s}</svg>`;
  }

  /* ---------- TOPIC: times tables ---------- */
  function tTimes(box) {
    let a = 4, b = 6;
    const grid = h('div', { class: 'dots', 'aria-hidden': 'true' }), txt = h('div', { class: 'big-eq' }), fam = h('div', { class: 'fam' });
    const upd = () => {
      grid.style.gridTemplateColumns = `repeat(${b}, 22px)`;
      grid.replaceChildren(...Array.from({ length: a * b }, (_, i) => h('i', { class: 'dot r' + (Math.floor(i / b) % 2) })));
      txt.innerHTML = `${a} × ${b} = <b>${a * b}</b>`;
      fam.innerHTML = `<b>Fact family:</b> ${a} × ${b} = ${a * b} &nbsp;·&nbsp; ${b} × ${a} = ${a * b} &nbsp;·&nbsp; ${a * b} ÷ ${a} = ${b} &nbsp;·&nbsp; ${a * b} ÷ ${b} = ${a}`;
      la.textContent = a; lb.textContent = b;
    };
    const la = h('b', {}), lb = h('b', {});
    box.append(
      section('🔲 See a times table as an array',
        h('p', {}, 'Multiplying is just counting equal groups. Slide to change how many ', h('b', {}, 'rows'), ' and ', h('b', {}, 'columns'), ' there are.'),
        h('label', { class: 'sl' }, 'Rows (groups): ', la, range(1, 12, a, v => { a = v; upd(); }, 'Number of rows')),
        h('label', { class: 'sl' }, 'Columns (in each group): ', lb, range(1, 12, b, v => { b = v; upd(); }, 'Number of columns')),
        h('div', { class: 'dotwrap' }, grid), txt, fam,
        h('p', { class: 'muted' }, 'Notice that 4 × 6 and 6 × 4 give the same answer. Turn the array on its side and it looks the same!')),
      section('✨ Tricks that make tables easier',
        h('div', { class: 'tips' },
          tip('2× — double it', '7 × 2 = 7 + 7 = 14'),
          tip('4× — double double', '6 × 4: double 6 = 12, double again = <b>24</b>'),
          tip('5× — ends in 0 or 5', '5 × 7 = 35. Half of 10 × 7 = 70, so half of 70 is 35.'),
          tip('10× — add a zero', '10 × 8 = 80. Every digit moves one place left.'),
          tip('11× (up to 9) — repeat the digit', '11 × 4 = <b>44</b>, 11 × 7 = <b>77</b>'),
          tip('9× — the finger trick', 'Hold up 10 fingers. For 9 × 4, fold down finger 4. Fingers before it = 3 tens, fingers after = 6 ones, so <b>36</b>.'),
          tip('9× — digits add up to 9', '9 × 3 = 27 (2 + 7 = 9), 9 × 6 = 54 (5 + 4 = 9)'),
          tip('3× — double, then add one more', '3 × 7: double 7 = 14, add another 7 = <b>21</b>'),
          tip('6× — 5× plus one more', '6 × 7 = (5 × 7) + 7 = 35 + 7 = <b>42</b>'),
          tip('12× — 10× plus 2×', '12 × 6 = 60 + 12 = <b>72</b>'))));
    upd();
  }

  /* ---------- TOPIC: fractions ---------- */
  function tFractions(box) {
    // pizza builder
    let n = 8, k = 3;
    const pz = h('div', { class: 'center' }), expl = h('div', { class: 'big-eq' }), ln = h('b', {}), lk = h('b', {});
    const kSlider = () => range(0, n, k, v => { k = v; updP(); }, 'Slices we have');
    let kWrap = h('div');
    const updP = () => {
      if (k > n) k = n;
      pz.innerHTML = pizza(n, k);
      expl.innerHTML = `${frac(k, n)} <span style="font-size:.6em"> = ${k} out of ${n} slices</span>`;
      ln.textContent = n; lk.textContent = k;
    };
    const rebuildK = () => { kWrap.replaceChildren(h('label', { class: 'sl' }, 'Slices we have (numerator): ', lk, kSlider())); };
    // equivalent fractions
    let base = [1, 2];
    const eqOut = h('div');
    const bar = (kk, nn) => h('div', { class: 'fbar', role: 'img', 'aria-label': `${kk} out of ${nn} parts shaded` }, Array.from({ length: nn }, (_, i) => h('i', { class: i < kk ? 'on' : '' })));
    const updE = () => {
      const [a, b] = base;
      eqOut.replaceChildren(...[1, 2, 3, 4].map(m => h('div', { class: 'eqrow' }, h('span', { class: 'eqlab', html: frac(a * m, b * m) }), bar(a * m, b * m))),
        h('p', { html: `Same amount, cut into more pieces! ${[1, 2, 3, 4].map(m => frac(a * m, b * m)).join(' = ')}` }),
        h('p', { class: 'muted', html: 'To make an equivalent fraction, <b>multiply the top and bottom by the same number</b>.' }));
    };
    const baseChips = h('div', { class: 'chips' });
    [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]].forEach(f => {
      const c = h('button', { class: 'chip' + (f[0] === base[0] && f[1] === base[1] ? ' sel' : ''), html: frac(f[0], f[1]), 'aria-label': `${f[0]} over ${f[1]}`, onclick: () => { base = f; [...baseChips.children].forEach(x => x.classList.remove('sel')); c.classList.add('sel'); updE(); } });
      baseChips.append(c);
    });
    // fraction of an amount
    let d = 4, kk = 1, m = 5;
    const amtOut = h('div'), dChips = h('div', { class: 'chips' }), lm = h('b', {}), kBox = h('div');
    const updA = () => {
      if (kk > d - 1) kk = d - 1;
      const total = d * m;
      amtOut.replaceChildren(
        h('div', { class: 'groups' }, Array.from({ length: d }, (_, g) => h('div', { class: 'grp' + (g < kk ? ' on' : '') }, Array.from({ length: m }, () => h('i', { class: 'dot r1' }))))),
        h('p', { html: `<b>${frac(kk, d)} of ${total}</b><br>① Split ${total} into <b>${d}</b> equal groups → <b>${m}</b> in each group.<br>② Take <b>${kk}</b> group${kk > 1 ? 's' : ''} → ${kk} × ${m} = <b>${kk * m}</b>` }));
      lm.textContent = d * m;
      kBox.replaceChildren(h('label', { class: 'sl' }, 'How many groups do we take? (numerator) ', h('b', {}, kk), range(1, d - 1, kk, v => { kk = v; updA(); }, 'Groups taken')));
    };
    [2, 3, 4, 5, 10].forEach(x => { const c = h('button', { class: 'chip' + (x === d ? ' sel' : ''), html: 'Split into ' + x, onclick: () => { d = x; [...dChips.children].forEach(y => y.classList.remove('sel')); c.classList.add('sel'); updA(); } }); dChips.append(c); });
    box.append(
      section('🍕 Build a fraction',
        h('p', {}, 'The ', h('b', {}, 'denominator'), ' (bottom) says how many equal slices there are. The ', h('b', {}, 'numerator'), ' (top) says how many slices we have.'),
        h('label', { class: 'sl' }, 'Slices in total (denominator): ', ln, range(2, 12, n, v => { n = v; if (k > n) k = n; rebuildK(); updP(); }, 'Total slices')),
        kWrap, pz, expl),
      section('🟰 Equivalent fractions: different names, same amount', h('p', {}, 'Pick a fraction and see it cut into smaller and smaller pieces.'), baseChips, eqOut),
      section('🧮 Finding a fraction of an amount', h('p', {}, 'The bottom number tells you how many equal groups to split into.'), dChips,
        h('label', { class: 'sl' }, 'Things in each group: ', lm, range(1, 10, m, v => { m = v; updA(); }, 'Things in each group')), kBox, amtOut),
      section('⚖️ Comparing fractions', h('div', { class: 'tips' },
        tip('Same bottom number', `${frac(3, 8)} or ${frac(5, 8)}? The pieces are the same size, so more pieces wins: ${frac(5, 8)} is bigger.`),
        tip('Same top number (unit fractions)', `${frac(1, 3)} or ${frac(1, 5)}? Cutting into <b>fewer</b> pieces makes <b>bigger</b> pieces, so ${frac(1, 3)} is bigger.`))));
    updP(); rebuildK(); updE(); updA();
  }

  /* ---------- TOPIC: Roman numerals ---------- */
  function tRoman(box) {
    let n = 49;
    const parts = h('div', { class: 'chips' }), big = h('div', { class: 'big-eq' }), ln = h('b', {});
    const breakdown = x => { const out = []; for (const [v, r] of [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (x >= v) { out.push([r, v]); x -= v; } return out; };
    const upd = () => {
      ln.textContent = n; big.innerHTML = `${n} = <b class="roman">${toRoman(n)}</b>`;
      parts.replaceChildren(...breakdown(n).flatMap(([r, v], i, arr) => [i ? h('span', { class: 'plus' }, '+') : null, h('span', { class: 'rchip' + (r.length === 2 ? ' sub' : '') }, h('b', {}, r), ' = ' + v)]).filter(Boolean));
    };
    const dec = h('input', { type: 'text', class: 'answer', placeholder: 'e.g. XLVII', 'aria-label': 'Type a Roman numeral', maxlength: 12, autocomplete: 'off', autocapitalize: 'characters' });
    const decOut = h('div', { class: 'feedback' });
    dec.addEventListener('input', () => {
      const s = dec.value.trim().toUpperCase(); if (!s) { decOut.textContent = ''; return; }
      if (!/^[IVXLC]+$/.test(s)) { decOut.className = 'feedback bad'; decOut.textContent = 'Only use I, V, X, L and C.'; return; }
      const val = { I: 1, V: 5, X: 10, L: 50, C: 100 }; let t = 0;
      for (let i = 0; i < s.length; i++) t += (val[s[i + 1]] > val[s[i]]) ? -val[s[i]] : val[s[i]];
      if (t > 0 && t <= 100 && toRoman(t) === s) { decOut.className = 'feedback good'; decOut.textContent = `${s} = ${t} ✔️`; }
      else { decOut.className = 'feedback bad'; decOut.textContent = t > 0 && t <= 100 ? `That adds up to ${t}, but we'd write ${t} as ${toRoman(t)}.` : 'Hmm, that doesn\'t look right. Check the rules above!'; }
    });
    box.append(
      section('🏛️ The five symbols you need',
        h('div', { class: 'symbols' }, [['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100]].map(([r, v]) => h('div', { class: 'sym' }, h('div', { class: 'roman' }, r), h('div', {}, v)))),
        h('p', { class: 'muted' }, 'Memory trick: ', h('b', {}, 'I V'), 'alue ', h('b', {}, 'X'), 'ylophones ', h('b', {}, 'L'), 'ike ', h('b', {}, 'C'), 'heese!')),
      section('📏 The rules',
        h('div', { class: 'tips' },
          tip('Rule 1: Add', 'A smaller symbol <b>after</b> a bigger one is added.<br><b>VI</b> = 5 + 1 = 6<br><b>XIII</b> = 10 + 1 + 1 + 1 = 13'),
          tip('Rule 2: Subtract', 'A smaller symbol <b>before</b> a bigger one is taken away.<br><b>IV</b> = 5 − 1 = 4<br><b>XC</b> = 100 − 10 = 90'),
          tip('Rule 3: Never more than three the same', 'IIII is wrong: write <b>IV</b>. XXXX is wrong: write <b>XL</b>.'),
          tip('Rule 4: Only I, X and C can subtract', 'IX (9), XL (40) and XC (90) are fine. But 95 is <b>XCV</b>, never VC!'))),
      section('🔧 Roman numeral machine', h('label', { class: 'sl' }, 'Choose a number: ', ln, range(1, 100, n, v => { n = v; upd(); }, 'Number from 1 to 100')), big, parts,
        h('p', { class: 'muted' }, 'Orange chips are subtraction pairs, like IV, IX, XL and XC.')),
      section('🔎 Decode a Roman numeral', h('p', {}, 'Type a Roman numeral to find out what number it is:'), dec, decOut,
        h('p', { class: 'muted' }, 'The Romans didn\'t have a zero, so you won\'t find one!')));
    upd();
  }

  /* ---------- TOPIC: place value & rounding ---------- */
  function tPlace(box) {
    let n = 4365, unit = 100, rn = 4365;
    const cols = ['Thousands', 'Hundreds', 'Tens', 'Ones'], vals = [1000, 100, 10, 1];
    const tbl = h('div', { class: 'pvwrap' }), inp = h('input', { type: 'text', inputmode: 'numeric', class: 'answer', 'aria-label': 'A number up to 9,999', maxlength: 4, value: n });
    const updP = () => {
      const d = String(n).padStart(4, '0').split('');
      tbl.replaceChildren(h('table', { class: 'pv' }, h('tr', {}, cols.map(c => h('th', {}, c))), h('tr', { class: 'digits' }, d.map((x, i) => h('td', {}, h('span', { class: n >= vals[i] ? '' : 'ghost' }, x)))), h('tr', { class: 'vals' }, d.map((x, i) => h('td', {}, n >= vals[i] ? `${x} × ${fmt(vals[i])} = ${fmt(+x * vals[i])}` : '')))));
      inp.value = n;
    };
    const bump = by => h('button', { class: 'btn', onclick: () => { n = Math.min(9999, Math.max(0, n + by)); updP(); } }, (by > 0 ? '+' : '−') + fmt(Math.abs(by)));
    inp.addEventListener('input', () => { const v = parseInt(inp.value.replace(/\D/g, ''), 10); if (!isNaN(v)) { n = Math.min(9999, v); updP(); inp.value = inp.value.replace(/\D/g, ''); } });
    const roundOut = h('div'), lr = h('b', {});
    const updR = () => {
      const lo = Math.floor(rn / unit) * unit, hi = lo + unit, mid = lo + unit / 2, near = rn >= mid ? hi : lo, x = 30 + 300 * (rn - lo) / unit;
      const digit = unit === 10 ? 'ones' : unit === 100 ? 'tens' : 'hundreds', dv = unit === 10 ? rn % 10 : unit === 100 ? Math.floor(rn / 10) % 10 : Math.floor(rn / 100) % 10;
      roundOut.innerHTML = `<svg viewBox="0 0 360 100" class="nline" role="img" aria-label="Number line from ${lo} to ${hi}"><line x1="30" y1="55" x2="330" y2="55" stroke="#26324b" stroke-width="4" stroke-linecap="round"/>
        <line x1="30" y1="45" x2="30" y2="65" stroke="#26324b" stroke-width="4"/><line x1="330" y1="45" x2="330" y2="65" stroke="#26324b" stroke-width="4"/><line x1="180" y1="47" x2="180" y2="63" stroke="#d9731a" stroke-width="3" stroke-dasharray="3 2"/>
        <text x="30" y="88" text-anchor="middle" font-size="14" font-weight="800" fill="#26324b">${fmt(lo)}</text><text x="330" y="88" text-anchor="middle" font-size="14" font-weight="800" fill="#26324b">${fmt(hi)}</text><text x="180" y="88" text-anchor="middle" font-size="12" fill="#d9731a">halfway ${fmt(mid)}</text>
        <circle cx="${x}" cy="55" r="9" fill="#e0457b"/><text x="${x}" y="30" text-anchor="middle" font-size="15" font-weight="900" fill="#e0457b">${fmt(rn)}</text></svg>
        <p><b>${fmt(rn)}</b> is ${rn >= mid ? 'at or past' : 'before'} the halfway point, so it rounds ${rn >= mid ? 'up' : 'down'} to <b>${fmt(near)}</b>.</p>
        <p class="muted">Shortcut: look at the <b>${digit}</b> digit (${dv}). ${unit === 1000 ? `If it is 5 or more` : `If it is 5 or more`}, round up. If it is 4 or less, round down.</p>`;
      lr.textContent = fmt(rn);
    };
    const unitChips = h('div', { class: 'chips' });
    [[10, 'nearest 10'], [100, 'nearest 100'], [1000, 'nearest 1,000']].forEach(([u, t]) => { const c = h('button', { class: 'chip' + (u === unit ? ' sel' : ''), onclick: () => { unit = u; [...unitChips.children].forEach(y => y.classList.remove('sel')); c.classList.add('sel'); updR(); } }, t); unitChips.append(c); });
    box.append(
      section('🔢 Place value: what is each digit worth?', h('p', {}, 'The same digit is worth different amounts depending on where it sits. Type a number or use the buttons!'), h('div', { class: 'row' }, inp, bump(1000), bump(-1000), bump(100), bump(-100), bump(10), bump(-10)), tbl,
        h('p', { class: 'muted' }, 'Press ±1,000 and watch which digit changes. “1,000 more” only changes the thousands digit!')),
      section('🎯 Rounding', h('p', {}, 'Rounding gives a number that is easier to use. Slide the number and see where it lands.'), unitChips,
        h('label', { class: 'sl' }, 'Number: ', lr, range(1000, 9999, rn, v => { rn = v; updR(); }, 'Number to round')), roundOut));
    updP(); updR();
  }

  /* ---------- TOPIC: telling the time ---------- */
  function tTime(box) {
    let hr = 3, mn = 45, pm = true;
    const NW = { 5: 'five', 10: 'ten', 20: 'twenty', 25: 'twenty-five' };
    const words = (h12, m) => { const nx = h12 % 12 + 1; if (m === 0) return `${h12} o'clock`; if (m === 15) return `quarter past ${h12}`; if (m === 30) return `half past ${h12}`; if (m === 45) return `quarter to ${nx}`; return m < 30 ? `${NW[m]} past ${h12}` : `${NW[60 - m]} to ${nx}`; };
    const out = h('div'), lh = h('b', {}), lm = h('b', {}), ap = h('button', { class: 'btn', onclick: () => { pm = !pm; upd(); } });
    const upd = () => {
      const mm = String(mn).padStart(2, '0'), h24 = pm ? (hr === 12 ? 12 : hr + 12) : (hr === 12 ? 0 : hr);
      out.innerHTML = `${clockSVG(hr, mn)}<div class="timegrid">
        <div class="tcell"><span>In words</span><b>${words(hr, mn)}</b></div>
        <div class="tcell"><span>12-hour clock</span><b>${hr}:${mm} ${pm ? 'pm' : 'am'}</b></div>
        <div class="tcell"><span>24-hour clock</span><b>${String(h24).padStart(2, '0')}:${mm}</b></div></div>`;
      ap.textContent = pm ? '🌙 pm (afternoon/evening): tap for am' : '☀️ am (morning): tap for pm';
      lh.textContent = hr; lm.textContent = mn;
    };
    box.append(
      section('⏰ Set the clock', h('p', {}, 'The ', h('b', { style: 'color:#e0457b' }, 'short pink hand'), ' shows the hour. The ', h('b', { style: 'color:#2f6fed' }, 'long blue hand'), ' shows the minutes (each number = 5 minutes).'),
        h('label', { class: 'sl' }, 'Hour: ', lh, range(1, 12, hr, v => { hr = v; upd(); }, 'Hour')),
        h('label', { class: 'sl' }, 'Minutes: ', lm, range(0, 11, mn / 5, v => { mn = v * 5; upd(); }, 'Minutes in fives')),
        h('div', { class: 'row' }, ap), out),
      section('🌗 Turning 12-hour into 24-hour time', h('div', { class: 'tips' },
        tip('Morning (am)', 'Stays the same, with a zero in front: 7:30 am → <b>07:30</b>'),
        tip('Afternoon & evening (pm)', 'Add 12 to the hour: 4:15 pm → <b>16:15</b>, 9:00 pm → <b>21:00</b>'),
        tip('Special cases', 'Midnight is <b>00:00</b>. Midday (noon) is <b>12:00</b>.'),
        tip('Counting on', 'Film from 3:10 to 3:45? Count the minutes: <b>35 minutes</b>. Crossing an hour, like 2:40 to 3:15? 20 minutes to 3:00, then 15 more = <b>35 minutes</b>.'))));
    upd();
  }

  /* ---------- TOPIC: grammar ---------- */
  function tGrammar(box) {
    const G = [
      ['’ Apostrophes for missing letters', 'The apostrophe stands in for letters that have been left out.', ['do not → <mark>don’t</mark>', 'we are → <mark>we’re</mark>', 'it is → <mark>it’s</mark>']],
      ['’ Apostrophes for belonging', 'One owner: add ’s. Lots of owners ending in s: add ’ after the s. Irregular plurals (children, men): add ’s.', ['one girl → the <mark>girl’s</mark> bag', 'many boys → the <mark>boys’</mark> footballs', 'children → the <mark>children’s</mark> toys']],
      ['🚀 Fronted adverbials', 'A word or phrase at the <b>front</b> of a sentence that tells us when, where or how. Put a comma after it.', ['<mark>Later that day,</mark> we went to the park.', '<mark>In the dark forest,</mark> an owl hooted.', '<mark>Without a sound,</mark> the cat crept closer.']],
      ['🔗 Conjunctions', 'Joining words that link ideas.', ['I was cold <mark>so</mark> I wore a coat.', 'We stayed in <mark>because</mark> it was raining.', 'I like cake <mark>but</mark> not jelly.', '<mark>When</mark> the bell rang, we ran out.']],
      ['🌈 Expanded noun phrases', 'Add describing words to a noun to paint a picture.', ['the dog → <mark>the fluffy brown dog with floppy ears</mark>', 'a house → <mark>a creaky old house on the hill</mark>']],
      ['💬 Speech punctuation', 'Put speech marks around the words spoken. Punctuation goes <b>inside</b> the speech marks.', ['<mark>“Where are you going?”</mark> asked Mum.', '<mark>“I’m going to the park,”</mark> said Sam.', 'Sam said, <mark>“Let’s go!”</mark>']],
      ['✅ Standard English', 'Use the correct form of the verb.', ['We <mark>were</mark> late. (not we was)', 'I <mark>did</mark> my homework. (not I done)', 'I <mark>saw</mark> a fox. (not I seen)']],
      ['🧱 Prefixes & suffixes', 'A <b>prefix</b> goes at the start of a word and a <b>suffix</b> at the end. Both change the meaning.', ['<mark>dis</mark>appear, <mark>un</mark>happy, <mark>re</mark>write', 'quick<mark>ly</mark>, care<mark>ful</mark>, kind<mark>ness</mark>']],
      ['🪞 Homophones', 'Words that sound the same but have different meanings and spellings.', ['<mark>their</mark> (belonging to them), <mark>there</mark> (a place), <mark>they’re</mark> (they are)', '<mark>to</mark> / <mark>too</mark> / <mark>two</mark>, <mark>here</mark> / <mark>hear</mark>']]
    ];
    box.append(h('p', { class: 'intro' }, 'Tap a card to open it. The ', h('mark', {}, 'highlighted'), ' bits show the grammar in action.'),
      ...G.map(([t, rule, ex], i) => h('details', { class: 'card gcard', open: i === 0 }, h('summary', {}, t), h('p', { html: rule }), h('ul', {}, ex.map(e => h('li', { html: e }))))));
  }

  /* ---------- TOPIC: Roman Britain ---------- */
  function tRomans(box) {
    const T = [['55 BC', 'Julius Caesar visits Britain', 'He leads an expedition but doesn’t stay.'], ['AD 43', 'The Roman invasion', 'Emperor Claudius sends an army and Britain starts to become part of the Roman Empire.'], ['AD 60', 'Boudica’s rebellion', 'Boudica, queen of the Iceni tribe, leads an uprising against the Romans.'], ['AD 122', 'Hadrian’s Wall begins', 'A huge wall is started in the north to defend the border.'], ['About AD 410', 'The Romans leave', 'The Roman army leaves Britain to defend other parts of the empire.']];
    box.append(
      section('🕰️ Timeline', h('p', { class: 'muted' }, 'BC means “before Christ”: the numbers count down towards AD 1. AD numbers count up.'), h('div', { class: 'timeline' }, T.map(([y, t, d]) => h('div', { class: 'tl' }, h('div', { class: 'tly' }, y), h('div', {}, h('b', {}, t), h('div', {}, d)))))),
      section('🛣️ What the Romans gave Britain', h('div', { class: 'tips' },
        tip('Straight roads', 'Built so armies could march quickly. Many modern roads still follow them.'),
        tip('Towns & baths', 'Londinium (London) grew into a big city. In Bath, the Romans built grand baths at a place they called Aquae Sulis.'),
        tip('Aqueducts', 'Raised channels that carried fresh water into towns.'),
        tip('Latin words', 'Our word <b>street</b> comes from the Latin <i>strata</i> and <b>wall</b> from <i>vallum</i>. Place names ending in <b>-chester</b> or <b>-cester</b> (Manchester, Gloucester, Winchester) come from the Latin word <i>castra</i>, meaning “fort”.'),
        tip('Roman numerals', 'Used for counting and carving dates. You can still see them on clocks and buildings!'),
        tip('The Roman army', 'A <b>century</b> was about 80 soldiers, led by a <b>centurion</b>.'))));
  }

  /* ---------- TOPIC: science ---------- */
  function tScience(box) {
    let temp = 20;
    const seed = i => { const x = Math.sin(i * 91.7) * 10000; return x - Math.floor(x); };
    const N = 20, W = 320, H = 170;
    const pos = { solid: [], liquid: [], gas: [] };
    for (let i = 0; i < N; i++) {
      pos.solid.push([70 + (i % 5) * 44, 40 + Math.floor(i / 5) * 34]);
      pos.liquid.push([20 + seed(i) * (W - 40), 90 + seed(i + 50) * 66]);
      pos.gas.push([14 + seed(i + 100) * (W - 28), 14 + seed(i + 150) * (H - 28)]);
    }
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'sci'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Particles of water');
    const dots = Array.from({ length: N }, () => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 9); c.setAttribute('cx', 0); c.setAttribute('cy', 0); c.style.transition = 'transform 1s ease'; svg.append(c); return c; });
    const info = h('div', { class: 'card' }), lt = h('b', {}), stateEl = h('div', { class: 'big-eq' });
    const stateOf = t => t <= 0 ? 'solid' : t < 100 ? 'liquid' : 'gas';
    const D = { solid: ['🧊 Solid (ice)', '#7ec8e3', 'Particles are packed tightly in fixed places. They only wiggle on the spot.'], liquid: ['💧 Liquid (water)', '#2f6fed', 'Particles are close together but can slide past each other, so a liquid flows and takes the shape of its container.'], gas: ['💨 Gas (steam)', '#9aa6c4', 'Particles are far apart and zoom around everywhere, so a gas spreads out to fill its container.'] };
    let jit = 0;
    const place = () => {
      const s = stateOf(temp); jit++;
      dots.forEach((c, i) => { const [x, y] = pos[s][i], j = s === 'solid' ? 1.5 : 6; c.setAttribute('fill', D[s][1]); c.style.transform = `translate(${x + (Math.sin(jit + i) * j)}px,${y + (Math.cos(jit * 1.3 + i) * j)}px)`; });
      stateEl.textContent = D[s][0]; info.replaceChildren(h('h3', {}, D[s][0]), h('p', {}, D[s][2]));
      lt.textContent = temp + ' °C';
    };
    const tick = setInterval(() => { if (!svg.isConnected) { clearInterval(tick); return; } place(); }, 900);
    box.append(
      section('🌡️ Heat up the water!', h('p', {}, 'Slide the temperature and watch the tiny particles in water change.'), h('label', { class: 'sl' }, 'Temperature: ', lt, range(-20, 120, temp, v => { temp = v; place(); }, 'Temperature in degrees Celsius')), h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Water freezes at 0 °C and boils at 100 °C.')), svg, stateEl),
      info,
      section('⚡ Conductors and insulators', h('p', {}, 'Electricity can flow through a ', h('b', {}, 'conductor'), ' but not through an ', h('b', {}, 'insulator'), '.'),
        h('div', { class: 'two' }, h('div', {}, h('h3', {}, '⚡ Conductors'), h('div', { class: 'chips' }, ['copper wire', 'iron nail', 'aluminium foil', 'steel paperclip', 'metal key'].map(t => h('span', { class: 'placed' }, t))), h('p', { class: 'muted' }, 'Most metals are conductors.')),
          h('div', {}, h('h3', {}, '🛑 Insulators'), h('div', { class: 'chips' }, ['rubber glove', 'plastic ruler', 'wooden spoon', 'glass jar', 'woollen sock'].map(t => h('span', { class: 'placed ins' }, t))), h('p', { class: 'muted' }, 'Plastic covers wires to keep us safe.')))));
    place();
  }

  /* ---------- TOPIC: spelling ---------- */
  function tSpelling(box) {
    box.append(
      section('👀 Look, Say, Cover, Write, Check', h('ol', { class: 'steps' }, [['Look', 'Study the word. Which bits are tricky?'], ['Say', 'Say it slowly in chunks, like Feb-ru-ar-y.'], ['Cover', 'Hide the word.'], ['Write', 'Write it from memory.'], ['Check', 'Uncover it. Did you get every letter? If not, spot the mistake and try again.']].map(([a, b]) => h('li', {}, h('b', {}, a + ': '), b)))),
      section('🧠 Memory tricks for tricky words', h('div', { class: 'tips' },
        tip('because', '<b>B</b>ig <b>E</b>lephants <b>C</b>an <b>A</b>lways <b>U</b>nderstand <b>S</b>mall <b>E</b>lephants'),
        tip('island', 'An <b>is</b>land is <b>land</b> surrounded by water. The s is silent!'),
        tip('library', 'Say <b>LIE-brar-y</b> with both r’s: lib<b>r</b>a<b>r</b>y.'),
        tip('different', 'Three chunks: <b>dif-fer-ent</b>. Don’t skip the middle one!'),
        tip('February', 'Say it in four chunks: <b>Feb-ru-ar-y</b>. There’s an r after the b.'),
        tip('believe', 'Never believe a <b>lie</b>: bel<b>ie</b>ve.'),
        tip('necessary', 'One <b>c</b> and two <b>s</b>: a shirt has 1 collar and 2 sleeves!'),
        tip('friend', 'A fri<b>end</b> is there until the <b>end</b>.'))));
  }

  /* ---------- topics + render ---------- */
  const TOPICS = [
    { id: 'times', icon: '🚀', title: 'Times tables', quest: 'tables', fn: tTimes },
    { id: 'fractions', icon: '🍕', title: 'Fractions', quest: 'fractions', fn: tFractions },
    { id: 'place', icon: '🔢', title: 'Place value & rounding', quest: 'numtime', fn: tPlace },
    { id: 'roman', icon: '🏛️', title: 'Roman numerals', quest: 'numtime', fn: tRoman },
    { id: 'time', icon: '⏰', title: 'Telling the time', quest: 'numtime', fn: tTime },
    { id: 'grammar', icon: '✏️', title: 'Grammar cheat sheet', quest: 'grammar', fn: tGrammar },
    { id: 'spelling', icon: '🔤', title: 'Spelling tricks', quest: 'spelling', fn: tSpelling },
    { id: 'romans', icon: '📜', title: 'Roman Britain', quest: 'romans', fn: tRomans },
    { id: 'science', icon: '🧪', title: 'Science', quest: 'states', fn: tScience }
  ];
  const topicFor = { tables: 'times', fractions: 'fractions', numtime: 'place', grammar: 'grammar', spelling: 'spelling', romans: 'romans', mosaic: 'romans', states: 'science', circuits: 'science', story: 'grammar' };
  const QUEST_NAMES = { tables: '🚀 Times Table Blast-Off', fractions: '🍕 Pizza Fractions', numtime: '⏰ Number & Time Detectives', grammar: '💪 Grammar Gym', spelling: '🕵️ Spelling Spies', romans: '🏛️ Roman Britain Time Travel', states: '🧪 Science Lab' };

  function render(app, sub) {
    const topic = TOPICS.find(t => t.id === sub);
    const tabs = h('div', { class: 'ltabs', role: 'tablist' }, TOPICS.map(t => h('a', { class: 'ltab' + (topic && topic.id === t.id ? ' on' : ''), href: '#/learn/' + t.id, role: 'tab', 'aria-selected': !!(topic && topic.id === t.id) }, h('span', { class: 'lti' }, t.icon), t.title)));
    const body = h('div', {});
    app.replaceChildren(
      h('div', { class: 'topbar' }, h('a', { class: 'btn', href: '#/', style: 'text-decoration:none' }, '← My quests'), h('h2', {}, '📚 Learn Zone')),
      h('div', { class: 'mascot' }, h('div', { class: 'pip', style: 'animation:bob 2.4s ease-in-out infinite' }, '🦊'), h('div', { class: 'bubble' }, topic ? `Let's explore ${topic.title.toLowerCase()}! Play with the sliders and buttons.` : 'Pick a topic to practise with examples. No scores here, just play and explore!')),
      tabs, body);
    if (!topic) {
      body.append(h('div', { class: 'card' }, h('p', { class: 'intro' }, 'The Learn Zone has hands-on guides for everything in the quests. Try one before you start, or come back if you get stuck.')));
      return;
    }
    topic.fn(body);
    const q = topic.quest;
    body.append(h('div', { class: 'row center', style: 'margin-top:20px' }, h('a', { class: 'btn primary big', style: 'text-decoration:none', href: '#/' + q }, `Ready? Play ${QUEST_NAMES[q] || 'the quest'} →`)));
  }

  window.PipLearn = { render, topicFor, TOPICS };
})();
