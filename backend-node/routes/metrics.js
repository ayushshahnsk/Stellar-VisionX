const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Session = require('../models/Session');

// @route   GET api/metrics/overview
// @desc    Get aggregated stats for dashboard (real data from DB)
router.get('/overview', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id, status: 'completed' });

    if (sessions.length === 0) {
      return res.json({
        totalFusions: 0,
        avgAccuracy: 0,
        totalHotspots: 0,
        sessionsCompleted: 0,
        avgProcessingTime: 0,
      });
    }

    const totalFusions = sessions.length;

    const sumAccuracy = sessions.reduce((acc, s) => acc + (s.metrics?.accuracy || 0), 0);
    const avgAccuracy = (sumAccuracy / totalFusions).toFixed(1);

    const totalHotspots = sessions.reduce((acc, s) => acc + (s.metrics?.hotspotsDetected || 0), 0);

    const sumTime = sessions.reduce((acc, s) => acc + (s.metrics?.processingTimeMs || 0), 0);
    const avgProcessingTime = (sumTime / totalFusions / 1000).toFixed(2);

    res.json({
      totalFusions,
      avgAccuracy: Number(avgAccuracy),
      totalHotspots,
      sessionsCompleted: totalFusions,
      avgProcessingTime: Number(avgProcessingTime),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/metrics/history
// @desc    Get per-session metrics over time (for graphs)
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id, status: 'completed' })
      .sort({ createdAt: 1 })
      .select('createdAt metrics');
    res.json(sessions);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
