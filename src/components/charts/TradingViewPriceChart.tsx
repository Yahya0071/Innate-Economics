import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import {
  subscribeEconomicEvent,
  type CoinDroppedPayload,
  type VillageTickPayload,
} from '../../engine/core/eventBridge';
import { Activity, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

export interface PricePoint {
  time: string; // 'YYYY-MM-DD'
  value: number;
}

export interface TradingViewPriceChartProps {
  data?: PricePoint[];
  title?: string;
  height?: number;
  lineColor?: string;
  topColor?: string;
  bottomColor?: string;
  unit?: string;
  enableLiveSync?: boolean;
}

const DEFAULT_BASELINE_DATA: PricePoint[] = [
  { time: '2026-01-01', value: 1.0 },
  { time: '2026-01-02', value: 1.05 },
  { time: '2026-01-03', value: 1.0 },
  { time: '2026-01-04', value: 1.15 },
  { time: '2026-01-05', value: 1.2 },
  { time: '2026-01-06', value: 1.25 },
];

export function TradingViewPriceChart({
  data,
  title = 'مخطط التضخم والأسعار اللحظي (TradingView Engine)',
  height = 220,
  lineColor = '#f59e0b',
  topColor = 'rgba(245, 158, 11, 0.45)',
  bottomColor = 'rgba(245, 158, 11, 0.02)',
  unit = 'دينار',
  enableLiveSync = true,
}: TradingViewPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  // State of points plotted on chart
  const [points, setPoints] = useState<PricePoint[]>(() => {
    if (data && data.length > 0) return [...data];
    return [...DEFAULT_BASELINE_DATA];
  });

  const [liveStatus, setLiveStatus] = useState<{
    currentPrice: number;
    coinsInVault: number;
    inflationPct: number;
    lastMessage: string;
    source: 'vault' | 'village' | 'idle';
  }>({
    currentPrice: 1.25,
    coinsInVault: 12,
    inflationPct: 25,
    lastMessage: 'في انتظار تفاعل الزائر مع الخزينة أو قرية الوكلاء...',
    source: 'idle',
  });

  const dayCounterRef = useRef<number>(7);

  // Format next sequential date string for Lightweight Charts
  const getNextDate = () => {
    const day = dayCounterRef.current++;
    const month = Math.floor(day / 28) + 1;
    const dayInMonth = (day % 28) + 1;
    const mStr = month < 10 ? `0${month}` : `${month}`;
    const dStr = dayInMonth < 10 ? `0${dayInMonth}` : `${dayInMonth}`;
    return `2026-${mStr}-${dStr}`;
  };

  // Initialize TradingView Chart Instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      lineWidth: 2.5,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${price.toFixed(2)} ${unit}`,
      },
    });

    if (points.length > 0) {
      areaSeries.setData(points as any);
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;
    seriesRef.current = areaSeries;

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

  // Update chart when points change
  useEffect(() => {
    if (seriesRef.current && points.length > 0) {
      seriesRef.current.setData(points as any);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [points]);

  // Listen to Global Economic Events (Cross-Island Reactive Bridge)
  useEffect(() => {
    if (!enableLiveSync) return;

    // 1. When a coin drops in PhysicsCoinVault (Money Supply Expansion)
    const unsubCoin = subscribeEconomicEvent('innate:coin-dropped', (payload: CoinDroppedPayload) => {
      const nextTime = getNextDate();
      const newPoint: PricePoint = { time: nextTime, value: payload.priceLevel };

      setPoints((prev) => [...prev.slice(-30), newPoint]);

      const inflation = Math.round(((payload.priceLevel - 1.0) / 1.0) * 100);
      setLiveStatus({
        currentPrice: payload.priceLevel,
        coinsInVault: payload.count,
        inflationPct: inflation,
        lastMessage: `تدفق نقدي (+1)! زاد النقد إلى ${payload.count} قطعة فقفز مؤشر السعر إلى ${payload.priceLevel} د (معادلة فيشر P = M·V/Q).`,
        source: 'vault',
      });
    });

    // 2. When the vault is cleared (Deflationary Crash)
    const unsubReset = subscribeEconomicEvent('innate:vault-reset', () => {
      const nextTime = getNextDate();
      const crashPoint: PricePoint = { time: nextTime, value: 0.25 };

      setPoints((prev) => [...prev.slice(-30), crashPoint]);
      setLiveStatus({
        currentPrice: 0.25,
        coinsInVault: 0,
        inflationPct: -75,
        lastMessage: 'أُفرغت الخزينة تماماً! أزمة سيولة وهبوط انكماشي حاد (Deflationary Collapse)!',
        source: 'vault',
      });
    });

    // 3. When the 60 villagers simulation executes a round (Village Tick)
    const unsubVillage = subscribeEconomicEvent('innate:village-tick', (payload: VillageTickPayload) => {
      const nextTime = getNextDate();
      const newPoint: PricePoint = { time: nextTime, value: payload.averagePrice };

      setPoints((prev) => [...prev.slice(-30), newPoint]);
      const inflation = Math.round(((payload.averagePrice - 1.0) / 1.0) * 100);
      setLiveStatus({
        currentPrice: payload.averagePrice,
        coinsInVault: Math.round(payload.totalWealth / 10),
        inflationPct: inflation,
        lastMessage: `نبض من القرية (جولة ${payload.round}): سرعة دوران النقد = ${payload.velocity} | متوسط السعر = ${payload.averagePrice} د.`,
        source: 'village',
      });
    });

    return () => {
      unsubCoin();
      unsubReset();
      unsubVillage();
    };
  }, [enableLiveSync]);

  const handleResetChart = () => {
    dayCounterRef.current = 7;
    setPoints([...DEFAULT_BASELINE_DATA]);
    setLiveStatus({
      currentPrice: 1.25,
      coinsInVault: 12,
      inflationPct: 25,
      lastMessage: 'تمت إعادة ضبط المخطط للحالة الابتدائية.',
      source: 'idle',
    });
  };

  return (
    <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3 shadow-lg">
      {/* Header with Live Status Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-bold text-white text-xs sm:text-sm">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {enableLiveSync && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <Activity className="w-3 h-3 animate-spin" />
              <span>مباشر ومتصل حياً (Live Sync)</span>
            </span>
          )}

          <button
            onClick={handleResetChart}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
            title="إعادة ضبط المخطط"
            aria-label="إعادة ضبط المخطط"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Financial Metrics Banner */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">السعر الحالي:</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {liveStatus.currentPrice.toFixed(2)} د
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">معروض النقد (M):</span>
          <span className="font-mono font-bold text-cyan-300 text-sm">
            {liveStatus.coinsInVault} قطعة
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">معدل التضخم:</span>
          <span
            className={`font-mono font-bold text-sm ${
              liveStatus.inflationPct >= 0 ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {liveStatus.inflationPct >= 0 ? `+${liveStatus.inflationPct}%` : `${liveStatus.inflationPct}%`}
          </span>
        </div>
      </div>

      {/* Real-time Narrative Feedback Ticker */}
      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-300 font-light flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="line-clamp-1">{liveStatus.lastMessage}</p>
      </div>

      {/* TradingView Lightweight Charts canvas container */}
      <div ref={chartContainerRef} className="w-full relative" />

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span>كل عملة تسقطها في الخزينة أو جولة في القرية تُنشئ شمعة تضخم فورية</span>
        <span className="font-mono">TradingView Charts v5</span>
      </div>
    </div>
  );
}
