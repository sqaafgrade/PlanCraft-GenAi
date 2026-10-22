// ============================================================
// src/services/storageService.ts
// Local persistence for GenAI Event Planning Assistant
// Parse-safe, typed, no any, handles local storage gracefully
// ============================================================

import {
  EventItem,
  BudgetItem,
  TimelineTask,
  VendorChecklistItem,
  DayScheduleItem,
  EventIdea,
  EventSnapshot,
  Checkpoint,
  MatchDaySnapshot,
} from '@/types';

const EVENTS_KEY = 'genai_events';
const ACTIVE_EVENT_KEY = 'genai_active_event_id';
const SNAPSHOTS_KEY = 'genai_event_snapshots';
const LEGACY_SNAPSHOT_KEY = 'smartstadium_snapshots';
const LEGACY_CHECKPOINT_KEY = 'smartstadium_checkpoints';

/**
 * Safely deserializes a JSON string into a typed object with fallback on parse failure.
 *
 * @param raw - The raw JSON string or null
 * @param fallback - The default fallback value if parsing fails or input is null
 * @returns Deserialized object or fallback value
 */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ----- Events Storage -----

/**
 * Persists an array of event records to localStorage.
 *
 * @param events - List of event items to store
 */
export function saveEvents(events: EventItem[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

/**
 * Retrieves stored event items from localStorage.
 *
 * @returns Array of stored event items or empty array
 */
export function loadEvents(): EventItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(EVENTS_KEY) : null;
  return safeParse<EventItem[]>(raw, []);
}

/**
 * Persists the ID of the currently selected active event.
 *
 * @param id - The active event ID, or null to clear
 */
export function saveActiveEventId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_EVENT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_EVENT_KEY);
    }
  } catch (err) {
    console.error('Failed to set active event id:', err);
  }
}

/**
 * Retrieves the currently active event ID from localStorage.
 *
 * @returns Active event ID string or null
 */
export function loadActiveEventId(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_EVENT_KEY) : null;
}

// ----- Event Detail Storage (Per-Event Scoped) -----

/**
 * Computes a namespaced localStorage key scoped to a specific event ID.
 *
 * @param eventId - The unique event identifier
 * @param suffix - The domain suffix (e.g. 'budget', 'timeline', 'vendors')
 * @returns Namespaced storage key string
 */
export function getEventScopedKey(eventId: string, suffix: string): string {
  return `genai_evt_${eventId}_${suffix}`;
}

/**
 * Saves budget line items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @param items - Array of budget line items
 */
export function saveEventBudget(eventId: string, items: BudgetItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'budget'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save budget items:', err);
  }
}

/**
 * Loads budget line items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @returns Array of stored budget items or empty array
 */
export function loadEventBudget(eventId: string): BudgetItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'budget')) : null;
  return safeParse<BudgetItem[]>(raw, []);
}

/**
 * Saves milestone timeline tasks scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @param tasks - Array of timeline tasks
 */
export function saveEventTimeline(eventId: string, tasks: TimelineTask[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'timeline'), JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save timeline tasks:', err);
  }
}

/**
 * Loads milestone timeline tasks scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @returns Array of timeline tasks or empty array
 */
export function loadEventTimeline(eventId: string): TimelineTask[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'timeline')) : null;
  return safeParse<TimelineTask[]>(raw, []);
}

/**
 * Saves vendor checklist items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @param items - Array of vendor checklist items
 */
export function saveEventVendors(eventId: string, items: VendorChecklistItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'vendors'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save vendor checklist items:', err);
  }
}

/**
 * Loads vendor checklist items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @returns Array of vendor checklist items or empty array
 */
export function loadEventVendors(eventId: string): VendorChecklistItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'vendors')) : null;
  return safeParse<VendorChecklistItem[]>(raw, []);
}

/**
 * Saves day-of program schedule items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @param items - Array of day-of schedule items
 */
export function saveEventSchedule(eventId: string, items: DayScheduleItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'schedule'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save day schedule items:', err);
  }
}

/**
 * Loads day-of program schedule items scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @returns Array of day schedule items or empty array
 */
export function loadEventSchedule(eventId: string): DayScheduleItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'schedule')) : null;
  return safeParse<DayScheduleItem[]>(raw, []);
}

/**
 * Saves personalized event ideas scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @param ideas - Array of event ideas
 */
export function saveEventIdeas(eventId: string, ideas: EventIdea[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'ideas'), JSON.stringify(ideas));
  } catch (err) {
    console.error('Failed to save event ideas:', err);
  }
}

/**
 * Loads personalized event ideas scoped to a specific event.
 *
 * @param eventId - Unique event identifier
 * @returns Array of event ideas or empty array
 */
export function loadEventIdeas(eventId: string): EventIdea[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'ideas')) : null;
  return safeParse<EventIdea[]>(raw, []);
}

// ----- Event Snapshots -----

/**
 * Saves an immutable snapshot of an entire event state into history.
 *
 * @param snapshot - The event snapshot object to persist
 */
export function saveEventSnapshot(snapshot: EventSnapshot): void {
  try {
    const existing = loadEventSnapshots();
    const updated = [...existing.filter((s) => s.id !== snapshot.id), snapshot];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
}

/**
 * Loads all historical event snapshots from localStorage.
 *
 * @returns Array of event snapshots or empty array
 */
export function loadEventSnapshots(): EventSnapshot[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(SNAPSHOTS_KEY) : null;
  return safeParse<EventSnapshot[]>(raw, []);
}

/**
 * Deletes a historical event snapshot by ID.
 *
 * @param id - The ID of the snapshot to delete
 */
export function deleteEventSnapshot(id: string): void {
  try {
    const updated = loadEventSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete snapshot:', err);
  }
}

/**
 * Clears all localStorage keys associated with the application.
 */
export function clearEventStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

// ============================================================
// Backward-Compatibility Checkpoints & Snapshots
// ============================================================

/**
 * Saves legacy navigation checkpoints for backward compatibility.
 *
 * @param checkpoints - Array of checkpoint objects
 */
export function saveCheckpoints(checkpoints: Checkpoint[]): void {
  try {
    localStorage.setItem(LEGACY_CHECKPOINT_KEY, JSON.stringify(checkpoints));
  } catch (err) {
    console.error('Failed to save checkpoints:', err);
  }
}

/**
 * Loads legacy navigation checkpoints from localStorage.
 *
 * @returns Array of checkpoints or empty array
 */
export function loadCheckpoints(): Checkpoint[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_CHECKPOINT_KEY) : null;
  return safeParse<Checkpoint[]>(raw, []);
}

/**
 * Clears legacy navigation checkpoints from localStorage.
 */
export function clearCheckpoints(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_CHECKPOINT_KEY);
    }
  } catch (err) {
    console.error('Failed to clear checkpoints:', err);
  }
}

/**
 * Saves legacy match day operations snapshot.
 *
 * @param snapshot - The match day snapshot
 */
export function saveSnapshot(snapshot: MatchDaySnapshot): void {
  try {
    const existing = loadSnapshots();
    const updated = [...existing.filter((s) => s.id !== snapshot.id), snapshot];
    localStorage.setItem(LEGACY_SNAPSHOT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
}

/**
 * Loads legacy match day operations snapshots.
 *
 * @returns Array of match day snapshots
 */
export function loadSnapshots(): MatchDaySnapshot[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_SNAPSHOT_KEY) : null;
  return safeParse<MatchDaySnapshot[]>(raw, []);
}

/**
 * Deletes a legacy match day snapshot by ID.
 *
 * @param id - Snapshot identifier
 */
export function deleteSnapshot(id: string): void {
  try {
    const updated = loadSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(LEGACY_SNAPSHOT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete snapshot:', err);
  }
}

/**
 * Clears legacy match day snapshots from localStorage.
 */
export function clearSnapshots(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_SNAPSHOT_KEY);
    }
  } catch (err) {
    console.error('Failed to clear snapshots:', err);
  }
}
