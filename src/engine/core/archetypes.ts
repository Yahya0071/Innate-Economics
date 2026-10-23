/**
 * Archetype Calculation & Decision Fingerprint Engine (محرك حساب الأنماط وبصمة القرار)
 * 
 * Analyzes human economic choices across simulations and categorizes the player
 * into innate behavioral archetypes, with URL state serialization and hardened input sanitization.
 * ZERO DOM / ZERO React dependencies. Pure TypeScript.
 */

export type ArchetypeId =
  | 'cautious-guardian'
  | 'patient-builder'
  | 'dynamic-balancer'
  | 'high-liquidity-adventurer'
  | 'aggressive-extractor';

export interface ArchetypeProfile {
  id: ArchetypeId;
  name: string;             // الاسم الفطري للنمط
  symbol: string;           // الرمز البصري المعبر
  shortSummary: string;     // ملخص السلوك في سطرين
  detailedNarrative: string;// الوصف البيداغوجي الفطري
  balanceAxis: {
    leftLabel: string;      // قطب الإيثار / المستقبل
    rightLabel: string;     // قطب المنفعة اللحظية / الحاضر
    score: number;          // النسبة المئوية من 0 إلى 100 (محسوبة ديناميكياً)
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
  'aggressive-extractor': {
    id: 'aggressive-extractor',
    name: 'مستنزف المشاع الجائر',
    symbol: '🪓',
    shortSummary: 'يندفع لتعظيم مكاسبه الفردية السريعة متجاهلاً قدرة المورد على التجدد، مما يعجل بانهيار النظام المشترك.',
    detailedNarrative: 'تغلب عليك الرغبة في قطف الثمار العاجلة قبل أن يسبقك إليها الآخرون، معتبراً أن ما لا تأخذه أنت اليوم سيأخذه غيرك، ولو كان الثمن تصحر الأرض وفناء الرصيد الحيوي للجميع.',
    balanceAxis: {
      leftLabel: 'استدامة المشاع والتشارك',
      rightLabel: 'الاستنزاف الفردي الجائر',
      score: 15,
    },
    traits: ['استنزاف متسارع للموارد', 'أنانية حركية عاجلة', 'تجاهل الحدود البيئية'],
    challengePhrase: 'استنزفتُ المرعى لتعظيم قطيعي اللحظي حتى تصحرت الأرض! هل ستتحلى بالحكمة أم ستسقط في الفخ نفسه؟',
  },
};

export type CanonicalChapterId =
  | 'ch1-time-budget'
  | 'ch2-bread-and-gold'
  | 'ch3-common-pasture'
  | 'ch4-borrowing-tomorrow'
  | 'ch5-whisper-market'
  | 'ch6-price-war'
  | 'sandbox';

/**
 * Exact, deterministic mapping of chapter identifiers to canonical keys
 */
export const CHAPTER_ALIAS_MAP: Record<string, CanonicalChapterId> = {
  // Chapter 1
  '01-currency-of-life': 'ch1-time-budget',
  '1-currency-of-life': 'ch1-time-budget',
  '01-time-budget': 'ch1-time-budget',
  '1-time-budget': 'ch1-time-budget',
  'time-budget': 'ch1-time-budget',
  'currency-of-life': 'ch1-time-budget',

  // Chapter 2
  '02-bread-and-gold': 'ch2-bread-and-gold',
  '2-bread-and-gold': 'ch2-bread-and-gold',
  'bread-and-gold': 'ch2-bread-and-gold',
  'village-money': 'ch2-bread-and-gold',

  // Chapter 3
  '03-common-pasture': 'ch3-common-pasture',
  '3-common-pasture': 'ch3-common-pasture',
  'common-pasture': 'ch3-common-pasture',
  'pasture': 'ch3-common-pasture',

  // Chapter 4
  '04-borrowing-tomorrow': 'ch4-borrowing-tomorrow',
  '4-borrowing-tomorrow': 'ch4-borrowing-tomorrow',
  'borrowing-tomorrow': 'ch4-borrowing-tomorrow',
  'borrowing': 'ch4-borrowing-tomorrow',

  // Chapter 5
  '05-whisper-in-the-market': 'ch5-whisper-market',
  '5-whisper-in-the-market': 'ch5-whisper-market',
  'whisper-in-the-market': 'ch5-whisper-market',
  'whisper-market': 'ch5-whisper-market',
  'whisper': 'ch5-whisper-market',

  // Chapter 6
  '06-price-war': 'ch6-price-war',
  '6-price-war': 'ch6-price-war',
  'price-war': 'ch6-price-war',

  // Sandbox
  'sandbox': 'sandbox',
};

export function resolveCanonicalChapter(chapterId: string): CanonicalChapterId | null {
  if (!chapterId) return null;
  const key = chapterId.trim().toLowerCase();
  return CHAPTER_ALIAS_MAP[key] ?? null;
}

/**
 * Parameter whitelists and safe bounds per chapter
 */
export const CHAPTER_PARAM_WHITELIST: Record<
  CanonicalChapterId,
  Record<string, { min: number; max: number }>
> = {
  'ch1-time-budget': {
    w: { min: 0, max: 16 },
    t: { min: 0, max: 16 },
    r: { min: 0, max: 16 },
    workHours: { min: 0, max: 16 },
    toolHours: { min: 0, max: 16 },
    restHours: { min: 0, max: 16 },
    toolTier: { min: 0, max: 5 },
    energy: { min: 0, max: 100 },
  },
  'ch2-bread-and-gold': {
    m: { min: 10, max: 1000 },
    q: { min: 1, max: 500 },
    cap: { min: 0, max: 100 },
    goldSupply: { min: 10, max: 1000 },
    ovensCount: { min: 1, max: 10 },
    dailyBreadCapacity: { min: 20, max: 500 },
    priceCeiling: { min: 0, max: 100 },
    officialPrice: { min: 0, max: 100 },
    blackMarketPrice: { min: 0, max: 200 },
  },
  'ch3-common-pasture': {
    sheep: { min: 0, max: 20 },
    playerSheep: { min: 0, max: 20 },
    health: { min: 0, max: 100 },
    pastureHealth: { min: 0, max: 100 },
    totalGold: { min: 0, max: 100000 },
    isDesertified: { min: 0, max: 1 },
  },
  'ch4-borrowing-tomorrow': {
    loan: { min: 0, max: 100 },
    prod: { min: 0, max: 100 },
    rate: { min: 0, max: 100 },
    reserves: { min: 0, max: 10000 },
    debtRatio: { min: 0, max: 1 },
    productiveInvestments: { min: 0, max: 100 },
    loanPrincipal: { min: 0, max: 100 },
  },
  'ch5-whisper-market': {
    reserve: { min: 5, max: 100 },
    insurance: { min: 0, max: 1 },
    reserveRatio: { min: 0.05, max: 1 },
    hasDepositInsurance: { min: 0, max: 1 },
    deposits: { min: 0, max: 1000000 },
    shortage: { min: 0, max: 1000000 },
  },
  'ch6-price-war': {
    price: { min: 1, max: 50 },
    rounds: { min: 1, max: 200 },
    myPrice: { min: 1, max: 50 },
    totalRounds: { min: 1, max: 200 },
    cooperateCount: { min: 0, max: 200 },
    undercutCount: { min: 0, max: 200 },
    averagePrice: { min: 1, max: 50 },
  },
  'sandbox': {
    future: { min: 0, max: 100 },
    sustainability: { min: 0, max: 100 },
    risk: { min: 0, max: 100 },
    immediateGain: { min: 0, max: 100 },
    altruism: { min: 0, max: 100 },
    cooperation: { min: 0, max: 100 },
    gini: { min: 0, max: 1 },
    trades: { min: 0, max: 100000 },
  },
};

function clampScore(val: number): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) return 50;
  return Math.max(5, Math.min(95, Math.round(val)));
}

/**
 * Classify user metrics into one of the innate archetypes.
 * Uses exact chapter map dispatch, includes branches for all chapters,
 * and computes dynamic balance scores reflecting the player's actual choices.
 */
export function determineArchetype(
  chapterId: string,
  metrics: Record<string, number>
): ArchetypeProfile {
  const canonical = resolveCanonicalChapter(chapterId);

  // 1. Chapter 1: Time Budget / The Currency of Life (ميزانية نبضات اليوم)
  if (canonical === 'ch1-time-budget') {
    const toolHours = metrics.toolHours ?? metrics.t ?? 0;
    const workHours = metrics.workHours ?? metrics.w ?? 0;
    const restHours = metrics.restHours ?? metrics.r ?? 0;
    const energy = metrics.energy ?? 100;

    const dynamicScore = clampScore(((toolHours * 1.5 + restHours * 0.5) / 16) * 100);

    let base: ArchetypeProfile;
    if (toolHours >= 6 || (metrics.toolTier ?? 0) >= 2) {
      base = ARCHETYPES['patient-builder'];
    } else if (workHours >= 11 || (energy < 30 && workHours > 8)) {
      base = ARCHETYPES['high-liquidity-adventurer'];
    } else if (restHours >= 7 && workHours <= 6) {
      base = ARCHETYPES['cautious-guardian'];
    } else {
      base = ARCHETYPES['dynamic-balancer'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // 2. Chapter 2: Village Money / Bread & Gold (جزيرة الرغيف والذهب)
  if (canonical === 'ch2-bread-and-gold') {
    const goldSupply = metrics.goldSupply ?? metrics.m ?? 20;
    const ovensCount = metrics.ovensCount ?? (metrics.q ? Math.round(metrics.q / 20) : 1);
    const priceCeiling = metrics.priceCeiling ?? metrics.cap ?? 0;

    const dynamicScore = clampScore(((ovensCount * 20) / Math.max(20, goldSupply)) * 100);

    let base: ArchetypeProfile;
    if (ovensCount >= 3 || (metrics.dailyBreadCapacity ?? 0) >= 60) {
      base = ARCHETYPES['patient-builder'];
    } else if (goldSupply >= 60 && ovensCount <= 1) {
      base = ARCHETYPES['high-liquidity-adventurer'];
    } else if (priceCeiling > 0 && priceCeiling <= 2) {
      base = ARCHETYPES['cautious-guardian'];
    } else {
      base = ARCHETYPES['dynamic-balancer'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // 3. Chapter 3: The Common Pasture (لغز المرعى المشترك)
  if (canonical === 'ch3-common-pasture') {
    const health = metrics.pastureHealth ?? metrics.health ?? 100;
    const playerSheep = metrics.playerSheep ?? metrics.sheep ?? 2;
    const isDesertified = metrics.isDesertified ?? (health < 15 ? 1 : 0);

    const dynamicScore = clampScore(health * (1 - playerSheep / 10));

    let base: ArchetypeProfile;
    if (isDesertified || (playerSheep >= 6 && health < 40) || playerSheep > 4) {
      base = ARCHETYPES['aggressive-extractor'];
    } else if (playerSheep <= 2 && health >= 80) {
      base = ARCHETYPES['cautious-guardian'];
    } else {
      base = ARCHETYPES['dynamic-balancer'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // 4. Chapter 4: Borrowing Tomorrow / Debt (استعارة طاقة الغد)
  if (canonical === 'ch4-borrowing-tomorrow') {
    const debtRatio = metrics.debtRatio ?? (metrics.loan ? metrics.loan / 40 : 0);
    const reserves = metrics.reserves ?? 50;
    const productive = metrics.productiveInvestments ?? metrics.prod ?? 0;
    const loan = metrics.loanPrincipal ?? metrics.loan ?? 0;

    const dynamicScore = clampScore(
      loan > 0 ? (productive / Math.max(1, loan)) * 100 : reserves
    );

    let base: ArchetypeProfile;
    if (debtRatio > 0.7 || reserves < 15) {
      base = ARCHETYPES['high-liquidity-adventurer'];
    } else if (debtRatio === 0 && reserves >= 60) {
      base = ARCHETYPES['cautious-guardian'];
    } else if (productive > 0 && productive >= loan * 0.6) {
      base = ARCHETYPES['patient-builder'];
    } else {
      base = ARCHETYPES['dynamic-balancer'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // 5. Chapter 5: Whisper in the Market / Bank Run (همسة في السوق والهلع المصرفي)
  if (canonical === 'ch5-whisper-market') {
    const rawReserve = metrics.reserveRatio ?? metrics.reserve ?? 0.20;
    const reserveRatio = rawReserve > 1 ? rawReserve / 100 : rawReserve;
    const hasInsurance = (metrics.hasDepositInsurance ?? metrics.insurance ?? 0) === 1;
    const shortage = metrics.shortage ?? 0;

    const dynamicScore = clampScore(reserveRatio * 100);

    let base: ArchetypeProfile;
    if (reserveRatio >= 0.40) {
      base = ARCHETYPES['cautious-guardian'];
    } else if (reserveRatio <= 0.10 || shortage > 0) {
      base = ARCHETYPES['high-liquidity-adventurer'];
    } else if (hasInsurance && reserveRatio >= 0.20) {
      base = ARCHETYPES['patient-builder'];
    } else {
      base = ARCHETYPES['dynamic-balancer'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // 6. Chapter 6: Price War & Nash Equilibrium (لغز حرب الأسعار)
  if (canonical === 'ch6-price-war') {
    const undercutCount = metrics.undercutCount ?? 0;
    const cooperateCount = metrics.cooperateCount ?? 0;
    const totalRounds = Math.max(1, metrics.totalRounds ?? undercutCount + cooperateCount);
    const averagePrice = metrics.averagePrice ?? 8;

    const dynamicScore = clampScore((cooperateCount / totalRounds) * 100);

    let base: ArchetypeProfile;
    if (undercutCount / totalRounds > 0.6 || averagePrice <= 6) {
      base = ARCHETYPES['high-liquidity-adventurer'];
    } else if (cooperateCount / totalRounds > 0.7 && averagePrice >= 9) {
      base = ARCHETYPES['cautious-guardian'];
    } else if (averagePrice > 6 && averagePrice < 9) {
      base = ARCHETYPES['dynamic-balancer'];
    } else {
      base = ARCHETYPES['patient-builder'];
    }

    return {
      ...base,
      balanceAxis: { ...base.balanceAxis, score: dynamicScore },
    };
  }

  // Generic heuristic fallback (e.g. Sandbox)
  const futureScore = metrics.future ?? metrics.sustainability ?? metrics.toolHours ?? 50;
  const riskScore = metrics.risk ?? metrics.immediateGain ?? metrics.workHours ?? 50;
  const altruismScore = metrics.altruism ?? metrics.cooperation ?? 50;
  const dynamicScore = clampScore(altruismScore > 50 ? altruismScore : futureScore);

  let base: ArchetypeProfile;
  if (altruismScore > 70) base = ARCHETYPES['cautious-guardian'];
  else if (futureScore > 65) base = ARCHETYPES['patient-builder'];
  else if (riskScore > 65) base = ARCHETYPES['high-liquidity-adventurer'];
  else base = ARCHETYPES['dynamic-balancer'];

  return {
    ...base,
    balanceAxis: { ...base.balanceAxis, score: dynamicScore },
  };
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
    if (typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value)) {
      // Round floating numbers to 2 decimal places to keep URL compact
      const rounded = Math.round(value * 100) / 100;
      params.set(key, String(rounded));
    }
  }

  return params.toString();
}

/**
 * Decode simulation state from a query string or full URL.
 * Sanitizes input against Infinity, 1e999, empty strings, unbounded keys,
 * and whitelists/clamps ranges per chapter.
 */
export function decodeSimulationState(
  queryStr: string,
  chapterId?: string
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

    const detectedChapter = chapterId || params.get('ch') || params.get('chapterId') || '';
    const canonical = resolveCanonicalChapter(detectedChapter);
    const whitelist = canonical ? CHAPTER_PARAM_WHITELIST[canonical] : null;

    params.forEach((rawVal, key) => {
      // Exclude chapter identifier from numeric state dict
      if (key === 'ch' || key === 'chapterId') return;

      // Reject empty string or whitespace (fixes Number("") -> 0 issue)
      if (!rawVal || rawVal.trim() === '') return;
      const trimmed = rawVal.trim();

      // Guard against Infinity, -Infinity, NaN strings
      if (
        trimmed.toLowerCase().includes('infinity') ||
        trimmed.toLowerCase().includes('nan')
      ) {
        return;
      }

      const num = Number(trimmed);
      if (!Number.isFinite(num) || Number.isNaN(num)) return;

      // If chapter whitelist is available, only allow whitelisted keys and clamp to range
      if (whitelist) {
        if (!(key in whitelist)) return;
        const { min, max } = whitelist[key];
        result[key] = Math.max(min, Math.min(max, num));
        count++;
      } else {
        // Safe generic identifier validation: letters, numbers, underscores (1-32 chars)
        if (!/^[a-zA-Z0-9_]{1,32}$/.test(key)) return;
        result[key] = Math.max(-1e6, Math.min(1e6, num));
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
  const state = decodeSimulationState(queryStr, chapterId || undefined);

  return { chapterId, state };
}
