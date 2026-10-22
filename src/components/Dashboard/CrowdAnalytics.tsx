// ============================================================
// src/components/Dashboard/CrowdAnalytics.tsx
// Live crowd heatmap (custom SVG) + zone cards + flow rate bars
// Per EFFICIENCY.md §3: custom SVG renderer, no chart library
// Per ACCESSIBILITY.md §1.1: sr-only textual heatmap summary
// Per EFFICIENCY.md §2: React.memo
// ============================================================

import { memo, useMemo } from 'react';
import { CrowdProfile, ZoneData, DensityLevel } from '@/types';
import { ZoneInputForm } from '@/components/shared/ZoneInputForm';

interface CrowdAnalyticsProps {
  zones: ZoneData[];
  crowdProfiles: CrowdProfile[];
  onUpdateZone: (zoneId: string, updates: Partial<ZoneData>) => void;
}

const DENSITY_COLORS: Record<DensityLevel, string> = {
  [DensityLevel.Low]:       '#10b981',
  [DensityLevel.Moderate]:  '#f59e0b',
  [DensityLevel.High]:      '#f97316',
  [DensityLevel.Critical]:  '#ef4444',
  [DensityLevel.Emergency]: '#dc2626',
};

const DENSITY_BG: Record<DensityLevel, string> = {
  [DensityLevel.Low]:       'bg-emerald-900/40 border-emerald-500/40',
  [DensityLevel.Moderate]:  'bg-amber-900/40 border-amber-500/40',
  [DensityLevel.High]:      'bg-orange-900/40 border-orange-500/40',
  [DensityLevel.Critical]:  'bg-red-900/40 border-red-500/40',
  [DensityLevel.Emergency]: 'bg-red-900/70 border-red-400 animate-pulse',
};

// SVG Heatmap — custom lightweight renderer (no chart lib)
const HeatmapSVG = memo(function HeatmapSVG({ profiles }: { profiles: CrowdProfile[] }) {
  const W = 480;
  const H = 260;
  const cols = 3;
  const rows = Math.ceil(profiles.length / cols);
  const cellW = W / cols;
  const cellH = H / rows;
  const PAD = 6;

  const cells = useMemo(() =>
    profiles.map((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + PAD;
      const y = row * cellH + PAD;
      const w = cellW - PAD * 2;
      const h = cellH - PAD * 2;
      const fill = DENSITY_COLORS[p.densityLevel];
      const opacity = 0.3 + (p.densityPercent / 100) * 0.7;
      return { p, x, y, w, h, fill, opacity };
    }), [profiles, cellW, cellH]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="w-full rounded-xl"
      role="presentation"
    >
      <rect width={W} height={H} rx={12} fill="#0f172a" />
      {cells.map(({ p, x, y, w, h, fill, opacity }) => (
        <g key={p.zoneId}>
          <rect
            x={x} y={y} width={w} height={h} rx={8}
            fill={fill} fillOpacity={opacity}
            stroke={fill} strokeOpacity={0.6} strokeWidth={1}
          />
          <text x={x + w / 2} y={y + h / 2 - 8} textAnchor="middle" fill="#f1f5f9" fontSize={10} fontWeight="600">
            {p.zoneId}
          </text>
          <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight="700">
            {p.densityPercent}%
          </text>
          <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fill={fill} fontSize={9} fontWeight="600">
            {p.densityLevel}
          </text>
        </g>
      ))}
    </svg>
  );
});

export const CrowdAnalytics = memo(function CrowdAnalytics({
  zones,
  crowdProfiles,
  onUpdateZone,
}: CrowdAnalyticsProps) {
  return (
    <section aria-label="Crowd Analytics Dashboard" className="flex flex-col gap-6">

      {/* Screen-reader only heatmap description — WCAG SC 1.1.1 */}
      <ul className="sr-only" aria-label="Crowd density heatmap description">
        {crowdProfiles.map((p) => {
          const zone = zones.find((z) => z.zoneId === p.zoneId);
          return (
            <li key={p.zoneId}>
              {zone?.zoneName ?? p.zoneId}: {p.densityPercent}% occupancy,
              density level {p.densityLevel},
              estimated wait {p.waitTimeMinutes} minutes,
              {p.isAtRisk ? ' AT RISK — immediate action required.' : ' operating normally.'}
            </li>
          );
        })}
      </ul>

      {/* Visual heatmap */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span aria-hidden="true">🗺️</span> Live Crowd Heatmap
        </h2>
        <HeatmapSVG profiles={crowdProfiles} />

        {/* Density legend */}
        <div className="flex flex-wrap gap-3 mt-3" aria-label="Density level legend">
          {(Object.keys(DENSITY_COLORS) as DensityLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: DENSITY_COLORS[level] }}
                aria-hidden="true"
              />
              <span className="text-xs text-slate-400">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {crowdProfiles.map((profile) => {
          const zone = zones.find((z) => z.zoneId === profile.zoneId);
          if (!zone) return null;
          return (
            <div
              key={profile.zoneId}
              className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${DENSITY_BG[profile.densityLevel]}`}
              aria-label={`Zone ${zone.zoneName} crowd status`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{zone.zoneName}</h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: DENSITY_COLORS[profile.densityLevel],
                    border: `1px solid ${DENSITY_COLORS[profile.densityLevel]}`,
                  }}
                >
                  {profile.densityLevel}
                </span>
              </div>

              {/* Occupancy bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Occupancy</span>
                  <span>{zone.occupancy.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-2" role="progressbar"
                  aria-valuenow={profile.densityPercent} aria-valuemin={0} aria-valuemax={100}
                  aria-label={`${zone.zoneName} occupancy ${profile.densityPercent}%`}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profile.densityPercent}%`, backgroundColor: DENSITY_COLORS[profile.densityLevel] }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-700/40 rounded-lg p-2">
                  <p className="text-slate-400">Flow Rate</p>
                  <p className="font-bold text-white">{profile.flowRate > 0 ? '+' : ''}{profile.flowRate}/min</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-2">
                  <p className="text-slate-400">Wait Time</p>
                  <p className="font-bold text-white">{profile.waitTimeMinutes} min</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone input controls */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-2 select-none">
          <span aria-hidden="true">⚙️</span> Adjust Zone Parameters
          <span aria-hidden="true" className="group-open:rotate-180 transition-transform inline-block">▾</span>
        </summary>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {zones.map((zone) => (
            <ZoneInputForm key={zone.zoneId} zone={zone} onUpdate={onUpdateZone} />
          ))}
        </div>
      </details>
    </section>
  );
});
