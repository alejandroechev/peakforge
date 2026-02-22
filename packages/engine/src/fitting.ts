import { SpectrumPoint } from './parser';
import { ProfileType, evaluateProfile } from './profiles';

export interface PeakParams {
  x0: number;
  height: number;
  fwhm: number;
  eta: number; // only used for pseudoVoigt
}

export interface FitResult {
  peaks: PeakParams[];
  profile: ProfileType;
  rSquared: number;
  residuals: number[];
  fittedY: number[];
  iterations: number;
}

/** Evaluate the model (sum of all peaks) at given x values */
function evalModel(
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

/** Pack peak params into flat array */
function packParams(peaks: PeakParams[], profile: ProfileType): number[] {
  const arr: number[] = [];
  for (const p of peaks) {
    arr.push(p.x0, p.height, p.fwhm);
    if (profile === 'pseudoVoigt') arr.push(p.eta);
  }
  return arr;
}

/** Unpack flat array to peak params */
function unpackParams(arr: number[], nPeaks: number, profile: ProfileType): PeakParams[] {
  const stride = profile === 'pseudoVoigt' ? 4 : 3;
  const peaks: PeakParams[] = [];
  for (let i = 0; i < nPeaks; i++) {
    const base = i * stride;
    peaks.push({
      x0: arr[base],
      height: Math.max(arr[base + 1], 0.001),
      fwhm: Math.max(arr[base + 2], 0.001),
      eta: profile === 'pseudoVoigt' ? Math.min(1, Math.max(0, arr[base + 3])) : 0.5,
    });
  }
  return peaks;
}

/** Compute Jacobian numerically */
function computeJacobian(
  xValues: number[], params: number[], profile: ProfileType, nPeaks: number,
): number[][] {
  const n = xValues.length;
  const m = params.length;
  const eps = 1e-7;
  const J: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  const y0 = evalModel(xValues, unpackParams(params, nPeaks, profile), profile);

  for (let j = 0; j < m; j++) {
    const tweaked = [...params];
    const h = Math.max(eps, Math.abs(params[j]) * eps);
    tweaked[j] += h;
    const y1 = evalModel(xValues, unpackParams(tweaked, nPeaks, profile), profile);
    for (let i = 0; i < n; i++) {
      J[i][j] = (y1[i] - y0[i]) / h;
    }
  }
  return J;
}

/** Solve (JᵀJ + λI)Δp = Jᵀr using Gaussian elimination */
function solveNormal(
  J: number[][], residuals: number[], lambda: number,
): number[] {
  const n = J.length;
  const m = J[0].length;

  // Build JᵀJ + λI
  const A: number[][] = Array.from({ length: m }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += J[k][i] * J[k][j];
      A[i][j] = sum + (i === j ? lambda : 0);
    }
    // Jᵀr
    let rhs = 0;
    for (let k = 0; k < n; k++) rhs += J[k][i] * residuals[k];
    A[i][m] = rhs;
  }

  // Gaussian elimination
  for (let col = 0; col < m; col++) {
    let maxRow = col;
    for (let row = col + 1; row < m; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    if (Math.abs(A[col][col]) < 1e-20) continue;
    for (let row = col + 1; row < m; row++) {
      const f = A[row][col] / A[col][col];
      for (let j = col; j <= m; j++) A[row][j] -= f * A[col][j];
    }
  }

  const dp = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let sum = A[i][m];
    for (let j = i + 1; j < m; j++) sum -= A[i][j] * dp[j];
    dp[i] = Math.abs(A[i][i]) > 1e-20 ? sum / A[i][i] : 0;
  }
  return dp;
}

function sumSq(arr: number[]): number {
  return arr.reduce((s, v) => s + v * v, 0);
}

export interface FitOptions {
  profile?: ProfileType;
  maxIterations?: number;
  tolerance?: number;
}

/** Levenberg-Marquardt multi-peak fitting */
export function fitPeaks(
  points: SpectrumPoint[],
  initialPeaks: PeakParams[],
  opts: FitOptions = {},
): FitResult {
  const {
    profile = 'gaussian',
    maxIterations = 200,
    tolerance = 1e-6,
  } = opts;

  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);
  const nPeaks = initialPeaks.length;

  let params = packParams(initialPeaks, profile);
  let lambda = 0.001;
  let model = evalModel(xValues, unpackParams(params, nPeaks, profile), profile);
  let residuals = yValues.map((y, i) => y - model[i]);
  let chi2 = sumSq(residuals);
  let iterations = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;
    const J = computeJacobian(xValues, params, profile, nPeaks);
    const dp = solveNormal(J, residuals, lambda);

    const newParams = params.map((p, i) => p + dp[i]);
    const newModel = evalModel(xValues, unpackParams(newParams, nPeaks, profile), profile);
    const newResiduals = yValues.map((y, i) => y - newModel[i]);
    const newChi2 = sumSq(newResiduals);

    if (newChi2 < chi2) {
      // Accept step
      const relChange = Math.abs(chi2 - newChi2) / (chi2 + 1e-20);
      params = newParams;
      model = newModel;
      residuals = newResiduals;
      chi2 = newChi2;
      lambda *= 0.5;
      if (relChange < tolerance) break;
    } else {
      lambda *= 5;
    }
  }

  // Compute R²
  const yMean = yValues.reduce((s, v) => s + v, 0) / yValues.length;
  const ssTot = yValues.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - chi2 / ssTot : 1;

  return {
    peaks: unpackParams(params, nPeaks, profile),
    profile,
    rSquared,
    residuals,
    fittedY: model,
    iterations,
  };
}
