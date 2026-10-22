-- Energy Monitor database schema (SQLite)
-- Times are stored in UTC, format "YYYY-MM-DD HH:MM:SS".
-- Only rooms and readings are used by the API right now. The other tables are
-- ready for whoever builds bills, alerts, and appliance identification.

CREATE TABLE IF NOT EXISTS rooms (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL UNIQUE,          -- short code the ESP32 sends, e.g. "A"
  name         TEXT,
  is_simulated INTEGER NOT NULL DEFAULT 0     -- 1 = fake node, 0 = real clamp node
);

CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('landlord', 'tenant')),
  room_id          INTEGER REFERENCES rooms(id),   -- tenants only
  telegram_chat_id TEXT                            -- for alerts
);

CREATE TABLE IF NOT EXISTS readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id     INTEGER NOT NULL REFERENCES rooms(id),
  watts       REAL NOT NULL,
  away        INTEGER NOT NULL DEFAULT 0,          -- 1 = tenant is away
  appliances  TEXT NOT NULL DEFAULT '[]',          -- JSON array, e.g. ["Fan","TV"]
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_readings_room_time ON readings (room_id, recorded_at);

CREATE TABLE IF NOT EXISTS appliance_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id     INTEGER NOT NULL REFERENCES rooms(id),
  appliance   TEXT NOT NULL,
  event       TEXT NOT NULL CHECK (event IN ('on', 'off')),
  watts       REAL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    INTEGER NOT NULL REFERENCES rooms(id),
  kind       TEXT NOT NULL,                        -- 'left_on', 'over_budget', 'anomaly'
  message    TEXT NOT NULL,
  sent       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bills (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id      INTEGER NOT NULL REFERENCES rooms(id),
  period_start TEXT NOT NULL,
  period_end   TEXT NOT NULL,
  kwh          REAL NOT NULL,
  rate         REAL NOT NULL,                      -- PHP per kWh used for this bill
  amount       REAL NOT NULL,                      -- PHP
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
