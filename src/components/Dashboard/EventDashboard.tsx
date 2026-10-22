// ============================================================
// src/components/Dashboard/EventDashboard.tsx
// Command Center Dashboard for GenAI Event Planning Assistant
// Real-time KPI cards, budget utilization, milestones, vendors
// WCAG 2.2 AA compliant with semantic landmarks and ARIA live
// ============================================================

import { memo, useMemo } from 'react';
import { EventItem, EventType, TabId } from '@/types';
import { useEventBudget } from '@/hooks/useEventBudget';
import { useEventTimeline } from '@/hooks/useEventTimeline';
import { useVendorChecklist } from '@/hooks/useVendorChecklist';

interface EventDashboardProps {
  event: EventItem | null;
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onNavigateTab: (tab: TabId) => void;
}

const EVENT_TYPE_ICONS: Record<EventType, string> = {
  [EventType.Wedding]: '💍',
  [EventType.Birthday]: '🎂',
  [EventType.Community]: '🏘️',
  [EventType.Anniversary]: '🥂',
  [EventType.Corporate]: '💼',
  [EventType.Party]: '🎉',
};

export const EventDashboard = memo(function EventDashboard({
  event,
  events,
  onSelectEvent,
  onNavigateTab,
}: EventDashboardProps) {
  const budget = useEventBudget(event?.id ?? 'empty', event?.totalBudget ?? 0, event?.eventType);
  const timeline = useEventTimeline(event?.id ?? 'empty', event?.date ?? '', event?.eventType);
  const vendors = useVendorChecklist(event?.id ?? 'empty', event?.eventType);

  const daysRemaining = timeline.daysRemaining;
  const isPast = daysRemaining < 0;

  const nextUpcomingTask = useMemo(() => {
    return timeline.tasks.find((t) => !t.completed);
  }, [timeline.tasks]);

  if (!event) {
    return (
      <section
        aria-labelledby="dashboard-empty-heading"
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
          ✨
        </div>
        <h2 id="dashboard-empty-heading" className="text-xl font-bold text-white mb-2">
          No Event Selected
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Create a new wedding, birthday, or community event using our GenAI planning assistant to get started.
        </p>
        <button
          type="button"
          onClick={() => onNavigateTab(TabId.Assistant)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Launch AI Planning Assistant
        </button>
      </section>
    );
  }

  const { summary } = budget;
  const { progress } = vendors;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header / Event Switcher ── */}
      <section
        aria-label="Event overview header"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 backdrop-blur shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner"
              aria-hidden="true"
            >
              {EVENT_TYPE_ICONS[event.eventType] || '✨'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {event.eventType}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  📍 {event.location}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  👥 {event.guestCount.toLocaleString()} Guests
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1 leading-tight">
                {event.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Date: <strong className="text-slate-200">{event.date}</strong> · Status: <span className="text-emerald-400 font-medium capitalize">{event.status.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {/* Event selector dropdown & Assistant trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {events.length > 1 && (
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <span className="sr-only">Switch active event</span>
                <select
                  aria-label="Select active event"
                  value={event.id}
                  onChange={(e) => {
                    const match = events.find((ev) => ev.id === e.target.value);
                    if (match) onSelectEvent(match);
                  }}
                  className="bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.eventType})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab(TabId.Assistant)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              + AI Plan Assistant
            </button>
          </div>
        </div>
      </section>

      {/* ── Key Performance Metrics (KPI Cards) ── */}
      <section aria-label="Event Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Days Countdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Countdown</span>
            <span aria-hidden="true">⏳</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {isPast ? Math.abs(daysRemaining) : daysRemaining}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {isPast ? 'Days Ago' : 'Days Left'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Event Date: {event.date}
          </p>
        </div>

        {/* Budget Remaining */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Budget</span>
            <span aria-hidden="true">💰</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ${summary.remainingBudget.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Planned: ${summary.totalBudget.toLocaleString()}
          </p>
        </div>

        {/* Vendor Checklist Progress */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vendors Ready</span>
            <span aria-hidden="true">📋</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {progress.completionPercent}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({progress.completed}/{progress.total} Done)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {progress.confirmed} confirmed · {progress.contacted} contacted
          </p>
        </div>

        {/* Timeline Tasks Progress */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Timeline Milestones</span>
            <span aria-hidden="true">🎯</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {timeline.completedCount}/{timeline.totalCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Tasks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {nextUpcomingTask ? `Next: ${nextUpcomingTask.title.slice(0, 24)}...` : 'All tasks completed!'}
          </p>
        </div>
      </section>

      {/* ── Interactive Progress & Quick Management Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Health Card */}
        <section
          aria-labelledby="budget-summary-title"
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 id="budget-summary-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>📊</span> Budget Utilization & Allocations
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab(TabId.Budget)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none"
              >
                Manage Budget →
              </button>
            </div>

            {summary.isOverBudget && (
              <div
                role="alert"
                className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span><strong>Budget Warning:</strong> Actual or estimated spending exceeds your total budget!</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Spent: ${summary.totalActual.toLocaleString()}</span>
                <span>{summary.utilizationPercent}% of ${summary.totalBudget.toLocaleString()}</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    summary.isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, summary.utilizationPercent)}%` }}
                />
              </div>
            </div>

            {/* Mini Category Allocations */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(summary.categoryAllocations)
                .filter(([_, amt]) => amt > 0)
                .slice(0, 6)
                .map(([cat, amt]) => (
                  <div key={cat} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800/80 text-xs">
                    <span className="text-slate-400 capitalize block truncate">{cat}</span>
                    <span className="font-bold text-slate-100">${amt.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Contingency Reserve (10%):</span>
            <span className="font-semibold text-slate-200">${summary.contingencyAmount.toLocaleString()}</span>
          </div>
        </section>

        {/* Next Milestones & Vendor Progress Card */}
        <section
          aria-labelledby="upcoming-milestones-title"
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 id="upcoming-milestones-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>🗓️</span> Upcoming Preparation Milestones
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab(TabId.Timeline)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none"
              >
                Full Timeline →
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {timeline.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${task.id}`}
                      checked={task.completed}
                      onChange={() => timeline.toggleTask(task.id)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      aria-label={`Mark task completed: ${task.title}`}
                    />
                    <div>
                      <p
                        className={`font-semibold ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {task.targetDate}
                      </p>
                    </div>
                  </div>
                  {task.isOverdue && !task.completed && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Overdue
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Vendors Check: {progress.confirmed} Confirmed</span>
            <button
              type="button"
              onClick={() => onNavigateTab(TabId.Vendors)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none"
            >
              Open Vendor Checklist →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
});
