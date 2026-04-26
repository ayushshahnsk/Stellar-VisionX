const mongoose = require('mongoose');

const alertPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  temperatureThreshold: {
    type: Number,
    default: 45,
    min: 15,
    max: 100,
  },
  emailAlertsEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

alertPreferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AlertPreference', alertPreferenceSchema);
