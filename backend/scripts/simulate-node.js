// Sends fake readings every second so you can build the dashboard and logic
// before the hardware shows up.
// Start the API first (npm start), then run this in a second terminal:
//   npm run simulate
// Only some rooms (Mac/Linux):  SIM_ROOMS=B,C npm run simulate
// Windows PowerShell:          $env:SIM_ROOMS="B,C"; npm run simulate
// Windows Command Prompt:      set SIM_ROOMS=B,C && npm run simulate
// Different server:          API_URL=http://192.168.1.10:3000/api/readings npm run simulate

const URL = process.env.API_URL || 'http://localhost:3000/api/readings';
const only = (process.env.SIM_ROOMS || 'A,B,C').split(',').map((s) => s.trim());

const rooms = [
  { room: 'A', base: 80, appliances: [{ name: 'Fan', watts: 55 }, { name: 'TV', watts: 110 }] },
  { room: 'B', base: 60, appliances: [{ name: 'Rice cooker', watts: 650 }, { name: 'Fan', watts: 55 }] },
  { room: 'C', base: 70, appliances: [{ name: 'Aircon', watts: 900 }, { name: 'TV', watts: 110 }] },
].filter((r) => only.includes(r.room));

const isOn = Object.fromEntries(rooms.map((r) => [r.room, new Set()]));

function tick() {
  for (const r of rooms) {
    // every so often, switch a random appliance on or off
    if (Math.random() < 0.1) {
      const a = r.appliances[Math.floor(Math.random() * r.appliances.length)];
      const set = isOn[r.room];
      if (set.has(a.name)) set.delete(a.name);
      else set.add(a.name);
    }

    const active = r.appliances.filter((a) => isOn[r.room].has(a.name));
    const watts = r.base + active.reduce((sum, a) => sum + a.watts, 0) + (Math.random() * 6 - 3);
    const body = { room: r.room, watts: Math.round(watts * 10) / 10, away: false, on: active.map((a) => a.name) };

    fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) console.error(`Room ${r.room}: server answered ${res.status}`);
      })
      .catch((err) => console.error('Could not reach the backend:', err.message));
  }
}

console.log(`Simulating rooms ${rooms.map((r) => r.room).join(', ')} -> ${URL}`);
console.log('Press Ctrl+C to stop');
setInterval(tick, 1000);
