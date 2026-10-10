window.KR = window.KR || {};
(() => {
  const D = KR.DATA, S = KR.Sim;
  const P = KR.PIXEL = {};
  const W = 180, H = 44, GY = H - 7;
  const season = m => m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  const SKY = { spring: ['#bcdcff', '#d9ebff', '#eef6ff'], summer: ['#6fb8ff', '#9ccfff', '#cfe8ff'], autumn: ['#f4c58f', '#f8dcb8', '#fbeedb'], winter: ['#b9c6d6', '#d2dbe6', '#e8edf3'] };
  const GROUND = { spring: ['#79c06f', '#5fa557'], summer: ['#5aa34f', '#468a3d'], autumn: ['#c89b57', '#a97d3f'], winter: ['#eef2f6', '#d5dde6'] };
  const LEAF = { spring: ['#f6a5c8', '#fbc7dd'], summer: ['#3f9a3a', '#5cb752'], autumn: ['#e2742b', '#f0a046'], winter: ['#9aa8b6', '#f4f7fa'] };
  const OUT = '#1c1a1f', SKIN = '#f3cba3', SKIN2 = '#d9a67c', WHITE = '#f8fafc';
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const sprite = (ctx, rows, pal, x, y) => { for (let j = 0; j < rows.length; j++) { const r = rows[j]; for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(ctx, x + i, y + j, c); } } };

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
  const TREE = ['....lll....', '..lllllll..', '.lllLllLll.', 'llLlllllLll', '.lllllLlll.', '..lLlllll..', '....ttt....', '....ttt....', '....ttt....'];
  const BARE = ['....t.t....', '...t.t.t...', '....ttt....', '...t.tt.t..', '....ttt....', '.....t.....', '....ttt....', '....ttt....', '....ttt....'];

  function outfit(s) {
    const st = S.stageOf(s), w = s.work, a = s.age;
    const hair = a >= 64 ? '#cfd3d8' : a >= 52 ? '#6b6f76' : s.sex === 'F' ? '#3b2418' : '#1f1a17';
    const o = { hair, hairShade: a >= 64 ? '#aeb4bb' : a >= 52 ? '#50545a' : '#120d0b', body: '#7c8694', bodyShade: '#5e6775', collar: '#e5e7eb', legs: '#3d4451', legsShade: '#2b3039', shoes: '#111827', hat: null, badge: null, bag: null, tie: null };
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
    if (S.stageOf(s) === 'seek') { px(ctx, x + 12, yy - 6, WHITE, 6, 6); px(ctx, x + 12, yy, WHITE, 2, 1); px(ctx, x + 14, yy - 5, '#111827', 2, 1); px(ctx, x + 15, yy - 4, '#111827'); px(ctx, x + 14, yy - 2, '#111827'); }
    if (S.stageOf(s) === 'work' && s.work.type === '프리랜서') { px(ctx, x + 12, yy + 13, '#cbd5e1', 5, 4); px(ctx, x + 13, yy + 14, '#60a5fa', 3, 2); }
    if (S.stageOf(s) === 'work' && (s.work.type === '중소' || s.work.type === '중견' || s.work.type === '대기업' || s.work.type === '공공')) px(ctx, x + 12, yy + 15, '#111827', 4, 5);
  }

  function child(ctx, s, x, y, o, t, bob, happy, hairColor) {
    const pal = { o: OUT, h: hairColor || o.hair, H: o.hairShade, f: SKIN, F: SKIN2, e: '#1f2937', w: '#fff', m: '#9a3412', b: o.body, B: o.bodyShade, c: o.collar, a: SKIN, l: o.legs, L: o.legsShade, s: o.shoes };
    const yy = y + (bob ? 1 : 0);
    sprite(ctx, CHILD, pal, x, yy);
    px(ctx, x + 3, yy + 6, SKIN, 4, 1);
    if (happy >= 55) { px(ctx, x + 3, yy + 6, '#b45309', 4, 1); px(ctx, x + 2, yy + 5, '#b45309'); px(ctx, x + 7, yy + 5, '#b45309'); } else if (happy >= 35) px(ctx, x + 3, yy + 6, '#9a3412', 4, 1); else { px(ctx, x + 3, yy + 5, '#7f1d1d', 4, 1); }
    if (o.bag) { px(ctx, x - 2, yy + 10, OUT, 3, 5); px(ctx, x - 1, yy + 11, o.bag, 1, 3); }
    if (s && s.flags && s.flags.glasses) { px(ctx, x + 1, yy + 5, OUT, 3, 1); px(ctx, x + 6, yy + 5, OUT, 3, 1); }
  }

  function house(ctx, s, x, base, se, t) {
    const h = s.housing;
    const win = (wx, wy, lit) => { px(ctx, wx, wy, OUT, 4, 4); px(ctx, wx + 1, wy + 1, lit ? '#fde68a' : '#9fb7d6', 2, 2); };
    if (s.abroad) { px(ctx, x, base - 14, OUT, 22, 14); px(ctx, x + 1, base - 13, '#c4b5a5', 20, 12); for (let i = 0; i < 3; i++) win(x + 2 + i * 7, base - 10, i !== 1); px(ctx, x + 9, base - 6, '#5b3a21', 4, 6); px(ctx, x + 24, base - 20, '#8b8f99', 1, 20); px(ctx, x + 25, base - 20, '#dc2626', 6, 2); px(ctx, x + 25, base - 18, '#ffffff', 6, 2); px(ctx, x + 25, base - 16, '#2563eb', 6, 2); return; }
    if (h === 'own') {
      px(ctx, x, base - 34, OUT, 26, 34); px(ctx, x + 1, base - 33, '#b9bfc9', 24, 32); px(ctx, x + 1, base - 33, '#d6dbe3', 24, 1);
      for (let r = 0; r < 7; r++) { px(ctx, x + 1, base - 30 + r * 4 + 3, '#8d95a3', 24, 1); for (let c = 0; c < 4; c++) win(x + 3 + c * 6, base - 31 + r * 4, (r * 3 + c + Math.floor(t / 4000)) % 3 !== 0); }
      px(ctx, x + 10, base - 6, OUT, 6, 6); px(ctx, x + 11, base - 5, '#60a5fa', 4, 5); px(ctx, x + 4, base - 37, OUT, 6, 3); px(ctx, x + 5, base - 36, '#e5e7eb', 4, 1);
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

  function backdrop(ctx, s, se, frac, t) {
    const sky = SKY[se];
    px(ctx, 0, 0, sky[0], W, 14); px(ctx, 0, 14, sky[1], W, 12); px(ctx, 0, 26, sky[2], W, GY - 26);
    const sx = 8 + Math.round(frac * (W - 24)), sy = 4 + Math.round(Math.sin(frac * Math.PI) * -2) + 3;
    px(ctx, sx - 1, sy, '#fde68a', 7, 5); px(ctx, sx, sy - 1, '#fde68a', 5, 7); px(ctx, sx, sy, '#fbbf24', 5, 5); px(ctx, sx + 1, sy + 1, '#fef3c7', 2, 1);
    const cloud = (cx, cy) => { px(ctx, cx + 2, cy, '#ffffff', 8, 1); px(ctx, cx, cy + 1, '#ffffff', 12, 2); px(ctx, cx + 1, cy + 3, '#e5e7eb', 10, 1); };
    cloud(((t / 150) + 20) % (W + 20) - 12, 6); cloud(((t / 240) + 100) % (W + 20) - 12, 12);
    const r = D.regions[s.region];
    const coastal = ['부산', '제주', '강원', '울산', '인천', '전남', '경남'].includes(r.short) && !s.abroad;
    if (coastal) { px(ctx, 0, GY - 9, '#7cc3ea', W, 9); px(ctx, 0, GY - 9, '#a8d8f0', W, 1); for (let i = 0; i < 9; i++) px(ctx, (i * 23 + Math.floor(t / 300)) % W, GY - 6 + (i % 3), '#ffffff', 3, 1); }
    else {
      const m = [[0, 7, 'a'], [22, 11, 'b'], [48, 8, 'a'], [70, 13, 'b'], [100, 9, 'a'], [124, 12, 'b'], [150, 8, 'a'], [170, 10, 'b']];
      for (const [mx, mh, k] of m) for (let i = 0; i < mh; i++) px(ctx, mx - i, GY - 1 - (mh - 1 - i), k === 'a' ? '#9fb4c7' : '#7f97ad', (i * 2) + 1, 1);
      if (se === 'winter') for (const [mx, mh] of m) px(ctx, mx, GY - mh, '#ffffff', 1, 2);
      if (r.capital && !s.abroad) { px(ctx, 104, GY - 22, '#6b7280', 1, 10); px(ctx, 103, GY - 23, '#9ca3af', 3, 1); px(ctx, 102, GY - 16, '#6b7280', 5, 2); px(ctx, 104, GY - 24, '#ef4444'); }
    }
    px(ctx, 0, GY, GROUND[se][0], W, H - GY); px(ctx, 0, GY, GROUND[se][1], W, 1);
    for (let i = 0; i < 24; i++) px(ctx, (i * 29 + 5) % W, GY + 2 + (i % 3), GROUND[se][1], 2, 1);
    px(ctx, W - 48, GY + 1, '#6b7280', 48, 5); px(ctx, W - 48, GY + 1, '#4b5563', 48, 1); for (let i = 0; i < 6; i++) px(ctx, W - 46 + i * 8, GY + 3, '#f5f5f4', 4, 1);
    if (se === 'spring') for (let i = 0; i < 16; i++) px(ctx, (i * 23 + Math.floor(t / 90)) % W, (i * 7 + Math.floor(t / 130)) % (GY - 4), i % 2 ? '#f9a8d4' : '#fbcfe8');
    if (se === 'autumn') for (let i = 0; i < 12; i++) px(ctx, (i * 29 + Math.floor(t / 110)) % W, (i * 9 + Math.floor(t / 150)) % (GY - 4), i % 2 ? '#ea580c' : '#f59e0b');
    if (se === 'winter') for (let i = 0; i < 26; i++) px(ctx, (i * 19 + Math.floor(t / 160)) % W, (i * 11 + Math.floor(t / 70)) % (GY - 2), '#ffffff');
    if (se === 'summer') for (let i = 0; i < 3; i++) { const bx = (i * 61 + Math.floor(t / 60)) % (W + 10) - 5, by = 8 + i * 6; px(ctx, bx, by, '#1f2937', 1, 1); px(ctx, bx + 2, by, '#1f2937', 1, 1); px(ctx, bx + 1, by + 1, '#1f2937', 1, 1); }
  }

  P.render = function (canvas, s, frac, t) {
    if (!canvas || !s) return;
    const bob = Math.floor(t / 520) % 2 === 0;
    const month = Math.min(12, Math.floor(frac * 12) + 1), se = season(month);
    const kids = s.kids.filter(k => k.alive && k.home !== false && s.year - k.by < 20).slice(0, 3);
    const key = [s.age, s.housing, S.stageOf(s), s.work.type, Math.round(s.stats.happy / 8), s.stats.health < 40, s.love.married, !!s.love.partner, kids.length, !!s.pet, s.pet && s.pet.kind, !!s.car, s.car && s.car.n, se, bob, s.abroad, Math.min(4, Math.floor(Math.max(0, S.netWorth(s)) / 30000)), Math.floor(t / 70), !!s.flags.glasses].join('|');
    if (canvas.dataset.key === key) return; canvas.dataset.key = key;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / W, canvas.height / H);
    backdrop(ctx, s, se, frac, t);
    house(ctx, s, 4, GY + 1, se, t);
    tree(ctx, 40, GY + 1, se, t);
    const o = outfit(s), st = S.stageOf(s), cx = 62, base = GY + 1;
    if (s.age < 2) sprite(ctx, BABY, { o: OUT, h: o.hair, H: o.hairShade, f: SKIN, e: '#1f2937', w: '#fff', m: '#b45309', b: '#fda4af', a: SKIN, s: '#fda4af' }, cx + 2, base - 10 + (bob ? 1 : 0));
    else if (s.age < 12) child(ctx, s, cx, base - 18, o, t, bob, s.stats.happy);
    else person(ctx, s, cx, base - 24, o, s.sex === 'F' && s.age < 60, t, bob);
    let fx = cx + 20;
    if (s.love.married && s.love.spouse && s.love.spouse.alive) {
      const sp = s.love.spouse; const so = { hair: sp.age >= 64 ? '#cfd3d8' : sp.sex === 'F' ? '#4a2c1c' : '#1f1a17', hairShade: sp.age >= 64 ? '#aeb4bb' : '#140e0a', body: sp.sex === 'F' ? '#db2777' : '#2563eb', bodyShade: sp.sex === 'F' ? '#9d174d' : '#1e40af', collar: WHITE, legs: sp.sex === 'F' ? '#7f1d1d' : '#1f2937', legsShade: '#111827', shoes: '#111827' };
      person(ctx, { stats: { happy: s.stats.happy, health: 80 }, flags: {}, age: sp.age, mil: { status: 'na' }, work: { type: null, status: 'spouse' }, edu: { stage: 'done' }, hs: {}, sex: sp.sex }, fx, base - 24, so, sp.sex === 'F' && sp.age < 60, t + 900, !bob); fx += 18;
      px(ctx, cx + 13, base - 30, '#ef4444'); px(ctx, cx + 15, base - 30, '#ef4444'); px(ctx, cx + 12, base - 29, '#ef4444', 5, 1); px(ctx, cx + 13, base - 28, '#ef4444', 3, 1); px(ctx, cx + 14, base - 27, '#ef4444');
    } else if (s.love.partner) { px(ctx, cx + 13, base - 30, '#f472b6'); px(ctx, cx + 15, base - 30, '#f472b6'); px(ctx, cx + 12, base - 29, '#f472b6', 5, 1); px(ctx, cx + 13, base - 28, '#f472b6', 3, 1); px(ctx, cx + 14, base - 27, '#f472b6'); }
    for (const k of kids) { const ko = { hair: '#1f1a17', hairShade: '#120d0b', body: k.sex === 'M' ? '#38bdf8' : '#f9a8d4', bodyShade: k.sex === 'M' ? '#0284c7' : '#ec4899', collar: WHITE, legs: '#374151', legsShade: '#1f2937', shoes: '#111827' }; const ka = s.year - k.by; if (ka < 2) sprite(ctx, BABY, { o: OUT, h: '#1f1a17', H: '#120d0b', f: SKIN, e: '#1f2937', w: '#fff', m: '#b45309', b: ko.body, a: SKIN, s: ko.body }, fx, base - 10); else child(ctx, null, fx, base - 18, ko, t, !bob, s.stats.happy); fx += 13; }
    if (s.pet) { sprite(ctx, s.pet.kind === '고양이' ? CAT : DOG, { o: OUT, h: s.pet.kind === '고양이' ? '#9ca3af' : '#c2783a', e: '#111827', w: '#fff', m: '#111827' }, fx, base - 8); fx += 12; }
    if (s.car) sprite(ctx, CAR, { o: OUT, c: s.car.n === '수입차' ? '#111827' : s.car.n === 'SUV' ? '#166534' : s.car.n === '경차' ? '#f59e0b' : '#2563eb', w: '#bfe3ff', t: '#4b5563' }, W - 36, GY - 3);
    const coins = Math.min(4, Math.floor(Math.max(0, S.netWorth(s)) / 30000));
    for (let i = 0; i < coins; i++) { px(ctx, W - 60 + i * 4, GY - 3 - (i % 2), OUT, 4, 4); px(ctx, W - 59 + i * 4, GY - 2 - (i % 2), '#fbbf24', 2, 2); }
    if (st === 'school' || st === 'univ') { px(ctx, cx - 10, base - 6, OUT, 7, 5); px(ctx, cx - 9, base - 5, '#1d4ed8', 5, 3); px(ctx, cx - 9, base - 5, '#93c5fd', 5, 1); }
    if (s.mil.status === 'serving') { px(ctx, W - 70, GY - 10, OUT, 14, 11); px(ctx, W - 69, GY - 9, '#4f7a1e', 12, 9); px(ctx, W - 66, GY - 6, '#a3e635', 6, 1); px(ctx, W - 64, GY - 14, '#6b7280', 1, 5); px(ctx, W - 63, GY - 14, '#dc2626', 4, 2); }
  };
})();
