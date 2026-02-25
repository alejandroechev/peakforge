import { SpectrumPoint } from './parser';

export interface DetectedPeak {
  index: number;
  x: number;
  y: number;
  estimatedFWHM: number;
}

/** Estimate noise using Median Absolute Deviation */
export function estimateNoise(points: SpectrumPoint[]): number {
  const values = points.map(p => p.y);
  const median = sortedMedian([...values].sort((a, b) => a - b));
  const deviations = values.map(v => Math.abs(v - median));
  const mad = sortedMedian([...deviations].sort((a, b) => a - b));
  // MAD to sigma: σ ≈ 1.4826 × MAD
  return 1.4826 * mad;
}

function sortedMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Calculate prominence of a peak */
function prominence(values: number[], peakIdx: number): number {
  if (peakIdx === 0) {
    const peakVal = values[0];
    let rightMin = peakVal;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peakVal) break;
      if (values[i] < rightMin) rightMin = values[i];
    }
    return peakVal - rightMin;
  }

  if (peakIdx === values.length - 1) {
    const peakVal = values[peakIdx];
    let leftMin = peakVal;
    for (let i = peakIdx - 1; i >= 0; i--) {
      if (values[i] > peakVal) break;
      if (values[i] < leftMin) leftMin = values[i];
    }
    return peakVal - leftMin;
  }

  const peakVal = values[peakIdx];

  // Search left for the lowest point before a higher peak
  let leftMin = peakVal;
  for (let i = peakIdx - 1; i >= 0; i--) {
    if (values[i] > peakVal) break;
    if (values[i] < leftMin) leftMin = values[i];
  }

  // Search right
  let rightMin = peakVal;
  for (let i = peakIdx + 1; i < values.length; i++) {
    if (values[i] > peakVal) break;
    if (values[i] < rightMin) rightMin = values[i];
  }

  return peakVal - Math.max(leftMin, rightMin);
}

/** Estimate FWHM at a peak by walking left/right to half-max */
function estimateFWHM(points: SpectrumPoint[], peakIdx: number): number {
  const halfMax = points[peakIdx].y / 2;
  const peakX = points[peakIdx].x;
  const dx = points.length > 1 ? Math.abs(points[1].x - points[0].x) : 1;

  let leftX: number | null = null;
  for (let i = peakIdx - 1; i >= 0; i--) {
    if (points[i].y <= halfMax) {
      const denom = points[i + 1].y - points[i].y;
      const frac = Math.abs(denom) > 1e-12 ? (halfMax - points[i].y) / denom : 0;
      leftX = points[i].x + frac * (points[i + 1].x - points[i].x);
      break;
    }
  }

  let rightX: number | null = null;
  for (let i = peakIdx + 1; i < points.length; i++) {
    if (points[i].y <= halfMax) {
      const denom = points[i - 1].y - points[i].y;
      const frac = Math.abs(denom) > 1e-12 ? (halfMax - points[i].y) / denom : 0;
      rightX = points[i].x - frac * (points[i].x - points[i - 1].x);
      break;
    }
  }

  if (leftX !== null && rightX !== null) return Math.abs(rightX - leftX);
  if (leftX === null && rightX !== null) return Math.max(2 * Math.abs(rightX - peakX), dx);
  if (leftX !== null && rightX === null) return Math.max(2 * Math.abs(peakX - leftX), dx);
  return dx;
}

export interface DetectOptions {
  noiseMultiplier?: number; // threshold = noise * multiplier, default 3
  minProminence?: number;   // min prominence as fraction of max intensity, default 0.05
  detectEdges?: boolean;    // detect peaks at first/last points, default true
}

/** Detect peaks in spectrum */
export function detectPeaks(
  points: SpectrumPoint[],
  opts: DetectOptions = {},
): DetectedPeak[] {
  const { noiseMultiplier = 3, minProminence = 0.05, detectEdges = true } = opts;
  const n = points.length;
  if (n < 3) return [];

  const values = points.map(p => p.y);
  const noise = estimateNoise(points);
  const threshold = noise * noiseMultiplier;
  const maxY = Math.max(...values);
  const promThreshold = maxY * minProminence;

  const peaks: DetectedPeak[] = [];

  for (let i = 1; i < n - 1; i++) {
    if (points[i].y >= points[i - 1].y && points[i].y > points[i + 1].y) {
      if (points[i].y < threshold) continue;
      const prom = prominence(values, i);
      if (prom < promThreshold) continue;
      peaks.push({
        index: i,
        x: points[i].x,
        y: points[i].y,
        estimatedFWHM: estimateFWHM(points, i),
      });
    }
  }

  if (detectEdges) {
    if (points[0].y > points[1].y && points[0].y >= threshold) {
      const prom = prominence(values, 0);
      if (prom >= promThreshold) {
        peaks.push({
          index: 0,
          x: points[0].x,
          y: points[0].y,
          estimatedFWHM: estimateFWHM(points, 0),
        });
      }
    }

    if (points[n - 1].y >= points[n - 2].y && points[n - 1].y >= threshold) {
      const prom = prominence(values, n - 1);
      if (prom >= promThreshold) {
        peaks.push({
          index: n - 1,
          x: points[n - 1].x,
          y: points[n - 1].y,
          estimatedFWHM: estimateFWHM(points, n - 1),
        });
      }
    }
  }

  return peaks.sort((a, b) => a.x - b.x);
}
