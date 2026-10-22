// ============================================================
// src/test/event.test.ts
// Unit tests for Event Planning Compute Engine (lib/eventCompute.ts)
// Budget calculations, category allocations, date math, milestones,
// vendor checklist progress, sustainability scoring, and layout algorithms
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  validateMonetaryAmount,
  computeBudgetSummary,
  computeCategoryAllocations,
  validateIsoDate,
  calculateDaysRemaining,
  shiftIsoDate,
  generateDefaultMilestones,
  computeChecklistProgress,
  generateDefaultVendorChecklist,
  computeEventSustainabilityScore,
  dijkstra,
} from '@/lib/eventCompute';
import {
  EventType,
  BudgetCategory,
  BudgetItem,
  VendorChecklistItem,
  VendorStatus,
  TaskPriority,
} from '@/types';

// ── 1. Monetary Amount Validation ─────────────────────────────
describe('validateMonetaryAmount', () => {
  it('accepts zero as a valid amount', () => {
    expect(validateMonetaryAmount(0)).toBe(true);
  });

  it('accepts positive finite numbers', () => {
    expect(validateMonetaryAmount(1500.5)).toBe(true);
    expect(validateMonetaryAmount(50000)).toBe(true);
  });

  it('rejects negative numbers', () => {
    expect(validateMonetaryAmount(-10)).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(validateMonetaryAmount(NaN)).toBe(false);
    expect(validateMonetaryAmount(Infinity)).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(validateMonetaryAmount('100')).toBe(false);
    expect(validateMonetaryAmount(null)).toBe(false);
  });

  it('rejects amounts above the safety threshold (100M)', () => {
    expect(validateMonetaryAmount(100_000_001)).toBe(false);
  });
});

// ── 2. Budget Summary Computations ────────────────────────────
describe('computeBudgetSummary', () => {
  const mockItems: BudgetItem[] = [
    { id: '1', eventId: 'e1', category: BudgetCategory.Venue, name: 'Hall', estimatedCost: 5000, actualCost: 4800, paid: true },
    { id: '2', eventId: 'e1', category: BudgetCategory.Catering, name: 'Dinner', estimatedCost: 3000, actualCost: 3200, paid: false },
    { id: '3', eventId: 'e1', category: BudgetCategory.Photography, name: 'Photos', estimatedCost: 2000, actualCost: 0, paid: false },
  ];

  it('calculates total estimated and actual amounts accurately', () => {
    const summary = computeBudgetSummary(15000, mockItems, 10);
    expect(summary.totalBudget).toBe(15000);
    expect(summary.totalEstimated).toBe(10000);
    expect(summary.totalActual).toBe(8000);
  });

  it('computes correct remaining budget based on actual spending', () => {
    const summary = computeBudgetSummary(15000, mockItems, 10);
    expect(summary.remainingBudget).toBe(7000);
  });

  it('calculates 10% contingency reserve accurately', () => {
    const summary = computeBudgetSummary(20000, [], 10);
    expect(summary.contingencyAmount).toBe(2000);
  });

  it('detects budget overruns when actual spending exceeds total budget', () => {
    const overItems: BudgetItem[] = [
      { id: '1', eventId: 'e1', category: BudgetCategory.Venue, name: 'Hall', estimatedCost: 10000, actualCost: 12000, paid: true },
    ];
    const summary = computeBudgetSummary(10000, overItems);
    expect(summary.isOverBudget).toBe(true);
  });

  it('flags overrun when estimated total exceeds total budget even if actual is low', () => {
    const overEstItems: BudgetItem[] = [
      { id: '1', eventId: 'e1', category: BudgetCategory.Venue, name: 'Hall', estimatedCost: 15000, actualCost: 2000, paid: false },
    ];
    const summary = computeBudgetSummary(10000, overEstItems);
    expect(summary.isOverBudget).toBe(true);
  });

  it('returns 0 utilization for zero budget without dividing by zero', () => {
    const summary = computeBudgetSummary(0, []);
    expect(summary.utilizationPercent).toBe(0);
  });

  it('throws RangeError for invalid negative budget', () => {
    expect(() => computeBudgetSummary(-500, [])).toThrow(RangeError);
  });

  it('throws TypeError if items is not an array', () => {
    expect(() => computeBudgetSummary(1000, null as unknown as BudgetItem[])).toThrow(TypeError);
  });
});

// ── 3. Category Allocations ───────────────────────────────────
describe('computeCategoryAllocations', () => {
  it('allocates wedding budget with venue and catering prioritized', () => {
    const alloc = computeCategoryAllocations(EventType.Wedding, 10000);
    expect(alloc[BudgetCategory.Venue]).toBe(3500);
    expect(alloc[BudgetCategory.Catering]).toBe(2500);
    expect(alloc[BudgetCategory.Photography]).toBe(1200);
  });

  it('allocates birthday budget with catering and venue prioritized', () => {
    const alloc = computeCategoryAllocations(EventType.Birthday, 10000);
    expect(alloc[BudgetCategory.Catering]).toBe(3000);
    expect(alloc[BudgetCategory.Venue]).toBe(2500);
    expect(alloc[BudgetCategory.Decoration]).toBe(1500);
  });

  it('allocates community event budget with equipment and venue prioritized', () => {
    const alloc = computeCategoryAllocations(EventType.Community, 10000);
    expect(alloc[BudgetCategory.Equipment]).toBe(2500);
    expect(alloc[BudgetCategory.Venue]).toBe(2000);
    expect(alloc[BudgetCategory.Catering]).toBe(2000);
  });

  it('throws RangeError if totalBudget is negative', () => {
    expect(() => computeCategoryAllocations(EventType.Wedding, -1)).toThrow(RangeError);
  });
});

// ── 4. ISO Date Math & Days Remaining ─────────────────────────
describe('Date Math Functions', () => {
  it('validates correct YYYY-MM-DD date format', () => {
    expect(validateIsoDate('2026-09-18')).toBe(true);
    expect(validateIsoDate('2026-02-28')).toBe(true);
  });

  it('rejects invalid date formats', () => {
    expect(validateIsoDate('09-18-2026')).toBe(false);
    expect(validateIsoDate('2026/09/18')).toBe(false);
    expect(validateIsoDate('invalid-date')).toBe(false);
    expect(validateIsoDate('2026-02-31')).toBe(false);
  });

  it('calculates days remaining until target date', () => {
    const days = calculateDaysRemaining('2026-10-25', '2026-10-20');
    expect(days).toBe(5);
  });

  it('returns 0 when target date is the reference date', () => {
    const days = calculateDaysRemaining('2026-10-20', '2026-10-20');
    expect(days).toBe(0);
  });

  it('returns negative days for past events', () => {
    const days = calculateDaysRemaining('2026-10-15', '2026-10-20');
    expect(days).toBe(-5);
  });

  it('shifts ISO date accurately across months', () => {
    expect(shiftIsoDate('2026-05-30', 2)).toBe('2026-06-01');
    expect(shiftIsoDate('2026-06-01', -2)).toBe('2026-05-30');
  });

  it('throws RangeError when shifting an invalid date', () => {
    expect(() => shiftIsoDate('invalid', 5)).toThrow(RangeError);
  });
});

// ── 5. Default Milestones Generation ──────────────────────────
describe('generateDefaultMilestones', () => {
  it('generates milestone tasks for wedding event', () => {
    const milestones = generateDefaultMilestones('2026-12-01', EventType.Wedding);
    expect(milestones.length).toBeGreaterThanOrEqual(6);
    expect(milestones[0].title).toContain('Budget');
  });

  it('generates milestone tasks for birthday event', () => {
    const milestones = generateDefaultMilestones('2026-12-01', EventType.Birthday);
    expect(milestones.length).toBeGreaterThanOrEqual(5);
    const titles = milestones.map((m) => m.title).join(' ');
    expect(titles).toContain('Cake');
  });

  it('generates milestone tasks for community event', () => {
    const milestones = generateDefaultMilestones('2026-12-01', EventType.Community);
    expect(milestones.length).toBeGreaterThanOrEqual(5);
    const titles = milestones.map((m) => m.title).join(' ');
    expect(titles).toContain('Permits');
  });

  it('throws RangeError if target date is invalid', () => {
    expect(() => generateDefaultMilestones('bad-date', EventType.Wedding)).toThrow(RangeError);
  });
});

// ── 6. Vendor Checklist Progress ──────────────────────────────
describe('computeChecklistProgress', () => {
  const items: VendorChecklistItem[] = [
    { id: '1', eventId: 'e1', category: BudgetCategory.Venue, name: 'Hall', description: 'desc', priority: TaskPriority.Urgent, status: VendorStatus.Completed, estimatedCost: 3000 },
    { id: '2', eventId: 'e1', category: BudgetCategory.Catering, name: 'Food', description: 'desc', priority: TaskPriority.High, status: VendorStatus.Confirmed, estimatedCost: 2000 },
    { id: '3', eventId: 'e1', category: BudgetCategory.Photography, name: 'Photo', description: 'desc', priority: TaskPriority.Medium, status: VendorStatus.Contacted, estimatedCost: 1500 },
    { id: '4', eventId: 'e1', category: BudgetCategory.Decoration, name: 'Decor', description: 'desc', priority: TaskPriority.Low, status: VendorStatus.NotStarted, estimatedCost: 800 },
  ];

  it('counts vendor item statuses correctly', () => {
    const prog = computeChecklistProgress(items);
    expect(prog.total).toBe(4);
    expect(prog.completed).toBe(1);
    expect(prog.confirmed).toBe(1);
    expect(prog.contacted).toBe(1);
    expect(prog.notStarted).toBe(1);
    expect(prog.completionPercent).toBe(25);
  });

  it('returns 0 percent for empty checklist', () => {
    const prog = computeChecklistProgress([]);
    expect(prog.total).toBe(0);
    expect(prog.completionPercent).toBe(0);
  });
});

// ── 7. Default Vendor Checklist Generation ────────────────────
describe('generateDefaultVendorChecklist', () => {
  it('generates vendor checklist for wedding', () => {
    const list = generateDefaultVendorChecklist(EventType.Wedding, 'test-w1');
    expect(list.length).toBeGreaterThanOrEqual(5);
    const names = list.map((i) => i.name).join(' ');
    expect(names).toContain('Ceremony');
    expect(names).toContain('Photographer');
  });

  it('generates vendor checklist for birthday', () => {
    const list = generateDefaultVendorChecklist(EventType.Birthday, 'test-b1');
    expect(list.length).toBeGreaterThanOrEqual(4);
    const names = list.map((i) => i.name).join(' ');
    expect(names).toContain('Cake');
  });

  it('generates vendor checklist for community event', () => {
    const list = generateDefaultVendorChecklist(EventType.Community, 'test-c1');
    expect(list.length).toBeGreaterThanOrEqual(4);
    const names = list.map((i) => i.name).join(' ');
    expect(names).toContain('Park');
  });
});

// ── 7. Sustainability Scoring ─────────────────────────────────
describe('computeEventSustainabilityScore', () => {
  it('computes top score for 100% local, zero-waste, digital, transit event', () => {
    const score = computeEventSustainabilityScore({
      localVendorPercent: 100,
      wasteDiversionPercent: 100,
      digitalInvites: true,
      publicTransitAccessible: true,
      leftoverFoodDonationPlanned: true,
    });
    expect(score).toBe(100);
  });

  it('computes low score for non-sustainable event', () => {
    const score = computeEventSustainabilityScore({
      localVendorPercent: 0,
      wasteDiversionPercent: 0,
      digitalInvites: false,
      publicTransitAccessible: false,
      leftoverFoodDonationPlanned: false,
    });
    expect(score).toBeLessThan(15);
  });
});

// ── 8. Dijkstra Graph / Layout Algorithm ──────────────────────
describe('dijkstra layout routing', () => {
  const adj = {
    entrance: [{ to: 'lobby', weight: 10 }],
    lobby: [
      { to: 'entrance', weight: 10 },
      { to: 'ballroom', weight: 20 },
      { to: 'garden', weight: 15 },
    ],
    ballroom: [
      { to: 'lobby', weight: 20 },
      { to: 'dining', weight: 10 },
    ],
    garden: [
      { to: 'lobby', weight: 15 },
      { to: 'dining', weight: 25 },
    ],
    dining: [
      { to: 'ballroom', weight: 10 },
      { to: 'garden', weight: 25 },
    ],
    isolated: [] as Array<{ to: string; weight: number }>,
  };

  it('finds shortest path from entrance to dining via ballroom', () => {
    const path = dijkstra(adj, 'entrance', 'dining');
    expect(path).toEqual(['entrance', 'lobby', 'ballroom', 'dining']);
  });

  it('returns single node path when start equals end', () => {
    expect(dijkstra(adj, 'lobby', 'lobby')).toEqual(['lobby']);
  });

  it('returns null for unreachable nodes', () => {
    expect(dijkstra(adj, 'entrance', 'isolated')).toBeNull();
  });
});
