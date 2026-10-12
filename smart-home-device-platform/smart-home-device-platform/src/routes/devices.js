const express = require('express');
const mongoose = require('mongoose');
const Device = require('../models/Device');
const Activity = require('../models/Activity');
const activityService = require('../services/activityService');

const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);

// Register a device
router.post('/', async (req, res, next) => {
  try {
    const { name, type, room } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    const device = await Device.create({ name, type, room, status: 'offline', state: {} });
    await activityService.record(device._id, 'DEVICE_REGISTERED', { name, type });
    res.status(201).json(device);
  } catch (e) { next(e); }
});

// List devices; optional status and room filters
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.room) filter.room = req.query.room;
    res.json(await Device.find(filter).sort({ createdAt: -1 }).limit(200));
  } catch (e) { next(e); }
});

// Device status
router.get('/:id/status', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid device id' });
    const device = await Device.findById(req.params.id).select('name type status state lastSeen');
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ id: device._id, name: device.name, type: device.type, status: device.status, state: device.state, lastSeen: device.lastSeen });
  } catch (e) { next(e); }
});

// Send a device command. This reference implementation records desired state;
// a production adapter would publish the command to MQTT/Kafka and await device acknowledgement.
router.post('/:id/commands', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid device id' });
    const { command, value } = req.body;
    const allowed = ['turn_on', 'turn_off', 'set_temperature', 'set_brightness', 'lock', 'unlock'];
    if (!allowed.includes(command)) return res.status(400).json({ error: `command must be one of: ${allowed.join(', ')}` });
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (device.status !== 'online') return res.status(409).json({ error: 'Device is offline; command was not sent' });
    const nextState = { ...device.state, lastCommand: command, updatedAt: new Date().toISOString() };
    if (value !== undefined) nextState.value = value;
    if (command === 'turn_on') nextState.power = 'on';
    if (command === 'turn_off') nextState.power = 'off';
    if (command === 'lock') nextState.locked = true;
    if (command === 'unlock') nextState.locked = false;
    device.state = nextState;
    await device.save();
    await activityService.record(device._id, 'COMMAND_SENT', { command, value });
    res.status(202).json({ message: 'Command accepted', deviceId: device._id, command, state: device.state });
  } catch (e) { next(e); }
});

// Device activity history
router.get('/:id/activity', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid device id' });
    if (!(await Device.exists({ _id: req.params.id }))) return res.status(404).json({ error: 'Device not found' });
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10) || 50, 1), 200);
    res.json(await Activity.find({ deviceId: req.params.id }).sort({ createdAt: -1 }).limit(limit));
  } catch (e) { next(e); }
});

// Device heartbeat/status update (normally called by trusted device gateway)
router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid device id' });
    const { status, state } = req.body;
    if (!['online', 'offline'].includes(status)) return res.status(400).json({ error: 'status must be online or offline' });
    const update = { status, lastSeen: status === 'online' ? new Date() : undefined };
    if (state !== undefined) update.state = state;
    const device = await Device.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await activityService.record(device._id, 'STATUS_UPDATED', { status, state });
    res.json(device);
  } catch (e) { next(e); }
});

// Remove device and its activity records
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid device id' });
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await Activity.deleteMany({ deviceId: device._id });
    res.status(200).json({ message: 'Device removed', deviceId: device._id });
  } catch (e) { next(e); }
});

module.exports = router;
