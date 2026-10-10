window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim;
  const P = KR.PIXEL = {};
  const W = 180, H = 72;
  P.STYLES = { home: '우리 집', town: '동네', road: '인생 길' };
  P.style = 'home';
  const season = m => m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  const SKY = { spring: ['#bcdcff', '#d9ebff', '#eef6ff'], summer: ['#6fb8ff', '#9ccfff', '#cfe8ff'], autumn: ['#f4c58f', '#f8dcb8', '#fbeedb'], winter: ['#b9c6d6', '#d2dbe6', '#e8edf3'] };
  const GROUND = { spring: ['#79c06f', '#5fa557'], summer: ['#5aa34f', '#468a3d'], autumn: ['#c89b57', '#a97d3f'], winter: ['#eef2f6', '#d5dde6'] };
  const LEAF = { spring: ['#f6a5c8', '#fbc7dd'], summer: ['#3f9a3a', '#5cb752'], autumn: ['#e2742b', '#f0a046'], winter: ['#9aa8b6', '#f4f7fa'] };
  const OUT = '#1c1a1f', SKIN = '#f3cba3', SKIN2 = '#d9a67c', WHITE = '#f8fafc';
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const sprite = (ctx, rows, pal, x, y) => { for (let j = 0; j < rows.length; j++) { const r = rows[j]; for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(ctx, x + i, y + j, c); } } };
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
  const digits = (ctx, str, x, y, c) => { for (const ch of String(str)) { const d = DIG[+ch]; if (d) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (d[j * 3 + i] === '1') px(ctx, x + i, y + j, c); x += 4; } };

  const ADULT = [
    '...oooooo...', '..ohhhhhho..', '.ohhhhhhhho.', '.ohhhhhhhHo.', '.oHffffffHo.', '.offffffffo.', '.ofewffewfo.', '.offffffffo.', '.offFmmFffo.', '..offffffo..', '...oFFFFo...',
    '..obbccbbo..', '.obbbbbbbbo.', '.obbbbbbbbo.', 'oabbbbbbbbao', 'oabbbbbbbbao', 'oaBbbbbbbBao', '.ooBBBBBBoo.', '..ollllllo..', '..ollLllLo..', '..olloollo..', '..olloollo..', '..ossoosso..', '..oooooooo..'];
  const LONGHAIR = ['...oooooo...', '..ohhhhhho..', '.ohhhhhhhho.', '.ohhhhhhhho.', 'ohHffffffHho', 'ohffffffffho', 'ohfewffewfho', 'ohffffffffho', 'ohffFmmFffho', 'ohhffffffhho', 'ohhhoFFFohho',
    '.oobbccbboo.', '.obbbbbbbbo.', '.obbbbbbbbo.', 'oabbbbbbbbao', 'oabbbbbbbbao', 'oaBbbbbbbBao', '.ooBBBBBBoo.', '..ollllllo..', '..ollLllLo..', '..olloollo..', '..olloollo..', '..ossoosso..', '..oooooooo..'];
  const CHILD = ['..oooooo..', '.ohhhhhho.', 'ohhhhhhhho', 'oHffffffHo', 'offffffffo', 'ofewffewfo', 'offFmmFffo', '.offffffo.', '..oFFFFo..', '.obbccbbo.', 'oabbbbbbao', 'oabbbbbbao', '.oBBBBBBo.', '..ollllo..', '..ollllo..', '..ol.olo..', '..oss.so..', '..oooooo..'];
  const BABY = ['..oooo..', '.ohhhho.', 'oHffffHo', 'ofewewfo', 'offmmffo', '.obbbbo.', 'oabbbbao', '.obbbbo.', '..osso..', '..oooo..'];
  const DOG = ['.oo....oo.', 'ohho..ohho', 'ohhhhhhhho', 'ohewhhhhho', 'ohhhhhmmo.', '.ohhhhhho.', '.oho..oho.', '.oo...oo..'];
  const CAT = ['oo.....oo.', 'ohho..ohho', 'ohhhhhhhho', 'ohewhhhwho', 'ohhhhmhho.', '.ohhhhhhoo', '.oho.oho.o', '.oo..oo...'];
  const CAR = ['......ooooooo.......', '.....ocwwcwwco......', '....ocwwwcwwwco.....', 'ooooocccccccccooooo.', 'occccccccccccccccco.', 'occcccccccccccccccco', 'oo.ooo.........ooo.o', '..otto.........otto.', '..oooo.........oooo.'];
  const BUS = ['.oooooooooooooooooooooo.', 'obbwwbwwbwwbwwbwwbwwbbbo', 'obbwwbwwbwwbwwbwwbwwbbbo', 'obbbbbbbbbbbbbbbbbbbbbbo', 'oyyyyyyyyyyyyyyyyyyyyyyo', '.oo.ooo..........ooo.oo.', '..otto............otto..', '..oooo............oooo..'];
  const TREE = ['....lll....', '..lllllll..', '.lllLllLll.', 'llLlllllLll', '.lllllLlll.', '..lLlllll..', '....ttt....', '....ttt....', '....ttt....'];
  const BARE = ['....t.t....', '...t.t.t...', '....ttt....', '...t.tt.t..', '....ttt....', '.....t.....', '....ttt....', '....ttt....', '....ttt....'];

  const carColor = s => s.car.n === '수입차' ? '#111827' : s.car.n === 'SUV' ? '#166534' : s.car.n === '경차' ? '#f59e0b' : '#2563eb';
  const wealthTier = s => Math.min(4, Math.floor(Math.max(0, S.netWorth(s)) / 30000));
  const fake = (sex, age, happy) => ({ stats: { happy, health: 80 }, flags: {}, age, mil: { status: 'na' }, work: { type: null, status: 'x' }, edu: { stage: 'done' }, hs: {}, sex });
  const hairFor = (sex, age) => age >= 64 ? '#cfd3d8' : age >= 52 ? '#6b6f76' : sex === 'F' ? '#3b2418' : '#1f1a17';
  const hairShadeFor = age => age >= 64 ? '#aeb4bb' : age >= 52 ? '#50545a' : '#120d0b';
  function parentsOf(s) {
    if (!(s.age < 19 || (s.housing === 'parents' && s.age < 30))) return [];
    const p = s.parents, out = [];
    const m = p.mother && p.mother.alive, f = p.father && p.father.alive;
    if (p.together) { if (f) out.push({ sex: 'M', age: p.father.age }); if (m) out.push({ sex: 'F', age: p.mother.age }); }
    else if (p.type === 'father') { if (f) out.push({ sex: 'M', age: p.father.age }); }
    else if (m) out.push({ sex: 'F', age: p.mother.age }); else if (f) out.push({ sex: 'M', age: p.father.age });
    return out;
  }
  const parentOutfit = (sex, age) => ({ hair: hairFor(sex, age), hairShade: hairShadeFor(age), body: sex === 'F' ? '#c2410c' : '#475569', bodyShade: sex === 'F' ? '#9a3412' : '#334155', collar: sex === 'F' ? '#fed7aa' : WHITE, legs: sex === 'F' ? '#7c2d12' : '#1f2937', legsShade: '#111827', shoes: '#111827' });
  const spouseOutfit = sp => ({ hair: hairFor(sp.sex, sp.age), hairShade: hairShadeFor(sp.age), body: sp.sex === 'F' ? '#db2777' : '#2563eb', bodyShade: sp.sex === 'F' ? '#9d174d' : '#1e40af', collar: WHITE, legs: sp.sex === 'F' ? '#7f1d1d' : '#1f2937', legsShade: '#111827', shoes: '#111827' });
  const kidOutfit = k => ({ hair: '#1f1a17', hairShade: '#120d0b', body: k.sex === 'M' ? '#38bdf8' : '#f9a8d4', bodyShade: k.sex === 'M' ? '#0284c7' : '#ec4899', collar: WHITE, legs: '#374151', legsShade: '#1f2937', shoes: '#111827' });

  function outfit(s) {
    const st = S.stageOf(s), w = s.work, a = s.age;
    const o = { hair: hairFor(s.sex, a), hairShade: hairShadeFor(a), body: '#7c8694', bodyShade: '#5e6775', collar: '#e5e7eb', legs: '#3d4451', legsShade: '#2b3039', shoes: '#111827', hat: null, badge: null, bag: null, tie: null };
    if (st === 'infant') { o.body = '#fbb6ce'; o.bodyShade = '#f28cb1'; o.legs = '#fbb6ce'; o.legsShade = '#f28cb1'; o.collar = '#fff'; }
    else if (st === 'school') { if (s.edu.stage === 'elem') { o.body = '#f5b23b'; o.bodyShade = '#d4921c'; o.collar = '#fff'; o.bag = '#d93d3d'; } else { o.body = '#243a73'; o.bodyShade = '#182856'; o.collar = '#fff'; o.tie = '#b91c1c'; o.bag = '#2f2f36'; } }
    else if (st === 'univ') { const top = s.edu.univ && s.edu.univ.tier >= 3; o.body = top ? '#6d28d9' : '#0f766e'; o.bodyShade = top ? '#4c1d95' : '#115e59'; o.collar = '#e2e8f0'; o.bag = '#f5b23b'; }
    else if (st === 'mil') { o.body = '#4f7a1e'; o.bodyShade = '#3b5c15'; o.legs = '#4f7a1e'; o.legsShade = '#3b5c15'; o.collar = '#4f7a1e'; o.hat = '#4f7a1e'; }
    else if (st === 'work') {
      const t = w.type;
      if (t === '의료' || t === '간호') { o.body = WHITE; o.bodyShade = '#d6dde6'; o.collar = '#93c5fd'; o.badge = '#ef4444'; }
      else if (t === '자영업') { o.body = '#b45309'; o.bodyShade = '#92400e'; o.collar = '#fde68a'; o.badge = '#fde68a'; }
      else if (t === '공장') { o.body = '#1d4ed8'; o.bodyShade = '#1e3a8a'; o.collar = '#1d4ed8'; o.hat = '#f59e0b'; }
      else if (t === '농업') { o.body = '#4b5563'; o.bodyShade = '#374151'; o.hat = '#e9c46a'; o.legs = '#1d4ed8'; o.legsShade = '#1e3a8a'; }
      else if (t === '프리랜서') { o.body = '#475569'; o.bodyShade = '#334155'; o.collar = '#cbd5e1'; }
      else if (t === '전문직' || t === '대기업') { o.body = '#1f2937'; o.bodyShade = '#111827'; o.collar = WHITE; o.tie = t === '전문직' ? '#d4af37' : '#b91c1c'; }
      else { o.body = '#334155'; o.bodyShade = '#1e293b'; o.collar = WHITE; o.tie = '#1d4ed8'; }
      o.legs = '#1f2937'; o.legsShade = '#111827';
    }
    else if (st === 'seek') { o.body = '#9ca3af'; o.bodyShade = '#6b7280'; o.collar = '#e5e7eb'; }
    else if (st === 'home') { o.body = '#fb7185'; o.bodyShade = '#e11d48'; o.collar = '#ffe4e6'; }
    else if (st === 'retire') { o.body = '#8b5a2b'; o.bodyShade = '#6b4423'; o.collar = '#f5e6d3'; o.legs = '#5b4636'; o.legsShade = '#3f3026'; }
    else if (st === 'care') { o.body = '#cbd5e1'; o.bodyShade = '#94a3b8'; o.collar = '#e2e8f0'; o.legs = '#cbd5e1'; o.legsShade = '#94a3b8'; }
    return o;
  }

  function face(ctx, x, y, happy, t, long) {
    const ox = long ? 1 : 0;
    const blink = Math.floor(t / 2800) % 7 === 0 && (t % 2800) < 160;
    if (blink) { px(ctx, x + 3 + ox, y + 6, OUT, 2, 1); px(ctx, x + 7 + ox, y + 6, OUT, 2, 1); }
    px(ctx, x + 3 + ox, y + 8, SKIN, 6, 1);
    if (happy >= 62) { px(ctx, x + 4 + ox, y + 8, '#b45309', 4, 1); px(ctx, x + 3 + ox, y + 7, '#b45309'); px(ctx, x + 8 + ox, y + 7, '#b45309'); px(ctx, x + 5 + ox, y + 9, '#fff', 2, 1); }
    else if (happy >= 38) px(ctx, x + 4 + ox, y + 8, '#9a3412', 4, 1);
    else { px(ctx, x + 4 + ox, y + 7, '#7f1d1d', 4, 1); px(ctx, x + 3 + ox, y + 8, '#7f1d1d'); px(ctx, x + 8 + ox, y + 8, '#7f1d1d'); if (happy < 25) px(ctx, x + 2 + ox, y + 7, '#60a5fa', 1, 2); }
    px(ctx, x + 2 + ox, y + 7, '#f4a3a3'); px(ctx, x + 9 + ox, y + 7, '#f4a3a3');
  }

  function person(ctx, s, x, y, o, long, t, bob) {
    const rows = long ? LONGHAIR : ADULT;
    const pal = { o: OUT, h: o.hair, H: o.hairShade, f: SKIN, F: SKIN2, e: '#1f2937', w: '#ffffff', m: '#9a3412', b: o.body, B: o.bodyShade, c: o.collar, a: SKIN, l: o.legs, L: o.legsShade, s: o.shoes };
    const yy = y + (bob ? 1 : 0);
    sprite(ctx, rows, pal, x, yy);
    face(ctx, x, yy, s.stats.happy, t, long);
    if (o.tie) { px(ctx, x + 5, yy + 11, o.tie, 2, 1); px(ctx, x + 5, yy + 12, o.tie, 2, 3); }
    if (o.badge) px(ctx, x + 3, yy + 13, o.badge, 2, 2);
    if (o.hat) { px(ctx, x + 1, yy + 0, OUT, 10, 1); px(ctx, x + 2, yy + 1, o.hat, 8, 3); px(ctx, x + 1, yy + 3, OUT, 11, 1); px(ctx, x + 1, yy + 4, o.hat, 10, 1); }
    if (o.bag) { px(ctx, x - 1, yy + 12, OUT, 1, 7); px(ctx, x - 3, yy + 13, OUT, 3, 6); px(ctx, x - 2, yy + 14, o.bag, 1, 4); px(ctx, x + 2, yy + 11, o.bag, 1, 7); }
    if (s.flags.glasses) { px(ctx, x + 2, yy + 5, OUT, 3, 1); px(ctx, x + 7, yy + 5, OUT, 3, 1); px(ctx, x + 2, yy + 6, OUT); px(ctx, x + 4, yy + 6, OUT); px(ctx, x + 7, yy + 6, OUT); px(ctx, x + 9, yy + 6, OUT); px(ctx, x + 5, yy + 6, OUT, 2, 1); }
    if (s.stats.health < 40) { px(ctx, x + 11, yy + 3, '#60a5fa'); px(ctx, x + 11, yy + 4, '#3b82f6', 1, 2); }
    if (s.age >= 78 || (s.age >= 65 && s.stats.health < 45)) { px(ctx, x + 13, yy + 13, '#7c2d12', 1, 10); px(ctx, x + 12, yy + 13, '#7c2d12', 3, 1); }
    if (s.mil.status === 'serving') px(ctx, x + 11, yy + 10, '#1f2937', 1, 9);
    const st = S.stageOf(s);
    if (st === 'seek') { px(ctx, x + 12, yy - 6, WHITE, 6, 6); px(ctx, x + 12, yy, WHITE, 2, 1); px(ctx, x + 14, yy - 5, '#111827', 2, 1); px(ctx, x + 15, yy - 4, '#111827'); px(ctx, x + 14, yy - 2, '#111827'); }
    if (st === 'work' && s.work.type === '프리랜서') { px(ctx, x + 12, yy + 13, '#cbd5e1', 5, 4); px(ctx, x + 13, yy + 14, '#60a5fa', 3, 2); }
    if (st === 'work' && ['중소', '중견', '대기업', '공공'].includes(s.work.type)) px(ctx, x + 12, yy + 15, '#111827', 4, 5);
  }

  function child(ctx, s, x, y, o, t, bob, happy) {
    const pal = { o: OUT, h: o.hair, H: o.hairShade, f: SKIN, F: SKIN2, e: '#1f2937', w: '#fff', m: '#9a3412', b: o.body, B: o.bodyShade, c: o.collar, a: SKIN, l: o.legs, L: o.legsShade, s: o.shoes };
    const yy = y + (bob ? 1 : 0);
    sprite(ctx, CHILD, pal, x, yy);
    px(ctx, x + 3, yy + 6, SKIN, 4, 1);
    if (happy >= 55) { px(ctx, x + 3, yy + 6, '#b45309', 4, 1); px(ctx, x + 2, yy + 5, '#b45309'); px(ctx, x + 7, yy + 5, '#b45309'); } else if (happy >= 35) px(ctx, x + 3, yy + 6, '#9a3412', 4, 1); else { px(ctx, x + 3, yy + 5, '#7f1d1d', 4, 1); }
    if (o.bag) { px(ctx, x - 2, yy + 10, OUT, 3, 5); px(ctx, x - 1, yy + 11, o.bag, 1, 3); }
    if (s && s.flags && s.flags.glasses) { px(ctx, x + 1, yy + 5, OUT, 3, 1); px(ctx, x + 6, yy + 5, OUT, 3, 1); }
  }
  const baby = (ctx, x, y, hair, body) => sprite(ctx, BABY, { o: OUT, h: hair, H: '#120d0b', f: SKIN, e: '#1f2937', w: '#fff', m: '#b45309', b: body, a: SKIN, s: body }, x, y);
  const pet = (ctx, s, x, y) => sprite(ctx, s.pet.kind === '고양이' ? CAT : DOG, { o: OUT, h: s.pet.kind === '고양이' ? '#9ca3af' : '#c2783a', e: '#111827', w: '#fff', m: '#111827' }, x, y);
  const heart = (ctx, x, y, c) => { px(ctx, x + 1, y, c); px(ctx, x + 3, y, c); px(ctx, x, y + 1, c, 5, 1); px(ctx, x + 1, y + 2, c, 3, 1); px(ctx, x + 2, y + 3, c); };

  function family(ctx, s, x, base, t, bob, opts = {}) {
    const o = outfit(s), kids = s.kids.filter(k => k.alive && k.home !== false && s.year - k.by < 20).slice(0, 3);
    let fx = x;
    for (const p of parentsOf(s)) { person(ctx, fake(p.sex, p.age, s.stats.happy), fx, base - 24, parentOutfit(p.sex, p.age), p.sex === 'F' && p.age < 60, t + (p.sex === 'F' ? 500 : 1300), p.sex === 'F' ? !bob : bob); fx += 16; }
    const me = fx;
    if (s.age < 2) baby(ctx, me + 2, base - 10 + (bob ? 1 : 0), o.hair, '#fda4af');
    else if (s.age < 12) child(ctx, s, me, base - 18, o, t, bob, s.stats.happy);
    else person(ctx, s, me, base - 24, o, s.sex === 'F' && s.age < 60, t, bob);
    fx += s.age < 12 ? 14 : 18;
    if (s.love.married && s.love.spouse && s.love.spouse.alive) { const sp = s.love.spouse; person(ctx, fake(sp.sex, sp.age, s.stats.happy), fx, base - 24, spouseOutfit(sp), sp.sex === 'F' && sp.age < 60, t + 900, !bob); heart(ctx, me + 12, base - 30, '#ef4444'); fx += 18; }
    else if (s.love.partner) heart(ctx, me + 12, base - 30, '#f472b6');
    for (const k of kids) { const ka = s.year - k.by, ko = kidOutfit(k); if (ka < 2) baby(ctx, fx, base - 10, '#1f1a17', ko.body); else child(ctx, null, fx, base - 18, ko, t, !bob, s.stats.happy); fx += 13; }
    if (s.pet && !opts.noPet) { pet(ctx, s, fx, base - 8); fx += 12; }
    return { me, end: fx };
  }

  function house(ctx, s, x, base, se, t) {
    const h = s.housing;
    const win = (wx, wy, lit) => { px(ctx, wx, wy, OUT, 4, 4); px(ctx, wx + 1, wy + 1, lit ? '#fde68a' : '#9fb7d6', 2, 2); };
    if (s.abroad) { px(ctx, x, base - 14, OUT, 22, 14); px(ctx, x + 1, base - 13, '#c4b5a5', 20, 12); for (let i = 0; i < 3; i++) win(x + 2 + i * 7, base - 10, i !== 1); px(ctx, x + 9, base - 6, '#5b3a21', 4, 6); px(ctx, x + 24, base - 20, '#8b8f99', 1, 20); px(ctx, x + 25, base - 20, '#dc2626', 6, 2); px(ctx, x + 25, base - 18, '#ffffff', 6, 2); px(ctx, x + 25, base - 16, '#2563eb', 6, 2); return; }
    if (h === 'own') {
      const fl = 12; px(ctx, x, base - 2 - fl * 4, OUT, 26, fl * 4 + 2); px(ctx, x + 1, base - 1 - fl * 4, '#b9bfc9', 24, fl * 4); px(ctx, x + 1, base - 1 - fl * 4, '#d6dbe3', 24, 1);
      for (let r = 0; r < fl; r++) { px(ctx, x + 1, base - 1 - fl * 4 + r * 4 + 3, '#8d95a3', 24, 1); for (let c = 0; c < 4; c++) win(x + 3 + c * 6, base - fl * 4 + r * 4 - 1, (r * 3 + c + Math.floor(t / 4000)) % 3 !== 0); }
      px(ctx, x + 10, base - 6, OUT, 6, 6); px(ctx, x + 11, base - 5, '#60a5fa', 4, 5); px(ctx, x + 4, base - 5 - fl * 4, OUT, 6, 3); px(ctx, x + 5, base - 4 - fl * 4, '#e5e7eb', 4, 1);
      return;
    }
    if (h === 'jeonse') {
      px(ctx, x + 2, base - 24, OUT, 20, 24); px(ctx, x + 3, base - 23, '#d9c7b0', 18, 22); px(ctx, x + 3, base - 23, '#efe3d1', 18, 1);
      for (let r = 0; r < 3; r++) { px(ctx, x + 3, base - 17 + r * 7, '#b8a58c', 18, 1); win(x + 5, base - 22 + r * 7, r !== 1); win(x + 14, base - 22 + r * 7, r === 1); }
      px(ctx, x + 10, base - 5, OUT, 4, 5); px(ctx, x + 11, base - 4, '#7c2d12', 2, 4); px(ctx, x + 22, base - 12, '#8d95a3', 1, 12); px(ctx, x + 22, base - 10, '#8d95a3', 3, 1); px(ctx, x + 22, base - 7, '#8d95a3', 3, 1);
      return;
    }
    if (h === 'monthly') {
      px(ctx, x + 4, base - 16, OUT, 16, 16); px(ctx, x + 5, base - 15, '#8f8a84', 14, 14); px(ctx, x + 5, base - 15, '#aca69f', 14, 1);
      win(x + 7, base - 12, true); win(x + 13, base - 12, false); px(ctx, x + 9, base - 5, OUT, 4, 5); px(ctx, x + 10, base - 4, '#374151', 2, 4);
      px(ctx, x + 6, base - 19, OUT, 12, 3); px(ctx, x + 7, base - 18, '#fde047', 10, 1);
      return;
    }
    if (h === 'care') {
      px(ctx, x, base - 20, OUT, 26, 20); px(ctx, x + 1, base - 19, '#e8eef5', 24, 18); px(ctx, x + 1, base - 19, '#f8fbff', 24, 1);
      for (let c = 0; c < 4; c++) { win(x + 3 + c * 6, base - 15, c % 2 === 0); win(x + 3 + c * 6, base - 9, c % 2 === 1); }
      px(ctx, x + 11, base - 25, OUT, 5, 5); px(ctx, x + 13, base - 24, '#dc2626', 1, 3); px(ctx, x + 12, base - 23, '#dc2626', 3, 1); px(ctx, x + 11, base - 4, OUT, 4, 4); px(ctx, x + 12, base - 3, '#93c5fd', 2, 3);
      return;
    }
    px(ctx, x + 2, base - 13, OUT, 22, 13); px(ctx, x + 3, base - 12, '#e7cfae', 20, 11); px(ctx, x + 3, base - 2, '#c9ad88', 20, 1);
    for (let i = 0; i < 7; i++) { px(ctx, x + i, base - 13 - i, OUT, 26 - i * 2, 1); if (i < 6) px(ctx, x + i + 1, base - 13 - i, i % 2 ? '#b91c1c' : '#dc2626', 24 - i * 2, 1); }
    px(ctx, x + 18, base - 22, OUT, 4, 7); px(ctx, x + 19, base - 21, '#6b4423', 2, 5);
    if (se === 'winter') { const k = Math.floor(t / 400) % 4; px(ctx, x + 19 + (k > 1 ? 1 : 0), base - 25 - k, '#e5e7eb', 2, 2); }
    win(x + 5, base - 9, true); win(x + 16, base - 9, false); px(ctx, x + 10, base - 6, OUT, 5, 6); px(ctx, x + 11, base - 5, '#7c2d12', 3, 5); px(ctx, x + 13, base - 3, '#fbbf24');
    for (let i = 0; i < 4; i++) px(ctx, x + 26 + i * 3, base - 4, '#d9b991', 1, 4); px(ctx, x + 26, base - 3, '#d9b991', 11, 1);
  }

  function tree(ctx, x, base, se, t) {
    const pal = { l: LEAF[se][0], L: LEAF[se][1], t: '#6b4423' };
    sprite(ctx, se === 'winter' ? BARE : TREE, pal, x, base - 9);
    if (se === 'winter') px(ctx, x + 2, base - 9, '#ffffff', 7, 1);
  }
  function stageBuilding(ctx, s, x, base, t) {
    const st = S.stageOf(s), e = s.edu.stage;
    const win = (wx, wy, lit) => { px(ctx, wx, wy, OUT, 3, 3); px(ctx, wx + 1, wy + 1, lit ? '#fde68a' : '#9fb7d6'); };
    const block = (w, h, c, c2) => { px(ctx, x, base - h, OUT, w, h); px(ctx, x + 1, base - h + 1, c, w - 2, h - 2); px(ctx, x + 1, base - h + 1, c2, w - 2, 1); };
    const flag = (fx, fy, c) => { px(ctx, fx, fy, '#6b7280', 1, 8); px(ctx, fx + 1, fy, c, 4, 2); };
    if (st === 'school' || (s.age >= 6 && s.age < 19 && e !== 'none')) { const hi = e === 'high' || e === 'mid'; block(30, 18, hi ? '#d7d3cc' : '#f3d9a4', hi ? '#ece9e3' : '#fae7c2'); for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) win(x + 3 + c * 5, base - 15 + r * 6, (r + c) % 2 === 0); px(ctx, x + 13, base - 5, OUT, 4, 5); px(ctx, x + 14, base - 4, '#7c2d12', 2, 4); flag(x + 27, base - 26, '#dc2626'); px(ctx, x + 28, base - 25, '#2563eb', 2, 1); return; }
    if (st === 'univ') { block(32, 22, '#b6553f', '#d07a62'); for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) win(x + 3 + c * 6, base - 19 + r * 6, (r * 2 + c) % 3 !== 0); px(ctx, x + 12, base - 30, OUT, 8, 8); px(ctx, x + 13, base - 29, '#e5e7eb', 6, 6); px(ctx, x + 15, base - 27, OUT, 1, 2); px(ctx, x + 16, base - 26, OUT, 2, 1); px(ctx, x + 13, base - 5, OUT, 6, 5); px(ctx, x + 14, base - 4, '#5b3a21', 4, 4); return; }
    if (st === 'mil') { block(30, 12, '#4f7a1e', '#6b9a2c'); for (let c = 0; c < 4; c++) win(x + 3 + c * 7, base - 8, c % 2 === 0); flag(x + 27, base - 20, '#dc2626'); px(ctx, x + 28, base - 19, '#2563eb', 2, 1); return; }
    if (st === 'work') { const big = ['대기업', '전문직', '공공'].includes(s.work.type); if (s.work.type === '자영업') { block(26, 14, '#f5f0e6', '#fff'); px(ctx, x, base - 17, OUT, 26, 3); px(ctx, x + 1, base - 16, '#dc2626', 24, 1); px(ctx, x + 3, base - 11, OUT, 20, 8); px(ctx, x + 4, base - 10, '#bfe3ff', 18, 6); px(ctx, x + 10, base - 5, OUT, 6, 5); px(ctx, x + 11, base - 4, '#6b7280', 4, 4); return; } if (s.work.type === '농업') { for (let i = 0; i < 5; i++) px(ctx, x + i * 6, base - 6, '#4d7c0f', 3, 6); px(ctx, x + 10, base - 12, '#dc2626', 8, 1); px(ctx, x + 9, base - 11, OUT, 10, 5); px(ctx, x + 10, base - 10, '#f59e0b', 8, 3); return; } if (s.work.type === '공장') { block(34, 14, '#9ca3af', '#c7ccd3'); px(ctx, x + 4, base - 24, OUT, 5, 10); px(ctx, x + 5, base - 23, '#6b7280', 3, 9); px(ctx, x + 6, base - 27 - Math.floor(t / 300) % 3, '#d1d5db', 3, 2); for (let c = 0; c < 5; c++) win(x + 4 + c * 6, base - 9, true); return; } const h = big ? 40 : 24; block(28, h, big ? '#5b6b85' : '#8d95a3', big ? '#94a3b8' : '#b5bcc6'); for (let r = 0; r < Math.floor((h - 4) / 5); r++) for (let c = 0; c < 4; c++) win(x + 3 + c * 6, base - h + 3 + r * 5, (r * 2 + c + Math.floor(t / 5000)) % 4 !== 0); px(ctx, x + 11, base - 5, OUT, 6, 5); px(ctx, x + 12, base - 4, '#60a5fa', 4, 4); return; }
    if (st === 'seek') { block(22, 12, '#e5e7eb', '#fff'); px(ctx, x + 3, base - 9, OUT, 16, 6); px(ctx, x + 4, base - 8, '#fde68a', 14, 4); px(ctx, x + 6, base - 7, '#1f2937', 3, 1); px(ctx, x + 11, base - 7, '#1f2937', 4, 1); px(ctx, x + 6, base - 6, '#1f2937', 9, 1); return; }
    if (st === 'home' || (s.kids.length && s.kids.some(k => k.alive && s.year - k.by < 12))) { px(ctx, x + 2, base - 10, '#6b7280', 1, 10); px(ctx, x + 10, base - 10, '#6b7280', 1, 10); px(ctx, x + 2, base - 10, '#ef4444', 9, 1); px(ctx, x + 5, base - 9, '#1f2937', 1, 6); px(ctx, x + 7, base - 9, '#1f2937', 1, 6); px(ctx, x + 4, base - 3, '#f59e0b', 5, 1); px(ctx, x + 14, base - 12, '#2563eb', 1, 12); px(ctx, x + 15, base - 12, '#2563eb', 8, 1); for (let i = 0; i < 8; i++) px(ctx, x + 22 + i, base - 11 + i, '#f59e0b', 2, 1); return; }
    if (st === 'retire') { px(ctx, x, base - 6, '#7c2d12', 16, 2); px(ctx, x + 1, base - 4, '#7c2d12', 1, 4); px(ctx, x + 14, base - 4, '#7c2d12', 1, 4); px(ctx, x, base - 10, '#7c2d12', 16, 1); px(ctx, x + 1, base - 9, '#7c2d12', 1, 3); px(ctx, x + 14, base - 9, '#7c2d12', 1, 3); for (let i = 0; i < 3; i++) px(ctx, x + 20 + i * 4, base - 3 - i % 2, '#fb7185', 2, 2); px(ctx, x + 21, base - 1, '#4d7c0f', 9, 1); return; }
    if (st === 'care') { block(28, 20, '#e8eef5', '#f8fbff'); for (let c = 0; c < 4; c++) { win(x + 3 + c * 6, base - 15, c % 2 === 0); win(x + 3 + c * 6, base - 9, c % 2 === 1); } px(ctx, x + 12, base - 25, OUT, 5, 5); px(ctx, x + 14, base - 24, '#dc2626', 1, 3); px(ctx, x + 13, base - 23, '#dc2626', 3, 1); }
  }

  function sky(ctx, s, se, frac, t, gy) {
    const sk = SKY[se];
    px(ctx, 0, 0, sk[0], W, Math.round(gy * 0.35)); px(ctx, 0, Math.round(gy * 0.35), sk[1], W, Math.round(gy * 0.3)); px(ctx, 0, Math.round(gy * 0.65), sk[2], W, gy - Math.round(gy * 0.65));
    const sx = 8 + Math.round(frac * (W - 24)), sy = 6 + Math.round(Math.sin(frac * Math.PI) * -4) + 6;
    px(ctx, sx - 1, sy, '#fde68a', 7, 5); px(ctx, sx, sy - 1, '#fde68a', 5, 7); px(ctx, sx, sy, '#fbbf24', 5, 5); px(ctx, sx + 1, sy + 1, '#fef3c7', 2, 1);
    const cloud = (cx, cy) => { px(ctx, cx + 2, cy, '#ffffff', 8, 1); px(ctx, cx, cy + 1, '#ffffff', 12, 2); px(ctx, cx + 1, cy + 3, '#e5e7eb', 10, 1); };
    cloud(((t / 150) + 20) % (W + 20) - 12, 8); cloud(((t / 240) + 100) % (W + 20) - 12, 18); cloud(((t / 200) + 60) % (W + 20) - 12, 4);
  }
  function weather(ctx, se, t, gy) {
    if (se === 'spring') for (let i = 0; i < 18; i++) px(ctx, (i * 23 + Math.floor(t / 90)) % W, (i * 7 + Math.floor(t / 130)) % (gy - 4), i % 2 ? '#f9a8d4' : '#fbcfe8');
    if (se === 'autumn') for (let i = 0; i < 14; i++) px(ctx, (i * 29 + Math.floor(t / 110)) % W, (i * 9 + Math.floor(t / 150)) % (gy - 4), i % 2 ? '#ea580c' : '#f59e0b');
    if (se === 'winter') for (let i = 0; i < 34; i++) px(ctx, (i * 19 + Math.floor(t / 160)) % W, (i * 11 + Math.floor(t / 70)) % (gy - 2), '#ffffff');
    if (se === 'summer') for (let i = 0; i < 3; i++) { const bx = (i * 61 + Math.floor(t / 60)) % (W + 10) - 5, by = 10 + i * 8; px(ctx, bx, by, '#1f2937'); px(ctx, bx + 2, by, '#1f2937'); px(ctx, bx + 1, by + 1, '#1f2937'); }
  }
  function skyline(ctx, s, se, t, gy) {
    const r = D.regions[s.region];
    const coastal = ['부산', '제주', '강원', '울산', '인천', '전남', '경남'].includes(r.short) && !s.abroad;
    const m = [[0, 9, 'a'], [22, 14, 'b'], [48, 10, 'a'], [70, 17, 'b'], [100, 11, 'a'], [124, 15, 'b'], [150, 10, 'a'], [172, 13, 'b']];
    for (const [mx, mh, k] of m) for (let i = 0; i < mh; i++) px(ctx, mx - i, gy - 1 - (mh - 1 - i), k === 'a' ? '#9fb4c7' : '#7f97ad', (i * 2) + 1, 1);
    if (se === 'winter') for (const [mx, mh] of m) px(ctx, mx, gy - mh, '#ffffff', 1, 2);
    if (coastal) { px(ctx, 0, gy - 8, '#7cc3ea', W, 8); px(ctx, 0, gy - 8, '#a8d8f0', W, 1); for (let i = 0; i < 9; i++) px(ctx, (i * 23 + Math.floor(t / 300)) % W, gy - 5 + (i % 3), '#ffffff', 3, 1); }
    else if (r.capital && !s.abroad) { for (let i = 0; i < 7; i++) { const bx = 60 + i * 17, bh = 14 + (i * 5) % 12; px(ctx, bx, gy - bh, '#6b7a8f', 10, bh); px(ctx, bx, gy - bh, '#8e9bad', 10, 1); for (let r2 = 1; r2 < bh - 1; r2 += 3) for (let c = 1; c < 9; c += 3) px(ctx, bx + c, gy - bh + r2, (r2 + c + i + Math.floor(t / 6000)) % 4 ? '#fde68a' : '#3b4452', 2, 1); } px(ctx, 44, gy - 30, '#6b7280', 1, 20); px(ctx, 43, gy - 31, '#9ca3af', 3, 1); px(ctx, 42, gy - 22, '#6b7280', 5, 3); px(ctx, 44, gy - 32, '#ef4444'); }
    else if (['대구', '대전', '광주', '울산', '세종'].includes(r.short) && !s.abroad) for (let i = 0; i < 4; i++) { const bx = 80 + i * 20, bh = 10 + (i * 3) % 6; px(ctx, bx, gy - bh, '#8d95a3', 9, bh); for (let r2 = 1; r2 < bh - 1; r2 += 3) px(ctx, bx + 2, gy - bh + r2, '#fde68a', 2, 1); }
    else for (let i = 0; i < 4; i++) { const bx = 90 + i * 22; for (let j = 0; j < 4; j++) px(ctx, bx + j, gy - 4 - j, '#5b4a3a', 10 - j * 2, 1); px(ctx, bx + 2, gy - 3, '#c9ad88', 6, 3); }
  }

  function renderTown(ctx, s, se, frac, t, bob) {
    const GY = H - 12;
    sky(ctx, s, se, frac, t, GY);
    skyline(ctx, s, se, t, GY);
    px(ctx, 0, GY, GROUND[se][0], W, H - GY); px(ctx, 0, GY, GROUND[se][1], W, 1);
    for (let i = 0; i < 30; i++) px(ctx, (i * 29 + 5) % W, GY + 2 + (i % 5), GROUND[se][1], 2, 1);
    px(ctx, 0, H - 6, '#6b7280', W, 6); px(ctx, 0, H - 6, '#4b5563', W, 1); for (let i = 0; i < 23; i++) px(ctx, i * 8 + 2, H - 3, '#f5f5f4', 4, 1);
    const bx = (Math.floor(t / 40) % (W + 60)) - 30; sprite(ctx, BUS, { o: OUT, b: s.year < 1990 ? '#2563eb' : '#16a34a', w: '#bfe3ff', y: '#fde047', t: '#374151' }, W - bx, H - 10);
    house(ctx, s, 3, GY + 1, se, t);
    tree(ctx, 42, GY + 1, se, t); tree(ctx, W - 14, GY + 1, se, t);
    stageBuilding(ctx, s, 120, GY + 1, t);
    const f = family(ctx, s, 56, GY + 1, t, bob);
    if (s.car) sprite(ctx, CAR, { o: OUT, c: carColor(s), w: '#bfe3ff', t: '#4b5563' }, Math.max(f.end + 2, 100), GY - 7);
    const coins = wealthTier(s); for (let i = 0; i < coins; i++) { px(ctx, 32 + i * 4, GY - 3 - (i % 2), OUT, 4, 4); px(ctx, 33 + i * 4, GY - 2 - (i % 2), '#fbbf24', 2, 2); }
    if (S.stageOf(s) === 'school' || S.stageOf(s) === 'univ') { px(ctx, f.me - 10, GY - 5, OUT, 7, 5); px(ctx, f.me - 9, GY - 4, '#1d4ed8', 5, 3); px(ctx, f.me - 9, GY - 4, '#93c5fd', 5, 1); }
    weather(ctx, se, t, GY);
    digits(ctx, s.year, W - 17, 2, '#ffffff');
  }

  function renderHome(ctx, s, se, frac, t, bob) {
    const h = s.housing, tier = wealthTier(s), FY = H - 10;
    const wall = h === 'care' ? '#eef2f7' : h === 'monthly' ? '#cfc8bd' : h === 'jeonse' ? '#e9e2d3' : h === 'own' ? '#f1e7d8' : '#efe0c8';
    const wall2 = h === 'care' ? '#dfe6ee' : h === 'monthly' ? '#bdb5a9' : h === 'jeonse' ? '#ddd4c2' : h === 'own' ? '#e2d4bf' : '#e2cfae';
    const floor = h === 'care' ? '#c9d2dc' : h === 'monthly' ? '#8b7355' : '#b98b58';
    const narrow = h === 'monthly' ? 24 : 0;
    px(ctx, 0, 0, '#23262e', W, H);
    px(ctx, narrow, 0, wall, W - narrow * 2, FY); px(ctx, narrow, FY, floor, W - narrow * 2, H - FY); px(ctx, narrow, FY, '#7c5a36', W - narrow * 2, 1);
    for (let i = 0; i < 40; i++) px(ctx, narrow + (i * 13) % (W - narrow * 2 - 2), 3 + (i * 7) % (FY - 6), wall2, 2, 1);
    if (h === 'own') { px(ctx, narrow, 0, '#d9c9b3', W - narrow * 2, 2); px(ctx, narrow, FY - 3, '#d9c9b3', W - narrow * 2, 3); }
    const wx = narrow + 8, wy = 6, ww = h === 'monthly' ? 20 : 34, wh = 22;
    px(ctx, wx - 1, wy - 1, OUT, ww + 2, wh + 2); const sk = SKY[se]; px(ctx, wx, wy, sk[0], ww, 8); px(ctx, wx, wy + 8, sk[1], ww, 7); px(ctx, wx, wy + 15, sk[2], ww, wh - 15);
    const sunX = wx + 2 + Math.round(frac * (ww - 9)), sunY = wy + 3 + Math.round(Math.sin(frac * Math.PI) * -2) + 2; px(ctx, sunX, sunY, '#fbbf24', 5, 5); px(ctx, sunX + 1, sunY + 1, '#fef3c7', 2, 1);
    const r = D.regions[s.region];
    if (r.capital && !s.abroad) for (let i = 0; i < 4; i++) { const bh = 6 + (i * 3) % 6; px(ctx, wx + 1 + i * 8, wy + wh - bh, '#6b7a8f', 6, bh); } else for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) px(ctx, wx + 2 + i * 11 - j, wy + wh - 5 + j, '#9fb4c7', 1 + j * 2, 1);
    px(ctx, wx, wy + wh - 4, GROUND[se][0], ww, 4);
    if (se === 'winter') for (let i = 0; i < 10; i++) px(ctx, wx + (i * 7 + Math.floor(t / 160)) % ww, wy + (i * 5 + Math.floor(t / 70)) % wh, '#ffffff');
    if (se === 'spring') for (let i = 0; i < 6; i++) px(ctx, wx + (i * 11 + Math.floor(t / 90)) % ww, wy + (i * 5 + Math.floor(t / 130)) % wh, '#f9a8d4');
    if (se === 'autumn') for (let i = 0; i < 5; i++) px(ctx, wx + (i * 13 + Math.floor(t / 110)) % ww, wy + (i * 7 + Math.floor(t / 150)) % wh, '#ea580c');
    if (s.car) sprite(ctx, CAR, { o: OUT, c: carColor(s), w: '#bfe3ff', t: '#4b5563' }, wx + ww - 21, wy + wh - 9);
    px(ctx, wx + Math.floor(ww / 2), wy, OUT, 1, wh); px(ctx, wx - 3, wy - 2, '#b45309', 2, wh + 4); px(ctx, wx + ww + 1, wy - 2, '#b45309', 2, wh + 4);
    const cx = W - narrow - 46, cy = 6;
    px(ctx, cx, cy, OUT, 26, 20); px(ctx, cx + 1, cy + 1, '#ffffff', 24, 18); px(ctx, cx + 1, cy + 1, '#dc2626', 24, 5); digits(ctx, s.year, cx + 5, cy + 2, '#ffffff');
    const month = Math.min(12, Math.floor(frac * 12) + 1);
    for (let i = 0; i < 12; i++) { const mx = cx + 2 + (i % 6) * 4, my = cy + 8 + Math.floor(i / 6) * 5; px(ctx, mx, my, i + 1 === month ? '#f59e0b' : i + 1 < month ? '#9ca3af' : '#d1d5db', 3, 4); }
    const kx = cx - 15, ky = 9; px(ctx, kx, ky, OUT, 11, 11); px(ctx, kx + 1, ky + 1, '#ffffff', 9, 9); const ang = frac * Math.PI * 2 - Math.PI / 2; for (let i = 0; i < 4; i++) px(ctx, kx + 5 + Math.round(Math.cos(ang) * i), ky + 5 + Math.round(Math.sin(ang) * i), OUT); px(ctx, kx + 5, ky + 5, '#dc2626');
    let shelfX = narrow + 50;
    if (s.love.married && s.love.spouse) { px(ctx, shelfX, 10, '#92400e', 12, 10); px(ctx, shelfX + 1, 11, '#fde68a', 10, 8); px(ctx, shelfX + 3, 13, '#ef4444', 2, 2); px(ctx, shelfX + 7, 13, '#2563eb', 2, 2); px(ctx, shelfX + 3, 16, SKIN, 6, 1); shelfX += 16; }
    if (s.edu.degree === '대졸' || s.edu.degree === '대학원졸') { px(ctx, shelfX, 10, '#1f2937', 12, 10); px(ctx, shelfX + 1, 11, '#f8fafc', 10, 8); px(ctx, shelfX + 3, 13, '#9ca3af', 6, 1); px(ctx, shelfX + 3, 15, '#9ca3af', 6, 1); px(ctx, shelfX + 5, 17, '#dc2626', 2, 2); shelfX += 16; }
    if (s.mil.status === 'done') { px(ctx, shelfX, 10, '#4f7a1e', 8, 10); px(ctx, shelfX + 2, 12, '#fbbf24', 4, 4); px(ctx, shelfX + 3, 16, '#fbbf24', 2, 3); shelfX += 12; }
    const books = Math.min(10, Math.round(s.stats.know / 10));
    px(ctx, W - narrow - 40, FY - 30, '#7c4a1e', 32, 30); px(ctx, W - narrow - 39, FY - 29, '#a16207', 30, 28);
    for (let r2 = 0; r2 < 3; r2++) { px(ctx, W - narrow - 39, FY - 20 + r2 * 9, '#7c4a1e', 30, 1); for (let i = 0; i < Math.min(9, Math.max(0, books - r2 * 3)); i++) px(ctx, W - narrow - 38 + i * 3, FY - 28 + r2 * 9, ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'][(i + r2) % 5], 2, 7); }
    const tv = tier >= 3 ? 26 : tier >= 1 ? 18 : 12; const tvx = narrow + 6, tvy = FY - 8 - tv * 0.6;
    px(ctx, tvx, FY - 7, '#4b5563', tv + 4, 6); px(ctx, tvx + 2, tvy, OUT, tv, Math.round(tv * 0.6)); px(ctx, tvx + 3, tvy + 1, Math.floor(t / 900) % 2 ? '#60a5fa' : '#93c5fd', tv - 2, Math.round(tv * 0.6) - 2);
    const dx = narrow + 42, dy = FY - 12;
    px(ctx, dx, dy, '#92400e', 30, 2); px(ctx, dx + 1, dy + 2, '#92400e', 2, 10); px(ctx, dx + 27, dy + 2, '#92400e', 2, 10);
    const items = s.items || [];
    if (items.some(i => i.k === 'pc')) { px(ctx, dx + 4, dy - 10, OUT, 12, 10); px(ctx, dx + 5, dy - 9, '#93c5fd', 10, 8); px(ctx, dx + 18, dy - 8, '#d1d5db', 4, 8); }
    else if (items.some(i => i.k === 'laptop')) { px(ctx, dx + 6, dy - 7, OUT, 11, 7); px(ctx, dx + 7, dy - 6, '#93c5fd', 9, 5); }
    else { px(ctx, dx + 6, dy - 3, '#fde68a', 8, 3); px(ctx, dx + 7, dy - 2, '#9ca3af', 6, 1); }
    if (items.some(i => i.k === 'smartphone' || i.k === 'phone')) px(ctx, dx + 22, dy - 3, OUT, 3, 3);
    if (s.stats.health < 45 || s.hs.cancer) { px(ctx, dx + 25, dy - 5, '#f97316', 3, 5); px(ctx, dx + 25, dy - 6, '#ffffff', 3, 1); }
    if (tier >= 2) { const sx2 = narrow + 92; px(ctx, sx2, FY - 10, '#7f1d1d', 36, 10); px(ctx, sx2 + 2, FY - 14, '#991b1b', 32, 5); px(ctx, sx2, FY - 12, '#991b1b', 4, 12); px(ctx, sx2 + 32, FY - 12, '#991b1b', 4, 12); }
    if (s.stats.happy >= 60) { px(ctx, W - narrow - 8, FY - 6, '#b45309', 5, 6); px(ctx, W - narrow - 9, FY - 12, '#16a34a', 7, 6); px(ctx, W - narrow - 7, FY - 15, '#22c55e', 3, 3); }
    if (tier >= 1) { for (let i = 0; i < tier; i++) { px(ctx, narrow + 8 + i * 4, FY + 2, OUT, 4, 4); px(ctx, narrow + 9 + i * 4, FY + 3, '#fbbf24', 2, 2); } }
    const f = family(ctx, s, narrow + 44, FY + 2, t, bob, { noPet: true });
    if (s.pet) pet(ctx, s, Math.min(f.end + 4, W - narrow - 46), FY - 6);
    if (h === 'care') { px(ctx, W - narrow - 70, FY - 22, '#6b7280', 1, 22); px(ctx, W - narrow - 73, FY - 24, '#6b7280', 7, 2); px(ctx, W - narrow - 72, FY - 20, '#ef4444', 4, 6); }
    if (s.age < 2) { px(ctx, f.me - 4, FY - 10, '#92400e', 16, 2); px(ctx, f.me - 4, FY - 8, '#92400e', 1, 10); px(ctx, f.me + 11, FY - 8, '#92400e', 1, 10); for (let i = 0; i < 6; i++) px(ctx, f.me - 2 + i * 2, FY - 8, '#b45309', 1, 8); }
    if (s.flags.movedCapital && h === 'monthly') { px(ctx, narrow + 2, FY - 20, '#7c2d12', 1, 20); px(ctx, narrow + 3, FY - 19, '#f59e0b', 3, 2); }
  }

  const ROAD_MARKS = s => {
    const m = [];
    const put = (ok, c, tag) => { if (ok) m.push([c, tag]); };
    put(s.age >= 6, '#f59e0b', 'school'); put(s.edu.univ, '#6d28d9', 'univ'); put(s.mil.status === 'done', '#4f7a1e', 'mil'); put(s.work.mainType, '#2563eb', 'work'); put(s.love.marriedAt != null, '#ef4444', 'wed'); put(s.kids.length, '#f9a8d4', 'kid'); put(s.flags.boughtHome || s.housing === 'own', '#b45309', 'home'); put(s.work.status === 'retired', '#9bb59c', 'retire');
    return m.slice(-7);
  };
  function renderRoad(ctx, s, se, frac, t, bob) {
    const GY = H - 14;
    sky(ctx, s, se, frac, t, GY);
    skyline(ctx, s, se, t, GY);
    px(ctx, 0, GY, GROUND[se][0], W, H - GY); px(ctx, 0, GY, GROUND[se][1], W, 1);
    for (let y = 0; y < 8; y++) { const w = 60 + y * 15; px(ctx, Math.round(W / 2 - w / 2), GY + 3 + y, y % 2 ? '#d6c3a0' : '#cdb894', w, 1); }
    for (let i = 0; i < 12; i++) { const rx = (i * 17 + Math.floor(t / 60)) % W; px(ctx, rx, GY + 6, '#f5efe0', 3, 1); }
    const marks = ROAD_MARKS(s);
    marks.forEach(([c, tag], i) => { const mx = 6 + i * 11, my = GY - 6; px(ctx, mx + 2, my, '#6b4423', 1, 7); px(ctx, mx, my - 5, OUT, 6, 6); px(ctx, mx + 1, my - 4, c, 4, 4); if (tag === 'wed') heart(ctx, mx + 0.5, my - 4, '#ffffff'); });
    const dest = Math.min(140, 100 + Math.round(frac * 40));
    stageBuilding(ctx, s, dest, GY + 1, t);
    const fogX = Math.round(W - 30 + frac * 10); for (let i = 0; i < 30; i++) { ctx.globalAlpha = 0.5 + i / 60; px(ctx, fogX + i, 0, SKY[se][2], 1, GY + 2); } ctx.globalAlpha = 1;
    const next = S.SNAP_AGES.find(a => a > s.age);
    if (next) { px(ctx, W - 18, GY - 16, '#6b4423', 2, 17); px(ctx, W - 24, GY - 20, OUT, 14, 8); px(ctx, W - 23, GY - 19, '#fde68a', 12, 6); digits(ctx, next, W - 21, GY - 18, OUT); }
    const walkX = 20 + Math.round(frac * 56);
    const step = Math.floor(t / 260) % 2 === 0;
    if (s.car && s.age >= 18) { sprite(ctx, CAR, { o: OUT, c: carColor(s), w: '#bfe3ff', t: '#4b5563' }, walkX + 10, GY - 6); const o = outfit(s); px(ctx, walkX + 16, GY - 9, o.hair, 4, 3); px(ctx, walkX + 16, GY - 6, SKIN, 4, 2); if (s.love.married && s.love.spouse) { px(ctx, walkX + 22, GY - 9, hairFor(s.love.spouse.sex, s.love.spouse.age), 4, 3); px(ctx, walkX + 22, GY - 6, SKIN, 4, 2); } }
    else family(ctx, s, walkX, GY + 2, t, step);
    weather(ctx, se, t, GY);
    digits(ctx, s.year, 2, 2, '#ffffff');
  }

  P.render = function (canvas, s, frac, t) {
    if (!canvas || !s) return;
    const bob = Math.floor(t / 520) % 2 === 0;
    const month = Math.min(12, Math.floor(frac * 12) + 1), se = season(month);
    const kids = s.kids.filter(k => k.alive && k.home !== false && s.year - k.by < 20).length;
    const key = [P.style, s.age, s.year, s.housing, S.stageOf(s), s.work.type, Math.round(s.stats.happy / 8), s.stats.health < 40, s.love.married, !!s.love.partner, kids, !!s.pet, s.pet && s.pet.kind, !!s.car, s.car && s.car.n, se, bob, s.abroad, wealthTier(s), Math.floor(t / 70), !!s.flags.glasses, Math.round(frac * 60), parentsOf(s).length].join('|');
    if (canvas.dataset.key === key) return; canvas.dataset.key = key;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / W, canvas.height / H);
    if (P.style === 'town') renderTown(ctx, s, se, frac, t, bob);
    else if (P.style === 'road') renderRoad(ctx, s, se, frac, t, bob);
    else renderHome(ctx, s, se, frac, t, bob);
  };
})();
