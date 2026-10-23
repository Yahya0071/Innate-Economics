/**
 * Constants for Chapter 6: Price War & Nash Equilibrium
 */

export const DEFAULT_UNIT_COST = 5;
export const DEFAULT_MARKET_DEMAND = 100;

export const PRICE_NORMAL = 10;
export const PRICE_DISCOUNT = 7;
export const PRICE_MARGINAL_COST = 5;

export const MARKET_SHARE_EQUAL = 0.50;
export const MARKET_SHARE_UNDERCUT_WINNER = 0.80;
export const MARKET_SHARE_UNDERCUT_LOSER = 0.20;

export const RIVAL_STRATEGY_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'tit-for-tat': {
    name: 'الرد بالمثل',
    description: 'يبدأ بالتعاون وسعر عادي (10)، ثم يكرر في كل جولة سعر اللاعب في الجولة السابقة.',
  },
  'always-defect': {
    name: 'الجشع الدائم',
    description: 'يختار دائماً سعر كسر السوق (5) لانتزاع الحصة الأكبر وإجبارك على الخضوع.',
  },
  'conditional-cooperate': {
    name: 'التعاون المشروط',
    description: 'يتعاون بسعر 10 طالما حافظت على السعر، ولكنه ينتقم بكسر السعر دائماً إن غدرت به مرة واحدة.',
  },
  'random': {
    name: 'التاجر المتقلب',
    description: 'يغير أسعاره عشوائياً ليختبر قدرتك على قراءة السوق غير المنضبط.',
  },
};
