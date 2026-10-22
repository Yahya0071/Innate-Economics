import type { ToolConfig, ToolTier } from './types';

export const TOTAL_WAKING_HOURS = 16;
export const DAILY_FOOD_REQUIREMENT = 2.0;

export const TOOL_TIERS: Record<ToolTier, ToolConfig> = {
  0: {
    name: 'أيدي مجردة',
    description: 'التقاط الثمار باليد؛ جهد مضاعف وعائد شحيح مقيد بحجم راحتيك.',
    multiplier: 1.0,
    hoursRequired: 0,
  },
  1: {
    name: 'عصا مشذبة',
    description: 'تصل لأعالي الشجر دون تسلق، وتوفر نصف الجهد البدني.',
    multiplier: 1.5,
    hoursRequired: 8,
  },
  2: {
    name: 'سلة حبال متينة',
    description: 'تجمع فيها أضعاف ما تحمله يدك، وتختصر مرات الرواح والمجيء.',
    multiplier: 2.2,
    hoursRequired: 22, // 8 + 14
  },
  3: {
    name: 'شبكة ورافعة مبتكرة',
    description: 'هندسة بدائية ذكية؛ حصاد سريع يضاعف ثمار كل ساعة أكثر من 3 مرات.',
    multiplier: 3.2,
    hoursRequired: 42, // 22 + 20
  },
};
