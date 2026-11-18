/* ===== 공통 도구 ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const won = (m) => `${m < 0 ? '-' : ''}${Math.abs(m).toLocaleString()}만`;
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); if (c < 0xac00 || c > 0xd7a3) return w + a; return w + ((c - 0xac00) % 28 ? a : b); };
// josa('사과','을','를') → 받침 있으면 첫번째
const eul = (w) => josa(w, '을', '를'), iga = (w) => josa(w, '이', '가'), eun = (w) => josa(w, '은', '는'), wa = (w) => josa(w, '과', '와');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LS = 'jjworld-v1:';
const lsGet = (k, d = null) => { try { const s = localStorage.getItem(LS + k); return s ? JSON.parse(s) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} };
const SET = Object.assign({ sound: true, voice: true }, lsGet('settings', {}));
const saveSet = () => lsSet('settings', SET);

/* ---------- 소리 ---------- */
const Sound = (() => {
  let ctx = null;
  const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(f, d = 0.12, type = 'sine', v = 0.15, at = 0, f2 = null) {
    const c = ac(); if (!c || !SET.sound) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  }
  const notes = (arr, type = 'triangle', v = 0.14, gap = 0.1) => arr.forEach((f, i) => tone(f, gap * 1.4, type, v, i * gap));
  const S = {
    tap: () => tone(660, 0.06, 'triangle', 0.1),
    step: () => tone(520 + Math.random() * 80, 0.05, 'square', 0.05),
    dice: () => { for (let i = 0; i < 8; i++) tone(200 + Math.random() * 300, 0.04, 'square', 0.05, i * 0.07); },
    coin: () => notes([988, 1319], 'square', 0.08, 0.08),
    pay: () => notes([523, 392], 'triangle', 0.12, 0.1),
    good: () => notes([523, 659, 784, 1047], 'triangle', 0.14, 0.08),
    bad: () => { tone(300, 0.25, 'sawtooth', 0.08, 0, 180); },
    buy: () => notes([392, 523, 659, 784, 1047], 'triangle', 0.13, 0.07),
    card: () => tone(900, 0.15, 'sine', 0.08, 0, 1400),
    win: () => notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.15, 0.12),
    beat: () => { tone(70, 0.12, 'sine', 0.5); tone(60, 0.12, 'sine', 0.4, 0.18); },
    tick: () => tone(1200, 0.03, 'square', 0.04),
    alarm: () => { for (let i = 0; i < 4; i++) { tone(880, 0.18, 'square', 0.08, i * 0.4); tone(660, 0.18, 'square', 0.08, i * 0.4 + 0.2); } },
  };
  return { sfx: (n) => { try { S[n] && S[n](); } catch (e) {} }, unlock: ac };
})();

/* ---------- 읽어주기 ---------- */
const Voice = (() => {
  const ok = 'speechSynthesis' in window;
  let voices = [];
  const load = () => { voices = ok ? speechSynthesis.getVoices() : []; };
  if (ok) { load(); speechSynthesis.onvoiceschanged = load; }
  function say(text, lang = 'ko-KR', rate = 0.95) {
    if (!ok || !SET.voice || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      const base = lang.split('-')[0];
      const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang && v.lang.startsWith(base));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  const has = (lang) => voices.some(v => v.lang && v.lang.startsWith(lang.split('-')[0]));
  return { say, has, stop: () => ok && speechSynthesis.cancel() };
})();

/* ---------- 창(모달) ---------- */
function modal(html, opt = {}) {
  const ov = document.createElement('div');
  ov.className = 'ov' + (opt.cls ? ' ' + opt.cls : '');
  ov.innerHTML = `<div class="modal ${opt.box || ''}">${opt.close ? '<button class="x">✕</button>' : ''}${html}</div>`;
  $('#stage').appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  const m = ov.querySelector('.modal');
  m.close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 220); opt.onClose && opt.onClose(); };
  if (opt.close) ov.querySelector('.x').onclick = () => { Sound.sfx('tap'); m.close(); };
  return m;
}
// 버튼 고르기 대화창 → 고른 값
function ask(html, buttons, opt = {}) {
  return new Promise(res => {
    const m = modal(`${html}<div class="btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}" ${b.disabled ? 'disabled' : ''}>${b.t}</button>`).join('')}</div>`, opt);
    $$('.btns .btn', m).forEach(el => el.onclick = () => { Sound.sfx('tap'); m.close(); res(buttons[+el.dataset.i].v); });
  });
}
const say = (html, btn = '좋아요!', opt = {}) => ask(html, [{ t: btn, v: true, cls: opt.btnCls || 'yellow' }], opt);

function toast(text, ms = 1800) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = text;
  t.style.top = (24 + $$('.toast').length * 72) + 'px';
  $('#stage').appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}
function confetti(n = 80) {
  const box = document.createElement('div'); box.className = 'confetti'; $('#stage').appendChild(box);
  const cols = ['#ff5b5b', '#ffb020', '#2f86ff', '#22b573', '#ff5fa2', '#a66bff'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%'; p.style.background = pick(cols);
    p.style.animationDelay = Math.random() * 0.6 + 's'; p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    p.style.transform = `rotate(${rnd(0, 360)}deg)`; box.appendChild(p);
  }
  setTimeout(() => box.remove(), 3600);
}

/* ---------- 화면 맞춤: 태블릿 / 폰 세로 / 폰 가로 ---------- */
let LAYOUT = null;
let LYD = { c: 130, eh: 80, ev: 80, tw: 44, th: 62 };
const LY = () => LYD;
function fitStage() {
  const w = window.innerWidth, h = window.innerHeight;
  let L, sw, sh;
  if (Math.min(w / 1600, h / 1000) >= 0.55) { L = 'tab'; sw = 1600; sh = 1000; }
  else if (w > h) { L = 'land'; sh = 640; sw = Math.max(1180, Math.round(640 * w / h)); }
  else { L = 'port'; sw = 640; sh = Math.max(1060, Math.round(640 * h / w)); }
  // 판 크기: 폰은 남는 공간만큼 판을 길게 늘려요
  // 판 둘레에 나무 테두리(12px)가 들어갈 자리를 남겨요
  // A: 위·아래 줄 칸 수, B: 양옆 칸 수 (A + B = 18, 40칸 그대로)
  if (L === 'tab') LYD = { A: 9, B: 9, c: 124, eh: 78, ev: 78, tw: 44, th: 62 };
  else if (L === 'port') { const c = 118, eh = Math.floor((640 - 28 - 2 * c) / 6), ev = Math.max(50, Math.min(74, Math.floor((sh - 28 - 96 - 2 * c) / 12))); LYD = { A: 6, B: 12, c, eh, ev, tw: 36, th: 50 }; }
  else { const c = 118, ev = Math.floor((640 - 28 - 2 * c) / 6), eh = Math.max(70, Math.min(140, Math.floor((sw - 28 - 2 * c) / 12))); LYD = { A: 12, B: 6, c, eh, ev, tw: 36, th: 50 }; }
  const st = $('#stage');
  st.style.width = sw + 'px'; st.style.height = sh + 'px';
  st.style.setProperty('--sw', sw + 'px'); st.style.setProperty('--sh', sh + 'px');
  st.style.setProperty('--c', LYD.c + 'px'); st.style.setProperty('--eh', LYD.eh + 'px'); st.style.setProperty('--ev', LYD.ev + 'px');
  st.style.setProperty('--A', LYD.A); st.style.setProperty('--B', LYD.B);
  st.style.setProperty('--bw', (LYD.c * 2 + LYD.eh * LYD.A) + 'px'); st.style.setProperty('--bh', (LYD.c * 2 + LYD.ev * LYD.B) + 'px');
  st.classList.remove('L-tab', 'L-port', 'L-land'); st.classList.add('L-' + L); st.classList.toggle('tall', L === 'port' && sh >= 1280);
  st.style.transform = `translate(-50%,-50%) scale(${Math.min(w / sw, h / sh)})`;
  const key = L + LYD.A + ':' + LYD.eh + 'x' + LYD.ev;
  if (key !== LAYOUT) { const first = LAYOUT === null; LAYOUT = key; if (!first && window.onLayout) window.onLayout(); }
}
window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', () => setTimeout(fitStage, 250));
