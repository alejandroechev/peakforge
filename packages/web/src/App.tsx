import { useState, useCallback, useEffect } from 'react';
import {
  parseCSV, correctBaseline, detectPeaks, fitPeaks,
  extractMetrics, metricsToCSV,
  evaluateProfile,
  type Spectrum, type SpectrumPoint, type BaselineOptions,
  type ProfileType, type PeakParams, type FitResult, type PeakMetric,
} from '@peakforge/engine';
import { Toolbar } from './components/Toolbar';
import { SpectrumChart } from './components/SpectrumChart';
import { ResultsPanel } from './components/ResultsPanel';
import { DropZone } from './components/DropZone';

export interface AppState {
  raw: SpectrumPoint[] | null;
  corrected: SpectrumPoint[] | null;
  baseline: boolean;
  baselineOpts: BaselineOptions;
  profile: ProfileType;
  peaks: PeakParams[];
  fitResult: FitResult | null;
  metrics: PeakMetric[];
  xLabel: string;
  yLabel: string;
}

const STORAGE_KEY = 'PeakForge-state';

function loadSavedState(): Partial<AppState> | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch { return null; }
}

const PEAK_COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a',
  '#f4a261', '#264653', '#6a0572', '#118ab2',
];

export function getPeakColor(i: number): string {
  return PEAK_COLORS[i % PEAK_COLORS.length];
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('PeakForge-theme') as 'light' | 'dark') || 'light';
  });
  const savedState = loadSavedState();
  const [state, setState] = useState<AppState>(() => ({
    raw: savedState?.raw ?? null,
    corrected: savedState?.corrected ?? null,
    baseline: savedState?.baseline ?? false,
    baselineOpts: savedState?.baselineOpts ?? { method: 'linear' },
    profile: savedState?.profile ?? 'gaussian',
    peaks: savedState?.peaks ?? [],
    fitResult: savedState?.fitResult ?? null,
    metrics: savedState?.metrics ?? [],
    xLabel: savedState?.xLabel ?? 'x',
    yLabel: savedState?.yLabel ?? 'y',
  }));

  // Debounced persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          raw: state.raw, corrected: state.corrected,
          baseline: state.baseline, baselineOpts: state.baselineOpts,
          profile: state.profile, peaks: state.peaks,
          fitResult: state.fitResult, metrics: state.metrics,
          xLabel: state.xLabel, yLabel: state.yLabel,
        }));
      } catch { /* noop */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const currentPoints = state.baseline && state.corrected ? state.corrected : state.raw;

  const handleUpload = useCallback((text: string) => {
    try {
      const spectrum = parseCSV(text);
      const corrected = correctBaseline(spectrum.points, state.baselineOpts);
      setState(s => ({
        ...s,
        raw: spectrum.points,
        corrected,
        xLabel: spectrum.xLabel,
        yLabel: spectrum.yLabel,
        peaks: [], fitResult: null, metrics: [],
      }));
    } catch (e) {
      alert('Failed to parse CSV: ' + (e as Error).message);
    }
  }, [state.baselineOpts]);

  const toggleBaseline = useCallback(() => {
    setState(s => {
      const newBaseline = !s.baseline;
      if (newBaseline && s.raw && !s.corrected) {
        return { ...s, baseline: newBaseline, corrected: correctBaseline(s.raw, s.baselineOpts) };
      }
      return { ...s, baseline: newBaseline, peaks: [], fitResult: null, metrics: [] };
    });
  }, []);

  const setBaselineMethod = useCallback((method: 'linear' | 'polynomial') => {
    setState(s => {
      const opts: BaselineOptions = { ...s.baselineOpts, method };
      const corrected = s.raw ? correctBaseline(s.raw, opts) : null;
      return { ...s, baselineOpts: opts, corrected, peaks: [], fitResult: null, metrics: [] };
    });
  }, []);

  const setProfile = useCallback((profile: ProfileType) => {
    setState(s => ({ ...s, profile, fitResult: null, metrics: [] }));
  }, []);

  const handleDetect = useCallback(() => {
    if (!currentPoints) return;
    const detected = detectPeaks(currentPoints);
    const peaks: PeakParams[] = detected.map(d => ({
      x0: d.x, height: d.y, fwhm: d.estimatedFWHM, eta: 0.5,
    }));
    setState(s => ({ ...s, peaks, fitResult: null, metrics: [] }));
  }, [currentPoints]);

  const handleFit = useCallback(() => {
    if (!currentPoints || state.peaks.length === 0) return;
    try {
      const result = fitPeaks(currentPoints, state.peaks, { profile: state.profile });
      const metrics = extractMetrics(result);
      setState(s => ({ ...s, fitResult: result, metrics, peaks: result.peaks }));
    } catch (e) {
      alert('Fitting failed: ' + (e as Error).message);
    }
  }, [currentPoints, state.peaks, state.profile]);

  const handleExportResultsCSV = useCallback(() => {
    if (!state.metrics.length) return;
    const csv = metricsToCSV(state.metrics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'PeakForge-results.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [state.metrics]);

  const handleExportDataCSV = useCallback(() => {
    if (!currentPoints) return;
    let csv = `${state.xLabel},${state.yLabel}`;
    if (state.fitResult) csv += ',Fitted,Residual';
    csv += '\n';
    currentPoints.forEach((p, i) => {
      let row = `${p.x},${p.y}`;
      if (state.fitResult) row += `,${state.fitResult.fittedY[i]},${state.fitResult.residuals[i]}`;
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'PeakForge-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [currentPoints, state.xLabel, state.yLabel, state.fitResult]);

  const handleExportPNG = useCallback(() => {
    const el = document.querySelector('.chart-export-target') as HTMLElement;
    if (!el) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(el).then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = 'PeakForge-chart.png'; a.click();
      });
    });
  }, []);

  const handleExportSVG = useCallback(() => {
    const el = document.querySelector('.chart-export-target') as HTMLElement;
    if (!el) return;
    import('html-to-image').then(({ toSvg }) => {
      toSvg(el).then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = 'PeakForge-chart.svg'; a.click();
      });
    });
  }, []);

  const handleAddPeak = useCallback((x: number, y: number) => {
    if (!currentPoints) return;
    // Estimate FWHM from surrounding data
    const xRange = currentPoints[currentPoints.length - 1].x - currentPoints[0].x;
    const fwhm = xRange * 0.02; // initial guess: 2% of range
    const peak: PeakParams = { x0: x, height: y, fwhm, eta: 0.5 };
    setState(s => ({ ...s, peaks: [...s.peaks, peak], fitResult: null, metrics: [] }));
  }, [currentPoints]);

  // Build chart data
  const chartData = currentPoints?.map((p, i) => {
    const d: Record<string, number> = { x: p.x, raw: p.y };
    if (state.fitResult) {
      d.fitted = state.fitResult.fittedY[i];
      d.residual = state.fitResult.residuals[i];
      // Individual peak curves
      state.fitResult.peaks.forEach((pk, j) => {
        d[`peak${j}`] = evaluateProfile(p.x, pk.height, pk.x0, pk.fwhm, state.fitResult!.profile, pk.eta);
      });
    }
    return d;
  });

  return (
    <div className="app-layout" data-theme={theme}>
      <Toolbar
        hasData={!!state.raw}
        baseline={state.baseline}
        baselineMethod={state.baselineOpts.method}
        profile={state.profile}
        hasPeaks={state.peaks.length > 0}
        hasFit={!!state.fitResult}
        theme={theme}
        onUpload={handleUpload}
        onToggleBaseline={toggleBaseline}
        onBaselineMethod={setBaselineMethod}
        onProfile={setProfile}
        onDetect={handleDetect}
        onFit={handleFit}
        onTheme={() => setTheme(t => {
          const next = t === 'light' ? 'dark' : 'light';
          localStorage.setItem('PeakForge-theme', next);
          return next;
        })}
      />
      <div className="main-content">
        {currentPoints && chartData ? (
          <>
            <div className="chart-area">
              <div className="export-bar">
                <button onClick={handleExportPNG}>📸 PNG</button>
                <button onClick={handleExportSVG}>🖼️ SVG</button>
              </div>
              <div className="chart-export-target">
                <SpectrumChart
                  data={chartData}
                  peaks={state.peaks}
                  fitResult={state.fitResult}
                  xLabel={state.xLabel}
                  yLabel={state.yLabel}
                  onAddPeak={handleAddPeak}
                />
              </div>
            </div>
            {state.metrics.length > 0 && (
              <ResultsPanel
                metrics={state.metrics}
                rSquared={state.fitResult?.rSquared}
                onExportResultsCSV={handleExportResultsCSV}
                onExportDataCSV={handleExportDataCSV}
              />
            )}
          </>
        ) : (
          <DropZone onUpload={handleUpload} />
        )}
      </div>
    </div>
  );
}
