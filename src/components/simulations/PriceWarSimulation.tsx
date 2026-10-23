import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Store,
  RotateCcw,
  Share2,
  Check,
  Play,
  Sparkles,
  Users,
  TrendingDown,
  Layers,
  Scale,
  Handshake,
  Skull,
  Zap,
  AlertTriangle
} from 'lucide-react';
import {
  calculateRound,
  createInitialPriceWarState,
  playNextRound,
  decideRivalPrice,
  type PriceWarState,
  type PriceWarRound,
  type RivalStrategy,
  PRICE_NORMAL,
  PRICE_DISCOUNT,
  PRICE_MARGINAL_COST,
  DEFAULT_UNIT_COST,
  DEFAULT_MARKET_DEMAND,
} from '../../engine/price-war/engine';
import { playTactileTick, playWarningThud, playSuccessChime, playCoinSound } from '../../utils/audio';
import { DecisionFingerprint } from '../narrative/DecisionFingerprint';

export const PriceWarSimulation: React.FC = () => {
  const [state, setState] = useState<PriceWarState>(() => createInitialPriceWarState('tit-for-tat'));
  const [playerPriceInput, setPlayerPriceInput] = useState<number>(10);
  const [selectedStrategy, setSelectedStrategy] = useState<RivalStrategy>('tit-for-tat');
  const [copiedLink, setCopiedLink] = useState(false);

  // Read URL query parameters on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = Number(params.get('price'));
      const s = params.get('strat') as RivalStrategy;
      if (!isNaN(p) && p >= 5 && p <= 15) {
        setPlayerPriceInput(p);
      }
      if (s && ['tit-for-tat', 'always-defect', 'conditional-cooperate', 'random'].includes(s)) {
        setSelectedStrategy(s);
        setState(createInitialPriceWarState(s));
      }
    }
  }, []);

  // Compute preview for the upcoming round
  const previewRivalPrice = decideRivalPrice(selectedStrategy, state.history, state.unitCost);
  const previewRound = calculateRound(
    playerPriceInput,
    selectedStrategy,
    state.history,
    state.unitCost,
    state.marketDemand
  );

  // Advance single day round
  const handleStepDay = () => {
    const nextState = playNextRound(state, playerPriceInput);
    setState(nextState);

    const latest = nextState.history[nextState.history.length - 1];

    if (latest.playerPrice === latest.rivalPrice && latest.playerPrice === DEFAULT_UNIT_COST) {
      // Marginal cost zero profit trap
      playWarningThud();
    } else if (latest.playerProfit > latest.rivalProfit) {
      playCoinSound();
    } else {
      playTactileTick();
    }

    // Reward sustained fair cooperation
    if (
      nextState.history.length >= 5 &&
      nextState.history.slice(-3).every((r) => r.playerPrice >= 10 && r.rivalPrice >= 10)
    ) {
      playSuccessChime();
      confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Simulate 5 consecutive days
  const handleSimulateFiveDays = () => {
    let current = state;
    for (let i = 0; i < 5; i++) {
      current = playNextRound(current, playerPriceInput);
    }
    setState(current);

    const recent = current.history.slice(-5);
    if (recent.every((r) => r.playerPrice >= 10 && r.rivalPrice >= 10)) {
      playSuccessChime();
      confetti({ particleCount: 80, spread: 80 });
    } else if (recent.some((r) => r.playerPrice === 5 && r.rivalPrice === 5)) {
      playWarningThud();
    } else {
      playTactileTick();
    }
  };

  const handleReset = () => {
    setState(createInitialPriceWarState(selectedStrategy));
    setPlayerPriceInput(10);
    playTactileTick();
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('price', playerPriceInput.toString());
    url.searchParams.set('strat', selectedStrategy);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    playCoinSound();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const applyPreset = (preset: 'fair' | 'undercut' | 'nash' | 'titfortat') => {
    playTactileTick();
    if (preset === 'fair') {
      setState(createInitialPriceWarState('tit-for-tat'));
      setPlayerPriceInput(10);
      setSelectedStrategy('tit-for-tat');
    } else if (preset === 'undercut') {
      setState(createInitialPriceWarState('tit-for-tat'));
      setPlayerPriceInput(7);
      setSelectedStrategy('tit-for-tat');
    } else if (preset === 'nash') {
      setState(createInitialPriceWarState('always-defect'));
      setPlayerPriceInput(5);
      setSelectedStrategy('always-defect');
    } else if (preset === 'titfortat') {
      setState(createInitialPriceWarState('tit-for-tat'));
      setPlayerPriceInput(10);
      setSelectedStrategy('tit-for-tat');
    }
  };

  // Background visual atmosphere based on market profit health
  const getMarketBg = () => {
    const avgProfit =
      state.history.length > 0
        ? state.history[state.history.length - 1].playerProfit
        : previewRound.playerProfit;

    if (avgProfit >= 200) return 'from-emerald-950/60 to-emerald-900/40 border-emerald-500/30';
    if (avgProfit >= 100) return 'from-amber-950/50 to-amber-900/30 border-amber-500/30';
    if (avgProfit > 0) return 'from-orange-950/50 to-rose-950/30 border-orange-500/30';
    return 'from-rose-950/70 to-stone-950/90 border-rose-600/40';
  };

  const lastRound: PriceWarRound | null =
    state.history.length > 0 ? state.history[state.history.length - 1] : null;

  // Market Stability calculation (100% at normal price 10, 0% at cost 5)
  const marketStability = Math.round(
    Math.max(0, Math.min(100, ((playerPriceInput - 5) / 5) * 50 + ((previewRivalPrice - 5) / 5) * 50))
  );

  // Decision Fingerprint Metrics
  const undercutCount = state.history.filter((r) => r.playerPrice < PRICE_NORMAL).length;
  const cooperateCount = state.history.filter((r) => r.playerPrice >= PRICE_NORMAL).length;
  const totalPriceSum = state.history.reduce((acc, r) => acc + r.playerPrice, 0);
  const averagePrice = state.history.length > 0 ? totalPriceSum / state.history.length : playerPriceInput;

  const fingerprintMetrics = {
    undercutCount,
    cooperateCount,
    totalRounds: state.history.length,
    averagePrice,
    playerProfit: state.totalPlayerProfit,
    rivalProfit: state.totalRivalProfit,
  };

  const fingerprintStats = [
    { label: 'أرباحك التراكمية', value: `${state.totalPlayerProfit} د.إ` },
    { label: 'أرباح الجار التراكمية', value: `${state.totalRivalProfit} د.إ` },
    { label: 'الأيام المكتملة', value: state.history.length },
    { label: 'متوسط سعرك', value: `${averagePrice.toFixed(1)} د.إ` },
  ];

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-10 my-8 shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <Store className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-rose-400 uppercase">
              محاكي نظرية الألعاب وتوازن ناش
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            سوق الواحة: لغز حرب الأسعار وحصار الربح (اليوم {state.currentRound})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            تكلفة توريد الجرة الواحدة = <span className="text-amber-300 font-semibold font-mono">5 دراهم</span> لكلا الدكانين. إجمالي طلب السوق = <span className="text-amber-300 font-semibold font-mono">100 مشترٍ يومياً</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة فتح السوق</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم النسخ!' : 'مشاركة التجربة'}</span>
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          سيناريوهات فطرية جاهزة للاختبار السريع:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('fair')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
              1. التفاهم الصامت
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              10 دراهم لكلا الدكانين (ربح 250 د لكل تاجر)
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('undercut')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
              2. غواية التخفيض
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              أنت بـ 7 د والجار بـ 10 د (اقتناص 80% من السوق)
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('nash')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400">
              3. سباق القاع (ناش)
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              كسر السعرين إلى التكلفة 5 د (ربح صفري)
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('titfortat')}
            className="text-right p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
              4. الرد بالمثل
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              معاقبة الغدر ومكافأة التعاون فوراً
            </div>
          </button>
        </div>
      </div>

      {/* Live Metrics Grid (4 Panels) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {/* Metric 1: Market Stability & Margins */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              صحة السوق وهوامش الربح
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                marketStability >= 70
                  ? 'text-emerald-400'
                  : marketStability >= 30
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {marketStability}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                marketStability >= 70
                  ? 'bg-emerald-500'
                  : marketStability >= 30
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${marketStability}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {marketStability === 0
              ? 'حصار توازن ناش! تآكلت الأرباح تماماً وتباع السلعة بالتكلفة.'
              : marketStability >= 80
              ? 'سوق متوازن يحقق فيه كلا التاجرين أعلى عائد ممكن.'
              : 'بداية حرب الاستنزاف وكسر الأسعار.'}
          </p>
        </div>

        {/* Metric 2: Price Comparison */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            سعر البيع اليوم
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
                {playerPriceInput}
              </span>
              <span className="text-xs text-slate-400">د (سعرك)</span>
            </div>
            <span className="text-xs text-slate-600">مقابل</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-300">
                {previewRivalPrice}
              </span>
              <span className="text-xs text-slate-400">د (الجار)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            هامش ربح وحدتك = {playerPriceInput - 5} دراهم (التكلفة = 5 د).
          </p>
        </div>

        {/* Metric 3: Customer Allocation */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-cyan-400" />
            حصة المشترين المتوقعة
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                previewRound.playerSales >= 80
                  ? 'text-emerald-400'
                  : previewRound.playerSales === 50
                  ? 'text-cyan-400'
                  : 'text-rose-400'
              }`}
            >
              {previewRound.playerSales}
            </span>
            <span className="text-xs text-slate-400">
              / 100 مشترٍ ({Math.round(previewRound.playerMarketShare * 100)}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {previewRound.playerSales > 50
              ? 'أنت الأرخص؛ الزبائن يهرعون إليك ويستحوذ دكانك على 80%.'
              : previewRound.playerSales === 50
              ? 'تطابق السعران؛ الزبائن ينقسمون بالتساوي 50/50.'
              : 'الجار أرخص منك بدرهم؛ انحسر زبائنك إلى 20 فقط!'}
          </p>
        </div>

        {/* Metric 4: Player Profit */}
        <div className="glass-panel bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            ربحك الصافي المتوقع اليوم
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-extrabold font-mono ${
                previewRound.playerProfit > 0 ? 'text-purple-300' : 'text-rose-400'
              }`}
            >
              +{previewRound.playerProfit}
            </span>
            <span className="text-xs text-slate-400">دراهم</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
            <span>رصيدك التراكمي: {state.totalPlayerProfit} د</span>
            <span>الجار: {state.totalRivalProfit} د</span>
          </div>
        </div>
      </div>

      {/* Visual Market Arena Display */}
      <div className={`bg-gradient-to-b ${getMarketBg()} rounded-2xl p-6 border my-6 relative transition-colors duration-700 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-400" />
            مشهد سوق الواحة الميداني (حركة الـ 100 مشترٍ بين الدكانين):
          </span>
          <span className="text-[11px] text-slate-300 font-mono">
            {previewRound.playerSales === 50
              ? '⚖️ تقاسم متساوٍ (50 زبوناً لكل متجر)'
              : previewRound.playerSales > 50
              ? '🔥 80% من المشترين يتدفقون لدكانك!'
              : '⚠️ 80% من المشترين اتجهوا لدكان الجار!'}
          </span>
        </div>

        {/* The Two Storefronts & Shopper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {/* Player Storefront */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏬</span>
                <div>
                  <div className="text-xs font-bold text-amber-300">دكانك (أنت)</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    السعر: {playerPriceInput} دراهم • الربح المتوقع: +{previewRound.playerProfit} د
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                {previewRound.playerSales} مشترٍ
              </span>
            </div>

            {/* Shoppers Visualization */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-hidden p-2 bg-slate-900/70 rounded-lg border border-slate-800">
              {Array.from({ length: Math.min(40, previewRound.playerSales) }, (_, i) => (
                <span key={`p-${i}`} className="text-sm" title="مشترٍ يقف أمام دكانك">
                  🛍️
                </span>
              ))}
              {previewRound.playerSales > 40 && (
                <span className="text-[11px] text-amber-400 font-bold self-center mr-1">
                  +{previewRound.playerSales - 40} آخرين
                </span>
              )}
            </div>
          </div>

          {/* Rival Storefront */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <div>
                  <div className="text-xs font-bold text-slate-200">دكان الجار المجاور</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    السعر: {previewRivalPrice} دراهم • ربحه: +{previewRound.rivalProfit} د
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {previewRound.rivalSales} مشترٍ
              </span>
            </div>

            {/* Shoppers Visualization */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-hidden p-2 bg-slate-900/70 rounded-lg border border-slate-800">
              {Array.from({ length: Math.min(40, previewRound.rivalSales) }, (_, i) => (
                <span key={`r-${i}`} className="text-sm opacity-70" title="مشترٍ يقف أمام دكان الجار">
                  🛍️
                </span>
              ))}
              {previewRound.rivalSales > 40 && (
                <span className="text-[11px] text-slate-400 font-bold self-center mr-1">
                  +{previewRound.rivalSales - 40} آخرين
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Narrative Feedback Note */}
        {lastRound && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/85 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">
                حصيلة اليوم السابق (اليوم {lastRound.roundNumber}):
              </span>
              <p className="text-slate-300 leading-relaxed">{lastRound.narrativeNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* Decision Controls & Strategy Configuration */}
      <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 space-y-6">
        {/* Strategy Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            استراتيجية التاجر المنافس (المنافس الآلي):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedStrategy('tit-for-tat');
                playTactileTick();
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                selectedStrategy === 'tit-for-tat'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <Handshake className="w-3.5 h-3.5 text-cyan-400" />
                الرد بالمثل (Tit-for-Tat)
              </div>
              <div className="text-[10px] text-slate-400">
                يبدأ بالسعر العادل (10)، ثم يكرر في كل جولة ما فعلته أنت سابقاً بدقة.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedStrategy('always-defect');
                playTactileTick();
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                selectedStrategy === 'always-defect'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                الجشع الدائم (سباق القاع)
              </div>
              <div className="text-[10px] text-slate-400">
                يبيع دائماً بسعر التكلفة 5 د لكسر السوق وحرمانك من أي ربح.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedStrategy('conditional-cooperate');
                playTactileTick();
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                selectedStrategy === 'conditional-cooperate'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                التعاون المشروط (Grim Trigger)
              </div>
              <div className="text-[10px] text-slate-400">
                يتعاون بسعر 10 طالما حافظت عليه، ولكن ينتقم بالتكلفة للأبد إن خفضت.
              </div>
            </button>
          </div>
        </div>

        {/* Player Price Slider */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200">
              كم ستحدد سعر بيع جرة الزيت في دكانك غداً صباحاً؟
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {playerPriceInput} دراهم للجرة
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={12}
            step={1}
            value={playerPriceInput}
            onChange={(e) => {
              setPlayerPriceInput(Number(e.target.value));
              playTactileTick();
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>5 دراهم (التكلفة الصرفة - هامش 0)</span>
            <span>7 دراهم (تخفيض شرس)</span>
            <span>10 دراهم (السعر العادل المتوازن)</span>
            <span>12 درهماً (سعر مرتفع)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleStepDay}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-300 hover:to-amber-300 transition-all shadow-lg glow-rose cursor-pointer text-xs sm:text-sm"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>عِش اليوم {state.currentRound} واختبر النتيجة</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateFiveDays}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <span>محاكاة 5 أيام متتالية</span>
          </button>
        </div>
      </div>

      {/* Decision Fingerprint at Day 3+ */}
      {state.history.length >= 3 && (
        <DecisionFingerprint
          chapterId="06-price-war"
          chapterTitle="لغز حرب الأسعار وحصار الربح"
          metrics={fingerprintMetrics}
          statItems={fingerprintStats}
        />
      )}
    </div>
  );
};
