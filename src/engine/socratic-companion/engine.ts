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

    if (slug.includes('1-currency-of-life')) {
      num = 1;
      title = 'التجربة 1: ميزانية نبضات اليوم';
    } else if (slug.includes('2-bread-and-gold')) {
      num = 2;
      title = 'التجربة 2: جزيرة الرغيف والذهب';
    } else if (slug.includes('3-common-pasture')) {
      num = 3;
      title = 'التجربة 3: لغز المرعى المشترك';
    } else if (slug.includes('4-borrowing-tomorrow')) {
      num = 4;
      title = 'التجربة 4: اقتراض الغد وسحر الفائدة';
    } else if (slug.includes('5-whisper-in-the-market')) {
      num = 5;
      title = 'التجربة 5: همسة في السوق وإشارات الأسعار';
    } else if (slug.includes('6-price-war')) {
      num = 6;
      title = 'التجربة 6: حرب الأسعار ومفارقة برتراند';
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
 */
export function searchKnowledge(query: string): KnowledgeEntry[] {
  const normQuery = normalizeArabic(query);
  if (!normQuery) return KNOWLEDGE_BASE.slice(0, 4);

  const queryTokens = normQuery.split(' ').filter((t) => t.length > 1);

  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    const normQuestion = normalizeArabic(entry.question);
    const normDeep = normalizeArabic(entry.deepExplanation);
    const normQuick = normalizeArabic(entry.quickAnswer);
    const normKeywords = entry.keywords.map(normalizeArabic);

    // Exact question match
    if (normQuestion.includes(normQuery)) score += 50;

    for (const token of queryTokens) {
      if (normKeywords.some((k) => k.includes(token))) score += 20;
      if (normQuestion.includes(token)) score += 15;
      if (normQuick.includes(token)) score += 8;
      if (normDeep.includes(token)) score += 4;
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
  const results = searchKnowledge(query);

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
