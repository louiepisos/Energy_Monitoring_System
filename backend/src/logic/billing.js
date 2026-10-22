// OWNER: Logic person.  Pure functions only (no database, no Express),
// so they can be tested with the sample data in web/sample-readings.json.
//
// NOTE: Louie wrote kwhFromReadings so GET /api/usage could run right away.
// Logic person: read it through and improve it if you spot anything wrong.

const DEFAULT_MAX_GAP_SECONDS = 300;

// "YYYY-MM-DD HH:MM:SS" (UTC) -> milliseconds
function toMs(recordedAt) {
  const s = String(recordedAt).replace(' ', 'T');
  return Date.parse(/Z$|[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z');
}

/**
 * Turns a list of readings into kWh.
 *
 * For every pair of consecutive readings it takes the average watts, multiplies by the
 * time between them, and adds everything up.  kWh = watts x hours / 1000
 *
 * If the gap between two readings is bigger than maxGapSeconds, we assume the node was
 * offline and skip that gap, so the total doesn't get inflated.
 *
 * @param {Array<{watts:number, recorded_at:string}>} readings  recorded_at in UTC
 * @param {{maxGapSeconds?:number}} [options]
 * @returns {number} kWh
 */
function kwhFromReadings(readings, { maxGapSeconds = DEFAULT_MAX_GAP_SECONDS } = {}) {
  const sorted = [...readings].sort((a, b) => toMs(a.recorded_at) - toMs(b.recorded_at));
  let kwh = 0;

  for (let i = 1; i < sorted.length; i++) {
    const seconds = (toMs(sorted[i].recorded_at) - toMs(sorted[i - 1].recorded_at)) / 1000;
    if (seconds <= 0 || seconds > maxGapSeconds) continue;

    const avgWatts = (sorted[i].watts + sorted[i - 1].watts) / 2;
    kwh += (avgWatts * (seconds / 3600)) / 1000;
  }

  return kwh;
}

/**
 * Splits one electric bill between rooms in proportion to each room's kWh.
 * @param {number} totalAmount  total bill in PHP
 * @param {Object<string, number>} kwhByRoom  e.g. { A: 42.1, B: 30.5, C: 51.0 }
 * @returns {Object<string, number>}  PHP per room, e.g. { A: 410.2, B: 297.2, C: 497.1 }
 * Decide how to handle shared loads (hallway light, etc.) and write it down.
 */
function splitBill(totalAmount, kwhByRoom) {
  throw new Error('TODO: not implemented yet');
}

module.exports = { kwhFromReadings, splitBill };
