const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());

// Gikan sa /web folder ang dashboard, makita sa http://localhost:3000
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

// Diri mo send ug readings ang ESP32 o ang simulator. Tan awa ang docs/API_CONTRACT.md
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

// Pinakabag o nga readings ang una. Optional: ?room=A&limit=50
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Energy Monitor API running on http://localhost:${PORT}`);
  console.log(`The ESP32 can reach it at http://<your-laptop-ip>:${PORT} on the same WiFi`);
});
