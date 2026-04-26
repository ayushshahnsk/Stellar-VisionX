const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  opticalImageUrl: {
    type: String,
    required: true,
  },
  thermalImageUrl: {
    type: String,
    required: true,
  },
  resultImageUrl: {
    type: String,
  },
  heatmapUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending',
  },
  metrics: {
    psnr: Number,
    ssim: Number,
    rmse: Number,
    thermalFidelity: Number,
    edgePreservation: Number,
    accuracy: Number,
    confidence: Number,
    hotspotsDetected: Number,
    processingTimeMs: Number,
    losses: {
      l1_loss: Number,
      mse_loss: Number,
      thermal_consistency_loss: Number,
    },
  },
  thermalAnalysis: {
    maxTemp: Number,
    minTemp: Number,
    avgTemp: Number,
    hotspotRegions: [{
      id: Number,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      peakTemp: Number,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
