import { describe, it, expect } from 'vitest';
import {
  createInitialPastureState,
  calculateSheepYield,
  evaluateSeason,
} from '@/engine/common-pasture/engine';

describe('Common Pasture & Tragedy of the Commons Engine (لغز المرعى المشترك)', () => {
  describe('Mathematical Invariant 1: Carrying Capacity & Yield Concavity', () => {
    it('yield is maximum when total sheep is within sustainable capacity (<= 10)', () => {
      const yield10 = calculateSheepYield(10, 100);
      expect(yield10).toBe(10.0);
    });

    it('yield strictly degrades as herd size exceeds carrying capacity', () => {
      const y10 = calculateSheepYield(10, 100);
      const y15 = calculateSheepYield(15, 100);
      const y20 = calculateSheepYield(20, 100);
      const y25 = calculateSheepYield(25, 100);

      expect(y10).toBeGreaterThan(y15);
      expect(y15).toBeGreaterThan(y20);
      expect(y20).toBeGreaterThan(y25);
    });

    it('yield drops to zero if pasture is desertified (health < 15%)', () => {
      const starvedYield = calculateSheepYield(10, 10);
      expect(starvedYield).toBe(0);
    });
  });

  describe('Systemic Invariant 2: The Tragedy of Open Access (مأساة المشاع المفتوح)', () => {
    it('shows that multiple seasons of overgrazing deplete the commons into desertification', () => {
      let state = createInitialPastureState();

      // Overgraze continuously with 6 player sheep and reactive crowd
      for (let s = 1; s <= 4; s++) {
        const { nextState } = evaluateSeason(state, 6, 'open-access');
        state = nextState;
      }

      expect(state.pastureHealth).toBeLessThan(50);
      expect(state.history.length).toBe(4);
    });
  });

  describe('Governance Invariant 3: Community Treaty Sustainability (ميثاق أوستروم)', () => {
    it('strictly restrains herd size to sustainable limits and preserves 100% pasture health', () => {
      let state = createInitialPastureState();

      // Even if player attempts 8 sheep, treaty restricts to sustainable quota 2
      for (let s = 1; s <= 3; s++) {
        const { nextState, outcome } = evaluateSeason(state, 8, 'community-treaty');
        state = nextState;
        expect(outcome.totalSheep).toBe(10);
        expect(outcome.yieldPerSheep).toBe(10.0);
      }

      expect(state.pastureHealth).toBe(100);
      expect(state.isDesertified).toBe(false);
    });
  });

  describe('Governance Invariant 4: Private Fences Internalization (تسييج الملكية)', () => {
    it('isolates other shepherds from player overgrazing under private fences', () => {
      const state = createInitialPastureState();
      const { outcome } = evaluateSeason(state, 5, 'private-fences');

      // Others remain at their 2 sheep each
      expect(outcome.totalSheep).toBe(13); // 5 + 4*2
    });
  });
});
