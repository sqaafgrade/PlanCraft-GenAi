// ============================================================
// src/hooks/useAppContext.ts
// Hook to access global AppContext safely with invariant assertion
// ============================================================

import { useContext } from 'react';
import { AppContext, AppContextValue } from '@/context/AppContextDef';

/**
 * Access the global application context (active event, auth, tabs, settings).
 *
 * @returns The active AppContextValue
 * @throws {Error} If called outside of an AppContextProvider tree
 */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
}
