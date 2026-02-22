/**
 * Synthetic sample spectra for PeakForge demonstration.
 * Each sample is a CSV string ready to pass through parseCSV / onUpload.
 */

function gaussian(x: number, h: number, x0: number, w: number): number {
  return h * Math.exp(-4 * Math.LN2 * ((x - x0) / w) ** 2);
}

function lorentzian(x: number, h: number, x0: number, w: number): number {
  return h * w * w / (4 * (x - x0) ** 2 + w * w);
}

function pseudoVoigt(x: number, h: number, x0: number, w: number, eta: number): number {
  return eta * lorentzian(x, h, x0, w) + (1 - eta) * gaussian(x, h, x0, w);
}

/** Deterministic pseudo-random noise (seed-based for reproducibility) */
function seededNoise(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);  // 0..1
}

function generateCSV(
  xLabel: string, yLabel: string,
  xMin: number, xMax: number, nPoints: number,
  signalFn: (x: number) => number,
  noiseLevel: number, seed: number,
): string {
  const lines = [`${xLabel},${yLabel}`];
  const dx = (xMax - xMin) / (nPoints - 1);
  for (let i = 0; i < nPoints; i++) {
    const x = xMin + i * dx;
    const noise = (seededNoise(seed + i) - 0.5) * 2 * noiseLevel;
    const y = signalFn(x) + noise;
    lines.push(`${x.toFixed(4)},${y.toFixed(6)}`);
  }
  return lines.join('\n');
}

export interface SampleSpec {
  name: string;
  description: string;
  csv: string;
}

// 1. Raman: Polystyrene Reference — 3 well-separated Gaussians
const ramanCSV = generateCSV('Wavenumber (cm-1)', 'Intensity', 900, 1700, 400,
  (x) => 50 + gaussian(x, 1000, 1001, 12) + gaussian(x, 600, 1031, 15) + gaussian(x, 450, 1602, 18),
  8, 42,
);

// 2. FTIR: Overlapping C-H Stretch — 2 heavily overlapping peaks
const ftirCSV = generateCSV('Wavenumber (cm-1)', 'Absorbance', 2750, 3050, 300,
  (x) => 0.02 + gaussian(x, 0.45, 2850, 30) + gaussian(x, 0.65, 2920, 35),
  0.005, 137,
);

// 3. XPS: Carbon 1s — 3 Lorentzian peaks with asymmetric feel
const xpsCSV = generateCSV('Binding Energy (eV)', 'Counts', 282, 292, 250,
  (x) => 200 + lorentzian(x, 5000, 284.8, 1.2) + lorentzian(x, 2000, 286.3, 1.4) + lorentzian(x, 800, 288.5, 1.6),
  40, 256,
);

// 4. UV-Vis: Broad Absorption — single Gaussian with baseline drift
const uvvisCSV = generateCSV('Wavelength (nm)', 'Absorbance', 350, 600, 250,
  (x) => 0.05 + 0.0003 * (x - 350) + gaussian(x, 0.8, 450, 60),
  0.008, 99,
);

// 5. Complex Multi-Peak — 5 pseudo-Voigt peaks, sloped baseline, more noise
const complexCSV = generateCSV('Wavenumber (cm-1)', 'Intensity', 800, 1800, 500,
  (x) => {
    const baseline = 30 + 0.02 * (x - 800);
    return baseline
      + pseudoVoigt(x, 400, 950, 20, 0.3)
      + pseudoVoigt(x, 800, 1100, 25, 0.5)
      + pseudoVoigt(x, 350, 1250, 15, 0.7)
      + pseudoVoigt(x, 600, 1400, 30, 0.4)
      + pseudoVoigt(x, 500, 1580, 22, 0.6);
  },
  12, 314,
);

export const SAMPLES: SampleSpec[] = [
  { name: 'Raman: Polystyrene Reference', description: '3 Gaussian peaks at 1001, 1031, 1602 cm⁻¹', csv: ramanCSV },
  { name: 'FTIR: Overlapping C-H Stretch', description: '2 overlapping peaks at 2850 & 2920 cm⁻¹', csv: ftirCSV },
  { name: 'XPS: Carbon 1s', description: '3 Lorentzian peaks (C-C, C-O, C=O)', csv: xpsCSV },
  { name: 'UV-Vis: Broad Absorption', description: 'Single broad Gaussian at 450 nm + drift', csv: uvvisCSV },
  { name: 'Complex Multi-Peak', description: '5 pseudo-Voigt peaks, sloped baseline, noisy', csv: complexCSV },
];
