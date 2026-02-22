import type { PeakMetric } from '@peakforge/engine';
import { getPeakColor } from '../App';

interface ResultsPanelProps {
  metrics: PeakMetric[];
  rSquared?: number;
  onExportResultsCSV: () => void;
  onExportDataCSV: () => void;
}

export function ResultsPanel({ metrics, rSquared, onExportResultsCSV, onExportDataCSV }: ResultsPanelProps) {
  const badge = rSquared != null
    ? rSquared > 0.99 ? 'good' : rSquared > 0.95 ? 'ok' : 'bad'
    : null;

  return (
    <div className="results-panel">
      <div className="export-bar">
        <button onClick={onExportResultsCSV}>📋 Results CSV</button>
        <button onClick={onExportDataCSV}>📊 Data CSV</button>
      </div>
      <h3>Fit Results</h3>

      {rSquared != null && (
        <div className="r-squared">
          R² = {rSquared.toFixed(6)}
          {badge && <span className={`badge ${badge}`}>
            {badge === 'good' ? 'Excellent' : badge === 'ok' ? 'Good' : 'Poor'}
          </span>}
        </div>
      )}

      <table style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Position</th>
            <th>Height</th>
            <th>FWHM</th>
            <th>Area</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr key={i}>
              <td>
                <span className="peak-color" style={{ background: getPeakColor(i) }} />
                {m.peakNumber}
              </td>
              <td>{m.position.toFixed(2)}</td>
              <td>{m.height.toFixed(2)}</td>
              <td>{m.fwhm.toFixed(2)}</td>
              <td>{m.area.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
