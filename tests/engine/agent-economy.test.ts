import { describe, it, expect } from 'vitest';
import {
  createInitialEconomy,
  calculateMetrics,
  stepEconomyRound,
  applyRedistribution,
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
});
