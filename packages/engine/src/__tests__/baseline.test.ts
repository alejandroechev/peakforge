import { describe, it, expect } from 'vitest';
import { computeBaseline, correctBaseline } from '../baseline';
import { SpectrumPoint } from '../parser';
import { gaussian } from '../profiles';

function makeLine(slope: number, intercept: number, n: number): SpectrumPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    x: i,
    y: slope * i + intercept,
  }));
}

describe('baseline correction', () => {
  it('linear baseline on a line returns ~zero residuals', () => {
    const pts = makeLine(2, 5, 50);
    const corrected = correctBaseline(pts, { method: 'linear' });
    for (const p of corrected) {
      expect(Math.abs(p.y)).toBeLessThan(1e-6);
    }
  });

  it('polynomial baseline removes quadratic trend', () => {
    const pts: SpectrumPoint[] = Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: 0.01 * i * i + 0.5 * i + 3,
    }));
    const corrected = correctBaseline(pts, { method: 'polynomial', degree: 2 });
    for (const p of corrected) {
      expect(Math.abs(p.y)).toBeLessThan(1e-4);
    }
  });

  it('preserves peaks above baseline', () => {
    // line + a peak at x=25
    const pts: SpectrumPoint[] = Array.from({ length: 50 }, (_, i) => {
      const base = 0.5 * i + 10;
      const peak = i === 25 ? 100 : 0;
      return { x: i, y: base + peak };
    });
    const corrected = correctBaseline(pts, { method: 'linear' });
    // peak should still be large
    const peakVal = corrected[25].y;
    expect(peakVal).toBeGreaterThan(50);
  });

  it('computeBaseline returns array matching input length', () => {
    const pts = makeLine(1, 0, 30);
    const bl = computeBaseline(pts, { method: 'linear' });
    expect(bl).toHaveLength(30);
  });

  it('user-specified anchor indices', () => {
    const pts = makeLine(1, 0, 30);
    const bl = computeBaseline(pts, { method: 'linear', anchorIndices: [0, 29] });
    expect(Math.abs(bl[0] - 0)).toBeLessThan(1e-6);
    expect(Math.abs(bl[29] - 29)).toBeLessThan(1e-6);
  });

  it('AsLS baseline flattens curved baseline while preserving peaks', () => {
    const pts: SpectrumPoint[] = Array.from({ length: 240 }, (_, i) => {
      const x = i;
      const baseline = 0.0015 * (x - 120) ** 2 + 5;
      const peaks = gaussian(x, 24, 70, 9) + gaussian(x, 18, 168, 12);
      return { x, y: baseline + peaks };
    });

    const corrected = correctBaseline(pts, {
      method: 'asls',
      aslsLambda: 100000,
      aslsP: 0.001,
      aslsIterations: 12,
    });

    const baselineRegion = corrected
      .filter((_, i) => Math.abs(i - 70) > 18 && Math.abs(i - 168) > 20)
      .map(p => p.y);
    const meanAbs = baselineRegion.reduce((s, v) => s + Math.abs(v), 0) / baselineRegion.length;
    expect(meanAbs).toBeLessThan(1.5);
    expect(corrected[70].y).toBeGreaterThan(10);
    expect(corrected[168].y).toBeGreaterThan(8);
  });

  it('AsLS baseline handles short spectra', () => {
    const pts: SpectrumPoint[] = [{ x: 0, y: 1 }, { x: 1, y: 2 }];
    const corrected = correctBaseline(pts, { method: 'asls' });
    expect(corrected).toHaveLength(2);
  });
});
