/**
 * Types and structures for Chapter 2: The Island of Bread and Gold (جزيرة الرغيف والذهب).
 * ZERO DOM / ZERO UI dependencies.
 */

export interface VillageMarketState {
  population: number;          // عدد عائلات القرية
  goldSupply: number;          // إجمالي قطع الذهب في القرية
  dailyBreadCapacity: number;  // إجمالي الأرغفة المنتجة يومياً
  ovensCount: number;          // عدد أفران الخبز العاملة
  priceCeiling: number | null; // سقف السعر الجبري (دينار/رغيف) إن وُجد
  day: number;
  bakeryTreasury: number;      // خزانة أرباح الخباز
}

export interface MarketOutcome {
  equilibriumPrice: number;    // السعر الطبيعي التوازني
  officialPrice: number;       // السعر المعلن في المخبز
  blackMarketPrice: number | null; // سعر السوق السوداء (إن وُجد)
  breadSupplied: number;       // إجمالي الخبز المتاح
  breadDemanded: number;       // إجمالي الطلب النظري
  breadSold: number;           // ما تم بيعه فعلياً في المخبز
  shortage: number;            // العجز في الأرغفة
  satisfiedPeopleCount: number;// عدد الأشخاص الذين نالوا خبزاً
  hungryPeopleCount: number;   // عدد المحرومين الجائعين
  purchasingPowerPerCoin: number; // كم رغيفاً تشتري قطعة الذهب الواحدة
  isBlackMarketActive: boolean;// هل نشأت سوق سوداء؟
  narrativeNote: string;       // تعليق سردي فطري يلخص النتيجة
}
