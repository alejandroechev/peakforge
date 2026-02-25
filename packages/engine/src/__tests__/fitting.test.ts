import { describe, it, expect } from 'vitest';
import { fitPeaks, PeakParams } from '../fitting';
import { gaussian } from '../profiles';
import { SpectrumPoint } from '../parser';

function syntheticSpectrum(
  peaks: { x0: number; h: number; fwhm: number }[],
  xRange: [number, number] = [0, 100],
  n = 300,
): SpectrumPoint[] {
  const dx = (xRange[1] - xRange[0]) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const x = xRange[0] + i * dx;
    let y = 0;
    for (const p of peaks) y += gaussian(x, p.h, p.x0, p.fwhm);
    return { x, y };
  });
}

describe('fitPeaks (LM)', () => {
  it('fits a single Gaussian peak accurately', () => {
    const truePeaks = [{ x0: 50, h: 10, fwhm: 5 }];
    const pts = syntheticSpectrum(truePeaks);
    const initial: PeakParams[] = [{ x0: 48, height: 8, fwhm: 6, eta: 0.5 }];
    const result = fitPeaks(pts, initial, { profile: 'gaussian' });

    expect(result.rSquared).toBeGreaterThan(0.99);
    expect(Math.abs(result.peaks[0].x0 - 50)).toBeLessThan(0.5);
    expect(Math.abs(result.peaks[0].height - 10)).toBeLessThan(0.5);
    expect(Math.abs(result.peaks[0].fwhm - 5)).toBeLessThan(0.5);
  });

  it('fits two overlapping peaks', () => {
    const truePeaks = [
      { x0: 40, h: 10, fwhm: 5 },
      { x0: 55, h: 8, fwhm: 6 },
    ];
    const pts = syntheticSpectrum(truePeaks);
    const initial: PeakParams[] = [
      { x0: 38, height: 9, fwhm: 4, eta: 0.5 },
      { x0: 57, height: 7, fwhm: 7, eta: 0.5 },
    ];
    const result = fitPeaks(pts, initial, { profile: 'gaussian' });

    expect(result.rSquared).toBeGreaterThan(0.99);
    expect(result.peaks).toHaveLength(2);
  });

  it('converges for three peaks', () => {
    const truePeaks = [
      { x0: 20, h: 5, fwhm: 3 },
      { x0: 50, h: 12, fwhm: 4 },
      { x0: 80, h: 8, fwhm: 5 },
    ];
    const pts = syntheticSpectrum(truePeaks);
    const initial: PeakParams[] = truePeaks.map(p => ({
      x0: p.x0 + 2, height: p.h * 0.8, fwhm: p.fwhm * 1.2, eta: 0.5,
    }));
    const result = fitPeaks(pts, initial, { profile: 'gaussian' });

    expect(result.rSquared).toBeGreaterThan(0.99);
    expect(result.peaks).toHaveLength(3);
  });

  it('returns residuals matching data length', () => {
    const pts = syntheticSpectrum([{ x0: 50, h: 10, fwhm: 5 }]);
    const result = fitPeaks(pts, [{ x0: 50, height: 10, fwhm: 5, eta: 0.5 }]);
    expect(result.residuals).toHaveLength(pts.length);
    expect(result.fittedY).toHaveLength(pts.length);
  });

  it('respects number of initial peaks used for fitting', () => {
    const pts = syntheticSpectrum([
      { x0: 25, h: 8, fwhm: 4 },
      { x0: 55, h: 10, fwhm: 5 },
      { x0: 80, h: 7, fwhm: 4 },
    ]);
    const initial: PeakParams[] = [
      { x0: 24, height: 7, fwhm: 5, eta: 0.5 },
      { x0: 56, height: 9, fwhm: 6, eta: 0.5 },
    ];
    const result = fitPeaks(pts, initial, { profile: 'gaussian' });
    expect(result.peaks).toHaveLength(2);
  });
});
