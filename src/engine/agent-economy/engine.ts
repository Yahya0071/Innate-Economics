import type { Agent, EconomyConfig, EconomyMetrics, EconomyState } from './types';
import { DEFAULT_ECONOMY_CONFIG, MAX_ROUNDS_HISTORY } from './constants';

/**
 * Initializes an economy with identical wealth distribution across all agents.
 */
export function createInitialEconomy(customConfig?: Partial<EconomyConfig>): EconomyState {
  const config: EconomyConfig = { ...DEFAULT_ECONOMY_CONFIG, ...customConfig };
  const agents: Agent[] = [];

  for (let i = 0; i < config.numAgents; i++) {
    // Distribute agents randomly on a 1000x600 virtual arena
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    agents.push({
      id: i,
      wealth: config.initialWealthPerAgent,
      tradesCount: 0,
      x: 100 + Math.random() * 800,
      y: 100 + Math.random() * 400,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }

  const metrics = calculateMetrics(agents);

  return {
    agents,
    round: 0,
    config,
    metrics,
    history: [
      {
        round: 0,
        gini: metrics.giniCoefficient,
        top20Share: metrics.top20Share,
      },
    ],
  };
}

/**
 * Computes exact Gini coefficient and distribution percentiles.
 * Gini: 0 represents absolute equality, 1 represents maximal inequality.
 */
export function calculateMetrics(agents: Agent[]): EconomyMetrics {
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
    };
  }

  const sortedWealth = [...agents.map((a) => a.wealth)].sort((a, b) => a - b);
  const totalWealth = sortedWealth.reduce((sum, w) => sum + w, 0);

  if (totalWealth <= 0) {
    return {
      totalWealth: 0,
      giniCoefficient: 0,
      top20Share: 0,
      bottom50Share: 0,
      medianWealth: 0,
      maxWealth: 0,
      minWealth: 0,
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

  return {
    totalWealth: Math.round(totalWealth * 100) / 100,
    giniCoefficient: clampedGini,
    top20Share,
    bottom50Share,
    medianWealth: Math.round(medianWealth * 100) / 100,
    maxWealth: Math.round(sortedWealth[n - 1] * 100) / 100,
    minWealth: Math.round(sortedWealth[0] * 100) / 100,
  };
}

/**
 * Executes a single step of the economic exchange round.
 * Pairs random agents, performs exchange with wealth conservation, and optionally applies redistribution.
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

  const numTrades = options.tradesCount ?? Math.max(1, Math.floor(n / 2));
  // Clone agents to maintain pure immutability
  const updatedAgents: Agent[] = state.agents.map((a) => ({
    ...a,
    // Update movement in arena
    x: Math.max(20, Math.min(980, a.x + a.vx)),
    y: Math.max(20, Math.min(580, a.y + a.vy)),
    vx: a.x <= 20 || a.x >= 980 ? -a.vx : a.vx,
    vy: a.y <= 20 || a.y >= 580 ? -a.vy : a.vy,
  }));

  // Perform random pair transactions (Yard-Sale model)
  for (let t = 0; t < numTrades; t++) {
    const idxA = Math.floor(customRandom() * n);
    let idxB = Math.floor(customRandom() * n);
    if (idxA === idxB) {
      idxB = (idxB + 1) % n;
    }

    const agentA = updatedAgents[idxA];
    const agentB = updatedAgents[idxB];

    // Determine exchange stake: percentage of smaller agent's wealth
    const smallerWealth = Math.min(agentA.wealth, agentB.wealth);
    if (smallerWealth < 0.1) continue; // Minimum trading threshold

    const stake = smallerWealth * state.config.tradeFraction;
    const aWins = customRandom() < 0.5;

    if (aWins) {
      agentA.wealth += stake;
      agentB.wealth -= stake;
    } else {
      agentA.wealth -= stake;
      agentB.wealth += stake;
    }

    agentA.tradesCount += 1;
    agentB.tradesCount += 1;
  }

  const nextRound = state.round + 1;

  // Apply wealth tax & universal redistribution if enabled and round interval matches
  if (enableTax && nextRound % state.config.taxIntervalRounds === 0) {
    applyRedistribution(updatedAgents, state.config.taxRate);
  }

  // Calculate new metrics
  const newMetrics = calculateMetrics(updatedAgents);

  const updatedHistory = [
    ...state.history,
    {
      round: nextRound,
      gini: newMetrics.giniCoefficient,
      top20Share: newMetrics.top20Share,
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
    history: updatedHistory,
  };
}

/**
 * Applies proportional wealth contribution from wealthier agents and redistributes
 * equally as a dividend to all agents (e.g. Zakat model).
 * Strictly preserves total wealth!
 */
export function applyRedistribution(agents: Agent[], taxRate: number): void {
  const n = agents.length;
  if (n === 0 || taxRate <= 0) return;

  const totalWealth = agents.reduce((sum, a) => sum + a.wealth, 0);
  const meanWealth = totalWealth / n;

  let collectedTax = 0;

  for (const agent of agents) {
    // Only tax wealth that exceeds the mean subsistence level
    if (agent.wealth > meanWealth) {
      const taxableSurplus = agent.wealth - meanWealth;
      const tax = taxableSurplus * taxRate;
      agent.wealth -= tax;
      collectedTax += tax;
    }
  }

  // Redistribute collected amount equally to all agents
  const dividendPerAgent = collectedTax / n;
  for (const agent of agents) {
    agent.wealth += dividendPerAgent;
  }
}
