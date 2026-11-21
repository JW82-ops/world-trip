/* ===== 지안지아 세계일주 · 온라인 연결 (Firebase Realtime Database) =====
   주소 끝에 ?mock=1 을 붙이면 인터넷 없이 같은 브라우저의 탭끼리 시험할 수 있어요. */
const FB_CFG = {
  apiKey: 'AIzaSyCWZWB4gs1TrXpCcZ_PSmSl1gggoDO_I4Y',
  authDomain: 'world-trip-e2ebd.firebaseapp.com',
  databaseURL: 'https://world-trip-e2ebd-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'world-trip-e2ebd',
  storageBucket: 'world-trip-e2ebd.firebasestorage.app',
  messagingSenderId: '50843350994',
  appId: '1:50843350994:web:55712f54b7ab98bb447a0b',
};

const Net = (() => {
  const MOCK = /[?&]mock=1/.test(location.search);
  let db = null, uid = null, offset = 0, ready = null;
  const clone = (v) => v == null ? null : JSON.parse(JSON.stringify(v));

  /* ---------- 시험용 가짜 서버 (localStorage + BroadcastChannel) ---------- */
  const M = MOCK ? (() => {
    const KEY = 'mockdb', ch = new BroadcastChannel('mockdb');
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
    let data = load();
    const subs = [];
    const keys = (p) => p.split('/').filter(Boolean);
    const getAt = (o, p) => keys(p).reduce((a, k) => a == null ? undefined : a[k], o);
    const setAt = (o, p, v) => {
      const ks = keys(p); let a = o;
      for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; }
      if (v == null) delete a[ks[ks.length - 1]]; else a[ks[ks.length - 1]] = clone(v);
    };
    function fire(s) {
      const v = getAt(data, s.path);
      if (s.type === 'value') { const j = JSON.stringify(v == null ? null : v); if (j !== s.last) { s.last = j; s.cb(JSON.parse(j)); } return; }
      const o = v && typeof v === 'object' ? v : {};
      Object.keys(o).sort().forEach(k => { if (!s.seen.has(k)) { s.seen.add(k); s.cb(k, clone(o[k])); } });
      for (const k of [...s.seen]) if (!(k in o)) s.seen.delete(k);
    }
    const notify = () => subs.slice().forEach(fire);
    ch.onmessage = () => { data = load(); notify(); };
    const commit = () => { localStorage.setItem(KEY, JSON.stringify(data)); ch.postMessage(1); setTimeout(notify, 0); };
    let n = 0;
    return {
      write(p, v) { data = load(); setAt(data, p, v); commit(); },
      update(p, o) { data = load(); for (const k in o) setAt(data, p + '/' + k, o[k]); commit(); },
      read(p) { data = load(); return clone(getAt(data, p)); },
      key() { return String(Date.now()).padStart(15, '0') + String(n++).padStart(5, '0') + Math.random().toString(36).slice(2, 6); },
      sub(path, type, cb) { const s = { path, type, cb, seen: new Set(), last: undefined }; subs.push(s); setTimeout(() => fire(s), 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; },
    };
  })() : null;

  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); });

  async function init() {
    if (ready) return ready;
    ready = (async () => {
      if (MOCK) {
        uid = sessionStorage.getItem('mockuid') || ('m' + Math.random().toString(36).slice(2, 10));
        sessionStorage.setItem('mockuid', uid); return uid;
      }
      for (const f of ['firebase-app-compat', 'firebase-auth-compat', 'firebase-database-compat']) await loadScript(`js/vendor/${f}.js`);
      if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
      const cred = await firebase.auth().signInAnonymously();
      uid = cred.user.uid;
      db = firebase.database();
      db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
      return uid;
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }

  return {
    MOCK, init,
    get uid() { return uid; },
    now: () => Date.now() + offset,
    TS: () => MOCK ? Date.now() : firebase.database.ServerValue.TIMESTAMP,
    async get(p) { if (MOCK) return M.read(p); return (await db.ref(p).get()).val(); },
    set(p, v) { if (MOCK) return Promise.resolve(M.write(p, v)); return db.ref(p).set(v); },
    update(p, o) { if (MOCK) return Promise.resolve(M.update(p, o)); return db.ref(p).update(o); },
    push(p, v) { if (MOCK) { const k = M.key(); M.write(p + '/' + k, v); return Promise.resolve(k); } return db.ref(p).push(v).then(r => r.key); },
    onValue(p, cb) { if (MOCK) return M.sub(p, 'value', cb); const r = db.ref(p), f = s => cb(s.val()); r.on('value', f); return () => r.off('value', f); },
    onAdded(p, cb) { if (MOCK) return M.sub(p, 'child', cb); const r = db.ref(p), f = s => cb(s.key, s.val()); r.on('child_added', f); return () => r.off('child_added', f); },
    async txn(p, fn) {
      if (MOCK) { const cur = M.read(p), nv = fn(cur); if (nv === undefined) return { committed: false, val: cur }; M.write(p, nv); return { committed: true, val: nv }; }
      const r = await db.ref(p).transaction(fn, undefined, false);
      return { committed: r.committed, val: r.snapshot.val() };
    },
    // 접속 표시: 연결이 끊기면 저절로 지워져요
    presence(p) {
      if (MOCK) { M.write(p, Date.now()); const off = () => M.write(p, null); addEventListener('pagehide', off); return () => { removeEventListener('pagehide', off); off(); }; }
      const r = db.ref(p), c = db.ref('.info/connected');
      const f = s => { if (s.val()) { r.onDisconnect().remove(); r.set(firebase.database.ServerValue.TIMESTAMP); } };
      c.on('value', f);
      return () => { c.off('value', f); r.onDisconnect().cancel(); r.remove(); };
    },
  };
})();
