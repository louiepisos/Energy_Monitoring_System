// Energy Monitor Simulation (Wokwi, ESP32)
//
// Unsa ni: per-room tracking, away-mode alert para sa phantom load,
// bill forecast, CO2 report, ug gipadali nga oras (simulated time).
//
// Ang 3 ka potentiometer mao ang puli sa clamp sensor (0-200 W).
// I-turn ang knob = mas daghan nga gamit sa kuryente.

const int NUM_ROOMS = 3;
const int potPins[NUM_ROOMS] = {34, 35, 32};
const char* rooms[NUM_ROOMS] = {"Bedroom", "Kitchen", "Living room"};

// Normal nga kanunay naka-on kada kuwarto, in watts (naa sa Kitchen ang fridge)
const float baseline[NUM_ROOMS] = {5, 15, 5};

const int awayPin = 14;
const int ledPin = 26;
const int buzzerPin = 27;

const float MAX_WATTS = 200;           // kung puno ang pot = 200 W
const float THRESHOLD = 10;            // sobra nga watts nga isipon nato nga "nakalimtan"
const unsigned long HOLD_MS = 10000;   // 10 ka segundo dinhi = 10 ka minuto sa tinuod

// ---- Billing settings (ILISI ni para mo-match sa imong tinuod nga bill) ----
const float RATE = 12.0;               // PHP kada kWh
const float CO2_FACTOR = 0.7;          // kg CO2 kada kWh (placeholder lang ni, i-check ang pinakabag-o nga figure)
const float BUDGET = 1800;             // budget sa usa ka bulan, in PHP
const int CYCLE_DAYS = 30;             // pila ka adlaw ang billing cycle

// ---- Simulated time ----
// Matag loop (1 segundo) isipon nga 6 ka oras, so 1 adlaw = 4 s ug 1 bulan = 2 min.
const float HOURS_PER_TICK = 6.0;

bool over[NUM_ROOMS] = {false, false, false};
bool alertOn[NUM_ROOMS] = {false, false, false};
unsigned long since[NUM_ROOMS] = {0, 0, 0};

float roomKwh[NUM_ROOMS] = {0, 0, 0};
float simHours = 0;
int lastReportDay = 0;
int lastAway = -1;

void printReport(int day) {
  float total = 0;
  Serial.printf("\n---- Day %d of %d ----\n", day, CYCLE_DAYS);
  for (int i = 0; i < NUM_ROOMS; i++) {
    Serial.printf("  %s: %.2f kWh\n", rooms[i], roomKwh[i]);
    total += roomKwh[i];
  }
  float billSoFar = total * RATE;
  float forecastKwh = total / day * CYCLE_DAYS;
  float forecastBill = forecastKwh * RATE;

  Serial.printf("  Total so far: %.2f kWh = PHP %.0f\n", total, billSoFar);
  Serial.printf("  CO2 so far: %.1f kg\n", total * CO2_FACTOR);
  Serial.printf("  FORECAST end of cycle: %.0f kWh = PHP %.0f\n", forecastKwh, forecastBill);
  if (forecastBill > BUDGET) {
    Serial.printf("  WARNING: PHP %.0f over your PHP %.0f budget\n", forecastBill - BUDGET, BUDGET);
  }
}

void finishCycle() {
  float total = 0;
  for (int i = 0; i < NUM_ROOMS; i++) total += roomKwh[i];
  Serial.println("\n==== BILLING CYCLE COMPLETE ====");
  Serial.printf("Final: %.2f kWh = PHP %.0f, CO2 %.1f kg\n", total, total * RATE, total * CO2_FACTOR);
  Serial.println("Starting a new cycle...\n");
  for (int i = 0; i < NUM_ROOMS; i++) roomKwh[i] = 0;
  simHours = 0;
  lastReportDay = 0;
}

void setup() {
  Serial.begin(115200);
  pinMode(awayPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.println("Energy Monitor ready");
}

void loop() {
  bool away = (digitalRead(awayPin) == LOW);
  bool anyAlert = false;

  if ((int)away != lastAway) {
    lastAway = (int)away;
    Serial.println(away ? "[AWAY MODE]" : "[HOME MODE]");
  }

  for (int i = 0; i < NUM_ROOMS; i++) {
    float watts = analogRead(potPins[i]) * MAX_WATTS / 4095.0;
    float extra = watts - baseline[i];
    if (extra < 0) extra = 0;

    // i-add ang nagamit nga energy niining simulated nga time step
    roomKwh[i] += watts / 1000.0 * HOURS_PER_TICK;

    bool wasAlert = alertOn[i];
    if (away && extra > THRESHOLD) {
      if (!over[i]) {
        over[i] = true;
        since[i] = millis();
      } else if (millis() - since[i] >= HOLD_MS) {
        alertOn[i] = true;
      }
    } else {
      // gamay nga spike, nibalik sa normal, o naa ka sa balay
      over[i] = false;
      alertOn[i] = false;
    }

    if (alertOn[i] && !wasAlert) {
      float monthlyCost = extra / 1000.0 * 24 * 30 * RATE;
      Serial.printf("ALERT: %s still drawing %.0f W extra (about PHP %.0f per month if left on)\n",
                    rooms[i], extra, monthlyCost);
    }
    if (!alertOn[i] && wasAlert) {
      Serial.printf("CLEARED: %s back to normal\n", rooms[i]);
    }
    if (alertOn[i]) anyAlert = true;
  }

  // i-advance ang simulated time ug mo-report kada simulated nga adlaw
  simHours += HOURS_PER_TICK;
  int day = (int)(simHours / 24.0);
  if (day > lastReportDay) {
    lastReportDay = day;
    if (day >= CYCLE_DAYS) {
      printReport(day);
      finishCycle();
    } else {
      printReport(day);
    }
  }

  digitalWrite(ledPin, anyAlert ? HIGH : LOW);
  if (anyAlert) tone(buzzerPin, 1000);
  else noTone(buzzerPin);

  delay(1000);
}
