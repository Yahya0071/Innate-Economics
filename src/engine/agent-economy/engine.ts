import type {
  Agent,
  EconomyConfig,
  EconomyMetrics,
  EconomyState,
  EconomyMission,
  PersonaCommentary,
  TradingStrategy,
  InstitutionalAgentsConfig,
  CommodityType,
  CommodityInfo,
  MarketMode,
} from './types';
import { DEFAULT_ECONOMY_CONFIG, MAX_ROUNDS_HISTORY } from './constants';

export const COMMODITIES: Record<CommodityType, CommodityInfo> = {
  wheat: { type: 'wheat', name: 'قمح', icon: '🌾', baseValue: 5 },
  dates: { type: 'dates', name: 'تمر', icon: '🌴', baseValue: 4 },
  cloth: { type: 'cloth', name: 'قماش', icon: '🧵', baseValue: 8 },
  pottery: { type: 'pottery', name: 'فخار', icon: '🏺', baseValue: 6 },
};

export const COMMODITY_KEYS: CommodityType[] = ['wheat', 'dates', 'cloth', 'pottery'];

const VILLAGE_NAMES = [
  'زيد', 'سعيد', 'عمر', 'طارق', 'بلال', 'ياسر', 'سالم', 'سليمان', 'خالد', 'حسان',
  'جعفر', 'إبراهيم', 'حمزة', 'مروان', 'زياد', 'أنس', 'ثابت', 'فيصل', 'صالح', 'قاسم',
  'معاذ', 'أسامة', 'مالك', 'هارون', 'إياس', 'عاصم', 'منصور', 'عدنان', 'براء', 'نوفل',
  'تميم', 'صهيب', 'طلحة', 'حذيفة', 'عمار', 'بشير', 'فهد', 'سهيل', 'حارث', 'نافع',
];

const VILLAGE_ROLES = [
  'تاجر تمور', 'صائغ فضة', 'حرفي فخار', 'مزارع قمح', 'نسّاج صوف',
  'تاجر بهارات', 'حدّاد القرية', 'بائع زيتون', 'صانع جلود', 'تاجر عسل',
  'بنّاء مساكن', 'صانع أواني', 'طحان حبوب', 'راعي مواشي', 'حارس قوافل',
];

export const DEFAULT_INSTITUTIONS: InstitutionalAgentsConfig = {
  baytAlMal: false,
  interestBank: false,
  monopolistGuild: false,
};

/**
 * Initializes an economy with identical wealth distribution across all agents.
 */
export function createInitialEconomy(customConfig?: Partial<EconomyConfig>): EconomyState {
  const config: EconomyConfig = { ...DEFAULT_ECONOMY_CONFIG, ...customConfig };
  const institutions: InstitutionalAgentsConfig = {
    ...DEFAULT_INSTITUTIONS,
    ...config.institutions,
  };
  const agents: Agent[] = [];

  for (let i = 0; i < config.numAgents; i++) {
    // Distribute agents randomly on a 1000x600 virtual arena
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    const isPlayer = config.enablePlayer ? i === 0 : false;
    const produced = COMMODITY_KEYS[i % 4];
    const desired = COMMODITY_KEYS[(i + 1) % 4];

    agents.push({
      id: i,
      wealth: config.initialWealthPerAgent,
      debt: 0,
      inventory: 10,
      commodities: {
        wheat: produced === 'wheat' ? 12 : 0,
        dates: produced === 'dates' ? 12 : 0,
        cloth: produced === 'cloth' ? 12 : 0,
        pottery: produced === 'pottery' ? 12 : 0,
      },
      producedCommodity: produced,
      desiredCommodity: desired,
      tradesCount: 0,
      winsCount: 0,
      x: 100 + Math.random() * 800,
      y: 100 + Math.random() * 400,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      isPlayer,
      name: isPlayer ? 'أنت (التاجر)' : `${VILLAGE_NAMES[i % VILLAGE_NAMES.length]} (${i + 1})`,
      role: isPlayer ? 'رائد أعمال واعد' : VILLAGE_ROLES[i % VILLAGE_ROLES.length],
      strategy: 'balanced',
    });
  }

  const metrics = calculateMetrics(agents, institutions);

  return {
    agents,
    round: 0,
    config,
    metrics,
    institutions,
    marketMode: 'currency',
    history: [
      {
        round: 0,
        gini: metrics.giniCoefficient,
        top20Share: metrics.top20Share,
        totalDebt: 0,
        barterEfficiency: 100,
      },
    ],
  };
}

/**
 * Computes exact Gini coefficient and distribution percentiles.
 * Gini: 0 represents absolute equality, 1 represents maximal inequality.
 */
export function calculateMetrics(
  agents: Agent[],
  institutions: InstitutionalAgentsConfig = DEFAULT_INSTITUTIONS,
  previousMetrics?: Partial<EconomyMetrics>
): EconomyMetrics {
  const n = agents.length;
  if (n === 0) {
    return {
      totalWealth: 0,
      giniCoefficient: 0,
      top20Share: 0,
      bottom50Share: 0,
      medianWealth: 0,
      maxWealth: 0,
      minWealth: 0,
      totalDebt: 0,
      bankVault: 0,
      baytAlMalDistributed: 0,
      bankruptCount: 0,
      velocityOfMoney: 0,
      marketMode: 'currency',
      barterAttempts: 0,
      barterSuccesses: 0,
      barterFailures: 0,
      barterEfficiency: 100,
    };
  }

  const sortedWealth = [...agents.map((a) => a.wealth)].sort((a, b) => a - b);
  const totalWealth = sortedWealth.reduce((sum, w) => sum + w, 0);

  let totalDebt = 0;
  let bankruptCount = 0;
  for (const a of agents) {
    totalDebt += a.debt || 0;
    if (a.wealth < 10) bankruptCount += 1;
  }

  if (totalWealth <= 0) {
    return {
      totalWealth: 0,
      giniCoefficient: 0,
      top20Share: 0,
      bottom50Share: 0,
      medianWealth: 0,
      maxWealth: 0,
      minWealth: 0,
      totalDebt: Math.round(totalDebt * 100) / 100,
      bankVault: previousMetrics?.bankVault || 0,
      baytAlMalDistributed: previousMetrics?.baytAlMalDistributed || 0,
      bankruptCount,
      velocityOfMoney: 0,
      marketMode: previousMetrics?.marketMode || 'currency',
      barterAttempts: previousMetrics?.barterAttempts || 0,
      barterSuccesses: previousMetrics?.barterSuccesses || 0,
      barterFailures: previousMetrics?.barterFailures || 0,
      barterEfficiency: 100,
    };
  }

  // Gini calculation using standard sorted formula:
  // G = (2 * sum(i * w_i)) / (n * sum(w_i)) - (n + 1) / n
  let cumulativeWeightedSum = 0;
  for (let i = 0; i < n; i++) {
    cumulativeWeightedSum += (i + 1) * sortedWealth[i];
  }

  const gini = (2 * cumulativeWeightedSum) / (n * totalWealth) - (n + 1) / n;
  const clampedGini = Math.max(0, Math.min(1, Number(gini.toFixed(4))));

  // Top 20% calculation
  const top20Count = Math.max(1, Math.round(n * 0.2));
  const top20Sum = sortedWealth.slice(n - top20Count).reduce((sum, w) => sum + w, 0);
  const top20Share = Number(((top20Sum / totalWealth) * 100).toFixed(1));

  // Bottom 50% calculation
  const bottom50Count = Math.floor(n * 0.5);
  const bottom50Sum = sortedWealth.slice(0, bottom50Count).reduce((sum, w) => sum + w, 0);
  const bottom50Share = Number(((bottom50Sum / totalWealth) * 100).toFixed(1));

  const medianWealth =
    n % 2 === 0
      ? (sortedWealth[n / 2 - 1] + sortedWealth[n / 2]) / 2
      : sortedWealth[Math.floor(n / 2)];

  // Player metrics
  const playerAgent = agents.find((a) => a.isPlayer);
  let playerRank: number | undefined;
  let playerWealth: number | undefined;

  if (playerAgent) {
    playerWealth = Math.round(playerAgent.wealth * 100) / 100;
    playerRank = agents.filter((a) => a.wealth > playerAgent.wealth).length + 1;
  }

  const totalTrades = agents.reduce((acc, a) => acc + a.tradesCount, 0);
  const velocityOfMoney = Number((totalTrades / Math.max(1, n * 2)).toFixed(2));

  const marketMode = previousMetrics?.marketMode || 'currency';
  const barterAttempts = previousMetrics?.barterAttempts || 0;
  const barterSuccesses = previousMetrics?.barterSuccesses || 0;
  const barterFailures = previousMetrics?.barterFailures || 0;
  const barterEfficiency =
    barterAttempts > 0 ? Math.round((barterSuccesses / barterAttempts) * 100) : 100;

  return {
    totalWealth: Math.round(totalWealth * 100) / 100,
    giniCoefficient: clampedGini,
    top20Share,
    bottom50Share,
    medianWealth: Math.round(medianWealth * 100) / 100,
    maxWealth: Math.round(sortedWealth[n - 1] * 100) / 100,
    minWealth: Math.round(sortedWealth[0] * 100) / 100,
    playerRank,
    playerWealth,
    totalDebt: Math.round(totalDebt * 100) / 100,
    bankVault: Math.round((previousMetrics?.bankVault || 0) * 100) / 100,
    baytAlMalDistributed: Math.round((previousMetrics?.baytAlMalDistributed || 0) * 100) / 100,
    bankruptCount,
    velocityOfMoney,
    marketMode,
    barterAttempts,
    barterSuccesses,
    barterFailures,
    barterEfficiency,
  };
}

function getStrategyMultiplier(strategy?: TradingStrategy): number {
  switch (strategy) {
    case 'saver':
      return 0.1; // Conserves capital, wagers almost nothing
    case 'cautious':
      return 0.5; // Low risk
    case 'aggressive':
      return 1.8; // High stake
    case 'balanced':
    default:
      return 1.0;
  }
}

/**
 * Toggles an institutional agent (Bayt Al-Mal, Interest Bank, Monopolist Guild).
 */
export function toggleInstitution(
  state: EconomyState,
  institution: keyof InstitutionalAgentsConfig,
  forcedState?: boolean
): EconomyState {
  const current = state.institutions?.[institution] ?? false;
  const nextVal = forcedState !== undefined ? forcedState : !current;
  const updatedInstitutions: InstitutionalAgentsConfig = {
    ...(state.institutions || DEFAULT_INSTITUTIONS),
    [institution]: nextVal,
  };

  return {
    ...state,
    institutions: updatedInstitutions,
    metrics: calculateMetrics(state.agents, updatedInstitutions, state.metrics),
  };
}

/**
 * Toggles or sets the market trading mode (currency vs barter).
 */
export function setMarketMode(state: EconomyState, mode: MarketMode): EconomyState {
  return {
    ...state,
    marketMode: mode,
    metrics: calculateMetrics(state.agents, state.institutions, {
      ...state.metrics,
      marketMode: mode,
    }),
  };
}

/**
 * Executes a single step of the economic exchange round with institutional agents.
 */
export function stepEconomyRound(
  state: EconomyState,
  options: {
    enableTax?: boolean;
    tradesCount?: number;
    customRandom?: () => number;
  } = {}
): EconomyState {
  const { enableTax = false, customRandom = Math.random } = options;
  const n = state.agents.length;
  if (n < 2) return state;

  const institutions = state.institutions || DEFAULT_INSTITUTIONS;
  const baytAlMalActive = institutions.baytAlMal || enableTax;
  let bankVault = state.metrics.bankVault || 0;
  let baytAlMalDistributed = state.metrics.baytAlMalDistributed || 0;
  let barterAttempts = state.metrics.barterAttempts || 0;
  let barterSuccesses = state.metrics.barterSuccesses || 0;
  let barterFailures = state.metrics.barterFailures || 0;

  const lastTradeEvents: {
    agentAId: number;
    agentBId: number;
    success: boolean;
    reason: string;
    mode: MarketMode;
  }[] = [];

  const numTrades = options.tradesCount ?? Math.max(1, Math.floor(n / 2));
  // Clone agents to maintain pure immutability
  const updatedAgents: Agent[] = state.agents.map((a) => ({
    ...a,
    debt: a.debt || 0,
    // Update movement in arena
    x: Math.max(20, Math.min(980, a.x + a.vx)),
    y: Math.max(20, Math.min(580, a.y + a.vy)),
    vx: a.x <= 20 || a.x >= 980 ? -a.vx : a.vx,
    vy: a.y <= 20 || a.y >= 580 ? -a.vy : a.vy,
  }));

  // Identify monopolists (top 15% richest) if monopolist guild is active
  const meanWealth = state.metrics.totalWealth / n;
  const monopolyThreshold = meanWealth * 1.6;

  // Perform transactions
  for (let t = 0; t < numTrades; t++) {
    const idxA = Math.floor(customRandom() * n);
    let idxB = Math.floor(customRandom() * n);
    if (idxA === idxB) {
      idxB = (idxB + 1) % n;
    }

    const agentA = updatedAgents[idxA];
    const agentB = updatedAgents[idxB];

    // In Barter mode: check for double coincidence of wants
    if (state.marketMode === 'barter') {
      barterAttempts += 1;
      const aWantsB = agentA.desiredCommodity === agentB.producedCommodity;
      const bWantsA = agentB.desiredCommodity === agentA.producedCommodity;
      const doubleCoincidence = aWantsB && bWantsA;

      if (!doubleCoincidence) {
        barterFailures += 1;
        lastTradeEvents.push({
          agentAId: agentA.id,
          agentBId: agentB.id,
          success: false,
          reason: `فشل المقايضة: تاجر (${agentA.name}) يطلب ${COMMODITIES[agentA.desiredCommodity!].name} بينما الآخر ينتج ${COMMODITIES[agentB.producedCommodity!].name}`,
          mode: 'barter',
        });
        continue; // Friction: Trade rejected because needs don't match!
      } else {
        barterSuccesses += 1;
        lastTradeEvents.push({
          agentAId: agentA.id,
          agentBId: agentB.id,
          success: true,
          reason: `تطابق رغبات مزدوج! تبادل ${COMMODITIES[agentA.producedCommodity!].name} بـ ${COMMODITIES[agentB.producedCommodity!].name}`,
          mode: 'barter',
        });
      }
    } else {
      // In Currency mode: money is universally accepted, trade always attempts
      barterAttempts += 1;
      barterSuccesses += 1;
      lastTradeEvents.push({
        agentAId: agentA.id,
        agentBId: agentB.id,
        success: true,
        reason: 'تبادل نقدي بالدينار (النقود وسيط عالمي مقبول)',
        mode: 'currency',
      });
    }

    const smallerWealth = Math.min(agentA.wealth, agentB.wealth);
    if (smallerWealth < 0.1) continue; // Minimum trading threshold

    // Determine exchange stake factoring in agent strategies
    const stratMultiplier = Math.min(
      getStrategyMultiplier(agentA.strategy),
      getStrategyMultiplier(agentB.strategy)
    );
    const stake = smallerWealth * state.config.tradeFraction * stratMultiplier;

    // Monopoly guild effect: monopolists win 65% of trades against normal agents
    let aWinChance = 0.5;
    if (institutions.monopolistGuild) {
      const aIsMonopolist = agentA.wealth >= monopolyThreshold;
      const bIsMonopolist = agentB.wealth >= monopolyThreshold;
      if (aIsMonopolist && !bIsMonopolist) aWinChance = 0.65;
      else if (!aIsMonopolist && bIsMonopolist) aWinChance = 0.35;
    }

    const aWins = customRandom() < aWinChance;

    if (aWins) {
      agentA.wealth += stake;
      agentB.wealth -= stake;
      agentA.winsCount = (agentA.winsCount || 0) + 1;
    } else {
      agentA.wealth -= stake;
      agentB.wealth += stake;
      agentB.winsCount = (agentB.winsCount || 0) + 1;
    }

    agentA.tradesCount += 1;
    agentB.tradesCount += 1;
  }

  const nextRound = state.round + 1;

  // 1. Institutional Agent: Interest Bank (Lending & Compound Interest)
  if (institutions.interestBank) {
    for (const agent of updatedAgents) {
      // Emergency loan to the impoverished (< 15 gold and debt < 60)
      if (agent.wealth < 15 && (agent.debt || 0) < 60) {
        agent.wealth += 20;
        agent.debt = (agent.debt || 0) + 20;
      }

      // Collect 5% interest on debt every 3 rounds
      if (nextRound % 3 === 0 && (agent.debt || 0) > 0) {
        const interest = (agent.debt || 0) * 0.05;
        if (agent.wealth >= interest) {
          agent.wealth -= interest;
          bankVault += interest;
        } else {
          // Debt spiral: cannot pay interest, interest capitalized into debt
          const unpaid = interest - agent.wealth;
          bankVault += agent.wealth;
          agent.wealth = 0;
          agent.debt = (agent.debt || 0) + unpaid;
        }
      }
    }
  }

  // 2. Institutional Agent: Bayt Al-Mal / Zakat (Universal redistribution & Debt Relief)
  if (baytAlMalActive && nextRound % state.config.taxIntervalRounds === 0) {
    const distributed = applyBaytAlMal(updatedAgents, state.config.taxRate, institutions.interestBank);
    baytAlMalDistributed += distributed;
  }

  // Calculate new metrics
  const newMetrics = calculateMetrics(updatedAgents, institutions, {
    bankVault,
    baytAlMalDistributed,
    marketMode: state.marketMode,
    barterAttempts,
    barterSuccesses,
    barterFailures,
  });

  const updatedHistory = [
    ...state.history,
    {
      round: nextRound,
      gini: newMetrics.giniCoefficient,
      top20Share: newMetrics.top20Share,
      totalDebt: newMetrics.totalDebt,
      barterEfficiency: newMetrics.barterEfficiency,
    },
  ];

  if (updatedHistory.length > MAX_ROUNDS_HISTORY) {
    updatedHistory.shift();
  }

  return {
    agents: updatedAgents,
    round: nextRound,
    config: state.config,
    metrics: newMetrics,
    institutions,
    marketMode: state.marketMode,
    lastTradeEvents,
    history: updatedHistory,
    activeMissionId: state.activeMissionId,
  };
}

/**
 * Bayt Al-Mal collects surplus Zakat from wealthier agents and redistributes it:
 * 1. Debt relief for insolvent villagers (الغارمين) if bank is active.
 * 2. Equal subsistence dividend to all villagers.
 * Strictly preserves total wealth!
 */
export function applyBaytAlMal(
  agents: Agent[],
  taxRate: number,
  interestBankActive = false
): number {
  const n = agents.length;
  if (n === 0 || taxRate <= 0) return 0;

  const totalWealth = agents.reduce((sum, a) => sum + a.wealth, 0);
  const meanWealth = totalWealth / n;
  let collected = 0;

  for (const agent of agents) {
    if (agent.wealth > meanWealth) {
      const taxable = agent.wealth - meanWealth;
      const tax = taxable * taxRate;
      agent.wealth -= tax;
      collected += tax;
    }
  }

  if (collected <= 0) return 0;

  let remaining = collected;
  // Debt relief for insolvent villagers (الغارمين)
  if (interestBankActive) {
    const indebted = agents.filter((a) => (a.debt || 0) > 0);
    if (indebted.length > 0) {
      const debtFund = collected * 0.4;
      const reliefPerDebtor = debtFund / indebted.length;
      for (const debtor of indebted) {
        const debtPaid = Math.min(debtor.debt || 0, reliefPerDebtor);
        debtor.debt = Math.max(0, (debtor.debt || 0) - debtPaid);
        remaining -= debtPaid;
      }
    }
  }

  // Distribute remaining equally to all agents
  const dividend = remaining / n;
  for (const agent of agents) {
    agent.wealth += dividend;
  }

  return Math.round(collected * 100) / 100;
}

/**
 * Backward-compatible alias for legacy imports
 */
export function applyRedistribution(agents: Agent[], taxRate: number): void {
  applyBaytAlMal(agents, taxRate, false);
}

/**
 * Allows the player agent to voluntarily contribute Zakat/charity to poorest villagers.
 */
export function playerVoluntaryZakat(state: EconomyState, amount = 10): EconomyState {
  const player = state.agents.find((a) => a.isPlayer);
  if (!player || player.wealth < amount + 5) return state;

  const updatedAgents = state.agents.map((a) => ({ ...a }));
  const updatedPlayer = updatedAgents.find((a) => a.isPlayer)!;
  updatedPlayer.wealth -= amount;

  // Distribute to the bottom 50% poorest villagers
  const sorted = [...updatedAgents].sort((a, b) => a.wealth - b.wealth);
  const poorestCount = Math.max(1, Math.floor(updatedAgents.length * 0.5));
  const share = amount / poorestCount;

  for (let i = 0; i < poorestCount; i++) {
    const target = updatedAgents.find((a) => a.id === sorted[i].id);
    if (target && !target.isPlayer) {
      target.wealth += share;
    }
  }

  return {
    ...state,
    agents: updatedAgents,
    metrics: calculateMetrics(updatedAgents),
  };
}

/**
 * Changes player trading strategy (saver, cautious, balanced, aggressive).
 */
export function setPlayerStrategy(state: EconomyState, strategy: TradingStrategy): EconomyState {
  const updatedAgents = state.agents.map((a) =>
    a.isPlayer ? { ...a, strategy } : a
  );
  return {
    ...state,
    agents: updatedAgents,
  };
}

/**
 * Educational missions list.
 */
export const ECONOMY_MISSIONS: EconomyMission[] = [
  {
    id: 'mercantile_rise',
    title: 'المهمة 1: التاجر الرشيد 📈',
    subtitle: 'ضاعف ثروتك دون سحق السوق',
    badge: 'وسام التاجر الرشيد 🎖️',
    icon: 'TrendingUp',
    description: 'ابدأ بـ 100 دينار وارفع ثروتك إلى 140 ديناراً أو أكثر بالتجارة، مع الحفاظ على استقرار القرية دون أن يتجاوز مؤشر التفاوت (جيني) 0.55.',
    targetDescription: 'ثروتك ≥ 140 د | معامل جيني ≤ 0.55',
    minPlayerWealth: 140,
    targetGiniMax: 0.55,
    maxRounds: 60,
    lesson: 'النجاح المالي الفردي الحقيقي لا يتحقق بسحق الشركاء، بل بازدهار التبادل وبقاء المشترين قادرين على الدفع.',
  },
  {
    id: 'curbing_monopoly',
    title: 'المهمة 2: إنقاذ الواحة من الاحتكار ⚖️',
    subtitle: 'أعد التوازن العادل للجميع',
    badge: 'وسام حامي العدالة 🛡️',
    icon: 'Scale',
    description: 'انحدرت القرية نحو احتكار شديد. فعّل زكاة الثروة (2.5%) وخفّض معامل جيني إلى أقل من 0.35 لإنعاش الفقراء وتنشيط السوق.',
    targetDescription: 'معامل جيني ≤ 0.35 | لا يوجد قروي مفلس (< 20 د)',
    targetGiniMax: 0.35,
    maxRounds: 50,
    lesson: 'إعادة التدوير المنتظمة للفوائض ليست منّة، بل صمام أمان فيزيائي يحمي السوق من توقف دورة السيولة.',
  },
  {
    id: 'shared_prosperity',
    title: 'المهمة 3: الرخاء المشترك والمبادرة 🌟',
    subtitle: 'قُد القرية نحو ازدهار متوازن',
    badge: 'وسام رائد العمران 👑',
    icon: 'Sparkles',
    description: 'حافظ على ثروتك فوق 120 ديناراً واستخدم المبادرات الطوعية حتى ينخفض مؤشر جيني تحت 0.38 وتتجاوز صفقاتك 15 صفقة.',
    targetDescription: 'ثروتك ≥ 120 د | جيني ≤ 0.38 | صفقاتك ≥ 15',
    minPlayerWealth: 120,
    targetGiniMax: 0.38,
    maxRounds: 70,
    lesson: 'العمران الفطري يبلغ ذروته عندما تتكامل حرية التجارة مع المسؤولية الأخلاقية الطوعية للمجتمع.',
  },
  {
    id: 'break_debt_trap',
    title: 'المهمة 4: فك فخ الديون والربا 🏦',
    subtitle: 'أنقذ القرية من هيمنة الفائدة',
    badge: 'وسام محرر الغارمين 🕊️',
    icon: 'ShieldCheck',
    description: 'راقب كيف يغرق بنك الفائدة القرية في الديون وتتلاشى السيولة، ثم تصدَّ للأزمة بتفعيل بيت المال لتصفير ديون الغارمين وإعادة الاستقرار (جيني ≤ 0.38).',
    targetDescription: 'ديون القرية = 0 | معامل جيني ≤ 0.38',
    targetGiniMax: 0.38,
    maxRounds: 80,
    lesson: 'الربا يراكم الديون الوهمية ويسحب السيولة من أيدي العامة، بينما يحرر بيت المال المدينين ويعيد ضخ السيولة في عروق التجارة الحقيقية.',
  },
  {
    id: 'barter_vs_money',
    title: 'المهمة 5: لغز المقايضة وسحر النقد 🌾🪙',
    subtitle: 'حل أزمة تطابق الرغبات المزدوج',
    badge: 'وسام مخترع النقد 🪙',
    icon: 'Coins',
    description: 'شغّل وضع المقايضة الصلبة وراقب كيف تعجز الصفقات عن الإتمام لعدم تطابق الرغبات، ثم حوّل السوق إلى النقد (الدينار) وحقق كفاءة تبادل تتجاوز 90% وسرعة دوران تفوق 1.0.',
    targetDescription: 'وضع النقد مفعل | كفاءة التبادل ≥ 90% | سرعة الدوران ≥ 1.0',
    maxRounds: 60,
    lesson: 'النقود هي أعظم تقنية تواصلية عرفتها البشرية؛ ألغت عجز المقايضة وحولت الطاقة الإنتاجية إلى رخاء فوري.',
  },
];

/**
 * Evaluates current mission status.
 */
export function evaluateMission(
  state: EconomyState,
  missionId: string
): { status: 'in_progress' | 'completed' | 'failed'; progressPct: number; feedback: string } {
  const mission = ECONOMY_MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return { status: 'in_progress', progressPct: 0, feedback: 'اختر مهمة للبدء' };
  }

  const { metrics, round } = state;
  const player = state.agents.find((a) => a.isPlayer);
  const pWealth = player ? Math.round(player.wealth * 100) / 100 : (metrics.playerWealth ?? 100);

  if (mission.id === 'mercantile_rise') {
    const wealthProgress = Math.min(100, Math.max(0, ((pWealth - 100) / 40) * 100));
    const giniOk = metrics.giniCoefficient <= (mission.targetGiniMax ?? 0.55);
    const wealthOk = pWealth >= (mission.minPlayerWealth ?? 140);

    if (wealthOk && giniOk) {
      return {
        status: 'completed',
        progressPct: 100,
        feedback: `تهانينا! حققت ثروة ${pWealth} د وحافظت على عدالة السوق (جيني: ${metrics.giniCoefficient}).`,
      };
    }
    if (round >= (mission.maxRounds ?? 60)) {
      return {
        status: 'failed',
        progressPct: Math.round(wealthProgress),
        feedback: `انتهت الـ 60 جولة؛ ثروتك الحالية ${pWealth} د. أعد المحاولة!`,
      };
    }
    return {
      status: 'in_progress',
      progressPct: Math.round(wealthProgress),
      feedback: `ثروتك الآن: ${pWealth} د (المطلوب: 140 د) | جيني: ${metrics.giniCoefficient}`,
    };
  }

  if (mission.id === 'curbing_monopoly') {
    const targetGini = mission.targetGiniMax ?? 0.35;
    const progress = Math.min(100, Math.max(0, ((0.7 - metrics.giniCoefficient) / (0.7 - targetGini)) * 100));
    const noExtremePoverty = metrics.minWealth >= 20;

    if (metrics.giniCoefficient <= targetGini && noExtremePoverty) {
      return {
        status: 'completed',
        progressPct: 100,
        feedback: `إنجاز بطولي! انخفض معامل جيني إلى ${metrics.giniCoefficient} وانتعش صغار التجار!`,
      };
    }
    if (round >= (mission.maxRounds ?? 50)) {
      return {
        status: 'failed',
        progressPct: Math.round(progress),
        feedback: `انتهى الوقت وما يزال التفاوت مرتفعاً (${metrics.giniCoefficient}). فعّل الزكاة من الجولة الأولى!`,
      };
    }
    return {
      status: 'in_progress',
      progressPct: Math.round(progress),
      feedback: `جيني الحالي: ${metrics.giniCoefficient} (المطلوب: ≤ ${targetGini})`,
    };
  }

  if (mission.id === 'break_debt_trap') {
    const debtOk = metrics.totalDebt === 0;
    const giniOk = metrics.giniCoefficient <= 0.38;
    const debtRatio = Math.min(100, Math.max(0, Math.round(((100 - metrics.totalDebt) / 100) * 50)));
    const progress = debtOk && giniOk ? 100 : Math.min(95, debtRatio + (giniOk ? 35 : 15));

    if (debtOk && giniOk && round >= 10) {
      return {
        status: 'completed',
        progressPct: 100,
        feedback: 'انتصار عظيم! تخلصت القرية من قيود الديون واستعادت توازنها العادل بتدوير بيت المال.',
      };
    }
    if (round >= (mission.maxRounds ?? 80)) {
      return {
        status: 'failed',
        progressPct: progress,
        feedback: `انتهت الـ 80 جولة وما تزال ديون القرية (${metrics.totalDebt} د) تضغط على الأهالي.`,
      };
    }
    return {
      status: 'in_progress',
      progressPct: progress,
      feedback: `ديون القرية: ${metrics.totalDebt} د (المطلوب: 0 د) | جيني: ${metrics.giniCoefficient}`,
    };
  }

  if (mission.id === 'barter_vs_money') {
    const isCurrency = state.marketMode === 'currency';
    const effOk = metrics.barterEfficiency >= 90;
    const velocityOk = metrics.velocityOfMoney >= 1.0;
    const progress = isCurrency
      ? Math.min(100, Math.round(metrics.barterEfficiency * 0.6 + metrics.velocityOfMoney * 40))
      : 25;

    if (isCurrency && effOk && velocityOk && round >= 8) {
      return {
        status: 'completed',
        progressPct: 100,
        feedback: `رائع جداً! كفاءة التبادل قفزت إلى ${metrics.barterEfficiency}% وسرعة الدوران ${metrics.velocityOfMoney}! النقد حرر طاقات القرية!`,
      };
    }
    if (round >= (mission.maxRounds ?? 60)) {
      return {
        status: 'failed',
        progressPct: Math.round(progress),
        feedback: `انتهت الـ 60 جولة دون تحقيق الشروط (الكفاءة: ${metrics.barterEfficiency}%, السرعة: ${metrics.velocityOfMoney}). حول السوق إلى النقد وشاهد الفرق!`,
      };
    }
    return {
      status: 'in_progress',
      progressPct: Math.round(progress),
      feedback: isCurrency
        ? `وضع النقد مفعل! الكفاءة: ${metrics.barterEfficiency}% (المطلوب ≥ 90%) | السرعة: ${metrics.velocityOfMoney}`
        : `أنت في وضع المقايضة: الكفاءة الحالية منخفضة (${metrics.barterEfficiency}%) بسبب فشل تطابق الرغبات! حول إلى النقد لإتمام المهمة.`,
    };
  }

  // shared_prosperity
  const trades = player?.tradesCount ?? 0;
  const targetGini = mission.targetGiniMax ?? 0.38;
  const wealthOk = pWealth >= 120;
  const giniOk = metrics.giniCoefficient <= targetGini;
  const tradesOk = trades >= 15;

  if (wealthOk && giniOk && tradesOk) {
    return {
      status: 'completed',
      progressPct: 100,
      feedback: `عمران متكامل! ازدهرت ثروتك (${pWealth} د) مع استقرار السوق بالكامل (${metrics.giniCoefficient}).`,
    };
  }
  if (round >= (mission.maxRounds ?? 70)) {
    return {
      status: 'failed',
      progressPct: Math.round((trades / 15) * 50),
      feedback: 'انتهت الجولات قبل تحقيق كامل شروط الرخاء المشترك.',
    };
  }
  return {
    status: 'in_progress',
    progressPct: Math.min(95, Math.round(((trades / 15) * 40) + ((pWealth / 120) * 30))),
    feedback: `ثروتك: ${pWealth} د | جيني: ${metrics.giniCoefficient} | صفقاتك: ${trades}/15`,
  };
}

/**
 * Generates dynamic Socratic dialogue from Ibn Khaldun & Adam Smith.
 */
export function getPersonaCommentary(
  state: EconomyState,
  enableTax: boolean
): { ibnKhaldun: PersonaCommentary; adamSmith: PersonaCommentary } {
  const { metrics, round, institutions } = state;
  const gini = metrics.giniCoefficient;
  const player = state.agents.find((a) => a.isPlayer);
  const pWealth = player ? Math.round(player.wealth * 100) / 100 : (metrics.playerWealth ?? 100);

  let khaldunQuote = 'اعلم أن العدل أساس العمران، وأن تراكم المال دون دوران مفسدة للأسواق.';
  let khaldunObservation = 'القرية في حالة توازن بدائي؛ النفوس مطمئنة والتبادل يجري برضا الطرفين.';
  let khaldunAdvice = 'راقب حركة الذهب؛ فإن انحاز إلى قلة، فبادر بإصلاح الخلل قبل خراب المعاش.';
  let khaldunTone: 'neutral' | 'warning' | 'celebrating' = 'neutral';

  let smithQuote = 'ليس من جود الجزار نتوقع طعامنا، بل من اهتمامه بمصلحته الذاتية.';
  let smithObservation = 'الصفقات الحرة تكافئ المبادرة، والتجار يبحثون تلقائياً عما ينفعهم.';
  let smithAdvice = 'دع قوى السوق تتحرك بحرية ليتحدد السعر الطبيعي دون قيود تعسفية.';
  let smithTone: 'neutral' | 'warning' | 'celebrating' = 'neutral';

  // React to Barter friction
  if (state.marketMode === 'barter') {
    khaldunQuote = 'المقايضة دون نقد وسيط هي تجارة المشقة؛ حبس الله الذهب والفضة ليكونا قواماً للتبادل بين أرباب الصنائع!';
    khaldunObservation = `كفاءة التجارة انهارت إلى ${metrics.barterEfficiency}% بسبب امتناع التبادل كلما اختلفت حاجات التجار.`;
    khaldunAdvice = 'أدخل النقد (الدنانير) فوراً لتتخلص القرية من مشقة اشتراط تطابق الرغبات المزدوج.';
    khaldunTone = 'warning';

    smithQuote = 'النقود هي العجلة الكبرى للتداول؛ المقايضة الصلبة تشل تقسيم العمل لأن صانع الفخار لا يجد دائماً من يريده ويعطيه قمحاً في اللحظة نفسها!';
    smithObservation = `معظم الصفقات تفشل (${metrics.barterFailures} صفقة فاشلة) لغياب وسيط التبادل المشترك.`;
    smithAdvice = 'حوّل السوق إلى النقد لتشهد كيف تضاعف السيولة سرعة التبادل وازدهار الجميع.';
    smithTone = 'warning';
  } else if (institutions?.interestBank && metrics.totalDebt > 40) {
    khaldunQuote = 'الربا مفسدة تدمر حافز العمل وتسحب الذهب من أيدي المنتجين إلى خزائن المرابين دون بذل كدٍّ حقيقي!';
    khaldunObservation = `ديون القرية تراكمت لتصل إلى ${metrics.totalDebt} دينار، وبات القرويون يعملون لسداد الفوائد لا لتحسين معاشهم.`;
    khaldunAdvice = 'أوقف سحب الفائدة فوراً، ودع بيت المال يسقط ديون الغارمين قبل تفكك عصبية الواحة.';
    khaldunTone = 'warning';

    smithQuote = 'الديون الاستهلاكية الربوية آفة تمتص رأس المال الحقيقي ولا تضيف أي إنتاج جديد للسوق.';
    smithObservation = `البنك راكم ${metrics.bankVault} د كفوائد أرباح، مما سبب جفاف السيولة النقدية من أيدي صغار المستهلكين.`;
    smithAdvice = 'الائتمان المنتج ييسر التجارة، أما الفائدة المركبة الاستهلاكية فتدمر القوة الشرائية العامة.';
    smithTone = 'warning';
  } else if (institutions?.monopolistGuild) {
    khaldunQuote = 'الاحتكار في أقوات الناس ومرافقهم مظلمة كبرى تفضي إلى غلاء الأسعار وفساد الأسواق.';
    khaldunObservation = 'نقابة الاحتكار توجه الأرباح قسراً لكبار التجار وتمنع التوازن الطبيعي للمبادلات.';
    khaldunAdvice = 'اكسر تكتل الاحتكار وافتح أبواب التجارة الحرة للجميع لتعود المنافسة العادلة.';
    khaldunTone = 'warning';

    smithQuote = 'نادراً ما يجتمع أصحاب المهنة الواحدة حتى للمرح إلا وتنتهي محادثتهم بمؤامرة لرفع الأسعار ضد العامة!';
    smithObservation = 'الاحتكار يلغي روح المنافسة الحرة؛ اليد الخفية تحتاج لحرية الدخول والخروج من السوق.';
    smithAdvice = 'لا تسمح لأي نقابة أو تكتل باحتكار طرق التجارة أو التلاعب بالأسعار.';
    smithTone = 'warning';
  } else if (gini > 0.58) {
    khaldunQuote = 'الظلم مؤذن بخراب العمران! انقطعت السيولة عن العامة وتكدست في خزائن بضعة تجار.';
    khaldunObservation = `تحذير شديد: 20% فقط من التجار يملكون ${metrics.top20Share}% من كل ذهب القرية! هذا مقدمة لكساد عظيم.`;
    khaldunAdvice = 'لا حل إلا بضخ الحياة في شرايين السوق؛ فعّل زكاة الثروة لإنقاذ القرويين المهددين بالجوع.';
    khaldunTone = 'warning';

    smithQuote = 'الاحتكار الشديد عدو المنافسة الحرة؛ اليد الخفية تعجز عندما يعجز 80% من الناس عن الشراء!';
    smithObservation = `أغنى قروي يملك ${metrics.maxWealth} د بينما أفقرهم لديه ${metrics.minWealth} د فقط؛ اختل ميزان العرض والطلب.`;
    smithAdvice = 'عندما يفقد المستهلك قدرته على الدفع، يتضرر حتى التاجر المحتكر لغياب المشترين.';
    smithTone = 'warning';
  } else if (enableTax || institutions?.baytAlMal) {
    khaldunQuote = 'هذا هو الميزان الفطري؛ مساهمة الزكاة الطفيفة ترد على الضعفاء قوتهم وتديم عصبية المجتمع.';
    khaldunObservation = `بيت المال كبح التفاوت (جيني: ${gini})، وانظر كيف استعادت الدوائر الصغيرة عافيتها الشرائية!`;
    khaldunAdvice = 'استمر في رعاية هذا التوازن، فالرخاء المشترك أدوم من ثراء الاحتكار الزائل.';
    khaldunTone = 'celebrating';

    smithQuote = 'إذا كانت هذه المساهمة تحمي السوق من شلل السيولة وتحافظ على قاعدة المستهلكين، فهي حكمة اقتصادية.';
    smithObservation = `السوق يستمر بالدوران دون توقف؛ الفقراء ينفقون ما نالوه فوراً فتتضاعف سرعة تداول الذهب (${metrics.velocityOfMoney}x).`;
    smithAdvice = 'المهم ألا ترتفع نسبة الاقتطاع إلى حد يثبط عزيمة التجار المنتجين.';
    smithTone = 'celebrating';
  } else if (round === 0) {
    khaldunObservation = 'الجميع يبدأون سواسية بـ 100 دينار؛ لنرَ كيف ستفرز الرياضيات فوارق الطبقات.';
    smithObservation = 'سوق حر بكر ومكتمل المنافسة؛ لا احتكار ولا امتيازات مسبقة لأحد.';
  } else if (pWealth > 130) {
    khaldunObservation = `أراك تاجراً حاذقاً (ثروتك ${pWealth} د)؛ لكن تذكر أن أعظم التجارة ما صاحبها نفع للضعفاء.`;
    smithObservation = `استراتيجيتك تؤتي ثمارها بامتياز (المركز ${metrics.playerRank ?? 1} في القرية)؛ هذا هو حافز الربح المشروع.`;
  }

  return {
    ibnKhaldun: {
      speaker: 'ibn_khaldun',
      name: 'ابن خلدون',
      title: 'مؤسس علم العمران البشري والاقتصاد الفطري',
      avatar: '📜',
      quote: khaldunQuote,
      observation: khaldunObservation,
      advice: khaldunAdvice,
      tone: khaldunTone,
    },
    adamSmith: {
      speaker: 'adam_smith',
      name: 'آدم سميث',
      title: 'فيلسوف حرية السوق وثروة الأمم',
      avatar: '⚖️',
      quote: smithQuote,
      observation: smithObservation,
      advice: smithAdvice,
      tone: smithTone,
    },
  };
}

