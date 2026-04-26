import { useState, useRef, useCallback } from 'react';
import { runFusion } from '../services/api';
import { UploadCloud, Image as ImageIcon, Cpu, CheckCircle, AlertCircle, Download, RotateCcw } from 'lucide-react';

const STEPS = ['Preprocessing', 'Feature Extraction', 'Fusion Model', 'Enhancement'];

function RunFusionPage() {
  const [optical, setOptical] = useState(null);
  const [thermal, setThermal] = useState(null);
  const [optPreview, setOptPreview] = useState(null);
  const [thmPreview, setThmPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, done, error
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef(null);

  const handleFile = (file, type) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'optical') { setOptical(file); setOptPreview(url); }
    else { setThermal(file); setThmPreview(url); }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    handleFile(file, type);
  };

  const handleRun = async () => {
    setStatus('processing');
    setError('');
    setCurrentStep(0);

    // Simulate step progression while waiting for real API
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('optical', optical);
      formData.append('thermal', thermal);

      const res = await runFusion(formData);
      clearInterval(stepInterval);
      setCurrentStep(STEPS.length);
      setResult(res.data);
      setStatus('done');
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.response?.data?.msg || err.message || 'Pipeline failed');
      setStatus('error');
    }
  };

  const handleSliderMove = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  }, []);

  const resetAll = () => {
    setOptical(null); setThermal(null);
    setOptPreview(null); setThmPreview(null);
    setStatus('idle'); setResult(null); setError('');
    setCurrentStep(0); setSliderPos(50);
  };

  return (
    <div>
      <div className="mb-6">
        <h1>Run Model Fusion</h1>
        <p>Upload optical and thermal satellite images to generate super-resolution thermal output.</p>
      </div>

      {/* UPLOAD PHASE */}
      {status === 'idle' && (
        <>
          <div className="grid grid-2 mb-6">
            {/* Optical Upload */}
            <div
              className={`upload-box ${optical ? 'has-file' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'optical')}
              onClick={() => document.getElementById('opt-upload').click()}
            >
              {optPreview ? (
                <img src={optPreview} alt="Optical preview" style={{ maxHeight: 180, borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <ImageIcon size={24} color="var(--accent)" />
                </div>
              )}
              <h3>{optical ? optical.name : 'Optical Image'}</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Drag & drop or click • JPG, PNG, TIFF</p>
              <input type="file" id="opt-upload" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.tiff,.tif"
                onChange={(e) => handleFile(e.target.files[0], 'optical')} />
            </div>

            {/* Thermal Upload */}
            <div
              className={`upload-box ${thermal ? 'has-file' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'thermal')}
              onClick={() => document.getElementById('thm-upload').click()}
            >
              {thmPreview ? (
                <img src={thmPreview} alt="Thermal preview" style={{ maxHeight: 180, borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <UploadCloud size={24} color="#f97316" />
                </div>
              )}
              <h3>{thermal ? thermal.name : 'Thermal Image'}</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Drag & drop or click • JPG, PNG, TIFF</p>
              <input type="file" id="thm-upload" style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.tiff,.tif"
                onChange={(e) => handleFile(e.target.files[0], 'thermal')} />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={handleRun} disabled={!optical || !thermal}
              className="btn btn-primary btn-lg btn-pill"
              style={{ padding: '1rem 3rem', fontSize: '1.05rem', boxShadow: (!optical || !thermal) ? 'none' : '0 8px 24px rgba(59,130,246,0.35)' }}>
              <Cpu size={20} /> Execute AI Fusion Pipeline
            </button>
          </div>
        </>
      )}

      {/* PROCESSING PHASE */}
      {status === 'processing' && (
        <div className="card flex flex-col items-center" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="spinner mb-6" />
          <h2 style={{ marginBottom: '2rem' }}>Processing Multi-Agent Pipeline...</h2>
          <div className="progress-bar mb-6" style={{ maxWidth: 400 }}>
            <div className="progress-fill" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-3" style={{ textAlign: 'left' }}>
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3" style={{
                color: i < currentStep ? 'var(--success)' : i === currentStep ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: i === currentStep ? 600 : 400,
              }}>
                {i < currentStep ? <CheckCircle size={18} /> : <Cpu size={18} />}
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR PHASE */}
      {status === 'error' && (
        <div className="card flex flex-col items-center" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--error)' }}>Pipeline Error</h2>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={resetAll} className="btn btn-primary"><RotateCcw size={16} /> Try Again</button>
        </div>
      )}

      {/* RESULT PHASE */}
      {status === 'done' && result && (
        <div>
          {/* Before/After Slider */}
          <div className="card mb-6" style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>Before vs After Comparison</h2>
            <div
              ref={sliderRef}
              className="comparison-container"
              style={{ height: 420, position: 'relative' }}
              onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
              onTouchMove={handleSliderMove}
            >
              {/* After (result) — full width background */}
              <img src={result.resultImageUrl} alt="Enhanced" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Before (thermal input) — clipped */}
              <div style={{ position: 'absolute', inset: 0, width: `${sliderPos}%`, overflow: 'hidden' }}>
                <img src={result.thermalImageUrl} alt="Original" style={{ width: sliderRef.current?.offsetWidth || '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Slider Line */}
              <div className="comparison-slider" style={{ left: `${sliderPos}%` }} />
              <span className="comparison-label" style={{ left: '1rem' }}>Input Thermal</span>
              <span className="comparison-label" style={{ right: '1rem' }}>Enhanced HR Output</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-3 mb-6">
            <div className="card card-stat">
              <div className="icon-box" style={{ background: '#ecfdf5', color: 'var(--success)' }}><ShieldIcon /></div>
              <div className="stat-info"><p>Accuracy</p><h3>{result.metrics?.accuracy ?? '—'}%</h3></div>
            </div>
            <div className="card card-stat">
              <div className="icon-box" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}><Cpu size={22} /></div>
              <div className="stat-info"><p>Confidence</p><h3>{result.metrics?.confidence ?? '—'}%</h3></div>
            </div>
            <div className="card card-stat">
              <div className="icon-box" style={{ background: '#f5f3ff', color: 'var(--purple)' }}><ClockIcon /></div>
              <div className="stat-info"><p>Process Time</p><h3>{result.metrics?.processingTimeMs ? `${(result.metrics.processingTimeMs / 1000).toFixed(1)}s` : '—'}</h3></div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button onClick={resetAll} className="btn btn-primary btn-lg"><RotateCcw size={18} /> Run Another</button>
            <a href={result.resultImageUrl} download className="btn btn-secondary btn-lg"><Download size={18} /> Download Result</a>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function ClockIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }

export default RunFusionPage;
