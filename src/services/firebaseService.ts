// ============================================================
// src/services/firebaseService.ts
// Firebase Auth + Firestore wrappers — per-user data isolation
// Scoped to authenticated user uid for event plans and snapshots
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import { EventSnapshot } from '@/types';

// ----- Auth -----

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

// ----- Firestore (Per-User Scoped) -----

function userEventsCollection(uid: string) {
  return collection(db, 'users', uid, 'events');
}

export async function syncEventSnapshot(
  uid: string,
  snapshot: EventSnapshot
): Promise<void> {
  const ref = doc(userEventsCollection(uid), snapshot.id);
  await setDoc(ref, snapshot);
}

export async function fetchEventSnapshots(uid: string): Promise<EventSnapshot[]> {
  const colRef = userEventsCollection(uid);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as EventSnapshot);
}

export async function fetchEventSnapshot(
  uid: string,
  snapshotId: string
): Promise<EventSnapshot | null> {
  const ref = doc(userEventsCollection(uid), snapshotId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as EventSnapshot;
}

export async function deleteFirestoreEventSnapshot(
  uid: string,
  snapshotId: string
): Promise<void> {
  const ref = doc(userEventsCollection(uid), snapshotId);
  await deleteDoc(ref);
}
