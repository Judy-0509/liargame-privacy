window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim;
  const P = KR.PIXEL = {};
  const W = 120, H = 26;
  const season = m => m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  const SKY = { spring: '#cfe3ff', summer: '#8fcbff', autumn: '#f5d9b4', winter: '#d9e2ec' };
  const GROUND = { spring: '#7fc47a', summer: '#5fae5a', autumn: '#c99a5b', winter: '#eef2f5' };
  const SKIN = '#f1c9a5', SKIN2 = '#e0b08a';
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const sprite = (ctx, rows, pal, x, y) => { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const ch = rows[j][i]; if (ch !== '.' && pal[ch]) px(ctx, x + i, y + j, pal[ch]); } };

  const ADULT = [
    '..HHHH..', '.HHHHHH.', '.HFFFFH.', '.HFEFEH.', '..FFFF..', '..FMMF..', '..BBBB..', '.BBBBBB.', 'ABBBBBBA', '.BBBBBB.', '..LLLL..', '..L..L..', '..L..L..', '.SS..SS.'];
  const CHILD = ['.HHHH.', 'HFFFFH', 'HFEFEH', '.FFFF.', '.FMMF.', '.BBBB.', 'BBBBBB', '.BBBB.', '.L..L.', 'SS..SS'];
  const BABY = ['.HHH.', 'HFFFH', 'HFEEH', '.FFF.', '.BBB.', 'BBBBB', '.BBB.'];
  const KID = ['.HHH.', 'HFEEH', '.FFF.', '.BBB.', 'BBBBB', '.L.L.'];
  const DOG = ['B..B.', 'BBBB.', 'BBBBB', 'B..B.'];
  const CAT = ['B.B..', 'BBB..', 'BBBBB', 'B.B..'];
  const CAR = ['...CCCC....', '..CWWCWWC..', 'CCCCCCCCCCC', 'CCCCCCCCCCC', '.TT.....TT.'];

  function outfit(s) {
    const st = S.stageOf(s), w = s.work, a = s.age;
    const hair = a >= 62 ? '#bdbdbd' : a >= 50 ? '#5a5a5a' : '#2b2320';
    let body = '#6b7280', legs = '#374151', shoes = '#111827', hat = null, badge = null;
    if (st === 'infant') { body = '#f9a8d4'; legs = '#f9a8d4'; }
    else if (st === 'school') { body = s.edu.stage === 'elem' ? '#f59e0b' : '#1e3a8a'; legs = '#1f2937'; }
    else if (st === 'univ') { body = s.edu.univ && s.edu.univ.tier >= 3 ? '#7c3aed' : '#0f766e'; legs = '#1f2937'; }
    else if (st === 'mil') { body = '#4d7c0f'; legs = '#3f6212'; hat = '#4d7c0f'; }
    else if (st === 'work') {
      const t = w.type;
      if (t === '의료' || t === '간호') { body = '#f8fafc'; badge = '#ef4444'; }
      else if (t === '자영업') { body = '#b45309'; badge = '#fde68a'; }
      else if (t === '공장' || t === '농업') { body = '#1d4ed8'; hat = t === '농업' ? '#fcd34d' : '#fbbf24'; }
      else if (t === '프리랜서') { body = '#475569'; }
      else if (t === '전문직') { body = '#111827'; badge = '#d4af37'; }
      else { body = '#1f2937'; badge = '#b91c1c'; }
      legs = '#111827';
    }
    else if (st === 'seek') { body = '#9ca3af'; legs = '#6b7280'; }
    else if (st === 'home') { body = '#fb7185'; legs = '#6b7280'; }
    else if (st === 'retire') { body = '#92400e'; legs = '#78350f'; }
    else if (st === 'care') { body = '#cbd5e1'; legs = '#94a3b8'; }
    return { hair, body, legs, shoes, hat, badge };
  }

  function drawPerson(ctx, s, x, y, o, bob) {
    const happy = s.stats.happy, rows = ADULT.slice();
    const mouth = happy >= 60 ? 'F' : happy >= 35 ? 'M' : 'M';
    const pal = { H: o.hat || o.hair, F: SKIN, E: '#1f2937', M: happy >= 60 ? '#c2410c' : happy >= 35 ? '#9a3412' : '#7f1d1d', B: o.body, L: o.legs, S: o.shoes, A: SKIN };
    const yy = y + (bob ? 1 : 0);
    sprite(ctx, rows, pal, x, yy);
    if (happy >= 60) { px(ctx, x + 2, yy + 5, SKIN); px(ctx, x + 5, yy + 5, SKIN); px(ctx, x + 3, yy + 5, '#c2410c', 2, 1); }
    else if (happy < 35) { px(ctx, x + 3, yy + 5, SKIN, 2, 1); px(ctx, x + 2, yy + 5, '#7f1d1d'); px(ctx, x + 5, yy + 5, '#7f1d1d'); px(ctx, x + 3, yy + 4, '#7f1d1d', 2, 1); px(ctx, x + 3, yy + 3, SKIN, 2, 1); px(ctx, x + 3, yy + 3, '#1f2937'); px(ctx, x + 4, yy + 3, '#1f2937'); }
    if (s.flags.glasses) { px(ctx, x + 2, yy + 3, '#111827', 2, 1); px(ctx, x + 4, yy + 3, '#111827', 2, 1); px(ctx, x + 2, yy + 3, '#111827'); px(ctx, x + 5, yy + 3, '#111827'); px(ctx, x + 3, yy + 3, '#1f2937'); px(ctx, x + 4, yy + 3, '#1f2937'); }
    if (o.badge) px(ctx, x + 3, yy + 7, o.badge, 1, 2);
    if (o.hat) px(ctx, x + 1, yy + 1, o.hat, 6, 1);
    if (s.stats.health < 40) { px(ctx, x + 7, yy + 2, '#60a5fa'); px(ctx, x + 7, yy + 3, '#60a5fa'); }
    if (s.age >= 78 || (s.age >= 65 && s.stats.health < 45)) px(ctx, x + 8, yy + 7, '#78350f', 1, 7);
    if (S.stageOf(s) === 'school' || S.stageOf(s) === 'univ') px(ctx, x - 1, yy + 7, S.stageOf(s) === 'univ' ? '#fcd34d' : '#dc2626', 1, 3);
    if (s.mil.status === 'serving') px(ctx, x + 7, yy + 6, '#1f2937', 1, 4);
  }

  function drawHouse(ctx, s, x, y, lit) {
    const h = s.housing;
    if (s.abroad) { px(ctx, x, y + 4, '#94a3b8', 12, 8); px(ctx, x + 2, y + 6, '#fde68a', 2, 2); px(ctx, x + 8, y + 6, '#fde68a', 2, 2); px(ctx, x + 5, y + 9, '#7c2d12', 2, 3); px(ctx, x + 1, y, '#dc2626', 1, 4); px(ctx, x + 2, y, '#fff', 3, 2); return; }
    if (h === 'own') { px(ctx, x, y - 2, '#9ca3af', 12, 14); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) px(ctx, x + 1 + c * 4, y - 1 + r * 3, lit || (r + c) % 2 ? '#fde68a' : '#374151', 2, 2); px(ctx, x + 5, y + 10, '#1f2937', 2, 2); return; }
    if (h === 'jeonse') { px(ctx, x + 1, y, '#a8a29e', 10, 12); for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) px(ctx, x + 2 + c * 5, y + 1 + r * 3, '#fde68a', 2, 2); px(ctx, x + 5, y + 10, '#1f2937', 2, 2); return; }
    if (h === 'monthly') { px(ctx, x + 2, y + 4, '#78716c', 8, 8); px(ctx, x + 4, y + 6, '#fde68a', 2, 2); px(ctx, x + 6, y + 10, '#1f2937', 1, 2); return; }
    if (h === 'care') { px(ctx, x, y + 2, '#e2e8f0', 12, 10); px(ctx, x + 5, y + 3, '#dc2626', 2, 4); px(ctx, x + 4, y + 4, '#dc2626', 4, 2); px(ctx, x + 2, y + 8, '#93c5fd', 2, 2); px(ctx, x + 8, y + 8, '#93c5fd', 2, 2); return; }
    px(ctx, x + 1, y + 5, '#d6a77a', 10, 7); for (let i = 0; i < 6; i++) px(ctx, x + i, y + 5 - i, '#b91c1c', 12 - i * 2, 1); px(ctx, x + 3, y + 7, '#fde68a', 2, 2); px(ctx, x + 7, y + 8, '#7c2d12', 2, 4);
  }

  P.render = function (canvas, s, frac, t) {
    if (!canvas || !s) return;
    const bob = Math.floor(t / 500) % 2 === 0;
    const month = Math.min(12, Math.floor(frac * 12) + 1), se = season(month);
    const key = [s.age, s.housing, S.stageOf(s), s.work.type, Math.round(s.stats.happy / 10), s.stats.health < 40, s.love.married, s.kids.filter(k => k.alive && k.home !== false && s.year - k.by < 20).length, !!s.pet, s.pet && s.pet.kind, !!s.car, se, bob, s.abroad, Math.min(3, Math.floor(Math.max(0, S.netWorth(s)) / 30000)), Math.floor(frac * 24)].join('|');
    if (canvas.dataset.key === key) return; canvas.dataset.key = key;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sc = canvas.width / W; ctx.scale(sc, sc);
    px(ctx, 0, 0, SKY[se], W, H);
    const sunX = 4 + Math.round(frac * (W - 10)); px(ctx, sunX, 2, se === 'winter' ? '#fef3c7' : '#fbbf24', 3, 3); px(ctx, sunX + 1, 1, '#fde68a', 1, 1); px(ctx, sunX + 1, 5, '#fde68a', 1, 1);
    px(ctx, 20 + Math.round(frac * 30), 4, '#ffffff', 6, 2); px(ctx, 70 - Math.round(frac * 20), 3, '#ffffff', 5, 2);
    if (se === 'spring') for (let i = 0; i < 10; i++) px(ctx, (i * 13 + 7) % W, 6 + (i * 5) % 7, '#f9a8d4');
    if (se === 'autumn') for (let i = 0; i < 8; i++) px(ctx, (i * 17 + 3) % W, 8 + (i * 7) % 6, '#ea580c');
    if (se === 'winter') for (let i = 0; i < 14; i++) px(ctx, (i * 11 + 5 + Math.floor(frac * 40)) % W, 2 + (i * 5) % 12, '#ffffff');
    px(ctx, 0, H - 4, GROUND[se], W, 4); px(ctx, 0, H - 4, se === 'winter' ? '#cbd5e1' : '#3f6212', W, 1);
    drawHouse(ctx, s, 4, H - 16, true);
    const o = outfit(s);
    const st = S.stageOf(s);
    const cx = 30;
    if (st === 'infant' && s.age < 2) sprite(ctx, BABY, { H: o.hair, F: SKIN, E: '#1f2937', B: '#fda4af' }, cx, H - 11);
    else if (s.age < 12) sprite(ctx, CHILD, { H: o.hair, F: SKIN, E: '#1f2937', M: s.stats.happy >= 50 ? '#c2410c' : '#7f1d1d', B: o.body, L: o.legs, S: o.shoes }, cx, H - 14 + (bob ? 1 : 0));
    else drawPerson(ctx, s, cx, H - 18, o, bob);
    let fx = cx + 12;
    if (s.love.married && s.love.spouse && s.love.spouse.alive) { const sp = s.love.spouse; drawPerson(ctx, { ...s, stats: s.stats, flags: {}, age: sp.age, mil: { status: 'na' }, work: { type: null }, edu: { stage: 'done' } }, fx, H - 18, { hair: sp.age >= 62 ? '#bdbdbd' : '#3b2a24', body: sp.sex === 'F' ? '#db2777' : '#2563eb', legs: '#374151', shoes: '#111827' }, !bob); fx += 11; px(ctx, cx + 9, H - 20, '#ef4444'); px(ctx, cx + 11, H - 20, '#ef4444'); px(ctx, cx + 9, H - 19, '#ef4444', 3, 1); px(ctx, cx + 10, H - 18, '#ef4444'); }
    else if (s.love.partner) { px(ctx, cx + 9, H - 20, '#f472b6'); px(ctx, cx + 11, H - 20, '#f472b6'); px(ctx, cx + 9, H - 19, '#f472b6', 3, 1); px(ctx, cx + 10, H - 18, '#f472b6'); }
    const kids = s.kids.filter(k => k.alive && k.home !== false && s.year - k.by < 20).slice(0, 3);
    for (const k of kids) { sprite(ctx, KID, { H: '#2b2320', F: SKIN, E: '#1f2937', B: k.sex === 'M' ? '#38bdf8' : '#f9a8d4', L: '#374151' }, fx, H - 10 + (bob ? 0 : 1)); fx += 7; }
    if (s.pet) { sprite(ctx, s.pet.kind === '고양이' ? CAT : DOG, { B: s.pet.kind === '고양이' ? '#78716c' : '#b45309' }, fx, H - 8); fx += 7; }
    if (s.car) sprite(ctx, CAR, { C: s.car.n === '수입차' ? '#111827' : s.car.n === 'SUV' ? '#166534' : '#2563eb', W: '#bae6fd', T: '#111827' }, W - 16, H - 9);
    const coins = Math.min(3, Math.floor(Math.max(0, S.netWorth(s)) / 30000));
    for (let i = 0; i < coins; i++) px(ctx, W - 22 + i * 3, H - 6, '#fbbf24', 2, 2);
    if (st === 'seek') { px(ctx, cx + 9, H - 22, '#f8fafc', 3, 3); px(ctx, cx + 10, H - 21, '#111827'); }
    if (s.mil.status === 'serving') { px(ctx, W - 30, H - 12, '#4d7c0f', 8, 8); px(ctx, W - 28, H - 10, '#a3e635', 4, 1); }
    if (st === 'univ' || st === 'school') { px(ctx, cx - 3, H - 8, '#1d4ed8', 2, 3); px(ctx, cx - 3, H - 8, '#93c5fd', 2, 1); }
  };
})();
