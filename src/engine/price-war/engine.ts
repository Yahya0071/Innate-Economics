/**
 * Simulation Engine for Chapter 6: The Price War & Nash Equilibrium (لغز حرب الأسعار وتوازن ناش)
 * 
 * Implements pure deterministic game-theoretic modeling of Bertrand price competition.
 * ZERO DOM / ZERO React dependencies. Pure TypeScript.
 */

import {
  type RivalStrategy,
  type PriceWarRound,
  type PriceWarState,
} from './types';
import {
  DEFAULT_UNIT_COST,
  DEFAULT_MARKET_DEMAND,
  PRICE_NORMAL,
  PRICE_DISCOUNT,
  PRICE_MARGINAL_COST,
  MARKET_SHARE_EQUAL,
  MARKET_SHARE_UNDERCUT_WINNER,
  MARKET_SHARE_UNDERCUT_LOSER,
} from './constants';

export * from './types';
export * from './constants';

/**
 * Determine the rival's pricing decision based on their chosen behavioral strategy and round history.
 */
export function decideRivalPrice(
  strategy: RivalStrategy,
  history: PriceWarRound[],
  unitCost: number = DEFAULT_UNIT_COST
): number {
  switch (strategy) {
    case 'tit-for-tat': {
      // In the initial round, start cooperatively at the fair normal price
      if (!history || history.length === 0) {
        return PRICE_NORMAL;
      }
      // In subsequent rounds, mimic the player's immediate previous price
      const lastRound = history[history.length - 1];
      return lastRound.playerPrice;
    }

    case 'always-defect': {
      // Always slash price down to marginal cost to capture market share
      return unitCost;
    }

    case 'conditional-cooperate': {
      // Cooperate at normal price until the player betrays by undercutting, then defect forever
      const hasPlayerDefected = history.some((r) => r.playerPrice < PRICE_NORMAL);
      return hasPlayerDefected ? unitCost : PRICE_NORMAL;
    }

    case 'random': {
      const options = [PRICE_NORMAL, PRICE_DISCOUNT, unitCost];
      const index = Math.floor(Math.random() * options.length);
      return options[index];
    }

    default:
      return PRICE_NORMAL;
  }
}

/**
 * Pure function: Calculate the outcome of a single pricing round.
 * 
 * Rules:
 * - Equal prices divide the market equally (50% each).
 * - Undercutting captures 80% of the market share, leaving the higher priced seller with 20%.
 * - Selling at or below unit cost yields zero or negative profits (Nash Equilibrium at cost).
 */
export function calculateRound(
  playerPrice: number,
  rivalStrategy: RivalStrategy,
  history: PriceWarRound[] = [],
  unitCost: number = DEFAULT_UNIT_COST,
  marketDemand: number = DEFAULT_MARKET_DEMAND
): PriceWarRound {
  const rivalPrice = decideRivalPrice(rivalStrategy, history, unitCost);
  const roundNumber = history.length + 1;

  let playerMarketShare = MARKET_SHARE_EQUAL;
  let rivalMarketShare = MARKET_SHARE_EQUAL;
  let narrativeNote = '';

  if (playerPrice === rivalPrice) {
    playerMarketShare = MARKET_SHARE_EQUAL;
    rivalMarketShare = MARKET_SHARE_EQUAL;

    if (playerPrice === unitCost) {
      narrativeNote = 'تطابق السعران عند التكلفة الصرفة (توازن ناش). بيع كامل المخزون بدون درهم ربح واحد!';
    } else if (playerPrice >= PRICE_NORMAL) {
      narrativeNote = 'تطابق السعران عند السعر العادل. تقاسم السوق بأمان وتحقيق أعلى ربح مشترك ممكن.';
    } else {
      narrativeNote = 'تطابق السعران المخفضان. تقاسم السوق بهوامش ربحية ضئيلة ومجهدة.';
    }
  } else if (playerPrice < rivalPrice) {
    // Player undercuts rival
    playerMarketShare = MARKET_SHARE_UNDERCUT_WINNER;
    rivalMarketShare = MARKET_SHARE_UNDERCUT_LOSER;

    if (playerPrice === unitCost) {
      narrativeNote = 'كسرتَ السعر إلى التكلفة واستحوذت على 80% من الزبائن، لكن هامش ربحك تبخر كلياً!';
    } else {
      narrativeNote = `خفضتَ سعرك (${playerPrice} مقابل ${rivalPrice}) فاستحوذت على 80% من السوق وغنمت حصة الأسد.`;
    }
  } else {
    // Rival undercuts player
    playerMarketShare = MARKET_SHARE_UNDERCUT_LOSER;
    rivalMarketShare = MARKET_SHARE_UNDERCUT_WINNER;

    narrativeNote = `باغتك المنافس بسعر أرخص (${rivalPrice} مقابل ${playerPrice}) فاستلب 80% من زبائنك وانحسرت مبيعاتك.`;
  }

  const playerSales = Math.round(marketDemand * playerMarketShare);
  const rivalSales = Math.round(marketDemand * rivalMarketShare);

  const playerProfit = Math.round((playerPrice - unitCost) * playerSales * 100) / 100;
  const rivalProfit = Math.round((rivalPrice - unitCost) * rivalSales * 100) / 100;

  return {
    roundNumber,
    playerPrice,
    rivalPrice,
    unitCost,
    marketDemand,
    playerMarketShare,
    rivalMarketShare,
    playerSales,
    rivalSales,
    playerProfit,
    rivalProfit,
    narrativeNote,
  };
}

/**
 * Initialize an empty multi-round game session.
 */
export function createInitialPriceWarState(
  rivalStrategy: RivalStrategy = 'tit-for-tat',
  unitCost: number = DEFAULT_UNIT_COST,
  marketDemand: number = DEFAULT_MARKET_DEMAND
): PriceWarState {
  return {
    currentRound: 1,
    rivalStrategy,
    unitCost,
    marketDemand,
    totalPlayerProfit: 0,
    totalRivalProfit: 0,
    history: [],
  };
}

/**
 * Advance the simulation state with a new player pricing decision.
 */
export function playNextRound(
  state: PriceWarState,
  playerPrice: number
): PriceWarState {
  const round = calculateRound(
    playerPrice,
    state.rivalStrategy,
    state.history,
    state.unitCost,
    state.marketDemand
  );

  return {
    ...state,
    currentRound: state.currentRound + 1,
    totalPlayerProfit: Math.round((state.totalPlayerProfit + round.playerProfit) * 100) / 100,
    totalRivalProfit: Math.round((state.totalRivalProfit + round.rivalProfit) * 100) / 100,
    history: [...state.history, round],
  };
}
