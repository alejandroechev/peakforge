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

  let leftX = points[peakIdx].x;
  for (let i = peakIdx - 1; i >= 0; i--) {
    if (points[i].y <= halfMax) {
      // Linear interpolation
      const frac = (halfMax - points[i].y) / (points[i + 1].y - points[i].y);
      leftX = points[i].x + frac * (points[i + 1].x - points[i].x);
      break;
    }
    if (i === 0) leftX = points[0].x;
  }

  let rightX = points[peakIdx].x;
  for (let i = peakIdx + 1; i < points.length; i++) {
    if (points[i].y <= halfMax) {
      const frac = (halfMax - points[i].y) / (points[i - 1].y - points[i].y);
      rightX = points[i].x - frac * (points[i].x - points[i - 1].x);
      break;
    }
    if (i === points.length - 1) rightX = points[points.length - 1].x;
  }

  return Math.abs(rightX - leftX);
}

export interface DetectOptions {
  noiseMultiplier?: number; // threshold = noise * multiplier, default 3
  minProminence?: number;   // min prominence as fraction of max intensity, default 0.05
}

/** Detect peaks in spectrum */
export function detectPeaks(
  points: SpectrumPoint[],
  opts: DetectOptions = {},
): DetectedPeak[] {
  const { noiseMultiplier = 3, minProminence = 0.05 } = opts;
  const n = points.length;
  if (n < 3) return [];

  const noise = estimateNoise(points);
  const threshold = noise * noiseMultiplier;
  const maxY = Math.max(...points.map(p => p.y));
  const promThreshold = maxY * minProminence;

  const peaks: DetectedPeak[] = [];

  for (let i = 1; i < n - 1; i++) {
    if (points[i].y >= points[i - 1].y && points[i].y > points[i + 1].y) {
      if (points[i].y < threshold) continue;
      const prom = prominence(points.map(p => p.y), i);
      if (prom < promThreshold) continue;
      peaks.push({
        index: i,
        x: points[i].x,
        y: points[i].y,
        estimatedFWHM: estimateFWHM(points, i),
      });
    }
  }

  return peaks;
}
