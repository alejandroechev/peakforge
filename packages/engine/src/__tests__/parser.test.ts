import { describe, it, expect } from 'vitest';
import { parseCSV } from '../parser';

describe('parseCSV', () => {
  it('parses comma-delimited CSV with header', () => {
    const csv = 'wavenumber,intensity\n100,0.5\n200,1.0\n300,0.7';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(3);
    expect(s.xLabel).toBe('wavenumber');
    expect(s.yLabel).toBe('intensity');
    expect(s.points[0]).toEqual({ x: 100, y: 0.5 });
  });

  it('handles tab-delimited data', () => {
    const csv = 'x\ty\n10\t5\n20\t10';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(2);
  });

  it('handles semicolon-delimited data', () => {
    const csv = 'x;y\n1;2\n3;4';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(2);
  });

  it('sorts by x ascending', () => {
    const csv = 'x,y\n300,1\n100,2\n200,3';
    const s = parseCSV(csv);
    expect(s.points.map(p => p.x)).toEqual([100, 200, 300]);
  });

  it('handles headerless numeric data', () => {
    const csv = '100,0.5\n200,1.0';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(2);
    expect(s.xLabel).toBe('x');
  });

  it('skips invalid lines', () => {
    const csv = 'x,y\n100,0.5\nbad,data\n200,1.0';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(2);
  });

  it('throws on empty input', () => {
    expect(() => parseCSV('')).toThrow();
  });

  it('throws on no valid data', () => {
    expect(() => parseCSV('x,y\nbad,bad')).toThrow('No valid data points');
  });

  it('handles Windows line endings', () => {
    const csv = 'x,y\r\n100,1\r\n200,2';
    const s = parseCSV(csv);
    expect(s.points).toHaveLength(2);
  });
});
