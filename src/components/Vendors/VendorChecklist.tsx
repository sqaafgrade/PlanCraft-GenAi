// ============================================================
// src/components/Vendors/VendorChecklist.tsx
// Vendor checklist and supplier management with verified statuses,
// category grouping, contact tracking, and priority badges.
// ============================================================

import { memo, useState } from 'react';
import { EventItem, BudgetCategory, TaskPriority, VendorStatus } from '@/types';
import { useVendorChecklist } from '@/hooks/useVendorChecklist';

interface VendorChecklistProps {
  event: EventItem | null;
}

const CATEGORIES: BudgetCategory[] = [
  BudgetCategory.Venue,
  BudgetCategory.Catering,
  BudgetCategory.Photography,
  BudgetCategory.Decoration,
  BudgetCategory.Entertainment,
  BudgetCategory.Invitations,
  BudgetCategory.Equipment,
  BudgetCategory.Transportation,
  BudgetCategory.Miscellaneous,
];

const STATUS_CONFIG: Record<VendorStatus, { label: string; badge: string }> = {
  [VendorStatus.NotStarted]: { label: 'Not Started', badge: 'bg-slate-700/50 text-slate-400 border-slate-700' },
  [VendorStatus.Researching]: { label: 'Researching', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  [VendorStatus.Contacted]:   { label: 'Contacted', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  [VendorStatus.Confirmed]:   { label: 'Confirmed', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  [VendorStatus.Completed]:   { label: 'Completed', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

export const VendorChecklist = memo(function VendorChecklist({ event }: VendorChecklistProps) {
  const vendors = useVendorChecklist(
    event?.id ?? 'empty',
    event?.eventType
  );
  const { items, progress, addItem, updateStatus, deleteItem, regenerateDefaults } = vendors;

  // Filter state
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New vendor form state
  const [category, setCategory] = useState<BudgetCategory>(BudgetCategory.Venue);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.High);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addItem({
      category,
      name: name.trim(),
      description: desc.trim() || 'Custom vendor requirements',
      priority,
      status: VendorStatus.NotStarted,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: 0,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
    });

    setName('');
    setDesc('');
    setEstimatedCost(0);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
  };

  const filteredItems = items.filter((it) => {
    if (filterCat !== 'all' && it.category !== filterCat) return false;
    if (filterStatus !== 'all' && it.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <section
        aria-labelledby="vendors-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 backdrop-blur shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="vendors-heading" className="text-xl font-black text-white flex items-center gap-2">
              <span>📋</span> Vendor Checklist & Coordination
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customized vendor checkpoints for venues, catering, photography, sound, and logistics.
            </p>
          </div>

          {event && (
            <button
              type="button"
              onClick={() => regenerateDefaults(event.eventType)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Reset to Recommended Checklist
            </button>
          )}
        </div>
      </section>

      {/* ── Progress Stats Overview ── */}
      <section aria-label="Vendor Progress Metrics" className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-[11px] text-slate-400 block">Total Items</span>
          <span className="text-2xl font-black text-white mt-1 block">{progress.total}</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-[11px] text-emerald-400 block">Confirmed</span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">{progress.confirmed}</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-[11px] text-amber-400 block">Contacted</span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">{progress.contacted}</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-[11px] text-blue-400 block">Researching</span>
          <span className="text-2xl font-black text-blue-300 mt-1 block">{progress.researching}</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] text-purple-400 block">Completed</span>
          <span className="text-2xl font-black text-purple-300 mt-1 block">{progress.completed}</span>
        </div>
      </section>

      {/* ── Add Vendor Form ── */}
      <form
        onSubmit={handleAddVendor}
        aria-label="Add Vendor Checklist Item"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3 shadow-xl"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          + Add Vendor Checklist Item
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="vdr-cat" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Category
            </label>
            <select
              id="vdr-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vdr-name" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Vendor / Service Name *
            </label>
            <input
              id="vdr-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grand Ballroom, DJ Dave"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="vdr-est" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Estimated Cost ($)
            </label>
            <input
              id="vdr-est"
              type="number"
              min="0"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="vdr-priority" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Priority
            </label>
            <select
              id="vdr-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={TaskPriority.Urgent}>Urgent</option>
              <option value={TaskPriority.High}>High</option>
              <option value={TaskPriority.Medium}>Medium</option>
              <option value={TaskPriority.Low}>Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="vdr-contact" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Contact Name / Company
            </label>
            <input
              id="vdr-contact"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Maria Santos"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="vdr-phone" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Contact Phone
            </label>
            <input
              id="vdr-phone"
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +1 (555) 234-5678"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="vdr-email" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Contact Email
            </label>
            <input
              id="vdr-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. contact@grandballroom.com"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Add Vendor Item
          </button>
        </div>
      </form>

      {/* ── Vendor Items List ── */}
      <section aria-label="Vendor Checklist Items" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🏪</span> Active Vendor Checklist ({filteredItems.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filter by category"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none capitalize"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
                <option key={st} value={st}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No vendor checklist items match the selected filter.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        STATUS_CONFIG[item.status].badge
                      }`}
                    >
                      {STATUS_CONFIG[item.status].label}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm mt-2">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>

                  {(item.contactName || item.contactPhone || item.contactEmail) && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex flex-col gap-0.5">
                      {item.contactName && <span>👤 {item.contactName}</span>}
                      {item.contactPhone && <span>📞 {item.contactPhone}</span>}
                      {item.contactEmail && <span>✉️ {item.contactEmail}</span>}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px]">Est. Cost: </span>
                    <strong className="text-slate-200">${item.estimatedCost.toLocaleString()}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor={`status-sel-${item.id}`} className="sr-only">Status</label>
                    <select
                      id={`status-sel-${item.id}`}
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value as VendorStatus)}
                      className="bg-slate-900 border border-slate-700 text-[11px] text-white rounded-lg px-2 py-1 focus:outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
                        <option key={st} value={st}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      aria-label={`Delete vendor ${item.name}`}
                      onClick={() => deleteItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
