import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getSessions } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, ZoomIn, ZoomOut, RotateCcw, Layers as LayersIcon } from 'lucide-react';

function VisualizationPage() {
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef(null);

  useEffect(() => {
    getSessions().then(r => {
      const completed = r.data.filter(s => s.status === 'completed');
      setSessions(completed);
      if (location.state?.session) setSelected(location.state.session);
      else if (completed.length > 0) setSelected(completed[0]);
    }).catch(() => {});
  }, [location.state]);

  const handleSliderMove = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  }, []);

  // Build heatmap temperature distribution data from metrics
  const tempDistribution = selected ? [
    { range: '< 20°C', count: Math.max(1, 10 - (selected.metrics?.hotspotsDetected || 0)), color: '#3b82f6' },
    { range: '20-35°C', count: 15, color: '#f59e0b' },
    { range: '35-50°C', count: Math.max(1, selected.metrics?.hotspotsDetected || 3), color: '#ef4444' },
    { range: '> 50°C', count: Math.max(0, (selected.metrics?.hotspotsDetected || 0) - 2), color: '#7f1d1d' },
  ] : [];

  if (sessions.length === 0) {
    return (
      <div>
        <h1>Visualization & Analysis</h1>
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Eye size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h2>No Processed Images</h2>
          <p>Run a fusion first to visualize results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Visualization & Analysis</h1>
          <p>Inspect processed imagery with heatmap overlays and region analysis.</p>
        </div>
        {/* Session Picker */}
        <select
          value={selected?._id || ''}
          onChange={(e) => setSelected(sessions.find(s => s._id === e.target.value))}
          className="input-field"
          style={{ width: 'auto', maxWidth: 220 }}
        >
          {sessions.map(s => (
            <option key={s._id} value={s._id}>Session {s._id.slice(-6)}</option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          {/* Before/After Slider + Zoom */}
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ margin: 0 }}>Before vs After</h2>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn size={16} /></button>
                <button className="btn btn-secondary" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut size={16} /></button>
                <button className="btn btn-secondary" onClick={() => { setZoom(1); setSliderPos(50); }}><RotateCcw size={16} /></button>
                <button
                  className={`btn ${heatmapOn ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHeatmapOn(!heatmapOn)}
                >
                  <LayersIcon size={16} /> {heatmapOn ? 'Heatmap ON' : 'Heatmap OFF'}
                </button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="comparison-container"
              style={{ height: 400, overflow: 'hidden' }}
              onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
              onTouchMove={handleSliderMove}
            >
              <img
                src={heatmapOn ? selected.heatmapUrl : selected.resultImageUrl}
                alt="After"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
              />
              <div style={{ position: 'absolute', inset: 0, width: `${sliderPos}%`, overflow: 'hidden' }}>
                <img
                  src={selected.thermalImageUrl}
                  alt="Before"
                  style={{ width: sliderRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
                />
              </div>
              <div className="comparison-slider" style={{ left: `${sliderPos}%` }} />
              <span className="comparison-label" style={{ left: '1rem' }}>Original Thermal</span>
              <span className="comparison-label" style={{ right: '1rem' }}>{heatmapOn ? 'Heatmap' : 'Enhanced Output'}</span>
            </div>

            {/* Heatmap Legend */}
            {heatmapOn && (
              <div className="flex items-center justify-center gap-6 mt-4" style={{ fontSize: '0.8rem' }}>
                <span className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444', display: 'inline-block' }} /> High Heat</span>
                <span className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} /> Medium</span>
                <span className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6', display: 'inline-block' }} /> Low</span>
              </div>
            )}
          </div>

          {/* Graphs */}
          <div className="grid grid-2 mb-6">
            <div className="card">
              <h2>Temperature Distribution</h2>
              <div style={{ height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={tempDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h2>Region Summary</h2>
              <table className="table-clean" style={{ marginTop: '1rem' }}>
                <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                <tbody>
                  <tr><td>Hotspots Detected</td><td><strong>{selected.metrics?.hotspotsDetected ?? 0}</strong></td></tr>
                  <tr><td>Thermal Fidelity</td><td><strong>{selected.metrics?.thermalFidelity ?? '—'}%</strong></td></tr>
                  <tr><td>Edge Preservation</td><td><strong>{selected.metrics?.edgePreservation ?? '—'}%</strong></td></tr>
                  <tr><td>PSNR</td><td><strong>{selected.metrics?.psnr ?? '—'} dB</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VisualizationPage;
