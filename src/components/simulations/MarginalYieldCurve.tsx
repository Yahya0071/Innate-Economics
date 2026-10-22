import React, { useState } from 'react';
import { calculateMarginalWorkYield } from '../../engine/core/math';
import { Sparkles, TrendingDown } from 'lucide-react';

export const MarginalYieldCurve: React.FC = () => {
  const [selectedHours, setSelectedHours] = useState<number>(8);
  const [energyLevel, setEnergyLevel] = useState<number>(100);

  const hours = Array.from({ length: 16 }, (_, i) => i + 1);

  // Compute yields for each hour
  const yields = hours.map((h) => {
    const base = calculateMarginalWorkYield(h);
    const energyFactor = 0.3 + 0.7 * (energyLevel / 100);
    return Math.round(base * energyFactor * 100) / 100;
  });

  const totalYield = yields
    .slice(0, selectedHours)
    .reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 my-8 border border-slate-700/60 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            تشريح الساعة الفطرية
          </span>
          <h4 className="text-xl sm:text-2xl font-bold text-white">
            لماذا لا تثمر ساعتك الـ 14 كما أثمرت ساعتك الأولى؟
          </h4>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400">حصاد الساعات المختارة:</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {Math.round(totalYield * 10) / 10} <span className="text-xs text-slate-500">وحدة</span>
          </span>
        </div>
      </div>

      {/* Sliders for exploration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-300 font-medium">عدد ساعات العمل في اليوم:</span>
            <span className="font-mono text-amber-400 font-bold">{selectedHours} ساعة</span>
          </div>
          <input
            type="range"
            min={1}
            max={16}
            value={selectedHours}
            onChange={(e) => setSelectedHours(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-300 font-medium">مستوى طاقة الجسد:</span>
            <span className="font-mono text-emerald-400 font-bold">{energyLevel}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="space-y-2">
        <div className="flex items-end gap-1.5 h-44 sm:h-52 w-full pt-4 pb-2 px-2 bg-slate-950/40 rounded-2xl border border-slate-800/50">
          {hours.map((h, idx) => {
            const y = yields[idx];
            const isSelected = h <= selectedHours;
            const heightPercent = (y / 1.5) * 100;

            return (
              <div
                key={h}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                onClick={() => setSelectedHours(h)}
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-lg font-mono">
                  ساعة {h}: +{y} وحدة
                </div>

                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isSelected
                      ? h <= 4
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm'
                        : h <= 8
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                        : h <= 12
                        ? 'bg-gradient-to-t from-orange-600 to-orange-400'
                        : 'bg-gradient-to-t from-rose-700 to-rose-500'
                      : 'bg-slate-800/40 hover:bg-slate-700/60'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                <span
                  className={`text-[10px] sm:text-xs mt-1 font-mono transition-colors ${
                    isSelected ? 'text-slate-300 font-bold' : 'text-slate-600'
                  }`}
                >
                  {h}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> ساعات البكور (1-4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> الساعات الطبيعية (5-8)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" /> بداية الهبوط (9-12)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> الإجهاد والإنهاك (13-16)
          </span>
        </div>
      </div>
    </div>
  );
};
