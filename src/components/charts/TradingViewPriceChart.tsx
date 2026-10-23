import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';

export interface PricePoint {
  time: string; // 'YYYY-MM-DD'
  value: number;
}

export interface TradingViewPriceChartProps {
  data: PricePoint[];
  title?: string;
  height?: number;
  lineColor?: string;
  topColor?: string;
  bottomColor?: string;
  unit?: string;
}

export function TradingViewPriceChart({
  data,
  title = 'مسار حركة الأسعار (TradingView Engine)',
  height = 220,
  lineColor = '#f59e0b',
  topColor = 'rgba(245, 158, 11, 0.4)',
  bottomColor = 'rgba(245, 158, 11, 0.02)',
  unit = 'دينار',
}: TradingViewPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      crosshair: {
        vertLine: {
          color: 'rgba(245, 158, 11, 0.5)',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: 'rgba(245, 158, 11, 0.5)',
          width: 1,
          style: 3,
        },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor,
      bottomColor,
      lineColor,
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${price.toFixed(1)} ${unit}`,
      },
    });

    if (data.length > 0) {
      areaSeries.setData(data as any);
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Responsive resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, lineColor, topColor, bottomColor, unit]);

  // Update data dynamically
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data as any);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  return (
    <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-2">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-900">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{title}</span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          TradingView Lightweight Charts v5
        </span>
      </div>

      <div ref={chartContainerRef} className="w-full relative" />
    </div>
  );
}
