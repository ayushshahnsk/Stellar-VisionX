import { useState, useEffect } from 'react';
import { getSystemStatus } from '../services/api';
import { Server, Database, HardDrive, Shield, Cpu, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const STATUS_ICON = {
  Online: <CheckCircle size={18} color="var(--success)" />,
  Warning: <AlertTriangle size={18} color="var(--warning)" />,
  Down: <XCircle size={18} color="var(--error)" />,
};

const STATUS_BADGE = {
  Online: 'badge-success',
  Warning: 'badge-warning',
  Down: 'badge-error',
};

function SystemStatusPage() {
  const [status, setStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = () => {
    getSystemStatus()
      .then(r => { setStatus(r.data); setLastUpdated(new Date()); })
      .catch(() => setStatus({ status: 'Down', services: { api: 'Down', database: 'Down', storage: 'Down', auth: 'Down', aiModel: 'Down' } }));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div className="flex justify-center items-center" style={{ height: '50vh' }}><div className="spinner" /></div>;

  const services = [
    { name: 'API Server', key: 'api', icon: Server },
    { name: 'Database', key: 'database', icon: Database },
    { name: 'Storage (Cloudinary)', key: 'storage', icon: HardDrive },
    { name: 'Authentication', key: 'auth', icon: Shield },
  ];

  const overallStatus = status.status || 'Down';

  return (
    <div>
      {/* Top Banner */}
      <div className="card mb-6" style={{
        background: overallStatus === 'Online' ? 'var(--success-bg)' : overallStatus === 'Warning' ? 'var(--warning-bg)' : 'var(--error-bg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div className="flex items-center gap-3">
          {STATUS_ICON[overallStatus]}
          <div>
            <h2 style={{ margin: 0, color: overallStatus === 'Online' ? 'var(--success)' : overallStatus === 'Warning' ? 'var(--warning)' : 'var(--error)' }}>
              System {overallStatus}
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={fetchStatus}><RefreshCw size={16} /> Refresh</button>
      </div>

      <h1 className="mb-6">System Status</h1>

      {/* Service Status */}
      <div className="grid grid-2 mb-6">
        {services.map((svc) => {
          const svcStatus = status.services?.[svc.key] || 'Down';
          return (
            <div key={svc.key} className="card flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="icon-box" style={{ background: '#f1f5f9' }}>
                  <svc.icon size={20} color="var(--text-secondary)" />
                </div>
                <h3>{svc.name}</h3>
              </div>
              <span className={`badge ${STATUS_BADGE[svcStatus] || 'badge-error'}`}>
                {STATUS_ICON[svcStatus]} {svcStatus}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI Model Status */}
      <div className="card mb-6">
        <h2>AI Model Service</h2>
        <table className="table-clean" style={{ marginTop: '0.5rem' }}>
          <tbody>
            <tr>
              <td>Status</td>
              <td><span className={`badge ${STATUS_BADGE[status.services?.aiModel] || 'badge-error'}`}>{status.services?.aiModel || 'Down'}</span></td>
            </tr>
            <tr><td>GPU Availability</td><td><span className="badge badge-warning">CPU Only</span></td></tr>
            <tr><td>Model Framework</td><td>PyTorch + OpenCV</td></tr>
            <tr><td>Pipeline</td><td>Multi-Agent (6 agents)</td></tr>
          </tbody>
        </table>
      </div>

      {/* Auto-refresh notice */}
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Auto-refreshing every 5 seconds
      </p>
    </div>
  );
}

export default SystemStatusPage;
