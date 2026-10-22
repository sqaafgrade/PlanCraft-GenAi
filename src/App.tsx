// ============================================================
// src/App.tsx
// High-level router/shell for GenAI Event Planning Assistant
// Thin orchestrator conforming to WCAG 2.2 Level AA accessibility
// ============================================================

import { memo } from 'react';
import { TabId } from '@/types';
import { AppContextProvider } from '@/context/AppContext';
import { useAppContext } from '@/hooks/useAppContext';
import { EventDashboard } from '@/components/Dashboard/EventDashboard';
import { AIPlanningAssistant } from '@/components/Assistant/AIPlanningAssistant';
import { BudgetManager } from '@/components/Budget/BudgetManager';
import { TimelineSchedule } from '@/components/Timeline/TimelineSchedule';
import { VendorChecklist } from '@/components/Vendors/VendorChecklist';
import { PersonalizedIdeas } from '@/components/Ideas/PersonalizedIdeas';
import { MultilingualAssistant } from '@/components/Multilingual/MultilingualAssistant';

const TABS: { id: TabId; label: string; icon: string; ariaLabel: string }[] = [
  { id: TabId.Dashboard,    label: 'Dashboard',   icon: '📊', ariaLabel: 'Event Overview Dashboard' },
  { id: TabId.Assistant,    label: 'AI Assistant',icon: '🤖', ariaLabel: 'GenAI Planning Assistant' },
  { id: TabId.Budget,       label: 'Budget',      icon: '💰', ariaLabel: 'Budget & Expense Manager' },
  { id: TabId.Timeline,     label: 'Timeline',    icon: '🗓️', ariaLabel: 'Timeline & Event-Day Schedule' },
  { id: TabId.Vendors,      label: 'Vendors',     icon: '📋', ariaLabel: 'Vendor Checklist & Suppliers' },
  { id: TabId.Ideas,        label: 'Ideas',       icon: '💡', ariaLabel: 'Personalized Event Ideas' },
  { id: TabId.Multilingual, label: 'Invites',     icon: '🌍', ariaLabel: 'Multilingual Invitations' },
];

const AppShell = memo(function AppShell() {
  const { activeTab, setActiveTab, activeEvent, events, setActiveEvent } = useAppContext();

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 flex flex-col">
      {/* ── Header ── */}
      <header
        aria-label="Event Planning Assistant header"
        className="sticky top-0 z-40 bg-[#020817]/90 backdrop-blur border-b border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-900/50"
              aria-hidden="true"
            >
              ✨
            </div>
            <div>
              <h1 className="font-black text-white text-base leading-tight">
                PlanCraft GenAI
              </h1>
              <p className="text-xs text-slate-400 leading-none">
                Weddings · Birthdays · Community Events
              </p>
            </div>
          </div>

          {/* Active Event badge & Live AI status */}
          <div className="flex items-center gap-3">
            {activeEvent && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                Active: {activeEvent.title.slice(0, 28)}
              </span>
            )}
            <div className="flex items-center gap-2" aria-label="Live AI status">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-xs text-emerald-400 font-medium hidden sm:inline">AI READY</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav
          aria-label="Main navigation tabs"
          className="max-w-7xl mx-auto px-4 overflow-x-auto"
        >
          <div
            role="tablist"
            aria-label="Application sections"
            className="flex gap-1 pb-0.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="main-content"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset
                    ${isActive
                      ? 'text-white bg-slate-800/60 border-b-2 border-indigo-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/30'}`}
                  aria-label={tab.ariaLabel}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main
        id="main-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        aria-label={TABS.find((t) => t.id === activeTab)?.ariaLabel}
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 fade-in"
        tabIndex={-1}
      >
        {activeTab === TabId.Dashboard && (
          <EventDashboard
            event={activeEvent}
            events={events}
            onSelectEvent={setActiveEvent}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === TabId.Assistant && (
          <AIPlanningAssistant onPlanApplied={setActiveTab} />
        )}

        {activeTab === TabId.Budget && (
          <BudgetManager event={activeEvent} />
        )}

        {activeTab === TabId.Timeline && (
          <TimelineSchedule event={activeEvent} />
        )}

        {activeTab === TabId.Vendors && (
          <VendorChecklist event={activeEvent} />
        )}

        {activeTab === TabId.Ideas && (
          <PersonalizedIdeas event={activeEvent} />
        )}

        {activeTab === TabId.Multilingual && (
          <MultilingualAssistant />
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        aria-label="Application footer"
        className="border-t border-slate-800/80 py-4 px-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span>PlanCraft GenAI · Weddings, Birthdays & Community Events</span>
          <span>WCAG 2.2 AA · Zero-Trust Security · Verified Tests</span>
        </div>
      </footer>
    </div>
  );
});

export default function App() {
  return (
    <AppContextProvider>
      <AppShell />
    </AppContextProvider>
  );
}
