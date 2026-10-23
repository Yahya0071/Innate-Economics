import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialVaultState,
  updateReserveRatio,
  simulateWithdrawalRun,
  toggleDepositInsurance,
  toggleLenderOfLastResort,
} from '../../engine/whisper-market/engine';
import { BASELINE_DEPOSITS } from '../../engine/whisper-market/constants';
import type { BankVaultState, PanicLevel } from '../../engine/whisper-market/types';
import {
  Landmark,
  Shield,
  ShieldAlert,
  Coins,
  AlertOctagon,
  RotateCcw,
  Share2,
  Check,
  Play,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';
import { playTactileTick, playWarningThud, playSuccessChime, playCoinChime } from '../../utils/audio';

export const WhisperSimulation: React.FC = () => {
  const [state, setState] = useState<BankVaultState>(() => createInitialVaultState(1000, 0.20));
  const [activePanicLevel, setActivePanicLevel] = useState<PanicLevel>('none');
  const [copiedLink, setCopiedLink] = useState(false);

  // Read URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = Number(params.get('reserve'));
      const ins = params.get('insurance');

      if (!isNaN(r) && r >= 5 && r <= 100) {
        setState((prev) => {
          let updated = updateReserveRatio(prev, r / 100);
          if (ins === '1') {
            updated.hasDepositInsurance = true;
          }
          return updated;
        });
      }
    }
  }, []);

  const handleRatioChange = (val: number) => {
    setState((prev) => updateReserveRatio(prev, val / 100));
    playTactileTick();
  };

  const handleTriggerPanic = (level: PanicLevel) => {
    setActivePanicLevel(level);
    const { nextState, outcome } = simulateWithdrawalRun(state, level);
    setState(nextState);

    if (outcome.shortage > 0 || nextState.status !== 'solvent') {
      playWarningThud();
    } else if (level === 'panic-run') {
      playSuccessChime();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } else {
      playCoinChime();
    }
  };

  const handleToggleInsurance = () => {
    setState((prev) => toggleDepositInsurance(prev));
    playTactileTick();
  };

  const handleToggleLender = () => {
    setState((prev) => toggleLenderOfLastResort(prev));
    playTactileTick();
  };

  const handleReset = () => {
    setState(createInitialVaultState(1000, 0.20));
    setActivePanicLevel('none');
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('reserve', Math.round(state.reserveRatio * 100).toString());
    if (state.hasDepositInsurance) {
      url.searchParams.set('insurance', '1');
    } else {
      url.searchParams.delete('insurance');
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const applyPreset = (preset: 'traditional' | 'fullReserve' | 'greedy' | 'fortified') => {
    if (preset === 'traditional') {
      const s = createInitialVaultState(1000, 0.20);
      setState(s);
      setActivePanicLevel('none');
    } else if (preset === 'fullReserve') {
      const s = createInitialVaultState(1000, 1.0);
      setState(s);
      setActivePanicLevel('none');
    } else if (preset === 'greedy') {
      const s = createInitialVaultState(1000, 0.05);
      setState(s);
      setActivePanicLevel('none');
    } else if (preset === 'fortified') {
      let s = createInitialVaultState(1000, 0.20);
      s = toggleDepositInsurance(s);
      s = toggleLenderOfLastResort(s);
      setState(s);
      setActivePanicLevel('none');
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-500/10 text-purple-400">
              <Landmark className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
              محاكي أمانات القرية والهلع المصرفي
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            خزينة الـ 1000 دينار الذهبية
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعبئة الخزينة</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التجربة'}</span>
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          أوضاع الخزينة الكلاسيكية:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('traditional')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-purple-400">
              1. الاحتياطي الجزئي (20%)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              200 سائل + 800 قروض مشاريع
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('fullReserve')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
              2. الأمان التام (100%)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              1000 سائل وصفر قروض ومشاريع
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('greedy')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
              3. الجشع المفرط (5%)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              50 سائل فقط و 950 قروض
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('fortified')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
              4. النظام المحصن
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              20% + تأمين ودائع + ملاذ أخير
            </div>
          </button>
        </div>
      </div>

      {/* Live Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Cash in Vault */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Coins className="w-4 h-4 text-amber-400" />
            الذهب السائل بالخزينة
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${state.cashReserves > 100 ? 'text-amber-300' : 'text-rose-400'
                }`}
            >
              {state.cashReserves}
            </span>
            <span className="text-xs text-slate-400">دينار جاهز</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            نسبة الاحتياطي: {Math.round(state.reserveRatio * 100)}% من إجمالي الودائع
          </p>
        </div>

        {/* Metric 2: Productive Loans in Village */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Building2 className="w-4 h-4 text-cyan-400" />
            القروض المستثمرة بمشاريع
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {state.loansOutstanding}
            </span>
            <span className="text-xs text-slate-400">دينار عامل</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            مستثمرة في مطاحن وسفن ومزارع (أصول حقيقية غير سائلة فورياً)
          </p>
        </div>

        {/* Metric 3: Confidence Gauge */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              مؤشر ثقة المودعين
            </span>
            <span
              className={`text-sm font-bold font-mono ${state.confidence >= 70
                  ? 'text-emerald-400'
                  : state.confidence >= 30
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
            >
              {state.confidence}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${state.confidence >= 70
                  ? 'bg-emerald-500'
                  : state.confidence >= 30
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              style={{ width: `${state.confidence}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.confidence >= 80
              ? 'اطمئنان عام؛ لا أحد يفكر بالركض للسحب.'
              : state.confidence >= 40
                ? 'همهمات وتوجس؛ عيون الناس ترقب باب الخزينة.'
                : 'هلع جماعي مذعور! التدافع يسقط الجميع.'}
          </p>
        </div>

        {/* Metric 4: Vault Solvency Status */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-purple-400" />
            حالة الخزينة والسيولة
          </span>
          <div className="mt-1">
            {state.status === 'collapsed' ? (
              <span className="text-base font-bold text-rose-400 flex items-center gap-1">
                <AlertOctagon className="w-4 h-4" /> انهيار وأبواب مغلقة!
              </span>
            ) : state.status === 'liquidity-crisis' ? (
              <span className="text-base font-bold text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> تعثر سيولة لحظي
              </span>
            ) : (
              <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> مفتوحة وتدفع بيسر
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {state.status === 'collapsed'
              ? 'الذهب نفد أمام المودعين، وتعطلت الحركة التجارية.'
              : 'كل طلبات السحب المستحقة تلبى بانتظام.'}
          </p>
        </div>
      </div>

      {/* Visual Vault Bar */}
      <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800/80 my-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-300">
            تشريح ودائع الخزينة (1000 دينار):
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {state.cashReserves} ذهب سائل ({Math.round(state.reserveRatio * 100)}%) • {state.loansOutstanding} قروض عاملة
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-2xl p-2 border border-slate-800">
          <div className="w-full bg-slate-800 rounded-xl h-6 overflow-hidden flex font-mono text-[10px] font-bold">
            <div
              className="bg-amber-500 text-slate-950 flex items-center justify-center transition-all duration-500 overflow-hidden"
              style={{ width: `${state.reserveRatio * 100}%` }}
              title="الذهب السائل المحفوظ بالخزينة"
            >
              {state.reserveRatio >= 0.15 && `${state.cashReserves} د سائل`}
            </div>
            <div
              className="bg-cyan-600 text-white flex items-center justify-center transition-all duration-500 overflow-hidden"
              style={{ width: `${(1 - state.reserveRatio) * 100}%` }}
              title="القروض المستثمرة بمطاحن وسفن القرية"
            >
              {state.reserveRatio <= 0.85 && `${state.loansOutstanding} د قروض بمشاريع`}
            </div>
          </div>
        </div>

        {/* Narrative Banner */}
        {state.history.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-purple-100">
                {state.history[state.history.length - 1].narrativeNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Panic Triggers */}
      <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 my-6 space-y-6">
        {/* Slider: Reserve Ratio */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200">
              نسبة الاحتياطي النقدي المحتفظ به في الخزينة:
            </span>
            <span className="font-mono text-purple-300 font-bold text-sm">
              {Math.round(state.reserveRatio * 100)}% ({state.cashReserves} دينار)
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={Math.round(state.reserveRatio * 100)}
            onChange={(e) => handleRatioChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>5% (أرباح طائلة ومخاطرة سيولة قصوى)</span>
            <span>20% (احتياطي جزئي متوازن)</span>
            <span>100% (أمان تام وصفر قروض)</span>
          </div>
        </div>

        {/* Institutional Safeguards Toggles */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                تأمين الودائع (Deposit Insurance)
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ضمان حكومي لرد الأموال؛ يحبط الركض على الصندوق
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleInsurance}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${state.hasDepositInsurance
                  ? 'bg-cyan-500 text-slate-950 glow-cyan'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              {state.hasDepositInsurance ? 'مُفعّل' : 'مُعطل'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-400" />
                ملاذ الإقراض الأخير (Central Bank)
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ضخ سيولة طارئة (+600 دينار) لكسر الهلع
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleLender}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${state.isLenderOfLastResortActive
                  ? 'bg-emerald-500 text-slate-950 glow-emerald'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              {state.isLenderOfLastResortActive ? 'مُفعّل' : 'مُعطل'}
            </button>
          </div>
        </div>

        {/* Panic Triggers */}
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-200 mb-2">
            اختبر صمود الخزينة أمام مختلف مستويات الضغط والشائعات:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleTriggerPanic('none')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              ☕ سحب يومي معتاد (10%)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerPanic('whisper')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              💬 همسة في السوق (18%)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerPanic('rumor')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-orange-400 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              📢 شائعة قوية (35%)
            </button>
            <button
              type="button"
              onClick={() => handleTriggerPanic('panic-run')}
              className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              🏃‍♂️⚡ هلع جماعي (65%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
