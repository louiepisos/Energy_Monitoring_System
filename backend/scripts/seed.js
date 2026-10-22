// Fills the database with a few days of realistic FAKE readings, so the dashboard
// and logic people have real-looking numbers to build against.
//
//   npm run seed                       7 days of history for rooms A, B and C
//   npm run seed -- --days=3           fewer days
//   npm run seed -- --rooms=B,C        only some rooms (leave A alone for the real node)
//   npm run seed -- --clear            wipe ALL readings first, then seed
//   npm run seed -- --clear-only       wipe ALL readings and stop
//
// The same data always comes out for the same day (change it with --seed=N), so
// everyone on the team sees the same history. Don't leave fake data in the
// database when you demo the real node.

const db = require('../src/db');

// ---- options ----
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value] = a.replace(/^--/, '').split('=');
    return [key, value === undefined ? true : value];
  })
);
const DAYS = Number(args.days ?? 7);
const INTERVAL_S = Number(args.interval ?? 60); // seconds between readings
const SEED = Number(args.seed ?? 42);
const ROOM_CODES = String(args.rooms ?? 'A,B,C').split(',').map((s) => s.trim()).filter(Boolean);
const TZ_OFFSET_H = 8; // Philippines is UTC+8. Daily habits follow local time.

if (![DAYS, INTERVAL_S, SEED].every(Number.isFinite) || DAYS < 0 || INTERVAL_S < 1) {
  console.error('Check your options: --days needs a number 0 or more, --interval a number 1 or more.');
  process.exit(1);
}

// ---- what each room is like ----
// start = local hour the appliance usually comes on, hours = how long, chance = odds per day.
// "forgot" = the tenant leaves it on and goes out (good for testing away alerts).
// Each room does this once a week on a fixed weekday, plus the odd extra time.
const PROFILES = {
  A: {
    base: 80, // fridge + router
    appliances: [
      { name: 'Fan', watts: 55, start: 22, hours: 8, chance: 0.9 },
      { name: 'TV', watts: 110, start: 19, hours: 3, chance: 0.6 },
    ],
    forgot: { name: 'TV', watts: 110, start: 7.5, hours: 5, chance: 0.08 },
  },
  B: {
    base: 60,
    appliances: [
      { name: 'Rice cooker', watts: 650, start: 6.5, hours: 0.5, chance: 0.85 },
      { name: 'Rice cooker', watts: 650, start: 18, hours: 0.75, chance: 0.8 },
      { name: 'Fan', watts: 55, start: 21.5, hours: 8, chance: 0.9 },
    ],
    forgot: { name: 'Fan', watts: 55, start: 7.5, hours: 9, chance: 0.1 },
  },
  C: {
    base: 70,
    appliances: [
      { name: 'Aircon', watts: 900, start: 21, hours: 9, chance: 0.7 },
      { name: 'TV', watts: 110, start: 19, hours: 2.5, chance: 0.5 },
    ],
    forgot: { name: 'Aircon', watts: 900, start: 7, hours: 5, chance: 0.12 },
  },
};

// ---- small seeded random generator, so the same input gives the same data ----
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- plan one room's day (cached) ----
// Hours are "hours since local midnight". An interval can run past 24 (an aircon
// that starts at 21:00 and runs 9 hours ends at hour 30, which is 6 AM tomorrow).
const planCache = new Map();

function planDay(code, dateKey) {
  const cacheKey = `${code}|${dateKey}`;
  if (planCache.has(cacheKey)) return planCache.get(cacheKey);

  const profile = PROFILES[code] || PROFILES.A;
  const r = rng(hash(`${SEED}|${code}|${dateKey}`));
  const jitter = () => r() - 0.5; // up to 30 minutes either way
  const dayOfWeek = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;

  const intervals = [];
  for (const a of profile.appliances) {
    if (r() < a.chance) {
      const from = a.start + jitter();
      intervals.push({ name: a.name, watts: a.watts, from, to: from + a.hours * (0.85 + r() * 0.3) });
    }
  }

  // Each room has one weekday (Mon-Fri) where the tenant always forgets something
  const forgetDay = 1 + (hash(`${SEED}|${code}|forgetDay`) % 5);
  const mustForget = dayOfWeek === forgetDay;

  // On most weekdays the tenant is out from about 8 to 5
  const away = isWeekday && (mustForget || r() < 0.8) ? { from: 8 + jitter(), to: 17 + jitter() } : null;

  // They leave something on and go out
  if (away && (mustForget || r() < profile.forgot.chance)) {
    const f = profile.forgot;
    const from = f.start + jitter();
    intervals.push({ name: f.name, watts: f.watts, from, to: from + f.hours });
  }

  // Sometimes the node drops offline for a while (WiFi down, unplugged...)
  let outage = null;
  if (r() < 0.1) {
    const from = 1 + r() * 20;
    outage = { from, to: from + 0.33 + r() * 0.67 };
  }

  const plan = { intervals, away, outage };
  planCache.set(cacheKey, plan);
  return plan;
}

// ---- what is this room doing at this moment? ----
function stateAt(code, utcMs) {
  const local = new Date(utcMs + TZ_OFFSET_H * 3600000);
  const dateKey = local.toISOString().slice(0, 10);
  const yesterday = new Date(local.getTime() - 86400000).toISOString().slice(0, 10);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600;

  const today = planDay(code, dateKey);
  const before = planDay(code, yesterday);

  const on = new Map(); // name -> watts
  for (const i of today.intervals) if (hour >= i.from && hour < i.to) on.set(i.name, i.watts);
  for (const i of before.intervals) if (hour + 24 >= i.from && hour + 24 < i.to) on.set(i.name, i.watts);

  return {
    on,
    away: !!(today.away && hour >= today.away.from && hour < today.away.to),
    offline: !!(today.outage && hour >= today.outage.from && hour < today.outage.to),
  };
}

const toDbTime = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

// ---- wipe / safety check ----
const existing = db.prepare('SELECT COUNT(*) AS n FROM readings').get().n;

if (args.clear || args['clear-only']) {
  db.exec('DELETE FROM readings');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'readings'");
  console.log(`Deleted ${existing} readings.`);
  if (args['clear-only']) process.exit(0);
} else if (existing > 0) {
  console.log(`The database already has ${existing} readings, so I stopped.`);
  console.log('Run again with --clear to wipe them and re-seed. That deletes ALL readings, real ones too.');
  process.exit(1);
}

// ---- generate and insert ----
const rooms = [];
for (const code of ROOM_CODES) {
  const row = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code);
  if (!row) console.log(`Skipping "${code}": there's no such room in the database.`);
  else rooms.push({ code, id: row.id, base: (PROFILES[code] || PROFILES.A).base });
}
if (rooms.length === 0 || DAYS === 0) {
  console.log('Nothing to seed.');
  process.exit(0);
}

const insert = db.prepare(
  'INSERT INTO readings (room_id, watts, away, appliances, recorded_at) VALUES (?, ?, ?, ?, ?)'
);

// Readings sit on a fixed grid (every INTERVAL_S seconds), so the same day always
// gets the same timestamps no matter when you run this.
const step = INTERVAL_S * 1000;
const endMs = Math.floor(Date.now() / step) * step;
const startMs = Math.floor((endMs - DAYS * 86400000) / step) * step;
const counts = Object.fromEntries(rooms.map((r) => [r.code, 0]));

db.exec('BEGIN');
try {
  // Time on the outside, rooms on the inside, so ids go up in time order across all rooms
  for (let t = startMs; t <= endMs; t += step) {
    for (const room of rooms) {
      const s = stateAt(room.code, t);
      if (s.offline) continue;

      const noise = rng(hash(`${SEED}|${room.code}|${t}`))() * 6 - 3; // +/- 3 W
      let watts = room.base + noise;
      for (const w of s.on.values()) watts += w;

      insert.run(room.id, Math.max(0, Math.round(watts * 10) / 10), s.away ? 1 : 0, JSON.stringify([...s.on.keys()]), toDbTime(t));
      counts[room.code]++;
    }
  }
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

console.log(`Seeded ${DAYS} days of FAKE readings (every ${INTERVAL_S}s), ${toDbTime(startMs)} to ${toDbTime(endMs)} UTC:`);
for (const room of rooms) console.log(`  room ${room.code}: ${counts[room.code]} readings`);
console.log('Try: /api/usage?room=C');
