import { describe, it, expect } from 'vitest';
import { computeBaseline, correctBaseline } from '../baseline';
import { SpectrumPoint } from '../parser';

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
});
