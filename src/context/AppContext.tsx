// ============================================================
// src/context/AppContext.tsx
// Global state: auth, language, accessibility mode, active tab
// ============================================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { TabId, AccessibilityMode, LanguageCode } from '@/types';

interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(TabId.Analytics);
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>(AccessibilityMode.Standard);
  const [language, setLanguage] = useState<LanguageCode>(LanguageCode.EN);

  const handleSetUser = useCallback((u: User | null) => setUser(u), []);
  const handleSetActiveTab = useCallback((t: TabId) => setActiveTab(t), []);
  const handleSetAccessibilityMode = useCallback((m: AccessibilityMode) => setAccessibilityMode(m), []);
  const handleSetLanguage = useCallback((l: LanguageCode) => setLanguage(l), []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        activeTab,
        setActiveTab: handleSetActiveTab,
        accessibilityMode,
        setAccessibilityMode: handleSetAccessibilityMode,
        language,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
