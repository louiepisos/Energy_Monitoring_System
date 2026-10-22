// OWNER: Logic person.  Pure function, easy to test.

/**
 * Predicts the bill at the end of the billing cycle from the usage so far.
 * Simple version: (kwhSoFar / daysElapsed) * cycleDays * rate
 * @param {{kwhSoFar:number, daysElapsed:number, cycleDays:number, rate:number}} input
 * @returns {{forecastKwh:number, forecastBill:number}}
 * Don't return a crazy number when daysElapsed is tiny (the first day is noisy).
 */
function forecastBill({ kwhSoFar, daysElapsed, cycleDays, rate }) {
  throw new Error('TODO: not implemented yet');
}

module.exports = { forecastBill };
