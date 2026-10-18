// OWNER: Logic person.  Pure functions ra walay database, walay Express,
// para ma-test ang sample data sa web/sample-readings.json.

/**
 * @param {Array<{watts:number, recorded_at:string}>} readings  oldest first, recorded_at in UTC
 * @returns {number} kWh  (watts x hours between readings / 1000, summed)
 */
function kwhFromReadings(readings) {
  throw new Error('TODO: not implemented yet');
}

/**
 * pag bahin sa electric bill per room base sa kWh
 * @param {number} totalAmount  total bill in PHP
 * @param {Object<string, number>} kwhByRoom  e.g. { A: 42.1, B: 30.5, C: 51.0 }
 * @returns {Object<string, number>}  PHP per room, e.g. { A: 410.2, B: 297.2, C: 497.1 }
 * Mag decide if i document kung unsaon pag handle sa shared loads suga sa hallway, etc.
 */
function splitBill(totalAmount, kwhByRoom) {
  throw new Error('TODO: not implemented yet');
}

module.exports = { kwhFromReadings, splitBill };
