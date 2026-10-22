/**
 * Data structures and types for Chapter 1: Time Budget (ميزانية نبضات اليوم).
 * ZERO DOM / ZERO UI dependencies.
 */

export type ToolTier = 0 | 1 | 2 | 3;

export interface ToolConfig {
  name: string;
  description: string;
  multiplier: number;
  hoursRequired: number; // Cumulative hours needed to reach this tier
}

export interface DayAllocation {
  workHours: number;
  toolHours: number;
  restHours: number;
}

export type HealthStatus = 'flourishing' | 'tired' | 'exhausted' | 'starving';

export interface DayRecord {
  day: number;
  allocation: DayAllocation;
  harvested: number;
  consumed: number;
  energyStart: number;
  energyEnd: number;
  foodStockEnd: number;
  toolProgressEnd: number;
  toolTierEnd: ToolTier;
  status: HealthStatus;
  narrativeNote: string;
}

export interface TimeBudgetState {
  day: number;
  maxDays: number;
  energy: number;
  foodStock: number;
  toolHoursInvested: number;
  toolTier: ToolTier;
  isAlive: boolean;
  history: DayRecord[];
}
