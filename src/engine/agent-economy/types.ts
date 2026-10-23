export type TradingStrategy = 'saver' | 'cautious' | 'balanced' | 'aggressive';

export type CommodityType = 'wheat' | 'dates' | 'cloth' | 'pottery';

export interface CommodityInfo {
  type: CommodityType;
  name: string;
  icon: string;
  baseValue: number;
}

export type MarketMode = 'currency' | 'barter';

export interface InstitutionalAgentsConfig {
  baytAlMal: boolean; // بيت المال الفطري (تدوير الزكاة وضمان الكفاف)
  interestBank: boolean; // بنك الفائدة الربوية (قروض بفوائد مركبة تسحب السيولة)
  monopolistGuild: boolean; // نقابة الاحتكار (تكتل تجاري يضاعف أرباح الأثرياء)
}

export interface Agent {
  id: number;
  wealth: number;
  debt?: number; // ديون مستحقة للبنك
  inventory?: number; // بضائع وسلع مخزنة
  commodities?: Record<CommodityType, number>;
  producedCommodity?: CommodityType;
  desiredCommodity?: CommodityType;
  tradesCount: number;
  winsCount?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer?: boolean;
  name?: string;
  role?: string;
  strategy?: TradingStrategy;
}

export interface EconomyConfig {
  numAgents: number;
  initialWealthPerAgent: number;
  tradeFraction: number; // percentage of wealth wagered in trade (e.g. 0.2 = 20%)
  taxRate: number; // redistribution tax rate (e.g. 0.025 for 2.5% Zakat)
  taxIntervalRounds: number; // every N rounds
  enablePlayer?: boolean;
  institutions?: Partial<InstitutionalAgentsConfig>;
}

export interface EconomyMetrics {
  totalWealth: number;
  giniCoefficient: number; // 0 (perfect equality) to 1 (extreme inequality)
  top20Share: number; // percentage of total wealth held by top 20%
  bottom50Share: number; // percentage held by bottom 50%
  medianWealth: number;
  maxWealth: number;
  minWealth: number;
  playerRank?: number;
  playerWealth?: number;
  totalDebt: number;
  bankVault: number;
  baytAlMalDistributed: number;
  bankruptCount: number;
  velocityOfMoney: number;
  marketMode: MarketMode;
  barterAttempts: number;
  barterSuccesses: number;
  barterFailures: number;
  barterEfficiency: number;
}

export interface EconomyState {
  agents: Agent[];
  round: number;
  config: EconomyConfig;
  metrics: EconomyMetrics;
  institutions: InstitutionalAgentsConfig;
  marketMode: MarketMode;
  lastTradeEvents?: {
    agentAId: number;
    agentBId: number;
    success: boolean;
    reason: string;
    mode: MarketMode;
  }[];
  history: {
    round: number;
    gini: number;
    top20Share: number;
    totalDebt?: number;
    barterEfficiency?: number;
  }[];
  activeMissionId?: string;
}

export interface EconomyMission {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  description: string;
  targetDescription: string;
  targetGiniMax?: number;
  minPlayerWealth?: number;
  maxRounds?: number;
  lesson: string;
}

export interface PersonaCommentary {
  speaker: 'ibn_khaldun' | 'adam_smith';
  name: string;
  title: string;
  avatar: string;
  quote: string;
  observation: string;
  advice: string;
  tone: 'neutral' | 'warning' | 'celebrating';
}

