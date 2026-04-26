const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const auth = require('../middlewares/auth');
const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');
const AlertPreference = require('../models/AlertPreference');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendAlertEmail } = require('../services/emailService');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'visionx_uploads',
    allowed_formats: ['jpg', 'png', 'tiff', 'jpeg'],
  },
});
const upload = multer({ storage: storage });

// @route   POST api/fusion/run
// @desc    Upload optical and thermal images and trigger AI fusion
router.post(
  '/run',
  auth,
  upload.fields([
    { name: 'optical', maxCount: 1 },
    { name: 'thermal', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files['optical'] || !req.files['thermal']) {
        return res.status(400).json({ msg: 'Both optical and thermal images are required.' });
      }

      const opticalUrl = req.files['optical'][0].path;
      const thermalUrl = req.files['thermal'][0].path;

      // Log upload activity
      await ActivityLog.create({
        user: req.user.id,
        type: 'upload',
        status: 'success',
        message: 'Uploaded optical and thermal images for fusion.',
      });

      // Create session as processing
      const newSession = new Session({
        user: req.user.id,
        opticalImageUrl: opticalUrl,
        thermalImageUrl: thermalUrl,
        status: 'processing',
      });
      await newSession.save();

      // Log fusion start
      await ActivityLog.create({
        user: req.user.id,
        type: 'fusion',
        status: 'processing',
        message: `Fusion pipeline started for session ${newSession._id}`,
        sessionId: newSession._id,
      });

      // Call Python AI Service
      const pythonApi = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
      let pythonResponse;
      try {
        pythonResponse = await axios.post(
          `${pythonApi}/process-fusion`,
          {
            session_id: newSession._id.toString(),
            optical_url: opticalUrl,
            thermal_url: thermalUrl,
          },
          { timeout: 120000 }
        );
      } catch (pyErr) {
        const errorDetail = pyErr?.response?.data?.detail || pyErr?.response?.data || pyErr.message;
        console.error('Python service error details:', errorDetail);
        
        newSession.status = 'error';
        await newSession.save();

        await ActivityLog.create({
          user: req.user.id,
          type: 'error',
          status: 'error',
          message: `Pipeline error: ${errorDetail}`,
          sessionId: newSession._id,
        });

        return res.status(500).json({
          msg: 'Error in AI processing pipeline',
          error: errorDetail,
        });
      }

      // Update session with results
      newSession.status = 'completed';
      newSession.resultImageUrl = pythonResponse.data.result_url;
      newSession.heatmapUrl = pythonResponse.data.heatmap_url;
      newSession.metrics = pythonResponse.data.metrics;
      newSession.completedAt = new Date();

      // Store thermal analysis data
      if (pythonResponse.data.thermal_analysis) {
        const ta = pythonResponse.data.thermal_analysis;
        newSession.thermalAnalysis = {
          maxTemp: ta.max_temp,
          minTemp: ta.min_temp,
          avgTemp: ta.avg_temp,
          hotspotRegions: (ta.hotspot_regions || []).map(r => ({
            id: r.id,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            peakTemp: r.peak_temp,
          })),
        };
      }

      await newSession.save();

      // Log completion
      await ActivityLog.create({
        user: req.user.id,
        type: 'fusion',
        status: 'success',
        message: `Fusion completed. PSNR: ${newSession.metrics.psnr}, SSIM: ${newSession.metrics.ssim}`,
        sessionId: newSession._id,
      });

      // === THRESHOLD ALERT CHECK ===
      try {
        const thermalData = pythonResponse.data.thermal_analysis;
        if (thermalData) {
          const prefs = await AlertPreference.findOne({ user: req.user.id });
          const threshold = prefs?.temperatureThreshold ?? 45;
          const emailEnabled = prefs?.emailAlertsEnabled ?? true;

          if (thermalData.max_temp >= threshold) {
            // Create alert record
            const alert = await Alert.create({
              user: req.user.id,
              session: newSession._id,
              threshold: threshold,
              maxTempDetected: thermalData.max_temp,
              avgTemp: thermalData.avg_temp,
              hotspotCount: (thermalData.hotspot_regions || []).length,
              heatmapUrl: newSession.heatmapUrl,
              status: 'triggered',
            });

            // Log the alert
            await ActivityLog.create({
              user: req.user.id,
              type: 'alert',
              status: 'warning',
              message: `🔴 Thermal alert: ${thermalData.max_temp}°C detected (threshold: ${threshold}°C)`,
              sessionId: newSession._id,
            });

            // Send email if enabled
            if (emailEnabled) {
              const user = await User.findById(req.user.id).select('email name');
              if (user?.email) {
                const emailResult = await sendAlertEmail(user.email, {
                  threshold,
                  maxTemp: thermalData.max_temp,
                  avgTemp: thermalData.avg_temp,
                  hotspotCount: (thermalData.hotspot_regions || []).length,
                  heatmapUrl: newSession.heatmapUrl,
                  sessionId: newSession._id.toString(),
                  userName: user.name,
                });

                if (emailResult.sent) {
                  alert.emailSent = true;
                  alert.emailSentAt = new Date();
                  await alert.save();
                }
              }
            }

            console.log(`[Alert] Thermal alert triggered for user ${req.user.id}: ${thermalData.max_temp}°C >= ${threshold}°C`);
          }
        }
      } catch (alertErr) {
        // Alert errors should not fail the fusion response
        console.error('[Alert] Error processing alert:', alertErr.message);
      }

      res.json(newSession);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  }
);

// @route   GET api/fusion/sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   GET api/fusion/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
