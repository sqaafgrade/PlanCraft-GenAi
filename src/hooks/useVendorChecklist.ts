// ============================================================
// src/hooks/useVendorChecklist.ts
// Vendor checklist management, status transitions, and progress
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { VendorChecklistItem, VendorStatus, EventType } from '@/types';
import {
  computeChecklistProgress,
  generateDefaultVendorChecklist,
  ChecklistProgress,
} from '@/lib/eventCompute';
import { loadEventVendors, saveEventVendors } from '@/services/storageService';

/**
 * Return interface for the useVendorChecklist hook.
 */
export interface UseVendorChecklistReturn {
  /** Array of vendor checklist items */
  items: VendorChecklistItem[];
  /** Aggregated checklist progress metrics */
  progress: ChecklistProgress;
  /** Appends a new vendor checklist item */
  addItem: (item: Omit<VendorChecklistItem, 'id' | 'eventId'>) => void;
  /** Updates the lifecycle status of a vendor (e.g. booked, confirmed) */
  updateStatus: (id: string, status: VendorStatus) => void;
  /** Modifies vendor fields by ID */
  updateItem: (id: string, updates: Partial<VendorChecklistItem>) => void;
  /** Removes a vendor item by ID */
  deleteItem: (id: string) => void;
  /** Regenerates default benchmark vendor checklist for the event type */
  regenerateDefaults: (eventType: EventType) => void;
}

/**
 * Custom React hook for tracking event vendors, booking milestones, and contact information.
 *
 * @param eventId - The unique event ID
 * @param eventType - Event category for default vendor suggestions
 * @returns Vendor items, progress metrics, and mutation methods
 */
export function useVendorChecklist(
  eventId: string,
  eventType: EventType = EventType.Wedding
): UseVendorChecklistReturn {
  const [items, setItems] = useState<VendorChecklistItem[]>(() => {
    const loaded = loadEventVendors(eventId);
    if (loaded && loaded.length > 0) return loaded;
    return generateDefaultVendorChecklist(eventType, eventId);
  });

  // Sync to storage
  useEffect(() => {
    saveEventVendors(eventId, items);
  }, [eventId, items]);

  const progress = useMemo<ChecklistProgress>(() => {
    return computeChecklistProgress(items);
  }, [items]);

  const addItem = useCallback(
    (item: Omit<VendorChecklistItem, 'id' | 'eventId'>) => {
      const newItem: VendorChecklistItem = {
        ...item,
        id: `${eventId}-vdr-${Date.now()}`,
        eventId,
      };
      setItems((prev) => [...prev, newItem]);
    },
    [eventId]
  );

  const updateStatus = useCallback((id: string, status: VendorStatus) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status } : it))
    );
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<VendorChecklistItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const regenerateDefaults = useCallback(
    (type: EventType) => {
      const defaults = generateDefaultVendorChecklist(type, eventId);
      setItems(defaults);
    },
    [eventId]
  );

  return {
    items,
    progress,
    addItem,
    updateStatus,
    updateItem,
    deleteItem,
    regenerateDefaults,
  };
}
