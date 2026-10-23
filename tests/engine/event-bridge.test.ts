import { describe, it, expect } from 'vitest';
import {
  calculateFisherPriceLevel,
  emitEconomicEvent,
  subscribeEconomicEvent,
} from '../../src/engine/core/eventBridge';

describe('Economic Event Bridge & Fisher Equation', () => {
  it('correctly calculates Fisher Price Level P = (M * V) / Q', () => {
    // 10 coins, V=1.2, Q=12 => (10 * 1.2) / 12 = 1.0 dinar
    const normal = calculateFisherPriceLevel(10, 1.2, 12);
    expect(normal.priceLevel).toBe(1.0);
    expect(normal.purchasingPower).toBe(1.0);

    // Doubling money supply to 20 coins doubles prices to 2.0 (inflation)
    const inflated = calculateFisherPriceLevel(20, 1.2, 12);
    expect(inflated.priceLevel).toBe(2.0);
    expect(inflated.purchasingPower).toBe(0.5);

    // Quadrupling money supply to 40 coins quadruples prices to 4.0
    const hyper = calculateFisherPriceLevel(40, 1.2, 12);
    expect(hyper.priceLevel).toBe(4.0);
    expect(hyper.purchasingPower).toBe(0.25);
  });

  it('safely handles zero or negative inputs with sensible minimum bounds', () => {
    const edge = calculateFisherPriceLevel(0, 0, 0);
    expect(edge.priceLevel).toBeGreaterThan(0);
    expect(edge.purchasingPower).toBeGreaterThan(0);
  });
});
