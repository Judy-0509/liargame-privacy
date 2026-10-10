window.KR = window.KR || {};
(() => {
  const D = KR.DATA;
  const U = KR.util = {};

  U.interp = (t, y) => {
    const ks = Object.keys(t).map(Number).sort((a, b) => a - b);
    if (y <= ks[0]) return t[ks[0]];
    if (y >= ks[ks.length - 1]) return t[ks[ks.length - 1]];
    for (let i = 1; i < ks.length; i++) if (y <= ks[i]) { const a = ks[i - 1], b = ks[i]; return t[a] + (t[b] - t[a]) * (y - a) / (b - a); }
    return t[ks[ks.length - 1]];
  };
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.fmtMan = v => {
    const neg = v < 0; v = Math.round(Math.abs(v));
    if (v === 0) return '0원';
    const eok = Math.floor(v / 10000), man = v % 10000;
    let out = eok ? eok.toLocaleString('ko-KR') + '억' : '';
    if (man || !eok) out += (eok ? ' ' : '') + man.toLocaleString('ko-KR') + '만';
    return (neg ? '−' : '') + out + ' 원';
  };
  U.rnd = s => { s.rng = (s.rng + 0x6D2B79F5) | 0; let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  U.chance = (s, p) => U.rnd(s) < p;
  U.int = (s, lo, hi) => lo + Math.floor(U.rnd(s) * (hi - lo + 1));
  U.pick = (s, arr) => arr[Math.floor(U.rnd(s) * arr.length)];
  U.weighted = (s, arr, w) => {
    const ws = arr.map((x, i) => Math.max(0, w(x, i))); const tot = ws.reduce((a, b) => a + b, 0);
    let r = U.rnd(s) * tot;
    for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  U.normal = (s, m, sd) => { const u = 1 - U.rnd(s), v = U.rnd(s); return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  U.ageKo = a => `${a}세`;

  const L = KR.life = (() => {
    const cache = {};
    const slope = { M: 0.092, F: 0.102 };
    const mu = (p, a) => a === 0 ? -Math.log(1 - p.q0) : p.c + p.A * Math.exp(p.b * a) + p.k * Math.max(0, (12 - a) / 12);
    const e0of = p => { let S = 1, e = 0; for (let a = 0; a < 115; a++) { const q = 1 - Math.exp(-mu(p, a)); e += S * (1 - q / 2); S *= 1 - q; } return e; };
    function params(sex, year) {
      const y = Math.round(U.clamp(year, 1950, 2100) / 5) * 5, key = sex + y;
      if (cache[key]) return cache[key];
      const target = U.interp(sex === 'M' ? D.byYear.e0M : D.byYear.e0F, y);
      const imr = U.interp(D.byYear.imr, y);
      const era = Math.pow(Math.max(0.6, imr / 2.5), 0.5);
      const p = { b: slope[sex], q0: imr / 1000, c: (sex === 'M' ? 0.00035 : 0.00015) * era, k: 0.0006 * Math.pow(imr / 2.5, 0.8), A: 1e-5 };
      let lo = -18, hi = -2;
      for (let i = 0; i < 48; i++) { const mid = (lo + hi) / 2; p.A = Math.exp(mid); if (e0of(p) > target) lo = mid; else hi = mid; }
      p.A = Math.exp((lo + hi) / 2); p.e0 = target;
      return cache[key] = p;
    }
    const hazard = (sex, year, age) => mu(params(sex, year), Math.min(age, 110));
    const q = (sex, year, age, f = 1) => 1 - Math.exp(-hazard(sex, year, age) * f);
    const cohort = (sex, birthYear) => { const out = [1]; let S = 1; for (let a = 0; a < 110; a++) { S *= 1 - q(sex, birthYear + a, a); out.push(S); } return out; };
    const e0 = (sex, year) => params(sex, year).e0;
    return { hazard, q, cohort, e0, params };
  })();

  const S = KR.Sim = {};
  S.hazardScale = { M: 0.55, F: 0.6 };
  const yr = (t, y) => U.interp(D.byYear[t], y);
  const hhSize = y => U.interp({ 1960: 5.7, 1970: 5.2, 1980: 4.5, 1990: 3.7, 2000: 3.1, 2010: 2.7, 2024: 2.2, 2050: 2.0, 2070: 1.9 }, y);
  S.incomeIndex = y => yr('income', y);
  S.payIndex = y => yr('income', y) * Math.sqrt(hhSize(y) / 2.2);
  S.medianIncome = y => 5000 * S.incomeIndex(y) * (hhSize(y) / 2.2);
  const region = s => D.regions[s.region];
  const decileF = d => Math.exp((5.5 - d) * 0.06);
  const expectedHealth = a => a < 25 ? 78 + a / 25 * 4 : 82 - 0.45 * (a - 25);

  S.log = (s, t, k = 'life') => { s.log.push({ a: s.age, y: s.year, t, k }); if (s.log.length > 900) s.log.shift(); };
  S.bump = (s, k, d) => { s.stats[k] = U.clamp(s.stats[k] + d, 0, 100); };
  S.cost = (s, v) => { s.money.assets -= v; s.money.spentYear = (s.money.spentYear || 0) + v; };
  S.gain = (s, v) => { s.money.assets += v; };

  const decadeKey = y => U.clamp(Math.floor(y / 10) * 10, 1960, 2030);
  S.makeName = (s, sex, y) => U.weighted(s, D.surnames, x => x[1])[0] + U.pick(s, D.givenNames[decadeKey(y)][sex]);

  function nearestRow(rows, y) { let r = rows[0]; for (const row of rows) if (row[0] <= y) r = row; return r[1]; }

  S.newLife = function (o, cohortChild) {
    const by = o.birthYear;
    const s = { v: 1, rng: (o.seed >>> 0) || 1, birthYear: by, year: by, age: 0, alive: true, focus: 'balance', taken: {}, last: {}, flags: {}, queue: [], log: [], map: [], notes: {}, pauses: [5, 15, 30, 50, 70], auto: !!cohortChild };
    s.sex = U.chance(s, D.maleShare) ? 'M' : 'F';
    const w = U.clamp((by - 1970) / 54, 0, 1);
    s.region = D.regions.indexOf(U.weighted(s, D.regions, r => r.share1970 + (r.share2024 - r.share1970) * w));
    s.name = S.makeName(s, s.sex, by);
    const ftype = U.weighted(s, D.familyType, x => x[1])[0];
    const decile = U.weighted(s, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (d, i) => D.decileBirthWeight[i]);
    const mAge = Math.round(U.clamp(U.normal(s, yr('motherAge', by), 4), 18, 46));
    const parentEdu = (pby) => { const r = yr('univRate', pby + 18) * (0.6 + decile * 0.08); const hs = yr('hsRate', pby + 15); return U.chance(s, r) ? '대졸' : U.chance(s, hs) ? '고졸' : '중졸 이하'; };
    s.parents = { type: ftype, decile, together: ftype === 'both', hard: 0, assets: decile * decile * 900,
      mother: { age: mAge, alive: ftype !== 'father', edu: parentEdu(by - mAge) },
      father: { age: Math.round(mAge + D.fatherGap + U.normal(s, 0, 2)), alive: ftype !== 'mother', edu: parentEdu(by - mAge - 2) } };
    const n = U.weighted(s, [1, 2, 3, 4, 5, 6], (x, i) => nearestRow(D.familySize, by)[i]);
    s.birthOrder = U.int(s, 1, n);
    s.siblings = [];
    for (let i = 1; i < s.birthOrder; i++) s.siblings.push({ sex: U.chance(s, 0.51) ? 'M' : 'F', by: by - (s.birthOrder - i) * U.int(s, 2, 3), alive: true, born: true });
    for (let i = s.birthOrder + 1; i <= n; i++) s.siblings.push({ sex: U.chance(s, 0.51) ? 'M' : 'F', by: by + (i - s.birthOrder) * U.int(s, 2, 3), alive: true, born: false });
    s.stats = { health: U.clamp(U.normal(s, 78, 7), 40, 95), happy: 62, know: U.clamp(U.normal(s, 32, 7) + (decile - 5.5) * 1.2, 5, 70), rel: U.clamp(U.normal(s, 62, 9), 20, 95) };
    s.money = { assets: 0, debt: 0, income: 0, spend: 0, alloc: { deposit: 0, stock: 0, coin: 0 }, loan: 0, deposit: 0, homeValue: 0, lifetimeIncome: 0 };
    s.housing = 'parents';
    s.edu = { stage: 'pre', hs: null, univ: null, degree: '무학', left: 0, tutoring: false, repeat: 0, plan: null, grad: false, tuition: null };
    s.mil = { status: s.sex === 'M' ? 'none' : 'na', left: 0, enlistAt: null };
    s.work = { status: 'child', type: null, since: 0, years: 0, pay: 0, careerBreak: false, seeking: 0, exam: 0, paidYears: 0, avgPay: 0, retiredAt: null, mainType: null };
    s.love = { partner: null, since: 0, married: false, spouse: null, marriedAt: null, divorced: 0, single: false, trying: false, tryYears: 0, asked: 0 };
    s.kids = [];
    s.hs = { smoker: false, smokeYears: 0, drinker: false, exercise: false, cond: [], cancer: null, cancers: 0, dementia: false, careHome: false, poverty: false };
    s.items = []; s.car = null; s.pet = null;
    s.hIdx = 1;
    s.cohortSeed = (o.seed * 7919) >>> 0;
    const r = region(s);
    S.log(s, `${by}년, ${r.name}에서 ${s.sex === 'M' ? '남자아이' : '여자아이'}가 태어났다. 이름은 ${s.name}.`, 'birth');
    const perDay = Math.round(yr('births', by) / 365);
    S.log(s, `그 해 한국에서는 하루 약 ${perDay.toLocaleString('ko-KR')}명이 태어났다. 이 아이는 그중 하나였다.`, 'birth');
    const fam = ftype === 'both' ? '부모' : ftype === 'mother' ? '어머니' : ftype === 'father' ? '아버지' : '할머니, 할아버지';
    const sib = s.birthOrder === 1 ? (n > 1 ? '첫째' : '외동') : `${s.birthOrder === n ? '막내' : s.birthOrder + '번째'}`;
    S.log(s, `${fam}와 함께, 소득 ${decile}분위 가정의 ${sib}로 자라게 됐다. 어머니 ${mAge}세, 아버지 ${s.parents.father.age}세.`, 'birth');
    if (!cohortChild) {
      s.cohort = [];
      for (let i = 0; i < 4; i++) s.cohort.push(S.newLife({ birthYear: by, seed: (o.seed * 31 + i * 104729 + 17) >>> 0 }, true));
    }
    return s;
  };

  function pushDecision(s, id) { if (!s.queue.includes(id)) s.queue.push(id); }
  S.pushDecision = pushDecision;

  S.beginYear = function (s) {
    if (!s.alive) return null;
    s.age += 1; s.year += 1;
    s.money.spentYear = 0; s.shock = null; s.yearShock = { happy: 0, rel: 0 };
    const pause = !s.auto && s.pauses.includes(s.age) ? s.age : null;
    const defs = KR.DECISIONS;
    for (const def of defs) {
      if (s.queue.length >= 3) break;
      if (s.queue.includes(def.id)) continue;
      if (def.max && (s.taken[def.id] || 0) >= def.max) continue;
      if (def.cooldown && s.last[def.id] != null && s.age - s.last[def.id] < def.cooldown) continue;
      try { if (def.when(s)) pushDecision(s, def.id); } catch (e) { console.error(def.id, e); }
    }
    return { pause, decisions: s.queue.slice() };
  };

  S.decision = (s, id) => {
    const def = KR.DECISIONS.find(d => d.id === id);
    if (!def || (def.valid && !def.valid(s))) { s.queue = s.queue.filter(q => q !== id); return null; }
    const opts = def.options(s).filter(o => !o.hide);
    return { id, title: typeof def.title === 'function' ? def.title(s) : def.title, text: typeof def.text === 'function' ? def.text(s) : def.text, options: opts.map(o => ({ label: o.label, hint: typeof o.hint === 'function' ? o.hint(s) : o.hint })) , _opts: opts };
  };
  S.resolve = (s, id, idx) => {
    const d = S.decision(s, id); if (!d) return null; const opt = d._opts[idx] || d._opts[0];
    s.taken[id] = (s.taken[id] || 0) + 1; s.last[id] = s.age;
    s.queue = s.queue.filter(q => q !== id);
    opt.apply(s);
    return opt;
  };
  S.autoChoose = (s, id) => {
    const d = S.decision(s, id); if (!d) return null;
    const opt = U.weighted(s, d._opts, o => (o.auto ? o.auto(s) : 1) * (o.focus && o.focus === s.focus ? 2 : 1));
    return S.resolve(s, id, d._opts.indexOf(opt));
  };

  const flavor = {
    infant: ['처음 걸었다.', '말을 하기 시작했다.', '놀이터에서 하루를 보냈다.', '할머니 집에 다녀왔다.', '감기로 며칠 앓았다.'],
    school: ['운동회에서 달렸다.', '친구와 비밀을 나눴다.', '시험을 망쳤다.', '처음으로 좋아하는 사람이 생겼다.', '방학이 너무 짧았다.', '수학여행을 갔다.', '학원 가는 길이 멀었다.', '급식에 돈가스가 나온 날은 행복했다.', '체육대회에서 반이 우승했다.', '친구와 크게 싸우고 일주일 만에 화해했다.', '생일에 반 아이들이 편지를 써 줬다.', '학교 앞 문방구에서 뽑기를 했다.', '전교생 앞에서 상을 받았다.', '야간에 몰래 만화방에 갔다.'],
    infantx: [],
    univ: ['동아리에 들어갔다.', '밤새 과제를 했다.', '첫 MT.', '아르바이트로 밤을 보냈다.', '친구들과 여행을 갔다.', '진로가 막막했다.', '축제 주점에서 밤을 새웠다.', '도서관 자리를 맡으려 아침 일찍 갔다.', '선배가 밥을 사 줬다.', '전공을 바꿀까 고민했다.', '첫 학기 성적표를 숨겼다.', '자취방에 친구들이 몰려왔다.'],
    work: ['야근이 이어졌다.', '첫 월급으로 부모님께 선물을 샀다.', '점심마다 같은 식당에 갔다.', '회식이 길었다.', '월요일이 무거웠다.', '휴가를 내고 바다를 봤다.', '통장 잔고를 몇 번이나 확인했다.'],
    seek: ['자기소개서를 다시 썼다.', '면접에서 떨어졌다.', '도서관에서 하루를 보냈다.', '친구들의 취업 소식을 들었다.'],
    home: ['아이와 하루가 다 갔다.', '놀이터에서 다른 부모들을 만났다.', '예전 직장 동료가 연락해 왔다.'],
    retire: ['동네 산을 올랐다.', '손주 사진을 들여다봤다.', '오래된 친구와 통화했다.', '병원 가는 날이 늘었다.', '옛 사진을 정리했다.'],
    mil: ['훈련소에서 첫 편지를 썼다.', '휴가를 나왔다.', '동기들과 밤을 지켰다.'],
  };

  function stageOf(s) {
    if (s.hs.careHome) return 'care';
    if (s.mil.status === 'serving') return 'mil';
    if (s.work.status === 'retired') return 'retire';
    if (s.edu.stage === 'univ' || s.edu.stage === 'grad') return 'univ';
    if (s.work.status === 'employed' || s.work.status === 'self') return 'work';
    if (s.work.status === 'seeking' || s.work.status === 'unemployed') return 'seek';
    if (s.work.status === 'home') return 'home';
    if (s.age < 6) return 'infant';
    return 'school';
  }
  S.stageOf = stageOf;

  function yearHistory(s) {
    for (const h of D.history) if (h[0] === s.year) { S.log(s, h[1], 'hist'); if (h[2]) s.shock = h[2]; }
  }

  function parentDie(s, who) {
    const p = s.parents[who]; p.alive = false;
    const label = who === 'mother' ? '어머니' : '아버지';
    S.log(s, `${label}가 ${p.age}세로 세상을 떠났다.`, 'family');
    s.yearShock.happy -= s.age < 20 ? 25 : 15; s.yearShock.rel -= 6;
    if (!s.parents.mother.alive && !s.parents.father.alive && s.age >= 18) {
      const share = Math.round(s.parents.assets * S.incomeIndex(s.year) * 0.7 / (s.siblings.length + 1));
      if (share > 300) { S.gain(s, share); S.log(s, `${U.fmtMan(share)}을 상속받았다.`, 'money'); }
    }
    if (s.age < 18 && s.parents.together) { s.parents.together = false; s.parents.hard = 3; }
  }

  function yearFamily(s) {
    for (const who of ['mother', 'father']) {
      const p = s.parents[who]; if (!p.alive) continue;
      p.age += 1;
      if (U.chance(s, L.q(who === 'mother' ? 'F' : 'M', s.year, p.age, decileF(s.parents.decile)))) parentDie(s, who);
    }
    if (s.parents.hard > 0) s.parents.hard -= 1;
    if (s.age < 20 && s.parents.together && s.parents.mother.alive && s.parents.father.alive) {
      const shockF = s.shock ? 2 : 1;
      if (U.chance(s, 0.007 * shockF)) { s.parents.together = false; s.parents.hard = 4; S.log(s, '부모가 이혼했다. 집이 조용해졌다.', 'family'); s.yearShock.happy -= 15; s.yearShock.rel -= 8; }
      else if (s.shock && U.chance(s, s.shock === 'imf' ? 0.25 : 0.1)) { s.parents.hard = 2; S.log(s, s.shock === 'imf' ? '아버지의 회사가 어려워졌다. 집안 공기가 달라졌다.' : '집안 형편이 나빠졌다.', 'family'); s.yearShock.happy -= 6; }
    }
    for (const sb of s.siblings) if (!sb.born && sb.by === s.year) { sb.born = true; S.log(s, `${sb.sex === 'M' ? '남동생' : '여동생'}이 태어났다.`, 'family'); s.yearShock.rel += 3; }
    if (s.love.married && s.love.spouse) {
      const sp = s.love.spouse; sp.age += 1;
      if (sp.alive && U.chance(s, L.q(sp.sex, s.year, sp.age, decileF(S.decileOf(s)) * 1.0))) {
        sp.alive = false; s.love.married = false; s.love.widowed = true;
        S.log(s, `배우자가 ${sp.age}세로 세상을 떠났다.`, 'family'); s.yearShock.happy -= 25; s.yearShock.rel -= 10;
      }
    }
    for (const k of s.kids) {
      if (!k.alive) continue;
      const ka = s.year - k.by;
      if (ka === 0 && U.chance(s, yr('imr', s.year) / 1000 * decileF(S.decileOf(s)))) { k.alive = false; S.log(s, `${k.n}이(가) 첫돌을 맞지 못했다.`, 'family'); s.yearShock.happy -= 35; s.yearShock.rel -= 10; continue; }
      if (ka === 6) S.log(s, `${k.n}이(가) 초등학교에 들어갔다.`, 'family');
      if (ka === 18) { k.univ = U.chance(s, yr('univRate', s.year) * (0.7 + S.decileOf(s) * 0.05)); S.log(s, k.univ ? `${k.n}이(가) 대학에 들어갔다.` : `${k.n}이(가) 고등학교를 마치고 일을 시작했다.`, 'family'); }
      if (ka >= 24 && k.home && U.chance(s, 0.2)) { k.home = false; S.log(s, `${k.n}이(가) 독립했다.`, 'family'); }
      if (!k.married && ka >= 27 && U.chance(s, ka < 40 ? 0.08 : 0.02)) { k.married = true; k.marriedYear = s.year; S.log(s, `${k.n}이(가) 결혼했다.`, 'family'); s.yearShock.happy += 8; pushDecision(s, 'kid_wedding'); }
      if (k.married && !k.kids && ka >= 29 && U.chance(s, 0.15)) { k.kids = 1; S.log(s, '손주가 태어났다.', 'family'); s.yearShock.happy += 8; s.yearShock.rel += 5; }
    }
  }

  S.decileOf = s => {
    if (s.age < 25 && s.work.status !== 'employed') return s.parents.decile;
    const inc = s.money.income || 0, med = S.medianIncome(s.year);
    const r = inc / Math.max(1, med);
    return U.clamp(Math.round(1 + r * 4.5), 1, 10);
  };

  function tutoringProb(s) { const d = s.parents.decile; return d <= 3 ? D.edu.tutoring[0] : d <= 7 ? D.edu.tutoring[1] : D.edu.tutoring[2]; }
  function tutoringCost(s) { const d = s.parents.decile; const c = d <= 3 ? D.edu.tutoringCost[0] : d <= 7 ? D.edu.tutoringCost[1] : D.edu.tutoringCost[2]; return c * 12 * S.incomeIndex(s.year) * (region(s).capital ? 1.15 : 1); }

  function yearEducation(s) {
    const a = s.age, e = s.edu, y = s.year;
    const hardF = s.parents.hard > 0 ? 0.6 : 1;
    if (a === 3) { S.log(s, '어린이집에 다니기 시작했다.', 'edu'); }
    if (a === 6) { e.stage = 'elem'; S.log(s, '초등학교에 입학했다.', 'edu'); e.tutoring = U.chance(s, tutoringProb(s) * Math.min(1, S.incomeIndex(y) * 1.4)); if (e.tutoring) S.log(s, '학원에 다니기 시작했다.', 'edu'); }
    if (a === 12) {
      if (U.chance(s, yr('midRate', y))) { e.stage = 'mid'; S.log(s, '중학교에 들어갔다.', 'edu'); }
      else { e.stage = 'none'; e.degree = '초졸'; S.log(s, '중학교에 가지 못했다. 집안일과 농사를 도왔다.', 'edu'); s.work.status = 'child'; s.flags.noSchool = true; }
    }
    if (a === 15 && e.stage === 'mid') {
      if (U.chance(s, yr('hsRate', y) * (s.parents.hard ? 0.9 : 1))) {
        e.stage = 'high'; e.hs = e.hs || '일반고';
        S.log(s, `${e.hs}에 입학했다.`, 'edu');
      } else { e.stage = 'none'; e.degree = '중졸'; S.log(s, '고등학교 대신 일터로 갔다.', 'edu'); s.work.status = 'seeking'; s.flags.noHS = true; }
    }
    if (a === 17 && e.stage === 'high') {
      e.degree = '고졸'; s.flags.know17 = Math.round(s.stats.know);
      const plan = e.plan || '취업';
      const score = s.stats.know + U.normal(s, 0, 7) + (e.tutoring ? 4 : 0) + S.hsBonus(s);
      e.score = score;
      if (plan === '재수') { e.repeat += 1; e.stage = 'repeat'; e.prevPlan = e.prevPlan || (s.stats.know >= 82 ? '최상위권' : '수도권4년제'); S.log(s, '수능을 봤다. 결과가 아쉬워 재수를 택했다.', 'edu'); S.cost(s, 1200 * S.incomeIndex(y)); }
      else if (plan === '취업') { e.stage = 'done'; S.log(s, e.hs === '특성화고' ? '특성화고를 졸업하고 바로 취업 전선에 나섰다.' : '고등학교를 졸업하고 일을 찾기로 했다.', 'edu'); s.work.status = 'seeking'; }
      else admit(s, plan, score);
    }
    if (e.stage === 'repeat') {
      if (a >= 18 && a === 17 + e.repeat) {
        const score = s.stats.know + U.normal(s, 0, 7) + 5 + (e.tutoring ? 3 : 0) + S.hsBonus(s); e.score = score;
        admit(s, e.plan === '재수' ? (e.prevPlan || '수도권4년제') : e.plan, score);
      }
    }
    if (e.stage === 'univ' || e.stage === 'grad') {
      if (s.mil.status !== 'serving') {
        e.left -= 1;
        if (e.stage === 'univ') {
          if (U.chance(s, 0.08) && e.left > 1) { e.left += 1; S.log(s, '한 해 휴학했다.', 'edu'); }
          else if (s.stats.know > 68 && s.parents.decile >= 6 && U.chance(s, 0.1) && e.left > 1) { S.log(s, '교환학생으로 한 학기를 보냈다.', 'edu'); S.bump(s, 'know', 3); S.bump(s, 'happy', 4); S.cost(s, 800 * S.incomeIndex(y)); }
          if (e.tuition === '알바') { S.bump(s, 'happy', -2); S.bump(s, 'know', -1); S.gain(s, 600 * S.incomeIndex(y)); }
          if (e.tuition === '대출') { s.money.debt += (e.univ.public ? D.edu.tuitionPublic : D.edu.tuitionPrivate) * S.incomeIndex(y); }
          else if (e.tuition === '장학금') { }
          else if (e.tuition === '부모' && s.parents.decile <= 4) S.bump(s, 'rel', 1);
          S.bump(s, 'know', s.focus === 'study' ? 4 : 2.5);
        } else S.bump(s, 'know', 4);
        if (e.left <= 0) {
          if (e.stage === 'univ') {
            e.degree = e.univ.kind === '전문대' ? '전문대졸' : '대졸'; e.grad = true;
            S.log(s, `${e.univ.kind === '전문대' ? '전문대' : e.univ.kind === '의약계열' ? '의약계열 대학' : '대학'}을 졸업했다.`, 'edu');
            e.stage = 'done'; s.work.status = 'seeking';
            if (e.univ.kind === '의약계열') { const t = U.weighted(s, [['의사', 55], ['치과의사', 12], ['한의사', 10], ['약사', 23]], x => x[1])[0]; S.startJob(s, '의료', `${t} 면허를 땄다. 수련이 시작됐다.`, t); }
            else if (e.major === '법·행정' && s.year >= 2009 && s.stats.know >= 70) pushDecision(s, 'lawschool');
            else if (s.stats.know >= 72 && e.univ.kind !== '전문대') pushDecision(s, 'grad_school');
          } else if (e.lawschool) { e.degree = '대학원졸'; e.stage = 'done'; e.lawschool = false; if (U.chance(s, 0.55 + (s.stats.know - 70) / 200)) S.startJob(s, '전문직', '변호사 시험에 합격했다.', '변호사'); else { s.work.status = 'seeking'; S.log(s, '변호사 시험에 떨어졌다. 다른 길을 찾아야 했다.', 'edu'); s.yearShock.happy -= 8; } }
          else { e.degree = '대학원졸'; e.stage = 'done'; s.work.status = 'seeking'; S.log(s, '대학원을 마쳤다.', 'edu'); }
        }
      }
    }
    if (e.stage === 'elem' || e.stage === 'mid' || e.stage === 'high') {
      let gain = 2.0 + (e.tutoring ? 1.0 : 0) + (s.focus === 'study' ? 1.5 : 0) + (s.parents.decile - 5.5) * 0.12 + U.normal(s, 0, 1.3);
      if (s.parents.hard > 0 && e.tutoring && U.chance(s, 0.5)) { e.tutoring = false; S.log(s, '형편이 어려워져 학원을 그만뒀다.', 'edu'); }
      S.bump(s, 'know', gain * hardF);
      if (e.tutoring) S.cost(s, 0);
      if (U.chance(s, D.edu.bullying * (s.stats.rel < 45 ? 2.5 : 1))) { S.log(s, '학교에서 괴롭힘을 당했다. 말할 사람이 없었다.', 'edu'); s.yearShock.happy -= 14; s.yearShock.rel -= 8; S.bump(s, 'know', -2); }
      if (e.stage === 'high' && s.flags.hsClub == null && U.chance(s, 0.3)) { s.flags.hsClub = true; S.log(s, '동아리에서 평생 친구를 만났다.', 'edu'); S.bump(s, 'rel', 5); }
    }
  }

  function admit(s, plan, score) {
    const e = s.edu, y = s.year;
    const cap = region(s).capital;
    const pCapital = 1 / (1 + Math.exp(-(score - 70) / 7));
    const pLocal = 1 / (1 + Math.exp(-(score - 48) / 8));
    const eraUniv = yr('univRate', y) / 0.73;
    const pTop = 1 / (1 + Math.exp(-(score - 93) / 4));
    const pMed = 1 / (1 + Math.exp(-(score - 93) / 3.5)) * (y >= 1990 ? 1 : 0.7);
    let kind = null, major = null;
    const capitalChain = () => { if (U.chance(s, pCapital * Math.min(1, eraUniv + 0.1))) return '수도권 4년제'; if (U.chance(s, pLocal)) return '지방 4년제'; return '전문대'; };
    if (plan === '의약') { if (U.chance(s, pMed)) { kind = '의약계열'; major = '의약'; } else { S.log(s, '의대 문턱은 높았다.', 'edu'); kind = U.chance(s, pTop) ? '최상위권 4년제' : capitalChain(); } }
    else if (plan === '최상위권') { if (U.chance(s, pTop)) kind = '최상위권 4년제'; else kind = capitalChain(); }
    else if (plan === '수도권4년제') kind = capitalChain();
    else if (plan === '4년제') { kind = U.chance(s, pLocal * Math.min(1.1, eraUniv + 0.2)) ? (cap && U.chance(s, 0.5) ? '수도권 4년제' : '지방 4년제') : '전문대'; }
    else if (plan === '예체능') { major = '예체능'; const sc = score + 12; kind = U.chance(s, 1 / (1 + Math.exp(-(sc - 70) / 7))) ? '수도권 4년제' : U.chance(s, 1 / (1 + Math.exp(-(sc - 48) / 8))) ? '지방 4년제' : '전문대'; }
    else kind = '전문대';
    if ((plan === '수도권4년제' || plan === '최상위권' || plan === '4년제') && kind === '전문대') S.log(s, '원하던 대학에는 가지 못했다.', 'edu');
    const isPublic = U.chance(s, kind === '전문대' ? 0.1 : kind === '최상위권 4년제' || kind === '의약계열' ? 0.45 : 0.25);
    e.univ = { kind, public: isPublic, tier: kind === '최상위권 4년제' || kind === '의약계열' ? 3 : kind === '수도권 4년제' ? 2 : kind === '지방 4년제' ? 1 : 0 };
    e.major = major || (KR.YOUTH ? KR.YOUTH.majorOf(s, e.track || '문과') : null);
    e.stage = 'univ'; e.left = kind === '전문대' ? 2 : kind === '의약계열' ? 6 : 4;
    S.log(s, `${kind === '의약계열' ? '의약계열 대학' : kind === '최상위권 4년제' ? '최상위권 대학' : kind + ' 대학'}에 입학했다.${e.major && kind !== '의약계열' ? ` 전공은 ${e.major}.` : ''} (수능 성적 상위 ${Math.max(1, Math.round(100 - score))}% 수준)`, 'edu');
    if (kind !== '전문대' && e.univ.tier >= 2 && !cap) { s.flags.movedCapital = true; s.housing = 'monthly'; S.log(s, '서울로 올라와 자취를 시작했다.', 'home'); }
    if (s.parents.decile <= 5) pushDecision(s, 'tuition'); else e.tuition = '부모';
  }

  S.hsBonus = s => { const h = s.edu.hs; return (h === '영재고' || h === '과학고' ? 10 : h === '외고' ? 5 : h === '자사고' ? 4 : 0) + (s.edu.gifted ? 2 : 0); };

  function yearMilitary(s) {
    const m = s.mil; if (m.status === 'na') return;
    if (m.status === 'none') {
      const inUniv = s.edu.stage === 'univ';
      const due = m.enlistAt != null ? s.age >= m.enlistAt : (inUniv ? s.age >= 20 : s.age >= 19);
      if (!due || s.age < 18) return;
      const h = s.stats.health;
      const r = U.rnd(s);
      const active = U.clamp(D.military.active + (h > 70 ? 0.04 : h < 50 ? -0.15 : 0), 0.5, 0.9), supp = 0.95 - active;
      if (r < active) { m.status = 'serving'; m.kind = '현역'; m.left = yr('serviceMonths', s.year); S.log(s, `병역 판정 현역. ${s.edu.stage === 'univ' ? '휴학하고 ' : ''}입대했다.`, 'mil'); }
      else if (r < active + supp) { m.status = 'serving'; m.kind = '사회복무'; m.left = yr('serviceMonths', s.year) + 3; S.log(s, '병역 판정 4급. 사회복무요원으로 복무를 시작했다.', 'mil'); }
      else { m.status = 'exempt'; S.log(s, '병역 판정에서 면제됐다.', 'mil'); }
      if (m.status === 'serving') { s.yearShock.rel -= 4; s.yearShock.happy -= 6; }
      return;
    }
    if (m.status === 'serving') {
      m.left -= 12;
      S.bump(s, 'health', 2);
      if (m.left <= 0) { m.status = 'done'; S.log(s, `${m.kind === '현역' ? '전역했다.' : '소집 해제됐다.'} 다시 일상으로.`, 'mil'); S.gain(s, 600 * S.incomeIndex(s.year)); s.yearShock.happy += 8; if (s.edu.stage === 'univ') S.log(s, '복학했다.', 'edu'); else if (s.edu.stage === 'done' || s.edu.stage === 'none') s.work.status = s.work.status === 'employed' ? 'employed' : 'seeking'; }
    }
  }

  S.payOf = function (s, type, years) {
    const j = D.jobs[type]; if (!j) return 0;
    const start = type === '해외' ? 22 : 24;
    const eff = Math.min(years, Math.max(0, j.peak - start));
    let p = j.start * S.payIndex(s.year) * Math.pow(1 + j.growth, eff) * (s.abroad ? 1.0 : region(s).wage);
    if (s.age > j.peak) p *= Math.pow(0.97, s.age - j.peak);
    const deg = s.edu.degree;
    p *= deg === '대학원졸' ? 1.15 : deg === '대졸' ? (s.edu.univ && s.edu.univ.tier === 3 ? 1.2 : s.edu.univ && s.edu.univ.tier === 2 ? 1.1 : 1.0) : deg === '전문대졸' ? 0.9 : deg === '고졸' ? 0.82 : 0.72;
    p *= s.edu.major === '공학' ? 1.05 : s.edu.major === '예체능' ? 0.9 : s.edu.major === '인문사회' ? 0.97 : 1;
    if (s.sex === 'F') p *= D.work.genderGap;
    if (s.work.careerBreak) p *= 0.78;
    p *= 0.8 + s.stats.know / 250;
    return Math.round(p);
  };

  S.startJob = function (s, type, note, title) {
    const w = s.work;
    w.status = type === '자영업' ? 'self' : 'employed'; w.type = type; w.since = s.age; w.years = 0; w.seeking = 0; w.exam = 0; w.title = title || null;
    if (!w.mainType || D.jobs[type].start > D.jobs[w.mainType].start) { w.mainType = type; w.mainTitle = title || null; }
    w.pay = S.payOf(s, type, 0);
    S.log(s, note || `${D.jobs[type].label}에서 일을 시작했다. 연봉 ${U.fmtMan(w.pay)}.`, 'work');
    s.yearShock.happy += 8;
    if (s.housing === 'parents' && s.love.married) s.housing = 'monthly';
  };

  function shockF(s, type) {
    if (!s.shock) return 1;
    if (s.shock === 'imf') return type === '자영업' ? 2.5 : 5;
    if (s.shock === 'gfc') return 1.8;
    if (s.shock === 'covid') return type === '자영업' || type === '프리랜서' ? 2.8 : 1.3;
    return 1;
  }

  function yearWork(s) {
    const w = s.work, a = s.age;
    if (s.mil.status === 'serving') return;
    if (w.status === 'child' && a >= 15 && (s.edu.stage === 'none')) w.status = 'seeking';
    if (w.status === 'seeking') {
      w.seeking += 1;
      if (w.exam > 0) {
        const p = 0.06 * (0.5 + s.stats.know / 100) * (s.year < 1995 ? 1.4 : 1);
        if (U.chance(s, p)) { S.startJob(s, '공공', `공무원 시험에 합격했다. ${w.exam}년의 준비가 끝났다.`); S.bump(s, 'happy', 10); }
        else { w.exam += 1; S.cost(s, 500 * S.incomeIndex(s.year)); S.bump(s, 'happy', -5); S.bump(s, 'know', 1.5); if (w.exam >= 3 && U.chance(s, 0.6)) { w.exam = 0; S.log(s, '시험을 접었다. 다른 길을 찾기로 했다.', 'work'); } else S.log(s, '올해도 시험에서 떨어졌다.', 'work'); }
        return;
      }
      if (w.plan) { applyJobPlan(s); w.plan = null; }
      else if (w.seeking >= 2 || s.flags.noHS || s.flags.noSchool) {
        const type = s.flags.noSchool ? (s.year < 1985 ? '농업' : '공장') : U.chance(s, D.work.nonRegular) ? '비정규' : s.year < 1990 ? '공장' : '중소';
        S.startJob(s, type);
      }
      if (w.status === 'seeking' && w.seeking > 1) s.yearShock.happy -= 6;
      return;
    }
    if (w.status === 'unemployed') {
      w.seeking += 1; s.yearShock.happy -= 8;
      if (U.chance(s, 0.5)) { w.status = 'seeking'; }
      return;
    }
    if (w.status === 'home') {
      const youngest = s.kids.filter(k => k.alive).reduce((m, k) => Math.min(m, s.year - k.by), 99);
      if (youngest >= 7 && a < 58 && U.chance(s, 0.12)) pushDecision(s, 'return_work');
      return;
    }
    if (w.status === 'employed' || w.status === 'self') {
      w.years += 1; w.paidYears += 1;
      const j = D.jobs[w.type];
      let pay = S.payOf(s, w.type, w.years);
      if (w.status === 'self') {
        pay *= Math.exp(U.normal(s, 0, 0.35)) / (s.shock ? shockF(s, '자영업') * 0.5 : 1);
        const failP = 0.19 * (s.shock ? shockF(s, '자영업') : 1) * (1 - (s.stats.know - 50) / 200) * (w.years <= 5 ? 1 : 0.5);
        if (U.chance(s, failP)) { S.log(s, '가게를 접었다. 남은 건 빚이었다.', 'work'); s.money.debt += Math.round(U.int(s, 2000, 8000) * S.incomeIndex(s.year)); w.status = 'unemployed'; w.type = null; s.yearShock.happy -= 18; return; }
        if (w.years === 5) S.log(s, '가게가 5년을 버텼다. 셋 중 하나만 살아남는 길이었다.', 'work');
      } else {
        const fireP = (1 - j.stable) * 0.08 * shockF(s, w.type) * (s.focus === 'work' ? 0.7 : 1);
        if (U.chance(s, fireP)) { S.log(s, s.shock ? '구조조정으로 회사를 나왔다.' : '회사를 나오게 됐다.', 'work'); S.gain(s, Math.round(pay / 12 * w.years)); w.status = 'unemployed'; w.type = null; s.yearShock.happy -= 15; return; }
        if (w.type !== '공공' && w.type !== '농업' && w.type !== '해외' && a >= 48 && a < 60 && U.chance(s, w.type === '대기업' ? 0.14 : 0.09)) {
          S.log(s, `${a}세, 주된 일자리에서 물러났다. 퇴직금 ${U.fmtMan(Math.round(pay / 12 * w.years))}.`, 'work'); S.gain(s, Math.round(pay / 12 * w.years)); w.status = 'unemployed'; w.type = null; w.exitedMain = true; s.yearShock.happy -= 8; pushDecision(s, 'second_career'); return;
        }
        if (w.type === '공공' && a >= 60) { retire(s, '정년퇴직했다.'); return; }
        if (a >= 60 && w.type !== '농업' && U.chance(s, a >= 70 ? 0.6 : 0.2)) { retire(s, '일을 그만두고 쉬기로 했다.'); return; }
        if (U.chance(s, 0.06) && a < 50) { S.log(s, '승진했다.', 'work'); pay *= 1.08; s.yearShock.happy += 5; }
        if (U.chance(s, 0.07) && s.focus !== 'rest') { S.log(s, '야근이 이어진 해였다.', 'work'); S.bump(s, 'health', -3); s.yearShock.happy -= 4; }
        if (s.stats.happy < 32 && U.chance(s, 0.3)) pushDecision(s, 'burnout');
        if (w.years >= 3 && a < 45 && U.chance(s, 0.05)) pushDecision(s, 'job_change');
      }
      if (a >= 75 && w.status === 'self') { retire(s, '가게를 정리하고 쉬기로 했다.'); return; }
      w.pay = Math.round(pay);
      w.avgPay = w.avgPay ? (w.avgPay * (w.paidYears - 1) + pay) / w.paidYears : pay;
    }
    if (w.status === 'retired') {
      if (s.oldJob && a >= 76) { s.oldJob = null; S.log(s, '일을 완전히 그만두었다.', 'work'); }
      if (a < 75 && !s.hs.dementia && s.stats.health > 45 && (s.taken.old_work || 0) < 2 && U.chance(s, 0.15)) pushDecision(s, 'old_work');
    }
  }

  function retire(s, note) { const w = s.work; w.status = 'retired'; w.retiredAt = s.age; w.type = null; S.log(s, note, 'work'); if (s.oldJob) { s.oldJob = null; } }
  S.retire = retire;

  function applyJobPlan(s) {
    const w = s.work, plan = w.plan, k = s.stats.know, tier = s.edu.univ ? s.edu.univ.tier : -1;
    const eduF = s.edu.degree === '대학원졸' ? 1.3 : tier === 2 ? 1.15 : tier === 1 ? 0.85 : tier === 0 ? 0.6 : 0.35;
    if (plan === '대기업') {
      const p = U.clamp(0.12 + (k - 50) / 120, 0.03, 0.75) * eduF * (s.shock ? 0.5 : 1);
      if (U.chance(s, p)) S.startJob(s, U.chance(s, 0.3) ? '공공' : '대기업');
      else { S.log(s, '대기업 공채에서 떨어졌다.', 'work'); s.yearShock.happy -= 6; if (w.seeking >= 2) S.startJob(s, U.chance(s, 0.3) ? '비정규' : U.chance(s, 0.5) ? '중견' : '중소', '눈높이를 낮춰 취업했다.'); }
    } else if (plan === '중소') {
      if (U.chance(s, 0.8 * (s.shock ? 0.6 : 1))) S.startJob(s, U.chance(s, D.work.nonRegular * 0.8) ? '비정규' : U.chance(s, 0.15) ? '중견' : '중소');
      else { S.log(s, '올해는 자리를 찾지 못했다.', 'work'); s.yearShock.happy -= 6; }
    } else if (plan === '공무원') { w.exam = 1; S.log(s, '공무원 시험 준비를 시작했다.', 'work'); S.cost(s, 500 * S.incomeIndex(s.year)); }
    else if (plan === '창업') { const cap = Math.round(5000 * S.incomeIndex(s.year)); if (s.money.assets < cap) s.money.debt += cap - Math.max(0, s.money.assets); s.money.assets = Math.max(0, s.money.assets - cap); S.startJob(s, '자영업', '빚을 내어 가게를 열었다.'); }
    else if (plan === '프리랜서') S.startJob(s, '프리랜서');
    else if (plan === '해외') { s.abroad = true; s.housing = 'monthly'; S.startJob(s, '해외', '짐을 싸서 한국을 떠났다. 해외에서 일을 시작했다.'); s.yearShock.rel -= 8; s.yearShock.happy += 4; }
    else if (plan === '임용') { if (U.chance(s, 0.35)) S.startJob(s, '공공', '임용시험에 합격했다. 교단에 섰다.', '교사'); else { S.log(s, '임용시험에 떨어졌다. 기간제 교사로 한 해를 보냈다.', 'work'); S.gain(s, 1500 * S.incomeIndex(s.year)); } }
    else if (plan === '전문직') { if (U.chance(s, 0.5)) S.startJob(s, '전문직', '전문 자격을 얻었다.', U.pick(s, ['회계사', '변리사', '세무사', '감정평가사'])); else { S.log(s, '시험에 떨어졌다. 한 해를 더 준비했다.', 'work'); S.cost(s, 1500 * S.incomeIndex(s.year)); } }
  }

  function yearLove(s) {
    const lv = s.love, a = s.age;
    const minA = s.sex === 'F' ? 19 : 20;
    if (a < minA) return;
    if (lv.married) {
      lv.yearsMarried = (lv.yearsMarried || 0) + 1;
      const base = yr('divorce', s.birthYear) / 35;
      let f = 1; if (s.stats.rel < 40) f *= 2.5; if (s.stats.happy < 35) f *= 1.6; if (s.money.debt > 3 * Math.max(1, s.money.income)) f *= 1.4; if (lv.yearsMarried > 25) f *= 0.5;
      if (U.chance(s, base * f)) divorce(s, '결혼 생활이 끝났다. 이혼했다.');
      else if (s.stats.rel < 35 && (s.taken.divorce_choice || 0) < 2 && U.chance(s, 0.3)) pushDecision(s, 'divorce_choice');
      if (lv.married && U.chance(s, 0.15)) { S.bump(s, 'rel', 2); }
      yearKids(s);
      return;
    }
    if (lv.partner) {
      lv.since += 1;
      if (U.chance(s, lv.since > 3 ? 0.08 : 0.15)) { lv.partner = null; lv.since = 0; S.log(s, '헤어졌다.', 'love'); s.yearShock.happy -= 10; }
      else if (!lv.single && lv.since >= 1 && a >= yr(s.sex === 'M' ? 'marryAgeM' : 'marryAgeF', s.year) - 8 && lv.asked < 5 && U.chance(s, 0.8)) pushDecision(s, 'marriage');
      return;
    }
    const ageF = a < 22 ? 0.7 : a <= 34 ? 1.1 : a <= 44 ? 0.5 : a <= 59 ? 0.22 : 0.08;
    const statusF = (s.work.status === 'employed' || s.work.status === 'self' || s.edu.stage === 'univ') ? 1 : 0.6;
    const p = 0.32 * (s.stats.rel / 60) * ageF * statusF * (lv.single ? 0.2 : 1) * (lv.widowed ? 0.3 : 1) * (s.focus === 'rel' ? 1.5 : 1);
    if (U.chance(s, p)) { s.flags.partnerEver = true; lv.partner = { since: a }; lv.since = 0; S.log(s, a < 25 ? '누군가를 좋아하게 됐다.' : '새로운 사람을 만났다.', 'love'); s.yearShock.happy += 7; s.yearShock.rel += 4; }
  }

  function divorce(s, note) {
    const lv = s.love; lv.married = false; lv.divorced += 1; lv.partner = null; lv.spouse = null; lv.trying = false;
    S.log(s, note, 'love'); s.yearShock.happy -= 20; s.yearShock.rel -= 15;
    s.money.assets = Math.round(s.money.assets * 0.5); s.money.homeValue = Math.round(s.money.homeValue * 0.5); s.money.loan = Math.round(s.money.loan * 0.5); s.money.deposit = Math.round(s.money.deposit * 0.5);
    for (const k of s.kids) if (s.year - k.by < 19) k.custody = s.sex === 'F' ? 'me' : 'ex';
    if (s.housing === 'own' && U.chance(s, 0.5)) { s.housing = 'jeonse'; s.money.assets += s.money.homeValue - s.money.loan; s.money.homeValue = 0; s.money.loan = 0; s.money.deposit = Math.round(region(s).jeonse * 10000 * s.hIdx * 0.6); }
  }
  S.divorce = divorce;

  S.marry = function (s) {
    const lv = s.love; lv.married = true; lv.marriedAt = s.age; lv.partner = null; lv.yearsMarried = 0; lv.widowed = false;
    const ssex = s.sex === 'M' ? 'F' : 'M';
    const sage = Math.round(U.clamp(s.age + (ssex === 'F' ? -D.fatherGap : D.fatherGap) + U.normal(s, 0, 2), 19, 80));
    const works = U.chance(s, yr('dualIncome', s.year) + 0.1);
    lv.spouse = { sex: ssex, age: sage, alive: true, name: S.makeName(s, ssex, s.year - sage), works, pay: Math.round(3200 * S.payIndex(s.year) * (ssex === 'F' ? 0.85 : 1) * (0.7 + U.rnd(s) * 0.8)) };
    const wedding = Math.round(D.marriage.wedding * S.incomeIndex(s.year) * (s.parents.decile >= 7 ? 1.3 : 1));
    S.cost(s, Math.round(wedding * 0.5));
    S.log(s, `${lv.spouse.name}과(와) 결혼했다. ${s.age}세.`, 'love');
    s.yearShock.happy += 18; s.yearShock.rel += 10;
    pushDecision(s, 'home');
  };

  function conceiveP(wifeAge) { return wifeAge <= 30 ? 0.75 : wifeAge <= 34 ? 0.62 : wifeAge <= 37 ? 0.48 : wifeAge <= 40 ? 0.32 : wifeAge <= 42 ? 0.16 : 0.05; }
  function wifeAge(s) { return s.sex === 'F' ? s.age : (s.love.spouse ? s.love.spouse.age : 99); }

  function yearKids(s) {
    const lv = s.love, wa = wifeAge(s);
    const alive = s.kids.filter(k => k.alive).length;
    if (lv.trying) {
      lv.tryYears += 1;
      let p = conceiveP(wa);
      if (lv.tryYears >= 2 && wa >= 32 && s.year >= 2006) { p += 0.2; S.cost(s, 300 * S.incomeIndex(s.year)); if (lv.tryYears === 2) S.log(s, '난임 병원에 다니기 시작했다.', 'kid'); }
      if (U.chance(s, p)) {
        const k = { sex: U.chance(s, 0.513) ? 'M' : 'F', by: s.year, alive: true, home: true };
        k.n = S.makeName(s, k.sex, s.year).slice(1);
        s.kids.push(k); lv.trying = false; lv.tryYears = 0;
        S.log(s, `${k.sex === 'M' ? '아들' : '딸'} ${k.n}이(가) 태어났다.`, 'kid');
        s.yearShock.happy += 14; s.yearShock.rel += 6;
        if (s.work.status === 'employed') pushDecision(s, 'parental_leave');
      } else if (lv.tryYears >= 5) { lv.trying = false; S.log(s, '아이는 오지 않았다. 둘이서 살기로 했다.', 'kid'); s.yearShock.happy -= 8; }
      return;
    }
    if (s.flags.noKids || wa > 42) return;
    if (alive === 0 && lv.yearsMarried >= 1 && (s.taken.first_child || 0) < 3) { if (U.chance(s, 0.6)) pushDecision(s, 'first_child'); }
    else if (alive === 1 && wa <= 40 && (s.taken.second_child || 0) < 2) { const ka = s.year - s.kids[s.kids.length - 1].by; if (ka >= 2 && ka <= 6 && U.chance(s, 0.7)) pushDecision(s, 'second_child'); }
    else if (alive === 2 && wa <= 38 && !s.taken.third_child && U.chance(s, 0.15)) pushDecision(s, 'third_child');
  }

  S.homePrice = (s, kind) => {
    const r = s.abroad ? D.regions[0] : region(s); const size = s.love.married || s.kids.length ? 1 : 0.6;
    const avg = (kind === 'own' ? r.apt * 0.8 : r.jeonse * 0.85) * 10000 * s.hIdx * size;
    const inc = Math.max(s.money.income || 0, S.medianIncome(s.year) * 0.45);
    const cap = kind === 'own' ? inc * 9 + s.money.assets * 0.6 : inc * 5 + s.money.assets * 0.5;
    return Math.round(U.clamp(cap, avg * 0.3, avg));
  };
  S.maxLoan = s => Math.round(Math.min(s.money.income * 6, S.homePrice(s, 'own') * 0.7));

  function yearHousing(s) {
    const m = s.money, r = region(s), idx = S.incomeIndex(s.year);
    if (s.year <= 2026) s.hIdx = yr('housing', s.year); else s.hIdx = s.hIdx * (1 + 0.004 + U.normal(s, 0, 0.06));
    if (r.capital && s.year > 2026) s.hIdx *= 1 + (s.hIdx > 1 ? 0.003 : -0.002);
    let cost = 0;
    if (s.housing === 'parents') {
      if ((s.work.status === 'employed' || s.work.status === 'self') && s.age >= 26 && !s.love.married && U.chance(s, 0.18)) { s.housing = 'monthly'; S.log(s, '독립했다. 월세방을 얻었다.', 'home'); }
      if (s.love.married) s.housing = 'monthly';
      if ((s.work.status === 'employed' || s.work.status === 'self') && s.age >= 22) cost += 400 * idx;
    }
    if (s.housing === 'monthly') cost += r.rent * 12 * idx * (s.love.married ? 1.5 : 1) * (s.abroad ? 1.3 : 1);
    if (s.housing === 'jeonse') {
      if ((m.jeonseLoan || 0) > 0 && m.assets > 500 * idx) { const pay = Math.min(m.jeonseLoan, m.assets * 0.5); m.jeonseLoan -= pay; m.jeonseOwn += pay; m.assets -= pay; }
      cost += (m.jeonseLoan || 0) * 0.035;
      const scamP = (s.year >= 2022 && s.year <= 2024 ? 0.015 : 0.002);
      if (U.chance(s, scamP)) { const loss = Math.round(m.deposit * 0.5); m.deposit -= loss; S.log(s, `전세 사기를 당했다. 보증금 ${U.fmtMan(loss)}을 잃었다.`, 'home'); s.yearShock.happy -= 20; }
    }
    if (s.housing === 'own') {
      const prev = m.homeValue; m.homeValue = Math.round(S.homePrice(s, 'own') * (m.homeSize || 1));
      if (m.loan > 0) { const interest = m.loan * 0.038, principal = Math.min(m.loan, m.loan / Math.max(5, 30 - (s.age - (m.loanAt || s.age)))); cost += interest + principal; m.loan -= principal; if (m.loan < 50) { m.loan = 0; S.log(s, '대출을 모두 갚았다. 집이 온전히 내 것이 됐다.', 'home'); s.yearShock.happy += 8; } }
      if (prev > 0) { const ch = (m.homeValue - prev) / prev; if (Math.abs(ch) > 0.09) S.log(s, ch > 0 ? `집값이 ${Math.round(ch * 100)}% 올랐다.` : `집값이 ${Math.round(-ch * 100)}% 내렸다.`, 'home'); if (ch > 0.09) s.yearShock.happy += 3; if (ch < -0.09) s.yearShock.happy -= 4; }
    }
    if (s.hs.careHome) cost += 1800 * idx;
    if (s.hs.visitCare && !s.hs.careHome) cost += 600 * idx;
    m.housingCost = Math.round(cost);
    if (!s.hs.careHome && s.age >= 30 && s.age <= 58 && (s.housing === 'monthly' || s.housing === 'jeonse' || (s.housing === 'parents' && s.love.married)) && (s.work.status === 'employed' || s.work.status === 'self') && (s.taken.buy_home || 0) < 4 && (s.last.buy_home == null || s.age - s.last.buy_home >= 5)) {
      const price = S.homePrice(s, 'own');
      if (m.assets + (m.deposit || 0) + S.maxLoan(s) >= price * 0.95) pushDecision(s, 'buy_home');
    }
  }

  S.hasItem = (s, k) => s.items.some(i => i.k === k);
  S.addItem = (s, k, n, v) => { s.items.push({ k, n, y: s.year, v: v || 0 }); };
  S.removeItem = (s, k) => { s.items = s.items.filter(i => i.k !== k); };
  const petNames = ['콩이', '보리', '초코', '몽이', '두부', '호두', '봄이', '나비', '루비', '까미', '복이', '달이'];
  S.carTiers = [['경차', 1300], ['준중형차', 2800], ['중형차', 4300], ['SUV', 4600], ['수입차', 8500]];

  function yearItems(s) {
    const a = s.age, y = s.year, idx = S.incomeIndex(y);
    const working = s.work.status === 'employed' || s.work.status === 'self';
    if (a === 8 && y >= 1975 && U.chance(s, 0.55)) { S.addItem(s, 'bike', '자전거'); S.log(s, '첫 자전거가 생겼다.', 'item'); }
    if (!S.hasItem(s, 'smartphone') && !S.hasItem(s, 'phone')) {
      if (y >= 1993 && y <= 1998 && a >= 16 && a <= 26 && !S.hasItem(s, 'pager') && U.chance(s, 0.4)) { S.addItem(s, 'pager', '삐삐'); S.log(s, '삐삐를 샀다. 공중전화 앞에 줄을 섰다.', 'item'); }
      if (y >= 1999 && y < 2010 && a >= 15 && U.chance(s, y < 2003 ? 0.5 : 0.9)) { S.removeItem(s, 'pager'); S.addItem(s, 'phone', '휴대전화'); S.log(s, '첫 휴대전화가 생겼다.', 'item'); }
    }
    if (y >= 2010 && a >= 12 && !S.hasItem(s, 'smartphone') && U.chance(s, y < 2013 ? 0.5 : 0.92)) { S.removeItem(s, 'phone'); S.removeItem(s, 'pager'); S.addItem(s, 'smartphone', '스마트폰'); if (a > 12 || y < 2020) S.log(s, '첫 스마트폰이 생겼다.', 'item'); }
    if (y >= 1995 && a >= 18 && (s.edu.stage === 'univ' || working) && !S.hasItem(s, 'pc') && !S.hasItem(s, 'laptop') && U.chance(s, 0.45)) { if (y < 2008) S.addItem(s, 'pc', '컴퓨터'); else S.addItem(s, 'laptop', '노트북'); }
    if (!S.hasItem(s, 'license') && a >= 19 && a <= 32 && y >= 1985 && s.mil.status !== 'serving' && U.chance(s, y < 2000 ? 0.07 : 0.1)) { S.addItem(s, 'license', '운전면허'); S.log(s, '운전면허를 땄다.', 'item'); }
    if (s.car) {
      s.car.age += 1; s.car.v = Math.round(s.car.v * 0.87); S.cost(s, 260 * idx);
      if (s.car.age >= 12) {
        if (working && a < 70 && U.chance(s, 0.6)) { const price = Math.round(s.car.price * idx / S.incomeIndex(s.car.boughtYear)); S.cost(s, price - s.car.v); s.car = { ...s.car, age: 0, v: price, boughtYear: y }; S.log(s, `오래된 차를 보내고 새 ${s.car.n}를 샀다.`, 'item'); }
        else { S.log(s, '오래된 차를 폐차했다.', 'item'); s.car = null; }
      }
      if (s.car && a >= 78 && U.chance(s, 0.3)) { S.log(s, '운전을 그만두고 차를 팔았다.', 'item'); S.gain(s, s.car.v); s.car = null; }
    } else if (S.hasItem(s, 'license') && working && a >= 24 && a <= 62 && (s.last.buy_car == null || a - s.last.buy_car >= 6) && s.money.assets >= 1500 * idx) pushDecision(s, 'buy_car');
    if (s.pet) {
      s.pet.age += 1; S.cost(s, 150 * idx); S.bump(s, 'rel', 1);
      if (s.pet.age >= s.pet.life) { S.log(s, `${s.pet.n}이(가) 무지개다리를 건넜다.`, 'item'); s.yearShock.happy -= 8; s.pet = null; }
    } else if (a >= 24 && a <= 68 && y >= 1990 && s.housing !== 'parents' && !s.hs.careHome && U.chance(s, 0.015)) {
      const kind = U.chance(s, 0.6) ? '강아지' : '고양이';
      s.pet = { kind, n: U.pick(s, petNames), age: 0, life: U.int(s, 11, 16) };
      S.log(s, `${kind} ${s.pet.n}을(를) 들였다.`, 'item'); s.yearShock.happy += 5; s.yearShock.rel += 2;
    }
  }

  function yearHealth(s) {
    const h = s.hs, a = s.age, st = s.stats;
    if (!h.smoker && a >= 18 && a <= 24 && !h.quit) { const rate = yr(s.sex === 'M' ? 'smokeM' : 'smokeF', s.year); if (U.chance(s, rate / 6 * (s.focus === 'health' ? 0.4 : 1))) { h.smoker = true; S.log(s, '담배를 피우기 시작했다.', 'health'); } }
    if (h.smoker) { h.smokeYears += 1; if (a === 40 || a === 55) pushDecision(s, 'quit_smoking'); }
    if (!h.drinker && a >= 20 && a <= 30) { if (U.chance(s, (s.sex === 'M' ? D.health.heavyDrinkM : D.health.heavyDrinkF) / 10 * (s.work.status === 'employed' ? 1.3 : 1))) { h.drinker = true; S.log(s, '술자리가 잦아졌다. 주량이 늘었다.', 'health'); } }
    if (h.drinker && U.chance(s, 0.04)) { h.drinker = false; S.log(s, '술을 줄였다.', 'health'); }
    h.exercise = s.focus === 'health';
    const checkup = a >= 20 && a % 2 === 0 && s.year >= 1995 && (s.work.status === 'employed' || a >= 40);
    if (a >= 32 && !h.cond.includes('고혈압') && U.chance(s, U.clamp((a - 30) * 0.0025, 0, 0.05) * (h.drinker ? 1.3 : 1) * (h.smoker ? 1.3 : 1))) { h.cond.push('고혈압'); h.untreated = (h.untreated || 0) + 1; if (checkup) { S.log(s, '건강검진에서 고혈압이 발견됐다. 약을 먹기 시작했다.', 'health'); h.untreated -= 1; } }
    if (a >= 35 && !h.cond.includes('당뇨') && U.chance(s, U.clamp((a - 35) * 0.0012, 0, 0.03) * (st.health < 50 ? 1.5 : 1))) { h.cond.push('당뇨'); h.untreated = (h.untreated || 0) + 1; if (checkup) { S.log(s, '건강검진에서 당뇨가 발견됐다.', 'health'); h.untreated -= 1; } }
    if (h.untreated > 0 && (checkup || U.chance(s, 0.15))) { h.untreated = 0; S.log(s, `${h.cond[h.cond.length - 1]} 진단을 받았다. 치료를 시작했다.`, 'health'); }
    if (h.cancer) {
      h.cancer.years += 1;
      if (h.cancer.treat) {
        if (h.cancer.years <= 5) { S.bump(s, 'health', -6); s.yearShock.happy -= 6; S.cost(s, (h.cancer.treat === 'aggressive' ? 2500 : h.cancer.treat === 'standard' ? 450 : 0) * S.incomeIndex(s.year)); }
        if (h.cancer.years === 6) { S.log(s, `${h.cancer.type} 완치 판정을 받았다.`, 'health'); h.cancer = null; s.yearShock.happy += 12; }
      }
    } else if (a >= 20 || U.chance(s, 0.5)) {
      let p = a < 20 ? 0.00015 : s.sex === 'M' ? 0.00006 * Math.exp(0.075 * Math.min(a, 86)) : 0.0001 * Math.exp(0.06 * Math.min(a, 88));
      if (h.smoker && a >= 45) p *= 1.5; if (h.drinker && a >= 45) p *= 1.15; if (s.focus === 'health') p *= 0.85;
      if (U.chance(s, p)) {
        const row = U.weighted(s, a < 20 ? D.cancerIncidence.young : D.cancerIncidence[s.sex], x => x[1] * (h.smoker && x[0] === '폐암' ? 2.5 : 1));
        h.cancer = { type: row[0], surv5: row[2], years: 0, treat: null, early: checkup ? U.chance(s, 0.7) : U.chance(s, 0.45) }; h.cancers += 1;
        S.log(s, `${row[0]} 진단을 받았다. ${h.cancer.early ? '다행히 이른 발견이었다.' : '이미 꽤 진행된 상태였다.'}`, 'health');
        s.yearShock.happy -= 18; pushDecision(s, 'treatment');
      }
    }
    if (U.chance(s, 0.006 * (a < 30 ? 1.4 : 1))) { S.log(s, '교통사고로 다쳤다. 몇 달을 병원에서 보냈다.', 'health'); S.bump(s, 'health', -8); S.cost(s, 200 * S.incomeIndex(s.year)); s.yearShock.happy -= 6; }
    if (!h.dementia && a >= 65 && U.chance(s, 0.002 * Math.pow(1.14, a - 65) * (st.know > 70 ? 0.7 : 1))) { h.dementia = true; S.log(s, '치매 진단을 받았다. 이름들이 하나씩 흐려졌다.', 'health'); s.yearShock.happy -= 10; }
    if (h.dementia) { S.bump(s, 'know', -8); s.yearShock.rel -= 3; if (!h.careHome && (s.taken.care_home || 0) < 1 && (h.dementiaYears = (h.dementiaYears || 0) + 1) >= 2) pushDecision(s, 'care_home'); }
    else if (!h.careHome && a >= 78 && st.health < 30 && (s.taken.care_home || 0) < 1) pushDecision(s, 'care_home');
    let target = expectedHealth(a) + (h.smoker ? -6 : 0) + (h.drinker ? -4 : 0) + (h.exercise ? 7 : 0) - 2.5 * h.cond.length + (h.cancer ? -10 : 0) + (h.poverty ? -5 : 0) + (st.happy < 30 ? -4 : 0) + (s.work.status === 'employed' && s.focus === 'work' ? -2 : 0);
    st.health = U.clamp(st.health + (target - st.health) * 0.25 + U.normal(s, 0, 1.5), 0, 100);
  }

  function yearMoney(s) {
    const m = s.money, idx = S.incomeIndex(s.year), a = s.age, w = s.work;
    let income = 0, label = [];
    if (w.status === 'employed' || w.status === 'self') income += w.pay;
    const sp = s.love.married ? s.love.spouse : null;
    if (sp && sp.alive && (sp.works || !(w.status === 'employed' || w.status === 'self'))) income += sp.age < 62 ? sp.pay * idx / S.incomeIndex(s.love.marriedAt + s.birthYear) : 500 * idx;
    const pAge = yr('pensionAge', s.year);
    if (a >= pAge && w.paidYears >= 10 && s.birthYear + 60 >= 1988 + 0) {
      const monthly = w.mainType === '공공' && w.paidYears >= 20 ? w.avgPay / 12 * Math.min(0.6, 0.017 * w.paidYears) : U.clamp(10 * idx + 0.03 * w.avgPay * Math.min(w.paidYears, 40) / 40, 0, 300 * idx);
      income += monthly * 12; m.pension = Math.round(monthly);
      if (a === pAge) S.log(s, `연금을 받기 시작했다. 월 ${U.fmtMan(Math.round(monthly))}.`, 'money');
    }
    if (a >= 65 && s.year >= 2014 && (m.pension || 0) < 100 * idx && m.assets < 20000 * idx) { income += D.old.basicPension * 12 * idx; }
    if (s.oldJob) income += s.oldJob * 12;
    if (a >= 65) { m.alloc.coin = 0; m.alloc.stock = Math.min(m.alloc.stock, 0.3); }
    const ret = m.alloc; const inv = (ret.deposit + ret.stock + ret.coin);
    if (inv > 0 && m.assets > 0) {
      const base = m.assets;
      let r = ret.deposit * 0.025;
      let stock = U.normal(s, 0.05, 0.18); if (s.year === 1997 || s.year === 2008) stock = -0.4; if (s.year === 2020) stock = 0.3; if (s.year === 2022) stock = -0.25;
      r += ret.stock * stock;
      if (ret.coin > 0 && s.year >= 2017) { const coin = Math.exp(U.normal(s, 0.0, 0.8)) - 1; r += ret.coin * coin; if (Math.abs(coin) > 0.6) S.log(s, coin > 0 ? '코인이 올랐다. 잠을 못 잤다.' : '코인이 반토막 났다.', 'money'); }
      const gainV = Math.round(base * r); m.assets += gainV;
      if (Math.abs(gainV) > Math.max(2000 * idx, base * 0.15)) S.log(s, gainV > 0 ? `투자로 ${U.fmtMan(gainV)}을 벌었다.` : `투자로 ${U.fmtMan(-gainV)}을 잃었다.`, 'money');
    }
    const adults = 1 + (s.love.married && s.love.spouse && s.love.spouse.alive ? 1 : 0);
    const kidsHome = s.kids.filter(k => k.alive && k.custody !== 'ex' && s.year - k.by < 20 && k.home !== false);
    let spend = adults * 950 + kidsHome.length * 550;
    for (const k of kidsHome) { const ka = s.year - k.by; if (ka >= 7 && ka <= 18 && U.chance(s, 0.8)) spend += (S.decileOf(s) <= 3 ? 30 : S.decileOf(s) <= 7 ? 55 : 95) * 12 * (region(s).capital ? 1.15 : 1); }
    for (const k of s.kids) { const ka = s.year - k.by; if (k.alive && k.univ && ka >= 18 && ka <= 21) spend += 550; }
    for (const k of s.kids) if (k.alive && k.custody === 'ex' && s.year - k.by < 19) spend += 600;
    spend *= S.payIndex(s.year) * (region(s).capital ? 1.08 : 1) * (0.7 + 0.3 * U.clamp(income / Math.max(1, S.medianIncome(s.year)), 0.3, 2.2));
    spend *= 1 + 0.15 * Math.log10(Math.max(1, m.assets / (10000 * idx)));
    if (a >= 60) spend += Math.max(0, m.assets - 20000 * idx) * 0.015;
    if (m.debt > Math.max(income, 1)) spend *= 0.8;
    if (s.housing === 'parents' && a < 22) spend = 0;
    if (a < 22 && s.housing === 'parents') spend = (w.status === 'employed' || w.status === 'self') ? 500 * idx : 0;
    if (s.mil.status === 'serving') spend = 100 * idx;
    const tax = income * (w.status === 'self' ? 0.1 : (w.status === 'employed' ? 0.17 : 0.03));
    const parentsOld = s.parents.decile <= 3 && (s.parents.mother.alive || s.parents.father.alive) && (s.parents.mother.age >= 65 || s.parents.father.age >= 65) && a >= 25 && income > 0;
    if (parentsOld) spend += 240 * idx;
    const housing = m.housingCost || 0;
    const net = income - tax - spend - housing - (m.spentYear || 0) + (m.debt > 0 ? -m.debt * 0.06 : 0);
    if (a === 35) s.flags.inc35 = Math.round(income);
    m.income = Math.round(income); m.spend = Math.round(spend + housing + tax); m.lifetimeIncome += Math.round(income);
    m.assets += Math.round(net);
    if (m.assets < 0 && a >= 18) { m.debt += -m.assets; m.assets = 0; }
    if (m.assets < 0) m.assets = 0;
    if (m.debt > 0 && m.assets > m.debt * 0.5 && m.assets > 500 * idx) { const pay = Math.min(m.debt, m.assets * 0.4); m.debt -= pay; m.assets -= pay; }
    if (m.debt > 0 && m.debt < 50) m.debt = 0;
    if (m.debt > 8 * Math.max(income, 1500 * idx) && a >= 25 && (s.flags.bankrupt == null || a - s.flags.bankrupt >= 10)) { s.flags.bankrupt = a; S.log(s, '빚을 감당할 수 없었다. 개인회생을 신청했다.', 'money'); m.debt = Math.round(m.debt * 0.3); s.yearShock.happy -= 15; }
    s.hs.poverty = a >= 65 && income < 1800 * idx && m.assets < 10000 * idx && s.housing !== 'own';
    if (s.hs.poverty && !s.flags.povertyLogged) { s.flags.povertyLogged = true; S.log(s, '노년의 살림이 빠듯해졌다. 노인 셋 중 하나가 겪는 가난이었다.', 'money'); }
    if (!s.hs.poverty) s.flags.povertyLogged = false;
  }

  function yearStats(s) {
    const st = s.stats, m = s.money, a = s.age, w = s.work;
    const med = S.medianIncome(s.year);
    const hh = a < 22 || (s.housing === 'parents' && w.status !== 'employed') ? D.incomeDeciles[s.parents.decile - 1] * 12 * S.incomeIndex(s.year) * (s.parents.hard ? 0.65 : 1) : m.income;
    const relInc = U.clamp(10 * Math.log2(Math.max(hh, 200) / med), -18, 14);
    let target = 52 + relInc + (st.rel - 50) / 4 + (st.health - expectedHealth(a)) / 4;
    if (m.debt > 3 * Math.max(hh, 1)) target -= 8;
    if (w.status === 'unemployed') target -= 12; if (w.status === 'seeking' && w.seeking > 1) target -= 7;
    if (s.love.married && st.rel > 45) target += 5; if (s.love.partner) target += 4;
    if (s.kids.filter(k => k.alive).length) target += 3;
    if (s.focus === 'rest') target += 3; if (s.focus === 'work' && w.status === 'employed') target -= 2;
    if (s.hs.poverty) target -= 8; if (s.hs.careHome) target -= 6; if (s.hs.dementia) target -= 4;
    if (s.abroad) target -= 2;
    if (s.mil.status === 'serving') target -= 6;
    if (a >= 60 && w.status === 'retired' && !s.hs.poverty) target += 3;
    st.happy = U.clamp(st.happy + (target - st.happy) * 0.3 + s.yearShock.happy + U.normal(s, 0, 2), 0, 100);
    let rt = 50;
    if (s.parents.together && s.parents.mother.alive && s.parents.father.alive && a < 30) rt += 4;
    if (s.love.married) rt += 10; if (s.love.partner) rt += 6;
    rt += Math.min(3, s.kids.filter(k => k.alive).length) * 2;
    if (s.edu.stage === 'univ' || w.status === 'employed' || w.status === 'self') rt += 5;
    if (w.status === 'retired') rt -= 4; if (a >= 70) rt -= 6; if (a >= 80) rt -= 6;
    if (s.kids.some(k => k.alive && s.year - k.by >= 25) && a >= 65) rt += 5;
    if (s.focus === 'rel') rt += 9; if (s.focus === 'work') rt -= 3;
    if (s.abroad) rt -= 6; if (s.hs.careHome) rt -= 8;
    if (s.love.widowed && a >= 65) rt -= 6;
    st.rel = U.clamp(st.rel + (rt - st.rel) * 0.25 + s.yearShock.rel + U.normal(s, 0, 1.5), 0, 100);
    if (s.edu.stage === 'done' || s.edu.stage === 'none') { if (s.focus === 'study' || s.focus === 'work') st.know = U.clamp(st.know + 0.8, 0, 100); if (a > 30) st.know = U.clamp(st.know - 0.25, 0, 100); }
  }

  function causeOfDeath(s) {
    const a = s.age, h = s.hs;
    let row = D.causes[0][1]; for (const c of D.causes) if (c[0] <= a) row = c[1];
    const pick = U.weighted(s, row, x => x[1] * (x[0] === '알츠하이머병' && h.dementia ? 2 : 1) * ((x[0] === '심장질환' || x[0] === '뇌혈관질환') && h.cond.includes('고혈압') ? 1.6 : 1) * (x[0] === '간질환' && h.drinker ? 2 : 1) * (x[0] === '당뇨병' && h.cond.includes('당뇨') ? 3 : 1))[0];
    if (pick === '암') { const row2 = a < 20 ? D.cancerIncidence.young : D.cancerIncidence[s.sex]; return U.weighted(s, row2, x => x[1] * (1.2 - x[2]) * (h.smoker && x[0] === '폐암' ? 3 : 1))[0]; }
    return pick;
  }

  function yearDeath(s) {
    const a = s.age, h = s.hs;
    let f = Math.exp((expectedHealth(a) - s.stats.health) / 35) * decileF(S.decileOf(s));
    if (h.smoker && h.smokeYears >= 10 && a >= 45) f *= 1.4;
    if (h.quit && a >= 45) f *= 1.1;
    if (h.drinker && a >= 40) f *= 1.15;
    if (h.dementia) f *= 1.5;
    if (h.poverty) f *= 1.2;
    if (h.cancer && !h.cancer.treat) f *= 1.3;
    if (s.mil.status === 'serving') f *= 1.1;
    f = U.clamp(f, 0.3, 6);
    let q = L.q(s.sex, s.year, a, f * S.hazardScale[s.sex]);
    if (a === 0) q = yr('imr', s.year) / 1000 * decileF(s.parents.decile);
    if (U.chance(s, q)) return die(s, causeOfDeath(s));
    if (h.cancer && h.cancer.years >= 1) {
      const annual = 1 - Math.pow(Math.max(0.02, h.cancer.surv5), 1 / 5);
      const tf = h.cancer.treat === 'aggressive' ? 0.85 : h.cancer.treat === 'none' ? 2.6 : 1;
      if (h.cancer.years <= 6 && U.chance(s, U.clamp(annual * tf * (h.cancer.early ? 0.7 : 1.3), 0, 0.9))) return die(s, h.cancer.type);
    }
    return false;
  }

  function die(s, cause) {
    s.alive = false; s.death = { age: s.age, year: s.year, cause };
    S.log(s, `${s.year}년, ${s.age}세. ${cause}으로 세상을 떠났다.`, 'death');
    return true;
  }

  S.completeYear = function (s) {
    if (!s.alive) return [];
    const start = s.log.length;
    s.queue = [];
    if (!s.yearShock) s.yearShock = { happy: 0, rel: 0 };
    if (s.shock === undefined) s.shock = null;
    yearHistory(s);
    yearFamily(s);
    if (s.alive) yearEducation(s);
    if (s.alive && KR.YOUTH) KR.YOUTH.year(s);
    yearMilitary(s);
    yearWork(s);
    yearLove(s);
    yearHousing(s);
    yearItems(s);
    yearHealth(s);
    yearMoney(s);
    yearStats(s);
    const dead = yearDeath(s);
    if (!dead) {
      const st = stageOf(s); const used = s.usedFlavor || (s.usedFlavor = {}); const pool = (flavor[st] || []).filter(t => !used[t]);
      const say = () => { const t = U.pick(s, pool); used[t] = 1; S.log(s, t, 'flavor'); };
      if (pool.length && s.log.length === start && U.chance(s, 0.7)) say();
      else if (pool.length && U.chance(s, s.age < 30 ? 0.4 : 0.25)) say();
    }
    s.map.push({ a: s.age, y: s.year, st: stageOf(s), h: Math.round(s.stats.happy), hp: Math.round(s.stats.health), r: Math.round(s.stats.rel) });
    if (s.cohort) for (const c of s.cohort) S.stepAuto(c);
    return s.log.slice(start);
  };

  S.stepAuto = function (c) {
    if (!c.alive) return;
    const r = S.beginYear(c);
    for (const id of r.decisions.slice()) S.autoChoose(c, id);
    S.completeYear(c);
  };

  S.spend = function (s, kind) {
    const idx = S.incomeIndex(s.year), m = s.money;
    const acts = {
      travel: { cost: 350 * idx, happy: 7, rel: 2, text: '여행을 다녀왔다.' },
      hobby: { cost: 120 * idx, happy: 4, rel: 3, text: '새로운 취미를 시작했다.' },
      parents: { cost: 150 * idx, happy: 2, rel: 5, text: '부모님께 용돈을 드렸다.' },
      donate: { cost: Math.max(10 * idx, m.assets * 0.01), happy: 3, rel: 1, text: '기부를 했다.' },
      health: { cost: 200 * idx, health: 4, text: '건강검진과 운동에 돈을 썼다.' },
    };
    const a = acts[kind]; if (!a || m.assets < a.cost) return false;
    S.cost(s, Math.round(a.cost)); if (a.happy) S.bump(s, 'happy', a.happy); if (a.rel) S.bump(s, 'rel', a.rel); if (a.health) S.bump(s, 'health', a.health);
    S.log(s, a.text, 'money'); return true;
  };
  S.setAlloc = function (s, alloc) { const tot = alloc.deposit + alloc.stock + alloc.coin; const f = tot > 1 ? 1 / tot : 1; s.money.alloc = { deposit: alloc.deposit * f, stock: alloc.stock * f, coin: alloc.coin * f }; };

  S.netWorth = s => { const m = s.money; return Math.round(m.assets + (m.homeValue || 0) + (m.deposit || 0) + (s.car ? s.car.v : 0) - (m.jeonseLoan || 0) - m.debt - m.loan); };
  S.itemList = s => {
    const out = [];
    const r = region(s);
    if (s.housing === 'own') out.push({ k: 'home', n: `${s.abroad ? '해외' : r.short} ${s.money.homeValue >= 30000 ? '아파트' : '집'}`, v: s.money.homeValue, y: s.money.loanAt != null ? s.birthYear + s.money.loanAt : s.year });
    if (s.housing === 'jeonse') out.push({ k: 'jeonse', n: '전세 보증금', v: s.money.deposit, y: s.year });
    if (s.car) out.push({ k: 'car', n: `${s.car.n} (${s.car.boughtYear}년식)`, v: s.car.v, y: s.car.boughtYear });
    if (s.pet) out.push({ k: 'pet', n: `${s.pet.kind} ${s.pet.n} (${s.pet.age}살)`, v: 0, y: s.year - s.pet.age });
    for (const i of s.items) out.push({ k: i.k, n: i.n, v: i.v, y: i.y });
    return out;
  };
  S.BENCH_VERSION = 3;
  S.metrics = s => {
    const n = s.map.length || 1;
    const avg = k => s.map.length ? s.map.reduce((a, m) => a + (m[k] == null ? 50 : m[k]), 0) / n : s.stats[k === 'h' ? 'happy' : k === 'r' ? 'rel' : 'health'];
    return { age: s.death ? s.death.age : s.age, happy: Math.round(avg('h') * 10) / 10, rel: Math.round(avg('r') * 10) / 10, health: Math.round(avg('hp') * 10) / 10, wealth: S.netWorth(s), income: s.money.lifetimeIncome, kids: s.kids.filter(k => k.alive).length };
  };
  S.autoLife = (birthYear, seed) => {
    const s = S.newLife({ birthYear, seed }, true);
    S.completeYear(s);
    let g = 0; while (s.alive && g++ < 130) S.stepAuto(s);
    return S.metrics(s);
  };
  S.RANK_KEYS = ['score', 'wealth', 'age', 'happy', 'income', 'rel'];
  S.RANK_LABEL = { score: '인생 점수', wealth: '최종 재산', age: '수명', happy: '행복', income: '생애 소득', rel: '관계' };
  S.percentile = (sorted, v) => { let below = 0, ties = 0; for (const x of sorted) { if (x < v) below++; else if (x === v) ties++; } return sorted.length ? (below + ties * 0.5) / sorted.length : 0.5; };
  S.rankOf = (sorted, v) => { let above = 0; for (const x of sorted) if (x > v) above++; return above + 1; };
  S.scoreOf = (m, bench) => Math.round(100 * (S.percentile(bench.age, m.age) + S.percentile(bench.happy, m.happy) + S.percentile(bench.rel, m.rel) + S.percentile(bench.wealth, m.wealth)) / 4);
  S.finishBench = raw => {
    const b = { n: raw.length, v: S.BENCH_VERSION };
    for (const k of ['age', 'happy', 'rel', 'wealth', 'income']) b[k] = raw.map(m => m[k]).sort((x, y) => x - y);
    b.score = raw.map(m => S.scoreOf(m, b)).sort((x, y) => x - y);
    return b;
  };
  S.rankAll = (m, bench) => {
    const out = {}; const mm = { ...m, score: S.scoreOf(m, bench) };
    for (const k of S.RANK_KEYS) out[k] = { value: mm[k], rank: S.rankOf(bench[k], mm[k]), top: Math.max(1, Math.round((1 - S.percentile(bench[k], mm[k])) * 100)) };
    out.n = bench.n; return out;
  };
  S.summary = function (s) {
    const r = region(s);
    const kids = s.kids.filter(k => k.alive).length;
    const job = s.work.mainType ? (s.work.mainTitle || D.jobs[s.work.mainType].label) : (s.work.status === 'home' ? '가사·육아' : '일자리 없음');
    const home = s.housing === 'own' ? '자가' : s.housing === 'jeonse' ? '전세' : s.housing === 'monthly' ? '월세' : s.housing === 'parents' ? '부모 집' : '요양원';
    return {
      name: s.name, sex: s.sex, region: r.short, regionFull: r.name, birthYear: s.birthYear, age: s.age, alive: s.alive, death: s.death,
      degree: ['elem', 'mid', 'high', 'repeat'].includes(s.edu.stage) ? '재학 중' : s.edu.degree, univ: s.edu.univ ? s.edu.univ.kind : null, job, married: s.love.marriedAt != null, marriedAt: s.love.marriedAt, divorced: s.love.divorced, kids,
      assets: S.netWorth(s), items: S.itemList(s), home, lifetimeIncome: s.money.lifetimeIncome,
      stats: { ...s.stats }, notes: s.notes, abroad: !!s.abroad, military: s.mil.kind || null, cancers: s.hs.cancers, smoker: s.hs.smoker,
      map: s.map.map(x => [x.st, x.h]), decile: s.parents.decile,
    };
  };
})();
