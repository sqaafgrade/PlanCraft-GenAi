// ============================================================
// src/components/shared/AlertBanner.tsx
// Multi-channel emergency alerts — visual + aria-live (audio)
// Per ACCESSIBILITY.md §1.3, PROBLEM_ALIGNMENT.md §1.8
// ============================================================

import { memo } from 'react';
import { StadiumAlert, AlertSeverity } from '@/types';

interface AlertBannerProps {
  alerts: StadiumAlert[];
  onDismiss: (id: string) => void;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  [AlertSeverity.Info]:      'bg-blue-900/60 border-blue-400 text-blue-100',
  [AlertSeverity.Warning]:   'bg-yellow-900/60 border-yellow-400 text-yellow-100',
  [AlertSeverity.Critical]:  'bg-orange-900/60 border-orange-400 text-orange-100',
  [AlertSeverity.Emergency]: 'bg-red-900/70 border-red-400 text-red-100 animate-pulse',
};

const SEVERITY_ICONS: Record<AlertSeverity, string> = {
  [AlertSeverity.Info]:      'ℹ️',
  [AlertSeverity.Warning]:   '⚠️',
  [AlertSeverity.Critical]:  '🚨',
  [AlertSeverity.Emergency]: '🆘',
};

export const AlertBanner = memo(function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const visible = alerts.filter((a) => !a.dismissed);
  if (visible.length === 0) return null;

  return (
    // aria-live="assertive" ensures screen readers announce alerts immediately
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-xl p-4 flex items-start gap-3 shadow-2xl backdrop-blur-sm ${SEVERITY_STYLES[alert.severity]}`}
        >
          <span aria-hidden="true" className="text-xl shrink-0 mt-0.5">
            {SEVERITY_ICONS[alert.severity]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">{alert.title}</p>
            <p className="text-xs mt-0.5 opacity-90">{alert.message}</p>
            <p className="text-xs opacity-60 mt-1">
              {new Date(alert.timestamp).toLocaleTimeString()}
              {alert.zoneId ? ` · Zone ${alert.zoneId}` : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Dismiss alert: ${alert.title}`}
            onClick={() => onDismiss(alert.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline focus:outline-2 focus:outline-white rounded"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
});
