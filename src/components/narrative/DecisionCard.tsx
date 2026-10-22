import React from 'react';

interface DecisionCardProps {
  id?: string;
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  id,
  title,
  description,
  badge = 'المأزق الفطري',
  children,
}) => {
  return (
    <div
      id={id}
      className="glass-panel-gold rounded-2xl p-6 sm:p-8 my-6 transition-all duration-300 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {badge}
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-amber-100 mb-2 leading-relaxed">
        {title}
      </h3>

      <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 font-light">
        {description}
      </p>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
