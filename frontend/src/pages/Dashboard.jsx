import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMetricsOverview, getSessions } from '../services/api';
import { Layers, ShieldCheck, Activity, Zap, Clock, Play, FileText } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    getMetricsOverview().then(r => setOverview(r.data)).catch(() => {});
    getSessions().then(r => setSessions(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const stats = [
    { title: 'Total Fusions', value: overview?.totalFusions ?? '—', icon: Layers, color: '#3b82f6' },
    { title: 'Avg Accuracy', value: overview?.avgAccuracy ? `${overview.avgAccuracy}%` : '—', icon: ShieldCheck, color: '#10b981' },
    { title: 'Hotspots Detected', value: overview?.totalHotspots ?? '—', icon: Activity, color: '#ef4444' },
    { title: 'Sessions', value: sessions.length, icon: Zap, color: '#f59e0b' },
    { title: 'Avg Process Time', value: overview?.avgProcessingTime ? `${overview.avgProcessingTime}s` : '—', icon: Clock, color: '#8b5cf6' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Welcome, {user?.name || 'User'}</h1>
          <p>Last login: {new Date().toLocaleString()}</p>
        </div>
        <div className="badge badge-success">
          <div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%' }} />
          System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-5 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="card card-stat">
            <div className="icon-box" style={{ background: `${s.color}12`, color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="stat-info">
              <p>{s.title}</p>
              <h3>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Sessions */}
      <div className="grid grid-sidebar">
        <div className="card">
          <h2>Quick Actions</h2>
          <div className="flex flex-col gap-3 mt-4">
            <button onClick={() => navigate('/fusion')} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Play size={18} /> Run New Fusion
            </button>
            <button onClick={() => navigate('/reports')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <FileText size={18} /> View Reports
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0' }}>No sessions yet. Run your first fusion!</p>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              {sessions.map((s) => (
                <div key={s._id} className="flex justify-between items-center"
                  style={{ padding: '0.875rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => navigate('/visualization', { state: { session: s } })}
                >
                  <div className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={16} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.85rem' }}>Session {s._id.slice(-6)}</h3>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>PSNR: {s.metrics?.psnr ?? '—'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'error' ? 'error' : 'warning'}`}>
                      {s.status}
                    </span>
                    <p style={{ fontSize: '0.7rem', margin: '0.25rem 0 0' }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
