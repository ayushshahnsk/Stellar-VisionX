import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Layers, BarChart3, Eye, FileText,
  Server, Activity, LogOut, User, Sparkles, Bell
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Run Fusion', path: '/fusion', icon: Layers },
  { name: 'Metrics', path: '/metrics', icon: BarChart3 },
  { name: 'Visualization', path: '/visualization', icon: Eye },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'System Status', path: '/status', icon: Server },
  { name: 'Activity Timeline', path: '/timeline', icon: Activity },
];

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div>
        {/* Brand */}
        <div style={{ padding: '1.75rem 1.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Stellar VisionX</h3>
              <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>AI Fusion Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1rem 0.75rem' }} className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div style={{ padding: '1rem 1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'user@genesis.com'}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
