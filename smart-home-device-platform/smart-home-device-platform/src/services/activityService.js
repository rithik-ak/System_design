const Activity = require('../models/Activity');

async function record(deviceId, action, details = {}) {
  return Activity.create({ deviceId, action, details });
}
module.exports = { record };
