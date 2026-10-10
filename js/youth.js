window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util;
  const Y = KR.YOUTH = {};
  const once = (s, k) => { if (s.flags[k]) return false; s.flags[k] = true; return true; };
  const idx = s => S.incomeIndex(s.year);
  const dec = s => s.parents.decile;
  const working = s => s.work.status === 'employed' || s.work.status === 'self';
  const push = (s, id) => S.pushDecision(s, id);
  const log = (s, t) => S.log(s, t, 'youth');
  const never = () => false;
  const money = v => U.fmtMan(Math.round(v));
  const pct = p => `${Math.round(U.clamp(p, 0, 1) * 100)}%`;

  Y.majorOf = (s, track) => {
    if (s.edu.hs === '예술고') return '예체능';
    const sci = [['공학', 50], ['자연', 25], ['간호·보건', 10], ['사범', 5], ['예체능', 10]];
    const hum = [['상경', 35], ['인문사회', 38], ['법·행정', 10], ['사범', 9], ['예체능', 8]];
    const row = U.weighted(s, track === '이과' ? sci : hum, x => x[1] * (x[0] === '사범' && s.stats.know < 60 ? 0.3 : 1));
    return row[0];
  };

  Y.year = function (s) {
    const a = s.age, y = s.year, st = s.stats, e = s.edu;
    if (a >= 30) return;
    if (a === 1 && y >= 1970 && U.chance(s, 0.9)) {
      const items = [['연필', '학자가 될 거라고들 했다', 'know', 2], ['돈', '부자가 될 거라고들 했다', 'happy', 1], ['실', '오래 살 거라고들 했다', 'health', 2], ['마이크', '인기가 많을 거라고들 했다', 'rel', 2]];
      if (y >= 2000) items.push(['청진기', '의사가 될 거라고들 했다', 'know', 1]); if (y >= 2010) items.push(['마우스', '개발자가 될 거라고들 했다', 'know', 1]);
      const it = U.pick(s, items); log(s, `돌잔치. 돌잡이에서 ${U.eul(it[0])} 집었다. ${it[1]}.`); S.bump(s, it[2], it[3]);
    }
    if (a === 2 && U.chance(s, U.interp(D.byYear.dualIncome, y) + 0.1)) log(s, U.chance(s, 0.6) ? '맞벌이 부모 대신 할머니가 돌봐 주었다.' : '어린이집에 가장 먼저 가고 가장 늦게 나왔다.');
    if (a >= 3 && a <= 7 && U.chance(s, 0.08)) { log(s, U.pick(s, ['독감으로 며칠 입원했다.', '수족구병으로 어린이집을 쉬었다.', '놀이터에서 넘어져 꿰맸다.'])); S.bump(s, 'health', -2); }
    if (a === 4 && U.chance(s, y >= 2000 ? 0.75 : 0.4)) { log(s, '한글을 뗐다. 간판을 소리 내어 읽고 다녔다.'); S.bump(s, 'know', 2); }
    if (a === 5 && y >= 2005 && dec(s) >= 8) push(s, 'eng_kinder');
    if (a >= 5 && a <= 7 && once(s, 'tkd') && U.chance(s, 0.4) && y >= 1975) { log(s, '태권도장에 다니기 시작했다. 띠 색이 바뀔 때마다 자랑했다.'); S.bump(s, 'health', 3); S.bump(s, 'rel', 2); }
    if (a >= 6 && a <= 8 && once(s, 'piano') && U.chance(s, dec(s) >= 5 ? 0.4 : 0.15) && y >= 1980) { log(s, '피아노 학원에 다녔다. 체르니 30번에서 그만뒀다.'); S.bump(s, 'happy', 2); S.bump(s, 'know', 1); }
    if (a >= 5 && a <= 9 && once(s, 'park') && dec(s) >= 4 && U.chance(s, 0.4) && y >= 1990) { log(s, '처음 놀이공원에 갔다. 하루가 꿈 같았다.'); S.bump(s, 'happy', 3); }
    if (e.stage === 'elem') {
      if (a >= 7 && a <= 9 && once(s, 'worksheet') && y >= 1980 && y <= 2012 && U.chance(s, 0.45)) { log(s, '학습지 선생님이 매주 왔다. 밀린 숙제를 몰아서 했다.'); S.bump(s, 'know', 1.5); }
      if (a === 7 && U.chance(s, 0.5)) log(s, U.pick(s, ['받아쓰기 100점을 받았다.', '구구단을 외웠다.', '일기 쓰기가 제일 싫었다.']));
      if (a >= 9 && a <= 11 && !s.flags.classPres && U.chance(s, 0.22 * st.rel / 60)) { s.flags.classPres = true; if (U.chance(s, 0.5)) { log(s, '반장이 됐다. 이름이 불릴 때 얼굴이 붉어졌다.'); S.bump(s, 'rel', 4); S.bump(s, 'happy', 3); } else { log(s, '반장 선거에서 한 표 차이로 떨어졌다.'); S.bump(s, 'happy', -2); } }
      if (a >= 9 && a <= 12 && !s.flags.glasses && U.chance(s, 0.18)) { s.flags.glasses = true; log(s, '칠판이 흐려져 안경을 쓰기 시작했다.'); }
      if (a >= 9 && a <= 11 && y >= 2003 && st.know >= 66) push(s, 'gifted');
      if (a >= 10 && a <= 13 && y >= 1998 && y <= 2019 && dec(s) >= 8) push(s, 'early_abroad');
      if (a >= 10 && a <= 12 && once(s, 'contest') && st.know >= 74 && U.chance(s, 0.5)) { if (U.chance(s, 0.45)) { s.flags.contestWin = true; log(s, '수학 경시대회에서 상을 받았다.'); S.bump(s, 'know', 3); S.bump(s, 'happy', 4); } else log(s, '경시대회에 나갔지만 상은 받지 못했다.'); }
      if (a >= 8 && a <= 11 && once(s, 'bookking') && st.know >= 58 && U.chance(s, 0.3)) { log(s, '독서왕 상을 받았다. 도서관이 놀이터였다.'); S.bump(s, 'know', 2); }
      if (a >= 6 && a <= 14 && U.chance(s, 0.035)) { log(s, '이사로 전학했다. 새 교실이 낯설었다.'); S.bump(s, 'rel', -5); }
      if (a >= 10 && a <= 11 && y >= 2000 && once(s, 'pcbang') && U.chance(s, st.happy < 45 ? 0.45 : 0.25)) { log(s, y >= 2013 ? '스마트폰 게임에 빠졌다. 밤마다 화면이 밝았다.' : 'PC방에 드나들기 시작했다. 스타크래프트와 메이플이 전부였다.'); S.bump(s, 'know', -2); S.bump(s, 'happy', 2); }
      if (a === 11 && st.know >= 70 && U.chance(s, 0.5)) { log(s, '학교 시험에서 상위권에 들었다. 부모가 자랑하고 다녔다.'); S.bump(s, 'happy', 3); }
      if (a === 10 && U.chance(s, 0.3)) log(s, U.pick(s, ['여름 방학 캠프에 갔다.', '수영을 배웠다.', '과학 상자 조립에 빠졌다.', '만화책을 쌓아 두고 읽었다.']));
    }
    if (e.stage === 'mid') {
      if (a === 13 && U.chance(s, 0.35)) { log(s, '방문을 닫고 지내는 날이 많아졌다. 중2병이라고들 했다.'); S.bump(s, 'rel', -3); S.bump(s, 'happy', -2); }
      if (a === 13 && y >= 2016 && U.chance(s, 0.6)) log(s, '자유학기제. 시험 대신 진로 수업을 들었다.');
      if (a >= 13 && a <= 16 && once(s, 'firstlove') && U.chance(s, 0.3)) { if (U.chance(s, 0.4)) { log(s, '짝사랑이 이루어졌다. 등굣길이 짧게 느껴졌다.'); S.bump(s, 'happy', 6); S.bump(s, 'rel', 2); } else { log(s, '고백했다가 차였다. 한동안 그 반 앞을 피해 다녔다.'); S.bump(s, 'happy', -4); } }
      if (a >= 12 && a <= 14 && e.tutoring && U.chance(s, 0.35)) { log(s, '학원 세 곳을 돌았다. 저녁은 편의점 삼각김밥.'); S.bump(s, 'health', -2); S.bump(s, 'know', 1); }
      if (a >= 13 && a <= 14 && y >= 2009 && once(s, 'volunteer') && U.chance(s, 0.4)) { s.flags.volunteer = true; log(s, '봉사활동 시간을 채우러 복지관에 다녔다.'); S.bump(s, 'rel', 2); }
      if (a === 13 && st.know >= 78 && (y >= 1983)) push(s, 'sci_prep');
      if (a === 14) { if (st.know >= 80) { log(s, '전교 10등 안에 들었다.'); S.bump(s, 'happy', 4); } else if (st.know < 40) { log(s, '성적표를 가방 깊숙이 숨겼다.'); S.bump(s, 'happy', -3); } }
      if (a === 12 && y >= 2013 && once(s, 'phonedep') && U.chance(s, 0.2)) { log(s, '스마트폰을 손에서 놓지 못했다.'); S.bump(s, 'know', -2); }
    }
    if (e.stage === 'high') {
      if (a === 15 && y >= 1995 && y <= 2021) push(s, 'track');
      if (a === 15 && y >= 2022 && !e.track) e.track = U.chance(s, 0.5 + (st.know - 60) / 200) ? '이과' : '문과';
      if (a === 15 && y < 1995 && !e.track) e.track = U.chance(s, 0.5) ? '이과' : '문과';
      if (a === 15 && once(s, 'nightstudy')) { if (y >= 1980 && y <= 2012 && U.chance(s, 0.6)) log(s, '야간자율학습. 밤 10시 교문을 나설 때 별이 보였다.'); else if (y > 2012 && U.chance(s, 0.5)) log(s, '스터디카페 정기권을 끊었다.'); }
      if (a === 16) { if (st.know >= 85) { log(s, '모의고사 전 과목 1등급을 받았다.'); S.bump(s, 'happy', 4); } else if (st.know <= 42) { log(s, '모의고사 성적표를 보고 진로를 다시 생각했다.'); S.bump(s, 'happy', -3); } else if (U.chance(s, 0.5)) log(s, `모의고사 ${st.know >= 70 ? '2' : '3'}등급. 조금만 더 하면 될 것 같았다.`); }
      if (a === 16 && y >= 2000) push(s, 'parttime');
      if (a === 17 && U.chance(s, 0.65)) { log(s, U.pick(s, ['입시 스트레스로 밤잠을 설쳤다.', '수능 100일 전, 교실 뒤에 디데이가 걸렸다.', '수능날 아침, 후배들이 교문 앞에서 응원했다.'])); S.bump(s, 'health', -2); S.bump(s, 'happy', -3); }
      if (a === 17 && y >= 2008 && U.chance(s, 0.7)) log(s, '수시 원서 여섯 장을 썼다.');
      if (a >= 15 && a <= 16 && U.chance(s, st.happy < 30 ? 0.04 : 0.01) && once(s, 'ged')) { log(s, '학교를 그만두고 검정고시를 준비했다.'); S.bump(s, 'happy', 3); S.bump(s, 'know', -2); }
      if (a === 16 && U.chance(s, 0.4)) log(s, U.pick(s, ['학교 축제에서 무대에 올랐다.', '야자를 빼먹고 떡볶이를 먹었다.', '독서실에서 밤을 새웠다.', '친구와 진로 이야기를 하다 울었다.']));
    }
    if (e.stage === 'univ' && s.mil.status !== 'serving' && e.univ) {
      const yearNo = e.univ.years - e.left;
      if (!e.univ.online) push(s, 'campus');
      if (yearNo === 1 && U.chance(s, 0.7)) log(s, U.pick(s, ['새터에서 선배들과 밤새 게임을 했다.', '첫 MT. 장기자랑에서 노래를 불렀다.', '학식 천 원의 아침밥을 먹으러 일찍 나갔다.', '과잠을 맞췄다.']));
      if (a >= 19 && a <= 22 && !s.love.partner && !s.love.married && once(s, 'cc') && U.chance(s, 0.1)) { s.love.partner = { since: a }; s.love.since = 0; s.flags.partnerEver = true; log(s, '같은 과 동기와 사귀기 시작했다. 캠퍼스 커플.'); S.bump(s, 'happy', 6); }
      if (a >= 19 && a <= 24 && U.chance(s, 0.3)) { if (st.know >= 76) { log(s, '성적 장학금을 받았다.'); S.gain(s, 250 * idx(s)); S.bump(s, 'happy', 3); } else if (st.know < 42 && U.chance(s, 0.5)) { log(s, '학사경고를 받았다.'); S.bump(s, 'happy', -4); } }
      if (e.univ.med && e.left === 3 && U.chance(s, 0.8)) log(s, '본과에 올라갔다. 해부학 실습이 시작됐다.');
      if (y >= 2020 && y <= 2021 && once(s, 'remote')) { log(s, '비대면 수업. 줌 화면 속에서 한 학기가 지나갔다.'); S.bump(s, 'rel', -3); }
      if (y === 2011 && U.chance(s, 0.4)) log(s, '반값 등록금 집회에 나갔다.');
      if (yearNo === 2 && U.chance(s, 0.3)) log(s, U.pick(s, ['과 대표를 맡았다.', '학과 체육대회에서 다쳤다.', '전공 수업이 갑자기 어려워졌다.', '복학생 선배가 밥을 사 줬다.']));
      if (a >= 19 && a <= 24 && U.chance(s, 0.25)) log(s, U.pick(s, ['수강신청에 실패해 아침 수업만 남았다.', '팀플에서 혼자 발표를 떠맡았다.', '교수님 연구실에서 커피를 탔다.', '종강 후 친구들과 밤바다를 보러 갔다.', '시험 기간, 도서관 열람실 자리를 맡으러 새벽에 갔다.', '축제에 온 가수를 보려고 세 시간을 서 있었다.', '중앙도서관에서 밤을 새고 첫차를 탔다.', '과외 학생이 성적이 올랐다고 연락이 왔다.']));
    }
    if (a >= 20 && a <= 26 && y >= 1989 && !s.flags.backpack && e.stage !== 'univ' && (s.money.assets >= 400 * idx(s) || dec(s) >= 5) && s.mil.status !== 'serving') push(s, 'backpack');
    if (working(s) && a >= 22 && a <= 29) {
      if (s.work.years === 1 && once(s, 'newbie')) { const good = U.chance(s, 0.55); log(s, good ? '사수가 좋은 사람이었다. 점심마다 많이 배웠다.' : '첫 회식에서 실수했다. 사수는 말이 없었다.'); S.bump(s, 'rel', good ? 3 : -2); S.bump(s, 'happy', good ? 3 : -3); }
      if (a >= 23 && a <= 27 && once(s, 'savings') && U.chance(s, 0.5)) { log(s, '매달 적금을 부었다. 통장을 볼 때마다 조금 든든했다.'); S.bump(s, 'happy', 1); }
      if (a >= 24 && a <= 28 && y >= 1990 && !s.flags.subscription) push(s, 'housing_sub');
      if (a >= 22 && a <= 29 && once(s, 'gym') && U.chance(s, 0.15)) { log(s, '헬스장을 끊었다. 이번에는 석 달을 넘겼다.'); S.bump(s, 'health', 4); S.bump(s, 'happy', 2); }
      if (a >= 27 && U.chance(s, 0.3)) { log(s, '친구 결혼식이 잦아졌다. 축의금이 나갔다.'); S.cost(s, 60 * idx(s)); }
      if (y >= 2010 && U.chance(s, 0.015)) { log(s, '보이스피싱에 당했다. 몇 달치 월급이 사라졌다.'); S.cost(s, 300 * idx(s)); S.bump(s, 'happy', -6); }
    }
    if (a >= 25 && a <= 29 && !working(s) && s.work.status === 'seeking' && U.chance(s, 0.3)) log(s, U.pick(s, ['자소서 50번째. 복사 붙여넣기가 늘었다.', '면접 정장을 빌렸다.', '친구들 취업 소식에 축하 메시지만 보냈다.', '토익 점수가 또 만료됐다.']));
  };

  const push_ = KR.DECISIONS.push.bind(KR.DECISIONS);
  push_({
    id: 'eng_kinder', when: never, max: 1, valid: s => s.age <= 6,
    title: '영어유치원에 보낼까', text: s => `월 ${money(120 * idx(s))}. 집은 소득 ${dec(s)}분위.`,
    options: s => [
      { label: '영어유치원', hint: '지식이 오르지만 아이는 지친다.', auto: () => 0.45, focus: 'study', apply: s => { S.cost(s, 1440 * idx(s)); S.bump(s, 'know', 3); S.bump(s, 'happy', -2); log(s, '영어유치원에 다녔다. 다섯 살에 알파벳 노래를 외웠다.'); } },
      { label: '동네 유치원', hint: '놀이가 많다.', auto: () => 0.55, focus: 'rest', apply: s => { S.bump(s, 'happy', 2); S.bump(s, 'rel', 1); log(s, '동네 유치원에 다녔다. 흙장난이 일과였다.'); } },
    ],
  });
  push_({
    id: 'gifted', when: never, max: 1, valid: s => s.edu.stage === 'elem',
    title: '영재원에 지원할까', text: s => `지식 ${Math.round(s.stats.know)}. 교육청 영재교육원은 학생 2% 남짓이 다닌다.`,
    options: s => [
      { label: '교육청 영재원 지원', hint: s => `합격 가능성 ${pct((s.stats.know - 58) / 35)}. 주말마다 수업.`, auto: s => s.stats.know >= 74 ? 0.5 : 0.25, focus: 'study', apply: s => { if (U.chance(s, (s.stats.know - 58) / 35)) { s.edu.gifted = true; S.bump(s, 'know', 5); S.cost(s, 60 * idx(s)); log(s, '영재교육원에 합격했다. 토요일마다 다른 학교 아이들과 수업을 들었다.'); S.bump(s, 'happy', 3); } else { log(s, '영재원 선발에서 떨어졌다.'); S.bump(s, 'happy', -3); } } },
      { label: '대학부설 영재원 지원', hint: s => `합격 가능성 ${pct((s.stats.know - 70) / 30)}. 더 어렵고 더 멀다.`, hide: s.stats.know < 76, auto: () => 0.3, focus: 'study', apply: s => { if (U.chance(s, (s.stats.know - 70) / 30)) { s.edu.gifted = true; S.bump(s, 'know', 7); S.cost(s, 150 * idx(s)); log(s, '대학부설 영재교육원에 합격했다. 주말마다 대학 강의실에 앉았다.'); S.bump(s, 'happy', 3); } else { log(s, '대학부설 영재원 선발에서 떨어졌다.'); S.bump(s, 'happy', -3); } } },
      { label: '지원하지 않는다', hint: '주말은 노는 날.', auto: () => 0.35, focus: 'rest', apply: s => { S.bump(s, 'happy', 1); } },
    ],
  });
  push_({
    id: 'early_abroad', when: never, max: 1, valid: s => s.edu.stage === 'elem',
    title: '아이를 외국에 보낼까', text: s => `집은 소득 ${dec(s)}분위. 조기 유학과 어학연수가 유행이던 때.`,
    options: s => [
      { label: '1년 어학연수', hint: s => `${money(3000 * idx(s))}. 영어가 늘고 친구를 잃는다.`, auto: () => 0.25, focus: 'study', apply: s => { S.cost(s, 3000 * idx(s)); S.bump(s, 'know', 6); S.bump(s, 'rel', -4); s.flags.intl = true; log(s, '1년 동안 외국 학교에 다녔다. 돌아오니 반 아이들이 낯설었다.'); } },
      { label: '2년 조기 유학', hint: s => `${money(9000 * idx(s))}. 기러기 가족.`, hide: dec(s) < 9, auto: () => 0.12, apply: s => { S.cost(s, 9000 * idx(s)); S.bump(s, 'know', 9); S.bump(s, 'rel', -7); S.bump(s, 'happy', -2); s.flags.intl = true; log(s, '어머니와 외국으로 갔다. 아버지는 혼자 남아 돈을 보냈다.'); if (s.parents.together && U.chance(s, 0.15)) { s.parents.together = false; log(s, '떨어져 지낸 부모의 사이가 멀어졌다.'); } } },
      { label: '보내지 않는다', hint: '', auto: () => 0.63, apply: () => { } },
    ],
  });
  push_({
    id: 'sci_prep', when: never, max: 1, valid: s => s.edu.stage === 'mid' && !s.edu.hs,
    title: '영재고·과학고 입시를 준비할까', text: s => `지식 ${Math.round(s.stats.know)}. 영재고는 한 해 800명, 과학고는 1,600명 남짓을 뽑는다.`,
    options: s => [
      { label: '준비한다', hint: s => `학원비 연 ${money(2400 * idx(s))}. ${s.year >= 2003 ? '영재고 ' + pct((s.stats.know - 78) / 30) + ', ' : ''}과학고 ${pct((s.stats.know - 72) / 30)}.`, auto: s => dec(s) >= 6 ? 0.5 : 0.25, focus: 'study', apply: s => {
        S.cost(s, 2400 * idx(s)); S.bump(s, 'know', 4); S.bump(s, 'health', -2);
        if (s.year >= 2003 && U.chance(s, (s.stats.know - 78) / 30)) { s.edu.hs = '영재고'; log(s, '영재학교에 합격했다. 전국에서 모인 아이들 사이에 앉았다.'); S.bump(s, 'happy', 6); }
        else if (U.chance(s, (s.stats.know - 72) / 30)) { s.edu.hs = '과학고'; log(s, '과학고에 합격했다.'); S.bump(s, 'happy', 5); }
        else { log(s, '영재고·과학고 입시에서 떨어졌다. 일반고 원서를 썼다.'); S.bump(s, 'happy', -4); }
      } },
      { label: '준비하지 않는다', hint: '', auto: () => 0.5, apply: () => { } },
    ],
  });
  push_({
    id: 'track', when: never, max: 1, valid: s => s.edu.stage === 'high' && !s.edu.track,
    title: '문과? 이과?', text: s => `지식 ${Math.round(s.stats.know)}. 2학년부터 반이 갈린다.`,
    options: s => [
      { label: '이과', hint: '공대·자연대·의대로 간다.', auto: s => 0.5 + (s.stats.know - 60) / 200 + (s.edu.hs === '과학고' || s.edu.hs === '영재고' ? 1 : 0), apply: s => { s.edu.track = '이과'; } },
      { label: '문과', hint: '상경·인문·법·사범으로 간다.', auto: s => 0.5 - (s.stats.know - 60) / 200 + (s.edu.hs === '외고' ? 1 : 0), apply: s => { s.edu.track = '문과'; } },
    ],
  });
  push_({
    id: 'backpack', when: never, max: 1,
    title: '배낭여행을 떠날까', text: s => `자산 ${money(s.money.assets)}. 유럽 한 달이면 ${money(400 * idx(s))}.`,
    options: s => [
      { label: '유럽 한 달', hint: '행복 +8. 돈이 든다.', auto: () => s.money.assets >= 400 * idx(s) ? 0.45 : 0.2, focus: 'rest', apply: s => { s.flags.backpack = true; S.cost(s, 400 * idx(s)); S.bump(s, 'happy', 8); S.bump(s, 'rel', 2); S.bump(s, 'know', 1); log(s, '유럽으로 배낭여행을 떠났다. 기차에서 한 달을 살았다.'); } },
      { label: '국내 한 바퀴', hint: '행복 +4.', auto: () => 0.3, apply: s => { s.flags.backpack = true; S.cost(s, 100 * idx(s)); S.bump(s, 'happy', 4); log(s, '기차표 한 장으로 전국을 돌았다.'); } },
      { label: '다음에', hint: '', auto: () => 0.25, apply: s => { s.flags.backpack = true; } },
    ],
  });
  push_({
    id: 'housing_sub', when: never, max: 1,
    title: '청약통장을 만들까', text: '월 10만 원. 언젠가 아파트 청약에 쓸 수 있다.',
    options: s => [
      { label: '만든다', hint: '집을 살 때 분양가로 살 기회가 생긴다.', auto: () => 0.7, focus: 'money', apply: s => { s.flags.subscription = true; log(s, '청약통장을 만들었다. 매달 10만 원.'); } },
      { label: '안 만든다', hint: '', auto: () => 0.3, apply: s => { s.flags.subscription = 'no'; } },
    ],
  });
  push_({
    id: 'lawschool', when: never, max: 1, valid: s => s.work.status === 'seeking',
    title: '로스쿨에 갈까', text: s => `3년, ${money(5000 * idx(s))}. 변호사 시험 합격률은 절반을 조금 넘는다.`,
    options: s => [
      { label: '로스쿨 진학', hint: s => `합격 가능성 ${pct((s.stats.know - 60) / 40)}.`, auto: () => 0.4, focus: 'study', apply: s => { if (U.chance(s, (s.stats.know - 60) / 40)) { S.cost(s, 5000 * idx(s)); s.edu.stage = 'grad'; s.edu.left = 3; s.work.status = 'student'; s.edu.lawschool = true; log(s, '로스쿨에 입학했다.'); } else { log(s, '로스쿨 입시에서 떨어졌다.'); S.bump(s, 'happy', -4); } } },
      { label: '취업한다', hint: '', auto: () => 0.6, apply: () => { } },
    ],
  });
  push_({
    id: 'campus', when: never, valid: s => s.edu.stage === 'univ' && !!s.edu.univ && s.mil.status !== 'serving',
    title: s => { const e = s.edu; const n = Math.min(e.univ.years, e.univ.years - e.left + 1); return `대학 ${n}학년. 올해는 무엇을 할까`; },
    text: s => { const e = s.edu; return `${e.univ.kind} · ${e.major} 계열${e.sub ? ` · ${e.sub}` : ''}. 지식 ${Math.round(s.stats.know)}, 관계 ${Math.round(s.stats.rel)}, 현금 ${money(s.money.assets)}.`; },
    options: s => {
      const e = s.edu, y = s.year, n = Math.min(e.univ.years, e.univ.years - e.left + 1), lastYear = e.left === 1, tier = e.univ.tier, sci = ['공학', '자연', '의약'].includes(e.major);
      const tutorPay = (tier >= 3 ? 900 : tier === 2 ? 650 : 400) * idx(s);
      const internP = U.clamp(0.25 + (s.stats.know - 60) / 150 + (tier >= 3 ? 0.25 : tier === 2 ? 0.1 : -0.05) + (e.spec || 0), 0.1, 0.9);
      return [
        { label: '동아리', hint: s.flags.clubIn ? '올해도 동아리. 운영진이 될 수도.' : '밴드, 춤, 봉사, 학술… 사람을 얻는다.', auto: () => n <= 2 ? 0.28 : 0.12, focus: 'rel', apply: s => { S.bump(s, 'rel', 4); S.bump(s, 'happy', 3); if (!s.flags.clubIn) { s.flags.clubIn = true; log(s, '동아리에 들어갔다. 동방에서 살다시피 했다.'); } else if (U.chance(s, 0.4)) { log(s, '동아리 운영진을 맡았다. 공연 날 울었다.'); S.bump(s, 'rel', 3); } else log(s, '동아리 공연 무대에 올랐다.'); } },
        { label: '학생회', hint: '과 학생회·총학. 관계가 넓어지고 학점이 깎인다.', hide: n > 3, auto: () => 0.06, focus: 'rel', apply: s => { S.bump(s, 'rel', 6); S.bump(s, 'know', -1); S.bump(s, 'happy', 2); log(s, '학생회에 들어갔다. 밤새 현수막을 만들었다.'); } },
        { label: '과외 아르바이트', hint: s => `연 ${money(tutorPay)} 안팎. 대학 간판이 시급을 정한다.`, hide: y < 1980, auto: () => tier >= 2 ? 0.18 : 0.08, focus: 'money', apply: s => { S.gain(s, tutorPay); S.bump(s, 'know', 1); S.bump(s, 'health', -1); log(s, `과외를 ${U.int(s, 1, 3)}개 뛰었다. ${money(tutorPay)}을 벌었다.`); } },
        { label: '카페·편의점 아르바이트', hint: s => `연 ${money(520 * idx(s))}. 몸이 고되다.`, auto: () => dec(s) <= 4 ? 0.22 : 0.1, focus: 'money', apply: s => { S.gain(s, 520 * idx(s)); S.bump(s, 'health', -2); S.bump(s, 'happy', -1); S.bump(s, 'rel', 1); log(s, '카페 마감 알바로 한 해를 보냈다. 손님 얼굴을 다 외웠다.'); } },
        { label: '방학 인턴', hint: s => `합격 가능성 ${pct(internP)}. 대기업 문이 넓어지고 정규직 전환 기회도.`, hide: y < 2000 || n < 2, auto: () => n >= 3 ? 0.2 : 0.08, focus: 'work', apply: s => { if (U.chance(s, internP)) { const big = U.chance(s, tier >= 3 ? 0.5 : 0.25); S.gain(s, 300 * idx(s)); e.spec = (e.spec || 0) + 0.08; S.bump(s, 'know', 2); if (big) { s.flags.internBig = true; log(s, '대기업 인턴에 붙었다. 사원증을 목에 걸고 다녔다.'); } else log(s, '중소기업 인턴을 했다. 복사와 엑셀을 배웠다.'); } else { log(s, '인턴 서류에서 다 떨어졌다. 방학이 길었다.'); S.bump(s, 'happy', -3); } } },
        { label: '학부연구생·조교', hint: '연구실에서 교수와 일한다. 대학원·추천 취업으로 이어진다.', hide: n < 3 || !sci && e.major !== '사회' && e.major !== '인문', auto: () => sci ? 0.12 : 0.04, focus: 'study', apply: s => { S.gain(s, 150 * idx(s)); S.bump(s, 'know', 4); s.flags.ra = (s.flags.ra || 0) + 1; if (U.chance(s, 0.25)) { log(s, '연구실 논문에 공저자로 이름이 올랐다.'); S.bump(s, 'happy', 4); S.bump(s, 'know', 2); } else log(s, '연구실 조교로 한 해를 보냈다. 교수님의 커피 취향을 외웠다.'); if (s.stats.know >= 72 && U.chance(s, 0.3)) { s.flags.profRef = true; log(s, '교수님이 아는 회사를 소개해 주겠다고 했다.'); } } },
        { label: '대외활동', hint: '서포터즈·기자단·홍보대사. 이력서 한 줄과 친구.', hide: y < 2005, auto: () => 0.07, focus: 'rel', apply: s => { S.bump(s, 'rel', 4); e.spec = (e.spec || 0) + 0.03; log(s, U.pick(s, ['기업 서포터즈 활동을 했다. 단체 티셔츠가 생겼다.', '대학생 기자단으로 인터뷰를 다녔다.', '홍보대사로 전국을 돌았다.'])); } },
        { label: '봉사활동', hint: dec(s) >= 5 && y >= 1995 ? '교육봉사 또는 해외봉사.' : '교육봉사·복지관.', auto: () => 0.06, focus: 'rel', apply: s => { if (dec(s) >= 5 && y >= 1995 && U.chance(s, 0.5)) { S.cost(s, 100 * idx(s)); S.bump(s, 'happy', 5); S.bump(s, 'rel', 3); log(s, '해외봉사를 다녀왔다. 돌아오는 비행기에서 많이 울었다.'); } else { S.bump(s, 'rel', 3); S.bump(s, 'happy', 3); log(s, '주말마다 교육봉사를 갔다. 아이들이 선생님이라 불렀다.'); } e.spec = (e.spec || 0) + 0.02; } },
        { label: y >= 2010 ? '공모전·창업동아리' : '공모전', hint: '입상 30%. 상금과 이력.', auto: () => 0.06, focus: 'work', apply: s => { e.spec = (e.spec || 0) + 0.04; S.bump(s, 'know', 2); if (y >= 2010 && U.chance(s, 0.4)) { s.flags.startupClub = true; log(s, '창업동아리에서 앱을 만들었다. 다운로드는 서른 번.'); S.bump(s, 'rel', 2); } else if (U.chance(s, 0.3)) { const prize = U.int(s, 100, 300) * idx(s); S.gain(s, prize); S.bump(s, 'happy', 5); log(s, `공모전에서 상을 받았다. 상금 ${money(prize)}.`); } else log(s, '공모전에 냈지만 상은 없었다. 팀원들과 치킨만 남았다.'); } },
        { label: '토익·자격증·고시반', hint: '지식 +3, 취업 확률 +. 행복 −2.', auto: () => lastYear ? 0.22 : 0.06, focus: 'study', apply: s => { S.cost(s, 150 * idx(s)); S.bump(s, 'know', 3); S.bump(s, 'happy', -2); e.spec = (e.spec || 0) + 0.05; log(s, lastYear ? '토익 점수와 자격증을 채우며 마지막 해를 보냈다.' : '고시반에 들어가 아침 7시에 도서관 문을 열었다.'); } },
        { label: '복수전공·부전공', hint: '다른 계열을 함께 배운다. 졸업이 늦어질 수 있다.', hide: n < 2 || n > 3 || e.major2 || e.univ.years < 4, auto: () => 0.05, focus: 'study', apply: s => { const others = Object.keys(D.majors).filter(k => k !== e.major && k !== '의약' && k !== '교육'); e.major2 = U.pick(s, others); S.bump(s, 'know', 2); if (U.chance(s, 0.5)) e.left += 1; log(s, `${e.major2} 계열을 복수전공하기 시작했다.`); } },
        { label: '교환학생', hint: s => `${money(800 * idx(s))}. 한 학기 외국에서.`, hide: y < 1990 || n < 2 || s.flags.exchange || (s.stats.know < 62) || (dec(s) < 5 && s.stats.know < 80), auto: () => 0.05, focus: 'rest', apply: s => { s.flags.exchange = true; s.flags.intl = true; S.cost(s, 800 * idx(s)); S.bump(s, 'know', 3); S.bump(s, 'happy', 5); S.bump(s, 'rel', 1); log(s, '교환학생으로 한 학기를 보냈다. 돌아오니 모든 게 작아 보였다.'); } },
        { label: '휴학하고 어학연수', hint: s => `1년 휴학, ${money(2000 * idx(s))}.`, hide: y < 1990 || dec(s) < 5 || s.flags.langStudy || n < 2 || lastYear, auto: () => dec(s) >= 7 ? 0.06 : 0.03, focus: 'study', apply: s => { s.flags.langStudy = true; s.flags.intl = true; S.cost(s, 2000 * idx(s)); e.left += 1; S.bump(s, 'know', 5); S.bump(s, 'happy', 4); log(s, '휴학하고 어학연수를 떠났다. 1년 뒤 영어로 꿈을 꿨다.'); } },
        { label: '여행', hint: y >= 1989 && (s.money.assets >= 400 * idx(s) || dec(s) >= 5) ? '방학에 해외로. 행복 +8.' : '방학에 국내 여행. 행복 +5.', auto: () => 0.06, focus: 'rest', apply: s => { const abroad = y >= 1989 && (s.money.assets >= 400 * idx(s) || dec(s) >= 5); S.cost(s, (abroad ? 400 : 150) * idx(s)); S.bump(s, 'happy', abroad ? 8 : 5); S.bump(s, 'rel', 2); S.bump(s, 'know', 1); log(s, abroad ? U.pick(s, ['방학 내내 유럽을 돌았다. 기차에서 잠들었다.', '동남아를 배낭 하나로 다녔다.', '일본 소도시를 걸었다.']) : U.pick(s, ['내일로 기차표로 전국을 돌았다.', '친구들과 제주 한 달 살기.', '동해안을 따라 자전거로 달렸다.'])); } },
        { label: '휴학', hint: '1년 쉰다. 알바·여행·워킹홀리데이·시험 준비·창업·입대 중 하나.', hide: (s.flags.leaves || 0) >= 2, auto: () => (s.sex === 'M' && s.mil.status === 'none' && n >= 1 ? 0.25 : n >= 2 ? 0.07 : 0.03), focus: 'rest', apply: s => { e.left += 1; s.flags.leaves = (s.flags.leaves || 0) + 1; log(s, '휴학계를 냈다.'); push(s, 'leave'); } },
        { label: (() => { const t = S.transferTarget(s); return t ? `편입 준비 (${t.name})` : '편입 준비'; })(), hint: s => { const t = S.transferTarget(s); const p = U.clamp(0.2 + (s.stats.know - 62) / 100 + (e.spec || 0), 0.08, 0.7); return t ? `합격 ${pct(p)}. 붙으면 3학년으로 옮긴다.` : ''; }, hide: !S.transferTarget(s) || !(n === 2 || (e.univ.years === 2 && lastYear)) || e.transferred, auto: () => e.univ.tier === 0 ? 0.25 : e.univ.tier === 1 ? 0.14 : 0.04, focus: 'study', apply: s => { const t = S.transferTarget(s); const p = U.clamp(0.2 + (s.stats.know - 62) / 100 + (e.spec || 0), 0.08, 0.7); S.bump(s, 'know', 2); S.cost(s, 200 * idx(s)); if (t && U.chance(s, p)) S.transferTo(s, t.id); else { log(s, '편입 시험에서 떨어졌다. 다니던 학교에 남았다.'); S.bump(s, 'happy', -3); } } },
        { label: '반수', hint: '다니면서 다시 수능. 떨어지면 돌아온다.', hide: n !== 1 || y < 1995 || e.univ.tier >= 3 || e.repeat >= 2 || e.fallback, auto: () => e.univ.tier <= 1 && s.stats.know >= 66 ? 0.1 : 0.02, focus: 'study', apply: s => { e.fallback = { univ: { ...e.univ }, left: e.left, major: e.major, sub: e.sub }; e.stage = 'repeat'; e.repeat += 1; e.plan = null; e.admits = null; S.cost(s, 800 * idx(s)); log(s, '반수를 시작했다. 학교와 학원을 오갔다.'); push(s, 'univ_apply'); } },
        { label: '연애에 집중', hint: s.love.partner ? '지금 사람과 더 깊이.' : '소개팅, 과 모임, 동아리 뒤풀이.', auto: () => s.love.partner ? 0.06 : 0.07, focus: 'rel', apply: s => { if (s.love.partner) { S.bump(s, 'happy', 5); S.bump(s, 'rel', 3); s.love.since += 0; log(s, '둘이서 한 해를 보냈다. 기념일마다 사진이 쌓였다.'); } else if (U.chance(s, 0.5)) { s.love.partner = { since: s.age }; s.love.since = 0; s.flags.partnerEver = true; S.bump(s, 'happy', 6); log(s, '소개팅 세 번 만에 사귀는 사람이 생겼다.'); } else { S.bump(s, 'happy', -1); S.bump(s, 'rel', 2); log(s, '소개팅은 많이 했지만 이어지지 않았다.'); } } },
        { label: '학점에 집중', hint: '지식 +4. 장학금 가능성이 오른다.', auto: () => 0.1, focus: 'study', apply: s => { S.bump(s, 'know', 4); S.bump(s, 'rel', -1); if (s.stats.know >= 72 && U.chance(s, 0.5)) { S.gain(s, 250 * idx(s)); log(s, '학점을 챙긴 해. 성적 장학금이 나왔다.'); } else log(s, '도서관과 강의실만 오갔다.'); } },
        { label: '그냥 논다', hint: '행복 +6. 나중에 조금 후회할지도.', auto: () => 0.07, focus: 'rest', apply: s => { S.bump(s, 'happy', 6); S.bump(s, 'know', -1); S.bump(s, 'rel', 2); log(s, U.pick(s, ['PC방과 술자리로 한 해가 갔다.', '친구들과 전국을 쏘다녔다.', '게임 랭킹을 올리느라 밤을 새웠다.'])); } },
      ];
    },
  });
  push_({
    id: 'leave', when: never, valid: s => s.edu.stage === 'univ',
    title: '휴학 1년, 무엇을 할까', text: s => `${s.age}세. 현금 ${money(s.money.assets)}.`,
    options: s => {
      const y = s.year, male = s.sex === 'M' && s.mil.status === 'none';
      return [
        { label: '입대한다', hint: '휴학과 함께 군대로. 복학은 전역 뒤.', hide: !male, auto: () => 3, apply: s => { s.edu.left -= 1; s.mil.enlistAt = s.age; log(s, '휴학하고 입대하기로 했다.'); } },
        { label: '알바로 돈을 모은다', hint: s => `${money(1300 * idx(s))}. 건강 −2.`, auto: () => 0.3, focus: 'money', apply: s => { S.gain(s, 1300 * idx(s)); S.bump(s, 'health', -2); S.bump(s, 'happy', -1); log(s, U.pick(s, ['1년 내내 공장과 카페를 오가며 등록금을 모았다.', '물류센터 야간 알바로 1년을 보냈다.', '학원 조교로 일하며 돈을 모았다.'])); } },
        { label: '워킹홀리데이', hint: s => `호주·캐나다·일본. 비용 ${money(300 * idx(s))}, 벌이 ${money(1000 * idx(s))}.`, hide: y < 1995, auto: () => 0.1, focus: 'rest', apply: s => { S.cost(s, 300 * idx(s)); S.gain(s, 1000 * idx(s)); S.bump(s, 'know', 3); S.bump(s, 'happy', 7); s.flags.intl = true; log(s, U.pick(s, ['호주 농장에서 1년을 일했다. 영어와 햇볕이 늘었다.', '캐나다 카페에서 워킹홀리데이를 보냈다.', '일본 편의점에서 일하며 1년을 살았다.'])); } },
        { label: '긴 여행', hint: s => (s.money.assets >= 500 * idx(s) || dec(s) >= 6 ? `해외 장기 여행 ${money(500 * idx(s))}.` : `국내 장기 여행 ${money(200 * idx(s))}.`), auto: () => 0.1, focus: 'rest', apply: s => { const abroad = s.money.assets >= 500 * idx(s) || dec(s) >= 6; S.cost(s, (abroad ? 500 : 200) * idx(s)); S.bump(s, 'happy', 9); S.bump(s, 'rel', 2); S.bump(s, 'know', 1); log(s, abroad ? '반년 동안 배낭 하나로 세계를 돌았다.' : '전국을 느리게 돌았다. 작은 도시에서 오래 머물렀다.'); } },
        { label: '시험·자격증 준비', hint: '지식 +4, 스펙 +. 행복 −2.', auto: () => 0.18, focus: 'study', apply: s => { S.bump(s, 'know', 4); S.bump(s, 'happy', -2); s.edu.spec = (s.edu.spec || 0) + 0.05; log(s, '휴학하고 시험 준비에 매달렸다. 독서실 불빛이 익숙해졌다.'); } },
        { label: '창업을 해 본다', hint: s => `${money(1000 * idx(s))}. 성공 25%.`, hide: y < 2010, auto: () => 0.05, focus: 'work', apply: s => { S.cost(s, 1000 * idx(s)); s.flags.startupClub = true; if (U.chance(s, 0.25)) { S.gain(s, 1500 * idx(s)); S.bump(s, 'happy', 8); log(s, '휴학하고 만든 서비스가 돈을 벌기 시작했다.'); } else { S.bump(s, 'happy', -4); S.bump(s, 'know', 3); log(s, '휴학하고 창업했지만 1년 만에 접었다. 배운 건 많았다.'); } } },
        { label: '그냥 쉰다', hint: '행복 +8, 건강 +3. 지식 −2.', auto: () => 0.25, focus: 'rest', apply: s => { S.bump(s, 'happy', 8); S.bump(s, 'health', 3); S.bump(s, 'know', -2); log(s, '아무것도 하지 않는 1년을 보냈다. 처음으로 늦잠이 죄책감 없이 왔다.'); } },
      ];
    },
  });
})();
