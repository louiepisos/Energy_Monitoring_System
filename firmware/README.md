# Firmware (ESP32)

Both folders are Wokwi projects. In Wokwi, start a new ESP32 project (Arduino style),
paste `diagram.json` into the diagram tab and `sketch.ino` into the code tab, then press Play.

| Folder | What it simulates |
|---|---|
| `wokwi-rooms-forecast` | 3 rooms (potentiometers), an away-mode alert, a simulated bill forecast and CO2 |
| `wokwi-appliance-id` | One total power reading. It spots the jumps and works out which appliance switched on |

The real node will swap the potentiometers for the SCT-013-030 clamp (see `docs/WIRING.md`)
and send readings to the backend in the format from `docs/API_CONTRACT.md`.

If the Serial Monitor doesn't show up in Wokwi, add `"serialMonitor": { "display": "always" },`
right after the `"editor": "wokwi",` line in `diagram.json`.

Put the code for the real node in a new folder: `firmware/esp32-node/`.
