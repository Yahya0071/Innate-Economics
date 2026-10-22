import { clamp, roundTo } from '../core/math';
import {
  BASELINE_DEPOSITS,
  DEFAULT_RESERVE_RATIO,
  NORMAL_DAILY_WITHDRAWAL_RATIO,
} from './constants';
import type { BankVaultState, PanicLevel, VaultOutcome, VaultRecord } from './types';

export function createInitialVaultState(
  deposits: number = BASELINE_DEPOSITS,
  ratio: number = DEFAULT_RESERVE_RATIO
): BankVaultState {
  const clampedRatio = clamp(roundTo(ratio, 2), 0.05, 1.0);
  const cash = Math.round(deposits * clampedRatio);
  const loans = deposits - cash;

  return {
    totalDeposits: deposits,
    reserveRatio: clampedRatio,
    cashReserves: cash,
    loansOutstanding: loans,
    confidence: 100, // ثقة تامة 100%
    hasDepositInsurance: false,
    isLenderOfLastResortActive: false,
    status: 'solvent',
    history: [],
  };
}

/**
 * Adjusts the reserve ratio and redistributes between cash reserves and loans.
 */
export function updateReserveRatio(state: BankVaultState, newRatio: number): BankVaultState {
  const clampedRatio = clamp(roundTo(newRatio, 2), 0.05, 1.0);
  const cash = Math.round(state.totalDeposits * clampedRatio);
  const loans = state.totalDeposits - cash;

  return {
    ...state,
    reserveRatio: clampedRatio,
    cashReserves: cash,
    loansOutstanding: loans,
  };
}

/**
 * Toggles deposit insurance (ضمان الودائع الحكومي).
 */
export function toggleDepositInsurance(state: BankVaultState): BankVaultState {
  return {
    ...state,
    hasDepositInsurance: !state.hasDepositInsurance,
  };
}

/**
 * Toggles emergency liquidity lender of last resort (ملاذ الإقراض الأخير).
 */
export function toggleLenderOfLastResort(state: BankVaultState): BankVaultState {
  return {
    ...state,
    isLenderOfLastResortActive: !state.isLenderOfLastResortActive,
  };
}

/**
 * Simulates a withdrawal demand event (normal day or panic run) and evaluates vault solvency.
 */
export function simulateWithdrawalRun(
  state: BankVaultState,
  panicLevel: PanicLevel
): { nextState: BankVaultState; outcome: VaultOutcome } {
  // Base withdrawal demand based on panic intensity
  let demandRatio = NORMAL_DAILY_WITHDRAWAL_RATIO;
  let eventName = 'يوم عادي هادئ';

  if (panicLevel === 'whisper') {
    demandRatio = 0.18; // 18% سحب
    eventName = 'همسة عابرة في السوق';
  } else if (panicLevel === 'rumor') {
    demandRatio = 0.35; // 35% سحب
    eventName = 'شائعة قوية عن تعثر تجار';
  } else if (panicLevel === 'panic-run') {
    demandRatio = 0.65; // 65% هلع جماعي مذعور
    eventName = 'هلع جماعي وركض عارم (Bank Run)';
  }

  // If deposit insurance is active, panic is neutralized by ~75%
  if (state.hasDepositInsurance && panicLevel !== 'none') {
    demandRatio = Math.max(NORMAL_DAILY_WITHDRAWAL_RATIO, demandRatio * 0.25);
  }

  const requestedWithdrawal = Math.round(state.totalDeposits * demandRatio);

  // Available cash includes emergency liquidity line if Lender of Last Resort is active
  const emergencyLiquidity = state.isLenderOfLastResortActive ? 600 : 0;
  const totalAvailableLiquidity = state.cashReserves + emergencyLiquidity;

  let paidWithdrawal = 0;
  let shortage = 0;
  let remainingCash = state.cashReserves;
  let confidenceEnd = state.confidence;
  let status = state.status;
  let narrativeNote = '';

  if (totalAvailableLiquidity >= requestedWithdrawal) {
    // Solved: all withdrawal requests paid in full!
    paidWithdrawal = requestedWithdrawal;
    shortage = 0;
    remainingCash = Math.max(0, state.cashReserves - requestedWithdrawal);
    status = 'solvent';

    if (state.isLenderOfLastResortActive && requestedWithdrawal > state.cashReserves) {
      narrativeNote = `تدخل ملاذ الإقراض الأخير وضخ السيولة فورياً! دفع الصندوق لكل قادم ذهبه كاملاً (${paidWithdrawal} دينار)، فانفرط الطابور وعادت الثقة!`;
      confidenceEnd = 95;
    } else if (state.hasDepositInsurance && panicLevel !== 'none') {
      narrativeNote = `بفضل ضمان الودائع، علم الناس أن أموالهم مضمونة ولم يركضوا للطابور، فمر اليوم بسلام وهدوء تام.`;
      confidenceEnd = 100;
    } else if (panicLevel === 'panic-run') {
      narrativeNote = `معجزة الاحتياطي العالي! طلب المذعورون سحب ${requestedWithdrawal} دينار، فدفعها الصندوق دون تردد. خجل المودعون وأعادوا ودائعهم!`;
      confidenceEnd = 100;
    } else {
      narrativeNote = `سارت عمليات السحب اليومية (${paidWithdrawal} دينار) بسلاسة وأمان تام؛ الخزينة واثقة والقرية مستقرة.`;
      confidenceEnd = Math.min(100, state.confidence + 5);
    }
  } else {
    // Liquidity Crisis: Ran out of cash!
    paidWithdrawal = totalAvailableLiquidity;
    shortage = requestedWithdrawal - totalAvailableLiquidity;
    remainingCash = 0;
    confidenceEnd = Math.max(5, Math.round(state.confidence * 0.15));
    status = shortage > 150 ? 'collapsed' : 'liquidity-crisis';

    narrativeNote = `أزمة سيولة قاتلة! طالب الناس بـ ${requestedWithdrawal} دينار، فنفدت دنانير الخزينة عند ${paidWithdrawal} دينار.. وقف ${shortage} دينار من الطلبات تصرخ أمام باب مغلق! انهار الصندوق بالخوف لا بالإفلاس!`;
  }

  const outcome: VaultOutcome = {
    requestedWithdrawal,
    paidWithdrawal,
    shortage,
    remainingCash,
    confidenceEnd,
    status,
    narrativeNote,
  };

  const record: VaultRecord = {
    event: eventName,
    requested: requestedWithdrawal,
    paid: paidWithdrawal,
    remainingCash,
    confidence: confidenceEnd,
    status,
    narrativeNote,
  };

  const nextState: BankVaultState = {
    ...state,
    cashReserves: remainingCash,
    confidence: confidenceEnd,
    status,
    history: [...state.history, record],
  };

  return { nextState, outcome };
}
