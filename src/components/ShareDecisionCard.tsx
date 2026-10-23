import React, { useState } from 'react';
import { Share2, Check, Sparkles, MessageCircle } from 'lucide-react';
import { encodeDecisionState, copyOrShareDecision } from '../utils/shareState';
import { playTone, playCoin } from '../utils/audio';


interface StatItem {
  label: string;
  value: string | number;
}

interface ShareDecisionCardProps {
  title?: string;
  badge?: string;
  verdict: string;
  stats: StatItem[];
  params: Record<string, string | number | boolean>;
}

export const ShareDecisionCard: React.FC<ShareDecisionCardProps> = ({
  title = 'بصمة قرارك الفطري',
  badge = 'تحدّ أصدقاءك بقراراتك',
  verdict,
  stats,
  params,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    playCoin();
    const shareUrl = encodeDecisionState(params);
    const shareText = `لقد جربت تجربة «${title}» في منصة الاقتصاد الفطري وكانت نتيجتي: [${verdict}]. هل تستطيع تحقيق نتيجة أفضل أو موازنة المعادلة؟`;
    
    const success = await copyOrShareDecision(title, shareText, shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getWhatsAppUrl = () => {
    const shareUrl = encodeDecisionState(params);
    const text = encodeURIComponent(`لقد خضت تجربة «${title}» في منصة الاقتصاد الفطري وحققت: ${verdict}.\nجرّب المحاكاة وقارن قراراتك بي:\n${shareUrl}`);
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const getTwitterUrl = () => {
    const shareUrl = encodeDecisionState(params);
    const text = encodeURIComponent(`خضت تجربة «${title}» في منصة الاقتصاد الفطري.\nبصمة قراري: ${verdict}.\nهل تستطيع الموازنة؟`);
    return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 shadow-2xl relative overflow-hidden my-10">
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-500/20 mb-2">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h3>
        </div>

        <div className="text-right sm:text-left bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-2xl">
          <span className="text-xs text-slate-400 block font-light">اللقب الفطري المستحق:</span>
          <span className="text-sm font-bold text-amber-300">{verdict}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className="text-base sm:text-lg font-bold text-amber-200">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Share Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
        <button
          onClick={handleShare}
          className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>تم نسخ رابط البصمة!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-slate-950" />
              <span>مشاركة بصمة قراري (نسخ الرابط)</span>
            </>
          )}
        </button>

        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTone(587, 0.05)}
          className="p-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
          title="مشاركة عبر واتساب"
        >
          <MessageCircle className="w-5 h-5" />
        </a>

        <a
          href={getTwitterUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTone(659, 0.05)}
          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="مشاركة على X / Twitter"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {copied && (
          <span className="text-xs text-emerald-400 font-medium animate-fade-in block w-full sm:w-auto">
            ✓ تم نسخ رابط مشفّر بحالتك! أرسله لأي شخص ليخوض نفس المعطيات.
          </span>
        )}
      </div>
    </div>
  );
};
