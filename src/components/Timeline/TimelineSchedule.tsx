// ============================================================
// src/components/Timeline/TimelineSchedule.tsx
// Event timeline and scheduling with chronological milestones,
// overdue badges, task completion, and event-day activity schedule.
// ============================================================

import { memo, useState } from 'react';
import { EventItem, TaskPriority, DayScheduleItem } from '@/types';
import { useEventTimeline } from '@/hooks/useEventTimeline';
import { loadEventSchedule, saveEventSchedule } from '@/services/storageService';

interface TimelineScheduleProps {
  event: EventItem | null;
}

const DEFAULT_SCHEDULE: DayScheduleItem[] = [
  { id: 'sch-1', time: '11:00', activity: 'Venue Access & Supplier Setup', description: 'Florists, AV tech, and decor team arrival' },
  { id: 'sch-2', time: '14:00', activity: 'Photo Session & Final Checks', description: 'VIP / Family portraits and soundcheck' },
  { id: 'sch-3', time: '16:00', activity: 'Guest Arrival & Welcome Refreshments', description: 'Welcome drinks, live acoustic background music' },
  { id: 'sch-4', time: '17:00', activity: 'Main Ceremony / Highlight Program', description: 'Primary vows, addresses, or keynote showcase' },
  { id: 'sch-5', time: '18:30', activity: 'Dinner & Toasting', description: 'Plated / buffet catering with designated dietary stations' },
  { id: 'sch-6', time: '20:30', activity: 'Evening Entertainment & Dancing', description: 'DJ dance floor, dessert bar, celebratory exit' },
];

export const TimelineSchedule = memo(function TimelineSchedule({ event }: TimelineScheduleProps) {
  const timeline = useEventTimeline(
    event?.id ?? 'empty',
    event?.date ?? '',
    event?.eventType
  );
  const {
    tasks,
    daysRemaining,
    completedCount,
    totalCount,
    addTask,
    toggleTask,
    deleteTask,
    regenerateMilestones,
  } = timeline;

  const [daySchedule, setDaySchedule] = useState<DayScheduleItem[]>(() => {
    if (!event) return DEFAULT_SCHEDULE;
    const loaded = loadEventSchedule(event.id);
    return loaded && loaded.length > 0 ? loaded : DEFAULT_SCHEDULE;
  });

  // Add milestone task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState(event?.date ?? '');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.High);

  // Add day-of activity form state
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDate) return;

    addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Custom milestone task',
      category: 'general',
      targetDate: taskDate,
      completed: false,
      priority: taskPriority,
    });

    setTaskTitle('');
    setTaskDesc('');
  };

  const handleAddScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim() || !newActivity.trim() || !event) return;

    const newItem: DayScheduleItem = {
      id: `sch-${Date.now()}`,
      time: newTime.trim(),
      activity: newActivity.trim(),
      description: newDesc.trim() || 'Event schedule activity',
    };

    const updated = [...daySchedule, newItem].sort((a, b) => a.time.localeCompare(b.time));
    setDaySchedule(updated);
    saveEventSchedule(event.id, updated);

    setNewTime('');
    setNewActivity('');
    setNewDesc('');
  };

  const handleDeleteScheduleItem = (id: string) => {
    if (!event) return;
    const updated = daySchedule.filter((s) => s.id !== id);
    setDaySchedule(updated);
    saveEventSchedule(event.id, updated);
  };

  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <section
        aria-labelledby="timeline-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 backdrop-blur shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="timeline-heading" className="text-xl font-black text-white flex items-center gap-2">
              <span>🗓️</span> Event Timeline & Scheduling
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize preparation milestones and minute-by-minute day-of schedule.
            </p>
          </div>

          {event && (
            <button
              type="button"
              onClick={() => regenerateMilestones(event.date, event.eventType)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Reset to Recommended Milestones
            </button>
          )}
        </div>
      </section>

      {/* ── Countdown & Progress Card ── */}
      <section aria-label="Timeline Progress Overview" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <span className="text-xs text-slate-400 block">Countdown to Event</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{daysRemaining}</span>
            <span className="text-xs text-slate-400 font-medium">Days Remaining</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Event Target: {event?.date}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Milestones Completed</span>
              <span className="font-bold text-white">
                {completedCount} of {totalCount} ({completionPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Sequential task milestones ensure critical contracts, invitations, and tastings happen in order.
          </p>
        </div>
      </section>

      {/* ── Add Custom Milestone Form ── */}
      <form
        onSubmit={handleAddTask}
        aria-label="Add Milestone Task"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3 shadow-xl"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          + Add Preparation Milestone
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="tsk-title" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Task Title *
            </label>
            <input
              id="tsk-title"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Schedule DJ Playlist Review"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="tsk-desc" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Description
            </label>
            <input
              id="tsk-desc"
              type="text"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Details or deliverables"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="tsk-date" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Target Deadline *
            </label>
            <input
              id="tsk-date"
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="tsk-priority" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Priority
            </label>
            <select
              id="tsk-priority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={TaskPriority.Urgent}>Urgent</option>
              <option value={TaskPriority.High}>High</option>
              <option value={TaskPriority.Medium}>Medium</option>
              <option value={TaskPriority.Low}>Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Add Milestone
          </button>
        </div>
      </form>

      {/* ── Milestones List ── */}
      <section aria-label="Chronological Milestones" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>🚩</span> Preparation Milestones ({tasks.length})
        </h3>

        {tasks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No milestones planned yet. Click "Reset to Recommended Milestones" or add your own above.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                  task.completed
                    ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer mt-0.5"
                    aria-label={`Toggle completion for ${task.title}`}
                  />
                  <div>
                    <span
                      className={`font-semibold text-xs ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Due: <strong>{task.targetDate}</strong>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.priority === TaskPriority.Urgent
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : task.priority === TaskPriority.High
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    {task.priority}
                  </span>

                  {task.isOverdue && !task.completed && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-600/40 animate-pulse">
                      Overdue
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={`Delete task ${task.title}`}
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Day-of Event Schedule ── */}
      <section aria-label="Event-Day Schedule" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⏰</span> Event-Day Program Schedule
          </h3>
          <span className="text-xs text-slate-500">{daySchedule.length} activities scheduled</span>
        </div>

        {/* Add Day Activity Form */}
        <form onSubmit={handleAddScheduleItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
          <div>
            <label htmlFor="sch-time" className="sr-only">Time</label>
            <input
              id="sch-time"
              type="text"
              placeholder="e.g. 15:30"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="sch-act" className="sr-only">Activity</label>
            <input
              id="sch-act"
              type="text"
              placeholder="e.g. Cake Cutting"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="sch-desc" className="sr-only">Description</label>
            <input
              id="sch-desc"
              type="text"
              placeholder="Details or location"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            + Add Activity
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {daySchedule.map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex justify-between items-start gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-400 block">{item.time}</span>
                <p className="font-bold text-white mt-1">{item.activity}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove schedule item ${item.activity}`}
                onClick={() => handleDeleteScheduleItem(item.id)}
                className="text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});
