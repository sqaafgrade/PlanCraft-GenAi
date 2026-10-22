// ============================================================
// src/components/Budget/BudgetManager.tsx
// Comprehensive event budget management with category allocations,
// overrun detection, estimated vs actual expense comparison, and items table.
// ============================================================

import { memo, useState } from 'react';
import { EventItem, BudgetCategory } from '@/types';
import { useEventBudget } from '@/hooks/useEventBudget';

interface BudgetManagerProps {
  event: EventItem | null;
}

const CATEGORIES: BudgetCategory[] = [
  BudgetCategory.Venue,
  BudgetCategory.Catering,
  BudgetCategory.Decoration,
  BudgetCategory.Photography,
  BudgetCategory.Entertainment,
  BudgetCategory.Invitations,
  BudgetCategory.Transportation,
  BudgetCategory.Accommodation,
  BudgetCategory.Equipment,
  BudgetCategory.Miscellaneous,
];

export const BudgetManager = memo(function BudgetManager({ event }: BudgetManagerProps) {
  const budget = useEventBudget(
    event?.id ?? 'empty',
    event?.totalBudget ?? 0,
    event?.eventType
  );
  const { items, summary, addItem, updateItem, deleteItem, applyDefaultAllocations } = budget;

  // New item form state
  const [selectedCat, setSelectedCat] = useState<BudgetCategory>(BudgetCategory.Venue);
  const [itemName, setItemName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [actualCost, setActualCost] = useState<number>(0);
  const [paid, setPaid] = useState<boolean>(false);

  // Filter
  const [filterCat, setFilterCat] = useState<string>('all');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    addItem({
      category: selectedCat,
      name: itemName.trim(),
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: Number(actualCost) || 0,
      paid,
    });

    setItemName('');
    setEstimatedCost(0);
    setActualCost(0);
    setPaid(false);
  };

  const filteredItems = items.filter((it) => {
    if (filterCat === 'all') return true;
    return it.category === filterCat;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header ── */}
      <section
        aria-labelledby="budget-heading"
        className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 backdrop-blur shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="budget-heading" className="text-xl font-black text-white flex items-center gap-2">
              <span>💰</span> Event Budget Manager
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track planned allocations, estimated quotes, and actual expenses with real-time overrun warnings.
            </p>
          </div>

          {event && (
            <button
              type="button"
              onClick={() => applyDefaultAllocations(event.eventType, event.totalBudget)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Reset to Recommended Distribution
            </button>
          )}
        </div>
      </section>

      {/* ── Overrun Alert ── */}
      {summary.isOverBudget && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-rose-500/50 bg-rose-950/70 p-4 text-xs text-rose-200 flex items-center gap-3 shadow-lg"
        >
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <div className="flex-1">
            <p className="font-bold">Budget Overrun Detected!</p>
            <p className="opacity-90 mt-0.5">
              Your projected or actual spending (${summary.totalActual > summary.totalBudget ? summary.totalActual.toLocaleString() : summary.totalEstimated.toLocaleString()}) exceeds the planned budget limit of ${summary.totalBudget.toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      {/* ── Metric Summary Cards ── */}
      <section aria-label="Budget Overview Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <span className="text-xs text-slate-400 block">Total Planned Budget</span>
          <span className="text-2xl font-black text-white mt-1 block">
            ${summary.totalBudget.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Baseline Event Allocation</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <span className="text-xs text-slate-400 block">Total Estimated Quotes</span>
          <span className="text-2xl font-black text-indigo-300 mt-1 block">
            ${summary.totalEstimated.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Sum of item estimates</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <span className="text-xs text-slate-400 block">Actual Expenses Spent</span>
          <span className="text-2xl font-black text-white mt-1 block">
            ${summary.totalActual.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Utilization: {summary.utilizationPercent}%
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <span className="text-xs text-slate-400 block">Remaining Balance</span>
          <span
            className={`text-2xl font-black mt-1 block ${
              summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            ${summary.remainingBudget.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Includes ${summary.contingencyAmount.toLocaleString()} contingency
          </span>
        </div>
      </section>

      {/* ── Add New Budget Item Form ── */}
      <form
        onSubmit={handleAddItem}
        aria-label="Add Budget Item"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-xl"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          + Add New Expense Item
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label htmlFor="bgt-category" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Category
            </label>
            <select
              id="bgt-category"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value as BudgetCategory)}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="bgt-item-name" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Item Name *
            </label>
            <input
              id="bgt-item-name"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Reception Hall Deposit, Cake Tasting"
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="bgt-estimated" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Estimated ($)
            </label>
            <input
              id="bgt-estimated"
              type="number"
              min="0"
              step="1"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="bgt-actual" className="block text-[11px] font-semibold text-slate-400 mb-1">
              Actual Spent ($)
            </label>
            <input
              id="bgt-actual"
              type="number"
              min="0"
              step="1"
              value={actualCost}
              onChange={(e) => setActualCost(Number(e.target.value))}
              className="w-full bg-slate-800/80 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
            />
            <span>Payment finalized (Paid)</span>
          </label>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Add Expense Item
          </button>
        </div>
      </form>

      {/* ── Budget Items Table ── */}
      <section aria-label="Budget Expense Items" className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📋</span> Itemized Expenses ({filteredItems.length})
          </h3>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-cat" className="text-xs text-slate-400">
              Filter:
            </label>
            <select
              id="filter-cat"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No items in this category yet. Use the form above to add an expense item.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-800/30 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th scope="col" className="p-3">Category</th>
                  <th scope="col" className="p-3">Item Name</th>
                  <th scope="col" className="p-3 text-right">Estimated</th>
                  <th scope="col" className="p-3 text-right">Actual Spent</th>
                  <th scope="col" className="p-3 text-center">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 capitalize font-medium text-slate-400">
                      {item.category}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {item.name}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      ${item.estimatedCost.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-200">
                      ${item.actualCost.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { paid: !item.paid })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all focus:outline-none ${
                          item.paid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.paid ? '✓ Paid' : 'Pending'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        aria-label={`Delete budget item ${item.name}`}
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-400 transition-colors focus:outline-none"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
});
