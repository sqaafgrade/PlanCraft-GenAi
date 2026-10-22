// ============================================================
// src/components/Transport/TransportOptimizer.tsx
// Multi-modal transport display + AI departure recommendations
// Per PROBLEM_ALIGNMENT.md §1.4
// ============================================================

import { memo, useState } from 'react';
import { TransportMode, TransportSchedule, TransportRecommendation } from '@/types';
import { scoreTransportOption } from '@/lib/stadiumCompute';

const MOCK_SCHEDULES: TransportSchedule[] = [
  { mode: TransportMode.Metro,    routeName: 'Red Line → Stadium Stn',  nextArrivalMinutes: 4,  frequencyMinutes: 6,  available: true  },
  { mode: TransportMode.Metro,    routeName: 'Blue Line → City Center',  nextArrivalMinutes: 11, frequencyMinutes: 8,  available: true  },
  { mode: TransportMode.Bus,      routeName: 'Bus 47 → Gate A',          nextArrivalMinutes: 7,  frequencyMinutes: 12, available: true  },
  { mode: TransportMode.Shuttle,  routeName: 'Shuttle → Parking P3',     nextArrivalMinutes: 2,  frequencyMinutes: 5,  available: true  },
  { mode: TransportMode.Rideshare,routeName: 'Rideshare Drop-off',       nextArrivalMinutes: 8,  frequencyMinutes: 1,  available: true,  surgeFactor: 1.8 },
  { mode: TransportMode.Cycling,  routeName: 'Bike Lane Route',          nextArrivalMinutes: 0,  frequencyMinutes: 0,  available: true  },
  { mode: TransportMode.Parking,  routeName: 'Lot P1 — Gate B',          nextArrivalMinutes: 0,  frequencyMinutes: 0,  available: true,  spotsAvailable: 42 },
  { mode: TransportMode.Parking,  routeName: 'Lot P2 — East Wing',       nextArrivalMinutes: 0,  frequencyMinutes: 0,  available: false, spotsAvailable: 0  },
];

const MODE_ICONS: Record<TransportMode, string> = {
  [TransportMode.Metro]:    '🚇',
  [TransportMode.Bus]:      '🚌',
  [TransportMode.Shuttle]:  '🚐',
  [TransportMode.Rideshare]:'🚗',
  [TransportMode.Cycling]:  '🚲',
  [TransportMode.Walking]:  '🚶',
  [TransportMode.Parking]:  '🅿️',
};

function computeRecommendation(schedules: TransportSchedule[]): TransportRecommendation {
  const scored = schedules
    .filter((s) => s.available && s.mode !== TransportMode.Parking && s.mode !== TransportMode.Cycling)
    .map((s) => ({ s, score: scoreTransportOption(s.nextArrivalMinutes, s.surgeFactor ?? 1) }))
    .sort((a, b) => a.score - b.score);

  const best = scored[0]?.s ?? schedules[0];
  return {
    recommendedMode: best.mode,
    departureInMinutes: best.nextArrivalMinutes + 5,
    reason: best.surgeFactor && best.surgeFactor > 1.5
      ? `Rideshare surge active (${best.surgeFactor}x). Public transit preferred.`
      : `Fastest option: arrives in ${best.nextArrivalMinutes} min`,
    alternatives: scored.slice(1).map((s) => s.s),
  };
}

export const TransportOptimizer = memo(function TransportOptimizer() {
  const [schedules] = useState<TransportSchedule[]>(MOCK_SCHEDULES);
  const recommendation: TransportRecommendation = computeRecommendation(schedules);

  const metros  = schedules.filter((s) => s.mode === TransportMode.Metro);
  const buses   = schedules.filter((s) => s.mode === TransportMode.Bus);
  const shuttles = schedules.filter((s) => s.mode === TransportMode.Shuttle);
  const rideshare = schedules.filter((s) => s.mode === TransportMode.Rideshare);
  const parking = schedules.filter((s) => s.mode === TransportMode.Parking);
  const cycling = schedules.filter((s) => s.mode === TransportMode.Cycling);

  const groups = [
    { label: 'Metro', items: metros },
    { label: 'Bus', items: buses },
    { label: 'Shuttle', items: shuttles },
    { label: 'Rideshare', items: rideshare },
    { label: 'Parking', items: parking },
    { label: 'Cycling', items: cycling },
  ].filter((g) => g.items.length > 0);

  return (
    <section aria-label="Multi-Modal Transport Optimizer" className="flex flex-col gap-6">
      {/* AI recommendation card */}
      <div className="bg-gradient-to-br from-sky-900/60 to-indigo-900/60 rounded-2xl border border-sky-500/30 p-5">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span aria-hidden="true">🚌</span> Smart Departure Recommendation
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-4xl" aria-hidden="true">{MODE_ICONS[recommendation.recommendedMode]}</div>
          <div>
            <p className="text-2xl font-black text-white">
              Depart in <span className="text-sky-400">{recommendation.departureInMinutes} min</span>
            </p>
            <p className="text-sm text-slate-300 mt-0.5">{recommendation.reason}</p>
            <p className="text-xs text-slate-400 mt-1">Recommended: {recommendation.recommendedMode}</p>
          </div>
        </div>
      </div>

      {/* Transport groups */}
      {groups.map(({ label, items }) => (
        <div key={label} className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span aria-hidden="true">{MODE_ICONS[items[0].mode]}</span> {label}
          </h3>
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 ${item.available ? 'border-slate-600/40 bg-slate-800/40' : 'border-slate-700/30 bg-slate-800/20 opacity-50'}`}
                aria-label={`${item.routeName}, ${item.available ? 'available' : 'unavailable'}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm text-white">{item.routeName}</p>
                    {item.spotsAvailable !== undefined && (
                      <p className={`text-xs mt-0.5 ${item.spotsAvailable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.spotsAvailable > 0 ? `${item.spotsAvailable} spots available` : 'Full'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.nextArrivalMinutes > 0 && (
                      <p className="text-lg font-black text-sky-400">{item.nextArrivalMinutes} min</p>
                    )}
                    {item.frequencyMinutes > 0 && (
                      <p className="text-xs text-slate-400">Every {item.frequencyMinutes} min</p>
                    )}
                    {item.surgeFactor && item.surgeFactor > 1 && (
                      <p className="text-xs text-orange-400 font-bold mt-0.5">
                        {item.surgeFactor}x surge
                      </p>
                    )}
                  </div>
                </div>
                {!item.available && (
                  <p className="text-xs text-red-400 mt-2">❌ Currently unavailable</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
});
