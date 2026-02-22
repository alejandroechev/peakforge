import { useRef } from 'react';
import type { ProfileType, BaselineMethod } from '@peakforge/engine';
import { SAMPLES } from '../samples';

interface ToolbarProps {
  hasData: boolean;
  baseline: boolean;
  baselineMethod: string;
  profile: ProfileType;
  hasPeaks: boolean;
  hasFit: boolean;
  theme: 'light' | 'dark';
  onUpload: (text: string) => void;
  onToggleBaseline: () => void;
  onBaselineMethod: (m: BaselineMethod) => void;
  onProfile: (p: ProfileType) => void;
  onDetect: () => void;
  onFit: () => void;
  onTheme: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(props.onUpload);
    e.target.value = '';
  };

  return (
    <div className="toolbar">
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

      <div className="separator" />

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
        </select>
      )}

      <div className="separator" />

      <button disabled={!props.hasData} onClick={props.onDetect}>
        🔍 Detect Peaks
      </button>

      <select
        value={props.profile}
        onChange={e => props.onProfile(e.target.value as ProfileType)}
      >
        <option value="gaussian">Gaussian</option>
        <option value="lorentzian">Lorentzian</option>
        <option value="pseudoVoigt">Pseudo-Voigt</option>
      </select>

      <button className="primary" disabled={!props.hasPeaks} onClick={props.onFit}>
        📈 Fit
      </button>

      <div style={{ flex: 1 }} />

      <button onClick={() => window.open('/intro.html', '_blank')}>📖 Guide</button>
      <button onClick={() => window.open('https://github.com/alejandroechev/peakforge/issues/new', '_blank')} title="Feedback">💬 Feedback</button>

      <button onClick={props.onTheme}>
        {props.theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
}
