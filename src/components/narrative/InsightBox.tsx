import React, { useState } from 'react';
import {
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  Calculator,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import katex from 'katex';
import { playTick, playTone } from '../../utils/audio';

export interface WorkedExampleStep {
  title: string;
  math?: string;
  unit?: string; // Explicit Arabic unit (e.g. 'دينار', 'ريالاً', 'كجم / ساعة')
  note: string;
}

export interface WorkedExample {
  title: string;
  initialState: string;
  steps: WorkedExampleStep[];
  result: string;
}

export interface AcademicTerm {
  arabic: string;
  english: string;
  definition: string;
  intuitiveAnalogy?: string; // Everyday intuitive analogy for non-specialists
  formula?: string; // KaTeX mathematical equation
  formulaExplanation?: string; // Plain-Arabic breakdown of what each symbol means
  workedExample?: WorkedExample; // Step-by-step numbers walkthrough until the result
  realWorldImpact?: string; // Where do we see this in modern reality today?
}

interface InsightBoxProps {
  id?: string;
  insight: string;
  subInsight?: string;
  academicTerms?: AcademicTerm[];
}

/**
 * Helper to safely sanitize KaTeX input from Arabic text fragments
 * which would otherwise break KaTeX's font engine and cause disjointed glyphs.
 */
function cleanMathFormula(raw?: string, explicitUnit?: string): { cleanFormula: string; unit?: string } {
  if (!raw) return { cleanFormula: '', unit: explicitUnit };

  let detectedUnit = explicitUnit;
  // Match any \text{...} containing Arabic unicode characters (0600-06FF)
  const arabicInTextRegex = /\\text\{([^\}]*[\u0600-\u06FF]+[^\}]*)\}/g;
  
  const cleanFormula = raw
    .replace(arabicInTextRegex, (_, captured) => {
      if (!detectedUnit) {
        detectedUnit = captured.trim();
      }
      return '';
    })
    .replace(/,\s*,/g, ',')
    .trim();

  return { cleanFormula, unit: detectedUnit };
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
                  شرح تفصيلي مبسط، أمثلة واقعية، وتطبيق حسابي خطوة بخطوة ({academicTerms.length} مفاهيم)
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
              {academicTerms.map((term, idx) => {
                const { cleanFormula: mainCleanFormula } = cleanMathFormula(term.formula);

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5 hover:border-slate-700 transition-colors"
                  >
                    {/* Term Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="num-badge w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {term.arabic}
                        </h4>
                      </div>
                      <span className="num-badge text-xs text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
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
                    {mainCleanFormula && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                            الصياغة الرياضية في كتب الاقتصاد:
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">LaTeX Equation</span>
                        </div>

                        <div className="py-2 overflow-x-auto text-center" dir="ltr">
                          <div
                            className="text-amber-200 text-sm sm:text-base inline-block font-mono"
                            dangerouslySetInnerHTML={{
                              __html: katex.renderToString(mainCleanFormula, {
                                throwOnError: false,
                                displayMode: true,
                              }),
                            }}
                          />
                        </div>

                        {term.formulaExplanation && (
                          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 leading-relaxed font-light">
                            <strong className="text-slate-300 ml-1">تفكيك رموز المعادلة ببساطة:</strong>
                            <bdi>{term.formulaExplanation}</bdi>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step-by-Step Numerical Walkthrough (Enhanced BiDi & Unit Display) */}
                    {term.workedExample && (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                            <span>{term.workedExample.title}</span>
                          </div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 font-medium">
                            تطبيق رقمي خطوة بخطوة
                          </span>
                        </div>

                        {/* Initial Setup */}
                        <div className="text-xs text-emerald-100/90 bg-slate-950/70 p-3.5 rounded-xl border border-emerald-900/40 font-light leading-relaxed">
                          <strong className="text-emerald-300 font-bold block mb-1">
                            🏁 نقطة البداية والمعطيات:
                          </strong>
                          <bdi>{term.workedExample.initialState}</bdi>
                        </div>

                        {/* Walkthrough Steps */}
                        <div className="space-y-3">
                          {term.workedExample.steps.map((st, sIdx) => {
                            const { cleanFormula: stepMath, unit: stepUnit } = cleanMathFormula(
                              st.math,
                              st.unit
                            );

                            return (
                              <div
                                key={sIdx}
                                className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-xs space-y-2.5 shadow-sm"
                              >
                                <div className="font-semibold text-slate-200 flex items-center gap-2">
                                  <span className="num-badge w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                    {sIdx + 1}
                                  </span>
                                  <span>{st.title}</span>
                                </div>

                                {/* Visual Calculation Bar: Separating LTR Math from RTL Arabic Unit */}
                                {stepMath && (
                                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80">
                                    <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                                      <span className="text-[11px] font-bold tracking-wider text-slate-400 shrink-0">
                                        الحساب الرياضي:
                                      </span>
                                      <div
                                        className="num-ltr px-3 py-1 bg-slate-900 rounded-lg text-amber-300 font-mono text-xs sm:text-sm border border-slate-800"
                                        dangerouslySetInnerHTML={{
                                          __html: katex.renderToString(stepMath, {
                                            throwOnError: false,
                                            displayMode: false,
                                          }),
                                        }}
                                      />
                                    </div>

                                    {stepUnit && (
                                      <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg shrink-0">
                                        <span className="text-[10px] text-emerald-500 font-bold uppercase">
                                          الوحدة:
                                        </span>
                                        <span className="font-semibold">{stepUnit}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <p className="text-slate-400 font-light leading-relaxed pr-1">
                                  <bdi>{st.note}</bdi>
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Final Conclusion / Punchline */}
                        <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <strong className="text-emerald-300 block font-bold text-xs">
                              النتيجة التي وصلت إليها المعادلة:
                            </strong>
                            <span className="font-light leading-relaxed block text-emerald-100/90">
                              <bdi>{term.workedExample.result}</bdi>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Real-World Modern Impact */}
                    {term.realWorldImpact && (
                      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-400 leading-relaxed">
                          <strong className="text-cyan-300 ml-1">أثر هذا في عالمنا الحاضر:</strong>
                          <span className="font-light">
                            <bdi>{term.realWorldImpact}</bdi>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
