# Wiring: ESP32 + SCT-013-030 clamp

**Check the clamp's datasheet before you connect anything to a mains load.**

## Safety (read this first)
This part is important.
- The clamp goes around **one wire only**. Use a ready-made **AC line splitter cord**
  so the live and neutral wires are separate. On a normal cord you'll read almost zero.
- **Don't cut, strip, or open** any mains cord or wiring. Only test on one appliance's cord.
- Only one person handles the mains side. Tell the adviser about the project first.
- Build and test the low-voltage side first, with nothing connected to the clamp.

## Parts
ESP32 DevKit, SCT-013-030 (30A, 1V output), 3.5mm jack breakout, 2 x 10k ohm resistors,
1 x 10 uF capacitor, breadboard, jumper wires.

## Bias circuit (lifts the AC signal so the ESP32 can read it)
```
3.3V ---[10k]---+---[10k]--- GND
                |
              (bias node, about 1.65V)
                |
              [10uF]--- GND
```
- Clamp jack **sleeve** -> bias node
- Clamp jack **tip** -> ESP32 **GPIO 33** (ADC1, so it keeps working when WiFi is on)

## Calibrate
Compare the ESP32's reading with a plug-in wattmeter, or a lamp with a labeled wattage,
and adjust the calibration factor in the code until the two agree.
