/**
 * Types and structures for Chapter 4: Borrowing Tomorrow's Energy (استعارة طاقة الغد).
 * ZERO DOM / ZERO UI dependencies.
 */

export interface LoanOffer {
  principal: number;          // أصل القرض (مثلاً 20 كيساً)
  interestRate: number;       // نسبة الفائدة (مثلاً 0.25 أي 25%)
  durationSeasons: number;    // مدة القرض بالمواسم (مثلاً 3 مواسم)
}

export interface CreditSeasonRecord {
  season: number;
  harvest: number;
  consumed: number;
  netSurplus: number;
  wheatStockEnd: number;
  wellProgressEnd: number;
  debtRemaining: number;
  debtPaidThisSeason: number;
  isBankrupt: boolean;
  narrativeNote: string;
}

export interface FarmerCreditState {
  season: number;
  maxSeasons: number;
  wheatStock: number;
  baselineYield: number;
  consumptionPerSeason: number;
  wellProgress: number;       // نسبة اكتمال البئر (0..100)
  wellCompleted: boolean;
  loanTaken: boolean;
  debtPrincipal: number;
  debtInterestRate: number;
  debtDueSeason: number;
  isBankrupt: boolean;
  history: CreditSeasonRecord[];
}

export interface LoanAllocationChoice {
  productiveBags: number;     // أكياس موجهة لحفر البئر والاستثمار
  consumptionBags: number;    // أكياس موجهة للاستهلاك والوليمة
}
