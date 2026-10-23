import { describe, it, expect } from 'vitest';
import {
  detectContext,
  getPersona,
  getDilemmasForContext,
  getChallengesForContext,
  searchKnowledge,
  askSocraticAgent,
  normalizeArabic,
} from '../../src/engine/socratic-companion/engine';
import { PERSONAS } from '../../src/engine/socratic-companion/personas';

describe('Socratic Companion Engine', () => {
  it('correctly normalizes Arabic text removing tashkeel and unifying letters', () => {
    const raw = 'التَّضَخُّمُ وَالفائِدَةُ المُرَكَّبَةِ!';
    const norm = normalizeArabic(raw);
    expect(norm).toContain('تضخم');
    expect(norm).toContain('فائده');
    expect(norm).toContain('مركبه');
  });

  it('detects page context accurately for chapters and sandbox', () => {
    const ch2Context = detectContext('/chapters/2-bread-and-gold');
    expect(ch2Context.type).toBe('chapter');
    expect(ch2Context.chapterNumber).toBe(2);
    expect(ch2Context.chapterSlug).toBe('2-bread-and-gold');

    const sandboxContext = detectContext('/sandbox');
    expect(sandboxContext.type).toBe('sandbox');

    const homeContext = detectContext('/');
    expect(homeContext.type).toBe('home');
  });

  it('returns appropriate persona details and fallback', () => {
    const khaldun = getPersona('ibn_khaldun');
    expect(khaldun.name).toBe('ابن خلدون');
    expect(khaldun.avatar).toBe('📜');

    const smith = getPersona('adam_smith');
    expect(smith.name).toBe('آدم سميث');

    // Fallback for invalid persona
    // @ts-expect-error testing invalid ID
    const fallback = getPersona('invalid_id');
    expect(fallback.name).toBe('أبو الفطرة');
  });

  it('retrieves chapter-specific dilemmas and challenges', () => {
    const ch1Context = detectContext('/chapters/1-currency-of-life');
    const dilemmas = getDilemmasForContext(ch1Context);
    expect(dilemmas.length).toBeGreaterThan(0);
    expect(dilemmas[0].chapterSlug).toBe('1-currency-of-life');

    const challenges = getChallengesForContext(ch1Context);
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges[0].chapterNumber).toBe(1);
  });

  it('performs resilient search on economic knowledge base', () => {
    const resultsTadakhum = searchKnowledge('تضخم وطباعة النقود');
    expect(resultsTadakhum.length).toBeGreaterThan(0);
    expect(resultsTadakhum[0].id).toBe('money-illusion');

    const resultsRiba = searchKnowledge('الربا وفخ الديون');
    expect(resultsRiba.length).toBeGreaterThan(0);
    expect(resultsRiba[0].id).toBe('debt-interest-spiral');
  });

  it('matches Arabic keywords regardless of definite article "ال" and proclitics', () => {
    // Query with "التضخم" should match keyword "تضخم"
    const resultsDefinite = searchKnowledge('التضخم');
    expect(resultsDefinite.length).toBeGreaterThan(0);
    expect(resultsDefinite.some((r) => r.id === 'money-illusion')).toBe(true);

    // Query with proclitic "والتضخم"
    const resultsProclitic = searchKnowledge('والتضخم');
    expect(resultsProclitic.length).toBeGreaterThan(0);
    expect(resultsProclitic.some((r) => r.id === 'money-illusion')).toBe(true);
  });

  it('filters out Arabic stopwords and resists stopword noise', () => {
    // Query consisting only of stopwords should return empty results
    const stopwordOnly = searchKnowledge('ما هو في هل من');
    expect(stopwordOnly.length).toBe(0);

    // Empty query returns empty by default
    const emptyResults = searchKnowledge('');
    expect(emptyResults.length).toBe(0);

    // Empty query with fallback flag returns defaults
    const defaults = searchKnowledge('', true);
    expect(defaults.length).toBe(4);
  });

  it('generates persona-specific answers for visitor queries and guards empty questions', () => {
    const context = detectContext('/chapters/4-borrowing-tomorrow');
    const answerKhaldun = askSocraticAgent('الفائدة المركبة والديون', 'ibn_khaldun', context);
    expect(answerKhaldun.response).toContain('طبائع العمران');
    expect(answerKhaldun.personaQuote).toContain('المكسب يجب أن يكون متولداً من صناعة');

    const answerSmith = askSocraticAgent('الفائدة المركبة والديون', 'adam_smith', context);
    expect(answerSmith.response).toContain('قوانين التبادل');

    // Empty question guard
    const emptyAnswer = askSocraticAgent('', 'abu_fitra', context);
    expect(emptyAnswer.matchedEntry).toBeUndefined();
    expect(emptyAnswer.response).toContain('اطرح عليّ أي تساؤل');
  });
});
