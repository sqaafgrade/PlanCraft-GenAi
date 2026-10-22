// ============================================================
// src/hooks/useEventBudget.ts
// Structured event budget management, computations, and persistence
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { BudgetItem, BudgetCategory, BudgetSummary, EventType } from '@/types';
import {
  computeBudgetSummary,
  computeCategoryAllocations,
} from '@/lib/eventCompute';
import { loadEventBudget, saveEventBudget } from '@/services/storageService';

/**
 * Return interface for the useEventBudget hook.
 */
export interface UseEventBudgetReturn {
  /** Array of itemized budget expense items */
  items: BudgetItem[];
  /** Computed budget summary metrics and overrun status */
  summary: BudgetSummary;
  /** Appends a new budget line item */
  addItem: (item: Omit<BudgetItem, 'id' | 'eventId'>) => void;
  /** Modifies an existing line item by ID */
  updateItem: (id: string, updates: Partial<BudgetItem>) => void;
  /** Deletes an expense item by ID */
  deleteItem: (id: string) => void;
  /** Resets items to standard event category allocation benchmarks */
  applyDefaultAllocations: (eventType: EventType, totalBudget: number) => void;
}

/**
 * Custom React hook for tracking event budgets, expense line items, and overrun alerts.
 *
 * @param eventId - The unique event ID
 * @param totalBudget - The total budget ceiling
 * @param eventType - The classification of the event
 * @returns Budget items, computed totals, and mutation handlers
 */
export function useEventBudget(
  eventId: string,
  totalBudget: number,
  eventType: EventType = EventType.Wedding
): UseEventBudgetReturn {
  const [items, setItems] = useState<BudgetItem[]>(() => {
    const loaded = loadEventBudget(eventId);
    if (loaded && loaded.length > 0) return loaded;

    // Generate initial items from default category allocations
    const allocations = computeCategoryAllocations(eventType, totalBudget);
    const initialItems: BudgetItem[] = [];
    let idx = 1;
    for (const [cat, amt] of Object.entries(allocations)) {
      if (amt > 0) {
        initialItems.push({
          id: `${eventId}-bgt-${idx++}`,
          eventId,
          category: cat as BudgetCategory,
          name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Allocation`,
          estimatedCost: amt,
          actualCost: 0,
          paid: false,
        });
      }
    }
    return initialItems;
  });

  // Sync to local storage on change
  useEffect(() => {
    saveEventBudget(eventId, items);
  }, [eventId, items]);

  // Memoized budget summary calculation
  const summary = useMemo<BudgetSummary>(() => {
    return computeBudgetSummary(totalBudget, items, 10);
  }, [totalBudget, items]);

  const addItem = useCallback(
    (item: Omit<BudgetItem, 'id' | 'eventId'>) => {
      const newItem: BudgetItem = {
        ...item,
        id: `${eventId}-bgt-${Date.now()}`,
        eventId,
      };
      setItems((prev) => [...prev, newItem]);
    },
    [eventId]
  );

  const updateItem = useCallback((id: string, updates: Partial<BudgetItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const applyDefaultAllocations = useCallback(
    (type: EventType, budget: number) => {
      const allocations = computeCategoryAllocations(type, budget);
      const newItems: BudgetItem[] = [];
      let idx = 1;
      for (const [cat, amt] of Object.entries(allocations)) {
        if (amt > 0) {
          newItems.push({
            id: `${eventId}-bgt-${idx++}`,
            eventId,
            category: cat as BudgetCategory,
            name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Allocation`,
            estimatedCost: amt,
            actualCost: 0,
            paid: false,
          });
        }
      }
      setItems(newItems);
    },
    [eventId]
  );

  return { items, summary, addItem, updateItem, deleteItem, applyDefaultAllocations };
}
