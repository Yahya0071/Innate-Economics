import React, { useState, useMemo, useCallback } from 'react';
import { Mafs, Coordinates, Plot, MovablePoint, Line, Text } from 'mafs';
import 'mafs/core.css';
import { playSoftClick } from '../../engine/core/audio';
import { RefreshCw, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export function InteractiveEquilibriumCurve() {
  // Demand curve intercept (P-intercept) controlled by movable point
  const [demandIntercept, setDemandIntercept] = useState<number>(8);
  // Supply curve intercept
  const [supplyIntercept, setSupplyIntercept] = useState<number>(2);

  // Slopes
  const slopeDemand = 0.8; // P = d - 0.8 * Q
  const slopeSupply = 0.6; // P = s + 0.6 * Q

  // Calculate equilibrium (P*, Q*)
  // s + 0.6 Q = d - 0.8 Q => 1.4 Q = d - s => Q* = (d - s) / 1.4
  const equilibrium = useMemo(() => {
    const qStar = Math.max(0, (demandIntercept - supplyIntercept) / (slopeSupply + slopeDemand));
    const pStar = Math.max(0, supplyIntercept + slopeSupply * qStar);
    return {
      q: Number(qStar.toFixed(2)),
      p: Number(pStar.toFixed(2)),
    };
  }, [demandIntercept, supplyIntercept]);

  const handleDemandPointMove = useCallback((point: [number, number]) => {
    const newY = Math.max(4, Math.min(10, point[1]));
    setDemandIntercept(newY);
    playSoftClick();
  }, []);

  const handleSupplyPointMove = useCallback((point: [number, number]) => {
    const newY = Math.max(0.5, Math.min(5, point[1]));
    setSupplyIntercept(newY);
    playSoftClick();
  }, []);

  const resetToDefault = () => {
    setDemandIntercept(8);
    setSupplyIntercept(2);
    playSoftClick();
  };

  const applyPreset = (preset: 'boom' | 'drought' | 'normal') => {
    if (preset === 'boom') {
      setDemandIntercept(9.5);
      setSupplyIntercept(2);
    } else if (preset === 'drought') {
      setDemandIntercept(8);
      setSupplyIntercept(4.5);
    } else {
      setDemandIntercept(8);
      setSupplyIntercept(2);
    }
    playSoftClick();
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-3xl border-slate-800 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مخبر المنحنيات التفاعلية (Mafs Visual Math)</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            تحريك منحنيات العرض والطلب باللمس والسحب
          </h3>
          <p className="text-xs text-slate-400">
            اسحب النقطة البرتقالية لتحريك الطلب، أو النقطة الخضراء لتغيير تكلفة العرض، وراقب كيف يتحرك توازن السوق تلقائياً.
          </p>
        </div>

        <button
          onClick={resetToDefault}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>

      {/* Presets bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">سيناريوهات سريعة:</span>
        <button
          onClick={() => applyPreset('boom')}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>طفرة في الطلب (Consumer Boom)</span>
        </button>
        <button
          onClick={() => applyPreset('drought')}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>شح الموارد ونقص المحصول (Supply Shock)</span>
        </button>
        <button
          onClick={() => applyPreset('normal')}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
        >
          <span>التوازن الطبيعي</span>
        </button>
      </div>

      {/* Interactive Curve Canvas via Mafs */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-inner" dir="ltr">
        <Mafs
          height={380}
          viewBox={{ x: [-1, 10], y: [-1, 11] }}
          preserveAspectRatio={false}
          pan={false}
          zoom={false}
        >
          <Coordinates.Cartesian
            xAxis={{ lines: 1, labels: (x) => (x > 0 && x <= 9 ? `${x}` : '') }}
            yAxis={{ lines: 1, labels: (y) => (y > 0 && y <= 10 ? `${y}` : '') }}
          />

          {/* Demand Curve (Downward Sloping) */}
          <Plot.OfX
            y={(x) => demandIntercept - slopeDemand * x}
            color="#f59e0b"
            weight={3}
          />

          {/* Supply Curve (Upward Sloping) */}
          <Plot.OfX
            y={(x) => supplyIntercept + slopeSupply * x}
            color="#10b981"
            weight={3}
          />

          {/* Equilibrium Projection Lines */}
          <Line.Segment
            point1={[equilibrium.q, 0]}
            point2={[equilibrium.q, equilibrium.p]}
            style="dashed"
            color="#38bdf8"
            weight={2}
          />
          <Line.Segment
            point1={[0, equilibrium.p]}
            point2={[equilibrium.q, equilibrium.p]}
            style="dashed"
            color="#38bdf8"
            weight={2}
          />

          {/* Draggable Point for Demand Intercept */}
          <MovablePoint
            point={[0, demandIntercept]}
            onMove={handleDemandPointMove}
            color="#f59e0b"
            constrain={([, y]) => [0, Math.max(4, Math.min(10, y))]}
          />

          {/* Draggable Point for Supply Intercept */}
          <MovablePoint
            point={[0, supplyIntercept]}
            onMove={handleSupplyPointMove}
            color="#10b981"
            constrain={([, y]) => [0, Math.max(0.5, Math.min(5, y))]}
          />

          {/* Labels on Plot */}
          <Text
            x={Math.min(8.5, (demandIntercept - 1) / slopeDemand)}
            y={1}
            color="#f59e0b"
            size={14}
          >
            الطلب (Demand)
          </Text>

          <Text
            x={Math.min(8.5, (9.5 - supplyIntercept) / slopeSupply)}
            y={9.5}
            color="#10b981"
            size={14}
          >
            العرض (Supply)
          </Text>

          {/* Equilibrium Point Label */}
          <Text
            x={equilibrium.q + 0.3}
            y={equilibrium.p + 0.4}
            color="#38bdf8"
            size={15}
            svgTextProps={{ fontWeight: 'bold' }}
          >
            {`E (${equilibrium.q}, ${equilibrium.p})`}
          </Text>
        </Mafs>

        {/* Legend Overlay */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] space-y-1 font-sans text-right" dir="rtl">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>منحنى الطلب (اسحب النقطة البرتقالية)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>منحنى العرض (اسحب النقطة الخضراء)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>نقطة التوازن اللحظية (Equilibrium)</span>
          </div>
        </div>
      </div>

      {/* Live Equilibrium Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">سعر التوازن الحرج (P*)</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono">
            {equilibrium.p} دينار
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            السعر الذي تتطابق عنده رغبة الشراء والبيع
          </span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">كمية التوازن المتداولة (Q*)</span>
          <span className="text-2xl font-bold text-amber-400 font-mono">
            {equilibrium.q} وحدة
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            حجم الإنتاج الفعلي في السوق
          </span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">قيمة التبادل الإجمالية</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {(equilibrium.p * equilibrium.q).toFixed(1)} دينار
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            السيولة المتداولة (P* × Q*)
          </span>
        </div>
      </div>
    </div>
  );
}
