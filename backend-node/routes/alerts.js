const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const AlertPreference = require('../models/AlertPreference');
const Alert = require('../models/Alert');

// @route   GET /api/alerts/preferences
// @desc    Get current user's alert preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    let prefs = await AlertPreference.findOne({ user: req.user.id });
    if (!prefs) {
      // Create default preferences if none exist
      prefs = await AlertPreference.create({
        user: req.user.id,
        temperatureThreshold: 45,
        emailAlertsEnabled: true,
      });
    }
    res.json(prefs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/alerts/preferences
// @desc    Update alert preferences (threshold + email toggle)
router.put('/preferences', auth, async (req, res) => {
  try {
    const { temperatureThreshold, emailAlertsEnabled } = req.body;

    const updateFields = {};
    if (temperatureThreshold !== undefined) {
      const t = parseFloat(temperatureThreshold);
      if (isNaN(t) || t < 15 || t > 100) {
        return res.status(400).json({ msg: 'Threshold must be between 15°C and 100°C' });
      }
      updateFields.temperatureThreshold = t;
    }
    if (emailAlertsEnabled !== undefined) {
      updateFields.emailAlertsEnabled = Boolean(emailAlertsEnabled);
    }

    const prefs = await AlertPreference.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.json(prefs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/alerts/history
// @desc    Get alert history for the user (paginated)
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('session', 'opticalImageUrl thermalImageUrl resultImageUrl heatmapUrl status'),
      Alert.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/alerts/:id/acknowledge
// @desc    Acknowledge or dismiss an alert
router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'acknowledged' or 'dismissed'
    if (!['acknowledged', 'dismissed'].includes(status)) {
      return res.status(400).json({ msg: 'Status must be "acknowledged" or "dismissed"' });
    }

    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ msg: 'Alert not found' });
    }

    res.json(alert);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
