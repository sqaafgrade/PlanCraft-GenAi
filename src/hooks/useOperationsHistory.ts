// ============================================================
// src/hooks/useOperationsHistory.ts
// Match-day snapshot CRUD + checkpoint management
// Per CODE_QUALITY.md §1.2
// ============================================================

import { useState, useCallback } from 'react';
import { MatchDaySnapshot, ZoneData, Checkpoint, SustainabilityMetrics } from '@/types';
import {
  saveSnapshot,
  loadSnapshots,
  deleteSnapshot,
  clearSnapshots,
} from '@/services/storageService';

export interface UseOperationsHistoryReturn {
  snapshots: MatchDaySnapshot[];
  createSnapshot: (
    matchLabel: string,
    zones: ZoneData[],
    checkpoints: Checkpoint[],
    metrics: SustainabilityMetrics
  ) => MatchDaySnapshot;
  removeSnapshot: (id: string) => void;
  clearAll: () => void;
}

export function useOperationsHistory(): UseOperationsHistoryReturn {
  const [snapshots, setSnapshots] = useState<MatchDaySnapshot[]>(loadSnapshots());

  const createSnapshot = useCallback(
    (
      matchLabel: string,
      zones: ZoneData[],
      checkpoints: Checkpoint[],
      metrics: SustainabilityMetrics
    ): MatchDaySnapshot => {
      const snap: MatchDaySnapshot = {
        id: `snap-${Date.now()}`,
        matchLabel,
        timestamp: Date.now(),
        zones,
        checkpoints,
        sustainabilityMetrics: metrics,
      };
      saveSnapshot(snap);
      setSnapshots((prev) => [...prev, snap]);
      return snap;
    },
    []
  );

  const removeSnapshot = useCallback((id: string) => {
    deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    clearSnapshots();
    setSnapshots([]);
  }, []);

  return { snapshots, createSnapshot, removeSnapshot, clearAll };
}
