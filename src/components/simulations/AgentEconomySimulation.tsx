import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Info,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  createInitialEconomy,
  stepEconomyRound,
} from '../../engine/agent-economy/engine';
import type { EconomyState } from '../../engine/agent-economy/types';
import { playCoinSound, playTensionHum, playSoftClick } from '../../engine/core/audio';

export function AgentEconomySimulation() {
  const [economy, setEconomy] = useState<EconomyState>(() => createInitialEconomy({ numAgents: 60 }));
  const [isRunning, setIsRunning] = useState(false);
  const [enableTax, setEnableTax] = useState(false);
  const [speed, setSpeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastAudioRoundRef = useRef<number>(0);
  const [recentTrades, setRecentTrades] = useState<string[]>([
    'تم تجهيز 60 قروياً؛ كل فرد يمتلك 100 دينار بالتساوي التام.',
  ]);

  // Reset economy
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setEconomy(createInitialEconomy({ numAgents: 60 }));
    setRecentTrades(['تمت إعادة ضبط القرية؛ استعاد الجميع 100 دينار بالتساوي.']);
    playSoftClick();
  }, []);

  // Single step
  const handleStep = useCallback(() => {
    setEconomy((prev) => {
      const next = stepEconomyRound(prev, { enableTax });
      if (next.round - lastAudioRoundRef.current >= 4) {
        lastAudioRoundRef.current = next.round;
        playCoinSound();
      }
      return next;
    });
  }, [enableTax]);

  // Toggle running
  const handleToggleRun = () => {
    setIsRunning((prev) => !prev);
    playSoftClick();
  };

  // Run loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setEconomy((prev) => {
        const next = stepEconomyRound(prev, { enableTax });
        // Sound feedback
        if (next.round - lastAudioRoundRef.current >= 7) {
          lastAudioRoundRef.current = next.round;
          if (next.metrics.giniCoefficient > 0.6) {
            playTensionHum();
          } else {
            playCoinSound();
          }
        }
        return next;
      });
    }, Math.max(30, 220 / speed));

    return () => clearInterval(interval);
  }, [isRunning, enableTax, speed]);

  // Canvas render of agent particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle dark grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const meanWealth = economy.metrics.totalWealth / economy.agents.length;

    // Draw agents as labeled glowing bubbles
    economy.agents.forEach((agent) => {
      const cx = (agent.x / 1000) * w;
      const cy = (agent.y / 600) * h;

      // Wealth determines radius (4px to 22px)
      const wealthRatio = agent.wealth / (meanWealth || 1);
      const r = Math.max(4, Math.min(22, 5 + wealthRatio * 4.5));

      // Color coding:
      // Gold/Amber = Ultra Rich (> 200)
      // Cyan = Average (80 - 200)
      // Rose/Red = Impoverished (< 40)
      let fillColor = '#38bdf8';
      let glowColor = 'rgba(56, 189, 248, 0.2)';
      if (agent.wealth > meanWealth * 1.8) {
        fillColor = '#fbbf24';
        glowColor = 'rgba(251, 191, 36, 0.45)';
      } else if (agent.wealth < meanWealth * 0.35) {
        fillColor = '#f43f5e';
        glowColor = 'rgba(244, 63, 94, 0.35)';
      }

      ctx.save();
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Draw wealth number inside larger agents
      if (r > 12) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(agent.wealth)}`, cx, cy);
      }
      ctx.restore();
    });
  }, [economy]);

  // Live conversational interpreter
  const liveNarration = useMemo(() => {
    const { round, metrics } = economy;
    if (round === 0) {
      return {
        badge: 'البداية: عدالة مطلقة ⚖️',
        text: 'جميع القرويين الـ 60 يملكون نفس المبلغ بالضبط (100 دينار). انقر على زر [▶ بدء التبادل التجاري] بالأسفل وشاهد كيف سيتغير المشهد تلقائياً!',
        color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
      };
    }
    if (enableTax) {
      return {
        badge: 'صمام الأمان يعمل بنجاح! ✨',
        text: `بفضل اقتطاع 2.5% فقط من فائض الأثرياء وتوزيعه بالتساوي على المحتاجين، انخفض مؤشر التفاوت إلى ${metrics.giniCoefficient}، وانتعشت الدوائر الصغيرة بالسيولة دون أن يتوقف التبادل!`,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
      };
    }
    if (metrics.giniCoefficient > 0.6) {
      return {
        badge: 'تحذير: احتكار شبه كامل للمال! 🚨',
        text: `انظر للشاشة: تضخمت بضع دوائر ذهبية عملاقة وابتلعت 80% من ذهب القرية كلها، بينما تحول أغلب السكان إلى دوائر حمراء مجهرية عاجزة عن الشراء! جرب تفعيل [زكاة الثروة 2.5%] بالأسفل لمشاهدة العلاج الفطري.`,
        color: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
      };
    }
    if (metrics.giniCoefficient > 0.35) {
      return {
        badge: 'ظاهرة باريتو تبدأ بالتشكل 📈',
        text: `مع استمرار الصفقات الحرة العشوائية، بدأت الفجوة تتسع طبيعياً: 20% من التجار أصبحوا يملكون ${metrics.top20Share}% من إجمالي ثروة المجتمع، بينما يتراجع نصيب البقية تدريجياً.`,
        color: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
      };
    }
    return {
      badge: 'السوق في بداياته 🌱',
      text: `تجري الصفقات اليومية بسلاسة؛ الدوائر تتحرك وتتبادل الذهب عند التلاقي، والتفاوت ما يزال في حدوده الطبيعية المقبولة.`,
      color: 'text-slate-300 border-slate-700 bg-slate-900/60',
    };
  }, [economy, enableTax]);

  return (
    <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
      {/* 1. Pedagogical Story Header */}
      <div className="space-y-3 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            <Users className="w-4 h-4 text-amber-400" />
            <span>تجربة مجتمعية: لغز تركز الثروة وقانون باريتو (80/20)</span>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط القرية بالتساوي</span>
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          ماذا يحدث لو بدأ مجتمع كامل بمال متساوٍ تماماً؟
        </h3>

        {/* The Simple Dilemma Story Box */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-light space-y-2">
          <p>
            تخيل أن <strong className="text-white font-medium">60 قروياً في سوق الواحة</strong> (الدوائر الظاهرة في الساحة أدناه) استيقظوا وفي جيب كل واحد منهم <strong className="text-amber-300 font-mono">100 دينار</strong> بالتساوي التام. لا يوجد لصوص ولا غشاشون؛ كل دائرتين تلتقيان تتبادلان سلعة، أحدهما يربح هامشاً بسيطاً والآخر يدفع.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
              <span><strong>الدائرة الصفراء الكبيرة:</strong> تاجر محظوظ تراكمت أرباحه.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shrink-0"></span>
              <span><strong>الدائرة الزرقاء:</strong> قروي متوسط الحال (حوالي 100 د).</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0"></span>
              <span><strong>الدائرة الحمراء الصغيرة:</strong> قروي مفلس خسر نقوده.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Mission Controls (Buttons) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Play/Pause & Step */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleRun}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
              isRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-950'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>إيقاف الصفقات مؤقتاً</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>▶ بدء التبادل التجاري الحر</span>
              </>
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={isRunning}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>تقدم جولة واحدة</span>
          </button>
        </div>

        {/* Zakat Switch - The Core Intuitive Intervention */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableTax}
              onChange={(e) => {
                setEnableTax(e.target.checked);
                playSoftClick();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
          <div className="text-right">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <span>تفعيل زكاة الثروة الفطرية (2.5%)</span>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </span>
            <span className="text-[10px] text-emerald-300/80 block">
              تقتطع مساهمة طفيفة من فائض الأغنياء وتوزعها بالتساوي لإنعاش الفقراء
            </span>
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
          <span>السرعة:</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                playSoftClick();
              }}
              className={`px-2 py-1 rounded-md text-xs cursor-pointer ${
                speed === s
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 3. The Live Conversational Interpreter (Tells the user what is happening) */}
      <div className={`p-4 rounded-2xl border text-right space-y-1 transition-all ${liveNarration.color}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>المترجم الفوري للمشهد: {liveNarration.badge}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
          {liveNarration.text}
        </p>
      </div>

      {/* 4. Canvas Arena + Live HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* The 60-Villager Arena */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-[#060911] shadow-2xl flex flex-col justify-between">
          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ساحة القرية (60 قروياً يتبادلون الصفقات)</span>
          </div>

          <canvas
            ref={canvasRef}
            width={700}
            height={380}
            className="w-full h-[320px] sm:h-[360px] block"
          />

          {/* Arena Footer Bar */}
          <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>حجم الدائرة = مقدار ما يحمله القروي من ذهب</span>
            </div>
            <span className="font-mono text-amber-300 font-bold">
              الجولة رقم: {economy.round}
            </span>
          </div>
        </div>

        {/* Live Metrics HUD (Explained Simply) */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Metric 1: Gini Index Explained */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-right space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">مقياس العدالة (معامل جيني):</span>
              <span className="font-mono text-[10px] text-slate-500">0.0 (تساوٍ) ← 1.0 (احتكار)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-300">
                {economy.metrics.giniCoefficient}
              </span>
              <span className="text-xs text-slate-400">
                {economy.metrics.giniCoefficient < 0.35
                  ? '(مجتمع عادل ومتوازن)'
                  : economy.metrics.giniCoefficient < 0.55
                    ? '(تفاوت ملحوظ)'
                    : '(احتكار شديد وخطر)'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, economy.metrics.giniCoefficient * 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 2: The 80/20 Pareto Split */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">حصة الـ 20% الأغنى</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">
                {economy.metrics.top20Share}%
              </span>
              <span className="text-[9px] text-slate-500 block">من إجمالي ثروة القرية</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">حصة الـ 50% الأفقر</span>
              <span className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono">
                {economy.metrics.bottom50Share}%
              </span>
              <span className="text-[9px] text-slate-500 block">نصف سكان المجتمع</span>
            </div>
          </div>

          {/* Metric 3: Wealth Extremes */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">أغنى قروي:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">
                {economy.metrics.maxWealth} د
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">المتوسط العام:</span>
              <span className="text-white font-bold font-mono text-sm">
                100 د
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">أفقر قروي:</span>
              <span className="text-rose-400 font-bold font-mono text-sm">
                {economy.metrics.minWealth} د
              </span>
            </div>
          </div>

          {/* Educational Takeaway Box */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الخلاصة الفطرية للتجربة:</span>
            </div>
            <p className="text-[11px] leading-relaxed font-light text-slate-300">
              الأسواق الحرة تولد تفاوتاً تلقائياً بحكم الرياضيات البحتة؛ لذا فإن تدوير الثروة بزكاة طفيفة (2.5%) ليس صدقة إحسانية فقط، بل هو <strong className="text-white">ضرورة اقتصادية فيزيائية</strong> لحماية السوق من الشلل وإنعاش قدرة الجميع على الشراء!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
