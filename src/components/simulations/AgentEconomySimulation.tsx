import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Users,
  Scale,
  TrendingUp,
  Trophy,
  UserCheck,
  HeartHandshake,
  Eye,
  Award,
  CheckCircle2,
  Landmark,
  Building2,
  ShieldAlert,
  Coins,
  ArrowRightLeft,
} from 'lucide-react';
import {
  createInitialEconomy,
  stepEconomyRound,
  playerVoluntaryZakat,
  setPlayerStrategy,
  toggleInstitution,
  setMarketMode,
  COMMODITIES,
  ECONOMY_MISSIONS,
  evaluateMission,
  getPersonaCommentary,
} from '../../engine/agent-economy/engine';
import type {
  EconomyState,
  Agent,
  TradingStrategy,
  EconomyMission,
  InstitutionalAgentsConfig,
  MarketMode,
} from '../../engine/agent-economy/types';
import {
  playCoinSound,
  playTensionHum,
  playSoftClick,
  playSuccessChime,
} from '../../engine/core/audio';
import { emitEconomicEvent } from '../../engine/core/eventBridge';

export function AgentEconomySimulation() {
  const [mode, setMode] = useState<'player' | 'institutions' | 'barter' | 'missions' | 'observe'>('player');
  const [economy, setEconomy] = useState<EconomyState>(() =>
    createInitialEconomy({ numAgents: 60, enablePlayer: true })
  );
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(0);
  const [activeMissionId, setActiveMissionId] = useState<string>('mercantile_rise');
  const [personaTab, setPersonaTab] = useState<'both' | 'ibn_khaldun' | 'adam_smith'>('both');
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastAudioRoundRef = useRef<number>(0);
  const celebratedMissionRef = useRef<Record<string, boolean>>({});

  // Reset economy
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setEconomy(createInitialEconomy({ numAgents: 60, enablePlayer: true }));
    setSelectedAgentId(0);
    playSoftClick();
  }, []);

  // Single step
  const handleStep = useCallback(() => {
    setEconomy((prev) => {
      const next = stepEconomyRound(prev, { enableTax: prev.institutions.baytAlMal });
      if (next.round - lastAudioRoundRef.current >= 4) {
        lastAudioRoundRef.current = next.round;
        playCoinSound();
      }
      emitEconomicEvent('innate:village-tick', {
        round: next.round,
        totalWealth: next.metrics.totalWealth,
        velocity: next.metrics.velocityOfMoney,
        gini: next.metrics.giniCoefficient,
        averagePrice: Number((1.0 + next.metrics.velocityOfMoney * 0.8 + (next.institutions.interestBank ? next.metrics.totalDebt * 0.02 : 0)).toFixed(2)),
        totalTrades: next.agents.reduce((acc, a) => acc + a.tradesCount, 0),
        marketMode: next.marketMode,
        totalDebt: next.metrics.totalDebt,
      });
      return next;
    });
  }, []);

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
        const next = stepEconomyRound(prev, { enableTax: prev.institutions.baytAlMal });
        // Sound feedback
        if (next.round - lastAudioRoundRef.current >= 7) {
          lastAudioRoundRef.current = next.round;
          if (next.metrics.totalDebt > 50 || next.metrics.giniCoefficient > 0.6) {
            playTensionHum();
          } else {
            playCoinSound();
          }
        }
        emitEconomicEvent('innate:village-tick', {
          round: next.round,
          totalWealth: next.metrics.totalWealth,
          velocity: next.metrics.velocityOfMoney,
          gini: next.metrics.giniCoefficient,
          averagePrice: Number((1.0 + next.metrics.velocityOfMoney * 0.8 + (next.institutions.interestBank ? next.metrics.totalDebt * 0.02 : 0)).toFixed(2)),
          totalTrades: next.agents.reduce((acc, a) => acc + a.tradesCount, 0),
          marketMode: next.marketMode,
          totalDebt: next.metrics.totalDebt,
        });
        return next;
      });
    }, Math.max(30, 220 / speed));

    return () => clearInterval(interval);
  }, [isRunning, speed]);

  // Selected Agent details
  const selectedAgent = useMemo(() => {
    if (selectedAgentId === null) return null;
    return economy.agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [economy.agents, selectedAgentId]);

  // Player agent
  const playerAgent = useMemo(() => {
    return economy.agents.find((a) => a.isPlayer) ?? null;
  }, [economy.agents]);

  // Socratic commentary
  const personaDialogue = useMemo(() => {
    return getPersonaCommentary(economy, economy.institutions.baytAlMal);
  }, [economy]);

  // Active mission evaluation
  const missionEval = useMemo(() => {
    return evaluateMission(economy, activeMissionId);
  }, [economy, activeMissionId]);

  // Celebrate mission completion
  useEffect(() => {
    if (missionEval.status === 'completed' && !celebratedMissionRef.current[activeMissionId]) {
      celebratedMissionRef.current[activeMissionId] = true;
      setCompletedMissions((prev) => ({ ...prev, [activeMissionId]: true }));
      playSuccessChime();
    }
  }, [missionEval.status, activeMissionId]);

  // Change player strategy
  const handleStrategyChange = (strategy: TradingStrategy) => {
    setEconomy((prev) => setPlayerStrategy(prev, strategy));
    playSoftClick();
  };

  // Voluntary Zakat action by player
  const handleVoluntaryZakat = () => {
    if (!playerAgent || playerAgent.wealth < 15) return;
    setEconomy((prev) => playerVoluntaryZakat(prev, 10));
    playCoinSound();
  };

  // Toggle institutional agent
  const handleToggleInstitution = (inst: keyof InstitutionalAgentsConfig) => {
    setEconomy((prev) => {
      const next = toggleInstitution(prev, inst);
      if (inst === 'interestBank' && next.institutions.interestBank) {
        playTensionHum(0.6);
      } else if (inst === 'baytAlMal' && next.institutions.baytAlMal) {
        playSuccessChime();
      } else {
        playSoftClick();
      }
      return next;
    });
  };

  // Switch market mode (barter vs currency)
  const handleSetMarketMode = (m: MarketMode) => {
    setEconomy((prev) => {
      const next = setMarketMode(prev, m);
      if (m === 'currency') {
        playSuccessChime();
      } else {
        playSoftClick();
      }
      return next;
    });
  };

  // Canvas click handler for selecting agents
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Arena width is 1000, height is 600
    const arenaX = (clickX / canvas.width) * 1000;
    const arenaY = (clickY / canvas.height) * 600;

    let closestAgent: Agent | null = null;
    let minDistance = 45; // Selection tolerance

    for (const agent of economy.agents) {
      const dx = agent.x - arenaX;
      const dy = agent.y - arenaY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestAgent = agent;
      }
    }

    if (closestAgent) {
      setSelectedAgentId(closestAgent.id);
      playSoftClick();
    }
  };

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
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

    // Draw agents
    economy.agents.forEach((agent) => {
      const cx = (agent.x / 1000) * w;
      const cy = (agent.y / 600) * h;

      const wealthRatio = agent.wealth / (meanWealth || 1);
      const r = Math.max(5, Math.min(22, 5 + wealthRatio * 4.5));

      const isSelected = agent.id === selectedAgentId;
      const isPlayer = agent.isPlayer;
      const hasDebt = (agent.debt || 0) > 0;
      const isBankrupt = agent.wealth < 10;

      // Color coding
      let fillColor = '#38bdf8';
      let glowColor = 'rgba(56, 189, 248, 0.2)';

      if (isPlayer) {
        fillColor = '#a855f7'; // Purple/Violet for player
        glowColor = 'rgba(168, 85, 247, 0.5)';
      } else if (agent.wealth > meanWealth * 1.8) {
        fillColor = '#fbbf24'; // Amber for wealthy
        glowColor = 'rgba(251, 191, 36, 0.45)';
      } else if (isBankrupt) {
        fillColor = '#f43f5e'; // Rose for impoverished
        glowColor = 'rgba(244, 63, 94, 0.4)';
      }

      ctx.save();

      // Outer glow
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + (isPlayer ? 8 : 4), 0, Math.PI * 2);
      ctx.fill();

      // Core bubble
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Debt badge / warning
      if (hasDebt) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`دين: ${Math.round(agent.debt!)}`, cx, cy + r + 9);
      }

      // Distinctive border for player
      if (isPlayer) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Crown label above player
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑 أنت', cx, cy - r - 6);
      }

      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Barter commodity icon badge
      if (mode === 'barter' && agent.producedCommodity && !isPlayer) {
        const comm = COMMODITIES[agent.producedCommodity];
        if (comm) {
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(comm.icon, cx, cy - r - 4);
        }
      }

      // Wealth number
      if (r > 11 || isPlayer) {
        ctx.fillStyle = isPlayer ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(agent.wealth)}`, cx, cy);
      }

      ctx.restore();
    });
  }, [economy, selectedAgentId, mode]);

  return (
    <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
      {/* 1. Header & Mode Switcher */}
      <div className="space-y-4 border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            <Users className="w-4 h-4 text-amber-400" />
            <span>مخبر التفاعل البشري: لغز تركز الثروة وتوازن المؤسسات</span>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط القرية (100 دينار للجميع)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ماذا يحدث عندما تتفاعل المؤسسات الحقيقية مع السوق الحر؟
          </h3>

          {/* Mode Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs self-start sm:self-auto flex-wrap">
            <button
              onClick={() => {
                setMode('player');
                setSelectedAgentId(0);
                playSoftClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mode === 'player'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>العب كتاجر 👑</span>
            </button>

            <button
              onClick={() => {
                setMode('institutions');
                playSoftClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mode === 'institutions'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>وكلاء المؤسسات 🏛️</span>
            </button>

            <button
              onClick={() => {
                setMode('barter');
                playSoftClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mode === 'barter'
                  ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>المقايضة والنقد 🌾</span>
            </button>

            <button
              onClick={() => {
                setMode('missions');
                playSoftClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mode === 'missions'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>التحديات والمهمات 🎯</span>
            </button>

            <button
              onClick={() => {
                setMode('observe');
                playSoftClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                mode === 'observe'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>المراقب العام 👁️</span>
            </button>
          </div>
        </div>

        {/* Narrative Description Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
          {mode === 'player' ? (
            <p>
              أنت تلعب الآن دور <strong className="text-purple-300 font-medium">التاجر البنفسجي (👑 أنت)</strong> بين 60 قروياً في سوق الواحة. اختر استراتيجيتك المالية، راقب نمو ثروتك، وجرب التبرع بالزكاة لترى كيف تنتعش القرية بكاملها!
            </p>
          ) : mode === 'institutions' ? (
            <p>
              تحكم بـ <strong className="text-amber-300 font-medium">المؤسسات الاقتصادية الكبرى</strong>: جرّب تشغيل بنك الفائدة وشاهد كيف تتراكم الديون وتجف السيولة، ثم شغّل بيت المال لترى كيف تتحرر القرية من الغرم وينتعش التداول الطبيعي!
            </p>
          ) : mode === 'barter' ? (
            <p>
              اكتشف <strong className="text-yellow-300 font-medium">لماذا اخترع أجدادنا النقود</strong>: في نظام المقايضة الصلبة، تفشل معظم المبادلات لأن بائع القمح يريد تمراً، لكن المقابل يعرض فخاراً! اضغط زر «نظام النقد» وشاهد كيف يقضي الدينار على الاحتكاك وتنفجر كفاءة التجارة.
            </p>
          ) : mode === 'missions' ? (
            <p>
              اختر أحد <strong className="text-emerald-300 font-medium">التحديات الاقتصادية الخمسة</strong> بالأسفل وحقق شروط الاستقرار والعدالة لتنال وسام الإنجاز وتتقن المفهوم الاقتصادي عملياً.
            </p>
          ) : (
            <p>
              راقب الظاهرة الفيزيائية لتكدس الثروة: حتى مع النزاهة التامة وتساوي البدايات (100 دينار لكل فرد)، تُفضي الرياضيات البحتة إلى احتكار 20% لمعظم ثروة المجتمع إلا إذا تدخلت <strong className="text-emerald-300 font-medium">زكاة الثروة الفطرية (2.5%)</strong> لإعادة تدوير السيولة.
            </p>
          )}
        </div>
      </div>

      {/* 2. Institutional Agents Control Panel (when mode === 'institutions') */}
      {mode === 'institutions' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>لوحة ضبط الوكلاء المؤسسيين (صراع المؤسسات)</span>
            </div>
            <span className="text-xs text-slate-400">
              انقر على أي مؤسسة لتفعيلها أو إيقافها وملاحظة أثرها على الفور
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Institution 1: Bayt Al-Mal */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                economy.institutions.baytAlMal
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-950/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>بيت المال الفطري</span>
                </span>
                <button
                  onClick={() => handleToggleInstitution('baytAlMal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    economy.institutions.baytAlMal
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {economy.institutions.baytAlMal ? 'مفعّل ✓' : 'معطّل'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light mb-2">
                يقتطع 2.5% من فوائض الأثرياء لتسديد ديون الغارمين وتوزيع مخصصات معيشية لمن هم دون الكفاف.
              </p>
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                إجمالي الدعم الموزع: {economy.metrics.baytAlMalDistributed} دينار
              </div>
            </div>

            {/* Institution 2: Interest Bank */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                economy.institutions.interestBank
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-950/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-rose-400" />
                  <span>بنك الفائدة والديون</span>
                </span>
                <button
                  onClick={() => handleToggleInstitution('interestBank')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    economy.institutions.interestBank
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {economy.institutions.interestBank ? 'مفعّل ⚠️' : 'معطّل'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light mb-2">
                يقدم قروضاً فورية للفقراء بفائدة 5% مركبة؛ يبدو حلاً سريعاً ثم يسحب ذهب القرية ويراكم الديون!
              </p>
              <div className="text-[10px] text-rose-300 font-mono bg-rose-950/40 p-1.5 rounded-lg border border-rose-500/20 flex justify-between">
                <span>ديون القرية: {economy.metrics.totalDebt} د</span>
                <span>أرباح البنك: {economy.metrics.bankVault} د</span>
              </div>
            </div>

            {/* Institution 3: Monopolist Guild */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                economy.institutions.monopolistGuild
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-slate-800 bg-slate-950/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>نقابة الاحتكار التجاري</span>
                </span>
                <button
                  onClick={() => handleToggleInstitution('monopolistGuild')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    economy.institutions.monopolistGuild
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {economy.institutions.monopolistGuild ? 'مفعّل 👑' : 'معطّل'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light mb-2">
                تكتل الـ 15% الأغنى يفرض هوامش ربح أعلى بنسبة 65% في الصفقات، مما يسرع تركيز الثروة ويسحق المنافسين.
              </p>
              <div className="text-[10px] text-amber-300 font-mono bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/20">
                حصة الأغنياء: {economy.metrics.top20Share}% من كل الذهب
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.5. Barter vs Currency Control Panel (when mode === 'barter') */}
      {mode === 'barter' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-yellow-950/20 border border-yellow-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-yellow-300">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>لوحة تجربة المقايضة مقابل النقد (لغز اختراع العملات)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetMarketMode('barter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  economy.marketMode === 'barter'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>🌾 نظام المقايضة الصلبة</span>
              </button>
              <button
                onClick={() => handleSetMarketMode('currency')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  economy.marketMode === 'currency'
                    ? 'bg-yellow-400 text-slate-950 shadow-md ring-2 ring-yellow-300/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>🪙 نظام النقد (الدنانير)</span>
              </button>
            </div>
          </div>

          {/* Explanation and live stats comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">كفاءة إتمام الصفقات:</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span className={economy.metrics.barterEfficiency >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                  {economy.metrics.barterEfficiency}%
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({economy.metrics.barterSuccesses} نجاح / {economy.metrics.barterAttempts} محاولة)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                {economy.marketMode === 'barter'
                  ? '⚠️ معظم الصفقات تفشل لغياب تطابق الرغبات المزدوج!'
                  : '✅ جميع الصفقات تتم بسلاسة لأن الجميع يقبل الدينار كوسيط!'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">صفقات رفضت لعدم تطابق الرغبات:</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
                {economy.metrics.barterFailures}
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                حالة "أريد تمرك لكنك لا تريد قماشي" التي شلت أسواق العالم القديم!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">سرعة دوران التداول (Velocity):</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                {economy.metrics.velocityOfMoney}
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                تضاعف سرعة التداول يعني ازدهار الإنتاج والمعاش دون بذل مشقة عبثية.
              </p>
            </div>
          </div>

          {/* Live Recent Trade Event Ticker */}
          {economy.lastTradeEvents && economy.lastTradeEvents.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">
                مباشر من السوق: آخر محاولات التبادل بين القرويين:
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
                {economy.lastTradeEvents.slice(-3).reverse().map((ev, i) => (
                  <div
                    key={i}
                    className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                      ev.success
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span>{ev.success ? '✅' : '❌'} {ev.reason}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {ev.mode === 'barter' ? 'مقايضة' : 'نقد'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Player Dashboard (when mode === 'player') */}
      {mode === 'player' && playerAgent && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">لوحة تحكم التاجر (أنت)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    رائد أعمال واعد
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  ترتيبك المالي:{' '}
                  <strong className="text-purple-300 font-bold font-mono">
                    المركز {economy.metrics.playerRank ?? 1}
                  </strong>{' '}
                  من أصل 60 تاجراً
                </div>
              </div>
            </div>

            {/* Current Wealth & Gain */}
            <div className="flex items-baseline gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">رصيدك الحالي:</span>
              <span className="text-2xl font-black font-mono text-purple-300">
                {Math.round(playerAgent.wealth)} د
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  playerAgent.wealth >= 100 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {playerAgent.wealth >= 100
                  ? `+${Math.round(playerAgent.wealth - 100)}%`
                  : `${Math.round(playerAgent.wealth - 100)}%`}
              </span>
            </div>
          </div>

          {/* Strategy Selection + Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">استراتيجية التداول:</span>
              {(
                [
                  { id: 'saver', label: '🛡️ ادخار آمن (0%)' },
                  { id: 'cautious', label: '⚖️ حذر (5%)' },
                  { id: 'balanced', label: '📈 متوازن (15%)' },
                  { id: 'aggressive', label: '⚡ مجازف (30%)' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleStrategyChange(st.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    (playerAgent.strategy ?? 'balanced') === st.id
                      ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-sm shadow-purple-900'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Voluntary Zakat button */}
            <button
              onClick={handleVoluntaryZakat}
              disabled={playerAgent.wealth < 15}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-semibold disabled:opacity-30 cursor-pointer hover:scale-105 active:scale-95"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>تبرع بزكاة طوعية (10 د لدعم الفقراء)</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Missions HUD (when mode === 'missions') */}
      {mode === 'missions' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>غرفة التحديات والمهمات الاقتصادية</span>
            </div>

            {/* Mission Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {ECONOMY_MISSIONS.map((m) => {
                const isCompleted = completedMissions[m.id];
                const isActive = activeMissionId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMissionId(m.id);
                      playSoftClick();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-900/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Award className="w-3.5 h-3.5 opacity-60" />
                    )}
                    <span>{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mission Details & Progress */}
          {(() => {
            const currentMission = ECONOMY_MISSIONS.find((m) => m.id === activeMissionId);
            if (!currentMission) return null;
            return (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{currentMission.title}</span>
                      <span className="text-xs font-normal text-emerald-400">
                        {currentMission.subtitle}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentMission.description}
                    </p>
                  </div>

                  {missionEval.status === 'completed' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 animate-bounce">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentMission.badge} (تم الإنجاز بنجاح!)</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>الهدف: {currentMission.targetDescription}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {missionEval.progressPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${missionEval.progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    {missionEval.feedback}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. Controls Bar (Play/Pause, Step, Speed) */}
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

        {/* Quick Institutional summary toggles in footer */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleToggleInstitution('baytAlMal')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              economy.institutions.baytAlMal
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>بيت المال (2.5%)</span>
          </button>

          <button
            onClick={() => handleToggleInstitution('interestBank')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              economy.institutions.interestBank
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>بنك الفائدة (5%)</span>
          </button>
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

      {/* 6. Socratic Debating Personas: Ibn Khaldun vs Adam Smith */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>المناظرة السقراطية الحية: قراءة السوق من كبار المفكرين</span>
          </div>

          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <button
              onClick={() => {
                setPersonaTab('both');
                playSoftClick();
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                personaTab === 'both' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              كلاهما معاً ⚖️
            </button>
            <button
              onClick={() => {
                setPersonaTab('ibn_khaldun');
                playSoftClick();
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                personaTab === 'ibn_khaldun' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              ابن خلدون 📜
            </button>
            <button
              onClick={() => {
                setPersonaTab('adam_smith');
                playSoftClick();
              }}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                personaTab === 'adam_smith' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              آدم سميث 🎩
            </button>
          </div>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ibn Khaldun */}
          {(personaTab === 'both' || personaTab === 'ibn_khaldun') && (
            <div
              className={`p-3.5 rounded-xl border text-right space-y-2 transition-all ${
                personaDialogue.ibnKhaldun.tone === 'warning'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : personaDialogue.ibnKhaldun.tone === 'celebrating'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{personaDialogue.ibnKhaldun.avatar}</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    {personaDialogue.ibnKhaldun.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    {personaDialogue.ibnKhaldun.title}
                  </span>
                </div>
              </div>
              <blockquote className="text-xs text-amber-100/90 italic border-r-2 border-amber-400/60 pr-2 leading-relaxed">
                «{personaDialogue.ibnKhaldun.quote}»
              </blockquote>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {personaDialogue.ibnKhaldun.observation}
              </p>
            </div>
          )}

          {/* Adam Smith */}
          {(personaTab === 'both' || personaTab === 'adam_smith') && (
            <div
              className={`p-3.5 rounded-xl border text-right space-y-2 transition-all ${
                personaDialogue.adamSmith.tone === 'warning'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : personaDialogue.adamSmith.tone === 'celebrating'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{personaDialogue.adamSmith.avatar}</span>
                <div>
                  <h4 className="text-xs font-bold text-cyan-300">
                    {personaDialogue.adamSmith.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    {personaDialogue.adamSmith.title}
                  </span>
                </div>
              </div>
              <blockquote className="text-xs text-cyan-100/90 italic border-r-2 border-cyan-400/60 pr-2 leading-relaxed">
                «{personaDialogue.adamSmith.quote}»
              </blockquote>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {personaDialogue.adamSmith.observation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Canvas Arena + Live HUD + Agent Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* The 60-Villager Arena */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-[#060911] shadow-2xl flex flex-col justify-between">
          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ساحة القرية (انقر على أي قروي لفحصه)</span>
          </div>

          <canvas
            ref={canvasRef}
            width={700}
            height={380}
            onClick={handleCanvasClick}
            className="w-full h-[320px] sm:h-[360px] block cursor-pointer"
          />

          {/* Arena Footer Bar */}
          <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                <span>البنفسجي: أنت</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span>الذهبي: ثري</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>الأحمر: مهدد</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-dashed border-rose-400 inline-block"></span>
                <span>محيط متقطع: مدين للبنك</span>
              </span>
            </div>
            <span className="font-mono text-amber-300 font-bold">
              الجولة رقم: {economy.round}
            </span>
          </div>
        </div>

        {/* Live Metrics HUD & Selected Agent Inspector */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Selected Agent Inspector Card */}
          {selectedAgent && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 text-right space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                    {selectedAgent.isPlayer ? '👑' : '👤'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {selectedAgent.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {selectedAgent.role}
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md block ${
                      selectedAgent.wealth >= 100
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {Math.round(selectedAgent.wealth)} دينار
                  </span>
                  {(selectedAgent.debt || 0) > 0 && (
                    <span className="text-[10px] text-rose-400 font-mono block mt-0.5">
                      دين: -{Math.round(selectedAgent.debt!)} د
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">عدد الصفقات:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {selectedAgent.tradesCount} صفقة
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">نسبة الفوز:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {selectedAgent.tradesCount > 0
                      ? `${Math.round(((selectedAgent.winsCount || 0) / selectedAgent.tradesCount) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Metric 1: Gini Index */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-right space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">مقياس التفاوت (معامل جيني):</span>
              <span className="font-mono text-[10px] text-slate-500">0.0 تساوٍ ← 1.0 احتكار</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-300">
                {economy.metrics.giniCoefficient}
              </span>
              <span className="text-xs text-slate-400">
                {economy.metrics.giniCoefficient < 0.35
                  ? '(توازن عادل ومثالي)'
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

          {/* Metric 2: Village Debt & Velocity */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">ديون القرية المتراكمة</span>
              <span
                className={`text-xl font-bold font-mono ${
                  economy.metrics.totalDebt > 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {economy.metrics.totalDebt} د
              </span>
              <span className="text-[9px] text-slate-500 block">
                {economy.metrics.bankruptCount} قروي معسر
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">سرعة تداول الذهب</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">
                {economy.metrics.velocityOfMoney}x
              </span>
              <span className="text-[9px] text-slate-500 block">معدل دوران السيولة</span>
            </div>
          </div>

          {/* Educational Takeaway Box */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الخلاصة الفطرية للمؤسسات:</span>
            </div>
            <p className="text-[11px] leading-relaxed font-light text-slate-300">
              الفائدة المركبة تسحب السيولة التداولية وتحولها لديون افتراضية خانقة، بينما <strong className="text-white">بيت المال الفطري والزكاة</strong> يعيدان إطلاق السيولة في عروق التجارة الحقيقية ليظل الجميع قادراً على البيع والشراء.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
