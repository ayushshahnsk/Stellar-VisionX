import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9)), url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80")',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center', padding: '2rem',
    }}>
      {/* Glass Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '4rem 3rem',
        maxWidth: '720px', width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <Sparkles size={32} color="white" />
          </div>
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'white', letterSpacing: '-1px' }}>
          Stellar VisionX
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '1rem', fontWeight: 400 }}>
          Advanced thermal-optical image super-resolution system
        </p>
        <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 2.5rem' }}>
          Leverage multi-agent deep learning to fuse low-resolution thermal signatures with high-resolution
          optical imagery. Uncover hidden patterns in urban heat, wildfire zones, and environmental data.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary btn-lg btn-pill"
          style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
        >
          Access Portal <ArrowRight size={20} />
        </button>
      </div>

      {/* Feature Badges */}
      <div className="flex gap-6" style={{ marginTop: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: Shield, label: 'Secure Processing' },
          { icon: Zap, label: 'Real-time Fusion' },
          { icon: BarChart3, label: 'Precision Metrics' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            <f.icon size={16} /> {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;
