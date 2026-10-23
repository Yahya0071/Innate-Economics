import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Share2,
  Check,
  Download,
  MessageCircle,
  Shield,
  Hourglass,
  Scale,
  Zap,
  FileText,
} from 'lucide-react';
import {
  determineArchetype,
  encodeSimulationState,
  ARCHETYPES,
  type ArchetypeProfile,
  type ArchetypeId
} from '../../engine/core/archetypes';
import { playCoinSound, playSoftClick, playSuccessChime } from '../../engine/core/audio';
import { DecisionRadarChart, type RadarDimension } from './DecisionRadarChart';
import { EconomicPassportModal } from './EconomicPassportModal';

export interface DecisionFingerprintProps {
  chapterId: string;
  chapterTitle?: string;
  metrics: Record<string, number>;
  statItems?: Array<{ label: string; value: string | number }>;
  customArchetypeId?: ArchetypeId;
  className?: string;
}

export const DecisionFingerprint: React.FC<DecisionFingerprintProps> = ({
  chapterId,
  chapterTitle = 'التجربة الفطرية',
  metrics,
  statItems = [],
  customArchetypeId,
  className = '',
}) => {
  const profile: ArchetypeProfile = customArchetypeId
    ? ARCHETYPES[customArchetypeId]
    : determineArchetype(chapterId, metrics);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dimensions: RadarDimension[] = React.useMemo(() => {
    const baseScore = profile.balanceAxis.score;
    const timePref =
      profile.id === 'patient-builder'
        ? 95
        : profile.id === 'cautious-guardian'
          ? 75
          : Math.max(30, Math.min(95, 100 - baseScore * 0.5));
    const commons =
      profile.id === 'cautious-guardian' ? 90 : profile.id === 'dynamic-balancer' ? 80 : 60;
    const liquidity =
      profile.id === 'high-liquidity-adventurer'
        ? 35
        : profile.id === 'cautious-guardian'
          ? 90
          : 75;
    const firmness =
      profile.id === 'dynamic-balancer'
        ? 85
        : profile.id === 'high-liquidity-adventurer'
          ? 80
          : 65;
    const capital = profile.id === 'patient-builder' ? 90 : 70;

    return [
      { key: 'time', label: 'الصبر الزمني', score: Math.round(timePref) },
      { key: 'commons', label: 'حماية المشاع', score: Math.round(commons) },
      { key: 'liquidity', label: 'الحذر المصرفي', score: Math.round(liquidity) },
      { key: 'firmness', label: 'الحزم التنافسي', score: Math.round(firmness) },
      { key: 'capital', label: 'كفاءة رأس المال', score: Math.round(capital) },
    ];
  }, [profile]);

  // Generate shareable URL with encoded simulation state
  const getShareUrl = (): string => {
    if (typeof window === 'undefined') return '';
    const queryString = encodeSimulationState(chapterId, metrics);
    const url = new URL(window.location.href);
    url.search = queryString;
    return url.toString();
  };

  // 1. Copy link with innate challenge phrase
  const handleCopyLink = async () => {
    playCoinSound();
    const shareUrl = getShareUrl();
    const shareText = `بصمة قراري في «${chapterTitle}» بمنصة الاقتصاد الفطري:\n[${profile.name}] — ${profile.shortSummary}\n${profile.challengePhrase}\n\nخض نفس المأزق وقارن نتيجتك بي:`;

    let success = false;
    if (typeof navigator !== 'undefined') {
      if (navigator.share && navigator.canShare && navigator.canShare({ title: profile.name, text: shareText, url: shareUrl })) {
        try {
          await navigator.share({
            title: `بصمة قراري: ${profile.name}`,
            text: shareText,
            url: shareUrl,
          });
          success = true;
        } catch {
          // Fallback to clipboard
        }
      }

      if (!success && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          success = true;
        } catch {
          success = false;
        }
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3200);
    }
  };

  // 2. Generate Square Luxury PNG using HTML5 Canvas
  const handleSaveCardImage = async () => {
    playSoftClick();
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const size = 1080; // High resolution square (1080x1080) for X / LinkedIn / WhatsApp
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0c1322');
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. Ambient glows
      const radialAmber = ctx.createRadialGradient(size * 0.85, size * 0.15, 20, size * 0.85, size * 0.15, size * 0.5);
      radialAmber.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
      radialAmber.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = radialAmber;
      ctx.fillRect(0, 0, size, size);

      const radialCyan = ctx.createRadialGradient(size * 0.15, size * 0.85, 20, size * 0.15, size * 0.85, size * 0.55);
      radialCyan.addColorStop(0, 'rgba(6, 182, 212, 0.14)');
      radialCyan.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = radialCyan;
      ctx.fillRect(0, 0, size, size);

      // 3. Inner Card Border & Glass Panel
      const pad = 64;
      const cardW = size - pad * 2;
      const cardH = size - pad * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.roundRect(pad, pad, cardW, cardH, 36);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Setup typography defaults (RTL Arabic)
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';

      // 4. Header Badges
      ctx.font = 'bold 26px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('منصة «الاقتصاد الفطري»', size - pad - 48, pad + 72);

      ctx.font = 'normal 20px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${chapterTitle} • بصمة القرار البشري`, size - pad - 48, pad + 108);

      // Archetype Icon / Symbol
      ctx.font = '72px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(profile.symbol, pad + 48, pad + 115);

      // Horizontal Divider
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad + 48, pad + 150);
      ctx.lineTo(size - pad - 48, pad + 150);
      ctx.stroke();

      // 5. Archetype Title
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.font = 'bold 22px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('النمط الفطري المستحق:', size - pad - 48, pad + 205);

      ctx.font = '800 52px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(profile.name, size - pad - 48, pad + 275);

      // 6. Summary Text (Multi-line wrap)
      ctx.font = 'normal 26px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metricsWidth = ctx.measureText(testLine).width;
          if (metricsWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
      };

      const afterSummaryY = wrapText(profile.shortSummary, size - pad - 48, pad + 340, cardW - 96, 42);

      // 7. Human Balance Bar
      const barY = afterSummaryY + 30;
      ctx.font = 'bold 20px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(profile.balanceAxis.leftLabel, size - pad - 48, barY);

      ctx.textAlign = 'left';
      ctx.fillText(profile.balanceAxis.rightLabel, pad + 48, barY);

      // Bar Background
      const barX = pad + 48;
      const barWidth = cardW - 96;
      const barHeight = 16;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(barX, barY + 16, barWidth, barHeight, 8);
      ctx.fill();

      // Bar Progress (Left to Right filling for balance score)
      const fillW = Math.max(12, (profile.balanceAxis.score / 100) * barWidth);
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      barGrad.addColorStop(0, '#06b6d4');
      barGrad.addColorStop(0.5, '#f59e0b');
      barGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX + barWidth - fillW, barY + 16, fillW, barHeight, 8);
      ctx.fill();

      // 8. Stats Section if available
      const statsY = barY + 80;
      if (statItems.length > 0) {
        const numItems = Math.min(statItems.length, 4);
        const colW = (cardW - 96) / numItems;

        statItems.slice(0, 4).forEach((stat, i) => {
          const itemX = size - pad - 48 - (i * colW);
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';

          ctx.font = 'normal 19px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(stat.label, itemX, statsY);

          ctx.font = 'bold 30px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(String(stat.value), itemX, statsY + 40);
        });
      }

      // 9. Challenge Box
      const challengeY = statsY + (statItems.length > 0 ? 90 : 20);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pad + 48, challengeY, cardW - 96, 95, 18);
      ctx.fill();
      ctx.stroke();

      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.font = 'italic 20px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#fde68a';
      wrapText(`«${profile.challengePhrase}»`, size - pad - 72, challengeY + 38, cardW - 144, 32);

      // 10. Footer Branding & Link
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.font = 'bold 19px "IBM Plex Sans Arabic", "Tajawal", "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('منصة الاقتصاد الفطري • innate-economics.pages.dev', size / 2, size - pad - 32);

      // Export image & trigger browser download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `innate-${profile.id}-fingerprint.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      playSuccessChime();
    } catch {
      // Failed canvas generation
    } finally {
      setDownloading(false);
    }
  };

  const getWhatsAppShareUrl = (): string => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(
      `بصمة قراري في «${chapterTitle}» بمنصة الاقتصاد الفطري:\n[${profile.name}] — ${profile.shortSummary}\n\n«${profile.challengePhrase}»\n\nجرّب وخض نفس المأزق:\n${shareUrl}`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const getXShareUrl = (): string => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(
      `بصمة قراري في منصة #الاقتصاد_الفطري:\n[${profile.name}] — ${profile.shortSummary}\n«${profile.challengePhrase}»`
    );
    return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
  };

  const renderIcon = () => {
    switch (profile.id) {
      case 'cautious-guardian':
        return <Shield className="w-8 h-8 text-amber-400" />;
      case 'patient-builder':
        return <Hourglass className="w-8 h-8 text-cyan-400" />;
      case 'dynamic-balancer':
        return <Scale className="w-8 h-8 text-emerald-400" />;
      case 'high-liquidity-adventurer':
        return <Zap className="w-8 h-8 text-rose-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div
      className={`glass-panel rounded-3xl p-6 sm:p-10 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/95 to-slate-950 shadow-2xl relative overflow-hidden my-12 transition-all ${className}`}
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
            {profile.symbol}
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-500/20 mb-1.5">
              <Sparkles className="w-3 h-3" />
              بصمة القرار الاقتصادي الفطري
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {profile.name}
            </h3>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/90 px-4 py-2 rounded-2xl self-stretch sm:self-auto text-right sm:text-left">
          <span className="text-[11px] text-slate-400 block font-light">طبيعة السلوك:</span>
          <span className="text-xs sm:text-sm font-bold text-amber-300">
            {profile.balanceAxis.leftLabel}
          </span>
        </div>
      </div>

      {/* Narrative Summary (2 lines) */}
      <div className="relative z-10 mb-8 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5">
        <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
          {profile.shortSummary}
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-normal">
          {profile.detailedNarrative}
        </p>
      </div>

      {/* 5-Axis Radar Chart Visualizer */}
      <div className="relative z-10 mb-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>المخطط الراداري الخماسي للسلوك</span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white">
            خريطة الأبعاد الاقتصادية لشخصيتك
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-light max-w-sm">
            تحليل دقيق لخمسة أبعاد سلوكية متداخلة، يظهر توازنك بين الصبر الاستثماري وحماية المشاع والحزم التنافسي في السوق.
          </p>
        </div>

        <div className="shrink-0 flex items-center justify-center">
          <DecisionRadarChart dimensions={dimensions} size={250} />
        </div>
      </div>

      {/* Human Balance Bar */}
      <div className="relative z-10 mb-8 bg-slate-950/50 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
          <span className="text-cyan-400">{profile.balanceAxis.leftLabel}</span>
          <span className="text-amber-400">{profile.balanceAxis.rightLabel}</span>
        </div>
        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400 transition-all duration-700"
            style={{ width: `${Math.max(10, Math.min(100, profile.balanceAxis.score))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
          <span>أولوية الاستدامة والجماعة</span>
          <span>أولوية الربح والمخاطرة</span>
        </div>
      </div>

      {/* Key Stats Grid if present */}
      {statItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 relative z-10">
          {statItems.map((stat, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-center"
            >
              <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
              <div className="text-base sm:text-lg font-bold text-amber-200">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Innate Challenge Quote */}
      <div className="relative z-10 mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-right">
        <span className="text-xs text-amber-300/80 block font-light mb-1">تحدي القرناء:</span>
        <blockquote className="text-sm font-medium text-amber-200 italic">
          «{profile.challengePhrase}»
        </blockquote>
      </div>

      {/* Viral Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80 relative z-10">
        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>تم نسخ رابط المأزق والتحدي!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-slate-950" />
              <span>نسخ رابط المأزق لصديق</span>
            </>
          )}
        </button>

        {/* Save Card Image (Canvas) */}
        <button
          type="button"
          onClick={handleSaveCardImage}
          disabled={downloading}
          className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          title="توليد صورة مربعة فاخرة لبطاقتك لمشاركتها على شبكات التواصل"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{downloading ? 'جارٍ رسم البطاقة...' : 'حفظ البطاقة كصورة'}</span>
        </button>

        {/* Economic Passport / PDF Report */}
        <button
          type="button"
          onClick={() => {
            playSoftClick();
            setPassportModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>جواز السفر وتقرير PDF</span>
        </button>

        {/* WhatsApp Share */}
        <a
          href={getWhatsAppShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playSoftClick()}
          className="p-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
          title="مشاركة المأزق عبر واتساب"
        >
          <MessageCircle className="w-5 h-5" />
        </a>

        {/* Twitter / X Share */}
        <a
          href={getXShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playSoftClick()}
          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="مشاركة على منصة X"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {copied && (
          <span className="text-xs text-emerald-400 font-medium animate-fade-in block w-full">
            ✓ تم نسخ رابط مشفّر بحالتك! صديقك سيبدأ من نفس المأزق الذي انتهيت إليه.
          </span>
        )}
      </div>

      {/* Economic Passport Modal */}
      <EconomicPassportModal
        isOpen={passportModalOpen}
        onClose={() => setPassportModalOpen(false)}
        profile={profile}
        dimensions={dimensions}
        chapterTitle={chapterTitle}
      />
    </div>
  );
};
