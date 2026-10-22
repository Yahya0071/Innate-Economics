/**
 * Types and structures for Chapter 3: The Common Pasture (لغز المرعى المشترك).
 * ZERO DOM / ZERO UI dependencies.
 */

export type GovernanceMode = 'open-access' | 'community-treaty' | 'private-fences';

export interface PastureState {
  pastureHealth: number;          // صحة العشب (0..100)
  playerSheep: number;            // أغنام اللاعب
  otherShepherdsSheep: number[];  // أغنام الرعاة الأربعة الآخرين
  governanceMode: GovernanceMode; // نظام إدارة المرعى
  season: number;                 // رقم الموسم الزراعي
  playerGold: number;             // رصيد اللاعب المتراكم
  villageGold: number;            // رصيد القرية مجتمعة
  isDesertified: boolean;         // هل تصحرت الأرض وفقدت قدرة التجدد؟
  history: SeasonRecord[];
}

export interface SeasonOutcome {
  totalSheep: number;
  yieldPerSheep: number;          // دراهم اللحم والصوف لكل رأس
  playerSeasonProfit: number;
  villageSeasonProfit: number;
  pastureHealthEnd: number;
  degradation: number;
  regeneration: number;
  narrativeNote: string;
}

export interface SeasonRecord {
  season: number;
  playerSheep: number;
  totalSheep: number;
  pastureHealth: number;
  yieldPerSheep: number;
  playerProfit: number;
  governanceMode: GovernanceMode;
  narrativeNote: string;
}
