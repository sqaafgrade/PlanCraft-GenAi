// ============================================================
// src/hooks/useEventTimeline.ts
// Event timeline task tracking, date ordering, and completion
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TimelineTask, EventType } from '@/types';
import {
  generateDefaultMilestones,
  calculateDaysRemaining,
  validateIsoDate,
} from '@/lib/eventCompute';
import { loadEventTimeline, saveEventTimeline } from '@/services/storageService';

export interface UseEventTimelineReturn {
  tasks: TimelineTask[];
  daysRemaining: number;
  completedCount: number;
  totalCount: number;
  addTask: (task: Omit<TimelineTask, 'id' | 'eventId' | 'isOverdue'>) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<TimelineTask>) => void;
  deleteTask: (id: string) => void;
  regenerateMilestones: (eventDate: string, eventType: EventType) => void;
}

export function useEventTimeline(
  eventId: string,
  eventDate: string,
  eventType: EventType = EventType.Wedding
): UseEventTimelineReturn {
  const [tasks, setTasks] = useState<TimelineTask[]>(() => {
    const loaded = loadEventTimeline(eventId);
    if (loaded && loaded.length > 0) return loaded;
    if (validateIsoDate(eventDate)) {
      return generateDefaultMilestones(eventDate, eventType, eventId);
    }
    return [];
  });

  // Sync to storage
  useEffect(() => {
    saveEventTimeline(eventId, tasks);
  }, [eventId, tasks]);

  const daysRemaining = useMemo(() => {
    if (!validateIsoDate(eventDate)) return 0;
    try {
      return calculateDaysRemaining(eventDate);
    } catch {
      return 0;
    }
  }, [eventDate]);

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const totalCount = tasks.length;

  const addTask = useCallback(
    (task: Omit<TimelineTask, 'id' | 'eventId' | 'isOverdue'>) => {
      const todayIso = new Date().toISOString().split('T')[0];
      const isOverdue = task.targetDate < todayIso;
      const newTask: TimelineTask = {
        ...task,
        id: `${eventId}-tsk-${Date.now()}`,
        eventId,
        isOverdue,
      };
      setTasks((prev) => [...prev, newTask].sort((a, b) => a.targetDate.localeCompare(b.targetDate)));
    },
    [eventId]
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<TimelineTask>) => {
    setTasks((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, ...updates } : t))
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const regenerateMilestones = useCallback(
    (date: string, type: EventType) => {
      if (validateIsoDate(date)) {
        const generated = generateDefaultMilestones(date, type, eventId);
        setTasks(generated);
      }
    },
    [eventId]
  );

  return {
    tasks,
    daysRemaining,
    completedCount,
    totalCount,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    regenerateMilestones,
  };
}
