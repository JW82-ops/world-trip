/* ===== 지안지아 세계일주 · 게임 진행 ===== */
let G = null;          // 저장되는 게임 상태
let rollWaiter = null; // 주사위 버튼 대기
let pickWaiter = null; // 우주여행 칸 고르기 대기
let rollLabel = '';     // 주사위 버튼 글자
let lastDice = [1, 1];  // 마지막 주사위 눈

/* ---------- 기본 계산 ---------- */
const cur = () => G.players[G.turn];
const isCoop = () => G.mode === 'coop';
const active = () => G.players.filter(p => !p.out);
const keyOf = (p) => p.id === 'rival' ? 'rival' : isCoop() ? 'team' : p.id;
const wallet = (p) => p.id === 'rival' ? G.rival : isCoop() ? G.team : p;
const ownerName = (k) => k === 'team' ? '우리 팀' : k === 'rival' ? RIVAL.name : (G.players.find(p => p.id === k) || {}).name;
const ownerColor = (k) => k === 'team' ? TEAM_COLOR : k === 'rival' ? RIVAL.color : (PEOPLE[k] || {}).color;
function tileData(i) { const t = BOARD[i]; if (t.t === 'city') return CITIES[t.id]; if (t.t === 'trans') return TRANSPORT[t.id]; return SPECIAL[t.t]; }
const isProp = (i) => BOARD[i].t === 'city' || BOARD[i].t === 'trans';
const buildCost = (i, lv) => Math.round(tileData(i).price * ECON.buildRate[lv - 1]);
function toll(i) {
  const d = tileData(i), o = G.own[i]; if (!o) return 0;
  if (BOARD[i].t === 'trans') { const cnt = Object.keys(G.own).filter(k => BOARD[k].t === 'trans' && G.own[k].o === o.o).length; return Math.round(d.price * ECON.transToll * cnt); }
  if (d.type === 'tour') return Math.round(d.price * ECON.tourToll);
  return Math.round(d.price * ECON.tollRate[o.lv]);
}
function propValue(i) { const o = G.own[i]; let v = tileData(i).price; for (let l = 1; l <= (o ? o.lv : 0); l++) v += buildCost(i, l); return v; }
function assets(k) {
  const w = k === 'team' ? G.team : k === 'rival' ? G.rival : G.players.find(p => p.id === k);
  let v = w.cash - (w.debt || 0);
  for (const i in G.own) if (G.own[i].o === k) v += propValue(+i);
  return v;
}
const hostOf = () => isCoop() ? null : G.players.find(p => p.out) || null;
const helpersOf = (p) => G.players.filter(o => o !== p && !o.out);
function log(t) { G.log.unshift(t); G.log = G.log.slice(0, 7); renderInfo(); }
function save() { if (G && !G.over) lsSet('save', G); }

/* ---------- 새 게임 ---------- */
function newGame(mode, ids, rounds) {
  const order = ['jia', 'jian', 'mom', 'dad'].filter(i => ids.includes(i));
  G = {
    mode, rounds, round: 1, turn: 0, fund: 0, over: false, own: {}, conq: {}, log: [],
    players: order.map(id => ({ id, pid: id, name: PEOPLE[id].name, level: PEOPLE[id].level, color: PEOPLE[id].color, img: PEOPLE[id].img,
      pos: 0, cash: ECON.startCash, island: 0, loanUsed: false, debt: 0, out: false, stamps: [], cards: { free: 0, half: 0 }, games: [] })),
    team: { cash: ECON.coopCash, loanUsed: false, debt: 0 },
    rival: { id: 'rival', name: RIVAL.name, color: RIVAL.color, emoji: RIVAL.emoji, pos: 0, cash: ECON.coopCash, island: 0, out: false, cpu: true },
  };
  startGameScreen();
}

/* ---------- 판 그리기 ---------- */
// 칸 번호 → [줄, 칸] (판 모양이 화면마다 달라요: 위·아래 A칸, 양옆 B칸)
const corners = () => { const { A, B } = LY(); return [0, A + 1, A + B + 2, 2 * A + B + 3]; };
function tilePos(i) {
  const { A, B } = LY(), [c0, c1, c2, c3] = corners();
  if (i <= c1) return [B + 1, A + 1 - i];
  if (i <= c2) return [B + 1 - (i - c1), 0];
  if (i <= c3) return [0, i - c2];
  return [i - c3, A + 1];
}
const sideOf = (i) => { const [c0, c1, c2, c3] = corners(); return i < c1 ? 1 : i < c2 ? 2 : i < c3 ? 3 : 4; };
function renderBoard() {
  const b = $('#board'); let h = '';
  BOARD.forEach((t, i) => {
    const [r, c] = tilePos(i), d = tileData(i);
    const corner = corners().includes(i);
    const side = sideOf(i); // 1:아래 2:왼쪽 3:위 4:오른쪽
    let inner = '';
    if (t.t === 'city') inner = `<img src="${d.img}" loading="lazy"><div class="tl-name">${d.short}</div><div class="tl-price">${d.price}만</div>${d.game ? `<div class="tl-game">${MINIGAMES[d.game].icon}</div>` : ''}${d.type === 'tour' ? '<div class="tl-tag">관광지</div>' : ''}`;
    else if (t.t === 'trans') inner = `<img src="${d.img}"><div class="tl-name">${d.icon} ${d.name}</div><div class="tl-price">${d.price}만</div>`;
    else inner = `<img src="${d.img}"><div class="tl-name sp">${d.short || d.name}</div>`;
    h += `<div class="tile s${side} ${corner ? 'corner' : ''} t-${t.t}" data-i="${i}" style="grid-row:${r + 1};grid-column:${c + 1};${t.t === 'city' ? `--sc:${SIDE_COLOR[d.side]}` : ''}">${inner}<div class="tl-own"></div><div class="tl-bld"></div></div>`;
  });
  h += `<div id="center"></div><div id="tokens"></div>`;
  b.innerHTML = h;
  $$('.tile', b).forEach(el => el.onclick = () => {
    const i = +el.dataset.i;
    if (pickWaiter) { if (i === 30) return; Sound.sfx('tap'); const w = pickWaiter; pickWaiter = null; b.classList.remove('picking'); w(i); return; }
    Sound.sfx('tap'); viewTile(i);
  });
  renderCenter(); renderOwners(); renderTokens(true);
}
function renderOwners() {
  $$('.tile').forEach(el => {
    const i = +el.dataset.i, o = G.own[i];
    el.classList.toggle('owned', !!o);
    el.style.setProperty('--oc', o ? ownerColor(o.o) : 'transparent');
    $('.tl-own', el).innerHTML = o ? `<span style="background:${ownerColor(o.o)}">${o.o === 'rival' ? '🦊' : o.o === 'team' ? '🤝' : ownerName(o.o)[1] || ownerName(o.o)[0]}</span>` : '';
    $('.tl-bld', el).textContent = o && o.lv ? BUILD_ICONS[o.lv] : '';
  });
}
function tileCenter(i) {
  const [r, c] = tilePos(i);
  const { c: C, eh, ev } = LY();
  const { A, B } = LY();
  const at = (k, E, N) => k === 0 ? C / 2 : k === N + 1 ? C + N * E + C / 2 : C + (k - 1) * E + E / 2;
  return [at(c, eh, A), at(r, ev, B)];
}
function tokensList() { const l = G.players.filter(p => !p.out).map(p => ({ id: p.id, pos: p.pos, img: p.img, color: p.color })); if (isCoop() && !G.rival.out) l.push({ id: 'rival', pos: G.rival.pos, emoji: '🦊', color: RIVAL.color }); return l; }
function renderTokens(instant) {
  const box = $('#tokens'); if (!box) return;
  const list = tokensList();
  $$('.tok', box).forEach(el => { if (!list.find(t => t.id === el.dataset.id)) el.remove(); });
  const byPos = {};
  list.forEach(t => { (byPos[t.pos] = byPos[t.pos] || []).push(t); });
  list.forEach(t => {
    let el = $(`.tok[data-id="${t.id}"]`, box);
    if (!el) { el = document.createElement('div'); el.className = 'tok'; el.dataset.id = t.id; el.innerHTML = `<div class="tsh"></div><div class="tb">${t.img ? `<img src="${t.img}">` : `<span class="fox">${t.emoji}</span>`}</div>`; el.style.setProperty('--c', t.color); box.appendChild(el); }
    const same = byPos[t.pos], k = same.indexOf(t), nn = same.length;
    const [x, y] = tileCenter(t.pos);
    const T = LY(), off = nn > 1 ? (k - (nn - 1) / 2) * T.tw * 0.5 : 0;
    if (instant) el.style.transition = 'none';
    el.style.left = (x + off - T.tw / 2) + 'px'; el.style.top = (y - T.th * 0.84 + (k % 2) * T.th * 0.13) + 'px';
    el.classList.toggle('me', G.players[G.turn] && G.players[G.turn].id === t.id);
    if (instant) { void el.offsetWidth; el.style.transition = ''; }
  });
}

/* ---------- 가운데 + 오른쪽 패널 ---------- */
function renderCenter() {
  const c = $('#center'); if (!c) return;
  c.innerHTML = `<div class="c-left">
      <button class="deck" id="c-deck"><img src="img/t_key.webp" class="k3"><img src="img/t_key.webp" class="k2"><img src="img/t_key.webp" class="k1"><span class="lbl">🔑 황금열쇠</span></button>
      <button class="piggy" id="c-pig"><img src="img/t_fund.webp"><span class="lbl" id="c-fund">🏦 기금</span></button>
    </div>
    <div class="c-stage"><div class="c-title" id="c-title"></div><div class="c-score" id="c-score"></div><div class="figs" id="c-figs"></div></div>
    <div class="c-dice"><div class="tray">${Dice3D.html('d1')}${Dice3D.html('d2')}<div class="dsum" id="dsum"></div></div>
      <button class="btn big yellow" id="btn-roll" disabled>🎲 굴리기!</button></div>
    <div class="c-menu" id="c-menu"></div>`;
  if (rollWaiter) { $('#btn-roll').disabled = false; $('#btn-roll').classList.add('pulse'); }
  if (rollLabel) $('#btn-roll').innerHTML = rollLabel;
  Dice3D.set($('#d1'), lastDice[0]); Dice3D.set($('#d2'), lastDice[1]);
  $('#btn-roll').onclick = () => { if (rollWaiter) { Sound.unlock(); Sound.sfx('tap'); const w = rollWaiter; rollWaiter = null; $('#btn-roll').disabled = true; w(); } };
  $('#c-deck').onclick = () => { Sound.sfx('card'); say(`<div class="sp-view"><img src="${SPECIAL.key.img}"><h2>🔑 황금열쇠</h2><p>황금열쇠 칸에 서면 카드를 한 장 뽑아요.<br>상금, 벌금, 보드게임 퀘스트, 불가사의 챌린지가 숨어 있어요!</p></div>`, '알겠어요!'); };
  $('#c-pig').onclick = () => { Sound.sfx('coin'); say(`<div class="sp-view"><img src="${SPECIAL.fundget.img}"><h2>🏦 사회복지기금 ${won(G.fund)}</h2><p>벌금과 기금은 여기에 모여요.<br>'기금 받기' 칸에 서는 사람이 몽땅 가져가요!</p></div>`, '알겠어요!'); };
  renderInfo();
}
function renderInfo() {
  if (!G) return;
  const p = G.players[G.turn];
  // 가운데 놀이 테이블: 제목 · 기금 · 받침대 위 가족
  const ttl = $('#c-title');
  if (ttl && p) ttl.innerHTML = `<b style="color:${p.color}">${p.name}</b> 차례!${p.island ? ' 🏝️' : ''} <small>${G.rounds ? `${Math.min(G.round, G.rounds)} / ${G.rounds}` : G.round} 라운드</small>`;
  const fd = $('#c-fund'); if (fd) fd.textContent = `🏦 기금 ${won(G.fund)}`;
  const sc = $('#c-score'); if (sc) sc.innerHTML = isCoop() ? `<span class="sc-t">🤝 우리 팀 💰 ${won(G.team.cash)}${G.team.debt ? ' · 빚' : ''}</span><span class="sc-r">🦊 ${won(G.rival.cash)}</span>` : '';
  const fg = $('#c-figs');
  if (fg) {
    let h = G.players.map(m => `<button class="fig ${m === p ? 'now' : ''} ${m.out ? 'out' : ''}" data-p="${m.id}" style="--pc:${m.color}">${m.island ? '<i class="fb">🏝️</i>' : ''}${m.out ? '<i class="fb">🎤</i>' : ''}<img src="${m.img}"><span class="ped"></span><span class="tag"><b>${m.name}</b><span>${isCoop() ? '📮 ' + m.stamps.length : won(m.cash)}</span></span></button>`).join('');
    if (isCoop() && !G.rival.out) h += `<button class="fig rival" data-p="rival" style="--pc:${RIVAL.color}"><span class="fox">🦊</span><span class="ped"></span><span class="tag"><b>여우</b><span>${won(G.rival.cash)}</span></span></button>`;
    fg.innerHTML = h; bindChips(fg);
  }
  const stg = $('#stage'), isTab = stg.classList.contains('L-tab'), isLand = stg.classList.contains('L-land'), isPort = stg.classList.contains('L-port');
  // 오른쪽
  const side = $('#side'); if (!side) return;
  const pc = (p) => {
    const k = keyOf(p), props = Object.keys(G.own).filter(i => G.own[i].o === k).length;
    return `<div class="pcard ${p === G.players[G.turn] ? 'now' : ''} ${p.out ? 'out' : ''}" style="--pc:${p.color}">
      <img src="${p.img}" class="pc-av"><div class="pc-main"><div class="pc-name">${p.name} <span class="lv">${PEOPLE[p.pid].title}</span>${p.out ? ' <span class="host">🎤 사회자</span>' : ''}${p.island ? ' 🏝️' : ''}</div>
      ${isCoop() ? `<div class="pc-sub">📮 도장 ${p.stamps.length} · 🎲 ${p.games.length}</div>` : `<div class="pc-cash">💰 ${won(p.cash)}${p.debt ? ` <span class="debt">빚 ${won(p.debt)}</span>` : ''}</div>
      <div class="pc-sub">🏙️ ${props}곳 · 📮 ${p.stamps.length} · 자산 ${won(assets(p.id))}${p.cards.free ? ' · 🛡️' : ''}${p.cards.half ? ' · 🎟️' : ''}</div>`}</div></div>`;
  };
  let h = `<div class="side-top"><span class="pill">${isCoop() ? '🤝 함께 세계일주' : '👨‍👩‍👧‍👧 가족 대결'}</span><span class="pill">🏦 기금 ${won(G.fund)}</span></div>`;
  if (isCoop()) {
    const tp = Object.keys(G.own).filter(i => G.own[i].o === 'team').length, rp = Object.keys(G.own).filter(i => G.own[i].o === 'rival').length;
    h += `<div class="teambox"><div class="tb"><b>🤝 우리 팀</b><div class="pc-cash">💰 ${won(G.team.cash)}${G.team.debt ? ` <span class="debt">빚 ${won(G.team.debt)}</span>` : ''}</div><div class="pc-sub">🏙️ ${tp}곳 · 자산 ${won(assets('team'))}</div></div>
      <div class="tb rival"><b>🦊 ${RIVAL.name}</b><div class="pc-cash">💰 ${won(G.rival.cash)}</div><div class="pc-sub">🏙️ ${rp}곳 · 자산 ${won(assets('rival'))}</div></div></div>`;
  }
  h += `<div class="pcs">${G.players.map(pc).join('')}</div>`;
  const menu = `<div class="side-btns"><button class="btn small white" data-m="book">📖 도시 도감</button><button class="btn small white" data-m="coupon">🎟️ 쿠폰함</button><button class="btn small white" data-m="set">⚙️</button><button class="btn small white" data-m="exit">🏠 나가기</button></div>`;
  const tab = isTab, land = isLand;
  side.innerHTML = tab ? h + menu : land ? '' : menu;
  const cm = $('#c-menu'); if (cm) cm.innerHTML = land ? `<div class="side-btns">${[['book', '📖'], ['coupon', '🎟️'], ['set', '⚙️'], ['exit', '🏠']].map(([k, e]) => `<button class="btn small white" data-m="${k}">${e}</button>`).join('')}</div>` : '';
  if (tab) $$('.pcard', side).forEach((el, k) => el.onclick = () => { Sound.sfx('tap'); showPlayer(G.players[k].id); });
  $$('[data-m]').forEach(b => b.onclick = async () => {
    Sound.sfx('tap'); const m = b.dataset.m;
    if (m === 'book') openBook(); else if (m === 'coupon') openCoupons(); else if (m === 'set') openSettings();
    else if (await ask('<h2>잠깐 쉴까요?</h2><p>지금까지 한 게임은 저장돼요. 다음에 \'이어하기\'로 계속할 수 있어요.</p>', [{ t: '처음 화면으로', v: true, cls: 'yellow' }, { t: '계속하기', v: false, cls: 'gray' }])) location.reload();
  });
}

/* ---------- 사람 칩 (폰) ---------- */
function chipsHtml() {
  const p = G.players[G.turn];
  const props = (k) => Object.keys(G.own).filter(i => G.own[i].o === k).length;
  let ch = '';
  if (isCoop()) {
    ch += `<button class="chip team" data-p="team"><span class="ce">🤝</span><span class="cn">우리 팀</span><span class="cc">💰 ${won(G.team.cash)}</span><span class="cs">🏙️ ${props('team')}곳${G.team.debt ? ' · 빚' : ''}</span></button>`;
    ch += `<button class="chip rival" data-p="rival"><span class="ce">🦊</span><span class="cn">여우 여행사</span><span class="cc">💰 ${won(G.rival.cash)}</span><span class="cs">🏙️ ${props('rival')}곳</span></button>`;
    ch += `<div class="mates">${G.players.map(m => `<button class="mate ${m === p ? 'now' : ''}" data-p="${m.id}" style="--pc:${m.color}"><img src="${m.img}"><span>📮${m.stamps.length}</span></button>`).join('')}</div>`;
  } else ch += G.players.map(m => `<button class="chip ${m === p ? 'now' : ''} ${m.out ? 'out' : ''}" data-p="${m.id}" style="--pc:${m.color}"><img src="${m.img}"><span class="cn">${m.name}${m.island ? '🏝️' : ''}${m.out ? '🎤' : ''}</span><span class="cc">💰 ${won(m.cash)}</span><span class="cs">🏙️ ${props(m.id)} · 📮 ${m.stamps.length}${m.debt ? ' · 빚' : ''}</span></button>`).join('');
  return ch;
}
function bindChips(root) { $$('[data-p]', root).forEach(b => b.onclick = () => { Sound.sfx('tap'); showPlayer(b.dataset.p); }); }

/* ---------- 사람 현황 자세히 ---------- */
function showPlayer(id) {
  const k = id === 'team' || id === 'rival' ? id : keyOf(G.players.find(x => x.id === id));
  const props = Object.keys(G.own).filter(i => G.own[i].o === k).map(Number).sort((a, b) => a - b);
  const plist = props.length ? props.map(i => { const d = tileData(i), o = G.own[i]; return `<span class="ptag" style="--sc:${BOARD[i].t === 'city' ? SIDE_COLOR[d.side] : '#7c5cff'}">${d.flag || d.icon} ${d.name} ${BUILD_ICONS[o.lv] || ''}</span>`; }).join('') : '<span class="muted">아직 없어요</span>';
  let head, body = '';
  if (id === 'rival') head = `<div class="pv-head"><span class="pv-emo" style="background:${RIVAL.color}">🦊</span><div><h2>${RIVAL.name}</h2><div class="pc-cash">💰 ${won(G.rival.cash)}</div><div class="muted">자산 ${won(assets('rival'))}</div></div></div>`;
  else if (id === 'team') head = `<div class="pv-head"><span class="pv-emo" style="background:${TEAM_COLOR}">🤝</span><div><h2>우리 팀</h2><div class="pc-cash">💰 ${won(G.team.cash)}${G.team.debt ? ` <span class="debt">빚 ${won(G.team.debt)}</span>` : ''}</div><div class="muted">자산 ${won(assets('team'))}${G.team.loanUsed ? ' · 대출 사용함' : ''}</div></div></div>`;
  else {
    const p = G.players.find(x => x.id === id);
    head = `<div class="pv-head"><img src="${p.img}"><div><h2 style="color:${p.color}">${p.name} <span class="lv">${PEOPLE[p.pid].title}</span>${p.out ? ' 🎤 사회자' : ''}</h2>
      ${isCoop() ? '' : `<div class="pc-cash">💰 ${won(p.cash)}${p.debt ? ` <span class="debt">빚 ${won(p.debt)}</span>` : ''}</div><div class="muted">자산 ${won(assets(p.id))}${p.loanUsed ? ' · 대출 사용함' : ''}</div>`}
      <div class="muted">${p.cards.free ? '🛡️ 면제권 ' + p.cards.free + ' ' : ''}${p.cards.half ? '🎟️ 반값 ' + p.cards.half + ' ' : ''}${p.island ? '🏝️ 무인도 ' : ''}</div></div></div>`;
    body = `<div class="pv-sec"><b>📮 여권 도장 ${p.stamps.length}개</b><div>${p.stamps.length ? p.stamps.map(c => `<span class="stamp">${CITIES[c].flag}<small>${CITIES[c].name}</small></span>`).join('') : '<span class="muted">아직 없어요</span>'}</div></div>
      <div class="pv-sec"><b>🎲 해 본 보드게임</b><div>${p.games.length ? p.games.map(g => `<span class="ptag">${MINIGAMES[g].icon} ${MINIGAMES[g].name}</span>`).join('') : '<span class="muted">아직 없어요</span>'}</div></div>`;
  }
  if (isCoop() && id !== 'rival' && id !== 'team') body = body; // 팀 땅은 팀 칩에서
  const showProps = !(isCoop() && id !== 'rival' && id !== 'team');
  modal(`${head}${showProps ? `<div class="pv-sec"><b>🏙️ 가진 땅 ${props.length}곳</b><div>${plist}</div></div>` : ''}${body}`, { close: true, box: 'pview' });
}

/* ---------- 도시 카드 (앞/뒤 뒤집기) ---------- */
const WMO = (c) => c === 0 ? ['☀️', '맑음'] : c <= 2 ? ['🌤️', '구름 조금'] : c === 3 ? ['☁️', '흐림'] : c <= 48 ? ['🌫️', '안개'] : c <= 57 ? ['🌦️', '이슬비'] : c <= 67 ? ['🌧️', '비'] : c <= 77 ? ['🌨️', '눈'] : c <= 82 ? ['🌦️', '소나기'] : c <= 86 ? ['🌨️', '눈'] : ['⛈️', '천둥번개'];
const liveCache = {};
async function liveWeather(c) {
  const k = 'w' + c.id; if (liveCache[k] && Date.now() - liveCache[k].t < 1800000) return liveCache[k].v;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&timezone=auto`);
  const j = await r.json(); const [e, t] = WMO(j.current.weather_code);
  const v = `${e} ${t} ${Math.round(j.current.temperature_2m)}°C`; liveCache[k] = { t: Date.now(), v }; return v;
}
let fx = null;
async function liveRate(c) {
  if (c.cur === 'KRW') return '우리나라 돈 \'원\'이에요!';
  if (!fx || Date.now() - fx.t > 3600000) { const r = await fetch('https://open.er-api.com/v6/latest/USD'); const j = await r.json(); fx = { t: Date.now(), r: j.rates }; }
  const per = fx.r.KRW / fx.r[c.cur]; if (!per) throw 0;
  if (per < 1) return `1,000${c.curName} = 약 ${Math.round(per * 1000).toLocaleString()}원`;
  if (c.cur === 'JPY') return `100엔 = 약 ${Math.round(per * 100).toLocaleString()}원`;
  return `1${c.curName} = 약 ${Math.round(per).toLocaleString()}원`;
}
const localTime = (tz) => { try { return new Intl.DateTimeFormat('ko-KR', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date()); } catch (e) { return '-'; } };
const TRANS_FACT = { jet: '초음속 여객기는 소리보다 빠르게 날았어요! 런던에서 뉴욕까지 3시간 반이면 갔대요.', cruise: '아주 큰 크루즈에는 수천 명이 타고, 수영장과 놀이터까지 있어요!', shuttle: '우주왕복선은 비행기처럼 땅에 내려앉아서 여러 번 다시 쓸 수 있는 우주선이었어요!' };

function cardHtml(i) {
  const t = BOARD[i], d = tileData(i), o = G && G.own[i];
  const sc = t.t === 'city' ? SIDE_COLOR[d.side] : '#7c5cff';
  let rows = '';
  if (t.t === 'city' && d.type !== 'tour') rows = `<tr><th>땅값</th><td>${d.price}만</td></tr><tr><th>통행료</th><td>땅 ${Math.round(d.price * ECON.tollRate[0])} · 🏠 ${Math.round(d.price * ECON.tollRate[1])} · 🏢 ${Math.round(d.price * ECON.tollRate[2])} · 🏨 ${Math.round(d.price * ECON.tollRate[3])}</td></tr>`;
  else if (t.t === 'city') rows = `<tr><th>땅값</th><td>${d.price}만</td></tr><tr><th>통행료</th><td>${Math.round(d.price * ECON.tourToll)}만 (관광지는 건물을 못 지어요)</td></tr>`;
  else rows = `<tr><th>값</th><td>${d.price}만</td></tr><tr><th>통행료</th><td>${Math.round(d.price * ECON.transToll)}만 × 가진 교통 수</td></tr>`;
  const owner = o ? `<div class="cd-owner" style="background:${ownerColor(o.o)}">주인: ${ownerName(o.o)} ${BUILD_ICONS[o.lv] || ''} ${o.lv ? BUILD_NAMES[o.lv] : ''} · 지금 통행료 ${toll(i)}만</div>` : '<div class="cd-owner free">아직 주인이 없어요</div>';
  const front = `<div class="cd-face cd-front" style="--sc:${sc}"><div class="cd-img"><img src="${d.img}"></div>
    <div class="cd-band">${t.t === 'city' ? `<span class="fl">${d.flag}</span>${d.name}<small>${d.country}</small>` : `${d.icon} ${d.name}`}</div>
    <table class="cd-tab">${rows}</table>${owner}<div class="cd-hint">👆 카드를 누르면 뒷면이 보여요</div></div>`;
  let back;
  if (t.t === 'city') back = `<div class="cd-face cd-back" style="--sc:${sc}">
    <div class="cdb-head">${d.flag} ${d.name} · ${d.country}<button class="btn tiny white" data-read>🔊</button></div>
    <div class="cdb-grid">
      <div class="ti"><i>🍽️</i><b>대표 음식</b><span>${d.foods.join(' · ')}</span></div>
      <div class="ti"><i>🌟</i><b>유명한 사람</b><span>${d.person[0]}<small>${d.person[1]}</small></span></div>
      <div class="ti"><i>🌡️</i><b>지금 날씨</b><span data-live="w">불러오는 중…</span></div>
      <div class="ti"><i>🕐</i><b>지금 시각</b><span>${localTime(d.tz)}</span></div>
      <div class="ti"><i>💱</i><b>돈 (${d.curName})</b><span data-live="fx">불러오는 중…</span></div>
      <div class="ti"><i>${d.animal[0]}</i><b>대표 동물</b><span>${d.animal[1]}</span></div>
      <div class="ti wide"><i>💬</i><b>인사말</b><span>${d.greet[0]} <small>${d.greet[1]}</small></span><button class="btn tiny white" data-greet>🔊</button></div>
    </div>
    <div class="cdb-fact">💡 ${d.fact}</div>${d.game ? `<div class="cdb-game">${MINIGAMES[d.game].icon} 이 도시의 보드게임: <b>${MINIGAMES[d.game].name}</b>${MINIGAMES[d.game].open ? '' : ' (곧 오픈)'}</div>` : ''}</div>`;
  else back = `<div class="cd-face cd-back" style="--sc:${sc}"><div class="cdb-head">${d.icon} ${d.name}</div><div class="cdb-fact big">💡 ${TRANS_FACT[t.id]}</div><div class="cdb-fact">교통 칸을 여러 개 가지면 통행료가 2배, 3배로 올라가요!</div></div>`;
  return `<div class="card3d"><div class="cd-inner">${front}${back}</div></div>`;
}
// opt.buttons: [{t,v,cls}] → 고른 값
function showCard(i, opt = {}) {
  return new Promise(res => {
    const d = tileData(i);
    const m = modal(`${opt.top || ''}${cardHtml(i)}${opt.note ? `<div class="cd-note">${opt.note}</div>` : ''}<div class="btns">${(opt.buttons || [{ t: '닫기', v: null, cls: 'gray' }]).map((b, k) => `<button class="btn ${b.cls || ''}" data-k="${k}" ${b.disabled ? 'disabled' : ''}>${b.t}</button>`).join('')}</div>`, { box: 'cardbox' });
    Sound.sfx('card');
    const inner = $('.cd-inner', m);
    $('.card3d', m).onclick = (e) => { if (e.target.closest('button')) return; Sound.sfx('card'); inner.classList.toggle('flip'); burst(m); };
    if (BOARD[i].t === 'city') {
      liveWeather(d).then(v => { const e = $('[data-live="w"]', m); if (e) e.textContent = v; }).catch(() => { const e = $('[data-live="w"]', m); if (e) e.textContent = '지금은 볼 수 없어요'; });
      liveRate(d).then(v => { const e = $('[data-live="fx"]', m); if (e) e.textContent = v; }).catch(() => { const e = $('[data-live="fx"]', m); if (e) e.textContent = '지금은 볼 수 없어요'; });
      $('[data-read]', m).onclick = () => Voice.say(`${d.name}. ${d.country}. 대표 음식은 ${d.foods.join(', ')}. 유명한 사람은 ${d.person[0]}, ${d.person[1]}. 대표 동물은 ${d.animal[1]}. ${d.fact}`);
      $('[data-greet]', m).onclick = () => { if (d.lang && Voice.has(d.lang) && !d.lang.startsWith('ko')) Voice.say(d.greet[1], d.lang, 0.85); else Voice.say(d.greet[0]); };
    }
    $$('.btns .btn', m).forEach(el => el.onclick = () => { Sound.sfx('tap'); m.close(); res((opt.buttons || [{ v: null }])[+el.dataset.k].v); });
  });
}
function burst(m) {
  const c = $('.card3d', m); for (let k = 0; k < 10; k++) { const b = document.createElement('i'); b.className = 'cube'; b.style.setProperty('--dx', rnd(-160, 160) + 'px'); b.style.setProperty('--dy', rnd(-200, 60) + 'px'); b.style.background = pick(['#ff5b5b', '#ffb020', '#2f86ff', '#22b573', '#ff5fa2']); c.appendChild(b); setTimeout(() => b.remove(), 700); }
}
function viewTile(i) {
  if (isProp(i)) return showCard(i);
  const d = tileData(i); say(`<div class="sp-view"><img src="${d.img}"><h2>${d.name}</h2><p>${d.desc}</p></div>`, '닫기', { btnCls: 'gray' });
}

/* ---------- 돈 ---------- */
function credit(k, amt) {
  if (k === 'fund') G.fund += amt;
  else if (k === 'team') G.team.cash += amt;
  else if (k === 'rival') G.rival.cash += amt;
  else if (k !== 'bank') { const p = G.players.find(x => x.id === k); if (p) p.cash += amt; }
}
function gain(p, amt, why) { wallet(p).cash += amt; Sound.sfx('coin'); toast(`💰 ${why ? why + ' ' : ''}+${won(amt)}`); renderInfo(); }
async function alarm(on) {
  const st = $('#stage'); st.classList.toggle('danger', on);
  if (on) { Sound.sfx('alarm'); for (let k = 0; k < 3; k++) { Sound.sfx('beat'); await sleep(600); } }
}
// 결과: true(냈음) / false(파산)
async function pay(p, amt, to, why = '') {
  const w = wallet(p);
  if (w.cash < amt) {
    if (p.id === 'rival') { credit(to, w.cash); w.cash = 0; await rivalBankrupt(); return false; }
    const ok = await crisis(p, amt - w.cash);
    if (!ok) { await bankrupt(p, to); return false; }
  }
  w.cash -= amt; credit(to, amt); Sound.sfx('pay');
  if (why) toast(`💸 ${why} -${won(amt)}`);
  renderInfo(); return true;
}
async function crisis(p, short) {
  const w = wallet(p);
  alarm(true);
  const who = isCoop() ? '우리 팀' : p.name;
  if (w.loanUsed) {
    await say(`<div class="crisis"><div class="cr-icon">⚠️</div><h2>파산 위기!</h2><p>${who}에게 <b>${won(short)}</b>이 부족해요.<br>은행 대출은 한 번만 받을 수 있는데, 이미 받았어요…</p></div>`, '어떡해…', { box: 'danger-box', btnCls: 'red' });
    alarm(false); return false;
  }
  const go = await ask(`<div class="crisis"><div class="cr-icon">⚠️</div><h2>파산 위기!</h2><p>${who}에게 <b>${won(short)}</b>이 부족해요!</p>
    <p class="big2">🆘 <b>구조 퀴즈 3문제</b>를 <u>모두</u> 맞히면<br>은행이 돈을 빌려줘요!</p><p class="muted">⏱️ 제한 시간이 있고, 이번에는 아무도 도와줄 수 없어요. (대출은 한 판에 한 번)</p></div>`,
    [{ t: '🆘 구조 퀴즈 도전!', v: true, cls: 'red' }], { box: 'danger-box' });
  alarm(false);
  const ok = go && await Quiz.series(p, 3, { hard: true, timer: Quiz.timerFor(p.level, true), title: '🆘 구조 퀴즈', host: hostOf() });
  if (!ok) return false;
  const loan = Math.ceil((short + 30) / 10) * 10;
  w.cash += loan; w.debt += loan; w.loanUsed = true;
  confetti(60);
  await say(`<h2>🏦 구조 성공!</h2><p>은행이 <b>${won(loan)}</b>을 빌려줬어요.<br>출발 칸을 지날 때마다 월급에서 ${won(ECON.loanRepay)}씩 갚아요.</p>`);
  log(`🏦 ${who} 대출 ${won(loan)}`); return true;
}
async function bankrupt(p, to) {
  const w = wallet(p);
  credit(to, w.cash); w.cash = 0;
  if (isCoop()) {
    await say(`<div class="crisis"><div class="cr-icon">💥</div><h2>우리 팀 파산…</h2><p>${RIVAL.name}에게 지고 말았어요. 다음엔 꼭 이겨요!</p></div>`, '다음엔 이길 거야!', { box: 'danger-box', btnCls: 'red' });
    return endGame('lose');
  }
  for (const i in G.own) if (G.own[i].o === p.id) delete G.own[i];
  p.out = true; p.island = 0; renderOwners(); renderTokens(); renderInfo();
  Sound.sfx('bad');
  await say(`<div class="crisis"><div class="cr-icon">💥</div><h2>${p.name} 파산!</h2><p>${p.name}의 땅은 모두 주인 없는 땅이 됐어요.<br>이제 <b>🎤 퀴즈 사회자</b>가 되어 다른 사람들에게 문제를 읽어 줘요!</p></div>`, '사회자 할게요 🎤', { box: 'danger-box' });
  log(`💥 ${p.name} 파산 → 🎤 사회자`);
  if (active().length <= 1) return endGame();
}

/* ---------- 쿠폰 ---------- */
const today = () => { const d = new Date(); return `${d.getMonth() + 1}/${d.getDate()}`; };
async function giveCoupon(pid, kind) {
  const kid = PEOPLE[pid].kid;
  let icon, name, from;
  if (kid) ({ icon, name, from } = COUPONS[kind]); else { [icon, name] = pick(PARENT_COUPONS); from = '아이들'; }
  const list = lsGet('coupons', []);
  list.push({ who: pid, icon, name, from, date: today(), used: false, id: Date.now() + rnd(0, 999) });
  lsSet('coupons', list);
  // 아이스크림 게임 쿠폰함에도 넣기 (같은 주소에서 열면 함께 보여요)
  if (kid) try {
    const k = 'subini-icecream-v1:' + pid, raw = localStorage.getItem(k);
    if (raw) { const o = JSON.parse(raw); if (o && Array.isArray(o.coupons)) { o.coupons.push({ icon, name: `${name}(세계일주)`, date: new Date().toISOString().slice(0, 10), used: false, id: Date.now() }); o.savedAt = Date.now(); localStorage.setItem(k, JSON.stringify(o)); } }
  } catch (e) {}
  confetti(120); Sound.sfx('win');
  Voice.say(`축하해요! ${name} 쿠폰!`);
  await say(`<div class="coupon-big"><div class="cp-top">🎟️ ${from}${from === '아빠' ? '가' : '이'} 주는 쿠폰</div><div class="cp-icon">${icon}</div><div class="cp-name">${name} 쿠폰!</div><div class="cp-who">받는 사람: <b>${PEOPLE[pid].name}</b></div><div class="muted">쿠폰함에 보관돼요. ${from}에게 보여 주세요!</div></div>`, '야호! 🎉');
}

/* ---------- 칸 도착 ---------- */
async function land(p) {
  const i = p.pos, t = BOARD[i];
  if (isProp(i)) return landProp(p, i);
  if (t.t === 'key') return goldenKey(p);
  if (t.t === 'island') { p.island = 3; Sound.sfx('bad'); renderInfo(); await say(`<div class="sp-view"><img src="${SPECIAL.island.img}"><h2>🏝️ 무인도에 갇혔어요!</h2><p>다음 차례부터 <b>탈출 퀴즈</b>를 맞히면 나갈 수 있어요. (최대 3번)</p></div>`, '구해 줘요!'); log(`🏝️ ${p.name} 무인도`); return; }
  if (t.t === 'space') return spaceTravel(p);
  if (t.t === 'fundget') return fundGet(p);
  if (t.t === 'fundpay') { await pay(p, ECON.fundPay, 'fund', '사회복지기금'); log(`🏦 ${p.name} 기금 ${won(ECON.fundPay)}`); }
}
function stamp(p, i) {
  const t = BOARD[i]; if (t.t !== 'city' || p.stamps.includes(t.id)) return;
  p.stamps.push(t.id); toast(`📮 여권 도장 쾅! <b>${CITIES[t.id].name}</b>`, 1500);
  const v = lsGet('visited', {}); v[t.id] = true; lsSet('visited', v);
}
async function landProp(p, i) {
  const d = tileData(i), k = keyOf(p), o = G.own[i], w = wallet(p);
  stamp(p, i);
  if (!o) {
    const can = w.cash >= d.price;
    const act = await showCard(i, { top: `<div class="cd-top">${p.name}${josa(p.name, '이', '가')} 도착했어요!</div>`, note: can ? `퀴즈를 맞히면 <b>${won(d.price)}</b>에 살 수 있어요!` : `돈이 ${won(d.price - w.cash)} 부족해서 살 수 없어요.`,
      buttons: [{ t: `🧠 퀴즈 풀고 사기 (${won(d.price)})`, v: 'buy', cls: 'yellow', disabled: !can }, { t: '그냥 지나가기', v: 'skip', cls: 'gray' }] });
    if (act === 'buy') {
      const r = await Quiz.ask(p, { title: `${d.name} 땅 사기 퀴즈`, city: BOARD[i].t === 'city' ? d.id : null, helpers: helpersOf(p), host: hostOf() });
      if (r.ok) {
        w.cash -= d.price; G.own[i] = { o: k, lv: 0 }; Sound.sfx('buy');
        if (r.helper) gain(r.helper, 3, `${r.helper.name} 도와주기 보너스`);
        renderOwners(); renderInfo(); toast(`🏙️ ${d.name}${josa(d.name, '을', '를')} 샀어요!`); log(`🏙️ ${p.name} ${d.name} 구입`);
        await checkConquer(p, d.side);
      } else { log(`😢 ${p.name} ${d.name} 구입 실패`); }
    }
  } else if (o.o === k) {
    if (BOARD[i].t === 'city' && d.type !== 'tour' && o.lv < 3) {
      const nl = o.lv + 1, cost = buildCost(i, nl), can = w.cash >= cost, hard = nl === 3;
      const act = await showCard(i, { top: `<div class="cd-top">우리 땅이에요! ${BUILD_ICONS[nl]} ${BUILD_NAMES[nl]}을(를) 지을까요?</div>`, note: `${BUILD_ICONS[nl]} ${BUILD_NAMES[nl]} 짓기: ${won(cost)} → 통행료 ${Math.round(d.price * ECON.tollRate[nl])}만으로!${hard ? '<br>🏨 호텔은 <b>어려운 퀴즈</b>를 맞혀야 지을 수 있어요!' : ''}`,
        buttons: [{ t: `🧠 퀴즈 풀고 짓기 (${won(cost)})`, v: 'build', cls: 'yellow', disabled: !can }, { t: '다음에', v: 'skip', cls: 'gray' }] });
      if (act === 'build') {
        const r = await Quiz.ask(p, { title: `${BUILD_NAMES[nl]} 짓기 퀴즈`, hard, city: d.id, helpers: hard ? [] : helpersOf(p), host: hostOf() });
        if (r.ok) { w.cash -= cost; o.lv = nl; Sound.sfx('buy'); if (r.helper) gain(r.helper, 3, `${r.helper.name} 도와주기 보너스`); renderOwners(); renderInfo(); toast(`${BUILD_ICONS[nl]} ${d.name}에 ${BUILD_NAMES[nl]} 완성!`); log(`${BUILD_ICONS[nl]} ${p.name} ${d.name} ${BUILD_NAMES[nl]}`); }
      }
    } else toast(`🏠 우리 땅 ${d.name}에서 쉬어 가요`);
  } else {
    let fee = toll(i);
    const pc = p.cards || { free: 0, half: 0 };
    const btns = [{ t: `🧠 퀴즈 맞히면 반값! (${won(Math.ceil(fee / 2))})`, v: 'quiz', cls: 'yellow' }, { t: `그냥 내기 (${won(fee)})`, v: 'pay', cls: 'gray' }];
    if (pc.free) btns.unshift({ t: '🛡️ 통행료 면제권 쓰기', v: 'free', cls: 'green' });
    if (pc.half) btns.unshift({ t: '🎟️ 반값 쿠폰 쓰기', v: 'half', cls: 'blue' });
    const act = await showCard(i, { top: `<div class="cd-top warn">${ownerName(o.o)}의 땅이에요! 통행료를 내야 해요.</div>`, note: `통행료 <b>${won(fee)}</b> · 지금 가진 돈 ${won(w.cash)}`, buttons: btns });
    if (act === 'free') { pc.free--; toast('🛡️ 면제권으로 통과!'); log(`🛡️ ${p.name} 통행료 면제`); }
    else {
      if (act === 'half') { pc.half--; fee = Math.ceil(fee / 2); }
      else if (act === 'quiz') { const r = await Quiz.ask(p, { title: '통행료 반값 퀴즈', city: BOARD[i].t === 'city' ? d.id : null, helpers: helpersOf(p), host: hostOf() }); if (r.ok) { fee = Math.ceil(fee / 2); if (r.helper) gain(r.helper, 3, `${r.helper.name} 도와주기 보너스`); toast('🎉 통행료 반값!'); } }
      const ok = await pay(p, fee, o.o, `${ownerName(o.o)}에게 통행료`);
      if (ok) log(`💸 ${p.name} → ${ownerName(o.o)} ${won(fee)}`);
      if (!ok || G.over) return;
    }
  }
  if (d.game && !G.over && !p.out) await offerGame(p, d.game);
}
async function offerGame(p, gid, forced) {
  const g = MINIGAMES[gid];
  if (!forced) {
    if (!g.open) { toast(`${g.icon} ${g.name} 퀘스트는 다음 업데이트에서 열려요!`, 2000); return; }
    const go = await ask(`<h2>🎲 보드게임 퀘스트!</h2><p>${CITIES[g.city].name}에서 유명한 <b>${g.icon} ${g.name}</b>에 도전할까요?<br>이기면 <b>${won(ECON.gameWin)}</b> 상금!</p>`, [{ t: '도전!', v: true, cls: 'yellow' }, { t: '다음에', v: false, cls: 'gray' }]);
    if (!go) return;
  }
  const others = isCoop() ? [] : G.players.filter(o => o !== p && !o.out);
  const r = await Mini.play(gid, { player: p, others, coop: isCoop(), rival: { ...G.rival } });
  if (!r) return;
  if (!p.games.includes(gid)) p.games.push(gid);
  const winner = r.winner && r.winner !== 'rival' && r.winner !== 'cpu' ? G.players.find(x => x.id === r.winner) : null;
  if (winner) { wallet(winner).cash += ECON.gameWin; log(`🎲 ${winner.name} ${g.name} 승리 +${won(ECON.gameWin)}`); toast(`🏆 ${isCoop() ? '우리 팀' : winner.name} ${g.name} 승리! +${won(ECON.gameWin)}`); }
  else if (r.draw) { wallet(p).cash += 5; toast(`🤝 비겨서 +${won(5)}`); }
  else if (r.winner === 'rival') { G.rival.cash += 10; log(`🦊 ${RIVAL.name} ${g.name} 승리`); }
  renderInfo();
}
async function checkConquer(p, side) {
  const k = keyOf(p);
  const tiles = BOARD.map((t, i) => i).filter(i => BOARD[i].t === 'city' && CITIES[BOARD[i].id].side === side && CITIES[BOARD[i].id].type === 'city');
  if (!tiles.every(i => G.own[i] && G.own[i].o === k) || G.conq[k + side]) return;
  G.conq[k + side] = true; confetti(150); Sound.sfx('win');
  wallet(p).cash += 30;
  await say(`<h2>🌏 대륙 정복!</h2><p><b>${SIDE_NAME[side]}</b>의 도시를 모두 모았어요! 상금 ${won(30)}!</p>`, '최고! 🎉');
  if (isCoop()) { for (const kid of G.players.filter(x => PEOPLE[x.pid].kid)) await giveCoupon(kid.pid, 'conq'); }
  else await giveCoupon(p.pid, 'conq');
}
async function fundGet(p) {
  const amt = G.fund; G.fund = 0;
  if (amt) { wallet(p).cash += amt; Sound.sfx('coin'); }
  renderInfo();
  const kid = PEOPLE[p.pid].kid;
  const go = await ask(`<div class="sp-view"><img src="${SPECIAL.fundget.img}"><h2>🏦 사회복지기금 도착!</h2><p>모인 기금 <b>${won(amt)}</b>을 받았어요!</p>
    <p class="big2">🎟️ <b>${kid ? '아빠 쿠폰' : '아이들 쿠폰'} 찬스!</b><br>어려운 퀴즈 1문제를 시간 안에 맞히면 ${kid ? '🍬 사탕 쿠폰' : '아이들이 주는 쿠폰'}!</p></div>`, [{ t: '도전!', v: true, cls: 'yellow' }, { t: '안 할래요', v: false, cls: 'gray' }]);
  log(`🏦 ${p.name} 기금 ${won(amt)} 받음`);
  if (!go) return;
  const r = await Quiz.ask(p, { title: '🎟️ 쿠폰 찬스', hard: true, timer: Quiz.timerFor(p.level, true), host: hostOf() });
  if (r.ok) await giveCoupon(p.pid, 'fund');
}
async function spaceTravel(p) {
  await say(`<div class="sp-view"><img src="${SPECIAL.space.img}"><h2>🚀 우주여행!</h2><p>판에서 <b>가고 싶은 칸</b>을 눌러 주세요!</p></div>`, '고를게요!');
  $('#board').classList.add('picking'); toast('🚀 가고 싶은 칸을 눌러요!', 2500);
  const target = await new Promise(r => pickWaiter = r);
  const sh = BOARD.findIndex(t => t.id === 'shuttle'), so = G.own[sh];
  if (so && so.o !== keyOf(p)) { const ok = await pay(p, 10, so.o, '우주왕복선 이용료'); if (!ok || G.over) return; }
  await moveTo(p, target, true);
  await land(p);
}

/* ---------- 황금열쇠 ---------- */
const KEYS = [
  { e: '🎁', t: '여행 상금', d: `여행 이야기 대회에서 1등! ${won(15)}을 받아요.`, good: 1, w: 3, f: async (p) => gain(p, 15) },
  { e: '🎂', t: '생일 축하!', d: '모두가 생일 선물을 줘요!', good: 1, w: 2, f: async (p) => { if (isCoop()) gain(p, 10); else { let s = 0; for (const o of active()) if (o !== p) { const v = Math.min(3, o.cash); o.cash -= v; s += v; } gain(p, s, '선물'); } } },
  { e: '🚓', t: '과속 벌금', d: `여행 버스가 너무 빨리 달렸어요. ${won(8)}을 기금에 내요.`, good: 0, w: 2, f: async (p) => { await pay(p, 8, 'fund', '벌금'); } },
  { e: '🤧', t: '감기 병원비', d: `여행 중 감기에 걸렸어요. ${won(6)}을 기금에 내요.`, good: 0, w: 2, f: async (p) => { await pay(p, 6, 'fund', '병원비'); } },
  { e: '💝', t: '착한 기부', d: `어려운 친구들을 도와요. ${won(5)}을 기금에 내요.`, good: 0, w: 1, f: async (p) => { await pay(p, 5, 'fund', '기부'); } },
  { e: '🔧', t: '건물 수리비', d: `건물 1개마다 ${won(3)}씩 수리비를 내요.`, good: 0, w: 1, f: async (p) => { let n = 0; for (const i in G.own) if (G.own[i].o === keyOf(p)) n += G.own[i].lv; if (n) await pay(p, n * 3, 'fund', `수리비(건물 ${n}개)`); else toast('건물이 없어서 수리비 0원!'); } },
  { e: '🏁', t: '출발로!', d: '출발 칸으로 이동해서 월급을 받아요!', good: 1, w: 2, f: async (p) => { await moveTo(p, 0, true); } },
  { e: '🚀', t: '우주로!', d: '우주여행 칸으로 이동해요!', good: 1, w: 1, f: async (p) => { await moveTo(p, 30, true); await land(p); } },
  { e: '🏝️', t: '무인도로…', d: '배가 고장 났어요! 무인도로 가요.', good: 0, w: 1, f: async (p) => { p.pos = 10; renderTokens(); await land(p); } },
  { e: '🇰🇷', t: '서울 구경', d: '서울로 여행을 떠나요!', good: 1, w: 1, f: async (p) => { await moveTo(p, 39, true); await land(p); } },
  { e: '↩️', t: '뒤로 3칸', d: '깜빡한 물건이 있어요! 뒤로 3칸.', good: 0, w: 1, f: async (p) => { p.pos = (p.pos + 37) % 40; renderTokens(); Sound.sfx('step'); await sleep(400); await land(p); } },
  { e: '🎲', t: '보드게임 퀘스트', d: '세계의 보드게임에 도전해요!', good: 1, w: 3, f: async (p) => { const ids = Object.keys(MINIGAMES).filter(k => MINIGAMES[k].open); await offerGame(p, pick(ids), true); } },
  { e: '🧠', t: '퀴즈 챌린지', d: `3문제를 연속으로 맞히면 ${won(25)}!`, good: 1, w: 2, f: async (p) => { if (await Quiz.series(p, 3, { title: '🧠 퀴즈 챌린지', host: hostOf() })) gain(p, 25, '챌린지 성공'); else toast('아쉬워요! 다음 기회에'); } },
  { e: '🛡️', t: '통행료 면제권', d: '다음에 통행료를 한 번 안 내도 돼요. (보관)', good: 1, w: 1, f: async (p) => { p.cards.free++; } },
  { e: '🎟️', t: '통행료 반값 쿠폰', d: '통행료를 한 번 반값으로! (보관)', good: 1, w: 2, f: async (p) => { p.cards.half++; } },
  { e: '🏛️', t: '세계 불가사의 챌린지', d: '보스 문제 5개를 시간 안에 연속으로! 성공하면 큰 쿠폰!', good: 1, w: 1, f: async (p) => {
    const ok = await Quiz.series(p, 5, { title: '🏛️ 불가사의', hard: true, timer: Quiz.timerFor(p.level, true), host: hostOf() });
    if (ok) { gain(p, 40, '불가사의 정복'); await giveCoupon(p.pid, 'wonder'); } else toast('불가사의는 역시 어려워요! 다음에 다시!'); } },
  { e: '🍀', t: '복권 당첨!', d: `와! 복권에 당첨됐어요. ${won(30)}!`, good: 1, w: 1, f: async (p) => gain(p, 30, '복권') },
];
async function goldenKey(p) {
  let deck = KEYS;
  const lucky = !isCoop() && isLast(p);
  if (lucky) deck = KEYS.filter(k => k.good);
  const bag = []; deck.forEach(k => { for (let n = 0; n < k.w; n++) bag.push(k); });
  const c = pick(bag);
  Sound.sfx('card');
  const m = modal(`<div class="gk"><div class="gk-card"><div class="gk-in"><div class="gk-back"><img src="${SPECIAL.key.img}"><b>황금열쇠</b></div>
    <div class="gk-front ${c.good ? 'good' : 'bad'}"><div class="gk-e">${c.e}</div><h2>${c.t}</h2><p>${c.d}</p>${lucky ? '<div class="lucky">🍀 꼴찌 행운! 좋은 카드만 나와요</div>' : ''}</div></div></div></div><div class="btns"><button class="btn yellow" disabled>확인</button></div>`, { box: 'gkbox' });
  await sleep(700); $('.gk-in', m).classList.add('flip'); Sound.sfx(c.good ? 'good' : 'bad');
  if (p.level === 1) Voice.say(`${c.t}! ${c.d}`);
  await sleep(500);
  const b = $('.btns .btn', m); b.disabled = false;
  await new Promise(r => b.onclick = () => { Sound.sfx('tap'); m.close(); r(); });
  log(`🔑 ${p.name}: ${c.t}`);
  await c.f(p); renderInfo();
}
function isLast(p) {
  const act = active(); if (act.length < 2) return false;
  const a = assets(p.id), mx = Math.max(...act.map(o => assets(o.id)));
  return act.every(o => assets(o.id) >= a) && mx - a >= 40;
}

/* ---------- 이동 ---------- */
async function passStart(p) {
  const w = wallet(p); let s = ECON.salary;
  if (w.debt) { const r = Math.min(w.debt, ECON.loanRepay, s); w.debt -= r; s -= r; toast(`🏁 월급 ${won(ECON.salary)} (대출 갚기 -${won(r)})`); }
  else toast(`🏁 출발! 월급 +${won(s)}`);
  w.cash += s; Sound.sfx('coin'); renderInfo();
}
const tokEl = (p) => $(`#tokens .tok[data-id="${p.id}"]`);
async function stepTo(p, n) {
  const el = tokEl(p), x0 = el ? parseFloat(el.style.left) : 0;
  p.pos = n; renderTokens(); Sound.sfx('step');
  if (el) hopEl(el, parseFloat(el.style.left) - x0); if (p.pos === 0 && p.id !== 'rival') await passStart(p); else if (p.pos === 0) { G.rival.cash += ECON.salary; } }
async function moveBy(p, n) { for (let s = 0; s < n; s++) { await stepTo(p, (p.pos + 1) % 40); await sleep(420); } hopEl(tokEl(p), 0, true); Sound.sfx('coin'); await sleep(450); }
async function moveTo(p, target, salary) { let guard = 0; while (p.pos !== target && guard++ < 40) { const nx = (p.pos + 1) % 40; if (!salary && nx === 0) { p.pos = 0; renderTokens(); } else await stepTo(p, nx); await sleep(260); } hopEl(tokEl(p), 0, true); await sleep(400); }
async function rollDice() {
  const d1 = rnd(1, 6), d2 = rnd(1, 6); lastDice = [d1, d2];
  Sound.sfx('dice'); $('#dsum').className = 'dsum';
  await Promise.all([Dice3D.roll($('#d1'), d1, 1250), sleep(90).then(() => Dice3D.roll($('#d2'), d2, 1250))]);
  const sm = $('#dsum'); sm.innerHTML = `${d1 + d2}${d1 === d2 ? '<small>더블!</small>' : ''}`; sm.className = 'dsum show';
  Sound.sfx('card'); await sleep(550); return [d1, d2];
}
const waitRoll = () => new Promise(r => { rollWaiter = r; const b = $('#btn-roll'); b.disabled = false; b.classList.add('pulse'); });

/* ---------- 차례 ---------- */
async function islandTurn(p) {
  const day = 4 - p.island;
  const go = await ask(`<div class="sp-view"><img src="${SPECIAL.island.img}"><h2>🏝️ 무인도 ${day}일째</h2><p>탈출 퀴즈를 맞히면 바로 주사위를 굴릴 수 있어요!</p></div>`, [{ t: '🧠 탈출 퀴즈!', v: true, cls: 'yellow' }]);
  const r = await Quiz.ask(p, { title: '무인도 탈출 퀴즈', host: hostOf() });
  if (r.ok) { p.island = 0; toast('🚤 탈출 성공!'); renderInfo(); return true; }
  p.island--; renderInfo();
  if (!p.island) toast('다음 차례에는 무인도를 떠나요!'); else toast(`🏝️ 아직 무인도… (남은 ${p.island}번)`);
  return false;
}
async function takeTurn() {
  const p = cur();
  renderInfo(); renderTokens();
  rollLabel = `🎲 ${p.name} 굴리기!`; $('#btn-roll').innerHTML = rollLabel;
  if (p.level === 1 || SET.voice) Voice.say(`${p.name} 차례!`);
  if (p.island > 0) { const esc = await islandTurn(p); if (!esc) return; }
  let doubles = 0;
  while (true) {
    await waitRoll(); $('#btn-roll').classList.remove('pulse');
    const [a, b] = await rollDice();
    log(`🎲 ${p.name} ${a}+${b}=${a + b}${a === b ? ' 더블!' : ''}`);
    await moveBy(p, a + b);
    await land(p); renderInfo(); renderTokens();
    if (G.over || p.out) return;
    if (a === b && !p.island && doubles < 1) { doubles++; toast('🎲 더블! 한 번 더 굴려요!', 1600); continue; }
    break;
  }
}
async function rivalTurn() {
  const r = G.rival; if (r.out) return;
  if (r.island > 0) { r.island--; log('🦊 여우 여행사는 무인도에서 쉬어요'); return; }
  rollLabel = '🦊 여우 여행사 차례…'; $('#btn-roll').innerHTML = rollLabel;
  await sleep(600);
  const [a, b] = await rollDice();
  log(`🦊 ${a}+${b}=${a + b}`);
  await moveBy(r, a + b);
  await rivalLand(r);
  renderInfo(); renderTokens(); await sleep(500);
}
async function rivalLand(r) {
  const i = r.pos, t = BOARD[i];
  if (isProp(i)) {
    const d = tileData(i), o = G.own[i];
    if (!o) { if (r.cash >= d.price + 40 && Math.random() < 0.75) { r.cash -= d.price; G.own[i] = { o: 'rival', lv: 0 }; renderOwners(); toast(`🦊 여우 여행사가 ${d.name}${josa(d.name, '을', '를')} 샀어요!`); log(`🦊 ${d.name} 구입`); } }
    else if (o.o === 'rival') { if (t.t === 'city' && d.type !== 'tour' && o.lv < 3) { const c = buildCost(i, o.lv + 1); if (r.cash >= c + 60 && Math.random() < 0.6) { r.cash -= c; o.lv++; renderOwners(); toast(`🦊 ${d.name}에 ${BUILD_NAMES[o.lv]} ${BUILD_ICONS[o.lv]}`); log(`🦊 ${d.name} ${BUILD_NAMES[o.lv]}`); } } }
    else { const fee = toll(i); toast(`🎉 여우 여행사가 우리 땅 ${d.name}에서 통행료 ${won(fee)}!`, 2000); log(`💰 🦊 → 우리 팀 ${won(fee)}`); await pay(r, fee, 'team'); }
  } else if (t.t === 'key') { const v = pick([15, 10, -8, -6, 20, -5]); if (v > 0) { r.cash += v; toast(`🦊 황금열쇠: +${won(v)}`); } else { toast(`🦊 황금열쇠: ${won(v)}`); await pay(r, -v, 'fund'); } }
  else if (t.t === 'island') { r.island = 2; toast('🦊 여우 여행사가 무인도에 갇혔어요!'); }
  else if (t.t === 'space') { const tg = rnd(31, 39); await moveTo(r, tg, true); await rivalLand(r); }
  else if (t.t === 'fundget') { r.cash += G.fund; if (G.fund) toast(`🦊 기금 ${won(G.fund)}을 가져갔어요`); G.fund = 0; }
  else if (t.t === 'fundpay') await pay(r, ECON.fundPay, 'fund');
}
async function rivalBankrupt() {
  G.rival.out = true;
  for (const i in G.own) if (G.own[i].o === 'rival') delete G.own[i];
  renderOwners(); renderTokens();
  await endGame('win');
}
function nextTurn() {
  if (G.over) return;
  const n = G.players.length;
  let t = G.turn;
  for (let k = 0; k < n; k++) {
    t = (t + 1) % n;
    if (t === 0) G.round++;
    if (!G.players[t].out) break;
  }
  G.turn = t;
}
async function loop() {
  while (!G.over) {
    await takeTurn();
    if (G.over) break;
    const before = G.round;
    nextTurn();
    if (isCoop() && G.round > before) { for (let k = 0; k < Math.max(1, Math.floor(G.players.length / 2)) && !G.over; k++) await rivalTurn(); }
    if (G.over) break;
    if (G.rounds && G.round > G.rounds) { await endGame(isCoop() ? (assets('team') >= assets('rival') ? 'win' : 'lose') : undefined); break; }
    if (G.rounds && G.round === G.rounds && G.turn === G.players.findIndex(p => !p.out) && G.round > before) toast('🔔 마지막 라운드예요!', 2200);
    save(); renderInfo();
  }
}

/* ---------- 끝 ---------- */
async function endGame(result) {
  if (G.over) return; G.over = true;
  lsSet('save', null);
  confetti(160); Sound.sfx('win');
  let html;
  if (isCoop()) {
    const win = result === 'win';
    html = `<div class="end"><h1>${win ? '🌏 세계일주 성공!' : '🦊 여우 여행사 승리…'}</h1>
      <p>우리 팀 자산 <b>${won(assets('team'))}</b> · 여우 여행사 <b>${G.rival.out ? '파산!' : won(assets('rival'))}</b></p>
      <div class="podium">${G.players.map(p => `<div class="pod"><img src="${p.img}"><b>${p.name}</b><span>📮 ${p.stamps.length}곳</span></div>`).join('')}</div>
      <p>${win ? '모두 힘을 합쳐서 해냈어요! 👏' : '다음엔 꼭 이길 수 있어요! 💪'}</p></div>`;
  } else {
    const rank = [...G.players].sort((a, b) => (a.out - b.out) || assets(b.id) - assets(a.id));
    const top = rank[0];
    Voice.say(`${top.name} 우승! 축하해요!`);
    html = `<div class="end"><h1>🏆 ${top.name} 우승!</h1>
      <div class="podium">${rank.map((p, k) => `<div class="pod r${k + 1}"><div class="medal">${['🥇', '🥈', '🥉', '🎖️'][k]}</div><img src="${p.img}"><b>${p.name}</b><span>${p.out ? '파산(사회자 🎤)' : '자산 ' + won(assets(p.id))}</span><span>📮 도장 ${p.stamps.length}개</span></div>`).join('')}</div></div>`;
  }
  const rec = lsGet('records', []); rec.unshift({ date: today(), mode: G.mode, result: isCoop() ? result : G.players.slice().sort((a, b) => (a.out - b.out) || assets(b.id) - assets(a.id))[0].name }); lsSet('records', rec.slice(0, 20));
  await say(html, '처음 화면으로', { box: 'wide' });
  location.reload();
}

/* ---------- 화면 ---------- */
function startGameScreen() {
  $('#scr-title').classList.remove('on'); $('#scr-setup').classList.remove('on'); $('#scr-game').classList.add('on');
  renderBoard(); renderInfo(); save();
  loop();
}
function openBook() {
  const v = lsGet('visited', {});
  const ids = BOARD.map((t, i) => i).filter(i => BOARD[i].t === 'city');
  const m = modal(`<h2>📖 도시 도감 <small>${Object.keys(v).length} / ${ids.length} 도시 방문</small></h2><div class="book">${ids.map(i => { const c = tileData(i); return `<button data-i="${i}" class="${v[c.id] ? 'seen' : ''}" style="--sc:${SIDE_COLOR[c.side]}"><img src="${c.img}"><span>${c.flag} ${c.name}</span>${v[c.id] ? '<i>📮</i>' : ''}</button>`; }).join('')}</div>`, { close: true, box: 'wide' });
  $$('.book button', m).forEach(b => b.onclick = () => { Sound.sfx('tap'); showCard(+b.dataset.i); });
}
function openCoupons() {
  const draw = () => {
    const list = lsGet('coupons', []);
    const by = ['jian', 'jia', 'mom', 'dad'].map(k => ({ k, l: list.filter(c => c.who === k) }));
    return by.map(({ k, l }) => `<div class="cp-row"><div class="cp-p"><img src="${PEOPLE[k].img}">${PEOPLE[k].name}</div><div class="cp-list">${l.length ? l.map(c => `<div class="cp ${c.used ? 'used' : ''}"><span class="i">${c.icon}</span><b>${c.name}</b><small>${c.from} · ${c.date}</small>${c.used ? '<em>사용 완료</em>' : `<button class="btn tiny" data-use="${c.id}">사용하기</button>`}</div>`).join('') : '<span class="muted">아직 쿠폰이 없어요</span>'}</div></div>`).join('');
  };
  const m = modal(`<h2>🎟️ 쿠폰함</h2><p class="muted">아이들 쿠폰은 아이스크림 게임 쿠폰함에도 같이 들어가요. 쓸 때는 엄마·아빠 확인이 필요해요.</p><div id="cpbox">${draw()}</div>`, { close: true, box: 'wide' });
  const bind = () => $$('[data-use]', m).forEach(b => b.onclick = async () => {
    const a = rnd(12, 19), c = rnd(6, 9);
    const m2 = modal(`<h2>👨 엄마·아빠 확인</h2><p class="big2">${a} × ${c} = ?</p><input id="pw" type="number" inputmode="numeric" class="pin"><div class="btns"><button class="btn yellow" id="ok">확인</button><button class="btn gray" id="no">취소</button></div>`);
    $('#pw', m2).focus();
    $('#no', m2).onclick = () => m2.close();
    $('#ok', m2).onclick = () => {
      if (+$('#pw', m2).value === a * c) { const l = lsGet('coupons', []); const it = l.find(x => String(x.id) === b.dataset.use); if (it) it.used = true; lsSet('coupons', l); Sound.sfx('good'); toast('쿠폰 사용 완료!'); m2.close(); $('#cpbox', m).innerHTML = draw(); bind(); }
      else { Sound.sfx('bad'); toast('어른만 풀 수 있어요! 🙈'); }
    };
  });
  bind();
}
function openSettings() {
  const m = modal(`<h2>⚙️ 설정</h2><div class="setrow"><span>🎵 효과음</span><button class="btn small ${SET.sound ? 'green' : 'gray'}" id="s1">${SET.sound ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow"><span>🔊 읽어 주기 목소리</span><button class="btn small ${SET.voice ? 'green' : 'gray'}" id="s2">${SET.voice ? '켜짐' : '꺼짐'}</button></div>
    <div class="setrow"><span>📖 게임 방법</span><button class="btn small white" id="s3">보기</button></div>`, { close: true });
  $('#s1', m).onclick = () => { SET.sound = !SET.sound; saveSet(); m.close(); openSettings(); };
  $('#s2', m).onclick = () => { SET.voice = !SET.voice; saveSet(); m.close(); openSettings(); };
  $('#s3', m).onclick = () => { m.close(); howTo(); };
}
function howTo() {
  say(`<h2>📖 게임 방법</h2><div class="howto">
    <p>🎲 주사위를 굴려 세계를 한 바퀴씩 돌아요. <b>출발</b>을 지나면 월급 ${won(ECON.salary)}!</p>
    <p>🏙️ 주인 없는 도시에 서면 <b>퀴즈를 맞혀야</b> 살 수 있어요. 내 도시에 다시 오면 🏠별장 → 🏢빌딩 → 🏨호텔!</p>
    <p>💸 남의 도시에 서면 통행료! 퀴즈를 맞히면 <b>반값</b>이에요.</p>
    <p>🔑 황금열쇠, 🏝️ 무인도(탈출 퀴즈), 🚀 우주여행(원하는 칸으로), 🏦 사회복지기금(모인 돈 + 쿠폰 찬스)</p>
    <p>⚠️ 돈이 모자라면 <b>구조 퀴즈 3문제</b>를 모두 맞혀야 대출! 못 맞히면 파산하고 🎤 사회자가 돼요.</p>
    <p>🎲 🐍🃏⭕🎴 표시가 있는 도시에서는 그 나라의 <b>보드게임 퀘스트</b>!</p>
    <p>🃏 판의 칸을 누르면 도시 카드를 볼 수 있어요. 카드를 누르면 뒷면에 음식·날씨·환율·인사말이!</p></div>`, '알겠어요!', { box: 'wide' });
}

/* ---------- 시작 화면 / 설정 화면 ---------- */
function titleScreen() {
  const t = $('#scr-title');
  t.onclick = async () => {
    if (t.dataset.busy) return; t.dataset.busy = 1;
    Sound.unlock(); Sound.sfx('buy');
    const s = lsGet('save');
    if (s && !s.over) {
      const v = await ask('<h2>🌏 다시 왔네요!</h2><p>하던 게임이 저장돼 있어요.</p>', [{ t: '▶ 이어하기', v: 'cont', cls: 'green' }, { t: '🌏 새 게임', v: 'new', cls: 'yellow' }]);
      t.dataset.busy = '';
      if (v === 'cont') { G = s; startGameScreen(); } else setupScreen();
    } else { t.dataset.busy = ''; setupScreen(); }
  };
}
function setupScreen() {
  $('#scr-title').classList.remove('on'); $('#scr-setup').classList.add('on');
  const st = { mode: 'family', ids: ['jia', 'jian', 'mom', 'dad'], rounds: 12 };
  const draw = () => {
    $('#scr-setup').innerHTML = `<div class="st-tools"><button data-t="book">📖</button><button data-t="cp">🎟️</button><button data-t="how">❓</button><button data-t="set">⚙️</button></div><div class="setup"><img src="img/logo.webp" class="st-logo" onerror="this.style.display='none'">
      <div class="st-block"><div class="st-label"><i>1</i> 어떻게 놀까요?</div>
      <div class="modes"><button class="mode fam ${st.mode === 'family' ? 'on' : ''}" data-m="family"><span class="mi">👨‍👩‍👧‍👧</span><span><b>가족 대결</b><small>원래 부루마블처럼! 누가 제일 부자가 될까?</small></span></button>
        <button class="mode coop ${st.mode === 'coop' ? 'on' : ''}" data-m="coop"><span class="mi">🤝</span><span><b>함께 세계일주</b><small>가족이 한 팀! 🦊 여우 여행사를 이겨라</small></span></button></div></div>
      <div class="st-block"><div class="st-label"><i>2</i> 누가 할까요? <small>(${st.mode === 'family' ? '2~4명' : '1~4명'})</small></div>
      <div class="who">${['jia', 'jian', 'mom', 'dad'].map(k => `<button class="whob ${st.ids.includes(k) ? 'on' : ''}" data-k="${k}" style="--pc:${PEOPLE[k].color}"><span class="wb-base"><img src="${PEOPLE[k].img}"></span><b>${PEOPLE[k].name}</b><small>${PEOPLE[k].title} 문제</small></button>`).join('')}</div></div>
      <div class="st-block"><div class="st-label"><i>3</i> 얼마나 할까요?</div>
      <div class="lens">${[[8, '짧게', '약 20분', '⏱️'], [12, '보통', '약 30분', '⏰'], [20, '길게', '약 50분', '🌙'], [0, '끝까지', '한 명 남을 때까지', '🏆']].map(([r, t, d, e]) => `<button class="len ${st.rounds === r ? 'on' : ''}" data-r="${r}"><span class="le">${e}</span><b>${t}</b><small>${r ? r + '라운드 · ' : ''}${d}</small></button>`).join('')}</div></div>
      <div class="row st-go"><button class="btn gray" id="st-back">◀ 뒤로</button><button class="btn big yellow" id="st-go">출발! ✈️</button></div></div>`;
    $$('.st-tools button').forEach(b => b.onclick = () => { Sound.sfx('tap'); ({ book: openBook, cp: openCoupons, how: howTo, set: openSettings })[b.dataset.t](); });
    $$('.mode').forEach(b => b.onclick = () => { Sound.sfx('tap'); st.mode = b.dataset.m; if (st.mode === 'coop' && st.rounds === 0) st.rounds = 12; draw(); });
    $$('.whob').forEach(b => b.onclick = () => { Sound.sfx('tap'); const k = b.dataset.k; st.ids = st.ids.includes(k) ? st.ids.filter(x => x !== k) : [...st.ids, k]; draw(); });
    $$('.len').forEach(b => b.onclick = () => { Sound.sfx('tap'); st.rounds = +b.dataset.r; if (st.mode === 'coop' && !st.rounds) { toast('함께 모드는 라운드를 정해야 해요!'); st.rounds = 20; } draw(); });
    $('#st-back').onclick = () => { Sound.sfx('tap'); $('#scr-setup').classList.remove('on'); $('#scr-title').classList.add('on'); };
    $('#st-go').onclick = () => {
      const need = st.mode === 'family' ? 2 : 1;
      if (st.ids.length < need) { Sound.sfx('bad'); return toast(`${need}명 이상 골라 주세요!`); }
      Sound.sfx('buy'); newGame(st.mode, st.ids, st.rounds);
    };
  };
  draw();
}

// 화면 방향이 바뀌면 판을 다시 그리기
window.onLayout = () => {
  if (!G || !$('#scr-game').classList.contains('on')) return;
  renderBoard(); renderInfo();
  if (pickWaiter) $('#board').classList.add('picking');
};
window.addEventListener('load', () => { fitStage(); titleScreen(); });
