import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown, Sparkles } from 'lucide-react';

interface ConsequenceAlertProps {
  id?: string;
  type?: 'warning' | 'success' | 'exhaustion' | 'discovery';
  title: string;
  message: string;
}

export const ConsequenceAlert: React.FC<ConsequenceAlertProps> = ({
  id,
  type = 'warning',
  title,
  message,
}) => {
  const styles = {
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/30',
      text: 'text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
    exhaustion: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/30',
      text: 'text-rose-200',
      icon: <TrendingDown className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    discovery: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/30',
      text: 'text-cyan-200',
      icon: <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      id={id}
      className={`glass-panel rounded-xl p-5 my-4 border ${styles.border} ${styles.bg} transition-all duration-300 shadow-lg`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div>
          <h4 className={`text-base font-bold ${styles.text} mb-1`}>{title}</h4>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
};
