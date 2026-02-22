/** A single data point in a spectrum */
export interface SpectrumPoint {
  x: number;
  y: number;
}

/** Parsed spectrum data */
export interface Spectrum {
  points: SpectrumPoint[];
  xLabel: string;
  yLabel: string;
}

/** Detect delimiter from a CSV line */
function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

/** Parse a CSV string into a Spectrum */
export function parseCSV(text: string): Spectrum {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

  const delimiter = detectDelimiter(lines[0]);
  const headerParts = lines[0].split(delimiter).map(s => s.trim());

  // Check if first line is a header (non-numeric first column)
  let startIdx = 0;
  let xLabel = 'x';
  let yLabel = 'y';
  const firstVal = parseFloat(headerParts[0]);
  if (isNaN(firstVal)) {
    xLabel = headerParts[0] || 'x';
    yLabel = headerParts[1] || 'y';
    startIdx = 1;
  }

  const points: SpectrumPoint[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map(s => s.trim());
    if (parts.length < 2) continue;
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) continue;
    points.push({ x, y });
  }

  if (points.length === 0) throw new Error('No valid data points found');

  // Sort by x ascending
  points.sort((a, b) => a.x - b.x);

  return { points, xLabel, yLabel };
}
