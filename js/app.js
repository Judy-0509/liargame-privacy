(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util, UI = KR.UI, $ = UI.$;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
  const A = { s: null, timer: null, reveals: [], running: false, speed: 1, minutes: 30, era: 'now', birthYear: 2026, pausesOn: true, auto: false, music: null, busy: false };

  const pauseQ = { 5: '다섯 살. 이 아이의 하루는 어땠을까요? 한 줄을 남겨 보세요.', 15: '열다섯. 이 아이는 어떤 어른이 되고 싶을까요?', 30: '서른. 지금의 삶은 이 사람이 바랐던 삶일까요?', 50: '쉰. 남은 시간에 꼭 하고 싶은 일이 있다면 무엇일까요?', 70: '일흔. 돌아보면 무엇이 남았을까요?' };

  function yearMs() { return (A.minutes * 60 * 1000 / 88) / A.speed; }
  function show(id) { for (const sc of document.querySelectorAll('.screen')) sc.hidden = sc.id !== id; window.scrollTo(0, 0); }
  function save() { if (A.s) LS.set('krlife.current', { s: A.s, minutes: A.minutes, speed: A.speed, auto: A.auto, pausesOn: A.pausesOn }); }
  function clearTimers() { clearTimeout(A.timer); A.timer = null; for (const t of A.reveals) clearTimeout(t); A.reveals = []; }

  function setRunning(v) { A.running = v; $('btn-pause').textContent = v ? '⏸' : '▶'; if (!v) clearTimers(); else if (!A.busy) schedule(); }
  function schedule() { clearTimeout(A.timer); if (!A.running || !A.s || !A.s.alive) return; A.timer = setTimeout(advance, yearMs()); }

  function advance() {
    const s = A.s; if (!s || !s.alive || A.busy) return;
    const r = S.beginYear(s);
    UI.renderTop(s);
    if (r.pause && A.pausesOn) { A.pending = { pause: r.pause }; return showPause(r.pause); }
    processDecisions();
  }

  function processDecisions() {
    const s = A.s;
    while (s.queue.length) {
      const id = s.queue[0];
      const d = S.decision(s, id);
      if (!d) continue;
      if (A.auto) { S.autoChoose(s, id); continue; }
      $('decision-wait').hidden = false;
      return showDecision(d);
    }
    $('decision-wait').hidden = true;
    finishYear();
  }

  function finishYear(instant) {
    const s = A.s;
    const entries = S.completeYear(s);
    UI.renderTop(s); UI.renderStats(s); UI.renderMap(s); UI.renderCurve(s); UI.renderCohort(s); UI.renderAssets(s);
    clearTimers();
    if (instant || !A.running) { for (const e of entries) UI.prependLog(s, e); }
    else {
      const gap = Math.min(900, yearMs() * 0.75 / Math.max(1, entries.length));
      entries.forEach((e, i) => A.reveals.push(setTimeout(() => UI.prependLog(s, e), i * gap)));
    }
    save();
    if (!s.alive) { A.busy = true; setTimeout(onDeath, instant ? 400 : Math.min(3000, yearMs() * 0.9)); return; }
    if (A.running) schedule();
  }

  function fastForward() {
    const s = A.s; if (!s || !s.alive || A.busy) return;
    clearTimers(); A.running = true; $('btn-pause').textContent = '⏸';
    let guard = 0;
    while (s.alive && guard++ < 130) {
      const r = S.beginYear(s);
      if (r.pause && A.pausesOn) { UI.renderAll(s); A.pending = { pause: r.pause }; return showPause(r.pause); }
      let stop = false;
      while (s.queue.length) {
        const id = s.queue[0]; const d = S.decision(s, id); if (!d) continue;
        if (A.auto) { S.autoChoose(s, id); continue; }
        UI.renderAll(s); $('decision-wait').hidden = false; showDecision(d); stop = true; break;
      }
      if (stop) return;
      S.completeYear(s);
    }
    UI.renderAll(s); save();
    if (!s.alive) { A.busy = true; setTimeout(onDeath, 600); }
  }

  function showPause(age) {
    clearTimers();
    const s = A.s;
    const body = UI.modal(`<p class="kicker">생각 멈춤 · ${age}세 · ${s.year}년</p><p class="pause-q">${pauseQ[age] || ''}</p><textarea id="pause-note" rows="2" maxlength="120" placeholder="한 줄 (비워 두어도 됩니다)"></textarea><div class="actions"><button class="primary" id="pause-go">계속</button><button class="ghost" id="pause-off">다시 묻지 않기</button></div>`, { noClose: true });
    const go = () => { const t = body.querySelector('#pause-note').value.trim(); if (t) { s.notes[age] = t; S.log(s, `(생각) ${t}`, 'note'); UI.prependLog(s, s.log[s.log.length - 1]); } UI.closeModal(); A.pending = null; processDecisions(); };
    body.querySelector('#pause-go').onclick = go;
    body.querySelector('#pause-off').onclick = () => { A.pausesOn = false; go(); };
  }

  function showDecision(d) {
    clearTimers();
    const body = UI.modal(`<p class="kicker">결정 · ${A.s.age}세 · ${A.s.year}년</p><h2>${UI.esc(d.title)}</h2><p class="text">${UI.esc(d.text || '')}</p><div class="options">${d.options.map((o, i) => `<button data-i="${i}"><b>${UI.esc(o.label)}</b>${o.hint ? `<small>${UI.esc(o.hint)}</small>` : ''}</button>`).join('')}</div><p class="help" style="margin-top:12px"><button class="small ghost" id="dec-auto">이번엔 자동으로</button></p>`, { noClose: true });
    const choose = i => { S.resolve(A.s, d.id, i); UI.closeModal(); UI.renderStats(A.s); UI.renderAssets(A.s); processDecisions(); };
    body.querySelectorAll('.options button').forEach(b => b.onclick = () => choose(+b.dataset.i));
    body.querySelector('#dec-auto').onclick = () => { S.autoChoose(A.s, d.id); UI.closeModal(); processDecisions(); };
  }

  function onDeath() {
    const s = A.s; clearTimers(); A.running = false; A.busy = false;
    const lives = LS.get('krlife.lives', []);
    const rec = { id: s.birthYear + '-' + s.rng, summary: S.summary(s), log: s.log, death: s.death, when: Date.now(), memorial: false, candles: 0 };
    lives.unshift(rec); LS.set('krlife.lives', lives.slice(0, 10));
    LS.del('krlife.current');
    A.rec = rec;
    UI.deathSummary(s);
    show('screen-death');
  }

  function updateLife(rec) { const lives = LS.get('krlife.lives', []); const i = lives.findIndex(x => x.id === rec.id); if (i >= 0) { lives[i] = rec; LS.set('krlife.lives', lives); } }

  function shareCard() {
    const c = $('share-canvas'); UI.drawShareCard(c, A.s);
    c.toBlob(async blob => {
      const file = new File([blob], `5천만분의1-${A.s.name}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '5천만 분의 1', text: `${A.s.name}, ${A.s.birthYear}–${A.s.death.year}` }); return; } catch (e) { } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      UI.toast('공유 카드를 저장했습니다.');
    }, 'image/png');
  }

  function renderHome() {
    const cur = LS.get('krlife.current', null);
    $('btn-continue').hidden = !(cur && cur.s && cur.s.alive);
    const lives = LS.get('krlife.lives', []);
    $('lives-count').textContent = lives.length ? `(${lives.length})` : '';
    const memN = lives.filter(l => l.memorial).length; $('memorial-count').textContent = memN ? `(${memN})` : '';
    $('home-births').textContent = Math.round(U.interp(D.byYear.births, 2026) / 365).toLocaleString('ko-KR');
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

  function born() {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const s = S.newLife({ birthYear: A.birthYear, seed });
    const real = { year: +$('real-year').value || null, sex: $('real-sex').value || null, region: $('real-region').value || null };
    LS.set('krlife.real', real);
    if (real.year || real.sex || real.region) {
      const parts = [];
      if (real.year) parts.push(`${real.year}년`); if (real.region) parts.push(D.regions[+real.region].short); if (real.sex) parts.push(real.sex === 'M' ? '남자' : '여자');
      const r = D.regions[s.region]; const w = U.clamp((s.birthYear - 1970) / 54, 0, 1); const share = (r.share1970 + (r.share2024 - r.share1970) * w) * (s.sex === 'M' ? D.maleShare : 1 - D.maleShare);
      S.log(s, `당신은 ${parts.join(' ')}로 태어났습니다. 이 아이처럼 ${s.birthYear}년 ${r.short}에서 ${s.sex === 'M' ? '남자' : '여자'}로 태어날 확률은 ${(share * 100).toFixed(1)}%였습니다.`, 'birth');
    }
    A.s = s; A.busy = false; A.pending = null;
    S.completeYear(s);
    show('screen-life'); UI.renderAll(s);
    $('focus').value = s.focus; $('auto').checked = A.auto; $('decision-wait').hidden = true;
    save(); setRunning(true);
  }

  function resume() {
    const cur = LS.get('krlife.current', null); if (!cur || !cur.s) return;
    A.s = cur.s; A.minutes = cur.minutes || 30; A.auto = !!cur.auto; A.pausesOn = cur.pausesOn !== false; A.busy = false;
    setSpeed(cur.speed || 1);
    show('screen-life'); UI.renderAll(A.s); $('focus').value = A.s.focus; $('auto').checked = A.auto;
    if (A.s.map.length < A.s.age + 1) { A.running = true; $('btn-pause').textContent = '⏸'; processDecisions(); } else setRunning(true);
  }

  function setSpeed(x) { A.speed = x; for (const b of $('speeds').querySelectorAll('button')) b.classList.toggle('on', +b.dataset.x === x); if (A.running && !A.busy && $('modal').hidden) schedule(); }

  function openMenu() {
    const s = A.s;
    const body = UI.modal(`<h2>메뉴</h2><div class="menu">
      <button data-m="auto">자동 결정: ${A.auto ? '켜짐' : '꺼짐'}</button>
      <button data-m="pauses">생각 멈춤(5·15·30·50·70세): ${A.pausesOn ? '켜짐' : '꺼짐'}</button>
      <button data-m="music">음악: ${A.music ? '켜짐' : '꺼짐'}</button>
      <button data-m="theme">화면: ${document.documentElement.dataset.theme === 'light' ? '밝게' : '어둡게'}</button>
      <button data-m="family">가족과 삶 보기</button>
      <button data-m="assets">재산·보유 보기</button>
      <button data-m="spend">돈 쓰기 · 투자</button>
      <button data-m="stats">한국 통계 보기</button>
      <button data-m="feedback">의견 보내기</button>
      <button data-m="exit">나가기 (저장됨)</button></div>`);
    body.querySelectorAll('button[data-m]').forEach(b => b.onclick = () => {
      const m = b.dataset.m;
      if (m === 'auto') { A.auto = !A.auto; $('auto').checked = A.auto; save(); openMenu(); }
      else if (m === 'pauses') { A.pausesOn = !A.pausesOn; save(); openMenu(); }
      else if (m === 'music') { toggleMusic(); openMenu(); }
      else if (m === 'theme') { toggleTheme(); openMenu(); }
      else if (m === 'family') UI.modal(UI.familyHTML(s));
      else if (m === 'spend') openSpend();
      else if (m === 'stats') UI.modal(UI.statsHTML(s.year));
      else if (m === 'feedback') location.href = 'mailto:jieunyi1995@gmail.com?subject=' + encodeURIComponent('5천만 분의 1 의견');
      else if (m === 'exit') { save(); UI.closeModal(); setRunning(false); A.s = null; renderHome(); show('screen-home'); }
      else if (m === 'assets') { UI.closeModal(); setTab('assets'); }
    });
  }

  function openSpend() {
    const s = A.s; const body = UI.modal(UI.spendHTML(s));
    body.querySelectorAll('button[data-spend]').forEach(b => b.onclick = () => { if (S.spend(s, b.dataset.spend)) { UI.prependLog(s, s.log[s.log.length - 1]); UI.renderStats(s); UI.renderAssets(s); openSpend(); } });
    const upd = () => { const g = id => +body.querySelector('#' + id).value / 100; S.setAlloc(s, { deposit: g('al-deposit'), stock: g('al-stock'), coin: g('al-coin') }); UI.renderAssets(s); body.querySelectorAll('.alloc label').forEach(l => { l.querySelector('span').textContent = Math.round(l.querySelector('input').value) + '%'; }); save(); };
    body.querySelectorAll('.alloc input').forEach(i => i.oninput = upd);
  }

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
      if (b.id === 'btn-clear-lives') { if (confirm('전생 기록과 추모관을 모두 지울까요?')) { LS.del('krlife.lives'); renderHome(); UI.closeModal(); } return; }
      if (b.dataset.view) { const rec = lives.find(l => l.id === b.dataset.view); if (rec) viewLife(rec); }
      if (b.dataset.mem) { const rec = lives.find(l => l.id === b.dataset.mem); if (rec) { rec.memorial = true; LS.set('krlife.lives', lives); renderHome(); UI.toast('추모관에 모셨습니다.'); openLives(); } }
    };
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
    UI.modal(`<h2>${UI.esc(sm.name)} <small style="color:var(--muted);font-weight:400">${sm.birthYear}–${rec.death ? rec.death.year : ''}</small></h2><p class="text">${sm.regionFull} · ${sm.sex === 'M' ? '남' : '여'} · ${rec.death ? `${rec.death.age}세, ${UI.esc(rec.death.cause)}` : ''}</p><div class="d-record"><ul class="log">${rec.log.slice().reverse().map(e => `<li class="${e.k}"><span class="a">${e.a}세</span><span class="t">${UI.esc(e.t)}</span><span></span></li>`).join('')}</ul></div>`);
  }

  function init() {
    const theme = LS.get('krlife.theme', null); if (theme) document.documentElement.dataset.theme = theme;
    const sel = $('real-region'); D.regions.forEach((r, i) => { const o = document.createElement('option'); o.value = i; o.textContent = r.short; sel.appendChild(o); });
    const real = LS.get('krlife.real', null); if (real) { if (real.year) $('real-year').value = real.year; if (real.sex) $('real-sex').value = real.sex; if (real.region != null && real.region !== '') $('real-region').value = real.region; }
    $('era-seg').querySelectorAll('button').forEach(b => b.onclick = () => setEra(b.dataset.era));
    $('year-range').oninput = e => { A.birthYear = +e.target.value; updateYearHelp(); };
    $('len-seg').querySelectorAll('button').forEach(b => b.onclick = () => { A.minutes = +b.dataset.min; $('len-seg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
    $('btn-born').onclick = born;
    $('btn-continue').onclick = resume;
    $('btn-lives').onclick = e => { e.preventDefault(); openLives(); };
    $('btn-memorial-open').onclick = e => { e.preventDefault(); openMemorial(); };
    $('tabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); };
    setTab(LS.get('krlife.tab', 'record'));
    document.querySelectorAll('[data-open]').forEach(a => a.onclick = e => { e.preventDefault(); const k = a.dataset.open; UI.modal(k === 'stats' ? UI.statsHTML(A.birthYear) : k === 'about' ? UI.aboutHTML() : k === 'privacy' ? UI.privacyHTML() : UI.notesHTML()); });
    $('modal-close').onclick = UI.closeModal;
    $('modal').onclick = e => { if (e.target === $('modal') && !$('modal-close').hidden) UI.closeModal(); };
    $('btn-pause').onclick = () => { if (A.busy) return; if (A.running) { setRunning(false); for (const t of A.reveals) clearTimeout(t); A.reveals = []; UI.renderLog(A.s); } else setRunning(true); };
    $('speeds').querySelectorAll('button').forEach(b => b.onclick = () => setSpeed(+b.dataset.x));
    $('btn-next').onclick = () => { if (!$('modal').hidden) return; fastForward(); };
    $('btn-menu').onclick = openMenu;
    $('focus').onchange = e => { if (A.s) { A.s.focus = e.target.value; save(); } };
    $('auto').onchange = e => { A.auto = e.target.checked; save(); if (A.auto && !$('modal').hidden && A.s && A.s.queue.length) { UI.closeModal(); processDecisions(); } };
    $('log').onclick = e => { const b = e.target.closest('.star'); if (!b || !A.s) return; const li = b.closest('li'); const en = A.s.log[+li.dataset.i]; if (!en) return; en.star = !en.star; b.classList.toggle('on', en.star); b.textContent = en.star ? '★' : '☆'; save(); };
    $('btn-share').onclick = shareCard;
    $('btn-memorial').onclick = () => { if (A.rec) { A.rec.memorial = true; updateLife(A.rec); UI.toast('추모관에 모셨습니다. 홈에서 볼 수 있습니다.'); } };
    $('btn-record').onclick = () => { if (A.rec) viewLife(A.rec); };
    $('btn-again').onclick = () => { A.s = null; A.rec = null; renderHome(); show('screen-home'); };
    document.addEventListener('keydown', e => { if (e.target.matches('input,textarea,select') || $('screen-life').hidden) return; if (e.code === 'Space') { e.preventDefault(); $('btn-pause').click(); } if (e.key === 'n') $('btn-next').click(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && A.s) save(); });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); A.installEvt = e; $('btn-install').hidden = false; });
    $('btn-install').onclick = e => { e.preventDefault(); if (A.installEvt) A.installEvt.prompt(); };
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
    setEra('now'); renderHome(); show('screen-home');
  }
  document.addEventListener('DOMContentLoaded', init);
})();
