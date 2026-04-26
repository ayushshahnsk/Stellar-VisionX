const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
  maxTempDetected: {
    type: Number,
    required: true,
  },
  avgTemp: {
    type: Number,
  },
  hotspotCount: {
    type: Number,
    default: 0,
  },
  heatmapUrl: {
    type: String,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['triggered', 'acknowledged', 'dismissed'],
    default: 'triggered',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);
