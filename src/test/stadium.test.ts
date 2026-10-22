// ============================================================
// src/test/stadium.test.ts
// Unit tests: crowd density, flow rate, wait time, sustainability
// Per TESTING.md §1.1 — Crowd & Sustainability Formulas
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeDensityLevel,
  computeDensityPercent,
  computeFlowRate,
  computeWaitTime,
  computeSustainabilityScore,
  aggregateWhatIfSavings,
  scoreTransportOption,
} from '@/lib/stadiumCompute';
import { DensityLevel } from '@/types';

// ── Density Level ────────────────────────────────────────────
describe('computeDensityLevel', () => {
  it('returns Low when occupancy is below 50%', () => {
    expect(computeDensityLevel(4000, 10000)).toBe(DensityLevel.Low);
  });

  it('returns Moderate when occupancy is 50–69%', () => {
    expect(computeDensityLevel(6000, 10000)).toBe(DensityLevel.Moderate);
  });

  it('returns High when occupancy is 70–84%', () => {
    expect(computeDensityLevel(8000, 10000)).toBe(DensityLevel.High);
  });

  it('returns Critical when occupancy is 85–94%', () => {
    expect(computeDensityLevel(9000, 10000)).toBe(DensityLevel.Critical);
  });

  it('returns Emergency when occupancy is >= 95%', () => {
    expect(computeDensityLevel(9600, 10000)).toBe(DensityLevel.Emergency);
  });

  it('throws RangeError if capacity <= 0', () => {
    expect(() => computeDensityLevel(100, 0)).toThrow(RangeError);
  });

  it('throws RangeError if occupancy < 0', () => {
    expect(() => computeDensityLevel(-1, 1000)).toThrow(RangeError);
  });
});

// ── Density Percent ──────────────────────────────────────────
describe('computeDensityPercent', () => {
  it('returns correct percent for partial fill', () => {
    expect(computeDensityPercent(5000, 10000)).toBe(50);
  });

  it('caps at 100 when over capacity', () => {
    expect(computeDensityPercent(12000, 10000)).toBe(100);
  });

  it('returns 0 for empty zone', () => {
    expect(computeDensityPercent(0, 10000)).toBe(0);
  });
});

// ── Flow Rate ─────────────────────────────────────────────────
describe('computeFlowRate', () => {
  it('returns positive flow when ingress > egress', () => {
    const rate = computeFlowRate(300, 100, 1);
    expect(rate).toBe(200);
  });

  it('returns negative flow when egress > ingress', () => {
    const rate = computeFlowRate(50, 150, 1);
    expect(rate).toBe(-100);
  });

  it('returns 0 when ingress equals egress', () => {
    expect(computeFlowRate(200, 200, 1)).toBe(0);
  });

  it('throws RangeError if windowMinutes <= 0', () => {
    expect(() => computeFlowRate(100, 50, 0)).toThrow(RangeError);
  });
});

// ── Wait Time ────────────────────────────────────────────────
describe('computeWaitTime', () => {
  it('computes correct wait time', () => {
    // queue=120, rate=40 → 3 min
    expect(computeWaitTime(120, 40)).toBe(3);
  });

  it('returns 0 for empty queue', () => {
    expect(computeWaitTime(0, 50)).toBe(0);
  });

  it('throws RangeError for serviceRate <= 0', () => {
    expect(() => computeWaitTime(100, 0)).toThrow(RangeError);
  });

  it('throws RangeError for negative queue length', () => {
    expect(() => computeWaitTime(-1, 10)).toThrow(RangeError);
  });
});

// ── Sustainability Score ─────────────────────────────────────
describe('computeSustainabilityScore', () => {
  it('returns 100 for perfect sustainability', () => {
    // 100% waste diversion, zero energy, zero water
    const score = computeSustainabilityScore(100, 0, 30000, 0, 80000);
    expect(score).toBe(100);
  });

  it('returns 0 for worst case', () => {
    const score = computeSustainabilityScore(0, 30000, 30000, 80000, 80000);
    expect(score).toBe(0);
  });

  it('uses correct weighted average (40/35/25)', () => {
    // waste=80, energy=60%, water=40% savings
    const score = computeSustainabilityScore(80, 12000, 30000, 48000, 80000);
    // wasteScore=80, energyScore=(1-0.4)*100=60, waterScore=(1-0.6)*100=40
    // 80*0.4 + 60*0.35 + 40*0.25 = 32 + 21 + 10 = 63
    expect(score).toBeCloseTo(63, 0);
  });

  it('throws RangeError for zero energy capacity', () => {
    expect(() => computeSustainabilityScore(50, 1000, 0, 1000, 10000)).toThrow(RangeError);
  });

  it('throws RangeError for zero water capacity', () => {
    expect(() => computeSustainabilityScore(50, 1000, 10000, 1000, 0)).toThrow(RangeError);
  });
});

// ── Transport Scoring ────────────────────────────────────────
describe('scoreTransportOption', () => {
  it('returns raw arrival time with no surge', () => {
    expect(scoreTransportOption(5)).toBe(5);
  });

  it('applies surge multiplier correctly', () => {
    expect(scoreTransportOption(5, 1.8)).toBeCloseTo(9, 1);
  });
});

// ── What-If Simulation ───────────────────────────────────────
describe('aggregateWhatIfSavings', () => {
  it('sums savings additively', () => {
    const result = aggregateWhatIfSavings([
      { savedMinutes: 3 },
      { savedMinutes: 5 },
      { savedMinutes: 2.5 },
    ]);
    expect(result).toBe(10.5);
  });

  it('returns 0 for empty array', () => {
    expect(aggregateWhatIfSavings([])).toBe(0);
  });

  it('handles single intervention', () => {
    expect(aggregateWhatIfSavings([{ savedMinutes: 7.25 }])).toBe(7.25);
  });
});
