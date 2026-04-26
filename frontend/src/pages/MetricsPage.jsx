import { useState, useEffect } from 'react';
import { getMetricsOverview, getMetricsHistory, getSessions } from '../services/api';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Gauge, Shield, Layers, Download } from 'lucide-react';

function MetricsPage() {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    getMetricsOverview().then(r => setOverview(r.data)).catch(() => {});
    getMetricsHistory().then(r => {
      const data = r.data.map((s, i) => ({
        name: `#${i + 1}`,
        psnr: s.metrics?.psnr || 0,
        ssim: (s.metrics?.ssim || 0) * 100,
        accuracy: s.metrics?.accuracy || 0,
        processingTime: (s.metrics?.processingTimeMs || 0) / 1000,
        hotspots: s.metrics?.hotspotsDetected || 0,
      }));
      setHistory(data);
    }).catch(() => {});
    getSessions().then(r => setSessions(r.data.filter(s => s.status === 'completed'))).catch(() => {});
  }, []);

  const latestSession = sessions[0];
  const metricCards = [
    { label: 'PSNR', value: latestSession?.metrics?.psnr ?? '—', unit: 'dB', icon: TrendingUp, color: '#3b82f6' },
    { label: 'SSIM', value: latestSession?.metrics?.ssim ?? '—', unit: '', icon: Gauge, color: '#10b981' },
    { label: 'RMSE', value: latestSession?.metrics?.rmse ?? '—', unit: '', icon: Activity, color: '#f59e0b' },
    { label: 'Thermal Fidelity', value: latestSession?.metrics?.thermalFidelity ?? '—', unit: '%', icon: Shield, color: '#ef4444' },
    { label: 'Edge Preservation', value: latestSession?.metrics?.edgePreservation ?? '—', unit: '%', icon: Layers, color: '#8b5cf6' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>System Metrics</h1>
          <p>Real-time performance data from completed fusion sessions.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-5 mb-6">
        {metricCards.map((m, i) => (
          <div key={i} className="card card-stat">
            <div className="icon-box" style={{ background: `${m.color}12`, color: m.color }}>
              <m.icon size={20} />
            </div>
            <div className="stat-info">
              <p>{m.label}</p>
              <h3>{m.value}{m.unit}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Quality + Confidence */}
      <div className="grid grid-2 mb-6">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Overall Quality Score</p>
          <h1 style={{ fontSize: '3rem', color: 'var(--success)', margin: 0 }}>
            {latestSession?.metrics?.accuracy ?? '—'}%
          </h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Confidence Level</p>
          <h1 style={{ fontSize: '3rem', color: 'var(--accent)', margin: 0 }}>
            {latestSession?.metrics?.confidence ?? '—'}%
          </h1>
        </div>
      </div>

      {/* Charts */}
      {history.length > 0 && (
        <>
          <div className="grid grid-2 mb-6">
            <div className="card">
              <h2>Accuracy Over Time</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2>Processing Time (seconds)</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="processingTime" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <h2>Hotspots Detected</h2>
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="hotspots" stroke="#ef4444" fill="#fecaca" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {history.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p>No session data yet. Run a fusion to see metrics and graphs.</p>
        </div>
      )}

      {/* Export */}
      <div className="card">
        <h2>Export</h2>
        <div className="flex gap-3 mt-4">
          {latestSession?.resultImageUrl && (
            <a href={latestSession.resultImageUrl} download className="btn btn-secondary"><Download size={16} /> Download Image</a>
          )}
          {latestSession?.heatmapUrl && (
            <a href={latestSession.heatmapUrl} download className="btn btn-secondary"><Download size={16} /> Download Heatmap</a>
          )}
          <button className="btn btn-primary" onClick={() => window.location.href = '/reports'}>
            <Download size={16} /> Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default MetricsPage;
