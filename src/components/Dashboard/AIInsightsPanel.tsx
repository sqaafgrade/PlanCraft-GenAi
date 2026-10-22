// ============================================================
// src/components/Dashboard/AIInsightsPanel.tsx
// Gemini AI crowd insight display + match phase selector
// Per PROBLEM_ALIGNMENT.md §1.7 & §1.8
// ============================================================

import { memo, useState } from 'react';
import { AIInsightResponse, AIInsightRequest } from '@/types';

interface AIInsightsPanelProps {
  insight: AIInsightResponse | null;
  isLoading: boolean;
  onFetch: (matchPhase: AIInsightRequest['matchPhase']) => Promise<void>;
}

const MATCH_PHASES: { value: AIInsightRequest['matchPhase']; label: string }[] = [
  { value: 'pre-match',  label: '⏳ Pre-Match'  },
  { value: 'kickoff',    label: '⚽ Kickoff'    },
  { value: 'halftime',   label: '⏸️ Halftime'   },
  { value: 'full-time',  label: '🏁 Full-Time'  },
  { value: 'post-match', label: '📊 Post-Match' },
];

// Minimal markdown renderer (bold, headers, bullets)
function renderMarkdown(md: string): React.JSX.Element {
  const lines = md.split('\n');
  return (
    <div className="space-y-1.5 text-sm text-slate-200 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('# '))    return <h2 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h2>;
        if (line.startsWith('## '))   return <h3 key={i} className="text-base font-bold text-emerald-400 mt-3 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('### '))  return <h4 key={i} className="text-sm font-bold text-sky-400 mt-2">{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc">{formatInline(line.slice(2))}</li>;
        if (line.match(/^\d+\. /))
          return <li key={i} className="ml-4 list-decimal">{formatInline(line.replace(/^\d+\. /, ''))}</li>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : part
  );
}

export const AIInsightsPanel = memo(function AIInsightsPanel({
  insight,
  isLoading,
  onFetch,
}: AIInsightsPanelProps) {
  const [selectedPhase, setSelectedPhase] = useState<AIInsightRequest['matchPhase']>('kickoff');

  return (
    <section aria-label="AI Operational Intelligence Panel" className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span aria-hidden="true">🤖</span> AI Operational Intelligence
        </h2>
        {insight?.cached && (
          <span className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-700/50 px-2 py-0.5 rounded-full">
            ⚡ Cached
          </span>
        )}
      </div>

      {/* Match phase selector */}
      <fieldset>
        <legend className="text-xs text-slate-400 font-medium mb-2">Match Phase</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Match phase selector">
          {MATCH_PHASES.map((phase) => (
            <button
              key={phase.value}
              id={`phase-${phase.value}`}
              type="button"
              onClick={() => setSelectedPhase(phase.value)}
              aria-pressed={selectedPhase === phase.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500
                ${selectedPhase === phase.value
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
            >
              {phase.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Generate button */}
      <button
        type="button"
        id="fetch-ai-insight-btn"
        onClick={() => onFetch(selectedPhase)}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-label="Generate AI crowd intelligence report"
        className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600
                   text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg
                   disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Generating Intelligence Report…
          </span>
        ) : '✨ Generate AI Insights'}
      </button>

      {/* Insight output */}
      {insight && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-600/40 p-4 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">
              Generated {new Date(insight.generatedAt).toLocaleTimeString()}
            </span>
          </div>
          {renderMarkdown(insight.markdown)}
        </div>
      )}

      {!insight && !isLoading && (
        <div className="text-center py-8 text-slate-400">
          <p aria-label="No insights generated yet">Select a match phase and generate AI insights to see crowd intelligence recommendations.</p>
        </div>
      )}
    </section>
  );
});
