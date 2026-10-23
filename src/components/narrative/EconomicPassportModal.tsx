import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import {
  FileText,
  Download,
  X,
  Sparkles,
  ShieldCheck,
  Award,
  CheckCircle2,
  Fingerprint
} from 'lucide-react';
import type { ArchetypeProfile } from '../../engine/core/archetypes';
import { DecisionRadarChart, type RadarDimension } from './DecisionRadarChart';
import { playSuccessChime, playSoftClick } from '../../engine/core/audio';

export interface EconomicPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArchetypeProfile;
  dimensions: RadarDimension[];
  chapterTitle?: string;
}

export function EconomicPassportModal({
  isOpen,
  onClose,
  profile,
  dimensions,
  chapterTitle = 'منصة الاقتصاد الفطري',
}: EconomicPassportModalProps) {
  const passportCardRef = useRef<HTMLDivElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const passportId = React.useMemo(() => {
    return `IN-ECON-${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!passportCardRef.current) return;
    setGenerating(true);
    playSoftClick();

    try {
      // 1. Generate high-res image of the passport card
      const dataUrl = await toPng(passportCardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#070b12',
      });

      // 2. Insert into A4 jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (printWidth * 1.414); // Proportion

      pdf.setFillColor(7, 11, 18);
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');
      pdf.addImage(dataUrl, 'PNG', margin, margin, printWidth, printHeight);

      pdf.save(`Economic-Passport-${passportId}.pdf`);
      playSuccessChime();
    } catch {
      // Fallback
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!passportCardRef.current) return;
    setGenerating(true);
    playSoftClick();

    try {
      const dataUrl = await toPng(passportCardRef.current, {
        quality: 0.98,
        pixelRatio: 3,
        backgroundColor: '#070b12',
      });

      const link = document.createElement('a');
      link.download = `Economic-Passport-${passportId}.png`;
      link.href = dataUrl;
      link.click();
      playSuccessChime();
    } catch {
      // Fallback
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Fingerprint className="w-5 h-5" />
            <span>وثيقة التشخيص الاقتصادي الفطري (Innate Passport)</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Passport Card */}
        <div
          ref={passportCardRef}
          className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#070b14] to-[#0d1627] border-2 border-amber-500/40 space-y-6 text-right relative overflow-hidden shadow-2xl"
          dir="rtl"
        >
          {/* Watermark Logo */}
          <div className="absolute top-4 left-4 opacity-10 pointer-events-none text-6xl">
            🏛️
          </div>

          {/* Top Header & ID */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] tracking-wider uppercase font-mono text-cyan-400 block">
                Official Economic Diagnostic Passport
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                جواز السفر الاقتصادي المعتمد
              </h2>
            </div>

            <div className="text-left font-mono text-xs">
              <span className="text-slate-500 block text-[10px]">DOCUMENT ID:</span>
              <span className="text-amber-300 font-bold">{passportId}</span>
            </div>
          </div>

          {/* Archetype Profile Banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0">
              {profile.symbol}
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-right">
              <span className="text-[11px] text-cyan-300 font-medium">النمط السلوكي الفطري:</span>
              <h3 className="text-xl font-bold text-white">{profile.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {profile.shortSummary}
              </p>
            </div>
          </div>

          {/* 5-Axis Radar Chart & Dimensions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Visual Radar */}
            <div className="flex justify-center p-2 bg-slate-950/50 rounded-xl border border-slate-900">
              <DecisionRadarChart dimensions={dimensions} size={220} showLabels={false} />
            </div>

            {/* Dimension Percentile Bars */}
            <div className="space-y-2.5 text-xs">
              {dimensions.map((dim) => (
                <div key={dim.key} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-medium">{dim.label}</span>
                    <span className="text-amber-300 font-mono font-bold">{dim.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-400 rounded-full"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Real-World Insights */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>التوجيه الاستراتيجي في الحياة الواقعية:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-light">
              سلوكك يعكس ميلاً فطرياً لـ <strong className="text-white font-medium">{profile.name}</strong>؛ في استثماراتك الحقيقية، ركز على بناء الأصول ذات التدفقات النقدية المستقرة، واستمر في موازنة الطموح بالتأمين الاحتياطي ضد صدمات السيولة.
            </p>
          </div>

          {/* Seal & Verification Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>موثّق وفق محركات النمذجة الرياضية لمنصة الاقتصاد الفطري</span>
            </div>

            <div className="font-mono text-slate-400">
              INNATE-ECONOMICS • 2026
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDownloadPNG}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تحميل كصورة PNG</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{generating ? 'جارٍ إصدار المستند...' : 'تحميل وثيقة PDF رسمية'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
