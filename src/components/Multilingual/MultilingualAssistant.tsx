// ============================================================
// src/components/Multilingual/MultilingualAssistant.tsx
// 20+ language real-time translation + RTL support + emergency
// Per PROBLEM_ALIGNMENT.md §1.6, ACCESSIBILITY.md
// ============================================================

import { memo, useState } from 'react';
import { LanguageCode, TranslationResult } from '@/types';

const LANGUAGES: { code: LanguageCode; label: string; nativeName: string; isRTL: boolean }[] = [
  { code: LanguageCode.EN, label: 'English',    nativeName: 'English',    isRTL: false },
  { code: LanguageCode.AR, label: 'Arabic',     nativeName: 'العربية',   isRTL: true  },
  { code: LanguageCode.FR, label: 'French',     nativeName: 'Français',   isRTL: false },
  { code: LanguageCode.ES, label: 'Spanish',    nativeName: 'Español',    isRTL: false },
  { code: LanguageCode.PT, label: 'Portuguese', nativeName: 'Português',  isRTL: false },
  { code: LanguageCode.DE, label: 'German',     nativeName: 'Deutsch',    isRTL: false },
  { code: LanguageCode.ZH, label: 'Chinese',    nativeName: '中文',        isRTL: false },
  { code: LanguageCode.JA, label: 'Japanese',   nativeName: '日本語',       isRTL: false },
  { code: LanguageCode.KO, label: 'Korean',     nativeName: '한국어',       isRTL: false },
  { code: LanguageCode.RU, label: 'Russian',    nativeName: 'Русский',    isRTL: false },
  { code: LanguageCode.HI, label: 'Hindi',      nativeName: 'हिंदी',       isRTL: false },
  { code: LanguageCode.IT, label: 'Italian',    nativeName: 'Italiano',   isRTL: false },
  { code: LanguageCode.NL, label: 'Dutch',      nativeName: 'Nederlands', isRTL: false },
  { code: LanguageCode.PL, label: 'Polish',     nativeName: 'Polski',     isRTL: false },
  { code: LanguageCode.TR, label: 'Turkish',    nativeName: 'Türkçe',     isRTL: false },
  { code: LanguageCode.FA, label: 'Persian',    nativeName: 'فارسی',      isRTL: true  },
  { code: LanguageCode.UR, label: 'Urdu',       nativeName: 'اردو',       isRTL: true  },
  { code: LanguageCode.ID, label: 'Indonesian', nativeName: 'Indonesia',  isRTL: false },
  { code: LanguageCode.MS, label: 'Malay',      nativeName: 'Melayu',     isRTL: false },
  { code: LanguageCode.TH, label: 'Thai',       nativeName: 'ภาษาไทย',    isRTL: false },
];

const EMERGENCY_TEMPLATES = [
  'Please proceed to the nearest emergency exit.',
  'Medical assistance is available at Gate A.',
  'Crowd density is high in Zone 4 — please disperse.',
  'The match has been temporarily suspended.',
  'All clear — normal operations have resumed.',
];

export const MultilingualAssistant = memo(function MultilingualAssistant() {
  const [targetLang, setTargetLang] = useState<LanguageCode>(LanguageCode.AR);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === targetLang)!;

  const translate = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as TranslationResult;
      setResult(data);
    } catch {
      // Demo fallback
      setResult({
        originalText: text,
        translatedText: `[Demo] ${text} (translated to ${currentLang.nativeName})`,
        targetLanguage: targetLang,
        culturalNotes: 'Server not running — using demo mode.',
        isRTL: currentLang.isRTL,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-label="Multilingual Assistant" className="flex flex-col gap-6">
      <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span aria-hidden="true">🌍</span> Multilingual Assistant
          </h2>
          <button
            type="button"
            id="emergency-mode-toggle"
            onClick={() => setIsEmergencyMode((e) => !e)}
            aria-pressed={isEmergencyMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500
              ${isEmergencyMode ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-red-800'}`}
          >
            🆘 Emergency Mode
          </button>
        </div>

        {/* Language selector */}
        <div className="mb-4">
          <label htmlFor="lang-selector" className="text-xs text-slate-400 font-medium block mb-2">
            Target Language
          </label>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2" role="group" aria-label="Language selection">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                id={`lang-${lang.code}`}
                onClick={() => setTargetLang(lang.code)}
                aria-pressed={targetLang === lang.code}
                title={lang.label}
                className={`px-2 py-2 rounded-xl text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center
                  ${targetLang === lang.code
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
              >
                <span className="block font-bold">{lang.nativeName}</span>
                {lang.isRTL && <span className="text-[9px] text-indigo-300">RTL</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency templates */}
        {isEmergencyMode && (
          <div className="mb-4 bg-red-900/30 border border-red-500/40 rounded-xl p-3">
            <p className="text-xs font-bold text-red-400 mb-2">🚨 Emergency Announcement Templates</p>
            <div className="flex flex-col gap-2">
              {EMERGENCY_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setInputText(tpl); translate(tpl); }}
                  className="text-left text-xs text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Use emergency template: ${tpl}`}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="mb-3">
          <label htmlFor="translate-input" className="text-xs text-slate-400 font-medium block mb-1">
            Text to Translate
          </label>
          <textarea
            id="translate-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate into the selected language…"
            rows={4}
            maxLength={2000}
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2 text-sm text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 resize-none"
            aria-label="Text to translate"
          />
          <p className="text-xs text-slate-500 text-right mt-0.5">{inputText.length}/2000</p>
        </div>

        <button
          type="button"
          id="translate-btn"
          onClick={() => translate(inputText)}
          disabled={isLoading || !inputText.trim()}
          aria-busy={isLoading}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600
                     text-white hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isLoading ? '⏳ Translating…' : `🌐 Translate to ${currentLang.label}`}
        </button>

        {error && <p className="text-red-400 text-sm mt-2" role="alert">{error}</p>}
      </div>

      {/* Translation result */}
      {result && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Translation Result</h3>
            <span className="text-xs text-slate-400">{LANGUAGES.find((l) => l.code === result.targetLanguage)?.label}</span>
          </div>

          {/* Translated text with RTL support */}
          <div
            dir={result.isRTL ? 'rtl' : 'ltr'}
            lang={result.targetLanguage}
            className={`bg-slate-800/60 rounded-xl border border-slate-600/40 p-4 text-lg text-white leading-relaxed ${result.isRTL ? 'text-right font-arabic' : ''}`}
            aria-label={`Translation result in ${LANGUAGES.find((l) => l.code === result.targetLanguage)?.label}`}
          >
            {result.translatedText}
          </div>

          {result.isRTL && (
            <p className="text-xs text-indigo-400 mt-1.5 flex items-center gap-1">
              <span aria-hidden="true">↔️</span> Right-to-left layout active
            </p>
          )}

          {result.culturalNotes && (
            <div className="mt-3 bg-amber-900/20 border border-amber-700/40 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-400 mb-1">📖 Cultural Notes</p>
              <p className="text-xs text-slate-300">{result.culturalNotes}</p>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-2">
            Translated at {new Date(result.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </section>
  );
});
