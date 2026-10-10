globalThis.window = globalThis;
require('../js/data.js'); require('../js/sim.js'); require('../js/decisions.js'); require('../js/youth.js');
const S = KR.Sim, D = KR.DATA;
const N = +process.argv[2] || 2000, BY = +process.argv[3] || 2026;
const acc = { marryAge: { M: [], F: [] }, know17: [], partnerEver: 0, firstKidAge: [], inc35: [], kidsDist: {}, n: 0, deathAge: { M: [], F: [] }, infant: 0, univ: 0, capital: 0, married: 0, kids: 0, divorced: 0, own: 0, assets: [], causes: {}, cancer: 0, decisions: {}, smoker: 0, poverty: 0, mil: {}, degree: {}, jobs: {}, logLen: [], errors: 0 };
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  let s;
  try {
    s = S.newLife({ birthYear: BY, seed: 12345 + i * 7 }, true);
    S.completeYear(s);
    let guard = 0;
    while (s.alive && guard++ < 130) S.stepAuto(s);
  } catch (e) { acc.errors++; if (acc.errors < 5) console.error('ERR', e.stack.split('\n').slice(0, 4).join('\n')); continue; }
  const sm = S.summary(s);
  acc.n++;
  acc.deathAge[s.sex].push(s.death ? s.death.age : 130);
  if (s.death && s.death.age === 0) acc.infant++;
  if (s.edu.univ) acc.univ++;
  if (s.edu.univ && s.edu.univ.tier === 2) acc.capital++;
  if (sm.married) acc.married++;
  acc.kids += s.kids.length;
  if (s.love.divorced) acc.divorced++;
  if (sm.home === '자가') acc.own++;
  acc.assets.push(sm.assets);
  if (s.death) acc.causes[s.death.cause] = (acc.causes[s.death.cause] || 0) + 1;
  if (s.hs.cancers) acc.cancer++;
  if (s.hs.smoker || s.hs.quit) acc.smoker++;
  if (s.flags.povertyLogged || s.hs.poverty) acc.poverty++;
  acc.mil[s.mil.kind || s.mil.status] = (acc.mil[s.mil.kind || s.mil.status] || 0) + 1;
  acc.degree[s.edu.degree] = (acc.degree[s.edu.degree] || 0) + 1;
  acc.jobs[sm.job] = (acc.jobs[sm.job] || 0) + 1;
  for (const k in s.taken) acc.decisions[k] = (acc.decisions[k] || 0) + 1;
  acc.logLen.push(s.log.length);
  if (s.love.marriedAt != null) acc.marryAge[s.sex].push(s.love.marriedAt);
  if (s.flags.know17 != null) acc.know17.push(s.flags.know17);
  if (s.flags.partnerEver) acc.partnerEver++;
  if (s.kids.length) acc.firstKidAge.push(s.kids[0].by - s.birthYear);
  if (s.flags.inc35 != null) acc.inc35.push(s.flags.inc35);
  acc.kidsDist[s.kids.length] = (acc.kidsDist[s.kids.length] || 0) + 1;
}
const mean = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
const median = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const pct = v => (100 * v / acc.n).toFixed(1) + '%';
console.log(`birthYear ${BY}, n=${acc.n}, errors=${acc.errors}, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('death age M/F mean', mean(acc.deathAge.M).toFixed(1), mean(acc.deathAge.F).toFixed(1), 'median', median(acc.deathAge.M), median(acc.deathAge.F), '| infant', pct(acc.infant), '| alive@130', acc.deathAge.M.concat(acc.deathAge.F).filter(x => x === 130).length);
console.log('univ', pct(acc.univ), 'capital univ', pct(acc.capital), '| degrees', JSON.stringify(acc.degree));
console.log('married', pct(acc.married), 'divorced', pct(acc.divorced), 'kids/person', (acc.kids / acc.n).toFixed(2), '| own home at death', pct(acc.own), '| poverty', pct(acc.poverty));
console.log('assets median', median(acc.assets), 'mean', Math.round(mean(acc.assets)), '| cancer ever', pct(acc.cancer), '| smoker ever', pct(acc.smoker));
console.log('mil', JSON.stringify(acc.mil));
console.log('jobs', JSON.stringify(acc.jobs));
console.log('causes', JSON.stringify(Object.entries(acc.causes).sort((a, b) => b[1] - a[1]).slice(0, 12)));
console.log('decisions', JSON.stringify(acc.decisions));
console.log('log lines mean', mean(acc.logLen).toFixed(0));
console.log('marryAge M/F', mean(acc.marryAge.M).toFixed(1), mean(acc.marryAge.F).toFixed(1), '| partner ever', pct(acc.partnerEver), '| know@17 mean', mean(acc.know17).toFixed(1), 'sd', Math.sqrt(mean(acc.know17.map(x => (x - mean(acc.know17)) ** 2))).toFixed(1), '| first kid age', mean(acc.firstKidAge).toFixed(1), '| income@35 median', median(acc.inc35), '| kids dist', JSON.stringify(acc.kidsDist));
const cohortE = (sex) => { const S0 = KR.life.cohort(sex, BY); return S0.reduce((a, b) => a + b, 0) - 0.5; };
console.log('life table cohort e0 M/F', cohortE('M').toFixed(1), cohortE('F').toFixed(1));
if (process.argv[4] === 'show') { const s = S.newLife({ birthYear: BY, seed: 777 }, true); S.completeYear(s); while (s.alive) S.stepAuto(s); for (const l of s.log) console.log(`${l.a}세 ${l.y} [${l.k}] ${l.t}`); console.log(JSON.stringify(S.summary(s), null, 0)); }
