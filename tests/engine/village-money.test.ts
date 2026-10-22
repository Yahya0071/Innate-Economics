import { describe, it, expect } from 'vitest';
import {
  createInitialVillageState,
  calculateEquilibriumPrice,
  evaluateMarketDay,
  expandOvens,
  injectGold,
  setPriceControl,
} from '@/engine/village-money/engine';

describe('Village Money & Inflation Engine (جزيرة الرغيف والذهب)', () => {
  describe('Mathematical Invariant 1: Monetary Neutrality & Price Proportionality (حيادية النقود)', () => {
    it('doubling gold supply doubles equilibrium price when production is fixed', () => {
      const p1 = calculateEquilibriumPrice(20, 20);
      const p2 = calculateEquilibriumPrice(40, 20);
      const p3 = calculateEquilibriumPrice(60, 20);

      expect(p1).toBe(1.0);
      expect(p2).toBe(2.0);
      expect(p3).toBe(3.0);
      expect(p2 / p1).toBe(2.0);
      expect(p3 / p1).toBe(3.0);
    });

    it('purchasing power per coin is the exact inverse of price level', () => {
      const stateNormal = createInitialVillageState(); // 20 gold, 20 bread
      const outcomeNormal = evaluateMarketDay(stateNormal);

      const stateInflated = injectGold(stateNormal, 40); // 60 gold, 20 bread
      const outcomeInflated = evaluateMarketDay(stateInflated);

      expect(outcomeNormal.purchasingPowerPerCoin).toBe(1.0);
      expect(outcomeInflated.purchasingPowerPerCoin).toBeCloseTo(0.333, 2);
    });
  });

  describe('Mathematical Invariant 2: Real Wealth vs Nominal Wealth (الثروة الحقيقية)', () => {
    it('expanding oven capacity doubles real output and reduces price', () => {
      const state = injectGold(createInitialVillageState(), 40); // 60 gold, 20 bread
      const outcomeBefore = evaluateMarketDay(state);
      expect(outcomeBefore.equilibriumPrice).toBe(3.0);

      const expanded = expandOvens(state); // 60 gold, 40 bread
      const outcomeAfter = evaluateMarketDay(expanded);

      expect(expanded.dailyBreadCapacity).toBe(40);
      expect(outcomeAfter.breadSupplied).toBe(40);
      expect(outcomeAfter.equilibriumPrice).toBe(1.5);
    });
  });

  describe('Systemic Invariant 3: Price Ceilings & Black Market Emergence (التسعير الجبري)', () => {
    it('creates no shortage or black market if ceiling is above or equal to equilibrium', () => {
      const state = createInitialVillageState();
      const stateWithHighCeiling = setPriceControl(state, 1.5);
      const outcome = evaluateMarketDay(stateWithHighCeiling);

      expect(outcome.isBlackMarketActive).toBe(false);
      expect(outcome.shortage).toBe(0);
      expect(outcome.blackMarketPrice).toBeNull();
    });

    it('triggers queue exhaustion, hunger, and black market when ceiling is below equilibrium', () => {
      // 60 gold in village, 20 bread -> Equilibrium is 3.0 dinars
      const inflatedState = injectGold(createInitialVillageState(), 40);
      // Government freezes price at 1.0 dinar
      const cappedState = setPriceControl(inflatedState, 1.0);
      const outcome = evaluateMarketDay(cappedState);

      expect(outcome.isBlackMarketActive).toBe(true);
      expect(outcome.shortage).toBeGreaterThan(0);
      expect(outcome.hungryPeopleCount).toBeGreaterThan(10);
      expect(outcome.blackMarketPrice).toBeGreaterThan(outcome.equilibriumPrice);
    });
  });

  describe('Pure State Determinism', () => {
    it('evaluates identical outcomes for identical states', () => {
      const state = createInitialVillageState();
      const o1 = evaluateMarketDay(state);
      const o2 = evaluateMarketDay(state);

      expect(o1).toEqual(o2);
    });
  });
});
