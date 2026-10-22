// ============================================================
// src/lib/stadiumCompute.ts
// Pure math functions — no side effects, fully unit-testable
// Per CODE_QUALITY.md §1.2 — separation of concerns
// Per EFFICIENCY.md §2 — used inside useMemo
// ============================================================

import { DensityLevel } from '@/types';

// ----- Crowd Density -----

/**
 * Maps raw occupancy to a DensityLevel enum.
 * Thresholds: <50% Low, <70% Moderate, <85% High, <95% Critical, ≥95% Emergency
 */
export function computeDensityLevel(occupancy: number, capacity: number): DensityLevel {
  if (capacity <= 0) throw new RangeError('capacity must be > 0');
  if (occupancy < 0) throw new RangeError('occupancy must be >= 0');
  const ratio = occupancy / capacity;
  if (ratio < 0.5) return DensityLevel.Low;
  if (ratio < 0.7) return DensityLevel.Moderate;
  if (ratio < 0.85) return DensityLevel.High;
  if (ratio < 0.95) return DensityLevel.Critical;
  return DensityLevel.Emergency;
}

/**
 * Returns occupancy as a percent of capacity (0–100), capped at 100.
 */
export function computeDensityPercent(occupancy: number, capacity: number): number {
  if (capacity <= 0) throw new RangeError('capacity must be > 0');
  return Math.min(100, Math.round((occupancy / capacity) * 100));
}

/**
 * Computes net flow rate = (ingress - egress) per windowMinutes, normalised to per-minute.
 * Positive = net filling, Negative = net emptying.
 */
export function computeFlowRate(
  ingressRate: number,
  egressRate: number,
  windowMinutes: number
): number {
  if (windowMinutes <= 0) throw new RangeError('windowMinutes must be > 0');
  return parseFloat(((ingressRate - egressRate) * windowMinutes).toFixed(2));
}

/**
 * Estimates wait time in minutes using a simple M/D/1 queue model.
 * waitTime = queueLength / serviceRate
 */
export function computeWaitTime(queueLength: number, serviceRate: number): number {
  if (serviceRate <= 0) throw new RangeError('serviceRate must be > 0');
  if (queueLength < 0) throw new RangeError('queueLength must be >= 0');
  return parseFloat((queueLength / serviceRate).toFixed(2));
}

// ----- Sustainability -----

/**
 * Composite green score (0–100) from three normalised sub-metrics.
 * wasteDiversionPercent: 0–100
 * energyUsageKwh / energyCapacityKwh: usage ratio (lower = better)
 * waterUsageLitres / waterCapacityLitres: usage ratio (lower = better)
 */
export function computeSustainabilityScore(
  wasteDiversionPercent: number,
  energyUsageKwh: number,
  energyCapacityKwh: number,
  waterUsageLitres: number,
  waterCapacityLitres: number
): number {
  if (energyCapacityKwh <= 0) throw new RangeError('energyCapacityKwh must be > 0');
  if (waterCapacityLitres <= 0) throw new RangeError('waterCapacityLitres must be > 0');

  const wasteScore = Math.min(100, Math.max(0, wasteDiversionPercent));
  const energyScore = Math.min(100, Math.max(0, (1 - energyUsageKwh / energyCapacityKwh) * 100));
  const waterScore = Math.min(100, Math.max(0, (1 - waterUsageLitres / waterCapacityLitres) * 100));

  // Weighted average: waste 40%, energy 35%, water 25%
  const composite = wasteScore * 0.4 + energyScore * 0.35 + waterScore * 0.25;
  return parseFloat(composite.toFixed(1));
}

// ----- Navigation Helpers -----

/**
 * Dijkstra shortest-path on an adjacency map.
 * adjacency: { nodeId -> [{ to, weight }] }
 * Returns ordered list of node IDs or null if no path.
 */
export interface AdjacencyEntry {
  to: string;
  weight: number;
}

export function dijkstra(
  adjacency: Record<string, AdjacencyEntry[]>,
  start: string,
  end: string
): string[] | null {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of Object.keys(adjacency)) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[start] = 0;

  while (true) {
    // Pick unvisited node with smallest distance
    let u: string | null = null;
    let minDist = Infinity;
    for (const node of Object.keys(dist)) {
      if (!visited.has(node) && dist[node] < minDist) {
        minDist = dist[node];
        u = node;
      }
    }
    if (u === null || u === end) break;
    visited.add(u);

    for (const neighbour of adjacency[u] ?? []) {
      const alt = dist[u] + neighbour.weight;
      if (alt < dist[neighbour.to]) {
        dist[neighbour.to] = alt;
        prev[neighbour.to] = u;
      }
    }
  }

  if (dist[end] === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = end;
  while (current !== null) {
    path.unshift(current);
    current = prev[current] ?? null;
  }
  return path;
}

// ----- Transport -----

/**
 * Scores each transport mode by time-to-arrival + surge penalty.
 * Lower score = more recommended.
 */
export function scoreTransportOption(
  nextArrivalMinutes: number,
  surgeFactor: number = 1
): number {
  return nextArrivalMinutes * surgeFactor;
}

// ----- What-If Simulation -----

/**
 * Aggregates additive wait-time savings from a list of interventions.
 * Each intervention is { savedMinutes: number }.
 */
export function aggregateWhatIfSavings(
  interventions: { savedMinutes: number }[]
): number {
  return parseFloat(
    interventions.reduce((sum, i) => sum + i.savedMinutes, 0).toFixed(2)
  );
}
