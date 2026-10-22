// ============================================================
// src/context/AppContextDef.ts
// Context definition and types for global event planning state
// ============================================================

import { createContext } from 'react';
import { User } from 'firebase/auth';
import {
  TabId,
  AccessibilityMode,
  LanguageCode,
  EventItem,
} from '@/types';

export interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  events: EventItem[];
  activeEvent: EventItem | null;
  setActiveEvent: (event: EventItem | null) => void;
  createEvent: (params: Omit<EventItem, 'id' | 'createdAt' | 'lastUpdated'>) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
