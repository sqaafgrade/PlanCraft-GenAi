// ============================================================
// src/components/shared/ZoneInputForm.tsx
// Labeled zone input form — fully accessible
// Per ACCESSIBILITY.md §1.3: <label for>, ARIA roles
// ============================================================

import { memo } from 'react';
import { ZoneData } from '@/types';

interface ZoneInputFormProps {
  zone: ZoneData;
  onUpdate: (zoneId: string, updates: Partial<ZoneData>) => void;
}

interface FieldConfig {
  key: keyof ZoneData;
  label: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldConfig[] = [
  { key: 'occupancy',   label: 'Current Occupancy',     min: 0,     max: 200000, step: 100 },
  { key: 'capacity',    label: 'Zone Capacity',          min: 1,     max: 200000, step: 100 },
  { key: 'ingressRate', label: 'Ingress Rate (ppl/min)', min: 0,     max: 2000,   step: 10  },
  { key: 'egressRate',  label: 'Egress Rate (ppl/min)',  min: 0,     max: 2000,   step: 10  },
  { key: 'queueLength', label: 'Queue Length',           min: 0,     max: 10000,  step: 10  },
  { key: 'serviceRate', label: 'Service Rate (ppl/min)', min: 1,     max: 1000,   step: 5   },
];

export const ZoneInputForm = memo(function ZoneInputForm({ zone, onUpdate }: ZoneInputFormProps) {
  return (
    <fieldset
      className="border border-slate-600/40 rounded-xl p-4 bg-slate-800/40"
      aria-label={`Zone ${zone.zoneName} input controls`}
    >
      <legend className="text-sm font-semibold text-emerald-400 px-2">{zone.zoneName}</legend>
      <div className="grid grid-cols-2 gap-3 mt-2">
        {FIELDS.map((field) => {
          const inputId = `zone-${zone.zoneId}-${field.key}`;
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <label
                htmlFor={inputId}
                className="text-xs text-slate-400 font-medium"
              >
                {field.label}
              </label>
              <input
                id={inputId}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={zone[field.key] as number}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onUpdate(zone.zoneId, { [field.key]: val });
                }}
                className="bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                           hover:border-slate-500 transition-colors"
                aria-label={`${field.label} for ${zone.zoneName}`}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
});
