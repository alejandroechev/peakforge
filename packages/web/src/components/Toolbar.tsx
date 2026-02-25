import { useRef, useState } from 'react';
import type { ProfileType, BaselineMethod } from '@peakforge/engine';
import { SAMPLES } from '../samples';
import { FeedbackModal } from './FeedbackModal';

interface ToolbarProps {
  hasData: boolean;
  baseline: boolean;
  baselineMethod: BaselineMethod;
  aslsLambda: number;
  aslsP: number;
  aslsIterations: number;
  profile: ProfileType;
  hasPeaks: boolean;
  peakCount: number;
  maxPeakCount: number;
  hasFit: boolean;
  theme: 'light' | 'dark';
  onUpload: (text: string) => void;
  onToggleBaseline: () => void;
  onBaselineMethod: (m: BaselineMethod) => void;
  onAslsLambda: (value: number) => void;
  onAslsP: (value: number) => void;
  onAslsIterations: (value: number) => void;
  onProfile: (p: ProfileType) => void;
  onPeakCount: (value: number) => void;
  onDetect: () => void;
  onFit: () => void;
  onTheme: () => void;
  detectNotice?: string;
  regionLabel?: string;
}

export function Toolbar(props: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(props.onUpload);
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <span className="logo">⚗️ PeakForge</span>
        <div className="separator" />

        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" hidden onChange={handleFile} />
        <button onClick={() => fileRef.current?.click()}>📂 Upload CSV</button>

        <select
          value=""
          onChange={e => { if (e.target.value) props.onUpload(e.target.value); e.target.value = ''; }}
          title="Load a sample spectrum"
        >
          <option value="">📂 Samples</option>
          {SAMPLES.map(s => (
            <option key={s.name} value={s.csv}>{s.name}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <button onClick={() => window.open('/intro.html', '_blank')}>📖 Guide</button>
        <button onClick={() => setShowFeedback(true)} title="Feedback">💬 Feedback</button>
        <a href="https://github.com/alejandroechev/peakforge" target="_blank" rel="noopener" className="github-link">GitHub</a>

        <button onClick={props.onTheme}>
          {props.theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="toolbar-row toolbar-controls-row">
        <button
          disabled={!props.hasData}
          onClick={props.onToggleBaseline}
          style={props.baseline ? { background: 'var(--accent)', color: '#fff' } : {}}
        >
          📐 Baseline {props.baseline ? 'ON' : 'OFF'}
        </button>

        {props.baseline && (
          <select
            value={props.baselineMethod}
            onChange={e => props.onBaselineMethod(e.target.value as BaselineMethod)}
          >
            <option value="linear">Linear</option>
            <option value="polynomial">Polynomial</option>
            <option value="asls">AsLS</option>
          </select>
        )}

        {props.baseline && props.baselineMethod === 'asls' && (
          <>
            <label className="toolbar-inline-label">
              λ
              <input
                type="number"
                min={1}
                step={1000}
                value={props.aslsLambda}
                onChange={e => props.onAslsLambda(Number(e.target.value) || 1)}
              />
            </label>
            <label className="toolbar-inline-label">
              p
              <input
                type="number"
                min={0.000001}
                max={0.499}
                step={0.001}
                value={props.aslsP}
                onChange={e => props.onAslsP(Number(e.target.value))}
              />
            </label>
            <label className="toolbar-inline-label">
              iters
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={props.aslsIterations}
                onChange={e => props.onAslsIterations(Number(e.target.value) || 1)}
              />
            </label>
          </>
        )}

        <div className="separator" />

        {props.regionLabel && (
          <span className="region-badge" data-testid="region-badge">
            ✂️ Region: {props.regionLabel}
          </span>
        )}

        <button disabled={!props.hasData} onClick={props.onDetect}>
          🔍 Detect Peaks
        </button>

        {props.detectNotice && (
          <span className="detect-notice" data-testid="detect-notice" role="status" aria-live="polite">
            {props.detectNotice}
          </span>
        )}

        <select
          value={props.profile}
          onChange={e => props.onProfile(e.target.value as ProfileType)}
        >
          <option value="gaussian">Gaussian</option>
          <option value="lorentzian">Lorentzian</option>
          <option value="pseudoVoigt">Pseudo-Voigt</option>
        </select>

        {props.hasPeaks && (
          <label className="toolbar-inline-label">
            Peaks
            <input
              type="number"
              min={1}
              max={Math.max(1, props.maxPeakCount)}
              value={props.peakCount}
              onChange={e => props.onPeakCount(Number(e.target.value) || 1)}
            />
          </label>
        )}

        <button className="primary" disabled={!props.hasPeaks} onClick={props.onFit}>
          📈 Fit
        </button>
      </div>

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} product="PeakForge" />
    </div>
  );
}
