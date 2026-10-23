import type { EconomyConfig } from './types';

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  numAgents: 60,
  initialWealthPerAgent: 100,
  tradeFraction: 0.15, // 15% exchange fraction
  taxRate: 0.025, // 2.5% Zakat / redistribution rate
  taxIntervalRounds: 5,
};

export const MAX_ROUNDS_HISTORY = 200;
