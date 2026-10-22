# Energy Monitor

A low-cost energy monitor for boarding houses.

An ESP32 with a clamp sensor measures how many watts a room is using and sends it to our backend. From that we get a bill for each room, a forecast, and an alert when someone leaves an appliance on. If we have time, it'll even work out which appliance got switched on.

For the prototype we'll have one **real** clamp node plus some simulated nodes feeding the same backend. Anything simulated gets labeled as simulated, so we stay honest about it.

## How it fits together

See `docs/architecture.mmd` (paste it into https://mermaid.live to see the diagram).

ESP32 node -> API -> database -> bill/forecast/alert logic -> dashboard and Telegram.

## Folders

| Folder | What's in it |
|---|---|
| `backend/` | The API (Node.js + Express), database schema (SQLite), and the logic stubs |
| `web/` | The dashboard. There's a placeholder page and some sample data for now |
| `firmware/` | ESP32 code and the Wokwi simulations |
| `docs/` | API contract, wiring guide, architecture diagram, task list |

## Running it (about 2 minutes)

You need Node.js 22.13 or newer, because we use the SQLite that's built into Node. Tested on Node 22.
You'll see an "ExperimentalWarning: SQLite" message when it starts. That's normal, nothing to worry about.

```bash
cd backend
npm install
npm start
```

Open http://localhost:3000. Then, in a second terminal, send some fake readings:

```bash
cd backend
npm run simulate
```

If it's working, the placeholder page starts filling up with readings. Press Ctrl+C to stop.

Want to simulate only rooms B and C? (Room A is meant for the real ESP32.)

- Mac/Linux: `SIM_ROOMS=B,C npm run simulate`
- Windows PowerShell: `$env:SIM_ROOMS="B,C"; npm run simulate`
- Windows Command Prompt: `set SIM_ROOMS=B,C && npm run simulate`

To try the usage endpoint, open http://localhost:3000/api/usage?room=B in your browser while the simulator is running.
To run the tests: `npm test`.

### Fake history to build against

Don't want to wait around for the simulator to collect data? This fills the database with a week of realistic fake readings for rooms A, B and C:

```bash
npm run seed
```

A few options (the `--` after `seed` is needed):

- `npm run seed -- --days=3` for fewer days
- `npm run seed -- --rooms=B,C` for only some rooms
- `npm run seed -- --clear` to wipe **all** readings first, then seed again
- `npm run seed -- --clear-only` to wipe everything and stop

It refuses to run if the database already has readings, so you can't double up by accident. Remember that `--clear` deletes everything, real readings included, and that all of this data is fake. Don't leave it in the database when we demo the real node.

The database gets created automatically at `backend/data/energy.db`. It's not committed.

If `npm install` or `npm start` fails for you, tell the group chat right away and send the error message. Don't fight it alone.

## Who does what

See `docs/TASKS.md`. The agreed data format is in `docs/API_CONTRACT.md`.
**Please read both before you write any code.**

## Team

| Role | Person |
|---|---|
| Lead, backend, database | |
| Firmware (ESP32) | |
| Dashboard | |
| Logic and alerts | |
| Assembly, testing, docs | |

## Working together

See `CONTRIBUTING.md`.
