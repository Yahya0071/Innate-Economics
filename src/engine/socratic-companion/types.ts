export type PersonaId = 'ibn_khaldun' | 'adam_smith' | 'keynes' | 'abu_fitra';

export interface Persona {
  id: PersonaId;
  name: string;
  title: string;
  avatar: string;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  perspectiveSummary: string;
  greeting: string;
}

export type PageContextType = 'chapter' | 'sandbox' | 'home' | 'about' | 'general';

export interface PageContext {
  type: PageContextType;
  chapterSlug?: string;
  chapterNumber?: number;
  title: string;
}

export interface SocraticOptionReaction {
  reaction: string;
  takeaway: string;
}

export interface SocraticOption {
  id: string;
  text: string;
  personaReactions: Record<PersonaId, SocraticOptionReaction>;
  isIntuitiveTrap?: boolean;
}

export interface SocraticDilemma {
  id: string;
  chapterSlug?: string;
  title: string;
  provocation: string;
  storyContext: string;
  options: SocraticOption[];
  socraticLesson: string;
}

export interface FlashChallengeOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface FlashChallenge {
  id: string;
  chapterSlug?: string;
  chapterNumber?: number;
  title: string;
  scenario: string;
  question: string;
  options: FlashChallengeOption[];
  conceptTag: string;
  intuitiveTip: string;
}

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  quickAnswer: string;
  deepExplanation: string;
  practicalExample: string;
  chapterSlug?: string;
  chapterName?: string;
  personaComments: Record<PersonaId, string>;
}
