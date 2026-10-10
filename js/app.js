(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util, UI = KR.UI, $ = UI.$;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const A = { s: null, era: 'now', birthYear: 2026, auto: false, music: null, busy: false, anim: null, fast: false, play: null, reveals: [], phase: 'idle', todayDaily: false };

  const CFG = window.KR_CONFIG || {};
  function apiBase() {
    const q = new URLSearchParams(location.search);
    if (q.has('api')) { const v = q.get('api').trim(); if (v) LS.set('krlife.apiBase', v); else LS.del('krlife.apiBase'); }
    return (LS.get('krlife.apiBase', '') || CFG.apiBase || '').replace(/\/$/, '');
  }
  async function api(path, opts) {
    const base = apiBase(); if (!base) throw new Error('서버 주소가 설정되지 않았습니다. js/config.js의 apiBase를 채우세요.');
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    try { const r = await fetch(base + path, { ...(opts || {}), signal: ctl.signal, headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  async function submitLife(rec) {
    if (!apiBase()) return;
    const sm = rec.summary;
    const body = { nick: LS.get('krlife.nick', ''), name: sm.name, sex: sm.sex, region: sm.region, birthYear: sm.birthYear, deathAge: rec.death.age, deathYear: rec.death.year, cause: rec.death.cause, degree: sm.degree, job: sm.job, married: sm.married, kids: sm.kids, score: rec.rank.score.value, metrics: rec.metrics, cohortN: rec.rank.n, cohortTop: rec.rank.score.top, daily: sm.daily || '', startTop: rec.start ? rec.start.top : 0, lineage: sm.lineage ? sm.lineage.gen : 1, version: CFG.version || '1.0' };
    try {
      const r = await api('/api/lives', { method: 'POST', body: JSON.stringify(body) });
      rec.global = { id: r.id, day: r.day, ...r.rank };
      const ids = LS.get('krlife.myIds', []); ids.unshift(r.id); LS.set('krlife.myIds', ids.slice(0, 200));
      updateLife(rec); if (A.rec === rec) { UI.globalRankLine(rec); const b = $('btn-today-from-death'); if (b) b.onclick = () => openToday('score', r.day); }
    } catch (e) { if (A.rec === rec) UI.globalRankLine(rec, e); }
  }
  async function openToday(key, day) {
    key = key || LS.get('krlife.todayKey', 'score');
    const myIds = LS.get('krlife.myIds', []);
    if (!apiBase()) { UI.modal(UI.todayHTML(null, key, [], myIds, '오늘의 순위 서버가 설정되지 않았습니다. 저장소의 server/README.md를 따라 맥미니에서 서버를 띄우고 js/config.js의 apiBase에 주소를 넣으세요.')); return; }
    const body = UI.modal(`<h2>오늘의 순위</h2><p class="text">불러오는 중…</p>`);
    try {
      const [days, data] = await Promise.all([api('/api/days'), api(`/api/leaderboard?key=${key}&limit=100${day ? '&day=' + day : ''}`)]);
      const list = days.days.slice(); if (!list.some(d => d.day === days.today)) list.unshift({ day: days.today, n: data.day === days.today ? data.n : 0 });
      const draw = () => {
        body.innerHTML = UI.todayHTML({ ...data, today: days.today }, key, list, myIds, null, A.todayDaily);
        const ks = body.querySelector('#today-key'); if (ks) ks.onchange = () => { LS.set('krlife.todayKey', ks.value); openToday(ks.value, data.day); };
        const ds = body.querySelector('#today-day'); if (ds) ds.onchange = () => openToday(key, ds.value);
        const df = body.querySelector('#today-daily'); if (df) df.onchange = () => { A.todayDaily = df.checked; draw(); };
      };
      draw();
    } catch (e) { body.innerHTML = UI.todayHTML(null, key, [], myIds, '서버에 연결하지 못했습니다. ' + e.message); }
  }

  const BENCH_N = 500;
  const benchKey = y => 'krlife.bench.' + y;
  function loadBench(y) { const b = LS.get(benchKey(y), null); return b && b.v === S.BENCH_VERSION && b.n >= BENCH_N ? b : null; }
  function saveBench(y, b) { const ys = LS.get('krlife.benchYears', []).filter(x => x !== y); ys.push(y); while (ys.length > 6) LS.del(benchKey(ys.shift())); LS.set('krlife.benchYears', ys); LS.set(benchKey(y), b); }
  function startBench(y) {
    if (A.benchYear === y && (A.bench || A.benchRaw)) return;
    clearTimeout(A.benchTimer); A.benchYear = y; A.benchRaw = null;
    const cached = loadBench(y); if (cached) { A.bench = cached; return; }
    A.bench = null; A.benchRaw = [];
    const step = () => {
      if (A.benchYear !== y || A.bench) return;
      const raw = A.benchRaw, t0 = performance.now();
      while (raw.length < BENCH_N && performance.now() - t0 < 25) raw.push(S.autoLife(y, y * 1000 + raw.length));
      if (raw.length >= BENCH_N) { A.bench = S.finishBench(raw); A.benchRaw = null; saveBench(y, A.bench); }
      else A.benchTimer = setTimeout(step, 60);
    };
    A.benchTimer = setTimeout(step, 400);
  }
  function ensureBench(y) {
    if (A.bench && A.benchYear === y) return A.bench;
    const cached = loadBench(y); if (cached) { A.bench = cached; A.benchYear = y; return cached; }
    const raw = A.benchYear === y && A.benchRaw ? A.benchRaw : [];
    while (raw.length < BENCH_N) raw.push(S.autoLife(y, y * 1000 + raw.length));
    clearTimeout(A.benchTimer); A.bench = S.finishBench(raw); A.benchYear = y; A.benchRaw = null; saveBench(y, A.bench); return A.bench;
  }
  const benchNow = y => (A.bench && A.benchYear === y) ? A.bench : loadBench(y);
  function benchForChapter(y) { const b = benchNow(y); if (b) return b; if (A.benchYear === y && A.benchRaw && A.benchRaw.length >= BENCH_N * 0.6) return ensureBench(y); return null; }

  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const hash = str => { let h = 2166136261 >>> 0; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h || 1; };
  const dailySeed = day => hash('krlife-daily-' + day);
  const parseSeed = v => { v = String(v || '').trim(); if (!v) return 0; return /^\d+$/.test(v) ? (Number(v) >>> 0) || 1 : hash(v); };
  const seedLink = s => `${location.origin}${location.pathname}?seed=${s.seed0}&y=${s.birthYear}`;

  function show(id) { for (const sc of document.querySelectorAll('.screen')) sc.hidden = sc.id !== id; window.scrollTo(0, 0); }
  function save() { if (A.s) LS.set('krlife.current', { s: A.s, auto: A.auto }); }
  function clearReveals() { for (const t of A.reveals) clearTimeout(t); A.reveals = []; }
  const nowMs = () => performance.now();
  const modalOpen = () => !$('modal').hidden;
  function migrate(s) { s.items = s.items || []; s.people = s.people || {}; s.snap = s.snap || {}; s.odds = s.odds || []; s.hHist = s.hHist || []; if (s.hIdx == null) s.hIdx = 1; s.notes = s.notes || {}; return s; }

  function tickBar() {
    if (A.s && !$('screen-life').hidden) {
      const s = A.s, bar = $('yearbar'), fill = $('yearfill'), label = $('yearlabel'), hint = $('yearhint');
      let frac, state = '', h = '';
      if (!s.alive) { frac = 1; state = '끝'; }
      else if (A.fast) { frac = 1; state = '빠르게 넘기는 중'; }
      else if (A.anim) { frac = U.clamp((nowMs() - A.anim.t0) / A.anim.dur, 0, 1); if (frac >= 1) A.anim = null; }
      else if (A.phase === 'deciding') { frac = 0; state = '결정을 기다리는 중'; }
      else { frac = 1; h = A.play ? '자동 재생 중' : s.age < 3 ? '▶ 또는 Space로 한 해씩' : ''; }
      const month = Math.min(12, Math.floor(frac * 12) + 1);
      fill.style.width = `${(frac * 100).toFixed(1)}%`;
      bar.classList.toggle('stopped', !!state && !A.fast); bar.classList.toggle('fast', !!A.fast);
      const txt = `${s.year}년 <b>${month}월</b>${state ? ' · ' + state : ''}`;
      if (label.innerHTML !== txt) label.innerHTML = txt;
      if (hint.textContent !== h) hint.textContent = h;
      if (KR.PIXEL) KR.PIXEL.render($('pixel'), s, frac, nowMs());
    }
    requestAnimationFrame(tickBar);
  }

  function nextYear() {
    const s = A.s; if (!s || !s.alive || A.busy || modalOpen()) return;
    clearReveals(); A.anim = null;
    S.beginYear(s); A.phase = 'deciding';
    UI.renderTop(s); UI.renderChapter(s);
    processDecisions();
  }
  function processDecisions() {
    const s = A.s;
    while (s.queue.length) {
      const id = s.queue[0]; const d = S.decision(s, id); if (!d) continue;
      if (A.auto) { S.autoChoose(s, id); continue; }
      $('decision-wait').hidden = false; return showDecision(d);
    }
    $('decision-wait').hidden = true;
    finishYear();
  }
  function afterYear(instant) {
    const s = A.s;
    if (!s.alive) { A.busy = true; stopPlay(); setTimeout(onDeath, instant ? 300 : 1900); return; }
    if (S.SNAP_AGES.includes(s.age)) { A.busy = true; setTimeout(() => { A.busy = false; showChapter(s.age); }, instant ? 250 : 1700); }
  }
  function finishYear(instant) {
    const s = A.s;
    const entries = S.completeYear(s);
    A.phase = 'idle';
    UI.renderTop(s); UI.renderStats(s); UI.renderMap(s); UI.renderCurve(s); UI.renderCohort(s); UI.renderAssets(s); UI.renderChapter(s);
    clearReveals();
    if (instant) { for (const e of entries) UI.prependLog(s, e); }
    else {
      A.anim = { t0: nowMs(), dur: 1600 };
      const gap = Math.min(380, 1300 / Math.max(1, entries.length));
      entries.forEach((e, i) => A.reveals.push(setTimeout(() => UI.prependLog(s, e), 200 + i * gap)));
    }
    save(); afterYear(instant);
  }
  function nextCrossroad() {
    const s = A.s; if (!s || !s.alive || A.busy || modalOpen()) return;
    clearReveals(); A.anim = null; A.fast = true;
    let guard = 0, stop = false;
    while (s.alive && guard++ < 130) {
      S.beginYear(s); A.phase = 'deciding';
      let shown = false;
      while (s.queue.length) {
        const id = s.queue[0]; const d = S.decision(s, id); if (!d) continue;
        if (A.auto) { S.autoChoose(s, id); continue; }
        UI.renderAll(s); UI.renderChapter(s); $('decision-wait').hidden = false; A.fast = false; save(); showDecision(d); shown = true; break;
      }
      if (shown) return;
      S.completeYear(s); A.phase = 'idle';
      if (S.SNAP_AGES.includes(s.age)) { stop = true; break; }
    }
    A.fast = false; UI.renderAll(s); UI.renderChapter(s); save();
    afterYear(true);
  }

  function voiceFor(s) {
    const order = s.age < 20 ? ['parent', 'friend'] : s.love.married ? ['spouse', 'kid', 'friend', 'parent'] : ['friend', 'parent', 'first'];
    const i = s.age % order.length;
    for (let k = 0; k < order.length; k++) { const v = S.voice(s, order[(i + k) % order.length]); if (v) return v; }
    return null;
  }
  function showDecision(d) {
    const s = A.s, v = voiceFor(s);
    const body = UI.modal(`<p class="kicker">갈림길 · ${s.age}세 · ${s.year}년</p><h2>${UI.esc(d.title)}</h2><p class="text">${UI.esc(d.text || '')}</p>${v ? `<p class="voice">${UI.esc(v)}</p>` : ''}<div class="options">${d.options.map((o, i) => `<button data-i="${i}"><b>${UI.esc(o.label)}</b>${o.hint ? `<small>${UI.esc(o.hint)}</small>` : ''}</button>`).join('')}</div><p class="help" style="margin-top:12px"><button class="small ghost" id="dec-auto">이번엔 자동으로</button></p>`, { noClose: true });
    const choose = i => { if (d.options[i] && d.options[i].custom === 'apply') { UI.closeModal(); return openApply(d); } S.resolve(s, d.id, i); UI.closeModal(); UI.renderStats(s); UI.renderAssets(s); processDecisions(); };
    body.querySelectorAll('.options button').forEach(b => b.onclick = () => choose(+b.dataset.i));
    body.querySelector('#dec-auto').onclick = () => { S.autoChoose(s, d.id); UI.closeModal(); processDecisions(); };
  }
  function openApply(d) {
    const s = A.s;
    let plan = A.applyDraft && A.applyDraft.year === s.year ? A.applyDraft.plan : null;
    if (!plan) { const major = s.edu.applyMajor || S.autoMajor(s); const p = S.presets(s, major)[1]; plan = { major, su: { ...p.su }, jung: { ...p.jung } }; }
    const render = () => {
      const body = UI.modal(UI.applyHTML(s, plan), { noClose: true });
      body.querySelector('#ap-major').onchange = e => { plan.major = e.target.value; const ids = new Set(S.tiersFor(s, plan.major).map(t => t.id)); for (const k of ['su', 'jung']) for (const id of Object.keys(plan[k])) if (!ids.has(id)) delete plan[k][id]; render(); };
      body.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { const p = S.presets(s, plan.major)[+b.dataset.preset]; plan.su = { ...p.su }; plan.jung = { ...p.jung }; render(); });
      body.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { const [k, id, dd] = b.dataset.inc.split('|'); const max = k === 'su' ? 6 : 3; const tot = Object.values(plan[k]).reduce((a, x) => a + x, 0); const nv = (plan[k][id] || 0) + (+dd); if (nv < 0) return; if (+dd > 0 && tot >= max) { UI.toast(`${k === 'su' ? '수시는 6장' : '정시는 3장'}까지입니다.`); return; } if (nv) plan[k][id] = nv; else delete plan[k][id]; render(); });
      body.querySelector('#ap-submit').onclick = () => { if (!Object.keys(plan.su).length && !Object.keys(plan.jung).length) { UI.toast('원서를 한 장 이상 넣어 주세요.'); return; } S.resolveCustom(s, d.id, plan); A.applyDraft = null; UI.closeModal(); save(); processDecisions(); };
      body.querySelector('#ap-back').onclick = () => { A.applyDraft = { year: s.year, plan }; UI.closeModal(); const dd = S.decision(s, d.id); if (dd) showDecision(dd); else processDecisions(); };
    };
    render();
  }

  function showChapter(age) {
    const s = A.s; if (!s || !s.alive) return;
    stopPlay();
    const body = UI.modal(UI.chapterHTML(s, benchForChapter(s.birthYear), age), { noClose: true });
    body.querySelector('#ch-go').onclick = () => {
      const ta = body.querySelector('#ch-note'); const t = ta ? ta.value.trim() : '';
      if (t) { s.notes[age] = t; S.log(s, `(생각) ${t}`, 'note'); UI.prependLog(s, s.log[s.log.length - 1]); }
      UI.closeModal(); save();
    };
  }

  function onDeath() {
    const s = A.s; clearReveals(); stopPlay();
    if (!benchNow(s.birthYear)) { UI.toast('같은 해에 태어난 500명의 삶을 계산하는 중…'); setTimeout(finishDeath, 80); } else finishDeath();
  }
  function finishDeath() {
    const s = A.s; A.busy = false;
    const lives = LS.get('krlife.lives', []);
    const bench = ensureBench(s.birthYear);
    const metrics = S.metrics(s);
    const badges = S.badges(s), had = LS.get('krlife.badges', []), fresh = badges.filter(b => !had.includes(b));
    LS.set('krlife.badges', [...new Set([...had, ...badges])]);
    const rec = { id: s.birthYear + '-' + s.rng, summary: S.summary(s), log: s.log, death: s.death, when: Date.now(), memorial: false, candles: 0, metrics, rank: S.rankAll(metrics, bench), start: S.startLine(s, bench), badges, fresh, seed: s.seed0 };
    lives.unshift(rec); LS.set('krlife.lives', lives.slice(0, 30));
    LS.del('krlife.current');
    A.rec = rec; rec.lives = lives.slice(0, 30);
    UI.deathSummary(s, rec);
    delete rec.lives;
    $('btn-child').hidden = !s.kids.some(k => k.alive);
    $('d-global').innerHTML = apiBase() ? '<span class="err">오늘의 순위에 올리는 중…</span>' : '';
    submitLife(rec);
    show('screen-death');
  }
  function updateLife(rec) { const lives = LS.get('krlife.lives', []); const i = lives.findIndex(x => x.id === rec.id); if (i >= 0) { lives[i] = rec; LS.set('krlife.lives', lives); } }

  function shareCard() {
    const c = $('share-canvas'); UI.drawShareCard(c, A.s, A.rec);
    c.toBlob(async blob => {
      const file = new File([blob], `5천만분의1-${A.s.name}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '5천만 분의 1', text: `${A.s.name}, ${A.s.birthYear}–${A.s.death.year} · ${seedLink(A.s)}` }); return; } catch (e) { } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      UI.toast('공유 카드를 저장했습니다.');
    }, 'image/png');
  }
  async function copySeed() {
    const s = A.s; if (!s) return; const url = seedLink(s);
    try { await navigator.clipboard.writeText(url); UI.toast('같은 아이로 태어나는 링크를 복사했습니다. 친구에게 보내 보세요.'); }
    catch (e) { prompt('이 링크를 복사하세요', url); }
  }
  function openChild() {
    const s = A.s; if (!s) return; const kids = s.kids.filter(k => k.alive);
    const body = UI.modal(`<h2>자녀로 이어하기</h2><p class="text">${UI.esc(s.name)}의 재산 가운데 70%가 자녀들에게 나뉘어 물려집니다. 다음 세대로 살 아이를 고르세요.</p><div class="options">${kids.map((k, i) => `<button data-k="${i}"><b>${UI.esc(k.n)}</b><small>${k.sex === 'M' ? '아들' : '딸'} · ${k.by}년생 · ${k.married ? '결혼함' : '미혼'}${k.univ ? ' · 대학 졸업' : ''}</small></button>`).join('')}</div>`);
    body.querySelectorAll('button[data-k]').forEach(b => b.onclick = () => {
      const k = kids[+b.dataset.k];
      const child = S.newLifeFrom(s, k, hash(`${s.seed0}:${k.by}:${k.n}`));
      UI.closeModal(); A.rec = null; startLife(child);
      UI.toast(`${child.lineage.gen}대째 삶이 시작됩니다.`);
    });
  }

  function renderHome() {
    const cur = LS.get('krlife.current', null);
    $('btn-continue').hidden = !(cur && cur.s && cur.s.alive);
    const lives = LS.get('krlife.lives', []);
    $('lives-count').textContent = lives.length ? `(${lives.length})` : '';
    const memN = lives.filter(l => l.memorial).length; $('memorial-count').textContent = memN ? `(${memN})` : '';
    const got = LS.get('krlife.badges', []); $('badge-count').textContent = `(${got.length}/${S.BADGES.length})`;
    $('home-births').textContent = Math.round(U.interp(D.byYear.births, 2026) / 365).toLocaleString('ko-KR');
    const day = kstDay(), p = S.newLife({ birthYear: 2026, seed: dailySeed(day) });
    $('daily-help').textContent = `오늘(${day})의 아기: ${p.name} · ${D.regions[p.region].short} ${p.sex === 'M' ? '남자아이' : '여자아이'} · 2026년생. 오늘 플레이하는 모두가 이 아이로 시작하고, 당일 순위는 이 아이로 겨룹니다.`;
    updateYearHelp();
  }
  function updateYearHelp() {
    const y = A.birthYear, b = D.byYear;
    $('year-label').textContent = y;
    $('year-help').textContent = `${y}년 출생아 약 ${Math.round(U.interp(b.births, y) / 10000)}만 명 · 합계출산율 ${U.interp(b.tfr, y).toFixed(2)} · 기대수명 남 ${U.interp(b.e0M, y).toFixed(1)}세 여 ${U.interp(b.e0F, y).toFixed(1)}세 · 영아사망률 천 명당 ${U.interp(b.imr, y).toFixed(1)}명${y > 2026 ? ' (통계청 전망)' : ''}`;
    const eh = { past: '1960년부터 2025년까지. 전쟁 이후의 가난, 고도성장, IMF와 그 뒤의 한국을 실제 사건과 함께 삽니다.', now: '2026년의 한국. 합계출산율 0.75, 기대수명 남 80.6세·여 86.4세.', future: '2027년 이후. 통계청 장래인구추계(중위)에 기댄 가정의 세상입니다.' };
    $('era-help').textContent = eh[A.era];
  }
  function setEra(era) {
    A.era = era; const rg = $('year-range');
    if (era === 'past') { rg.min = 1960; rg.max = 2025; A.birthYear = U.clamp(A.birthYear, 1960, 2025); if (A.birthYear === 2026) A.birthYear = 1990; }
    else if (era === 'now') { rg.min = 2026; rg.max = 2026; A.birthYear = 2026; }
    else { rg.min = 2027; rg.max = 2060; A.birthYear = A.birthYear < 2027 ? 2040 : A.birthYear; }
    rg.value = A.birthYear; $('year-field').style.opacity = era === 'now' ? .6 : 1;
    for (const b of $('era-seg').querySelectorAll('button')) b.classList.toggle('on', b.dataset.era === era);
    updateYearHelp();
  }

  function realCompare(s) {
    const real = { year: +$('real-year').value || null, sex: $('real-sex').value || null, region: $('real-region').value || null };
    LS.set('krlife.real', real);
    if (!(real.year || real.sex || real.region)) return;
    const parts = [];
    if (real.year) parts.push(`${real.year}년`); if (real.region) parts.push(D.regions[+real.region].short); if (real.sex) parts.push(real.sex === 'M' ? '남자' : '여자');
    const r = D.regions[s.region]; const w = U.clamp((s.birthYear - 1970) / 54, 0, 1); const share = (r.share1970 + (r.share2024 - r.share1970) * w) * (s.sex === 'M' ? D.maleShare : 1 - D.maleShare);
    S.log(s, `당신은 ${parts.join(' ')}로 태어났습니다. 이 아이처럼 ${s.birthYear}년 ${r.short}에서 ${s.sex === 'M' ? '남자' : '여자'}로 태어날 확률은 ${(share * 100).toFixed(1)}%였습니다.`, 'birth');
  }
  function startLife(s) {
    A.s = migrate(s); A.busy = false; A.phase = 'idle'; A.anim = null; A.fast = false; A.rec = null; stopPlay(); clearReveals();
    startBench(s.birthYear);
    if (!s.map.length) S.completeYear(s);
    show('screen-life'); UI.renderAll(s); UI.renderChapter(s);
    $('focus').value = s.focus; $('auto').checked = A.auto; $('decision-wait').hidden = true;
    save();
    if (!s.alive) { A.busy = true; setTimeout(onDeath, 1500); }
  }
  function born(kind) {
    let s;
    if (kind === 'daily') { const day = kstDay(); s = S.newLife({ birthYear: 2026, seed: dailySeed(day) }); s.daily = day; S.log(s, `오늘(${day})의 아기. 오늘 플레이하는 모두가 이 아이로 태어난다. 다른 삶을 사는 것은 당신의 선택이다.`, 'birth'); }
    else if (kind === 'seed') { const seed = parseSeed($('seed').value); if (!seed) { UI.toast('시드를 입력해 주세요.'); return; } const y = U.clamp(+$('seed-year').value || 2026, 1960, 2060); s = S.newLife({ birthYear: y, seed }); S.log(s, `시드 ${s.seed0}의 아이. 같은 시드로 태어난 아이는 모두 같은 출발선에 선다.`, 'birth'); }
    else { const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; s = S.newLife({ birthYear: A.birthYear, seed }); }
    realCompare(s); startLife(s);
  }
  function resume() {
    const cur = LS.get('krlife.current', null); if (!cur || !cur.s) return;
    A.auto = !!cur.auto;
    const s = migrate(cur.s);
    A.s = s; A.busy = false; A.rec = null; A.anim = null; A.fast = false; stopPlay();
    startBench(s.birthYear);
    show('screen-life'); UI.renderAll(s); UI.renderChapter(s); $('focus').value = s.focus; $('auto').checked = A.auto;
    if (s.map.length < s.age + 1) { A.phase = 'deciding'; processDecisions(); } else A.phase = 'idle';
  }
  function stopPlay() { if (A.play) { clearInterval(A.play); A.play = null; } }
  function togglePlay() { if (A.play) stopPlay(); else { A.play = setInterval(() => { if (A.s && A.s.alive) nextYear(); else stopPlay(); }, 3000); nextYear(); } }

  function openMenu() {
    const s = A.s;
    const body = UI.modal(`<h2>메뉴</h2><div class="menu">
      <button data-m="play">자동 재생(3초에 한 해): ${A.play ? '켜짐' : '꺼짐'}</button>
      <button data-m="pixel">상단 그림: ${KR.PIXEL.STYLES[KR.PIXEL.style] || ''} (바꾸기)</button>
      <button data-m="auto">자동 결정: ${A.auto ? '켜짐' : '꺼짐'}</button>
      <button data-m="music">음악: ${A.music ? '켜짐' : '꺼짐'}</button>
      <button data-m="theme">화면: ${document.documentElement.dataset.theme === 'light' ? '밝게' : '어둡게'}</button>
      <button data-m="family">가족과 삶 보기</button>
      <button data-m="assets">재산·보유 보기</button>
      <button data-m="spend">돈 쓰기 · 투자</button>
      <button data-m="seed">이 아이의 링크 복사</button>
      <button data-m="badges">도전과제</button>
      <button data-m="stats">한국 통계 보기</button>
      <button data-m="feedback">의견 보내기</button>
      <button data-m="exit">나가기 (저장됨)</button></div>`);
    body.querySelectorAll('button[data-m]').forEach(b => b.onclick = () => {
      const m = b.dataset.m;
      if (m === 'play') { UI.closeModal(); togglePlay(); }
      else if (m === 'pixel') { const ks = Object.keys(KR.PIXEL.STYLES); KR.PIXEL.style = ks[(ks.indexOf(KR.PIXEL.style) + 1) % ks.length]; LS.set('krlife.pixel', KR.PIXEL.style); openMenu(); }
      else if (m === 'auto') { A.auto = !A.auto; $('auto').checked = A.auto; save(); openMenu(); }
      else if (m === 'music') { toggleMusic(); openMenu(); }
      else if (m === 'theme') { toggleTheme(); openMenu(); }
      else if (m === 'family') UI.modal(UI.familyHTML(s));
      else if (m === 'spend') openSpend();
      else if (m === 'seed') { UI.closeModal(); copySeed(); }
      else if (m === 'badges') openBadges(s);
      else if (m === 'stats') UI.modal(UI.statsHTML(s.year));
      else if (m === 'feedback') location.href = 'mailto:jieunyi1995@gmail.com?subject=' + encodeURIComponent('5천만 분의 1 의견');
      else if (m === 'exit') { save(); UI.closeModal(); stopPlay(); clearReveals(); clearTimeout(A.benchTimer); A.s = null; renderHome(); show('screen-home'); }
      else if (m === 'assets') { UI.closeModal(); setTab('assets'); }
    });
  }
  function openSpend() {
    const s = A.s; const body = UI.modal(UI.spendHTML(s));
    body.querySelectorAll('button[data-spend]').forEach(b => b.onclick = () => { if (S.spend(s, b.dataset.spend)) { UI.prependLog(s, s.log[s.log.length - 1]); UI.renderStats(s); UI.renderAssets(s); openSpend(); } });
    const upd = () => { const g = id => +body.querySelector('#' + id).value / 100; S.setAlloc(s, { deposit: g('al-deposit'), stock: g('al-stock'), coin: g('al-coin') }); UI.renderAssets(s); body.querySelectorAll('.alloc label').forEach(l => { l.querySelector('span').textContent = Math.round(l.querySelector('input').value) + '%'; }); save(); };
    body.querySelectorAll('.alloc input').forEach(i => i.oninput = upd);
  }
  function openBadges(s) { UI.modal(UI.badgesHTML(LS.get('krlife.badges', []), s ? S.badges(s) : [])); }
  function toggleTheme() { const cur = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = cur; LS.set('krlife.theme', cur); }
  function toggleMusic() {
    if (A.music) { A.music.stop(); A.music = null; return; }
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const master = ac.createGain(); master.gain.value = 0.12; master.connect(ac.destination);
      const delay = ac.createDelay(1.5); delay.delayTime.value = 0.42; const fb = ac.createGain(); fb.gain.value = 0.35; delay.connect(fb); fb.connect(delay); delay.connect(master);
      const scale = [220, 246.9, 293.7, 329.6, 392, 440, 493.9, 587.3];
      let alive = true;
      const note = () => { if (!alive) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = Math.random() < 0.5 ? 'sine' : 'triangle'; o.frequency.value = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.2 ? 0.5 : 1); g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(0.5, ac.currentTime + 0.4); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 3.5); o.connect(g); g.connect(master); g.connect(delay); o.start(); o.stop(ac.currentTime + 3.6); setTimeout(note, 1400 + Math.random() * 2200); };
      note();
      A.music = { stop: () => { alive = false; master.gain.linearRampToValueAtTime(0, ac.currentTime + 1); setTimeout(() => ac.close(), 1200); } };
    } catch (e) { UI.toast('이 기기에서는 음악을 켤 수 없습니다.'); }
  }

  function setTab(k) {
    for (const b of $('tabs').querySelectorAll('button')) b.classList.toggle('on', b.dataset.tab === k);
    for (const p of document.querySelectorAll('.panel[data-tab]')) p.classList.toggle('active', p.dataset.tab === k);
    LS.set('krlife.tab', k);
  }
  function openLives() {
    const lives = LS.get('krlife.lives', []);
    const body = UI.modal(UI.livesHTML(lives));
    body.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'btn-clear-lives') { if (confirm('전생 기록, 추모관, 순위표를 모두 지울까요?')) { LS.del('krlife.lives'); renderHome(); UI.closeModal(); } return; }
      if (b.dataset.view) { const rec = lives.find(l => l.id === b.dataset.view); if (rec) viewLife(rec); }
      if (b.dataset.mem) { const rec = lives.find(l => l.id === b.dataset.mem); if (rec) { rec.memorial = true; LS.set('krlife.lives', lives); renderHome(); UI.toast('추모관에 모셨습니다.'); openLives(); } }
    };
  }
  function openRanking(key) {
    key = key || LS.get('krlife.rankKey', 'score');
    const lives = LS.get('krlife.lives', []).filter(l => l.death);
    const body = UI.modal(UI.rankingHTML(lives, key));
    const sel = body.querySelector('#rank-key'); if (sel) sel.onchange = () => { LS.set('krlife.rankKey', sel.value); openRanking(sel.value); };
  }
  function openMemorial() {
    const lives = LS.get('krlife.lives', []);
    const body = UI.modal(UI.memorialHTML(lives));
    body.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const rec = lives.find(l => l.id === (b.dataset.candle || b.dataset.msg)); if (!rec) return;
      if (b.dataset.candle) { rec.candles = (rec.candles || 0) + 1; LS.set('krlife.lives', lives); openMemorial(); }
      else { const t = prompt('이 사람에게 한마디', rec.message || ''); if (t != null) { rec.message = t.trim().slice(0, 140); LS.set('krlife.lives', lives); openMemorial(); } }
    };
  }
  function viewLife(rec) {
    const sm = rec.summary;
    UI.modal(`<h2>${UI.esc(sm.name)} <small style="color:var(--muted);font-weight:400">${sm.birthYear}–${rec.death ? rec.death.year : ''}</small></h2><p class="text">${sm.regionFull} · ${sm.sex === 'M' ? '남' : '여'} · ${rec.death ? `${rec.death.age}세, ${UI.esc(rec.death.cause)}` : ''}${rec.start ? ` · 출발선 대비 상위 ${rec.start.top}%` : ''}${rec.seed ? ` · 시드 ${rec.seed}` : ''}</p><div class="d-record"><ul class="log">${rec.log.slice().reverse().map(e => `<li class="${e.k}"><span class="a">${e.a}세</span><span class="t">${UI.icon(e.k)} ${UI.esc(e.t)}</span><span></span></li>`).join('')}</ul></div>`);
  }

  function init() {
    const theme = LS.get('krlife.theme', null); if (theme) document.documentElement.dataset.theme = theme;
    const q0 = new URLSearchParams(location.search); const ps = q0.get('pixel') || LS.get('krlife.pixel', null); if (ps && KR.PIXEL.STYLES[ps]) KR.PIXEL.style = ps;
    const sel = $('real-region'); D.regions.forEach((r, i) => { const o = document.createElement('option'); o.value = i; o.textContent = r.short; sel.appendChild(o); });
    const real = LS.get('krlife.real', null); if (real) { if (real.year) $('real-year').value = real.year; if (real.sex) $('real-sex').value = real.sex; if (real.region != null && real.region !== '') $('real-region').value = real.region; }
    $('era-seg').querySelectorAll('button').forEach(b => b.onclick = () => setEra(b.dataset.era));
    $('year-range').oninput = e => { A.birthYear = +e.target.value; updateYearHelp(); };
    $('btn-born').onclick = () => born('random');
    $('btn-daily').onclick = () => born('daily');
    $('btn-born-seed').onclick = () => born('seed');
    $('btn-continue').onclick = resume;
    $('btn-lives').onclick = e => { e.preventDefault(); openLives(); };
    $('btn-memorial-open').onclick = e => { e.preventDefault(); openMemorial(); };
    $('btn-ranking').onclick = e => { e.preventDefault(); openRanking(); };
    $('btn-today').onclick = e => { e.preventDefault(); openToday(); };
    $('btn-badges').onclick = e => { e.preventDefault(); openBadges(null); };
    $('nick').value = LS.get('krlife.nick', ''); $('nick').onchange = e => LS.set('krlife.nick', e.target.value.trim().slice(0, 12));
    apiBase();
    const q = new URLSearchParams(location.search);
    if (q.get('seed')) { $('seed').value = q.get('seed'); if (q.get('y')) $('seed-year').value = q.get('y'); $('seed-details').open = true; setTimeout(() => UI.toast('친구가 보낸 아이가 준비됐습니다. "이 아이로 태어나기"를 누르세요.'), 300); }
    $('tabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) { setTab(b.dataset.tab); b.blur(); } };
    setTab(LS.get('krlife.tab', 'record'));
    document.querySelectorAll('[data-open]').forEach(a => a.onclick = e => { e.preventDefault(); const k = a.dataset.open; UI.modal(k === 'stats' ? UI.statsHTML(A.birthYear) : k === 'about' ? UI.aboutHTML() : k === 'privacy' ? UI.privacyHTML() : UI.notesHTML()); });
    $('modal-close').onclick = UI.closeModal;
    $('modal').onclick = e => { if (e.target === $('modal') && !$('modal-close').hidden) UI.closeModal(); };
    $('btn-next-year').onclick = () => { stopPlay(); nextYear(); };
    $('btn-next-cross').onclick = () => { stopPlay(); nextCrossroad(); };
    $('btn-menu').onclick = openMenu;
    $('btn-expand').onclick = () => UI.toggleTimeline();
    $('focus').onchange = e => { if (A.s) { A.s.focus = e.target.value; save(); } };
    $('auto').onchange = e => { A.auto = e.target.checked; save(); if (A.auto && modalOpen() && A.s && A.s.queue.length && A.phase === 'deciding') { UI.closeModal(); processDecisions(); } };
    $('log').onclick = e => { const b = e.target.closest('.star'); if (!b || !A.s) return; const li = b.closest('li'); const en = A.s.log[+li.dataset.i]; if (!en) return; en.star = !en.star; b.classList.toggle('on', en.star); b.textContent = en.star ? '★' : '☆'; save(); };
    $('btn-share').onclick = shareCard;
    $('btn-seedlink').onclick = copySeed;
    $('btn-child').onclick = openChild;
    $('btn-memorial').onclick = () => { if (A.rec) { A.rec.memorial = true; updateLife(A.rec); UI.toast('추모관에 모셨습니다. 홈에서 볼 수 있습니다.'); } };
    $('btn-record').onclick = () => { if (A.rec) viewLife(A.rec); };
    $('btn-again').onclick = () => { A.s = null; A.rec = null; renderHome(); show('screen-home'); };
    document.addEventListener('keydown', e => {
      if (e.target.matches('input,textarea,select,button') || $('screen-life').hidden) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); stopPlay(); nextYear(); }
      else if (e.key === 'n' || e.key === 'N') { stopPlay(); nextCrossroad(); }
      else if (e.key === 'p' || e.key === 'P') togglePlay();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && A.s) save(); });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); A.installEvt = e; $('btn-install').hidden = false; });
    $('btn-install').onclick = e => { e.preventDefault(); if (A.installEvt) A.installEvt.prompt(); };
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
    setEra('now'); renderHome(); show('screen-home');
    requestAnimationFrame(tickBar);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
