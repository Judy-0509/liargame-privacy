window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim, U = KR.util;
  const Phi = z => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
  const SPECIAL = ['영재고', '과학고', '외고', '자사고'];
  const GENERAL = ['top', 'upper', 'midup', 'mid', 'national', 'localpriv', 'college', 'cyber'];

  S.scorePct = (s, noise) => { const k = s.stats.know + S.hsBonus(s) + (noise ? U.normal(s, 0, 5) : 0); return U.clamp(Math.round(Phi((k - 66) / 15) * 1000) / 10, 0.1, 99.9); };
  S.naesinGrade = s => { const pen = SPECIAL.includes(s.edu.hs) ? 8 : s.edu.hs === '예술고' ? 3 : 0; return U.clamp(9 - Math.round(8 * Phi((s.stats.know - pen - 66) / 15)), 1, 9); };
  S.susiPct = s => U.clamp(D.naesinPct[S.naesinGrade(s)] + (s.stats.rel >= 60 ? 3 : 0) + (s.edu.gifted ? 2 : 0) + (s.flags.contestWin ? 2 : 0) + (s.flags.volunteer ? 1 : 0) + (SPECIAL.includes(s.edu.hs) ? 6 : 0), 1, 99.9);
  S.tierById = id => D.univTiers.find(t => t.id === id);
  S.tiersFor = (s, major) => D.univTiers.filter(t => t.since <= s.year && (!t.major || t.major === major) && !(major === '의약' && GENERAL.includes(t.id) && t.id !== 'cyber' && t.id !== 'college') && !(major === '교육' && t.id === 'college'));
  S.appProb = (s, tier, type, pct) => {
    if (tier.id === 'cyber') return 0.99;
    const spread = (type === 'su' ? 4 : 3) * (tier.rank >= 3 ? 0.85 : tier.rank <= 1 ? 1.6 : 1);
    let p = 1 / (1 + Math.exp(-(pct - tier.cut) / spread));
    if (type === 'su' && tier.rank >= 3) p *= tier.rank >= 4 ? 0.4 : 0.5;
    if (type === 'su' && tier.rank >= 3 && SPECIAL.includes(s.edu.hs)) p = Math.min(0.99, p * 1.3);
    return U.clamp(p, 0.002, 0.99);
  };
  S.autoMajor = s => {
    const k = s.stats.know + S.hsBonus(s);
    if (s.edu.hs === '예술고') return '예체능';
    const sci = s.edu.track === '이과';
    const rows = sci ? [['공학', 55], ['자연', 25], ['의약', k >= 88 ? 25 : 6], ['교육', 4], ['예체능', 4]] : [['사회', 50], ['인문', 25], ['교육', 10], ['예체능', 8], ['의약', k >= 80 ? 7 : 2]];
    return U.weighted(s, rows, x => x[1])[0];
  };
  function fill(cands, n, byTwo) {
    const out = {}; if (!cands.length) return out;
    let i = 0, left = n;
    while (left > 0) { const t = cands[i % cands.length]; const add = byTwo && cands.length * 2 <= n + 1 ? Math.min(2, left) : 1; out[t.id] = (out[t.id] || 0) + add; left -= add; i++; if (i > 40) break; }
    return out;
  }
  function pickWindow(tiers, lo, hi, fallbackDir) {
    let c = tiers.filter(t => t.cut > lo && t.cut <= hi && t.id !== 'cyber');
    if (!c.length) { const sorted = tiers.filter(t => t.id !== 'cyber').slice().sort((a, b) => a.cut - b.cut); c = fallbackDir > 0 ? sorted.filter(t => t.cut > hi).slice(0, 2) : sorted.filter(t => t.cut <= lo).slice(-2); if (!c.length) c = fallbackDir > 0 ? sorted.slice(-2) : sorted.slice(0, 2); }
    return c.sort((a, b) => b.cut - a.cut);
  }
  S.presets = (s, major) => {
    const tiers = S.tiersFor(s, major), E = S.scorePct(s, false), SP = S.susiPct(s), susi = s.year >= 1997;
    const mk = (name, sLo, sHi, jLo, jHi, dir) => ({ name, major, su: susi ? fill(pickWindow(tiers, SP + sLo, SP + sHi, dir).slice(0, 3), 6, true) : {}, jung: fill(pickWindow(tiers, E + jLo, E + jHi, dir).slice(0, 3), 3, false) });
    return [mk('상향', 1, 14, 1, 10, 1), mk('적정', -6, 2, -4, 2, 0), mk('안정', -18, -5, -15, -5, -1)];
  };
  S.planOdds = (s, plan) => {
    const E = S.scorePct(s, false), SP = S.susiPct(s);
    let noSu = 1, noJung = 1;
    for (const [id, n] of Object.entries(plan.su || {})) { const t = S.tierById(id); if (t) noSu *= Math.pow(1 - S.appProb(s, t, 'su', SP), n); }
    for (const [id, n] of Object.entries(plan.jung || {})) { const t = S.tierById(id); if (t) noJung *= Math.pow(1 - S.appProb(s, t, 'jung', E), n); }
    return { su: 1 - noSu, jung: 1 - noJung, any: 1 - noSu * noJung, E, SP };
  };
  S.planText = plan => {
    const f = o => Object.entries(o || {}).filter(x => x[1] > 0).map(([id, n]) => `${S.tierById(id).name}${n > 1 ? ' ' + n : ''}`).join(', ');
    const su = f(plan.su), ju = f(plan.jung);
    return `${su ? '수시 ' + su : ''}${su && ju ? ' / ' : ''}${ju ? '정시 ' + ju : ''}` || '지원 없음';
  };
  S.runApplications = (s, bonus) => {
    const e = s.edu, plan = e.plan;
    const E = S.scorePct(s, true); e.pct = E; e.grade = S.naesinGrade(s); const SP = S.susiPct(s);
    const kAdj = bonus ? Math.min(99.9, E + bonus) : E;
    S.log(s, `수능 백분위 ${kAdj.toFixed(1)} (상위 ${Math.max(0.1, 100 - kAdj).toFixed(1)}%)${s.year >= 1997 ? `, 내신 ${e.grade}등급` : ''}.`, 'edu');
    const roll = (o, type, pct) => { const out = []; for (const [id, n] of Object.entries(o || {})) { const t = S.tierById(id); if (!t) continue; let ok = 0; for (let i = 0; i < n; i++) if (U.chance(s, S.appProb(s, t, type, pct))) ok++; out.push({ id, n, ok }); } return out; };
    const su = roll(plan.su, 'su', SP);
    const suOk = su.filter(r => r.ok > 0);
    e.admits = [];
    if (suOk.length) { e.admits = suOk.map(r => r.id); const total = su.reduce((a, r) => a + r.n, 0); S.log(s, `수시 ${total}곳 중 ${suOk.reduce((a, r) => a + r.ok, 0)}곳 합격: ${suOk.map(r => S.tierById(r.id).name).join(', ')}. 수시에 붙어 정시는 쓸 수 없었다.`, 'edu'); }
    else {
      if (su.length) S.log(s, '수시는 전부 떨어졌다.', 'edu');
      const ju = roll(plan.jung, 'jung', kAdj); const juOk = ju.filter(r => r.ok > 0);
      if (juOk.length) { e.admits = juOk.map(r => r.id); S.log(s, `정시 ${ju.reduce((a, r) => a + r.n, 0)}곳 중 ${juOk.reduce((a, r) => a + r.ok, 0)}곳 합격: ${juOk.map(r => S.tierById(r.id).name).join(', ')}.`, 'edu'); }
      else if (ju.length) S.log(s, '정시도 모두 떨어졌다.', 'edu');
    }
    e.admits = [...new Set(e.admits)].sort((a, b) => S.tierById(b).cut - S.tierById(a).cut);
    e.stage = 'admitted'; e.major = plan.major;
    if (!e.admits.length) s.yearShock.happy -= 8; else s.yearShock.happy += 6;
  };
  S.enroll = (s, tierId, major) => {
    const e = s.edu, t = S.tierById(tierId); const r = D.regions[s.region];
    const isPub = U.chance(s, t.pub);
    e.univ = { kind: t.name, id: t.id, tier: t.rank, years: t.years, wage: t.wage, public: isPub, tuition: t.id === 'cyber' ? t.tuition : isPub ? Math.min(t.tuition, D.edu.tuitionPublic) : t.tuition, capital: t.id === 'national' ? false : U.chance(s, t.capital), online: !!t.online, med: t.major === '의약' && t.years === 6 };
    e.major = t.major || major || e.major || '사회';
    e.sub = t.sub || (t.id === 'dent' ? '치의예·한의예·약학' : null);
    e.stage = 'univ'; e.left = t.years; e.plan = null; e.admits = null;
    S.log(s, `${t.name}에 입학했다. ${e.major} 계열${e.sub ? ` · ${e.sub}` : ''}. ${isPub ? '국립' : '사립'}, 등록금 연 ${U.fmtMan(Math.round(e.univ.tuition * S.incomeIndex(s.year)))}.`, 'edu');
    if (e.univ.capital && !r.capital && !e.univ.online) { s.flags.movedCapital = true; s.housing = 'monthly'; S.log(s, '서울로 올라와 자취를 시작했다.', 'home'); }
    else if (t.id === 'national' && r.capital) { s.housing = 'monthly'; S.log(s, '지방으로 내려가 기숙사 생활을 시작했다.', 'home'); }
    if (s.parents.decile <= 5 && t.id !== 'cyber') S.pushDecision(s, 'tuition'); else e.tuition = '부모';
  };
})();
