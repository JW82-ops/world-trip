/* ===== 블록 연출: 입체 주사위 · 통통 점프 · 블록 그림 ===== */
const Dice3D = (() => {
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const SHOW = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
  const face = (n) => `<div class="df f${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'p' + (n === 1 ? ' red' : '') : ''}"></i>`).join('')}</div>`;
  const html = (id, cls = '') => `<div class="dwrap ${cls}" id="${id}"><div class="dshadow"></div><div class="dhold"><div class="dtilt"><div class="dcube">${[1, 2, 3, 4, 5, 6].map(face).join('')}</div></div></div></div>`;
  const spin = new WeakMap();
  async function roll(el, n, ms = 1250) {
    if (!el) return;
    const cube = el.querySelector('.dcube');
    const s = (spin.get(el) || 0) + 2 + rnd(0, 1); spin.set(el, s);
    const [x, y] = SHOW[n];
    const tx = x + 360 * s * (Math.random() < .5 ? 1 : -1), ty = y + 360 * (s - 1);
    el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump');
    el.style.setProperty('--dur', ms + 'ms');
    cube.style.transition = `transform ${ms}ms cubic-bezier(.15,.75,.25,1)`;
    cube.style.transform = `rotateX(${tx}deg) rotateY(${ty}deg)`;
    const clack = [0.08, 0.55, 0.78, 0.9].map(f => setTimeout(() => Sound.sfx('step'), ms * f));
    await sleep(ms);
    clack.forEach(clearTimeout);
    el.classList.remove('jump');
  }
  function set(el, n) { const cube = el.querySelector('.dcube'); const [x, y] = SHOW[n]; cube.style.transition = 'none'; cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`; }
  return { html, roll, set };
})();

// 말이 한 칸 통통 뛰기
function hopEl(el, dir, big) {
  if (!el) return;
  if (dir) el.classList.toggle('left', dir < 0);
  const cls = big ? 'land' : 'hop';
  el.classList.remove('hop', 'land'); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), big ? 700 : 380);
  if (big) puff(el);
}
// 발밑에 블록 먼지
function puff(el) {
  const box = el.parentElement; if (!box) return;
  const tw = el.offsetWidth || 44, th = el.offsetHeight || 62;
  const x = parseFloat(el.style.left) + tw / 2, y = parseFloat(el.style.top) + th - 2;
  for (let k = 0; k < 7; k++) {
    const c = document.createElement('i'); c.className = 'dust';
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.style.setProperty('--dx', rnd(-34, 34) + 'px'); c.style.setProperty('--dy', rnd(-26, -6) + 'px');
    c.style.background = pick(['#fff', '#ffe58a', '#d6f5ff']);
    box.appendChild(c); setTimeout(() => c.remove(), 600);
  }
  const s = document.createElement('i'); s.className = 'spark'; s.textContent = pick(['✨', '⭐', '💫']);
  s.style.left = x + 'px'; s.style.top = (y - th - 14) + 'px'; box.appendChild(s); setTimeout(() => s.remove(), 900);
}

// 블록으로 만든 ⭕ / ❌ (5×5 칸)
const PIX = {
  o: '01110100011000110001' + '01110',
  x: '10001010100010001010' + '10001',
};
function pixMark(kind, color) {
  return `<div class="pix" style="--c:${color}">${PIX[kind].split('').map(b => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('')}</div>`;
}
// 두 점 사이에 블록을 줄지어 놓기 (사다리·뱀)
function cubeLine(pts, size, cls, colorFn) {
  let h = '';
  for (let k = 0; k < pts.length; k++) {
    const [x, y] = pts[k];
    h += `<i class="${cls}" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;${colorFn ? `background:${colorFn(k)}` : ''}"></i>`;
  }
  return h;
}
function sampleLine(x1, y1, x2, y2, gap) { const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.round(d / gap)); return Array.from({ length: n + 1 }, (_, k) => [x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]); }
function sampleQuad(x1, y1, cx, cy, x2, y2, gap) {
  const n = Math.max(6, Math.round(Math.hypot(x2 - x1, y2 - y1) / gap * 1.25));
  return Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2]; });
}
