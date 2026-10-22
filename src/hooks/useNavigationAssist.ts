// ============================================================
// src/hooks/useNavigationAssist.ts
// Venue graph state, accessible route filtering, wayfinding
// Per CODE_QUALITY.md §1.2, PROBLEM_ALIGNMENT.md §1.1 & §1.3
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import {
  VenueNode,
  VenueEdge,
  RouteOption,
  WayfindingSession,
  AccessibilityMode,
  Checkpoint,
} from '@/types';
import { dijkstra, AdjacencyEntry } from '@/lib/stadiumCompute';
import { saveCheckpoints, loadCheckpoints } from '@/services/storageService';

// ----- Static venue graph -----
export const VENUE_NODES: VenueNode[] = [
  { id: 'gate-a',    label: 'Gate A (Main)',       floor: 0, x: 100, y: 400, isAccessible: true,  isRestArea: false, hasElevator: false, hasTactilePaving: true  },
  { id: 'gate-b',    label: 'Gate B (South)',       floor: 0, x: 100, y: 200, isAccessible: true,  isRestArea: false, hasElevator: false, hasTactilePaving: true  },
  { id: 'lobby',     label: 'Main Lobby',           floor: 0, x: 250, y: 300, isAccessible: true,  isRestArea: true,  hasElevator: true,  hasTactilePaving: true  },
  { id: 'elevator1', label: 'Elevator Bank 1',      floor: 0, x: 300, y: 300, isAccessible: true,  isRestArea: false, hasElevator: true,  hasTactilePaving: false },
  { id: 'stairs1',   label: 'Stairwell 1',          floor: 0, x: 320, y: 280, isAccessible: false, isRestArea: false, hasElevator: false, hasTactilePaving: false },
  { id: 'concourse', label: 'Concourse Level 1',    floor: 1, x: 300, y: 300, isAccessible: true,  isRestArea: true,  hasElevator: true,  hasTactilePaving: true  },
  { id: 'north-blk', label: 'North Block (Sec 12)', floor: 1, x: 200, y: 150, isAccessible: true,  isRestArea: false, hasElevator: false, hasTactilePaving: true  },
  { id: 'south-blk', label: 'South Block (Sec 28)', floor: 1, x: 200, y: 450, isAccessible: true,  isRestArea: false, hasElevator: false, hasTactilePaving: true  },
  { id: 'food-court', label: 'Food Court',          floor: 1, x: 400, y: 300, isAccessible: true,  isRestArea: true,  hasElevator: false, hasTactilePaving: false },
  { id: 'vip-lounge', label: 'VIP Lounge',          floor: 2, x: 350, y: 200, isAccessible: true,  isRestArea: true,  hasElevator: true,  hasTactilePaving: false },
  { id: 'medical',   label: 'Medical Center',       floor: 0, x: 150, y: 350, isAccessible: true,  isRestArea: true,  hasElevator: false, hasTactilePaving: true  },
  { id: 'restroom-a', label: 'Restroom A',          floor: 1, x: 350, y: 350, isAccessible: true,  isRestArea: false, hasElevator: false, hasTactilePaving: false },
];

export const VENUE_EDGES: VenueEdge[] = [
  { from: 'gate-a',    to: 'lobby',     distanceMeters: 80,  isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: true  },
  { from: 'gate-b',    to: 'lobby',     distanceMeters: 60,  isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: true  },
  { from: 'lobby',     to: 'elevator1', distanceMeters: 20,  isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: false },
  { from: 'lobby',     to: 'stairs1',   distanceMeters: 15,  isAccessible: false, isWheelchairOnly: false, hasStairs: true,  hasRamp: false },
  { from: 'elevator1', to: 'concourse', distanceMeters: 0,   isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: false },
  { from: 'stairs1',   to: 'concourse', distanceMeters: 0,   isAccessible: false, isWheelchairOnly: false, hasStairs: true,  hasRamp: false },
  { from: 'concourse', to: 'north-blk', distanceMeters: 120, isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: true  },
  { from: 'concourse', to: 'south-blk', distanceMeters: 130, isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: true  },
  { from: 'concourse', to: 'food-court', distanceMeters: 60, isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: false },
  { from: 'concourse', to: 'restroom-a', distanceMeters: 30, isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: false },
  { from: 'elevator1', to: 'vip-lounge', distanceMeters: 0,  isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: false },
  { from: 'lobby',     to: 'medical',   distanceMeters: 40,  isAccessible: true,  isWheelchairOnly: false, hasStairs: false, hasRamp: true  },
];

function buildAdjacency(
  edges: VenueEdge[],
  mode: AccessibilityMode
): Record<string, AdjacencyEntry[]> {
  const adj: Record<string, AdjacencyEntry[]> = {};
  for (const node of VENUE_NODES) {
    adj[node.id] = [];
  }
  for (const edge of edges) {
    // Filter inaccessible edges for non-Standard modes
    if (mode !== AccessibilityMode.Standard && !edge.isAccessible) continue;
    if (mode === AccessibilityMode.Wheelchair && edge.hasStairs) continue;
    const w = edge.distanceMeters || 1; // elevator uses 1m virtual distance
    adj[edge.from].push({ to: edge.to, weight: w });
    adj[edge.to].push({ to: edge.from, weight: w });
  }
  return adj;
}

function estimateMinutes(distanceMeters: number, mode: AccessibilityMode): number {
  // Walking speed approximations (m/min)
  const speed: Record<AccessibilityMode, number> = {
    [AccessibilityMode.Standard]: 80,
    [AccessibilityMode.Wheelchair]: 50,
    [AccessibilityMode.VisualImpairment]: 40,
    [AccessibilityMode.Elderly]: 35,
  };
  return parseFloat((distanceMeters / speed[mode]).toFixed(1));
}

export interface UseNavigationAssistReturn {
  session: WayfindingSession;
  routes: RouteOption[];
  checkpoints: Checkpoint[];
  setFrom: (nodeId: string) => void;
  setTo: (nodeId: string) => void;
  setMode: (mode: AccessibilityMode) => void;
  startNavigation: () => void;
  endNavigation: () => void;
  addCheckpoint: (label: string, nodeId: string) => void;
  deleteCheckpoint: (id: string) => void;
  clearCheckpoints: () => void;
}

export function useNavigationAssist(): UseNavigationAssistReturn {
  const [session, setSession] = useState<WayfindingSession>({
    fromNodeId: 'gate-a',
    toNodeId: 'north-blk',
    activeMode: AccessibilityMode.Standard,
    selectedRoute: null,
    isActive: false,
  });
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(loadCheckpoints());

  // Compute routes for all 4 accessibility modes (memoized)
  const routes = useMemo<RouteOption[]>(() => {
    const modes: AccessibilityMode[] = [
      AccessibilityMode.Standard,
      AccessibilityMode.Wheelchair,
      AccessibilityMode.VisualImpairment,
      AccessibilityMode.Elderly,
    ];
    return modes.reduce<RouteOption[]>((acc, mode) => {
      const adj = buildAdjacency(VENUE_EDGES, mode);
      const path = dijkstra(adj, session.fromNodeId, session.toNodeId);
      if (!path) return acc;
      const totalDist = path.slice(1).reduce((sum, nodeId, idx) => {
        const fromId = path[idx];
        const edge = VENUE_EDGES.find(
          (e) => (e.from === fromId && e.to === nodeId) || (e.to === fromId && e.from === nodeId)
        );
        return sum + (edge?.distanceMeters ?? 0);
      }, 0);
      const elevatorRequired = path.some((n) => {
        const node = VENUE_NODES.find((v) => v.id === n);
        return node?.hasElevator ?? false;
      });
      const restAreaCount = path.filter((n) => {
        const node = VENUE_NODES.find((v) => v.id === n);
        return node?.isRestArea ?? false;
      }).length;
      acc.push({
        mode,
        waypoints: path,
        totalDistanceMeters: totalDist,
        estimatedMinutes: estimateMinutes(totalDist, mode),
        elevatorRequired,
        restAreaCount,
      });
      return acc;
    }, []);
  }, [session.fromNodeId, session.toNodeId]);

  const setFrom = useCallback((nodeId: string) => {
    setSession((s) => ({ ...s, fromNodeId: nodeId, selectedRoute: null, isActive: false }));
  }, []);

  const setTo = useCallback((nodeId: string) => {
    setSession((s) => ({ ...s, toNodeId: nodeId, selectedRoute: null, isActive: false }));
  }, []);

  const setMode = useCallback((mode: AccessibilityMode) => {
    setSession((s) => ({ ...s, activeMode: mode }));
  }, []);

  const startNavigation = useCallback(() => {
    const selected = routes.find((r) => r.mode === session.activeMode) ?? routes[0] ?? null;
    setSession((s) => ({ ...s, selectedRoute: selected, isActive: true }));
  }, [routes, session.activeMode]);

  const endNavigation = useCallback(() => {
    setSession((s) => ({ ...s, selectedRoute: null, isActive: false }));
  }, []);

  const addCheckpoint = useCallback((label: string, nodeId: string) => {
    const cp: Checkpoint = { id: `cp-${Date.now()}`, label, nodeId, timestamp: Date.now() };
    setCheckpoints((prev) => {
      const updated = [...prev, cp];
      saveCheckpoints(updated);
      return updated;
    });
  }, []);

  const deleteCheckpoint = useCallback((id: string) => {
    setCheckpoints((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCheckpoints(updated);
      return updated;
    });
  }, []);

  const clearCheckpointsFn = useCallback(() => {
    setCheckpoints([]);
    saveCheckpoints([]);
  }, []);

  return {
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
    clearCheckpoints: clearCheckpointsFn,
  };
}
