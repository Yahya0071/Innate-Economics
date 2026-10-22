import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialPastureState,
  calculateSheepYield,
  evaluateSeason,
} from '../../engine/common-pasture/engine';
import {
  OPTIMAL_PASTURE_CAPACITY,
  SUSTAINABLE_PER_SHEPHERD,
} from '../../engine/common-pasture/constants';
import type { GovernanceMode, PastureState } from '../../engine/common-pasture/types';
import {
  TreePine,
  ShieldCheck,
  Fence,
  AlertTriangle,
  RotateCcw,
  Share2,
  Check,
  Play,
  TrendingDown,
  Sparkles,
  Layers,
  Users,
} from 'lucide-react';

export const PastureSimulation: React.FC = () => {
  const [state, setState] = useState<PastureState>(() => createInitialPastureState());
  const [playerSheepInput, setPlayerSheepInput] = useState<number>(2);
  const [selectedMode, setSelectedMode] = useState<GovernanceMode>('open-access');
  const [copiedLink, setCopiedLink] = useState(false);

  // Read URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = Number(params.get('sheep'));
      const m = params.get('mode') as GovernanceMode;
      if (!isNaN(s) && s >= 0 && s <= 8) {
        setPlayerSheepInput(s);
      }
      if (m && ['open-access', 'community-treaty', 'private-fences'].includes(m)) {
        setSelectedMode(m);
      }
    }
  }, []);

  // Compute live preview values
  const totalOtherSheep = state.otherShepherdsSheep.reduce((a, b) => a + b, 0);
  const effectivePlayerSheep =
    selectedMode === 'community-treaty' ? Math.min(2, playerSheepInput) : playerSheepInput;
  const previewTotalSheep = effectivePlayerSheep + totalOtherSheep;
  const previewYield = calculateSheepYield(previewTotalSheep, state.pastureHealth);
  const previewPlayerIncome = Math.round(effectivePlayerSheep * previewYield * 10) / 10;

  const handleStepSeason = () => {
    if (state.isDesertified) return;

    const { nextState, outcome } = evaluateSeason(state, playerSheepInput, selectedMode);
    setState(nextState);

    if (nextState.season > 5 && nextState.pastureHealth >= 70 && !nextState.isDesertified) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleSimulateFiveSeasons = () => {
    let current = state;
    for (let i = 0; i < 5; i++) {
      if (current.isDesertified) break;
      const { nextState } = evaluateSeason(current, playerSheepInput, selectedMode);
      current = nextState;
    }
    setState(current);
    if (!current.isDesertified && current.pastureHealth >= 80) {
      confetti({ particleCount: 70, spread: 80 });
    }
  };

  const handleReset = () => {
    setState(createInitialPastureState());
    setPlayerSheepInput(2);
    setSelectedMode('open-access');
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('sheep', playerSheepInput.toString());
    url.searchParams.set('mode', selectedMode);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const applyPreset = (preset: 'sustainable' | 'tragedy' | 'treaty' | 'fences') => {
    if (preset === 'sustainable') {
      setState(createInitialPastureState());
      setPlayerSheepInput(2);
      setSelectedMode('open-access');
    } else if (preset === 'tragedy') {
      setState(createInitialPastureState());
      setPlayerSheepInput(5);
      setSelectedMode('open-access');
    } else if (preset === 'treaty') {
      setState(createInitialPastureState());
      setPlayerSheepInput(2);
      setSelectedMode('community-treaty');
    } else if (preset === 'fences') {
      setState(createInitialPastureState());
      setPlayerSheepInput(4);
      setSelectedMode('private-fences');
    }
  };

  // Color dynamics for pasture meadow
  const getPastureBg = () => {
    if (state.pastureHealth >= 80) return 'from-emerald-950/60 to-emerald-900/40 border-emerald-500/30';
    if (state.pastureHealth >= 50) return 'from-yellow-950/50 to-amber-900/30 border-amber-500/30';
    if (state.pastureHealth >= 20) return 'from-orange-950/50 to-rose-950/30 border-orange-500/30';
    return 'from-rose-950/60 to-stone-950/80 border-rose-600/40';
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <TreePine className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              محاكي الموارد المشتركة والبيئة
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            هضبة المرعى المشترك (الموسم {state.season})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعشيب المرعى</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التجربة'}</span>
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          سيناريوهات فطرية جاهزة للاختبار:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('sustainable')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
              1. التوازن العفوي
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              شاتان لكل راعٍ (10 شياه بالمرعى)
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('tragedy')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
              2. سباق الجشع (المأساة)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              الجميع يضاعف قطيعه نحو التصحر
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('treaty')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
              3. ميثاق أوستروم
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              ميثاق عرفي ملزم بسقف شاتين
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('fences')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
              4. تسييج الحصص (الملكية)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              تقسيم الهضبة إلى 5 قطع خاصة
            </div>
          </button>
        </div>
      </div>

      {/* Pasture Health & Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Pasture Health Gauge */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TreePine className="w-4 h-4 text-emerald-400" />
              خضوبة وصحة العشب
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                state.pastureHealth >= 70
                  ? 'text-emerald-400'
                  : state.pastureHealth >= 35
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {Math.round(state.pastureHealth)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                state.pastureHealth >= 70
                  ? 'bg-emerald-500'
                  : state.pastureHealth >= 35
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${state.pastureHealth}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.isDesertified
              ? 'ماتت الجذور! تصحرت الأرض وفقدت قدرتها على التجدد.'
              : state.pastureHealth >= 80
              ? 'المرعى في أوج خضوبته؛ غذاء وافر يكفي الشياه.'
              : 'بداية التآكل؛ العشب يختفي أسرع من نموه.'}
          </p>
        </div>

        {/* Metric 2: Value per Sheep */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            عائد الشاة الواحدة (اللحم والصوف)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {previewYield}
            </span>
            <span className="text-xs text-slate-400">دراهم / رأس</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {previewYield >= 9
              ? 'شاة سمينة غزيرة الصوف واللبن'
              : previewYield >= 4
              ? 'شاة هازلة لنقص الغذاء والتزاحم'
              : 'شاة متعبة لا تكاد تكفي ثمن علفها'}
          </p>
        </div>

        {/* Metric 3: Total Sheep on Field */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-cyan-400" />
            إجمالي شياه المرعى
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                previewTotalSheep <= OPTIMAL_PASTURE_CAPACITY ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {previewTotalSheep}
            </span>
            <span className="text-xs text-slate-400">
              / {OPTIMAL_PASTURE_CAPACITY} (الحد الآمن)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {previewTotalSheep > OPTIMAL_PASTURE_CAPACITY
              ? `فائض قدره +${previewTotalSheep - OPTIMAL_PASTURE_CAPACITY} شياه يلتهم جذور العشب!`
              : 'ضمن قدرة الطبيعة على التجدد التلقائي.'}
          </p>
        </div>

        {/* Metric 4: Player Season Income */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            ربحك الشخصي المتوقع
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-purple-300">
              +{previewPlayerIncome}
            </span>
            <span className="text-xs text-slate-400">دراهم (موسمي)</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
            <span>رصيدك التراكمي: {state.playerGold} د</span>
            <span>القرية: {state.villageGold} د</span>
          </div>
        </div>
      </div>

      {/* Visual Pasture Meadow Display */}
      <div className={`bg-gradient-to-b ${getPastureBg()} rounded-2xl p-6 border my-6 relative transition-colors duration-700 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            مشهد الهضبة الميداني:
            {selectedMode === 'private-fences' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                أراضي مسيجة بالملكيات
              </span>
            )}
          </span>
          <span className="text-[11px] text-slate-300 font-mono">
            قطيعك: {effectivePlayerSheep} شياه • بقية الرعاة: {totalOtherSheep} شياه
          </span>
        </div>

        {/* Sheep Visual Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 py-4 px-3 bg-black/30 rounded-xl backdrop-blur-sm border border-white/5">
          {/* Player Sheep */}
          {Array.from({ length: effectivePlayerSheep }, (_, i) => (
            <div
              key={`player-${i}`}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm"
              title="شاة تابعة لقطيعك الخاص"
            >
              <span className="text-xl">🐑</span>
              <span className="text-[9px] font-bold text-amber-300 mt-0.5 font-mono">أنت</span>
            </div>
          ))}

          {/* Other Shepherds' Sheep */}
          {Array.from({ length: totalOtherSheep }, (_, i) => (
            <div
              key={`other-${i}`}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300"
              title="شاة لأحد جيرانك الرعاة"
            >
              <span className="text-xl">🐑</span>
              <span className="text-[9px] text-slate-400 mt-0.5 font-mono">جار</span>
            </div>
          ))}

          {/* Empty Meadow Spots */}
          {Array.from({ length: Math.max(0, 15 - previewTotalSheep) }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-white/10 opacity-30 text-emerald-300"
            >
              <span className="text-base">🌱</span>
              <span className="text-[8px] text-slate-500 mt-0.5">عشب</span>
            </div>
          ))}
        </div>

        {/* Narrative Systemic Feedback Note */}
        {state.history.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-100">
                {state.history[state.history.length - 1].narrativeNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls & Governance Mode Switcher */}
      <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 my-6 space-y-6">
        {/* Governance Switcher Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-2">
            اختر نظام إدارة المرعى (كيف يتعامل المجتمع مع العشب المشترك؟):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMode('open-access')}
              className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                selectedMode === 'open-access'
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-200 glow-rose'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>1. مشاع مفتوح بلا حسيب</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                كل راعٍ يطلق ما يشاء؛ الأرباح فردية والتكلفة على الجميع حتى يتصحر العشب.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('community-treaty')}
              className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                selectedMode === 'community-treaty'
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 glow-cyan'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>2. ميثاق العرف المشترك (أوستروم)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                سقف ملزم (شاتان كحد أقصى) مع مراقبة جماعية تحفظ ديمومة خضرة الهضبة.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('private-fences')}
              className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                selectedMode === 'private-fences'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 glow-amber'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Fence className="w-4 h-4 text-amber-400" />
                <span>3. تسييج الحصص (حقوق الملكية)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                تقسيم الأرض لقطع خاصة؛ من يفرط في الرعي تتصحر أرضه هو وحده دون أن يضر جاره.
              </p>
            </button>
          </div>
        </div>

        {/* Player Sheep Slider */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200">
              كم شاة ستطلق في المرعى هذا الموسم يا راعي؟
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {playerSheepInput} شياه
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={7}
            value={playerSheepInput}
            onChange={(e) => setPlayerSheepInput(Number(e.target.value))}
            disabled={selectedMode === 'community-treaty'}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>0 شاة (راحة كاملة)</span>
            <span>2 شياه (الحصة العادلة المستدامة)</span>
            <span>7 شياه (طمع حاد يستنزف الهضبة)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleStepSeason}
            disabled={state.isDesertified}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-lg glow-emerald cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>عِش الموسم {state.season} واختبر النتيجة</span>
          </button>

          {!state.isDesertified && (
            <button
              type="button"
              onClick={handleSimulateFiveSeasons}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer text-xs sm:text-sm"
            >
              <span>محاكاة 5 مواسم متتالية</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
