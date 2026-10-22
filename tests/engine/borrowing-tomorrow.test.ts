import { describe, it, expect } from 'vitest';
import {
  createInitialFarmerState,
  calculateSeasonalYield,
  applyLoanDecision,
  advanceCreditSeason,
} from '@/engine/borrowing-tomorrow/engine';

describe('Credit, Debt & Capital Investment Engine (استعارة طاقة الغد)', () => {
  describe('Mathematical Invariant 1: Capital Deepening (أثر الاستثمار في رأس المال)', () => {
    it('baseline yield is 10 bags without well and 30 bags when well is 100% completed', () => {
      expect(calculateSeasonalYield(10, 0)).toBe(10);
      expect(calculateSeasonalYield(10, 50)).toBe(17.5);
      expect(calculateSeasonalYield(10, 100)).toBe(30);
    });
  });

  describe('Systemic Invariant 2: The Triumph of Productive Debt (نجاح الدين الإنتاجي)', () => {
    it('borrowing 20 bags for well construction triples output, repays debt with interest, and preserves surplus', () => {
      let state = createInitialFarmerState();

      // Season 1: Borrow 20 bags and direct 100% to well
      state = applyLoanDecision(state, { productiveBags: 20, consumptionBags: 0 });
      expect(state.wellCompleted).toBe(true);

      // Run 4 seasons until repayment
      for (let s = 1; s <= 4; s++) {
        state = advanceCreditSeason(state);
      }

      // Debt is fully paid (0 remaining) and farmer is not bankrupt
      expect(state.debtPrincipal).toBe(0);
      expect(state.isBankrupt).toBe(false);
      // Wheat stock has substantial wealth surplus left
      expect(state.wheatStock).toBeGreaterThan(30);
    });
  });

  describe('Systemic Invariant 3: The Trap of Consumer Debt (مأساة الدين الاستهلاكي)', () => {
    it('borrowing 20 bags for consumption leaves output at baseline and leads to insolvency at due date', () => {
      let state = createInitialFarmerState();

      // Season 1: Borrow 20 bags and spend 100% on consumption/feast
      state = applyLoanDecision(state, { productiveBags: 0, consumptionBags: 20 });
      expect(state.wellCompleted).toBe(false);
      expect(state.wellProgress).toBe(0);

      // Run seasons until due date (Season 4)
      for (let s = 1; s <= 4; s++) {
        state = advanceCreditSeason(state);
      }

      // Cannot cover 25 bags due from 2 bags surplus/year -> Insolvency
      expect(state.isBankrupt).toBe(true);
      expect(state.wheatStock).toBe(0);
    });
  });

  describe('Status Quo Path: Zero Debt, Zero Growth (مسار الكفاف)', () => {
    it('rejecting loan avoids debt but keeps yield flat at 10 bags forever', () => {
      let state = createInitialFarmerState();
      state = applyLoanDecision(state, { productiveBags: 0, consumptionBags: 0 });

      for (let s = 1; s <= 4; s++) {
        state = advanceCreditSeason(state);
      }

      expect(state.isBankrupt).toBe(false);
      expect(state.wellCompleted).toBe(false);
      expect(state.wheatStock).toBe(10); // 2 initial + 4 seasons * 2 surplus
    });
  });
});
