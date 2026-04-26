import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAlertPreferences,
  updateAlertPreferences,
  getAlertHistory,
  acknowledgeAlert,
} from '../services/api';
import {
  Bell, Thermometer, Mail, Save, CheckCircle, AlertTriangle,
  XCircle, Eye, Clock, Shield, ChevronLeft, ChevronRight, Flame
} from 'lucide-react';

function AlertsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({ temperatureThreshold: 45, emailAlertsEnabled: true });
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(45);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  const fetchData = useCallback(async (page = 1) => {
    try {
      const [prefsRes, alertsRes] = await Promise.all([
        getAlertPreferences(),
        getAlertHistory({ page, limit: 10 }),
      ]);
      setPrefs(prefsRes.data);
      setTempThreshold(prefsRes.data.temperatureThreshold);
      setEmailEnabled(prefsRes.data.emailAlertsEnabled);
      setAlerts(alertsRes.data.alerts);
      setPagination(alertsRes.data.pagination);
    } catch (err) {
      console.error('Failed to load alert data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await updateAlertPreferences({
        temperatureThreshold: tempThreshold,
        emailAlertsEnabled: emailEnabled,
      });
      setPrefs(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (alertId, status) => {
    try {
      await acknowledgeAlert(alertId, status);
      setAlerts(prev =>
        prev.map(a => a._id === alertId ? { ...a, status } : a)
      );
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'triggered');
  const historyAlerts = alerts;

  // Get severity class based on how much threshold is exceeded
  const getSeverity = (maxTemp, threshold) => {
    const diff = maxTemp - threshold;
    if (diff >= 20) return { label: 'Critical', color: '#dc2626', bg: '#fef2f2' };
    if (diff >= 10) return { label: 'High', color: '#ea580c', bg: '#fff7ed' };
    if (diff >= 5) return { label: 'Warning', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Low', color: '#eab308', bg: '#fefce8' };
  };

  // Get thermal gradient color based on temperature value
  const getTempColor = (temp) => {
    if (temp >= 60) return '#dc2626';
    if (temp >= 45) return '#ef4444';
    if (temp >= 35) return '#f97316';
    if (temp >= 25) return '#eab308';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <div>
        <h1>Thermal Alerts</h1>
        <div className="card flex justify-center items-center" style={{ padding: '4rem' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Thermal Alerts</h1>
          <p>Configure temperature thresholds and manage alert notifications.</p>
        </div>
        {activeAlerts.length > 0 && (
          <div className="badge badge-error" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <Flame size={16} />
            {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
          </div>
        )}
      </div>

      {/* Threshold Configuration */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(239,68,68,0.03) 100%)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative thermal gradient line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #3b82f6 0%, #eab308 30%, #f97316 60%, #ef4444 80%, #dc2626 100%)',
        }} />

        <div style={{ padding: '0.5rem 0 0' }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Thermometer size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Temperature Threshold</h2>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>Alerts trigger when heatmap temperature exceeds this value</p>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
            {/* Threshold Slider & Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="input-label" style={{ margin: 0 }}>Threshold (°C)</label>
                <span style={{
                  fontSize: '1.5rem', fontWeight: 700,
                  color: getTempColor(tempThreshold),
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {tempThreshold}°C
                </span>
              </div>

              {/* Slider Track */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <input
                  type="range"
                  min="15"
                  max="100"
                  step="1"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(Number(e.target.value))}
                  id="threshold-slider"
                  style={{
                    width: '100%', height: 8, appearance: 'none', borderRadius: 50,
                    background: `linear-gradient(90deg, #3b82f6 0%, #eab308 30%, #f97316 60%, #ef4444 80%, #dc2626 100%)`,
                    outline: 'none', cursor: 'pointer',
                  }}
                />
                <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  <span>15°C</span>
                  <span>Cool</span>
                  <span>Warm</span>
                  <span>Hot</span>
                  <span>100°C</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {[30, 40, 45, 50, 60, 75].map(t => (
                  <button
                    key={t}
                    onClick={() => setTempThreshold(t)}
                    className={`btn ${tempThreshold === t ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', minWidth: 52 }}
                  >
                    {t}°C
                  </button>
                ))}
              </div>
            </div>

            {/* Email Toggle & Save */}
            <div>
              <div style={{
                background: 'var(--panel)', borderRadius: 'var(--radius-md)',
                padding: '1.25rem', border: '1px solid var(--border)',
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail size={18} color="var(--accent)" />
                    <div>
                      <h3 style={{ fontSize: '0.9rem' }}>Email Notifications</h3>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>Send alerts to your registered email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    id="email-toggle"
                    style={{
                      width: 48, height: 26, borderRadius: 13, border: 'none',
                      background: emailEnabled ? 'var(--success)' : '#cbd5e1',
                      cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: emailEnabled ? 25 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                <div style={{
                  background: emailEnabled ? '#ecfdf5' : '#f8fafc',
                  borderRadius: 'var(--radius-sm)', padding: '0.75rem',
                  fontSize: '0.8rem', color: emailEnabled ? 'var(--success)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease', marginBottom: '1.25rem',
                }}>
                  {emailEnabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {emailEnabled
                    ? 'Email alerts are active — you\'ll receive notifications when threshold is exceeded'
                    : 'Email alerts are disabled — alerts will only show in the dashboard'}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                  id="save-preferences-btn"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  {saving ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</>
                  ) : saveSuccess ? (
                    <><CheckCircle size={16} /> Saved Successfully!</>
                  ) : (
                    <><Save size={16} /> Save Preferences</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-active-alerts"
          style={{ position: 'relative' }}
        >
          <AlertTriangle size={16} />
          Active Alerts
          {activeAlerts.length > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', color: 'white', fontSize: '0.7rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-alert-history"
        >
          <Clock size={16} />
          Alert History
          <span className="badge badge-info" style={{ marginLeft: 4, padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
            {pagination.total}
          </span>
        </button>
      </div>

      {/* Active Alerts Panel */}
      {activeTab === 'active' && (
        <div>
          {activeAlerts.length === 0 ? (
            <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#ecfdf5', margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={32} color="var(--success)" />
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>All Clear</h2>
              <p>No active thermal alerts. Your systems are operating within safe temperature ranges.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeAlerts.map((alert) => {
                const severity = getSeverity(alert.maxTempDetected, alert.threshold);
                return (
                  <div key={alert._id} className="card" style={{
                    borderLeft: `4px solid ${severity.color}`,
                    transition: 'all 0.2s ease',
                  }}>
                    <div className="flex justify-between items-start" style={{ gap: '1.5rem' }}>
                      {/* Left: Alert Info */}
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-3 mb-3">
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.3rem 0.75rem', borderRadius: 50,
                            background: severity.bg, color: severity.color,
                            fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            <AlertTriangle size={12} />
                            {severity.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                          Temperature Threshold Exceeded
                        </h3>

                        {/* Temperature Stats */}
                        <div className="flex gap-6" style={{ marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Detected</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                              {alert.maxTempDetected}°C
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Threshold</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                              {alert.threshold}°C
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exceeded By</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                              +{(alert.maxTempDetected - alert.threshold).toFixed(1)}°C
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hotspots</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f97316' }}>
                              {alert.hotspotCount}
                            </div>
                          </div>
                        </div>

                        {/* Email status */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {alert.emailSent ? (
                            <span className="flex items-center gap-2" style={{ color: 'var(--success)' }}>
                              <Mail size={13} /> Email sent {alert.emailSentAt ? `at ${new Date(alert.emailSentAt).toLocaleTimeString()}` : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Mail size={13} /> Email notification pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Heatmap Thumbnail */}
                      <div style={{ flexShrink: 0 }}>
                        {alert.heatmapUrl && (
                          <div style={{
                            width: 140, height: 100, borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden', border: '1px solid var(--border)',
                            cursor: 'pointer', position: 'relative',
                          }}
                            onClick={() => navigate('/visualization')}
                          >
                            <img
                              src={alert.heatmapUrl}
                              alt="Heatmap"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.5))',
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                              padding: '0.375rem',
                            }}>
                              <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 500 }}>
                                <Eye size={10} /> View
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => handleAcknowledge(alert._id, 'acknowledged')}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        <CheckCircle size={14} /> Acknowledge
                      </button>
                      <button
                        onClick={() => handleAcknowledge(alert._id, 'dismissed')}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        <XCircle size={14} /> Dismiss
                      </button>
                      <button
                        onClick={() => navigate('/visualization')}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        <Eye size={14} /> View Analysis
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alert History Table */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '0' }}>
          {historyAlerts.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <Bell size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h2>No Alert History</h2>
              <p>Alerts will appear here once your thermal scans trigger threshold violations.</p>
            </div>
          ) : (
            <>
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Max Temp</th>
                    <th>Threshold</th>
                    <th>Hotspots</th>
                    <th>Severity</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Heatmap</th>
                  </tr>
                </thead>
                <tbody>
                  {historyAlerts.map((alert) => {
                    const severity = getSeverity(alert.maxTempDetected, alert.threshold);
                    return (
                      <tr key={alert._id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {new Date(alert.createdAt).toLocaleDateString()}<br />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: getTempColor(alert.maxTempDetected), fontSize: '0.95rem' }}>
                            {alert.maxTempDetected}°C
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{alert.threshold}°C</span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#fff7ed', color: '#f97316', fontWeight: 600, fontSize: '0.85rem',
                          }}>
                            {alert.hotspotCount}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.25rem 0.625rem', borderRadius: 50,
                            background: severity.bg, color: severity.color,
                            fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            {severity.label}
                          </span>
                        </td>
                        <td>
                          {alert.emailSent ? (
                            <span className="flex items-center gap-1" style={{ color: 'var(--success)', fontSize: '0.8rem' }}>
                              <CheckCircle size={13} /> Sent
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${
                            alert.status === 'triggered' ? 'error' :
                            alert.status === 'acknowledged' ? 'success' : 'warning'
                          }`} style={{ fontSize: '0.75rem' }}>
                            {alert.status}
                          </span>
                        </td>
                        <td>
                          {alert.heatmapUrl ? (
                            <div
                              style={{
                                width: 48, height: 36, borderRadius: 6,
                                overflow: 'hidden', cursor: 'pointer',
                                border: '1px solid var(--border)',
                              }}
                              onClick={() => navigate('/visualization')}
                            >
                              <img
                                src={alert.heatmapUrl}
                                alt="Heatmap"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => fetchData(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchData(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertsPage;
