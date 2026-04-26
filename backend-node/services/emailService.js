const nodemailer = require('nodemailer');

/**
 * Email service using Nodemailer for sending thermal alert notifications.
 * Configures SMTP transport from environment variables.
 */

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send a thermal alert email to the user.
 * @param {string} toEmail - Recipient email address
 * @param {object} alertData - Alert details
 * @param {number} alertData.threshold - User's configured threshold (°C)
 * @param {number} alertData.maxTemp - Maximum temperature detected (°C)
 * @param {number} alertData.avgTemp - Average temperature (°C)
 * @param {number} alertData.hotspotCount - Number of hotspots
 * @param {string} alertData.heatmapUrl - Cloudinary URL of the heatmap image
 * @param {string} alertData.sessionId - Session ID for dashboard link
 * @param {string} alertData.userName - User's display name
 */
async function sendAlertEmail(toEmail, alertData) {
  const {
    threshold,
    maxTemp,
    avgTemp,
    hotspotCount,
    heatmapUrl,
    sessionId,
    userName,
  } = alertData;

  const fromAddress = process.env.SMTP_FROM || 'Stellar VisionX <noreply@stellarvisionx.com>';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const severity = maxTemp >= threshold + 20 ? 'CRITICAL' : 'WARNING';
  const severityColor = severity === 'CRITICAL' ? '#dc2626' : '#f59e0b';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px 16px 0 0; padding: 32px 28px; text-align: center;">
      <div style="display: inline-block; padding: 6px 16px; background: ${severityColor}; color: white; border-radius: 50px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px;">
        🔴 ${severity} — THERMAL ALERT
      </div>
      <h1 style="color: white; margin: 8px 0 4px; font-size: 22px; font-weight: 700;">
        Temperature Threshold Exceeded
      </h1>
      <p style="color: #94a3b8; margin: 0; font-size: 14px;">
        Stellar VisionX Alert System
      </p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 28px; border: 1px solid #e2e8f0; border-top: none;">
      
      <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">
        Hello <strong>${userName || 'User'}</strong>,
      </p>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        A thermal scan has detected temperatures exceeding your configured threshold. 
        Immediate review is recommended.
      </p>

      <!-- Temperature Stats -->
      <div style="display: flex; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; text-align: center; border-right: 1px solid #fecaca;">
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Your Threshold</div>
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6; margin-top: 4px;">${threshold}°C</div>
            </td>
            <td style="padding: 8px 12px; text-align: center; border-right: 1px solid #fecaca;">
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Max Detected</div>
              <div style="font-size: 24px; font-weight: 700; color: #ef4444; margin-top: 4px;">${maxTemp}°C</div>
            </td>
            <td style="padding: 8px 12px; text-align: center;">
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Avg Temp</div>
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b; margin-top: 4px;">${avgTemp}°C</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Heatmap Image -->
      ${heatmapUrl ? `
      <div style="margin-bottom: 24px;">
        <p style="font-size: 13px; font-weight: 600; color: #334155; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          📸 Thermal Heatmap
        </p>
        <img src="${heatmapUrl}" alt="Thermal Heatmap" style="width: 100%; border-radius: 10px; border: 1px solid #e2e8f0;" />
      </div>
      ` : ''}

      <!-- Stats Row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; background: #f8fafc; border-radius: 8px 0 0 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Hotspots</div>
            <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${hotspotCount}</div>
          </td>
          <td style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-left: none; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Exceeded By</div>
            <div style="font-size: 20px; font-weight: 700; color: #dc2626;">+${(maxTemp - threshold).toFixed(1)}°C</div>
          </td>
          <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 8px 0; border: 1px solid #e2e8f0; border-left: none; text-align: center;">
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Session</div>
            <div style="font-size: 14px; font-weight: 600; color: #3b82f6;">#${sessionId.slice(-6)}</div>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 8px;">
        <a href="${frontendUrl}/visualization" 
           style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
          View Full Analysis →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-radius: 0 0 16px 16px; padding: 20px 28px; text-align: center; border: 1px solid #e2e8f0; border-top: none;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
        This alert was sent by <strong>Stellar VisionX</strong> based on your configured threshold of ${threshold}°C.
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
        You can adjust your alert preferences in the dashboard settings.
      </p>
    </div>

  </div>
</body>
</html>`;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `🔴 Thermal Alert — Max ${maxTemp}°C Detected (Threshold: ${threshold}°C)`,
    html: htmlContent,
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[EmailService] SMTP credentials not configured. Skipping email send.');
      console.log(`[EmailService] Would have sent alert to: ${toEmail}`);
      return { sent: false, reason: 'SMTP not configured' };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Alert email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${toEmail}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

module.exports = { sendAlertEmail };
