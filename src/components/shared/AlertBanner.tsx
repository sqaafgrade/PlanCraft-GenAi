// ============================================================
// src/components/shared/AlertBanner.tsx
// Multi-channel priority alerts — visual + aria-live (accessible)
// Supports budget overrun warnings, overdue milestones, and urgent notices
// ============================================================

import { memo } from 'react';
import { AlertSeverity } from '@/types';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  zoneId?: string;
  eventId?: string;
  timestamp: number;
  dismissed: boolean;
}

interface AlertBannerProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  [AlertSeverity.Info]:      'bg-blue-900/80 border-blue-400 text-blue-100',
  [AlertSeverity.Warning]:   'bg-amber-900/80 border-amber-400 text-amber-100',
  [AlertSeverity.Critical]:  'bg-orange-900/80 border-orange-400 text-orange-100',
  [AlertSeverity.Emergency]: 'bg-rose-900/90 border-rose-400 text-rose-100 animate-pulse',
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
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-xl p-4 flex items-start gap-3 shadow-2xl backdrop-blur-md ${SEVERITY_STYLES[alert.severity]}`}
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
              {alert.eventId ? ` · Event ${alert.eventId}` : ''}
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
