import React, { useState, useEffect, useId } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Compass,
  Lightbulb,
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
} from 'lucide-react';
import {
  detectContext,
  getPersona,
  getDilemmasForContext,
  getChallengesForContext,
  searchKnowledge,
  askSocraticAgent,
} from '../../engine/socratic-companion/engine';
import { PERSONA_LIST } from '../../engine/socratic-companion/personas';
import type {
  PersonaId,
  PageContext,
  SocraticDilemma,
  FlashChallenge,
  KnowledgeEntry,
} from '../../engine/socratic-companion/types';
import {
  playTone,
  playTick,
  playSuccessChime,
  playCoinSound,
} from '../../utils/audio';

export const SocraticCompanion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>('abu_fitra');
  const [activeTab, setActiveTab] = useState<'dialogue' | 'challenge' | 'search'>('dialogue');
  const [context, setContext] = useState<PageContext>({
    type: 'home',
    title: 'منصة الاقتصاد الفطري',
  });

  // Dialogue tab state
  const [selectedDilemmaIdx, setSelectedDilemmaIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Challenge tab state
  const [selectedChallengeIdx, setSelectedChallengeIdx] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [challengeScore, setChallengeScore] = useState(0);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const searchInputId = useId();

  // Detect context on mount and on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentContext = detectContext(window.location.pathname);
      setContext(currentContext);

      // Check saved persona preference
      try {
        const savedPersona = localStorage.getItem('socratic_persona') as PersonaId;
        if (savedPersona && ['ibn_khaldun', 'adam_smith', 'keynes', 'abu_fitra'].includes(savedPersona)) {
          setActivePersonaId(savedPersona);
        }
      } catch {
        // LocalStorage fallback
      }
    }
  }, []);

  const persona = getPersona(activePersonaId);
  const dilemmas = getDilemmasForContext(context);
  const currentDilemma: SocraticDilemma | undefined = dilemmas[selectedDilemmaIdx] || dilemmas[0];

  const challenges = getChallengesForContext(context);
  const currentChallenge: FlashChallenge | undefined = challenges[selectedChallengeIdx] || challenges[0];

  const searchResults = searchKnowledge(searchQuery);

  const handleSelectPersona = (id: PersonaId) => {
    setActivePersonaId(id);
    playTick();
    try {
      localStorage.setItem('socratic_persona', id);
    } catch {
      // ignore
    }
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        playTone(659, 0.08); // Pleasant E5 note
      } else {
        playTick();
      }
      return next;
    });
  };

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    playCoinSound();
  };

  const handleAnswerChallenge = (choiceId: string, isCorrect: boolean) => {
    setSelectedChoiceId(choiceId);
    if (isCorrect) {
      playSuccessChime();
      setChallengeScore((s) => s + 1);
    } else {
      playTone(220, 0.15); // soft lower buzz
    }
  };

  const handleNextChallenge = () => {
    setSelectedChoiceId(null);
    setSelectedChallengeIdx((prev) => (prev + 1) % challenges.length);
    playTick();
  };

  return (
    <>
      {/* Floating Trigger Beacon (Bottom-Left) */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        <button
          onClick={handleToggleOpen}
          aria-label="فتح المرشد الاقتصادي السقراطي"
          className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-400/60 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Animated Glow Halo */}
          <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-emerald-500/20 blur-sm opacity-75 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

          {/* Persona Avatar */}
          <span className="text-xl sm:text-2xl filter drop-shadow relative z-10">
            {persona.avatar}
          </span>

          {/* Text Badge */}
          <div className="text-right relative z-10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>المرشد السقراطي</span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5 font-light">
              {persona.name}
            </span>
          </div>

          {/* Unread / Attention Indicator */}
          <span className="relative flex h-2 w-2 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </button>
      </div>

      {/* Slide-in Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-slate-950 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="المرشد الاقتصادي السقراطي"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                  {persona.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      المعيد الاقتصادي السقراطي
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      رفيق التعلم الحي
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {context.title}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleOpen}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="إغلاق المرشد"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Persona Switcher Bar */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  اختر المنظور الفكري لمحاورك:
                </span>
                <span className="text-[10px] text-amber-400 font-light">
                  {persona.title}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PERSONA_LIST.map((p) => {
                  const isSelected = p.id === activePersonaId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPersona(p.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? `bg-slate-800/90 ${p.borderColor} text-white shadow-md scale-[1.02]`
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-base mb-0.5">{p.avatar}</span>
                      <span className="text-[11px] font-bold leading-tight line-clamp-1">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Perspective Quote Banner */}
            <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-start gap-2.5 text-[11px] text-slate-300">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="italic font-light leading-relaxed">
                {persona.greeting}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/30 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('dialogue');
                  playTick();
                }}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'dialogue'
                    ? 'border-amber-400 text-amber-300 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>المحاورة السقراطية</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('challenge');
                  playTick();
                }}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'challenge'
                    ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>تحدي الحدس السريع</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('search');
                  playTick();
                }}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'search'
                    ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>اسأل المعيد أي سؤال</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: SOCRATIC DIALOGUE */}
              {activeTab === 'dialogue' && currentDilemma && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Dilemma Header & Pagination */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentDilemma.title}</span>
                    </span>

                    {dilemmas.length > 1 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <button
                          onClick={() => {
                            setSelectedOptionId(null);
                            setSelectedDilemmaIdx((i) => Math.max(0, i - 1));
                            playTick();
                          }}
                          disabled={selectedDilemmaIdx === 0}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                          aria-label="المعضلة السابقة"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span>
                          {selectedDilemmaIdx + 1} من {dilemmas.length}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedOptionId(null);
                            setSelectedDilemmaIdx((i) =>
                              Math.min(dilemmas.length - 1, i + 1)
                            );
                            playTick();
                          }}
                          disabled={selectedDilemmaIdx === dilemmas.length - 1}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                          aria-label="المعضلة التالية"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Provocation Box */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {currentDilemma.provocation}
                    </p>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {currentDilemma.storyContext}
                    </p>
                  </div>

                  {/* Choice Buttons */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      ماذا يمليه عليك حدسك؟ انقر لترى تحليل محاورك:
                    </span>
                    {currentDilemma.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-right p-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400/80 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-4 h-4 rounded-full border border-current shrink-0 mt-0.5 flex items-center justify-center text-[10px]">
                              {isSelected ? '●' : '○'}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Reaction from Active Persona */}
                  {selectedOptionId && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in duration-300">
                      {(() => {
                        const opt = currentDilemma.options.find(
                          (o) => o.id === selectedOptionId
                        );
                        if (!opt) return null;
                        const reaction =
                          opt.personaReactions[activePersonaId] ||
                          opt.personaReactions.abu_fitra;

                        return (
                          <>
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 border-b border-slate-800 pb-2">
                              <span>{persona.avatar}</span>
                              <span>تحليل {persona.name}:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                              {reaction.reaction}
                            </p>
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed font-light">
                              <strong className="font-semibold block mb-0.5">
                                الحكمة الفطرية:
                              </strong>
                              {reaction.takeaway}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Final Socratic Lesson */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-semibold block mb-0.5">
                      💡 الخلاصة السقراطية:
                    </span>
                    {currentDilemma.socraticLesson}
                  </div>
                </div>
              )}

              {/* TAB 2: FLASH CHALLENGE */}
              {activeTab === 'challenge' && currentChallenge && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header & Score */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{currentChallenge.title}</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                      النقاط: {challengeScore}
                    </span>
                  </div>

                  {/* Scenario */}
                  <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentChallenge.scenario}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white leading-relaxed pt-1">
                      {currentChallenge.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentChallenge.options.map((opt) => {
                      const isSelected = selectedChoiceId === opt.id;
                      let btnStyle =
                        'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200';

                      if (selectedChoiceId) {
                        if (opt.isCorrect) {
                          btnStyle =
                            'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400/50';
                        } else if (isSelected) {
                          btnStyle =
                            'bg-red-500/20 border-red-500 text-red-200 ring-1 ring-red-400/50';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() =>
                            !selectedChoiceId &&
                            handleAnswerChallenge(opt.id, opt.isCorrect)
                          }
                          disabled={!!selectedChoiceId}
                          className={`w-full text-right p-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${btnStyle}`}
                        >
                          <div className="flex items-start gap-2.5">
                            {selectedChoiceId && opt.isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            {selectedChoiceId &&
                              isSelected &&
                              !opt.isCorrect && (
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              )}
                            <span className="leading-relaxed">{opt.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {selectedChoiceId && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in duration-300">
                      {(() => {
                        const chosen = currentChallenge.options.find(
                          (o) => o.id === selectedChoiceId
                        );
                        return (
                          <>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              {chosen?.isCorrect ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> إجابة حدسية ممتازة!
                                </span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" /> فخ شائع! راجع التفسير أدناه:
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                              {chosen?.explanation}
                            </p>
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-light">
                              <strong>💡 نصيحة سريعة:</strong> {currentChallenge.intuitiveTip}
                            </div>
                            <button
                              onClick={handleNextChallenge}
                              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                            >
                              <span>التحدي التالي</span>
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEARCH & ASK ANY QUESTION */}
              {activeTab === 'search' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Search Bar */}
                  <div className="relative">
                    <label htmlFor={searchInputId} className="sr-only">
                      ابحث في مفاهيم الاقتصاد الفطري
                    </label>
                    <input
                      id={searchInputId}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اسأل عن التضخم، الديون، الربا، الأسعار، أو باريتو..."
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  </div>

                  {/* Quick-Prompt Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'لماذا لا تطبع الدولة نقوداً؟',
                      'كيف تسحق الفائدة المقترض؟',
                      'لماذا يرخص السمك بالمساء؟',
                      'ما هو قانون باريتو؟',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setSearchQuery(chip);
                          playTick();
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-300 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Results Accordion */}
                  <div className="space-y-3 pt-2">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        لم نجد إجابة مطابقة تماماً، جرب كلمات مثل: تضخم، ديون، وقت، مشاع، برتراند.
                      </div>
                    ) : (
                      searchResults.map((entry) => {
                        const isExpanded = expandedEntryId === entry.id;
                        const personaComment =
                          entry.personaComments[activePersonaId] ||
                          entry.personaComments.abu_fitra;

                        return (
                          <div
                            key={entry.id}
                            className="rounded-2xl bg-slate-900/60 border border-slate-800/90 overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                setExpandedEntryId(isExpanded ? null : entry.id);
                                playTick();
                              }}
                              className="w-full text-right p-4 flex items-center justify-between gap-3 hover:bg-slate-850/50 transition-colors"
                            >
                              <span className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                                {entry.question}
                              </span>
                              <span className="text-slate-400 text-xs shrink-0">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="p-4 pt-0 border-t border-slate-800/60 space-y-3 text-xs leading-relaxed animate-in fade-in duration-200">
                                {/* Quick answer */}
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                                  <strong className="block text-emerald-300 font-bold mb-1">
                                    💡 الفكرة باختصار:
                                  </strong>
                                  {entry.quickAnswer}
                                </div>

                                {/* Deep explanation */}
                                <div className="text-slate-300 font-light space-y-1.5">
                                  <strong className="block text-slate-200 font-medium">
                                    الشرح المعمق:
                                  </strong>
                                  <p>{entry.deepExplanation}</p>
                                </div>

                                {/* Practical example */}
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-light">
                                  <strong className="text-slate-300 font-medium">
                                    مثال واقعي:{' '}
                                  </strong>
                                  {entry.practicalExample}
                                </div>

                                {/* Active Persona Quote */}
                                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 text-amber-300 text-[11px] italic">
                                  <strong>{persona.avatar} رأي {persona.name}: </strong>
                                  {personaComment}
                                </div>

                                {/* Chapter Link */}
                                {entry.chapterSlug && (
                                  <a
                                    href={`/chapters/${entry.chapterSlug}`}
                                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium text-[11px] underline underline-offset-4 decoration-cyan-500/40"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>جرب هذا المفهوم في {entry.chapterName} ←</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span>الوكيل يعمل محلياً في متصفحك</span>
                <span className="text-emerald-400 font-mono">100% Client-Side</span>
              </span>
              <a
                href="/sandbox"
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                جرب المحاكاة الحية في المخبر ←
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
