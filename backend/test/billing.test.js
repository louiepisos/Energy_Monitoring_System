const test = require('node:test');
const assert = require('node:assert');
const { kwhFromReadings } = require('../src/logic/billing');

const close = (a, b) => Math.abs(a - b) < 1e-9;

test('no readings, or just one, = 0 kWh', () => {
  assert.strictEqual(kwhFromReadings([]), 0);
  assert.strictEqual(kwhFromReadings([{ watts: 500, recorded_at: '2026-10-01 08:00:00' }]), 0);
});

test('1000 W for 1 hour = 1 kWh', () => {
  const readings = [];
  for (let m = 0; m <= 60; m++) {
    const t = new Date(Date.UTC(2026, 9, 1, 8, m, 0)).toISOString().slice(0, 19).replace('T', ' ');
    readings.push({ watts: 1000, recorded_at: t });
  }
  assert.ok(close(kwhFromReadings(readings), 1));
});

test('0 W ramping to 200 W over 60 seconds = 100 W average', () => {
  const readings = [
    { watts: 0, recorded_at: '2026-10-01 08:00:00' },
    { watts: 200, recorded_at: '2026-10-01 08:01:00' },
  ];
  assert.ok(close(kwhFromReadings(readings), (100 * (60 / 3600)) / 1000));
});

test('a big gap (node offline) is not counted', () => {
  const readings = [
    { watts: 100, recorded_at: '2026-10-01 08:00:00' },
    { watts: 100, recorded_at: '2026-10-01 08:10:00' }, // 10 minute gap
    { watts: 100, recorded_at: '2026-10-01 08:11:00' },
  ];
  assert.ok(close(kwhFromReadings(readings), (100 * (60 / 3600)) / 1000));
});

test("input doesn't need to be sorted", () => {
  const readings = [
    { watts: 200, recorded_at: '2026-10-01 08:01:00' },
    { watts: 0, recorded_at: '2026-10-01 08:00:00' },
  ];
  assert.ok(close(kwhFromReadings(readings), (100 * (60 / 3600)) / 1000));
});
