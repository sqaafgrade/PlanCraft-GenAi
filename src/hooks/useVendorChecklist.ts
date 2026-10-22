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

export interface UseVendorChecklistReturn {
  items: VendorChecklistItem[];
  progress: ChecklistProgress;
  addItem: (item: Omit<VendorChecklistItem, 'id' | 'eventId'>) => void;
  updateStatus: (id: string, status: VendorStatus) => void;
  updateItem: (id: string, updates: Partial<VendorChecklistItem>) => void;
  deleteItem: (id: string) => void;
  regenerateDefaults: (eventType: EventType) => void;
}

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
