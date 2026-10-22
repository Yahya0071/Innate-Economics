import { clamp, roundTo } from '../core/math';
import {
  BASELINE_YIELD,
  BASELINE_CONSUMPTION,
  WELL_TOTAL_BAGS_REQUIRED,
  WELL_MAX_MULTIPLIER,
  DEFAULT_LOAN_PRINCIPAL,
  DEFAULT_INTEREST_RATE,
  DEFAULT_LOAN_DURATION,
  MAX_SIMULATION_SEASONS,
} from './constants';
import type {
  CreditSeasonRecord,
  FarmerCreditState,
  LoanAllocationChoice,
  LoanOffer,
} from './types';

export function createInitialFarmerState(
  maxSeasons: number = MAX_SIMULATION_SEASONS
): FarmerCreditState {
  return {
    season: 1,
    maxSeasons,
    wheatStock: 2, // كيسان في المخزن كاحتياط أولي
    baselineYield: BASELINE_YIELD,
    consumptionPerSeason: BASELINE_CONSUMPTION,
    wellProgress: 0,
    wellCompleted: false,
    loanTaken: false,
    debtPrincipal: 0,
    debtInterestRate: DEFAULT_INTEREST_RATE,
    debtDueSeason: 4,
    isBankrupt: false,
    history: [],
  };
}

/**
 * Calculates seasonal harvest based on baseline land yield and well irrigation progress.
 */
export function calculateSeasonalYield(baselineYield: number, wellProgress: number): number {
  if (wellProgress >= 100) {
    return baselineYield * WELL_MAX_MULTIPLIER; // 30 كيساً
  }
  const boost = 1 + 1.5 * (wellProgress / 100);
  return roundTo(baselineYield * boost, 1);
}

/**
 * Applies player's loan decision at Season 1: How much to borrow and how to divide it between
 * well construction (productive investment) and immediate consumption (feasts & luxury).
 */
export function applyLoanDecision(
  state: FarmerCreditState,
  choice: LoanAllocationChoice,
  offer?: Partial<LoanOffer>
): FarmerCreditState {
  const principal = choice.productiveBags + choice.consumptionBags;
  const rate = offer?.interestRate ?? DEFAULT_INTEREST_RATE;
  const duration = offer?.durationSeasons ?? DEFAULT_LOAN_DURATION;

  if (principal <= 0) {
    // Rejected the loan: stays with 0 debt, 0 well progress
    return {
      ...state,
      loanTaken: false,
      debtPrincipal: 0,
    };
  }

  const addedWellProgress = Math.min(
    100,
    Math.round((choice.productiveBags / WELL_TOTAL_BAGS_REQUIRED) * 100)
  );

  return {
    ...state,
    loanTaken: true,
    debtPrincipal: principal,
    debtInterestRate: rate,
    debtDueSeason: state.season + duration,
    wellProgress: addedWellProgress,
    wellCompleted: addedWellProgress >= 100,
  };
}

/**
 * Advances simulation by one season, processing harvest, family consumption, and debt repayment.
 */
export function advanceCreditSeason(state: FarmerCreditState): FarmerCreditState {
  if (state.isBankrupt) {
    return state;
  }

  const harvest = calculateSeasonalYield(state.baselineYield, state.wellProgress);
  const netSurplus = harvest - state.consumptionPerSeason;
  let currentStock = state.wheatStock + netSurplus;

  let debtRemaining = state.debtPrincipal;
  let debtPaidThisSeason = 0;
  let isBankrupt = false;
  let narrativeNote = '';

  const isDueSeason = state.loanTaken && state.season === state.debtDueSeason && state.debtPrincipal > 0;

  if (isDueSeason) {
    const totalDue = Math.round(state.debtPrincipal * (1 + state.debtInterestRate));

    if (currentStock >= totalDue) {
      // Repaid in full!
      currentStock -= totalDue;
      debtRemaining = 0;
      debtPaidThisSeason = totalDue;
      narrativeNote = `حل موسم السداد! دفعت للتاجر ${totalDue} كيساً كاملة (أصل القرض + ${Math.round(state.debtInterestRate * 100)}% فائدة)، وبقيت حراً طليقاً وبئرك يضخ الخير!`;
    } else {
      // Default & Bankruptcy
      isBankrupt = true;
      debtPaidThisSeason = currentStock;
      debtRemaining = totalDue - currentStock;
      currentStock = 0;
      narrativeNote = `كارثة إفلاس! حل أجل سداد الـ ${totalDue} كيساً، ومخزنك خاوٍ.. وضع التاجر يده على نصف أرضك كرهن لسداد دينه، وتحولت إلى مزارع بالأجر!`;
    }
  } else if (state.wellCompleted) {
    narrativeNote = `المياه تتدفق في قنوات الري! حصدت ${harvest} كيساً (3 أضعاف المحصول المعتاد)، ومخزنك يمتلئ بالخير الوفير.`;
  } else if (state.wellProgress > 0) {
    narrativeNote = `حصدت ${harvest} كيساً بفضل تقدم أعمال الري، وتستعد لموسم الحصاد القادم.`;
  } else if (!state.loanTaken) {
    narrativeNote = `كفاف هادئ؛ حصدت ${harvest} أكياس، أكلت العائلة 8 أكياس وبقي كيسان. أنت آمن من الديون ولكنك تراوح مكانك.`;
  } else {
    narrativeNote = `مضى موسم عادي بإنتاج ${harvest} أكياس.. اقترب موسم استحقاق الدين للتاجر، وعليك أن تتأكد من جاهزية مخزنك.`;
  }

  const record: CreditSeasonRecord = {
    season: state.season,
    harvest,
    consumed: state.consumptionPerSeason,
    netSurplus,
    wheatStockEnd: currentStock,
    wellProgressEnd: state.wellProgress,
    debtRemaining,
    debtPaidThisSeason,
    isBankrupt,
    narrativeNote,
  };

  return {
    ...state,
    season: state.season + 1,
    wheatStock: currentStock,
    debtPrincipal: debtRemaining,
    isBankrupt,
    history: [...state.history, record],
  };
}
