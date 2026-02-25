import { useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Brush,
} from 'recharts';
import type { PeakParams, FitResult } from '@peakforge/engine';
import { getPeakColor } from '../App';

interface SpectrumChartProps {
  data: Record<string, number>[];
  peaks: PeakParams[];
  fitResult: FitResult | null;
  xLabel: string;
  yLabel: string;
  onAddPeak: (x: number, y: number) => void;
  onBrushChange?: (startIdx: number, endIdx: number) => void;
}

export function SpectrumChart({
  data, peaks, fitResult, xLabel, yLabel, onAddPeak, onBrushChange,
}: SpectrumChartProps) {
  const handleClick = useCallback((e: any) => {
    if (e?.activePayload?.[0]) {
      const { x, raw } = e.activePayload[0].payload;
      onAddPeak(x, raw);
    }
  }, [onAddPeak]);

  return (
    <>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} onClick={handleClick} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={v => v.toFixed(0)}
            />
            <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(v: number) => v.toFixed(4)}
              labelFormatter={v => `${xLabel}: ${Number(v).toFixed(2)}`}
              contentStyle={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
              labelStyle={{ color: 'var(--fg)' }}
              itemStyle={{ color: 'var(--fg)' }}
            />
            <Legend />
            <Brush
              dataKey="x"
              height={24}
              stroke="var(--accent)"
              tickFormatter={(value: number) => Number(value).toFixed(0)}
              onChange={(range: {startIndex?: number; endIndex?: number}) => {
                if (onBrushChange && range.startIndex !== undefined && range.endIndex !== undefined) {
                  onBrushChange(range.startIndex, range.endIndex);
                }
              }}
            />

            <Line type="monotone" dataKey="raw" stroke="var(--fg2)" dot={false}
              strokeWidth={1.5} name="Raw" />

            {fitResult && (
              <Line type="monotone" dataKey="fitted" stroke="var(--accent)"
                dot={false} strokeWidth={2} name="Envelope" strokeDasharray="6 3" />
            )}

            {fitResult && fitResult.peaks.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`peak${i}`}
                stroke={getPeakColor(i)} dot={false} strokeWidth={1.5}
                name={`Peak ${i + 1}`} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-x-label">{xLabel}</div>

      {fitResult && (
        <div className="residual-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']}
                tickFormatter={v => v.toFixed(0)} hide />
              <YAxis tickFormatter={v => v.toFixed(2)} />
              <Tooltip
                formatter={(v: number) => v.toFixed(4)}
                contentStyle={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
                itemStyle={{ color: 'var(--fg)' }}
              />
              <Line type="monotone" dataKey="residual" stroke="var(--danger)"
                dot={false} strokeWidth={1} name="Residual" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
