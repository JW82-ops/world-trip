/* ===== 나라별 보드게임 퀘스트 ===== */
// ctx: {player, others:[참가자], coop, rival}
// 참가자: {id, name, img?, emoji?, color, cpu?}
// 결과: {winner: id|null, success: bool, draw?: bool}
const Mini = (() => {
  const av = (p, cls = 'mini-av') => p.img ? `<img src="${p.img}" class="${cls}">` : `<span class="${cls} emo-av" style="background:${p.color}">${p.emoji || '🙂'}</span>`;

  async function intro(id) {
    const g = MINIGAMES[id], c = CITIES[g.city];
    return ask(`<div class="mg-intro"><img src="${c.img}"><div><div class="mg-flag">${c.flag} ${c.country}의 놀이</div><h2>${g.icon} ${g.name}</h2><p>${g.origin}</p></div></div>`,
      [{ t: '도전! 🎲', v: true, cls: 'yellow' }, { t: '다음에 할래요', v: false, cls: 'gray' }], { box: 'wide' });
  }
  function resultBox(m, html, ok) {
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'mg-result ' + (ok ? 'ok' : 'no');
      d.innerHTML = `${html}<button class="btn yellow">확인</button>`; m.appendChild(d);
      Sound.sfx(ok ? 'win' : 'bad'); if (ok) confetti(70);
      d.querySelector('button').onclick = () => { Sound.sfx('tap'); m.close(); res(); };
    });
  }

  /* ---------- 뱀과 사다리 ---------- */
  async function snakes(ctx) {
    const parts = ctx.coop ? [{ ...ctx.player, name: '우리 팀' }, ctx.rival] : [ctx.player, ...ctx.others];
    const LAD = { 3: 15, 5: 17, 12: 25 }, SNK = { 14: 2, 28: 9, 29: 19 };
    const C = 6, R = 5, S = 96;
    const xy = (n) => { const i = n - 1, r = Math.floor(i / C); let c = i % C; if (r % 2) c = C - 1 - c; return [c * S + S / 2, (R - 1 - r) * S + S / 2]; };
    let cells = '';
    for (let n = 1; n <= 30; n++) { const [x, y] = xy(n); cells += `<div class="sl-cell ${n % 2 ? 'a' : 'b'}" style="left:${x - S / 2}px;top:${y - S / 2}px">${n === 30 ? '🏁' : n}</div>`; }
    let svg = '';
    for (const [a, b] of Object.entries(LAD)) {
      const [x1, y1] = xy(+a), [x2, y2] = xy(b), dx = 13;
      svg += cubeLine(sampleLine(x1 - dx, y1, x2 - dx, y2, 13), 12, 'lcube') + cubeLine(sampleLine(x1 + dx, y1, x2 + dx, y2, 13), 12, 'lcube');
      sampleLine(x1, y1, x2, y2, 26).slice(1, -1).forEach(([x, y]) => { svg += cubeLine([[x - 6, y], [x + 6, y]], 10, 'lcube rung'); });
    }
    for (const [a, b] of Object.entries(SNK)) {
      const [x1, y1] = xy(+a), [x2, y2] = xy(b);
      const pts = sampleQuad(x1, y1, (x1 + x2) / 2 + (x1 >= x2 ? 42 : -42), (y1 + y2) / 2, x2, y2, 14);
      svg += cubeLine(pts.slice(1), 16, 'scube', k => k % 2 ? '#2fbf71' : '#57dd8f') + `<i class="shead" style="left:${x1 - 15}px;top:${y1 - 15}px"></i>`;
    }
    const m = modal(`<h2>🐍 뱀과 사다리 <small>30칸에 먼저 도착하면 승리!</small></h2>
      <div class="sl-wrap"><div class="sl-board" style="width:${C * S}px;height:${R * S}px">${cells}<div class="sl-deco">${svg}</div><div id="sl-toks"></div></div>
      <div class="sl-side"><div id="sl-list"></div>${Dice3D.html('sl-dice')}<button class="btn yellow" id="sl-roll">굴리기!</button><div id="sl-msg" class="muted"></div></div></div>`, { box: 'wide mg' });
    const pos = parts.map(() => 1);
    const toks = $('#sl-toks', m);
    parts.forEach((p, i) => { const t = document.createElement('div'); t.className = 'sl-tok'; t.style.setProperty('--c', p.color); t.innerHTML = `<div class="tsh"></div><div class="tb">${av(p, 'tokimg')}</div>`; toks.appendChild(t); });
    const place = () => parts.forEach((p, i) => { const [x, y] = xy(Math.min(30, pos[i])); const t = toks.children[i]; t.style.left = (x - 24 + (i % 2) * 18 - 9) + 'px'; t.style.top = (y - 30 + Math.floor(i / 2) * 12 - 6) + 'px'; });
    const list = () => $('#sl-list', m).innerHTML = parts.map((p, i) => `<div class="sl-p ${i === turn ? 'on' : ''}" style="--c:${p.color}">${av(p)} ${p.name} <b>${pos[i]}</b></div>`).join('');
    let turn = 0; place(); list();
    return new Promise(res => {
      const btn = $('#sl-roll', m);
      async function play() {
        btn.disabled = true; const p = parts[turn];
        const d = rnd(1, 6); Sound.sfx('dice');
        await Dice3D.roll($('#sl-dice', m), d, 1000);
        const tk = toks.children[turn];
        for (let s = 0; s < d && pos[turn] < 30; s++) { const x0 = parseFloat(tk.style.left); pos[turn]++; Sound.sfx('step'); place(); list(); hopEl(tk, parseFloat(tk.style.left) - x0); await sleep(380); }
        hopEl(tk, 0, true); await sleep(300);
        let msg = `${p.name}: ${d}칸 이동`;
        if (LAD[pos[turn]]) { await sleep(200); pos[turn] = LAD[pos[turn]]; Sound.sfx('good'); tk.classList.add('climb'); setTimeout(() => tk.classList.remove('climb'), 900); msg = `🪜 ${p.name} 사다리 타고 올라가요!`; }
        else if (SNK[pos[turn]]) { await sleep(200); pos[turn] = SNK[pos[turn]]; Sound.sfx('bad'); tk.classList.add('slide'); setTimeout(() => tk.classList.remove('slide'), 900); msg = `🐍 앗! ${p.name} 뱀 타고 미끄러져요!`; }
        place(); $('#sl-msg', m).textContent = msg;
        if (pos[turn] >= 30) {
          list(); await sleep(500);
          const mine = ctx.coop ? turn === 0 : p.id === ctx.player.id;
          await resultBox(m, `<div class="big">${p.name} 승리! 🏆</div>`, ctx.coop ? turn === 0 : true);
          return res({ winner: ctx.coop ? (turn === 0 ? ctx.player.id : 'rival') : p.id, success: mine });
        }
        turn = (turn + 1) % parts.length; list();
        if (parts[turn].cpu) { await sleep(700); play(); } else { btn.disabled = false; btn.textContent = `${parts[turn].name} 굴리기!`; }
      }
      btn.textContent = `${parts[0].name} 굴리기!`;
      btn.onclick = () => { Sound.sfx('tap'); play(); };
    });
  }

  /* ---------- 틱택토 ---------- */
  async function tictactoe(ctx) {
    let opp;
    if (ctx.coop) opp = ctx.rival;
    else {
      const id = await ask(`<h2>⭕ 누구랑 대결할까요?</h2>`, [...ctx.others.map(o => ({ t: `${av(o)} ${o.name}`, v: o.id, cls: 'white' })), { t: '🤖 컴퓨터', v: 'cpu', cls: 'white' }]);
      opp = id === 'cpu' ? { id: 'cpu', name: '컴퓨터', emoji: '🤖', color: '#2b3554', cpu: true } : ctx.others.find(o => o.id === id);
    }
    const P = [ctx.player, opp], MK = ['⭕', '❌'], PK = [pixMark('o', P[0].color || '#ff5fa2'), pixMark('x', P[1].color || '#2f86ff')];
    const m = modal(`<h2>⭕ 틱택토 <small>한 줄에 3개를 먼저!</small></h2>
      <div class="ttt-top">${av(P[0])} ${P[0].name} <span class="pk">${PK[0]}</span> <span class="vs">VS</span> <span class="pk">${PK[1]}</span> ${P[1].name} ${av(P[1])}</div>
      <div class="ttt">${Array.from({ length: 9 }, (_, i) => `<button data-i="${i}"></button>`).join('')}</div><div id="ttt-msg" class="center big2"></div>`, { box: 'mg' });
    const B = Array(9).fill(-1); let turn = 0, over = false;
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const winner = () => { for (const l of L) if (B[l[0]] >= 0 && B[l[0]] === B[l[1]] && B[l[1]] === B[l[2]]) return B[l[0]]; return B.includes(-1) ? null : 'draw'; };
    const msg = () => $('#ttt-msg', m).innerHTML = `${P[turn].name} 차례 ${MK[turn]}`;
    function cpuMove() {
      const free = B.map((v, i) => v < 0 ? i : -1).filter(i => i >= 0);
      for (const who of [1, 0]) for (const i of free) { B[i] = who; const w = winner(); B[i] = -1; if (w === who) return i; }
      if (B[4] < 0 && Math.random() < 0.7) return 4;
      return pick(free);
    }
    return new Promise(res => {
      async function put(i) {
        if (over || B[i] >= 0) return; B[i] = turn; Sound.sfx('tap');
        const el = $(`.ttt [data-i="${i}"]`, m); el.innerHTML = PK[turn]; el.classList.add('on');
        const w = winner();
        if (w !== null) {
          over = true; await sleep(400);
          const ok = w === 0;
          await resultBox(m, w === 'draw' ? '<div class="big">비겼어요! 🤝</div>' : `<div class="big">${P[w].name} 승리! 🏆</div>`, ok);
          return res({ winner: w === 'draw' ? null : P[w].id, success: ok, draw: w === 'draw' });
        }
        turn = 1 - turn; msg();
        if (P[turn].cpu) { await sleep(600); put(cpuMove()); }
      }
      $$('.ttt button', m).forEach(b => b.onclick = () => { if (!P[turn].cpu && B[+b.dataset.i] < 0) put(+b.dataset.i); });
      msg();
    });
  }

  /* ---------- 로테리아 ---------- */
  async function loteria(ctx) {
    const lv = ctx.player.level, win = { 1: 5000, 2: 4200, 3: 3200 }[lv];
    const board = shuffle(LOTERIA).slice(0, 9), deck = shuffle(LOTERIA).slice(0, 13);
    // 판에 있는 카드가 충분히 불리도록 섞기
    const m = modal(`<h2>🎴 로테리아 <small>불린 그림을 빨리 눌러 한 줄을 만들어요!</small></h2>
      <div class="lot-wrap"><div class="lot-board">${board.map((c, i) => `<button data-i="${i}"><span class="e">${c[0]}</span><span class="s">${c[1]}</span></button>`).join('')}</div>
      <div class="lot-side"><div class="lot-caller"><div class="lot-cnum" id="lot-n">준비…</div><div class="lot-card" id="lot-card">🎴</div><div class="lot-word" id="lot-w"></div></div><div class="tbar"><i id="lot-t"></i></div><div class="muted" id="lot-left"></div></div></div>`, { box: 'wide mg' });
    const marked = Array(9).fill(false);
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let cur = null, done = false;
    $$('.lot-board button', m).forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (done || marked[i]) return;
      if (cur && board[i][1] === cur[1]) { marked[i] = true; b.classList.add('on'); Sound.sfx('coin'); cur = null; }
      else { b.classList.add('shake'); Sound.sfx('bad'); setTimeout(() => b.classList.remove('shake'), 400); }
    });
    await sleep(800);
    for (let k = 0; k < deck.length && !done; k++) {
      cur = deck[k];
      $('#lot-n', m).textContent = `${k + 1}번째 카드`; $('#lot-left', m).textContent = `남은 카드 ${deck.length - k - 1}장`;
      $('#lot-card', m).textContent = lv === 1 ? cur[0] : '❔';
      $('#lot-w', m).innerHTML = `<b>${cur[1]}</b>${lv === 2 ? `<br><span class="muted">(${cur[2]})</span>` : ''}`;
      Sound.sfx('card'); Voice.say(cur[1], 'es-ES', 0.85);
      const t = $('#lot-t', m); t.style.transition = 'none'; t.style.width = '100%'; void t.offsetWidth; t.style.transition = `width ${win}ms linear`; t.style.width = '0%';
      const t0 = Date.now();
      while (Date.now() - t0 < win) { await sleep(100); if (L.some(l => l.every(i => marked[i]))) { done = true; break; } }
      if (lv >= 2) $('#lot-card', m).textContent = deck[k][0];
      cur = null; if (!done) await sleep(400);
    }
    const ok = L.some(l => l.every(i => marked[i]));
    await resultBox(m, ok ? '<div class="big">¡Lotería! 한 줄 완성! 🎉</div>' : '<div class="big">아쉽게 한 줄을 못 만들었어요</div>', ok);
    return { winner: ok ? ctx.player.id : null, success: ok };
  }

  /* ---------- 카루타 ---------- */
  async function karuta(ctx) {
    const lv = ctx.player.level, rounds = 6, need = lv === 1 ? 4 : 5, lim = { 1: 7000, 2: 6000, 3: 6000 }[lv];
    let pool, lang;
    if (lv === 1) { pool = KO_WORDS.map(w => ({ e: w[0], show: w[1], say: w[1] })); lang = 'ko-KR'; }
    else if (lv === 2) { pool = EN_WORDS.map(w => ({ e: w[0], show: w[1], say: w[1] })); lang = 'en-US'; }
    else { pool = JA_WORDS.map(w => ({ e: w[0], show: `${w[2]}<small>${w[3]}</small>`, say: w[1], kana: w[1] })); lang = 'ja-JP'; }
    const canSpeak = Voice.has(lang) && SET.voice;
    const m = modal(`<h2>🃏 카루타 <small>읽어 주는 말을 듣고 맞는 카드를 '탁!' (${rounds}번 중 ${need}번)</small></h2>
      <div class="kar-reader"><button class="btn small white" id="kar-say">🔊 다시 듣기</button><span id="kar-txt"></span><span id="kar-score"></span></div>
      <div class="tbar"><i id="kar-t"></i></div><div class="kar-grid" id="kar-g"></div>`, { box: 'wide mg' });
    let score = 0;
    for (let r = 0; r < rounds; r++) {
      const cards = shuffle(pool).slice(0, 8), target = pick(cards);
      $('#kar-score', m).textContent = `⭐ ${score} / ${r}`;
      $('#kar-g', m).innerHTML = cards.map((c, i) => `<button data-i="${i}" class="${lv === 1 ? 'ko' : lv === 2 ? 'en' : 'ja'}">${lv === 3 ? `<span class="e">${c.e}</span>` : ''}<span>${c.show}</span></button>`).join('');
      $('#kar-txt', m).innerHTML = canSpeak ? '잘 들어 보세요… 👂' : `읽는 말: <b>${lv === 3 ? target.kana : target.say}</b>`;
      const speak = () => Voice.say(target.say, lang, 0.8);
      $('#kar-say', m).onclick = () => { Sound.sfx('tap'); speak(); };
      await sleep(500); speak();
      const t = $('#kar-t', m); t.style.transition = 'none'; t.style.width = '100%'; void t.offsetWidth; t.style.transition = `width ${lim}ms linear`; t.style.width = '0%';
      const got = await new Promise(res => {
        const to = setTimeout(() => res(-1), lim);
        $$('#kar-g button', m).forEach(b => b.onclick = () => { clearTimeout(to); res(+b.dataset.i); });
      });
      const ok = got >= 0 && cards[got] === target;
      $$('#kar-g button', m).forEach((b, i) => { b.disabled = true; if (cards[i] === target) b.classList.add('right'); else if (i === got) b.classList.add('wrong'); });
      if (ok) { score++; Sound.sfx('coin'); } else Sound.sfx('bad');
      if (lv === 3) $('#kar-txt', m).innerHTML = `${target.kana} = ${target.show.replace(/<small>.*<\/small>/, '')}`;
      $('#kar-score', m).textContent = `⭐ ${score} / ${r + 1}`;
      await sleep(1300);
      if (score >= need || score + (rounds - r - 1) < need) break;
    }
    const ok = score >= need;
    await resultBox(m, `<div class="big">${ok ? '카루타 명인! 🎉' : '아쉬워요!'}</div><div>${score}장을 찾았어요</div>`, ok);
    return { winner: ok ? ctx.player.id : null, success: ok };
  }

  const GAMES = { snakes, tictactoe, loteria, karuta };
  async function play(id, ctx) {
    const g = MINIGAMES[id];
    if (!g || !g.open) { await say(`<h2>${g ? g.icon + ' ' + g.name : '보드게임'}</h2><p>${g ? g.origin : ''}</p><p class="big2">🔜 다음 업데이트에서 열려요!</p>`); return null; }
    if (!(await intro(id))) return null;
    return GAMES[id](ctx);
  }
  return { play };
})();
