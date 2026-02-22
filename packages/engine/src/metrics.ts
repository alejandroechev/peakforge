import { PeakParams, FitResult } from './fitting';
import { ProfileType, profileArea, evaluateProfile } from './profiles';
import { SpectrumPoint } from './parser';

export interface PeakMetric {
  peakNumber: number;
  position: number;
  height: number;
  fwhm: number;
  area: number;
  shape: ProfileType;
  eta?: number;
}

/** Extract metrics from fit result */
export function extractMetrics(result: FitResult): PeakMetric[] {
  return result.peaks.map((p, i) => ({
    peakNumber: i + 1,
    position: p.x0,
    height: p.height,
    fwhm: p.fwhm,
    area: profileArea(p.height, p.fwhm, result.profile, p.eta),
    shape: result.profile,
    eta: result.profile === 'pseudoVoigt' ? p.eta : undefined,
  }));
}

/** Compute the total envelope (sum of all fitted peaks) */
export function computeEnvelope(
  xValues: number[], peaks: PeakParams[], profile: ProfileType,
): number[] {
  return xValues.map(x => {
    let sum = 0;
    for (const p of peaks) {
      sum += evaluateProfile(x, p.height, p.x0, p.fwhm, profile, p.eta);
    }
    return sum;
  });
}

/** Export metrics as CSV string */
export function metricsToCSV(metrics: PeakMetric[]): string {
  const header = 'Peak#,Position,Height,FWHM,Area,Shape';
  const rows = metrics.map(m =>
    `${m.peakNumber},${m.position.toFixed(4)},${m.height.toFixed(4)},${m.fwhm.toFixed(4)},${m.area.toFixed(4)},${m.shape}`
  );
  return [header, ...rows].join('\n');
}

/** Export fitted curve data as CSV */
export function fittedCurveToCSV(
  points: SpectrumPoint[],
  fittedY: number[],
  residuals: number[],
): string {
  const header = 'x,y_raw,y_fitted,residual';
  const rows = points.map((p, i) =>
    `${p.x.toFixed(4)},${p.y.toFixed(4)},${fittedY[i].toFixed(4)},${residuals[i].toFixed(4)}`
  );
  return [header, ...rows].join('\n');
}
