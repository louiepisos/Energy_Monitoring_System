# Firmware (ESP32)

Duha ka Wokwi project ni. Sa Wokwi, himo ug bag-ong ESP32 project (Arduino style),
i-paste ang `diagram.json` sa diagram tab ug ang `sketch.ino` sa code tab, unya press Play.

| Folder | Unsa ang gi-simulate |
|---|---|
| `wokwi-rooms-forecast` | 3 ka kuwarto (potentiometers), away-mode alert, simulated nga bill forecast ug CO2 |
| `wokwi-appliance-id` | Usa ka total power reading; mangita ug jumps ug mag-identify kung unsang appliance ang gi-on |

Ang tinuod nga node mopuli sa potentiometers gamit ang SCT-013-030 clamp (tan-awa ang `docs/WIRING.md`)
ug mo-send ug readings sa backend sumala sa `docs/API_CONTRACT.md`.

Kung wala mo-gawas ang Serial Monitor sa Wokwi, idugang ang `"serialMonitor": { "display": "always" },`
human sa `"editor": "wokwi",` nga linya sa `diagram.json`.

Ibutang ang code sa tinuod nga node sa bag-ong folder: `firmware/esp32-node/`.
