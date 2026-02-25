import { describe, it, expect } from 'vitest';
import { detectPeaks, estimateNoise } from '../peaks';
import { SpectrumPoint } from '../parser';
import { gaussian } from '../profiles';

function syntheticSpectrum(
  peakParams: { x0: number; h: number; fwhm: number }[],
  xRange: [number, number] = [0, 100],
  n = 500,
  noiseLevel = 0,
): SpectrumPoint[] {
  const dx = (xRange[1] - xRange[0]) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const x = xRange[0] + i * dx;
    let y = 0;
    for (const p of peakParams) {
      y += gaussian(x, p.h, p.x0, p.fwhm);
    }
    y += noiseLevel * (Math.random() - 0.5) * 2;
    return { x, y };
  });
}

describe('peak detection', () => {
  it('finds a single peak', () => {
    const pts = syntheticSpectrum([{ x0: 50, h: 10, fwhm: 5 }]);
    const peaks = detectPeaks(pts);
    expect(peaks.length).toBe(1);
    expect(Math.abs(peaks[0].x - 50)).toBeLessThan(1);
  });

  it('finds multiple peaks', () => {
    const pts = syntheticSpectrum([
      { x0: 25, h: 10, fwhm: 3 },
      { x0: 50, h: 15, fwhm: 5 },
      { x0: 75, h: 8, fwhm: 4 },
    ]);
    const peaks = detectPeaks(pts);
    expect(peaks.length).toBe(3);
  });

  it('estimates FWHM reasonably', () => {
    const pts = syntheticSpectrum([{ x0: 50, h: 10, fwhm: 6 }]);
    const peaks = detectPeaks(pts);
    expect(peaks.length).toBe(1);
    expect(Math.abs(peaks[0].estimatedFWHM - 6)).toBeLessThan(1.5);
  });

  it('filters noise peaks with prominence', () => {
    // Small noise bumps shouldn't be detected as real peaks
    const pts = syntheticSpectrum([{ x0: 50, h: 100, fwhm: 5 }], [0, 100], 500, 1);
    const peaks = detectPeaks(pts, { noiseMultiplier: 5 });
    // Should find the main peak, maybe a few noise peaks but far fewer than without filtering
    expect(peaks.length).toBeLessThan(10);
    expect(peaks.some(p => Math.abs(p.x - 50) < 2)).toBe(true);
  });

  it('detects a left-edge peak', () => {
    const pts = syntheticSpectrum([{ x0: 0, h: 10, fwhm: 6 }], [0, 100], 400);
    const peaks = detectPeaks(pts);
    expect(peaks.some(p => p.index === 0)).toBe(true);
  });

  it('detects a right-edge peak', () => {
    const pts = syntheticSpectrum([{ x0: 100, h: 10, fwhm: 6 }], [0, 100], 400);
    const peaks = detectPeaks(pts);
    expect(peaks.some(p => p.index === pts.length - 1)).toBe(true);
  });

  it('estimates positive FWHM for edge peaks', () => {
    const pts = syntheticSpectrum([{ x0: 0, h: 10, fwhm: 6 }], [0, 100], 400);
    const peaks = detectPeaks(pts);
    const edgePeak = peaks.find(p => p.index === 0);
    expect(edgePeak).toBeDefined();
    expect(edgePeak!.estimatedFWHM).toBeGreaterThan(0);
  });
});

describe('estimateNoise', () => {
  it('estimates low noise for clean data', () => {
    const pts: SpectrumPoint[] = Array.from({ length: 100 }, (_, i) => ({ x: i, y: 5 }));
    expect(estimateNoise(pts)).toBeLessThan(0.01);
  });
});
