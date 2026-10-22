// Energy Monitor - Appliance ID simulation (NILM-lite)
//
// The ESP32 only sees one number, the total watts, just like it would with the
// real clamp. Whenever that number jumps up or down, we match the size of the
// jump to a known appliance and call it "turned on" or "turned off".
//
// If something stays on while you're away, it fires an alert. Every 5 seconds
// it also prints the JSON the backend would receive.
//
// The 4 switches in Wokwi are the appliances (Fan, TV, Rice cooker, Aircon).
// The code never reads the switches to identify anything. It only sees total watts.

const int NUM_APPS = 4;
const int appPins[NUM_APPS] = {13, 14, 27, 33};
const char* appNames[NUM_APPS] = {"Fan", "TV", "Rice cooker", "Aircon"};
const float appWatts[NUM_APPS] = {55, 110, 650, 900};

const float BASE_LOAD = 80;          // fridge + router, always on
const int awayPin = 25;
const int ledPin = 26;

const float STEP_MIN = 30;           // smallest jump (W) we count as an event
const float SETTLE_BAND = 8;         // readings this close together = settled
const unsigned long HOLD_MS = 10000; // 10 real seconds stands in for 10 minutes
const float RATE = 12.0;             // PHP per kWh (change it to match your bill)

float history[3] = {BASE_LOAD, BASE_LOAD, BASE_LOAD};
float stableW = BASE_LOAD;
float lastAvg = BASE_LOAD;
int settleCount = 0;

bool inferredOn[NUM_APPS] = {false, false, false, false};
bool alerted[NUM_APPS] = {false, false, false, false};
unsigned long onSince[NUM_APPS] = {0, 0, 0, 0};
unsigned long lastPayload = 0;

// Fake clamp reading: base load + whatever is switched on + a bit of noise
float readTotal() {
  float total = BASE_LOAD;
  for (int i = 0; i < NUM_APPS; i++) {
    if (digitalRead(appPins[i]) == LOW) total += appWatts[i];
  }
  total += random(-30, 31) / 10.0;  // +/- 3 W of noise so it feels real
  return total;
}

// Match a power jump to the closest known appliance
void handleStep(float delta) {
  bool turnedOn = delta > 0;
  float mag = fabs(delta);
  int best = -1;
  float bestErr = 1e9;

  for (int i = 0; i < NUM_APPS; i++) {
    float err = fabs(mag - appWatts[i]);
    float tol = fmax(15.0f, appWatts[i] * 0.15f);
    if (err <= tol && err < bestErr) {
      best = i;
      bestErr = err;
    }
  }

  if (best >= 0) {
    if (turnedOn) {
      inferredOn[best] = true;
      onSince[best] = millis();
      alerted[best] = false;
      Serial.printf("EVENT: %s turned ON (+%.0f W)\n", appNames[best], mag);
    } else {
      inferredOn[best] = false;
      alerted[best] = false;
      Serial.printf("EVENT: %s turned OFF (-%.0f W)\n", appNames[best], mag);
    }
  } else {
    Serial.printf("EVENT: unknown load %s (%.0f W)\n", turnedOn ? "ON" : "OFF", mag);
  }
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < NUM_APPS; i++) pinMode(appPins[i], INPUT_PULLUP);
  pinMode(awayPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  Serial.println("Appliance identification simulation ready");
}

void loop() {
  // 1. read the total and smooth it (average of the last 3 readings)
  float raw = readTotal();
  history[0] = history[1];
  history[1] = history[2];
  history[2] = raw;
  float avg = (history[0] + history[1] + history[2]) / 3.0;

  // 2. look for a jump, wait for it to settle, then identify it
  if (fabs(avg - stableW) > STEP_MIN) {
    if (fabs(avg - lastAvg) < SETTLE_BAND) settleCount++;
    else settleCount = 0;

    if (settleCount >= 2) {
      handleStep(avg - stableW);
      stableW = avg;
      settleCount = 0;
    }
  } else {
    settleCount = 0;
  }
  lastAvg = avg;

  // 3. away-mode alert: appliance still on after HOLD_MS
  bool away = (digitalRead(awayPin) == LOW);
  bool anyAlert = false;
  for (int i = 0; i < NUM_APPS; i++) {
    if (!away) alerted[i] = false;
    if (inferredOn[i] && away && millis() - onSince[i] >= HOLD_MS) {
      anyAlert = true;
      if (!alerted[i]) {
        alerted[i] = true;
        float monthly = appWatts[i] / 1000.0 * 24 * 30 * RATE;
        Serial.printf("ALERT: %s left on while away (about %.0f W, PHP %.0f per month if left on)\n",
                      appNames[i], appWatts[i], monthly);
      }
    }
  }
  digitalWrite(ledPin, anyAlert ? HIGH : LOW);

  // 4. every 5 seconds, print the payload the backend would receive
  if (millis() - lastPayload >= 5000) {
    lastPayload = millis();
    Serial.printf("PAYLOAD {\"watts\":%.0f,\"away\":%s,\"on\":[", avg, away ? "true" : "false");
    bool first = true;
    for (int i = 0; i < NUM_APPS; i++) {
      if (inferredOn[i]) {
        Serial.printf("%s\"%s\"", first ? "" : ",", appNames[i]);
        first = false;
      }
    }
    Serial.println("]}");
  }

  delay(1000);
}
