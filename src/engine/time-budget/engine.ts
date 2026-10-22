import { clamp, roundTo, calculateMarginalWorkYield } from '../core/math';
import { TOTAL_WAKING_HOURS, DAILY_FOOD_REQUIREMENT, TOOL_TIERS } from './constants';
import type { DayAllocation, HealthStatus, TimeBudgetState, ToolTier } from './types';

export function createInitialState(maxDays: number = 7): TimeBudgetState {
  return {
    day: 1,
    maxDays,
    energy: 100,
    foodStock: 2.0, // يبدأ بمؤونة يوم واحد ليحميه من صدمة اللحظة الأولى
    toolHoursInvested: 0,
    toolTier: 0,
    isAlive: true,
    history: [],
  };
}

export function validateAllocation(allocation: DayAllocation): { valid: boolean; error?: string } {
  const { workHours, toolHours, restHours } = allocation;

  if (workHours < 0 || toolHours < 0 || restHours < 0) {
    return { valid: false, error: 'لا يمكن أن تكون الساعات بالسالب' };
  }

  const total = roundTo(workHours + toolHours + restHours, 2);
  if (Math.abs(total - TOTAL_WAKING_HOURS) > 0.01) {
    return {
      valid: false,
      error: `مجموع الساعات يجب أن يساوي بالضبط ${TOTAL_WAKING_HOURS} ساعة (المجموع الحالي: ${total})`,
    };
  }

  return { valid: true };
}

/**
 * Calculates tool tier and progress percentage based on total accumulated tool hours.
 */
export function determineToolTier(totalToolHours: number): {
  tier: ToolTier;
  progressPercent: number;
} {
  if (totalToolHours >= TOOL_TIERS[3].hoursRequired) {
    return { tier: 3, progressPercent: 100 };
  } else if (totalToolHours >= TOOL_TIERS[2].hoursRequired) {
    const span = TOOL_TIERS[3].hoursRequired - TOOL_TIERS[2].hoursRequired;
    const progress = ((totalToolHours - TOOL_TIERS[2].hoursRequired) / span) * 100;
    return { tier: 2, progressPercent: roundTo(progress, 1) };
  } else if (totalToolHours >= TOOL_TIERS[1].hoursRequired) {
    const span = TOOL_TIERS[2].hoursRequired - TOOL_TIERS[1].hoursRequired;
    const progress = ((totalToolHours - TOOL_TIERS[1].hoursRequired) / span) * 100;
    return { tier: 1, progressPercent: roundTo(progress, 1) };
  } else {
    const span = TOOL_TIERS[1].hoursRequired;
    const progress = (totalToolHours / span) * 100;
    return { tier: 0, progressPercent: roundTo(progress, 1) };
  }
}

/**
 * Pure calculation of food harvest for a given allocation of work hours,
 * taking into account diminishing returns per hour, current energy, and tool tier.
 */
export function calculateHarvest(workHours: number, energy: number, toolTier: ToolTier): number {
  if (workHours <= 0) return 0;

  const energyFactor = 0.3 + 0.7 * (energy / 100);
  const toolMultiplier = TOOL_TIERS[toolTier].multiplier;
  let totalBase = 0;

  const fullHours = Math.floor(workHours);
  const fraction = workHours - fullHours;

  for (let h = 1; h <= fullHours; h++) {
    totalBase += calculateMarginalWorkYield(h);
  }

  if (fraction > 0) {
    totalBase += calculateMarginalWorkYield(fullHours + 1) * fraction;
  }

  const result = totalBase * energyFactor * toolMultiplier;
  return roundTo(result, 2);
}

/**
 * Generates an intuitive Arabic narrative comment based on the biological and systemic outcomes.
 */
export function generateNarrativeNote(
  allocation: DayAllocation,
  harvested: number,
  energyEnd: number,
  starved: boolean,
  newToolUnlocked: boolean,
  currentTier: ToolTier
): string {
  if (starved) {
    return 'نمت الليلة ببطن خاوية.. انشغالك بالعمل أو البناء أنساك تأمين طعام العشاء، فاستيقظت مهدود البدن!';
  }

  if (newToolUnlocked) {
    return `مبارك! اكتمل صنع «${TOOL_TIERS[currentTier].name}». ابتداءً من الغد، سيتضاعف عائد كل ساعة تبذلها!`;
  }

  if (allocation.workHours >= 13) {
    return 'أرهقت نفسك في العمل المتواصل؛ الساعات الأخيرة لم تنتج سوى فتات قليل، وأصبح جسدك يستجدي الراحة.';
  }

  if (allocation.toolHours >= 10) {
    return 'استثمرت جل يومك في أدوات الغد.. استثمار ذكي بشرط ألا تجوع اليوم!';
  }

  if (allocation.restHours >= 8) {
    return 'يوم استجمام وراحة كاملة.. استعادت قواك عافيتها بالكامل، وبات محرك جسدك جاهزاً للغد.';
  }

  if (energyEnd < 35) {
    return 'تآكلت طاقتك بشكل خطير.. غداً ستجد أن يدك أثقل وساعتك أبطأ إن لم تعوض الراحة.';
  }

  return 'يوم متوازن؛ أمّنت قوْتك، وتقدمت في أداة غدك، وحفظت بعض عافيتك.';
}

/**
 * Pure step function that advances the simulation state by one day.
 */
export function simulateDay(
  currentState: TimeBudgetState,
  allocation: DayAllocation
): TimeBudgetState {
  const validation = validateAllocation(allocation);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid day allocation');
  }

  const { workHours, toolHours, restHours } = allocation;

  // 1. Calculate yield from work
  const harvested = calculateHarvest(workHours, currentState.energy, currentState.toolTier);

  // 2. Accumulate tool hours and evaluate new tier
  const previousTier = currentState.toolTier;
  const newToolHours = roundTo(currentState.toolHoursInvested + toolHours, 2);
  const { tier: newTier, progressPercent } = determineToolTier(newToolHours);
  const newToolUnlocked = newTier > previousTier;

  // 3. Energy consumption & recovery dynamics
  const energyBurn = workHours * 4.5 + toolHours * 3.5;
  const energyRecovery = restHours * 7.5;
  let nextEnergy = clamp(
    roundTo(currentState.energy - energyBurn + energyRecovery, 1),
    10,
    100
  );

  // 4. Food stock and survival check
  const availableFood = roundTo(currentState.foodStock + harvested, 2);
  let nextFoodStock = roundTo(availableFood - DAILY_FOOD_REQUIREMENT, 2);
  let starved = false;

  if (nextFoodStock < 0) {
    starved = true;
    nextFoodStock = 0;
    // Severe energy penalty if starving
    nextEnergy = clamp(roundTo(nextEnergy * 0.6, 1), 5, 100);
  }

  // 5. Determine health status
  let status: HealthStatus = 'flourishing';
  if (starved) {
    status = 'starving';
  } else if (nextEnergy < 35) {
    status = 'exhausted';
  } else if (nextEnergy < 60) {
    status = 'tired';
  }

  // 6. Generate narrative note
  const narrativeNote = generateNarrativeNote(
    allocation,
    harvested,
    nextEnergy,
    starved,
    newToolUnlocked,
    newTier
  );

  const dayRecord = {
    day: currentState.day,
    allocation: { ...allocation },
    harvested,
    consumed: DAILY_FOOD_REQUIREMENT,
    energyStart: currentState.energy,
    energyEnd: nextEnergy,
    foodStockEnd: nextFoodStock,
    toolProgressEnd: progressPercent,
    toolTierEnd: newTier,
    status,
    narrativeNote,
  };

  return {
    day: currentState.day + 1,
    maxDays: currentState.maxDays,
    energy: nextEnergy,
    foodStock: nextFoodStock,
    toolHoursInvested: newToolHours,
    toolTier: newTier,
    isAlive: nextEnergy > 5,
    history: [...currentState.history, dayRecord],
  };
}
