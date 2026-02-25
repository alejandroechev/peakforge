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

export type BaselineMethod = 'linear' | 'polynomial' | 'asls';

export interface BaselineOptions {
  method: BaselineMethod;
  degree?: number; // for polynomial, default 2
  anchorIndices?: number[]; // user-selected baseline points; auto if omitted
  aslsLambda?: number; // smoothing parameter (AsLS), default 1e5
  aslsP?: number; // asymmetry parameter (AsLS), default 0.001
  aslsIterations?: number; // AsLS outer iterations, default 10
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
  if (opts.method === 'asls') {
    return computeAslsBaseline(points, opts);
  }

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

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// Multiply by D^T D for second-difference operator D.
function multiplyDTD(v: number[]): number[] {
  const n = v.length;
  if (n < 3) return new Array(n).fill(0);

  const out = new Array(n).fill(0);
  out[0] = v[0] - 2 * v[1] + v[2];
  out[1] = -2 * v[0] + 5 * v[1] - 4 * v[2] + v[3];

  for (let i = 2; i <= n - 3; i++) {
    out[i] = v[i - 2] - 4 * v[i - 1] + 6 * v[i] - 4 * v[i + 1] + v[i + 2];
  }

  out[n - 2] = v[n - 4] - 4 * v[n - 3] + 5 * v[n - 2] - 2 * v[n - 1];
  out[n - 1] = v[n - 3] - 2 * v[n - 2] + v[n - 1];
  return out;
}

function multiplyAslsMatrix(
  weights: number[],
  lambda: number,
  v: number[],
): number[] {
  const dtd = multiplyDTD(v);
  return v.map((value, i) => (weights[i] * value) + (lambda * dtd[i]));
}

// Conjugate-gradient solve for (W + lambda * D^T D) z = W y
function solveAslsLinearSystem(
  y: number[],
  weights: number[],
  lambda: number,
): number[] {
  const n = y.length;
  const b = y.map((value, i) => value * weights[i]);
  let x = [...y];

  const Ax = multiplyAslsMatrix(weights, lambda, x);
  let r = b.map((value, i) => value - Ax[i]);
  let p = [...r];
  let rsOld = dot(r, r);
  if (rsOld < 1e-20) return x;

  const maxCgIterations = Math.min(Math.max(60, n), 500);
  for (let iter = 0; iter < maxCgIterations; iter++) {
    const Ap = multiplyAslsMatrix(weights, lambda, p);
    const denom = dot(p, Ap);
    if (Math.abs(denom) < 1e-20) break;

    const alpha = rsOld / denom;
    x = x.map((value, i) => value + alpha * p[i]);
    r = r.map((value, i) => value - alpha * Ap[i]);

    const rsNew = dot(r, r);
    if (Math.sqrt(rsNew / n) < 1e-8) break;

    const beta = rsNew / rsOld;
    p = r.map((value, i) => value + beta * p[i]);
    rsOld = rsNew;
  }

  return x;
}

function computeAslsBaseline(
  points: SpectrumPoint[],
  opts: BaselineOptions,
): number[] {
  const n = points.length;
  if (n < 3) return points.map(p => p.y);

  const y = points.map(p => p.y);
  const lambda = Math.max(1, opts.aslsLambda ?? 100000);
  const p = Math.min(0.499, Math.max(1e-6, opts.aslsP ?? 0.001));
  const iterations = Math.max(1, Math.floor(opts.aslsIterations ?? 10));

  let weights = new Array(n).fill(1);
  let baseline = [...y];

  for (let iter = 0; iter < iterations; iter++) {
    baseline = solveAslsLinearSystem(y, weights, lambda);
    weights = y.map((value, i) => (value > baseline[i] ? p : (1 - p)));
  }

  return baseline;
}

/** Subtract baseline from spectrum, returning corrected points */
export function correctBaseline(
  points: SpectrumPoint[],
  opts: BaselineOptions = { method: 'linear' },
): SpectrumPoint[] {
  const baseline = computeBaseline(points, opts);
  return points.map((p, i) => ({ x: p.x, y: p.y - baseline[i] }));
}
