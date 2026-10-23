import { describe, it, expect } from 'vitest';
import {
  calculateRound,
  createInitialPriceWarState,
  playNextRound,
  decideRivalPrice,
  DEFAULT_UNIT_COST,
  PRICE_NORMAL,
  PRICE_DISCOUNT,
  PRICE_MARGINAL_COST,
  type PriceWarRound,
} from '@/engine/price-war/engine';

describe('Chapter 6: Price War & Nash Equilibrium Engine (لغز حرب الأسعار وتوازن ناش)', () => {
  describe('Mathematical Invariant 1: Equal Prices Equal Market Split', () => {
    it('عندما يتطابق السعران يُقسم السوق بالتساوي (50% لكل متجر)', () => {
      // Both play normal price 10
      const roundNormal = calculateRound(10, 'tit-for-tat', []);
      expect(roundNormal.playerMarketShare).toBe(0.5);
      expect(roundNormal.rivalMarketShare).toBe(0.5);
      expect(roundNormal.playerSales).toBe(50);
      expect(roundNormal.rivalSales).toBe(50);
      expect(roundNormal.playerProfit).toBe(250); // (10 - 5) * 50
      expect(roundNormal.rivalProfit).toBe(250);

      // Both play discounted price 7
      const fakeHistory: PriceWarRound[] = [
        {
          roundNumber: 1,
          playerPrice: 7,
          rivalPrice: 10,
          unitCost: 5,
          marketDemand: 100,
          playerMarketShare: 0.8,
          rivalMarketShare: 0.2,
          playerSales: 80,
          rivalSales: 20,
          playerProfit: 160,
          rivalProfit: 100,
          narrativeNote: '',
        },
      ];
      // In round 2, tit-for-tat plays 7 because player played 7 in round 1
      const roundDiscount = calculateRound(7, 'tit-for-tat', fakeHistory);
      expect(roundDiscount.rivalPrice).toBe(7);
      expect(roundDiscount.playerMarketShare).toBe(0.5);
      expect(roundDiscount.rivalMarketShare).toBe(0.5);
      expect(roundDiscount.playerSales).toBe(50);
      expect(roundDiscount.rivalSales).toBe(50);
      expect(roundDiscount.playerProfit).toBe(100); // (7 - 5) * 50
      expect(roundDiscount.rivalProfit).toBe(100);
    });
  });

  describe('Mathematical Invariant 2: Undercutting & 80% Market Domination', () => {
    it('عندما يخفض لاعب سعره بفارق درهم (أو أكثر) يستحوذ على 80% من السوق', () => {
      // Player discounts to 7, rival plays 10
      const round1 = calculateRound(7, 'tit-for-tat', []);
      expect(round1.playerPrice).toBe(7);
      expect(round1.rivalPrice).toBe(10);
      expect(round1.playerMarketShare).toBe(0.8);
      expect(round1.rivalMarketShare).toBe(0.2);
      expect(round1.playerSales).toBe(80);
      expect(round1.rivalSales).toBe(20);

      // Player profits: (7 - 5) * 80 = 160
      expect(round1.playerProfit).toBe(160);
      // Rival profits: (10 - 5) * 20 = 100
      expect(round1.rivalProfit).toBe(100);

      // Player lowers by 1 dirham (e.g. 9 vs 10)
      const roundDiff1 = calculateRound(9, 'tit-for-tat', []);
      expect(roundDiff1.playerMarketShare).toBe(0.8);
      expect(roundDiff1.rivalMarketShare).toBe(0.2);
      expect(roundDiff1.playerSales).toBe(80);
      expect(roundDiff1.rivalSales).toBe(20);
      expect(roundDiff1.playerProfit).toBe(320); // (9 - 5) * 80
      expect(roundDiff1.rivalProfit).toBe(100); // (10 - 5) * 20
    });

    it('عندما يكون المنافس أرخص، يستحوذ المنافس على 80% وينحسر اللاعب إلى 20%', () => {
      // Rival always defect (price = 5), player plays 10
      const roundLoss = calculateRound(10, 'always-defect', []);
      expect(roundLoss.playerPrice).toBe(10);
      expect(roundLoss.rivalPrice).toBe(5);
      expect(roundLoss.playerMarketShare).toBe(0.2);
      expect(roundLoss.rivalMarketShare).toBe(0.8);
      expect(roundLoss.playerSales).toBe(20);
      expect(roundLoss.rivalSales).toBe(80);
      expect(roundLoss.playerProfit).toBe(100); // (10 - 5) * 20
      expect(roundLoss.rivalProfit).toBe(0);    // (5 - 5) * 80
    });
  });

  describe('Mathematical Invariant 3: Nash Equilibrium & Zero Profit at Marginal Cost', () => {
    it('حتمية تآكل الأرباح إلى الصفر عند وصول السعرين للتكلفة الحدية (توازن ناش)', () => {
      // Both play at unitCost = 5
      const roundCost = calculateRound(5, 'always-defect', []);
      expect(roundCost.playerPrice).toBe(5);
      expect(roundCost.rivalPrice).toBe(5);
      expect(roundCost.unitCost).toBe(5);
      expect(roundCost.playerMarketShare).toBe(0.5);
      expect(roundCost.rivalMarketShare).toBe(0.5);
      expect(roundCost.playerSales).toBe(50);
      expect(roundCost.rivalSales).toBe(50);

      // (5 - 5) * 50 = 0
      expect(roundCost.playerProfit).toBe(0);
      expect(roundCost.rivalProfit).toBe(0);
      expect(roundCost.narrativeNote).toContain('توازن ناش');
    });

    it('حتى لو كسر اللاعب السعر منفرداً إلى التكلفة واستحوذ على 80%، ربحه يظل صفراً', () => {
      const roundBreak = calculateRound(5, 'tit-for-tat', []);
      expect(roundBreak.playerPrice).toBe(5);
      expect(roundBreak.rivalPrice).toBe(10);
      expect(roundBreak.playerMarketShare).toBe(0.8);
      expect(roundBreak.playerSales).toBe(80);
      expect(roundBreak.playerProfit).toBe(0); // (5 - 5) * 80 = 0
    });
  });

  describe('Behavioral Invariant 4: Tit-for-Tat (الرد بالمثل) Strategy Dynamics', () => {
    it('استجابة خوارزمية "الرد بالمثل" لسلوك اللاعب في الجولة السابقة بدقة', () => {
      // Round 1: Rival starts cooperatively at 10
      const r1Price = decideRivalPrice('tit-for-tat', []);
      expect(r1Price).toBe(10);

      let state = createInitialPriceWarState('tit-for-tat');
      expect(state.currentRound).toBe(1);

      // Round 1: Player defects with price 7
      state = playNextRound(state, 7);
      expect(state.history.length).toBe(1);
      expect(state.history[0].playerPrice).toBe(7);
      expect(state.history[0].rivalPrice).toBe(10);

      // Round 2: Rival should retaliate with price 7!
      const r2Price = decideRivalPrice('tit-for-tat', state.history);
      expect(r2Price).toBe(7);

      // Round 2: Player decides to cut down to cost 5
      state = playNextRound(state, 5);
      expect(state.history[1].playerPrice).toBe(5);
      expect(state.history[1].rivalPrice).toBe(7);

      // Round 3: Rival should mimic price 5!
      const r3Price = decideRivalPrice('tit-for-tat', state.history);
      expect(r3Price).toBe(5);

      // Round 3: Player tries to return to peace with price 10
      state = playNextRound(state, 10);
      expect(state.history[2].playerPrice).toBe(10);
      expect(state.history[2].rivalPrice).toBe(5);

      // Round 4: Rival sees player played 10, so rival cooperates back with 10!
      const r4Price = decideRivalPrice('tit-for-tat', state.history);
      expect(r4Price).toBe(10);
    });
  });

  describe('Behavioral Invariant 5: Conditional Cooperation (Grim Trigger)', () => {
    it('يتعاون طالما التزم اللاعب بالسعر العادي، وينتقم للأبد فور أول تخفيض', () => {
      // Prior history all 10
      const peacefulHistory: PriceWarRound[] = [
        calculateRound(10, 'conditional-cooperate', []),
        calculateRound(10, 'conditional-cooperate', []),
      ];
      expect(decideRivalPrice('conditional-cooperate', peacefulHistory)).toBe(10);

      // History contains one betrayal
      const betrayalHistory: PriceWarRound[] = [
        calculateRound(10, 'conditional-cooperate', []),
        calculateRound(7, 'conditional-cooperate', []),
      ];
      expect(decideRivalPrice('conditional-cooperate', betrayalHistory)).toBe(5);

      // Even if player offers 10 again, Grim Trigger never forgives
      betrayalHistory.push(calculateRound(10, 'conditional-cooperate', betrayalHistory));
      expect(decideRivalPrice('conditional-cooperate', betrayalHistory)).toBe(5);
    });
  });
});
