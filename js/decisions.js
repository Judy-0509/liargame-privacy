window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util;
  const idx = s => S.incomeIndex(s.year);
  const pct = p => `${Math.round(U.clamp(p, 0, 1) * 100)}%`;
  const money = v => U.fmtMan(Math.round(v));
  const never = () => false;

  function leaveCurrent(s) {
    const m = s.money;
    if (s.housing === 'jeonse') { m.assets += m.jeonseOwn || 0; m.deposit = 0; m.jeonseOwn = 0; m.jeonseLoan = 0; }
    if (s.housing === 'own') { m.assets += Math.max(0, m.homeValue - m.loan); m.homeValue = 0; m.loan = 0; m.homeSize = 1; }
  }
  S.moveTo = function (s, kind) {
    const m = s.money;
    leaveCurrent(s);
    if (kind === 'jeonse') { const price = S.homePrice(s, 'jeonse'); m.deposit = price; m.jeonseOwn = Math.min(m.assets, price); m.assets -= m.jeonseOwn; m.jeonseLoan = price - m.jeonseOwn; s.housing = 'jeonse'; return { price, loan: m.jeonseLoan }; }
    if (kind === 'own') {
      const price = S.homePrice(s, 'own'); const cap = Math.max(S.maxLoan(s), price * 0.3);
      const cash = Math.min(m.assets, price); let loan = Math.min(cap, Math.max(0, price - cash));
      const paid = Math.min(price, cash + loan); loan = Math.max(0, paid - cash);
      m.assets -= paid - loan; m.loan = Math.round(loan); m.loanAt = s.age; m.homeSize = paid / price; m.homeValue = Math.round(paid); s.housing = 'own';
      return { price: paid, loan };
    }
    s.housing = kind; return null;
  };

  const capitalP = s => 1 / (1 + Math.exp(-(s.stats.know - 64) / 7));
  const localP = s => 1 / (1 + Math.exp(-(s.stats.know - 48) / 8));
  const bigP = s => { const t = s.edu.univ ? s.edu.univ.tier : -1; const eduF = s.edu.degree === '대학원졸' ? 1.3 : t === 2 ? 1.15 : t === 1 ? 0.85 : t === 0 ? 0.6 : 0.35; return U.clamp(0.15 + (s.stats.know - 60) / 100, 0.03, 0.7) * eduF; };
  const jobLabel = s => (D.jobs[s.work.type] || { label: '일터' }).label;
  const employed = s => (s.work.status === 'employed' || s.work.status === 'self') && !!s.work.type;

  KR.DECISIONS = [
    {
      id: 'hs_choice', when: s => s.age === 14 && s.edu.stage === 'mid' && !s.edu.hs,
      title: '어느 고등학교로 갈까', text: s => `중학교 3학년. 지식 ${Math.round(s.stats.know)}. 집은 소득 ${s.parents.decile}분위.`,
      options: s => [
        { label: '일반고', hint: '대학 진학을 준비한다. 가장 많은 길.', auto: () => 0.72, apply: s => { s.edu.hs = '일반고'; } },
        { label: '특성화고·마이스터고', hint: '기술을 배워 졸업 후 바로 일한다.', auto: s => s.stats.know < 50 ? 0.3 : 0.12, focus: 'money', apply: s => { s.edu.hs = '특성화고'; S.bump(s, 'know', -3); } },
        { label: '특목고·자사고', hint: s => `학비가 비싸다. 합격 가능성 ${pct((s.stats.know - 55) / 30)}.`, hide: s.stats.know < 60 || s.year < 1985 || s.parents.decile < 4, auto: s => s.stats.know > 72 ? 0.3 : 0.06, focus: 'study', apply: s => { if (U.chance(s, (s.stats.know - 55) / 30)) { s.edu.hs = '자사고'; S.bump(s, 'know', 6); S.cost(s, 1500 * idx(s)); S.log(s, '특목고에 합격했다.', 'edu'); } else { s.edu.hs = '일반고'; S.log(s, '특목고 입시에서 떨어져 일반고로 갔다.', 'edu'); S.bump(s, 'happy', -5); } } },
        { label: '예체능', hint: '좋아하는 것을 쫓는다. 돈이 든다.', auto: () => 0.04, focus: 'rest', apply: s => { s.edu.hs = '예술고'; S.bump(s, 'happy', 6); S.bump(s, 'rel', 3); S.cost(s, 1200 * idx(s)); } },
      ],
    },
    {
      id: 'univ_choice', when: s => s.age === 17 && s.edu.stage === 'high',
      title: '수능이 끝났다. 어디로 갈까', text: s => `지식 ${Math.round(s.stats.know)}. ${s.edu.hs}. 이 해 고교 졸업자의 ${pct(U.interp(D.byYear.univRate, s.year))}가 대학에 갔다.`,
      options: s => {
        const era = U.interp(D.byYear.univRate, s.year);
        return [
          { label: '수도권 4년제에 지원', hint: s => `합격 가능성 ${pct(capitalP(s))}. 떨어지면 지방 4년제나 전문대로.`, auto: s => era * capitalP(s) * 1.4, focus: 'study', apply: s => { s.edu.plan = '수도권4년제'; } },
          { label: '4년제 대학에 지원 (지방 포함)', hint: s => `합격 가능성 ${pct(localP(s))}.`, auto: s => era * localP(s), apply: s => { s.edu.plan = '4년제'; } },
          { label: '전문대', hint: '2년, 빨리 일터로.', auto: () => era * 0.35, apply: s => { s.edu.plan = '전문대'; } },
          { label: '바로 취업', hint: s.edu.hs === '특성화고' ? '배운 기술로 바로 일한다.' : '대학 없이 일을 시작한다.', auto: s => (1 - era) * 1.1 * (s.edu.hs === '특성화고' ? 3 : 1) * (s.parents.decile <= 2 ? 1.5 : 1), focus: 'money', apply: s => { s.edu.plan = '취업'; } },
          { label: '재수', hint: '1년 더. 학원비가 든다.', hide: s.edu.repeat >= 1 || s.year < 1985, auto: s => s.stats.know >= 58 && s.stats.know < 78 && s.parents.decile >= 5 ? 0.3 : 0.05, apply: s => { s.edu.plan = '재수'; } },
        ];
      },
    },
    {
      id: 'tuition', when: never, valid: s => !!s.edu.univ,
      title: '학비는 어떻게 마련할까', text: s => `등록금은 한 해 ${money((s.edu.univ.public ? D.edu.tuitionPublic : D.edu.tuitionPrivate) * idx(s))}. 집은 소득 ${s.parents.decile}분위.`,
      options: s => [
        { label: '부모가 대 준다', hint: '집안 살림이 빠듯해진다.', hide: s.parents.decile <= 2, auto: s => 0.3 + s.parents.decile * 0.1, apply: s => { s.edu.tuition = '부모'; S.bump(s, 'rel', 2); } },
        { label: '학자금 대출', hint: '졸업 후 갚는다.', auto: () => 0.35, apply: s => { s.edu.tuition = '대출'; S.log(s, '학자금 대출을 받았다.', 'money'); } },
        { label: '아르바이트로 번다', hint: '공부 시간이 줄고 지친다.', auto: () => 0.3, focus: 'money', apply: s => { s.edu.tuition = '알바'; S.log(s, '학비를 벌기 위해 아르바이트를 시작했다.', 'work'); } },
        { label: '장학금에 도전', hint: s => `가능성 ${pct((s.stats.know - 55) / 40)}. 실패하면 대출.`, hide: s.stats.know < 68, auto: () => 0.4, focus: 'study', apply: s => { if (U.chance(s, (s.stats.know - 55) / 40)) { s.edu.tuition = '장학금'; S.log(s, '장학금을 받게 됐다.', 'edu'); S.bump(s, 'happy', 5); } else { s.edu.tuition = '대출'; S.log(s, '장학금을 받지 못해 학자금 대출을 받았다.', 'money'); } } },
      ],
    },
    {
      id: 'military_timing', when: s => s.sex === 'M' && (s.age === 18 || s.age === 19) && s.edu.stage === 'univ' && s.mil.status === 'none' && s.mil.enlistAt == null,
      title: '군대는 언제 갈까', text: s => `복무 기간 약 ${Math.round(U.interp(D.byYear.serviceMonths, s.year))}개월.`,
      options: s => [
        { label: '1학년 마치고 바로', hint: '빨리 다녀오고 복학한다.', auto: () => 0.45, apply: s => { s.mil.enlistAt = s.age + 1; } },
        { label: '2학년 마치고', hint: '친구들과 비슷한 때.', auto: () => 0.4, apply: s => { s.mil.enlistAt = s.age + 2; } },
        { label: '졸업 후에', hint: '취업이 늦어진다.', auto: () => 0.15, apply: s => { s.mil.enlistAt = s.age + 4; } },
      ],
    },
    {
      id: 'grad_school', when: never,
      title: '대학원에 갈까', text: '공부를 더 하면 길이 넓어지지만, 시작이 늦어진다.',
      options: s => [
        { label: '대학원 진학 (2년)', hint: '지식이 오르고 초봉이 높아진다.', auto: s => s.parents.decile >= 6 ? 0.14 : 0.06, focus: 'study', apply: s => { s.edu.stage = 'grad'; s.edu.left = 2; s.work.status = 'student'; S.log(s, '대학원에 들어갔다.', 'edu'); S.cost(s, 1200 * idx(s)); } },
        { label: '바로 취업', hint: '일을 시작한다.', auto: () => 0.7, apply: () => { } },
      ],
    },
    {
      id: 'job_search', when: s => s.work.status === 'seeking' && !s.work.exam && !s.work.plan && s.age >= 17 && (s.edu.stage === 'done' || s.edu.stage === 'none') && s.mil.status !== 'serving' && !s.flags.noSchool,
      title: s => s.work.seeking === 0 ? '어디에 지원할까' : `${s.work.seeking}년째 구직 중. 이번엔 어디로`, text: s => `${s.edu.degree}${s.edu.univ ? ' (' + s.edu.univ.kind + ')' : ''}. 지식 ${Math.round(s.stats.know)}. 자산 ${money(s.money.assets)}.`,
      options: s => [
        { label: '대기업·공기업 공채', hint: s => `합격 가능성 ${pct(bigP(s))}. 떨어지면 1년이 간다.`, auto: s => bigP(s) * 2.5, focus: 'money', apply: s => { s.work.plan = '대기업'; } },
        { label: '중소·중견기업', hint: '취업 가능성 80%. 월급은 대기업의 절반 남짓.', auto: () => 0.9, apply: s => { s.work.plan = '중소'; } },
        { label: '공무원 시험 준비', hint: '매년 약 9%가 합격한다. 몇 년이 걸릴지 모른다.', hide: s.age > 33 || s.year < 1975, auto: s => s.stats.know > 55 ? 0.25 : 0.12, focus: 'study', apply: s => { s.work.plan = '공무원'; } },
        { label: '전문직 시험 (의사·변호사·회계사 등)', hint: '합격 가능성 50%. 비용이 크다.', hide: s.stats.know < 86 || !(s.edu.degree === '대졸' || s.edu.degree === '대학원졸') || !(s.edu.univ && s.edu.univ.tier === 2), auto: () => 0.35, focus: 'study', apply: s => { s.work.plan = '전문직'; } },
        { label: '창업·자영업', hint: s => `자본 ${money(5000 * idx(s))}. 5년 생존율 34%.`, hide: s.age < 22, auto: s => s.money.assets > 5000 * idx(s) ? 0.25 : 0.08, focus: 'money', apply: s => { s.work.plan = '창업'; } },
        { label: '프리랜서·플랫폼 노동', hint: '바로 시작. 소득은 불안정하다.', hide: s.year < 2005, auto: () => 0.18, focus: 'rest', apply: s => { s.work.plan = '프리랜서'; } },
        { label: '해외로 떠나기', hint: '소득은 높지만 가족과 멀어진다.', hide: s.stats.know < 60 || s.year < 1990 || s.abroad || s.love.married, auto: () => 0.06, apply: s => { s.work.plan = '해외'; } },
      ],
    },
    {
      id: 'job_change', when: never, valid: employed,
      title: '이직 제안이 왔다', text: s => `${jobLabel(s)}에서 ${s.work.years}년. 연봉 ${money(s.work.pay)}.`,
      options: s => {
        const target = s.work.type === '중견' ? '대기업' : (s.work.type === '중소' || s.work.type === '비정규' || s.work.type === '프리랜서') ? '중견' : s.work.type;
        const p = U.clamp(0.15 + (s.stats.know - 60) / 200, 0.06, 0.5);
        return [
          { label: `${D.jobs[target].label}으로 이직 도전`, hint: `성공 가능성 ${pct(p)}. 실패해도 자리는 남는다.`, auto: () => p, focus: 'money', apply: s => { if (U.chance(s, p)) { const yrs = s.work.years; S.startJob(s, target, `${D.jobs[target].label}으로 이직했다.`); s.work.years = Math.round(yrs * 0.8); } else { S.log(s, '이직 면접에서 떨어졌다.', 'work'); S.bump(s, 'happy', -3); } } },
          { label: '지금 자리에 남기', hint: '익숙한 곳에서.', auto: () => 0.6, focus: 'rest', apply: s => { S.bump(s, 'happy', 1); } },
          { label: '그만두고 창업', hint: s => `자본 ${money(5000 * idx(s))}. 5년 생존율 34%.`, hide: s.money.assets < 3000 * idx(s) || s.age > 50, auto: () => 0.08, apply: s => { s.work.status = 'seeking'; s.work.type = null; s.work.plan = '창업'; S.log(s, '회사를 그만두고 가게를 준비했다.', 'work'); } },
        ];
      },
    },
    {
      id: 'burnout', when: never, valid: employed,
      title: '번아웃', text: '아침마다 일어나기가 힘들다. 마음이 바닥에 닿았다.',
      options: s => [
        { label: '쉬기로 한다 (퇴사·휴직)', hint: '소득이 끊긴다. 마음이 돌아온다.', auto: () => 0.3, focus: 'rest', apply: s => { s.work.status = 'unemployed'; s.work.type = null; S.bump(s, 'happy', 12); S.bump(s, 'health', 5); S.log(s, '회사를 그만두고 쉬기로 했다.', 'work'); } },
        { label: '버틴다', hint: '건강이 깎인다.', auto: () => 0.5, focus: 'money', apply: s => { S.bump(s, 'happy', -4); S.bump(s, 'health', -4); S.log(s, '이를 악물고 버텼다.', 'work'); } },
        { label: '이직을 알아본다', hint: '같은 급의 다른 회사로.', auto: () => 0.2, apply: s => { S.log(s, '비슷한 조건의 다른 회사로 옮겼다.', 'work'); S.bump(s, 'happy', 6); s.work.years = Math.round(s.work.years * 0.7); } },
      ],
    },
    {
      id: 'marriage', when: never, valid: s => !!s.love.partner && !s.love.married,
      title: '결혼할까', text: s => `${s.love.since}년을 함께했다. ${s.age}세. 이 해 평균 초혼 연령은 ${s.sex === 'M' ? '남' : '여'} ${U.interp(D.byYear[s.sex === 'M' ? 'marryAgeM' : 'marryAgeF'], s.year).toFixed(1)}세.`,
      options: s => {
        const cohort = U.interp(D.byYear[s.sex === 'M' ? 'everMarryM' : 'everMarryF'], s.birthYear);
        return [
          { label: '결혼한다', hint: s => `결혼식과 신혼집에 돈이 든다. 자산 ${money(s.money.assets)}.`, auto: s => { const ma = U.interp(D.byYear[s.sex === 'M' ? 'marryAgeM' : 'marryAgeF'], s.year); return cohort * (s.age >= ma - 3 ? 2.6 : s.age >= ma - 6 ? 1.5 : 0.6); }, focus: 'rel', apply: s => S.marry(s) },
          { label: '조금 더 만나본다', hint: '서두르지 않는다.', auto: () => 0.4, apply: s => { s.love.asked += 1; } },
          { label: '비혼으로 살기로 한다', hint: '다시 묻지 않는다.', hide: s.age < 28, auto: () => (1 - cohort) * 1.2, apply: s => { s.love.single = true; s.love.asked = 9; S.log(s, '결혼은 하지 않기로 마음먹었다.', 'love'); } },
        ];
      },
    },
    {
      id: 'home', when: never, valid: s => s.love.married,
      title: '신혼집은 어디로', text: s => `${D.regions[s.region].short} 전세 ${money(S.homePrice(s, 'jeonse'))}, 매매 ${money(S.homePrice(s, 'own'))}. 자산 ${money(s.money.assets)}, 연소득 ${money(s.money.income)}.`,
      options: s => {
        const gift = s.parents.decile >= 6 ? Math.round(s.parents.decile * 1800 * idx(s)) : 0;
        const giftText = gift ? ` 부모가 ${money(gift)}을 보태 준다.` : '';
        return [
          { label: '전세', hint: `보증금은 대출로 채운다.${giftText}`, auto: () => 0.5, apply: s => { if (gift) S.gain(s, gift); const r = S.moveTo(s, 'jeonse'); S.log(s, `전세로 신혼집을 구했다. 보증금 ${money(r.price)}${r.loan > 100 ? `, 그중 대출 ${money(r.loan)}` : ''}.`, 'home'); } },
          { label: '월세', hint: '가볍게 시작한다. 매달 나간다.', auto: () => 0.25, apply: s => { if (gift) S.gain(s, gift); S.moveTo(s, 'monthly'); S.log(s, '월세로 신혼집을 구했다.', 'home'); } },
          { label: '집을 산다 (대출)', hint: s => `대출 한도 약 ${money(S.maxLoan(s))}.${giftText}`, hide: s.money.assets + gift + S.maxLoan(s) < S.homePrice(s, 'own') * 0.8, auto: () => 0.35, focus: 'money', apply: s => { if (gift) S.gain(s, gift); const r = S.moveTo(s, 'own'); S.log(s, `집을 샀다. ${money(r.price)}, 대출 ${money(r.loan)}.`, 'home'); if (r.loan > 4 * Math.max(1, s.money.income)) { S.log(s, '영끌이었다. 매달 이자가 무거웠다.', 'home'); S.bump(s, 'happy', -3); } else S.bump(s, 'happy', 5); } },
          { label: '부모와 함께 산다', hint: '돈은 아끼지만 부딪힌다.', hide: s.parents.decile < 4 || !(s.parents.mother.alive || s.parents.father.alive) || s.abroad, auto: () => 0.08, apply: s => { S.moveTo(s, 'parents'); S.bump(s, 'rel', -3); S.bump(s, 'happy', -2); S.log(s, '부모 집에서 신혼을 시작했다.', 'home'); } },
        ];
      },
    },
    {
      id: 'first_child', when: never, valid: s => s.love.married && !!s.love.spouse,
      title: '아이를 가질까', text: s => `결혼 ${s.love.yearsMarried}년. ${s.sex === 'F' ? '나' : '아내'} ${s.sex === 'F' ? s.age : s.love.spouse.age}세. 이 해 합계출산율 ${U.interp(D.byYear.tfr, s.year).toFixed(2)}.`,
      options: s => {
        const c = U.interp({ 1960: 0.9, 1980: 0.8, 2000: 0.72, 2024: 0.68 }, s.birthYear);
        return [
          { label: '아이를 갖기로 한다', hint: '삶이 통째로 바뀐다.', auto: () => c, focus: 'rel', apply: s => { s.love.trying = true; s.love.tryYears = 0; } },
          { label: '몇 년 뒤에', hint: '아직은 둘이서.', auto: () => 0.3, apply: () => { } },
          { label: '아이 없이 살기로 한다', hint: '다시 묻지 않는다.', auto: () => (1 - c) * 0.9, apply: s => { s.flags.noKids = true; S.log(s, '아이는 갖지 않기로 했다.', 'kid'); } },
        ];
      },
    },
    {
      id: 'second_child', when: never, valid: s => s.love.married && !!s.love.spouse && s.kids.length > 0,
      title: '둘째를 가질까', text: s => `첫째 ${s.year - s.kids[0].by}세. 양육비와 사교육비가 두 배가 된다.`,
      options: s => {
        const p = U.interp({ 1960: 0.7, 1980: 0.42, 2000: 0.4, 2024: 0.4 }, s.birthYear);
        return [
          { label: '둘째를 갖는다', hint: '형제가 생긴다.', auto: () => p, focus: 'rel', apply: s => { s.love.trying = true; s.love.tryYears = 0; } },
          { label: '하나로 충분하다', hint: '다시 묻지 않는다.', auto: () => 1 - p, focus: 'money', apply: s => { s.taken.second_child = 2; } },
        ];
      },
    },
    {
      id: 'third_child', when: never, max: 1, valid: s => s.love.married && !!s.love.spouse,
      title: '셋째를 가질까', text: '셋째는 흔치 않은 선택이 됐다.',
      options: s => [
        { label: '셋째를 갖는다', hint: '', auto: () => U.interp({ 1960: 0.45, 1980: 0.08, 2000: 0.06 }, s.birthYear), apply: s => { s.love.trying = true; s.love.tryYears = 0; } },
        { label: '둘로 충분하다', hint: '', auto: () => 0.85, apply: () => { } },
      ],
    },
    {
      id: 'parental_leave', when: never, valid: s => s.work.status === 'employed' && !!s.work.type,
      title: '아이가 태어났다. 일은 어떻게 할까', text: s => `${jobLabel(s)}, 연봉 ${money(s.work.pay)}. ${s.sex === 'F' ? '기혼 여성 여섯 중 하나가 일을 그만둔다.' : '남성 육아휴직 사용은 아직 적다.'}`,
      options: s => {
        const F = s.sex === 'F';
        return [
          { label: '육아휴직 1년', hint: s => `소득이 ${money(s.work.pay * 0.6)} 줄어든다.${F ? ' 돌아갈 자리가 없을 수도.' : ''}`, hide: s.year < 2001 || (s.work.type === '자영업' || s.work.type === '프리랜서'), auto: () => F ? 0.4 : (s.year >= 2015 ? 0.2 : 0.05), focus: 'rel', apply: s => { S.cost(s, Math.round(s.work.pay * 0.6)); S.bump(s, 'rel', 6); S.bump(s, 'happy', 4); S.log(s, '육아휴직을 냈다. 아이와 1년을 보냈다.', 'kid'); if (U.chance(s, F ? 0.2 : 0.06)) { s.work.status = 'home'; s.work.type = null; s.work.careerBreak = true; S.log(s, '복직 자리는 없었다. 경력이 끊겼다.', 'work'); S.bump(s, 'happy', -8); } } },
          { label: '계속 일한다', hint: '조부모와 어린이집에 기댄다. 지친다.', auto: () => F ? 0.35 : 0.8, focus: 'money', apply: s => { S.bump(s, 'happy', -4); S.bump(s, 'rel', -3); S.bump(s, 'health', -3); S.log(s, '아이를 맡기고 일을 계속했다.', 'kid'); } },
          { label: '일을 그만두고 아이를 돌본다', hint: '경력이 끊긴다. 다시 돌아가기는 어렵다.', auto: () => F ? U.interp({ 1960: 0.8, 1990: 0.4, 2024: 0.22 }, s.year) : 0.03, apply: s => { s.work.status = 'home'; s.work.type = null; s.work.careerBreak = true; S.log(s, '일을 그만두고 아이 곁에 남았다.', 'work'); S.bump(s, 'rel', 4); } },
        ];
      },
    },
    {
      id: 'return_work', when: never, valid: s => s.work.status === 'home',
      title: '다시 일할까', text: s => `아이들이 자랐다. ${s.age}세. 경력이 ${s.age - (s.love.marriedAt || s.age)}년 가까이 비어 있다.`,
      options: s => [
        { label: '다시 일을 시작한다', hint: '임금은 예전만 못하다.', auto: () => 0.55, focus: 'money', apply: s => { S.startJob(s, U.chance(s, 0.6) ? '비정규' : '중소', '경력 단절 끝에 다시 일을 시작했다. 임금은 예전만 못했다.'); } },
        { label: '조금 더 집에 있는다', hint: '', auto: () => 0.45, apply: () => { } },
      ],
    },
    {
      id: 'buy_home', when: never, valid: s => s.housing !== 'own' && !s.hs.careHome,
      title: '집을 살까', text: s => `${D.regions[s.region].short} 아파트 ${money(S.homePrice(s, 'own'))}. 자산 ${money(s.money.assets + (s.money.deposit || 0))}, 대출 한도 약 ${money(S.maxLoan(s))}. 자가 가구는 열 중 여섯.`,
      options: s => [
        { label: '집을 산다 (대출)', hint: '집값이 오르면 자산이 늘고, 내리면 빚만 남는다.', auto: s => s.year >= 2015 && s.year <= 2021 ? 0.6 : 0.4, focus: 'money', apply: s => { const r = S.moveTo(s, 'own'); S.log(s, `집을 샀다. ${money(r.price)}, 대출 ${money(r.loan)}.`, 'home'); if (r.loan > 4 * Math.max(1, s.money.income)) { S.log(s, '영끌이었다. 매달 이자가 무거웠다.', 'home'); S.bump(s, 'happy', -3); } else S.bump(s, 'happy', 6); } },
        { label: '전세로 옮긴다', hint: '보증금은 돌아온다. 집값 걱정은 남의 일.', hide: s.housing === 'jeonse', auto: () => 0.25, apply: s => { const r = S.moveTo(s, 'jeonse'); S.log(s, `전세로 옮겼다. 보증금 ${money(r.price)}.`, 'home'); } },
        { label: '지금처럼 산다', hint: '', auto: () => 0.35, apply: () => { } },
      ],
    },
    {
      id: 'invest', when: s => s.age >= 25 && s.age % 6 === 1 && s.money.assets >= 3000 * idx(s) && (s.work.status === 'employed' || s.work.status === 'self') && !s.hs.dementia,
      title: '모은 돈을 어디에 둘까', text: s => `자산 ${money(s.money.assets)}. ${s.year >= 2017 ? '주변에서 코인 이야기가 들린다.' : '은행 금리가 꽤 높던 시절.'}`,
      options: s => [
        { label: '예금', hint: '연 2~3%. 잃지 않는다.', auto: () => 0.4, focus: 'rest', apply: s => S.setAlloc(s, { deposit: 0.7, stock: 0, coin: 0 }) },
        { label: '주식·펀드', hint: '평균 7%, 어떤 해는 −40%.', auto: () => 0.35, focus: 'money', apply: s => S.setAlloc(s, { deposit: 0.2, stock: 0.5, coin: 0 }) },
        { label: '코인', hint: '두 배가 되거나 반토막이 되거나.', hide: s.year < 2017, auto: () => s.age < 40 ? 0.15 : 0.04, apply: s => S.setAlloc(s, { deposit: 0.1, stock: 0.2, coin: 0.3 }) },
        { label: '그냥 통장에 둔다', hint: '', auto: () => 0.25, apply: s => S.setAlloc(s, { deposit: 0, stock: 0, coin: 0 }) },
      ],
    },
    {
      id: 'treatment', when: never, valid: s => !!s.hs.cancer && !s.hs.cancer.treat,
      title: s => `${s.hs.cancer ? s.hs.cancer.type : '병'} 치료를 어떻게 할까`, text: s => s.hs.cancer ? `5년 생존율 ${pct(s.hs.cancer.surv5)}. ${s.hs.cancer.early ? '이른 발견이라 가능성이 높다.' : '늦게 발견돼 가능성이 낮다.'} 자산 ${money(s.money.assets)}.` : '',
      options: s => [
        { label: '표준 치료 (건강보험)', hint: s => `연 ${money(450 * idx(s))} 안팎. 산정특례로 본인부담 5%.`, auto: () => 0.75, apply: s => { if (s.hs.cancer) s.hs.cancer.treat = 'standard'; S.log(s, '치료를 시작했다. 병원이 일상이 됐다.', 'health'); } },
        { label: '비급여까지 적극 치료', hint: s => `연 ${money(2500 * idx(s))}. 생존 가능성이 조금 오른다.`, hide: s.money.assets + S.maxLoan(s) < 2500 * idx(s), auto: () => 0.25, apply: s => { if (s.hs.cancer) s.hs.cancer.treat = 'aggressive'; S.log(s, '할 수 있는 치료는 다 받기로 했다.', 'health'); } },
        { label: '치료를 받지 않는다', hint: '남은 시간을 집에서.', auto: () => s.age >= 85 ? 0.3 : 0.02, apply: s => { if (s.hs.cancer) s.hs.cancer.treat = 'none'; S.log(s, '치료 대신 남은 시간을 택했다.', 'health'); } },
      ],
    },
    {
      id: 'quit_smoking', when: never, cooldown: 10, valid: s => s.hs.smoker,
      title: '담배를 끊을까', text: s => `${s.hs.smokeYears}년을 피웠다. 건강 ${Math.round(s.stats.health)}.`,
      options: s => [
        { label: '금연을 시도한다', hint: '성공 가능성 35%.', auto: () => 0.55, focus: 'health', apply: s => { if (U.chance(s, s.focus === 'health' ? 0.5 : 0.35)) { s.hs.smoker = false; s.hs.quit = true; S.log(s, '담배를 끊었다.', 'health'); S.bump(s, 'health', 4); } else S.log(s, '금연에 실패했다.', 'health'); } },
        { label: '그냥 피운다', hint: '', auto: () => 0.45, apply: () => { } },
      ],
    },
    {
      id: 'second_career', when: never, valid: s => s.work.status === 'unemployed' || s.work.status === 'seeking',
      title: '주된 일자리를 잃었다. 이제 어떻게', text: s => `${s.age}세. 자산 ${money(s.money.assets)}. 한국인은 평균 49세에 주된 일자리를 떠나 72세까지 일한다.`,
      options: s => [
        { label: '재취업 (임금은 60%)', hint: '경비, 운전, 중소기업 계약직.', auto: () => 0.5, focus: 'money', apply: s => { S.startJob(s, U.chance(s, 0.6) ? '비정규' : '중소', '재취업했다. 임금은 예전의 60%.'); s.work.pay = Math.round(s.work.pay * 0.75); } },
        { label: '자영업 (치킨집·카페)', hint: s => `자본 ${money(8000 * idx(s))}. 5년 생존율 34%.`, auto: () => 0.35, apply: s => { const cap = Math.round(8000 * idx(s)); if (s.money.assets < cap) s.money.debt += cap - s.money.assets; s.money.assets = Math.max(0, s.money.assets - cap); S.startJob(s, '자영업', '퇴직금으로 가게를 열었다.'); } },
        { label: '귀농', hint: '시골로 간다. 소득은 적고 몸은 바빠진다.', hide: s.year < 1995, auto: () => 0.07, focus: 'health', apply: s => { S.startJob(s, '농업', '시골로 내려가 농사를 시작했다.'); S.bump(s, 'health', 4); S.bump(s, 'rel', -4); } },
        { label: '쉬기로 한다', hint: s => `연금은 ${U.interp(D.byYear.pensionAge, s.year)}세부터. 그때까지 모은 돈으로.`, auto: s => s.money.assets > 50000 * idx(s) ? 0.4 : 0.1, focus: 'rest', apply: s => { S.retire(s, '일을 그만두고 쉬기로 했다.'); } },
      ],
    },
    {
      id: 'old_work', when: never, valid: s => s.work.status === 'retired' && !s.oldJob,
      title: '다시 일을 할까', text: s => `${s.age}세. 연소득 ${money(s.money.income)}. 65세 이상 셋 중 하나가 일한다.`,
      options: s => [
        { label: '노인 일자리·경비·청소', hint: s => `월 ${money(120 * idx(s))} 남짓. 사람을 만난다.`, auto: s => s.hs.poverty ? 0.8 : 0.3, focus: 'money', apply: s => { s.oldJob = Math.round(120 * idx(s)); S.log(s, '다시 일을 시작했다. 아침이 바빠졌다.', 'work'); S.bump(s, 'rel', 4); S.bump(s, 'happy', 2); } },
        { label: '쉰다', hint: '', auto: () => 0.5, focus: 'rest', apply: s => { s.taken.old_work = 2; } },
      ],
    },
    {
      id: 'care_home', when: never, max: 1, valid: s => !s.hs.careHome,
      title: '돌봄이 필요해졌다', text: s => `${s.age}세. ${s.hs.dementia ? '치매가 진행됐다.' : '혼자 지내기 어려워졌다.'} 자녀 ${s.kids.filter(k => k.alive).length}명.`,
      options: s => [
        { label: '요양원으로', hint: s => `연 ${money(1800 * idx(s))}. 집을 정리한다.`, auto: () => 0.45, apply: s => { s.hs.careHome = true; S.moveTo(s, 'care'); S.log(s, '요양원에 들어갔다. 창밖 풍경이 바뀌었다.', 'health'); S.bump(s, 'rel', -6); } },
        { label: '가족이 돌본다', hint: '자녀의 삶이 함께 무거워진다.', hide: !s.kids.some(k => k.alive) && !(s.love.married && s.love.spouse && s.love.spouse.alive), auto: () => 0.35, focus: 'rel', apply: s => { S.log(s, '가족이 곁에서 돌봐 주었다.', 'health'); S.bump(s, 'rel', 3); S.bump(s, 'health', -2); } },
        { label: '방문 요양보호사', hint: s => `연 ${money(600 * idx(s))}. 집에 머문다.`, auto: () => 0.2, apply: s => { s.hs.visitCare = true; S.log(s, '요양보호사가 집에 오기 시작했다.', 'health'); } },
      ],
    },
    {
      id: 'divorce_choice', when: never, valid: s => s.love.married,
      title: '결혼 생활이 흔들린다', text: s => `관계 ${Math.round(s.stats.rel)}. 결혼 ${s.love.yearsMarried}년. 이 세대 결혼 셋 중 하나가 이혼으로 끝난다.`,
      options: s => [
        { label: '이혼한다', hint: '재산을 나눈다. 아이들의 삶도 갈린다.', auto: () => 0.25, apply: s => S.divorce(s, '오랜 고민 끝에 이혼했다.') },
        { label: '상담을 받고 노력한다', hint: '관계가 조금 회복된다.', auto: () => 0.45, focus: 'rel', apply: s => { S.bump(s, 'rel', 9); S.cost(s, 150 * idx(s)); S.log(s, '부부 상담을 받았다. 조금은 나아졌다.', 'love'); } },
        { label: '그냥 산다', hint: '', auto: () => 0.3, apply: s => { S.bump(s, 'happy', -3); } },
      ],
    },
    {
      id: 'kid_wedding', when: never, valid: s => s.kids.some(k => k.married),
      title: '자식이 결혼한다. 얼마나 도울까', text: s => `자산 ${money(s.money.assets)}. 신혼집 마련에 부모 손이 닿는 집이 많다.`,
      options: s => [
        { label: '크게 돕는다', hint: s => `${money(Math.min(s.money.assets * 0.3, 15000 * idx(s)))}.`, hide: s.money.assets < 3000 * idx(s), auto: () => 0.4, focus: 'rel', apply: s => { S.cost(s, Math.round(Math.min(s.money.assets * 0.3, 15000 * idx(s)))); S.bump(s, 'rel', 6); S.log(s, '아이의 신혼집에 보탰다.', 'money'); } },
        { label: '조금 돕는다', hint: s => `${money(2000 * idx(s))}.`, hide: s.money.assets < 2000 * idx(s), auto: () => 0.4, apply: s => { S.cost(s, Math.round(2000 * idx(s))); S.bump(s, 'rel', 2); } },
        { label: '형편이 안 된다', hint: '', auto: () => 0.3, apply: s => { S.bump(s, 'rel', -3); } },
      ],
    },
    {
      id: 'parent_care', when: s => s.age >= 40 && s.age % 4 === 0 && ((s.parents.mother.alive && s.parents.mother.age >= 80) || (s.parents.father.alive && s.parents.father.age >= 80)) && !s.abroad, max: 2,
      title: '부모가 늙었다', text: s => `${s.parents.mother.alive ? `어머니 ${s.parents.mother.age}세` : ''}${s.parents.mother.alive && s.parents.father.alive ? ', ' : ''}${s.parents.father.alive ? `아버지 ${s.parents.father.age}세` : ''}. 형제 ${s.siblings.length}명.`,
      options: s => [
        { label: '요양비를 보낸다', hint: s => `${money(3000 * idx(s))}.`, auto: s => s.money.assets > 5000 * idx(s) ? 0.5 : 0.1, focus: 'money', apply: s => { S.cost(s, Math.round(3000 * idx(s))); S.bump(s, 'rel', 4); S.log(s, '부모의 요양비를 보냈다.', 'family'); } },
        { label: '모시고 산다', hint: '집이 좁아지고 하루가 바빠진다.', auto: () => 0.3, focus: 'rel', apply: s => { S.bump(s, 'rel', 3); S.bump(s, 'happy', -4); S.bump(s, 'health', -2); S.log(s, '부모를 모시고 살기 시작했다.', 'family'); } },
        { label: '형제에게 맡긴다', hint: '', hide: s.siblings.length === 0, auto: () => 0.3, apply: s => { S.bump(s, 'rel', -4); S.log(s, '부모 돌봄은 형제가 맡았다. 마음 한쪽이 무거웠다.', 'family'); } },
      ],
    },
    {
      id: 'buy_car', when: never, valid: s => !s.car && (s.work.status === 'employed' || s.work.status === 'self'),
      title: '차를 살까', text: s => `현금 ${money(s.money.assets)}, 연소득 ${money(s.money.income)}. 유지비는 해마다 ${money(260 * idx(s))} 안팎.`,
      options: s => {
        const afford = t => s.money.assets + Math.min(s.money.income * 1.5, t[1] * idx(s) * 0.7) >= t[1] * idx(s);
        const tiers = S.carTiers.filter(afford).slice(-3);
        const opts = tiers.map(t => ({ label: t[0], hint: `${money(t[1] * idx(s))}. 값은 해마다 13%씩 떨어진다.`, auto: () => (t[1] * idx(s) < s.money.income * 0.8 ? 0.35 : 0.12), focus: 'money', apply: s => { const price = Math.round(t[1] * idx(s)); const loan = Math.max(0, price - s.money.assets); S.cost(s, price - loan); if (loan) s.money.debt += loan; s.car = { n: t[0], price: t[1], v: price, age: 0, boughtYear: s.year }; S.log(s, `${t[0]}를 샀다. ${money(price)}${loan ? `, 그중 할부 ${money(loan)}` : ''}.`, 'item'); S.bump(s, 'happy', 4); } }));
        opts.push({ label: '사지 않는다', hint: '대중교통으로 충분하다.', auto: () => 0.5, focus: 'rest', apply: () => { } });
        return opts;
      },
    },
    {
      id: 'return_home', when: s => !!s.abroad && s.age >= 30 && s.age % 6 === 0 && s.age < 65,
      title: '한국으로 돌아갈까', text: s => `해외 생활 ${s.age - s.work.since}년.`,
      options: s => [
        { label: '돌아간다', hint: '다시 일을 찾아야 한다.', auto: () => 0.35, focus: 'rel', apply: s => { s.abroad = false; s.work.status = 'seeking'; s.work.type = null; s.housing = 'monthly'; S.bump(s, 'rel', 8); S.log(s, '한국으로 돌아왔다.', 'work'); } },
        { label: '머문다', hint: '', auto: () => 0.65, apply: () => { } },
      ],
    },
  ];
})();
