/**
 * Archetype Calculation & Decision Fingerprint Engine (محرك حساب الأنماط وبصمة القرار)
 * 
 * Analyzes human economic choices across simulations and categorizes the player
 * into innate behavioral archetypes, with URL state serialization.
 * ZERO DOM / ZERO React dependencies. Pure TypeScript.
 */

export type ArchetypeId =
  | 'cautious-guardian'
  | 'patient-builder'
  | 'dynamic-balancer'
  | 'high-liquidity-adventurer';

export interface ArchetypeProfile {
  id: ArchetypeId;
  name: string;             // الاسم الفطري للنمط
  symbol: string;           // الرمز البصري المعبر
  shortSummary: string;     // ملخص السلوك في سطرين
  detailedNarrative: string;// الوصف البيداغوجي الفطري
  balanceAxis: {
    leftLabel: string;      // قطب الإيثار / المستقبل
    rightLabel: string;     // قطب المنفعة اللحظية / الحاضر
    score: number;          // النسبة المئوية من 0 إلى 100
  };
  traits: string[];         // الخصال الفطرية
  challengePhrase: string;  // عبارة التحدي عند المشاركة
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeProfile> = {
  'cautious-guardian': {
    id: 'cautious-guardian',
    name: 'حارس المشاع الحذر',
    symbol: '🛡️',
    shortSummary: 'يضحي بالعائد الفوري لحماية المورد الجماعي، ومستعد لكبح شهية الربح دفاعاً عن استدامة النظام.',
    detailedNarrative: 'تدرك بحدسك أن المكسب الفردي السريع وهمٌ إذا كان ثمنه تصحر الأرض أو انهيار الثقة المشتركة. تؤثر القناعة بحصة عادلة مستدامة على تخمة عابرة تورث الفاقة.',
    balanceAxis: {
      leftLabel: 'الإيثار واستدامة المشاع',
      rightLabel: 'المنفعة الذاتية العاجلة',
      score: 85,
    },
    traits: ['حس جمعي متقدم', 'إدراك فوري للحدود البيئية', 'مقاومة حمى المضاربة'],
    challengePhrase: 'لقد حافظتُ على استدامة المورد المشترك بحدس حذر. هل تملك الانضباط نفسه أم ستجرفك غواية الربح العاجل؟',
  },
  'patient-builder': {
    id: 'patient-builder',
    name: 'بنّاء الأصول طويل النَفَس',
    symbol: '⏳',
    shortSummary: 'يضحي براحة اليوم لصناعة أدوات تضاعف كفاءة الغد، ويتحمل مشقة البدايات لأجل التحرر من الشقاء.',
    detailedNarrative: 'فطرتك الاقتصادية تفهم سر تراكم رأس المال الحقيقي: العمل العضلي المباشر وحده لا يحرر الإنسان ما لم يتجسد في أداة تزيد إنتاجية نبضات الزمن القادم.',
    balanceAxis: {
      leftLabel: 'استثمار طاقة الغد',
      rightLabel: 'استهلاك راحة الحاضر',
      score: 80,
    },
    traits: ['تأجيل الإشباع اللحظي', 'عقلية هندسية للأدوات', 'نَفَس استثماري رصين'],
    challengePhrase: 'صنعتُ أدوات كفاءة الغد وتحملت قسوة البداية. هل تستطيع مقاومة الاستهلاك اللحظي وبناء رصيد حقيقي؟',
  },
  'dynamic-balancer': {
    id: 'dynamic-balancer',
    name: 'مهندس التوازن الديناميكي',
    symbol: '⚖️',
    shortSummary: 'يوازن بدقة بين استهلاك اليوم واستدامة الغد، ويتنقل بمرونة بين الشدة والرخاء حسب نبض السوق.',
    detailedNarrative: 'أنت لا تنجرف إلى مثالية حالمة تهلك الجسد جوعاً، ولا إلى جشع أعمى يستنزف الرصيد الحيوي. تحرك بوصلتك وفق مبدأ الرد بالمثل والتعادل الفطري الذكي.',
    balanceAxis: {
      leftLabel: 'التوازن والاتزان',
      rightLabel: 'التطرف والتذبذب',
      score: 50,
    },
    traits: ['مرونة تشغيلية عالية', 'إدراك نقطة التعادل', 'استجابة سريعة لمتغيرات البيئة'],
    challengePhrase: 'حققتُ نقطة التوازن الفطري دون إفراط ولا تفريط. قارن بوصلتك بقراراتي لترى إن كنت متوازناً حقاً!',
  },
  'high-liquidity-adventurer': {
    id: 'high-liquidity-adventurer',
    name: 'مغامر السيولة العالية',
    symbol: '⚡',
    shortSummary: 'يندفع نحو العائد اللحظي ويتحمل مخاطر الصدمات المفاجئة، مراهناً على سرعة اقتناص الفرص.',
    detailedNarrative: 'تفضل انتزاع كل قطرة عائد في اللحظة الراهنة، معتبراً أن الحاضر حقيقة مؤكدة بينما الغد محفوف بعدم اليقين. شجاعتك تفتح آفاقاً سريعة لكنها تضعك على حافة الهاوية إن تبدلت الرياح.',
    balanceAxis: {
      leftLabel: 'الحذر والتحوط',
      rightLabel: 'المخاطرة واقتناص العائد',
      score: 20,
    },
    traits: ['جرأة في حصد المكاسب', 'تحمل تقلبات المجهول', 'سرعة استجابة للمغانم اللحظية'],
    challengePhrase: 'خضتُ المخاطرة بأقصى درجات الجرأة واقتنصت عائد اللحظة! هل لديك الجرأة لتخوض نفس المأزق؟',
  },
};

/**
 * Classify user metrics into one of the 4 innate archetypes.
 */
export function determineArchetype(
  chapterId: string,
  metrics: Record<string, number>
): ArchetypeProfile {
  // Normalize chapterId
  const ch = chapterId.toLowerCase();

  // 1. Chapter 3: The Common Pasture (لغز المرعى المشترك)
  if (ch.includes('pasture') || ch.includes('03')) {
    const health = metrics.pastureHealth ?? 100;
    const playerSheep = metrics.playerSheep ?? 2;
    const isDesertified = metrics.isDesertified ?? (health < 15 ? 1 : 0);

    if (isDesertified || (playerSheep >= 6 && health < 40)) {
      return ARCHETYPES['high-liquidity-adventurer'];
    }
    if (playerSheep <= 2 && health >= 80) {
      return ARCHETYPES['cautious-guardian'];
    }
    if (playerSheep <= 4 && health >= 55) {
      return ARCHETYPES['dynamic-balancer'];
    }
    return playerSheep > 4 ? ARCHETYPES['high-liquidity-adventurer'] : ARCHETYPES['dynamic-balancer'];
  }

  // 2. Chapter 1: Time Budget / The Currency of Life (ميزانية نبضات اليوم)
  if (ch.includes('time') || ch.includes('currency') || ch.includes('01')) {
    const toolHours = metrics.toolHours ?? 0;
    const workHours = metrics.workHours ?? 0;
    const restHours = metrics.restHours ?? 0;
    const energy = metrics.energy ?? 100;

    if (toolHours >= 6 || (metrics.toolTier ?? 0) >= 2) {
      return ARCHETYPES['patient-builder'];
    }
    if (workHours >= 11 || (energy < 30 && workHours > 8)) {
      return ARCHETYPES['high-liquidity-adventurer'];
    }
    if (restHours >= 7 && workHours <= 6) {
      return ARCHETYPES['cautious-guardian'];
    }
    return ARCHETYPES['dynamic-balancer'];
  }

  // 3. Chapter 6: Price War & Nash Equilibrium (لغز حرب الأسعار)
  if (ch.includes('price') || ch.includes('war') || ch.includes('06')) {
    const undercutCount = metrics.undercutCount ?? 0;
    const cooperateCount = metrics.cooperateCount ?? 0;
    const totalRounds = Math.max(1, (metrics.totalRounds ?? undercutCount + cooperateCount));
    const averagePrice = metrics.averagePrice ?? 8;

    if (undercutCount / totalRounds > 0.6 || averagePrice <= 6) {
      return ARCHETYPES['high-liquidity-adventurer'];
    }
    if (cooperateCount / totalRounds > 0.7 && averagePrice >= 9) {
      return ARCHETYPES['cautious-guardian'];
    }
    if (averagePrice > 6 && averagePrice < 9) {
      return ARCHETYPES['dynamic-balancer'];
    }
    return ARCHETYPES['patient-builder'];
  }

  // 4. Chapter 4: Borrowing Tomorrow / Debt (استعارة طاقة الغد)
  if (ch.includes('borrow') || ch.includes('debt') || ch.includes('04')) {
    const debtRatio = metrics.debtRatio ?? 0;
    const reserves = metrics.reserves ?? 50;

    if (debtRatio > 0.7 || reserves < 15) {
      return ARCHETYPES['high-liquidity-adventurer'];
    }
    if (debtRatio === 0 && reserves >= 60) {
      return ARCHETYPES['cautious-guardian'];
    }
    if (metrics.productiveInvestments && metrics.productiveInvestments > 0) {
      return ARCHETYPES['patient-builder'];
    }
    return ARCHETYPES['dynamic-balancer'];
  }

  // Generic heuristic fallback based on standard dimensions
  const futureScore = metrics.future ?? metrics.sustainability ?? metrics.toolHours ?? 50;
  const riskScore = metrics.risk ?? metrics.immediateGain ?? metrics.workHours ?? 50;
  const altruismScore = metrics.altruism ?? metrics.cooperation ?? 50;

  if (altruismScore > 70) return ARCHETYPES['cautious-guardian'];
  if (futureScore > 65) return ARCHETYPES['patient-builder'];
  if (riskScore > 65) return ARCHETYPES['high-liquidity-adventurer'];
  return ARCHETYPES['dynamic-balancer'];
}

/**
 * Encode simulation state and chapterId into a lightweight, shareable URL query string.
 *
 * Example: "ch=03-pasture&playerSheep=2&pastureHealth=90"
 */
export function encodeSimulationState(
  chapterId: string,
  state: Record<string, number>
): string {
  const params = new URLSearchParams();
  params.set('ch', chapterId);

  for (const [key, value] of Object.entries(state)) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      // Round floating numbers to 2 decimal places to keep URL compact
      const rounded = Math.round(value * 100) / 100;
      params.set(key, String(rounded));
    }
  }

  return params.toString();
}

/**
 * Decode simulation state from a query string or full URL.
 * Returns null if the query string is empty or invalid.
 */
export function decodeSimulationState(
  queryStr: string
): Record<string, number> | null {
  if (!queryStr || typeof queryStr !== 'string') return null;

  try {
    // Extract search query part if a full URL or path is provided
    let search = queryStr.trim();
    if (search.includes('?')) {
      search = search.substring(search.indexOf('?') + 1);
    }
    if (search.includes('#')) {
      search = search.substring(0, search.indexOf('#'));
    }

    if (!search) return null;

    const params = new URLSearchParams(search);
    const result: Record<string, number> = {};
    let count = 0;

    params.forEach((val, key) => {
      // Exclude chapter identifier from numeric state dict
      if (key === 'ch' || key === 'chapterId') return;

      const num = Number(val);
      if (!Number.isNaN(num)) {
        result[key] = num;
        count++;
      }
    });

    return count > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Extract both chapterId and state dictionary from a query string.
 */
export function decodeSimulationPayload(
  queryStr: string
): { chapterId: string | null; state: Record<string, number> | null } {
  if (!queryStr || typeof queryStr !== 'string') {
    return { chapterId: null, state: null };
  }

  let search = queryStr.trim();
  if (search.includes('?')) {
    search = search.substring(search.indexOf('?') + 1);
  }
  const params = new URLSearchParams(search);
  const chapterId = params.get('ch') || params.get('chapterId') || null;
  const state = decodeSimulationState(queryStr);

  return { chapterId, state };
}
