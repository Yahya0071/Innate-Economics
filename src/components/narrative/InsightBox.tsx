import React, { useState } from 'react';
import { Lightbulb, BookOpen, ChevronDown, ChevronUp, Sparkles, Globe, Calculator } from 'lucide-react';
import katex from 'katex';
import { playTick, playTone } from '../../utils/audio';


export interface AcademicTerm {
  arabic: string;
  english: string;
  definition: string;
  intuitiveAnalogy?: string; // Everyday intuitive analogy for non-specialists
  formula?: string; // KaTeX mathematical equation
  formulaExplanation?: string; // Plain-Arabic breakdown of what each symbol means
  realWorldImpact?: string; // Where do we see this in modern reality today?
}

interface InsightBoxProps {
  id?: string;
  insight: string;
  subInsight?: string;
  academicTerms?: AcademicTerm[];
}

export const InsightBox: React.FC<InsightBoxProps> = ({
  id,
  insight,
  subInsight,
  academicTerms = [],
}) => {
  const [showAcademic, setShowAcademic] = useState(false);

  const handleToggle = () => {
    setShowAcademic((prev) => {
      const next = !prev;
      if (next) playTone(523, 0.05);
      else playTick();
      return next;
    });
  };

  return (
    <div
      id={id}
      className="glass-panel border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-slate-900/90 rounded-3xl p-6 sm:p-8 my-8 shadow-2xl relative overflow-hidden"
    >
      {/* Top Insight Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
          <Lightbulb className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
          البصيرة الفطرية المستخلصة
        </span>
      </div>

      {/* Core Natural Insight */}
      <p className="text-lg sm:text-2xl font-bold text-slate-100 leading-relaxed mb-3">
        {insight}
      </p>

      {subInsight && (
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 font-light">
          {subInsight}
        </p>
      )}

      {/* Academic Section Toggle Drawer */}
      {academicTerms.length > 0 && (
        <div className="mt-8 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleToggle}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </span>
              <div className="text-right">
                <span className="text-sm sm:text-base font-bold text-white block">
                  ماذا تسمي الكتب الأكاديمية هذه الظاهرة؟
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-light block -mt-0.5">
                  شرح تفصيلي مبسط ومترجم للغة الحياة اليومية لغير المتخصصين ({academicTerms.length} مفاهيم)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
              <span>{showAcademic ? 'طي الشرح' : 'عرض التفاصيل'}</span>
              {showAcademic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAcademic && (
            <div className="mt-6 space-y-6 animate-fade-in">
              {academicTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-colors"
                >
                  {/* Term Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {term.arabic}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                      {term.english}
                    </span>
                  </div>

                  {/* Formal Academic Definition */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      التعريف الأكاديمي الصارم:
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                      {term.definition}
                    </p>
                  </div>

                  {/* Intuitive Everyday Analogy (For Non-Specialists) */}
                  {term.intuitiveAnalogy && (
                    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>تقريب الفكرة بلغة السوق والحياة اليومية:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-light">
                        {term.intuitiveAnalogy}
                      </p>
                    </div>
                  )}

                  {/* KaTeX Mathematical Formula & Plain Explanation */}
                  {term.formula && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                          الصياغة الرياضية في كتب الاقتصاد:
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">LaTeX Equation</span>
                      </div>

                      <div className="py-2 overflow-x-auto text-left" dir="ltr">
                        <div
                          className="text-amber-200 text-sm sm:text-base inline-block font-mono"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(term.formula, {
                              throwOnError: false,
                              displayMode: true,
                            }),
                          }}
                        />
                      </div>

                      {term.formulaExplanation && (
                        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 leading-relaxed font-light">
                          <strong className="text-slate-300 ml-1">تفكيك رموز المعادلة ببساطة:</strong>
                          {term.formulaExplanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real-World Modern Impact */}
                  {term.realWorldImpact && (
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-400 leading-relaxed">
                        <strong className="text-cyan-300 ml-1">أثر هذا في عالمنا الحاضر:</strong>
                        <span className="font-light">{term.realWorldImpact}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
