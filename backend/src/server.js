const express = require('express');
const path = require('path');
const db = require('./db');
const config = require('./config');
const { kwhFromReadings } = require('./logic/billing');

const app = express();
app.use(express.json());

// Serves the dashboard from the /web folder at http://localhost:3000
app.use(express.static(path.join(__dirname, '..', '..', 'web')));

const findRoom = db.prepare('SELECT id FROM rooms WHERE code = ?');
const insertReading = db.prepare(
  'INSERT INTO readings (room_id, watts, away, appliances) VALUES (?, ?, ?, ?)'
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/rooms', (req, res) => {
  const rooms = db
    .prepare('SELECT id, code, name, is_simulated FROM rooms ORDER BY code')
    .all();
  res.json(rooms.map((r) => ({ ...r, is_simulated: !!r.is_simulated })));
});

// The ESP32 (or the simulator) posts readings here. See docs/API_CONTRACT.md
app.post('/api/readings', (req, res) => {
  const { room, watts, away = false, on = [] } = req.body || {};

  if (typeof room !== 'string' || typeof watts !== 'number' || !Number.isFinite(watts) || watts < 0) {
    return res.status(400).json({ error: 'room (string) and watts (number, 0 or more) are required' });
  }
  if (typeof away !== 'boolean' || !Array.isArray(on) || !on.every((s) => typeof s === 'string')) {
    return res.status(400).json({ error: 'away must be true/false and on must be an array of strings' });
  }

  const found = findRoom.get(room);
  if (!found) return res.status(404).json({ error: `unknown room "${room}"` });

  const info = insertReading.run(found.id, watts, away ? 1 : 0, JSON.stringify(on));
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Newest readings first. Optional: ?room=A&limit=50
app.get('/api/readings', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 1000);
  const room = req.query.room;

  const sql = `
    SELECT r.id, rm.code AS room, r.watts, r.away, r.appliances, r.recorded_at
    FROM readings r JOIN rooms rm ON rm.id = r.room_id
    ${room ? 'WHERE rm.code = ?' : ''}
    ORDER BY r.id DESC LIMIT ?`;
  const rows = db.prepare(sql).all(...(room ? [room, limit] : [limit]));

  res.json(
    rows.map((row) => ({
      id: row.id,
      room: row.room,
      watts: row.watts,
      away: !!row.away,
      on: JSON.parse(row.appliances),
      recorded_at: row.recorded_at,
    }))
  );
});

// ---- Usage: kWh and cost for one room over a period ----
// Example: /api/usage?room=B&from=2026-10-01&to=2026-10-18
// If you leave out from/to, it uses the last 24 hours.
// If "to" is just a date (2026-10-18), that whole day is included.

// Reads "2026-10-01", "2026-10-01 08:00:00" or "2026-10-01T08:00:00Z" (all UTC).
// Returns a Date if it parses, undefined if the format is wrong.
function parseTime(value) {
  let s = String(value).trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) s += 'Z';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const toDbTime = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
const round = (n, places) => Math.round(n * 10 ** places) / 10 ** places;

const selectForUsage = db.prepare(
  `SELECT watts, recorded_at FROM readings
   WHERE room_id = ? AND recorded_at >= ? AND recorded_at <= ?
   ORDER BY recorded_at ASC, id ASC`
);

app.get('/api/usage', (req, res) => {
  const { room } = req.query;
  if (!room) return res.status(400).json({ error: 'room is required, e.g. /api/usage?room=A' });

  const found = findRoom.get(room);
  if (!found) return res.status(404).json({ error: `unknown room "${room}"` });

  const badTime = { error: 'from/to must look like 2026-10-01 or 2026-10-01T08:00:00Z' };

  let to = req.query.to ? parseTime(req.query.to) : new Date();
  if (!to) return res.status(400).json(badTime);
  if (req.query.to && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)) {
    to = new Date(to.getTime() + 24 * 60 * 60 * 1000); // include the whole day
  }

  const from = req.query.from ? parseTime(req.query.from) : new Date(to.getTime() - 24 * 60 * 60 * 1000);
  if (!from) return res.status(400).json(badTime);
  if (from > to) return res.status(400).json({ error: 'from must be before to' });

  const rows = selectForUsage.all(found.id, toDbTime(from), toDbTime(to));
  const kwh = kwhFromReadings(rows, { maxGapSeconds: config.MAX_GAP_SECONDS });

  res.json({
    room,
    from: toDbTime(from),
    to: toDbTime(to),
    readings: rows.length,
    kwh: round(kwh, 4),
    rate: config.RATE_PER_KWH,
    cost: round(kwh * config.RATE_PER_KWH, 2),
    co2_kg: round(kwh * config.CO2_KG_PER_KWH, 3),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Energy Monitor API running on http://localhost:${PORT}`);
  console.log(`The ESP32 can reach it at http://<your-laptop-ip>:${PORT} on the same WiFi`);
});
