import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Mafs, Coordinates, Plot, MovablePoint, Line, Text } from 'mafs';
import 'mafs/core.css';
import { playSoftClick } from '../../engine/core/audio';
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Fish,
  ShoppingBag,
  Info,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import {
  subscribeEconomicEvent,
  type CoinDroppedPayload,
  type VillageTickPayload,
} from '../../engine/core/eventBridge';

export function InteractiveEquilibriumCurve() {
  // Demand curve intercept (0 to 10) - Default: 8
  const [demandIntercept, setDemandIntercept] = useState<number>(8);
  // Supply curve intercept (0 to 10) - Default: 2
  const [supplyIntercept, setSupplyIntercept] = useState<number>(2);

  // Cross-Island live synchronization state
  const [liveSync, setLiveSync] = useState<boolean>(true);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  // Constant slopes
  const slopeDemand = 0.8;
  const slopeSupply = 0.6;

  // Calculate equilibrium (P*, Q*)
  const equilibrium = useMemo(() => {
    const qStar = Math.max(0, (demandIntercept - supplyIntercept) / (slopeSupply + slopeDemand));
    const pStar = Math.max(0, supplyIntercept + slopeSupply * qStar);
    return {
      q: Number(qStar.toFixed(1)),
      p: Number(pStar.toFixed(1)),
    };
  }, [demandIntercept, supplyIntercept]);

  // Handle dragging demand handle (Orange)
  const handleDemandPointMove = useCallback((point: [number, number]) => {
    const newY = Math.max(4, Math.min(10, point[1]));
    setDemandIntercept(newY);
    setLiveNotice(null);
    playSoftClick();
  }, []);

  // Handle dragging supply handle (Green)
  const handleSupplyPointMove = useCallback((point: [number, number]) => {
    const newY = Math.max(0.5, Math.min(5, point[1]));
    setSupplyIntercept(newY);
    setLiveNotice(null);
    playSoftClick();
  }, []);

  const resetToDefault = () => {
    setDemandIntercept(8);
    setSupplyIntercept(2);
    setLiveNotice(null);
    playSoftClick();
  };

  // Cross-Island Event Subscriptions
  useEffect(() => {
    if (!liveSync) return;

    // 1. When coins dropped in physics vault -> Shifts demand curve outwards (higher money supply)
    const unsubCoin = subscribeEconomicEvent('innate:coin-dropped', (payload: CoinDroppedPayload) => {
      // Shifting demand intercept upwards as money increases: from 7.5 up to 9.8
      const shiftedDemand = Math.min(9.8, 7.2 + payload.count * 0.12);
      setDemandIntercept(Number(shiftedDemand.toFixed(1)));
      setLiveNotice(
        `تأثير تدفق الذهب في الخزينة (+1): زيادة السيولة النقدية (${payload.count} عملة) زادت شهية الإنفاق، فأزاحت منحنى الطلب للأعلى وقفز سعر التوازن إلى ${equilibrium.p} د!`
      );
    });

    // 2. When vault is cleared -> Deflationary demand collapse
    const unsubReset = subscribeEconomicEvent('innate:vault-reset', () => {
      setDemandIntercept(5.0);
      setLiveNotice(
        'تأثير إفراغ الخزينة: أزمة سيولة مفاجئة أزاحت منحنى الطلب للأسفل، مما أدى إلى انكماش سعري حاد!'
      );
    });

    // 3. When the 60 villagers simulation ticks -> Shifts curves based on velocity and market health
    const unsubVillage = subscribeEconomicEvent('innate:village-tick', (payload: VillageTickPayload) => {
      if (payload.marketMode === 'barter') {
        // Barter friction: high transaction friction dampens effective market demand
        setDemandIntercept(6.5);
        setLiveNotice(
          `تأثير وضع المقايضة في القرية: احتكاك التبادل وغياب تطابق الرغبات ضغط على السوق فانكمش الطلب إلى 6.5!`
        );
      } else {
        // Monetary boom or interest debt drag
        const shift = (payload.velocity - 1.0) * 1.5 - (payload.totalDebt * 0.03);
        const dynamicIntercept = Math.max(5.5, Math.min(9.8, 8.0 + shift));
        setDemandIntercept(Number(dynamicIntercept.toFixed(1)));
        setLiveNotice(
          `مزامنة حية مع القرية (جولة ${payload.round}): سرعة دوران النقد V=${payload.velocity} وديون القرية=${payload.totalDebt} د تحرك منحنى توازن السوق لحظياً!`
        );
      }
    });

    return () => {
      unsubCoin();
      unsubReset();
      unsubVillage();
    };
  }, [liveSync, equilibrium.p]);

  const applyScenario = (scenario: 'boom' | 'storm' | 'bumper' | 'normal') => {
    setLiveNotice(null);
    if (scenario === 'boom') {
      setDemandIntercept(9.8);
      setSupplyIntercept(2);
    } else if (scenario === 'storm') {
      setDemandIntercept(8);
      setSupplyIntercept(4.6);
    } else if (scenario === 'bumper') {
      setDemandIntercept(7.5);
      setSupplyIntercept(1.0);
    } else {
      setDemandIntercept(8);
      setSupplyIntercept(2);
    }
    playSoftClick();
  };

  // Plain-Arabic real-time explanation
  const marketExplanation = useMemo(() => {
    if (demandIntercept > 8.5) {
      return {
        title: 'طفرة طلب وإقبال عارم للمشترين! 🛒',
        desc: `ازدادت رغبة المشترين وأموالهم في المرفأ؛ التنافس بين الناس لشراء الصناديق دفع السعر للارتفاع إلى ${equilibrium.p} دينار، وشجّع الصيادين على جلب كمية أكبر بلغت ${equilibrium.q} صناديق.`,
        statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }
    if (supplyIntercept > 3.5) {
      return {
        title: 'عاصفة بحرية وشح في صيد الأسماك! 🌊',
        desc: `الأمواج عاتية وخرج عدد قليل من المراكب؛ قلة المعروض في الميناء جعلت المشترين يتسابقون على الصناديق المعدودة، فقفز السعر إلى ${equilibrium.p} دينار وهبطت الكمية المتاحة إلى ${equilibrium.q} صناديق فقط.`,
        statusColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      };
    }
    if (supplyIntercept <= 1.5) {
      return {
        title: 'موسم صيد استثنائي وفير! 🐟',
        desc: `الشباك ممتلئة والبحر هادئ؛ كثرة السمك المعروض في الميناء جعلت الصيادين يخفضون السعر إلى ${equilibrium.p} دينار فقط ليتمكنوا من بيع كامل صيدهم البالغ ${equilibrium.q} صندوقاً قبل أن يفسد!`,
        statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      };
    }
    return {
      title: 'سوق متوازن ومستقر ⚖️',
      desc: `رغبة المشترين متطابقة تماماً مع إنتاج الصيادين؛ يباع صندوق السمك بسعر عادل (${equilibrium.p} دينار) وتتبادل القرية ${equilibrium.q} صناديق طازجة دون فائض يفسد ودون مشترين محرومين.`,
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    };
  }, [demandIntercept, supplyIntercept, equilibrium]);

  return (
    <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
      {/* 1. Pedagogical Mission Header */}
      <div className="space-y-3 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
            <Fish className="w-4 h-4 text-cyan-400" />
            <span>تجربة واقعية: كيف يتحدد السعر في سوق السمك؟</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setLiveSync((prev) => !prev);
                playSoftClick();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                liveSync
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${liveSync ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
              <span>{liveSync ? 'مزامنة مع القرية والخزينة: نشطة ⚡' : 'المزامنة: متوقفة'}</span>
            </button>

            <button
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة الوضع الطبيعي</span>
            </button>
          </div>
        </div>

        {/* Live Cross-Island Sync Notification Banner */}
        {liveNotice && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{liveNotice}</span>
            </div>
            <button
              onClick={() => setLiveNotice(null)}
              className="text-[10px] text-slate-400 hover:text-white shrink-0 p-1"
            >
              إخفاء ✕
            </button>
          </div>
        )}

        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          لعبة توازن الأسعار الفطرية: حرّك المنحنيات بيدك
        </h3>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-light space-y-2">
          <p>
            تخيل أنك تقف في <strong className="text-white font-medium">سوق السمك على المرفأ</strong>:
            لا يوجد وزير ولا مسؤول يحدد سعر السمك بقرار؛ السعر يولد تلقائياً من صراع لطيف بين طرفين:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
              <span><strong>الخط البرتقالي (الطلب):</strong> شهية المشترين ورغبتهم في الشراء.</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0"></span>
              <span><strong>الخط الأخضر (العرض):</strong> تعب ومشقة الصيادين في البحر.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Quick Scenarios (Buttons) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 block">
          💡 جرّب صدمات حقيقية بضغطة زر، أو اسحب المقابض بيدك على الرسم:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => applyScenario('boom')}
            className="p-3 rounded-xl text-right bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold block group-hover:text-amber-200">🛒 موسم الأعياد</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">إقبال شديد للمشترين</span>
          </button>

          <button
            onClick={() => applyScenario('storm')}
            className="p-3 rounded-xl text-right bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold block group-hover:text-rose-200">🌊 عاصفة بحرية</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">قلّة السمك وصعوبة الصيد</span>
          </button>

          <button
            onClick={() => applyScenario('bumper')}
            className="p-3 rounded-xl text-right bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold block group-hover:text-emerald-200">🐟 صيد وفير جداً</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">امتلاء المرفأ بالأسماك</span>
          </button>

          <button
            onClick={() => applyScenario('normal')}
            className="p-3 rounded-xl text-right bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold block group-hover:text-white">⚖️ التوازن الطبيعي</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">يوم عمل اعتيادي</span>
          </button>
        </div>
      </div>

      {/* 3. The Interactive Mafs Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            👇 لوحة السوق التفاعلية (اسحب النقطة البرتقالية أو الخضراء باللمس أو الفأرة):
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            نقطة التوازن: E ({equilibrium.q} صناديق @ {equilibrium.p} د)
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-[#060911] shadow-2xl" dir="ltr">
          <Mafs
            height={360}
            viewBox={{ x: [-1, 10], y: [-1, 11] }}
            preserveAspectRatio={false}
            pan={false}
            zoom={false}
          >
            <Coordinates.Cartesian
              xAxis={{
                lines: 1,
                labels: (x) => (x > 0 && x <= 9 ? `${x} صناديق` : ''),
              }}
              yAxis={{
                lines: 1,
                labels: (y) => (y > 0 && y <= 10 ? `${y} د` : ''),
              }}
            />

            {/* Demand Curve (Downward Sloping) */}
            <Plot.OfX
              y={(x) => demandIntercept - slopeDemand * x}
              color="#f59e0b"
              weight={3.5}
            />

            {/* Supply Curve (Upward Sloping) */}
            <Plot.OfX
              y={(x) => supplyIntercept + slopeSupply * x}
              color="#10b981"
              weight={3.5}
            />

            {/* Equilibrium Projection Dashed Lines */}
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

            {/* Draggable Point for Demand Intercept (Orange) */}
            <MovablePoint
              point={[0, demandIntercept]}
              onMove={handleDemandPointMove}
              color="#f59e0b"
              constrain={([, y]) => [0, Math.max(4, Math.min(10, y))]}
            />

            {/* Draggable Point for Supply Intercept (Green) */}
            <MovablePoint
              point={[0, supplyIntercept]}
              onMove={handleSupplyPointMove}
              color="#10b981"
              constrain={([, y]) => [0, Math.max(0.5, Math.min(5, y))]}
            />

            {/* In-Graph Labels */}
            <Text
              x={Math.min(8, (demandIntercept - 1.2) / slopeDemand)}
              y={1.2}
              color="#f59e0b"
              size={13}
            >
              شهية المشترين (الطلب)
            </Text>

            <Text
              x={Math.min(8, (9.5 - supplyIntercept) / slopeSupply)}
              y={9.5}
              color="#10b981"
              size={13}
            >
              مشقة الصيادين (العرض)
            </Text>

            {/* Equilibrium Point Label */}
            <Text
              x={equilibrium.q + 0.3}
              y={equilibrium.p + 0.4}
              color="#38bdf8"
              size={15}
              svgTextProps={{ fontWeight: 'bold' }}
            >
              {`توازن السوق (${equilibrium.p} د)`}
            </Text>
          </Mafs>

          {/* Touch instructions badge */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
            المحور الرأسي: سعر الصندوق • المحور الأفقي: عدد الصناديق
          </div>
        </div>
      </div>

      {/* 4. Live Plain-Arabic Interpreter (Explains what is happening right now) */}
      <div className={`p-4 rounded-2xl border text-right space-y-1 transition-all ${marketExplanation.statusColor}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>ماذا يحدث في السوق الآن؟ — {marketExplanation.title}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
          {marketExplanation.desc}
        </p>
      </div>

      {/* 5. Inputs vs Outputs Educational Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-[11px] text-slate-400 block">النتيجة الأولى: سعر الصندوق المتفق عليه</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
            {equilibrium.p} <span className="text-xs text-slate-400 font-sans">دينار</span>
          </span>
          <span className="text-[10px] text-slate-500 block">
            السعر الذي يقبله البائع والمشتري معاً
          </span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-[11px] text-slate-400 block">النتيجة الثانية: كمية الصناديق المباعة</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {equilibrium.q} <span className="text-xs text-slate-400 font-sans">صندوقاً</span>
          </span>
          <span className="text-[10px] text-slate-500 block">
            حجم التبادل الحقيقي في المرفأ
          </span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-[11px] text-slate-400 block">الحكمة الفطرية للقانون:</span>
          <span className="text-sm font-bold text-emerald-400 block pt-1">
            السعر برقية إرشادية! ⚡
          </span>
          <span className="text-[10px] text-slate-400 leading-tight block">
            ارتفاع السعر ليس شراً، بل إشارة للصيادين بأن القرية بحاجة لمزيد من السمك!
          </span>
        </div>
      </div>
    </div>
  );
}
