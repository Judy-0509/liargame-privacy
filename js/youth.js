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
      const it = U.pick(s, items); log(s, `돌잔치. 돌잡이에서 ${it[0]}을(를) 집었다. ${it[1]}.`); S.bump(s, it[2], it[3]);
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
    if (e.stage === 'univ' && s.mil.status !== 'serving') {
      const yr1 = e.univ && e.left === e.univ.years - 1;
      if (yr1 && once(s, 'club')) { if (U.chance(s, 0.12)) { log(s, '학생회에 들어갔다. 밤새 현수막을 만들었다.'); S.bump(s, 'rel', 6); S.bump(s, 'know', -1); } else if (U.chance(s, 0.5)) { log(s, '동아리 방에서 살다시피 했다.'); S.bump(s, 'rel', 4); } }
      if (a >= 19 && a <= 22 && !s.love.partner && !s.love.married && once(s, 'cc') && U.chance(s, 0.18)) { s.love.partner = { since: a }; s.love.since = 0; s.flags.partnerEver = true; log(s, '같은 과 동기와 사귀기 시작했다. 캠퍼스 커플.'); S.bump(s, 'happy', 6); }
      if (a >= 19 && a <= 22 && U.chance(s, 0.3)) { if (st.know >= 76) { log(s, '성적 장학금을 받았다.'); S.gain(s, 250 * idx(s)); S.bump(s, 'happy', 3); } else if (st.know < 42 && U.chance(s, 0.5)) { log(s, '학사경고를 받았다.'); S.bump(s, 'happy', -4); } }
      if (a >= 19 && a <= 22 && y >= 1990 && dec(s) >= 5 && e.left >= 1 && e.left <= 3) push(s, 'lang_study');
      if (a >= 19 && a <= 23 && e.left >= 1 && e.left <= 2 && (s.taken.lang_study || a >= 20)) push(s, 'spec');
      if (e.univ && e.univ.med && e.left === 3 && U.chance(s, 0.8)) log(s, '본과에 올라갔다. 해부학 실습이 시작됐다.');
      if (a >= 19 && a <= 21 && U.chance(s, 0.3)) log(s, U.pick(s, ['수강신청에 실패해 아침 수업만 남았다.', '팀플에서 혼자 발표를 떠맡았다.', '교수님 연구실에서 커피를 탔다.', '종강 후 친구들과 밤바다를 보러 갔다.']));
    }
    if (a >= 20 && a <= 26 && y >= 1989 && !s.flags.backpack && (s.money.assets >= 400 * idx(s) || dec(s) >= 5) && s.mil.status !== 'serving') push(s, 'backpack');
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
    id: 'lang_study', when: never, max: 1, valid: s => s.edu.stage === 'univ',
    title: '어학연수를 갈까', text: s => `1년 휴학. 비용 ${money(2000 * idx(s))}. 자산 ${money(s.money.assets)}, 집은 ${dec(s)}분위.`,
    options: s => [
      { label: '1년 어학연수', hint: '영어와 자신감이 는다. 졸업이 늦어진다.', auto: () => dec(s) >= 7 ? 0.4 : 0.2, focus: 'study', apply: s => { S.cost(s, 2000 * idx(s)); s.edu.left += 1; S.bump(s, 'know', 5); S.bump(s, 'happy', 4); s.flags.intl = true; log(s, '어학연수를 떠났다. 1년 뒤 영어로 꿈을 꿨다.'); } },
      { label: '가지 않는다', hint: '', auto: () => 0.65, apply: () => { } },
    ],
  });
  push_({
    id: 'spec', when: never, max: 1, valid: s => s.edu.stage === 'univ',
    title: '졸업 전에 무엇을 쌓을까', text: s => `지식 ${Math.round(s.stats.know)}. 취업 시장은 스펙을 묻는다.`,
    options: s => [
      { label: '인턴', hint: '월급을 받고 대기업 문이 넓어진다.', auto: () => 0.35, focus: 'work', apply: s => { S.gain(s, 300 * idx(s)); s.edu.spec = (s.edu.spec || 0) + 0.08; S.bump(s, 'know', 2); log(s, '방학 내내 인턴을 했다. 이름표가 달린 사원증이 좋았다.'); } },
      { label: '토익·자격증', hint: s => `${money(150 * idx(s))}. 점수가 오른다.`, auto: () => 0.35, focus: 'study', apply: s => { S.cost(s, 150 * idx(s)); s.edu.spec = (s.edu.spec || 0) + 0.05; S.bump(s, 'know', 3); log(s, '토익 학원과 자격증 시험으로 방학을 보냈다.'); } },
      { label: '공모전·대외활동', hint: '사람을 얻는다.', auto: () => 0.15, focus: 'rel', apply: s => { s.edu.spec = (s.edu.spec || 0) + 0.03; S.bump(s, 'rel', 4); log(s, '공모전 팀을 꾸렸다. 밤샘 끝에 장려상.'); } },
      { label: '그냥 즐긴다', hint: '마지막 방학.', auto: () => 0.15, focus: 'rest', apply: s => { S.bump(s, 'happy', 6); log(s, '마지막 방학을 마음껏 놀았다.'); } },
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
})();
