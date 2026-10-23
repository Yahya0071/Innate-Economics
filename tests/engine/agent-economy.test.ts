import { describe, it, expect } from 'vitest';
import {
  createInitialEconomy,
  calculateMetrics,
  stepEconomyRound,
  applyRedistribution,
  applyBaytAlMal,
  toggleInstitution,
  playerVoluntaryZakat,
  evaluateMission,
  getPersonaCommentary,
  setMarketMode,
} from '../../src/engine/agent-economy/engine';

describe('Agent-Based Economy Simulation Engine', () => {
  it('initializes economy with equal wealth and zero Gini coefficient', () => {
    const economy = createInitialEconomy({ numAgents: 50, initialWealthPerAgent: 100 });
    expect(economy.agents.length).toBe(50);
    expect(economy.metrics.totalWealth).toBe(5000);
    expect(economy.metrics.giniCoefficient).toBe(0);
    expect(economy.metrics.top20Share).toBe(20);
    expect(economy.metrics.bottom50Share).toBe(50);
  });

  it('strictly conserves total wealth across trading rounds', () => {
    let economy = createInitialEconomy({ numAgents: 30, initialWealthPerAgent: 100 });
    const initialTotalWealth = economy.metrics.totalWealth;

    for (let r = 0; r < 25; r++) {
      economy = stepEconomyRound(economy);
    }

    expect(Math.round(economy.metrics.totalWealth)).toBe(initialTotalWealth);
  });

  it('strictly conserves total wealth during redistribution tax', () => {
    const economy = createInitialEconomy({ numAgents: 20, initialWealthPerAgent: 100 });
    // Manually create an uneven distribution
    economy.agents[0].wealth = 1000;
    economy.agents[1].wealth = 500;
    for (let i = 2; i < 20; i++) {
      economy.agents[i].wealth = 25;
    }

    const totalBefore = economy.agents.reduce((sum, a) => sum + a.wealth, 0);
    applyRedistribution(economy.agents, 0.05);
    const totalAfter = economy.agents.reduce((sum, a) => sum + a.wealth, 0);

    expect(Math.round(totalAfter)).toBe(Math.round(totalBefore));
    // Verify that the poorest agents received a dividend
    expect(economy.agents[5].wealth).toBeGreaterThan(25);
  });

  it('emergence of inequality: unregulated trading causes Gini and Top 20% share to rise', () => {
    let economy = createInitialEconomy({
      numAgents: 40,
      initialWealthPerAgent: 100,
      tradeFraction: 0.2,
    });

    // Run 100 unregulated trading steps
    for (let r = 0; r < 100; r++) {
      economy = stepEconomyRound(economy, { enableTax: false });
    }

    // Gini must be higher than 0
    expect(economy.metrics.giniCoefficient).toBeGreaterThan(0.2);
    // Top 20% must hold more than their initial 20%
    expect(economy.metrics.top20Share).toBeGreaterThan(25);
  });

  it('redistribution dampens the emergence of extreme inequality', () => {
    let unconstrained = createInitialEconomy({
      numAgents: 40,
      initialWealthPerAgent: 100,
      tradeFraction: 0.2,
    });
    let taxed = createInitialEconomy({
      numAgents: 40,
      initialWealthPerAgent: 100,
      tradeFraction: 0.2,
      taxRate: 0.05,
      taxIntervalRounds: 1,
    });

    // Pseudo-random deterministic seed simulation
    let seed = 12345;
    const deterministicRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let r = 0; r < 50; r++) {
      unconstrained = stepEconomyRound(unconstrained, {
        enableTax: false,
        customRandom: deterministicRandom,
      });
      taxed = stepEconomyRound(taxed, {
        enableTax: true,
        customRandom: deterministicRandom,
      });
    }

    expect(taxed.metrics.giniCoefficient).toBeLessThan(unconstrained.metrics.giniCoefficient);
  });

  it('correctly calculates metrics for an edge-case single rich agent', () => {
    const agents = [
      { id: 0, wealth: 1000, tradesCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
      { id: 1, wealth: 0, tradesCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
      { id: 2, wealth: 0, tradesCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
      { id: 3, wealth: 0, tradesCount: 0, x: 0, y: 0, vx: 0, vy: 0 },
    ];
    const metrics = calculateMetrics(agents);
    expect(metrics.totalWealth).toBe(1000);
    expect(metrics.maxWealth).toBe(1000);
    expect(metrics.minWealth).toBe(0);
    expect(metrics.giniCoefficient).toBeGreaterThan(0.7);
  });

  it('supports player agent initialization and rank calculation', () => {
    const economy = createInitialEconomy({ numAgents: 30, enablePlayer: true });
    const player = economy.agents.find((a) => a.isPlayer);
    expect(player).toBeDefined();
    expect(player?.name).toBe('أنت (التاجر)');
    expect(economy.metrics.playerWealth).toBe(100);
    expect(economy.metrics.playerRank).toBe(1);
  });

  it('allows player to perform voluntary Zakat which enriches the poorest', () => {
    let economy = createInitialEconomy({ numAgents: 20, enablePlayer: true });
    economy.agents[0].wealth = 200;
    // Make one agent poorer to see dividend effect
    economy.agents[19].wealth = 30;
    const poorestBefore = economy.agents[19].wealth;

    // Player donates 20
    const updated = playerVoluntaryZakat(economy, 20);
    expect(updated.agents[0].wealth).toBe(180);
    // Poorest received their dividend share
    const targetAgent = updated.agents.find((a) => a.id === 19);
    expect(targetAgent?.wealth).toBeGreaterThan(poorestBefore);
  });

  it('correctly tracks and evaluates missions', () => {
    const economy = createInitialEconomy({ numAgents: 20, enablePlayer: true });
    const evaluation = evaluateMission(economy, 'mercantile_rise');
    expect(evaluation.status).toBe('in_progress');
    expect(evaluation.progressPct).toBe(0);

    // Simulate winning condition
    economy.agents[0].wealth = 150;
    const wonEvaluation = evaluateMission(economy, 'mercantile_rise');
    expect(wonEvaluation.status).toBe('completed');
    expect(wonEvaluation.progressPct).toBe(100);
  });

  it('generates rich Socratic commentary for both Ibn Khaldun and Adam Smith', () => {
    const economy = createInitialEconomy({ numAgents: 20 });
    const dialogue = getPersonaCommentary(economy, false);

    expect(dialogue.ibnKhaldun.name).toBe('ابن خلدون');
    expect(dialogue.adamSmith.name).toBe('آدم سميث');
    expect(dialogue.ibnKhaldun.observation).toBeTruthy();
    expect(dialogue.adamSmith.observation).toBeTruthy();

    // Check high inequality commentary
    economy.agents[0].wealth = 1500;
    for (let i = 1; i < 20; i++) economy.agents[i].wealth = 5;
    const extremeEconomy = { ...economy, metrics: calculateMetrics(economy.agents) };
    const warningDialogue = getPersonaCommentary(extremeEconomy, false);
    expect(warningDialogue.ibnKhaldun.tone).toBe('warning');
    expect(warningDialogue.adamSmith.tone).toBe('warning');
  });

  it('handles institutional agents: Interest Bank introduces debt and Bayt Al-Mal clears it', () => {
    let economy = createInitialEconomy({ numAgents: 20 });
    // Enable interest bank
    economy = toggleInstitution(economy, 'interestBank', true);
    expect(economy.institutions.interestBank).toBe(true);

    // Make an agent impoverished to trigger emergency lending
    economy.agents[1].wealth = 5;
    economy = stepEconomyRound(economy);

    // Agent 1 should have received loan and accumulated debt
    expect(economy.agents[1].debt).toBeGreaterThan(0);
    expect(economy.metrics.totalDebt).toBeGreaterThan(0);

    // Now enable Bayt Al-Mal to provide debt relief
    economy = toggleInstitution(economy, 'baytAlMal', true);
    // Give wealthier agents surplus to collect Zakat from
    economy.agents[0].wealth = 500;
    const debtBefore = economy.metrics.totalDebt;

    // Apply Bayt Al-Mal
    applyBaytAlMal(economy.agents, 0.05, true);
    economy.metrics = calculateMetrics(economy.agents, economy.institutions);

    expect(economy.metrics.totalDebt).toBeLessThan(debtBefore);
  });

  it('demonstrates barter failure (double coincidence of wants problem) versus currency efficiency', () => {
    let economy = createInitialEconomy({ numAgents: 20 });

    // Switch to barter mode
    economy = setMarketMode(economy, 'barter');
    expect(economy.marketMode).toBe('barter');

    // Run 10 rounds of pure barter
    for (let r = 0; r < 10; r++) {
      economy = stepEconomyRound(economy);
    }

    // In barter with 4 commodities and circular needs, most random pairings fail!
    expect(economy.metrics.barterAttempts).toBeGreaterThan(0);
    expect(economy.metrics.barterFailures).toBeGreaterThan(0);
    expect(economy.metrics.barterEfficiency).toBeLessThan(100);

    // Switch to currency mode
    economy = setMarketMode(economy, 'currency');
    const failuresBeforeCurrency = economy.metrics.barterFailures;

    // Run 10 rounds with money
    for (let r = 0; r < 10; r++) {
      economy = stepEconomyRound(economy);
    }

    // In currency mode, no additional barter failures should occur
    expect(economy.metrics.barterFailures).toBe(failuresBeforeCurrency);
    expect(economy.metrics.barterSuccesses).toBeGreaterThan(0);
  });
});


