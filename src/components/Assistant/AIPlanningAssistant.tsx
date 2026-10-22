// ============================================================
// src/components/Assistant/AIPlanningAssistant.tsx
// Interactive GenAI Planning Assistant: gathers event requirements,
// calls Gemini AI via secure backend endpoint, displays schema-validated plan,
// and applies it directly to the active event.
// ============================================================

import { memo, useState } from 'react';
import {
  EventType,
  EventStatus,
  AIPlanRequest,
  AIPlanResponse,
  TabId,
  BudgetCategory,
  TaskPriority,
  VendorStatus,
} from '@/types';
import { useEventPlanning } from '@/hooks/useEventPlanning';
import { useAppContext } from '@/hooks/useAppContext';
import {
  saveEventBudget,
  saveEventTimeline,
  saveEventVendors,
  saveEventSchedule,
  saveEventIdeas,
} from '@/services/storageService';
import { shiftIsoDate } from '@/lib/eventCompute';

interface AIPlanningAssistantProps {
  onPlanApplied?: (tab: TabId) => void;
}

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Nut-Free',
  'Dairy-Free',
];

const ACCESSIBILITY_OPTIONS = [
  'Step-Free Access',
  'Wheelchair Ramps & Elevators',
  'ASL Interpreter',
  'Quiet Sensory Space',
  'Accessible Restrooms',
  'Audio Announcements / Large Print',
];

export const AIPlanningAssistant = memo(function AIPlanningAssistant({
  onPlanApplied,
}: AIPlanningAssistantProps) {
  const { activeEvent, createEvent, updateEvent, setActiveTab } = useAppContext();
  const { isLoading, error, plan, generatePlan } = useEventPlanning();

  // Form input state initialized from active event if available
  const [eventType, setEventType] = useState<EventType>(activeEvent?.eventType ?? EventType.Wedding);
  const [date, setDate] = useState<string>(activeEvent?.date ?? '2026-09-18');
  const [location, setLocation] = useState<string>(activeEvent?.location ?? 'San Francisco, CA');
  const [guestCount, setGuestCount] = useState<number>(activeEvent?.guestCount ?? 150);
  const [totalBudget, setTotalBudget] = useState<number>(activeEvent?.totalBudget ?? 35000);
  const [themePreference, setThemePreference] = useState<string>(
    activeEvent?.preferences.themePreference ?? 'Botanical Garden & Soft Gold'
  );
  const [venuePreference, setVenuePreference] = useState<string>(
    activeEvent?.preferences.venuePreference ?? 'Outdoor garden with indoor pavilion'
  );
  const [selectedDietary, setSelectedDietary] = useState<string[]>(
    activeEvent?.preferences.dietaryRequirements ?? ['Vegetarian', 'Gluten-Free']
  );
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>(
    activeEvent?.preferences.accessibilityRequirements ?? ['Step-Free Access']
  );
  const [culturalPreferences, setCulturalPreferences] = useState<string>(
    activeEvent?.preferences.culturalPreferences ?? 'Bilingual vows and multicultural music'
  );
  const [specialRequests, setSpecialRequests] = useState<string>(
    activeEvent?.preferences.specialRequests ?? 'Sparkler exit and live acoustic duo'
  );

  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const toggleDietary = (item: string) => {
    setSelectedDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleAccessibility = (item: string) => {
    setSelectedAccessibility((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSuccess(false);

    const req: AIPlanRequest = {
      eventType,
      date,
      location,
      guestCount,
      totalBudget,
      themePreference,
      venuePreference,
      dietaryRequirements: selectedDietary,
      accessibilityRequirements: selectedAccessibility,
      culturalPreferences,
      specialRequests,
    };

    await generatePlan(req);
  };

  const handleApplyPlan = (generated: AIPlanResponse) => {
    let targetEvent = activeEvent;
    if (!targetEvent) {
      targetEvent = createEvent({
        title: `${eventType.toUpperCase()} Celebration`,
        eventType,
        date,
        location,
        guestCount,
        totalBudget,
        status: activeEvent?.status ?? EventStatus.Planning,
        preferences: {
          themePreference,
          venuePreference,
          dietaryRequirements: selectedDietary,
          accessibilityRequirements: selectedAccessibility,
          culturalPreferences,
          specialRequests,
        },
      });
    } else {
      updateEvent(targetEvent.id, {
        eventType,
        date,
        location,
        guestCount,
        totalBudget,
        preferences: {
          themePreference,
          venuePreference,
          dietaryRequirements: selectedDietary,
          accessibilityRequirements: selectedAccessibility,
          culturalPreferences,
          specialRequests,
        },
      });
    }

    const eventId = targetEvent.id;

    // Apply budget items based on generated allocation
    const budgetItems = Object.entries(generated.budgetAllocation).map(([cat, ratio], idx) => ({
      id: `${eventId}-bgt-${idx + 1}`,
      eventId,
      category: (cat as BudgetCategory) || BudgetCategory.Miscellaneous,
      name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Allocation`,
      estimatedCost: Math.round(totalBudget * (ratio || 0.1)),
      actualCost: 0,
      paid: false,
    }));
    saveEventBudget(eventId, budgetItems);

    // Apply milestones based on generated tasks
    const milestones = generated.milestones.map((m, idx) => ({
      id: `${eventId}-tsk-${idx + 1}`,
      eventId,
      title: m.title,
      description: m.description,
      category: 'general' as const,
      targetDate: shiftIsoDate(date, -m.relativeDaysBefore),
      completed: false,
      isOverdue: shiftIsoDate(date, -m.relativeDaysBefore) < new Date().toISOString().split('T')[0],
      priority: m.priority || TaskPriority.Medium,
    }));
    saveEventTimeline(eventId, milestones);

    // Apply vendor checklist
    const vendors = generated.vendorChecklist.map((v, idx) => ({
      id: `${eventId}-vdr-${idx + 1}`,
      eventId,
      category: v.category,
      name: v.name,
      description: v.description,
      priority: v.priority,
      status: VendorStatus.NotStarted,
      estimatedCost: v.estimatedCost,
      actualCost: 0,
    }));
    saveEventVendors(eventId, vendors);

    // Apply day schedule and ideas
    saveEventSchedule(eventId, generated.daySchedule);
    saveEventIdeas(eventId, generated.ideas);

    setAppliedSuccess(true);
    if (onPlanApplied) {
      onPlanApplied(TabId.Dashboard);
    } else {
      setActiveTab(TabId.Dashboard);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Intro Header ── */}
      <section
        aria-labelledby="assistant-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 p-6 backdrop-blur shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl"
            aria-hidden="true"
          >
            🤖
          </div>
          <div>
            <h2 id="assistant-heading" className="text-xl font-black text-white">
              GenAI Event Planning Assistant
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by Google Gemini · Tailored for Weddings, Birthdays, Community Events & Celebrations
            </p>
          </div>
        </div>
      </section>

      {/* ── Requirements Input Form ── */}
      <form
        onSubmit={handleGenerate}
        aria-label="Event Requirements Form"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-6 shadow-xl"
      >
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400">
            1. Event Specifications & Guest Parameters
          </h3>
          <span className="text-[11px] text-slate-400">* Required fields</span>
        </div>

        {/* Event Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="input-event-type" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event Type *
            </label>
            <select
              id="input-event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value={EventType.Wedding}>Wedding 💍</option>
              <option value={EventType.Birthday}>Birthday Party 🎂</option>
              <option value={EventType.Community}>Community Event 🏘️</option>
              <option value={EventType.Anniversary}>Anniversary 🥂</option>
              <option value={EventType.Corporate}>Corporate Event 💼</option>
              <option value={EventType.Party}>Social Celebration 🎉</option>
            </select>
          </div>

          <div>
            <label htmlFor="input-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event Date *
            </label>
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="input-location" className="block text-xs font-semibold text-slate-300 mb-1.5">
              City / Location *
            </label>
            <input
              id="input-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="input-guests" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Estimated Guests *
            </label>
            <input
              id="input-guests"
              type="number"
              min="1"
              max="100000"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Budget & Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="input-budget" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Budget ($ USD) *
            </label>
            <input
              id="input-budget"
              type="number"
              min="0"
              step="100"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="input-theme" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Theme & Style Preference
            </label>
            <input
              id="input-theme"
              type="text"
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value)}
              placeholder="e.g. Rustic Chic, Neon Glow, Festival"
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="input-venue" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Venue Preference
            </label>
            <input
              id="input-venue"
              type="text"
              value={venuePreference}
              onChange={(e) => setVenuePreference(e.target.value)}
              placeholder="e.g. Outdoor garden, Beachfront, Hall"
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dietary & Accessibility Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Dietary */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              Dietary Accommodations
            </span>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const active = selectedDietary.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDietary(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-2">
              Accessibility Considerations (WCAG 2.2 AA)
            </span>
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_OPTIONS.map((opt) => {
                const active = selectedAccessibility.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAccessibility(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      active
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cultural & Special Requests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="input-cultural" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cultural Traditions & Preferences
            </label>
            <input
              id="input-cultural"
              type="text"
              value={culturalPreferences}
              onChange={(e) => setCulturalPreferences(e.target.value)}
              placeholder="e.g. Bilingual ceremony, traditional dance, tea ceremony"
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="input-requests" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Special Requests & Notes
            </label>
            <input
              id="input-requests"
              type="text"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Drone photography, surprise dessert bar, eco-friendly"
              className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            {isLoading ? (
              <span className="flex items-center gap-2 text-indigo-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                Synthesizing personalized plan via Gemini AI...
              </span>
            ) : error ? (
              <span className="text-rose-400">⚠️ {error}</span>
            ) : (
              <span>Calculates budget, timeline milestones, and vendor checklists.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isLoading ? 'Generating Plan...' : 'Generate Personalized Plan ✨'}
          </button>
        </div>
      </form>

      {/* ── Generated Plan Results ── */}
      {plan && (
        <section
          aria-labelledby="generated-plan-heading"
          className="rounded-2xl border border-indigo-500/40 bg-slate-900/80 p-6 flex flex-col gap-6 backdrop-blur shadow-2xl animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Plan Generated
                </span>
                {plan.cached && (
                  <span className="text-[11px] text-slate-400">
                    (Served from in-memory cache)
                  </span>
                )}
              </div>
              <h3 id="generated-plan-heading" className="text-xl font-black text-white mt-1">
                {plan.recommendedTheme}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => handleApplyPlan(plan)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
            >
              {appliedSuccess ? '✓ Plan Applied!' : 'Apply this Plan to Event →'}
            </button>
          </div>

          {/* Overview text */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-sm text-slate-200 leading-relaxed">
            {plan.overview}
          </div>

          {/* Suggested Activities & Decisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <span>🎉</span> Suggested Activities
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                {plan.suggestedActivities.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <span>⚡</span> Strategic Decisions & Actions
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                {plan.importantDecisions.map((dec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">!</span>
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Day-of Schedule */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <span>⏰</span> Proposed Day-of Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.daySchedule.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-indigo-400 font-bold">
                    <span>{s.time}</span>
                  </div>
                  <p className="font-semibold text-white mt-1">{s.activity}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Vendor Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <span>📋</span> Recommended Vendor Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.vendorChecklist.map((v, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {v.category}
                    </span>
                    <p className="font-bold text-white mt-1.5">{v.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{v.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-400 block">${v.estimatedCost.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{v.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
});
