/**
 * Innate Economics Reactive Event Bridge
 * 
 * Lightweight, zero-dependency in-browser event bus for real-time reactivity
 * between physically separated simulation islands (Astro Islands).
 * Fully safe for SSR (Node.js).
 */

export interface CoinDroppedPayload {
  count: number;
  delta: number;
  priceLevel: number;
  purchasingPower: number;
  timestamp: number;
}

export interface VillageTickPayload {
  round: number;
  totalWealth: number;
  velocity: number;
  gini: number;
  averagePrice: number;
  totalTrades: number;
  marketMode: 'currency' | 'barter';
  totalDebt: number;
}

export interface EquilibriumShiftPayload {
  demandIntercept: number;
  supplyIntercept: number;
  pStar: number;
  qStar: number;
  scenarioName?: string;
}

export interface EconomicEventMap {
  'innate:coin-dropped': CoinDroppedPayload;
  'innate:vault-reset': { timestamp: number };
  'innate:village-tick': VillageTickPayload;
  'innate:equilibrium-shift': EquilibriumShiftPayload;
}

/**
 * Calculates Fisher Quantity Theory of Money: P = (M * V) / Q
 * @param moneySupply (M) Quantity of money in circulation
 * @param velocity (V) Turnover rate (default: 1.2)
 * @param realOutput (Q) Physical goods output (default: 12 units of bread/fish)
 */
export function calculateFisherPriceLevel(
  moneySupply: number,
  velocity: number = 1.2,
  realOutput: number = 12
): { priceLevel: number; purchasingPower: number } {
  const safeM = Math.max(1, moneySupply);
  const safeV = Math.max(0.1, velocity);
  const safeQ = Math.max(1, realOutput);

  // Price level P
  const price = (safeM * safeV) / safeQ;
  const roundedPrice = Math.round(price * 100) / 100;
  // Purchasing power of 1 coin: 1 / P
  const power = Math.round((1 / price) * 100) / 100;

  return {
    priceLevel: roundedPrice,
    purchasingPower: power,
  };
}

/**
 * Dispatches an event across all active components in the browser window
 */
export function emitEconomicEvent<K extends keyof EconomicEventMap>(
  type: K,
  detail: EconomicEventMap[K]
): void {
  if (typeof window === 'undefined') return;

  try {
    const customEvent = new CustomEvent(type, { detail });
    window.dispatchEvent(customEvent);
  } catch {
    // Non-standard environment fallback
  }
}

/**
 * Subscribes to an economic event. Returns a cleanup unsubscribe function.
 */
export function subscribeEconomicEvent<K extends keyof EconomicEventMap>(
  type: K,
  handler: (detail: EconomicEventMap[K]) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEv = event as CustomEvent<EconomicEventMap[K]>;
    if (customEv && customEv.detail !== undefined) {
      handler(customEv.detail);
    }
  };

  window.addEventListener(type, listener);
  return () => {
    window.removeEventListener(type, listener);
  };
}
