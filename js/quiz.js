/* ===== 퀴즈 만들기 + 퀴즈 창 ===== */
const Quiz = (() => {
  const cityList = () => Object.values(CITIES);
  const countries = () => [...new Map(cityList().map(c => [c.country, c])).values()];
  const n = (x) => x.toLocaleString();
  const near = (v, d = [1, 2, -1, -2, 10, -10]) => shuffle(d).map(x => v + x).filter(x => x >= 0 && x !== v);
  function mk(q, correct, wrongs, extra = {}) {
    const ws = [...new Set(wrongs.map(String))].filter(w => w !== String(correct)).slice(0, extra.nChoice ? extra.nChoice - 1 : 3);
    const choices = shuffle([String(correct), ...ws]);
    return Object.assign({ q, choices, ans: choices.indexOf(String(correct)), key: q + correct }, extra);
  }
  const others = (arr, keyFn, not, k = 3) => shuffle(arr.filter(x => keyFn(x) !== not)).slice(0, k).map(keyFn);
  const hhmm = (h) => { h = ((h % 24) + 24) % 24; return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시`; };

  /* ----- 지아 (새싹) ----- */
  const L1 = {
    add() { const a = rnd(3, 9), b = rnd(2, 8); return mk(`${a} + ${b} = ?`, a + b, near(a + b), { say: `${a} 더하기 ${b}는?` }); },
    sub() { const a = rnd(6, 12), b = rnd(1, a - 1); return mk(`${a} - ${b} = ?`, a - b, near(a - b), { say: `${a} 빼기 ${b}는?` }); },
    count() { const [e, w] = pick(KO_WORDS); const k = rnd(6, 14); return mk(`${w} 그림은 모두 몇 개일까요?`, k, near(k, [1, -1, 2, -2]), { big: `<div class="many">${e.repeat(k)}</div>`, say: `${w}는 모두 몇 개일까요?` }); },
    bigger() { const a = rnd(11, 59); let b = rnd(11, 59); if (b === a) b++; return mk('더 큰 수는 어느 것일까요?', Math.max(a, b), [Math.min(a, b)], { say: '더 큰 수는 어느 것일까요?', nChoice: 2 }); },
    next() { const s = rnd(5, 40), st = pick([1, 1, 2]); return mk(`${s}, ${s + st}, ${s + 2 * st}, 다음 수는?`, s + 3 * st, near(s + 3 * st, [1, -1, 2, st + 1]), { say: `${s}, ${s + st}, ${s + 2 * st}, 다음 수는?` }); },
    word() { const [e, w] = pick(KO_WORDS); return mk('이 그림에 맞는 낱말은?', w, others(KO_WORDS, x => x[1], w, 2), { big: `<div class="emo">${e}</div>`, say: '이 그림에 맞는 낱말은 무엇일까요?', nChoice: 3 }); },
    read() { const [e, w] = pick(KO_WORDS); return mk(`<b class="hl">${w}</b> 그림을 찾아요!`, e, others(KO_WORDS, x => x[0], e, 2), { emoChoice: true, nChoice: 3 }); },
    flag() { const c = pick(countries()); return mk('이 국기는 어느 나라 국기일까요?', c.country, others(countries(), x => x.country, c.country, 2), { big: `<div class="emo">${c.flag}</div>`, say: '이 국기는 어느 나라 국기일까요?', nChoice: 3 }); },
    city() { const c = pick(cityList()); return mk('이 그림은 어느 도시일까요?', c.name, others(cityList(), x => x.name, c.name, 2), { big: `<img class="qimg" src="${c.img}">`, say: '이 그림은 어느 도시일까요?', nChoice: 3 }); },
    animal() { const c = CITIES[pick(['beijing', 'sydney', 'bangkok', 'dubai', 'mexico', 'cairo', 'delhi', 'seoul'])]; return mk(`${c.animal[0]} ${c.animal[1]}! 어느 나라 동물로 유명할까요?`, c.country, others(countries(), x => x.country, c.country, 2), { say: `${c.animal[1]}는 어느 나라 동물로 유명할까요?`, nChoice: 3 }); },
  };
  const L1H = { // 구조 퀴즈 (한 단계 위)
    add() { const a = rnd(13, 28), b = rnd(5, 9); const r = a + b; return mk(`${a} + ${b} = ?`, r, near(r, [1, -1, 10, -10, 2]), { say: `${a} 더하기 ${b}는?` }); },
    sub() { const a = rnd(21, 35), b = rnd(4, 9); return mk(`${a} - ${b} = ?`, a - b, near(a - b, [1, -1, 10, 2]), { say: `${a} 빼기 ${b}는?` }); },
    batchim() { const [e, w, ws] = pick(KO_BATCHIM); return mk('그림에 맞게 바르게 쓴 낱말은?', w, ws, { big: `<div class="emo">${e}</div>`, say: '그림에 맞게 바르게 쓴 낱말은 무엇일까요?', nChoice: 3 }); },
    tens() { const t = rnd(2, 6), o = rnd(1, 9); return mk(`10개 묶음 ${t}개와 낱개 ${o}개는?`, t * 10 + o, [o * 10 + t, t * 10 + o + 10, t + o], { say: `10개 묶음 ${t}개와 낱개 ${o}개는 모두 얼마일까요?` }); },
  };

  /* ----- 지안 (탐험가) ----- */
  const RATES = [['달러', '미국', 1400], ['유로', '프랑스', 1600], ['파운드', '영국', 1800], ['위안', '중국', 200], ['바트', '태국', 40], ['리라', '튀르키예', 50]];
  const TZ = [['런던', 9, false], ['파리', 8, false], ['뉴욕', 14, false], ['방콕', 2, false], ['두바이', 5, false], ['카이로', 7, false], ['시드니', 2, true], ['하와이', 19, false]];
  const L2 = {
    mul() { const a = rnd(3, 9), b = rnd(3, 9); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [a, -a, b, 1, -1]), { say: `${a} 곱하기 ${b}는?` }); },
    mul21() { const a = rnd(12, 39), b = rnd(2, 6); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [10, -10, b, 1, 2]), { say: `${a} 곱하기 ${b}는?` }); },
    add3() { const a = rnd(125, 589), b = rnd(118, 399); return mk(`${a} + ${b} = ?`, a + b, near(a + b, [10, -10, 100, 1, -100]), { say: `${a} 더하기 ${b}는?` }); },
    sub2() { const a = rnd(41, 93), b = rnd(15, a - 6); return mk(`${a} - ${b} = ?`, a - b, near(a - b, [10, -10, 1, 2]), { say: `${a} 빼기 ${b}는?` }); },
    div() { const b = rnd(3, 9), r = rnd(3, 9); return mk(`${b * r} ÷ ${b} = ?`, r, near(r, [1, -1, 2, -2]), { say: `${b * r} 나누기 ${b}는?` }); },
    enKo() { const w = pick(EN_WORDS); return mk(`<span class="en">${w[1]}</span> 은(는) 무슨 뜻일까요?`, w[2], others(EN_WORDS, x => x[2], w[2]), { say: w[1], lang: 'en-US' }); },
    koEn() { const w = pick(EN_WORDS); return mk(`'${w[2]}'${w[0]} 을(를) 영어로?`, w[1], others(EN_WORDS, x => x[1], w[1]), { enChoice: true }); },
    spell() { const w = pick(EN_WORDS); const alt = w[1].length > 3 ? w[1].slice(0, -2) + w[1].slice(-1) + w[1].slice(-2, -1) : w[1] + 'e'; return mk('철자가 바른 것은?', w[1], [w[3], alt], { big: `<div class="emo">${w[0]}</div>`, enChoice: true, nChoice: 3 }); },
    money() { const [nm, ct, r] = pick(RATES); const x = rnd(2, 9); return mk(`1${iga(nm)} ${n(r)}원이라면, ${x}${eun(nm)} 몇 원일까요?`, n(r * x) + '원', [n(r * (x + 1)) + '원', n(r * (x - 1)) + '원', n(r * x + r / 2) + '원'], { say: `1${iga(nm)} ${r}원이라면, ${x}${eun(nm)} 몇 원일까요?` }); },
    time() { const [c, d, ahead] = pick(TZ.filter(t => t[1] < 10)); const h = rnd(9, 20); const r = ahead ? h + d : h - d; return mk(`서울이 ${hhmm(h)}일 때 ${c}는 몇 시일까요? (${c}는 서울보다 ${d}시간 ${ahead ? '빨라요' : '느려요'})`, hhmm(r), [hhmm(ahead ? h - d : h + d), hhmm(r + 1), hhmm(r - 1)]); },
    food() { const c = pick(cityList().filter(x => x.type === 'city')); return mk(`${c.country}의 대표 음식은?`, c.foods[0], others(cityList(), x => x.foods[0], c.foods[0]).filter(f => !c.foods.includes(f))); },
    greet() { const cs = countries().filter(c => !['미국', '대한민국'].includes(c.country)); const c = pick(cs); return mk(`${c.country}의 인사말은?`, c.greet[0], others(cs, x => x.greet[0], c.greet[0])); },
    landmark() { const c = pick(cityList()); return mk(`${eun(c.landmark)} 어느 도시에 있을까요?`, c.name, others(cityList(), x => x.name, c.name)); },
    flag() { const c = pick(countries()); return mk('이 국기는 어느 나라 국기일까요?', c.country, others(countries(), x => x.country, c.country), { big: `<div class="emo">${c.flag}</div>` }); },
    person() { const c = pick(cityList()); return mk(`'${c.person[0]}' — ${c.person[1]}. 어느 나라 사람일까요?`, c.country, others(countries(), x => x.country, c.country)); },
  };
  const L2H = {
    mul22() { const a = rnd(13, 29), b = rnd(11, 19); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [10, -10, a, -a, b]), { say: `${a} 곱하기 ${b}는?` }); },
    divr() { const b = rnd(4, 9), q = rnd(4, 9), r = rnd(1, b - 1); return mk(`${b * q + r} ÷ ${b} 의 나머지는?`, r, [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(x => x !== r && x < b), { say: `${b * q + r} 나누기 ${b}의 나머지는?` }); },
    sub3() { const a = rnd(402, 905), b = rnd(158, a - 50); return mk(`${a} - ${b} = ?`, a - b, near(a - b, [10, -10, 100, -100, 1]), { say: `${a} 빼기 ${b}는?` }); },
    sent() { const s = pick(EN_SENT); return mk(`<span class="en">${s[0]}</span><br>무슨 뜻일까요?`, s[1], others(EN_SENT, x => x[1], s[1]), { say: s[0], lang: 'en-US' }); },
    money() { const [nm, , r] = pick(RATES.filter(x => x[2] >= 1400)); const x = rnd(11, 19); return mk(`1${iga(nm)} ${n(r)}원이라면, ${x}${eun(nm)} 몇 원일까요?`, n(r * x) + '원', [n(r * (x + 1)) + '원', n(r * (x - 1)) + '원', n(r * x + 1000) + '원']); },
    time() { const [c, d, ahead] = pick(TZ); const h = rnd(1, 23); const r = ahead ? h + d : h - d; return mk(`서울이 ${hhmm(h)}일 때 ${c}는 몇 시일까요? (${c}는 서울보다 ${d}시간 ${ahead ? '빨라요' : '느려요'})`, hhmm(r), [hhmm(ahead ? h - d : h + d), hhmm(r + 12), hhmm(r - 1)]); },
  };

  /* ----- 엄마·아빠 (박사) ----- */
  const L3 = {
    trivia() { const [q, a, ws] = pick(TRIVIA); return mk(q, a, ws); },
    trivia2() { return L3.trivia(); },
    fact() { const c = pick(cityList()); return mk(`다음 중 '${c.name}(${c.country})' 이야기는?`, c.fact, others(cityList(), x => x.fact, c.fact)); },
    person() { const c = pick(cityList()); return mk(`'${c.person[0]}'은(는) 어느 나라와 관련 깊은 인물일까요?`, c.country, others(countries(), x => x.country, c.country)); },
    mul() { const a = rnd(23, 89), b = rnd(6, 9); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [10, -10, b, -b, 100])); },
    pct() { const base = pick([200, 300, 400, 500, 600, 800]), p = pick([15, 25, 35, 45]); return mk(`${base}의 ${p}%는?`, base * p / 100, [base * (p + 10) / 100, base * (p - 5) / 100, base * p / 10]); },
    greet() { const all = countries(); const cs = all.filter(c => !['미국', '대한민국', '싱가포르'].includes(c.country) && all.filter(o => o.greet[0] === c.greet[0]).length === 1); const c = pick(cs); return mk(`'${c.greet[0]}'는 어느 나라 인사말일까요?`, c.country, others(cs, x => x.country, c.country)); },
  };
  const L3H = {
    trivia() { return L3.trivia(); },
    trivia2() { return L3.trivia(); },
    mul22() { const a = rnd(23, 79), b = rnd(12, 39); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [10, -10, a, -a, 100])); },
    mul31() { const a = rnd(123, 789), b = rnd(4, 9); return mk(`${a} × ${b} = ?`, a * b, near(a * b, [10, -10, 100, b, -b])); },
    pct() { const base = pick([240, 360, 480, 720, 840]), p = pick([15, 35, 45, 65]); return mk(`${base}의 ${p}%는?`, base * p / 100, [base * (p + 10) / 100, base * (p - 5) / 100, base * (p + 5) / 100]); },
  };

  /* ----- 그 나라 문제 (땅 사기·짓기·통행료) ----- */
  function tzDiff(tz) {
    const d = new Date();
    const at = (z) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: z, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d); const g = (t) => +p.find(x => x.type === t).value; return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute')); };
    return (at(tz) - at('Asia/Seoul')) / 3600000;
  }
  function countrySet(c, level, hard) {
    const all = cityList(), cs = countries();
    const o = (fn, not, k = 3) => others(all, fn, not, k);
    const animals = [...new Map(all.map(x => [x.animal[1], x.animal])).values()];
    const F = {};
    const iga2 = (w) => josa(w, '이', '가');
    if (level === 1) {
      F.flag = () => mk(`${c.country} 국기를 찾아요!`, c.flag, others(cs, x => x.flag, c.flag, 2), { emoChoice: true, nChoice: 3, say: `${c.country} 국기를 찾아요!` });
      F.pic = () => mk('이 그림은 어느 도시일까요?', c.name, o(x => x.name, c.name, 2), { big: `<img class="qimg" src="${c.img}">`, nChoice: 3, say: '이 그림은 어느 도시일까요?' });
      F.animal = () => mk(`${c.country}의 대표 동물을 찾아요!`, c.animal[0], others(animals, x => x[0], c.animal[0], 2), { emoChoice: true, nChoice: 3, say: `${c.country}의 대표 동물은 ${c.animal[1]}! ${c.animal[1]}를 찾아요!` });
      F.count = () => { const k = hard ? rnd(11, 18) : rnd(5, 12); return mk(`${c.animal[1]}는 모두 몇 마리일까요?`, k, near(k, [1, -1, 2, -2]), { big: `<div class="many">${c.animal[0].repeat(k)}</div>`, say: `${c.name}의 ${c.animal[1]}는 모두 몇 마리일까요?` }); };
      F.add = () => { const a = hard ? rnd(6, 9) : rnd(2, 6), b = hard ? rnd(5, 9) : rnd(2, 5); return mk(`${c.animal[0]} ${a}마리에 ${b}마리가 더 왔어요. 모두 몇 마리?`, a + b, near(a + b, [1, -1, 2]), { big: `<div class="many">${c.animal[0].repeat(a)} ➕ ${c.animal[0].repeat(b)}</div>`, say: `${c.animal[1]} ${a}마리에 ${b}마리가 더 왔어요. 모두 몇 마리일까요?` }); };
      if (!hard) F.food = () => mk(`${c.name}에서 유명한 음식은?`, c.foods[0], o(x => x.foods[0], c.foods[0], 2).filter(f => !c.foods.includes(f)), { nChoice: 3, say: `${c.name}에서 유명한 음식은 무엇일까요?` });
      return F;
    }
    if (level === 2) {
      F.food = () => mk(`${c.country}의 대표 음식은?`, pick(c.foods), o(x => x.foods[0], c.foods[0]).filter(f => !c.foods.includes(f)));
      F.landmark = () => mk(`${c.name}에 있는 것은?`, c.landmark, o(x => x.landmark, c.landmark));
      F.person = () => mk(`${wa(c.country)} 관련 깊은 유명한 사람은?`, c.person[0], all.filter(x => x.country !== c.country).map(x => x.person[0]).sort(() => Math.random() - .5));
      F.animal = () => mk(`${c.name}의 대표 동물은?`, c.animal[1], animals.filter(a => a[1] !== c.animal[1]).map(a => a[1]).sort(() => Math.random() - .5));
      F.fact = () => mk(`'${c.name}' 이야기로 맞는 것은?`, c.fact, o(x => x.fact, c.fact));
      if (c.country !== '대한민국') {
        F.greet = () => mk(`${c.country}에서 쓰는 인사말은?`, c.greet[0], cs.filter(x => x.greet[0] !== c.greet[0]).map(x => x.greet[0]).sort(() => Math.random() - .5));
        F.cur = () => mk(`${c.country}의 돈 이름은?`, c.curName, [...new Set(all.map(x => x.curName))].filter(x => x !== c.curName && x !== '원').sort(() => Math.random() - .5));
      }
      const r = RATE_NICE[c.cur];
      if (r) F.money = () => {
        const xs = c.cur === 'JPY' ? [100, 200, 300, 500] : c.cur === 'INR' ? [10, 20, 50] : hard ? [11, 12, 15, 20, 25] : [2, 3, 4, 5, 6, 7, 8, 9];
        const x = pick(xs), a = r * x;
        return mk(`${c.name}에서 1${iga(c.curName)} ${n(r)}원이라면, ${n(x)}${eun(c.curName)} 몇 원일까요?`, n(a) + '원', [n(a + r) + '원', n(a - r) + '원', n(a * 10) + '원']);
      };
      const d = tzDiff(c.tz);
      if (d && Number.isInteger(d)) F.time = () => {
        const h = hard ? rnd(0, 23) : rnd(9, 20), res = h + d;
        if (!hard && (res < 0 || res > 23)) return null;
        return mk(`서울이 ${hhmm(h)}일 때 ${c.name}는 몇 시일까요? (${c.name}는 서울보다 ${Math.abs(d)}시간 ${d > 0 ? '빨라요' : '느려요'})`, hhmm(res), [hhmm(h - d), hhmm(res + 1), hhmm(res - 1), hhmm(res + 12)]);
      };
      return F;
    }
    // 엄마·아빠
    (COUNTRY_Q[c.country] || []).forEach(([q, a, ws], i) => { F['cq' + i] = () => mk(q, a, ws); F['cqq' + i] = F['cq' + i]; });
    if (CAPITAL[c.country] && CAPITAL[c.country] !== c.name && c.country !== '대한민국') F.capital = () => mk(`${c.country}의 수도는?`, CAPITAL[c.country], [...new Set([c.name !== CAPITAL[c.country] ? c.name : null, ...Object.values(CAPITAL)])].filter(x => x && x !== CAPITAL[c.country]).slice(0, 12).sort(() => Math.random() - .5));
    F.fact = () => mk(`다음 중 '${c.name}(${c.country})' 이야기는?`, c.fact, o(x => x.fact, c.fact));
    F.person = () => mk(`'${c.person[0]}'에 대한 설명으로 맞는 것은?`, c.person[1], o(x => x.person[1], c.person[1]));
    const orig = (x) => !/[가-힣]/.test(x.greet[1]);
    if (orig(c)) F.greet = () => mk(`${c.country}의 인사말 '${c.greet[0]}'을(를) 그 나라 글자로 쓰면?`, c.greet[1], cs.filter(x => x.country !== c.country && orig(x) && x.greet[1] !== c.greet[1]).map(x => x.greet[1]).sort(() => Math.random() - .5));
    const d = tzDiff(c.tz);
    if (d && Number.isInteger(d)) F.time = () => { const h = rnd(0, 23), res = h + d; return mk(`서울이 ${hhmm(h)}일 때 ${c.name}는 몇 시? (시차 ${Math.abs(d)}시간, 서울보다 ${d > 0 ? '빠름' : '느림'})`, hhmm(res), [hhmm(h - d), hhmm(res + 12), hhmm(res + 1)]); };
    return F;
  }

  const SETS = { 1: [L1, L1H], 2: [L2, L2H], 3: [L3, L3H] };
  const recent = [];
  function make(level, hard = false, cityId = null) {
    let set = SETS[level][hard ? 1 : 0];
    if (cityId && CITIES[cityId]) { const cset = countrySet(CITIES[cityId], level, hard); if (Object.keys(cset).length) set = cset; }
    for (let t = 0; t < 20; t++) {
      const fn = pick(Object.keys(set)); let q;
      try { q = set[fn](); } catch (e) { continue; }
      if (!q || q.ans < 0 || q.choices.length < 2) continue;
      if (cityId) q.city = cityId;
      if (recent.includes(q.key) && t < 10) continue;
      recent.push(q.key); if (recent.length > 60) recent.shift();
      q.level = level; return q;
    }
    if (cityId) return make(level, hard);
    return mk('3 + 4 = ?', 7, [6, 8, 9]);
  }

  /* ----- 퀴즈 창 ----- */
  // opt: {title, hard, timer(초), helpers:[players], host, banner}
  // 결과: {ok, helper, timeout}
  function ask1(player, opt = {}) {
    const q = opt.q || make(player.level, !!opt.hard, opt.city);
    const cc = opt.city && CITIES[opt.city];
    return new Promise(res => {
      window.__lastAns = q.ans;
      const helpOk = opt.helpers && opt.helpers.length && !opt.hard;
      const choiceHtml = q.choices.map((c, i) => `<button class="qc ${q.emoChoice ? 'emo' : ''} ${q.enChoice ? 'en' : ''}" data-i="${i}">${c}</button>`).join('');
      const m = modal(`
        <div class="qhead" style="--pc:${player.color}"><img src="${player.img || ''}" class="qav">${player.name}<span class="lv">${PEOPLE[player.pid] ? PEOPLE[player.pid].title : ''}</span><span class="qt">${opt.title || '퀴즈'}</span></div>
        ${opt.host ? `<div class="hostbar">🎤 사회자 <b>${opt.host.name}</b>${josa(opt.host.name, '이', '가')} 문제를 읽어 줘요!</div>` : ''}
        ${cc ? `<div class="qcity" style="--sc:${SIDE_COLOR[cc.side]}">${cc.flag} ${cc.country} 문제!</div>` : ''}
        ${opt.banner ? `<div class="qbanner">${opt.banner}</div>` : ''}
        <div class="qq">${q.q}</div>
        ${q.big ? `<div class="qbig">${q.big}</div>` : ''}
        <div class="qcs n${q.choices.length}">${choiceHtml}</div>
        <div class="qfoot">
          <button class="btn small white" id="q-say">🔊 읽어 줘</button>
          ${helpOk ? '<button class="btn small blue" id="q-help">🙋 도와줘!</button>' : ''}
          <span id="q-helped"></span>
        </div>
        ${opt.timer ? `<div class="tbar"><i id="q-tbar"></i><span id="q-tnum">${opt.timer}</span></div>` : ''}`, { box: 'quiz' + (opt.hard ? ' hardq' : '') });
      let done = false, helper = null, timerId = null;
      const speak = () => Voice.say((q.say || q.q.replace(/<[^>]+>/g, ' ')), q.lang || 'ko-KR', q.lang ? 0.85 : 0.95);
      $('#q-say', m).onclick = () => { Sound.sfx('tap'); speak(); };
      if (player.level === 1 || q.lang) setTimeout(speak, 350);
      if (helpOk) $('#q-help', m).onclick = async () => {
        Sound.sfx('tap');
        const who = await ask(`<h2>누가 도와줄까요?</h2><p class="muted">도와준 사람도 맞히면 보너스 ${won(3)}!</p>`, [...opt.helpers.map(h => ({ t: `<img src="${h.img}" class="mini-av"> ${h.name}`, v: h.id, cls: 'white' })), { t: '취소', v: null, cls: 'gray' }]);
        if (!who) return;
        helper = opt.helpers.find(h => h.id === who);
        $('#q-help', m).remove(); $('#q-helped', m).innerHTML = `🤝 <b>${helper.name}</b> 도와주는 중!`;
      };
      function finish(i) {
        if (done) return; done = true; clearInterval(timerId);
        const ok = i === q.ans;
        $$('.qc', m).forEach((b, j) => { b.disabled = true; if (j === q.ans) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
        Sound.sfx(ok ? 'good' : 'bad');
        const fb = document.createElement('div'); fb.className = 'qfb ' + (ok ? 'ok' : 'no');
        fb.innerHTML = ok ? pick(['딩동댕! 정답!', '와, 맞았어요!', '최고예요!', '정답이에요!']) : (i < 0 ? '⏰ 시간이 끝났어요!' : '아쉬워요!') + ` 정답은 <b>${q.choices[q.ans]}</b>`;
        m.appendChild(fb);
        if (ok && player.level === 1) Voice.say('정답!');
        setTimeout(() => { m.close(); res({ ok, helper: ok ? helper : null, timeout: i < 0 }); }, ok ? 1100 : 2100);
      }
      $$('.qc', m).forEach(b => b.onclick = () => finish(+b.dataset.i));
      if (opt.timer) {
        let left = opt.timer * 10; const tot = left;
        timerId = setInterval(() => {
          left--; const bar = $('#q-tbar', m); if (!bar) return clearInterval(timerId);
          bar.style.width = (left / tot * 100) + '%'; $('#q-tnum', m).textContent = Math.ceil(left / 10);
          if (left <= 50 && left % 10 === 0) Sound.sfx('tick');
          if (left <= 0) finish(-1);
        }, 100);
      }
    });
  }
  // 연속 퀴즈 (하나라도 틀리면 실패)
  async function series(player, count, opt = {}) {
    for (let i = 0; i < count; i++) {
      const r = await ask1(player, Object.assign({}, opt, { title: `${opt.title || '도전'} ${i + 1}/${count}` }));
      if (!r.ok) return false;
    }
    return true;
  }
  const timerFor = (level, hard) => hard ? ({ 1: 30, 2: 25, 3: 20 })[level] : 0;
  return { make, ask: ask1, series, timerFor };
})();
