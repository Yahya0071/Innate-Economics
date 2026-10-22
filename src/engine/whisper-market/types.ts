/**
 * Types and structures for Chapter 5: A Whisper in the Market (همسة في السوق).
 * ZERO DOM / ZERO UI dependencies.
 */

export type VaultStatus = 'solvent' | 'liquidity-crisis' | 'collapsed';
export type PanicLevel = 'none' | 'whisper' | 'rumor' | 'panic-run';

export interface BankVaultState {
  totalDeposits: number;        // إجمالي ودائع الناس (مثلاً 1000 دينار)
  reserveRatio: number;         // نسبة الاحتياطي النقدي (0.05 .. 1.0)
  cashReserves: number;         // الذهب السائل داخل الخزينة
  loansOutstanding: number;     // الدنانير المقرضة لمشاريع القرية
  confidence: number;           // مؤشر ثقة الناس بالخزينة (0..100)
  hasDepositInsurance: boolean; // هل يوجد ضمان حكومي للودائع؟
  isLenderOfLastResortActive: boolean; // هل تم استدعاء سيولة الملاذ الأخير؟
  status: VaultStatus;
  history: VaultRecord[];
}

export interface VaultOutcome {
  requestedWithdrawal: number;  // المبلغ الذي طالب المودعون بسحبه
  paidWithdrawal: number;       // المبلغ الذي استطاعت الخزينة دفعه فعلياً
  shortage: number;             // العجز اللحظي في السيولة
  remainingCash: number;        // السيولة المتبقية بعد السحب
  confidenceEnd: number;        // مستوى الثقة الختامي
  status: VaultStatus;
  narrativeNote: string;
}

export interface VaultRecord {
  event: string;
  requested: number;
  paid: number;
  remainingCash: number;
  confidence: number;
  status: VaultStatus;
  narrativeNote: string;
}
