// Settings the backend uses. They live in code for now,
// and we can move them into the database later if we need to.

module.exports = {
  // PHP per kWh. Change it to the rate on your real bill.
  RATE_PER_KWH: Number(process.env.RATE_PER_KWH) || 12,

  // kg CO2 per kWh. Just a placeholder, look up the latest figure.
  CO2_KG_PER_KWH: Number(process.env.CO2_KG_PER_KWH) || 0.7,

  // If the gap between two readings is longer than this (in seconds),
  // we treat the node as offline and don't count that gap.
  MAX_GAP_SECONDS: 300,
};
