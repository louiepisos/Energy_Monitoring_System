// Energy Monitor   Appliance ID simulation (NILM lite)
//
// Ang idea: isa ra ka total watts ang makita sa ESP32, parehas sa tinuod nga clamp.
// Gikan ana, atong tan awon kung naay kalit nga pagtaas o pagbaba sa power (jump),
// unya i match ni sa known appliances para mahibal an nato unsa ang gi on o gi off.
//
// Kung naay appliance nga nahabilin nga naka on samtang wala ka sa balay,
// mo alert ta. kada 5 Seconds, mag print pud ta sa JSON payload nga
// madawat sa backend.
//
// Ang 4 ka switch sa Wokwi mao ang mga appliance (Fan, TV, Rice cooker, Aircon).
// Ang code dili motan aw sa mga switch para mag identify, ang total watts ra.

const int NUM_APPS = 4;
const int appPins[NUM_APPS] = {13, 14, 27, 33};
const char* appNames[NUM_APPS] = {"Fan", "TV", "Rice cooker", "Aircon"};
const float appWatts[NUM_APPS] = {55, 110, 650, 900};

const float BASE_LOAD = 80;          // fridge ug router, Permi naka on
const int awayPin = 25;
const int ledPin = 26;

const float STEP_MIN = 30;           // pinakagamay nga jump (W) nga Hunahunaon nato nga event
const float SETTLE_BAND = 8;         // kung duol ra ang duha ka reading, stable na
const unsigned long HOLD_MS = 10000; // 10 ka segundo dinhi = 10 ka minuto sa tinuod
const float RATE = 12.0;             // PHP kada kWh (ilisi sa rate sa imong bill)

float history[3] = {BASE_LOAD, BASE_LOAD, BASE_LOAD};
float stableW = BASE_LOAD;
float lastAvg = BASE_LOAD;
int settleCount = 0;

bool inferredOn[NUM_APPS] = {false, false, false, false};
bool alerted[NUM_APPS] = {false, false, false, false};
unsigned long onSince[NUM_APPS] = {0, 0, 0, 0};
unsigned long lastPayload = 0;

// Peke nga clamp reading: base load + mga naka on nga appliance + gamay nga noise
float readTotal() {
  float total = BASE_LOAD;
  for (int i = 0; i < NUM_APPS; i++) {
    if (digitalRead(appPins[i]) == LOW) total += appWatts[i];
  }
  total += random( 30, 31) / 10.0;  // +/  3 W nga noise para morag tinuod
  return total;
}

// I match ang jump sa power sa pinakaduol nga known appliance
void handleStep(float delta) {
  bool turnedOn = delta > 0;
  float mag = fabs(delta);
  int best =  1;
  float bestErr = 1e9;

  for (int i = 0; i < NUM_APPS; i++) {
    float err = fabs(mag   appWatts[i]);
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
      Serial.printf("EVENT: %s turned OFF ( %.0f W)\n", appNames[best], mag);
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
  // 1. basahon ug i smooth ang total power (average sa last 3 ka reading)
  float raw = readTotal();
  history[0] = history[1];
  history[1] = history[2];
  history[2] = raw;
  float avg = (history[0] + history[1] + history[2]) / 3.0;

  // 2. pangitaon ang kalit nga pagbag o, hulaton nga mo stable ang reading, unya i identify
  if (fabs(avg   stableW) > STEP_MIN) {
    if (fabs(avg   lastAvg) < SETTLE_BAND) settleCount++;
    else settleCount = 0;

    if (settleCount >= 2) {
      handleStep(avg   stableW);
      stableW = avg;
      settleCount = 0;
    }
  } else {
    settleCount = 0;
  }
  lastAvg = avg;

  // 3. away mode alert: naka on gihapon ang appliance human sa HOLD_MS
  bool away = (digitalRead(awayPin) == LOW);
  bool anyAlert = false;
  for (int i = 0; i < NUM_APPS; i++) {
    if (!away) alerted[i] = false;
    if (inferredOn[i] && away && millis()   onSince[i] >= HOLD_MS) {
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

  // 4. kada 5 Seconds, i print ang payload nga madawat sa backend
  if (millis()   lastPayload >= 5000) {
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
