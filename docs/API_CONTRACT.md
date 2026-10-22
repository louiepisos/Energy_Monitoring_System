# API contract

Everything else builds on this, so **don't change it without telling Louie**.
The firmware, backend, dashboard, and logic all depend on it.

Base URL while developing: `http://localhost:3000`
(the ESP32 uses `http://<laptop-ip>:3000` as long as it's on the same WiFi).

## Reading payload (ESP32 / simulator -> backend)

```json
{ "room": "A", "watts": 135.4, "away": false, "on": ["Fan"] }
```

| Field | Type | What it means |
|---|---|---|
| `room` | string | Room code. Has to exist in the `rooms` table (A, B, C are already there) |
| `watts` | number, 0 or more | Power right now, from the clamp |
| `away` | boolean | `true` when the tenant is away (away mode) |
| `on` | array of strings | Appliances the node thinks are on. `[]` if it doesn't know |

The server adds the time (`recorded_at`, in UTC).

## Endpoints

| Status | Method and path | What it does |
|---|---|---|
| Done | `GET /api/health` | `{ "ok": true }` |
| Done | `GET /api/rooms` | Lists the rooms. `is_simulated` is true for fake nodes |
| Done | `POST /api/readings` | Saves a reading. `201 {"id": 1}`. `400` for bad data, `404` for an unknown room |
| Done | `GET /api/readings?room=A&limit=50` | Newest first. `limit` defaults to 100, max 1000 |
| Done | `GET /api/usage?room=A&from=...&to=...` | kWh, cost, and CO2 for one room over a period. Details below |
| Planned | `GET /api/forecast?room=A` | Forecast bill for the billing cycle |
| Planned | `GET /api/bills` | Bill split by room |
| Planned | `POST /api/away` | Sets away mode for a room |
| Planned | `GET /api/alerts` | Recent alerts |

## A reading in the response

```json
{ "id": 9, "room": "B", "watts": 61.3, "away": false, "on": [], "recorded_at": "2026-10-17 19:16:27" }
```

## Usage response

`GET /api/usage?room=B&from=2026-10-01&to=2026-10-18`

```json
{ "room": "B", "from": "2026-10-01 00:00:00", "to": "2026-10-19 00:00:00",
  "readings": 1520, "kwh": 12.3456, "rate": 12, "cost": 148.15, "co2_kg": 8.642 }
```

- `from` and `to` are UTC. If `to` is just a date (`2026-10-18`), that whole day is included.
- If you leave out `from` and `to`, it uses the last 24 hours.
- kWh is worked out from the average watts between each pair of readings. If the gap between two readings is longer than 5 minutes, we assume the node was offline and skip it.
- `rate` and `co2_kg` use placeholder numbers (12 PHP/kWh and 0.7 kg CO2/kWh). They live in `backend/src/config.js`.

`web/sample-readings.json` has fake data in this exact shape. Use it until the backend is ready.
