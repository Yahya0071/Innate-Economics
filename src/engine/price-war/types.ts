/**
 * Types and structures for Chapter 6: The Price War & Nash Equilibrium (لغز حرب الأسعار وتوازن ناش).
 * ZERO DOM / ZERO UI dependencies. Pure TypeScript.
 */

export type RivalStrategy =
  | 'tit-for-tat'
  | 'always-defect'
  | 'conditional-cooperate'
  | 'random';

export interface PriceWarRound {
  roundNumber: number;
  playerPrice: number;
  rivalPrice: number;
  unitCost: number;
  marketDemand: number;
  playerMarketShare: number;   // 0.0 to 1.0 (e.g. 0.5 or 0.8 or 0.2)
  rivalMarketShare: number;    // 0.0 to 1.0
  playerSales: number;         // عدد المشترين لدى اللاعب
  rivalSales: number;          // عدد المشترين لدى المنافس
  playerProfit: number;        // الربح الصافي للاعب
  rivalProfit: number;         // الربح الصافي للمنافس
  narrativeNote: string;       // تعليق بيداغوجي فطري على النتيجة
}

export interface PriceWarState {
  currentRound: number;
  rivalStrategy: RivalStrategy;
  unitCost: number;
  marketDemand: number;
  totalPlayerProfit: number;
  totalRivalProfit: number;
  history: PriceWarRound[];
}
