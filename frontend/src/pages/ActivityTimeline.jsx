import { useState, useEffect } from 'react';
import { getActivityLogs } from '../services/api';
import { Upload, Layers, AlertTriangle, Server, LogIn, Download, Search, Filter } from 'lucide-react';

const TYPE_CONFIG = {
  upload: { icon: Upload, color: 'var(--info)', dotClass: 'info', label: 'Upload' },
  fusion: { icon: Layers, color: 'var(--success)', dotClass: 'success', label: 'Fusion' },
  error: { icon: AlertTriangle, color: 'var(--error)', dotClass: 'error', label: 'Error' },
  system: { icon: Server, color: 'var(--text-muted)', dotClass: 'info', label: 'System' },
  login: { icon: LogIn, color: 'var(--accent)', dotClass: 'info', label: 'Login' },
  export: { icon: Download, color: 'var(--purple)', dotClass: 'info', label: 'Export' },
};

const STATUS_DOT = {
  success: 'success',
  info: 'info',
  processing: 'warning',
  error: 'error',
};

function ActivityTimeline() {
  const [logs, setLogs] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search) params.search = search;

    getActivityLogs(params)
      .then(r => setLogs(r.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [typeFilter, search]);

  return (
    <div>
      <h1 className="mb-2">Activity Timeline</h1>
      <p className="mb-6">Chronological record of all system events, uploads, and pipeline runs.</p>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-2">
            <Filter size={16} color="var(--text-muted)" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field" style={{ width: 160 }}>
              <option value="all">All Types</option>
              <option value="upload">Upload</option>
              <option value="fusion">Fusion</option>
              <option value="error">Error</option>
              <option value="system">System</option>
              <option value="login">Login</option>
            </select>
          </div>
          <div className="input-icon-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="icon-left" />
            <input className="input-field" placeholder="Search events..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <p>No activity logs found. Events appear here as you use the system.</p>
        </div>
      ) : (
        <div className="card">
          <div className="timeline">
            {logs.map((log) => {
              const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.system;
              const dotClass = STATUS_DOT[log.status] || 'info';
              return (
                <div key={log._id} className="timeline-item">
                  <div className={`timeline-dot ${dotClass}`} />
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                    <div className="flex items-center gap-2">
                      <cfg.icon size={16} color={cfg.color} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{log.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;
