export interface Agent {
  id: number;
  wealth: number;
  tradesCount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface EconomyConfig {
  numAgents: number;
  initialWealthPerAgent: number;
  tradeFraction: number; // percentage of wealth wagered in trade (e.g. 0.2 = 20%)
  taxRate: number; // redistribution tax rate (e.g. 0.025 for 2.5% Zakat)
  taxIntervalRounds: number; // every N rounds
}

export interface EconomyMetrics {
  totalWealth: number;
  giniCoefficient: number; // 0 (perfect equality) to 1 (extreme inequality)
  top20Share: number; // percentage of total wealth held by top 20%
  bottom50Share: number; // percentage held by bottom 50%
  medianWealth: number;
  maxWealth: number;
  minWealth: number;
}

export interface EconomyState {
  agents: Agent[];
  round: number;
  config: EconomyConfig;
  metrics: EconomyMetrics;
  history: {
    round: number;
    gini: number;
    top20Share: number;
  }[];
}
