// ============================================================
// src/services/storageService.ts
// Local persistence — parse-safe, typed, no any
// Per CODE_QUALITY.md §1.2
// ============================================================

import { MatchDaySnapshot, Checkpoint } from '@/types';

const SNAPSHOT_KEY = 'smartstadium_snapshots';
const CHECKPOINT_KEY = 'smartstadium_checkpoints';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ----- Snapshots -----

export function saveSnapshot(snapshot: MatchDaySnapshot): void {
  const existing = loadSnapshots();
  const updated = [...existing.filter((s) => s.id !== snapshot.id), snapshot];
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
}

export function loadSnapshots(): MatchDaySnapshot[] {
  const raw = localStorage.getItem(SNAPSHOT_KEY);
  return safeParse<MatchDaySnapshot[]>(raw, []);
}

export function deleteSnapshot(id: string): void {
  const updated = loadSnapshots().filter((s) => s.id !== id);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
}

export function clearSnapshots(): void {
  localStorage.removeItem(SNAPSHOT_KEY);
}

// ----- Checkpoints -----

export function saveCheckpoints(checkpoints: Checkpoint[]): void {
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoints));
}

export function loadCheckpoints(): Checkpoint[] {
  const raw = localStorage.getItem(CHECKPOINT_KEY);
  return safeParse<Checkpoint[]>(raw, []);
}

export function clearCheckpoints(): void {
  localStorage.removeItem(CHECKPOINT_KEY);
}
