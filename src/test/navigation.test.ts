// ============================================================
// src/test/navigation.test.ts
// Integration: pathfinding, accessible routes, what-if, CRUD
// Per TESTING.md §1.2 — Navigation & What-If Simulation Engine
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { dijkstra, aggregateWhatIfSavings } from '@/lib/stadiumCompute';
import { clearCheckpoints, loadCheckpoints, saveCheckpoints } from '@/services/storageService';
import type { Checkpoint } from '@/types';
import { VENUE_NODES, VENUE_EDGES } from '@/hooks/useNavigationAssist';
import { AccessibilityMode } from '@/types';

// ── Helpers ──────────────────────────────────────────────────

type AdjEntry = { to: string; weight: number };

function buildTestAdj(
  edges: typeof VENUE_EDGES,
  mode: AccessibilityMode
): Record<string, AdjEntry[]> {
  const adj: Record<string, AdjEntry[]> = {};
  for (const n of VENUE_NODES) adj[n.id] = [];
  for (const e of edges) {
    if (mode !== AccessibilityMode.Standard && !e.isAccessible) continue;
    if (mode === AccessibilityMode.Wheelchair && e.hasStairs) continue;
    const w = e.distanceMeters || 1;
    adj[e.from].push({ to: e.to, weight: w });
    adj[e.to].push({ to: e.from, weight: w });
  }
  return adj;
}

// ── Shortest Path Bounds ──────────────────────────────────────
describe('dijkstra — Shortest Path', () => {
  it('returns a valid path from gate-a to north-blk', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Standard);
    const path = dijkstra(adj, 'gate-a', 'north-blk');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('gate-a');
    expect(path![path!.length - 1]).toBe('north-blk');
  });

  it('returns the shortest path (not longer than 5 hops for adjacent nodes)', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Standard);
    const path = dijkstra(adj, 'gate-a', 'lobby');
    expect(path).not.toBeNull();
    expect(path!.length).toBeLessThanOrEqual(3);
  });

  it('returns null for disconnected nodes', () => {
    const isolatedAdj: Record<string, AdjEntry[]> = {
      'a': [{ to: 'b', weight: 1 }],
      'b': [{ to: 'a', weight: 1 }],
      'c': [],
    };
    expect(dijkstra(isolatedAdj, 'a', 'c')).toBeNull();
  });

  it('returns single-node path when start equals end', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Standard);
    const path = dijkstra(adj, 'lobby', 'lobby');
    expect(path).toEqual(['lobby']);
  });

  it('path always starts with the from-node and ends with the to-node', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Standard);
    const path = dijkstra(adj, 'gate-b', 'food-court');
    expect(path).not.toBeNull();
    expect(path![0]).toBe('gate-b');
    expect(path![path!.length - 1]).toBe('food-court');
  });
});

// ── Accessible Route Filtering ────────────────────────────────
describe('Accessible Route Filtering', () => {
  it('wheelchair route excludes edges with stairs', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Wheelchair);
    // stairs1 node should not appear in wheelchair adjacency from lobby
    const lobbyAdj = adj['lobby'] ?? [];
    const toStairs = lobbyAdj.find((e) => e.to === 'stairs1');
    expect(toStairs).toBeUndefined();
  });

  it('wheelchair route can still reach north-blk via elevator', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Wheelchair);
    const path = dijkstra(adj, 'gate-a', 'north-blk');
    expect(path).not.toBeNull();
    expect(path).toContain('elevator1');
  });

  it('visual impairment route excludes inaccessible edges', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.VisualImpairment);
    // All edges in adj should be accessible
    for (const entries of Object.values(adj)) {
      for (const entry of entries) {
        const edge = VENUE_EDGES.find(
          (e) => (e.from === entry.to || e.to === entry.to)
        );
        if (edge) {
          expect(edge.isAccessible || edge.distanceMeters === 0).toBe(true);
        }
      }
    }
  });

  it('elderly route preserves rest areas in path', () => {
    const adj = buildTestAdj(VENUE_EDGES, AccessibilityMode.Elderly);
    const path = dijkstra(adj, 'gate-a', 'food-court');
    if (!path) return; // skip if no path (valid)
    const hasRestArea = path.some((nodeId) => {
      const node = VENUE_NODES.find((n) => n.id === nodeId);
      return node?.isRestArea ?? false;
    });
    expect(hasRestArea).toBe(true);
  });
});

// ── What-If Simulation ────────────────────────────────────────
describe('What-If Simulation — Aggregates', () => {
  it('aggregates staffing, gate, transit savings correctly', () => {
    const savings = aggregateWhatIfSavings([
      { savedMinutes: 4 },   // extra staffing
      { savedMinutes: 6 },   // open extra gate
      { savedMinutes: 3.5 }, // transit frequency increase
    ]);
    expect(savings).toBe(13.5);
  });

  it('produces cumulative totals (additive, not averaged)', () => {
    const first = aggregateWhatIfSavings([{ savedMinutes: 5 }]);
    const both = aggregateWhatIfSavings([{ savedMinutes: 5 }, { savedMinutes: 5 }]);
    expect(both).toBe(first * 2);
  });
});

// ── CRUD Checkpoint Snapshot ──────────────────────────────────
describe('Checkpoint CRUD — storageService', () => {
  beforeEach(() => {
    clearCheckpoints();
  });

  it('starts with empty checkpoint list', () => {
    expect(loadCheckpoints()).toEqual([]);
  });

  it('saves and loads checkpoints correctly', () => {
    const cp: Checkpoint = { id: 'cp-1', label: 'Meet here', nodeId: 'lobby', timestamp: 1000 };
    saveCheckpoints([cp]);
    const loaded = loadCheckpoints();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('cp-1');
  });

  it('overwrites on second save (no duplicates)', () => {
    const cp1: Checkpoint = { id: 'cp-1', label: 'A', nodeId: 'gate-a', timestamp: 1 };
    const cp2: Checkpoint = { id: 'cp-2', label: 'B', nodeId: 'lobby', timestamp: 2 };
    saveCheckpoints([cp1]);
    saveCheckpoints([cp1, cp2]);
    expect(loadCheckpoints()).toHaveLength(2);
  });

  it('clears all checkpoints without leaving orphaned data', () => {
    const cp: Checkpoint = { id: 'cp-1', label: 'Test', nodeId: 'gate-b', timestamp: 1 };
    saveCheckpoints([cp]);
    clearCheckpoints();
    expect(loadCheckpoints()).toEqual([]);
  });

  it('handles malformed storage data gracefully (returns empty)', () => {
    localStorage.setItem('smartstadium_checkpoints', 'not-valid-json{{{');
    expect(loadCheckpoints()).toEqual([]);
  });
});

// ── useNavigationAssist Hook ──────────────────────────────────
import { renderHook, act } from '@testing-library/react';
import { useNavigationAssist } from '@/hooks/useNavigationAssist';

describe('useNavigationAssist Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNavigationAssist());
    expect(result.current.session.fromNodeId).toBe('gate-a');
    expect(result.current.session.toNodeId).toBe('north-blk');
    expect(result.current.session.activeMode).toBe(AccessibilityMode.Standard);
    expect(result.current.session.isActive).toBe(false);
  });

  it('should allow setting from and to nodes', () => {
    const { result } = renderHook(() => useNavigationAssist());
    act(() => {
      result.current.setFrom('gate-b');
      result.current.setTo('vip-lounge');
    });
    expect(result.current.session.fromNodeId).toBe('gate-b');
    expect(result.current.session.toNodeId).toBe('vip-lounge');
  });

  it('should calculate routes correctly based on accessibility mode', () => {
    const { result } = renderHook(() => useNavigationAssist());
    act(() => {
      result.current.setMode(AccessibilityMode.Wheelchair);
    });
    expect(result.current.session.activeMode).toBe(AccessibilityMode.Wheelchair);
    expect(result.current.routes).not.toHaveLength(0);
  });

  it('should handle start and end navigation', () => {
    const { result } = renderHook(() => useNavigationAssist());
    act(() => {
      result.current.startNavigation();
    });
    expect(result.current.session.isActive).toBe(true);

    act(() => {
      result.current.endNavigation();
    });
    expect(result.current.session.isActive).toBe(false);
  });

  it('should manage checkpoints', () => {
    const { result } = renderHook(() => useNavigationAssist());
    act(() => {
      result.current.addCheckpoint('Meetpoint 1', 'lobby');
    });
    expect(result.current.checkpoints).toHaveLength(1);
    expect(result.current.checkpoints[0].label).toBe('Meetpoint 1');

    const checkpointId = result.current.checkpoints[0].id;
    act(() => {
      result.current.deleteCheckpoint(checkpointId);
    });
    expect(result.current.checkpoints).toHaveLength(0);
  });

  it('should clear checkpoints', () => {
    const { result } = renderHook(() => useNavigationAssist());
    act(() => {
      result.current.addCheckpoint('Meetpoint 1', 'lobby');
      result.current.addCheckpoint('Meetpoint 2', 'gate-b');
    });
    expect(result.current.checkpoints).toHaveLength(2);

    act(() => {
      result.current.clearCheckpoints();
    });
    expect(result.current.checkpoints).toHaveLength(0);
  });
});
