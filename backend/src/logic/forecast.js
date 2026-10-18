// OWNER: Logic person.  Pure function ra, para ma-test ang sample data sa web/sample-readings.json.

/**
 * I forecast ang bill sa katapusan sa billing cycle base sa nagamit hangtod karon.
 * Simple version: (kwhSoFar / daysElapsed) * cycleDays * rate
 * @param {{kwhSoFar:number, daysElapsed:number, cycleDays:number, rate:number}} input
 * @returns {{forecastKwh:number, forecastBill:number}}
 */
function forecastBill({ kwhSoFar, daysElapsed, cycleDays, rate }) {
  throw new Error('TODO: not implemented yet');
}

module.exports = { forecastBill };
