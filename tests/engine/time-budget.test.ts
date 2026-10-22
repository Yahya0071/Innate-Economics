import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  validateAllocation,
  determineToolTier,
  calculateHarvest,
  simulateDay,
} from '@/engine/time-budget/engine';
import { calculateMarginalWorkYield } from '@/engine/core/math';
import { TOTAL_WAKING_HOURS } from '@/engine/time-budget/constants';

describe('Time Budget Pure Engine (ميزانية نبضات اليوم)', () => {
  describe('Mathematical Invariant 1: Conservation of Hours (قيد الـ 16 ساعة)', () => {
    it('accepts exact 16 hours allocation', () => {
      const result = validateAllocation({ workHours: 8, toolHours: 4, restHours: 4 });
      expect(result.valid).toBe(true);
    });

    it('rejects allocations with sum less than 16', () => {
      const result = validateAllocation({ workHours: 5, toolHours: 5, restHours: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('16');
    });

    it('rejects allocations with sum greater than 16', () => {
      const result = validateAllocation({ workHours: 10, toolHours: 5, restHours: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('16');
    });

    it('rejects negative hours', () => {
      const result = validateAllocation({ workHours: -2, toolHours: 10, restHours: 8 });
      expect(result.valid).toBe(false);
    });
  });

  describe('Mathematical Invariant 2: Diminishing Marginal Returns (تناقص العائد الحدي)', () => {
    it('ensures marginal yield strictly decreases with work duration', () => {
      const yieldHour2 = calculateMarginalWorkYield(2);
      const yieldHour6 = calculateMarginalWorkYield(6);
      const yieldHour10 = calculateMarginalWorkYield(10);
      const yieldHour14 = calculateMarginalWorkYield(14);

      expect(yieldHour2).toBeGreaterThan(yieldHour6);
      expect(yieldHour6).toBeGreaterThan(yieldHour10);
      expect(yieldHour10).toBeGreaterThan(yieldHour14);
    });

    it('yield from first 4 hours is higher than yield from last 4 hours (hours 13-16)', () => {
      const harvest4h = calculateHarvest(4, 100, 0);
      const harvest8h = calculateHarvest(8, 100, 0);
      const harvest12h = calculateHarvest(12, 100, 0);
      const harvest16h = calculateHarvest(16, 100, 0);

      const marginal1 = harvest4h;
      const marginal2 = harvest8h - harvest4h;
      const marginal3 = harvest12h - harvest8h;
      const marginal4 = harvest16h - harvest12h;

      expect(marginal1).toBeGreaterThan(marginal2);
      expect(marginal2).toBeGreaterThan(marginal3);
      expect(marginal3).toBeGreaterThan(marginal4);
    });
  });

  describe('Mathematical Invariant 3: Capital Accumulation & Tool Monotonicity (تراكم رأس المال)', () => {
    it('advances tool tiers correctly according to accumulated investment', () => {
      expect(determineToolTier(0).tier).toBe(0);
      expect(determineToolTier(7.9).tier).toBe(0);
      expect(determineToolTier(8).tier).toBe(1);
      expect(determineToolTier(21.9).tier).toBe(1);
      expect(determineToolTier(22).tier).toBe(2);
      expect(determineToolTier(42).tier).toBe(3);
    });

    it('higher tool tiers strictly multiply productivity under identical conditions', () => {
      const yieldTier0 = calculateHarvest(6, 100, 0);
      const yieldTier1 = calculateHarvest(6, 100, 1);
      const yieldTier2 = calculateHarvest(6, 100, 2);
      const yieldTier3 = calculateHarvest(6, 100, 3);

      expect(yieldTier1).toBeGreaterThan(yieldTier0);
      expect(yieldTier2).toBeGreaterThan(yieldTier1);
      expect(yieldTier3).toBeGreaterThan(yieldTier2);
    });
  });

  describe('Biological Invariant 4: Energy Dynamics & Non-Negative Bounds', () => {
    it('clamps energy between 10 and 100 during heavy exhaustion or rest', () => {
      const state = createInitialState();
      // Overwork day
      const exhausted = simulateDay(state, { workHours: 16, toolHours: 0, restHours: 0 });
      expect(exhausted.energy).toBeGreaterThanOrEqual(10);
      expect(exhausted.energy).toBeLessThan(state.energy);

      // Full rest day
      const rested = simulateDay(exhausted, { workHours: 0, toolHours: 0, restHours: 16 });
      expect(rested.energy).toBeGreaterThan(exhausted.energy);
      expect(rested.energy).toBeLessThanOrEqual(100);
    });
  });

  describe('Determinism & Pure State Transition (الحتمية الرياضية)', () => {
    it('produces identical states given identical inputs', () => {
      const state = createInitialState();
      const alloc = { workHours: 6, toolHours: 4, restHours: 6 };

      const run1 = simulateDay(state, alloc);
      const run2 = simulateDay(state, alloc);

      expect(run1).toEqual(run2);
    });

    it('correctly tracks starvation if food stock and harvest fail to cover requirement', () => {
      const state = {
        ...createInitialState(),
        foodStock: 0,
      };
      // Zero work means zero harvest, leading to starvation penalty
      const next = simulateDay(state, { workHours: 0, toolHours: 8, restHours: 8 });
      expect(next.history[0].status).toBe('starving');
      expect(next.foodStock).toBe(0);
    });
  });
});
