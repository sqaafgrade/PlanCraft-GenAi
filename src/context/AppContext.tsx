// ============================================================
// src/context/AppContext.tsx
// Global state: active event, event list, tab, accessibility, auth
// ============================================================

import {
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { User } from 'firebase/auth';
import {
  TabId,
  AccessibilityMode,
  LanguageCode,
  EventType,
  EventStatus,
  EventItem,
} from '@/types';
import {
  loadEvents,
  saveEvents,
  loadActiveEventId,
  saveActiveEventId,
} from '@/services/storageService';
import { AppContext } from './AppContextDef';

const DEFAULT_EVENT: EventItem = {
  id: 'evt-default-1',
  title: 'Sarah & Alex Wedding Celebration',
  eventType: EventType.Wedding,
  date: '2026-09-18',
  location: 'San Francisco, CA',
  guestCount: 150,
  totalBudget: 35000,
  status: EventStatus.Planning,
  preferences: {
    themePreference: 'Botanical Garden & Soft Gold',
    venuePreference: 'Outdoor garden with indoor reception pavilion',
    dietaryRequirements: ['Vegetarian', 'Gluten-Free', 'Halal'],
    accessibilityRequirements: ['Wheelchair accessible pathways', 'Step-free entrance'],
    culturalPreferences: 'Bilingual vows and multicultural music',
    specialRequests: 'Sparkler exit and live acoustic duo during dinner',
  },
  createdAt: Date.now() - 86400000 * 14,
  lastUpdated: Date.now(),
};

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(TabId.Dashboard);
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>(AccessibilityMode.Standard);
  const [language, setLanguage] = useState<LanguageCode>(LanguageCode.EN);

  // Initialize events from local storage or default sample
  const [events, setEvents] = useState<EventItem[]>(() => {
    const loaded = loadEvents();
    if (loaded && loaded.length > 0) return loaded;
    return [DEFAULT_EVENT];
  });

  const [activeEvent, setActiveEventState] = useState<EventItem | null>(() => {
    const loadedEvents = loadEvents();
    const activeId = loadActiveEventId();
    if (loadedEvents && loadedEvents.length > 0) {
      const match = loadedEvents.find((e) => e.id === activeId);
      return match ?? loadedEvents[0];
    }
    return DEFAULT_EVENT;
  });

  // Sync to localStorage
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveActiveEventId(activeEvent?.id ?? null);
  }, [activeEvent]);

  const handleSetUser = useCallback((u: User | null) => setUser(u), []);
  const handleSetActiveTab = useCallback((t: TabId) => setActiveTab(t), []);
  const handleSetAccessibilityMode = useCallback((m: AccessibilityMode) => setAccessibilityMode(m), []);
  const handleSetLanguage = useCallback((l: LanguageCode) => setLanguage(l), []);

  const setActiveEvent = useCallback((event: EventItem | null) => {
    setActiveEventState(event);
  }, []);

  const createEvent = useCallback(
    (params: Omit<EventItem, 'id' | 'createdAt' | 'lastUpdated'>): EventItem => {
      const newEvt: EventItem = {
        ...params,
        id: `evt-${Date.now()}`,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      setEvents((prev) => [newEvt, ...prev]);
      setActiveEventState(newEvt);
      return newEvt;
    },
    []
  );

  const updateEvent = useCallback((id: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, lastUpdated: Date.now() } : e))
    );
    setActiveEventState((curr) =>
      curr?.id === id ? { ...curr, ...updates, lastUpdated: Date.now() } : curr
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered;
    });
    setActiveEventState((curr) => {
      if (curr?.id === id) {
        const remaining = events.filter((e) => e.id !== id);
        return remaining.length > 0 ? remaining[0] : null;
      }
      return curr;
    });
  }, [events]);

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
        events,
        activeEvent,
        setActiveEvent,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
