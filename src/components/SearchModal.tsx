import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Sparkles, CornerDownLeft } from 'lucide-react';
import { playTick, playTone } from '../utils/audio';

interface SearchResult {
  url: string;
  meta?: {
    title?: string;
  };
  excerpt: string;
}

export const SearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefindRef = useRef<any>(null);

  // Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      playTone(440, 0.05);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Lazy load pagefind
  const initPagefind = async () => {
    if (!pagefindRef.current) {
      try {
        const dynamicImport = new Function('url', 'return import(url)');
        pagefindRef.current = await dynamicImport('/pagefind/pagefind.js');
        if (pagefindRef.current?.init) {
          await pagefindRef.current.init();
        }
      } catch (err) {
        console.warn('Pagefind is available in production build preview:', err);
      }
    }
    return pagefindRef.current;
  };

  // Handle Search Query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    const executeSearch = async () => {
      setIsLoading(true);
      try {
        const pf = await initPagefind();
        if (!pf) {
          setIsLoading(false);
          return;
        }
        const search = await pf.search(query);
        if (!active) return;

        const topResults = await Promise.all(
          search.results.slice(0, 5).map((r: any) => r.data())
        );

        if (active) {
          setResults(topResults);
          playTick();
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const debounce = setTimeout(executeSearch, 150);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [query]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        title="ابحث في المنصة (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">بحث...</span>
        <kbd className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
          Ctrl K
        </kbd>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fade-in">
          <div
            className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن مأزق أو تجربة أو مفهوم (مثلاً: رغيف، تضخم، بئر، ذعر)..."
                className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none text-sm sm:text-base font-medium"
                dir="rtl"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {isLoading && (
                <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                  جارٍ استخراج النتائج من المحرك المحلي...
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  لم يتم العثور على نتائج تطابق «{query}». جرب كلمة أخرى مثل: ساعات، ذهب، مرعى، قروض، احتياطي.
                </div>
              )}

              {!isLoading && !query && (
                <div className="py-6 text-center space-y-3">
                  <span className="text-xs text-slate-400 block font-light">
                    كلمات مفتاحية فطرية مقترحة:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['ميزانية الساعات', 'تثبيت الأسعار', 'المرعى المشترك', 'قروض إنتاجية', 'ذعر بنكي', 'المعاش الفطري'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag);
                          playTick();
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  onClick={() => setIsOpen(false)}
                  className="block p-4 rounded-2xl bg-slate-950/70 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      {item.meta?.title || 'تجربة استكشافية'}
                    </span>
                    <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div
                    className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light [&_mark]:bg-amber-400/20 [&_mark]:text-amber-300 [&_mark]:font-medium [&_mark]:px-1 [&_mark]:rounded"
                    dangerouslySetInnerHTML={{ __html: item.excerpt }}
                  />
                </a>
              ))}
            </div>

            {/* Footer info */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>محرك بحث Pagefind بدون خادم (WASM محلي فائق السرعة)</span>
              <span>اضغط ESC للإغلاق</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
