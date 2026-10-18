# Wiring: ESP32 + SCT-013-030 clamp

I-check ang datasheet sa clamp before mo connecr sa bisan uns nga mains load.

## Parts
ESP32 DevKit, SCT-013-030 (30A, 1V output), 3.5mm jack breakout, 2 x 10k ohm resistors,
1 x 10 uF capacitor, breadboard, jumper wires.

## Bias circuit (mo-lift sa AC signal aron mabasa sa ESP32)
```
3.3V ---[10k]---+---[10k]--- GND
                |
              (bias node, mga 1.65V)
                |
              [10uF]--- GND
```
- Clamp jack sleeve -> bias node
- Clamp jack tip -> ESP32 GPIO 33 ADC1 mogana gihapon bisan naka on ang WiFi

