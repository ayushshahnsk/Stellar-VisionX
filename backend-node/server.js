require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const fusionRoutes = require('./routes/fusion');
const metricsRoutes = require('./routes/metrics');
const activityRoutes = require('./routes/activity');
const alertRoutes = require('./routes/alerts');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fusion', fusionRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/alerts', alertRoutes);

// Health Check / System Status
app.get('/api/status', async (req, res) => {
  let dbStatus = 'Down';
  try {
    if (mongoose.connection.readyState === 1) dbStatus = 'Online';
  } catch (e) {
    dbStatus = 'Down';
  }

  // Check Python service
  let pythonStatus = 'Down';
  const axios = require('axios');
  try {
    const pyUrl = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
    const pyRes = await axios.get(`${pyUrl}/health`, { timeout: 5000 });
    if (pyRes.data?.status === 'online') pythonStatus = 'Online';
  } catch (e) {
    pythonStatus = 'Down';
  }

  res.json({
    status: dbStatus === 'Online' && pythonStatus === 'Online' ? 'Online' : 'Warning',
    timestamp: new Date(),
    services: {
      api: 'Online',
      database: dbStatus,
      storage: 'Online',
      auth: 'Online',
      aiModel: pythonStatus,
    },
  });
});

const PORT = process.env.PORT || 5000;

console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'undefined');
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/visionx_fallback')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Node Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
