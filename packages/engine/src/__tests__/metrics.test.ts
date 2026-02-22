import { describe, it, expect } from 'vitest';
import { extractMetrics, metricsToCSV, fittedCurveToCSV, computeEnvelope } from '../metrics';
import { FitResult, PeakParams } from '../fitting';
import { gaussianArea } from '../profiles';

describe('metrics', () => {
  const peaks: PeakParams[] = [
    { x0: 50, height: 10, fwhm: 5, eta: 0.5 },
    { x0: 80, height: 7, fwhm: 4, eta: 0.5 },
  ];

  const result: FitResult = {
    peaks,
    profile: 'gaussian',
    rSquared: 0.99,
    residuals: [0, 0, 0],
    fittedY: [1, 2, 3],
    iterations: 10,
  };

  it('extracts correct number of metrics', () => {
    const m = extractMetrics(result);
    expect(m).toHaveLength(2);
    expect(m[0].peakNumber).toBe(1);
    expect(m[1].peakNumber).toBe(2);
  });

  it('computes correct Gaussian area', () => {
    const m = extractMetrics(result);
    expect(m[0].area).toBeCloseTo(gaussianArea(10, 5), 4);
  });

  it('exports CSV with header', () => {
    const csv = metricsToCSV(extractMetrics(result));
    expect(csv).toContain('Peak#,Position,Height,FWHM,Area,Shape');
    expect(csv.split('\n')).toHaveLength(3); // header + 2 peaks
  });

  it('exports fitted curve CSV', () => {
    const pts = [{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }];
    const csv = fittedCurveToCSV(pts, [1, 2, 3], [0, 0, 0]);
    expect(csv).toContain('x,y_raw,y_fitted,residual');
    expect(csv.split('\n')).toHaveLength(4);
  });

  it('computeEnvelope returns correct length', () => {
    const xs = [0, 1, 2, 3, 4];
    const env = computeEnvelope(xs, peaks, 'gaussian');
    expect(env).toHaveLength(5);
  });
});
