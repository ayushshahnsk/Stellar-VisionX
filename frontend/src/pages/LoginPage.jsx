import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container" style={{ height: '100vh' }}>
      {/* LEFT SIDE */}
      <div style={{
        flex: 1,
        backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.92)), url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding: '4rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        color: 'white', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0 }}>Stellar VisionX</h1>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--accent)', marginBottom: '2rem' }}>
            Thermal-Optical Image Super-Resolution Portal
          </h2>

          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '3rem' }}>
            Advanced satellite imagery processing for urban heat analysis,
            wildfire detection, and environmental monitoring. Upload, fuse, and extract
            high-fidelity intelligence from multi-spectral data instantly.
          </p>

          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Powered by — <strong style={{ color: '#94a3b8' }}>Team Genesis</strong>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{
        flex: 1,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Welcome Back</h2>
          <p style={{ marginBottom: '2rem' }}>Sign in to access your dashboard</p>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="icon-left" />
                <input type="email" className="input-field" placeholder="admin@genesis.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="icon-left" />
                <input type={showPassword ? 'text' : 'password'} className="input-field"
                  placeholder="••••••••" style={{ paddingRight: '2.75rem' }}
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="icon-right">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6" style={{ fontSize: '0.85rem' }}>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', padding: '0.875rem' }}>
              {loading ? 'Signing in...' : 'Login to Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
