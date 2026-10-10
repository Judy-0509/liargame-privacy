#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TZ = process.env.TZ_NAME || 'Asia/Seoul';
const ORIGIN = process.env.ALLOW_ORIGIN || '*';
const MAX_PER_DAY = 50000;
const RATE = { windowMs: 10 * 60 * 1000, max: 40 };
const KEYS = ['score', 'wealth', 'age', 'happy', 'income', 'rel'];

fs.mkdirSync(DATA_DIR, { recursive: true });
const days = new Map();
const rate = new Map();

const todayKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const fileOf = day => path.join(DATA_DIR, day + '.json');
function load(day) {
  if (days.has(day)) return days.get(day);
  let rows = [];
  try { rows = JSON.parse(fs.readFileSync(fileOf(day), 'utf8')); } catch (e) { rows = []; }
  days.set(day, rows); return rows;
}
let saveTimer = null; const dirty = new Set();
function save(day) { dirty.add(day); if (saveTimer) return; saveTimer = setTimeout(() => { saveTimer = null; for (const d of dirty) { try { fs.writeFileSync(fileOf(d), JSON.stringify(days.get(d))); } catch (e) { console.error('save failed', d, e.message); } } dirty.clear(); }, 500); }
function listDays() { const set = new Set(fs.readdirSync(DATA_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10))); for (const [d, rows] of days) if (rows.length) set.add(d); return [...set].sort().reverse(); }

const str = (v, max) => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : '';
const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
function sanitize(b) {
  if (!b || typeof b !== 'object') return null;
  const m = b.metrics || {};
  const rec = {
    id: crypto.randomBytes(8).toString('hex'), t: Date.now(),
    nick: str(b.nick, 12), name: str(b.name, 10), sex: b.sex === 'F' ? 'F' : 'M', region: str(b.region, 6),
    birthYear: num(b.birthYear, 1900, 2200), deathAge: num(b.deathAge, 0, 125), deathYear: num(b.deathYear, 1900, 2400), cause: str(b.cause, 20),
    degree: str(b.degree, 10), job: str(b.job, 16), married: !!b.married, kids: num(b.kids, 0, 20) || 0,
    score: num(b.score, 0, 100), wealth: num(m.wealth, -1e9, 1e10), age: num(m.age, 0, 125), happy: num(m.happy, 0, 100), income: num(m.income, 0, 1e11), rel: num(m.rel, 0, 100),
    cohortN: num(b.cohortN, 0, 100000) || 0, cohortTop: num(b.cohortTop, 0, 100), v: str(b.version, 12), daily: str(b.daily, 10), startTop: num(b.startTop, 0, 100), lineage: num(b.lineage, 1, 50) || 1,
  };
  for (const k of ['birthYear', 'deathAge', 'score', 'wealth', 'age', 'happy', 'income', 'rel']) if (rec[k] == null) return null;
  return rec;
}
function ranks(rows, rec) { const out = { n: rows.length }; for (const k of KEYS) out[k] = { rank: rows.filter(r => r[k] > rec[k]).length + 1, n: rows.length }; return out; }
function leaderboard(day, key, limit, offset) {
  const rows = load(day).slice().sort((a, b) => b[key] - a[key] || a.t - b.t);
  return { day, key, n: rows.length, rows: rows.slice(offset, offset + limit).map((r, i) => ({ rank: offset + i + 1, id: r.id, nick: r.nick, name: r.name, sex: r.sex, region: r.region, birthYear: r.birthYear, deathAge: r.deathAge, cause: r.cause, job: r.job, value: r[key], score: r.score, wealth: r.wealth, age: r.age, happy: r.happy, income: r.income, rel: r.rel, cohortTop: r.cohortTop, daily: r.daily, startTop: r.startTop, lineage: r.lineage })) };
}
function limited(ip) { const now = Date.now(); let e = rate.get(ip); if (!e || now - e.start > RATE.windowMs) { e = { start: now, n: 0 }; rate.set(ip, e); } e.n++; return e.n > RATE.max; }
function send(res, code, body) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
function readBody(req, max) { return new Promise((resolve, reject) => { let size = 0; const chunks = []; req.on('data', c => { size += c.length; if (size > max) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); }); req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8'))); req.on('error', reject); }); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, day: todayKey(), tz: TZ });
    if (url.pathname === '/api/days') return send(res, 200, { today: todayKey(), days: listDays().slice(0, 60).map(d => ({ day: d, n: load(d).length })) });
    if (url.pathname === '/api/leaderboard' && req.method === 'GET') {
      const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day') || '') ? url.searchParams.get('day') : todayKey();
      const key = KEYS.includes(url.searchParams.get('key')) ? url.searchParams.get('key') : 'score';
      const limit = Math.min(200, Math.max(1, +(url.searchParams.get('limit') || 100)));
      const offset = Math.max(0, +(url.searchParams.get('offset') || 0));
      const out = leaderboard(day, key, limit, offset); out.today = todayKey();
      const me = url.searchParams.get('id'); if (me) { const rows = load(day); const r = rows.find(x => x.id === me); if (r) out.me = { ...ranks(rows, r), id: me }; }
      return send(res, 200, out);
    }
    if (url.pathname === '/api/lives' && req.method === 'POST') {
      if (limited(ip)) return send(res, 429, { error: 'too many requests' });
      const raw = await readBody(req, 8192);
      let body; try { body = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'bad json' }); }
      const rec = sanitize(body); if (!rec) return send(res, 400, { error: 'invalid record' });
      const day = todayKey(); const rows = load(day);
      if (rows.length >= MAX_PER_DAY) return send(res, 503, { error: 'full' });
      rows.push(rec); save(day);
      return send(res, 200, { ok: true, id: rec.id, day, rank: ranks(rows, rec) });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 500, { error: e.message }); }
});
server.listen(PORT, HOST, () => console.log(`5천만 분의 1 leaderboard on http://${HOST}:${PORT} (data: ${DATA_DIR}, tz: ${TZ})`));
