import { SpectrumPoint } from './parser';

/** Fit a polynomial of given degree to the points using least-squares */
function polyFit(points: SpectrumPoint[], degree: number): number[] {
  const n = points.length;
  const m = degree + 1;

  // Build normal equations: (XᵀX)c = Xᵀy
  const XtX: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const Xty: number[] = new Array(m).fill(0);

  for (const p of points) {
    const xpow: number[] = [1];
    for (let j = 1; j < m; j++) xpow.push(xpow[j - 1] * p.x);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) XtX[i][j] += xpow[i] * xpow[j];
      Xty[i] += xpow[i] * p.y;
    }
  }

  // Gaussian elimination with partial pivoting
  const A = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < m; col++) {
    let maxRow = col;
    for (let row = col + 1; row < m; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    if (Math.abs(A[col][col]) < 1e-15) continue;
    for (let row = col + 1; row < m; row++) {
      const factor = A[row][col] / A[col][col];
      for (let j = col; j <= m; j++) A[row][j] -= factor * A[col][j];
    }
  }

  const coeffs = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let sum = A[i][m];
    for (let j = i + 1; j < m; j++) sum -= A[i][j] * coeffs[j];
    coeffs[i] = Math.abs(A[i][i]) > 1e-15 ? sum / A[i][i] : 0;
  }
  return coeffs;
}

/** Evaluate polynomial at x */
function polyEval(coeffs: number[], x: number): number {
  let val = 0;
  let xpow = 1;
  for (const c of coeffs) {
    val += c * xpow;
    xpow *= x;
  }
  return val;
}

export type BaselineMethod = 'linear' | 'polynomial';

export interface BaselineOptions {
  method: BaselineMethod;
  degree?: number; // for polynomial, default 2
  anchorIndices?: number[]; // user-selected baseline points; auto if omitted
}

/** Auto-select baseline regions: lowest 20% of intensity values */
function autoBaselinePoints(points: SpectrumPoint[]): SpectrumPoint[] {
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const count = Math.max(2, Math.floor(sorted.length * 0.2));
  return sorted.slice(0, count);
}

/** Compute baseline curve */
export function computeBaseline(
  points: SpectrumPoint[],
  opts: BaselineOptions = { method: 'linear' },
): number[] {
  const degree = opts.method === 'linear' ? 1 : (opts.degree ?? 2);

  let basisPoints: SpectrumPoint[];
  if (opts.anchorIndices && opts.anchorIndices.length >= 2) {
    basisPoints = opts.anchorIndices.map(i => points[i]);
  } else {
    basisPoints = autoBaselinePoints(points);
  }

  const coeffs = polyFit(basisPoints, degree);
  return points.map(p => polyEval(coeffs, p.x));
}

/** Subtract baseline from spectrum, returning corrected points */
export function correctBaseline(
  points: SpectrumPoint[],
  opts: BaselineOptions = { method: 'linear' },
): SpectrumPoint[] {
  const baseline = computeBaseline(points, opts);
  return points.map((p, i) => ({ x: p.x, y: p.y - baseline[i] }));
}
