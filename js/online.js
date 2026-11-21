/* ===== 지안지아 세계일주 · 친구랑 온라인 =====
   방식: 차례인 사람의 휴대폰이 그 차례를 진행하고(퀴즈·카드·주사위),
   진행 화면과 결과를 Firebase로 보내요. 다른 사람들은 그대로 따라 보면서 이모지로 응원해요.
   rooms/<번호>/ : host, created, status(lobby|play|end), rounds, players{uid:{nick,ch,lv,seat}},
                  state{j(게임 JSON), t(차례 번호), over}, ev(이번 차례 화면 이벤트), lock{t,by,hb,cpu}, pres{uid}, emo */
var ONLINE = null;

const Online = (() => {
  const CHARS = ['jian', 'jia', 'mom', 'dad', 'eunbyeol', 'bunny', 'bear', 'cat', 'panda', 'dino', 'shiba'];
  const EMOS = ['👍', '😂', '🎉', '😮', '😭', '❤️'];
  let code = null, me = null, room = null, roomOff = null, offs = [];
  let running = false, runT = 0, curTurn = 0, hbTimer = null, gTimer = null, lastG = '', lastToks = '', mid = 0;
  let queue = [], busy = false, pres = null, lockV = null, awaySince = 0, dog = null, endShown = false, emoAt = 0, first = true;
  const R = (p) => `rooms/${code}${p ? '/' + p : ''}`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cleanNick = (s) => (s || '').replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 6);
  const prof = () => Object.assign({ nick: '', ch: 'bunny', lv: 2 }, lsGet('oprof', {}));
  const sortedPlayers = (r) => Object.entries((r && r.players) || {}).sort((a, b) => a[1].seat - b[1].seat);
  const scr = () => $('#scr-setup');
  const show = () => { $$('.screen').forEach(s => s.classList.remove('on')); scr().classList.add('on'); };
  const back = () => { stopRoom(); scr().classList.remove('on'); $('#scr-title').classList.add('on'); titleScreen(); };
  function stopRoom() { if (roomOff) { roomOff(); roomOff = null; } }

  // 받은 HTML 안전하게 (스크립트·이벤트 속성 빼기)
  function clean(html) {
    const t = document.createElement('template'); t.innerHTML = html || '';
    t.content.querySelectorAll('script,iframe,object,embed,link,meta,form').forEach(n => n.remove());
    t.content.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
      const v = a.value.trim().toLowerCase();
      if (/^on/i.test(a.name) || ((a.name === 'src' || a.name === 'href') && !/^(img\/|https:|data:image)/.test(v) && v !== '')) n.removeAttribute(a.name);
    }));
    return t.innerHTML;
  }
  async function connect() {
    try { me = await Net.init(); return true; }
    catch (e) { console.error(e); toast('😢 인터넷 연결을 확인해 주세요!', 2400); return false; }
  }

  /* ================= 1. 대기실 ================= */
  async function lobby() {
    const saved = lsGet('oroom');
    if (saved && saved.code) {
      const go = await ask(`<h2>🌐 진행 중인 온라인 게임</h2><p>방 <b>${esc(saved.code)}</b>에서 하던 게임이 있어요.</p>`, [{ t: '▶ 다시 들어가기', v: 'resume', cls: 'green' }, { t: '새로 시작', v: 'new', cls: 'gray' }]);
      if (go === 'resume') { if (await resume(saved.code)) return; }
      else lsSet('oroom', null);
    }
    profileScreen();
  }
  function profileScreen() {
    const st = prof();
    show();
    const draw = () => {
      scr().innerHTML = `<div class="setup on-setup">
        <div class="on-title">🌐 친구랑 온라인 <small>방 번호만 알면 친구와 함께 세계일주!</small></div>
        <div class="st-block"><div class="st-label"><i>1</i> 내 캐릭터를 골라요</div>
          <div class="chars">${CHARS.map(k => `<button class="chb ${st.ch === k ? 'on' : ''}" data-c="${k}" style="--pc:${PEOPLE[k].color}"><img src="${PEOPLE[k].img}"><span>${PEOPLE[k].name}</span></button>`).join('')}</div></div>
        <div class="on-two">
          <div class="st-block"><div class="st-label"><i>2</i> 별명 <small>진짜 이름 말고 별명!</small></div>
            <input id="on-nick" class="on-input" maxlength="6" placeholder="${PEOPLE[st.ch].name}" value="${esc(st.nick)}" autocomplete="off"></div>
          <div class="st-block"><div class="st-label"><i>3</i> 퀴즈 수준</div>
            <div class="lvs">${[1, 2, 3].map(l => `<button class="lvb ${st.lv === l ? 'on' : ''}" data-l="${l}"><span>${LV_INFO[l][0]}</span><b>${LV_INFO[l][1]}</b><small>${LV_INFO[l][2]}</small></button>`).join('')}</div></div>
        </div>
        <div class="row st-go"><button class="btn gray" id="on-back">◀ 뒤로</button>
          <span class="on-acts"><button class="btn big blue" id="on-join">🔑 방 들어가기</button><button class="btn big yellow" id="on-make">🏠 방 만들기</button></span></div>
      </div>`;
      const nick = $('#on-nick');
      nick.oninput = () => { st.nick = cleanNick(nick.value); };
      $$('.chb').forEach(b => b.onclick = () => { Sound.sfx('tap'); st.nick = cleanNick(nick.value); if (CHARS.some(k => PEOPLE[k].name === st.nick)) st.nick = ''; st.ch = b.dataset.c; draw(); });
      $$('.lvb').forEach(b => b.onclick = () => { Sound.sfx('tap'); st.lv = +b.dataset.l; st.nick = cleanNick(nick.value); draw(); });
      $('#on-back').onclick = () => { Sound.sfx('tap'); back(); };
      const fin = () => { st.nick = cleanNick(nick.value) || PEOPLE[st.ch].name; lsSet('oprof', st); return st; };
      $('#on-make').onclick = async () => { Sound.sfx('tap'); fin(); await makeRoom(st); };
      $('#on-join').onclick = async () => { Sound.sfx('tap'); fin(); const c = await askCode(); if (c) await joinRoom(c, st); };
    };
    draw();
  }
  function askCode() {
    return new Promise(res => {
      const m = modal(`<h2>🔑 방 번호 4자리</h2><p class="muted">방을 만든 친구에게 번호를 물어봐요!</p>
        <input id="on-code" class="pin on-pin" type="tel" inputmode="numeric" maxlength="4" autocomplete="off">
        <div class="btns"><button class="btn yellow" id="ok">들어가기</button><button class="btn gray" id="no">취소</button></div>`);
      const i = $('#on-code', m); setTimeout(() => i.focus(), 250);
      i.oninput = () => { i.value = i.value.replace(/\D/g, '').slice(0, 4); };
      const ok = () => { const v = i.value; if (v.length !== 4) { Sound.sfx('bad'); return toast('숫자 4개를 넣어 주세요!'); } m.close(); res(v); };
      $('#ok', m).onclick = ok; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
      $('#no', m).onclick = () => { m.close(); res(null); };
    });
  }
  async function makeRoom(st) {
    if (!await connect()) return;
    for (let k = 0; k < 12; k++) {
      code = String(rnd(1000, 9999));
      const r = await Net.get(R()).catch(() => null);
      if (r && r.status !== 'end' && Net.now() - (r.created || 0) < 12 * 3600e3) continue;
      await Net.set(R(), { host: me, created: Net.TS(), status: 'lobby', rounds: 12, players: { [me]: { nick: st.nick, ch: st.ch, lv: st.lv, seat: Date.now() } } });
      lsSet('oroom', { code });
      return roomScreen();
    }
    toast('방을 만들지 못했어요. 다시 해 볼까요?');
  }
  async function joinRoom(c, st) {
    if (!await connect()) return;
    code = c;
    let r;
    try { r = await Net.get(R()); } catch (e) { r = null; }
    if (!r) { Sound.sfx('bad'); return toast('그런 방이 없어요 🤔 번호를 다시 확인해요!', 2200); }
    if (r.players && r.players[me]) { lsSet('oroom', { code }); return r.status === 'play' ? resume(code) : roomScreen(); }
    if (r.status !== 'lobby') { Sound.sfx('bad'); return toast('이미 시작한 방이에요!', 2200); }
    const ps = sortedPlayers(r);
    if (ps.length >= 4) { Sound.sfx('bad'); return toast('방이 꽉 찼어요! (최대 4명)', 2200); }
    let ch = st.ch;
    const taken = ps.map(([, p]) => p.ch);
    if (taken.includes(ch)) {
      ch = await ask(`<h2>앗, ${PEOPLE[ch].name} 캐릭터는 친구가 골랐어요!</h2><p>다른 캐릭터를 골라 주세요.</p>`,
        CHARS.filter(k => !taken.includes(k)).map(k => ({ t: `<img src="${PEOPLE[k].img}" class="mini-av"> ${PEOPLE[k].name}`, v: k, cls: 'white' })), { box: 'wide' });
      if (st.nick === PEOPLE[st.ch].name) st.nick = PEOPLE[ch].name;
      st.ch = ch; lsSet('oprof', st);
    }
    await Net.update(R('players'), { [me]: { nick: st.nick, ch, lv: st.lv, seat: Date.now() } });
    lsSet('oroom', { code });
    roomScreen();
  }
  function roomScreen() {
    show(); stopRoom();
    roomOff = Net.onValue(R(), (r) => {
      room = r;
      if (!r || (r.players && !r.players[me])) { stopRoom(); lsSet('oroom', null); toast(r ? '방에서 나왔어요' : '방이 닫혔어요 🚪', 2000); return back(); }
      if (r.status === 'play') { stopRoom(); return start(r); }
      drawRoom(r);
    });
  }
  function drawRoom(r) {
    const ps = sortedPlayers(r), host = r.host === me;
    const slots = [0, 1, 2, 3].map(k => {
      const e = ps[k]; if (!e) return `<div class="slot empty"><span class="q">?</span><b>기다리는 중…</b></div>`;
      const [u, p] = e;
      return `<div class="slot" style="--pc:${PEOPLE[p.ch].color}"><img src="${PEOPLE[p.ch].img}"><b>${esc(p.nick)}${u === me ? ' <em>나</em>' : ''}</b><small>${LV_INFO[p.lv][0]} ${LV_INFO[p.lv][1]}${u === r.host ? ' · 👑 방장' : ''}</small></div>`;
    }).join('');
    scr().innerHTML = `<div class="setup on-room">
      <div class="code-box"><small>방 번호</small><b>${esc(code)}</b><span>친구에게 이 번호를 알려 주세요!</span></div>
      <div class="st-block"><div class="st-label"><i>👫</i> 모인 친구 <small>${ps.length} / 4명 · 2명부터 출발!</small></div><div class="slots">${slots}</div></div>
      ${host ? `<div class="st-block"><div class="st-label"><i>⏰</i> 얼마나 할까요?</div><div class="lens">${[[8, '짧게', '약 20분', '⏱️'], [12, '보통', '약 30분', '⏰'], [20, '길게', '약 50분', '🌙']].map(([n, t, d, e]) => `<button class="len ${r.rounds === n ? 'on' : ''}" data-r="${n}"><span class="le">${e}</span><b>${t}</b><small>${n}라운드 · ${d}</small></button>`).join('')}</div></div>`
        : `<div class="st-block wait"><div class="dots">✈️</div> 방장이 <b>출발</b>을 누르면 시작해요! (${r.rounds}라운드)</div>`}
      <div class="row st-go"><button class="btn gray" id="rm-out">🚪 나가기</button>${host ? `<button class="btn big yellow" id="rm-go" ${ps.length < 2 ? 'disabled' : ''}>출발! ✈️</button>` : ''}</div></div>`;
    $$('.len').forEach(b => b.onclick = () => { Sound.sfx('tap'); Net.update(R(), { rounds: +b.dataset.r }); });
    $('#rm-out').onclick = async () => { Sound.sfx('tap'); stopRoom(); lsSet('oroom', null); if (host) await Net.set(R(), null); else await Net.set(R('players/' + me), null); back(); };
    if ($('#rm-go')) $('#rm-go').onclick = () => { Sound.sfx('buy'); hostStart(r); };
  }
  async function hostStart(r) {
    const ps = sortedPlayers(r);
    if (ps.length < 2) return toast('2명 이상 모여야 해요!');
    const g = {
      mode: 'family', rounds: r.rounds || 12, round: 1, turn: 0, fund: 0, over: false, own: {}, conq: {}, log: [], online: true,
      players: ps.map(([uid, p]) => ({ id: p.ch, pid: p.ch, uid, name: p.nick, level: p.lv, color: PEOPLE[p.ch].color, img: PEOPLE[p.ch].img,
        pos: 0, cash: ECON.startCash, island: 0, loanUsed: false, debt: 0, out: false, stamps: [], cards: { free: 0, half: 0 }, games: [] })),
      team: { cash: ECON.coopCash, loanUsed: false, debt: 0 },
      rival: { id: 'rival', name: RIVAL.name, color: RIVAL.color, emoji: RIVAL.emoji, pos: 0, cash: ECON.coopCash, island: 0, out: true, cpu: true },
    };
    await Net.update(R(), { status: 'play', state: { j: JSON.stringify(g), t: 1 }, ev: null, lock: null, emo: null });
  }
  async function resume(c) {
    if (!await connect()) return false;
    code = c;
    let r = null; try { r = await Net.get(R()); } catch (e) {}
    if (!r || !r.players || !r.players[me] || r.status === 'end') { lsSet('oroom', null); toast('그 게임은 이미 끝났어요!', 2000); return false; }
    if (r.status === 'lobby') { roomScreen(); return true; }
    start(r); return true;
  }

  /* ================= 2. 게임 시작 ================= */
  function fixG(g) {
    g.own = g.own || {}; g.conq = g.conq || {}; g.log = g.log || [];
    g.players.forEach(p => { p.stamps = p.stamps || []; p.games = p.games || []; p.cards = p.cards || { free: 0, half: 0 }; });
    return g;
  }
  function start(r) {
    if (ONLINE) return;
    ONLINE = { code };
    lsSet('oroom', { code });
    G = fixG(JSON.parse(r.state.j));
    curTurn = 0; first = true;
    startGameScreen();
  }
  // game.js 의 startGameScreen() 이 판을 그린 뒤 불러요
  function begin() {
    patch();
    offs.push(Net.presence(R('pres/' + me)));
    offs.push(Net.onValue(R('pres'), v => { pres = v || {}; if (G) renderInfo(); }));
    offs.push(Net.onValue(R('lock'), v => { lockV = v; if (running && (!v || v.t !== runT || v.by !== me)) lost(); }));
    offs.push(Net.onValue(R('state'), s => { if (s) enqueue({ k: 'state', s }); }));
    offs.push(Net.onAdded(R('ev'), (key, v) => { if (v && v.u !== me) enqueue(v); }));
    offs.push(Net.onAdded(R('emo'), (key, v) => { if (v && v.u !== me && Net.now() - (v.t || 0) < 8000) emoPop(v); }));
    dog = setInterval(watchdog, 3000);
    emoBar();
  }
  const away = (p) => !!(p && p.uid && ONLINE && pres && !pres[p.uid]);

  /* ---------- 받은 것 차례대로 보여 주기 ---------- */
  function enqueue(e) { queue.push(e); if (!busy) drain(); }
  async function drain() {
    busy = true;
    while (queue.length) { const e = queue.shift(); try { await handle(e); } catch (err) { console.error(err); } }
    busy = false;
  }
  async function handle(e) {
    switch (e.k) {
      case 'state': return onState(e.s);
      case 'reset': if (running) return; closePeeks(); G = fixG(JSON.parse(e.j)); renderOwners(); renderTokens(true); renderInfo(); return;
      case 'g': if (running) return; { const old = G; G = fixG(JSON.parse(e.j)); G.players.forEach(p => { const o = old && old.players.find(x => x.id === p.id); if (o) p.pos = o.pos; }); } renderOwners(); renderInfo(); return;
      case 'toks': return moveToks(e.p);
      case 'roll': {
        lastDice = e.d; Sound.sfx('dice'); const sm = $('#dsum'); if (sm) sm.className = 'dsum';
        await Promise.all([Dice3D.roll($('#d1'), e.d[0], 1000), sleep(80).then(() => Dice3D.roll($('#d2'), e.d[1], 1000))]);
        if ($('#dsum')) { $('#dsum').innerHTML = `${e.d[0] + e.d[1]}${e.d[0] === e.d[1] ? '<small>더블!</small>' : ''}`; $('#dsum').className = 'dsum show'; }
        return;
      }
      case 't': return void toast(clean(e.h), e.ms || 1800);
      case 'cf': return void confetti(Math.min(e.n || 60, 160));
      case 's': return void Sound.sfx(e.n);
      case 'm': return peek(e);
      case 'mc': return unpeek(e.i);
    }
  }
  async function moveToks(pos) {
    if (running || !G) return;
    for (const p of G.players) {
      const n = pos[p.id]; if (n == null || n === p.pos) continue;
      let guard = 0;
      // 한 칸씩 콩콩 (멀리 뛰는 건 바로)
      const dist = (n - p.pos + 40) % 40;
      if (dist > 0 && dist <= 12) {
        while (p.pos !== n && guard++ < 13) { const el = tokEl(p), x0 = el ? parseFloat(el.style.left) : 0; p.pos = (p.pos + 1) % 40; renderTokens(); Sound.sfx('step'); if (el) hopEl(el, parseFloat(el.style.left) - x0); await sleep(queue.length > 6 ? 90 : 260); }
        hopEl(tokEl(p), 0, true);
      } else { p.pos = n; renderTokens(); }
    }
  }
  function spectLabel() {
    const p = G.players[G.turn]; if (!p) return;
    rollLabel = p.uid === me ? `🎲 ${p.name} 굴리기!` : `👀 ${p.name} 차례${away(p) ? ' (컴퓨터)' : ''}`;
    const b = $('#btn-roll'); if (b && !running) { b.innerHTML = rollLabel; b.disabled = true; b.classList.remove('pulse'); }
  }
  async function onState(s) {
    const g = fixG(JSON.parse(s.j));
    if (s.over || g.over) {
      if (endShown) return; endShown = true; clearInterval(dog);
      if (running) return; // 내가 끝낸 판: 내 화면에서 이미 보여 줘요
      closePeeks(); $$('.ov').forEach(o => o.remove());
      G = g; G.over = false; renderOwners(); renderTokens(true); renderInfo();
      await sleep(400);
      return endGame(g.result || undefined);
    }
    if (s.t < curTurn || (s.t === curTurn && !first)) return;
    if (running && s.t === runT) return;
    first = false; curTurn = s.t; awaySince = 0;
    closePeeks();
    G = g; rollWaiter = null; pickWaiter = null;
    renderOwners(); renderTokens(true); renderInfo();
    const p = G.players[G.turn];
    spectLabel();
    if (p.uid === me) claim(s.t, false);
    else if (!away(p)) toast(`${p.name} 차례예요!`, 1300);
  }

  /* ---------- 내 차례 진행 ---------- */
  let claiming = false;
  async function claim(T, cpu) {
    if (claiming || running) return;
    claiming = true;
    const now = Net.now();
    let r;
    try {
      r = await Net.txn(R('lock'), (c) => {
        if (c && c.t > T) return;
        if (c && c.t === T && c.by !== me && now - (c.hb || 0) < 25000) return;
        return { t: T, by: me, hb: now, cpu: !!cpu };
      });
    } catch (e) { console.error(e); claiming = false; return; }
    claiming = false;
    if (!r.committed || T !== curTurn || running) return;
    runTurn(T, cpu);
  }
  async function runTurn(T, cpu) {
    running = true; runT = T; lastG = ''; lastToks = ''; mid = 0;
    await Net.set(R('ev'), null);
    push({ k: 'reset', j: JSON.stringify(G) });
    hbTimer = setInterval(() => { if (running) Net.update(R('lock'), { hb: Net.now() }); }, 5000);
    const p = G.players[G.turn];
    try {
      if (cpu) { p.away = true; await cpuTurn(p); }
      else { p.away = false; await takeTurn(); }
    } catch (err) { console.error(err); }
    if (!running || runT !== T || G.over) return;
    const before = G.round;
    nextTurn();
    if (G.rounds && G.round > G.rounds) { await endGame(); return; }
    if (G.rounds && G.round === G.rounds && G.round > before) toast('🔔 마지막 라운드예요!', 2200);
    clearTimeout(gTimer); clearInterval(hbTimer);
    running = false; curTurn = T + 1;
    await Net.set(R('state'), { j: JSON.stringify(G), t: T + 1 });
    renderInfo(); spectLabel();
    const np = G.players[G.turn];
    if (np.uid === me) claim(T + 1, false);
  }
  function finalState() {
    if (!running) return;
    clearInterval(hbTimer); clearInterval(dog); endShown = true;
    Net.set(R('state'), { j: JSON.stringify(G), t: runT + 1, over: true });
    Net.update(R(), { status: 'end' });
  }
  function lost() {
    if (!running) return;
    running = false; clearInterval(hbTimer);
    sessionStorage.setItem('oauto', '1');
    toast('📶 연결이 잠깐 끊겼어요. 다시 들어갈게요!', 2000);
    setTimeout(() => location.reload(), 1500);
  }
  // 오래 자리를 비운 사람 차례는 컴퓨터가 대신
  function watchdog() {
    if (!G || G.over || running || !ONLINE || endShown) return;
    const p = G.players[G.turn]; if (!p) return;
    const lk = lockV && lockV.t === curTurn ? lockV : null;
    const stale = lk && Net.now() - (lk.hb || 0) > 25000;
    if (p.uid === me) { if (!lk || (lk.by !== me && stale)) claim(curTurn, false); return; }
    if (lk && !stale) { awaySince = 0; return; }
    if (!pres || pres[p.uid]) { awaySince = 0; return; }
    if (!awaySince) awaySince = Date.now();
    if (Date.now() - awaySince < (p.away ? 3000 : 15000)) return;
    const here = G.players.filter(x => pres[x.uid]).map(x => x.uid);
    if (here[0] !== me) return;
    claim(curTurn, true);
  }

  /* ---------- 컴퓨터가 대신하는 차례 (창 없이) ---------- */
  async function cpuPay(p, amt, to) {
    if (p.cash >= amt) { p.cash -= amt; credit(to, amt); Sound.sfx('pay'); renderInfo(); return true; }
    credit(to, p.cash); p.cash = 0;
    for (const i in G.own) if (G.own[i].o === p.id) delete G.own[i];
    p.out = true; p.island = 0; renderOwners(); renderTokens(); Sound.sfx('bad');
    toast(`💥 ${p.name} 파산!`, 2000); log(`💥 ${p.name} 파산`);
    if (active().length <= 1) await endGame();
    return false;
  }
  async function cpuLand(p) {
    const i = p.pos, t = BOARD[i];
    if (isProp(i)) {
      const d = tileData(i), o = G.own[i];
      stamp(p, i);
      if (!o) { if (p.cash >= d.price + 30 && Math.random() < 0.6) { p.cash -= d.price; G.own[i] = { o: p.id, lv: 0 }; Sound.sfx('buy'); renderOwners(); toast(`🤖 ${p.name}: ${d.name} 구입!`); log(`🏙️ ${p.name} ${d.name} 구입`); } }
      else if (o.o === p.id) { if (t.t === 'city' && d.type !== 'tour' && o.lv < 3) { const c = buildCost(i, o.lv + 1); if (p.cash >= c + 50 && Math.random() < 0.5) { p.cash -= c; o.lv++; renderOwners(); toast(`🤖 ${d.name}에 ${BUILD_NAMES[o.lv]} ${BUILD_ICONS[o.lv]}`); } } }
      else { const fee = toll(i); toast(`💸 ${p.name} → ${ownerName(o.o)} 통행료 ${won(fee)}`); if (await cpuPay(p, fee, o.o)) log(`💸 ${p.name} → ${ownerName(o.o)} ${won(fee)}`); }
    } else if (t.t === 'key') { const v = pick([15, 10, -8, -6, 20, -5]); toast(`🔑 ${p.name} 황금열쇠: ${v > 0 ? '+' : ''}${won(v)}`); if (v > 0) p.cash += v; else await cpuPay(p, -v, 'fund'); }
    else if (t.t === 'island') { p.island = 3; toast(`🏝️ ${p.name} 무인도!`); }
    else if (t.t === 'space') { await moveTo(p, rnd(31, 39), true); await cpuLand(p); }
    else if (t.t === 'fundget') { p.cash += G.fund; if (G.fund) toast(`🏦 ${p.name} 기금 ${won(G.fund)}!`); G.fund = 0; }
    else if (t.t === 'fundpay') await cpuPay(p, ECON.fundPay, 'fund');
    renderInfo();
  }
  async function cpuTurn(p) {
    toast(`🤖 ${josa(p.name, '이', '가')} 자리에 없어서 컴퓨터가 대신 해요`, 2000);
    await sleep(900);
    if (p.island > 0) { if (Math.random() < 0.5) { p.island = 0; toast('🚤 탈출 성공!'); } else { p.island--; renderInfo(); await sleep(800); return; } }
    const [a, b] = await rollDice();
    log(`🎲 ${p.name} ${a}+${b}=${a + b}`);
    await moveBy(p, a + b);
    await cpuLand(p);
    renderInfo(); renderTokens(); await sleep(700);
  }

  /* ---------- 보내기 ---------- */
  function push(o) { o.u = me; Net.push(R('ev'), o).catch(e => console.error(e)); }
  function emit(k, v) {
    if (!running) return;
    if (k === 'g') { clearTimeout(gTimer); gTimer = setTimeout(() => { if (!running) return; const j = JSON.stringify(G); if (j !== lastG) { lastG = j; push({ k: 'g', j }); } }, 250); return; }
    if (k === 'toks') { const p = {}; G.players.forEach(x => p[x.id] = x.pos); const j = JSON.stringify(p); if (j !== lastToks) { lastToks = j; push({ k: 'toks', p }); } return; }
    if (k === 'roll') return push({ k: 'roll', d: v });
  }
  // 내 차례 동안 창·알림·효과음을 친구들에게도
  let patched = false;
  function patch() {
    if (patched) return; patched = true;
    const _modal = window.modal, _toast = window.toast, _conf = window.confetti, _sfx = Sound.sfx;
    window.modal = function (html, opt = {}) {
      const m = _modal(html, opt);
      if (running) mirror(m);
      return m;
    };
    window.toast = function (h, ms) { if (running) push({ k: 't', h: String(h), ms: ms || 1800 }); return _toast(h, ms); };
    window.confetti = function (n) { if (running) push({ k: 'cf', n }); return _conf(n); };
    Sound.sfx = function (n, ...a) { if (running && !['tap', 'step', 'dice'].includes(n)) push({ k: 's', n }); return _sfx.call(Sound, n, ...a); };
  }
  function mirror(m) {
    const id = ++mid; let t = null, last = '';
    const send = () => { t = null; if (!running) return; const h = m.innerHTML; if (h === last) return; last = h; push({ k: 'm', i: id, h, c: m.className }); };
    send();
    const ob = new MutationObserver(() => { if (!t) t = setTimeout(send, 300); });
    ob.observe(m, { subtree: true, childList: true, attributes: true, characterData: true });
    const oc = m.close;
    m.close = () => { ob.disconnect(); clearTimeout(t); if (running) push({ k: 'mc', i: id }); oc(); };
  }
  /* ---------- 친구 화면 엿보기 ---------- */
  const peeks = {};
  function peek(e) {
    let ov = peeks[e.i];
    const who = G && G.players[G.turn];
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'ov peek';
      ov.innerHTML = `<div class="peek-tag">👀 ${who ? esc(who.name) : '친구'} 화면</div><div class="modal"></div>`;
      $('#stage').appendChild(ov); peeks[e.i] = ov;
      requestAnimationFrame(() => ov.classList.add('show'));
    }
    const md = $('.modal', ov);
    md.className = String(e.c || 'modal').replace(/[^\w\s-]/g, '');
    md.innerHTML = clean(e.h);
    $$('button,input', md).forEach(b => { b.disabled = true; b.tabIndex = -1; });
  }
  function unpeek(i) { const ov = peeks[i]; if (!ov) return; delete peeks[i]; ov.classList.remove('show'); setTimeout(() => ov.remove(), 220); }
  function closePeeks() { Object.keys(peeks).forEach(unpeek); }

  /* ---------- 이모지 응원 ---------- */
  let emoBound = false;
  function emoBar() {
    if (emoBound) return; emoBound = true;
    $('#stage').addEventListener('click', (ev) => {
      const b = ev.target.closest('#emo-bar [data-e]'); if (!b || !ONLINE || !G) return;
      if (Date.now() - emoAt < 1200) return; emoAt = Date.now();
      const mine = G.players.find(p => p.uid === me); if (!mine) return;
      Sound.sfx('tap');
      const v = { e: b.dataset.e, id: mine.id, u: me, t: Net.TS() };
      Net.push(R('emo'), v); emoPop({ ...v, t: Net.now() });
    });
  }
  function emoPop(v) {
    if (!EMOS.includes(v.e) || !G) return;
    const p = G.players.find(x => x.id === v.id); if (!p) return;
    const d = document.createElement('div'); d.className = 'emo-pop';
    d.style.setProperty('--x', rnd(12, 78) + '%'); d.style.setProperty('--pc', p.color);
    d.innerHTML = `<img src="${p.img}"><b>${esc(p.name)}</b><span>${v.e}</span>`;
    $('#stage').appendChild(d); setTimeout(() => d.remove(), 2600);
    const tk = tokEl(p);
    if (tk) { const s = document.createElement('div'); s.className = 'tok-emo'; s.textContent = v.e; tk.appendChild(s); setTimeout(() => s.remove(), 2200); }
  }

  function forget() { lsSet('oroom', null); offs.forEach(f => { try { f(); } catch (e) {} }); offs = []; }

  // 연결이 끊겨 새로 고친 경우 자동으로 다시 들어가기
  window.addEventListener('load', () => {
    if (sessionStorage.getItem('oauto') && lsGet('oroom')) { sessionStorage.removeItem('oauto'); setTimeout(() => resume(lsGet('oroom').code), 300); }
  });

  return { lobby, begin, emit, finalState, forget, away, get running() { return running; } };
})();
