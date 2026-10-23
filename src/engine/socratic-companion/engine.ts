import type {
  Persona,
  PersonaId,
  PageContext,
  SocraticDilemma,
  FlashChallenge,
  KnowledgeEntry,
} from './types';
import { PERSONAS } from './personas';
import { SOCRATIC_DILEMMAS } from './dilemmas';
import { FLASH_CHALLENGES } from './challenges';
import { KNOWLEDGE_BASE } from './knowledge';

/**
 * Normalize Arabic text for resilient fuzzy matching
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove harakat/tashkeel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()؟?]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Common Arabic stopwords that should not trigger false-positive keyword matches
 */
export const ARABIC_STOPWORDS = new Set([
  'ما', 'ماذا', 'هل', 'في', 'من', 'عن', 'على', 'الي', 'الى', 'هو', 'هي', 'هم', 'هن',
  'ان', 'انما', 'كان', 'كانت', 'مع', 'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'كم', 'لو',
  'او', 'ثم', 'حتى', 'كل', 'غير', 'بين', 'قد', 'لا', 'لم', 'لن', 'اي', 'كيف', 'لماذا',
  'التي', 'الذي', 'الذين', 'اللواتي', 'هناك', 'عند', 'عندما', 'اذا', 'فقد', 'لقد'
]);

/**
 * Strips Arabic definite articles ('ال') and proclitics ('و', 'ف', 'ب', 'ل', 'ك')
 * ensuring remaining stem has meaningful length.
 */
export function stripArabicPrefix(word: string): string {
  if (!word || word.length < 3) return word;

  // Compound proclitics with definite article (وال، بال، فال، كال، لل)
  if (word.length >= 5) {
    if (word.startsWith('وال') || word.startsWith('بال') || word.startsWith('فال') || word.startsWith('كال')) {
      return word.slice(3);
    }
  }
  if (word.length >= 4 && word.startsWith('لل')) {
    return word.slice(2);
  }

  // Definite article (ال)
  if (word.length >= 4 && word.startsWith('ال')) {
    return word.slice(2);
  }

  // Single letter proclitics (و, ف, ب, ل) - preserve if stem has at least 3 letters
  if (word.length >= 4 && (word.startsWith('و') || word.startsWith('ف') || word.startsWith('ب') || word.startsWith('ل'))) {
    return word.slice(1);
  }

  return word;
}

/**
 * Resilient bi-directional and stem-aware Arabic token matching
 */
export function matchesArabicToken(target: string, token: string): boolean {
  if (!target || !token) return false;
  if (target.includes(token) || token.includes(target)) return true;

  const stemTarget = stripArabicPrefix(target);
  const stemToken = stripArabicPrefix(token);
  if (stemTarget.length >= 2 && stemToken.length >= 2) {
    if (stemTarget.includes(stemToken) || stemToken.includes(stemTarget)) return true;
  }
  return false;
}

/**
 * Detect page context from the current pathname
 */
export function detectContext(pathname: string): PageContext {
  const cleanPath = pathname.toLowerCase();

  if (cleanPath.includes('/sandbox')) {
    return {
      type: 'sandbox',
      title: 'المخبر الاقتصادي التجريبي (Sandbox)',
    };
  }

  if (cleanPath.includes('/about')) {
    return {
      type: 'about',
      title: 'عن منصة الاقتصاد الفطري',
    };
  }

  // Chapters detection
  const chapterMatch = cleanPath.match(/chapters\/([0-9]+-[a-z0-9\-]+)/);
  if (chapterMatch) {
    const slug = chapterMatch[1];
    let num = 1;
    let title = 'الفصل التفاعلي';

    if (slug.includes('currency-of-life')) {
      num = 1;
      title = 'التجربة 1: ميزانية نبضات اليوم';
    } else if (slug.includes('bread-and-gold')) {
      num = 2;
      title = 'التجربة 2: جزيرة الرغيف والذهب';
    } else if (slug.includes('common-pasture')) {
      num = 3;
      title = 'التجربة 3: لغز المرعى المشترك';
    } else if (slug.includes('borrowing-tomorrow')) {
      num = 4;
      title = 'التجربة 4: استعارة طاقة الغد';
    } else if (slug.includes('whisper-in-the-market')) {
      num = 5;
      title = 'التجربة 5: همسة في السوق';
    } else if (slug.includes('price-war')) {
      num = 6;
      title = 'التجربة 6: لغز حرب الأسعار وحصار الربح';
    }

    return {
      type: 'chapter',
      chapterSlug: slug,
      chapterNumber: num,
      title,
    };
  }

  return {
    type: 'home',
    title: 'فهرس منصة الاقتصاد الفطري',
  };
}

/**
 * Get persona by ID with fallback
 */
export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id] || PERSONAS.abu_fitra;
}

/**
 * Retrieve relevant Socratic Dilemmas for the active context
 */
export function getDilemmasForContext(context: PageContext): SocraticDilemma[] {
  if (context.type === 'chapter' && context.chapterSlug) {
    const matched = SOCRATIC_DILEMMAS.filter((d) => d.chapterSlug === context.chapterSlug);
    if (matched.length > 0) return matched;
  }

  if (context.type === 'sandbox') {
    const matched = SOCRATIC_DILEMMAS.filter((d) => d.chapterSlug === 'sandbox');
    if (matched.length > 0) return matched;
  }

  // Return all dilemmas for home/general
  return SOCRATIC_DILEMMAS;
}

/**
 * Retrieve Flash Challenges for the active context
 */
export function getChallengesForContext(context: PageContext): FlashChallenge[] {
  if (context.type === 'chapter' && context.chapterSlug) {
    const matched = FLASH_CHALLENGES.filter((c) => c.chapterSlug === context.chapterSlug);
    if (matched.length > 0) return matched;
  }

  return FLASH_CHALLENGES;
}

/**
 * Resilient multi-keyword search in the Knowledge Base
 * Filters stopwords, normalizes definite articles, and supports bi-directional token matching.
 */
export function searchKnowledge(query: string, returnDefaultsIfEmpty: boolean = false): KnowledgeEntry[] {
  const normQuery = normalizeArabic(query);
  if (!normQuery) {
    return returnDefaultsIfEmpty ? KNOWLEDGE_BASE.slice(0, 4) : [];
  }

  const rawTokens = normQuery.split(' ').filter((t) => t.length > 1);
  const queryTokens = rawTokens.filter((t) => !ARABIC_STOPWORDS.has(t));

  // If query was composed solely of stopwords, return empty results (prevent stopword noise)
  if (queryTokens.length === 0) {
    return [];
  }

  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    const normQuestion = normalizeArabic(entry.question);
    const normDeep = normalizeArabic(entry.deepExplanation);
    const normQuick = normalizeArabic(entry.quickAnswer);
    const normKeywords = entry.keywords.map(normalizeArabic);

    // Exact question match
    if (normQuestion.includes(normQuery)) score += 50;

    for (const token of queryTokens) {
      const stemToken = stripArabicPrefix(token);

      // Bi-directional and stem keyword matching
      if (normKeywords.some((k) => matchesArabicToken(k, token))) {
        score += 20;
      }
      if (normQuestion.includes(token) || (stemToken.length >= 3 && normQuestion.includes(stemToken))) {
        score += 15;
      }
      if (normQuick.includes(token) || (stemToken.length >= 3 && normQuick.includes(stemToken))) {
        score += 8;
      }
      if (normDeep.includes(token) || (stemToken.length >= 3 && normDeep.includes(stemToken))) {
        score += 4;
      }
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

/**
 * Socratic QA responder synthesizing Persona voice + knowledge
 */
export function askSocraticAgent(
  query: string,
  personaId: PersonaId,
  context: PageContext
): {
  matchedEntry?: KnowledgeEntry;
  response: string;
  personaQuote: string;
  suggestedAction?: string;
} {
  const persona = getPersona(personaId);
  const trimmed = query ? query.trim() : '';

  // Guard against empty query or whitespace
  if (!trimmed || !normalizeArabic(trimmed)) {
    return {
      response: `اطرح عليّ أي تساؤل يدور في ذهنك يا صديقي! سأجيبك من منظور فكري واقتصادي عميق.`,
      personaQuote: persona.perspectiveSummary,
      suggestedAction: 'اكتب سؤالك في خانة البحث أو اختر أحد الأسئلة المقترحة.',
    };
  }

  const results = searchKnowledge(trimmed);

  if (results.length > 0) {
    const best = results[0];
    const personaQuote =
      best.personaComments[personaId] || best.personaComments.abu_fitra || '';

    let intro = '';
    switch (personaId) {
      case 'ibn_khaldun':
        intro = `تأمل يا أخي في طبائع العمران: `;
        break;
      case 'adam_smith':
        intro = `المسألة تخضع لقوانين التبادل وحوافز الفاعلين: `;
        break;
      case 'keynes':
        intro = `انظر للصورة الكلية وحركة التدفق النقدي: `;
        break;
      case 'abu_fitra':
        intro = `شوف يا غالي، الموضوع أبسط مما تتخيل: `;
        break;
    }

    return {
      matchedEntry: best,
      response: `${intro}${best.quickAnswer}\n\n${best.deepExplanation}\n\nمثال من الواقع: ${best.practicalExample}`,
      personaQuote,
      suggestedAction: best.chapterSlug
        ? `يمكنك اختبار هذا المفهوم حياً في [${best.chapterName}](/chapters/${best.chapterSlug})`
        : undefined,
    };
  }

  // Fallback if no direct match found
  return {
    response: `سؤال عميق! في سياق ${context.title}، القواعد الاقتصادية ترجع دائماً إلى معادلة فطرية بسيطة: الموارد شحيحة (سواء كانت وقتاً، ذهباً، أو مراعي)، والبشر يختارون وفق حوافزهم وتكلفة ما يضحون به.`,
    personaQuote: persona.perspectiveSummary,
    suggestedAction: 'جرب استكشاف إحدى محطات المخبر التجريبي لترى كيف تتشكل النتيجة بيدك.',
  };
}
