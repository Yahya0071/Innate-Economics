import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialState,
  validateAllocation,
  simulateDay,
  calculateHarvest,
  determineToolTier,
} from '../../engine/time-budget/engine';
import { TOTAL_WAKING_HOURS, DAILY_FOOD_REQUIREMENT, TOOL_TIERS } from '../../engine/time-budget/constants';
import type { DayAllocation, TimeBudgetState, ToolTier } from '../../engine/time-budget/types';
import {
  BatteryCharging,
  Apple,
  Hammer,
  Play,
  RotateCcw,
  Share2,
  Check,
  TrendingUp,
  Sparkles,
  Info,
  Clock,
  Compass,
} from 'lucide-react';
import { playTactileTick, playSuccessChime, playWarningThud } from '../../utils/audio';

interface Preset {
  name: string;
  desc: string;
  allocation: DayAllocation;
}

const PRESETS: Preset[] = [
  {
    name: 'المنهمك الأعمى',
    desc: 'العمل المستمر بأقصى طاقة دون راحة أو أداة',
    allocation: { workHours: 14, toolHours: 0, restHours: 2 },
  },
  {
    name: 'المستثمر المتهور',
    desc: 'بناء الأداة بالكامل مع إهمال طعام الليلة',
    allocation: { workHours: 1, toolHours: 13, restHours: 2 },
  },
  {
    name: 'المستجم الهادئ',
    desc: 'راحة مفرطة وقوت كفاف دون أي استثمار',
    allocation: { workHours: 4, toolHours: 0, restHours: 12 },
  },
  {
    name: 'الحكيم المتوازن',
    desc: 'تأمين القوت + بناء أداة الغد + صيانة البدن',
    allocation: { workHours: 7, toolHours: 4, restHours: 5 },
  },
];

export const TimeBudgetSimulation: React.FC = () => {
  const [state, setState] = useState<TimeBudgetState>(() => createInitialState(7));
  const [allocation, setAllocation] = useState<DayAllocation>({
    workHours: 7,
    toolHours: 4,
    restHours: 5,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'chart'>('daily');

  // Load URL params if available on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const w = Number(params.get('w'));
      const t = Number(params.get('t'));
      const r = Number(params.get('r'));
      if (!isNaN(w) && !isNaN(t) && !isNaN(r) && w + t + r === TOTAL_WAKING_HOURS) {
        setAllocation({ workHours: w, toolHours: t, restHours: r });
      }
    }
  }, []);

  // Safe handler to adjust hours while maintaining 16-hour invariant
  const handleSliderChange = (field: keyof DayAllocation, val: number) => {
    const clampedVal = Math.max(0, Math.min(TOTAL_WAKING_HOURS, val));
    const current = { ...allocation, [field]: clampedVal };

    // Balance the remaining two fields
    const remaining = TOTAL_WAKING_HOURS - clampedVal;
    if (field === 'workHours') {
      const otherTotal = allocation.toolHours + allocation.restHours;
      if (otherTotal === 0) {
        current.toolHours = Math.floor(remaining / 2);
        current.restHours = remaining - current.toolHours;
      } else {
        const toolRatio = allocation.toolHours / otherTotal;
        current.toolHours = Math.round(remaining * toolRatio);
        current.restHours = remaining - current.toolHours;
      }
    } else if (field === 'toolHours') {
      const otherTotal = allocation.workHours + allocation.restHours;
      if (otherTotal === 0) {
        current.workHours = Math.floor(remaining / 2);
        current.restHours = remaining - current.workHours;
      } else {
        const workRatio = allocation.workHours / otherTotal;
        current.workHours = Math.round(remaining * workRatio);
        current.restHours = remaining - current.workHours;
      }
    } else {
      const otherTotal = allocation.workHours + allocation.toolHours;
      if (otherTotal === 0) {
        current.workHours = Math.floor(remaining / 2);
        current.toolHours = remaining - current.workHours;
      } else {
        const workRatio = allocation.workHours / otherTotal;
        current.workHours = Math.round(remaining * workRatio);
        current.toolHours = remaining - current.workHours;
      }
    }

    setAllocation(current);
    playTactileTick();
  };

  const handleApplyPreset = (preset: Preset) => {
    setAllocation(preset.allocation);
    playTactileTick();
  };

  const handleStepDay = () => {
    if (state.day > state.maxDays || !state.isAlive) return;

    try {
      const next = simulateDay(state, allocation);
      setState(next);

      if (next.history[next.history.length - 1].status === 'starving' || next.energy < 25) {
        playWarningThud();
      } else {
        playTactileTick();
      }

      // Trigger celebratory confetti if completing day 7 flourishing
      if (next.day > next.maxDays && next.energy >= 50 && next.foodStock >= 5) {
        playSuccessChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSimulateRestOfDays = () => {
    let current = state;
    while (current.day <= current.maxDays && current.isAlive) {
      current = simulateDay(current, allocation);
    }
    setState(current);
    if (current.isAlive && current.foodStock >= 5) {
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleReset = () => {
    setState(createInitialState(7));
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('w', allocation.workHours.toString());
    url.searchParams.set('t', allocation.toolHours.toString());
    url.searchParams.set('r', allocation.restHours.toString());
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Preview computations for current slider values
  const previewHarvest = calculateHarvest(allocation.workHours, state.energy, state.toolTier);
  const currentToolConfig = TOOL_TIERS[state.toolTier];
  const { progressPercent } = determineToolTier(state.toolHoursInvested);

  // Biological persona evaluation at end of simulation
  const getPersona = () => {
    if (!state.isAlive || state.energy < 20) {
      return {
        title: 'الجسد المنهك',
        desc: 'استنزفت طاقتك في الركض خلف الساعات دون صيانة لجسدك، فتعطل محرك الحياة لديك.',
        color: 'text-rose-400',
        badge: 'ضحية الإفراط',
      };
    }
    if (state.toolTier === 0) {
      return {
        title: 'الأسير في طاحونة اليوم',
        desc: 'بقيت رهين يدك المجردة؛ أطعمت بطنك كل يوم ولكنك تبدأ غدك بنفس المشقة التي بدأت بها اليوم الأول.',
        color: 'text-amber-400',
        badge: 'الكفاف اليدوي',
      };
    }
    if (state.toolTier >= 2 && state.foodStock >= 6 && state.energy >= 50) {
      return {
        title: 'مهندس الواحة الحكيم',
        desc: 'حققت معادلة البقاء والازدهار: لم تجع، ولم تنهك بدنك، وبنيت أدوات باتت تنتج لك في ساعة واحدة ما كان يستهلك نصف نهارك!',
        color: 'text-emerald-400',
        badge: 'الازدهار المتراكم',
      };
    }
    return {
      title: 'الساعي المتوازن',
      desc: 'حافظت على توازن جيد وخطوت خطوات مشهودة في بناء أدواتك مع صيانة طاقتك.',
      color: 'text-cyan-400',
      badge: 'مسار الاستقرار',
    };
  };

  const persona = getPersona();

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Day tracking & reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
              محاكي دورة الحياة والزمن
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            {state.day <= state.maxDays ? `اليوم ${state.day} من ${state.maxDays}` : 'انتهت الدورة (7 أيام)'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة التجربة</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة البصمة'}</span>
          </button>
        </div>
      </div>

      {/* Live Vital Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Vital 1: Energy & Fatigue */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              حيوية الجسد والتركيز
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                state.energy >= 70
                  ? 'text-emerald-400'
                  : state.energy >= 40
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {Math.round(state.energy)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                state.energy >= 70
                  ? 'bg-emerald-500'
                  : state.energy >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${state.energy}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {state.energy >= 70
              ? 'طاقتك متوقدة؛ عقلك وبدنك ينتجان بأعلى كفاءة.'
              : state.energy >= 40
              ? 'بداية الإجهاد؛ الساعات الطويلة تنقص من تركيزك.'
              : 'إنهاك حاد! ساعتك الواحدة تفقد أكثر من نصف إنتاجها.'}
          </p>
        </div>

        {/* Vital 2: Food Stock & Consumption */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-amber-400" />
              مخزون الرزق والقوت
            </span>
            <span className="text-sm font-bold font-mono text-amber-300">
              {state.foodStock} <span className="text-xs text-slate-400">وحدة</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>استهلاك الليلة الحتمي:</span>
            <span className="text-rose-400 font-mono">
              <span className="num-ltr">-{DAILY_FOOD_REQUIREMENT}</span> <span className="text-slate-400">وحدات</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>حصاد اليوم المتوقع:</span>
            <span className="text-emerald-400 font-mono">
              <span className="num-ltr">+{previewHarvest}</span> <span className="text-slate-400">وحدة</span>
            </span>
          </div>
        </div>

        {/* Vital 3: Capital Tool Progression */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Hammer className="w-4 h-4 text-cyan-400" />
              أداة الغد (رأس المال)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <span className="num-ltr">{currentToolConfig.multiplier}x</span> <span>مضاعف</span>
            </span>
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {currentToolConfig.name}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
            <span>اكتمال الرتبة: <span className="num-ltr">{progressPercent}%</span></span>
            <span>مجموع ساعات الاستثمار: <span className="num-ltr">{state.toolHoursInvested}</span> س</span>
          </div>
        </div>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          إستراتيجيات وتجارب جاهزة للاختبار الفوري:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                {preset.name}
              </div>
              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tri-Slider Section */}
      <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800/80 my-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            توزيع ساعات اليقظة الـ 16 لهذا اليوم:
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1">
            <span className="num-ltr text-slate-200">{allocation.workHours + allocation.toolHours + allocation.restHours} / 16</span>
            <span>ساعة</span>
          </span>
        </div>

        <div className="space-y-5">
          {/* Slider 1: Work Hours */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                🌾 الكسب المباشر (جمع الثمار اليوم)
              </span>
              <span className="font-mono text-amber-300 font-bold">{allocation.workHours} ساعة</span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              value={allocation.workHours}
              onChange={(e) => handleSliderChange('workHours', Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>تأمين القوت الفوري</span>
              <span>حصاد متوقع: +{previewHarvest} وحدة</span>
            </div>
          </div>

          {/* Slider 2: Tool Crafting */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                🔨 بناء أدوات الغد (الاستثمار في رأس المال)
              </span>
              <span className="font-mono text-cyan-300 font-bold">{allocation.toolHours} ساعة</span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              value={allocation.toolHours}
              onChange={(e) => handleSliderChange('toolHours', Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>لا يُؤكل الليلة</span>
              <span>يضاعف إنتاج كل ساعة في الأيام القادمة</span>
            </div>
          </div>

          {/* Slider 3: Rest & Recovery */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                🌿 الراحة وصيانة الجسد (الاسترداد)
              </span>
              <span className="font-mono text-emerald-300 font-bold">{allocation.restHours} ساعة</span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              value={allocation.restHours}
              onChange={(e) => handleSliderChange('restHours', Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>صيانة محرك البدن والتركيز</span>
              <span>يمنع انهيار إنتاجية الساعات غداً</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 my-6">
        <button
          type="button"
          onClick={handleStepDay}
          disabled={state.day > state.maxDays || !state.isAlive}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg glow-amber cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>عِش اليوم {state.day} واختبر النتيجة</span>
        </button>

        {state.day <= state.maxDays && state.isAlive && (
          <button
            type="button"
            onClick={handleSimulateRestOfDays}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>محاكاة بقية الأسبوع بنفس النمط</span>
          </button>
        )}
      </div>

      {/* Latest Day Narrative Note (Loop 2: Systemic Consequence) */}
      {state.history.length > 0 && (
        <div className="my-6">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            الارتداد النظامي ليوم أمس:
          </div>
          <div className="glass-panel-gold rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm sm:text-base text-amber-100 font-medium leading-relaxed">
                {state.history[state.history.length - 1].narrativeNote}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2 pt-2 border-t border-amber-500/20">
                <span>
                  الحصاد: <strong className="text-emerald-300 font-mono">+{state.history[state.history.length - 1].harvested}</strong>
                </span>
                <span>
                  الطاقة: <strong className="text-amber-300 font-mono">{Math.round(state.history[state.history.length - 1].energyEnd)}%</strong>
                </span>
                <span>
                  الرصيد المتبقي: <strong className="text-cyan-300 font-mono">{state.history[state.history.length - 1].foodStockEnd}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week End Decision Fingerprint Card */}
      {state.day > state.maxDays && (
        <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl animate-soft-pulse">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              بصمة قرارك الاقتصادي (Economic Fingerprint)
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <h4 className={`text-2xl sm:text-3xl font-bold ${persona.color}`}>
              {persona.title}
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {persona.badge}
            </span>
          </div>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
            {persona.desc}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400">مخزون الرزق النهائي</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{state.foodStock}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">مستوى الطاقة الختامي</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{Math.round(state.energy)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">أعلى أداة تم بلوغها</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">{currentToolConfig.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">مضاعف كفاءة الساعة</div>
              <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">{currentToolConfig.multiplier}x</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              يمكنك نسخ رابط هذا التوزيع لمشاركته مع أصدقائك كتحدٍّ مباشر لمعرفة بصمتهم.
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ بصمة القرار!' : 'مشاركة بصمة القرار'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual History Table / Timeline */}
      {state.history.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
            <span>سجل أيام التجربة السابقة ({state.history.length}):</span>
            <span className="text-[11px] text-slate-500 font-normal">تتبع تدرج الحصاد والراحة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-medium">اليوم</th>
                  <th className="pb-2 font-medium">توزيع الساعات (عمل/أداة/راحة)</th>
                  <th className="pb-2 font-medium">الحصاد اليومي</th>
                  <th className="pb-2 font-medium">مستوى الطاقة</th>
                  <th className="pb-2 font-medium">رصيد المخزون</th>
                  <th className="pb-2 font-medium">الأداة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-mono">
                {state.history.map((record) => (
                  <tr key={record.day} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-200">يوم {record.day}</td>
                    <td className="py-2.5 text-slate-400">
                      {record.allocation.workHours}ع / {record.allocation.toolHours}د / {record.allocation.restHours}ر
                    </td>
                    <td className="py-2.5 text-emerald-400">+{record.harvested}</td>
                    <td className="py-2.5 text-amber-400">{Math.round(record.energyEnd)}%</td>
                    <td className="py-2.5 text-cyan-400">{record.foodStockEnd}</td>
                    <td className="py-2.5 text-slate-300 font-sans">
                      {TOOL_TIERS[record.toolTierEnd].name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
