// ============================================================
// src/hooks/useStadiumAnalytics.ts
// Zone form state + memoized crowd profile + AI insight state
// Per CODE_QUALITY.md §1.2, EFFICIENCY.md §2
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import {
  ZoneData,
  CrowdProfile,
  StadiumAlert,
  AlertSeverity,
  DensityLevel,
  AIInsightRequest,
  AIInsightResponse,
} from '@/types';
import {
  computeDensityLevel,
  computeDensityPercent,
  computeFlowRate,
  computeWaitTime,
} from '@/lib/stadiumCompute';

const DEFAULT_ZONES: ZoneData[] = [
  { zoneId: 'Z1', zoneName: 'North Stand', occupancy: 12000, capacity: 20000, ingressRate: 200, egressRate: 50, queueLength: 120, serviceRate: 40, lastUpdated: Date.now() },
  { zoneId: 'Z2', zoneName: 'South Stand', occupancy: 16000, capacity: 20000, ingressRate: 300, egressRate: 80, queueLength: 220, serviceRate: 60, lastUpdated: Date.now() },
  { zoneId: 'Z3', zoneName: 'East Wing',   occupancy: 8500,  capacity: 15000, ingressRate: 150, egressRate: 60, queueLength: 80,  serviceRate: 35, lastUpdated: Date.now() },
  { zoneId: 'Z4', zoneName: 'West Wing',   occupancy: 14300, capacity: 15000, ingressRate: 400, egressRate: 30, queueLength: 350, serviceRate: 55, lastUpdated: Date.now() },
  { zoneId: 'Z5', zoneName: 'VIP Box',     occupancy: 1800,  capacity: 2000,  ingressRate: 30,  egressRate: 10, queueLength: 10,  serviceRate: 20, lastUpdated: Date.now() },
];

export interface UseStadiumAnalyticsReturn {
  zones: ZoneData[];
  crowdProfiles: CrowdProfile[];
  alerts: StadiumAlert[];
  aiInsight: AIInsightResponse | null;
  isLoadingInsight: boolean;
  updateZone: (zoneId: string, updates: Partial<ZoneData>) => void;
  fetchAIInsight: (matchPhase: AIInsightRequest['matchPhase']) => Promise<void>;
  dismissAlert: (alertId: string) => void;
}

export function useStadiumAnalytics(): UseStadiumAnalyticsReturn {
  const [zones, setZones] = useState<ZoneData[]>(DEFAULT_ZONES);
  const [aiInsight, setAiInsight] = useState<AIInsightResponse | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [alerts, setAlerts] = useState<StadiumAlert[]>([]);

  // Memoized crowd profiles — only recalculates when zones change
  const crowdProfiles = useMemo<CrowdProfile[]>(() => {
    return zones.map((zone) => {
      const densityLevel = computeDensityLevel(zone.occupancy, zone.capacity);
      const densityPercent = computeDensityPercent(zone.occupancy, zone.capacity);
      const flowRate = computeFlowRate(zone.ingressRate, zone.egressRate, 1);
      const waitTimeMinutes = computeWaitTime(zone.queueLength, zone.serviceRate);
      const isAtRisk = densityLevel === DensityLevel.Critical || densityLevel === DensityLevel.Emergency;
      return { zoneId: zone.zoneId, densityLevel, densityPercent, flowRate, waitTimeMinutes, isAtRisk };
    });
  }, [zones]);

  // Auto-generate alerts when zones hit critical/emergency
  useMemo(() => {
    const newAlerts: StadiumAlert[] = crowdProfiles
      .filter((p) => p.isAtRisk)
      .map((p) => {
        const zone = zones.find((z) => z.zoneId === p.zoneId);
        const severity = p.densityLevel === DensityLevel.Emergency ? AlertSeverity.Emergency : AlertSeverity.Critical;
        return {
          id: `alert-${p.zoneId}-${Date.now()}`,
          severity,
          title: `${p.densityLevel} density in ${zone?.zoneName ?? p.zoneId}`,
          message: `Occupancy at ${p.densityPercent}%. Immediate action required.`,
          zoneId: p.zoneId,
          timestamp: Date.now(),
          dismissed: false,
        };
      });
    if (newAlerts.length > 0) {
      setAlerts((prev) => {
        const existingZoneIds = new Set(prev.filter((a) => !a.dismissed).map((a) => a.zoneId));
        const filtered = newAlerts.filter((a) => !existingZoneIds.has(a.zoneId));
        return [...prev, ...filtered];
      });
    }
  }, [crowdProfiles, zones]);

  const updateZone = useCallback((zoneId: string, updates: Partial<ZoneData>) => {
    setZones((prev) =>
      prev.map((z) => (z.zoneId === zoneId ? { ...z, ...updates, lastUpdated: Date.now() } : z))
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)));
  }, []);

  const fetchAIInsight = useCallback(
    async (matchPhase: AIInsightRequest['matchPhase']) => {
      setIsLoadingInsight(true);
      try {
        const payload: AIInsightRequest = { zones, matchPhase };
        const res = await fetch('/api/crowd-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json() as AIInsightResponse;
        setAiInsight(data);
      } catch (err) {
        console.error('AI insight fetch failed:', err);
      } finally {
        setIsLoadingInsight(false);
      }
    },
    [zones]
  );

  return { zones, crowdProfiles, alerts, aiInsight, isLoadingInsight, updateZone, fetchAIInsight, dismissAlert };
}
