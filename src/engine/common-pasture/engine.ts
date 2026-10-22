import { clamp, roundTo } from '../core/math';
import {
  OPTIMAL_PASTURE_CAPACITY,
  TOTAL_SHEPHERDS,
  SUSTAINABLE_PER_SHEPHERD,
  BASELINE_SHEEP_VALUE,
  DESERTIFICATION_THRESHOLD,
} from './constants';
import type { GovernanceMode, PastureState, SeasonOutcome, SeasonRecord } from './types';

export function createInitialPastureState(): PastureState {
  return {
    pastureHealth: 100, // 100% عشب أخضر يانع
    playerSheep: 2,
    otherShepherdsSheep: [2, 2, 2, 2], // 2 لكل راعٍ = 10 أغنام في المرعى
    governanceMode: 'open-access',
    season: 1,
    playerGold: 0,
    villageGold: 0,
    isDesertified: false,
    history: [],
  };
}

/**
 * Calculates revenue yield per single sheep based on crowding and pasture health.
 */
export function calculateSheepYield(totalSheep: number, pastureHealth: number): number {
  if (pastureHealth < DESERTIFICATION_THRESHOLD) {
    return 0; // مات العشب وجاعت الأغنام
  }

  const healthFactor = pastureHealth / 100;

  if (totalSheep <= OPTIMAL_PASTURE_CAPACITY) {
    return roundTo(BASELINE_SHEEP_VALUE * healthFactor, 1);
  }

  // Crowding degrades weight and wool quality non-linearly
  const crowdingRatio = OPTIMAL_PASTURE_CAPACITY / totalSheep;
  const yieldValue = BASELINE_SHEEP_VALUE * Math.pow(crowdingRatio, 1.25) * healthFactor;
  return Math.max(0.5, roundTo(yieldValue, 1));
}

/**
 * Pure evaluation of a single season under chosen governance and sheep allocations.
 */
export function evaluateSeason(
  currentState: PastureState,
  playerSheepInput: number,
  modeInput?: GovernanceMode
): { nextState: PastureState; outcome: SeasonOutcome } {
  const mode = modeInput || currentState.governanceMode;
  let playerSheep = Math.max(0, playerSheepInput);
  let otherShepherds = [...currentState.otherShepherdsSheep];

  // Adjust behaviors based on governance mode
  if (mode === 'community-treaty') {
    // Under treaty, quota is strictly 2 per person; violations are restrained
    playerSheep = Math.min(SUSTAINABLE_PER_SHEPHERD, playerSheep);
    otherShepherds = [2, 2, 2, 2];
  } else if (mode === 'open-access') {
    // In free-for-all, if player escalates greed, others react by adding sheep too
    if (playerSheep > 2) {
      const greedSpill = Math.min(3, Math.floor((playerSheep - 2) * 0.7));
      otherShepherds = [2 + greedSpill, 2 + greedSpill, 3 + greedSpill, 2 + greedSpill];
    } else {
      otherShepherds = [2, 2, 2, 2];
    }
  } else if (mode === 'private-fences') {
    // Fenced plots: others graze sustainably on their own plots
    otherShepherds = [2, 2, 2, 2];
  }

  const totalSheep = playerSheep + otherShepherds.reduce((a, b) => a + b, 0);

  // Pasture degradation and regeneration
  const excessSheep = Math.max(0, totalSheep - OPTIMAL_PASTURE_CAPACITY);
  const degradation = roundTo(excessSheep * 8.5, 1);
  const regeneration = currentState.pastureHealth >= DESERTIFICATION_THRESHOLD ? 15 : 0;

  let nextHealth = clamp(
    roundTo(currentState.pastureHealth - degradation + regeneration, 1),
    0,
    100
  );

  const isDesertified = nextHealth < DESERTIFICATION_THRESHOLD;
  const yieldPerSheep = calculateSheepYield(totalSheep, nextHealth);

  const playerSeasonProfit = roundTo(playerSheep * yieldPerSheep, 1);
  const villageSeasonProfit = roundTo(totalSheep * yieldPerSheep, 1);

  // Narrative feedback
  let narrativeNote = '';
  if (isDesertified) {
    narrativeNote = 'مأساة تامة! تحول المرعى إلى صحراء قاحلة.. مات العشب من جذوره، وهزلت الشياه حتى باتت بلا ثمن!';
  } else if (mode === 'community-treaty') {
    narrativeNote = 'التزم الجميع بميثاق الرعي (شاتان لكل راعٍ). بقي العشب يانعاً، وحققت القرية أعلى ربح مستدام.';
  } else if (mode === 'private-fences') {
    if (playerSheep > 3) {
      narrativeNote = 'أفرطت في رعي حصتك المسيجة فتدهورت أرضك وحدك، بينما بقيت أراضي جيرانك خضراء! لقد حملت كلفة قرارك بنفسك.';
    } else {
      narrativeNote = 'الحدود الواضحة حمت الجميع؛ كل راعٍ يصون حصته بعناية لأن عواقب إهماله تقع على كاهله وحده.';
    }
  } else if (totalSheep > 18) {
    narrativeNote = `انفلت المشاع! تسابق الرعاة على إطلاق ${totalSheep} شاة؛ تآكل العشب سريعاً وهبط ثمن الشاة من 10 دراهم إلى ${yieldPerSheep} درهم فقط.`;
  } else if (playerSheep > 2) {
    narrativeNote = `ربحت هذا الموسم أكثر من غيرك (+${playerSeasonProfit} درهم)، ولكنك تركت ندبة في صحة العشب (هبطت إلى ${nextHealth}%) سيتحمل ثمنها الجميع في المواسم القادمة.`;
  } else {
    narrativeNote = 'موسم متوازن هادئ؛ الرعي ضمن حدود الطاقة الاستيعابية يحفظ خضرة الهضبة.';
  }

  const outcome: SeasonOutcome = {
    totalSheep,
    yieldPerSheep,
    playerSeasonProfit,
    villageSeasonProfit,
    pastureHealthEnd: nextHealth,
    degradation,
    regeneration,
    narrativeNote,
  };

  const record: SeasonRecord = {
    season: currentState.season,
    playerSheep,
    totalSheep,
    pastureHealth: nextHealth,
    yieldPerSheep,
    playerProfit: playerSeasonProfit,
    governanceMode: mode,
    narrativeNote,
  };

  const nextState: PastureState = {
    pastureHealth: nextHealth,
    playerSheep,
    otherShepherdsSheep: otherShepherds,
    governanceMode: mode,
    season: currentState.season + 1,
    playerGold: roundTo(currentState.playerGold + playerSeasonProfit, 1),
    villageGold: roundTo(currentState.villageGold + villageSeasonProfit, 1),
    isDesertified,
    history: [...currentState.history, record],
  };

  return { nextState, outcome };
}
