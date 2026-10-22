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
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import { EventSnapshot } from '@/types';

// ----- Auth -----

/**
 * Authenticates an existing user via Firebase email/password credentials.
 *
 * @param email - User email address
 * @param password - Account password
 * @returns Authenticated Firebase User object
 */
export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Registers a new user account with email/password authentication.
 *
 * @param email - User email address
 * @param password - Desired account password
 * @returns Created Firebase User object
 */
export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Signs out the currently authenticated Firebase user.
 */
export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

// ----- Firestore (Per-User Scoped) -----

/**
 * Internal helper to retrieve the user's isolated events collection reference.
 *
 * @param uid - The authenticated user UID
 * @returns Firestore CollectionReference
 */
function userEventsCollection(uid: string): CollectionReference<DocumentData, DocumentData> {
  return collection(db, 'users', uid, 'events');
}

/**
 * Persists an event snapshot to the user's private Firestore collection.
 *
 * @param uid - The authenticated user UID
 * @param snapshot - The immutable event snapshot to sync
 */
export async function syncEventSnapshot(
  uid: string,
  snapshot: EventSnapshot
): Promise<void> {
  const ref = doc(userEventsCollection(uid), snapshot.id);
  await setDoc(ref, snapshot);
}

/**
 * Retrieves all event snapshots belonging to the authenticated user from Firestore.
 *
 * @param uid - The authenticated user UID
 * @returns Array of user-scoped event snapshots
 */
export async function fetchEventSnapshots(uid: string): Promise<EventSnapshot[]> {
  const colRef = userEventsCollection(uid);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as EventSnapshot);
}

/**
 * Fetches a single event snapshot by ID from Firestore, isolated to the user's UID.
 *
 * @param uid - The authenticated user UID
 * @param snapshotId - Unique snapshot identifier
 * @returns EventSnapshot object or null if not found
 */
export async function fetchEventSnapshot(
  uid: string,
  snapshotId: string
): Promise<EventSnapshot | null> {
  const ref = doc(userEventsCollection(uid), snapshotId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as EventSnapshot;
}

/**
 * Deletes an event snapshot from Firestore, isolated to the user's UID.
 *
 * @param uid - The authenticated user UID
 * @param snapshotId - Unique snapshot identifier
 */
export async function deleteFirestoreEventSnapshot(
  uid: string,
  snapshotId: string
): Promise<void> {
  const ref = doc(userEventsCollection(uid), snapshotId);
  await deleteDoc(ref);
}
