import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialVillageState,
  evaluateMarketDay,
  expandOvens,
  injectGold,
  setPriceControl,
} from '../../engine/village-money/engine';
import { BASELINE_POPULATION, MAX_OVENS } from '../../engine/village-money/constants';
import type { VillageMarketState } from '../../engine/village-money/types';
import {
  Coins,
  Flame,
  AlertOctagon,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  Share2,
  Check,
  Plus,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { playCoinChime, playTactileTick, playWarningThud, playSuccessChime } from '../../utils/audio';
import { TradingViewPriceChart } from '../charts/TradingViewPriceChart';
import { PhysicsCoinVault } from '../physics/PhysicsCoinVault';

export const VillageMoneySimulation: React.FC = () => {
  const [state, setState] = useState<VillageMarketState>(() => createInitialVillageState());
  const [copiedLink, setCopiedLink] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; value: number }>>([
    { time: '2026-01-01', value: 1.0 },
    { time: '2026-01-02', value: 1.0 },
    { time: '2026-01-03', value: 1.0 },
  ]);

  // Read URL query params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = Number(params.get('m'));
      const q = Number(params.get('q'));
      const cap = params.get('cap');

      if (!isNaN(m) && m >= 20) {
        setState((prev) => {
          let updated = { ...prev, goldSupply: m };
          if (!isNaN(q) && q >= 20) {
            const ovens = Math.min(MAX_OVENS, Math.max(1, Math.round(q / 20)));
            updated.ovensCount = ovens;
            updated.dailyBreadCapacity = ovens * 20;
          }
          if (cap !== null && !isNaN(Number(cap))) {
            updated.priceCeiling = Number(cap);
          }
          return updated;
        });
      }
    }
  }, []);

  const outcome = evaluateMarketDay(state);

  // Record price trajectory for TradingView charts
  useEffect(() => {
    setPriceHistory((prev) => {
      const nextDay = prev.length + 1;
      const dayStr = nextDay < 10 ? `0${nextDay}` : `${nextDay}`;
      const nextTime = nextDay <= 28 ? `2026-01-${dayStr}` : `2026-02-0${(nextDay % 28) + 1}`;
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.value - outcome.officialPrice) < 0.01) return prev;
      return [...prev.slice(-30), { time: nextTime, value: outcome.officialPrice }];
    });
  }, [outcome.officialPrice]);

  const handleGoldChange = (val: number) => {
    setState((prev) => ({ ...prev, goldSupply: Math.max(10, val) }));
    playTactileTick();
  };

  const handleInjectGoldBurst = () => {
    setState((prev) => injectGold(prev, 30));
    playCoinChime();
  };

  const handleBuildOven = () => {
    if (state.ovensCount < MAX_OVENS) {
      const next = expandOvens(state);
      setState(next);
      playSuccessChime();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleTogglePriceCeiling = () => {
    setState((prev) => {
      const newCeiling = prev.priceCeiling === null ? 1.0 : null;
      if (newCeiling !== null) {
        playWarningThud();
      } else {
        playTactileTick();
      }
      return setPriceControl(prev, newCeiling);
    });
  };

  const handleReset = () => {
    setState(createInitialVillageState());
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('m', state.goldSupply.toString());
    url.searchParams.set('q', state.dailyBreadCapacity.toString());
    if (state.priceCeiling !== null) {
      url.searchParams.set('cap', state.priceCeiling.toString());
    } else {
      url.searchParams.delete('cap');
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Preset scenarios
  const applyPreset = (preset: 'equilibrium' | 'inflation' | 'ceiling' | 'abundance') => {
    if (preset === 'equilibrium') {
      setState({
        population: BASELINE_POPULATION,
        goldSupply: 20,
        dailyBreadCapacity: 20,
        ovensCount: 1,
        priceCeiling: null,
        day: 1,
        bakeryTreasury: 0,
      });
    } else if (preset === 'inflation') {
      setState({
        population: BASELINE_POPULATION,
        goldSupply: 80,
        dailyBreadCapacity: 20,
        ovensCount: 1,
        priceCeiling: null,
        day: 2,
        bakeryTreasury: 0,
      });
    } else if (preset === 'ceiling') {
      setState({
        population: BASELINE_POPULATION,
        goldSupply: 80,
        dailyBreadCapacity: 20,
        ovensCount: 1,
        priceCeiling: 1.0,
        day: 3,
        bakeryTreasury: 0,
      });
    } else if (preset === 'abundance') {
      setState({
        population: BASELINE_POPULATION,
        goldSupply: 80,
        dailyBreadCapacity: 80,
        ovensCount: 4,
        priceCeiling: null,
        day: 4,
        bakeryTreasury: 0,
      });
      confetti({ particleCount: 70, spread: 80 });
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Coins className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              مختبر تضخم السوق وقرية الخبز
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            سوق قرية الـ 20 عائلة
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط السوق</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التجربة'}</span>
          </button>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          سيناريوهات جاهزة للاختبار الفوري:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('equilibrium')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
              1. التوازن الفطري
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              20 ذهب = 20 رغيفاً (دينار للرغيف)
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('inflation')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
              2. صدمة الذهب (التضخم)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              80 ذهب مع بقاء 20 رغيفاً
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('ceiling')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
              3. مأساة التسعير الجبري
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              تثبيت السعر إجبارياً عند دينار واحد
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('abundance')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
              4. ثورة الوفرة الحقيقية
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              مضاعفة الأفران إلى 4 أفران
            </div>
          </button>
        </div>
      </div>

      {/* Vital Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Official Price */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            سعر الرغيف في المخبز
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {outcome.officialPrice}
            </span>
            <span className="text-xs text-slate-400">دينار / رغيف</span>
          </div>
          {state.priceCeiling !== null && (
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              تسعير جبري مقيد
            </span>
          )}
        </div>

        {/* Metric 2: Black Market Price */}
        <div
          className={`glass-panel rounded-2xl p-5 border transition-all ${
            outcome.isBlackMarketActive
              ? 'bg-rose-950/30 border-rose-500/40 shadow-lg glow-rose'
              : 'bg-slate-900/80 border-slate-800 opacity-60'
          }`}
        >
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            سوق الأزقة (السوق السوداء)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {outcome.blackMarketPrice !== null ? outcome.blackMarketPrice : '—'}
            </span>
            <span className="text-xs text-slate-400">
              {outcome.blackMarketPrice !== null ? 'دينار / رغيف' : 'غير موجودة'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {outcome.isBlackMarketActive
              ? 'يبيعها المشترون الأوائل للمحرومين في الخفاء'
              : 'الأسعار حرة، فلا يوجد دافع للسوق السوداء'}
          </p>
        </div>

        {/* Metric 3: Real Production (Ovens & Loaves) */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            إنتاج الخبز الحقيقي
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-orange-400">
              {state.dailyBreadCapacity}
            </span>
            <span className="text-xs text-slate-400">
              رغيفاً ({state.ovensCount} أفران)
            </span>
          </div>
          <button
            type="button"
            onClick={handleBuildOven}
            disabled={state.ovensCount >= MAX_OVENS}
            className="mt-2 text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            <span>بناء فرن إضافي (+20 رغيفاً)</span>
          </button>
        </div>

        {/* Metric 4: Satiety vs Hunger in Village */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-emerald-400" />
            حالة شبع القرية (20 عائلة)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {outcome.satisfiedPeopleCount} <span className="text-xs text-slate-400 font-sans">شبعان</span>
            </span>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-2xl font-extrabold font-mono text-rose-400">
              {outcome.hungryPeopleCount} <span className="text-xs text-slate-400 font-sans">جائع</span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(outcome.satisfiedPeopleCount / 20) * 100}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${(outcome.hungryPeopleCount / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Financial Charting (TradingView) & 2D Physics Coin Vault (Matter.js) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-6">
        <TradingViewPriceChart
          data={priceHistory}
          title="مخطط أسعار الخبز اللحظي (TradingView Lightweight Charts)"
          height={240}
        />
        <PhysicsCoinVault
          initialCoins={Math.min(60, Math.max(10, Math.round(state.goldSupply / 3)))}
          label="خزينة الذهب الفيزيائية المباشرة (Matter.js Physics)"
        />
      </div>

      {/* Visual Queue & Village Street Simulation */}
      <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800/80 my-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            طابور المخبز وحركة أهالي القرية:
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {outcome.satisfiedPeopleCount} نالوا خبزاً • {outcome.hungryPeopleCount} عادوا خائبين
          </span>
        </div>

        {/* Visual People Grid */}
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2 py-3 px-2 bg-slate-900/50 rounded-xl border border-slate-800">
          {Array.from({ length: 20 }, (_, i) => {
            const gotBread = i < outcome.satisfiedPeopleCount;
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  gotBread
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-400 opacity-70'
                }`}
                title={`عائلة رقم ${i + 1}: ${gotBread ? 'نالت خبزاً' : 'جائعة بلا رغيف!'}`}
              >
                <div className="text-base sm:text-lg">{gotBread ? '🍞' : '🥀'}</div>
                <span className="text-[9px] font-mono mt-1">عائلة {i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Systemic Narrative Feedback Banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-100">{outcome.narrativeNote}</p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Manipulation Sliders */}
      <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 my-6 space-y-6">
        {/* Slider 1: Total Gold Supply */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              إجمالي الذهب المتداول بين السكان ($M$):
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {state.goldSupply} دينار ذهبي
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={140}
            step={5}
            value={state.goldSupply}
            onChange={(e) => handleGoldChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>20 ديناراً (دينار لكل عائلة)</span>
            <button
              type="button"
              onClick={handleInjectGoldBurst}
              className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              + اكتشف كنزاً ذهبياً (+30 ديناراً فجأة)
            </button>
            <span>140 ديناراً (تضخم حاد)</span>
          </div>
        </div>

        {/* Toggle 2: Price Ceiling Policy */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              سياسة تحديد الأسعار قسرياً (التسعير الجبري):
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              إلزام المخبز ببيع الرغيف بـ 1.0 دينار فقط ومنعه من رفع السعر بدافع حماية الفقراء.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTogglePriceCeiling}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              state.priceCeiling !== null
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg glow-rose'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {state.priceCeiling !== null ? 'التسعير الجبري: مُفعّل (1 دينار)' : 'التسعير الجبري: مُعطل (سوق حر)'}
          </button>
        </div>
      </div>
    </div>
  );
};
