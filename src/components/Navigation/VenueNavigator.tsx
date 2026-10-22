// ============================================================
// src/components/Navigation/VenueNavigator.tsx
// Turn-by-turn wayfinding, accessibility mode toggle, POI search
// Per PROBLEM_ALIGNMENT.md §1.1 & §1.3, ACCESSIBILITY.md
// ============================================================

import { memo, useState, useMemo } from 'react';
import { AccessibilityMode } from '@/types';
import { VENUE_NODES } from '@/hooks/useNavigationAssist';
import type { UseNavigationAssistReturn } from '@/hooks/useNavigationAssist';

interface VenueNavigatorProps extends UseNavigationAssistReturn {}

const MODE_LABELS: Record<AccessibilityMode, string> = {
  [AccessibilityMode.Standard]:         '🚶 Standard',
  [AccessibilityMode.Wheelchair]:       '♿ Wheelchair',
  [AccessibilityMode.VisualImpairment]: '🦯 Visual Aid',
  [AccessibilityMode.Elderly]:          '🧓 Elderly',
};

const MODE_DESCRIPTIONS: Record<AccessibilityMode, string> = {
  [AccessibilityMode.Standard]:         'Standard walking route',
  [AccessibilityMode.Wheelchair]:       'Elevator & ramp routes only',
  [AccessibilityMode.VisualImpairment]: 'Tactile paving & audio beacon routes',
  [AccessibilityMode.Elderly]:          'Slow-paced with rest area stops',
};

export const VenueNavigator = memo(function VenueNavigator({
  session,
  routes,
  checkpoints,
  setFrom,
  setTo,
  setMode,
  startNavigation,
  endNavigation,
  addCheckpoint,
  deleteCheckpoint,
  clearCheckpoints,
}: VenueNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [checkpointNode, setCheckpointNode] = useState(VENUE_NODES[0].id);

  const filteredNodes = useMemo(
    () =>
      VENUE_NODES.filter((n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <section aria-label="Venue Navigation" className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span aria-hidden="true">🧭</span> Intelligent Venue Navigation
        </h2>

        {/* POI Search */}
        <div className="mb-4">
          <label htmlFor="poi-search" className="text-xs text-slate-400 font-medium block mb-1">
            Search Points of Interest
          </label>
          <input
            id="poi-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gates, food courts, restrooms…"
            className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500"
            aria-label="Search venue points of interest"
          />
          {searchQuery && (
            <ul className="mt-1 bg-slate-800 border border-slate-600/50 rounded-lg overflow-hidden max-h-40 overflow-y-auto" role="listbox" aria-label="Search results">
              {filteredNodes.map((n) => (
                <li
                  key={n.id}
                  role="option"
                  aria-selected={false}
                  className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                  onClick={() => { setTo(n.id); setSearchQuery(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setTo(n.id); setSearchQuery(''); } }}
                  tabIndex={0}
                >
                  <span aria-hidden="true">{n.hasElevator ? '🛗' : n.isRestArea ? '🪑' : '📍'}</span>
                  {n.label}
                  {n.isAccessible && <span className="text-emerald-400 text-xs ml-auto" aria-label="Accessible">♿</span>}
                </li>
              ))}
              {filteredNodes.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-400" role="option" aria-selected={false}>No results found</li>
              )}
            </ul>
          )}
        </div>

        {/* From/To selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="nav-from" className="text-xs text-slate-400 font-medium block mb-1">From</label>
            <select
              id="nav-from"
              value={session.fromNodeId}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Starting location"
            >
              {VENUE_NODES.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nav-to" className="text-xs text-slate-400 font-medium block mb-1">To</label>
            <select
              id="nav-to"
              value={session.toNodeId}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Destination location"
            >
              {VENUE_NODES.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Accessibility mode toggle */}
        <fieldset className="mb-4">
          <legend className="text-xs text-slate-400 font-medium mb-2">Accessibility Mode</legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="radiogroup" aria-label="Accessibility mode">
            {(Object.values(AccessibilityMode) as AccessibilityMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                id={`nav-mode-${mode}`}
                role="radio"
                aria-checked={session.activeMode === mode}
                onClick={() => setMode(mode)}
                title={MODE_DESCRIPTIONS[mode]}
                className={`px-2 py-2 rounded-xl text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500
                  ${session.activeMode === mode
                    ? 'bg-sky-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1.5" aria-live="polite">
            {MODE_DESCRIPTIONS[session.activeMode]}
          </p>
        </fieldset>

        {/* Navigate button */}
        <button
          type="button"
          id="start-navigation-btn"
          onClick={session.isActive ? endNavigation : startNavigation}
          disabled={session.fromNodeId === session.toNodeId}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500
            ${session.isActive
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-500 hover:to-indigo-500 shadow-lg'}`}
          aria-label={session.isActive ? 'End navigation' : 'Start navigation'}
        >
          {session.isActive ? '⛔ End Navigation' : '🗺️ Start Navigation'}
        </button>
      </div>

      {/* Route options */}
      {routes.length > 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-base font-bold text-white mb-3">Available Routes</h3>
          <div className="flex flex-col gap-3">
            {routes.map((route) => (
              <div
                key={route.mode}
                className={`rounded-xl border p-4 transition-all
                  ${session.activeMode === route.mode
                    ? 'border-sky-500 bg-sky-900/20'
                    : 'border-slate-600/40 bg-slate-800/40'}`}
                aria-label={`${route.mode} route: ${route.totalDistanceMeters}m, ${route.estimatedMinutes} minutes`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{MODE_LABELS[route.mode]}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-400">{route.totalDistanceMeters}m</span>
                    <span className="text-sky-400 font-bold">{route.estimatedMinutes} min</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {route.elevatorRequired && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-full">
                      🛗 Elevator
                    </span>
                  )}
                  {route.restAreaCount > 0 && (
                    <span className="text-xs bg-amber-900/50 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded-full">
                      🪑 {route.restAreaCount} Rest Area{route.restAreaCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Turn-by-turn waypoints */}
                {session.isActive && session.activeMode === route.mode && (
                  <ol className="mt-3 space-y-1" aria-label="Turn-by-turn directions">
                    {route.waypoints.map((nodeId, idx) => {
                      const node = VENUE_NODES.find((n) => n.id === nodeId);
                      return (
                        <li key={nodeId} className="flex items-center gap-2 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          {node?.label ?? nodeId}
                          {idx === 0 && <span className="text-emerald-400 ml-auto">Start</span>}
                          {idx === route.waypoints.length - 1 && <span className="text-sky-400 ml-auto">Destination</span>}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkpoints */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white">📌 Checkpoints</h3>
          {checkpoints.length > 0 && (
            <button
              type="button"
              onClick={clearCheckpoints}
              id="clear-checkpoints-btn"
              className="text-xs text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label="Clear all checkpoints"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add checkpoint form */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label htmlFor="checkpoint-label" className="sr-only">Checkpoint label</label>
            <input
              id="checkpoint-label"
              type="text"
              placeholder="Label (e.g. Meet here)"
              value={checkpointLabel}
              onChange={(e) => setCheckpointLabel(e.target.value)}
              className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
            />
          </div>
          <div>
            <label htmlFor="checkpoint-node" className="sr-only">Checkpoint location</label>
            <select
              id="checkpoint-node"
              value={checkpointNode}
              onChange={(e) => setCheckpointNode(e.target.value)}
              className="bg-slate-700/60 border border-slate-600/50 rounded-lg px-2 py-1.5 text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Checkpoint location selector"
            >
              {VENUE_NODES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            id="add-checkpoint-btn"
            onClick={() => {
              if (checkpointLabel.trim()) {
                addCheckpoint(checkpointLabel.trim(), checkpointNode);
                setCheckpointLabel('');
              }
            }}
            disabled={!checkpointLabel.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Add checkpoint"
          >
            +
          </button>
        </div>

        {checkpoints.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No checkpoints saved.</p>
        ) : (
          <ul className="space-y-2" aria-label="Saved checkpoints">
            {checkpoints.map((cp) => {
              const node = VENUE_NODES.find((n) => n.id === cp.nodeId);
              return (
                <li key={cp.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                  <span aria-hidden="true">📌</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cp.label}</p>
                    <p className="text-xs text-slate-400">{node?.label ?? cp.nodeId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCheckpoint(cp.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    aria-label={`Delete checkpoint ${cp.label}`}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
});
