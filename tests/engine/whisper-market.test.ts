import { describe, it, expect } from 'vitest';
import {
  createInitialVaultState,
  updateReserveRatio,
  simulateWithdrawalRun,
  toggleDepositInsurance,
  toggleLenderOfLastResort,
} from '@/engine/whisper-market/engine';

describe('Fractional Reserve, Liquidity & Bank Run Engine (همسة في السوق)', () => {
  describe('Mathematical Invariant 1: Conservation of Deposits', () => {
    it('cash reserves and outstanding loans always sum to total deposits', () => {
      const state1 = createInitialVaultState(1000, 0.20);
      expect(state1.cashReserves + state1.loansOutstanding).toBe(1000);

      const state2 = updateReserveRatio(state1, 0.50);
      expect(state2.cashReserves + state2.loansOutstanding).toBe(1000);

      const state3 = updateReserveRatio(state1, 1.0);
      expect(state3.cashReserves).toBe(1000);
      expect(state3.loansOutstanding).toBe(0);
    });
  });

  describe('Systemic Invariant 2: Illiquidity Crisis under Bank Run (أزمة السيولة والهلع)', () => {
    it('operates stably under normal withdrawal pressure (10%) with 20% reserve', () => {
      const state = createInitialVaultState(1000, 0.20);
      const { outcome, nextState } = simulateWithdrawalRun(state, 'none');

      expect(outcome.shortage).toBe(0);
      expect(outcome.paidWithdrawal).toBe(100);
      expect(nextState.status).toBe('solvent');
      expect(nextState.confidence).toBeGreaterThanOrEqual(100);
    });

    it('collapses into illiquidity crisis during full bank run when panic demand exceeds reserves', () => {
      const state = createInitialVaultState(1000, 0.20); // 200 cash
      const { outcome, nextState } = simulateWithdrawalRun(state, 'panic-run'); // 650 requested

      expect(outcome.requestedWithdrawal).toBe(650);
      expect(outcome.paidWithdrawal).toBe(200);
      expect(outcome.shortage).toBe(450);
      expect(nextState.status).toBe('collapsed');
      expect(nextState.confidence).toBeLessThan(20);
    });
  });

  describe('Institutional Safeguards: 100% Reserve & Lender of Last Resort', () => {
    it('100% full reserve withstands full panic run without shortage', () => {
      const state = createInitialVaultState(1000, 1.0); // 1000 cash
      const { outcome, nextState } = simulateWithdrawalRun(state, 'panic-run');

      expect(outcome.shortage).toBe(0);
      expect(nextState.status).toBe('solvent');
    });

    it('lender of last resort provides emergency liquidity to extinguish bank run at 20% reserve', () => {
      let state = createInitialVaultState(1000, 0.20);
      state = toggleLenderOfLastResort(state);

      const { outcome, nextState } = simulateWithdrawalRun(state, 'panic-run');
      expect(outcome.shortage).toBe(0);
      expect(nextState.status).toBe('solvent');
      expect(outcome.confidenceEnd).toBeGreaterThan(90);
    });

    it('deposit insurance prevents bank run from forming by neutralizing fear', () => {
      let state = createInitialVaultState(1000, 0.20);
      state = toggleDepositInsurance(state);

      const { outcome, nextState } = simulateWithdrawalRun(state, 'panic-run');
      expect(outcome.shortage).toBe(0);
      expect(nextState.status).toBe('solvent');
    });
  });
});
