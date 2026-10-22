import { clamp, roundTo } from '../core/math';
import {
  BASELINE_POPULATION,
  BASELINE_BREAD_PER_OVEN,
  NEW_OVEN_COST,
  MAX_OVENS,
} from './constants';
import type { MarketOutcome, VillageMarketState } from './types';

export function createInitialVillageState(): VillageMarketState {
  return {
    population: BASELINE_POPULATION,
    goldSupply: 20, // دينار واحد لكل عائلة
    dailyBreadCapacity: BASELINE_BREAD_PER_OVEN, // 20 رغيفاً
    ovensCount: 1,
    priceCeiling: null, // لا يوجد تسعير جبري في البداية
    day: 1,
    bakeryTreasury: 0,
  };
}

/**
 * Calculates natural market clearing price (Equilibrium Price).
 * P_eq = Gold Supply / Total Bread Produced
 */
export function calculateEquilibriumPrice(goldSupply: number, breadCapacity: number): number {
  if (breadCapacity <= 0) return 0;
  return roundTo(goldSupply / breadCapacity, 2);
}

/**
 * Pure evaluation of a market day given gold supply, bakery capacity, and price controls.
 */
export function evaluateMarketDay(state: VillageMarketState): MarketOutcome {
  const { population, goldSupply, dailyBreadCapacity, priceCeiling } = state;
  const equilibriumPrice = calculateEquilibriumPrice(goldSupply, dailyBreadCapacity);

  // Case 1: Free market pricing (or non-binding price ceiling)
  if (priceCeiling === null || priceCeiling >= equilibriumPrice) {
    const officialPrice = equilibriumPrice;
    const purchasingPowerPerCoin = roundTo(1 / officialPrice, 3);
    const satisfiedPeopleCount = Math.min(population, dailyBreadCapacity);
    const hungryPeopleCount = Math.max(0, population - satisfiedPeopleCount);

    let narrativeNote = '';
    if (goldSupply === 20 && dailyBreadCapacity === 20) {
      narrativeNote = 'توازن فطري متكامل؛ كل عائلة تملك ديناراً وتشتري رغيفاً بدينار، والجميع ينام شبعاناً.';
    } else if (goldSupply > 20 && dailyBreadCapacity === 20) {
      narrativeNote = `تضاعفت النقود وارتفع سعر الرغيف إلى ${officialPrice} دنانير. الجميع يملك ذهباً أكثر، ولكن لم يأكل أحد أكثر من رغيفه المعتاد! الذهب وحده لم يصنع قمحاً.`;
    } else if (dailyBreadCapacity > population) {
      narrativeNote = `زيادة الأفران أوجدت وفرة حقيقية؛ انخفض سعر الرغيف إلى ${officialPrice} دينار وباتت القرية تعيش رغداً حقيقياً.`;
    } else {
      narrativeNote = `السعر التوازني هو ${officialPrice} دنانير للرغيف. الأسعار تعمل كبرقيات ترشد الجميع بحجم المتاح.`;
    }

    return {
      equilibriumPrice,
      officialPrice,
      blackMarketPrice: null,
      breadSupplied: dailyBreadCapacity,
      breadDemanded: dailyBreadCapacity,
      breadSold: dailyBreadCapacity,
      shortage: 0,
      satisfiedPeopleCount,
      hungryPeopleCount,
      purchasingPowerPerCoin,
      isBlackMarketActive: false,
      narrativeNote,
    };
  }

  // Case 2: Binding Price Ceiling (التسعير الجبري)
  const officialPrice = priceCeiling;
  const theoreticalDemand = roundTo(goldSupply / officialPrice, 1);
  const shortage = Math.max(0, roundTo(theoreticalDemand - dailyBreadCapacity, 1));

  // When price is artificially cheap, early buyers buy up multiple loaves
  const avgGoldPerPerson = goldSupply / population;
  const loavesPerEarlyBuyer = Math.max(1, avgGoldPerPerson / officialPrice);
  const satisfiedCount = Math.max(
    1,
    Math.min(population, Math.floor(dailyBreadCapacity / loavesPerEarlyBuyer))
  );
  const hungryCount = Math.max(0, population - satisfiedCount);

  // Black market premium emerges
  const shortageRatio = shortage / dailyBreadCapacity;
  const blackMarketPrice = roundTo(equilibriumPrice * (1 + 0.45 * shortageRatio), 2);
  const purchasingPowerPerCoin = roundTo(1 / blackMarketPrice, 3);

  const narrativeNote = `نفد الخبز خلال دقائق! اشترى أول ${satisfiedCount} أشخاص في الطابور كامل الأرغفة العشرين بالسعر الإجباري الرخيص (${officialPrice} دينار)، وحُرمت ${hungryCount} عائلة.. لتظهر سوق سوداء في الأزقة تبيع الرغيف بـ ${blackMarketPrice} دنانير!`;

  return {
    equilibriumPrice,
    officialPrice,
    blackMarketPrice,
    breadSupplied: dailyBreadCapacity,
    breadDemanded: theoreticalDemand,
    breadSold: dailyBreadCapacity,
    shortage,
    satisfiedPeopleCount: satisfiedCount,
    hungryPeopleCount: hungryCount,
    purchasingPowerPerCoin,
    isBlackMarketActive: true,
    narrativeNote,
  };
}

/**
 * Builds a new oven, expanding real production capacity.
 */
export function expandOvens(state: VillageMarketState): VillageMarketState {
  if (state.ovensCount >= MAX_OVENS) {
    return state;
  }

  const newOvens = state.ovensCount + 1;
  const newCapacity = newOvens * BASELINE_BREAD_PER_OVEN;

  return {
    ...state,
    ovensCount: newOvens,
    dailyBreadCapacity: newCapacity,
    day: state.day + 1,
  };
}

/**
 * Injects gold into the village (e.g. finding a hidden gold mine).
 */
export function injectGold(state: VillageMarketState, addedGold: number): VillageMarketState {
  return {
    ...state,
    goldSupply: Math.max(10, state.goldSupply + addedGold),
    day: state.day + 1,
  };
}

/**
 * Sets or removes price ceiling.
 */
export function setPriceControl(
  state: VillageMarketState,
  ceiling: number | null
): VillageMarketState {
  return {
    ...state,
    priceCeiling: ceiling !== null ? Math.max(0.5, ceiling) : null,
  };
}
