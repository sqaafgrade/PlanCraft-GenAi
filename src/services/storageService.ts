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

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ----- Events Storage -----

export function saveEvents(events: EventItem[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

export function loadEvents(): EventItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(EVENTS_KEY) : null;
  return safeParse<EventItem[]>(raw, []);
}

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

export function loadActiveEventId(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_EVENT_KEY) : null;
}

// ----- Event Detail Storage (Per-Event Scoped) -----

export function getEventScopedKey(eventId: string, suffix: string): string {
  return `genai_evt_${eventId}_${suffix}`;
}

export function saveEventBudget(eventId: string, items: BudgetItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'budget'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save budget items:', err);
  }
}

export function loadEventBudget(eventId: string): BudgetItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'budget')) : null;
  return safeParse<BudgetItem[]>(raw, []);
}

export function saveEventTimeline(eventId: string, tasks: TimelineTask[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'timeline'), JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save timeline tasks:', err);
  }
}

export function loadEventTimeline(eventId: string): TimelineTask[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'timeline')) : null;
  return safeParse<TimelineTask[]>(raw, []);
}

export function saveEventVendors(eventId: string, items: VendorChecklistItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'vendors'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save vendor checklist items:', err);
  }
}

export function loadEventVendors(eventId: string): VendorChecklistItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'vendors')) : null;
  return safeParse<VendorChecklistItem[]>(raw, []);
}

export function saveEventSchedule(eventId: string, items: DayScheduleItem[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'schedule'), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save day schedule items:', err);
  }
}

export function loadEventSchedule(eventId: string): DayScheduleItem[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'schedule')) : null;
  return safeParse<DayScheduleItem[]>(raw, []);
}

export function saveEventIdeas(eventId: string, ideas: EventIdea[]): void {
  try {
    localStorage.setItem(getEventScopedKey(eventId, 'ideas'), JSON.stringify(ideas));
  } catch (err) {
    console.error('Failed to save event ideas:', err);
  }
}

export function loadEventIdeas(eventId: string): EventIdea[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(getEventScopedKey(eventId, 'ideas')) : null;
  return safeParse<EventIdea[]>(raw, []);
}

// ----- Event Snapshots -----

export function saveEventSnapshot(snapshot: EventSnapshot): void {
  try {
    const existing = loadEventSnapshots();
    const updated = [...existing.filter((s) => s.id !== snapshot.id), snapshot];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
}

export function loadEventSnapshots(): EventSnapshot[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(SNAPSHOTS_KEY) : null;
  return safeParse<EventSnapshot[]>(raw, []);
}

export function deleteEventSnapshot(id: string): void {
  try {
    const updated = loadEventSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete snapshot:', err);
  }
}

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

export function saveCheckpoints(checkpoints: Checkpoint[]): void {
  try {
    localStorage.setItem(LEGACY_CHECKPOINT_KEY, JSON.stringify(checkpoints));
  } catch (err) {
    console.error('Failed to save checkpoints:', err);
  }
}

export function loadCheckpoints(): Checkpoint[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_CHECKPOINT_KEY) : null;
  return safeParse<Checkpoint[]>(raw, []);
}

export function clearCheckpoints(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_CHECKPOINT_KEY);
    }
  } catch (err) {
    console.error('Failed to clear checkpoints:', err);
  }
}

export function saveSnapshot(snapshot: MatchDaySnapshot): void {
  try {
    const existing = loadSnapshots();
    const updated = [...existing.filter((s) => s.id !== snapshot.id), snapshot];
    localStorage.setItem(LEGACY_SNAPSHOT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save snapshot:', err);
  }
}

export function loadSnapshots(): MatchDaySnapshot[] {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_SNAPSHOT_KEY) : null;
  return safeParse<MatchDaySnapshot[]>(raw, []);
}

export function deleteSnapshot(id: string): void {
  try {
    const updated = loadSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(LEGACY_SNAPSHOT_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete snapshot:', err);
  }
}

export function clearSnapshots(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_SNAPSHOT_KEY);
    }
  } catch (err) {
    console.error('Failed to clear snapshots:', err);
  }
}
