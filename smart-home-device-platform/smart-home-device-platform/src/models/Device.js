const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ['light', 'thermostat', 'fan', 'lock', 'sensor', 'other'] },
  room: { type: String, default: 'Unassigned', trim: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  state: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastSeen: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

deviceSchema.index({ status: 1, lastSeen: -1 });
module.exports = mongoose.model('Device', deviceSchema);
