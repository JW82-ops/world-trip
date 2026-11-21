/* ===== 지안지아 세계일주 · 데이터 ===== */

// 플레이어 (레벨 1=새싹(지아), 2=탐험가(지안), 3=박사(엄마·아빠))
const PEOPLE = {
  jian: { id: 'jian', name: '지안', level: 2, color: '#ff5fa2', img: 'img/p_jian.webp', kid: true, title: '탐험가' },
  jia:  { id: 'jia',  name: '지아', level: 1, color: '#ffb81c', img: 'img/p_jia.webp',  kid: true, title: '새싹' },
  mom:  { id: 'mom',  name: '엄마', level: 3, color: '#a66bff', img: 'img/p_mom.webp',  kid: false, title: '박사' },
  dad:  { id: 'dad',  name: '아빠', level: 3, color: '#2f86ff', img: 'img/p_dad.webp',  kid: false, title: '박사' },
};
// 온라인 친구 캐릭터 (게임 속 이름은 각자 정한 별명)
const FRIENDS = {
  bunny: { id: 'bunny', name: '토끼', color: '#19b3a6', img: 'img/f_bunny.webp', friend: true },
  bear:  { id: 'bear',  name: '곰돌이', color: '#e5443a', img: 'img/f_bear.webp', friend: true },
  cat:   { id: 'cat',   name: '고양이', color: '#8b5cf6', img: 'img/f_cat.webp', friend: true },
  panda: { id: 'panda', name: '판다', color: '#3aa0ff', img: 'img/f_panda.webp', friend: true },
  dino:  { id: 'dino',  name: '공룡', color: '#5cbf2a', img: 'img/f_dino.webp', friend: true },
  shiba: { id: 'shiba', name: '시바', color: '#ff8a1f', img: 'img/f_shiba.webp', friend: true },
};
Object.assign(PEOPLE, FRIENDS);
const LVT = { 1: '새싹', 2: '탐험가', 3: '박사' };
const LV_INFO = { 1: ['🌱', '새싹', '7살쯤'], 2: ['🧭', '탐험가', '초등학생'], 3: ['🎓', '박사', '어른'] };
const RIVAL = { id: 'rival', name: '여우 여행사', color: '#ff7a1a', emoji: '🦊' };
const TEAM_COLOR = '#18b979';

// 대륙(판의 변)별 색
const SIDE_COLOR = { 1: '#ff5b5b', 2: '#ffb020', 3: '#2f86ff', 4: '#22b573' };
const SIDE_NAME = { 1: '아시아', 2: '아프리카·유럽', 3: '유럽·아메리카', 4: '태평양·한국' };

// 도시 카드 정보
// greet: [현지 인사말, 발음/뜻], foods, person: [이름, 한 줄], animal: [이모지, 이름], fact, landmark(퀴즈용)
const CITIES = {
  bangkok: { name: '방콕', country: '태국', flag: '🇹🇭', side: 1, price: 5, lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok', cur: 'THB', curName: '바트',
    greet: ['사왓디', 'สวัสดี'], foods: ['팟타이', '망고 찹쌀밥'], person: ['쭐랄롱꼰 대왕', '노예 제도를 없앤 태국의 왕'], animal: ['🐘', '코끼리'],
    fact: '방콕의 진짜 이름은 세계에서 가장 긴 도시 이름이에요!', landmark: '왓 아룬 사원', lang: 'th-TH' },
  beijing: { name: '베이징', country: '중국', flag: '🇨🇳', side: 1, price: 7, lat: 39.9, lon: 116.4, tz: 'Asia/Shanghai', cur: 'CNY', curName: '위안',
    greet: ['니하오', '你好'], foods: ['베이징 덕', '만두'], person: ['공자', '\'예의\'를 가르친 옛날 선생님'], animal: ['🐼', '판다'],
    fact: '만리장성은 다 이으면 2만 km가 넘어요!', landmark: '만리장성과 자금성', game: 'tangram', lang: 'zh-CN' },
  hanoi: { name: '하노이', country: '베트남', flag: '🇻🇳', side: 1, price: 7, lat: 21.03, lon: 105.85, tz: 'Asia/Ho_Chi_Minh', cur: 'VND', curName: '동',
    greet: ['신짜오', 'Xin chào'], foods: ['쌀국수(퍼)', '반미'], person: ['쯩 자매', '나라를 지킨 용감한 두 자매'], animal: ['🐃', '물소'],
    fact: '하노이는 1,000살이 넘은 아주 오래된 도시예요!', landmark: '호안끼엠 호수', lang: 'vi-VN' },
  jeju: { name: '제주도', country: '대한민국', flag: '🇰🇷', side: 1, price: 18, type: 'tour', lat: 33.5, lon: 126.53, tz: 'Asia/Seoul', cur: 'KRW', curName: '원',
    greet: ['혼저옵서예', '제주말로 \'어서 오세요\''], foods: ['감귤', '흑돼지'], person: ['김만덕', '굶는 사람들에게 쌀을 나눠 준 상인'], animal: ['🐴', '제주 조랑말'],
    fact: '한라산은 남한에서 가장 높은 산이에요!', landmark: '한라산과 돌하르방', lang: 'ko-KR' },
  singapore: { name: '싱가포르', country: '싱가포르', flag: '🇸🇬', side: 1, price: 9, lat: 1.29, lon: 103.85, tz: 'Asia/Singapore', cur: 'SGD', curName: '싱가포르 달러',
    greet: ['헬로', '영어·중국어·말레이어·타밀어를 다 써요'], foods: ['칠리 크랩', '카야 토스트'], person: ['리콴유', '싱가포르를 키운 첫 총리'], animal: ['🦦', '수달'],
    fact: '싱가포르는 도시 하나가 곧 나라예요!', landmark: '머라이언 동상', lang: 'en-SG' },
  delhi: { name: '뉴델리', country: '인도', flag: '🇮🇳', side: 1, price: 10, lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', cur: 'INR', curName: '루피',
    greet: ['나마스테', 'नमस्ते'], foods: ['커리', '난'], person: ['간디', '싸우지 않고 나라의 독립을 이끈 사람'], animal: ['🦚', '공작'],
    fact: '뱀과 사다리 게임은 인도에서 처음 만들어졌어요!', landmark: '인디아 게이트', game: 'snakes', lang: 'hi-IN' },
  dubai: { name: '두바이', country: '아랍에미리트', flag: '🇦🇪', side: 1, price: 11, lat: 25.2, lon: 55.27, tz: 'Asia/Dubai', cur: 'AED', curName: '디르함',
    greet: ['앗살라무 알라이쿰', '당신에게 평화가!'], foods: ['대추야자', '샤와르마'], person: ['셰이크 자이드', '아랍에미리트를 세운 지도자'], animal: ['🐪', '낙타'],
    fact: '부르즈 할리파는 세계에서 가장 높은 건물이에요! (828m)', landmark: '부르즈 할리파', lang: 'ar-AE' },
  cairo: { name: '카이로', country: '이집트', flag: '🇪🇬', side: 2, price: 13, lat: 30.04, lon: 31.24, tz: 'Africa/Cairo', cur: 'EGP', curName: '이집트 파운드',
    greet: ['아흘란', 'أهلاً'], foods: ['코샤리', '팔라펠'], person: ['클레오파트라', '이집트의 마지막 여왕'], animal: ['🐊', '나일 악어'],
    fact: '기자의 피라미드는 약 4,500년 전에 지어졌어요!', landmark: '피라미드와 스핑크스', lang: 'ar-EG' },
  accra: { name: '아크라', country: '가나', flag: '🇬🇭', side: 2, price: 13, lat: 5.6, lon: -0.19, tz: 'Africa/Accra', cur: 'GHS', curName: '세디',
    greet: ['아크와바', '가나 말로 \'환영해요\''], foods: ['졸로프 라이스', '카카오(초콜릿)'], person: ['콰메 은크루마', '가나의 독립을 이끈 첫 대통령'], animal: ['🦅', '독수리'],
    fact: '가나는 초콜릿 재료인 카카오를 아주 많이 키워요!', landmark: '블랙 스타 게이트', game: 'mancala', lang: 'en-GH' },
  istanbul: { name: '이스탄불', country: '튀르키예', flag: '🇹🇷', side: 2, price: 15, lat: 41.01, lon: 28.98, tz: 'Europe/Istanbul', cur: 'TRY', curName: '리라',
    greet: ['메르하바', 'Merhaba'], foods: ['케밥', '로쿰(젤리 과자)'], person: ['미마르 시난', '멋진 사원을 수백 개 지은 건축가'], animal: ['🐈', '길고양이'],
    fact: '이스탄불은 유럽과 아시아, 두 대륙에 걸쳐 있어요!', landmark: '블루 모스크', lang: 'tr-TR' },
  athens: { name: '아테네', country: '그리스', flag: '🇬🇷', side: 2, price: 16, lat: 37.98, lon: 23.73, tz: 'Europe/Athens', cur: 'EUR', curName: '유로',
    greet: ['야수', 'Γειά σου'], foods: ['기로스', '그리스 요거트'], person: ['소크라테스', '질문을 아주 많이 한 철학자'], animal: ['🦉', '올빼미'],
    fact: '올림픽은 옛날 그리스에서 처음 시작됐어요!', landmark: '파르테논 신전', lang: 'el-GR' },
  rome: { name: '로마', country: '이탈리아', flag: '🇮🇹', side: 2, price: 18, lat: 41.9, lon: 12.5, tz: 'Europe/Rome', cur: 'EUR', curName: '유로',
    greet: ['차오', 'Ciao'], foods: ['피자', '젤라토'], person: ['레오나르도 다빈치', '모나리자를 그린 천재 화가'], animal: ['🐺', '늑대'],
    fact: '콜로세움에는 5만 명이 넘게 들어갈 수 있었어요!', landmark: '콜로세움', lang: 'it-IT' },
  madrid: { name: '마드리드', country: '스페인', flag: '🇪🇸', side: 2, price: 18, lat: 40.42, lon: -3.7, tz: 'Europe/Madrid', cur: 'EUR', curName: '유로',
    greet: ['올라', '¡Hola!'], foods: ['파에야', '추로스'], person: ['피카소', '그림을 조각조각 그린 화가'], animal: ['🐂', '황소'],
    fact: '스페인 사람들은 새해 첫날 밤에 포도 12알을 먹어요!', landmark: '마드리드 왕궁', lang: 'es-ES' },
  paris: { name: '파리', country: '프랑스', flag: '🇫🇷', side: 3, price: 22, lat: 48.86, lon: 2.35, tz: 'Europe/Paris', cur: 'EUR', curName: '유로',
    greet: ['봉주르', 'Bonjour'], foods: ['크루아상', '마카롱'], person: ['클로드 모네', '수련 그림으로 유명한 화가'], animal: ['🐓', '수탉'],
    fact: '에펠탑은 여름에 15cm쯤 키가 커져요!', landmark: '에펠탑', lang: 'fr-FR' },
  london: { name: '런던', country: '영국', flag: '🇬🇧', side: 3, price: 22, lat: 51.51, lon: -0.13, tz: 'Europe/London', cur: 'GBP', curName: '파운드',
    greet: ['헬로', 'Hello'], foods: ['피시 앤 칩스', '스콘'], person: ['셰익스피어', '\'로미오와 줄리엣\'을 쓴 작가'], animal: ['🦁', '사자'],
    fact: '\'빅벤\'은 사실 시계탑 안에 있는 큰 종의 이름이에요!', landmark: '빅벤', game: 'tictactoe', lang: 'en-GB' },
  berlin: { name: '베를린', country: '독일', flag: '🇩🇪', side: 3, price: 24, lat: 52.52, lon: 13.4, tz: 'Europe/Berlin', cur: 'EUR', curName: '유로',
    greet: ['구텐 탁', 'Guten Tag'], foods: ['소시지', '프레첼'], person: ['베토벤', '귀가 안 들려도 명곡을 만든 작곡가'], animal: ['🐻', '곰'],
    fact: '베를린에는 도시를 둘로 나누던 장벽이 있었어요!', landmark: '브란덴부르크 문', lang: 'de-DE' },
  rio: { name: '리우데자네이루', country: '브라질', flag: '🇧🇷', side: 3, price: 26, lat: -22.91, lon: -43.17, tz: 'America/Sao_Paulo', cur: 'BRL', curName: '헤알',
    greet: ['올라', 'Olá'], foods: ['슈하스코', '아사이 볼'], person: ['펠레', '전설적인 축구 왕'], animal: ['🦜', '투칸'],
    fact: '세계에서 가장 큰 열대우림 아마존이 브라질에 있어요!', landmark: '거대한 예수상', lang: 'pt-BR' },
  buenos: { name: '부에노스아이레스', country: '아르헨티나', flag: '🇦🇷', side: 3, price: 26, lat: -34.6, lon: -58.38, tz: 'America/Argentina/Buenos_Aires', cur: 'ARS', curName: '페소',
    greet: ['올라', '¡Hola!'], foods: ['아사도(바비큐)', '엠파나다'], person: ['리오넬 메시', '월드컵에서 우승한 축구 선수'], animal: ['🐧', '펭귄'],
    fact: '탱고 춤이 이곳에서 태어났어요!', landmark: '오벨리스크와 알록달록 집', lang: 'es-AR' },
  mexico: { name: '멕시코시티', country: '멕시코', flag: '🇲🇽', side: 3, price: 28, lat: 19.43, lon: -99.13, tz: 'America/Mexico_City', cur: 'MXN', curName: '페소',
    greet: ['올라', '¡Hola!'], foods: ['타코', '과카몰리'], person: ['프리다 칼로', '자기 얼굴을 많이 그린 화가'], animal: ['🦎', '아홀로틀'],
    fact: '옛날 멕시코 사람들은 카카오 콩을 돈처럼 썼어요!', landmark: '태양의 피라미드', game: 'loteria', lang: 'es-MX' },
  newyork: { name: '뉴욕', country: '미국', flag: '🇺🇸', side: 3, price: 30, lat: 40.71, lon: -74.01, tz: 'America/New_York', cur: 'USD', curName: '달러',
    greet: ['하이', 'Hi!'], foods: ['핫도그', '베이글'], person: ['에디슨', '전구를 쓸 수 있게 만든 발명왕'], animal: ['🦫', '비버'],
    fact: '자유의 여신상은 프랑스가 선물했어요!', landmark: '자유의 여신상', lang: 'en-US' },
  hawaii: { name: '하와이', country: '미국', flag: '🇺🇸', side: 4, price: 30, type: 'tour', lat: 21.31, lon: -157.86, tz: 'Pacific/Honolulu', cur: 'USD', curName: '달러',
    greet: ['알로하', 'Aloha'], foods: ['포케', '파인애플'], person: ['카메하메하 대왕', '하와이 섬들을 하나로 묶은 왕'], animal: ['🐢', '바다거북'],
    fact: '하와이에는 지금도 용암이 나오는 화산이 있어요!', landmark: '와이키키 해변', lang: 'en-US' },
  sydney: { name: '시드니', country: '호주', flag: '🇦🇺', side: 4, price: 32, lat: -33.87, lon: 151.21, tz: 'Australia/Sydney', cur: 'AUD', curName: '호주 달러',
    greet: ['그다이', 'G\'day!'], foods: ['미트 파이', '래밍턴 케이크'], person: ['캐시 프리먼', '올림픽 금메달을 딴 달리기 선수'], animal: ['🦘', '캥거루'],
    fact: '호주에서는 크리스마스가 한여름이에요!', landmark: '오페라 하우스', lang: 'en-AU' },
  tokyo: { name: '도쿄', country: '일본', flag: '🇯🇵', side: 4, price: 34, lat: 35.68, lon: 139.69, tz: 'Asia/Tokyo', cur: 'JPY', curName: '엔',
    greet: ['곤니치와', 'こんにちは'], foods: ['초밥', '라멘'], person: ['노구치 히데요', '병균을 연구한 과학자'], animal: ['🐒', '일본원숭이'],
    fact: '일본에는 화산이 100개도 넘게 있어요!', landmark: '도쿄 타워와 후지산', game: 'karuta', lang: 'ja-JP' },
  taipei: { name: '타이베이', country: '대만', flag: '🇹🇼', side: 4, price: 36, lat: 25.03, lon: 121.56, tz: 'Asia/Taipei', cur: 'TWD', curName: '대만 달러',
    greet: ['니하오', '你好'], foods: ['버블티', '샤오롱바오'], person: ['덩리쥔', '아시아에서 사랑받은 가수'], animal: ['🐦', '대만 푸른까치'],
    fact: '버블티는 대만에서 처음 만들어졌어요!', landmark: '타이베이 101', lang: 'zh-TW' },
  busan: { name: '부산', country: '대한민국', flag: '🇰🇷', side: 4, price: 38, lat: 35.18, lon: 129.08, tz: 'Asia/Seoul', cur: 'KRW', curName: '원',
    greet: ['어서 오이소', '부산 사투리로 \'어서 오세요\''], foods: ['돼지국밥', '어묵'], person: ['이순신', '부산 앞바다에서도 싸운 거북선 장군'], animal: ['🐦', '갈매기'],
    fact: '부산은 우리나라에서 두 번째로 큰 도시예요!', landmark: '해운대와 광안대교', lang: 'ko-KR' },
  seoul: { name: '서울', country: '대한민국', flag: '🇰🇷', side: 4, price: 40, lat: 37.57, lon: 126.98, tz: 'Asia/Seoul', cur: 'KRW', curName: '원',
    greet: ['안녕하세요', '우리말 인사'], foods: ['비빔밥', '떡볶이'], person: ['세종대왕', '한글을 만든 임금님'], animal: ['🐯', '호랑이'],
    fact: '경복궁은 600살이 넘었어요!', landmark: '경복궁과 남산타워', game: 'yut', lang: 'ko-KR' },
};
const SHORT = { rio: '리우', buenos: '부에노스', singapore: '싱가포르', mexico: '멕시코시티' };
for (const k in CITIES) { CITIES[k].short = SHORT[k] || CITIES[k].name; CITIES[k].id = k; CITIES[k].img = `img/${k}.webp`; CITIES[k].type = CITIES[k].type || 'city'; }

const TRANSPORT = {
  jet:     { id: 'jet', name: '초음속 여객기', icon: '✈️', price: 20, img: 'img/t_jet.webp', side: 2 },
  cruise:  { id: 'cruise', name: '크루즈', icon: '🚢', price: 25, img: 'img/t_cruise.webp', side: 3 },
  shuttle: { id: 'shuttle', name: '우주왕복선', icon: '🚀', price: 30, img: 'img/t_shuttle.webp', side: 4 },
};

// 40칸 판
const BOARD = [
  { t: 'start' }, { t: 'city', id: 'bangkok' }, { t: 'key' }, { t: 'city', id: 'beijing' }, { t: 'city', id: 'hanoi' },
  { t: 'city', id: 'jeju' }, { t: 'city', id: 'singapore' }, { t: 'key' }, { t: 'city', id: 'delhi' }, { t: 'city', id: 'dubai' },
  { t: 'island' }, { t: 'city', id: 'cairo' }, { t: 'key' }, { t: 'city', id: 'accra' }, { t: 'city', id: 'istanbul' },
  { t: 'trans', id: 'jet' }, { t: 'city', id: 'athens' }, { t: 'key' }, { t: 'city', id: 'rome' }, { t: 'city', id: 'madrid' },
  { t: 'fundget' }, { t: 'city', id: 'paris' }, { t: 'key' }, { t: 'city', id: 'london' }, { t: 'city', id: 'berlin' },
  { t: 'trans', id: 'cruise' }, { t: 'city', id: 'rio' }, { t: 'city', id: 'buenos' }, { t: 'city', id: 'mexico' }, { t: 'city', id: 'newyork' },
  { t: 'space' }, { t: 'city', id: 'hawaii' }, { t: 'key' }, { t: 'city', id: 'sydney' }, { t: 'city', id: 'tokyo' },
  { t: 'trans', id: 'shuttle' }, { t: 'city', id: 'taipei' }, { t: 'fundpay' }, { t: 'city', id: 'busan' }, { t: 'city', id: 'seoul' },
];
const SPECIAL = {
  start:   { name: '출발', img: 'img/t_start.webp', desc: '지나갈 때마다 월급을 받아요!' },
  island:  { name: '무인도', img: 'img/t_island.webp', desc: '탈출 퀴즈를 맞히면 바로 나갈 수 있어요.' },
  fundget: { name: '사회복지기금', short: '기금 받기', img: 'img/t_fund.webp', desc: '모인 기금을 몽땅 받아요! 아빠 쿠폰 찬스도!' },
  space:   { name: '우주여행', img: 'img/t_space.webp', desc: '가고 싶은 칸으로 날아가요!' },
  fundpay: { name: '기금 내기', img: 'img/t_fund.webp', desc: '사회복지기금에 돈을 내요.' },
  key:     { name: '황금열쇠', img: 'img/t_key.webp', desc: '어떤 카드가 나올까?' },
};

// 경제 (단위: 만 원)
const ECON = { startCash: 150, coopCash: 260, salary: 20, fundPay: 10, buildRate: [0.6, 0.8, 1.0], tollRate: [0.3, 1.0, 2.2, 4.0], tourToll: 0.6, transToll: 0.5, loanRepay: 20, gameWin: 30 };
const BUILD_NAMES = ['땅', '별장', '빌딩', '호텔'];
const BUILD_ICONS = ['', '🏠', '🏢', '🏨'];

// 보드게임 퀘스트
const MINIGAMES = {
  snakes:    { name: '뱀과 사다리', city: 'delhi', icon: '🐍', open: true, origin: '약 2,000년 전쯤 인도에서 \'모크샤 파탐\'이라는 이름으로 시작된 게임이에요. 착한 일을 하면 사다리로 올라가고, 나쁜 일을 하면 뱀을 타고 내려온다는 뜻이 담겨 있었대요.' },
  tictactoe: { name: '틱택토', city: 'london', icon: '⭕', open: true, origin: '영국 아이들이 \'노츠 앤 크로시스(동그라미와 엑스)\'라고 부르며 오래전부터 즐긴 게임이에요. 한 줄 3개를 먼저 만들면 이겨요!' },
  loteria:   { name: '로테리아', city: 'mexico', icon: '🎴', open: true, origin: '멕시코 가족들이 모이면 꼭 하는 그림 빙고예요. 사회자가 카드를 부르면 내 판에서 같은 그림을 찾아요. 스페인어 단어도 배울 수 있어요!' },
  karuta:    { name: '카루타', city: 'tokyo', icon: '🃏', open: true, origin: '일본에서 새해에 즐기는 카드 게임이에요. 읽어 주는 말을 듣고 맞는 카드를 누구보다 빨리 찾아 \'탁!\' 하고 쳐요.' },
  yut:       { name: '윷놀이', city: 'seoul', icon: '🪵', open: false, origin: '우리나라 설날의 대표 놀이예요.' },
  mancala:   { name: '만칼라', city: 'accra', icon: '🫘', open: false, origin: '아프리카에서 씨앗을 세며 하는 아주 오래된 게임이에요.' },
  tangram:   { name: '칠교놀이', city: 'beijing', icon: '🔷', open: false, origin: '일곱 조각으로 모양을 만드는 중국의 퍼즐이에요.' },
};

// 쿠폰
const COUPONS = {
  fund:   { icon: '🍬', name: '사탕', from: '아빠' },
  conq:   { icon: '🍦', name: '아이스크림', from: '아빠' },
  wonder: { icon: '🍔', name: '햄버거', from: '아빠' },
};
const PARENT_COUPONS = [['💆', '안마 10분'], ['🧹', '방 정리 도와주기'], ['😘', '뽀뽀 10번'], ['🍳', '아침 식탁 차리기 돕기'], ['👟', '신발 정리하기']];

// ===== 퀴즈 재료 =====
// 지아: 그림 → 낱말
const KO_WORDS = [['🍎','사과'],['🍌','바나나'],['🍇','포도'],['🍓','딸기'],['🍉','수박'],['🥕','당근'],['🐰','토끼'],['🐱','고양이'],['🐶','강아지'],['🐯','호랑이'],['🦁','사자'],['🐻','곰'],['🐘','코끼리'],['🦒','기린'],['🐵','원숭이'],['🐧','펭귄'],['🐢','거북이'],['🐟','물고기'],['🦋','나비'],['🌸','꽃'],['🌳','나무'],['☀️','해'],['🌙','달'],['⭐','별'],['☂️','우산'],['🚗','자동차'],['✈️','비행기'],['🚂','기차'],['🚲','자전거'],['🧢','모자'],['👟','신발'],['⏰','시계'],['✏️','연필'],['📚','책'],['⚽','공'],['🎂','케이크'],['🍦','아이스크림'],['🍕','피자'],['🥛','우유'],['🍞','빵'],['🏠','집'],['🐷','돼지'],['🐮','소'],['🐔','닭'],['🦆','오리'],['🐸','개구리'],['🍄','버섯'],['🌽','옥수수'],['🎈','풍선'],['🌈','무지개']];
// 지아 구조 퀴즈: 받침 낱말 (그림, 정답, 헷갈리는 보기들)
const KO_BATCHIM = [['🐻','곰',['공','곤']],['⚽','공',['곰','콩']],['🌙','달',['담','닭']],['🐔','닭',['달','닥']],['⭐','별',['벌','볕']],['🐝','벌',['별','범']],['🍞','빵',['방','팡']],['🌸','꽃',['꼿','곳']],['📚','책',['채','잭']],['⛄','눈사람',['눈사랑','누사람']],['🍉','수박',['수밖','수빅']],['🥕','당근',['단근','당긴']],['☂️','우산',['우선','우삼']],['✏️','연필',['연핀','엽필']],['🎈','풍선',['풍산','붕선']],['🐙','문어',['무너','문아']],['🥔','감자',['갑자','감차']],['🌽','옥수수',['옥소수','욱수수']],['🌈','무지개',['무자개','무지게']],['🎁','선물',['선뭄','섬물']],['🧤','장갑',['장각','잔갑']],['🧦','양말',['앙말','양발']],['🐧','펭귄',['펭긴','팽귄']],['🍔','햄버거',['햄버기','행버거']]];
// 지안: 영어 낱말 [이모지, 영어, 뜻, 틀린 철자]
const EN_WORDS = [['🍎','apple','사과','aple'],['🍌','banana','바나나','bananna'],['🐱','cat','고양이','kat'],['🐶','dog','개','dag'],['🦁','lion','사자','loin'],['🐯','tiger','호랑이','tigar'],['🐻','bear','곰','baer'],['🐰','rabbit','토끼','rabit'],['🐘','elephant','코끼리','elefant'],['🐵','monkey','원숭이','monky'],['🐦','bird','새','berd'],['🐟','fish','물고기','fich'],['🐴','horse','말','hors'],['🐮','cow','소','caw'],['🐷','pig','돼지','pigg'],['🐔','chicken','닭','chiken'],['🦆','duck','오리','dack'],['🐸','frog','개구리','flog'],['🐍','snake','뱀','snaek'],['☀️','sun','해','son'],['🌙','moon','달','mun'],['⭐','star','별','ster'],['🌧️','rain','비','rane'],['❄️','snow','눈','sno'],['🌳','tree','나무','tre'],['🌸','flower','꽃','flawer'],['🏠','house','집','hous'],['🏫','school','학교','scool'],['📚','book','책','buk'],['✏️','pencil','연필','pensil'],['🎒','bag','가방','bagg'],['🪑','chair','의자','chiar'],['🚗','car','자동차','kar'],['🚌','bus','버스','bas'],['🚂','train','기차','trane'],['✈️','airplane','비행기','airplain'],['🚢','ship','배','sheep'],['🚲','bike','자전거','baik'],['⚽','ball','공','bal'],['🎂','cake','케이크','caek'],['🥛','milk','우유','mikl'],['💧','water','물','woter'],['🍞','bread','빵','bred'],['🥚','egg','달걀','eeg'],['🍕','pizza','피자','piza'],['🍔','hamburger','햄버거','hamberger'],['🔴','red','빨간색','rad'],['🔵','blue','파란색','bleu'],['🟢','green','초록색','gren'],['🟡','yellow','노란색','yelow'],['😀','happy','행복한','happi'],['😢','sad','슬픈','sadd'],['🔥','hot','뜨거운','hat'],['🧊','cold','차가운','colt'],['✋','hand','손','hend'],['👁️','eye','눈','aye'],['👃','nose','코','noze'],['👂','ear','귀','eer'],['👩','mother','엄마','mather'],['👨','father','아빠','fother'],['🧑‍🏫','teacher','선생님','teecher'],['🧒','friend','친구','freind']];
const EN_SENT = [['I like pizza.','나는 피자를 좋아해요.'],['I have a dog.','나는 강아지가 있어요.'],['It is sunny today.','오늘은 날씨가 맑아요.'],['Where is the bathroom?','화장실이 어디예요?'],['How old are you?','너는 몇 살이니?'],['Let\'s go to the park.','공원에 가자.'],['I am hungry.','나는 배가 고파요.'],['Can you help me?','나를 도와줄 수 있어요?'],['What is your name?','너의 이름은 뭐니?'],['The cat is on the bed.','고양이가 침대 위에 있어요.'],['I can swim.','나는 수영할 수 있어요.'],['Thank you very much.','정말 고마워요.'],['It is raining.','비가 오고 있어요.'],['I don\'t like carrots.','나는 당근을 좋아하지 않아요.'],['This is my house.','여기는 우리 집이에요.'],['How much is it?','이거 얼마예요?'],['Nice to meet you.','만나서 반가워요.'],['I want ice cream.','나는 아이스크림을 먹고 싶어요.'],['Open the door, please.','문을 열어 주세요.'],['See you tomorrow.','내일 봐요.']];
// 엄마·아빠: 어려운 상식 [문제, 정답, 오답3]
const TRIVIA = [
  ['한글(훈민정음)이 세상에 반포된 해는?', '1446년', ['1392년', '1592년', '1500년']],
  ['에펠탑이 완성된 해는?', '1889년', ['1789년', '1912년', '1850년']],
  ['자유의 여신상을 미국에 선물한 나라는?', '프랑스', ['영국', '스페인', '네덜란드']],
  ['세계에서 땅이 가장 넓은 나라는?', '러시아', ['캐나다', '중국', '미국']],
  ['2023년부터 인구가 세계에서 가장 많은 나라는?', '인도', ['중국', '미국', '인도네시아']],
  ['세계에서 가장 높은 산은?', '에베레스트', ['K2', '킬리만자로', '몽블랑']],
  ['지구에서 가장 큰 바다는?', '태평양', ['대서양', '인도양', '북극해']],
  ['호주의 수도는?', '캔버라', ['시드니', '멜버른', '퍼스']],
  ['캐나다의 수도는?', '오타와', ['토론토', '밴쿠버', '몬트리올']],
  ['브라질의 수도는?', '브라질리아', ['리우데자네이루', '상파울루', '살바도르']],
  ['튀르키예의 수도는?', '앙카라', ['이스탄불', '이즈미르', '안탈리아']],
  ['스위스의 수도는?', '베른', ['취리히', '제네바', '바젤']],
  ['베트남의 수도는?', '하노이', ['호찌민', '다낭', '후에']],
  ['뉴질랜드의 수도는?', '웰링턴', ['오클랜드', '크라이스트처치', '퀸스타운']],
  ['모로코의 수도는?', '라바트', ['카사블랑카', '마라케시', '페스']],
  ['\'모나리자\'를 그린 화가는?', '레오나르도 다빈치', ['미켈란젤로', '라파엘로', '피카소']],
  ['서울 올림픽이 열린 해는?', '1988년', ['1986년', '1992년', '2002년']],
  ['\'로미오와 줄리엣\'을 쓴 작가는?', '셰익스피어', ['괴테', '톨스토이', '디킨스']],
  ['\'운명 교향곡\'을 작곡한 사람은?', '베토벤', ['모차르트', '바흐', '쇼팽']],
  ['태양계에서 가장 큰 행성은?', '목성', ['토성', '해왕성', '지구']],
  ['태양에 가장 가까운 행성은?', '수성', ['금성', '화성', '지구']],
  ['일본의 돈 단위는?', '엔', ['위안', '바트', '루피']],
  ['인도의 돈 단위는?', '루피', ['디르함', '바트', '페소']],
  ['남아메리카에서 가장 큰 나라는?', '브라질', ['아르헨티나', '페루', '콜롬비아']],
  ['명량 해전에서 12척의 배로 크게 이긴 장군은?', '이순신', ['권율', '강감찬', '을지문덕']],
  ['살수대첩에서 수나라 군대를 물리친 장군은?', '을지문덕', ['강감찬', '이순신', '김유신']],
  ['고대 세계 7대 불가사의 중 지금도 남아 있는 것은?', '기자의 대피라미드', ['바빌론의 공중정원', '로도스의 거상', '알렉산드리아 등대']],
  ['북반구에서 1년 중 낮이 가장 긴 날은?', '하지', ['동지', '춘분', '추분']],
  ['올림픽 오륜기의 고리는 몇 개?', '5개', ['4개', '6개', '7개']],
  ['세계에서 가장 큰 \'더운\' 사막은?', '사하라 사막', ['고비 사막', '칼라하리 사막', '아타카마 사막']],
  ['\'어린 왕자\'를 쓴 작가 생텍쥐페리의 나라는?', '프랑스', ['영국', '독일', '이탈리아']],
  ['피사의 사탑이 있는 나라는?', '이탈리아', ['스페인', '그리스', '프랑스']],
  ['앙코르와트가 있는 나라는?', '캄보디아', ['태국', '베트남', '라오스']],
  ['마추픽추가 있는 나라는?', '페루', ['칠레', '볼리비아', '멕시코']],
  ['타지마할이 있는 나라는?', '인도', ['파키스탄', '이란', '방글라데시']],
  ['원소 기호 \'H\'는 무엇일까?', '수소', ['헬륨', '산소', '질소']],
  ['대한민국의 나라꽃은?', '무궁화', ['진달래', '개나리', '벚꽃']],
  ['세계에서 가장 작은 나라는?', '바티칸 시국', ['모나코', '산마리노', '리히텐슈타인']],
  ['모차르트가 태어난 곳은 지금의 어느 나라?', '오스트리아', ['독일', '이탈리아', '체코']],
  ['물이 끓는 온도는? (1기압)', '100°C', ['90°C', '80°C', '120°C']],
  ['빛이 태양에서 지구까지 오는 데 걸리는 시간은 약?', '8분', ['8초', '8시간', '1분']],
  ['사람 몸에서 가장 큰 기관은?', '피부', ['간', '뇌', '심장']],
  ['조선을 세운 사람은?', '이성계', ['왕건', '세종대왕', '정도전']],
  ['고려를 세운 사람은?', '왕건', ['이성계', '궁예', '견훤']],
  ['\'별이 빛나는 밤\'을 그린 화가는?', '빈센트 반 고흐', ['클로드 모네', '피카소', '렘브란트']],
];

// 로테리아 카드 (스페인어)
const LOTERIA = [['☀️','el sol','해'],['🌙','la luna','달'],['🐱','el gato','고양이'],['🐶','el perro','개'],['⭐','la estrella','별'],['❤️','el corazón','하트'],['🍉','la sandía','수박'],['🌳','el árbol','나무'],['🏠','la casa','집'],['🐟','el pez','물고기'],['🌸','la flor','꽃'],['👒','el sombrero','모자'],['✋','la mano','손'],['🐦','el pájaro','새'],['🐸','la rana','개구리'],['⛵','el barco','배']];
// 카루타 (어른: 일본어 듣기)
const JA_WORDS = [['🐱','ねこ','고양이','네코'],['🐶','いぬ','개','이누'],['🍎','りんご','사과','링고'],['🌸','さくら','벚꽃','사쿠라'],['🌙','つき','달','츠키'],['🌊','うみ','바다','우미'],['⛰️','やま','산','야마'],['🍣','すし','초밥','스시'],['🚗','くるま','자동차','쿠루마'],['📚','ほん','책','혼'],['💧','みず','물','미즈'],['🔥','ひ','불','히'],['🐟','さかな','물고기','사카나'],['🌳','き','나무','키'],['☀️','たいよう','태양','타이요'],['🍵','おちゃ','차','오차']];

// ===== 나라별 퀴즈 재료 =====
const CAPITAL = { '태국': '방콕', '중국': '베이징', '베트남': '하노이', '대한민국': '서울', '싱가포르': '싱가포르', '인도': '뉴델리', '아랍에미리트': '아부다비', '이집트': '카이로', '가나': '아크라', '튀르키예': '앙카라', '그리스': '아테네', '이탈리아': '로마', '스페인': '마드리드', '프랑스': '파리', '영국': '런던', '독일': '베를린', '브라질': '브라질리아', '아르헨티나': '부에노스아이레스', '멕시코': '멕시코시티', '미국': '워싱턴 D.C.', '호주': '캔버라', '일본': '도쿄' };
// 문제를 낼 때 쓰는 '~라면' 환율 (실제 환율이 아니라 계산 연습용)
const RATE_NICE = { THB: 40, CNY: 200, SGD: 1000, INR: 16, AED: 400, EGP: 30, GHS: 100, TRY: 40, EUR: 1500, GBP: 1800, BRL: 250, MXN: 80, USD: 1400, AUD: 900, JPY: 9, TWD: 45 };
// 엄마·아빠용 나라 상식 [문제, 정답, 오답3]
const COUNTRY_Q = {
  '태국': [['태국의 옛날 나라 이름은?', '시암', ['버마', '실론', '페르시아']]],
  '중국': [['만리장성을 크게 이어 쌓은 중국의 첫 황제는?', '진시황', ['한무제', '칭기즈 칸', '강희제']]],
  '베트남': [['베트남 국기 가운데 별은 무슨 색일까요?', '노란색', ['흰색', '파란색', '초록색']]],
  '대한민국': [['한글날은 몇 월 며칠일까요?', '10월 9일', ['10월 3일', '8월 15일', '3월 1일']], ['남한에서 가장 높은 산은?', '한라산', ['지리산', '설악산', '소백산']]],
  '싱가포르': [['싱가포르의 상징 \'머라이언\'은 무엇과 무엇이 합쳐진 모습일까요?', '사자와 물고기', ['호랑이와 새', '용과 거북', '코끼리와 물고기']]],
  '인도': [['인도에서 가장 많은 사람이 쓰는 언어는?', '힌디어', ['타밀어', '우르두어', '페르시아어']]],
  '아랍에미리트': [['아랍에미리트는 몇 개의 \'에미리트(토후국)\'가 모인 나라일까요?', '7개', ['3개', '5개', '10개']]],
  '이집트': [['이집트를 흐르는 아주 긴 강은?', '나일강', ['아마존강', '미시시피강', '양쯔강']]],
  '가나': [['가나가 1957년에 독립하기 전 다스리던 나라는?', '영국', ['프랑스', '포르투갈', '네덜란드']]],
  '튀르키예': [['이스탄불의 옛 이름은?', '콘스탄티노플', ['알렉산드리아', '카르타고', '바빌론']]],
  '그리스': [['그리스 신화에서 신들의 왕은?', '제우스', ['포세이돈', '하데스', '아폴론']]],
  '이탈리아': [['베네치아에서 사람들이 운하를 다닐 때 타는 배는?', '곤돌라', ['카누', '요트', '뗏목']]],
  '스페인': [['바르셀로나에 있는 가우디의 성당은?', '사그라다 파밀리아', ['노트르담 대성당', '성 베드로 대성당', '쾰른 대성당']]],
  '프랑스': [['프랑스 혁명이 시작된 해는?', '1789년', ['1689년', '1889년', '1914년']]],
  '영국': [['영국 국기를 부르는 이름은?', '유니언 잭', ['성조기', '삼색기', '단네브로']]],
  '독일': [['베를린 장벽이 무너진 해는?', '1989년', ['1979년', '1991년', '1961년']]],
  '브라질': [['브라질 사람들이 쓰는 말은?', '포르투갈어', ['스페인어', '영어', '프랑스어']]],
  '아르헨티나': [['아르헨티나와 칠레 사이에 길게 뻗은 산맥은?', '안데스 산맥', ['알프스 산맥', '로키 산맥', '히말라야 산맥']]],
  '멕시코': [['멕시코에서 처음 길러 먹기 시작한 곡식은?', '옥수수', ['쌀', '밀', '보리']]],
  '미국': [['미국 국기에 있는 별은 몇 개일까요?', '50개', ['48개', '13개', '52개']], ['하와이가 미국의 50번째 주가 된 해는?', '1959년', ['1945년', '1969년', '1912년']]],
  '호주': [['호주에 사는, 알을 낳는 포유류는?', '오리너구리', ['캥거루', '코알라', '웜뱃']]],
  '일본': [['일본에서 가장 높은 산은?', '후지산', ['아소산', '다테야마', '한라산']]],
  '대만': [['버블티의 동그란 알갱이(펄)는 무엇으로 만들까요?', '타피오카', ['찹쌀', '젤라틴', '감자']]],
};
