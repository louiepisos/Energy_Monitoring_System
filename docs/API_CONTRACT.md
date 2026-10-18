# API contract

Ani ang basehan sa tanan. Ayaw usba nga walay pahibalo saako kay and firmware,
backend, dashboard ug logic nagdepende ani.

Base URL  While nagdevelop: `http://localhost:3000`
ang ESP32 mogamit ug `http://<laptopip>:3000`same og wifi

## Reading payload (ESP32 / simulator > backend)

```json
{ "room": "A", "watts": 135.4, "away": false, "on": ["Fan"] }
```

 Field  Type  Unsa ni 

 `room`  string  Room code. Kinahanglan naa sa `rooms` table (A, B, C naa na) 
 `watts`  number, 0 o mas taas  Power karon gikan sa clamp 
 `away`  boolean  `true` kung wala sa balay ang tenant (away mode) 
 `on`  array of strings  Mga appliance nga gihunahuna sa node nga Naka on. `[]` kung wala pa klaro 

Ang server na ang modugang sa oras (`recorded_at`, UTC).

## Mga endpoint

 Status  Method ug path  Unsa ang buhaton 

 Human na  `GET /api/health`  `{ "ok": true }` 
 Human na  `GET /api/rooms`  Listahan sa rooms. `is_simulated` kay true kung peke nga node 
 Human na  `POST /api/readings`  Isave ang reading. `201 {"id": 1}`. `400` sayop nga data, `404` wala nga room 
 Human na  `GET /api/readings?room=A&limit=50`  Pinakabago una. `limit` default 100, max 1000 
 Planned  `GET /api/isage?room=A&from=...&to=...`  kWh ug cost sa isa ka period 
 Planned  `GET /api/forecast?room=A`  Forecast nga bill sa cycle 
 Planned  `GET /api/bills`  Bahin sa bill kada kuwarto 
 Planned  `POST /api/away`  Iset ang away mode sa isa ka kuwarto 
 Planned  `GET /api/alerts`  Mga bagong alerts 

## isa ka reading sa response

```json
{ "id": 9, "room": "B", "watts": 61.3, "away": false, "on": [], "recorded_at": "20261017 19:16:27" }
```

Ang `web/samplereadings.json` naay peke nga data sa same nga porma gamiton ni  While wala pa ang backend.