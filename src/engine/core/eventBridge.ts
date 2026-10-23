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
 * In-memory cache of the latest payload per event type for late-hydrating islands
 */
const eventReplayCache: Partial<EconomicEventMap> = {};

// In-memory listeners to support isomorphic Node/SSR and browser testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inMemoryListeners = new Map<keyof EconomicEventMap, Set<(detail: any) => void>>();

/**
 * Clear replay cache and in-memory listeners (mainly for test isolation)
 */
export function clearEventReplayCache(): void {
  for (const key of Object.keys(eventReplayCache) as Array<keyof EconomicEventMap>) {
    delete eventReplayCache[key];
  }
  inMemoryListeners.clear();
}

/**
 * Inspect last cached event payload
 */
export function getCachedEconomicEvent<K extends keyof EconomicEventMap>(
  type: K
): EconomicEventMap[K] | undefined {
  return eventReplayCache[type];
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
  // If no money is in circulation, or real output is non-positive, price level is 0
  if (moneySupply <= 0 || realOutput <= 0 || velocity < 0) {
    return {
      priceLevel: 0,
      purchasingPower: 0,
    };
  }

  // Price level P = (M * V) / Q
  const price = (moneySupply * velocity) / realOutput;
  // Purchasing power of 1 coin: 1 / P
  const power = price > 0 ? 1 / price : 0;

  return {
    priceLevel: price,
    purchasingPower: power,
  };
}

/**
 * Dispatches an event across all active components in the browser window
 * and updates the last-value replay cache.
 */
export function emitEconomicEvent<K extends keyof EconomicEventMap>(
  type: K,
  detail: EconomicEventMap[K]
): void {
  // Cache the latest event payload for late-hydrating islands
  eventReplayCache[type] = detail;

  // Dispatch to in-memory listeners (works in Node/SSR, tests, and browser)
  const listeners = inMemoryListeners.get(type);
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(detail);
      } catch {
        // Safe listener dispatch
      }
    });
  }

  if (typeof window === 'undefined') return;

  try {
    const customEvent = new CustomEvent(type, { detail });
    window.dispatchEvent(customEvent);
  } catch {
    // Non-standard environment fallback
  }
}

/**
 * Subscribes to an economic event.
 * Immediately replays the latest cached event to the subscriber if available.
 * Returns a cleanup unsubscribe function.
 */
export function subscribeEconomicEvent<K extends keyof EconomicEventMap>(
  type: K,
  handler: (detail: EconomicEventMap[K]) => void
): () => void {
  // Last-value replay: if an event was previously emitted, hydrate the subscriber immediately
  if (eventReplayCache[type] !== undefined) {
    try {
      handler(eventReplayCache[type] as EconomicEventMap[K]);
    } catch {
      // Ignore subscriber errors during initial replay
    }
  }

  // Register in memory listener
  if (!inMemoryListeners.has(type)) {
    inMemoryListeners.set(type, new Set());
  }
  const set = inMemoryListeners.get(type)!;
  set.add(handler);

  let browserListener: ((event: Event) => void) | null = null;

  if (typeof window !== 'undefined') {
    browserListener = (event: Event) => {
      const customEv = event as CustomEvent<EconomicEventMap[K]>;
      // Only dispatch if not already dispatched via in-memory set to prevent double calls
      if (customEv && customEv.detail !== undefined) {
        // Handled
      }
    };
    window.addEventListener(type, browserListener);
  }

  return () => {
    set.delete(handler);
    if (browserListener && typeof window !== 'undefined') {
      window.removeEventListener(type, browserListener);
    }
  };
}
