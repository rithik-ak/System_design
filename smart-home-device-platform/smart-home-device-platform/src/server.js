require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const deviceRoutes = require('./routes/devices');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'smart-home-device-api', time: new Date().toISOString() }));
app.use('/api/v1/devices', deviceRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure it.');
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Smart Home API listening on port ${port}`));
}
start().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
