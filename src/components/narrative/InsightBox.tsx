import React, { useState } from 'react';
import { Lightbulb, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface AcademicTerm {
  arabic: string;
  english: string;
  definition: string;
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

  return (
    <div
      id={id}
      className="glass-panel border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-slate-900/90 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Lightbulb className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
          البصيرة الفطرية المستخلصة
        </span>
      </div>

      <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed mb-3">
        {insight}
      </p>

      {subInsight && (
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">
          {subInsight}
        </p>
      )}

      {academicTerms.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowAcademic(!showAcademic)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors py-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ماذا تسمي الكتب الأكاديمية هذه الظاهرة؟</span>
            {showAcademic ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAcademic && (
            <div className="mt-4 space-y-3 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 animate-fadeIn">
              {academicTerms.map((term, idx) => (
                <div key={idx} className="text-xs sm:text-sm">
                  <span className="font-bold text-cyan-300 ml-1.5">{term.arabic}</span>
                  <span className="text-slate-500 font-mono ml-2">({term.english})</span>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{term.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
