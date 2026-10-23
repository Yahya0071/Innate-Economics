import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateFisherPriceLevel,
  emitEconomicEvent,
  subscribeEconomicEvent,
  clearEventReplayCache,
} from '../../src/engine/core/eventBridge';

describe('Economic Event Bridge & Fisher Equation', () => {
  beforeEach(() => {
    clearEventReplayCache();
  });

  it('correctly calculates Fisher Price Level P = (M * V) / Q with float precision', () => {
    // 10 coins, V=1.2, Q=12 => (10 * 1.2) / 12 = 1.0 dinar
    const normal = calculateFisherPriceLevel(10, 1.2, 12);
    expect(normal.priceLevel).toBeCloseTo(1.0, 4);
    expect(normal.purchasingPower).toBeCloseTo(1.0, 4);

    // Doubling money supply to 20 coins doubles prices to 2.0 (inflation)
    const inflated = calculateFisherPriceLevel(20, 1.2, 12);
    expect(inflated.priceLevel).toBeCloseTo(2.0, 4);
    expect(inflated.purchasingPower).toBeCloseTo(0.5, 4);

    // Quadrupling money supply to 40 coins quadruples prices to 4.0
    const hyper = calculateFisherPriceLevel(40, 1.2, 12);
    expect(hyper.priceLevel).toBeCloseTo(4.0, 4);
    expect(hyper.purchasingPower).toBeCloseTo(0.25, 4);

    // Fractional case: 15 coins, V=1.5, Q=10 => (15 * 1.5) / 10 = 2.25
    const fractional = calculateFisherPriceLevel(15, 1.5, 10);
    expect(fractional.priceLevel).toBeCloseTo(2.25, 4);
    expect(fractional.purchasingPower).toBeCloseTo(1 / 2.25, 4);
  });

  it('safely handles zero or negative inputs without silent inflation clamping', () => {
    // When M=0, price level is 0 and purchasing power is 0 (no money in economy)
    const zeroMoney = calculateFisherPriceLevel(0, 1.2, 12);
    expect(zeroMoney.priceLevel).toBe(0);
    expect(zeroMoney.purchasingPower).toBe(0);

    // Negative money or zero output bounds safely to 0
    const edge = calculateFisherPriceLevel(-5, 0, 0);
    expect(edge.priceLevel).toBe(0);
    expect(edge.purchasingPower).toBe(0);
  });

  it('caches the last emitted payload and replays it to subsequent subscribers', () => {
    const payload = {
      count: 25,
      delta: 5,
      priceLevel: 2.5,
      purchasingPower: 0.4,
      timestamp: Date.now(),
    };

    // Emit event BEFORE subscriber is registered (e.g. island not yet hydrated)
    emitEconomicEvent('innate:coin-dropped', payload);

    let receivedPayload: typeof payload | null = null;

    // Late-subscribing island should immediately receive the cached payload
    const unsubscribe = subscribeEconomicEvent('innate:coin-dropped', (detail) => {
      receivedPayload = detail;
    });

    expect(receivedPayload).toEqual(payload);

    // Subsequent emit updates subscriber
    const nextPayload = { ...payload, count: 26, delta: 1 };
    emitEconomicEvent('innate:coin-dropped', nextPayload);
    expect(receivedPayload).toEqual(nextPayload);

    // Cleanup unsubscribes
    unsubscribe();
  });
});
