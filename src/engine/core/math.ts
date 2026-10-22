/**
 * Pure Mathematical & Utility functions for Innate Economics Engines.
 * ZERO DOM / ZERO UI dependencies.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates marginal yield for a given hour under diminishing returns.
 * The earlier hours of the day are physically and mentally the most productive.
 */
export function calculateMarginalWorkYield(hourIndex: number): number {
  // hourIndex: 1 to 16
  if (hourIndex <= 4) {
    return 1.5; // ساعات البكور والنشاط الصباحي
  } else if (hourIndex <= 8) {
    return 1.0; // ساعات الإنتاج الطبيعي
  } else if (hourIndex <= 12) {
    return 0.6; // هبوط التركيز وبداية الإجهاد
  } else {
    return 0.25; // الإنهاك الشديد وتآكل الكفاءة
  }
}
