// ============================================================
// src/services/firebaseService.ts
// Firebase Auth + Firestore wrappers — per-user data isolation
// Per SECURITY.md §3 — scoped via firestore.rules
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
import { MatchDaySnapshot } from '@/types';

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

// ----- Firestore -----

function snapshotsCollection(uid: string) {
  return collection(db, 'users', uid, 'snapshots');
}

export async function syncSnapshot(
  uid: string,
  snapshot: MatchDaySnapshot
): Promise<void> {
  const ref = doc(snapshotsCollection(uid), snapshot.id);
  await setDoc(ref, snapshot);
}

export async function fetchSnapshots(uid: string): Promise<MatchDaySnapshot[]> {
  const colRef = snapshotsCollection(uid);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as MatchDaySnapshot);
}

export async function fetchSnapshot(
  uid: string,
  snapshotId: string
): Promise<MatchDaySnapshot | null> {
  const ref = doc(snapshotsCollection(uid), snapshotId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as MatchDaySnapshot;
}

export async function deleteFirestoreSnapshot(
  uid: string,
  snapshotId: string
): Promise<void> {
  const ref = doc(snapshotsCollection(uid), snapshotId);
  await deleteDoc(ref);
}
