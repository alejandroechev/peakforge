// Public API
export { parseCSV, type Spectrum, type SpectrumPoint } from './parser';
export { computeBaseline, correctBaseline, type BaselineMethod, type BaselineOptions } from './baseline';
export { detectPeaks, estimateNoise, type DetectedPeak, type DetectOptions } from './peaks';
export {
  gaussian, lorentzian, pseudoVoigt,
  gaussianArea, lorentzianArea, pseudoVoigtArea,
  evaluateProfile, profileArea,
  type ProfileType,
} from './profiles';
export { fitPeaks, type PeakParams, type FitResult, type FitOptions } from './fitting';
export {
  extractMetrics, computeEnvelope, metricsToCSV, fittedCurveToCSV,
  type PeakMetric,
} from './metrics';
