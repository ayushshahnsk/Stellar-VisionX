const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   GET api/activity
// @desc    Get activity logs for user (with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, search, startDate, endDate } = req.query;
    const filter = { user: req.user.id };

    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.message = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
