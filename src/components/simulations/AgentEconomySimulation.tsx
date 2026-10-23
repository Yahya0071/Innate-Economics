import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Coins,
  Scale,
  Users,
  CheckCircle2,
  AlertTriangle
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
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastAudioRoundRef = useRef<number>(0);

  // Reset economy
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setEconomy(createInitialEconomy({ numAgents: 60 }));
    playSoftClick();
  }, []);

  // Single step
  const handleStep = useCallback(() => {
    setEconomy((prev) => {
      const next = stepEconomyRound(prev, { enableTax });
      if (next.round - lastAudioRoundRef.current >= 5) {
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
        if (next.round - lastAudioRoundRef.current >= 8) {
          lastAudioRoundRef.current = next.round;
          if (next.metrics.giniCoefficient > 0.65) {
            playTensionHum();
          } else {
            playCoinSound();
          }
        }
        return next;
      });
    }, Math.max(30, 200 / speed));

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

    // Background grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
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

    // Draw agents as glowing bubbles
    economy.agents.forEach((agent) => {
      // Map virtual 1000x600 coordinates to actual canvas width/height
      const cx = (agent.x / 1000) * w;
      const cy = (agent.y / 600) * h;

      // Wealth determines radius (3px to 22px)
      const wealthRatio = agent.wealth / (meanWealth || 1);
      const r = Math.max(3.5, Math.min(22, 5 + wealthRatio * 4));

      // Color based on wealth bracket
      let fillColor = '#38bdf8'; // Average (cyan)
      let glowColor = 'rgba(56, 189, 248, 0.2)';
      if (agent.wealth > meanWealth * 2) {
        fillColor = '#fbbf24'; // Rich (amber/gold)
        glowColor = 'rgba(251, 191, 36, 0.4)';
      } else if (agent.wealth < meanWealth * 0.3) {
        fillColor = '#f43f5e'; // Impoverished (rose)
        glowColor = 'rgba(244, 63, 94, 0.3)';
      }

      ctx.save();
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }, [economy]);

  const giniColor =
    economy.metrics.giniCoefficient < 0.35
      ? 'text-emerald-400'
      : economy.metrics.giniCoefficient < 0.55
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <div className="glass-panel p-5 sm:p-8 rounded-3xl border-slate-800 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>محاكاة الوكلاء المتعددين (Agent-Based Economics)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            لغز تفاوت الثروة وقانون باريتو (توزيع 80/20)
          </h3>
          <p className="text-xs text-slate-400">
            60 قروياً يبدأون جميعاً بنفس المقدار من الذهب (100 دينار). عند التبادل الحر الصرف، هل تبقى الثروة متساوية أم تتجمع حتماً في يد قلة؟
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRun}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء التداول التلقائي</span>
              </>
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={isRunning}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <span>جولة واحدة</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="إعادة ضبط الجميع إلى التساوي التام"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Switches (Zakat / Redistribution) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center gap-3">
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

          <div>
            <span className="text-xs sm:text-sm font-bold text-white block">
              تفعيل «زكاة الثروة الفطرية» (إعادة توزيع 2.5% دورياً)
            </span>
            <span className="text-[11px] text-slate-400 block">
              اقتطاع مساهمة طفيفة من فائض الأغنياء وتوزيعها بالتساوي كعائد سيولة أساسي
            </span>
          </div>
        </div>

        {/* Speed multiplier */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>السرعة:</span>
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                playSoftClick();
              }}
              className={`px-2 py-0.5 rounded-md ${
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

      {/* Arena Canvas + Live Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Arena (2 cols) */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-inner flex flex-col justify-between">
          <canvas
            ref={canvasRef}
            width={700}
            height={400}
            className="w-full h-[320px] sm:h-[380px] block"
          />

          {/* Arena Legend */}
          <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>ثروة فائقة (&gt; 200 دينار)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>متوسط (100 دينار)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span>شح سيولة (&lt; 30 دينار)</span>
              </span>
            </div>
            <span className="font-mono text-slate-500">الجولة: {economy.round}</span>
          </div>
        </div>

        {/* Live Metrics Dashboard */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Gini Metric */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-right space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>معامل جيني للعدالة (Gini):</span>
              <span className="font-mono text-[10px] text-slate-500">0.0 (تساوٍ) → 1.0 (احتكار)</span>
            </div>
            <div className={`text-3xl font-black font-mono ${giniColor}`}>
              {economy.metrics.giniCoefficient}
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, economy.metrics.giniCoefficient * 100)}%` }}
              />
            </div>
          </div>

          {/* Top 20% vs Bottom 50% */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">حصة الـ 20% الأغنى</span>
              <span className="text-xl font-bold text-amber-300 font-mono">
                {economy.metrics.top20Share}%
              </span>
              <span className="text-[9px] text-slate-500 block">من إجمالي ثروة القرية</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">حصة الـ 50% الأفقر</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">
                {economy.metrics.bottom50Share}%
              </span>
              <span className="text-[9px] text-slate-500 block">نصف سكان المجتمع</span>
            </div>
          </div>

          {/* Max & Min Wealth */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">أغنى قروي:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">
                {economy.metrics.maxWealth} د
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">الوسيط (Median):</span>
              <span className="text-white font-bold font-mono text-sm">
                {economy.metrics.medianWealth} د
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">أفقر قروي:</span>
              <span className="text-rose-400 font-bold font-mono text-sm">
                {economy.metrics.minWealth} د
              </span>
            </div>
          </div>

          {/* Insight explanation */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الاستبصار الفطري:</span>
            </div>
            <p className="text-[11px] leading-relaxed font-light text-slate-300">
              حتى في غياب الاحتكار أو الخداع، تقود الصفقات العشوائية الحرة في أي سوق رياضي إلى تركز الثروة في يد القلة (Yard-Sale Effect). فرض ضريبة تدوير طفيفة (2.5%) هو صمام الأمان الفطري الذي يمنع شلل حركة التبادل!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
