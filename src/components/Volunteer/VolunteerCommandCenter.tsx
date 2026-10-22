// ============================================================
// src/components/Volunteer/VolunteerCommandCenter.tsx
// AI-prioritized tasks, zone staff coordination, crowd alerts
// Per PROBLEM_ALIGNMENT.md §1.7
// ============================================================

import { memo, useState, useMemo } from 'react';
import { VolunteerTask, VolunteerStaff, TaskPriority, LanguageCode } from '@/types';

const INITIAL_TASKS: VolunteerTask[] = [
  { id: 't1', title: 'Crowd Flow — Gate A', description: 'Manage ingress queue at Gate A to prevent bottleneck.', zoneId: 'Z1', priority: TaskPriority.Urgent,  assignedTo: 'v1', completed: false, createdAt: Date.now() - 600000 },
  { id: 't2', title: 'Accessibility Assist', description: 'Escort wheelchair users to dedicated elevator bank.', zoneId: 'Z3', priority: TaskPriority.High,   assignedTo: 'v2', completed: false, createdAt: Date.now() - 400000 },
  { id: 't3', title: 'Waste Sorting — Food Court', description: 'Ensure correct waste sorting at all food court bins.', zoneId: 'Z2', priority: TaskPriority.Medium, assignedTo: null, completed: false, createdAt: Date.now() - 200000 },
  { id: 't4', title: 'Fan Query — Gate B', description: 'Handle multilingual fan questions near Gate B entrance.', zoneId: 'Z1', priority: TaskPriority.Low,    assignedTo: 'v3', completed: false, createdAt: Date.now() - 100000 },
  { id: 't5', title: 'Emergency Drill Check', description: 'Verify emergency exit signage in West Wing.', zoneId: 'Z4', priority: TaskPriority.Urgent,  assignedTo: null, completed: false, createdAt: Date.now() - 50000  },
];

const INITIAL_STAFF: VolunteerStaff[] = [
  { id: 'v1', name: 'Amara K.',    zoneId: 'Z1', languages: [LanguageCode.EN, LanguageCode.FR], available: false, currentTaskId: 't1' },
  { id: 'v2', name: 'Carlos M.',   zoneId: 'Z3', languages: [LanguageCode.EN, LanguageCode.ES, LanguageCode.PT], available: false, currentTaskId: 't2' },
  { id: 'v3', name: 'Yuki T.',     zoneId: 'Z1', languages: [LanguageCode.EN, LanguageCode.JA], available: false, currentTaskId: 't4' },
  { id: 'v4', name: 'Priya S.',    zoneId: 'Z2', languages: [LanguageCode.EN, LanguageCode.HI], available: true,  currentTaskId: null },
  { id: 'v5', name: 'Omar Al-F.',  zoneId: 'Z4', languages: [LanguageCode.EN, LanguageCode.AR], available: true,  currentTaskId: null },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.Urgent]: 0,
  [TaskPriority.High]:   1,
  [TaskPriority.Medium]: 2,
  [TaskPriority.Low]:    3,
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  [TaskPriority.Urgent]: 'border-red-500/50 bg-red-900/20',
  [TaskPriority.High]:   'border-orange-500/50 bg-orange-900/20',
  [TaskPriority.Medium]: 'border-amber-500/50 bg-amber-900/20',
  [TaskPriority.Low]:    'border-slate-500/50 bg-slate-800/40',
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  [TaskPriority.Urgent]: 'bg-red-600 text-white',
  [TaskPriority.High]:   'bg-orange-600 text-white',
  [TaskPriority.Medium]: 'bg-amber-600 text-white',
  [TaskPriority.Low]:    'bg-slate-600 text-white',
};

export const VolunteerCommandCenter = memo(function VolunteerCommandCenter() {
  const [tasks, setTasks] = useState<VolunteerTask[]>(INITIAL_TASKS);
  const [staff, setStaff] = useState<VolunteerStaff[]>(INITIAL_STAFF);
  const [filterZone, setFilterZone] = useState<string>('all');

  const sortedTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => filterZone === 'all' || t.zoneId === filterZone)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [tasks, filterZone]
  );

  const zones = ['all', ...Array.from(new Set(tasks.map((t) => t.zoneId)))];

  const toggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const assignStaff = (taskId: string, staffId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignedTo: staffId } : t))
    );
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, available: false, currentTaskId: taskId } : s))
    );
  };

  const urgentCount = tasks.filter((t) => t.priority === TaskPriority.Urgent && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <section aria-label="Volunteer Command Center" className="flex flex-col gap-6">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-900/40 border border-red-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-red-400">{urgentCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Urgent Tasks</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-white">{tasks.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Tasks</p>
        </div>
        <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-400">{completedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span aria-hidden="true">📋</span> AI-Prioritized Task Queue
          </h2>
          <div>
            <label htmlFor="zone-filter" className="sr-only">Filter by zone</label>
            <select
              id="zone-filter"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Filter tasks by zone"
            >
              {zones.map((z) => <option key={z} value={z}>{z === 'all' ? 'All Zones' : `Zone ${z}`}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {sortedTasks.map((task) => {
            const assignedStaff = staff.find((s) => s.id === task.assignedTo);
            const availableStaff = staff.filter((s) => s.available);
            return (
              <div
                key={task.id}
                className={`rounded-xl border p-4 transition-all ${PRIORITY_STYLES[task.priority]} ${task.completed ? 'opacity-50' : ''}`}
                aria-label={`Task: ${task.title}, priority ${task.priority}${task.completed ? ', completed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="mt-1 w-4 h-4 accent-emerald-500 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                    aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label htmlFor={`task-${task.id}`} className={`font-semibold text-sm ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </label>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PRIORITY_BADGE[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                        {task.zoneId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      {assignedStaff ? (
                        <span className="text-xs text-emerald-400">👤 {assignedStaff.name}</span>
                      ) : (
                        <span className="text-xs text-orange-400">⚠️ Unassigned</span>
                      )}
                      {!task.completed && availableStaff.length > 0 && (
                        <div>
                          <label htmlFor={`assign-${task.id}`} className="sr-only">Assign staff to {task.title}</label>
                          <select
                            id={`assign-${task.id}`}
                            onChange={(e) => { if (e.target.value) assignStaff(task.id, e.target.value); }}
                            defaultValue=""
                            className="bg-slate-700/60 border border-slate-600/50 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label={`Assign volunteer to ${task.title}`}
                          >
                            <option value="" disabled>Assign volunteer…</option>
                            {availableStaff.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff roster */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-5">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <span aria-hidden="true">👥</span> Zone Staff Roster
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border p-3 flex items-center gap-3
                ${s.available ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-slate-600/30 bg-slate-800/30'}`}
              aria-label={`${s.name}, zone ${s.zoneId}, ${s.available ? 'available' : 'on task'}`}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${s.available ? 'bg-emerald-400' : 'bg-slate-500'}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{s.name}</p>
                <p className="text-xs text-slate-400">Zone {s.zoneId} · {s.languages.join(', ').toUpperCase()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.available ? 'text-emerald-400 bg-emerald-900/40' : 'text-slate-400 bg-slate-700/40'}`}>
                {s.available ? 'Available' : 'On Task'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
