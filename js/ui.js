window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util;
  const UI = KR.UI = {};
  const $ = id => document.getElementById(id);
  UI.$ = $;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.esc = esc;

  const stageLabel = { infant: '어린 시절', school: '학생', univ: '대학', mil: '군 복무', work: '일', seek: '구직', home: '가사·육아', retire: '은퇴', care: '돌봄' };
  UI.stageLabel = stageLabel;
  UI.housingLabel = s => ({ parents: '부모 집', monthly: '월세', jeonse: '전세', own: '자가', care: '요양원' }[s.housing] || s.housing);
  UI.workLabel = s => {
    const w = s.work;
    if (s.mil.status === 'serving') return s.mil.kind === '현역' ? '군 복무 중' : '사회복무 중';
    if (s.edu.stage === 'univ') return `${s.edu.univ.kind} 재학`;
    if (s.edu.stage === 'grad') return '대학원 재학';
    if (s.edu.stage === 'repeat') return s.edu.repeat >= 2 ? '삼수 중' : '재수 중';
    if (s.edu.stage === 'admitted') return '대학 입학 준비';
    if (w.status === 'rest') return '쉬는 중';
    if (w.status === 'employed' || w.status === 'self') return w.title || (D.jobs[w.type] ? D.jobs[w.type].label : '일');
    if (w.status === 'seeking') return w.exam ? '공무원 시험 준비' : '구직 중';
    if (w.status === 'unemployed') return '실직';
    if (w.status === 'home') return '가사·육아';
    if (w.status === 'retired') return s.oldJob ? '노인 일자리' : '은퇴';
    if (w.status === 'student') return '학생';
    if (s.age < 6) return '어린 시절';
    if (s.edu.stage === 'elem') return '초등학생'; if (s.edu.stage === 'mid') return '중학생'; if (s.edu.stage === 'high') return '고등학생';
    return '—';
  };

  UI.renderTop = s => {
    const r = D.regions[s.region];
    $('t-name').textContent = s.name;
    $('t-meta').textContent = `${s.sex === 'M' ? '남' : '여'} · ${s.abroad ? '해외' : r.short} · ${UI.workLabel(s)}`;
    $('t-age').textContent = s.age;
    $('t-year').textContent = `${s.year}년`;
  };
  UI.renderStats = s => {
    for (const k of ['health', 'happy', 'know', 'rel']) { $('s-' + k).style.width = `${Math.round(s.stats[k])}%`; $('v-' + k).textContent = Math.round(s.stats[k]); }
    const m = s.money;
    const parts = [`순자산 <b>${U.fmtMan(S.netWorth(s))}</b>`];
    if (m.income) parts.push(`연소득 <b>${U.fmtMan(m.income)}</b>`);
    if (m.spend) parts.push(`연지출 <b>${U.fmtMan(m.spend)}</b>`);
    parts.push(`주거 <b>${UI.housingLabel(s)}</b>`);
    if (s.love.married) parts.push(`기혼`); else if (s.love.partner) parts.push(`연애 중`);
    const kids = s.kids.filter(k => k.alive).length; if (kids) parts.push(`자녀 ${kids}`);
    $('moneyline').innerHTML = parts.map(p => `<span>${p}</span>`).join('');
  };

  UI.logItem = (e, i) => {
    const li = document.createElement('li'); li.className = e.k || 'life'; li.dataset.i = i;
    li.innerHTML = `<span class="a">${e.a}세</span><span class="t">${esc(e.t)}</span><button class="star ${e.star ? 'on' : ''}" title="즐겨찾기">${e.star ? '★' : '☆'}</button>`;
    return li;
  };
  UI.renderLog = s => {
    const ul = $('log'); ul.innerHTML = '';
    for (let i = s.log.length - 1; i >= 0; i--) ul.appendChild(UI.logItem(s.log[i], i));
  };
  UI.prependLog = (s, e) => { const ul = $('log'); ul.insertBefore(UI.logItem(e, s.log.indexOf(e)), ul.firstChild); };

  UI.renderMap = s => {
    const el = $('lifemap'); const n = Math.max(100, s.map.length + 5);
    let html = '';
    for (let a = 0; a < n; a++) {
      const m = s.map[a];
      if (m) html += `<i class="live c-${m.st} ${a === s.age && s.alive ? 'now' : ''}" title="${m.y}년 ${a}세 · ${stageLabel[m.st]} · 행복 ${m.h}" style="opacity:${0.45 + m.h / 180}"></i>`;
      else html += `<i></i>`;
    }
    el.innerHTML = html;
  };

  UI.renderCurve = s => {
    const svg = $('curve'); const Sv = KR.life.cohort(s.sex, s.birthYear);
    const W = 320, H = 120, P = 6; const maxA = 100;
    const pts = []; for (let a = 0; a <= maxA; a++) pts.push(`${(P + a / maxA * (W - 2 * P)).toFixed(1)},${(H - P - Sv[a] * (H - 2 * P)).toFixed(1)}`);
    const x = P + Math.min(s.age, maxA) / maxA * (W - 2 * P), y = H - P - Sv[Math.min(s.age, maxA)] * (H - 2 * P);
    svg.innerHTML = `<path d="M${pts.join(' L')}" fill="none" stroke="var(--accent2)" stroke-width="2"/><path d="M${pts.join(' L')} L${W - P},${H - P} L${P},${H - P} Z" fill="var(--accent2)" opacity=".12"/><line x1="${x}" y1="${P}" x2="${x}" y2="${H - P}" stroke="var(--muted)" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y}" r="4" fill="${s.alive ? 'var(--accent)' : 'var(--danger)'}"/><text x="${P}" y="${H - 1}" font-size="9" fill="var(--muted)">0</text><text x="${W - P - 14}" y="${H - 1}" font-size="9" fill="var(--muted)">100세</text>`;
    const alive = Math.round(Sv[Math.min(s.age, maxA)] * 100);
    $('curve-help').textContent = s.alive ? `${s.birthYear}년에 태어난 ${s.sex === 'M' ? '남자' : '여자'} 100명 중 약 ${alive}명이 ${s.age}세까지 살아 있습니다.` : `${s.birthYear}년생 ${s.sex === 'M' ? '남자' : '여자'} 100명 중 약 ${alive}명이 ${s.age}세까지 살았습니다.`;
  };

  UI.renderCohort = s => {
    const ul = $('cohort'); if (!s.cohort) return;
    ul.innerHTML = s.cohort.map(c => {
      const r = D.regions[c.region];
      const st = c.alive ? UI.workLabel(c) + (c.love.married ? ' · 기혼' : '') + (c.kids.length ? ` · 자녀 ${c.kids.filter(k => k.alive).length}` : '') : `${c.death.age}세에 세상을 떠남 (${c.death.cause})`;
      return `<li class="${c.alive ? '' : 'dead'}"><b>${esc(c.name)} <small>${c.sex === 'M' ? '남' : '여'} · ${r.short}</small></b><span class="st">${esc(st)}</span></li>`;
    }).join('');
  };

  const itemIcon = { home: '🏠', jeonse: '🔑', car: '🚗', pet: '🐾', bike: '🚲', pager: '📟', phone: '📱', smartphone: '📱', pc: '🖥️', laptop: '💻', license: '🪪' };
  UI.itemsHTML = (list, showYear) => list.length ? list.map(i => `<span>${itemIcon[i.k] || '•'} ${esc(i.n)}${i.v > 0 ? `<small>${U.fmtMan(i.v)}</small>` : ''}${showYear && i.y ? `<small>${i.y}년</small>` : ''}</span>`).join('') : '<span class="none">아직 가진 것이 없다.</span>';
  UI.renderAssets = s => {
    const m = s.money, a = m.alloc;
    const cash = m.assets * Math.max(0, 1 - a.deposit - a.stock - a.coin);
    const rows = [
      ['cash', '현금', cash, ''], ['deposit', '예금', m.assets * a.deposit, ''], ['stock', '주식·펀드', m.assets * a.stock, ''], ['coin', '코인', m.assets * a.coin, ''],
      ['jeonse', '전세 보증금', s.housing === 'jeonse' ? m.deposit : 0, (m.jeonseLoan || 0) > 50 ? `대출 ${U.fmtMan(m.jeonseLoan)} 포함` : ''],
      ['home', '집 (시세)', s.housing === 'own' ? m.homeValue : 0, m.loan > 50 ? `주택담보대출 ${U.fmtMan(m.loan)}` : ''],
      ['car', '자동차', s.car ? s.car.v : 0, s.car ? `${s.car.n} · 해마다 값이 떨어짐` : ''],
    ].filter(r => r[2] > 0 || r[0] === 'cash');
    const gross = rows.reduce((x, r) => x + r[2], 0);
    const debts = [['빚 (신용·학자금·할부)', m.debt], ['주택담보대출', m.loan], ['전세 대출', m.jeonseLoan || 0]].filter(d => d[1] > 50);
    const bar = gross > 0 ? `<div class="compbar">${rows.map(r => `<i class="k-${r[0]}" style="width:${(r[2] / gross * 100).toFixed(1)}%" title="${r[1]}"></i>`).join('')}</div>` : '';
    const table = `<table class="assets-table">${rows.map(r => `<tr><td><i class="sw k-${r[0]}"></i>${r[1]}${r[3] ? `<br><small>${r[3]}</small>` : ''}</td><td class="v">${U.fmtMan(Math.round(r[2]))}</td></tr>`).join('')}${debts.map(d => `<tr><td>${d[0]}</td><td class="v neg">−${U.fmtMan(Math.round(d[1]))}</td></tr>`).join('')}<tr class="total"><td>순자산</td><td class="v">${U.fmtMan(S.netWorth(s))}</td></tr></table>`;
    const inc = m.income ? `<p class="help">연소득 ${U.fmtMan(m.income)} · 연지출 ${U.fmtMan(m.spend)}${m.pension ? ` · 연금 월 ${U.fmtMan(m.pension)}` : ''}${s.love.married && s.love.spouse && s.love.spouse.alive && s.love.spouse.works ? ' · 맞벌이' : ''}</p>` : '';
    $('assets').innerHTML = bar + table + inc;
    $('items').innerHTML = UI.itemsHTML(S.itemList(s));
  };
  UI.renderAll = s => { UI.renderTop(s); UI.renderStats(s); UI.renderLog(s); UI.renderMap(s); UI.renderCurve(s); UI.renderCohort(s); UI.renderAssets(s); };
  UI.livesHTML = lives => `<h2>전생 기록</h2><p class="text">이 브라우저에 남은 최근 30개의 삶.</p><ul class="lives">${lives.map(l => { const sm = l.summary; return `<li><div><b>${esc(sm.name)}</b> <span class="meta">${sm.birthYear}–${l.death ? l.death.year : ''} · ${sm.region} · ${sm.sex === 'M' ? '남' : '여'} · ${l.death ? `${l.death.age}세, ${esc(l.death.cause)}` : ''}</span></div><div class="actions" style="margin:0"><button class="small" data-view="${l.id}">다시 보기</button>${l.memorial ? '' : `<button class="small ghost" data-mem="${l.id}">추모관</button>`}</div></li>`; }).join('') || '<li class="meta">아직 없습니다.</li>'}</ul><div class="actions"><button class="ghost small" id="btn-clear-lives">모두 지우기</button></div>`;
  UI.memorialHTML = lives => { const mem = lives.filter(l => l.memorial); return `<h2>추모관</h2><p class="text">끝까지 살아 낸 삶을 모셔 둡니다. 촛불을 켜고 한마디를 남길 수 있습니다.</p><div class="memorial">${mem.length ? mem.map(l => `<div class="grave"><b><i class="candle"></i>${esc(l.summary.name)}</b><small class="meta">${l.summary.birthYear}–${l.death.year} · ${l.summary.region} · ${l.death.age}세</small>${l.message ? `<div class="msg">${esc(l.message)}</div>` : ''}<div class="actions" style="margin-top:8px"><button class="small ghost" data-candle="${l.id}">촛불 ${l.candles || 0}</button><button class="small ghost" data-msg="${l.id}">한마디</button></div></div>`).join('') : '<p class="help">아직 모셔 둔 삶이 없습니다. 사망 기록 화면이나 전생 기록에서 모실 수 있습니다.</p>'}</div>`; };

  UI.modal = (html, opts = {}) => {
    const m = $('modal'); $('modal-body').innerHTML = html; m.hidden = false;
    $('modal-close').hidden = !!opts.noClose;
    return $('modal-body');
  };
  UI.closeModal = () => { $('modal').hidden = true; $('modal-body').innerHTML = ''; };
  let toastT = null;
  UI.toast = msg => { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); };

  UI.familyHTML = s => {
    const p = s.parents, pl = (who, label) => { const x = p[who]; return `${label} ${x.alive ? `${x.age}세 · ${x.edu}` : '세상을 떠남'}`; };
    const grp = (b, t) => `<div class="grp"><b>${b}</b>${t}</div>`;
    let h = `<h2>가족과 삶</h2><div class="family">`;
    h += grp('부모', `${pl('mother', '어머니')} / ${pl('father', '아버지')}${p.together ? '' : ' · 따로 산다'} · 소득 ${p.decile}분위`);
    if (s.siblings.length) h += grp('형제', s.siblings.filter(x => x.born).map(x => `${x.sex === 'M' ? '남' : '여'}(${x.by}년생)`).join(', ') || '아직 없음');
    if (s.love.married && s.love.spouse) h += grp('배우자', `${esc(s.love.spouse.name)} · ${s.love.spouse.age}세${s.love.spouse.works ? ' · 일함' : ''} · 결혼 ${s.love.yearsMarried || 0}년`);
    else if (s.love.partner) h += grp('연인', `${s.love.since}년째`);
    else if (s.love.widowed) h += grp('배우자', '세상을 떠남');
    else if (s.love.divorced) h += grp('결혼', `이혼 ${s.love.divorced}회`);
    if (s.kids.length) h += grp('자녀', s.kids.map(k => `${esc(k.n)}(${k.alive ? `${s.year - k.by}세${k.married ? ' · 결혼' : ''}${k.custody === 'ex' ? ' · 따로 산다' : ''}` : '세상을 떠남'})`).join(', '));
    h += grp('학력', `${s.edu.degree}${s.edu.univ ? ` · ${s.edu.univ.kind}${s.edu.univ.public ? '(국립)' : ''}` : ''}${s.edu.major ? ` · ${s.edu.major} 계열` : ''}${s.edu.sub ? ` · ${s.edu.sub}` : ''}${s.edu.hs ? ` · ${s.edu.hs}` : ''}${s.edu.track ? ` · ${s.edu.track}` : ''}${s.edu.gifted ? ' · 영재원' : ''}${s.edu.pct ? ` · 수능 백분위 ${s.edu.pct}` : ''}`);
    if (s.mil.status !== 'na') h += grp('병역', s.mil.kind ? `${s.mil.kind}${s.mil.status === 'done' ? ' 복무 마침' : ' 복무 중'}` : s.mil.status === 'exempt' ? '면제' : '아직');
    h += grp('일', `${UI.workLabel(s)}${s.work.pay && (s.work.status === 'employed' || s.work.status === 'self') ? ` · 연봉 ${U.fmtMan(s.work.pay)}` : ''}${s.work.mainType && s.work.status !== 'employed' ? ` · 주된 일자리 ${D.jobs[s.work.mainType].label}` : ''}`);
    const m = s.money;
    h += grp('주거', `${UI.housingLabel(s)}${s.housing === 'own' ? ` · 집값 ${U.fmtMan(m.homeValue)}${m.loan > 50 ? `, 대출 ${U.fmtMan(m.loan)}` : ''}` : ''}${s.housing === 'jeonse' ? ` · 보증금 ${U.fmtMan(m.deposit)}${(m.jeonseLoan || 0) > 50 ? `, 그중 대출 ${U.fmtMan(m.jeonseLoan)}` : ''}` : ''}`);
    h += grp('돈', `현금 ${U.fmtMan(m.assets)} · 빚 ${U.fmtMan(m.debt)} · 연소득 ${U.fmtMan(m.income)} · 연지출 ${U.fmtMan(m.spend)}${m.pension ? ` · 연금 월 ${U.fmtMan(m.pension)}` : ''}`);
    const hs = s.hs; const hl = [];
    if (hs.smoker) hl.push('흡연'); if (hs.drinker) hl.push('잦은 음주'); if (hs.cond.length) hl.push(...hs.cond); if (hs.cancer) hl.push(`${hs.cancer.type} 치료 중`); if (hs.dementia) hl.push('치매');
    h += grp('건강', hl.length ? hl.join(', ') : '특별한 문제 없음');
    h += `</div><p class="help" style="margin-top:12px">금액은 2024년 원화 가치 기준 근사치입니다.</p>`;
    return h;
  };

  UI.spendHTML = s => {
    const idx = S.incomeIndex(s.year), m = s.money;
    const acts = [['travel', '여행', 350 * idx, '행복 +7'], ['hobby', '취미', 120 * idx, '행복 +4, 관계 +3'], ['parents', '부모님 용돈', 150 * idx, '관계 +5'], ['donate', '기부', Math.max(10 * idx, m.assets * 0.01), '행복 +3'], ['health', '건강에 투자', 200 * idx, '건강 +4']];
    const a = m.alloc;
    return `<h2>돈 쓰기 · 투자</h2><p class="text">현금 ${U.fmtMan(m.assets)}. 올해 한 번씩.</p>
      <div class="spend-grid">${acts.map(x => `<button data-spend="${x[0]}" ${m.assets < x[2] || s.age < 15 ? 'disabled' : ''}><b>${x[1]}</b><br><small>${U.fmtMan(Math.round(x[2]))} · ${x[3]}</small></button>`).join('')}</div>
      <h3 style="margin-top:16px">자산 배분</h3>
      <div class="alloc">
        <label>예금 <input type="range" id="al-deposit" min="0" max="100" value="${Math.round(a.deposit * 100)}"><span>${Math.round(a.deposit * 100)}%</span></label>
        <label>주식·펀드 <input type="range" id="al-stock" min="0" max="100" value="${Math.round(a.stock * 100)}"><span>${Math.round(a.stock * 100)}%</span></label>
        <label>코인 <input type="range" id="al-coin" min="0" max="100" value="${Math.round(a.coin * 100)}" ${s.year < 2017 ? 'disabled' : ''}><span>${Math.round(a.coin * 100)}%</span></label>
      </div>
      <p class="help">나머지는 현금으로 둡니다. 예금 연 2.5%, 주식 평균 7%(큰 변동), 코인은 두 배 또는 반토막.</p>`;
  };

  UI.stageStatsHTML = () => (D.stageStats || []).map(sec => `<details><summary>${esc(sec[0])}<small>${sec[1].length}개 항목</small></summary><table class="stats-table">${sec[1].map(it => `<tr><th>${esc(it[0])}</th><td>${esc(it[1])}${it[2] ? `<br><small class="meta">${esc(it[2])}</small>` : ''}</td></tr>`).join('')}</table></details>`).join('');
  UI.statsHTML = (year) => {
    const y = year || 2024, b = D.byYear, f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
    const rows = [
      ['태어나는 해', `${y}년`],
      ['연간 출생아 수', `${Math.round(U.interp(b.births, y)).toLocaleString('ko-KR')}명 (하루 약 ${Math.round(U.interp(b.births, y) / 365)}명)`],
      ['총인구', `${Math.round(U.interp(b.population, y) / 10000).toLocaleString('ko-KR')}만 명`],
      ['합계출산율', f2(U.interp(b.tfr, y))],
      ['기대수명', `남 ${f1(U.interp(b.e0M, y))}세 · 여 ${f1(U.interp(b.e0F, y))}세`],
      ['영아사망률', `출생아 천 명당 ${f1(U.interp(b.imr, y))}명`],
      ['고교 졸업자 대학 진학률', `${Math.round(U.interp(b.univRate, y + 18) * 100)}% (이 아이가 고교를 마칠 즈음)`],
      ['평균 초혼 연령', `남 ${f1(U.interp(b.marryAgeM, y))}세 · 여 ${f1(U.interp(b.marryAgeF, y))}세`],
      ['생애 결혼 확률 (가정)', `남 ${Math.round(U.interp(b.everMarryM, y) * 100)}% · 여 ${Math.round(U.interp(b.everMarryF, y) * 100)}%`],
      ['병 복무 기간', `${Math.round(U.interp(b.serviceMonths, y + 20))}개월 (입대 시점 기준)`],
      ['성인 남성 흡연율', `${Math.round(U.interp(b.smokeM, Math.max(y + 20, 1980)) * 100)}%`],
      ['1인당 실질소득 (2024=1)', f2(U.interp(b.income, y))],
      ['국민연금 수급 개시 연령', `${Math.round(U.interp(b.pensionAge, Math.max(y + 60, 2024)))}세`],
    ];
    const fixed = [
      ['사교육 참여율 / 월평균', `${Math.round(D.edu.tutoring[1] * 100)}% / 참여 학생 ${D.edu.tutoringCost[1]}만 원 (2024)`],
      ['학교폭력 피해 응답률', `${(D.edu.bullying * 100).toFixed(1)}%`],
      ['병역 판정', `현역 ${Math.round(D.military.active * 100)}% · 보충역 ${Math.round(D.military.supplementary * 100)}% · 면제 ${Math.round(D.military.exempt * 100)}%`],
      ['첫 취업까지', `평균 ${D.work.firstJobMonths}개월 · 비정규직 ${Math.round(D.work.nonRegular * 100)}%`],
      ['자영업 5년 생존율', `${Math.round(D.work.selfEmp5yr * 100)}%`],
      ['주된 일자리 퇴직 / 실질 은퇴', `${D.work.mainJobExit}세 / ${D.work.effectiveRetire}세`],
      ['성별 임금 격차', `약 ${Math.round((1 - D.work.genderGap) * 100 + 19)}% (OECD 31%)`],
      ['자가 점유율', `${Math.round(D.housing.own * 100)}% · 전세 ${Math.round(D.housing.jeonse * 100)}% · 월세 ${Math.round(D.housing.monthly * 100)}%`],
      ['서울 아파트 평균 매매가', `${D.regions[0].apt}억 원 (2025) · 전세 ${D.regions[0].jeonse}억 원`],
      ['가구 평균 자산 / 부채', `${U.fmtMan(D.wealth.avgAssets)} / ${U.fmtMan(D.wealth.avgDebt)}`],
      ['암 발병 확률 (기대수명까지)', `남 ${Math.round(D.health.lifetimeCancerM * 100)}% · 여 ${Math.round(D.health.lifetimeCancerF * 100)}% · 5년 생존율 ${Math.round(D.health.cancer5yr * 100)}%`],
      ['65세 이상 치매 유병률', `${(D.health.dementia65 * 100).toFixed(1)}%`],
      ['노인 상대빈곤율', `${(D.old.poverty * 100).toFixed(1)}%`],
      ['국민연금 평균 수령액', `월 ${D.old.pension}만 원 · 기초연금 ${D.old.basicPension}만 원`],
      ['삶의 만족도', `${D.happiness.score}/10 (세계 ${D.happiness.rank}위)`],
    ];
    const regionRows = D.regions.map(r => `<tr><th>${r.short}</th><td>출생 ${(r.share2024 * 100).toFixed(1)}% · 아파트 ${r.apt}억 · 전세 ${r.jeonse}억 · 월세 ${r.rent}만</td></tr>`).join('');
    return `<h2>한국 통계</h2><p class="text">${D.version}. 값은 통계청 공표치와 근사 추정을 섞어 쓴 모형 입력값입니다. 생애 단계별로 실제 계산에 쓰는 수치를 모두 적었습니다.</p>
      <details open><summary>태어나는 해 기준 지표<small>${y}년</small></summary><table class="stats-table">${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table></details>
      ${UI.stageStatsHTML()}
      <details><summary>공통 지표<small>2023~2025</small></summary><table class="stats-table">${fixed.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table></details>
      <details><summary>지역<small>2024년 출생 비율 · 2025년 가격</small></summary><table class="stats-table">${regionRows}</table></details>
      <details><summary>출처</summary><ul style="padding-left:18px;font-size:.85rem;color:var(--muted)">${D.sources.map(x => `<li><b>${esc(x[0])}</b> — ${esc(x[1])}</li>`).join('')}</ul></details>`;
  };

  UI.aboutHTML = () => `<h2>이용 안내</h2>
    <p class="text">5천만 분의 1은 한국의 공표 통계로 만든 인생 시뮬레이션입니다. 나라도, 지역도, 부모도 고를 수 없습니다. 태어나는 해와 세상(지난·지금·다가올)만 고른 뒤, 한 생애를 끝까지 지켜봅니다.</p>
    <ul style="padding-left:18px">
      <li><b>시간</b> 한 해가 수십 초 안에 흐릅니다. 일시정지와 1×~16× 배속, "다음 결정"으로 건너뛸 수 있습니다.</li>
      <li><b>결정</b> 진학, 병역, 일, 사랑, 아이, 집, 치료 같은 갈림길에서 시간이 멈추고 묻습니다. 선택은 삶을 바꾸지만, 태어난 집과 해의 통계를 완전히 벗어나기는 어렵습니다.</li>
      <li><b>자동 결정</b> 켜 두면 시뮬레이션이 통계적으로 흔한 쪽을 고릅니다. 이번 해의 초점은 자동 선택과 스탯 변화에 영향을 줍니다.</li>
      <li><b>생각 멈춤</b> 5, 15, 30, 50, 70세에 시간이 멈추고 한 줄을 남길 수 있습니다. 메뉴에서 끌 수 있습니다.</li>
      <li><b>스탯</b> 건강·행복·지식·관계(0~100)는 가능성을 높이거나 낮출 뿐, 결과를 정하지 않습니다.</li>
      <li><b>돈</b> 모든 금액은 2024년 원화 가치 기준 근사치입니다. 지난 세상의 소득과 집값은 당시 실질 수준으로 환산했습니다.</li>
      <li><b>오늘의 순위</b> 서버가 연결돼 있으면 삶이 끝날 때 기록이 익명으로 올라가고, 그날 플레이한 모든 사람 가운데 몇 위인지 보여 줍니다. 닉네임은 선택이며 홈에서 입력합니다. 서버 설정은 저장소의 server 폴더를 보세요.</li>
      <li><b>순위</b> 삶이 끝나면 같은 해에 태어난 500명을 자동으로 살게 한 뒤, 수명·행복·관계·재산·생애 소득에서 몇 번째인지 보여 줍니다. 인생 점수는 수명·행복·관계·재산 네 항목의 백분위 평균(0~100)입니다. 홈의 순위표에서는 이 기기에 남은 삶들끼리 겨룹니다.</li>
      <li><b>재산·보유</b> 순자산은 현금·예금·주식·코인·전세 보증금·집 시세·자동차에서 빚과 대출을 뺀 값입니다. 보유한 것 탭에서 집, 차, 반려동물, 스마트폰 같은 물건을 봅니다.</li>
      <li><b>다루지 않는 것</b> 자살은 한국의 주요 사망 원인이지만 이 시뮬레이션에서는 다루지 않습니다. 15세 이상에게 권합니다.</li>
    </ul>
    <h3 style="margin-top:14px">원작 1 in 8 Billion과 다른 점</h3>
    <ul style="padding-left:18px">
      <li>141개국 대신 한국 17개 시도에서 태어납니다. 출생 확률은 시도별 출생 비율(1970년과 2024년 사이 보간)을 따릅니다.</li>
      <li>소득 분위, 출생 순위, 부모 학력, 사교육, 수능과 재수, 특성화고, 병역, 공무원 시험, 전세·월세·자가와 영끌, 국민연금·기초연금, 주된 일자리 퇴직(49세)과 노인 일자리, 경력단절 같은 한국 고유의 갈림길을 넣었습니다.</li>
      <li>지난 세상에는 4·19부터 IMF, 코로나19까지 한국의 실제 사건이 연도에 맞춰 나오고, 다가올 세상은 통계청 장래인구추계를 가정으로 씁니다.</li>
      <li>같은 1초에 태어난 사람들 대신 같은 날 한국에서 태어난 네 아이의 삶을 함께 봅니다.</li>
      <li>추모관과 전생 기록은 서버 없이 이 기기에만 저장됩니다. 공유 카드는 PNG로 저장합니다.</li>
      <li>한 화면 안에서 진행되도록 기록·재산·지도·생존·같은 날 탭으로 나눴고, 재산 구성과 보유한 물건을 따로 보여 줍니다.</li>
      <li>한국어만 지원합니다.</li>
    </ul>
    <p class="help">의견은 <a href="mailto:jieunyi1995@gmail.com">jieunyi1995@gmail.com</a>으로 보내 주세요.</p>`;
  UI.privacyHTML = () => `<h2>개인정보 처리방침</h2>
    <p class="text">이 사이트는 서버를 운영하지 않고 계정도 없습니다. 진행 중인 삶, 전생 기록, 추모관, 실제 출생 비교 입력값은 모두 이 브라우저의 저장 공간(localStorage)에만 남으며 외부로 전송되지 않습니다. 브라우저 데이터를 지우면 함께 사라집니다. 쿠키와 분석 도구를 쓰지 않습니다.</p>
    <p class="help">문의: <a href="mailto:jieunyi1995@gmail.com">jieunyi1995@gmail.com</a></p>`;
  UI.notesHTML = () => `<h2>업데이트 노트</h2>
    <p class="text"><b>v0.6</b> — 대입 개편: 수능 백분위·내신 등급 모형, 수시 6장+정시 3장(상향·적정·안정 프리셋과 직접 고르기), 묶음 이름 대학 13분류(국립·사립·소재지·등록금), 7대 계열 선택과 2학년 중계열 결정, 전과. 쉬었음·흡연·음주·학원·아르바이트를 무작위가 아니라 내가 고르는 결정으로 변경.</p><p class="text"><b>v0.5</b> — 30세 이전 이벤트 대폭 확장: 돌잡이, 영어유치원, 태권도·피아노, 학습지, 반장 선거, 영재원, 경시대회, 조기유학, 영재고·과학고·외고·자사고·예고·마이스터고, 문·이과, 모의고사, 수시, 의·치·한·약대, 최상위권 대학, 전공, 학점, 동아리·학생회·CC, 어학연수, 인턴·토익, 배낭여행, 청약통장, 로스쿨·변호사 시험, 교사 임용, 신입사원·적금·헬스 등 60여 개 사건과 10개 결정 추가.</p><p class="text"><b>v0.4</b> — 오늘의 순위(서버 연동, 당일 플레이한 모든 사람 중 순위, 닉네임), 생애 단계별 사용 통계 전체 공개.</p><p class="text"><b>v0.3</b> — 순위. 같은 해 태어난 500명과 비교한 코호트 순위(인생 점수·재산·수명·행복·생애 소득·관계), 기기 안 전생 기록 순위표, 공유 카드에 순위 표시. 전생 기록 30개까지 보관. 사망 화면의 한마디 입력 제거.</p><p class="text"><b>v0.2</b> — 한 화면 레이아웃(탭), 재산 구성과 보유한 것 패널, 자동차·반려동물·스마트폰·운전면허 등 소유물, 전생 기록과 추모관을 홈 화면 모달로 이동.</p><p class="text"><b>v0.1 (베타)</b> — 첫 공개. 1960~2060년 출생, 17개 시도, 4개 스탯, 25가지 결정, 역사 사건, 생존 곡선, 같은 날 태어난 아이들, 전생 기록, 추모관(이 기기), 공유 카드.</p>
    <p class="help">알려진 한계: 지역 간 이동이 서울 진학 외에는 없음. 자녀의 삶은 요약으로만 흐름. 다가올 세상의 사건은 통계청 전망에 기댄 가정.</p>`;

  UI.fmtMetric = (k, v) => k === 'wealth' || k === 'income' ? U.fmtMan(v) : k === 'age' ? `${v}세` : k === 'score' ? `${v}점` : `${Math.round(v)}`;
  UI.metricOf = (rec, k) => {
    if (rec.rank && rec.rank[k]) return rec.rank[k].value;
    if (rec.metrics && rec.metrics[k] != null) return rec.metrics[k];
    const sm = rec.summary || {};
    if (k === 'age') return rec.death ? rec.death.age : null;
    if (k === 'wealth') return sm.assets != null ? sm.assets : null;
    if (k === 'income') return sm.lifetimeIncome != null ? sm.lifetimeIncome : null;
    if (k === 'happy' && sm.map && sm.map.length) return Math.round(sm.map.reduce((a, m) => a + m[1], 0) / sm.map.length * 10) / 10;
    return null;
  };
  UI.rankHTML = rec => {
    const r = rec.rank; if (!r) return '';
    return `<h3>같은 해에 태어난 ${r.n}명 중</h3><div class="rankgrid">${S.RANK_KEYS.map(k => { const x = r[k]; return `<div><span>${S.RANK_LABEL[k]}</span><b>${x.rank}위</b> <small>상위 ${x.top}%</small><em>${UI.fmtMetric(k, x.value)}</em></div>`; }).join('')}</div>`;
  };
  UI.localRankLine = (lives, rec) => {
    if (lives.length < 2) return '';
    const pos = k => { const v = UI.metricOf(rec, k); const all = lives.map(l => UI.metricOf(l, k)).filter(x => x != null); if (v == null || all.length < 2) return null; return { r: all.filter(x => x > v).length + 1, n: all.length }; };
    const parts = ['score', 'wealth', 'age'].map(k => { const p = pos(k); return p ? `${S.RANK_LABEL[k]} ${p.r}위/${p.n}` : null; }).filter(Boolean);
    return parts.length ? `<p class="local">내 전생 기록 중 · ${parts.join(' · ')}</p>` : '';
  };
  UI.rankingHTML = (lives, key) => {
    const rows = lives.map(l => ({ l, v: UI.metricOf(l, key) })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
    const sel = `<select id="rank-key" style="width:auto;padding:4px 8px">${S.RANK_KEYS.map(k => `<option value="${k}" ${k === key ? 'selected' : ''}>${S.RANK_LABEL[k]}</option>`).join('')}</select>`;
    const table = rows.length ? `<table class="ranking-table"><tr><th>#</th><th>삶</th><th style="text-align:right">${S.RANK_LABEL[key]}</th><th style="text-align:right">코호트</th></tr>${rows.map((x, i) => { const sm = x.l.summary; const rk = x.l.rank && x.l.rank[key]; return `<tr><td>${i + 1}</td><td>${esc(sm.name)} <span class="meta">${sm.birthYear}–${x.l.death ? x.l.death.year : ''} · ${sm.region} · ${sm.sex === 'M' ? '남' : '여'}</span></td><td class="v">${UI.fmtMetric(key, x.v)}</td><td class="v meta">${rk ? `상위 ${rk.top}%` : '—'}</td></tr>`; }).join('')}</table>` : '<p class="help">아직 끝까지 살아 낸 삶이 없습니다.</p>';
    return `<h2>순위표</h2><p class="text">이 기기에 남은 삶들의 순위. 코호트 열은 같은 해에 태어난 ${lives[0] && lives[0].rank ? lives[0].rank.n : 500}명(자동 진행) 중 상위 몇 %인지입니다.</p><div class="actions" style="margin:0 0 10px">${sel}</div>${table}`;
  };
  UI.globalRankLine = (rec, err) => {
    const el = $('d-global'); if (!el) return;
    if (err) { el.innerHTML = `<span class="err">오늘의 순위 서버에 연결하지 못했습니다.</span>`; return; }
    const g = rec.global; if (!g) { el.innerHTML = ''; return; }
    el.innerHTML = `<span>오늘 플레이한 <b>${g.n}명</b> 중 인생 점수 <b>${g.score.rank}위</b> · 재산 ${g.wealth.rank}위 · 수명 ${g.age.rank}위 · 행복 ${g.happy.rank}위</span><button class="small" id="btn-today-from-death">오늘의 순위 보기</button>`;
  };
  UI.todayHTML = (data, key, days, myIds, err) => {
    const sel = `<select id="today-key" style="width:auto;padding:4px 8px">${S.RANK_KEYS.map(k => `<option value="${k}" ${k === key ? 'selected' : ''}>${S.RANK_LABEL[k]}</option>`).join('')}</select>`;
    const daySel = days && days.length ? `<select id="today-day" style="width:auto;padding:4px 8px">${days.map(d => `<option value="${d.day}" ${data && d.day === data.day ? 'selected' : ''}>${d.day}${d.day === (data && data.today) ? ' (오늘)' : ''} · ${d.n}명</option>`).join('')}</select>` : '';
    let body;
    if (err) body = `<p class="help">${esc(err)}</p>`;
    else if (!data.rows.length) body = `<p class="help">${data.day}에는 아직 기록이 없습니다. 첫 번째가 되어 보세요.</p>`;
    else body = `<table class="ranking-table"><tr><th>#</th><th>삶</th><th style="text-align:right">${S.RANK_LABEL[key]}</th><th style="text-align:right">점수</th></tr>${data.rows.map(r => `<tr class="${myIds.includes(r.id) ? 'me' : ''}"><td>${r.rank}</td><td>${r.nick ? `<b>${esc(r.nick)}</b> ` : ''}${esc(r.name)} <span class="meta">${r.birthYear}년생 · ${esc(r.region)} · ${r.sex === 'M' ? '남' : '여'} · ${r.deathAge}세</span></td><td class="v">${UI.fmtMetric(key, r.value)}</td><td class="v meta">${r.score}점</td></tr>`).join('')}</table>`;
    return `<h2>오늘의 순위</h2><p class="text">${data ? `${data.day} 플레이한 ${data.n}명.` : ''} 서버에 올라간 모든 사람의 기록으로, 내 기록은 색으로 표시됩니다.</p><div class="actions" style="margin:0 0 10px;flex-wrap:wrap">${daySel}${sel}</div>${body}`;
  };
  UI.applyHTML = (s, plan) => {
    const E = S.scorePct(s, false), SP = S.susiPct(s), g = S.naesinGrade(s), odds = S.planOdds(s, plan), susi = s.year >= 1997;
    const tiers = S.tiersFor(s, plan.major);
    const cnt = o => Object.values(o || {}).reduce((a, x) => a + x, 0);
    const majorSel = `<select id="ap-major" style="width:auto;padding:4px 8px">${Object.keys(D.majors).map(m => `<option value="${m}" ${m === plan.major ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
    const rows = tiers.map(t => { const ps = S.appProb(s, t, 'su', SP), pj = S.appProb(s, t, 'jung', E); const ns = plan.su[t.id] || 0, nj = plan.jung[t.id] || 0; const ctr = (k, n) => `<span class="ctr"><button data-inc="${k}|${t.id}|-1" ${n ? '' : 'disabled'}>−</button><b>${n}</b><button data-inc="${k}|${t.id}|1">+</button></span>`; return `<div class="apply-row ${ns || nj ? 'on' : ''}"><div class="nm"><b>${esc(t.name)}</b><small class="meta">컷 ${t.cut} · ${t.years}년 · 등록금 ${U.fmtMan(Math.round(t.tuition * S.incomeIndex(s.year)))}${t.id === 'national' ? ' · 지방' : t.capital >= 0.8 ? ' · 서울' : ''}</small></div><div class="ap">${susi ? `<span class="apgrp"><span class="lab">수시 <b>${Math.round(ps * 100)}%</b></span>${ctr('su', ns)}</span>` : ''}<span class="apgrp"><span class="lab">정시 <b>${Math.round(pj * 100)}%</b></span>${ctr('jung', nj)}</span></div></div>`; }).join('');
    return `<h2>원서 쓰기</h2><p class="text">예상 수능 백분위 <b>${E}</b> (상위 ${Math.max(0.1, 100 - E).toFixed(1)}%)${susi ? `, 내신 <b>${g}등급</b>. 수시 6장 + 정시 3장. 수시에 붙으면 정시는 갈 수 없습니다.` : '. 세 곳에 지원할 수 있습니다.'}</p>
      <div class="actions" style="margin:0 0 8px;flex-wrap:wrap">계열 ${majorSel}<span style="flex:1"></span><button class="small" data-preset="0">상향</button><button class="small" data-preset="1">적정</button><button class="small" data-preset="2">안정</button></div>
      <div class="apply-list">${rows}</div>
      <p class="help" style="margin-top:8px">${susi ? `수시 ${cnt(plan.su)}/6 · ` : ''}정시 ${cnt(plan.jung)}/3 · 한 곳 이상 합격 확률 ${susi ? `수시 ${Math.round(odds.su * 100)}% · ` : ''}정시 ${Math.round(odds.jung * 100)}% · 전체 <b>${Math.round(odds.any * 100)}%</b></p>
      <div class="actions"><button class="primary" id="ap-submit">원서 접수</button><button class="ghost" id="ap-back">돌아가기</button></div>`;
  };
  UI.deathSummary = (s, rec) => {
    const sm = S.summary(s), r = D.regions[s.region];
    const years = s.death ? s.death.age : s.age;
    $('d-title').textContent = `${s.name}, ${s.birthYear}–${s.death.year}`;
    $('d-sub').textContent = `${s.birthYear}년 ${r.name}에서 태어나 ${s.death.year}년 ${s.death.age}세에 ${s.death.cause}으로 세상을 떠났다.`;
    const cell = (k, v) => `<div><span>${k}</span>${esc(v)}</div>`;
    const kidsAlive = s.kids.filter(k => k.alive);
    $('d-summary').innerHTML = [
      cell('학력', sm.degree + (sm.univ ? ` (${sm.univ})` : '')),
      cell('주된 일', sm.job + (sm.abroad ? ' · 해외' : '')),
      cell('결혼', sm.married ? `${sm.marriedAt}세에 결혼${sm.divorced ? ` · 이혼 ${sm.divorced}회` : ''}${s.love.widowed ? ' · 배우자 먼저 떠남' : ''}` : '하지 않음'),
      cell('자녀', kidsAlive.length ? kidsAlive.map(k => k.n).join(', ') : '없음'),
      cell('마지막 주거', sm.home),
      cell('남긴 재산', U.fmtMan(sm.assets)),
      cell('생애 소득', U.fmtMan(sm.lifetimeIncome)),
      cell('마지막 스탯', `건강 ${Math.round(s.stats.health)} · 행복 ${Math.round(s.stats.happy)} · 지식 ${Math.round(s.stats.know)} · 관계 ${Math.round(s.stats.rel)}`),
    ].join('');
    $('d-rank').innerHTML = rec ? UI.rankHTML(rec) + UI.localRankLine(rec.lives || [], rec) : '';
    const notes = Object.entries(s.notes || {}).filter(x => x[1]);
    $('d-items').innerHTML = `<h3 style="margin:8px 0 4px">남긴 것</h3>` + UI.itemsHTML(sm.items, true);
    $('d-notes').innerHTML = notes.length ? `<h3>남긴 생각</h3>` + notes.map(x => `<p>${x[0]}세 — ${esc(x[1])}</p>`).join('') : '';
  };

  UI.drawShareCard = (canvas, s, rec) => {
    const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    const r = D.regions[s.region], sm = S.summary(s);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#15161c'); g.addColorStop(1, '#262833');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#9a9ca8'; ctx.font = '500 34px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; ctx.fillText('5천만 분의 1', 80, 120);
    ctx.fillStyle = '#ecebe6'; ctx.font = '800 96px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; ctx.fillText(s.name, 80, 240);
    ctx.font = '500 40px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; ctx.fillStyle = '#c9cad2';
    const wrap = (text, x, y, maxW, lh) => { const words = text.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) ctx.fillText(line, x, yy); return yy + lh; };
    let y = wrap(`${s.birthYear}년 ${r.name}에서 ${s.sex === 'M' ? '남자아이' : '여자아이'}로 태어나, ${s.death ? `${s.death.year}년 ${s.death.age}세에 ${s.death.cause}으로 세상을 떠났다.` : `${s.age}세를 살고 있다.`}`, 80, 330, W - 160, 56);
    y += 20; ctx.fillStyle = '#9a9ca8'; ctx.font = '400 34px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    const lines = [`${sm.degree}${sm.univ ? ` · ${sm.univ}` : ''}`, `${sm.job}${sm.abroad ? ' · 해외' : ''}`, sm.married ? `${sm.marriedAt}세 결혼 · 자녀 ${sm.kids}명` : '결혼하지 않음', `${sm.home} · 재산 ${U.fmtMan(sm.assets)}`];
    for (const l of lines) { ctx.fillText(l, 80, y); y += 50; }
    const cols = 25, size = Math.floor((W - 160) / cols) - 4, startY = y + 30;
    const colors = { infant: '#c9b6e4', school: '#8ec5ff', univ: '#5f9df7', mil: '#6b7a4a', work: '#f2b84b', seek: '#c87f4f', home: '#e59bb8', retire: '#9bb59c', care: '#8e8e9a' };
    for (let a = 0; a < 100; a++) { const m = s.map[a]; ctx.fillStyle = m ? colors[m.st] || '#888' : '#33353f'; ctx.globalAlpha = m ? 0.5 + m.h / 200 : 0.5; ctx.fillRect(80 + (a % cols) * (size + 4), startY + Math.floor(a / cols) * (size + 4), size, size); }
    ctx.globalAlpha = 1; y = startY + 4 * (size + 4) + 70;
    ctx.fillStyle = '#ecebe6'; ctx.font = '400 36px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    ctx.fillText(`건강 ${Math.round(s.stats.health)}   행복 ${Math.round(s.stats.happy)}   지식 ${Math.round(s.stats.know)}   관계 ${Math.round(s.stats.rel)}`, 80, y); y += 60;
    if (rec && rec.rank) { ctx.fillStyle = '#f2b84b'; ctx.font = '600 38px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; ctx.fillText(`인생 점수 ${rec.rank.score.value}점 · 같은 해에 태어난 ${rec.rank.n}명 중 ${rec.rank.score.rank}위`, 80, y); y += 54; ctx.fillStyle = '#9a9ca8'; ctx.font = '400 32px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; ctx.fillText(`재산 ${rec.rank.wealth.rank}위 · 수명 ${rec.rank.age.rank}위 · 행복 ${rec.rank.happy.rank}위 · 관계 ${rec.rank.rel.rank}위`, 80, y); y += 60; }
    ctx.fillStyle = '#6f717c'; ctx.font = '400 28px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    ctx.fillText(`한국 통계로 만든 인생 시뮬레이션 · ${location.host}${location.pathname.replace(/index\.html$/, '')}`, 80, H - 70);
  };
})();
