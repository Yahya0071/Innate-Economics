import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialFarmerState,
  calculateSeasonalYield,
  applyLoanDecision,
  advanceCreditSeason,
} from '../../engine/borrowing-tomorrow/engine';
import {
  BASELINE_YIELD,
  BASELINE_CONSUMPTION,
  DEFAULT_LOAN_PRINCIPAL,
  DEFAULT_INTEREST_RATE,
} from '../../engine/borrowing-tomorrow/constants';
import type { FarmerCreditState } from '../../engine/borrowing-tomorrow/types';
import {
  Wheat,
  Droplets,
  Coins,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Share2,
  Check,
  Play,
  TrendingUp,
  Sparkles,
  Landmark,
} from 'lucide-react';
import { playTactileTick, playWaterDrop, playCoinChime, playSuccessChime, playWarningThud } from '../../utils/audio';

export const BorrowingSimulation: React.FC = () => {
  const [state, setState] = useState<FarmerCreditState>(() => {
    // Start with default productive loan pre-applied
    const initial = createInitialFarmerState();
    return applyLoanDecision(initial, { productiveBags: 20, consumptionBags: 0 });
  });

  const [loanPrincipal, setLoanPrincipal] = useState<number>(DEFAULT_LOAN_PRINCIPAL);
  const [productiveBags, setProductiveBags] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(DEFAULT_INTEREST_RATE);
  const [copiedLink, setCopiedLink] = useState(false);

  const consumptionBags = Math.max(0, loanPrincipal - productiveBags);

  // Read URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loan = Number(params.get('loan'));
      const prod = Number(params.get('prod'));
      const rate = Number(params.get('rate'));

      if (!isNaN(loan) && loan >= 0 && loan <= 40) {
        setLoanPrincipal(loan);
        const p = !isNaN(prod) ? Math.min(loan, prod) : loan;
        setProductiveBags(p);
        const r = !isNaN(rate) ? rate / 100 : DEFAULT_INTEREST_RATE;
        setInterestRate(r);

        const fresh = createInitialFarmerState();
        setState(applyLoanDecision(fresh, { productiveBags: p, consumptionBags: loan - p }, { interestRate: r }));
      }
    }
  }, []);

  const handleProductiveChange = (val: number) => {
    const clamped = Math.max(0, Math.min(loanPrincipal, val));
    setProductiveBags(clamped);
    const fresh = createInitialFarmerState();
    setState(applyLoanDecision(fresh, { productiveBags: clamped, consumptionBags: loanPrincipal - clamped }, { interestRate }));
    if (clamped > 0) {
      playWaterDrop();
    } else {
      playTactileTick();
    }
  };

  const handleLoanSizeChange = (val: number) => {
    setLoanPrincipal(val);
    const newProd = Math.min(val, productiveBags);
    setProductiveBags(newProd);
    const fresh = createInitialFarmerState();
    setState(applyLoanDecision(fresh, { productiveBags: newProd, consumptionBags: val - newProd }, { interestRate }));
  };

  const handleStepSeason = () => {
    if (state.isBankrupt || state.season > state.maxSeasons) return;

    const next = advanceCreditSeason(state);
    setState(next);

    if (next.isBankrupt) {
      playWarningThud();
    } else if (state.season === state.debtDueSeason && next.debtPrincipal === 0) {
      playSuccessChime();
      playCoinChime();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } else if (next.wellCompleted) {
      playWaterDrop();
    } else {
      playTactileTick();
    }
  };

  const handleSimulateToDue = () => {
    let current = state;
    while (current.season <= current.debtDueSeason && !current.isBankrupt) {
      current = advanceCreditSeason(current);
    }
    setState(current);
    if (!current.isBankrupt && current.debtPrincipal === 0) {
      confetti({ particleCount: 70, spread: 75 });
    }
  };

  const handleReset = () => {
    setLoanPrincipal(DEFAULT_LOAN_PRINCIPAL);
    setProductiveBags(20);
    setInterestRate(DEFAULT_INTEREST_RATE);
    const fresh = createInitialFarmerState();
    setState(applyLoanDecision(fresh, { productiveBags: 20, consumptionBags: 0 }));
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('loan', loanPrincipal.toString());
    url.searchParams.set('prod', productiveBags.toString());
    url.searchParams.set('rate', Math.round(interestRate * 100).toString());
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const applyPreset = (preset: 'productive' | 'consumer' | 'zeroDebt' | 'balanced') => {
    const fresh = createInitialFarmerState();
    if (preset === 'productive') {
      setLoanPrincipal(20);
      setProductiveBags(20);
      setState(applyLoanDecision(fresh, { productiveBags: 20, consumptionBags: 0 }));
    } else if (preset === 'consumer') {
      setLoanPrincipal(20);
      setProductiveBags(0);
      setState(applyLoanDecision(fresh, { productiveBags: 0, consumptionBags: 20 }));
    } else if (preset === 'zeroDebt') {
      setLoanPrincipal(0);
      setProductiveBags(0);
      setState(applyLoanDecision(fresh, { productiveBags: 0, consumptionBags: 0 }));
    } else if (preset === 'balanced') {
      setLoanPrincipal(20);
      setProductiveBags(16);
      setState(applyLoanDecision(fresh, { productiveBags: 16, consumptionBags: 4 }));
    }
  };

  const currentYield = calculateSeasonalYield(state.baselineYield, state.wellProgress);
  const totalDueAtDueSeason = Math.round(state.debtPrincipal * (1 + state.debtInterestRate));

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Landmark className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
              محاكي استعارة طاقة الغد ورأس المال
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            مزرعة الوادي: الموسم {state.season} من {state.maxSeasons}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة الموسم 1</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التجربة'}</span>
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          إستراتيجيات وقرارات اقتراض جاهزة:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('productive')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
              1. الدين الإنتاجي الكامل
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              100% لحفر البئر وشبكة الري
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('consumer')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
              2. الدين الاستهلاكي (الفخ)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              100% للولائم والمظاهر الزائلة
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
              3. المتوازن الحكيم
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              16 كيساً للبئر و 4 للعيش
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('zeroDebt')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-slate-300">
              4. الحذر المتجمد
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              صفر ديون ومراوحة في الكفاف
            </div>
          </button>
        </div>
      </div>

      {/* Live Financial & Physical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Granary Stock */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Wheat className="w-4 h-4 text-amber-400" />
            رصيد القمح بالمخزن
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                state.wheatStock > 0 ? 'text-amber-300' : 'text-rose-400'
              }`}
            >
              {state.wheatStock}
            </span>
            <span className="text-xs text-slate-400">كيساً</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.isBankrupt
              ? 'مُصادر بالكامل لصالح التاجر الدائن!'
              : `استهلاك العائلة الحتمي: -${BASELINE_CONSUMPTION} أكياس كل موسم`}
          </p>
        </div>

        {/* Metric 2: Seasonal Yield Multiplier */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Droplets className="w-4 h-4 text-cyan-400" />
            إنتاج المزرعة الموسمي
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {currentYield}
            </span>
            <span className="text-xs text-slate-400">كيساً / موسم</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.wellCompleted
              ? '3 أضعاف الإنتاج بفضل تدفق مياه البئر!'
              : state.wellProgress > 0
              ? `ارتفاع تدريجي؛ إنجاز البئر: ${state.wellProgress}%`
              : 'الإنتاج الكفاف المعتاد (10 أكياس بالمطر)'}
          </p>
        </div>

        {/* Metric 3: Debt Due & Terms */}
        <div
          className={`glass-panel rounded-2xl p-5 border transition-all ${
            state.debtPrincipal > 0
              ? 'bg-rose-950/20 border-rose-500/30'
              : 'bg-emerald-950/20 border-emerald-500/30'
          }`}
        >
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Coins className="w-4 h-4 text-rose-400" />
            حالة الدين والالتزام
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                state.debtPrincipal > 0 ? 'text-rose-300' : 'text-emerald-400'
              }`}
            >
              {state.debtPrincipal > 0 ? totalDueAtDueSeason : 0}
            </span>
            <span className="text-xs text-slate-400">
              {state.debtPrincipal > 0 ? 'كيساً مستحقاً' : 'خالص الذمة'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.debtPrincipal > 0
              ? `يستحق السداد في الموسم ${state.debtDueSeason} (بفائدة ${Math.round(state.debtInterestRate * 100)}%)`
              : 'حر طليق بلا أي التزامات!'}
          </p>
        </div>

        {/* Metric 4: Health & Freedom Status */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            الموقف المالي والكرامة
          </span>
          <div className="mt-1">
            {state.isBankrupt ? (
              <span className="text-lg font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> مُفلس ومحجوز!
              </span>
            ) : state.wellCompleted && state.debtPrincipal === 0 ? (
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> ثراء واستقلال مالي
              </span>
            ) : (
              <span className="text-lg font-bold text-slate-200">
                {state.loanTaken ? 'مستثمر مدين' : 'كفاف مستقر'}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.isBankrupt
              ? 'صودرت نصف الأرض وسلبت حرية القرار.'
              : 'أنت سيد أرضك ومخزنك.'}
          </p>
        </div>
      </div>

      {/* Visual Farm & Well Field Graphic */}
      <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800/80 my-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            مشهد المزرعة والبئر المائي:
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            تقدم حفر البئر: {state.wellProgress}% • {state.wellCompleted ? 'مياه جارية 🌊' : 'أرض عطشى 🌾'}
          </span>
        </div>

        {/* Graphical Progress Bar for Irrigation */}
        <div className="w-full bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-amber-300">
              🌾 أرض كفاف جافة (10 أكياس)
            </span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              💧 بئر ارتوازي متدفق (30 كيساً)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                state.wellCompleted ? 'bg-cyan-400 glow-cyan' : 'bg-cyan-600'
              }`}
              style={{ width: `${state.wellProgress}%` }}
            />
          </div>
        </div>

        {/* Narrative Note Banner */}
        {state.history.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-100">
                {state.history[state.history.length - 1].narrativeNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Allocation Sliders & Decision Controls */}
      <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 my-6 space-y-6">
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200">
              حجم القرض المقترض من التاجر:
            </span>
            <span className="font-mono text-cyan-300 font-bold text-sm">
              {loanPrincipal} كيس قمح
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={2}
            value={loanPrincipal}
            onChange={(e) => handleLoanSizeChange(Number(e.target.value))}
            disabled={state.season > 1}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {loanPrincipal > 0 && (
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                🏗️ توجيه لحفر البئر (دين إنتاجي): {productiveBags} كيس
              </span>
              <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                🎪 توجيه للوليمة والمتعة (دين استهلاكي): {consumptionBags} كيس
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={loanPrincipal}
              value={productiveBags}
              onChange={(e) => handleProductiveChange(Number(e.target.value))}
              disabled={state.season > 1}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>0% إنتاجي (كل القرض استهلاك)</span>
              <span>100% إنتاجي (كل القرض لحفر البئر)</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleStepSeason}
            disabled={state.isBankrupt || state.season > state.maxSeasons}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 transition-all shadow-lg glow-cyan cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>عِش الموسم {state.season} واحصد القمح</span>
          </button>

          {!state.isBankrupt && state.season < state.debtDueSeason && (
            <button
              type="button"
              onClick={handleSimulateToDue}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer text-xs sm:text-sm"
            >
              <span>محاكاة حتى موعد السداد (الموسم {state.debtDueSeason})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
